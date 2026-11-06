import Link from "next/link";
import type { ComponentProps } from "react";

type CtaLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "inverse";
};

const variants = {
  primary: "bg-ink text-paper hover:bg-gold hover:text-ink",
  secondary: "border border-current bg-transparent hover:border-gold hover:text-gold",
  inverse: "bg-paper text-ink hover:bg-gold",
};

export function CtaLink({ href, children, variant = "primary" }: CtaLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center px-5 text-sm font-semibold transition-colors ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
