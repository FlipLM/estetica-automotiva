"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Share2,
  ArrowLeft,
  Car,
  Fuel,
  Gauge,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { VehicleSilhouette360, DamagePin } from "@/components/modules/vehicle-silhouette-360";
import { formatDateTime } from "@/lib/utils";

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
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
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Carregando comprovante de vistoria...</p>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400 text-sm">Vistoria não encontrada.</p>
        <Link href="/vistoria" className="text-blue-400 text-xs underline">
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
      } catch (e) {
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
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Vistorias</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Comprovante / PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO DE VISTORIA (FORMATADO PARA TELA E IMPRESSÃO) */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho da Empresa */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 print:border-slate-300 gap-4">
          <div>
            <h1 className="text-xl font-bold text-white print:text-black">
              {tenant.tradingName || tenant.name}
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              {tenant.address || "Centro de Estética Automotiva & Detailing"}
            </p>
            {tenant.document && (
              <p className="text-[11px] text-slate-500 print:text-slate-500">
                CNPJ/CPF: {tenant.document} | Tel: {tenant.phone || tenant.whatsapp || "-"}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 print:border-blue-700 print:text-blue-800">
              Comprovante de Entrada
            </span>
            <p className="font-mono text-sm font-bold text-white print:text-black mt-1">
              OS #{serviceOrder.orderNumber}
            </p>
            <p className="text-[10px] text-slate-400 print:text-slate-600">
              {formatDateTime(checklist.createdAt)}
            </p>
          </div>
        </div>

        {/* Dados do Cliente e Veículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 print:text-slate-600">
              Dados do Cliente
            </p>
            <p className="text-sm font-bold text-white print:text-black mt-0.5">{customer.name}</p>
            <p className="text-slate-300 print:text-slate-700">
              Contato: {customer.whatsapp || customer.phone || "Não informado"}
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
              Categoria: <strong className="text-blue-400 print:text-blue-800">{vehicle.category}</strong>
              {vehicle.color ? ` | Cor: ${vehicle.color}` : ""}
            </p>
            {serviceOrder.mileage && (
              <p className="text-slate-400 print:text-slate-600 text-[11px]">
                Quilometragem: {serviceOrder.mileage} km
              </p>
            )}
          </div>
        </div>

        {/* Indicadores Operacionais */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/40 print:bg-slate-50 border border-slate-800 print:border-slate-200">
            <span className="text-[10px] text-slate-400 block mb-0.5">Nível de Combustível</span>
            <div className="flex items-center gap-1.5 font-bold text-amber-400 print:text-amber-700 text-sm">
              <Fuel className="w-4 h-4" />
              <span>{checklist.fuelLevel}%</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/40 print:bg-slate-50 border border-slate-800 print:border-slate-200">
            <span className="text-[10px] text-slate-400 block mb-0.5">Pertences Deixados</span>
            <span className="font-medium text-slate-200 print:text-slate-800 text-xs">
              {checklist.valuablesLeft || "Nenhum pertence declarado"}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-slate-900/40 print:bg-slate-50 border border-slate-800 print:border-slate-200">
            <span className="text-[10px] text-slate-400 block mb-0.5">Vistoriador / Operador</span>
            <span className="font-medium text-slate-200 print:text-slate-800 text-xs">
              {assignedUser?.name || "Equipe de Pátio"}
            </span>
          </div>
        </div>

        {/* Silhueta 360 e Mapa de Avarias */}
        <div className="pt-2 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">
            Mapa de Avarias Identificadas na Recepção ({damages.length})
          </h2>
          <VehicleSilhouette360 damages={damages} onChange={() => { }} readOnly={true} />
        </div>

        {/* Galeria de Fotos Anexadas de Todas as Avarias */}
        {damages.some((d) => (d.photos && d.photos.length > 0) || d.photoUrl) && (
          <div className="pt-4 border-t border-slate-800 print:border-slate-200 space-y-3 font-mono">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 flex items-center gap-2">
              <Camera className="w-4 h-4 text-lime-400" />
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
                    className="p-3 rounded-lg bg-slate-900/40 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 print:bg-slate-200 text-lime-400 print:text-slate-900 text-xs font-bold flex items-center justify-center border border-slate-700">
                          {dIdx + 1}
                        </span>
                        <span className="font-bold text-white print:text-black">
                          {d.damageType} — {d.area}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 print:text-slate-600">
                        {photos.length} {photos.length === 1 ? "foto registrada" : "fotos registradas"}
                      </span>
                    </div>

                    {d.description && (
                      <p className="text-[11px] text-slate-400 print:text-slate-600 italic pl-7">
                        "{d.description}"
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1 pl-7">
                      {photos.map((url, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative rounded-lg overflow-hidden border border-slate-700 print:border-slate-300 aspect-square group bg-black/60 shadow cursor-pointer"
                          onClick={() => setSelectedPreviewPhoto(url)}
                        >
                          <img
                            src={url}
                            alt={`Avaria ${dIdx + 1} - Foto ${pIdx + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-lime-400 print:hidden">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out print:hidden animate-in fade-in duration-200"
          >
            <div className="relative max-w-4xl max-h-[90vh] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
              <img
                src={selectedPreviewPhoto}
                alt="Foto ampliada"
                className="w-full h-full max-h-[85vh] object-contain"
              />
            </div>
          </div>
        )}

        {/* Carimbo de Confirmação & Assinatura de Entrada */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300 print:text-slate-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 print:text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-white print:text-black">
                Vistoria Validada na Recepção do Veículo
              </p>
              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Data do aceite: {formatDateTime(checklist.confirmedAt || checklist.createdAt)}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-[11px] text-slate-400 print:text-slate-600">
            Documento emitido eletronicamente pelo sistema Detailing OS.
          </div>
        </div>
      </div>
    </div>
  );
}

