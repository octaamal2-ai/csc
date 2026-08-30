"use client";

import { CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import { CitationBadge } from "@/components/citation-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isIneligibleRule, type ChecklistItem, type PdfCitation } from "@/lib/types";

interface ChecklistItemCardProps {
  item: ChecklistItem;
  index: number;
  onCitationClick: (citation: PdfCitation) => void;
}

export function ChecklistItemCard({
  item,
  index,
  onCitationClick,
}: ChecklistItemCardProps) {
  const ineligible = isIneligibleRule(item.rule);

  return (
    <Card className={ineligible ? "border-destructive/40" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={
                ineligible
                  ? "mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive"
                  : "mt-0.5 rounded-full bg-primary/10 p-2 text-primary"
              }
            >
              {ineligible ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-medium leading-snug">
                {ineligible ? "Exclusion" : "Requirement"} {index + 1}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-foreground">
                {item.rule}
              </CardDescription>
            </div>
          </div>
          <Badge variant={ineligible ? "destructive" : "secondary"}>
            {ineligible ? "Not eligible" : "Eligible / requirement"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 pt-0">
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
      </CardContent>
    </Card>
  );
}

interface EligibilityResultsProps {
  items: ChecklistItem[];
  onCitationClick: (citation: PdfCitation) => void;
}

export function EligibilityResults({
  items,
  onCitationClick,
}: EligibilityResultsProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No matching rules were found in the indexed Central scheme guidelines
          for this profile.
        </CardContent>
      </Card>
    );
  }

  const ineligibleCount = items.filter((item) => isIneligibleRule(item.rule)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">
            PM-KISAN / PM Vishwakarma Checklist
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} traceable determination{items.length === 1 ? "" : "s"}
            {ineligibleCount > 0
              ? ` (${ineligibleCount} exclusion${ineligibleCount === 1 ? "" : "s"})`
              : ""}{" "}
            from Central operational guidelines.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <ChecklistItemCard
            key={`${item.source_file}-${item.page_number}-${index}`}
            item={item}
            index={index}
            onCitationClick={onCitationClick}
          />
        ))}
      </div>
    </div>
  );
}
