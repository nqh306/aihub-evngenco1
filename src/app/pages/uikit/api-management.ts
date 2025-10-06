import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { Select, SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FileUploadModule } from 'primeng/fileupload';
import { ApiKeysService, ApiConfig, ApiStatus, Provider, CostType } from '../../core/services/api-keys.service';

// Interface để định nghĩa kiểu dữ liệu cho tùy chọn nhà cung cấp
interface ProviderOption {
  label: string;
  value: Provider;
  image: string | null;
}

@Component({
  selector: 'app-api-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, DialogModule, ConfirmDialogModule,
    IconFieldModule, InputIconModule, AutoCompleteModule, InputNumberModule,
    SelectButtonModule, FileUploadModule
  ],
  providers: [ConfirmationService],
  template: `
  <div class="page p-4">
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Quản lý API</h2>
        <button pButton label="Thêm cấu hình" icon="pi pi-plus" (click)="openNewDialog()"></button>
      </div>

      <p-table #dt
        [value]="list"
        dataKey="id"
        [rows]="10"
        [rowHover]="true"
        [paginator]="true"
        [globalFilterFields]="['name', 'provider', 'model', 'description']"
        [loading]="loading"
        styleClass="p-datatable-sm">

        <ng-template pTemplate="caption">
          <div class="flex justify-between items-center flex-column sm:flex-row gap-3">
             <button pButton label="Xóa bộ lọc" class="p-button-outlined" icon="pi pi-filter-slash" (click)="clearFilters(dt)"></button>
            <p-iconfield iconPosition="left" class="ml-auto">
              <p-inputicon><i class="pi pi-search"></i></p-inputicon>
              <input #globalSearch pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Tìm kiếm..." class="w-full sm:w-80"/>
            </p-iconfield>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="min-width: 12rem">Nhà cung cấp</th>
            <th style="min-width: 12rem" pSortableColumn="name">Tên cấu hình</th>
            <th style="min-width: 10rem">Model</th>
            <th style="min-width: 12rem">API Key</th>
            <th style="min-width: 12rem">Cost ($/1M tokens)</th>
            <th style="min-width: 8rem">Trạng thái</th>
            <th style="width: 10rem; text-align: center">Thao tác</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-row>
          <tr>
            <td>
              <div class="flex items-center gap-2">
                <img *ngIf="getProviderImage(row.provider)" [src]="getProviderImage(row.provider)" [alt]="row.provider" class="provider-logo"/>
                <span class="font-medium">{{ row.provider }}</span>
              </div>
            </td>
            <td><span class="font-semibold">{{ row.name }}</span></td>
            <td><p-tag [value]="row.model" severity="secondary"></p-tag></td>
            <td>
              <div class="flex items-center gap-2 justify-between">
                <code class="api-key-display">{{ showKey[row.id] ? row.apiKey : svc.maskKey(row.apiKey) }}</code>
                <button pButton [icon]="showKey[row.id] ? 'pi pi-eye-slash' : 'pi pi-eye'" [rounded]="true" [text]="true" size="small" (click)="toggleShow(row.id)"></button>
              </div>
            </td>
            <td>
                <div *ngIf="row.costType === 'free'; else paidCost" class="cost-free">
                    <i class="pi pi-check-circle mr-1"></i> Miễn phí
                </div>
                <ng-template #paidCost>
                    <div class="cost-paid">
                        <div>In: <strong>{{ row.costInput | currency:'USD':'symbol':'1.2-4' }}</strong></div>
                        <div>Out: <strong>{{ row.costOutput | currency:'USD':'symbol':'1.2-4' }}</strong></div>
                    </div>
                </ng-template>
            </td>
            <td>
              <p-tag [value]="row.status === 'active' ? 'Đang dùng' : 'Ngừng'" [severity]="row.status === 'active' ? 'success' : 'danger'"></p-tag>
            </td>
            <td>
              <div class="flex justify-center gap-1">
                <button pButton icon="pi pi-pencil" [rounded]="true" [text]="true" size="small" severity="info" pTooltip="Sửa" (click)="edit(row)"></button>
                <button pButton icon="pi pi-trash" [rounded]="true" [text]="true" size="small" severity="danger" pTooltip="Xóa" (click)="confirmDelete(row)"></button>
              </div>
            </td>
          </tr>
        </ng-template>
        <!-- ... các template khác ... -->
      </p-table>
    </div>
  </div>

  <p-dialog header="{{editing ? 'Chỉnh sửa cấu hình' : 'Thêm cấu hình'}}"
            [(visible)]="showDialog" [modal]="true" [style]="{width:'760px'}">
    <div class="group">
      <h3>Thông tin chung</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label>Nhà cung cấp *</label>
          <p-autoComplete [(ngModel)]="form.provider" [suggestions]="filteredProviders" (completeMethod)="searchProvider($event)" [dropdown]="true" appendTo="body" styleClass="w-full" inputStyleClass="w-full"></p-autoComplete>
        </div>
        <div><label>Tên cấu hình *</label><input pInputText [(ngModel)]="form.name" class="w-full"/></div>
      </div>
      
      <div *ngIf="isCustomProvider() || editing" class="mt-4 p-3 rounded-md border border-dashed border-surface-300 bg-surface-50">
          <label class="font-semibold text-sm">Logo cho nhà cung cấp</label>
          <div class="flex items-center gap-3 mt-2">
              <img [src]="newProviderImage || 'https://placehold.co/40x40/e2e8f0/718096?text=Logo'" 
                  alt="Logo preview" class="provider-logo-preview"/>
              <p-fileUpload mode="basic" 
                            name="logo" 
                            accept="image/*" 
                            [auto]="true" 
                            customUpload 
                            chooseLabel="Tải lên..."
                            (uploadHandler)="onProviderLogoSelect($event)"></p-fileUpload>
          </div>
          <small class="text-surface-500 block mt-1">Tải lên logo nếu bạn đang thêm hoặc sửa một nhà cung cấp.</small>
      </div>
    </div>
    <div class="group">
      <h3>Model</h3>
      <input pInputText [(ngModel)]="form.model" class="w-full" list="modelSuggestions"/>
      <datalist id="modelSuggestions"><option *ngFor="let m of modelOptions" [value]="m.value">{{ m.label }}</option></datalist>
    </div>
    <div class="group">
      <h3>Kết nối</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label>API Key *</label>
          <div class="key-input">
            <input pInputText [(ngModel)]="form.apiKey" class="w-full" [type]="showFormKey ? 'text' : 'password'"/>
            <button pButton [icon]="showFormKey ? 'pi pi-eye-slash' : 'pi pi-eye'" [text]="true" [rounded]="true" (click)="showFormKey = !showFormKey"></button>
          </div>
        </div>
        <div><label>Base URL</label><input pInputText [(ngModel)]="form.baseUrl" class="w-full"/></div>
      </div>
    </div>
    
    <div class="group">
        <h3>Thông tin chi phí</h3>
        <div>
            <label class="mb-2">Loại chi phí</label>
            <p-selectButton [options]="costTypeOptions" [(ngModel)]="form.costType" optionLabel="label" optionValue="value"></p-selectButton>
        </div>
        <div *ngIf="form.costType === 'paid'" class="grid grid-cols-2 gap-3 mt-4">
            <div>
                <label>Input Cost ($ / 1M tokens)</label>
                <p-inputNumber [(ngModel)]="form.costInput" mode="currency" currency="USD" locale="en-US" [minFractionDigits]="2" [maxFractionDigits]="4" styleClass="w-full" inputStyleClass="w-full"></p-inputNumber>
            </div>
            <div>
                <label>Output Cost ($ / 1M tokens)</label>
                <p-inputNumber [(ngModel)]="form.costOutput" mode="currency" currency="USD" locale="en-US" [minFractionDigits]="2" [maxFractionDigits]="4" styleClass="w-full" inputStyleClass="w-full"></p-inputNumber>
            </div>
        </div>
    </div>

    <div class="group last">
      <h3>Khác</h3>
      <div class="grid grid-cols-2 gap-3">
        <div><label>Trạng thái</label><p-select appendTo="body" class="w-full" [options]="statusOptions" optionLabel="label" optionValue="value" [(ngModel)]="form.status"></p-select></div>
        <div><label>Mô tả</label><input pInputText [(ngModel)]="form.description" class="w-full"/></div>
      </div>
    </div>

    <ng-template pTemplate="footer">
      <button pButton label="Hủy" class="p-button-text" (click)="showDialog=false"></button>
      <button pButton label="Lưu" severity="primary" [disabled]="saving" (click)="save()"></button>
    </ng-template>
  </p-dialog>

  <p-confirmDialog [dismissableMask]="true"></p-confirmDialog>
  `,
  styles: [`
    .provider-logo { width: 20px; height: 20px; object-fit: contain; }
    .api-key-display { font-family: 'Monaco', monospace; font-size: 0.75rem; background: var(--p-surface-50); padding: 0.25rem 0.5rem; border-radius: 4px; }
    .key-input { display: flex; align-items: center; gap: 0.5rem; }
    .group { margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--p-surface-200); }
    .group.last { border-bottom: 0; }
    .group h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; }
    .group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; }
    .cost-free { color: var(--p-green-600); font-weight: 600; display: flex; align-items: center; }
    .cost-paid { font-size: 0.875rem; line-height: 1.4; }
    :host ::ng-deep .p-inputnumber-input { width: 100%; }
    .provider-logo-preview { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--p-surface-300); object-fit: contain; background-color: var(--p-surface-100); }
  `]
})
export class ApiManagementComponent implements OnInit {
  svc = inject(ApiKeysService);
  confirm = inject(ConfirmationService);

