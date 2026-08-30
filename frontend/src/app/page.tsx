"use client";

import { useState } from "react";
import { CitizenProfileForm } from "@/components/citizen-profile-form";
import { EligibilityResults } from "@/components/eligibility-results";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { ErrorMessage } from "@/components/error-message";
import { PdfViewerSheet } from "@/components/pdf-viewer-sheet";
import { synthesizeEligibility, SynthesisError } from "@/lib/api";
import {
  DEFAULT_PROFILE,
  type ChecklistItem,
  type CitizenProfile,
  type PdfCitation,
} from "@/lib/types";

type ViewState = "idle" | "loading" | "success" | "error";

export default function HomePage() {
  const [profile, setProfile] = useState<CitizenProfile>(DEFAULT_PROFILE);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [results, setResults] = useState<ChecklistItem[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [activeCitation, setActiveCitation] = useState<PdfCitation | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const handleCheckEligibility = async () => {
    setViewState("loading");
    setError(null);

    try {
      const items = await synthesizeEligibility(profile);
      setResults(items);
      setViewState("success");
    } catch (err) {
      if (err instanceof SynthesisError) {
        setError(err.detail ?? err.message);
      } else {
        setError(err);
      }
      setViewState("error");
    }
  };

  const handleCitationClick = (citation: PdfCitation) => {
    setActiveCitation(citation);
    setPdfOpen(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            CSC / E-Seva Operator Tool
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Central Scheme Eligibility Synthesizer
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Deterministic eligibility analysis for PM-KISAN and PM Vishwakarma
            using indexed Central Government operational guidelines. Every result
            links to its source PDF page.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[400px_1fr] lg:px-8">
        <CitizenProfileForm
          profile={profile}
          onChange={setProfile}
          onSubmit={handleCheckEligibility}
          isLoading={viewState === "loading"}
        />

        <section aria-live="polite" className="min-w-0 space-y-4">
          {viewState === "idle" && <EmptyState />}
          {viewState === "loading" && <LoadingState />}
          {viewState === "success" && (
            <EligibilityResults
              items={results}
              onCitationClick={handleCitationClick}
            />
          )}
          {viewState === "error" && <ErrorMessage error={error} />}
        </section>
      </div>

      <PdfViewerSheet
        citation={activeCitation}
        open={pdfOpen}
        onOpenChange={setPdfOpen}
      />
    </main>
  );
}
