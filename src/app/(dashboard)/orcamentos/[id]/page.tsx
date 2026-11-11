"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileDown,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { generateBudgetPdf } from "@/lib/pdf-generator";

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error("Orçamento não encontrado.");
        const data = await res.json();
        setOrder(data.order);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-[#737D75]">
        <Loader2 className="w-8 h-8 animate-spin text-[#247653]" />
        <p className="text-sm font-medium">Carregando proposta comercial...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-[#737D75] text-sm">Orçamento não encontrado.</p>
        <Link href="/orcamentos" className="text-[#247653] text-xs font-semibold underline">
          Voltar para Orçamentos
        </Link>
      </div>
    );
  }

  const { vehicle, tenant, items } = order;
  const { customer } = vehicle;
  const isBudget = order.status.startsWith("BUDGET");

  async function handleConvert() {
    if (!confirm(`Deseja aprovar e converter o Orçamento #${order.orderNumber} em Ordem de Serviço no Pátio?`)) return;

    try {
      const res = await fetch(`/api/orders/${order.id}/convert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao converter.");
        return;
      }
      alert("Orçamento convertido com sucesso! O veículo já está no Pátio.");
      router.push("/patio");
    } catch (e) {
      console.error(e);
      alert("Erro ao converter orçamento.");
    }
  }

  function handleShareWhatsApp() {
    const phone = customer.whatsapp || customer.phone;
    if (!phone) {
      alert("Cliente não possui WhatsApp cadastrado.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const formatted = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const servicesList = items
      .map((it: any) => `- ${it.serviceName}: ${formatCurrency(it.unitPrice || 0)}`)
      .join("%0A");

    const text = `Olá, *${customer.name}*!%0A%0ASegue a proposta de orçamento para o seu *${vehicle.brand || ""} ${vehicle.model}* (Placa: *${vehicle.plate}*):%0A%0A*Serviços Inclusos:*%0A${servicesList}%0A%0A*Valor Total:* ${formatCurrency(order.totalAmount || 0)}%0A%0A${tenant.tradingName || tenant.name}%0APodemos confirmar o agendamento?`;

    window.open(`https://wa.me/${formatted}?text=${text}`, "_blank");
  }

  function handleDownloadPdf() {
    try {
      generateBudgetPdf(order, { download: true });
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      alert("Erro ao montar o documento PDF.");
    }
  }

  function handleViewPdf() {
    try {
      const { doc } = generateBudgetPdf(order, { download: false });
      const blobUrl = doc.output("bloburl");
      window.open(blobUrl, "_blank");
    } catch (e) {
      console.error("Erro ao visualizar PDF:", e);
      alert("Erro ao abrir visualização do PDF.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 print:max-w-none print:w-full print:p-0 print:m-0">
      {/* Botões de Ação Topo (Ocultados na impressão) */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href="/orcamentos"
          className="text-xs font-semibold text-[#737D75] hover:text-[#252B27] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Orçamentos</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {isBudget && (
            <button
              onClick={handleConvert}
              className="dp-btn-primary text-xs cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Converter em OS (Mover p/ Pátio)</span>
            </button>
          )}

          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#16A36A] border border-[#A7F3D0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Enviar proposta no WhatsApp do cliente"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-lg bg-[#247653] hover:bg-[#1E6346] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Montar e baixar arquivo PDF vetorial oficial"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>

          <button
            onClick={handleViewPdf}
            className="px-3 py-2 rounded-lg bg-white hover:bg-[#F1F3F1] border border-[#E7EAE7] text-[#252B27] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Visualizar documento PDF em nova aba"
          >
            <Eye className="w-3.5 h-3.5 text-[#737D75]" />
            <span>Visualizar</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO DA PROPOSTA EM FORMATO FOLHA / IMPRESSÃO */}
      <div className="bg-white border border-[#E7EAE7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#E7EAE7] gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#252B27]">
              {tenant.tradingName || tenant.name}
            </h1>
            <p className="text-xs text-[#737D75] mt-0.5">
              {tenant.address || "Estética Automotiva & Detailing"}
            </p>
            {tenant.document && (
              <p className="text-[11px] text-[#737D75]">
                CNPJ/CPF: {tenant.document} | Contato: {tenant.phone || tenant.whatsapp || "-"}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isBudget
                  ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                  : "bg-[#ECFDF5] text-[#16A36A] border-[#A7F3D0]"
              }`}
            >
              {isBudget ? "Proposta de Orçamento" : "Ordem de Serviço"}
            </span>
            <p className="text-sm font-bold text-[#252B27] mt-1">
              #{order.orderNumber}
            </p>
            <p className="text-xs text-[#737D75]">
              Emissão: {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Dados do Cliente e do Veículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#737D75]">
              Dados do Cliente
            </p>
            <p className="text-sm font-bold text-[#252B27] mt-0.5">{customer.name}</p>
            <p className="text-[#343C36]">
              Telefone: {customer.whatsapp || customer.phone || "Não informado"}
            </p>
            {customer.document && (
              <p className="text-[#737D75] text-[11px]">CPF/CNPJ: {customer.document}</p>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#737D75]">
              Dados do Veículo
            </p>
            <p className="text-sm font-bold text-[#252B27] mt-0.5">
              {vehicle.plate} — {vehicle.brand} {vehicle.model}
            </p>
            <p className="text-[#343C36]">
              Porte / Categoria: <strong className="text-[#247653]">{vehicle.category}</strong>
            </p>
            {order.mileage && (
              <p className="text-[#737D75] text-[11px]">KM: {order.mileage} km</p>
            )}
          </div>
        </div>

        {/* Tabela de Serviços */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#737D75]">
            Discriminação de Serviços Inclusos
          </h2>

          <div className="border border-[#E7EAE7] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F6] text-[#737D75] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E7EAE7]">
                <tr>
                  <th className="py-2.5 px-3">Item / Serviço</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Valor Unitário</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAE7]">
                {items.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 font-semibold text-[#252B27]">{it.serviceName}</td>
                    <td className="py-3 px-3 text-center text-[#737D75]">{it.quantity || 1}</td>
                    <td className="py-3 px-3 text-right text-[#343C36]">
                      {it.unitPrice !== null ? formatCurrency(it.unitPrice) : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#247653]">
                      {it.totalPrice !== null ? formatCurrency(it.totalPrice) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="pt-4 border-t border-[#E7EAE7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div>
            {order.notes && (
              <div className="text-xs text-[#737D75] max-w-md">
                <span className="font-semibold text-[#252B27]">Observações / Condições: </span>
                {order.notes}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-right w-full sm:w-64">
            <div className="flex justify-between text-[#737D75]">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#252B27]">
                {order.subtotal !== null ? formatCurrency(order.subtotal) : "-"}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-[#D97706] font-medium">
                <span>Desconto Especial:</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-[#142D26] pt-2 border-t border-[#E7EAE7]">
              <span>Valor Total:</span>
              <span>{order.totalAmount !== null ? formatCurrency(order.totalAmount) : "-"}</span>
            </div>
          </div>
        </div>

        {/* Rodapé Institucional */}
        <div className="pt-8 text-center text-[11px] text-[#737D75] border-t border-[#E7EAE7]">
          Proposta emitida pelo Vulpto — Gestão Profissional de Estética Automotiva.
        </div>
      </div>
    </div>
  );
}
