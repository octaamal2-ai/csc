from dotenv import load_dotenv

load_dotenv()

import json
import os
from typing import Any

from google import genai
from google.genai import types
from pydantic import ValidationError

from models import ChecklistItem, CitizenProfile, SynthesisResponse

DEFAULT_MODEL = "gemini-3.6-flash"


def _build_retrieval_query(profile: CitizenProfile) -> str:
    exclusions = []
    if profile.is_institutional_landholder:
        exclusions.append("institutional landholder")
    if profile.is_income_tax_payer:
        exclusions.append("income tax payer")
    if profile.is_govt_employee_or_professional:
        exclusions.append("government employee or professional")
    if profile.has_active_govt_business_loan:
        exclusions.append("active government business loan")
    if profile.monthly_pension > 0:
        exclusions.append(f"monthly pension INR {profile.monthly_pension}")

    exclusion_text = ", ".join(exclusions) if exclusions else "none flagged"
    return (
        "Central Government scheme eligibility (PM-KISAN, PM Vishwakarma): "
        f"age {profile.age}, occupation {profile.occupation}, "
        f"land holding {profile.land_holding_acres} acres, "
        f"exclusion flags: {exclusion_text}."
    )


def _format_context_chunks(chunks: list[dict]) -> str:
    blocks: list[str] = []
    for index, chunk in enumerate(chunks, start=1):
        blocks.append(
            f"[Chunk {index}]\n"
            f"source_file: {chunk['source_file']}\n"
            f"page_number: {chunk['page_number']}\n"
            f"text:\n{chunk['text']}\n"
        )
    return "\n".join(blocks)


def _allowed_citations(chunks: list[dict]) -> set[tuple[str, int]]:
    return {(chunk["source_file"], int(chunk["page_number"])) for chunk in chunks}


def _filter_valid_items(items: list[ChecklistItem], allowed: set[tuple[str, int]]) -> list[ChecklistItem]:
    valid: list[ChecklistItem] = []
    for item in items:
        citation = (item.source_file, item.page_number)
        if citation in allowed:
            valid.append(item)
    return valid


def synthesize_checklist(profile: CitizenProfile, retrieved_chunks: list[dict]) -> list[ChecklistItem]:
    if not retrieved_chunks:
        return []

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set.")

    client = genai.Client()
    context = _format_context_chunks(retrieved_chunks)
    profile_json = profile.model_dump_json()

    prompt = f"""
You are a Central Government scheme eligibility synthesizer for CSC/E-Seva operators.
Evaluate ONLY against the indexed operational guidelines excerpts below for:
- PM-KISAN (Revised PM-KISAN Operational Guidelines)
- PM Vishwakarma (PM_Vishwakarma_Guidelines)

Use ONLY the retrieved excerpts. Do not invent rules, thresholds, or documents.
Even if the provided text chunks do not perfectly match the exact input values, extract the
general eligibility and exclusion criteria for the schemes mentioned in the text and output
them in the required JSON format.

Citizen profile (deterministic UI inputs):
{profile_json}

Retrieved guideline excerpts (each chunk includes source_file and page_number):
{context}

Strict exclusion evaluation rules (apply before listing any eligibility benefit):
1. If is_income_tax_payer is true → the citizen is NOT ELIGIBLE for PM-KISAN. Include an explicit
   ineligibility item starting with "NOT ELIGIBLE:" citing the PM-KISAN source.
2. If is_institutional_landholder is true → NOT ELIGIBLE for PM-KISAN (institutional landholder exclusion).
3. If is_govt_employee_or_professional is true → NOT ELIGIBLE for PM-KISAN.
4. If has_active_govt_business_loan is true → NOT ELIGIBLE for PM-KISAN.
5. If monthly_pension is above the pension ceiling stated in the PM-KISAN guidelines → NOT ELIGIBLE for PM-KISAN.
6. PM-KISAN generally targets farmer-beneficiaries; if occupation is not "Farmer", do not list PM-KISAN
   benefits unless the excerpts explicitly support the occupation.
7. PM Vishwakarma targets traditional artisans/trades; evaluate Carpenter, Blacksmith, Barber, Cobbler,
   and "Other Traditional Trade" against PM Vishwakarma guidelines. Farmers should not receive PM Vishwakarma
   benefits unless excerpts explicitly support it.

Task:
1. Return a traceable checklist mixing eligibility requirements, required documents, benefits, AND explicit
   NOT ELIGIBLE determinations where exclusion criteria apply.
2. Prefix every ineligibility line with "NOT ELIGIBLE:" and name the scheme (PM-KISAN or PM Vishwakarma).
3. Prefix eligible requirements/benefits with "ELIGIBLE:" or "REQUIREMENT:" where appropriate.
4. Every item MUST cite the exact source_file and page_number from the chunk it came from.
5. If the excerpts do not support a determination, omit it entirely.
6. Return JSON only, matching the provided schema.
"""

    print(f"Retrieved {len(retrieved_chunks)} chunks: {retrieved_chunks}")

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_json_schema=SynthesisResponse.model_json_schema(),
        temperature=0.1,
    )

    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", DEFAULT_MODEL),
        contents=prompt,
        config=config,
    )

    raw_text = response.text or "{}"
    try:
        parsed = SynthesisResponse.model_validate_json(raw_text)
    except ValidationError:
        payload: dict[str, Any] = json.loads(raw_text)
        parsed = SynthesisResponse.model_validate(payload)

    allowed = _allowed_citations(retrieved_chunks)
    return _filter_valid_items(parsed.items, allowed)


def build_retrieval_query(profile: CitizenProfile) -> str:
    return _build_retrieval_query(profile)
