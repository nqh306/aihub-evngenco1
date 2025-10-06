import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { Select } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Subscription } from 'rxjs';
import { AiModelService } from '../../core/services/ai-model.service';
import { AICategory, AIModel } from '../../core/models/ai-models.model';
import { AiModelSelectorComponent } from '../../core/shared/components/ai-model-selector.component';
import { AuthService } from '../../core/services/auth.service'; // **Import AuthService**

interface SelectOption { name: string; value: string; }
interface ButtonOption { label: string; value: string; icon?: string; }

@Component({
  selector: 'app-text-summarizer',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, TooltipModule,
    PopoverModule, Select, SelectButtonModule, AiModelSelectorComponent
  ],
  template: `
    <div class="page-container h-full">
      <div class="col left">
        <div class="left-panel-container">
          <div class="header-left"><h1 class="title">Nhập liệu tóm tắt</h1></div>
          <div class="field">
            <label class="label">Chọn model AI</label>
            <div class="model-selector" (click)="modelPopover.toggle($event)">
              <div class="model-info"><img [src]="selectedModel.icon" [alt]="selectedModel.name" *ngIf="selectedModel.icon"/><span>{{ selectedModel.name }}</span></div>
              <i class="pi pi-chevron-down"></i>
            </div>
          </div>
          <div class="field"><label class="label">Nội dung cần tóm tắt <span class="req">*</span></label><textarea pInputText [(ngModel)]="sourceText" placeholder="Dán văn bản hoặc URL vào đây..." rows="10" class="control textarea"></textarea></div>
          <div class="field"><label class="label">Độ dài bản tóm tắt</label><p-selectButton [options]="summaryLengths" [(ngModel)]="selectedLength" optionLabel="label" optionValue="value"></p-selectButton></div>
          <div class="field"><label class="label">Định dạng kết quả</label><p-selectButton [options]="summaryFormats" [(ngModel)]="selectedFormat" optionLabel="label" optionValue="value"></p-selectButton></div>
          <div class="field"><label class="label">Ngôn ngữ</label><p-select [options]="languages" [(ngModel)]="selectedLanguage" optionLabel="name" placeholder="Chọn ngôn ngữ" styleClass="w-full custom-dropdown" appendTo="body"></p-select></div>
        </div>
        <div class="actions-footer"><button pButton label="Xóa sạch" icon="pi pi-trash" class="btn btn-clear" (click)="clearAll()"></button><button pButton label="Tóm tắt" icon="pi pi-file-export" class="btn btn-main" (click)="generateSummary()"></button></div>
      </div>
      <div class="col right">
        <div class="header-right"><i class="pi pi-align-left icon"></i><h1 class="title">Tóm tắt văn bản</h1></div>
        <div class="output-container">
            <div *ngIf="!generatedContent" class="empty"><i class="pi pi-file-export icon-empty"></i><p>Nội dung tóm tắt sẽ được hiển thị ở đây.</p></div>
            <div *ngIf="generatedContent" class="card"><div class="card-head"><h3>Kết quả tóm tắt</h3><div class="tools"><button pButton icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Sao chép" tooltipPosition="top" (click)="copyContent()"></button></div></div><div class="card-body"><div class="result-content" [innerHTML]="generatedContent"></div></div></div>
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
        --left-bg: var(--p-surface-0); /* Nền trắng cho Left Panel */
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
      :host ::ng-deep .p-selectbutton .p-button {
          background: #fff;
          border-color: var(--border-color);
          color: var(--text-color-light);
      }
      :host ::ng-deep .p-selectbutton .p-button.p-highlight {
          background: var(--p-primary-50);
          border-color: var(--p-primary-500);
          color: var(--p-primary-700);
      }
      :host ::ng-deep .p-selectbutton .p-button:not(.p-highlight):hover {
          background: var(--p-surface-50);
          border-color: var(--p-primary-500);
          color: var(--p-primary-700);
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
      .result-content ul { padding-left: 20px; margin: 0; }
      .result-content li { margin-bottom: 0.5rem; }
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
export class TextSummarizerComponent implements OnInit, OnDestroy {
  @ViewChild('modelPopover') modelPopover!: Popover;

  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService); // **Import AuthService**
  private modelsSubscription?: Subscription;

  sourceText = ''; selectedLength = 'medium'; selectedFormat = 'paragraph'; selectedLanguage: SelectOption | null = null; generatedContent: string | null = null;
  summaryLengths: ButtonOption[] = [{ label: 'Ngắn', value: 'short' }, { label: 'Vừa', value: 'medium' }, { label: 'Dài', value: 'long' }];
  summaryFormats: ButtonOption[] = [{ label: 'Đoạn văn', value: 'paragraph' }, { label: 'Gạch đầu dòng', value: 'bullets' }];
  languages: SelectOption[] = [{ name: 'Tiếng Việt', value: 'vi' }, { name: 'Tiếng Anh', value: 'en' }];

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
    this.selectedLanguage = this.languages[0];
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

  onModelSelected(model: AIModel): void { this.selectedModel = model; }
  
  generateSummary() {
    if(!this.sourceText.trim()){ this.generatedContent = `Vui lòng nhập nội dung cần tóm tắt.`; return; }
    const lengthText = this.summaryLengths.find(l => l.value === this.selectedLength)?.label.toLowerCase();
    if (this.selectedFormat === 'paragraph') { this.generatedContent = `Đây là bản tóm tắt ${lengthText} của văn bản...`; } 
    else { this.generatedContent = `<ul><li>Đây là ý chính đầu tiên.</li><li>Đây là điểm quan trọng thứ hai.</li></ul>`; }
  }

  clearAll() { this.sourceText = ''; this.selectedLength = 'medium'; this.selectedFormat = 'paragraph'; this.selectedLanguage = this.languages[0]; this.generatedContent = null; }
  copyContent() { if (this.generatedContent) { const tempDiv = document.createElement('div'); tempDiv.innerHTML = this.generatedContent; navigator.clipboard.writeText(tempDiv.textContent || ""); } }
}
