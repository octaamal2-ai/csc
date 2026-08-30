"""CLI helper to ingest PDFs from backend/data/pdfs into ChromaDB."""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from vector_db import ingest_pdf_corpus  # noqa: E402


def main() -> None:
    reset = "--reset" in sys.argv
    stats = ingest_pdf_corpus(reset=reset)
    print(
        f"Ingested {stats['documents']} document(s), "
        f"{stats['pages']} page(s), {stats['chunks']} chunk(s)."
    )


if __name__ == "__main__":
    main()
