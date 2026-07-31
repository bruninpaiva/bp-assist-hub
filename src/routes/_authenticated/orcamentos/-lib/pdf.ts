import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoAsset from "@/assets/bp-info-logo.png";
import { brl, dataCurta, numero as formatNumero } from "@/lib/format";
import { maskCNPJ, maskTelefone } from "@/lib/masks";
import { statusOrcamentoLabels, tipoItemOrcamentoLabels } from "@/lib/labels";
import { equipamentoLabel } from "./schema";
import type { Database } from "@/integrations/supabase/types";
import type { StatusOrcamento, TipoEquipamento, TipoItemOrcamento } from "@/types/domain";

type Empresa = Database["public"]["Tables"]["empresa"]["Row"];

export interface OrcamentoPdfData {
  numero: number;
  ano: number;
  status: StatusOrcamento;
  dataEmissao: string;
  validadeDias: number;
  observacoes: string | null;
  subtotal: number;
  desconto: number;
  total: number;
  osNumero: string | null;
  cliente: { nome: string } | null;
  equipamento: {
    tipo: TipoEquipamento;
    marca: string | null;
    modelo: string | null;
    numero_serie: string | null;
  } | null;
  itens: {
    tipo: TipoItemOrcamento;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    desconto: number;
    subtotal: number | null;
  }[];
  empresa: Empresa | null;
}

const AZUL_MARCA: [number, number, number] = [48, 100, 234];
const NAVY_MARCA: [number, number, number] = [15, 23, 43];
const CINZA_TEXTO: [number, number, number] = [90, 97, 112];

function carregarImagemComoDataUrl(url: string): Promise<{ dataUrl: string; ratio: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível preparar a logo para o PDF"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        ratio: img.naturalWidth / img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error("Não foi possível carregar a logo"));
    img.src = url;
  });
}

function enderecoEmpresa(empresa: Empresa | null): string | null {
  if (!empresa) return null;
  const linha1 = [empresa.endereco, empresa.numero].filter(Boolean).join(", ");
  const linha2 = [empresa.bairro, empresa.cidade, empresa.uf].filter(Boolean).join(" - ");
  return [linha1, linha2].filter(Boolean).join(" · ") || null;
}

export async function gerarOrcamentoPdfBlob(data: OrcamentoPdfData): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const margem = 14;
  let y = 16;

  const logoUrl = data.empresa?.logo_url || (logoAsset as string);
  try {
    const { dataUrl, ratio } = await carregarImagemComoDataUrl(logoUrl);
    const altura = 16;
    doc.addImage(dataUrl, "PNG", margem, y, altura * ratio, altura);
  } catch {
    // Segue sem a logo caso a imagem não possa ser carregada (ex.: sem rede).
  }

  doc.setTextColor(...NAVY_MARCA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(data.empresa?.nome_fantasia || "BP Info", largura - margem, y + 4, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...CINZA_TEXTO);
  const linhasEmpresa = [
    data.empresa?.cnpj ? `CNPJ ${maskCNPJ(data.empresa.cnpj)}` : null,
    data.empresa?.telefone
      ? maskTelefone(data.empresa.telefone)
      : data.empresa?.whatsapp
        ? maskTelefone(data.empresa.whatsapp)
        : null,
    data.empresa?.email,
    enderecoEmpresa(data.empresa),
  ].filter((linha): linha is string => Boolean(linha));
  linhasEmpresa.forEach((linha, i) => {
    doc.text(linha, largura - margem, y + 9 + i * 4, { align: "right" });
  });

  y += 26;
  doc.setDrawColor(...AZUL_MARCA);
  doc.setLineWidth(0.6);
  doc.line(margem, y, largura - margem, y);
  y += 8;

  doc.setTextColor(...NAVY_MARCA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Orçamento nº ${data.numero}/${data.ano}`, margem, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...CINZA_TEXTO);
  doc.text(`Status: ${statusOrcamentoLabels[data.status].label}`, largura - margem, y, {
    align: "right",
  });

  y += 10;

  const equipamentoTexto = data.equipamento
    ? [
        equipamentoLabel(data.equipamento),
        data.equipamento.numero_serie ? `Série ${data.equipamento.numero_serie}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "—";

  const infoLinhas: [string, string][] = [
    ["Cliente", data.cliente?.nome ?? "—"],
    ["Equipamento", equipamentoTexto],
    ["Ordem de serviço", data.osNumero ?? "—"],
    ["Emitido em", dataCurta(data.dataEmissao)],
    ["Validade", `${data.validadeDias} dias`],
  ];

  doc.setFontSize(10);
  infoLinhas.forEach(([label, valor]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY_MARCA);
    doc.text(`${label}:`, margem, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...CINZA_TEXTO);
    doc.text(valor, margem + 32, y);
    y += 5.5;
  });

  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    head: [["Tipo", "Descrição", "Qtde.", "Valor unit.", "Desconto", "Subtotal"]],
    body: data.itens.map((item) => [
      tipoItemOrcamentoLabels[item.tipo],
      item.descricao,
      formatNumero(item.quantidade, 2),
      brl(item.valor_unitario),
      brl(item.desconto),
      brl(item.subtotal ?? item.quantidade * item.valor_unitario - item.desconto),
    ]),
    headStyles: { fillColor: NAVY_MARCA, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, textColor: CINZA_TEXTO },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  const { finalY } = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  y = finalY + 10;

  const totaisX = largura - margem;
  const totaisLinhas: [string, string][] = [
    ["Subtotal", brl(data.subtotal)],
    ["Desconto", brl(data.desconto)],
  ];
  doc.setFontSize(10);
  totaisLinhas.forEach(([label, valor]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...CINZA_TEXTO);
    doc.text(label, totaisX - 40, y);
    doc.text(valor, totaisX, y, { align: "right" });
    y += 5.5;
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY_MARCA);
  doc.text("Total", totaisX - 40, y);
  doc.text(brl(data.total), totaisX, y, { align: "right" });
  y += 10;

  if (data.observacoes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY_MARCA);
    doc.text("Observações", margem, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...CINZA_TEXTO);
    const linhas = doc.splitTextToSize(data.observacoes, largura - margem * 2);
    doc.text(linhas, margem, y);
  }

  const rodapeY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setTextColor(...CINZA_TEXTO);
  doc.text(
    `${data.empresa?.nome_fantasia || "BP Info"} · Documento gerado em ${dataCurta(new Date().toISOString())}`,
    margem,
    rodapeY,
  );

  return doc.output("blob");
}
