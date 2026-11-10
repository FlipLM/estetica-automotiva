"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Navegação estrutural"
      className={cn("flex items-center gap-1.5 text-[12px] text-[#737D75]", className)}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#9CA49E]" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-[#247653] transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[200px]",
                  isLast ? "text-[#252B27] font-semibold" : "text-[#737D75]"
                )}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-2 pb-1", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[24px] sm:text-[26px] font-bold text-[#252B27] tracking-tight leading-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-[14px] text-[#737D75] leading-normal">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "pills",
  className,
}: {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline";
  className?: string;
}) {
  if (variant === "underline") {
    return (
      <div
        className={cn(
          "flex items-center gap-6 border-b border-[#E7EAE7] overflow-x-auto",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "pb-3 text-[14px] font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer -mb-px",
                isActive
                  ? "border-[#247653] text-[#247653] font-semibold"
                  : "border-transparent text-[#737D75] hover:text-[#252B27]"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[11px] font-semibold",
                    isActive
                      ? "bg-[#E9F3EC] text-[#142D26]"
                      : "bg-[#F1F3F1] text-[#737D75]"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-[10px] bg-[#F1F3F1] border border-[#E7EAE7] overflow-x-auto max-w-full",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
              isActive
                ? "bg-white text-[#142D26] font-semibold shadow-2xs border border-[#E7EAE7]/80"
                : "text-[#737D75] hover:text-[#252B27]"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[11px] font-semibold",
                  isActive
                    ? "bg-[#E9F3EC] text-[#247653]"
                    : "bg-[#E7EAE7] text-[#737D75]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  className,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  className?: string;
}) {
  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E7EAE7] text-[13px] text-[#737D75]",
        className
      )}
    >
      <div>
        {totalItems !== undefined ? (
          <span>
            Total de <strong className="text-[#252B27]">{totalItems}</strong> registro(s)
          </span>
        ) : (
          <span>
            Página <strong className="text-[#252B27]">{currentPage}</strong> de{" "}
            <strong className="text-[#252B27]">{Math.max(1, totalPages)}</strong>
          </span>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Anterior
          </Button>
          <span className="px-3 text-[13px] font-medium text-[#252B27]">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}

