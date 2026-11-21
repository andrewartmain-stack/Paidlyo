import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import logo from "../../../public/logo.png";
import { AnimatedLogoMark } from "./animated-logo-mark";

export function Logo({
  href = "/app",
  className,
  onClick,
  animated = false,
}: {
  href?: string;
  className?: string;
  onClick?: () => void;
  /** Coins spread and the top one flips on hover (public site header/footer). */
  animated?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block rounded-sm font-heading text-lg font-bold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {animated ? <AnimatedLogoMark /> : <Image src={logo} alt="Paidlyo" priority className="h-7 w-auto" />}
    </Link>
  );
}
