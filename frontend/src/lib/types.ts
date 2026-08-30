export type Occupation =
  | "Farmer"
  | "Carpenter"
  | "Blacksmith"
  | "Barber"
  | "Cobbler"
  | "Other Traditional Trade"
  | "Other";

export interface CitizenProfile {
  age: number;
  occupation: Occupation;
  land_holding_acres: number;
  is_institutional_landholder: boolean;
  is_income_tax_payer: boolean;
  is_govt_employee_or_professional: boolean;
  monthly_pension: number;
  has_active_govt_business_loan: boolean;
}

export interface CitationItem {
  text: string;
  source_file: string;
  page_number: number;
}

export interface SchemeSynthesis {
  scheme_name: string;
  is_eligible: boolean;
  eligibility_criteria: CitationItem[];
  requirements_and_conditions: CitationItem[];
  disqualification_reasons: CitationItem[];
}

export interface PdfCitation {
  source_file: string;
  page_number: number;
}

export const OCCUPATION_OPTIONS: Occupation[] = [
  "Farmer",
  "Carpenter",
  "Blacksmith",
  "Barber",
  "Cobbler",
  "Other Traditional Trade",
  "Other",
];

export const DEFAULT_PROFILE: CitizenProfile = {
  age: 42,
  occupation: "Farmer",
  land_holding_acres: 2,
  is_institutional_landholder: false,
  is_income_tax_payer: false,
  is_govt_employee_or_professional: false,
  monthly_pension: 0,
  has_active_govt_business_loan: false,
};

export function schemeHasContent(scheme: SchemeSynthesis): boolean {
  return (
    scheme.eligibility_criteria.length > 0 ||
    scheme.requirements_and_conditions.length > 0 ||
    scheme.disqualification_reasons.length > 0
  );
}
