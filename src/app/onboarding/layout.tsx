import type { Metadata } from "next";
import { Logo } from "@/components/app-shell/logo";

// Private: never indexed. Protected by proxy.ts.
export const metadata: Metadata = {
  title: "Set up your workspace",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo href="/" className="text-2xl" />
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
