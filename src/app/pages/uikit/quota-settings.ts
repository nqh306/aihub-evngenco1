import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { QuotaProfileService, QuotaProfile, QuotaStatus } from '../../core/services/quota-profile.service';
import { ApiKeysService } from '../../core/services/api-keys.service';

@Component({
  selector: 'app-quota-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, TagModule,
    SelectModule, MultiSelectModule, DialogModule, ConfirmDialogModule,
    IconFieldModule, InputIconModule, TooltipModule
  ],
  providers: [ConfirmationService],
  template: `
  <div class="page p-4">
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Thiết lập Profile Định mức</h2>
        <button pButton label="Thêm Profile" icon="pi pi-plus" 
          (click)="openNewProfileDialog()"></button>
      </div>

      <p-table #dt
        [value]="profiles"
        dataKey="id"
        [rows]="10"
        [rowHover]="true"
        [showGridlines]="true"
        [paginator]="true"
        [rowsPerPageOptions]="[10,25,50]"
        [globalFilterFields]="['name', 'description', 'models']"
        [loading]="loading"
        styleClass="p-datatable-sm">

        <ng-template pTemplate="caption">
          <div class="flex justify-between items-center flex-column sm:flex-row gap-3">
            <button pButton label="Xóa bộ lọc" class="p-button-outlined" 
              icon="pi pi-filter-slash" (click)="clearFilters(dt)"></button>

            <p-iconfield iconPosition="left" class="ml-auto">
              <p-inputicon>
                <i class="pi pi-search"></i>
              </p-inputicon>
              <input #globalSearch pInputText type="text" 
                (input)="onGlobalFilter(dt, $event)" 
                placeholder="Tìm kiếm..." 
                class="w-full sm:w-80"/>
            </p-iconfield>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="min-width: 12rem" pSortableColumn="name">Tên Profile</th>
            <th style="min-width: 15rem">Model được phép</th>
            <th style="min-width: 10rem" pSortableColumn="tokenPerDay">Token/ngày</th>
            <th style="min-width: 10rem" pSortableColumn="tokenPerMonth">Token/tháng</th>
            <th style="min-width: 10rem">Trạng thái</th>
            <th style="width: 9rem; text-align: center">Thao tác</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-profile>
          <tr>
            <td>
              <span class="font-semibold">{{ profile.name }}</span>
              <p class="text-sm text-surface-500 mt-1">{{ profile.description }}</p>
            </td>
            <td>
              <div class="flex flex-wrap gap-1">
                <p-tag *ngFor="let modelId of profile.models" 
                  [value]="getModelNameById(modelId)" 
                  severity="secondary"
                  styleClass="text-xs dark:bg-surface-800">
                </p-tag>
                <span *ngIf="!profile.models || profile.models.length === 0" 
                  class="text-surface-400 text-sm">Chưa chọn model</span>
              </div>
            </td>
            <td>
              <span class="font-medium">{{ formatTokenLimit(profile.tokenPerDay) }}</span>
            </td>
            <td>
              <span class="font-medium">{{ formatTokenLimit(profile.tokenPerMonth) }}</span>
            </td>
            <td>
              <p-tag 
                [value]="profile.status === 'active' ? 'Đang dùng' : 'Ngừng'"
                [severity]="profile.status === 'active' ? 'success' : 'danger'">
              </p-tag>
            </td>
            <td>
              <div class="flex justify-center gap-1">
                <button pButton icon="pi pi-pencil" [rounded]="true" [text]="true" size="small"
                  severity="info" pTooltip="Sửa" tooltipPosition="top"
                  (click)="editProfile(profile)"></button>
                <button pButton icon="pi pi-trash" [rounded]="true" [text]="true" size="small"
                  severity="danger" pTooltip="Xóa" tooltipPosition="top"
                  (click)="confirmDelete(profile)"></button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  </div>

  <p-dialog 
    [header]="editingProfile ? 'Chỉnh sửa Profile' : 'Thêm Profile'"
    [(visible)]="showDialog" 
    [modal]="true" 
    [style]="{width:'720px'}" 
    [draggable]="false">

    <div class="group">
      <h3>Thông tin chung</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label>Tên Profile *</label>
          <input pInputText [(ngModel)]="form.name" class="w-full" />
        </div>
        <div>
          <label>Trạng thái</label>
          <p-select appendTo="body" class="w-full"
            [options]="statusOptions" optionLabel="label" optionValue="value"
            [(ngModel)]="form.status">
          </p-select>
        </div>
      </div>
    </div>

    <div class="group">
      <h3>Model được phép sử dụng</h3>
      <p-multiSelect appendTo="body" display="chip" class="w-full"
        [options]="apiConfigOptions" optionLabel="name" optionValue="model"
        placeholder="Chọn các model"
        [(ngModel)]="form.models">
      </p-multiSelect>
    </div>

    <div class="group">
      <h3>Giới hạn token</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label>Token / ngày (0 = không giới hạn)</label>
          <input pInputText type="number" [(ngModel)]="form.tokenPerDay" class="w-full" min="0"/>
        </div>
        <div>
          <label>Token / tháng (0 = không giới hạn)</label>
          <input pInputText type="number" [(ngModel)]="form.tokenPerMonth" class="w-full" min="0"/>
        </div>
      </div>
    </div>

    <div class="group last">
      <h3>Mô tả</h3>
      <textarea pInputText [(ngModel)]="form.description" class="w-full" rows="3"></textarea>
    </div>

    <ng-template pTemplate="footer">
      <button pButton label="Hủy" class="p-button-text" (click)="showDialog=false"></button>
      <button pButton label="Lưu" severity="primary" [disabled]="saving" [loading]="saving" (click)="save()"></button>
    </ng-template>
  </p-dialog>

  <p-confirmDialog [dismissableMask]="true"></p-confirmDialog>
  `,
  styles: [`
    .card { background: var(--p-content-background); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,.05); }
    :host ::ng-deep .p-datatable-sm .p-datatable-tbody > tr > td,
    :host ::ng-deep .p-datatable-sm .p-datatable-thead > tr > th { padding: 0.75rem 1rem; }
    .group { margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--p-surface-200); }
    .group.last { border-bottom: 0; }
    .group h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; }
    .group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; }
    :host ::ng-deep .p-multiselect { width: 100%; }
  `]
})
export class QuotaSettingsComponent implements OnInit {
  @ViewChild('globalSearch') globalSearch!: ElementRef;

