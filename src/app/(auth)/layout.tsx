import type { Metadata } from "next";
import { Logo } from "@/components/app-shell/logo";

// Auth pages are never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo href="/" className="text-2xl" />
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
