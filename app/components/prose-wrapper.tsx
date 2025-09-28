import { ReactNode } from "react";

interface ProseWrapperProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "large" | "guide";
}

export default function ProseWrapper({
  children,
  className = "",
  variant = "default"
}: ProseWrapperProps) {
  const baseClasses = "prose max-w-none";

  const variants = {
    default: "",
    large: "prose-lg",
    guide: "prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-lg prose-img:mx-auto"
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