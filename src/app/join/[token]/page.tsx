import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ClientsIllustration } from "@/components/illustrations";
import { buttonVariants } from "@/components/ui/button";
import { findSignedInUserId } from "@/features/auth/queries";
import { AuthCard } from "@/features/auth/components/auth-card";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { AcceptInviteForm } from "@/features/team/components/accept-invite-form";
import { getInvitePreview } from "@/features/team/queries";
import { ROLE_LABELS, inviteUrlPath } from "@/features/team/rules";
import { inviteTokenSchema } from "@/features/team/schemas";

const UNUSABLE: Record<string, string> = {
  expired: "This invite link has expired.",
  used: "This invite link has already been used.",
  revoked: "This invite link was cancelled.",
};

/** Invite link: shows who invited you, then sign up / log in and join. */
export default function JoinPage({ params }: PageProps<"/join/[token]">) {
  return (
    <Suspense fallback={<div className="h-80 rounded-xl bg-muted" />}>
      <Join params={params} />
    </Suspense>
  );
}

async function Join({ params }: { params: PageProps<"/join/[token]">["params"] }) {
  // Request-time only: the Supabase client checks token expiry (Date.now) on every call.
  await connection();
  const { token: raw } = await params;
  const token = inviteTokenSchema.safeParse(raw);
  const preview = token.success ? await getInvitePreview(token.data) : null;

  if (!token.success || !preview || preview.status !== "valid") {
    return (
      <AuthCard
        title="This invite doesn't work"
        description={`${(preview && UNUSABLE[preview.status]) ?? "We couldn't find this invite link."} Ask the person who invited you for a new one.`}
      >
        <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Go to log in
        </Link>
      </AuthCard>
    );
  }

  const next = inviteUrlPath(token.data);
  const signedIn = (await findSignedInUserId()) !== null;
  const roleNote = preview.role === "admin" ? ` as an ${ROLE_LABELS.admin.toLowerCase()}` : "";

  return (
    <AuthCard
      title={`Join ${preview.organizationName}`}
      description={`${preview.inviterName} invited you to track time with ${preview.organizationName} on Paidlyo${roleNote}.`}
    >
      <div className="flex flex-col gap-5">
        <ClientsIllustration className="mx-auto h-28 w-auto" />
        {signedIn ? (
          <AcceptInviteForm token={token.data} organizationName={preview.organizationName} />
        ) : (
          <div className="flex flex-col gap-4">
            <OAuthButtons next={next} />
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className={buttonVariants({ size: "lg", className: "w-full" })}
            >
              Create an account
            </Link>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        )}
      </div>
    </AuthCard>
  );
}
