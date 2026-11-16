"use client";

import {
  Car,
  MessageCircle,
  PhoneOff,
  Clock,
  Crown,
  Cake,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  type CrmCustomer,
  type CrmSegment,
  resolveEffectiveCampaign,
} from "./types";

interface CrmCustomerTableProps {
  customers: CrmCustomer[];
  activeTab: CrmSegment;
  onOpenWhatsAppModal: (customer: CrmCustomer) => void;
}

export function CrmCustomerTable({
  customers,
  activeTab,
  onOpenWhatsAppModal,
}: CrmCustomerTableProps) {
  return (
    <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#F7F8F6] text-[#5B655D] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E7EAE7]">
            <tr>
              <th className="py-3 px-4">Cliente e Contato</th>
              <th className="py-3 px-4">Veículo</th>
              <th className="py-3 px-4">Perfil e Já Gastou Aqui</th>
              <th className="py-3 px-4">Por que chamar?</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EAE7]">
            {customers.map((customer) => {
              const effectiveCampaign = resolveEffectiveCampaign(
                customer,
                activeTab
              );
              const tierBadgeVariant =
                customer.abcClass === "A"
                  ? "success"
                  : customer.abcClass === "B"
                  ? "info"
                  : "neutral";

              return (
                <tr
                  key={customer.id}
                  className="hover:bg-[#F7F8F6]/80 transition-colors"
                >
                  {/* Cliente e Contato */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#252B27]">
                        {customer.name}
                      </span>
                      {customer.isBirthdaySoon && (
                        <Badge variant="warning" size="sm">
                          <Cake className="w-3 h-3 mr-1" />
                          {customer.birthdayDaysUntil === 0
                            ? "Aniversário hoje"
                            : `Em ${customer.birthdayDaysUntil}d`}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-[#737D75] mt-1 flex items-center gap-2 flex-wrap">
                      {customer.hasValidWhatsApp ? (
                        <span>
                          {formatPhoneDisplay(
                            customer.whatsapp || customer.phone
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#DC4C4C] font-medium">
                          <PhoneOff className="w-3 h-3" />
                          Sem WhatsApp válido
                        </span>
                      )}
                    </div>

                    {customer.latestContact && (
                      <div className="mt-1.5">
                        {customer.isSnoozed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                            <PauseCircle className="w-3 h-3" />
                            Adiado (último registro há {customer.latestContact.daysAgo}d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                            <CheckCircle2 className="w-3 h-3 text-[#247653]" />
                            Último contato há {customer.latestContact.daysAgo}{" "}
                            {customer.latestContact.daysAgo === 1 ? "dia" : "dias"}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Veículo */}
                  <td className="py-3.5 px-4 align-top">
                    {customer.mainVehicle ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#252B27]">
                          <Car className="w-3.5 h-3.5 text-[#737D75] shrink-0" />
                          <span>
                            {customer.mainVehicle.brand
                              ? `${customer.mainVehicle.brand} `
                              : ""}
                            {customer.mainVehicle.model}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="mercosul-plate text-[10px] font-bold">
                            {customer.mainVehicle.plate}
                          </span>
                          {customer.vehiclesCount > 1 && (
                            <span className="text-[11px] text-[#737D75]">
                              +{customer.vehiclesCount - 1} veículo(s)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#737D75] italic">
                        Sem veículo vinculado
                      </span>
                    )}
                  </td>

                  {/* Perfil & Gasto */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1">
                      <Badge variant={tierBadgeVariant} size="sm">
                        {customer.abcClass === "A" && (
                          <Crown className="w-3 h-3 mr-1" />
                        )}
                        {customer.tierLabel}
                      </Badge>
                      <div className="text-xs font-semibold text-[#142D26]">
                        Já gastou aqui: {formatCurrency(customer.totalSpent)}
                      </div>
                      <div className="text-[11px] text-[#737D75]">
                        {customer.ordersCount === 0
                          ? "Nenhum serviço pago ainda"
                          : `${customer.ordersCount} serviço(s) pago(s)`}
                      </div>
                    </div>
                  </td>

                  {/* Por que chamar? */}
                  <td className="py-3.5 px-4 align-top max-w-xs">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#252B27] leading-snug">
                        {customer.reasonTitle}
                      </p>

                      {customer.daysSinceLastVisit !== null ? (
                        <p className="text-[11px] text-[#737D75] flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>
                            Última visita paga há {customer.daysSinceLastVisit}{" "}
                            {customer.daysSinceLastVisit === 1 ? "dia" : "dias"}
                          </span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#737D75]">
                          Ainda sem visita concluída e paga
                        </p>
                      )}

                      {effectiveCampaign === "BUDGET_RECOVERY" &&
                        customer.openBudgetTotal > 0 && (
                          <span className="inline-block text-[11px] font-semibold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 rounded-md">
                            Em orçamento: {formatCurrency(customer.openBudgetTotal)}
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-4 text-right align-top">
                    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant={customer.hasValidWhatsApp ? "primary" : "outline"}
                        disabled={!customer.hasValidWhatsApp}
                        onClick={() => onOpenWhatsAppModal(customer)}
                        leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                      >
                        {customer.hasValidWhatsApp
                          ? "Enviar no WhatsApp"
                          : "Sem WhatsApp"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
