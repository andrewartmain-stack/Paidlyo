import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

/** Frame for auth pages: one <h1>, a short description, the form, and a footer line. */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl">{title}</h1>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