  private svc = inject(QuotaProfileService);
  private apiKeysService = inject(ApiKeysService);
  private confirm = inject(ConfirmationService);

  profiles: QuotaProfile[] = [];
  apiConfigOptions: { name: string, model: string }[] = [];
  loading = false;
  saving = false;

  showDialog = false;
  editingProfile: QuotaProfile | null = null;
  form: Partial<QuotaProfile> = {};

  statusOptions = [
    { label: 'Đang sử dụng', value: 'active' as QuotaStatus },
    { label: 'Ngừng', value: 'inactive' as QuotaStatus },
  ];

  ngOnInit() {
    this.fetchProfiles();
    this.fetchApiConfigs();
  }

  fetchProfiles() {
    this.loading = true;
    this.svc.list().subscribe({
      next: res => {
        this.profiles = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  fetchApiConfigs() {
    this.apiKeysService.list().subscribe(configs => {
      this.apiConfigOptions = configs.map(c => ({ name: c.name, model: c.model }));
    });
  }

  emptyProfile(): Partial<QuotaProfile> {
    return { 
      name: '', 
      models: [], 
      tokenPerDay: 0, 
      tokenPerMonth: 0, 
      status: 'active', 
      description: '' 
    };
  }

  openNewProfileDialog() {
    this.editingProfile = null;
    this.form = this.emptyProfile();
    this.showDialog = true;
  }

  editProfile(profile: QuotaProfile) {
    this.editingProfile = profile;
    this.form = { ...profile, models: [...(profile.models || [])] };
    this.showDialog = true;
  }

  save() {
    this.saving = true;
    if (this.editingProfile) {
      this.svc.update(this.editingProfile.id, this.form).subscribe({
        next: () => { 
          this.saving = false; 
          this.showDialog = false; 
          this.fetchProfiles(); 
        },
        error: () => this.saving = false
      });
    } else {
      this.svc.add(this.form as Omit<QuotaProfile,'id'>).subscribe({
        next: () => { 
          this.saving = false; 
          this.showDialog = false; 
          this.fetchProfiles(); 
        },
        error: () => this.saving = false
      });
    }
  }
  
  confirmDelete(profile: QuotaProfile) {
    this.confirm.confirm({
      header: 'Xóa Profile',
      message: `Bạn có chắc muốn xóa profile <strong>${profile.name}</strong>?`,
      accept: () => this.svc.delete(profile.id).subscribe(() => this.fetchProfiles())
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  clearFilters(table: Table) {
    table.clear();
    if (this.globalSearch) {
      this.globalSearch.nativeElement.value = '';
    }
  }

  formatTokenLimit(limit: number): string {
    if (limit === 0) return 'Không giới hạn';
    if (limit >= 1000000) return (limit / 1000000).toFixed(1) + 'M';
    if (limit >= 1000) return (limit / 1000).toFixed(0) + 'K';
    return limit.toLocaleString();
  }

  getModelNameById(modelId: string): string {
      return this.apiConfigOptions.find(opt => opt.model === modelId)?.name || modelId;
  }
}

