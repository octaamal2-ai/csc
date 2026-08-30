"use client";

import { FileSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <FileSearch className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">No analysis yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Set the citizen profile and exclusion checks, then click{" "}
            <strong>Check Eligibility</strong> to evaluate PM-KISAN and PM
            Vishwakarma against indexed Central guidelines.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
