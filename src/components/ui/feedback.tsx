"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-[#142D26]/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "w-full bg-white border border-[#E7EAE7] rounded-[16px] shadow-modal flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EAE7] flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold text-[#252B27] leading-snug">
              {title}
            </h2>
            {description && (
              <p className="text-[13px] text-[#737D75] mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] p-1.5 rounded-[8px] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-[#F7F8F6] border-t border-[#E7EAE7] flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-[#142D26]/40 backdrop-blur-[2px] flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white h-full border-l border-[#E7EAE7] shadow-modal flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-6 py-4 border-b border-[#E7EAE7] flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[#252B27]">{title}</h2>
            {description && (
              <p className="text-[13px] text-[#737D75] mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] p-1.5 rounded-[8px] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-[#F7F8F6] border-t border-[#E7EAE7] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export function Alert({
  variant = "info",
  title,
  description,
  children,
  className,
  onDismiss,
}: AlertProps) {
  const config = {
    info: {
      bg: "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]",
      iconColor: "text-[#2563EB]",
      Icon: Info,
    },
    success: {
      bg: "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]",
      iconColor: "text-[#16A36A]",
      Icon: CheckCircle2,
    },
    warning: {
      bg: "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]",
      iconColor: "text-[#D97706]",
      Icon: AlertTriangle,
    },
    error: {
      bg: "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]",
      iconColor: "text-[#DC4C4C]",
      Icon: AlertCircle,
    },
  }[variant];

  const Icon = config.Icon;

  return (
    <div
      role="alert"
      className={cn(
        "p-3.5 rounded-[10px] border flex items-start gap-3 text-[13px]",
        config.bg,
        className
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {(description || children) && (
          <div className="leading-relaxed">{description || children}</div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="opacity-70 hover:opacity-100 p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-8 sm:p-10 bg-white border border-dashed border-[#D5DBD5] rounded-[12px] text-center flex flex-col items-center justify-center",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[#E9F3EC] text-[#247653] flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-[15px] font-semibold text-[#252B27]">{title}</h4>
      {description && (
        <p className="text-[13px] text-[#737D75] max-w-md mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[8px] bg-[#E7EAE7]/80",
        className
      )}
    />
  );
}

export function LoadingState({
  message = "Carregando informações...",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "py-16 flex flex-col items-center justify-center gap-3 text-[#737D75]",
        className
      )}
    >
      <Loader2 className="w-7 h-7 animate-spin text-[#247653]" />
      <p className="text-[13px] font-medium">{message}</p>
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
  showLabel = false,
  label,
  className,
}: {
  value: number;
  max?: number;
  tone?: "brand" | "success" | "warning" | "error" | "info";
  showLabel?: boolean;
  label?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round((value / Math.max(1, max)) * 100)));
  const barTone = {
    brand: "bg-[#247653]",
    success: "bg-[#16A36A]",
    warning: "bg-[#D97706]",
    error: "bg-[#DC4C4C]",
    info: "bg-[#2563EB]",
  }[tone];

  return (
    <div className={cn("space-y-1.5", className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#737D75] font-medium">{label}</span>
          {showLabel && <span className="text-[#252B27] font-semibold">{pct}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-[#F1F3F1] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barTone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[14px] text-[#737D75] leading-relaxed">{description}</p>
    </Modal>
  );
}
