import React from "react";

interface AnimSectionProps {
  delay: number;
  children: React.ReactNode;
  className?: string;
}

export default function AnimSection({
  delay,
  children,
  className = "",
}: AnimSectionProps) {
  return (
    <div
      className={`fade-in-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
