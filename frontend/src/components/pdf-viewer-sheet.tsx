"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getPdfUrl } from "@/lib/api";
import type { PdfCitation } from "@/lib/types";

interface PdfViewerSheetProps {
  citation: PdfCitation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PdfViewerSheet({
  citation,
  open,
  onOpenChange,
}: PdfViewerSheetProps) {
  const pdfUrl = citation
    ? getPdfUrl(citation.source_file, citation.page_number)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Gazette Source</SheetTitle>
          <SheetDescription>
            {citation
              ? `${citation.source_file} — Page ${citation.page_number}`
              : "Select a citation to view the source PDF."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/30">
          {pdfUrl ? (
            <iframe
              key={pdfUrl}
              src={pdfUrl}
              title={`${citation?.source_file} page ${citation?.page_number}`}
              className="h-[calc(100vh-8rem)] w-full"
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
