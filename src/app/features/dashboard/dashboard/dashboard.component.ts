

// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddExpenseModalComponent } from '../add-expense-modal/add-expense-modal.component';
import { BudgetService } from 'src/app/core/services/budget.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SocketService } from 'src/app/core/services/socket.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AiSummaryModalComponent } from '../ai-summary-modal/ai-summary-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    private dialog: MatDialog,
    private budget: BudgetService,
    private user: AuthService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  userName = "";
  userEmail = "";
  /** From API; used with email for expense eligibility (same rules as backend). */
  userMobile = "";
  userBudget = 0;
  usedPercent = 0;
  userExpense = 0;
  remainsBudget = 0;
  warning = '';

  selectedDeleteIndex: number | null = null;
  selectedExpenseId: number | null = null;
  selectedNote: string | null = null;
  totalRecords = 0;
  selectedSort: string = 'latest';

  /** Original donut: categories on current table page + inner spent vs remaining. */
  private expenseChart: Chart<any, any, any> | null = null;
  private chartRendering = false;

  /** Simple vertical bars: total spent per category (all time), styled with bold outlines. */
  spentBarVisible = false;
  private spentByCategoryChart: Chart<any, any, any> | null = null;

  /** Per-category totals for the spent bar chart (includes budget-share fields when monthly budget is set). */
  categoryChartSlices: {
    category: string;
    budgetShare: number;
    spent: number;
    remaining: number;
    overShare: boolean;
  }[] = [];


  displayedColumns: string[] = [
    'title', 'amount', 'category', 'date',
    'payment', 'notes', 'update', 'delete','receipt','vendor'
  ];

  /**
   * Build absolute URL for uploaded receipts (paths from API are usually relative).
   * Uses the same origin as `environment.apiUrl` without the `/api/v1` suffix.
   */
  receiptHref(url: string | null | undefined): string | null {
    if (url == null || url === '') {
      return null;
    }
    const s = String(url).trim();
    if (!s) {
      return null;
    }
    if (/^https?:\/\//i.test(s)) {
      return s;
    }
    const api = environment.apiUrl || '';
    const origin = api.replace(/\/api\/v1\/?$/i, '');
    const path = s.startsWith('/') ? s : `/${s}`;
    return origin ? `${origin}${path}` : path;
  }

  selectedCategory: string = '';
