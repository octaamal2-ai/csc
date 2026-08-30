"""Delete ChromaDB vector storage and SQLite metadata for a clean re-ingest."""

import shutil
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
CHROMA_DIR = BACKEND_DIR / "data" / "db" / "chroma"
SQLITE_PATH = BACKEND_DIR / "data" / "db" / "metadata.db"


def reset_vector_db() -> None:
    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)
        print(f"Removed: {CHROMA_DIR}")
    else:
        print(f"Not found (skipped): {CHROMA_DIR}")

    if SQLITE_PATH.exists():
        SQLITE_PATH.unlink()
        print(f"Removed: {SQLITE_PATH}")
    else:
        print(f"Not found (skipped): {SQLITE_PATH}")

    print("\nReset complete. Re-ingest with:")
    print("  python scripts/ingest_corpus.py")


if __name__ == "__main__":
    reset_vector_db()
    sys.exit(0)
