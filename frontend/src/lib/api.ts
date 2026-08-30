import { formatApiError } from "@/lib/errors";
import type { ChecklistItem, CitizenProfile } from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class SynthesisError extends Error {
  constructor(
    message: string,
    public status?: number,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "SynthesisError";
  }
}

export function buildSynthesisPayload(profile: CitizenProfile): CitizenProfile {
  return {
    age: profile.age,
    occupation: profile.occupation,
    land_holding_acres: profile.land_holding_acres,
    is_institutional_landholder: profile.is_institutional_landholder ?? false,
    is_income_tax_payer: profile.is_income_tax_payer ?? false,
    is_govt_employee_or_professional:
      profile.is_govt_employee_or_professional ?? false,
    monthly_pension: profile.monthly_pension,
    has_active_govt_business_loan:
      profile.has_active_govt_business_loan ?? false,
  };
}

export function getPdfUrl(sourceFile: string, pageNumber: number): string {
  const base = `${API_BASE}/api/pdfs/${encodeURIComponent(sourceFile)}`;
  return `${base}#page=${pageNumber}`;
}

export async function synthesizeEligibility(
  profile: CitizenProfile,
): Promise<ChecklistItem[]> {
  const payload = buildSynthesisPayload(profile);
  console.log("Sending Payload:", payload);

  const response = await fetch(`${API_BASE}/api/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail: unknown = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (body.detail !== undefined) {
        detail = body.detail;
      }
    } catch {
      // ignore parse errors
    }
    const message = formatApiError(detail);
    throw new SynthesisError(message, response.status, detail);
  }

  const data = (await response.json()) as ChecklistItem[];
  console.log("API Response:", data);
  return data;
}

export { API_BASE };
