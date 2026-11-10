import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ==========================================
// PALETA DE CORES INSTITUCIONAL (DetailPro)
// ==========================================
const COLORS = {
  primary: [20, 45, 38] as [number, number, number], // #142D26 - Verde Escuro
  brand: [36, 118, 83] as [number, number, number], // #247653 - Verde Principal
  accent: [22, 163, 106] as [number, number, number], // #16A36A - Verde Esmeralda
  textDark: [37, 43, 39] as [number, number, number], // #252B27 - Texto Principal
  textMuted: [115, 125, 117] as [number, number, number], // #737D75 - Texto Secundário
  bgLight: [247, 248, 246] as [number, number, number], // #F7F8F6 - Fundo de caixas
  border: [231, 234, 231] as [number, number, number], // #E7EAE7 - Bordas
  white: [255, 255, 255] as [number, number, number],
  pillBg: [233, 243, 236] as [number, number, number], // #E9F3EC
  pillText: [20, 45, 38] as [number, number, number],
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function addHeaderAndFooters(
  doc: jsPDF,
  title: string,
  tenant: any,
  metaNumber: string,
  badgeText: string
) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Barra de rodapé discreta em todas as páginas
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      "DetailPro SaaS • Gestão Profissional para Estética Automotiva & Detailing • Documento Oficial",
      14,
      pageHeight - 7
    );

    const pageStr = `Página ${i} de ${totalPages}`;
    doc.text(pageStr, pageWidth - 14 - doc.getTextWidth(pageStr), pageHeight - 7);
  }
}

