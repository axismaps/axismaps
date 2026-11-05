import { ReactNode } from "react";

interface ProseWrapperProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "guide";
}

export default function ProseWrapper({
  children,
  className = "",
  variant = "default"
}: ProseWrapperProps) {
  const baseClasses = "prose max-w-none";

  const variants = {
    default: "",
    guide: "prose-guide"
  };

  const combinedClasses = [
    baseClasses,
    variants[variant],
    className
  ].filter(Boolean).join(" ");

  return (
    <article className={combinedClasses}>
      {children}
    </article>
  );
}
