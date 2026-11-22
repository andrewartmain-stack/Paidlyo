"use client";

import { useState, useTransition } from "react";
import { BadgeDollarSign, MoreHorizontal, ShieldCheck, User, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration } from "@/features/time/duration";
import { formatMoney } from "@/lib/money";
import { changeMemberRole, setMemberActive } from "../actions";
import { canChangeRole, canSetActive, ROLE_LABELS, type Actor } from "../rules";
import type { TeamMember } from "../types";
import { MemberRateDialog } from "./member-rate-dialog";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function MembersTable({
  members,
  actor,
  joinedLabels,
  currency,
}: {
  members: TeamMember[];
  actor: Actor;
  /** Organization currency, used to show billable rates. */
  currency: string;
  /** Formatted join dates by member id (formatted on the server in the org's timezone). */
  joinedLabels: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [rateMember, setRateMember] = useState<TeamMember | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(success);
      else toast.error("error" in result && result.error ? result.error : "Something went wrong.");
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <MemberRateDialog member={rateMember} currency={currency} onClose={() => setRateMember(null)} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Person</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">This week</TableHead>
            <TableHead className="text-right">Billable rate</TableHead>
            <TableHead className="hidden md:table-cell">Joined</TableHead>
            <TableHead className="w-12 pr-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const ref = { userId: member.userId, role: member.role, active: member.active };
            const roleChange = canChangeRole(actor, ref);
            const activeChange = canSetActive(actor, ref);
            const isYou = member.userId === actor.userId;
            return (
              <TableRow key={member.id} className={member.active ? undefined : "text-muted-foreground"}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={
                        member.active
                          ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-brand"
                          : "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                      }
                    >
                      {initials(member.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {member.name}
                        {isYou && <span className="font-normal text-muted-foreground"> (you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {member.active ? (
                    <Badge variant={member.role === "member" ? "secondary" : "default"}>{ROLE_LABELS[member.role]}</Badge>
                  ) : (
                    <Badge variant="outline">Deactivated</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatDuration(member.minutesThisWeek)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {member.hourlyRateCents === null ? (
                    <span className="text-muted-foreground">Not set</span>
                  ) : (
                    `${formatMoney(member.hourlyRateCents, currency)}/h`
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{joinedLabels[member.id]}</TableCell>
                <TableCell className="pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          aria-label={`Actions for ${member.name}`}
                        />
                      }
                    >
                      <MoreHorizontal aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-48">
                      <DropdownMenuItem onClick={() => setRateMember(member)}>
                        <BadgeDollarSign aria-hidden />
                        Set billable rate
                      </DropdownMenuItem>
                      {(roleChange || activeChange) && <DropdownMenuSeparator />}
                      {roleChange && member.role === "member" && (
                        <DropdownMenuItem
                          onClick={() => run(() => changeMemberRole(member.id, "admin"), `${member.name} is now an admin`)}
                        >
                          <ShieldCheck aria-hidden />
                          Make admin
                        </DropdownMenuItem>
                      )}
                      {roleChange && member.role === "admin" && (
                        <DropdownMenuItem
                          onClick={() => run(() => changeMemberRole(member.id, "member"), `${member.name} is now a member`)}
                        >
                          <User aria-hidden />
                          Make member
                        </DropdownMenuItem>
                      )}
                      {activeChange && member.active && (
                        <DropdownMenuItem
                          onClick={() => run(() => setMemberActive(member.id, false), `${member.name} was deactivated`)}
                        >
                          <UserX aria-hidden />
                          Deactivate
                        </DropdownMenuItem>
                      )}
                      {activeChange && !member.active && (
                        <DropdownMenuItem
                          onClick={() => run(() => setMemberActive(member.id, true), `${member.name} was reactivated`)}
                        >
                          <UserCheck aria-hidden />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
