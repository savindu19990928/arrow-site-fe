import React from "react";

interface ArrowLogoProps {
  variant?: "dark" | "light";
  showText?: boolean;
  className?: string;
}

export function ArrowMark({
  className = "h-9 w-9",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top chevron triangle matching Arrow Ventures Logo.jpg */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 4L14 60L50 80L86 60L50 4ZM50 28L33 56H67L50 28Z"
        fill={color}
      />
      {/* Bottom left angled wing */}
      <path d="M10 66L46 86V104L2 78L10 66Z" fill={color} />
      {/* Bottom right angled wing */}
      <path d="M90 66L54 86V104L98 78L90 66Z" fill={color} />
    </svg>
  );
}

export function ArrowLogo({
  variant = "dark",
  showText = true,
  className = "",
}: ArrowLogoProps) {
  const isLight = variant === "light";
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <ArrowMark
        className="h-9 w-9 shrink-0"
        color={isLight ? "#FFFFFF" : "#0B0B0D"}
      />
      {showText && (
        <span className="flex flex-col leading-[0.86]">
          <span
            className={`font-display-italic text-[19px] tracking-tight uppercase ${
              isLight ? "text-white" : "text-[#0B0B0D]"
            }`}
          >
            ARROW
          </span>
          <span
            className={`font-display-italic text-[14px] tracking-tight uppercase ${
              isLight ? "text-neutral-200" : "text-[#0B0B0D]"
            }`}
          >
            VENTURES
          </span>
        </span>
      )}
    </span>
  );
}
