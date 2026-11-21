"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { CircleCheck, TriangleAlert, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, FormError } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDuration } from "@/features/time/duration";
import { previewHarvestImport, runHarvestImport, type ImportPreviewResult } from "../actions";

const plural = (n: number, word: string, words = `${word}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? word : words}`;

/** Upload a Harvest CSV → preview → import. The file stays in the browser between the steps. */
export function HarvestImport({ userName }: { userName: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function reset() {
    setPreview(null);
    setImported(null);
    setError(null);
    setFileError(undefined);
  }

  function onPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await previewHarvestImport(formData);
      if (result.ok) {
        setPreview(result.data);
        setError(null);
        setFileError(undefined);
      } else {
        setPreview(null);
        setError(result.error);
        setFileError(result.fieldErrors?.file?.[0]);
      }
    });
  }

  function onImport() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      const result = await runHarvestImport(formData);
      if (result.ok) {
        setImported(result.data.imported);
        setPreview(null);
        setError(null);
        formRef.current?.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">1. Export from Harvest</CardTitle>
          <CardDescription>
            In Harvest, open <strong>Reports → Detailed time</strong>, choose the period and all clients and projects,
            then click <strong>Export → CSV</strong>. Up to 5 MB or 20,000 rows per file; export one year at a time if
            yours is bigger.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">2. Upload and preview</CardTitle>
          <CardDescription>Nothing is saved until you confirm the import.</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={onPreview} className="flex flex-col gap-5" noValidate>
            <FormError message={error} />
            <fieldset disabled={pending} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="file">Harvest CSV file</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={reset}
                  aria-invalid={fileError ? true : undefined}
                  aria-describedby={fileError ? "file-error" : undefined}
                  className="sm:max-w-md"
                />
                {fileError && (
                  <p id="file-error" className="text-sm text-destructive">
                    {fileError}
                  </p>
                )}
              </div>
              <CheckboxField
                name="includeInvoiced"
                label="Also import time that was already invoiced in Harvest"
                hint="Imported as non-billable, so it shows in reports but can't be invoiced twice."
                onChange={() => setPreview(null)}
              />
            </fieldset>
            <div>
              <Button type="submit" variant={preview ? "outline" : "default"} disabled={pending}>
                <Upload aria-hidden />
                {pending && !preview ? "Reading file…" : "Preview import"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {preview && <ImportPreviewCard preview={preview} userName={userName} pending={pending} onImport={onImport} />}

      {imported !== null && (
        <Card>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="flex items-center gap-2 font-medium">
              <CircleCheck className="size-5 text-success" aria-hidden />
              Imported {plural(imported, "time entry", "time entries")}.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/app/projects" className={buttonVariants({ variant: "outline" })}>
                View projects
              </Link>
              <Link href="/app/reports?period=this_year" className={buttonVariants({ variant: "outline" })}>
                View reports
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ImportPreviewCard({
  preview,
  userName,
  pending,
  onImport,
}: {
  preview: ImportPreviewResult;
  userName: string;
  pending: boolean;
  onImport: () => void;
}) {
  const entries = plural(preview.newEntries, "time entry", "time entries");
  const warnings = [
    preview.people.length > 1 || (preview.people[0] && preview.people[0].name !== userName)
      ? `All entries are saved under your name (${userName || "you"}); team members come later. People in the file: ${preview.people
          .map((p) => `${p.name} (${p.rows})`)
          .join(", ")}.`
      : null,
    preview.duplicates > 0 ? `Already imported earlier, will be skipped: ${plural(preview.duplicates, "row")}.` : null,
    preview.invoicedSkipped > 0
      ? `Already invoiced in Harvest, will be skipped: ${plural(preview.invoicedSkipped, "row")} (tick the box above to import them as non-billable).`
      : null,
    preview.rateMismatches > 0
      ? `Billed at a rate other than their project's most common rate, will use the project rate: ${plural(preview.rateMismatches, "row")}.`
      : null,
  ].filter((w): w is string => w !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">3. Review and import</CardTitle>
        <CardDescription>
          {preview.newEntries > 0
            ? `${entries} (${formatDuration(preview.newMinutes)} hours) will be imported.`
            : "There's nothing new to import from this file."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Counts label="Clients" created={preview.newClients.length} reused={preview.reusedClients} />
          <Counts label="Projects" created={preview.newProjects.length} reused={preview.reusedProjects} />
          <Counts label="Tasks" created={preview.newTasks.length} reused={preview.reusedTasks} />
        </dl>

        <NewNames title="New clients" names={preview.newClients} />
        <NewNames title="New projects" names={preview.newProjects.map((p) => `${p.name} · ${p.client}`)} />
        <NewNames title="New tasks" names={preview.newTasks} />

        {warnings.length > 0 && (
          <ul className="flex flex-col gap-2 rounded-lg bg-muted px-4 py-3 text-sm">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {preview.errorCount > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <TriangleAlert className="size-4 text-warning" aria-hidden />
              {plural(preview.errorCount, "row")} can&apos;t be imported and will be skipped
            </h3>
            <ul className="max-h-60 overflow-y-auto rounded-lg border text-sm">
              {preview.errors.map((e) => (
                <li key={`${e.row}-${e.message}`} className="flex gap-3 border-b px-3 py-2 last:border-0">
                  <span className="w-16 shrink-0 text-muted-foreground tabular-nums">Row {e.row}</span>
                  <span>{e.message}</span>
                </li>
              ))}
            </ul>
            {preview.errorCount > preview.errors.length && (
              <p className="text-xs text-muted-foreground">Showing the first {preview.errors.length}.</p>
            )}
          </div>
        )}

        <div>
          <Button type="button" onClick={onImport} disabled={pending || preview.newEntries === 0}>
            {pending ? "Importing…" : `Import ${entries}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Counts({ label, created, reused }: { label: string; created: number; reused: number }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">
        <span className="text-lg font-semibold tabular-nums">{created}</span> new
        <span className="text-muted-foreground"> · {reused} existing</span>
      </dd>
    </div>
  );
}

function NewNames({ title, names }: { title: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <details className="rounded-lg border px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {title} ({names.length})
      </summary>
      <ul className="mt-2 flex max-h-60 flex-col gap-1 overflow-y-auto text-muted-foreground">
        {names.map((name, i) => (
          <li key={`${name}-${i}`}>{name}</li>
        ))}
      </ul>
    </details>
  );
}