  list: ApiConfig[] = [];
  loading = false;
  filteredProviders: any[] = [];

  showDialog = false;
  editing: ApiConfig | null = null;
  saving = false;
  showFormKey = false;
  showKey: Record<string, boolean> = {};

  form: Partial<ApiConfig> = {};
  newProviderImage: string | null = null;

  costTypeOptions = [
      { label: 'Miễn phí', value: 'free' as CostType },
      { label: 'Trả phí', value: 'paid' as CostType }
  ];

  providerOptions: ProviderOption[] = [
    { label: 'OpenAI (ChatGPT)', value: 'OpenAI' as Provider, image: 'assets/demo/images/ai-vendors/openai.svg' },
    { label: 'Google (Gemini)', value: 'Google' as Provider, image: 'assets/demo/images/ai-vendors/google.svg' },
    { label: 'xAI (Grok)', value: 'xAI' as Provider, image: 'assets/demo/images/ai-vendors/xai.svg' },
    { label: 'Trợ lý EVNGENCO1', value: 'EVNGENCO1' as Provider, image: 'assets/logo-evn.png' }
  ];

  modelOptions = [
    { label: 'gpt-4.1', value: 'gpt-4.1' }, { label: 'gpt-4o', value: 'gpt-4o' },
    { label: 'Gemini 1.5 Pro', value: 'Gemini 1.5 Pro' },
    { label: 'Trợ lý EVNGENCO1', value: 'Trợ lý EVNGENCO1' }
  ];
  statusOptions = [
    { label: 'Đang dùng', value: 'active' as ApiStatus },
    { label: 'Ngừng', value: 'inactive' as ApiStatus }
  ];

