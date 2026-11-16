"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle, ShoppingCart } from "lucide-react";
import { Button, EmptyState, Modal } from "@/components/ui";
import { buildWhatsAppUrl } from "@/lib/phone";
import { formatCurrency } from "@/lib/utils";
import { formatStockQuantity } from "@/lib/inventory";
import type { InventoryProduct } from "./types";

interface ShoppingListModalProps {
  isOpen: boolean;
  products: InventoryProduct[];
  onClose: () => void;
}

export function ShoppingListModal({
  isOpen,
  products,
  onClose,
}: ShoppingListModalProps) {
  const [supplierPhone, setSupplierPhone] = useState("");
  const [copied, setCopied] = useState(false);

  const itemsToBuy = useMemo(() => {
    return products
      .filter((p) => p.active && p.currentStock <= p.minStock)
      .map((p) => {
        const deficit = Math.max(p.minStock - p.currentStock, p.minStock * 0.5, 1);
        const suggestedPacks =
          p.packSize && p.packSize > 0 ? Math.ceil(deficit / p.packSize) : null;
        const suggestedQty =
          suggestedPacks && p.packSize ? suggestedPacks * p.packSize : Math.ceil(deficit);
        const estimatedCost = suggestedQty * (p.costPrice || 0);
        return {
          product: p,
          suggestedPacks,
          suggestedQty,
          estimatedCost,
        };
      });
  }, [products]);

  const totalEstimate = itemsToBuy.reduce((acc, item) => acc + item.estimatedCost, 0);

  const messageText = useMemo(() => {
    if (itemsToBuy.length === 0) return "";
    const lines = itemsToBuy.map((item) => {
      const qtyText = item.suggestedPacks
        ? `${item.suggestedPacks}x ${item.product.packLabel || `${item.product.packSize} ${item.product.unit}`}`
        : formatStockQuantity(item.suggestedQty, item.product.unit);
      const supplierNote = item.product.supplier ? ` (${item.product.supplier})` : "";
      return `• ${item.product.name}: *${qtyText}*${supplierNote}`;
    });
    return `Olá! Segue a lista de reposição de insumos:\n\n${lines.join("\n")}`;
  }, [itemsToBuy]);

  const whatsappUrl = useMemo(() => {
    if (!messageText) return null;
    if (supplierPhone.trim()) {
      return buildWhatsAppUrl(supplierPhone, messageText);
    }
    return `https://wa.me/?text=${encodeURIComponent(messageText)}`;
  }, [messageText, supplierPhone]);

  async function handleCopy() {
    if (!messageText) return;
    await navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lista de Compras & Reposição"
      description="Produtos ativos zerados ou abaixo do estoque mínimo com sugestão de embalagens."
      size="lg"
    >
      {itemsToBuy.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-5 h-5" />}
          title="Estoque em dia!"
          description="Nenhum produto está abaixo do nível mínimo configurado no momento."
        />
      ) : (
        <div className="space-y-4">
          <div className="border border-[#E7EAE7] rounded-xl overflow-hidden divide-y divide-[#F1F3F1] max-h-[280px] overflow-y-auto">
            {itemsToBuy.map(({ product, suggestedPacks, suggestedQty, estimatedCost }) => (
              <div
                key={product.id}
                className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <p className="font-bold text-[#252B27]">{product.name}</p>
                  <p className="text-[#737D75]">
                    Atual:{" "}
                    <strong className="text-[#DC4C4C]">
                      {formatStockQuantity(product.currentStock, product.unit)}
                    </strong>{" "}
                    • Mínimo: {formatStockQuantity(product.minStock, product.unit)}
                    {product.supplier ? ` • Fornecedor: ${product.supplier}` : ""}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-[#E9F3EC] text-[#142D26] font-bold">
                    Pedir:{" "}
                    {suggestedPacks
                      ? `${suggestedPacks}x (${product.packLabel || `${product.packSize} ${product.unit}`})`
                      : formatStockQuantity(suggestedQty, product.unit)}
                  </span>
                  {estimatedCost > 0 && (
                    <span className="block text-[11px] text-[#737D75] mt-0.5">
                      Estimado: {formatCurrency(estimatedCost)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalEstimate > 0 && (
            <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] flex items-center justify-between text-xs">
              <span className="text-[#737D75] font-medium">
                Investimento estimado para reposição ({itemsToBuy.length} itens):
              </span>
              <span className="text-sm font-bold text-[#142D26]">
                {formatCurrency(totalEstimate)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#343C36] mb-1">
              WhatsApp do Fornecedor (Opcional — deixe vazio para escolher contato no WhatsApp)
            </label>
            <input
              type="text"
              placeholder="(11) 99999-9999"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              className="dp-input"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#E7EAE7]">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? "Copiado!" : "Copiar Texto"}
            </Button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="dp-btn-primary inline-flex items-center gap-2 text-xs px-4 py-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
