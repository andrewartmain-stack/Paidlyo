"use client";

import { useTransition } from "react";
import { Copy, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revokeInvite } from "../actions";
import { ROLE_LABELS } from "../rules";
import type { TeamInvite } from "../types";
import { copyLink } from "./copy-link";

/** Pending invite links: copy again or revoke. */
export function InvitesList({
  invites,
  origin,
  expiresLabels,
}: {
  invites: TeamInvite[];
  origin: string;
  expiresLabels: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();

  function revoke(invite: TeamInvite) {
    startTransition(async () => {
      const result = await revokeInvite(invite.id);
      if (result.ok) toast.success("Invite revoked. The link no longer works.");
      else toast.error(result.error);
    });
  }

  return (
    <ul className="flex flex-col divide-y rounded-xl border bg-card">
      {invites.map((invite) => (
        <li key={invite.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Link2 className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{invite.email ?? "Invite link"}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[invite.role]} ·{" "}
              {invite.status === "expired" ? "Expired" : `Expires ${expiresLabels[invite.id]}`}
            </p>
          </div>
          {invite.status === "expired" ? (
            <Badge variant="outline">Expired</Badge>
          ) : (
            <Button variant="outline" size="sm" onClick={() => copyLink(`${origin}/join/${invite.token}`)}>
              <Copy aria-hidden />
              Copy link
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            onClick={() => revoke(invite)}
            aria-label={invite.status === "expired" ? "Remove expired invite" : "Revoke invite"}
          >
            <X aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  );
}
