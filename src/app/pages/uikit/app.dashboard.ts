import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';

type Option = { label: string; value: string };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, Select, InputTextModule, TooltipModule,
    ChartModule, TableModule, TagModule, AvatarModule, ProgressBarModule
  ],
  template: `
  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <div>
        <h1 class="page-title">Tổng quan tình hình sử dụng</h1>
        <p class="page-subtitle">Dữ liệu được cập nhật từ 01/10/2025 đến 04/10/2025</p>
      </div>
      <div class="header-actions">
        <p-select [(ngModel)]="unit" [options]="units" optionLabel="label" optionValue="value" placeholder="Tất cả đơn vị"></p-select>
        <p-select [(ngModel)]="departmentFilter" [options]="departmentOptions" optionLabel="label" optionValue="value" placeholder="Tất cả phòng ban"></p-select>
        <p-select [(ngModel)]="period" [options]="periods" optionLabel="label" optionValue="value" placeholder="Thời gian"></p-select>
        <button pButton icon="pi pi-refresh" severity="secondary" [text]="true" [rounded]="true" pTooltip="Làm mới dữ liệu" (click)="manualRefresh()"></button>
      </div>
    </div>

    <!-- KPI -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon icon-primary"><i class="pi pi-bolt"></i></div>
        <div class="kpi-content">
          <div class="kpi-title">Credit đã dùng</div>
          <div class="kpi-value">10,000</div>
        </div>
        <p-tag [value]="kpiChange(-100)" severity="danger" [rounded]="true"></p-tag>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon icon-primary"><i class="pi pi-users"></i></div>
        <div class="kpi-content">
          <div class="kpi-title">Tổng số người dùng</div>
          <div class="kpi-value">2,000</div>
        </div>
        <p-tag [value]="kpiChange(+5.39)" severity="success" [rounded]="true"></p-tag>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon icon-primary"><i class="pi pi-chart-pie"></i></div>
        <div class="kpi-content">
          <div class="kpi-title">Tỷ lệ sử dụng</div>
          <div class="kpi-value">50%</div>
        </div>
        <p-tag [value]="kpiChange(-3.96)" severity="danger" [rounded]="true"></p-tag>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon icon-primary"><i class="pi pi-calendar"></i></div>
        <div class="kpi-content">
          <div class="kpi-title">Tỷ lệ sử dụng hàng ngày</div>
          <div class="kpi-value">50%</div>
        </div>
        <p-tag [value]="kpiChange(+5.39)" severity="success" [rounded]="true"></p-tag>
      </div>
    </div>

    <!-- ROW 2: 3 doughnut - viewport vuông + legend custom -->
    <div class="row-3">
      <!-- Tasks -->
      <div class="card pie">
        <div class="card-header"><h3>Thống kê theo tác vụ</h3></div>
        <div class="card-body">
          <div class="pie-viewport">
            <p-chart type="doughnut" [data]="tasksData" [options]="doughnutOptions"></p-chart>
          </div>
          <div class="pie-legend" *ngIf="tasksData?.labels?.length">
            <div class="item" *ngFor="let lb of tasksData.labels; let i = index">
              <span class="dot" [style.background]="tasksData.datasets[0].backgroundColor[i]"></span>
              <span>{{ lb }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Models -->
      <div class="card pie">
        <div class="card-header"><h3>Thống kê theo mô hình AI</h3></div>
        <div class="card-body">
          <div class="pie-viewport">
            <p-chart type="doughnut" [data]="modelsData" [options]="doughnutOptions"></p-chart>
          </div>
          <div class="pie-legend" *ngIf="modelsData?.labels?.length">
            <div class="item" *ngFor="let lb of modelsData.labels; let i = index">
              <span class="dot" [style.background]="modelsData.datasets[0].backgroundColor[i]"></span>
              <span>{{ lb }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Token type -->
      <div class="card pie">
        <div class="card-header"><h3>Token theo loại</h3><span class="muted">Miễn phí vs Trả phí</span></div>
        <div class="card-body">
          <div class="pie-viewport">
            <p-chart type="doughnut" [data]="tokenTypeData" [options]="doughnutOptions"></p-chart>
          </div>
          <div class="pie-legend" *ngIf="tokenTypeData?.labels?.length">
            <div class="item" *ngFor="let lb of tokenTypeData.labels; let i = index">
              <span class="dot" [style.background]="tokenTypeData.datasets[0].backgroundColor[i]"></span>
              <span>{{ lb }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ROW 1: Line -->
    <div class="row-1">
      <div class="card compact">
        <div class="card-header">
          <h3>Biến động theo thời gian</h3>
          <p-select [(ngModel)]="timespan" [options]="timespans" optionLabel="label" optionValue="value"></p-select>
        </div>
        <div class="card-body">
          <div class="chart-wrap" style="height: var(--h-line);">
            <p-chart #lineChart type="line" [data]="lineData" [options]="lineOptions"></p-chart>
          </div>
        </div>
      </div>
    </div>

    

    <!-- ROW 3: Nhân viên + Top10 -->
    <div class="row-emp">
      <div class="card">
        <div class="card-header">
          <h3>Thống kê theo nhân viên</h3>
          <div class="table-header-actions">
            <p-select [(ngModel)]="selectedEmployeeSort" [options]="employeeSortOptions" optionLabel="label" optionValue="value"></p-select>
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input pInputText type="text" [(ngModel)]="employeeSearchQuery" placeholder="Tìm kiếm nhân viên..." class="w-full md:w-64"/>
            </span>
            <button pButton icon="pi pi-download" severity="secondary" [text]="true" [rounded]="true" pTooltip="Tải xuống"></button>
          </div>
        </div>
        <div class="card-body p-0">
          <p-table [value]="employeeStats" [paginator]="true" [rows]="5" [showCurrentPageReport]="true"
                   currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
                   [rowsPerPageOptions]="[5, 10, 20]" [tableStyle]="{'min-width': '74rem'}">
            <ng-template pTemplate="header">
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vị trí</th>
                <th>Phòng ban</th>
                <th>Định mức</th>
                <th class="text-right">Requests (all models)</th>
                <th class="text-right">Free-tier requests</th>
                <th class="text-right">Paid-model requests</th>
                <th class="text-right">Token miễn phí</th>
                <th class="text-right">Token trả phí</th>
                <th class="text-right">Chi phí đã dùng</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-emp>
              <tr>
                <td>
                  <div class="user-cell">
                    <p-avatar [label]="emp.initials" shape="circle" size="large"></p-avatar>
                    <div class="user-cell-info">
                      <div class="user-cell-name">{{emp.name}}</div>
                      <div class="user-cell-id">{{emp.id}}</div>
                    </div>
                  </div>
                </td>
                <td>{{emp.email}}</td>
                <td>{{emp.position}}</td>
                <td>{{emp.department}}</td>
                <td>
                  <div class="font-medium">{{emp.quota.type}}</div>
                  <div class="text-sm text-surface-500">{{emp.quota.limit}}</div>
                </td>
                <td class="text-right">{{emp.requests.total | number}}</td>
                <td class="text-right">{{emp.requests.free | number}}</td>
                <td class="text-right">{{emp.requests.paid | number}}</td>
                <td class="text-right">{{emp.tokens.free | number}}</td>
                <td class="text-right">{{emp.tokens.paid | number}}</td>
                <td class="text-right">
                  <div class="cost-cell">
                    <div class="cost-value">{{emp.cost.value | number:'1.2-2'}} <i class="pi pi-bolt cost-icon text-sm"></i></div>
                    <div class="cost-currency">{{emp.cost.currency | number}}đ</div>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <div class="card top-card">
        <div class="card-header">
          <h3>Top 10 người dùng nhiều nhất</h3>
          <p-select [(ngModel)]="topSort" [options]="topSortOptions" optionLabel="label" optionValue="value"></p-select>
        </div>
        <div class="card-body">
          <ol class="rank-list">
            <li *ngFor="let u of sortedTopUsers(); let i = index">
              <div class="rank-badge" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">{{i+1}}</div>
              <p-avatar [image]="u.avatar" shape="circle" size="large"></p-avatar>
              <div class="user-info">
                <div class="user-name">{{u.name}}</div>
                <div class="user-dept">{{u.dept}}</div>
              </div>
              <div class="user-credit">
                {{formatTopValue(u)}} <span class="unit">{{currentMetricUnit}}</span>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <!-- ROW 4: Phòng ban -->
    <div class="row-1">
      <div class="card">
        <div class="card-header">
          <h3>Thống kê theo phòng ban</h3>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-surface-500">Sắp xếp theo</span>
            <p-select [(ngModel)]="sortBy" [options]="sortOptions" optionLabel="label" optionValue="value"></p-select>
            <button pButton icon="pi pi-download" severity="secondary" [text]="true" [rounded]="true" pTooltip="Tải xuống CSV"></button>
          </div>
        </div>
        <div class="card-body p-0">
          <p-table [value]="departments" [tableStyle]="{'min-width': '68rem'}" [stripedRows]="true">
            <ng-template pTemplate="header">
              <tr>
                <th>Phòng ban</th>
                <th class="text-right">Số credit</th>
                <th class="text-right">Người dùng</th>
                <th class="text-right">Đã dùng</th>
                <th class="text-right">Token miễn phí</th>
                <th class="text-right">Token trả phí</th>
                <th>Tỷ lệ sử dụng</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-r>
              <tr>
                <td><span class="font-semibold">{{r.name}}</span></td>
                <td class="text-right font-semibold">{{r.credit | number}}</td>
                <td class="text-right">{{r.users | number}}</td>
                <td class="text-right">{{r.active | number}}</td>
                <td class="text-right">{{r.tokens.free | number}}</td>
                <td class="text-right">{{r.tokens.paid | number}}</td>
                <td>
                  <div class="flex items-center gap-3">
                    <p-progressBar [value]="r.rate" [showValue]="false" styleClass="flex-1"></p-progressBar>
                    <span class="font-medium text-sm w-10 text-right">{{r.rate}}%</span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host {
      --gap: 1rem;
      --radius: 0.875rem;
      --card-padding: 1.0rem;
      --border-color: var(--p-surface-200);
      --card-bg: var(--p-surface-0);
      --card-shadow: 0 6px 30px rgba(0,0,0,.05);
      --kpi-icon-size: 32px;

      /* Line chart height */
      --h-line: 220px;

      /* Chiều cao card pie & khu vực legend (đồng nhất giữa 3 card) */
      --h-pie-card: 470px;   /* tăng/giảm để vòng tròn to hơn/nhỏ hơn */
      --legend-h: 150px;     /* chỗ dành cho legend phía dưới */
    }

    .page-container { padding: var(--gap); background: var(--p-surface-50); display:flex; flex-direction:column; gap: var(--gap); }
    .header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; }
    .page-title { font-size:1.5rem; font-weight:700; margin:0; color: var(--p-surface-900); }
    .page-subtitle { font-size:.9rem; color: var(--p-surface-600); margin:.25rem 0 0; }
    .header-actions { display:flex; align-items:center; gap:.5rem; }

    /* KPI */
    .kpi-grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: var(--gap); }
    .kpi-card { background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--radius); padding:1rem; display:flex; align-items:center; gap:1rem; box-shadow:var(--card-shadow); }
    .kpi-icon { width:64px; height:64px; border-radius:50%; display:grid; place-items:center; }
    .kpi-icon i { font-size: var(--kpi-icon-size); }
    .kpi-content { flex:1; }
    .kpi-title { font-weight:600; color: var(--p-surface-600); font-size:.95rem; margin-bottom:.25rem; }
    .kpi-value { font-weight:800; font-size:1.6rem; color: var(--p-primary-700); }
    .icon-primary { background: var(--p-primary-100); color: var(--p-primary-600); }

    /* Grid rows */
    .row-1 { display:grid; grid-template-columns: minmax(0,1fr); gap: var(--gap); }
    .row-3 { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: var(--gap); align-items: stretch; }
    .row-emp { display:grid; grid-template-columns: minmax(0,2fr) minmax(0,1fr); gap: var(--gap); align-items: stretch; }

    /* Card */
    .card { background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--radius); box-shadow:var(--card-shadow); display:flex; flex-direction:column; height:100%; }
    .card.compact .card-body { flex: 0 0 auto; padding-top: .5rem; padding-bottom: .25rem; }
    .card-header { padding:1rem var(--card-padding); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; gap:.5rem; }
    .card-header h3 { font-size:1.1rem; font-weight:600; margin:0; }
    .card-header .muted { color: var(--p-surface-500); font-size: .85rem; }
    .card-body { padding: var(--card-padding); flex:1; display:flex; flex-direction:column; }
    .card-body.p-0 { padding:0; }

    /* Line chart wrapper */
    .chart-wrap { width: 100%; height: 100%; }
    .chart-wrap canvas { display:block; margin:0 !important; }

    /* Pie cards: 2 hàng -> viewport (canvas) + legend */
    .card.pie { min-height: var(--h-pie-card); }
    .card.pie .card-body{
      display: grid;
      grid-template-rows: 1fr auto;
      gap: .75rem;
    }
    /* Viewport vuông, chiếm tối đa chiều cao còn lại */
    .pie-viewport{
      width: 100%;
      height: calc(var(--h-pie-card) - var(--legend-h));
      aspect-ratio: 1 / 1;
      max-width: 100%;
      margin-inline: auto;
    }
    .pie-viewport canvas{ display:block; width:100% !important; height:100% !important; }

    /* Legend custom: 2 cột gọn gàng */
    .pie-legend{
      height: auto;
      max-height: var(--legend-h);
      display:grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap:.5rem 1.25rem;
      align-items:center;
    }
    .pie-legend .item{display:flex; align-items:center; gap:.5rem; white-space:nowrap;}
    .pie-legend .dot{width:.65rem; height:.65rem; border-radius:999px; flex:0 0 auto;}

    /* Lists / tables */
    .table-header-actions { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
    .rank-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.75rem; }
    .rank-list li { display:flex; align-items:center; gap:0.75rem; border-radius:0.75rem; padding:0.5rem 0.6rem; }
    .rank-badge { width:28px; height:28px; border-radius:999px; display:grid; place-items:center; font-weight:700; color:#fff; background: var(--p-surface-500); }
    .rank-badge.gold { background:#eab308; } .rank-badge.silver { background:#9ca3af; } .rank-badge.bronze { background:#b45309; }
    .user-info { flex:1; }
    .user-name { font-weight:600; }
    .user-dept { font-size:.85rem; color: var(--p-surface-500); }
    .user-credit { font-weight:700; font-size:1.05rem; }
    .user-credit .unit { font-weight:600; font-size:.85rem; color: var(--p-surface-500); margin-left:4px; }

    .user-cell { display:flex; align-items:center; gap:.75rem; }
    .user-cell-info { line-height:1.3; }
    .user-cell-name { font-weight:600; }
    .user-cell-id { font-size:.8rem; color: var(--p-surface-500); }
    .cost-cell { line-height:1.3; }
    .cost-value { font-weight:600; }
    .cost-currency { font-size:.8rem; color: var(--p-surface-500); }
    .cost-icon { color: var(--p-primary-500); }

    :host ::ng-deep {
      .p-progressbar .p-progressbar-value { background: var(--p-primary-color); }
      .p-select { border:1px solid var(--p-surface-300) !important; border-radius:.5rem; background:var(--p-surface-0); }
      .p-inputtext { border-radius:.5rem; }
      .p-progressbar { height:.75rem; border-radius:999px; }
      .p-table .p-table-thead > tr > th { background:var(--p-surface-50); font-weight:600; color:var(--p-surface-600); padding:.75rem 1.25rem; }
      .p-table .p-table-tbody > tr > td { padding:.75rem 1.25rem; border-color: var(--p-surface-100); }
      .p-paginator { border-top:1px solid var(--border-color); border-radius: 0 0 var(--radius) var(--radius); }
    }

    /* Responsive */
    @media (max-width: 1280px) {
      :host { --h-pie-card: 440px; --legend-h: 130px; }
      .row-3 { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .row-emp { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (max-width: 820px) {
      :host { --h-pie-card: 420px; --legend-h: 120px; }
      .row-3 { grid-template-columns: minmax(0,1fr); }
      .pie-legend{ grid-template-columns: 1fr; } /* màn nhỏ -> legend 1 cột */
      .kpi-grid { grid-template-columns: 1fr; }
      .header { flex-direction:column; align-items:flex-start; }
    }
  `]
})
export class AppDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // filters
  unit = 'all';
  departmentFilter = 'all';
  period = 'month';
  timespan = 'd';
  sortBy = 'credit';
  selectedEmployeeSort = 'cost';
  employeeSearchQuery = '';

  // Top10 sort
  topSort = 'requests_total';
  topSortOptions: Option[] = [
    { label: 'Requests (all models)', value: 'requests_total' },
    { label: 'Free-tier requests', value: 'requests_free' },
    { label: 'Paid-model requests', value: 'requests_paid' },
    { label: 'Total tokens', value: 'tokens_total' },
    { label: 'Free-tier tokens', value: 'tokens_free' },
    { label: 'Paid tokens', value: 'tokens_paid' }
  ];
  get currentMetricUnit(): string { return this.topSort.startsWith('requests') ? 'req' : 'tok'; }

  units: Option[] = [
    { label: 'Tất cả đơn vị', value: 'all' },
    { label: 'EVNGENCO1', value: 'genco1' },
    { label: 'Công ty Cổ phần MISA', value: 'misa' }
  ];
  departmentOptions: Option[] = [
    { label: 'Tất cả phòng ban', value: 'all' },
    { label: 'Phòng Phát triển Thị trường', value: 'pdt' },
    { label: 'Phòng Quản lý XNK', value: 'xnk' },
    { label: 'Phòng Kinh doanh HAN', value: 'han' },
    { label: 'Phòng Quản trị nhân lực', value: 'hr' }
  ];
  periods: Option[] = [
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Quý này', value: 'quarter' }
  ];
  timespans: Option[] = [
    { label: 'Theo ngày', value: 'd' },
    { label: 'Theo tuần', value: 'w' },
    { label: 'Theo tháng', value: 'm' }
  ];
  sortOptions: Option[] = [
    { label: 'Số credit', value: 'credit' },
    { label: 'Tỷ lệ sử dụng', value: 'rate' }
  ];
  employeeSortOptions: Option[] = [
    { label: 'Dùng nhiều nhất', value: 'cost' },
    { label: 'Dùng ít nhất', value: 'cost_asc' },
    { label: 'Tên A-Z', value: 'name' }
  ];

  // charts
  tasksData: any; modelsData: any; tokenTypeData: any;
  doughnutOptions: any;
  lineData: any; lineOptions: any;

  @ViewChild('lineChart') lineChart?: any;
  @ViewChild('tasksChart') tasksChart?: any;
  @ViewChild('modelsChart') modelsChart?: any;

  private themeLinkObserver?: MutationObserver;
  private primaryColorPoll?: any;
  private lastPrimary = '';

  // data
  topUsers: any[] = [];
  departments: any[] = [];
  employeeStats: any[] = [];

  ngOnInit(): void {
    this.initData();
    setTimeout(() => this.buildChartsFromCSSVars(), 0);
  }

  ngAfterViewInit(): void {
    const link = document.getElementById('theme-link');
    if (link) {
      this.themeLinkObserver = new MutationObserver(() => {
        setTimeout(() => this.rebuildChartsIfPrimaryChanged(), 50);
      });
      this.themeLinkObserver.observe(link, { attributes: true, attributeFilter: ['href'] });
    }
    this.primaryColorPoll = setInterval(() => this.rebuildChartsIfPrimaryChanged(), 1000);
  }

  ngOnDestroy(): void {
    this.themeLinkObserver?.disconnect();
    if (this.primaryColorPoll) clearInterval(this.primaryColorPoll);
  }

  manualRefresh(): void {
    this.buildChartsFromCSSVars();
    this.forceChartRefresh();
  }

  private rebuildChartsIfPrimaryChanged(): void {
    const currentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--p-primary-500').trim();
    if (!this.lastPrimary) this.lastPrimary = currentPrimary;
    if (currentPrimary && currentPrimary !== this.lastPrimary) {
      this.lastPrimary = currentPrimary;
      this.buildChartsFromCSSVars();
      this.forceChartRefresh();
    }
  }
  private forceChartRefresh(): void {
    try { this.lineChart?.refresh?.(); } catch {}
    try { this.tasksChart?.refresh?.(); } catch {}
    try { this.modelsChart?.refresh?.(); } catch {}
  }

  // ====== Dummy data ======
  initData(): void {
    // Top users
    this.topUsers = [
      { avatar: 'https://i.pravatar.cc/150?u=1',  name: 'Nguyễn Minh Tuấn', dept: 'Phòng Phát triển Thị trường Quốc tế',
        requests: { total: 480, free: 150, paid: 330 }, tokens: { total: 220_000, free: 40_000,  paid: 180_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=2',  name: 'Lê Thị Hương',    dept: 'Phòng Quản lý Xuất nhập khẩu',
        requests: { total: 430, free: 180, paid: 250 }, tokens: { total: 210_000, free: 55_000,  paid: 155_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=3',  name: 'Phạm Văn An',     dept: 'Phòng Chiến lược Thị trường Toàn cầu',
        requests: { total: 410, free: 120, paid: 290 }, tokens: { total: 195_000, free: 35_000,  paid: 160_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=4',  name: 'Trần Thị Mai',    dept: 'Phòng Kinh doanh Quốc tế',
        requests: { total: 395, free: 160, paid: 235 }, tokens: { total: 185_000, free: 60_000,  paid: 125_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=5',  name: 'Bùi Đức Long',    dept: 'Phòng Kỹ thuật',
        requests: { total: 360, free: 200, paid: 160 }, tokens: { total: 170_000, free: 80_000,  paid: 90_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=6',  name: 'Hoàng Thu Trang', dept: 'Phòng Marketing',
        requests: { total: 340, free: 190, paid: 150 }, tokens: { total: 165_000, free: 75_000,  paid: 90_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=7',  name: 'Đỗ Quốc Khánh',   dept: 'Phòng Sản phẩm',
        requests: { total: 330, free: 140, paid: 190 }, tokens: { total: 150_000, free: 50_000,  paid: 100_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=8',  name: 'Ngô Thùy Linh',   dept: 'Phòng Dữ liệu',
        requests: { total: 320, free: 130, paid: 190 }, tokens: { total: 148_000, free: 42_000,  paid: 106_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=9',  name: 'Vũ Anh Quân',     dept: 'Phòng Tài chính',
        requests: { total: 300, free: 110, paid: 190 }, tokens: { total: 130_000, free: 35_000,  paid: 95_000 } },
      { avatar: 'https://i.pravatar.cc/150?u=10', name: 'Phan Thanh Tùng', dept: 'Phòng Vận hành',
        requests: { total: 280, free: 100, paid: 180 }, tokens: { total: 120_000, free: 30_000,  paid: 90_000 } }
    ];

    this.departments = [
      { name: 'Công ty Cổ phần MISA', credit: 10000, users: 2000, active: 1000, rate: 50, tokens: { free: 500_000, paid: 1_000_000 } },
      { name: 'Phòng Kinh doanh Thị trường nước ngoài', credit: 5000, users: 500, active: 500, rate: 100, tokens: { free: 120_000, paid: 380_000 } },
      { name: 'Phòng Kinh doanh HAN', credit: 300, users: 300, active: 300, rate: 100, tokens: { free: 80_000, paid: 220_000 } },
      { name: 'Phòng Quản trị nhân lực', credit: 400, users: 400, active: 200, rate: 50, tokens: { free: 60_000, paid: 60_000 } }
    ];

    this.employeeStats = [
      { initials: 'QH', name: 'Nguyễn Quang Huy', id: 'NV000001', email: 'nqh306@gmail.com', position: 'Trưởng phòng', department: 'bencode.vn',
        quota: { type: 'Định mức mặc định', limit: 'Không giới hạn' },
        requests: { total: 510, free: 180, paid: 330 }, tokens: { free: 30_000, paid: 95_000 },
        cost: { value: 1250.50, currency: 250100 } },
      { initials: 'MT', name: 'Nguyễn Minh Tuấn', id: 'NV000002', email: 'tuan.nm@misa.vn', position: 'Chuyên viên', department: 'Phòng Phát triển Thị trường',
        quota: { type: 'Định mức tháng', limit: '5.000 credit' },
        requests: { total: 480, free: 150, paid: 330 }, tokens: { free: 20_000, paid: 80_000 },
        cost: { value: 1200, currency: 240000 } },
      { initials: 'LH', name: 'Lê Thị Hương', id: 'NV000003', email: 'huong.lt@misa.vn', position: 'Chuyên viên', department: 'Phòng Quản lý XNK',
        quota: { type: 'Định mức mặc định', limit: 'Không giới hạn' },
        requests: { total: 430, free: 180, paid: 250 }, tokens: { free: 18_000, paid: 70_000 },
        cost: { value: 1150, currency: 230000 } },
      { initials: 'VA', name: 'Phạm Văn An', id: 'NV000004', email: 'an.pv@misa.vn', position: 'Nhân viên', department: 'Phòng Chiến lược',
        quota: { type: 'Định mức mặc định', limit: 'Không giới hạn' },
        requests: { total: 120, free: 120, paid: 0 }, tokens: { free: 5_000, paid: 0 },
        cost: { value: 0, currency: 0 } }
    ];
  }

  // ====== Helpers ======
  hexToRgba(hex: string, alpha: number = 1): string {
    const hexValue = hex.replace('#', '');
    const isShortHex = hexValue.length === 3;
    const rHex = isShortHex ? hexValue[0] + hexValue[0] : hexValue.substring(0, 2);
    const gHex = isShortHex ? hexValue[1] + hexValue[1] : hexValue.substring(2, 4);
    const bHex = isShortHex ? hexValue[2] + hexValue[2] : hexValue.substring(4, 6);
    return `rgba(${parseInt(rHex, 16)}, ${parseInt(gHex, 16)}, ${parseInt(bHex, 16)}, ${alpha})`;
  }

  // ====== Charts ======
  private buildChartsFromCSSVars(): void {
    const css = getComputedStyle(document.documentElement);
    const textColor = css.getPropertyValue('--p-surface-700').trim();
    const textColorSecondary = css.getPropertyValue('--p-surface-500').trim();
    const surfaceBorder = css.getPropertyValue('--p-surface-200').trim();
    const primary500 = css.getPropertyValue('--p-primary-500').trim();

    this.lastPrimary = primary500 || this.lastPrimary;

    // Palette đơn sắc theo theme
    const mono = [
      css.getPropertyValue('--p-primary-700').trim(),
      css.getPropertyValue('--p-primary-600').trim(),
      css.getPropertyValue('--p-primary-500').trim(),
      css.getPropertyValue('--p-primary-400').trim(),
      css.getPropertyValue('--p-primary-300').trim(),
      css.getPropertyValue('--p-primary-200').trim()
    ].filter(Boolean);

    // Doughnut options: tắt legend mặc định, viewport vuông
    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const ds = ctx.dataset.data as number[];
              const total = ds.reduce((s, v) => s + v, 0);
              const val = ds[ctx.dataIndex] || 0;
              const pct = total ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${Number(val).toLocaleString('vi-VN')} (${pct}%)`;
            }
          }
        }
      }
    };

    // Doughnut data
    const tasksRaw = this.sortForDoughnut(
      ['Trò chuyện','Suy luận','Tạo sinh hình ảnh','Tìm kiếm web','Nghiên cứu sâu','Khác'],
      [5000, 2000, 3000, 2000, 5000, 200]
    );
    this.tasksData = { labels: tasksRaw.labels, datasets: [{ data: tasksRaw.values, backgroundColor: mono, borderWidth: 0, hoverOffset: 8 }] };

    const modelsRaw = this.sortForDoughnut(
      ['GPT o4 mini','Gemini 2.5 Flash','Gemini 2.5 Pro','GPT-4.1 mini','GPT o3','Khác'],
      [5000, 2000, 3000, 5000, 2000, 200]
    );
    this.modelsData = { labels: modelsRaw.labels, datasets: [{ data: modelsRaw.values, backgroundColor: mono, borderWidth: 0, hoverOffset: 8 }] };

    const freeTokens = this.departments.reduce((s, d) => s + d.tokens.free, 0);
    const paidTokens = this.departments.reduce((s, d) => s + d.tokens.paid, 0);
    this.tokenTypeData = {
      labels: ['Miễn phí', 'Trả phí'],
      datasets: [{ data: [freeTokens, paidTokens], backgroundColor: [css.getPropertyValue('--p-primary-300').trim(), css.getPropertyValue('--p-primary-600').trim()], borderWidth: 0 }]
    };

    // Line
    const days = Array.from({length: 30}, (_, i) => (i + 1).toString());
    const series = [0, 5000, 10000, 13000, 16000, 15000, 14000, 9000, 6000, 5000, 3000, 2000, 1000, 4000, 9000, 15000, 18000, 20000, 19000, 17000, 16000, 12000, 10000, 9000, 10000, 11000, 9000, 7000, 3000, 0];

    this.lineData = {
      labels: days,
      datasets: [{
        label: 'Credit đã dùng',
        data: series,
        fill: true,
        backgroundColor: this.hexToRgba(primary500 || '#3B82F6', 0.12),
        borderColor: primary500 || '#3B82F6',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }]
    };

    this.lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end', labels: { color: textColor } },
        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('vi-VN')}` } }
      },
      layout: { padding: { bottom: 0 } },
      scales: {
        x: { ticks: { color: textColorSecondary, maxTicksLimit: 10 }, grid: { display: false } },
        y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } }
      }
    };
  }

  private sortForDoughnut(labels: string[], values: number[]) {
    const arr = labels.map((label, i) => ({ label, value: values[i] }));
    arr.sort((a, b) => b.value - a.value);
    return { labels: arr.map(a => a.label), values: arr.map(a => a.value) };
  }

  // ====== Top10 helpers ======
  sortedTopUsers() {
    const clone = [...this.topUsers];
    const pick = (u: any) => {
      switch (this.topSort) {
        case 'requests_total': return u.requests.total;
        case 'requests_free':  return u.requests.free;
        case 'requests_paid':  return u.requests.paid;
        case 'tokens_total':   return u.tokens.total ?? (u.tokens.free + u.tokens.paid);
        case 'tokens_free':    return u.tokens.free;
        case 'tokens_paid':    return u.tokens.paid;
        default: return u.requests.total;
      }
    };
    clone.sort((a, b) => pick(b) - pick(a));
    return clone.slice(0, 10);
  }
  formatTopValue(u: any): string {
    const v = this.topSort.startsWith('requests')
      ? (this.topSort === 'requests_total' ? u.requests.total : this.topSort === 'requests_free' ? u.requests.free : u.requests.paid)
      : (this.topSort === 'tokens_total' ? (u.tokens.total ?? (u.tokens.free + u.tokens.paid)) : this.topSort === 'tokens_free' ? u.tokens.free : u.tokens.paid);
    return Number(v).toLocaleString('vi-VN');
  }

  kpiChange(val: number): string {
    const arrow = val >= 0 ? '▲' : '▼';
    return `${arrow} ${Math.abs(val).toFixed(2)}%`;
  }
}
