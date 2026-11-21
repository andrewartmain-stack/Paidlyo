"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { ActionResult } from "@/lib/action-result";

/**
 * Submits a form to a Server Action without resetting its fields, and keeps the result.
 * Redirects thrown by the action (`redirect()`) still navigate as usual.
 */
export function useFormAction<T>(action: (formData: FormData) => Promise<ActionResult<T>>) {
  const [result, setResult] = useState<ActionResult<T> | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setResult(await action(formData));
    });
  }

  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  const error = result && !result.ok ? result.error : null;

  return { onSubmit, pending, result, error, fieldErrors };
}