// =========================================================================
// 1. GERADOR DE PDF DE PROPOSTA DE ORÇAMENTO (Commercial Budget Proposal)
// =========================================================================
export function generateBudgetPdf(order: any, options: { download?: boolean } = { download: true }) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const tenant = order.tenant || {};
  const vehicle = order.vehicle || {};
  const customer = vehicle.customer || {};
  const items = order.items || [];

  let y = 14;

  // -------------------------------------------------------------
  // CABEÇALHO DA EMPRESA & METADADOS DA PROPOSTA
  // -------------------------------------------------------------
  const companyName = tenant.tradingName || tenant.name || "DetailPro Estética Automotiva";
  const companyAddress = tenant.address || "Centro de Estética Automotiva & Detailing";
  const companyDoc = tenant.document ? `CNPJ/CPF: ${tenant.document}` : "";
  const companyContact = tenant.phone || tenant.whatsapp ? `Contato: ${tenant.phone || tenant.whatsapp}` : "";
  const contactLine = [companyDoc, companyContact].filter(Boolean).join("  •  ");

  // Nome da Empresa
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(companyName, 14, y);

  // Badge no Topo Direito (PROPOSTA DE ORÇAMENTO)
  const badgeText = "PROPOSTA DE ORÇAMENTO";
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const badgeWidth = doc.getTextWidth(badgeText) + 8;
  const badgeX = pageWidth - 14 - badgeWidth;

  doc.setFillColor(...COLORS.pillBg);
  doc.roundedRect(badgeX, y - 4.5, badgeWidth, 6.5, 1.5, 1.5, "F");
  doc.setTextColor(...COLORS.brand);
  doc.text(badgeText, badgeX + 4, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(companyAddress, 14, y);

  // Número do Orçamento
  const orderNumberStr = `#${order.orderNumber || order.id?.slice(0, 8)}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  const numWidth = doc.getTextWidth(orderNumberStr);
  doc.text(orderNumberStr, pageWidth - 14 - numWidth, y);

  y += 4.5;
  if (contactLine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(contactLine, 14, y);
  }

  // Data de Emissão
  const emissionStr = `Emissão: ${formatDate(order.createdAt)}`;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  const dateWidth = doc.getTextWidth(emissionStr);
  doc.text(emissionStr, pageWidth - 14 - dateWidth, y);

  y += 6;

  // Linha divisória de destaque verde
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(0.6);
  doc.line(14, y, pageWidth - 14, y);

  y += 6;

  // -------------------------------------------------------------
  // CARDS: DADOS DO CLIENTE & DADOS DO VEÍCULO (2 COLUNAS)
  // -------------------------------------------------------------
  const colWidth = (pageWidth - 28 - 6) / 2;
  const cardHeight = 32;

  // Card 1: Cliente
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, colWidth, cardHeight, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("DADOS DO CLIENTE", 18, y + 6);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  const custName = customer.name || "Cliente Não Informado";
  doc.text(custName.length > 28 ? custName.slice(0, 28) + "..." : custName, 18, y + 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  const custPhone = customer.whatsapp || customer.phone || "Telefone não informado";
  doc.text(`Telefone: ${custPhone}`, 18, y + 18);

  const custDoc = customer.cpfCnpj || customer.document || "CPF/CNPJ não informado";
  doc.text(`CPF/CNPJ: ${custDoc}`, 18, y + 23);

  const custEmail = customer.email || customer.address || "";
  if (custEmail) {
    doc.text(`Info: ${custEmail.length > 32 ? custEmail.slice(0, 32) + "..." : custEmail}`, 18, y + 28);
  }

  // Card 2: Veículo
  const col2X = 14 + colWidth + 6;
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(col2X, y, colWidth, cardHeight, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("DADOS DO VEÍCULO", col2X + 4, y + 6);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  const vehTitle = `${vehicle.plate || "SEM PLACA"} — ${vehicle.brand ? vehicle.brand + " " : ""}${vehicle.model || "Modelo"}`;
  doc.text(vehTitle.length > 28 ? vehTitle.slice(0, 28) + "..." : vehTitle, col2X + 4, y + 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Porte / Categoria: ${vehicle.category || "HATCH / SEDAN"}`, col2X + 4, y + 18);

  const vehDetails = [
    vehicle.color ? `Cor: ${vehicle.color}` : null,
    vehicle.year ? `Ano: ${vehicle.year}` : null,
  ].filter(Boolean).join("  •  ");
  doc.text(vehDetails || "Cor e ano não especificados", col2X + 4, y + 23);

  const vehKm = order.mileage ? `KM: ${Number(order.mileage).toLocaleString("pt-BR")} km` : "";
  if (vehKm) {
    doc.text(vehKm, col2X + 4, y + 28);
  }

  y += cardHeight + 8;

  // -------------------------------------------------------------
  // TABELA DE SERVIÇOS INCLUSOS
  // -------------------------------------------------------------
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("DISCRIMINAÇÃO DE SERVIÇOS & PRODUTOS INCLUSOS", 14, y);
  y += 3;

  const tableRows = items.map((item: any, idx: number) => [
    String(idx + 1).padStart(2, "0"),
    item.serviceName || item.service?.name || "Serviço de Detailing",
    item.quantity ? `${item.quantity}x` : "1x",
    formatCurrency(item.unitPrice || item.servicePrice || 0),
    formatCurrency(item.totalPrice || item.unitPrice || 0),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "ITEM / SERVIÇO", "QTD", "VALOR UNITÁRIO", "SUBTOTAL"]],
    body: tableRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: COLORS.textDark,
      cellPadding: 3,
      lineColor: COLORS.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 34, halign: "right", fontStyle: "bold", textColor: COLORS.brand },
    },
    alternateRowStyles: {
      fillColor: COLORS.bgLight,
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;
  y = finalY;

  // -------------------------------------------------------------
  // QUADRO DE TOTAIS (Alinhado à Direita)
  // -------------------------------------------------------------
  const summaryBoxWidth = 75;
  const summaryX = pageWidth - 14 - summaryBoxWidth;

  const subtotal = order.subtotal || order.totalAmount || 0;
  const discount = order.discount || 0;
  const total = order.totalAmount || 0;

  // Subtotal
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Subtotal:", summaryX, y);
  const subtotalStr = formatCurrency(subtotal);
  doc.text(subtotalStr, pageWidth - 14 - doc.getTextWidth(subtotalStr), y);

  y += 5;

  if (discount > 0) {
    doc.text("Desconto aplicado:", summaryX, y);
    const discStr = `- ${formatCurrency(discount)}`;
    doc.text(discStr, pageWidth - 14 - doc.getTextWidth(discStr), y);
    y += 5;
  }

  // Caixa de Destaque do Valor Total
  const totalBoxHeight = 11;
  doc.setFillColor(...COLORS.pillBg);
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryX - 4, y - 3, summaryBoxWidth + 4, totalBoxHeight, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("VALOR TOTAL:", summaryX, y + 4.5);

  const totalStr = formatCurrency(total);
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.brand);
  doc.text(totalStr, pageWidth - 14 - doc.getTextWidth(totalStr), y + 4.5);

  y += totalBoxHeight + 8;

  // -------------------------------------------------------------
  // CONDIÇÕES COMERCIAIS & OBSERVAÇÕES
  // -------------------------------------------------------------
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  const obsBoxHeight = 26;
  doc.roundedRect(14, y, pageWidth - 28, obsBoxHeight, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("CONDIÇÕES COMERCIAIS & GARANTIA DE SERVIÇO", 18, y + 5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textDark);
  doc.text(
    "• Validade da Proposta: 7 (sete) dias corridos a partir da data de emissão deste documento.",
    18,
    y + 10
  );
  doc.text(
    "• Formas de Pagamento: PIX, Cartão de Crédito/Débito em até 3x sem juros ou Dinheiro à vista.",
    18,
    y + 14.5
  );
  doc.text(
    "• Garantia: 90 dias contra defeitos de aplicação ou manchas resultantes de processos técnicos incorretos.",
    18,
    y + 19
  );
  doc.text(
    "• Recomendações: Não lavar o veículo com produtos químicos agressivos nas primeiras 72 horas pós-entrega.",
    18,
    y + 23.5
  );

  y += obsBoxHeight + 14;

  // -------------------------------------------------------------
  // CAMPOS DE ASSINATURA (CLIENTE & EMPRESA)
  // -------------------------------------------------------------
  const sigLineWidth = 75;
  const sig1X = 18;
  const sig2X = pageWidth - 14 - sigLineWidth - 4;

  // Linha 1: Cliente
  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineWidth(0.3);
  doc.line(sig1X, y, sig1X + sigLineWidth, y);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text("Aceite do Cliente", sig1X + sigLineWidth / 2, y + 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(custName, sig1X + sigLineWidth / 2, y + 8, { align: "center" });

  // Linha 2: Responsável / DetailPro
  doc.line(sig2X, y, sig2X + sigLineWidth, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text("Responsável Técnico / Estética", sig2X + sigLineWidth / 2, y + 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(companyName, sig2X + sigLineWidth / 2, y + 8, { align: "center" });

  // Adiciona rodapés profissionais
  addHeaderAndFooters(doc, "PROPOSTA DE ORÇAMENTO", tenant, orderNumberStr, badgeText);

  // Download ou Retorno
  const safeCustomer = (customer.name || "cliente").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Proposta_Orcamento_${order.orderNumber || "100"}_${safeCustomer}.pdf`;

  if (options.download) {
    doc.save(filename);
  }

  return { doc, filename };
}

// =========================================================================
// 2. GERADOR DE LAUDO DE VISTORIA VEICULAR (Inspection Report PDF)
// =========================================================================
export function generateInspectionPdf(
  checklist: any,
  options: { download?: boolean } = { download: true }
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const serviceOrder = checklist.serviceOrder || {};
  const tenant = serviceOrder.tenant || {};
  const vehicle = serviceOrder.vehicle || {};
  const customer = vehicle.customer || {};
  const damageRecords = checklist.damageRecords || [];

  let y = 14;

  // Cabeçalho da Empresa
  const companyName = tenant.tradingName || tenant.name || "DetailPro Estética Automotiva";
  const companyAddress = tenant.address || "Centro de Estética Automotiva & Detailing";
  const companyDoc = tenant.document ? `CNPJ/CPF: ${tenant.document}` : "";
  const companyContact = tenant.phone || tenant.whatsapp ? `Contato: ${tenant.phone || tenant.whatsapp}` : "";
  const contactLine = [companyDoc, companyContact].filter(Boolean).join("  •  ");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(companyName, 14, y);

  // Badge no Topo Direito (LAUDO DE VISTORIA)
  const badgeText = "LAUDO DE VISTORIA";
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const badgeWidth = doc.getTextWidth(badgeText) + 8;
  const badgeX = pageWidth - 14 - badgeWidth;

  doc.setFillColor(...COLORS.pillBg);
  doc.roundedRect(badgeX, y - 4.5, badgeWidth, 6.5, 1.5, 1.5, "F");
  doc.setTextColor(...COLORS.brand);
  doc.text(badgeText, badgeX + 4, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(companyAddress, 14, y);

  const checklistNum = `VISTORIA #${checklist.id?.slice(0, 8).toUpperCase()}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  const numWidth = doc.getTextWidth(checklistNum);
  doc.text(checklistNum, pageWidth - 14 - numWidth, y);

  y += 4.5;
  if (contactLine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(contactLine, 14, y);
  }

  const emissionStr = `Data: ${formatDate(checklist.createdAt)}`;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  const dateWidth = doc.getTextWidth(emissionStr);
  doc.text(emissionStr, pageWidth - 14 - dateWidth, y);

  y += 6;
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(0.6);
  doc.line(14, y, pageWidth - 14, y);

  y += 6;

  // Cards de Cliente e Veículo
  const colWidth = (pageWidth - 28 - 6) / 2;
  const cardHeight = 30;

  // Card Cliente
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, colWidth, cardHeight, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("CLIENTE / PROPRIETÁRIO", 18, y + 6);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  const custName = customer.name || "Cliente Não Informado";
  doc.text(custName.length > 28 ? custName.slice(0, 28) + "..." : custName, 18, y + 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Telefone: ${customer.whatsapp || customer.phone || "-"}`, 18, y + 18);
  doc.text(`CPF/CNPJ: ${customer.cpfCnpj || customer.document || "-"}`, 18, y + 23);

  // Card Veículo
  const col2X = 14 + colWidth + 6;
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(col2X, y, colWidth, cardHeight, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("VEÍCULO INSPECIONADO", col2X + 4, y + 6);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  const vehTitle = `${vehicle.plate || "SEM PLACA"} — ${vehicle.brand ? vehicle.brand + " " : ""}${vehicle.model || "Modelo"}`;
  doc.text(vehTitle.length > 28 ? vehTitle.slice(0, 28) + "..." : vehTitle, col2X + 4, y + 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Categoria: ${vehicle.category || "HATCH / SEDAN"}`, col2X + 4, y + 18);
  const kmOdometer = checklist.odometer || serviceOrder.mileage;
  doc.text(`KM Atual: ${kmOdometer ? Number(kmOdometer).toLocaleString("pt-BR") + " km" : "Não informado"}`, col2X + 4, y + 23);

  y += cardHeight + 6;

  // Caixa de Indicador de Combustível e Odômetro
  const fuelLevel = Number(checklist.fuelLevel ?? 50);
  const fuelBoxHeight = 16;
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(14, y, pageWidth - 28, fuelBoxHeight, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text("NÍVEL DE COMBUSTÍVEL NA ENTRADA:", 18, y + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.brand);
  doc.text(`${fuelLevel}%`, 80, y + 6);

  // Barra gráfica visual de combustível
  const barX = 95;
  const barY = y + 2.5;
  const barWidth = 85;
  const barHeight = 4.5;
  doc.setFillColor(220, 225, 220);
  doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, "F");

  // Barra preenchida
  const filledWidth = Math.max(2, (barWidth * Math.min(100, Math.max(0, fuelLevel))) / 100);
  doc.setFillColor(...COLORS.brand);
  doc.roundedRect(barX, barY, filledWidth, barHeight, 1, 1, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Reserva (0%)", barX, barY + barHeight + 4);
  doc.text("1/2 Tanque (50%)", barX + barWidth / 2 - 8, barY + barHeight + 4);
  doc.text("Cheio (100%)", barX + barWidth - 14, barY + barHeight + 4);

  y += fuelBoxHeight + 8;

  // -------------------------------------------------------------
  // TABELA DE AVARIAS MAPEADAS (Riscos, Amassados, Manchas)
  // -------------------------------------------------------------
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("MAPA DE AVARIAS E OBSERVAÇÕES DE ENTRADA", 14, y);
  y += 3;

  if (damageRecords.length === 0) {
    autoTable(doc, {
      startY: y,
      head: [["STATUS DA VISTORIA"]],
      body: [
        [
          "Nenhuma avaria preexistente, risco ou amassado foi apontado na inspeção física de entrada. O veículo foi entregue em bom estado geral de lataria e acabamentos.",
        ],
      ],
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        textColor: COLORS.textDark,
        cellPadding: 4,
        lineColor: COLORS.border,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    const damageRows = damageRecords.map((d: any, idx: number) => {
      let areaLabel = d.area || "Geral";
      if (areaLabel === "FRONT") areaLabel = "Dianteira / Capô";
      if (areaLabel === "REAR") areaLabel = "Traseira / Porta-Malas";
      if (areaLabel === "LEFT") areaLabel = "Lateral Esquerda";
      if (areaLabel === "RIGHT") areaLabel = "Lateral Direita";
      if (areaLabel === "ROOF") areaLabel = "Teto";

      let typeLabel = d.damageType || "Risco";
      if (typeLabel === "SCRATCH") typeLabel = "Risco / Arranhão";
      if (typeLabel === "DENT") typeLabel = "Amassado / Pique";
      if (typeLabel === "STAIN") typeLabel = "Mancha / Desgaste";
      if (typeLabel === "CRACK") typeLabel = "Trinca / Quebrado";

      return [
        String(idx + 1).padStart(2, "0"),
        areaLabel,
        typeLabel,
        d.description || "Avaria identificada durante a vistoria física inicial",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["#", "ÁREA DO VEÍCULO", "TIPO DE AVARIA", "DESCRIÇÃO / DETALHES"]],
      body: damageRows,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8,
        textColor: COLORS.textDark,
        cellPadding: 3,
        lineColor: COLORS.border,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 35, halign: "left", fontStyle: "bold" },
        2: { cellWidth: 35, halign: "left" },
        3: { cellWidth: "auto", halign: "left" },
      },
      alternateRowStyles: {
        fillColor: COLORS.bgLight,
      },
      margin: { left: 14, right: 14 },
    });
  }

  y = (doc as any).lastAutoTable.finalY + 8;

  // Termo de Responsabilidade
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  const termHeight = 22;
  doc.roundedRect(14, y, pageWidth - 28, termHeight, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("DECLARAÇÃO DE CONFERÊNCIA E ENTREGA DO VEÍCULO", 18, y + 5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textDark);
  doc.text(
    "Declaro para os devidos fins que o veículo acima discriminado foi entregue no estabelecimento nas condições",
    18,
    y + 10
  );
  doc.text(
    "relatadas neste laudo de vistoria de entrada. Autorizo a execução dos serviços contratados conforme ordem de serviço.",
    18,
    y + 14.5
  );
  doc.text(
    "Não deixei no interior do veículo objetos de alto valor não declarados à gerência da empresa.",
    18,
    y + 19
  );

  y += termHeight + 14;

  // Assinaturas
  const sigLineWidth = 75;
  const sig1X = 18;
  const sig2X = pageWidth - 14 - sigLineWidth - 4;

  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineWidth(0.3);
  doc.line(sig1X, y, sig1X + sigLineWidth, y);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text("Assinatura do Proprietário / Condutor", sig1X + sigLineWidth / 2, y + 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(custName, sig1X + sigLineWidth / 2, y + 8, { align: "center" });

  doc.line(sig2X, y, sig2X + sigLineWidth, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text("Vistoriador Responsável", sig2X + sigLineWidth / 2, y + 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  const inspectorName = serviceOrder.assignedUser?.name || "DetailPro Vistorias";
  doc.text(inspectorName, sig2X + sigLineWidth / 2, y + 8, { align: "center" });

  addHeaderAndFooters(doc, "LAUDO DE VISTORIA", tenant, checklistNum, badgeText);

  const safePlate = (vehicle.plate || "placa").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Laudo_Vistoria_${safePlate}.pdf`;

  if (options.download) {
    doc.save(filename);
  }

  return { doc, filename };
}

// =========================================================================
// 3. GERADOR DE ORDEM DE SERVIÇO (Work Order PDF)
// =========================================================================
export function generateServiceOrderPdf(
  order: any,
  options: { download?: boolean } = { download: true }
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const tenant = order.tenant || {};
  const vehicle = order.vehicle || {};
  const customer = vehicle.customer || {};
  const items = order.items || [];

  let y = 14;

  const companyName = tenant.tradingName || tenant.name || "DetailPro Estética Automotiva";
  const companyAddress = tenant.address || "Centro de Estética Automotiva & Detailing";
  const companyDoc = tenant.document ? `CNPJ/CPF: ${tenant.document}` : "";
  const companyContact = tenant.phone || tenant.whatsapp ? `Contato: ${tenant.phone || tenant.whatsapp}` : "";
  const contactLine = [companyDoc, companyContact].filter(Boolean).join("  •  ");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(companyName, 14, y);

  const badgeText = "ORDEM DE SERVIÇO";
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const badgeWidth = doc.getTextWidth(badgeText) + 8;
  const badgeX = pageWidth - 14 - badgeWidth;

  doc.setFillColor(...COLORS.pillBg);
  doc.roundedRect(badgeX, y - 4.5, badgeWidth, 6.5, 1.5, 1.5, "F");
  doc.setTextColor(...COLORS.brand);
  doc.text(badgeText, badgeX + 4, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(companyAddress, 14, y);

  const orderNum = `OS #${order.orderNumber || order.id?.slice(0, 8)}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  const numWidth = doc.getTextWidth(orderNum);
  doc.text(orderNum, pageWidth - 14 - numWidth, y);

  y += 4.5;
  if (contactLine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(contactLine, 14, y);
  }

  const emissionStr = `Abertura: ${formatDate(order.createdAt)}`;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  const dateWidth = doc.getTextWidth(emissionStr);
  doc.text(emissionStr, pageWidth - 14 - dateWidth, y);

  y += 6;
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(0.6);
  doc.line(14, y, pageWidth - 14, y);

  y += 6;

  // Box 3 cards: Cliente, Veículo, Operacional
  const colWidth = (pageWidth - 28 - 6) / 2;
  const cardHeight = 32;

  // Card Cliente
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, colWidth, cardHeight, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("CLIENTE / CONTATO", 18, y + 6);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  const custName = customer.name || "Cliente Não Informado";
  doc.text(custName.length > 28 ? custName.slice(0, 28) + "..." : custName, 18, y + 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Telefone: ${customer.whatsapp || customer.phone || "-"}`, 18, y + 18);
  doc.text(`CPF/CNPJ: ${customer.cpfCnpj || customer.document || "-"}`, 18, y + 23);

  // Card Veículo & Operação
  const col2X = 14 + colWidth + 6;
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(col2X, y, colWidth, cardHeight, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("VEÍCULO & ALOCAÇÃO", col2X + 4, y + 6);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  const vehTitle = `${vehicle.plate || "SEM PLACA"} — ${vehicle.brand ? vehicle.brand + " " : ""}${vehicle.model || "Modelo"}`;
  doc.text(vehTitle.length > 28 ? vehTitle.slice(0, 28) + "..." : vehTitle, col2X + 4, y + 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Box Alocado: ${order.box || "Pátio Geral"}`, col2X + 4, y + 18);
  const colabName = order.assignedUser?.name || "Equipe Geral";
  doc.text(`Responsável: ${colabName}`, col2X + 4, y + 23);

  y += cardHeight + 8;

  // Tabela de Serviços da OS
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("SERVIÇOS EM EXECUÇÃO / DETALHAMENTO", 14, y);
  y += 3;

  const tableRows = items.map((item: any, idx: number) => [
    String(idx + 1).padStart(2, "0"),
    item.serviceName || item.service?.name || "Serviço de Estética",
    item.completed ? "Concluído" : "Em Execução",
    item.quantity ? `${item.quantity}x` : "1x",
    formatCurrency(item.unitPrice || 0),
    formatCurrency(item.totalPrice || item.unitPrice || 0),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "SERVIÇO", "STATUS", "QTD", "VALOR UNIT.", "SUBTOTAL"]],
    body: tableRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: COLORS.textDark,
      cellPadding: 3,
      lineColor: COLORS.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 26, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 30, halign: "right", fontStyle: "bold", textColor: COLORS.brand },
    },
    alternateRowStyles: {
      fillColor: COLORS.bgLight,
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;
  y = finalY;

  // Quadro Financeiro da OS
  const summaryBoxWidth = 80;
  const summaryX = pageWidth - 14 - summaryBoxWidth;

  const total = order.totalAmount || 0;
  const paid = order.paidAmount || 0;
  const remaining = Math.max(0, total - paid);

  const totalBoxHeight = 18;
  doc.setFillColor(...COLORS.pillBg);
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryX - 4, y - 3, summaryBoxWidth + 4, totalBoxHeight, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textDark);
  doc.text("Valor Total:", summaryX, y + 2);
  const totalStr = formatCurrency(total);
  doc.setFont("helvetica", "bold");
  doc.text(totalStr, pageWidth - 14 - doc.getTextWidth(totalStr), y + 2);

  doc.setFont("helvetica", "normal");
  doc.text("Valor Pago:", summaryX, y + 7);
  const paidStr = formatCurrency(paid);
  doc.text(paidStr, pageWidth - 14 - doc.getTextWidth(paidStr), y + 7);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Saldo a Pagar:", summaryX, y + 12);
  const remStr = formatCurrency(remaining);
  doc.setTextColor(...COLORS.brand);
  doc.text(remStr, pageWidth - 14 - doc.getTextWidth(remStr), y + 12);

  y += totalBoxHeight + 8;

  // Observações
  if (order.notes) {
    doc.setFillColor(...COLORS.bgLight);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, "FD");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text("OBSERVAÇÕES DA ORDEM DE SERVIÇO:", 18, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textDark);
    doc.text(order.notes.slice(0, 140), 18, y + 9.5);
    y += 18;
  }

  // Assinaturas de Entrega e Retirada
  y += 4;
  const sigLineWidth = 75;
  const sig1X = 18;
  const sig2X = pageWidth - 14 - sigLineWidth - 4;

  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineWidth(0.3);
  doc.line(sig1X, y, sig1X + sigLineWidth, y);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text("Retirada / Conferência do Cliente", sig1X + sigLineWidth / 2, y + 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(custName, sig1X + sigLineWidth / 2, y + 8, { align: "center" });

  doc.line(sig2X, y, sig2X + sigLineWidth, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.textDark);
  doc.text("Responsável Técnico pela Entrega", sig2X + sigLineWidth / 2, y + 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text(companyName, sig2X + sigLineWidth / 2, y + 8, { align: "center" });

  addHeaderAndFooters(doc, "ORDEM DE SERVIÇO", tenant, orderNum, badgeText);

  const safeCustomer = (customer.name || "cliente").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Ordem_Servico_${order.orderNumber || "100"}_${safeCustomer}.pdf`;

  if (options.download) {
    doc.save(filename);
  }

  return { doc, filename };
}
