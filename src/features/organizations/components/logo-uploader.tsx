"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeLogo, uploadLogo } from "../actions";
import { LOGO_TYPES, validateLogo } from "../schemas";

export function LogoUploader({ logoUrl, disabled }: { logoUrl: string | null; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;

    const problem = validateLogo(file);
    if (problem) {
      toast.error(problem);
      return;
    }

    const formData = new FormData();
    formData.set("logo", file);
    startTransition(async () => {
      const result = await uploadLogo(formData);
      if (result.ok) toast.success("Logo updated");
      else toast.error(result.error);
    });
  }

  function onRemove() {
    startTransition(async () => {
      const result = await removeLogo();
      if (result.ok) toast.success("Logo removed");
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="flex h-20 w-40 items-center justify-center overflow-hidden rounded-lg border bg-card">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="Company logo"
            width={160}
            height={80}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <span className="text-sm text-muted-foreground">No logo</span>
        )}
      </div>

      {!disabled && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={Object.keys(LOGO_TYPES).join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={onFileChange}
            />
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {pending ? "Saving…" : logoUrl ? "Replace logo" : "Upload logo"}
            </Button>
            {logoUrl && (
              <Button type="button" variant="ghost" disabled={pending} onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">PNG, JPG or WebP, up to 1 MB.</p>
        </div>
      )}
    </div>
  );
}
