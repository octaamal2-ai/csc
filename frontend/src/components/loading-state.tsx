"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Synthesizing eligibility from PM-KISAN and PM Vishwakarma guidelines…
        </p>
      </CardContent>
    </Card>
  );
}
