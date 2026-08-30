import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import chromadb
from chromadb.config import Settings

from models import PageExtraction, TextChunk
from pdf_processor import extract_all_pdfs, list_pdf_files

BACKEND_DIR = Path(__file__).resolve().parent
DB_DIR = BACKEND_DIR / "data" / "db"
CHROMA_DIR = DB_DIR / "chroma"
SQLITE_PATH = DB_DIR / "metadata.db"
COLLECTION_NAME = "gazette_chunks"

DEFAULT_CHUNK_SIZE = 800
DEFAULT_OVERLAP_RATIO = 0.10


def _ensure_dirs() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)


def _get_sqlite_connection() -> sqlite3.Connection:
    _ensure_dirs()
    connection = sqlite3.connect(SQLITE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_file TEXT NOT NULL UNIQUE,
            page_count INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL DEFAULT 0,
            ingested_at TEXT NOT NULL
        )
        """
    )
    connection.commit()
    return connection


def _get_chroma_collection():
    _ensure_dirs()
    client = chromadb.PersistentClient(
        path=str(CHROMA_DIR),
        settings=Settings(anonymized_telemetry=False),
    )
    return client.get_or_create_collection(name=COLLECTION_NAME)


def chunk_page_text(
    text: str,
    source_file: str,
    page_number: int,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap_ratio: float = DEFAULT_OVERLAP_RATIO,
) -> list[TextChunk]:
    normalized = " ".join(text.split())
    if not normalized:
        return []

    overlap = max(1, int(chunk_size * overlap_ratio))
    step = max(1, chunk_size - overlap)
    chunks: list[TextChunk] = []
    start = 0
    chunk_index = 0

    while start < len(normalized):
        piece = normalized[start : start + chunk_size]
        if piece.strip():
            chunks.append(
                TextChunk(
                    text=piece,
                    source_file=source_file,
                    page_number=page_number,
                    chunk_index=chunk_index,
                )
            )
            chunk_index += 1
        if start + chunk_size >= len(normalized):
            break
        start += step

    return chunks


def chunk_extractions(pages: list[PageExtraction]) -> list[TextChunk]:
    all_chunks: list[TextChunk] = []
    for page in pages:
        all_chunks.extend(
            chunk_page_text(
                text=page.text,
                source_file=page.source_file,
                page_number=page.page_number,
            )
        )
    return all_chunks


def ingest_pdf_corpus(pdf_dir: Path | None = None, reset: bool = False) -> dict:
    pdf_directory = pdf_dir or (BACKEND_DIR / "data" / "pdfs")
    pdf_files = list_pdf_files(pdf_directory)
    if not pdf_files:
        return {"documents": 0, "pages": 0, "chunks": 0}

    collection = _get_chroma_collection()
    if reset:
        client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False),
        )
        try:
            client.delete_collection(COLLECTION_NAME)
        except ValueError:
            pass
        collection = client.get_or_create_collection(name=COLLECTION_NAME)

    pages = extract_all_pdfs(pdf_directory)
    chunks = chunk_extractions(pages)
    if not chunks:
        return {"documents": len(pdf_files), "pages": len(pages), "chunks": 0}

    ids = [
        f"{chunk.source_file}::p{chunk.page_number}::c{chunk.chunk_index}"
        for chunk in chunks
    ]
    documents = [chunk.text for chunk in chunks]
    metadatas = [
        {
            "source_file": chunk.source_file,
            "page_number": chunk.page_number,
            "chunk_index": chunk.chunk_index,
        }
        for chunk in chunks
    ]

    batch_size = 100
    for start in range(0, len(chunks), batch_size):
        end = start + batch_size
        collection.add(
            ids=ids[start:end],
            documents=documents[start:end],
            metadatas=metadatas[start:end],
        )

    pages_by_file: dict[str, set[int]] = {}
    chunks_by_file: dict[str, int] = {}
    for page in pages:
        pages_by_file.setdefault(page.source_file, set()).add(page.page_number)
    for chunk in chunks:
        chunks_by_file[chunk.source_file] = chunks_by_file.get(chunk.source_file, 0) + 1

    ingested_at = datetime.now(timezone.utc).isoformat()
    with _get_sqlite_connection() as connection:
        for source_file in sorted(pages_by_file):
            connection.execute(
                """
                INSERT INTO documents (source_file, page_count, chunk_count, ingested_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(source_file) DO UPDATE SET
                    page_count = excluded.page_count,
                    chunk_count = excluded.chunk_count,
                    ingested_at = excluded.ingested_at
                """,
                (
                    source_file,
                    len(pages_by_file[source_file]),
                    chunks_by_file.get(source_file, 0),
                    ingested_at,
                ),
            )
        connection.commit()

    return {
        "documents": len(pages_by_file),
        "pages": len(pages),
        "chunks": len(chunks),
    }


def query_relevant_chunks(query_text: str, n_results: int = 8) -> list[dict]:
    collection = _get_chroma_collection()
    chunk_count = collection.count()
    print(f"[vector_db] ChromaDB collection count: {chunk_count}")
    if chunk_count == 0:
        return []

    results = collection.query(query_texts=[query_text], n_results=min(n_results, collection.count()))
    chunks: list[dict] = []
    for index in range(len(results["ids"][0])):
        metadata = results["metadatas"][0][index]
        chunks.append(
            {
                "text": results["documents"][0][index],
                "source_file": metadata["source_file"],
                "page_number": int(metadata["page_number"]),
                "distance": results["distances"][0][index] if results.get("distances") else None,
            }
        )
    return chunks


def get_corpus_stats() -> dict:
    collection = _get_chroma_collection()
    with _get_sqlite_connection() as connection:
        rows = connection.execute(
            "SELECT source_file, page_count, chunk_count, ingested_at FROM documents ORDER BY source_file"
        ).fetchall()
    return {
        "chunk_total": collection.count(),
        "documents": [dict(row) for row in rows],
    }
