// src/app/pages/uikit/ai-marketplace.routes.ts
// ✅ Tách thành 3 "phân trang" (3 pages) dùng child routes thay vì tabs
//   - /ai-marketplace/models
//   - /ai-marketplace/api-keys
//   - /ai-marketplace/usage
// Chỉ cần import AI_MARKETPLACE_ROUTES vào app.routes.ts là có 3 trang riêng.

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// PrimeNG v20 (standalone)
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { FileUpload } from 'primeng/fileupload';
import { ConfirmationService } from 'primeng/api';

// ===== Types =====
export type ModelCategory = 'llm' | 'embedding' | 'guardrail' | 'stt' | 'tts' | 'vision';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: ModelCategory;
  description: string;
  capabilities: string[];
  downloadUrl?: string;
  icon?: string; // URL hoặc emoji
  contextWindow?: string;
  performance?: string;
}

export interface APIKeyRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  modelId: string;
  modelName: string;
  reason: string;
  duration: number; // ngày
  status: RequestStatus;
  apiKey?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface APIUsage {
  apiKeyName: string;
  modelName: string;
  apiKey: string;
  status: 'active' | 'expired';
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  lastUsedAt?: string;
}

// ===== Mock Service (localStorage) =====
class AIMarketplaceService {
  private readonly MODELS_KEY = 'ai_marketplace_models';
  private readonly REQUESTS_KEY = 'ai_marketplace_requests';
  private readonly USAGE_KEY = 'ai_marketplace_usage';

  constructor() { this.initModels(); }

  private initModels() {
    const saved = localStorage.getItem(this.MODELS_KEY);
    if (!saved) {
      const models: AIModel[] = [
        { id: '1', name: 'DeepSeek-R1', provider: 'DeepSeek', category: 'llm', description: 'RL-enhanced reasoning; comparable to o1 on math/coding.', capabilities: ['Text Generation'], icon: '🔵' },
        { id: '2', name: 'DeepSeek-V3', provider: 'DeepSeek', category: 'llm', description: 'Strong MoE general-purpose model.', capabilities: ['Text Generation'], icon: '🔵' },
        { id: '3', name: 'FPT.AI-KIEM-v1.7', provider: 'FPT.AI', category: 'vision', description: 'Key information extraction, structured output.', capabilities: ['Image & Text To Text'], icon: '📄' },
        { id: '4', name: 'GLM-4.5', provider: 'Zai', category: 'llm', description: 'Reasoning, coding, agentic capabilities.', capabilities: ['Free Trial', 'Text Generation'], icon: '💚' }
      ];
      localStorage.setItem(this.MODELS_KEY, JSON.stringify(models));
    }
  }

  listModels() {
    const models = localStorage.getItem(this.MODELS_KEY);
    return { subscribe: (obs: any) => setTimeout(() => obs.next(models ? JSON.parse(models) : []), 60) };
  }

  listRequests() {
    const requests = localStorage.getItem(this.REQUESTS_KEY);
    return { subscribe: (obs: any) => setTimeout(() => obs.next(requests ? JSON.parse(requests) : []), 60) };
  }

  submitRequest(payload: Omit<APIKeyRequest, 'id' | 'createdAt' | 'status'>) {
    const requests = this.getAllRequests();
    const newRequest: APIKeyRequest = { ...payload, id: crypto.randomUUID(), status: 'pending', createdAt: new Date().toISOString() };
    requests.push(newRequest);
    localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests));
    return { subscribe: (obs: any) => setTimeout(() => obs.next(newRequest), 100) };
  }

  approveRequest(id: string, apiKey: string, approvedBy: string) {
    const requests = this.getAllRequests();
    const idx = requests.findIndex((r: APIKeyRequest) => r.id === id);
    if (idx >= 0) {
      const duration = requests[idx].duration;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);
      requests[idx] = { ...requests[idx], status: 'approved', apiKey, approvedBy, approvedAt: new Date().toISOString(), expiresAt: expiresAt.toISOString() };
      localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests));
    }
    return { subscribe: (obs: any) => setTimeout(() => obs.next(requests[idx]), 100) };
  }

  rejectRequest(id: string, reason: string) {
    const requests = this.getAllRequests();
    const idx = requests.findIndex((r: APIKeyRequest) => r.id === id);
    if (idx >= 0) {
      requests[idx] = { ...requests[idx], status: 'rejected', rejectionReason: reason };
      localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests));
    }
    return { subscribe: (obs: any) => setTimeout(() => obs.next(requests[idx]), 100) };
  }

  listUsage() {
    const usage = localStorage.getItem(this.USAGE_KEY);
    return { subscribe: (obs: any) => setTimeout(() => obs.next(usage ? JSON.parse(usage) : []), 60) };
  }

  private getAllRequests(): APIKeyRequest[] {
    const saved = localStorage.getItem(this.REQUESTS_KEY);
    return saved ? JSON.parse(saved) : [];
  }
}

