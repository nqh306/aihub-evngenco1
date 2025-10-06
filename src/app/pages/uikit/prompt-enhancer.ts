import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { AiModelService } from '../../core/services/ai-model.service'; 
import { AICategory, AIModel } from '../../core/models/ai-models.model';
import { AuthService } from '../../core/services/auth.service';
import { AiModelSelectorComponent } from '../../core/shared/components/ai-model-selector.component';

interface FrameworkOption {
  name: string;
  tag: string;
  description: string;
  selected: boolean;
  template: (prompt: string) => string;
}

@Component({
  selector: 'app-prompt-enhancer',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule,
    TooltipModule, PopoverModule, TagModule, AiModelSelectorComponent
  ],
  template: `
    <div class="page h-full bg-surface-50 dark:bg-surface-900">
      <div class="col left border-r border-surface-200 dark:border-surface-700">
        <div class="container">
          <div class="header"><h1 class="title">Nâng cấp Prompt</h1></div>
          <div class="field">
            <label class="label">Prompt gốc <span class="req">*</span></label>
            <textarea pInputTextarea [(ngModel)]="originalPrompt" 
                      placeholder="Ví dụ: viết báo cáo sự cố..." 
                      rows="8" class="control textarea" 
                      [class.ng-invalid]="showError && !originalPrompt"></textarea>
            <small *ngIf="showError && !originalPrompt" class="error">Prompt gốc là bắt buộc</small>
          </div>
          <div class="field">
            <label class="label">Framework</label>
            <div class="framework-options-container">
              <div *ngFor="let fw of frameworks" 
                   class="framework-option" 
                   [class.selected]="fw.selected"
                   (click)="selectFramework(fw)">
                <div class="fw-header">
                  <span class="fw-name">{{ fw.name }}</span>
                  <span class="fw-tag">{{ fw.tag }}</span>
                </div>
                <p class="fw-description">{{ fw.description }}</p>
              </div>
            </div>
          </div>
          <div class="actions">
            <button pButton class="btn btn-ghost" (click)="modelPopover.toggle($event)">
              <span class="inline-flex items-center gap-2">
                <img [src]="selectedModelIcon" alt="icon" class="w-5 h-5" *ngIf="selectedModelIcon"/>
                <span>{{ selectedModelName }}</span>
              </span>
              <i class="pi pi-chevron-down caret"></i>
            </button>
            <button pButton label="Nâng cấp" icon="pi pi-sparkles" severity="primary" class="btn btn-primary" (click)="enhancePrompt()"></button>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="container">
          <div *ngIf="!enhancedPrompt" class="empty">
            <i class="pi pi-lightbulb icon"></i>
            <p>Prompt nâng cấp sẽ được hiển thị tại đây.</p>
          </div>
          <div *ngIf="enhancedPrompt" class="w-full max-w-3xl mx-auto">
            <div class="card">
                <div class="card-head">
                    <h3>Prompt nâng cấp</h3>
                    <div class="tools">
                        <button pButton icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Sao chép" tooltipPosition="top" (click)="copyContent()"></button>
                        <button pButton icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Tạo lại" tooltipPosition="top" (click)="regenerateContent()"></button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="prompt-output">{{enhancedPrompt}}</div>
                </div>
            </div>
          </div>
        </div>
      </div>
       <p-popover #modelPopover [appendTo]="'body'" [style]="{width:'360px'}" styleClass="model-op">
          <ng-template pTemplate="content">
            <app-ai-model-selector 
              [popoverRef]="modelPopover" 
              (modelSelected)="selectModel($event)">
            </app-ai-model-selector>
          </ng-template>
       </p-popover>
    </div>
  `,
  styles: [
    `
      :host{
        --space-1: 6px; --space-2: 8px; --space-3: 12px; --space-4: 14px; --space-5: 16px; --radius: 10px;
        --fs-base: clamp(14px, 0.8vw + 9px, 15px); --fs-btn: 0.875rem; --fs-label: 0.92rem; --fs-small: 0.75rem; --fs-h1: 1.02rem;
        --lh: 1.55; --lh-tight: 1.4;
      }
      .page{ display:grid; grid-template-columns: 1fr 1fr; }
      .col{ overflow:auto; }
      .container{ padding: clamp(12px, 1.6vw, 18px); max-width: 720px; margin: 0 auto; }
      .header{ margin-bottom: var(--space-5); }
      .title{ font-size: var(--fs-h1); font-weight: 600; margin:0; color: var(--p-surface-900); line-height:1.2; }
      .field{ margin-bottom: var(--space-3); }
      .label{ display:block; margin-bottom: .5rem; font-weight: 600; font-size: var(--fs-label); color: var(--p-surface-700); }
      .req{ color:#ef4444; }
      .control{ width:100%; padding: 10px 12px; border-radius: var(--radius); font-size: var(--fs-base); line-height: var(--lh); }
      .textarea{ resize: vertical; font-size: 0.93rem; line-height: var(--lh); }
      .control::placeholder{ font-size: 0.9rem; color: var(--p-surface-500); }
      .error{ color:#ef4444; font-size: var(--fs-small); margin-top: 4px; display:block; }
      .actions{ display:flex; justify-content:space-between; align-items:center; gap: var(--space-2); padding-top: var(--space-3); margin-top: var(--space-2); border-top: 1px solid var(--p-surface-200); }
      .btn{ font-size: var(--fs-btn); padding: 7px 12px; border-radius: 8px; }
      .btn-ghost{ display:flex; align-items:center; gap:6px; background:var(--p-surface-0); border:1px solid var(--p-surface-300); color: var(--p-surface-700); }
      .caret{ font-size: 11px; }
      .empty{ height: calc(100% - 2*var(--space-5)); display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; text-align:center; color:var(--p-surface-500); }
      .empty .icon{ font-size: 52px; color: var(--p-surface-300); }
      .card{ background:var(--p-surface-0); border:1px solid var(--p-surface-200); border-radius: var(--radius); box-shadow: 0 6px 20px rgba(0,0,0,.04); padding: clamp(12px, 1.6vw, 18px); }
      .card-head{ display:flex; justify-content:space-between; align-items:center; padding-bottom: var(--space-2); margin-bottom: var(--space-2); border-bottom: 1px solid var(--p-surface-200); }
      .tools{ display:flex; gap:4px; }
      .icon-btn{ width:34px; height:34px; }
      .prompt-output { white-space:pre-line; font-size: var(--fs-base); line-height: var(--lh); color: var(--p-surface-800); background-color: var(--p-surface-50); padding: var(--space-3); border-radius: var(--radius); border: 1px solid var(--p-surface-200); }
      
      /* --- Framework Styles --- */
      .framework-options-container { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
      .framework-option { border: 1px solid var(--p-surface-300); border-radius: var(--radius); padding: var(--space-3); cursor: pointer; transition: border-color .2s ease, box-shadow .2s ease; background: var(--p-surface-0); }
      .framework-option:hover { border-color: var(--p-primary-400); }
      .framework-option.selected { border-color: var(--p-primary-500); box-shadow: 0 0 0 1px var(--p-primary-500); }
      .fw-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      .fw-name { font-weight: 600; font-size: 1rem; color: var(--p-surface-800); }
      .fw-tag { font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 9999px; background-color: var(--p-surface-200); color: var(--p-surface-700); }
      .framework-option.selected .fw-tag { background-color: var(--p-surface-800); color: var(--p-surface-0); }
      .fw-description { font-size: 0.85rem; color: var(--p-surface-600); margin: 0; line-height: 1.4; }
      
      /* --- New Model Popover Styles --- */
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
      .left { display: flex; align-items: center; gap: 12px; }
      .left img { width: 20px; height: 20px; }
      .name { color: var(--p-surface-800); font-weight: 500; }
      .model-tag { font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 9999px; }
      .tag-chuyen-sau { background-color: #fee2e2; color: #b91c1c; }
      .tag-toan-dien { background-color: #dbeafe; color: #1d4ed8; }
      .tag-sang-tao { background-color: #dcfce7; color: #15803d; }
      .tag-nhanh-gon { background-color: #f0fdf4; color: #16a34a; }

      @media (max-width: 1024px){ .page{ grid-template-columns: 1fr; } .left{ border-right: none; border-bottom: 1px solid var(--p-surface-200); } }
    `
  ]
})
export class PromptEnhancerComponent implements OnInit, OnDestroy {
  @ViewChild('modelPopover') modelPopover!: Popover;

  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService);
  private modelsSubscription?: Subscription;

  originalPrompt: string = '';
  enhancedPrompt: string | null = null;
  showError = false;

  frameworks: FrameworkOption[] = [
    {
      name: 'CORGI', tag: 'Core', description: 'Context, Output, Role, Goal, Instruction', selected: false,
      template: (prompt) => `**Bối cảnh (Context):** [Mô tả tình huống...]\n\n**Vai trò (Role):** Hãy đóng vai là [Mô tả vai trò...]\n\n**Mục tiêu (Goal):** Mục tiêu cuối cùng là [Mô tả kết quả...]\n\n**Định dạng (Output):** Cung cấp câu trả lời dưới dạng [Mô tả định dạng...]\n\n**Yêu cầu (Instruction):** Dựa trên thông tin trên, hãy: ${prompt}`
    },
    {
      name: 'CORGICE', tag: 'Extended', description: 'Thêm Constraints và Examples', selected: true,
      template: (prompt) => `**Bối cảnh (Context):** [Mô tả tình huống...]\n\n**Vai trò (Role):** Hãy đóng vai là [Mô tả vai trò...]\n\n**Mục tiêu (Goal):** Mục tiêu cuối cùng là [Mô tả kết quả...]\n\n**Định dạng (Output):** Cung cấp câu trả lời dưới dạng [Mô tả định dạng...]\n\n**Ràng buộc (Constraints):** [Liệt kê các giới hạn...]\n\n**Ví dụ (Examples):** Dưới đây là một ví dụ: [Cung cấp ví dụ mẫu...]\n\n**Yêu cầu (Instruction):** Dựa trên tất cả thông tin trên, hãy: ${prompt}`
    }
  ];
  selectedFramework: FrameworkOption = this.frameworks[1];

  selectedModelName: string = 'Đang tải...';
  selectedModelIcon: string = '';
  aiModels: AICategory[] = []; 

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    const allowedModelNames = currentUser?.quotaProfile?.models ?? null;

    this.modelsSubscription = this.aiModelService.getModels(allowedModelNames).subscribe((data: AICategory[]) => {
      this.aiModels = data;
      this.setDefaultModel();
    });
  }

  ngOnDestroy() {
    this.modelsSubscription?.unsubscribe();
  }
  
  selectFramework(selectedFw: FrameworkOption) {
    this.frameworks.forEach(fw => fw.selected = false);
    selectedFw.selected = true;
    this.selectedFramework = selectedFw;
  }

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
    if (defaultModel) {
        this.selectedModelName = defaultModel.name;
        this.selectedModelIcon = defaultModel.icon;
    } else {
        this.selectedModelName = 'Không có model';
    }
  }

  selectModel(model: AIModel) {
    this.selectedModelName = model.name;
    this.selectedModelIcon = model.icon;
    this.modelPopover.hide();
  }

  enhancePrompt() {
    if (!this.originalPrompt.trim()) { 
      this.showError = true; 
      return; 
    }
    this.showError = false;
    this.enhancedPrompt = this.selectedFramework.template(this.originalPrompt);
  }

  regenerateContent() { this.enhancePrompt(); }
  copyContent() { if (this.enhancedPrompt) navigator.clipboard.writeText(this.enhancedPrompt); }
}

