import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  className,
  interactive = false,
  padding = "md",
  children,
  ...props
}: CardProps) {
  const paddingMap = {
    none: "p-0",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-white border border-[#E7EAE7] rounded-[12px] shadow-card transition-all duration-150",
        interactive && "hover:border-[#D5DBD5] hover:shadow-card-hover cursor-pointer",
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-3 mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[15px] font-semibold text-[#252B27] leading-snug", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[13px] text-[#737D75] mt-0.5 leading-normal", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 pt-3.5 border-t border-[#E7EAE7] flex items-center justify-between gap-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  tone?: "default" | "brand" | "success" | "warning" | "info" | "error";
  variant?: "default" | "brand" | "success" | "warning" | "info" | "error";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  tone = "default",
  variant,
  className,
}: StatCardProps) {
  const effectiveTone = variant || tone;
  const iconToneClasses = {
    default: "bg-[#F1F3F1] text-[#343C36]",
    brand: "bg-[#E9F3EC] text-[#247653]",
    success: "bg-[#ECFDF5] text-[#16A36A]",
    warning: "bg-[#FFFBEB] text-[#D97706]",
    info: "bg-[#EFF6FF] text-[#2563EB]",
    error: "bg-[#FEF2F2] text-[#DC4C4C]",
  };

  return (
    <Card className={cn("flex flex-col justify-between", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[13px] font-medium text-[#737D75] truncate">{label}</p>
          <div className="text-[24px] font-bold text-[#252B27] tracking-tight leading-tight">
            {value}
          </div>
        </div>
        {icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0",
              iconToneClasses[effectiveTone]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-[#F1F3F1] flex items-center justify-between gap-2 text-[12px]">
          {subtitle && <span className="text-[#737D75] truncate">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                "font-medium px-1.5 py-0.5 rounded",
                trend.positive !== false
                  ? "bg-[#ECFDF5] text-[#16A36A]"
                  : "bg-[#FEF2F2] text-[#DC4C4C]"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

export interface InfoCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function InfoCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: InfoCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-[8px] bg-[#E9F3EC] text-[#247653] flex items-center justify-center shrink-0 mt-0.5">
              {icon}
            </div>
          )}
          <div>
            <h4 className="text-[15px] font-semibold text-[#252B27]">{title}</h4>
            {description && (
              <p className="text-[13px] text-[#737D75] mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}
