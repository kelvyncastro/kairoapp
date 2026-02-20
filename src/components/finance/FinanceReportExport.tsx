import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Table2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sector {
  id: string;
  name: string;
  color_label: string;
  icon: string;
}

interface Transaction {
  id: string;
  name: string;
  date: string;
  value: number;
  sector_id: string | null;
  description: string | null;
  status: string;
}

interface FinanceReportExportProps {
  transactions: Transaction[];
  sectors: Sector[];
  currentMonth: Date;
  income: number;
  expenses: number;
  balance: number;
}

export function FinanceReportExport({
  transactions,
  sectors,
  currentMonth,
  income,
  expenses,
  balance,
}: FinanceReportExportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getSectorName = (sectorId: string | null) => {
    if (!sectorId) return "Sem categoria";
    return sectors.find((s) => s.id === sectorId)?.name || "Sem categoria";
  };

  const getStatusLabel = (status: string, value: number) => {
    if (value > 0) return "Recebido";
    switch (status) {
      case "paid": return "Pago";
      case "pending": return "A pagar";
      case "to_receive": return "A receber";
      case "received": return "Recebido";
      default: return "Pago";
    }
  };

  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: ptBR });
  const monthLabelCapitalized = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const formatCurrency = (value: number) =>
    `R$ ${Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ─── CSV Export ───
  const exportCSV = () => {
    const headers = ["Data", "Descrição", "Categoria", "Valor", "Tipo", "Status"];
    const rows = transactions.map((t) => [
      format(new Date(t.date + "T12:00:00"), "dd/MM/yyyy"),
      t.name,
      getSectorName(t.sector_id),
      Math.abs(t.value).toFixed(2).replace(".", ","),
      t.value > 0 ? "Receita" : "Despesa",
      getStatusLabel(t.status, t.value),
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-financas-${format(currentMonth, "yyyy-MM")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado com sucesso!" });
  };

  // ─── PDF Export ───
  const exportPDF = async () => {
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // ─── Header ───
      doc.setFillColor(15, 15, 20);
      doc.rect(0, 0, pageWidth, 45, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Financeiro", margin, 20);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(monthLabelCapitalized, margin, 30);
      
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, 38);

      y = 55;

      // ─── Summary Cards ───
      doc.setTextColor(60, 60, 60);
      const cardWidth = (contentWidth - 10) / 3;
      const cards = [
        { label: "Ganhos", value: formatCurrency(income), color: [34, 197, 94] as [number, number, number] },
        { label: "Gastos", value: formatCurrency(expenses), color: [239, 68, 68] as [number, number, number] },
        { label: "Sobra", value: formatCurrency(balance), color: balance >= 0 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
      ];

      cards.forEach((card, i) => {
        const x = margin + i * (cardWidth + 5);
        
        // Card background
        doc.setFillColor(248, 248, 250);
        doc.roundedRect(x, y, cardWidth, 28, 3, 3, "F");
        
        // Left color bar
        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.rect(x, y, 3, 28, "F");
        
        // Label
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text(card.label, x + 8, y + 10);
        
        // Value
        doc.setFontSize(14);
        doc.setTextColor(card.color[0], card.color[1], card.color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(card.value, x + 8, y + 22);
      });

      y += 38;

      // ─── Expenses by Sector ───
      const expensesBySector = sectors
        .map((sector) => {
          const total = transactions
            .filter((t) => t.sector_id === sector.id && t.value < 0)
            .reduce((sum, t) => sum + Math.abs(t.value), 0);
          return { name: sector.name, total, color: sector.color_label };
        })
        .filter((s) => s.total > 0)
        .sort((a, b) => b.total - a.total);

      if (expensesBySector.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text("Gastos por Categoria", margin, y);
        y += 8;

        const totalExp = expensesBySector.reduce((s, e) => s + e.total, 0);
        const barMaxWidth = contentWidth - 60;

        expensesBySector.forEach((sector) => {
          if (y > 260) {
            doc.addPage();
            y = margin;
          }

          const pct = totalExp > 0 ? (sector.total / totalExp) * 100 : 0;
          const barWidth = (pct / 100) * barMaxWidth;

          // Sector name
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.setFont("helvetica", "normal");
          doc.text(sector.name, margin, y + 4);

          // Bar background
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(margin + 45, y, barMaxWidth, 6, 2, 2, "F");

          // Bar fill
          const hex = sector.color;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          doc.setFillColor(r, g, b);
          if (barWidth > 0) {
            doc.roundedRect(margin + 45, y, Math.max(barWidth, 4), 6, 2, 2, "F");
          }

          // Value + percentage
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const valueText = `${formatCurrency(sector.total)} (${pct.toFixed(0)}%)`;
          doc.text(valueText, margin + 45 + barMaxWidth + 2, y + 4);

          y += 10;
        });

        y += 5;
      }

      // ─── Daily Expenses ───
      const dailyMap = new Map<string, number>();
      transactions
        .filter((t) => t.value < 0)
        .forEach((t) => {
          const day = format(new Date(t.date + "T12:00:00"), "dd");
          dailyMap.set(day, (dailyMap.get(day) || 0) + Math.abs(t.value));
        });

      if (dailyMap.size > 0) {
        if (y > 230) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text("Gastos Diários", margin, y);
        y += 8;

        const sortedDays = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const maxVal = Math.max(...sortedDays.map(([, v]) => v), 1);
        const chartHeight = 35;
        const barAreaWidth = contentWidth;
        const barGap = 1;
        const barW = Math.min((barAreaWidth - sortedDays.length * barGap) / sortedDays.length, 8);

        sortedDays.forEach(([day, value], i) => {
          const barH = (value / maxVal) * chartHeight;
          const x = margin + i * (barW + barGap);

          // Bar
          doc.setFillColor(99, 102, 241);
          doc.roundedRect(x, y + chartHeight - barH, barW, barH, 1, 1, "F");

          // Day label
          if (sortedDays.length <= 15 || i % 2 === 0) {
            doc.setFontSize(6);
            doc.setTextColor(150, 150, 150);
            doc.text(day, x + barW / 2, y + chartHeight + 5, { align: "center" });
          }
        });

        y += chartHeight + 12;
      }

      // ─── Investments Summary ───
      const investmentSector = sectors.find(
        (s) => s.name.toLowerCase().includes("investimento") || s.name.toLowerCase().includes("investment")
      );
      if (investmentSector) {
        const investmentTotal = transactions
          .filter((t) => t.sector_id === investmentSector.id && t.value < 0)
          .reduce((sum, t) => sum + Math.abs(t.value), 0);

        if (investmentTotal > 0) {
          if (y > 250) {
            doc.addPage();
            y = margin;
          }

          doc.setFontSize(13);
          doc.setTextColor(30, 30, 30);
          doc.setFont("helvetica", "bold");
          doc.text("Investimentos do Mês", margin, y);
          y += 8;

          doc.setFillColor(248, 248, 250);
          doc.roundedRect(margin, y, contentWidth, 16, 3, 3, "F");
          doc.setFillColor(16, 185, 129);
          doc.rect(margin, y, 3, 16, "F");

          doc.setFontSize(9);
          doc.setTextColor(120, 120, 120);
          doc.text("Total investido este mês", margin + 8, y + 6);
          doc.setFontSize(13);
          doc.setTextColor(16, 185, 129);
          doc.setFont("helvetica", "bold");
          doc.text(formatCurrency(investmentTotal), margin + 8, y + 13);

          y += 22;
        }
      }

      // ─── Transactions Table ───
      if (y > 230) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("Todas as Transações", margin, y);
      y += 4;

      const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const tableData = sortedTransactions.map((t) => [
        format(new Date(t.date + "T12:00:00"), "dd/MM"),
        t.name,
        getSectorName(t.sector_id),
        `${t.value > 0 ? "+" : "-"} ${formatCurrency(t.value)}`,
        getStatusLabel(t.status, t.value),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Data", "Descrição", "Categoria", "Valor", "Status"]],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [230, 230, 230],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [30, 30, 35],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 250],
        },
        columnStyles: {
          0: { cellWidth: 18 },
          3: { halign: "right", fontStyle: "bold" },
          4: { cellWidth: 22 },
        },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 3) {
            const val = data.cell.raw as string;
            if (val.startsWith("+")) {
              data.cell.styles.textColor = [34, 197, 94];
            } else {
              data.cell.styles.textColor = [60, 60, 60];
            }
          }
        },
      });

      // ─── Footer ───
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(
          `Kairo • Relatório Financeiro • Página ${i}/${pageCount}`,
          pageWidth / 2,
          pageH - 8,
          { align: "center" }
        );
      }

      doc.save(`relatorio-financas-${format(currentMonth, "yyyy-MM")}.pdf`);
      toast({ title: "PDF exportado com sucesso!" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 md:h-9 md:w-9"
          disabled={loading}
          title="Baixar Relatório"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          <span>Exportar PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV} className="gap-2 cursor-pointer">
          <Table2 className="h-4 w-4" />
          <span>Exportar CSV</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
