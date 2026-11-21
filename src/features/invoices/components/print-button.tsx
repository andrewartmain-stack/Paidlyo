"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser's print dialog, where "Save as PDF" produces the PDF. */
export function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Download aria-hidden />
      {label}
    </Button>
  );
}
