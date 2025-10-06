import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { Select } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { Subscription } from 'rxjs';
import { AiModelService } from '../../core/services/ai-model.service'; 
import { AICategory, AIModel } from '../../core/models/ai-models.model';
import { AiModelSelectorComponent } from '../../core/shared/components/ai-model-selector.component';
import { AuthService } from '../../core/services/auth.service'; // **Import AuthService**

interface SelectOption { name: string; value: string; }

@Component({
  selector: 'app-initiative-writer',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule,
    TooltipModule, PopoverModule, Select, FileUploadModule, AiModelSelectorComponent
  ],
  template: `
    <div class="page-container h-full">
      <div class="col left">
        <div class="left-panel-container">
          <div class="header-left"><h1 class="title">Hỗ trợ viết sáng kiến</h1></div>
          <div class="field">
            <label class="label">Chọn model AI</label>
            <div class="model-selector" (click)="modelPopover.toggle($event)">
              <div class="model-info"><img [src]="selectedModel.icon" [alt]="selectedModel.name" *ngIf="selectedModel.icon"/><span>{{ selectedModel.name }}</span></div>
              <i class="pi pi-chevron-down"></i>
            </div>
          </div>
          <div class="field"><label class="label">Tên sáng kiến <span class="req">*</span></label><textarea pInputText [(ngModel)]="initiativeName" placeholder="Ví dụ: Ứng dụng AI để tối ưu hóa lịch sửa chữa" rows="2" class="control textarea"></textarea></div>
          <div class="field"><label class="label">Lĩnh vực áp dụng</label><p-select [options]="applicationFields" [(ngModel)]="selectedField" optionLabel="name" placeholder="Chọn lĩnh vực" styleClass="w-full custom-dropdown" appendTo="body"></p-select></div>
          <div class="field"><label class="label">Hiện trạng trước khi có sáng kiến <span class="req">*</span></label><textarea pInputText [(ngModel)]="currentState" placeholder="Mô tả vấn đề, khó khăn hoặc điểm cần cải tiến" rows="2" class="control textarea"></textarea></div>
          <div class="field"><label class="label">Nội dung giải pháp <span class="req">*</span></label><textarea pInputText [(ngModel)]="solution" placeholder="Mô tả chi tiết giải pháp, tính mới, tính sáng tạo" rows="2" class="control textarea"></textarea></div>
          <div class="field"><label class="label">Hiệu quả dự kiến <span class="req">*</span></label><textarea pInputText [(ngModel)]="expectedBenefits" placeholder="Về kinh tế, kỹ thuật, an toàn, môi trường..." rows="2" class="control textarea"></textarea></div>
          <div class="field"><label class="label">Tệp đính kèm (tùy chọn)</label><div class="attachment-grid"><p-fileUpload mode="basic" name="relatedDocs[]" chooseLabel="Tài liệu liên quan" chooseIcon="pi pi-paperclip" [auto]="true" styleClass="p-button-secondary p-button-outlined"></p-fileUpload><p-fileUpload mode="basic" name="sampleDocs[]" chooseLabel="File mẫu sáng kiến" chooseIcon="pi pi-file" [auto]="true" styleClass="p-button-secondary p-button-outlined"></p-fileUpload></div></div>
        </div>
        <div class="actions-footer"><button pButton label="Xóa sạch" icon="pi pi-trash" class="btn btn-clear" (click)="clearAll()"></button><button pButton label="Viết sáng kiến" icon="pi pi-file-edit" class="btn btn-main" (click)="generateInitiative()"></button></div>
      </div>
      <div class="col right">
        <div class="output-container">
            <div *ngIf="!generatedContent" class="empty"><i class="pi pi-file-edit icon-empty"></i><p>Nội dung sáng kiến sẽ được tạo ở đây.</p></div>
            <div *ngIf="generatedContent" class="card"><div class="card-head"><h3>Bản thảo Sáng kiến</h3><div class="tools"><button pButton icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Sao chép" tooltipPosition="top" (click)="copyContent()"></button></div></div><div class="card-body"><div class="result-content" [innerHTML]="generatedContent"></div></div></div>
        </div>
      </div>
      <p-popover #modelPopover [appendTo]="'body'" [style]="{width:'360px'}" styleClass="model-op"><ng-template pTemplate="content"><app-ai-model-selector [popoverRef]="modelPopover" (modelSelected)="onModelSelected($event)"></app-ai-model-selector></ng-template></p-popover>
    </div>
  `,
  styles: [
    `
      :host {
        --space-2: 8px;
        --space-3: 12px;
        --space-4: 16px;
        --radius: 8px;
        --text-color-light: #555;
        --text-color-dark: #222;
        --border-color: #e0e0e0;
        --left-bg: #f7f7f8;
      }
      .page-container {
        display: grid;
        grid-template-columns: 400px 1fr;
        font-family: 'Inter', sans-serif;
      }
      .col { height: 100%; overflow: hidden; display: flex; flex-direction: column; }
      .left { background-color: var(--left-bg); border-right: 1px solid var(--border-color); }
      .right { background-color: #fff; }

      /* Left Panel */
      .left-panel-container { padding: var(--space-4); overflow-y: auto; flex-grow: 1; }
      .header-left { margin-bottom: 24px; }
      .header-left .title { font-size: 1.1rem; font-weight: 600; color: var(--text-color-dark); }
      .field { margin-bottom: var(--space-4); }
      .label { display: block; margin-bottom: var(--space-2); font-weight: 500; font-size: 0.9rem; color: var(--text-color-light); }
      .req { color: var(--p-red-500); }
      .control { width:100%; }
      .textarea { min-height: 60px; }
      .model-selector {
        display: flex; justify-content: space-between; align-items: center;
        background: #fff; border: 1px solid var(--border-color);
        padding: 10px var(--space-3); border-radius: var(--radius);
        cursor: pointer; transition: border-color .2s;
      }
      .model-selector:hover { border-color: var(--p-primary-500); }
      .model-info { display: flex; align-items: center; gap: var(--space-2); font-weight: 500; }
      .model-info img { width: 20px; height: 20px; }
      :host ::ng-deep .custom-dropdown.p-select { border-radius: var(--radius); border: 1px solid var(--border-color); }
      :host ::ng-deep .custom-dropdown .p-select-label { font-weight: 500; }

      /* Attachment Styles */
      .attachment-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-2);
      }
      :host ::ng-deep .p-fileupload-basic .p-button {
        width: 100%;
        font-weight: 500 !important;
      }

      /* Actions Footer */
      .actions-footer {
        padding: var(--space-3) var(--space-4);
        border-top: 1px solid var(--border-color);
        display: flex; gap: var(--space-2); background: var(--left-bg);
      }
      .btn { flex-grow: 1; border-radius: var(--radius) !important; padding: 10px 0 !important; }
      .btn-clear { background: #fff !important; color: var(--text-color-dark) !important; border: 1px solid var(--border-color) !important; }
      .btn-main { background: var(--p-primary-500) !important; border-color: var(--p-primary-500) !important; }

      /* Right Panel */
      .header-right {
        display: flex; align-items: center; gap: var(--space-3);
        background-color: var(--p-primary-500);
        color: #fff;
        padding: var(--space-3) var(--space-4);
      }
      .header-right .icon { font-size: 1.5rem; }
      .header-right .title { font-size: 1.1rem; font-weight: 600; margin: 0; }
      .output-container { padding: var(--space-4); flex-grow: 1; overflow-y: auto; }
      .empty { text-align: center; color: #aaa; padding: 48px 0; }
      .icon-empty { font-size: 3rem; margin-bottom: var(--space-3); display: block; }
      .result-content { white-space: pre-wrap; line-height: 1.7; }
      .result-content h4 { font-size: 1.05rem; font-weight: 600; color: var(--p-primary-700); margin-bottom: 0.5rem; }
      .result-content p { margin: 0; }

      /* Result Card Styles */
      .card { background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius); }
      .card-head {
        display: flex; justify-content: space-between; align-items: center;
        padding: var(--space-3); border-bottom: 1px solid var(--border-color);
      }
      .card-head h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-color-dark); }
      .tools { display: flex; }
      .icon-btn { width: 34px !important; height: 34px !important; }
      .card-body { padding: var(--space-3); }

      /* Model Popover (Re-styled) */
      :host ::ng-deep .model-op .p-popover-content { padding: 0 !important; }
      .model-panel { background: var(--p-surface-0); padding: var(--space-2); }
      .search-bar { padding: 0; margin-bottom: var(--space-2); }
      .search-bar input { border: 1px solid var(--p-surface-300); border-radius: 8px; padding: 10px 12px 10px 36px; background-color: var(--p-surface-0); width: 100%; font-size: .95rem; }
      .search-bar .pi-search { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--p-surface-500); }
      .list { max-height: 60vh; overflow-y: auto; }
      .group { margin-bottom: var(--space-2); }
      .group-title { font-size: 0.8rem; font-weight: 600; color: var(--p-surface-600); background-color: var(--p-surface-100); padding: 6px 12px; border-radius: 6px; margin-bottom: var(--space-2); }
      .group-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background-color 0.2s ease; }
      .group-item:hover { background-color: var(--p-surface-50); }
      .left-item { display: flex; align-items: center; gap: 12px; }
      .left-item img { width: 20px; height: 20px; }
      .name { color: var(--p-surface-800); font-weight: 500; }
      .model-tag { font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 9999px; }
      .tag-chuyen-sau { background-color: #fee2e2; color: #b91c1c; }
      .tag-toan-dien { background-color: #dbeafe; color: #1d4ed8; }
      .tag-sang-tao { background-color: #dcfce7; color: #15803d; }
      .tag-nhanh-gon { background-color: #f0fdf4; color: #16a34a; }

      @media (max-width: 1024px){ .page-container { grid-template-columns: 1fr; } .left { border-right: none; } }
    `
  ]
})
export class InitiativeWriterComponent implements OnInit, OnDestroy {
  @ViewChild('modelPopover') modelPopover!: Popover;
  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService); // **Import AuthService**
  private modelsSubscription?: Subscription;

  initiativeName = ''; selectedField: SelectOption | null = null; currentState = ''; solution = ''; expectedBenefits = ''; generatedContent: string | null = null;
  
  applicationFields: SelectOption[] = [
    { name: 'Kỹ thuật - Vận hành', value: 'operation' }, { name: 'Kỹ thuật - Sửa chữa', value: 'maintenance' },
    { name: 'An toàn & Môi trường', value: 'hse' }, { name: 'Quản lý & Văn phòng', value: 'management' },
    { name: 'Chuyển đổi số & CNTT', value: 'digital' },
  ];

  selectedModel: AIModel = { id: '', name: 'Đang tải...', icon: '', profile: { description: '', sortOrder: 0 }, costType: 'free' };
  aiModels: AICategory[] = []; 

  ngOnInit() {
    // **SỬA LỖI**: Lấy danh sách model được phép và truyền vào service
    const currentUser = this.authService.currentUser();
    const allowedModelNames = currentUser?.quotaProfile?.models ?? [];
    
    this.modelsSubscription = this.aiModelService.getModels(allowedModelNames).subscribe((data: AICategory[]) => {
      this.aiModels = data;
      this.setDefaultModel();
    });
    this.selectedField = this.applicationFields[0];
  }

  ngOnDestroy() { this.modelsSubscription?.unsubscribe(); }
  
  setDefaultModel() {
    const defaultModelName = 'Trợ lý EVNGENCO1';
    let defaultModel: AIModel | undefined;
    for (const group of this.aiModels) {
        const found = group.models.find(m => m.name === defaultModelName);
        if (found) { defaultModel = found; break; }
    }
    if (!defaultModel && this.aiModels.length > 0 && this.aiModels[0].models.length > 0) {
        defaultModel = this.aiModels[0].models[0];
    }
    if (defaultModel) { this.selectedModel = defaultModel; } 
    else {
      this.selectedModel = { id: '', name: 'Không có model', icon: 'pi pi-exclamation-triangle', profile: { description: 'Không tìm thấy model nào', sortOrder: 0 }, costType: 'free' };
    }
  }
  
  onModelSelected(model: AIModel) { this.selectedModel = model; }

  generateInitiative() {
    if(!this.initiativeName.trim() || !this.currentState.trim() || !this.solution.trim() || !this.expectedBenefits.trim()){
      this.generatedContent = `<h4>Lỗi</h4><p>Vui lòng điền đầy đủ các trường thông tin bắt buộc (*).</p>`; return;
    }
    this.generatedContent = `<h4>1. Tên sáng kiến</h4><p>${this.initiativeName}</p><br><h4>2. Lĩnh vực áp dụng</h4><p>${this.selectedField?.name}</p><br>...`;
  }

  clearAll() { this.initiativeName = ''; this.selectedField = this.applicationFields[0]; this.currentState = ''; this.solution = ''; this.expectedBenefits = ''; this.generatedContent = null; }
  copyContent() { if (this.generatedContent) { const tempDiv = document.createElement('div'); tempDiv.innerHTML = this.generatedContent; navigator.clipboard.writeText(tempDiv.textContent || ""); } }
}