  ngOnInit() { this.fetch(); }

  fetch() { 
    this.loading = true;
    this.svc.list().subscribe({
      next: res => { this.list = res; this.loading = false; },
      error: () => this.loading = false
    }); 
  }

  empty(): Partial<ApiConfig> { 
    this.newProviderImage = null;
    return { 
      provider:'OpenAI', name:'', model:'', apiKey:'', status:'active', 
      costType: 'paid', costInput: 0, costOutput: 0 
    }; 
  }

  openNewDialog(){ this.editing = null; this.form = this.empty(); this.showDialog = true; }
  
  edit(row: ApiConfig){ 
    this.editing = row; 
    this.form = {...row}; 
    this.newProviderImage = this.getProviderImage(row.provider);
    this.showDialog = true; 
  }

  isCustomProvider(): boolean {
    if (!this.form.provider) { return false; }
    // p-autocomplete sẽ trả về object nếu chọn từ list, và string nếu gõ mới
    const providerValue = typeof this.form.provider === 'object' ? (this.form.provider as any).value : this.form.provider;
    return !this.providerOptions.some(p => p.value.toLowerCase() === providerValue.toLowerCase());
  }

  onProviderLogoSelect(event: any) {
    const file = event.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => { this.newProviderImage = e.target.result; };
    reader.readAsDataURL(file);
  }

  save(){
    this.saving = true;
    if (this.form.costType === 'free') {
        this.form.costInput = 0;
        this.form.costOutput = 0;
    }

    let providerValue = this.form.provider as any;
    if (typeof providerValue === 'object' && providerValue !== null) {
        providerValue = providerValue.value;
    }
    this.form.provider = providerValue;
    
    // Logic cập nhật hoặc thêm mới nhà cung cấp vào danh sách hiển thị
    const providerOpt = this.providerOptions.find(p => p.value === this.form.provider);
    if (providerOpt) { // Nhà cung cấp đã tồn tại
        if (this.newProviderImage && providerOpt.image !== this.newProviderImage) {
            providerOpt.image = this.newProviderImage;
        }
    } else if (typeof this.form.provider === 'string') { // Nhà cung cấp mới
        this.providerOptions.push({
            label: this.form.provider,
            value: this.form.provider as Provider,
            image: this.newProviderImage 
        });
    }

    if (this.editing) {
      this.svc.update(this.editing.id, this.form).subscribe({ 
        next: () => { this.saving = false; this.showDialog = false; this.fetch(); }
      });
    } else {
      const { id, createdAt, ...payload } = this.form;
      this.svc.add(payload as any).subscribe({ 
        next: () => { this.saving = false; this.showDialog = false; this.fetch(); }
      });
    }
  }

  confirmDelete(row: ApiConfig){
    this.confirm.confirm({
      header: 'Xóa cấu hình API',
      message: `Bạn có chắc muốn xóa <strong>${row.name}</strong>?`,
      accept: () => this.svc.delete(row.id).subscribe(() => this.fetch())
    });
  }

  toggleShow(id: string){ this.showKey[id] = !this.showKey[id]; }
  onGlobalFilter(table: Table, event: Event) { table.filterGlobal((event.target as HTMLInputElement).value, 'contains'); }
  clearFilters(table: Table) { table.clear(); }
  searchProvider(event: any) {
    const query = event.query.toLowerCase();
    this.filteredProviders = this.providerOptions.filter(p => p.label.toLowerCase().includes(query));
  }
  getProviderImage(provider: string): string | null {
    const option = this.providerOptions.find(p => p.value === provider);
    return option?.image || null;
  }
}

