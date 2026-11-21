import { z } from "zod";
import { currencyCodes } from "@/features/organizations/schemas";

/** Empty input → null, so optional text columns store NULL instead of "". */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => (v === "" ? null : v));

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Enter the client's name.").max(200, "Name is too long."),
  email: z
    .string()
    .trim()
    .max(320, "Email is too long.")
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address.")
    .transform((v) => (v === "" ? null : v.toLowerCase())),
  address: optionalText(1000, "Address is too long."),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .refine((c) => currencyCodes().includes(c), "Choose a currency."),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const clientIdSchema = z.uuid();

export const CLIENT_STATUSES = ["active", "archived"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

/** Parses the clients list URL params (`?status=archived&q=acme`). */
export const clientFiltersSchema = z.object({
  status: z.enum(CLIENT_STATUSES).catch("active"),
  q: z
    .string()
    .trim()
    .max(100)
    .catch("")
    .default(""),
});

export type ClientFilters = z.infer<typeof clientFiltersSchema>;

export { escapeLike } from "@/lib/form-schemas";
