"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle,
  Clock,
  Ban,
  Car,
  AlertCircle,
} from "lucide-react";
import { Modal, Button, Alert } from "@/components/ui";
import { buildWhatsAppUrl, formatPhoneDisplay } from "@/lib/phone";
import {
  type CrmCampaign,
  type CrmCustomer,
  type CrmTenantInfo,
  buildCrmTemplateMessage,
} from "./types";

interface CrmWhatsAppModalProps {
  customer: CrmCustomer | null;
  campaign: CrmCampaign;
  tenant: CrmTenantInfo;
  onClose: () => void;
  onSuccess: () => void;
}

export function CrmWhatsAppModal({
  customer,
  campaign,
  tenant,
  onClose,
  onSuccess,
}: CrmWhatsAppModalProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setMessage(buildCrmTemplateMessage(customer, campaign, tenant));
      setError(null);
    }
  }, [customer, campaign, tenant]);

  if (!customer) return null;

  async function logContact(
    outcome: "SENT" | "POSTPONED" | "NO_INTEREST",
    openWhatsAppAfter: boolean
  ) {
    if (!customer) return;
    setSubmitting(true);
    setError(null);

    try {
      if (openWhatsAppAfter) {
        const url = buildWhatsAppUrl(
          customer.whatsapp || customer.phone,
          message
        );
        if (!url) {
          setError("Este cliente não possui um número de WhatsApp válido.");
          setSubmitting(false);
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      }

      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          vehicleId: customer.targetVehicleId || customer.mainVehicle?.id || null,
          serviceOrderId: customer.targetOrderId || null,
          campaign,
          outcome,
          message: outcome === "SENT" ? message : null,
          snoozeDays: outcome === "POSTPONED" ? 15 : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível registrar o contato.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Falha ao registrar atendimento no CRM.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={Boolean(customer)}
      onClose={onClose}
      size="md"
      title={`Contato com ${customer.name}`}
      description={`WhatsApp: ${formatPhoneDisplay(
        customer.whatsapp || customer.phone
      )}`}
      footer={
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => logContact("POSTPONED", false)}
              leftIcon={<Clock className="w-3.5 h-3.5" />}
            >
              Adiar 15 dias
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={() => logContact("NO_INTEREST", false)}
              leftIcon={<Ban className="w-3.5 h-3.5 text-[#DC4C4C]" />}
            >
              Sem interesse
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={submitting}
            disabled={!customer.hasValidWhatsApp}
            onClick={() => logContact("SENT", true)}
            leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
          >
            Enviar WhatsApp e Marcar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="error" title="Atenção" description={error} />
        )}

        <div className="p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-1.5">
          <div className="text-xs font-semibold text-[#142D26]">
            Motivo sugerido pelo CRM
          </div>
          <p className="text-xs text-[#343C36]">{customer.reasonTitle}</p>
          {customer.mainVehicle && (
            <div className="text-[11px] text-[#5B655D] flex items-center gap-1.5 pt-1">
              <Car className="w-3.5 h-3.5 text-[#247653]" />
              <span>
                {customer.mainVehicle.brand
                  ? `${customer.mainVehicle.brand} `
                  : ""}
                {customer.mainVehicle.model} — {customer.mainVehicle.plate}
              </span>
            </div>
          )}
        </div>

        {campaign === "POST_SALE" && !tenant.googleReviewUrl && (
          <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Dica: configure seu link oficial do Google Avaliações em{" "}
              <strong>Configurações</strong> para incluí-lo automaticamente
              nesta mensagem de pós-venda.
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#252B27] mb-1.5">
            Mensagem pronta para enviar (edite se preferir)
          </label>
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-[#DCE1DC] bg-white px-3.5 py-2.5 text-sm text-[#252B27] focus:border-[#247653] focus:outline-none focus:ring-2 focus:ring-[#247653]/15"
          />
        </div>
      </div>
    </Modal>
  );
}
