"use client";

import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PdfCitation } from "@/lib/types";

interface CitationBadgeProps {
  citation: PdfCitation;
  onOpen: (citation: PdfCitation) => void;
}

export function CitationBadge({ citation, onOpen }: CitationBadgeProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(citation)}
      className="inline-flex"
      aria-label={`Open ${citation.source_file} page ${citation.page_number}`}
    >
      <Badge variant="citation" className="gap-1.5">
        <FileText className="h-3 w-3" />
        {citation.source_file} | Page {citation.page_number}
      </Badge>
    </button>
  );
}
