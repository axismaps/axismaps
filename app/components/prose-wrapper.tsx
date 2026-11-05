import { ReactNode } from "react";

interface ProseWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function ProseWrapper({
  children,
  className = ""
}: ProseWrapperProps) {
  const combinedClasses = ["prose max-w-none", className].filter(Boolean).join(" ");

  return (
    <article className={combinedClasses}>
      {children}
    </article>
  );
}
