import { Check, Clock, CreditCard, FileText, LayoutDashboard, LineChart, Link2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  MockClientInvoice,
  MockDashboard,
  MockInvoiceBuilder,
  MockPayments,
  MockReports,
  MockTimesheet,
} from "@/components/marketing/app-mock";
import { ProductTabsClient } from "@/components/marketing/product-tabs-client";
import { PRODUCT_TABS, type ProductTabId } from "@/content/showcase";

const TAB_ICONS: Record<ProductTabId, LucideIcon> = {
  time: Clock,
  invoicing: FileText,
  "client-link": Link2,
  payments: CreditCard,
  reports: LineChart,
  dashboard: LayoutDashboard,
};

const MOCKS: Record<ProductTabId, () => React.ReactNode> = {
  time: () => <MockTimesheet />,
  invoicing: () => <MockInvoiceBuilder />,
  "client-link": () => <MockClientInvoice />,
  payments: () => <MockPayments />,
  reports: () => <MockReports />,
  dashboard: () => <MockDashboard />,
};

/** Very soft green wash with low-contrast diagonal stripes behind the mock. */
const STAGE =
  "bg-[repeating-linear-gradient(135deg,transparent_0_14px,color-mix(in_oklab,var(--primary)_5%,transparent)_14px_28px),linear-gradient(180deg,color-mix(in_oklab,var(--accent)_55%,white),color-mix(in_oklab,var(--accent)_30%,white))]";

export function ProductTabs() {
  const tabs = PRODUCT_TABS.tabs.map((tab) => {
    const Icon = TAB_ICONS[tab.id];
    return { id: tab.id, label: tab.label, icon: <Icon className="size-4" aria-hidden /> };
  });

  const panels = PRODUCT_TABS.tabs.map((tab) => (
    <div key={tab.id} className="grid gap-8 lg:grid-cols-[4fr_7fr] lg:items-center lg:gap-12">
      <div className="flex flex-col gap-7">
        <h3 className="mk-h3">{tab.headline}</h3>
        <ul className="flex flex-col gap-5">
          {tab.features.map((f) => (
            <li key={f.title} className="flex gap-3.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <div>
                <p className="text-base font-medium text-foreground">{f.title}</p>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/signup" className="w-fit rounded-sm text-[0.9375rem] font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Start free trial <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
      <div className={`flex min-w-0 items-center rounded-3xl border p-3 sm:p-6 lg:min-h-[30rem] ${STAGE}`}>{MOCKS[tab.id]()}</div>
    </div>
  ));

  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 bg-cream py-24 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <h2 id="features-title" className="mk-h2">
            {PRODUCT_TABS.title}
          </h2>
          <p className="mk-lead text-muted-foreground">{PRODUCT_TABS.description}</p>
        </div>
        <ProductTabsClient tabs={tabs} panels={panels} />
      </div>
    </section>
  );
}
