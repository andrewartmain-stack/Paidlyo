import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { signInWithProvider } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

/* Sign-up call to action for the landing page: email pill + Google button + reassurance row.
   Server components. The email form is a plain GET to /signup (pre-fills the field there). */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6H1.4a12 12 0 0 0 0 10.9l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

/** "Continue with Google": same server action as the login and signup pages. */
export function GoogleButton({ className }: { className?: string }) {
  return (
    <form action={signInWithProvider} className={className}>
      <input type="hidden" name="provider" value="google" />
      <input type="hidden" name="next" value="" />
      <button
        type="submit"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-12 w-full gap-3 border-border bg-white px-6 text-base hover:bg-white hover:shadow-sm sm:w-auto",
        )}
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  );
}

/** Email field joined to the submit button in one pill. `id` keeps labels unique per instance. */
export function EmailPill({ id, label = "Start free trial" }: { id: string; label?: string }) {
  return (
    <form
      action="/signup"
      method="get"
      className="flex w-full flex-col gap-2 rounded-3xl bg-white p-2 shadow-[0_8px_30px_-16px_rgb(14_15_12/0.35)] ring-1 ring-foreground/10 focus-within:ring-2 focus-within:ring-ring sm:flex-row sm:items-center sm:rounded-full"
    >
      <label htmlFor={id} className="sr-only">
        Work email
      </label>
      <input
        id={id}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Your work email"
        className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-5 text-base outline-none placeholder:text-muted-foreground"
      />
      <button type="submit" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}>
        {label}
        <ArrowRight aria-hidden />
      </button>
    </form>
  );
}

export function CheckRow({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-center gap-1.5">
          <Check className="size-4 text-brand" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Hero CTA block: email pill and Google button in one row (stacked on phones), reassurance row below. */
export function HeroSignup({ checks, idPrefix = "hero" }: { checks: readonly string[]; idPrefix?: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex w-full max-w-3xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <EmailPill id={`${idPrefix}-email`} />
        </div>
        <span className="text-center text-sm text-muted-foreground">or</span>
        <GoogleButton className="sm:shrink-0 [&_button]:h-16 [&_button]:rounded-full" />
      </div>
      <CheckRow items={checks} />
    </div>
  );
}