categoryList: string[] = [];


  categories: any[] = [];
  tableDataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // ================= USER =================
  getUserdetails() {
    this.user.getUserDetails().subscribe({
      next: (userDetails: any) => {
        const u = userDetails?.user;
        this.userName = u?.name ?? '';
        this.userEmail = u?.email ?? '';
        this.userMobile = u?.mobile ?? '';
        console.log('User details fetched successfully', this.userName, this.userEmail);
      }
    });
  }

  // ================= BUDGET =================
  getCurrentBudget() {
    this.budget.getCurrentBudget().subscribe({
      next: (res: any) => {
        this.userBudget = Number(res.amount_limit);
        this.remaining();
        this.refreshCategoryBarChart();
        setTimeout(() => this.renderChart(), 120);
      }
    });
  }

  // ================= EXPENSE =================
  getCurrentExpense() {
    this.budget.getTotalExpense().subscribe({
      next: (res: any) => {
        this.userExpense = Number(res.totalExpense);
        this.remaining();
        this.refreshCategoryBarChart();
        setTimeout(() => this.renderChart(), 120);
      }
    });
  }

  remaining() {
    this.remainsBudget = this.userBudget - this.userExpense;
  }

  private destroySpentBarChart(): void {
    if (this.spentByCategoryChart) {
      this.spentByCategoryChart.destroy();
      this.spentByCategoryChart = null;
    }
  }

  /** Infographic-style stacked gauge: gray = unused budget headroom, gradient fill = spent (capped at share), red = over; % inside fill. */
  private renderSpentBarChart(): void {
    this.destroySpentBarChart();
    const canvas = document.getElementById(
      'spentByCategoryBar'
    ) as HTMLCanvasElement | null;
    if (!canvas || this.categoryChartSlices.length === 0) {
      return;
    }

    const isDark = document.body.classList.contains('dark-theme');
    const labels = this.categoryChartSlices.map((s) => s.category);
    const spentList = this.categoryChartSlices.map((s) => s.spent);
    const budgetList = this.categoryChartSlices.map((s) => s.budgetShare);
    const n = labels.length;
    const hasBudget = this.userBudget > 0 && budgetList.some((b) => b > 0);

    const gradFill = (i: number) => {
      const t = n <= 1 ? 0 : i / (n - 1);
      const r1 = 110;
      const g1 = 196;
      const b1 = 186;
      const r2 = 30;
      const g2 = 58;
      const b2 = 112;
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `rgb(${r},${g},${b})`;
    };
    const fillColors = labels.map((_, i) => gradFill(i));
    const capR = 16;
    const trackGray = isDark ? '#475569' : '#e8ecf0';
    const overRed = '#b91c1c';

    const chartPanelBg = {
      id: 'gaugeChartPanelBg',
      beforeDraw(chart: any) {
        const { ctx, chartArea } = chart;
        if (!chartArea) {
          return;
        }
        ctx.save();
        ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
        ctx.fillRect(
          chartArea.left,
          chartArea.top,
          chartArea.width,
          chartArea.height
        );
        ctx.restore();
      }
    };

    const gridLine = isDark ? 'rgba(255,255,255,0.12)' : '#f1f5f9';
    const tickColor = isDark ? '#e2e8f0' : '#1e293b';
    const axisBorder = isDark ? '#64748b' : '#e2e8f0';

    if (!hasBudget) {
      const inBarAmt = {
        id: 'inBarAmtNoBudget',
        afterDatasetsDraw(chart: any) {
          const meta = chart.getDatasetMeta(0);
          if (!meta?.data?.length) {
            return;
          }
          const ctx = chart.ctx;
          (chart.data.datasets[0].data as number[]).forEach((raw, i) => {
            const bar = meta.data[i];
            if (!bar || !raw || raw <= 0) {
              return;
            }
            const { x, y, base } = bar.getProps(['x', 'y', 'base'], true);
            const h = base - y;
            if (h < 18) {
              return;
            }
            const text = '₹' + Number(raw).toLocaleString('en-IN');
            ctx.save();
            ctx.font = '600 11px system-ui, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const ty = y + h * 0.32;
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.fillText(text, x, ty);
            ctx.restore();
          });
        }
      };

      this.spentByCategoryChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Spent',
              data: spentList,
              backgroundColor: fillColors,
              borderRadius: capR,
              borderSkipped: false,
              maxBarThickness: 46
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 14, left: 6, right: 10 } },
          datasets: { bar: { categoryPercentage: 0.68, barPercentage: 0.82 } },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Spent by category',
              font: { size: 15, weight: '600' },
              color: tickColor,
              padding: { bottom: 6, top: 2 }
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) =>
                  ` ₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`
              }
            }
          },
          scales: {
            x: {
              stacked: false,
              grid: { display: false },
              ticks: { color: tickColor, font: { size: 11 } },
              border: { color: axisBorder }
            },
            y: {
              beginAtZero: true,
              grid: { color: gridLine },
              ticks: {
                color: tickColor,
                callback: (v: string | number) =>
                  '₹' + Number(v).toLocaleString('en-IN')
              },
              border: { color: axisBorder }
            }
          }
        },
        plugins: [chartPanelBg, inBarAmt]
      } as any);
      return;
    }

    const fillSeg: number[] = [];
    const trackSeg: number[] = [];
    const overSeg: number[] = [];
    spentList.forEach((s, i) => {
      const b = budgetList[i];
      if (b <= 0) {
        fillSeg.push(s);
        trackSeg.push(0);
        overSeg.push(0);
        return;
      }
      if (s <= b) {
        fillSeg.push(s);
        trackSeg.push(b - s);
        overSeg.push(0);
      } else {
        fillSeg.push(b);
        trackSeg.push(0);
        overSeg.push(s - b);
      }
    });

    const hasOver = overSeg.some((v) => v > 0);

    const datasets: any[] = [
      {
        label: 'Spent',
        data: fillSeg,
        backgroundColor: fillColors,
        borderRadius: {
          topLeft: 0,
          topRight: 0,
          bottomLeft: capR,
          bottomRight: capR
        },
        borderSkipped: false,
        maxBarThickness: 42,
        stack: 'stack0'
      },
      {
        label: 'Budget headroom',
        data: trackSeg,
        backgroundColor: trackGray,
        borderRadius: {
          topLeft: capR,
          topRight: capR,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        maxBarThickness: 42,
        stack: 'stack0'
      }
    ];

    if (hasOver) {
      datasets.push({
        label: 'Over budget',
        data: overSeg,
        backgroundColor: overRed,
        borderRadius: {
          topLeft: capR,
          topRight: capR,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        maxBarThickness: 42,
        stack: 'stack0'
      });
    }

    const pctInFill = {
      id: 'pctInGaugeFill',
      afterDatasetsDraw(chart: any) {
        const meta0 = chart.getDatasetMeta(0);
        if (!meta0?.data?.length) {
          return;
        }
        const ctx = chart.ctx;
        meta0.data.forEach((bar: any, i: number) => {
          const s = spentList[i];
          const b = budgetList[i];
          if (!s || b <= 0) {
            return;
          }
          const pct = Math.min(999, Math.round((s / b) * 100));
          const text = pct + '%';
          const { x, y, base } = bar.getProps(['x', 'y', 'base'], true);
          const h = base - y;
          if (h < 16) {
            return;
          }
          ctx.save();
          ctx.font = '600 12px system-ui, "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,255,255,0.96)';
          ctx.fillText(text, x, y + h * 0.36);
          ctx.restore();
        });
      }
    };

    this.spentByCategoryChart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 14, left: 4, right: 8 } },
        interaction: { mode: 'index', intersect: false },
        datasets: { bar: { categoryPercentage: 0.66, barPercentage: 0.8 } },
        plugins: {
          legend: {
            display: true,
            position: 'left',
            align: 'center',
            labels: {
              color: tickColor,
              usePointStyle: true,
              pointStyle: 'rect',
              padding: 12,
              font: { size: 11 },
              generateLabels: (ch: any) => {
                const out: any[] = [];
                labels.forEach((cat, i) => {
                  out.push({
                    text: `${i + 1}  ${cat}`,
                    fillStyle: fillColors[i],
                    strokeStyle: '#ffffff',
                    lineWidth: 1,
                    hidden: false,
                    datasetIndex: 0,
                    index: i
                  });
                });
                out.push({
                  text: 'Headroom (unused share)',
                  fillStyle: trackGray,
                  hidden: false,
                  datasetIndex: 1,
                  index: 0
                });
                if (hasOver) {
                  out.push({
                    text: 'Over budget',
                    fillStyle: overRed,
                    hidden: false,
                    datasetIndex: 2,
                    index: 0
                  });
                }
                return out;
              }
            },
            onClick: () => {
              /* keep legend static */
            }
          },
          title: {
            display: true,
            text: 'Budget vs spent (stacked gauge)',
            font: { size: 15, weight: '600' },
            color: tickColor,
            padding: { bottom: 6, top: 2 }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const v = Number(ctx.parsed.y);
                if (!v) {
                  return '';
                }
                const names = ['Spent (in share)', 'Headroom', 'Over budget'];
                return ` ${names[ctx.datasetIndex] ?? '—'}: ₹${v.toLocaleString(
                  'en-IN'
                )}`;
              },
              afterBody: (items: any[]) => {
                if (!items?.length) {
                  return '';
                }
                const i = items[0].dataIndex;
                const s = spentList[i];
                const b = budgetList[i];
                if (b <= 0) {
                  return '';
                }
                return `Total spent: ₹${s.toLocaleString(
                  'en-IN'
                )}\nShare: ₹${b.toLocaleString('en-IN')}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 11 } },
            border: { color: axisBorder }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: gridLine },
            ticks: {
              color: tickColor,
              callback: (v: string | number) =>
                '₹' + Number(v).toLocaleString('en-IN')
            },
            border: { color: axisBorder }
          }
        }
      },
      plugins: [chartPanelBg, pctInFill]
    } as any);
  }

  /** Loads category totals for the spent-by-category bar chart. */
  refreshCategoryBarChart(): void {
    this.budget.getCategorySummary().subscribe({
      next: (res) => {
        const items = res.items || [];
        if (items.length === 0) {
          this.spentBarVisible = false;
          this.categoryChartSlices = [];
          this.destroySpentBarChart();
          return;
        }

        this.spentBarVisible = true;

        if (this.userBudget > 0) {
          const n = items.length;
          const share = Math.round(this.userBudget / n);
          this.categoryChartSlices = items.map((row) => {
            const spent = Number(row.total);
            const remaining = Math.max(0, share - spent);
            return {
              category: row.category,
              budgetShare: share,
              spent,
              remaining,
              overShare: spent > share
            };
          });
        } else {
          this.categoryChartSlices = items.map((row) => ({
            category: row.category,
            budgetShare: 0,
            spent: Number(row.total),
            remaining: 0,
            overShare: false
          }));
        }

        setTimeout(() => this.renderSpentBarChart(), 0);
      },
      error: () => {
        this.spentBarVisible = false;
        this.categoryChartSlices = [];
        this.destroySpentBarChart();
      }
    });
  }

  /** Donut: category split from current table page + inner spent vs remaining + budget in center. */
  renderChart(): void {
    if (this.chartRendering) {
      return;
    }
    this.chartRendering = true;
    if (this.expenseChart) {
      this.expenseChart.destroy();
      this.expenseChart = null;
    }

    const expenses = this.tableDataSource.data;
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach((e: any) => {
      const cat = e.category || 'Others';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount);
    });

    const labels = Object.keys(categoryMap);
    const values = Object.values(categoryMap) as number[];
    const total = values.reduce((a, b) => a + b, 0);

    if (labels.length === 0) {
      this.chartRendering = false;
      return;
    }

    const colors = [
      '#4caf50',
      '#ff9800',
      '#9c27b0',
      '#2196f3',
      '#f44336',
      '#00bcd4',
      '#795548'
    ];
    const remaining = this.remainsBudget > 0 ? this.remainsBudget : 0;
    const userBudget = this.userBudget;

    const datalabelsPlugin = {
      id: 'customLabels',
      afterDatasetDraw(chart: any) {
        const { ctx, data } = chart;

        const outerMeta = chart.getDatasetMeta(0);
        const outerDataset = data.datasets[0];
        const totalVal = outerDataset.data.reduce((a: number, b: number) => a + b, 0);

        outerMeta.data.forEach((arc: any, index: number) => {
          const value = outerDataset.data[index];
          const label = data.labels[index];
          const pct = Math.round((value / totalVal) * 100);
          if (pct < 4) {
            return;
          }

          const midAngle = (arc.startAngle + arc.endAngle) / 2;
          const radius = (arc.outerRadius + arc.innerRadius) / 2;
          const x = arc.x + Math.cos(midAngle) * radius;
          const y = arc.y + Math.sin(midAngle) * radius;

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.font = 'bold 11px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, x, y - 14);

          ctx.font = 'bold 10px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('₹' + value.toLocaleString('en-IN'), x, y);

          ctx.font = '10px Arial';
          ctx.fillStyle = '#ffffffcc';
          ctx.fillText(pct + '%', x, y + 13);

          ctx.restore();
        });

        const innerMeta = chart.getDatasetMeta(1);
        const innerDataset = data.datasets[1];

        innerMeta.data.forEach((arc: any, index: number) => {
          const value = innerDataset.data[index];
          const sliceLabel = index === 0 ? 'Spent' : 'Remaining';

          const arcAngle = arc.endAngle - arc.startAngle;
          if (arcAngle < 0.3) {
            return;
          }

          const midAngle = (arc.startAngle + arc.endAngle) / 2;
          const radius = (arc.outerRadius + arc.innerRadius) / 2;
          const x = arc.x + Math.cos(midAngle) * radius;
          const y = arc.y + Math.sin(midAngle) * radius;

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.font = 'bold 10px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(sliceLabel, x, y - 7);

          ctx.font = '9px Arial';
          ctx.fillStyle = '#ffffffdd';
          ctx.fillText('₹' + value.toLocaleString('en-IN'), x, y + 6);

          ctx.restore();
        });

        const anySomeMeta = chart.getDatasetMeta(1);
        if (anySomeMeta.data.length > 0) {
          const arc = anySomeMeta.data[0];
          const centerX = arc.x;
          const centerY = arc.y;
          const cutout = chart.options.cutout;
          const cutoutPx =
            typeof cutout === 'string'
              ? (parseFloat(cutout) / 100) * arc.outerRadius
              : cutout;

          if (cutoutPx > 40) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = '10px Arial';
            ctx.fillStyle = '#888888';
            ctx.fillText('Monthly Budget', centerX, centerY - 12);

            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#333333';
            ctx.fillText('₹' + userBudget.toLocaleString('en-IN'), centerX, centerY + 8);

            ctx.restore();
          }
        }
      }
    };

    this.expenseChart = new Chart('expenseChart', {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            label: 'Expenses',
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 8,
            weight: 2
          },
          {
            label: 'Budget',
            data: [total, remaining],
            backgroundColor: ['#ef5350', '#26a69a'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 4,
            weight: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '38%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 14,
              font: { size: 12 },
              usePointStyle: true,
              pointStyleWidth: 10,
              generateLabels: (chart: any) => {
                const legendItems = labels.map((label, i) => ({
                  text: `${label}  ₹${values[i].toLocaleString('en-IN')}`,
                  fillStyle: colors[i],
                  strokeStyle: colors[i],
                  pointStyle: 'rect' as any,
                  index: i,
                  datasetIndex: 0
                }));

                legendItems.push({
                  text: `Spent  ₹${total.toLocaleString('en-IN')}`,
                  fillStyle: '#ef5350',
                  strokeStyle: '#ef5350',
                  pointStyle: 'rect' as any,
                  index: 0,
                  datasetIndex: 1
                });

                legendItems.push({
                  text: `Remaining  ₹${remaining.toLocaleString('en-IN')}`,
                  fillStyle: '#26a69a',
                  strokeStyle: '#26a69a',
                  pointStyle: 'rect' as any,
                  index: 1,
                  datasetIndex: 1
                });

                legendItems.push({
                  text: `Monthly Budget  ₹${this.userBudget.toLocaleString('en-IN')}`,
                  fillStyle: '#5c6bc0',
                  strokeStyle: '#5c6bc0',
                  pointStyle: 'rect' as any,
                  index: 2,
                  datasetIndex: 1
                });

                return legendItems;
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const val = ctx.parsed;
                if (ctx.datasetIndex === 1) {
                  return ctx.dataIndex === 0
                    ? ` Spent: ₹${val.toLocaleString('en-IN')}`
                    : ` Remaining: ₹${val.toLocaleString('en-IN')}`;
                }
                const pct = Math.round((val / total) * 100);
                return ` ₹${val.toLocaleString('en-IN')} (${pct}%)`;
              }
            }
          }
        }
      },
      plugins: [datalabelsPlugin]
    } as any);
    this.chartRendering = false;
  }

  // ================= TABLE =================
  getTableData(page: number = 1) {
    let sort: any = "";
    if (this.selectedSort === 'latest') sort = "latest";
    else if (this.selectedSort === 'high') sort = "high";
    else if (this.selectedSort === 'low') sort = "low";

    this.budget.getAllExpense(sort, page, this.selectedCategory).subscribe({
      next: (res: any) => {
        this.tableDataSource = new MatTableDataSource(res.data);
// const allCats = res.data.map((e: any) => e.category);
// this.categoryList = [...new Set(allCats)] as string[];

        this.totalRecords = res.total;
        this.tableDataSource.paginator = this.paginator;
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.length = res.total;
            this.paginator.pageIndex = page - 1;
            this.paginator.pageSize = 5;
          }
        }, 300);
        this.refreshCategoryBarChart();
        setTimeout(() => this.renderChart(), 150);
      },
      error: (err) => console.error(err)
    });
  }

  onPageChange(event: any) {
    const page = event.pageIndex + 1;
    this.router.navigate(['/dashboard/page', page]);
  }

  applySort(type: string) {
    this.selectedSort = type;
    this.getTableData();
  }

filterByCategory(category: string) {
  this.selectedCategory = category;
  this.getTableData(1);
}



  getSortLabel(): string {
    const map: any = { latest: 'Latest', high: 'High → Low', low: 'Low → High' };
    return map[this.selectedSort];
  }

  /** Add / edit expense — wide on desktop, full usable width + scroll on small screens (avoid tiny `40vw`). */
  private expenseFormDialogConfig(
    overrides: MatDialogConfig<AddExpenseModalComponent> = {}
  ): MatDialogConfig<AddExpenseModalComponent> {
    return {
      width: '560px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: ['custom-dialog', 'expense-dialog-panel'],
      disableClose: true,
      ...overrides,
    };
  }

  // ================= ADD =================
  openAddExpense() {
    const dialogRef = this.dialog.open(
      AddExpenseModalComponent,
      this.expenseFormDialogConfig()
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const currentPage = Number(this.route.snapshot.params['page']) || 1;
        this.getTableData(currentPage);
        this.getCurrentExpense();
        this.router.navigate(['/dashboard/page', currentPage]);
      }
    });
  }

  // ================= EDIT =================
  openEditExpense(element: any) {
    const dialogRef = this.dialog.open(AddExpenseModalComponent, {
      ...this.expenseFormDialogConfig(),
      data: { ...element },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const currentPage = Number(this.route.snapshot.params['page']) || 1;
        this.getTableData(currentPage);
        this.getCurrentExpense();
        this.router.navigate(['/dashboard/page', currentPage]);
      }
    });
  }

  // ================= DELETE =================
  openDeleteDialog(expense: any) {
    this.selectedDeleteIndex = this.tableDataSource.data.indexOf(expense);
    this.selectedExpenseId = expense.id;
  }

  closeDeleteDialog() {
    this.selectedDeleteIndex = null;
    this.selectedExpenseId = null;
  }

  deleteExpense() {
    if (!this.selectedExpenseId) return;
    this.budget.deleteExpense(this.selectedExpenseId).subscribe({
      next: () => {
        const currentPage = Number(this.route.snapshot.params['page']) || 1;
        this.getTableData(currentPage);
        this.getCurrentExpense();
        this.closeDeleteDialog();
      },
      error: (err) => console.error(err)
    });
  }

  // ================= NOTES =================
  openNotes(note: string) { this.selectedNote = note; }
  closeNotes() { this.selectedNote = null; }

  // ================= SOCKET =================
  socketUpdate() {
    const userId = JSON.parse(localStorage.getItem('userId')!);
    this.socketService.connect(userId);
    this.socketService.onExpenseUpdate().subscribe((data: any) => {
      this.usedPercent = data.usedPercent;
      this.warning = data.warning;
      this.remainsBudget = data.remaining;
      this.refreshCategoryBarChart();
      setTimeout(() => this.renderChart(), 120);
    });
  }

  // ================= CATEGORY =================
  loadCategories() {
    this.budget.getUserCategories().subscribe({
      next: (res: any) => {
       this.categories = res.categories; 
        this.categoryList = res.categories; 
      }
    });
  }

  
  // ================= INIT =================
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const page = Number(params['page']) || 1;
      this.selectedSort = 'latest';
      this.getTableData(page);
      setTimeout(() => {
        if (this.paginator) this.paginator.pageIndex = page - 1;
      }, 0);
    });
    this.getUserdetails();
    this.getCurrentBudget();
    this.getCurrentExpense();
    this.loadCategories();
  }

  // ================= AFTER VIEW =================
  ngAfterViewInit(): void {
    this.socketUpdate();
  }

  ngOnDestroy(): void {
    if (this.expenseChart) {
      this.expenseChart.destroy();
      this.expenseChart = null;
    }
    this.destroySpentBarChart();
  }

  // ================= AI SUMMARY =================
  openAiSummary() {
    this.dialog.open(AiSummaryModalComponent, {
      width: '520px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: ['custom-dialog', 'ai-summary-dialog-panel'],
      disableClose: false,
    });
  }

// ================= EXPORT EXCEL =================
// exportToExcel() {
//   this.budget.getAllExpense(this.selectedSort, 1, 10000).subscribe((res: any) => {

//     const data = res.data.map((e: any) => ({
//       Title: e.title,
//       Amount: e.amount,
//       Category: e.category,
//       Date: e.expense_date,
//       Payment: e.payment_method,
//       Notes: e.notes
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(data);
//     const workbook = XLSX.utils.book_new();

//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

//     const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

//     const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

//     saveAs(blob, 'All_Expenses.xlsx');
//   });
// }



// ================= EXPORT PDF =================
exportToPDF() {
 this.budget.getAllExpense(this.selectedSort, 1, '', 1000).subscribe((res: any) => {

    const data = res.data;

    const doc = new jsPDF();

    // ✅ Title
    doc.setFontSize(16);
    doc.text('Expense Report', 14, 15);

    // ✅ Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // ✅ Total Amount
    const total = data.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    doc.text('Total Expense: Rs ' + total, 14, 28);
    // ✅ Table
    autoTable(doc, {
      startY: 35,
      head: [['Title', 'Amount', 'Category', 'Date', 'Payment', 'Notes']],
      body: data.map((e: any) => [
        e.title,
        'Rs ' + Number(e.amount),
        // `₹${e.amount}`,
        e.category,
        e.expense_date,
        e.payment_method,
        e.notes
      ]),
      styles: {
        fontSize: 9
      },
      headStyles: {
        fillColor: [41, 128, 185] // blue header
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240] // light gray rows
      }
    });

    // ✅ Save
    doc.save('Expense_Report.pdf');
  });
}

}