import type { Metadata } from "next";
import { Logo } from "@/components/app-shell/logo";

// Private invite links: never indexed (also disallowed in robots.txt).
export const metadata: Metadata = {
  title: "Join your team",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo href="/" className="text-2xl" />
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
