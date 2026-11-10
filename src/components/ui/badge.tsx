import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "brand"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  size?: "sm" | "md";
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#F1F3F1] text-[#252B27] border-[#E7EAE7]",
  brand: "bg-[#E9F3EC] text-[#142D26] border-[#C5E2CE]",
  success: "bg-[#ECFDF5] text-[#16A36A] border-[#A7F3D0]",
  info: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  warning: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  error: "bg-[#FEF2F2] text-[#DC4C4C] border-[#FECACA]",
  neutral: "bg-[#F1F3F1] text-[#737D75] border-[#E7EAE7]",
  outline: "bg-white text-[#252B27] border-[#D5DBD5]",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-[#737D75]",
  brand: "bg-[#247653]",
  success: "bg-[#16A36A]",
  info: "bg-[#2563EB]",
  warning: "bg-[#D97706]",
  error: "bg-[#DC4C4C]",
  neutral: "bg-[#9CA49E]",
  outline: "bg-[#343C36]",
};

export function Badge({
  variant = "default",
  dot = false,
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-[12px]",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClasses[variant])}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Mapeia os status reais de Ordem de Serviço / Orçamento para o Badge semântico
 */
export function OrderStatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  switch (status) {
    case "BUDGET_PENDING":
      return (
        <Badge variant="warning" dot size={size}>
          Orçamento Pendente
        </Badge>
      );
    case "BUDGET_APPROVED":
      return (
        <Badge variant="brand" dot size={size}>
          Orçamento Aprovado
        </Badge>
      );
    case "TODO":
      return (
        <Badge variant="warning" dot size={size}>
          A Fazer (Fila)
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge variant="info" dot size={size}>
          Em Andamento
        </Badge>
      );
    case "DONE":
      return (
        <Badge variant="success" dot size={size}>
          Pronto p/ Retirada
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="brand" dot size={size}>
          Entregue e Pago
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="error" dot size={size}>
          Cancelado
        </Badge>
      );
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
}

export const StatusBadge = OrderStatusBadge;
