"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Share2,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Carregando proposta comercial...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400 text-sm">Orçamento não encontrado.</p>
        <Link href="/orcamentos" className="text-blue-400 text-xs underline">
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Botões de Ação Topo (Ocultados na impressão) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/orcamentos"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Orçamentos</span>
        </Link>

        <div className="flex items-center gap-2">
          {isBudget && (
            <button
              onClick={handleConvert}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Converter em OS (Mover p/ Pátio)</span>
            </button>
          )}

          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar WhatsApp</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Proposta / PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO DA PROPOSTA EM FORMATO FOLHA / IMPRESSÃO */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 print:border-slate-300 gap-4">
          <div>
            <h1 className="text-xl font-bold text-white print:text-black">
              {tenant.tradingName || tenant.name}
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              {tenant.address || "Estética Automotiva & Detailing"}
            </p>
            {tenant.document && (
              <p className="text-[11px] text-slate-500 print:text-slate-500">
                CNPJ/CPF: {tenant.document} | Contato: {tenant.phone || tenant.whatsapp || "-"}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isBudget
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 print:text-amber-800 print:border-amber-700"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 print:text-emerald-800 print:border-emerald-700"
              }`}
            >
              {isBudget ? "Proposta de Orçamento" : "Ordem de Serviço"}
            </span>
            <p className="font-mono text-sm font-bold text-white print:text-black mt-1">
              #{order.orderNumber}
            </p>
            <p className="text-[10px] text-slate-400 print:text-slate-600">
              Emissão: {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Dados do Cliente e do Veículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 print:text-slate-600">
              Dados do Cliente
            </p>
            <p className="text-sm font-bold text-white print:text-black mt-0.5">{customer.name}</p>
            <p className="text-slate-300 print:text-slate-700">
              Telefone: {customer.whatsapp || customer.phone || "Não informado"}
            </p>
            {customer.document && (
              <p className="text-slate-400 print:text-slate-600 text-[11px]">CPF: {customer.document}</p>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 print:text-slate-600">
              Dados do Veículo
            </p>
            <p className="text-sm font-bold text-white print:text-black mt-0.5">
              {vehicle.plate} — {vehicle.brand} {vehicle.model}
            </p>
            <p className="text-slate-300 print:text-slate-700">
              Porte / Categoria: <strong className="text-blue-400 print:text-blue-800">{vehicle.category}</strong>
            </p>
            {order.mileage && (
              <p className="text-slate-400 print:text-slate-600 text-[11px]">KM: {order.mileage} km</p>
            )}
          </div>
        </div>

        {/* Tabela de Serviços */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">
            Discriminação de Serviços Inclusos
          </h2>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-800 print:border-slate-300">
              <tr>
                <th className="py-2.5 px-3">Item / Serviço</th>
                <th className="py-2.5 px-3 text-center">Qtd</th>
                <th className="py-2.5 px-3 text-right">Valor Unitário</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {items.map((it: any, idx: number) => (
                <tr key={idx} className="print:text-black">
                  <td className="py-3 px-3 font-medium text-white print:text-black">{it.serviceName}</td>
                  <td className="py-3 px-3 text-center text-slate-400 print:text-slate-700">{it.quantity || 1}</td>
                  <td className="py-3 px-3 text-right text-slate-300 print:text-slate-700">
                    {it.unitPrice !== null ? formatCurrency(it.unitPrice) : "-"}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-white print:text-black">
                    {it.totalPrice !== null ? formatCurrency(it.totalPrice) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo Financeiro */}
        <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div>
            {order.notes && (
              <div className="text-[11px] text-slate-400 print:text-slate-700 max-w-md">
                <span className="font-semibold text-slate-300 print:text-black">Observações / Condições: </span>
                {order.notes}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-right w-full sm:w-64">
            <div className="flex justify-between text-slate-400 print:text-slate-700">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-200 print:text-black">
                {order.subtotal !== null ? formatCurrency(order.subtotal) : "-"}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Desconto Especial:</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-emerald-400 print:text-black pt-2 border-t border-slate-800 print:border-slate-300">
              <span>Valor Total:</span>
              <span>{order.totalAmount !== null ? formatCurrency(order.totalAmount) : "-"}</span>
            </div>
          </div>
        </div>

        {/* Rodapé Institucional */}
        <div className="pt-8 text-center text-[10px] text-slate-500 print:text-slate-600 border-t border-slate-800/80 print:border-slate-300">
          Proposta emitida pelo Detailing OS — Gestão Profissional de Estética Automotiva.
        </div>
      </div>
    </div>
  );
}