/* ==========================================================
 *  SHELL COMPONENT: khung trang + thanh nav link 3 page
 * ========================================================== */
@Component({
  selector: 'app-aimarketplace-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
  <div class="page p-4">
    <div class="page-header mb-4">
      <div>
        <h1 class="page-title">AI Marketplace</h1>
        <p class="page-subtitle">Quản lý models, API keys và theo dõi usage</p>
      </div>
    </div>

    <nav class="tabs-nav">
      <a routerLink="models" routerLinkActive="active">AI Model</a>
      <a routerLink="api-keys" routerLinkActive="active">Quản lý API Key</a>
      <a routerLink="usage" routerLinkActive="active">API Usage</a>
    </nav>

    <div class="tab-outlet">
      <router-outlet></router-outlet>
    </div>
  </div>
  `,
  styles: [`
    .page { background: var(--p-surface-50); min-height: 100vh; }
    .page-header { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .page-subtitle { color: var(--p-text-secondary-color); margin: .5rem 0 0; }
    .tabs-nav { display:flex; gap:.5rem; background:white; padding:.5rem; border-radius:12px; margin-bottom:.75rem; }
    .tabs-nav a { padding:.75rem 1rem; border-radius:8px; text-decoration:none; color: var(--p-text-color); }
    .tabs-nav a.active { background: var(--p-primary-50); color: var(--p-primary-color); font-weight:600; }
    .tab-outlet { background: white; border-radius: 12px; padding: 1rem; min-height: 520px; }
  `]
})
export class AIMarketplaceShellComponent {}

/* ==========================================================
 *  PAGE 1: AI MODELS
 * ========================================================== */
@Component({
  selector: 'app-aimodels-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    InputTextModule, SelectModule, TagModule, DialogModule, TooltipModule,
    IconFieldModule, InputIconModule, ButtonModule, TableModule, TextareaModule,
    FileUpload
  ],
  providers: [AIMarketplaceService, ConfirmationService],
  template: `
  <div>
    <div class="content-header">
      <div class="search-section">
        <p-iconfield iconPosition="left" class="search-box">
          <p-inputicon><i class="pi pi-search"></i></p-inputicon>
          <input pInputText type="text" [(ngModel)]="searchKeyword" placeholder="Tìm model theo tên, provider..." class="w-full"/>
        </p-iconfield>
        <p-select class="filter-select" appendTo="body" [options]="categoryOptionsWithAll" optionLabel="label" optionValue="value" [(ngModel)]="filterCategory"></p-select>
      </div>
      <button pButton label="Thêm Model" icon="pi pi-plus" (click)="openAddModelDialog()"></button>
    </div>

    <div class="models-grid">
      <div *ngFor="let model of paginatedModels" class="model-card" (click)="viewModelDetail(model)">
        <div class="model-card-header">
          <div class="model-logo-container">
            <img *ngIf="model.icon && model.icon.startsWith('http')" [src]="model.icon" [alt]="model.name" class="model-logo"/>
            <span *ngIf="!model.icon || !model.icon.startsWith('http')" class="model-placeholder">{{ model.icon || '🤖' }}</span>
          </div>
          <div class="model-info">
            <h3 class="model-title">{{ model.name }}</h3>
            <p class="model-provider">{{ model.provider }}</p>
          </div>
        </div>
        <p class="model-desc">{{ model.description }}</p>
        <div class="model-footer">
          <p-tag [value]="model.capabilities[0] || 'Capability'" severity="info"></p-tag>
        </div>
      </div>

      <div *ngIf="paginatedModels.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>Không tìm thấy model nào</p>
      </div>
    </div>

    <div class="pagination-bar" *ngIf="filteredModels.length > 0">
      <span class="pagination-info">{{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredModels.length) }} / {{ filteredModels.length }} models</span>
      <div class="pagination-controls">
        <button pButton icon="pi pi-chevron-left" [disabled]="currentPage === 1" class="p-button-text p-button-sm" (click)="changePage(currentPage - 1)"></button>
        <span class="page-number">{{ currentPage }} / {{ totalPages }}</span>
        <button pButton icon="pi pi-chevron-right" [disabled]="currentPage === totalPages" class="p-button-text p-button-sm" (click)="changePage(currentPage + 1)"></button>
      </div>
    </div>

    <!-- Dialog: Add/Edit Model -->
    <p-dialog [header]="editingModel ? 'Chỉnh sửa Model' : 'Thêm Model Mới'" [(visible)]="showAddModelDialog" [modal]="true" [style]="{width:'700px'}">
      <div class="mb-4">
        <label>Logo Model</label>
        <div class="flex items-center gap-3">
          <div class="preview-logo">
            <img *ngIf="modelForm.icon && modelForm.icon.startsWith('data:')" [src]="modelForm.icon" [alt]="modelForm.name || 'Logo'" class="model-logo"/>
            <span *ngIf="!modelForm.icon || !modelForm.icon.startsWith('data:')" class="text-surface-400">Chưa có logo</span>
          </div>
          <div class="flex-1">
            <input pInputText [(ngModel)]="modelForm.icon" class="w-full mb-2" placeholder="Nhập URL logo (VD: https://example.com/logo.png)"/>
            <p-fileUpload mode="basic" chooseLabel="Hoặc chọn file" accept="image/*" [auto]="true" customUpload (uploadHandler)="onLogoSelected($event)"></p-fileUpload>
          </div>
        </div>
        <small class="text-surface-500 block mt-2">Khuyến nghị: Logo PNG/SVG, kích thước 200x200px</small>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Tên Model *</label>
          <input pInputText [(ngModel)]="modelForm.name" class="w-full" placeholder="VD: GPT-4 Turbo"/>
        </div>
        <div>
          <label>Provider *</label>
          <input pInputText [(ngModel)]="modelForm.provider" class="w-full" placeholder="VD: OpenAI"/>
        </div>
        <div class="md:col-span-2">
          <label>Danh mục *</label>
          <p-select appendTo="body" class="w-full" [options]="categoryOptions" optionLabel="label" optionValue="value" [(ngModel)]="modelForm.category"></p-select>
        </div>
        <div class="md:col-span-2">
          <label>Mô tả *</label>
          <textarea pTextarea [(ngModel)]="modelForm.description" rows="3" class="w-full" placeholder="Mô tả chi tiết về model..."></textarea>
        </div>
        <div class="md:col-span-2">
          <label>Capabilities (ngăn cách bởi dấu phẩy) *</label>
          <input pInputText [(ngModel)]="capabilitiesText" class="w-full" placeholder="VD: Text Generation, Code Generation"/>
        </div>
        <div>
          <label>Download URL</label>
          <input pInputText [(ngModel)]="modelForm.downloadUrl" class="w-full" placeholder="https://..."/>
        </div>
        <div>
          <label>Context Window</label>
          <input pInputText [(ngModel)]="modelForm.contextWindow" class="w-full" placeholder="VD: 128K tokens"/>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button pButton label="Hủy" class="p-button-text" (click)="showAddModelDialog=false"></button>
        <button pButton label="Lưu" severity="primary" [disabled]="savingModel" [loading]="savingModel" (click)="saveModel()"></button>
      </ng-template>
    </p-dialog>

    <!-- Dialog: Model Detail -->
    <p-dialog header="Chi tiết Model" [(visible)]="showModelDetailDialog" [modal]="true" [style]="{width:'700px'}">
      <div *ngIf="selectedModel">
        <div class="flex items-center gap-4 mb-4 p-4 bg-surface-50 rounded-lg">
          <div class="model-icon-large">
            <img *ngIf="selectedModel.icon && selectedModel.icon.startsWith('http')" [src]="selectedModel.icon" [alt]="selectedModel.name"/>
            <span *ngIf="!selectedModel.icon || !selectedModel.icon.startsWith('http')">{{ selectedModel.icon || '🤖' }}</span>
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-semibold">{{ selectedModel.name }}</h3>
            <p class="text-surface-500">{{ selectedModel.provider }}</p>
          </div>
        </div>

        <div class="detail-section">
          <h4>Danh mục</h4>
          <p-tag [value]="getCategoryLabel(selectedModel.category)" severity="info"></p-tag>
        </div>
        <div class="detail-section">
          <h4>Mô tả</h4>
          <p class="text-surface-700">{{ selectedModel.description }}</p>
        </div>
        <div class="detail-section">
          <h4>Capabilities</h4>
          <div class="flex flex-wrap gap-2">
            <p-tag *ngFor="let cap of selectedModel.capabilities" [value]="cap" severity="secondary"></p-tag>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button pButton label="Đóng" class="p-button-text" (click)="showModelDetailDialog=false"></button>
        <button pButton label="Sửa" icon="pi pi-pencil" severity="info" (click)="editModel(selectedModel!)"></button>
        <button pButton label="Xóa" icon="pi pi-trash" severity="danger" (click)="deleteModel(selectedModel!)"></button>
        <button pButton label="Request API" icon="pi pi-key" (click)="showModelDetailDialog=false; openRequestDialog(selectedModel!)"></button>
      </ng-template>
    </p-dialog>

    <!-- Dialog: Request API Key -->
    <p-dialog header="Request API Key" [(visible)]="showRequestDialog" [modal]="true" [style]="{width:'600px'}">
      <div *ngIf="selectedModel">
        <div class="mb-4 p-3 bg-surface-50 rounded">
          <div class="flex items-center gap-3">
            <span class="text-3xl">{{ selectedModel.icon }}</span>
            <div>
              <h3 class="font-semibold">{{ selectedModel.name }}</h3>
              <p class="text-sm text-surface-500">{{ selectedModel.provider }}</p>
            </div>
          </div>
        </div>
        <div class="mb-3">
          <label>Thời hạn sử dụng *</label>
          <p-select appendTo="body" class="w-full" [options]="durationOptions" optionLabel="label" optionValue="value" [(ngModel)]="requestForm.duration"></p-select>
        </div>
        <div class="mb-3">
          <label>Lý do yêu cầu *</label>
          <textarea pTextarea [(ngModel)]="requestForm.reason" rows="4" class="w-full" placeholder="Giải thích mục đích sử dụng..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Hủy" class="p-button-text" (click)="showRequestDialog=false"></button>
        <button pButton label="Gửi yêu cầu" severity="primary" [disabled]="submitting" [loading]="submitting" (click)="submitRequest()"></button>
      </ng-template>
    </p-dialog>
  </div>
  `,
  styles: [`
    .content-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
    .search-section{display:flex;gap:.75rem;flex:1;max-width:600px}
    .search-box{flex:1}
    .filter-select{min-width:200px}
    .models-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem;margin-bottom:1.5rem}
    .model-card{background:white;border:1px solid var(--p-surface-200);border-radius:12px;padding:1.25rem;cursor:pointer;transition:all .2s ease;display:flex;flex-direction:column;gap:1rem;min-height:180px}
    .model-card:hover{border-color:var(--p-primary-color);box-shadow:0 4px 12px rgba(0,0,0,.08);transform:translateY(-2px)}
    .model-card-header{display:flex;gap:1rem;align-items:flex-start}
    .model-logo-container{width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
    .model-logo{width:100%;height:100%;object-fit:contain;padding:8px}
    .model-placeholder{font-size:2rem}
    .model-info{flex:1;min-width:0}
    .model-title{font-size:1.125rem;font-weight:600;margin:0 0 .25rem 0}
    .model-provider{font-size:.875rem;color:var(--p-text-secondary-color);margin:0}
    .model-desc{font-size:.875rem;line-height:1.5;color:var(--p-text-secondary-color);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1}
    .model-footer{display:flex;align-items:center;justify-content:space-between}
    .empty-state{text-align:center;padding:3rem 1rem}
    .pagination-bar{display:flex;justify-content:space-between;align-items:center;padding-top:1rem;border-top:1px solid var(--p-surface-200)}
    .pagination-controls{display:flex;gap:1rem;align-items:center}
    .page-number{font-weight:500;min-width:60px;text-align:center}
    .preview-logo{width:80px;height:80px;border:2px solid var(--p-surface-200);border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--p-surface-50);overflow:hidden}
    .preview-logo img{width:100%;height:100%;object-fit:contain;padding:8px}
    .detail-section{margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--p-surface-200)}
    :host ::ng-deep .p-textarea{resize:vertical;min-height:100px}
  `]
})
export class AiModelsPageComponent implements OnInit {
  Math = Math;
  private svc = inject(AIMarketplaceService);
  private confirm = inject(ConfirmationService);

  models: AIModel[] = [];
  searchKeyword = '';
  filterCategory: ModelCategory | null = null;
  currentPage = 1;
  pageSize = 6;

  // dialogs
  showAddModelDialog = false;
  showModelDetailDialog = false;
  showRequestDialog = false;
  submitting = false;
  savingModel = false;

  selectedModel: AIModel | null = null;
  editingModel: AIModel | null = null;
  modelForm: Partial<AIModel> = {};
  capabilitiesText = '';
  requestForm = { duration: 30, reason: '' };

  categoryOptionsWithAll = [
    { label: 'Tất cả danh mục', value: null },
    { label: 'Large Language Model', value: 'llm' as ModelCategory },
    { label: 'Embedding Model', value: 'embedding' as ModelCategory },
    { label: 'Guardrail Model', value: 'guardrail' as ModelCategory },
    { label: 'Speech to Text', value: 'stt' as ModelCategory },
    { label: 'Text To Speech', value: 'tts' as ModelCategory },
    { label: 'Vision Language Model', value: 'vision' as ModelCategory },
  ];

  categoryOptions = [
    { label: 'Large Language Model', value: 'llm' as ModelCategory },
    { label: 'Embedding Model', value: 'embedding' as ModelCategory },
    { label: 'Guardrail Model', value: 'guardrail' as ModelCategory },
    { label: 'Speech to Text', value: 'stt' as ModelCategory },
    { label: 'Text To Speech', value: 'tts' as ModelCategory },
    { label: 'Vision Language Model', value: 'vision' as ModelCategory },
  ];

  durationOptions = [
    { label: '7 ngày', value: 7 },
    { label: '15 ngày', value: 15 },
    { label: '30 ngày', value: 30 },
    { label: '60 ngày', value: 60 },
    { label: '90 ngày', value: 90 },
  ];

  ngOnInit(){ this.fetchModels(); }

  fetchModels(){
    this.svc.listModels().subscribe({ next: (res: AIModel[]) => { this.models = res || []; this.currentPage = 1; } });
  }

  get filteredModels(): AIModel[] {
    return this.models.filter(m => {
      const kw = this.searchKeyword.trim().toLowerCase();
      const matchKeyword = !kw || m.name.toLowerCase().includes(kw) || m.description.toLowerCase().includes(kw) || m.provider.toLowerCase().includes(kw);
      const matchCategory = !this.filterCategory || m.category === this.filterCategory;
      return matchKeyword && matchCategory;
    });
  }
  get paginatedModels(): AIModel[] { const start=(this.currentPage-1)*this.pageSize; return this.filteredModels.slice(start, start+this.pageSize); }
  get totalPages(): number { return Math.ceil(this.filteredModels.length/this.pageSize)||1; }
  changePage(p:number){ if(p>=1 && p<=this.totalPages){ this.currentPage=p; window.scrollTo({top:0,behavior:'smooth'}); } }

  viewModelDetail(m:AIModel){ this.selectedModel=m; this.showModelDetailDialog=true; }
  editModel(m:AIModel){ this.editingModel=m; this.modelForm={...m}; this.capabilitiesText=(m.capabilities||[]).join(', '); this.showModelDetailDialog=false; this.showAddModelDialog=true; }
  openAddModelDialog(){ this.editingModel=null; this.modelForm={category:'llm',icon:'',capabilities:[]}; this.capabilitiesText=''; this.showAddModelDialog=true; }
  onLogoSelected(event:any){ const file=event.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=(e:any)=>this.modelForm.icon=e.target.result; reader.readAsDataURL(file); }
  getCategoryLabel(c:ModelCategory){ const map:Record<ModelCategory,string>={llm:'Large Language Model',embedding:'Embedding Model',guardrail:'Guardrail Model',stt:'Speech to Text',tts:'Text To Speech',vision:'Vision Language Model'}; return map[c]??c; }

  openRequestDialog(m:AIModel){ this.selectedModel=m; this.requestForm={duration:30,reason:''}; this.showRequestDialog=true; }
  submitRequest(){ if(!this.selectedModel||!this.requestForm.reason.trim()) return; this.submitting=true; const payload={userId:'user-123',userName:'Nguyễn Văn A',userEmail:'nguyenvana@evngenco1.vn',modelId:this.selectedModel.id,modelName:this.selectedModel.name,reason:this.requestForm.reason.trim(),duration:this.requestForm.duration}; this.svc.submitRequest(payload).subscribe({next:()=>{this.submitting=false; this.showRequestDialog=false;},error:()=>this.submitting=false}); }

  saveModel(){ if(!this.modelForm.name||!this.modelForm.provider||!this.modelForm.description||!this.capabilitiesText) return; this.savingModel=true; const capabilities=this.capabilitiesText.split(',').map(c=>c.trim()).filter(Boolean); if(this.editingModel){ const updated:AIModel={...(this.editingModel as AIModel),...(this.modelForm as AIModel),capabilities}; const idx=this.models.findIndex(m=>m.id===this.editingModel!.id); if(idx>=0){ this.models[idx]=updated; localStorage.setItem('ai_marketplace_models', JSON.stringify(this.models)); } } else { const newModel:AIModel={ id:crypto.randomUUID(), name:this.modelForm.name!, provider:this.modelForm.provider!, category:this.modelForm.category!, description:this.modelForm.description!, capabilities, icon:this.modelForm.icon||'🤖', downloadUrl:this.modelForm.downloadUrl, contextWindow:this.modelForm.contextWindow, performance:(this.modelForm as any).performance }; this.models.push(newModel); localStorage.setItem('ai_marketplace_models', JSON.stringify(this.models)); } this.savingModel=false; this.showAddModelDialog=false; this.currentPage=1; }
  deleteModel(m:AIModel){ const ok=confirm(`Xóa model ${m.name}?`); if(ok){ this.models=this.models.filter(x=>x.id!==m.id); localStorage.setItem('ai_marketplace_models', JSON.stringify(this.models)); this.showModelDetailDialog=false; } }
}

/* ==========================================================
 *  PAGE 2: API KEYS MANAGEMENT
 * ========================================================== */
@Component({
  selector: 'app-apikeys-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, SelectModule, DialogModule, TooltipModule],
  providers: [AIMarketplaceService],
  template: `
  <div>
    <div class="content-header">
      <h2 class="section-title">Quản lý API Key Requests</h2>
      <div class="header-actions">
        <p-select class="filter-select" appendTo="body" [options]="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc theo trạng thái" [(ngModel)]="filterRequestStatus" (onChange)="dt1.filter($event.value, 'status', 'equals')"></p-select>
      </div>
    </div>

    <p-table #dt1 [value]="requests" dataKey="id" [rows]="10" [rowHover]="true" [paginator]="true" [loading]="loadingRequests" [globalFilterFields]="['userName','userEmail','modelName','reason']" styleClass="modern-table">
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="userName">Người yêu cầu <p-sortIcon field="userName"/></th>
          <th>Model</th>
          <th>Thời hạn</th>
          <th pSortableColumn="status">Trạng thái <p-sortIcon field="status"/></th>
          <th pSortableColumn="createdAt">Ngày tạo <p-sortIcon field="createdAt"/></th>
          <th class="actions-col">Thao tác</th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-request>
        <tr>
          <td>
            <div class="user-info">
              <span class="user-name">{{ request.userName }}</span>
              <span class="user-email">{{ request.userEmail }}</span>
            </div>
          </td>
          <td><span class="model-name-text">{{ request.modelName }}</span></td>
          <td><span class="duration-badge">{{ request.duration }} ngày</span></td>
          <td><p-tag [value]="getStatusLabel(request.status)" [severity]="getStatusSeverity(request.status)"></p-tag></td>
          <td class="date-col">{{ request.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
          <td class="actions-col">
            <div class="action-buttons">
              <button pButton icon="pi pi-eye" [rounded]="true" [text]="true" size="small" pTooltip="Xem chi tiết" tooltipPosition="top" (click)="viewRequest(request)"></button>
              <button pButton icon="pi pi-check" [rounded]="true" [text]="true" size="small" severity="success" pTooltip="Phê duyệt" tooltipPosition="top" (click)="openApproveDialog(request)" *ngIf="request.status==='pending'"></button>
              <button pButton icon="pi pi-times" [rounded]="true" [text]="true" size="small" severity="danger" pTooltip="Từ chối" tooltipPosition="top" (click)="openRejectDialog(request)" *ngIf="request.status==='pending'"></button>
            </div>
          </td>
        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="6">
            <div class="empty-state"><i class="pi pi-inbox"></i><p>Chưa có request nào</p></div>
          </td>
        </tr>
      </ng-template>
    </p-table>

    <!-- View Dialog -->
    <p-dialog header="Chi tiết API Key" [(visible)]="showDetailDialog" [modal]="true" [style]="{width:'700px'}">
      <div *ngIf="selectedRequest">
        <div class="detail-section"><h4>Model</h4><p class="font-semibold text-lg">{{ selectedRequest.modelName }}</p></div>
        <div class="detail-section"><h4>Người yêu cầu</h4><p>{{ selectedRequest.userName }} ({{ selectedRequest.userEmail }})</p></div>
        <div class="detail-section"><h4>Lý do</h4><div class="content-box">{{ selectedRequest.reason }}</div></div>
      </div>
      <ng-template pTemplate="footer"><button pButton label="Đóng" (click)="showDetailDialog=false"></button></ng-template>
    </p-dialog>

    <!-- Approve -->
    <p-dialog header="Phê duyệt Request" [(visible)]="showApproveDialog" [modal]="true" [style]="{width:'500px'}">
      <div class="mb-3"><label>API Key *</label><input pInputText [(ngModel)]="approveApiKey" class="w-full" placeholder="Nhập API Key"/></div>
      <ng-template pTemplate="footer">
        <button pButton label="Hủy" class="p-button-text" (click)="showApproveDialog=false"></button>
        <button pButton label="Phê duyệt" severity="success" (click)="confirmApprove()"></button>
      </ng-template>
    </p-dialog>

    <!-- Reject -->
    <p-dialog header="Từ chối Request" [(visible)]="showRejectDialog" [modal]="true" [style]="{width:'500px'}">
      <div class="mb-3"><label>Lý do từ chối *</label><textarea pTextarea [(ngModel)]="rejectReason" rows="4" class="w-full" placeholder="Nhập lý do..."></textarea></div>
      <ng-template pTemplate="footer">
        <button pButton label="Hủy" class="p-button-text" (click)="showRejectDialog=false"></button>
        <button pButton label="Xác nhận" severity="danger" (click)="confirmReject()"></button>
      </ng-template>
    </p-dialog>
  </div>
  `,
  styles: [`
    .content-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
    .filter-select{min-width:200px}
    .user-info{display:flex;flex-direction:column;gap:.25rem}
    .duration-badge{display:inline-block;padding:.25rem .75rem;background:var(--p-surface-100);border-radius:16px;font-size:.875rem;font-weight:500}
    .date-col{color:var(--p-text-secondary-color);font-size:.875rem}
    .actions-col{text-align:center;width:140px}
    .action-buttons{display:flex;gap:.5rem;justify-content:center}
    .detail-section{margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--p-surface-200)}
    .content-box{white-space:pre-wrap;line-height:1.6;background:var(--p-surface-50);padding:1rem;border-radius:8px}
    :host ::ng-deep .modern-table .p-datatable-thead>tr>th{background:var(--p-surface-50)}
  `]
})
export class ApiKeysPageComponent implements OnInit {
  private svc = inject(AIMarketplaceService);

  requests: APIKeyRequest[] = [];
  loadingRequests = false;
  filterRequestStatus: RequestStatus | null = null;

  showDetailDialog=false; showApproveDialog=false; showRejectDialog=false;
  selectedRequest: APIKeyRequest | null = null;
  approveApiKey=''; rejectReason='';

  statusOptions = [
    { label: 'Chờ duyệt', value: 'pending' as RequestStatus },
    { label: 'Đã phê duyệt', value: 'approved' as RequestStatus },
    { label: 'Từ chối', value: 'rejected' as RequestStatus },
  ];

  ngOnInit(){ this.fetchRequests(); }
  fetchRequests(){ this.loadingRequests=true; this.svc.listRequests().subscribe({next:(res:APIKeyRequest[])=>{this.requests=res; this.loadingRequests=false;}, error:()=>this.loadingRequests=false}); }

  viewRequest(r:APIKeyRequest){ this.selectedRequest=r; this.showDetailDialog=true; }
  openApproveDialog(r:APIKeyRequest){ this.selectedRequest=r; this.approveApiKey=''; this.showApproveDialog=true; }
  confirmApprove(){ if(!this.selectedRequest||!this.approveApiKey.trim()) return; this.svc.approveRequest(this.selectedRequest.id,this.approveApiKey.trim(),'Admin KHCNĐMST').subscribe({next:()=>{this.showApproveDialog=false; this.fetchRequests();}}); }
  openRejectDialog(r:APIKeyRequest){ this.selectedRequest=r; this.rejectReason=''; this.showRejectDialog=true; }
  confirmReject(){ if(!this.selectedRequest||!this.rejectReason.trim()) return; this.svc.rejectRequest(this.selectedRequest.id,this.rejectReason.trim()).subscribe({next:()=>{this.showRejectDialog=false; this.fetchRequests();}}); }

  getStatusLabel(s:RequestStatus){ return s==='pending'?'Chờ duyệt':s==='approved'?'Đã phê duyệt':'Từ chối'; }
  getStatusSeverity(s:RequestStatus):'warn'|'success'|'danger'{ return s==='pending'?'warn':s==='approved'?'success':'danger'; }
}

/* ==========================================================
 *  PAGE 3: API USAGE
 * ========================================================== */
@Component({
  selector: 'app-aiusage-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, TooltipModule],
  providers: [AIMarketplaceService],
  template: `
  <div>
    <div class="content-header">
      <h2 class="section-title">Theo dõi API Usage</h2>
      <div class="header-actions">
        <button pButton label="Xuất CSV" icon="pi pi-download" class="p-button-outlined" size="small"></button>
        <button pButton icon="pi pi-refresh" class="p-button-text" size="small" pTooltip="Làm mới dữ liệu" (click)="fetchUsage()"></button>
      </div>
    </div>

    <div class="stats-grid mb-4">
      <div class="stat-card"><div class="stat-icon blue"><i class="pi pi-server"></i></div><div class="stat-content"><span class="stat-label">Total Requests</span><span class="stat-value">{{ getTotalRequests() | number }}</span></div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="pi pi-arrow-down"></i></div><div class="stat-content"><span class="stat-label">Input Tokens</span><span class="stat-value">{{ formatNumber(getTotalInputTokens()) }}</span></div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="pi pi-arrow-up"></i></div><div class="stat-content"><span class="stat-label">Output Tokens</span><span class="stat-value">{{ formatNumber(getTotalOutputTokens()) }}</span></div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="pi pi-chart-line"></i></div><div class="stat-content"><span class="stat-label">Total Tokens</span><span class="stat-value">{{ formatNumber(getTotalTokens()) }}</span></div></div>
    </div>

    <p-table [value]="usageData" dataKey="apiKey" [rows]="10" [rowHover]="true" [paginator]="true" [loading]="loadingUsage" styleClass="modern-table">
      <ng-template pTemplate="header">
        <tr>
          <th>API Key</th>
          <th>Model</th>
          <th pSortableColumn="totalRequests">Requests <p-sortIcon field="totalRequests"/></th>
          <th pSortableColumn="inputTokens">Input <p-sortIcon field="inputTokens"/></th>
          <th pSortableColumn="outputTokens">Output <p-sortIcon field="outputTokens"/></th>
          <th pSortableColumn="totalTokens">Total <p-sortIcon field="totalTokens"/></th>
          <th>Status</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-usage>
        <tr>
          <td><code class="api-key-code">{{ maskApiKey(usage.apiKey) }}</code></td>
          <td><span class="model-name-text">{{ usage.modelName }}</span></td>
          <td class="number-col">{{ usage.totalRequests | number }}</td>
          <td class="number-col">{{ formatNumber(usage.inputTokens) }}</td>
          <td class="number-col">{{ formatNumber(usage.outputTokens) }}</td>
          <td class="number-col strong">{{ formatNumber(usage.totalTokens) }}</td>
          <td><p-tag [value]="usage.status==='active'?'Active':'Expired'" [severity]="usage.status==='active'?'success':'secondary'"></p-tag></td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr><td colspan="7"><div class="empty-state"><i class="pi pi-chart-line"></i><p>Chưa có dữ liệu usage</p></div></td></tr>
      </ng-template>
    </p-table>

    <div class="update-time"><i class="pi pi-clock"></i> Cập nhật lúc: {{ latestDataTime }}</div>
  </div>
  `,
  styles: [`
    .content-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}
    .stat-card{background:white;border:1px solid var(--p-surface-200);border-radius:12px;padding:1.25rem;display:flex;gap:1rem;align-items:center}
    .stat-icon{width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white}
    .stat-icon.blue{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}
    .stat-icon.green{background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%)}
    .stat-icon.orange{background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)}
    .stat-icon.purple{background:linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)}
    .stat-content{display:flex;flex-direction:column;gap:.25rem}
    .stat-label{font-size:.875rem;color:var(--p-text-secondary-color)}
    .stat-value{font-size:1.5rem;font-weight:700}
    .api-key-code{font-family:'Monaco','Courier New',monospace;font-size:.75rem;background:var(--p-surface-100);padding:.25rem .5rem;border-radius:4px}
    .number-col{text-align:right;font-variant-numeric:tabular-nums}
    .number-col.strong{font-weight:600;color:var(--p-primary-color)}
    .update-time{display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:var(--p-text-secondary-color);margin-top:1rem;padding-top:1rem;border-top:1px solid var(--p-surface-200)}
  `]
})
export class AiUsagePageComponent implements OnInit {
  private svc = inject(AIMarketplaceService);

  usageData: APIUsage[] = [];
  loadingUsage=false; latestDataTime=new Date().toLocaleString('vi-VN');

  ngOnInit(){ this.fetchUsage(); }
  fetchUsage(){ this.loadingUsage=true; this.svc.listUsage().subscribe({next:(res:APIUsage[])=>{this.usageData=res; this.loadingUsage=false; this.latestDataTime=new Date().toLocaleString('vi-VN');}, error:()=>this.loadingUsage=false}); }

  maskApiKey(key:string){ if(!key||key.length<=8) return key; return `${key.slice(0,4)}••••••••${key.slice(-4)}`; }
  formatNumber(num:number){ if(num>=1_000_000) return (num/1_000_000).toFixed(1)+'M'; if(num>=1_000) return Math.round(num/1_000)+'K'; return num.toLocaleString(); }
  getTotalRequests(){ return this.usageData.reduce((s,u)=>s+u.totalRequests,0); }
  getTotalInputTokens(){ return this.usageData.reduce((s,u)=>s+u.inputTokens,0); }
  getTotalOutputTokens(){ return this.usageData.reduce((s,u)=>s+u.outputTokens,0); }
  getTotalTokens(){ return this.usageData.reduce((s,u)=>s+u.totalTokens,0); }
}

/* ==========================================================
 *  ROUTES: export để add vào app.routes.ts
 * ========================================================== */
export const AI_MARKETPLACE_ROUTES: Routes = [
  {
    path: 'ai-marketplace',
    component: AIMarketplaceShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'models' },
      { path: 'models', component: AiModelsPageComponent },
      { path: 'api-keys', component: ApiKeysPageComponent },
      { path: 'usage', component: AiUsagePageComponent },
    ],
  },
];
