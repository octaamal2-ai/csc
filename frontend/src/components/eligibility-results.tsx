"use client";

import { CheckCircle2, ClipboardList, ListChecks, XCircle } from "lucide-react";
import { CitationBadge } from "@/components/citation-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { schemeHasContent, type CitationItem, type PdfCitation, type SchemeSynthesis } from "@/lib/types";

interface CitationListProps {
  items: CitationItem[];
  onCitationClick: (citation: PdfCitation) => void;
  variant?: "default" | "destructive" | "muted";
}

function CitationList({ items, onCitationClick, variant = "default" }: CitationListProps) {
  if (items.length === 0) {
    return null;
  }

  const bulletClass =
    variant === "destructive"
      ? "border-destructive/20 bg-destructive/5"
      : variant === "muted"
        ? "border-border bg-muted/30"
        : "border-primary/20 bg-primary/5";

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item.source_file}-${item.page_number}-${index}`}
          className={`rounded-lg border px-3 py-2.5 ${bulletClass}`}
        >
          <p className="text-sm leading-relaxed text-foreground">{item.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Source
            </span>
            <CitationBadge
              citation={{
                source_file: item.source_file,
                page_number: item.page_number,
              }}
              onOpen={onCitationClick}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

interface SchemeCardProps {
  scheme: SchemeSynthesis;
  onCitationClick: (citation: PdfCitation) => void;
}

function SchemeCard({ scheme, onCitationClick }: SchemeCardProps) {
  return (
    <Card className={scheme.is_eligible ? undefined : "border-destructive/30"}>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={
                scheme.is_eligible
                  ? "mt-0.5 rounded-full bg-primary/10 p-2 text-primary"
                  : "mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive"
              }
            >
              {scheme.is_eligible ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">{scheme.scheme_name}</CardTitle>
              <CardDescription>
                Central Government operational guidelines — grouped eligibility and requirements.
              </CardDescription>
            </div>
          </div>
          <Badge variant={scheme.is_eligible ? "default" : "destructive"}>
            {scheme.is_eligible ? "Eligible" : "Not eligible"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {scheme.disqualification_reasons.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-destructive">
                Disqualification Reasons
              </h3>
            </div>
            <CitationList
              items={scheme.disqualification_reasons}
              onCitationClick={onCitationClick}
              variant="destructive"
            />
          </section>
        )}

        {scheme.eligibility_criteria.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                Eligibility Determination
              </h3>
            </div>
            <CitationList
              items={scheme.eligibility_criteria}
              onCitationClick={onCitationClick}
            />
          </section>
        )}

        {scheme.requirements_and_conditions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Mandatory Checklist &amp; Conditions
              </h3>
            </div>
            <CitationList
              items={scheme.requirements_and_conditions}
              onCitationClick={onCitationClick}
              variant="muted"
            />
          </section>
        )}
      </CardContent>
    </Card>
  );
}

interface EligibilityResultsProps {
  schemes: SchemeSynthesis[];
  onCitationClick: (citation: PdfCitation) => void;
}

export function EligibilityResults({
  schemes,
  onCitationClick,
}: EligibilityResultsProps) {
  const visibleSchemes = schemes.filter(schemeHasContent);

  if (visibleSchemes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No matching rules were found in the indexed Central scheme guidelines
          for this profile.
        </CardContent>
      </Card>
    );
  }

  const eligibleCount = visibleSchemes.filter((scheme) => scheme.is_eligible).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Scheme Eligibility Summary</h2>
          <p className="text-sm text-muted-foreground">
            {visibleSchemes.length} scheme{visibleSchemes.length === 1 ? "" : "s"} evaluated
            {eligibleCount > 0
              ? ` (${eligibleCount} eligible)`
              : " (none eligible)"}{" "}
            from Central operational guidelines.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {visibleSchemes.map((scheme) => (
          <SchemeCard
            key={scheme.scheme_name}
            scheme={scheme}
            onCitationClick={onCitationClick}
          />
        ))}
      </div>
    </div>
  );
}
