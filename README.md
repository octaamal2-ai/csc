# E-Seva / CSC Operator’s Welfare Scheme Synthesizer

## 🎯 Project Overview
This project is an AI-powered, deterministic dashboard built for Common Service Centre (CSC) / E-Seva operators. It synthesizes complex government gazette PDFs into instant, highly traceable eligibility checklists for citizens. 

**Strict Design Constraint:** This application does NOT use a chat interface or free-text prompts. The user interaction is strictly limited to deterministic UI controls (sliders, toggles, checkboxes).

## 🛑 Strict Project Constraints (For Cursor / AI Agents to Follow)
1. **No Text Boxes:** Do not generate any `<input type="text">` or chat-like interfaces for the main user query. 
2. **Corpus Driven:** The data source is a hand-collected dataset of 30-50 PDFs (stored locally). The AI must NEVER hallucinate rules outside these documents.
3. **Generative Transformation:** The LLM is used to filter, extract, and rewrite complex legal clauses into simple local language checklists. It is not a conversational agent.
4. **Mandatory Traceability:** Every generated output (e.g., "Income Certificate Required") MUST be linked to a `source_file` and `page_number`. The UI must be able to display the original PDF page to the user.

## 🏗️ Technology Stack
*   **Frontend:** Next.js (React), Tailwind CSS, Shadcn UI (Sliders, Switches, Selects).
*   **Backend:** Python 3.10+, FastAPI, Uvicorn.
*   **AI / LLM:** Google Gemini API (or Anthropic Claude), LangChain.
*   **Databases:** ChromaDB (Local Vector Database for PDF embeddings), SQLite (Metadata storage).
*   **PDF Processing:** PyMuPDF (fitz) for page-aware text extraction.

## 📂 Directory Structure (Target)
```text
project-root/
│
├── backend/                  # FastAPI Application
│   ├── main.py               # API endpoints
│   ├── pdf_processor.py      # PyMuPDF extraction and chunking logic
│   ├── vector_db.py          # ChromaDB initialization and querying
│   ├── ai_service.py         # Gemini API calls and prompt structuring
│   ├── requirements.txt      # Python dependencies
│   └── data/                 
│       ├── pdfs/             # Hand-collected government gazettes go here
│       └── db/               # SQLite and ChromaDB local files
│
└── frontend/                 # Next.js Application
    ├── package.json
    ├── src/
    │   ├── app/              # Next.js App Router pages
    │   ├── components/       # UI Components (Controls, Split Screen, PDF Viewer)
    │   └── lib/              # API call functions (connecting to FastAPI)
```

## 🚀 Build Plan & Implementation Steps

### Step 1: Backend Setup & PDF Processing Pipeline
1. Initialize FastAPI backend and install `pymupdf`, `langchain`, `chromadb`, `google-genai`, `fastapi`.
2. Write `pdf_processor.py` to loop through `/data/pdfs/`. Extract text page-by-page.
3. Chunk the text ensuring metadata (`{"source": filename, "page": page_num}`) is attached to every chunk.
4. Embed chunks into ChromaDB.

### Step 2: Synthesis Engine & API Definition
1. Define Pydantic models for the UI variables: `Income` (int), `Category` (str), `Land_Acres` (float), `Needs` (list).
2. Create `POST /api/synthesize` endpoint. 
3. Formulate the LangChain/Gemini prompt to strictly return JSON formatted as: `[{"rule": "...", "source_file": "...", "page_number": X}]`.

### Step 3: Frontend Setup & UI Controls
1. Initialize Next.js project. Install Shadcn UI and add Slider, Checkbox, Select, Card, Button.
2. Build the Left Panel: A form consisting strictly of these controls representing the citizen's profile.
3. Build the Right Panel: A clean checklist rendering the JSON response from the backend.

### Step 4: Traceability & Verification Integration
1. Implement a PDF viewer in the frontend (e.g., using `react-pdf` or an `<iframe>` configured to open specific pages).
2. Add interactive badges to the generated checklist. When a user clicks a badge, the PDF viewer opens the exact `source_file` and scrolls to the exact `page_number`.
