from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from ai_service import build_retrieval_query, synthesize_checklist
from models import ChecklistItem, CitizenProfile
from vector_db import get_corpus_stats, ingest_pdf_corpus, query_relevant_chunks

PDF_DIR = Path(__file__).resolve().parent / "data" / "pdfs"


@asynccontextmanager
async def lifespan(app: FastAPI):
    stats = get_corpus_stats()
    if stats["chunk_total"] == 0:
        ingest_pdf_corpus()
    yield


app = FastAPI(
    title="CSC Welfare Scheme Synthesizer",
    description="Deterministic eligibility checklist synthesis from gazette PDFs.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/corpus/stats")
def corpus_stats() -> dict:
    return get_corpus_stats()


@app.post("/api/ingest")
def ingest_corpus(reset: bool = False) -> dict:
    return ingest_pdf_corpus(reset=reset)


@app.post("/api/synthesize", response_model=list[ChecklistItem])
def synthesize(profile: CitizenProfile) -> list[ChecklistItem]:
    query = build_retrieval_query(profile)
    chunks = query_relevant_chunks(query_text=query, n_results=10)
    if not chunks:
        raise HTTPException(
            status_code=503,
            detail="No gazette chunks indexed. Run POST /api/ingest or scripts/ingest_corpus.py.",
        )

    try:
        items = synthesize_checklist(profile=profile, retrieved_chunks=chunks)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Synthesis failed: {exc}") from exc

    return items


@app.get("/api/pdfs/{filename}")
def get_pdf(filename: str) -> FileResponse:
    safe_name = Path(filename).name
    if safe_name != filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    pdf_path = PDF_DIR / safe_name
    if not pdf_path.is_file():
        raise HTTPException(status_code=404, detail="PDF not found.")

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=safe_name,
        headers={"Content-Disposition": f'inline; filename="{safe_name}"'},
    )
