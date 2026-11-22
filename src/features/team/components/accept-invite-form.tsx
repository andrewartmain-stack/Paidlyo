"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-field";
import { useFormAction } from "@/hooks/use-form-action";
import { acceptInvite } from "../actions";

export function AcceptInviteForm({ token, organizationName }: { token: string; organizationName: string }) {
  const { onSubmit, pending, error } = useFormAction(acceptInvite);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={error} />
      <input type="hidden" name="token" value={token} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Joining…" : `Join ${organizationName}`}
      </Button>
    </form>
  );
}
