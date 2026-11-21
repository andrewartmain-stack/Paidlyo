import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  children: (aria: {
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  }) => React.ReactNode;
};

/** Label + control + hint/validation message, wired for accessibility. */
function FieldShell({ id, label, hint, errors, children }: FieldShellProps) {
  const message = errors?.[0];
  const describedBy = message ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({ "aria-invalid": message ? true : undefined, "aria-describedby": describedBy })}
      {message ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {message}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type FormFieldProps = React.ComponentProps<typeof Input> & {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
};

export function FormField({ name, label, hint, errors, id = name, ...inputProps }: FormFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors}>
      {(aria) => <Input id={id} name={name} {...aria} {...inputProps} />}
    </FieldShell>
  );
}

type TextareaFieldProps = React.ComponentProps<typeof Textarea> & {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
};

export function TextareaField({
  name,
  label,
  hint,
  errors,
  id = name,
  ...textareaProps
}: TextareaFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors}>
      {(aria) => <Textarea id={id} name={name} {...aria} {...textareaProps} />}
    </FieldShell>
  );
}

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  name: string;
  label: string;
  options: SelectOption[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  hint?: string;
  errors?: string[];
  id?: string;
};

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  onValueChange,
  hint,
  errors,
  id = name,
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors}>
      {(aria) => (
        <Select
          name={name}
          defaultValue={defaultValue}
          items={options}
          onValueChange={(value) => onValueChange?.(value == null ? "" : String(value))}
        >
          <SelectTrigger id={id} className="w-full" {...aria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}

type CheckboxFieldProps = Omit<React.ComponentProps<"input">, "type"> & {
  name: string;
  label: string;
  hint?: string;
};

/** Native checkbox with label and optional hint (submits "on" when checked). */
export function CheckboxField({ name, label, hint, id = name, className, ...props }: CheckboxFieldProps) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <input
        id={id}
        name={name}
        type="checkbox"
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-4 shrink-0 rounded-sm accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        {...props}
      />
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        {hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
