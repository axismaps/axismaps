import { ReactNode } from "react";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "large";
}

export default function PageSection({
  children,
  className = "",
  variant = "default"
}: PageSectionProps) {
  const variants = {
    default: "pb-24 pt-8",
    compact: "pb-12 pt-4",
    large: "pb-32 pt-16"
  };

  return (
    <section className={`${variants[variant]} ${className}`}>
      <div className="container max-w-7xl">
        {children}
      </div>
    </section>
  );
}