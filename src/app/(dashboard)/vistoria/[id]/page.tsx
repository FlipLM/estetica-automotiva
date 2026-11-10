"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Share2,
  ArrowLeft,
  Fuel,
  Camera,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { VehicleSilhouette360, DamagePin } from "@/components/modules/vehicle-silhouette-360";
import { formatDateTime } from "@/lib/utils";

export default function ChecklistDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function loadChecklist() {
      try {
        setLoading(true);
        const res = await fetch(`/api/checklists/${id}`);
        if (!res.ok) throw new Error("Vistoria não encontrada.");
        const data = await res.json();
        setChecklist(data.checklist);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadChecklist();
  }, [id]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-[#737D75]">
        <Loader2 className="w-8 h-8 animate-spin text-[#247653]" />
        <p className="text-sm font-medium">Carregando comprovante de vistoria...</p>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-[#737D75] text-sm">Vistoria não encontrada.</p>
        <Link href="/vistoria" className="text-[#247653] text-xs font-semibold underline">
          Voltar para Vistorias
        </Link>
      </div>
    );
  }

  const { serviceOrder, damageRecords } = checklist;
  const { vehicle, tenant, assignedUser } = serviceOrder;
  const { customer } = vehicle;

  const damages: DamagePin[] = damageRecords.map((d: any) => {
    let photosList: string[] = [];
    if (Array.isArray(d.photos) && d.photos.length > 0) {
      photosList = d.photos;
    } else if (d.photosUrls) {
      try {
        photosList = JSON.parse(d.photosUrls);
      } catch {
        photosList = [];
      }
    }
    if (photosList.length === 0 && d.photoUrl) {
      photosList = [d.photoUrl];
    }

    return {
      area: d.area,
      damageType: d.damageType,
      coordinateX: d.coordinateX || 50,
      coordinateY: d.coordinateY || 50,
      description: d.description || "",
      photoUrl: photosList[0] || d.photoUrl || undefined,
      photos: photosList,
    };
  });

  function handlePrint() {
    window.print();
  }

  function handleShareWhatsApp() {
    const phone = customer.whatsapp || customer.phone;
    if (!phone) {
      alert("Cliente não possui número de WhatsApp cadastrado.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const formatted = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const text = `Olá, *${customer.name}*!%0A%0ASegue o link do seu *Comprovante de Vistoria de Entrada*:%0A- Veículo: *${vehicle.brand || ""} ${vehicle.model}* (Placa: *${vehicle.plate}*)%0A- Nível de Combustível: ${checklist.fuelLevel}%%0A- Avarias Mapeadas: ${damageRecords.length} registro(s)%0A- Empresa: ${tenant.tradingName || tenant.name}%0A%0AObrigado pela confiança!`;
    window.open(`https://wa.me/${formatted}?text=${text}`, "_blank");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Botões de Ação Topo (Ocultados na impressão) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/vistoria"
          className="text-xs font-semibold text-[#737D75] hover:text-[#252B27] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Vistorias</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#16A36A] border border-[#A7F3D0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="dp-btn-primary text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Comprovante / PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO DE VISTORIA */}
      <div className="bg-white border border-[#E7EAE7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho da Empresa */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#E7EAE7] gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#252B27]">
              {tenant.tradingName || tenant.name}
            </h1>
            <p className="text-xs text-[#737D75] mt-0.5">
              {tenant.address || "Centro de Estética Automotiva & Detailing"}
            </p>
            {tenant.document && (
              <p className="text-[11px] text-[#737D75]">
                CNPJ/CPF: {tenant.document} | Tel: {tenant.phone || tenant.whatsapp || "-"}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E9F3EC] text-[#142D26]">
              Comprovante de Entrada
            </span>
            <p className="text-sm font-bold text-[#252B27] mt-1">
              OS #{serviceOrder.orderNumber}
            </p>
            <p className="text-xs text-[#737D75]">
              {formatDateTime(checklist.createdAt)}
            </p>
          </div>
        </div>

        {/* Dados do Cliente e Veículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#737D75]">
              Dados do Cliente
            </p>
            <p className="text-sm font-bold text-[#252B27] mt-0.5">{customer.name}</p>
            <p className="text-[#343C36]">
              Contato: {customer.whatsapp || customer.phone || "Não informado"}
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
              Categoria: <strong className="text-[#247653]">{vehicle.category}</strong>
              {vehicle.color ? ` | Cor: ${vehicle.color}` : ""}
            </p>
            {serviceOrder.mileage && (
              <p className="text-[#737D75] text-[11px]">
                Quilometragem: {serviceOrder.mileage} km
              </p>
            )}
          </div>
        </div>

        {/* Indicadores Operacionais */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7]">
            <span className="text-[11px] text-[#737D75] block mb-0.5">Nível de Combustível</span>
            <div className="flex items-center gap-1.5 font-bold text-[#D97706] text-sm">
              <Fuel className="w-4 h-4" />
              <span>{checklist.fuelLevel}%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7]">
            <span className="text-[11px] text-[#737D75] block mb-0.5">Pertences Deixados</span>
            <span className="font-semibold text-[#252B27] text-xs">
              {checklist.valuablesLeft || "Nenhum pertence declarado"}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7]">
            <span className="text-[11px] text-[#737D75] block mb-0.5">Vistoriador / Operador</span>
            <span className="font-semibold text-[#252B27] text-xs">
              {assignedUser?.name || "Equipe de Pátio"}
            </span>
          </div>
        </div>

        {/* Silhueta 360 e Mapa de Avarias */}
        <div className="pt-2 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#737D75]">
            Mapa de Avarias Identificadas na Recepção ({damages.length})
          </h2>
          <VehicleSilhouette360 damages={damages} onChange={() => {}} readOnly={true} />
        </div>

        {/* Galeria de Fotos Anexadas de Todas as Avarias */}
        {damages.some((d) => (d.photos && d.photos.length > 0) || d.photoUrl) && (
          <div className="pt-4 border-t border-[#E7EAE7] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#737D75] flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#247653]" />
              <span>
                Evidências Fotográficas Registradas (
                {damages.reduce(
                  (acc, d) => acc + (d.photos?.length || (d.photoUrl ? 1 : 0)),
                  0
                )}{" "}
                fotos)
              </span>
            </h3>

            <div className="space-y-4">
              {damages.map((d, dIdx) => {
                const photos = d.photos && d.photos.length > 0 ? d.photos : d.photoUrl ? [d.photoUrl] : [];
                if (photos.length === 0) return null;

                return (
                  <div
                    key={dIdx}
                    className="p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#247653] text-white text-xs font-bold flex items-center justify-center">
                          {dIdx + 1}
                        </span>
                        <span className="font-bold text-[#252B27]">
                          {d.damageType} — {d.area}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#737D75]">
                        {photos.length} {photos.length === 1 ? "foto registrada" : "fotos registradas"}
                      </span>
                    </div>

                    {d.description && (
                      <p className="text-xs text-[#737D75] italic pl-7">
                        &ldquo;{d.description}&rdquo;
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1 pl-7">
                      {photos.map((url, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative rounded-lg overflow-hidden border border-[#E7EAE7] aspect-square group bg-white shadow-xs cursor-pointer"
                          onClick={() => setSelectedPreviewPhoto(url)}
                        >
                          <img
                            src={url}
                            alt={`Avaria ${dIdx + 1} - Foto ${pIdx + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#142D26]/85 text-[9px] font-bold text-white print:hidden">
                            #{pIdx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal de Zoom Lightbox */}
        {selectedPreviewPhoto && (
          <div
            onClick={() => setSelectedPreviewPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D26]/85 backdrop-blur-sm cursor-zoom-out print:hidden animate-in fade-in duration-150"
          >
            <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-[#E7EAE7] shadow-2xl bg-white">
              <img
                src={selectedPreviewPhoto}
                alt="Foto ampliada"
                className="w-full h-full max-h-[85vh] object-contain"
              />
            </div>
          </div>
        )}

        {/* Carimbo de Confirmação & Assinatura de Entrada */}
        <div className="pt-6 border-t border-[#E7EAE7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-[#343C36]">
            <CheckCircle2 className="w-5 h-5 text-[#16A36A] shrink-0" />
            <div>
              <p className="font-semibold text-[#252B27]">
                Vistoria Validada na Recepção do Veículo
              </p>
              <p className="text-[11px] text-[#737D75]">
                Data do aceite: {formatDateTime(checklist.confirmedAt || checklist.createdAt)}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-[11px] text-[#737D75]">
            Documento emitido eletronicamente pelo sistema DetailPro SaaS.
          </div>
        </div>
      </div>
    </div>
  );
}
