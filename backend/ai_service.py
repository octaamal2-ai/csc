from dotenv import load_dotenv

load_dotenv()

import json
import os
from typing import Any

from google import genai
from google.genai import types
from pydantic import ValidationError

from models import CitationItem, CitizenProfile, SchemeSynthesis, SynthesisResponse

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


def _filter_valid_citations(
    items: list[CitationItem], allowed: set[tuple[str, int]]
) -> list[CitationItem]:
    return [
        item
        for item in items
        if (item.source_file, item.page_number) in allowed
    ]


def _filter_valid_schemes(
    schemes: list[SchemeSynthesis], allowed: set[tuple[str, int]]
) -> list[SchemeSynthesis]:
    filtered: list[SchemeSynthesis] = []
    for scheme in schemes:
        eligibility = _filter_valid_citations(scheme.eligibility_criteria, allowed)
        requirements = _filter_valid_citations(scheme.requirements_and_conditions, allowed)
        disqualifications = _filter_valid_citations(scheme.disqualification_reasons, allowed)
        if not eligibility and not requirements and not disqualifications:
            continue
        filtered.append(
            SchemeSynthesis(
                scheme_name=scheme.scheme_name,
                is_eligible=scheme.is_eligible,
                eligibility_criteria=eligibility,
                requirements_and_conditions=requirements,
                disqualification_reasons=disqualifications,
            )
        )
    return filtered


def synthesize_checklist(
    profile: CitizenProfile, retrieved_chunks: list[dict]
) -> list[SchemeSynthesis]:
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
- PM Vishwakarma (PM Vishwakarma Guidelines)

Use ONLY the retrieved excerpts. Do not invent rules, thresholds, or documents.
Even if the provided text chunks do not perfectly match the exact input values, extract the
general eligibility and exclusion criteria for the schemes mentioned in the text and output
them in the required JSON format.

Citizen profile (deterministic UI inputs):
{profile_json}

Retrieved guideline excerpts (each chunk includes source_file and page_number):
{context}

Strict exclusion evaluation rules:
1. If is_income_tax_payer is true → set PM-KISAN is_eligible to false and list reasons under disqualification_reasons.
2. If is_institutional_landholder is true → PM-KISAN is_eligible false (institutional landholder exclusion).
3. If is_govt_employee_or_professional is true → PM-KISAN is_eligible false.
4. If has_active_govt_business_loan is true → PM-KISAN is_eligible false.
5. If monthly_pension exceeds the pension ceiling in PM-KISAN guidelines → PM-KISAN is_eligible false.
6. PM-KISAN targets landholding farmer-beneficiaries; if occupation is not "Farmer", set is_eligible false unless excerpts explicitly support the occupation.
7. PM Vishwakarma targets traditional artisans/trades (Carpenter, Blacksmith, Barber, Cobbler, Other Traditional Trade).

Output schema — return JSON with a "schemes" array. Each scheme object MUST use:
- scheme_name: exactly "PM-KISAN" or "PM Vishwakarma" (one object per scheme, never split one scheme across multiple objects)
- is_eligible: boolean overall determination for this citizen under that scheme
- eligibility_criteria: list of {{text, source_file, page_number}} — who qualifies, age/occupation/land thresholds met
- requirements_and_conditions: list of {{text, source_file, page_number}} — documents, registration steps, benefit conditions, loan rules
- disqualification_reasons: list of {{text, source_file, page_number}} — exclusion criteria that apply to this citizen (empty if eligible)

Rules:
1. Merge ALL rules from the same scheme into ONE scheme object under the same scheme_name.
2. Every list item MUST cite the exact source_file and page_number from the chunk it came from.
3. Do not duplicate the same point across lists unless it serves different purposes (eligibility vs requirement).
4. If excerpts do not support a scheme determination, omit that scheme entirely.
5. Return JSON only, matching the provided schema.
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
    return _filter_valid_schemes(parsed.schemes, allowed)


def build_retrieval_query(profile: CitizenProfile) -> str:
    return _build_retrieval_query(profile)
