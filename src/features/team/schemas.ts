import { z } from "zod";
import { optionalAmountCents } from "@/lib/form-schemas";
import { INVITE_ROLES } from "./rules";

export const inviteSchema = z.object({
  role: z.enum(INVITE_ROLES, { error: "Choose a role." }),
  email: z
    .string()
    .trim()
    .max(254)
    .transform((value) => value.toLowerCase())
    .pipe(z.union([z.literal(""), z.email({ error: "Enter a valid email or leave it empty." })])),
});

export const memberIdSchema = z.uuid();
export const inviteIdSchema = z.uuid();
export const inviteTokenSchema = z.uuid();
export const roleSchema = z.enum(INVITE_ROLES);

/** "Set billable rate" dialog: an empty rate removes it. */
export const memberRateSchema = z.object({
  memberId: z.uuid(),
  hourlyRate: optionalAmountCents,
});
