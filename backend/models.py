from typing import Literal

from pydantic import BaseModel, Field

Occupation = Literal[
    "Farmer",
    "Carpenter",
    "Blacksmith",
    "Barber",
    "Cobbler",
    "Other Traditional Trade",
    "Other",
]


class CitizenProfile(BaseModel):
    age: int = Field(..., ge=18, le=100)
    occupation: Occupation
    land_holding_acres: float = Field(..., ge=0)
    is_institutional_landholder: bool = False
    is_income_tax_payer: bool = False
    is_govt_employee_or_professional: bool = False
    monthly_pension: int = Field(..., ge=0, le=50_000)
    has_active_govt_business_loan: bool = False


class CitationItem(BaseModel):
    text: str
    source_file: str
    page_number: int = Field(..., ge=1)


class SchemeSynthesis(BaseModel):
    scheme_name: str
    is_eligible: bool
    eligibility_criteria: list[CitationItem] = Field(default_factory=list)
    requirements_and_conditions: list[CitationItem] = Field(default_factory=list)
    disqualification_reasons: list[CitationItem] = Field(default_factory=list)


class SynthesisResponse(BaseModel):
    schemes: list[SchemeSynthesis]


class PageExtraction(BaseModel):
    source_file: str
    page_number: int
    text: str


class TextChunk(BaseModel):
    text: str
    source_file: str
    page_number: int
    chunk_index: int
