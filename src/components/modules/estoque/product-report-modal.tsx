"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Edit3,
  PackageOpen,
  RotateCcw,
} from "lucide-react";
import { Alert, Badge, Button, LoadingState, Modal } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { formatStockQuantity } from "@/lib/inventory";
import type { InventoryProduct, ProductMovementItem } from "./types";

interface ProductReportModalProps {
  isOpen: boolean;
  productId: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onRecoverLoss: (productId: string, movementId: string) => void;
  onEditMovement: (
    movement: ProductMovementItem,
    productName: string,
    productUnit: string
  ) => void;
  onRefreshList: () => void;
}

const MOVEMENT_BADGES: Record<
  string,
  { label: string; variant: "success" | "info" | "error" | "warning" | "neutral" }
> = {
  IN: { label: "Entrada", variant: "success" },
  OUT: { label: "Saída Pátio", variant: "info" },
  OS_CONSUMPTION: { label: "Consumo OS", variant: "info" },
  LOSS: { label: "Perda / Avaria", variant: "error" },
  ADJUSTMENT: { label: "Ajuste Físico", variant: "warning" },
};

export function ProductReportModal({
  isOpen,
  productId,
  isAdmin,
  onClose,
  onRecoverLoss,
  onEditMovement,
  onRefreshList,
}: ProductReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<
    (InventoryProduct & {
      recipes?: Array<{
        id: string;
        serviceId: string;
        serviceName: string;
        quantityPerService: number;
      }>;
    }) | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [openingBottle, setOpeningBottle] = useState(false);

  async function loadDetail() {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar ficha.");
      setDetail(data.product);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar ficha.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && productId) {
      loadDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId]);

  async function handleBottleAction(action: "OPEN_BOTTLE" | "RESET_OPENED") {
    if (!detail) return;
    setOpeningBottle(true);
    try {
      const res = await fetch(`/api/products/${detail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar frasco.");
      await loadDetail();
      onRefreshList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar frasco.");
    } finally {
      setOpeningBottle(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={detail ? `Ficha & Histórico: ${detail.name}` : "Ficha do Produto"}
      description={
        detail
          ? `Saldo atual: ${formatStockQuantity(detail.currentStock, detail.unit)} • Mínimo: ${formatStockQuantity(detail.minStock, detail.unit)}`
          : undefined
      }
      size="lg"
    >
      {loading ? (
        <LoadingState message="Carregando histórico e validade do produto..." />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : detail ? (
        <div className="space-y-4">
          {/* Metadados e Pot-Life */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7]">
              <span className="text-[10px] uppercase font-bold text-[#737D75] block">
                Saldo / Mínimo
              </span>
              <span className="text-sm font-bold text-[#252B27]">
                {formatStockQuantity(detail.currentStock, detail.unit)}
              </span>
              <span className="block text-[11px] text-[#737D75]">
                Mínimo: {formatStockQuantity(detail.minStock, detail.unit)}
              </span>
            </div>

            {isAdmin ? (
              <div className="p-3 rounded-xl bg-[#E9F3EC]/50 border border-[#C6E2D0]">
                <span className="text-[10px] uppercase font-bold text-[#142D26] block">
                  Custo Médio / Total
                </span>
                <span className="text-sm font-bold text-[#142D26]">
                  {formatCurrency(detail.averageUnitCost)} / {detail.unit}
                </span>
                <span className="block text-[11px] text-[#343C36]">
                  Imobilizado: {formatCurrency(detail.totalStockValue)}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7]">
                <span className="text-[10px] uppercase font-bold text-[#737D75] block">
                  Diluição Padrão
                </span>
                <span className="text-sm font-bold text-[#252B27]">
                  {detail.defaultDilution || "Pronto uso / conforme rótulo"}
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#737D75] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#247653]" />
                Validade & Frasco Aberto
              </span>
              {detail.shelfLife.label ? (
                <p className="text-xs font-bold text-[#D97706]">
                  {detail.shelfLife.label}
                </p>
              ) : (
                <p className="text-xs font-semibold text-[#252B27]">
                  {detail.daysValidAfterOpen
                    ? `${detail.daysValidAfterOpen}d após aberto`
                    : "Sem prazo crítico definido"}
                </p>
              )}
              {isAdmin && detail.daysValidAfterOpen && (
                <div className="flex items-center gap-2 pt-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={openingBottle}
                    onClick={() => handleBottleAction("OPEN_BOTTLE")}
                    leftIcon={<PackageOpen className="w-3 h-3" />}
                  >
                    {detail.openedAt ? "Novo Frasco Aberto" : "Abrir Frasco Hoje"}
                  </Button>
                  {detail.openedAt && (
                    <button
                      type="button"
                      onClick={() => handleBottleAction("RESET_OPENED")}
                      className="text-[11px] text-[#737D75] hover:text-[#252B27] underline cursor-pointer"
                    >
                      Zerar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {detail.recipes && detail.recipes.length > 0 && (
            <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#737D75]">
                Serviços vinculados na Ficha Técnica:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detail.recipes.map((r) => (
                  <Badge key={r.id} variant="neutral" size="sm">
                    {r.serviceName}: {formatStockQuantity(r.quantityPerService, detail.unit)}/OS
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Movimentações */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#252B27] uppercase tracking-wider">
              Últimas Movimentações ({detail.movements.length})
            </h4>

            {detail.movements.length === 0 ? (
              <p className="text-xs text-[#737D75] py-4 text-center">
                Nenhuma movimentação registrada ainda para este item.
              </p>
            ) : (
              <div className="divide-y divide-[#F1F3F1] border border-[#E7EAE7] rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
                {detail.movements.map((mov) => {
                  const cfg = MOVEMENT_BADGES[mov.type] || {
                    label: mov.type,
                    variant: "neutral" as const,
                  };
                  return (
                    <div
                      key={mov.id}
                      className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={cfg.variant} size="sm">
                            {cfg.label}
                          </Badge>
                          <span className="font-bold text-[#252B27]">
                            {mov.type === "IN" ? "+" : mov.type === "ADJUSTMENT" ? "" : "-"}
                            {formatStockQuantity(mov.quantity, detail.unit)}
                          </span>
                          {mov.serviceOrderNumber && (
                            <Badge variant="brand" size="sm">
                              OS #{mov.serviceOrderNumber}
                            </Badge>
                          )}
                          {mov.recovered && (
                            <Badge variant="success" size="sm">
                              Recuperada
                            </Badge>
                          )}
                        </div>
                        <p className="text-[#737D75]">
                          {mov.reason || "Sem observação"}
                          {mov.userName ? ` • Por ${mov.userName}` : ""}
                        </p>
                        <p className="text-[11px] text-[#9CA49E]">
                          {formatDateTime(mov.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && mov.totalCost != null && mov.totalCost > 0 && (
                          <span className="font-semibold text-[#343C36] mr-1">
                            {formatCurrency(mov.totalCost)}
                          </span>
                        )}

                        {mov.type === "LOSS" && !mov.recovered && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onRecoverLoss(detail.id, mov.id)}
                            leftIcon={<RotateCcw className="w-3 h-3" />}
                          >
                            Recuperar
                          </Button>
                        )}

                        {isAdmin && mov.type !== "ADJUSTMENT" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onEditMovement(mov, detail.name, detail.unit)
                            }
                            leftIcon={<Edit3 className="w-3 h-3" />}
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {detail.shelfLife.status !== "OK" && (
            <Alert variant="warning">
              Atenção: {detail.shelfLife.label}. Priorize o consumo deste lote ou
              registre perda caso tenha vencido/cristalizado.
            </Alert>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
