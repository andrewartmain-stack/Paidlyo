/*
 * Terms of Service and Privacy Policy. A plain-language starting point, not legal advice:
 * have it reviewed before launch. Update LEGAL_UPDATED whenever the text changes.
 */

export const LEGAL_ENTITY = {
  name: "Andrei Artemov",
  country: "Romania",
  email: "support@paidlyo.com",
} as const;

export const LEGAL_UPDATED = "2026-11-21";

export type LegalSection = { heading: string; paragraphs: string[]; items?: string[] };

export type LegalDocument = {
  path: "/terms" | "/privacy";
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: LegalSection[];
};

const { name, country, email } = LEGAL_ENTITY;

export const TERMS: LegalDocument = {
  path: "/terms",
  title: "Terms of Service",
  metaTitle: "Terms of Service | Paidlyo",
  metaDescription:
    "Read the Paidlyo Terms of Service: how the free trial and subscription work, renewal and cancelling, refunds, your data, acceptable use and which law applies.",
  intro: `These terms are an agreement between you and ${name}, ${country} ("Paidlyo", "we", "us"), the operator of paidlyo.com. By creating an account or using Paidlyo you agree to them. If you use Paidlyo for a company, you confirm you may accept these terms on its behalf.`,
  sections: [
    {
      heading: "1. The service",
      paragraphs: [
        "Paidlyo is online software for tracking time, creating invoices, recording payments and reporting. We may improve, change or remove features over time; we'll tell you in advance about changes that significantly reduce what the service does.",
      ],
    },
    {
      heading: "2. Your account",
      paragraphs: [
        "You must be at least 18 and give accurate information. Keep your password safe: you're responsible for what happens in your account. Paidlyo is intended for business use by freelancers and companies.",
      ],
    },
    {
      heading: "3. Free trial and subscription",
      paragraphs: [
        "Using Paidlyo requires a subscription, billed monthly or yearly in advance through our payment provider, Stripe. Your first subscription starts with a 14-day free trial: you add a payment card when the trial starts, and it's charged automatically when the trial ends unless you cancel before then. Each customer can use the free trial once.",
        "Subscriptions renew automatically at the end of each period until you cancel. You can cancel any time in Settings → Billing; cancellation takes effect at the end of the period you've paid for. Prices are shown on our pricing page and may exclude taxes such as VAT, which are added where required.",
        "We may change our prices. We'll email you at least 30 days before a new price applies to your subscription, and you can cancel before then.",
      ],
    },
    {
      heading: "4. Refunds",
      paragraphs: [
        "Payments for a period that has already started are not refunded, except where the law requires it or we decide otherwise. If you were charged by mistake, contact us and we'll correct it.",
      ],
    },
    {
      heading: "5. When a trial or subscription ends",
      paragraphs: [
        "If your subscription is canceled, ends or can't be paid, your account becomes read-only: you can still sign in, view and export your data, but you can't add or change it until you subscribe again.",
      ],
    },
    {
      heading: "6. Your data",
      paragraphs: [
        "Everything you put into Paidlyo (clients, projects, time entries, invoices and other content) stays yours. You give us permission to store and process it only to run the service for you. You can export your data at any time.",
        "You're responsible for your content and for having the right to use any personal data about your clients that you add, and for your invoices meeting the tax and legal rules that apply to your business. How we handle personal data is described in our Privacy Policy.",
      ],
    },
    {
      heading: "7. Acceptable use",
      paragraphs: ["You agree not to:"],
      items: [
        "break the law or other people's rights while using Paidlyo;",
        "upload malware or try to break, overload or get around the security of the service;",
        "access other customers' data or resell the service without our written permission;",
        "use Paidlyo to send spam or fraudulent invoices.",
      ],
    },
    {
      heading: "8. Availability and support",
      paragraphs: [
        `We work to keep Paidlyo available and your data safe, with regular backups through our hosting providers, but we can't promise the service will be uninterrupted or error-free. Support is provided by email at ${email}.`,
      ],
    },
    {
      heading: "9. Liability",
      paragraphs: [
        'Paidlyo is provided "as is". To the extent the law allows, we are not liable for indirect or consequential losses such as lost profits, revenue or data, and our total liability for any claim is limited to the amount you paid us in the 12 months before it arose. Nothing in these terms limits liability that can\'t be limited by law, such as for fraud or gross negligence.',
      ],
    },
    {
      heading: "10. Suspension and termination",
      paragraphs: [
        "You can stop using Paidlyo and ask us to delete your account at any time. We may suspend or close accounts that seriously or repeatedly break these terms, normally after a warning. After an account is closed we delete its data as described in the Privacy Policy.",
      ],
    },
    {
      heading: "11. Changes to these terms",
      paragraphs: [
        "We may update these terms. For significant changes we'll notify you by email or in the app at least 30 days before they apply. Continuing to use Paidlyo after that means you accept the new terms.",
      ],
    },
    {
      heading: "12. Governing law",
      paragraphs: [
        `These terms are governed by the laws of ${country}, and disputes go to the competent courts of ${country}. If you are a consumer, you keep any protections the mandatory laws of your country give you.`,
      ],
    },
    {
      heading: "13. Contact",
      paragraphs: [`Questions about these terms: ${email}.`],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  path: "/privacy",
  title: "Privacy Policy",
  metaTitle: "Privacy Policy | Paidlyo",
  metaDescription:
    "How Paidlyo collects, uses and protects your data: what we store, the providers we use (Supabase, Vercel, Stripe), how long we keep it and your GDPR rights.",
  intro: `This policy explains what personal data Paidlyo collects, why, and the choices you have. Paidlyo is operated by ${name}, ${country}, who is the data controller for the data described here. Contact: ${email}.`,
  sections: [
    {
      heading: "1. Data we collect",
      paragraphs: ["We collect only what we need to run Paidlyo:"],
      items: [
        "Account data: your name, email address and password (stored only as a secure hash).",
        "Business data you enter: organization details and logo, clients and their contact details, projects, tasks, time entries, invoices and payments.",
        "Billing data: your plan and subscription status. Card details are entered on Stripe's pages and never reach our servers.",
        "Technical data: IP address, browser type and log entries created when you use the service, used for security and troubleshooting.",
      ],
    },
    {
      heading: "2. Why we use it",
      paragraphs: ["We use your data on these legal bases under the GDPR:"],
      items: [
        "To provide the service and manage your subscription (performance of our contract with you).",
        "To keep Paidlyo secure, prevent abuse and fix problems (our legitimate interests).",
        "To keep billing records as tax and accounting law requires (legal obligation).",
        "To send service emails such as account confirmation, password resets and important changes. We don't send marketing emails without your consent.",
      ],
    },
    {
      heading: "3. Your clients' data",
      paragraphs: [
        "When you add information about your clients, you decide what's collected and why, and we process it on your behalf only to provide the service. You're responsible for having a legal basis to use it. We never sell it or use it for our own purposes.",
      ],
    },
    {
      heading: "4. Service providers",
      paragraphs: ["We use trusted providers who process data for us under data processing agreements:"],
      items: [
        "Supabase: database, authentication and file storage.",
        "Vercel: website and application hosting.",
        "Stripe: subscription payments and invoices for our own billing.",
      ],
    },
    {
      heading: "5. International transfers",
      paragraphs: [
        "Some of these providers are based in, or use servers in, the United States. Where data leaves the European Economic Area, it's protected by safeguards such as the EU Standard Contractual Clauses or the EU–US Data Privacy Framework.",
      ],
    },
    {
      heading: "6. How long we keep data",
      paragraphs: [
        "We keep your data while your account exists. If you ask us to delete your account, we delete your data within 30 days, except billing records we must keep for as long as tax and accounting law requires. Backups are overwritten on a rolling basis.",
      ],
    },
    {
      heading: "7. Cookies",
      paragraphs: [
        "Paidlyo uses only cookies that are strictly necessary to keep you signed in and secure. We don't use advertising or tracking cookies, so no cookie consent banner is needed.",
      ],
    },
    {
      heading: "8. Security",
      paragraphs: [
        "Data is encrypted in transit (HTTPS), access between organizations is separated at the database level, and passwords are stored as secure hashes. No system is perfectly secure, but we take reasonable measures to protect your data and will notify you and the authorities of a breach where the law requires.",
      ],
    },
    {
      heading: "9. Your rights",
      paragraphs: [
        `You can ask to access, correct, export or delete your personal data, and to restrict or object to how we use it. Email ${email} and we'll reply within one month. You can also complain to a data protection authority; in ${country} that's the National Supervisory Authority for Personal Data Processing (ANSPDCP).`,
      ],
    },
    {
      heading: "10. Children",
      paragraphs: ["Paidlyo is a business tool and isn't intended for anyone under 16."],
    },
    {
      heading: "11. Changes to this policy",
      paragraphs: [
        "We'll update this page when our practices change and tell you by email or in the app about significant changes.",
      ],
    },
  ],
};
