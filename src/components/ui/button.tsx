"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#247653] text-white hover:bg-[#318B63] active:bg-[#142D26] border border-transparent shadow-xs focus-visible:ring-2 focus-visible:ring-[#247653]/30",
  secondary:
    "bg-[#E9F3EC] text-[#142D26] hover:bg-[#D2E7D9] active:bg-[#BBDBC6] border border-[#D2E7D9] focus-visible:ring-2 focus-visible:ring-[#247653]/30",
  outline:
    "bg-white text-[#252B27] hover:bg-[#F7F8F6] active:bg-[#F1F3F1] border border-[#E7EAE7] hover:border-[#D5DBD5] shadow-2xs focus-visible:ring-2 focus-visible:ring-[#247653]/25",
  ghost:
    "bg-transparent text-[#252B27] hover:bg-[#F1F3F1] active:bg-[#E7EAE7] border border-transparent focus-visible:ring-2 focus-visible:ring-[#247653]/20",
  destructive:
    "bg-[#DC4C4C] text-white hover:bg-[#C83E3E] active:bg-[#B23232] border border-transparent shadow-xs focus-visible:ring-2 focus-visible:ring-[#DC4C4C]/30",
  link:
    "bg-transparent text-[#247653] hover:text-[#142D26] hover:underline p-0 h-auto border-0 shadow-none",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[8px] gap-1.5",
  md: "h-10 px-4 text-[14px] rounded-[8px] gap-2",
  lg: "h-11 px-5 text-[15px] rounded-[8px] gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const busy = loading || isLoading;
    const isDisabled = disabled || busy;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed select-none",
          variantStyles[variant],
          variant !== "link" && sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!busy && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  loading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "outline",
      size = "md",
      label,
      loading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const sizeMap: Record<ButtonSize, string> = {
      sm: "w-8 h-8 rounded-[8px]",
      md: "w-10 h-10 rounded-[8px]",
      lg: "w-11 h-11 rounded-[8px]",
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-150 focus:outline-none cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeMap[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

export function ButtonGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[8px] bg-[#F1F3F1] p-1 border border-[#E7EAE7]",
        className
      )}
    >
      {children}
    </div>
  );
}
