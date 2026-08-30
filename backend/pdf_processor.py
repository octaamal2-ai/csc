from pathlib import Path

import pymupdf as fitz

from models import PageExtraction

PDF_DIR = Path(__file__).resolve().parent / "data" / "pdfs"


def list_pdf_files(pdf_dir: Path | None = None) -> list[Path]:
    directory = pdf_dir or PDF_DIR
    if not directory.exists():
        return []
    return sorted(directory.glob("*.pdf"))


def extract_pages_from_pdf(pdf_path: Path) -> list[PageExtraction]:
    pages: list[PageExtraction] = []
    with fitz.open(pdf_path) as document:
        for page_index in range(document.page_count):
            page = document.load_page(page_index)
            text = page.get_text("text").strip()
            if not text:
                continue
            pages.append(
                PageExtraction(
                    source_file=pdf_path.name,
                    page_number=page_index + 1,
                    text=text,
                )
            )
    return pages


def extract_all_pdfs(pdf_dir: Path | None = None) -> list[PageExtraction]:
    extractions: list[PageExtraction] = []
    for pdf_path in list_pdf_files(pdf_dir):
        extractions.extend(extract_pages_from_pdf(pdf_path))
    return extractions
