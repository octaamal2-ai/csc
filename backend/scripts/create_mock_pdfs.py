"""Deprecated: mock PDF generation removed. Place Central scheme PDFs in data/pdfs/."""

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
PDF_DIR = BACKEND_DIR / "data" / "pdfs"

EXPECTED_FILES = [
    "PM_Vishwakarma_Guidelines.pdf",
    "RevisedPM-KISANOperationalGuidelines(English).pdf",
]


def main() -> None:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    print("State-specific mock PDF generation has been removed.")
    print(f"Place Central scheme PDFs in: {PDF_DIR}")
    print("\nExpected files:")
    for name in EXPECTED_FILES:
        present = (PDF_DIR / name).is_file()
        status = "found" if present else "missing"
        print(f"  [{status}] {name}")
    print("\nAfter adding PDFs, reset and ingest:")
    print("  python scripts/reset_vector_db.py")
    print("  python scripts/ingest_corpus.py --reset")


if __name__ == "__main__":
    main()
