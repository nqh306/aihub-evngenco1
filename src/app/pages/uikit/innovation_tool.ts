import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { Select } from 'primeng/select';
import { Subscription } from 'rxjs';
import { AiModelService } from '../../core/services/ai-model.service'; 
import { AICategory, AIModel } from '../../core/models/ai-models.model';
import { AuthService } from '../../core/services/auth.service';
import { AiModelSelectorComponent } from '../../core/shared/components/ai-model-selector.component';

interface SelectOption {
  name: string;
  value: string;
}

@Component({
  selector: 'app-innovation-tool',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule,
    TooltipModule, PopoverModule, Select, AiModelSelectorComponent
  ],
  template: `
    <div class="page-container h-full">
      <div class="col left">
        <div class="left-panel-container">
          <div class="header-left"><h1 class="title">Công cụ tư duy đổi mới sáng tạo</h1></div>
          <div class="field">
            <label class="label">Chọn model</label>
            <div class="model-selector" (click)="modelPopover.toggle($event)">
              <div class="model-info">
                <img [src]="selectedModelIcon" alt="icon" *ngIf="selectedModelIcon"/>
                <span>{{ selectedModelName }}</span>
              </div>
              <i class="pi pi-chevron-down"></i>
            </div>
          </div>
          <div class="field">
            <label class="label">Chọn công cụ tư duy</label>
            <p-select [options]="thinkingTools" [(ngModel)]="selectedThinkingTool" optionLabel="name"
                        placeholder="Chọn giá trị" styleClass="w-full custom-dropdown" appendTo="body"></p-select>
          </div>
          <div class="field">
            <label class="label">Đối tượng nghiên cứu (vấn đề cần tư duy)</label>
            <textarea pInputText [(ngModel)]="researchSubject"
                      placeholder="Nhập giá trị" rows="4" 
                      class="control textarea"></textarea>
          </div>
          <div class="field">
            <label class="label">Ngôn ngữ</label>
            <p-select [options]="languages" [(ngModel)]="selectedLanguage" optionLabel="name"
                        placeholder="Chọn giá trị" styleClass="w-full custom-dropdown" appendTo="body"></p-select>
          </div>
        </div>
        <div class="actions-footer">
            <button pButton label="Xóa" icon="pi pi-trash" class="btn btn-clear" (click)="clearAll()"></button>
            <button pButton label="Tạo nội dung" class="btn btn-main" (click)="generateContent()"></button>
        </div>
      </div>
      <div class="col right">
        <div class="output-container">
            <div *ngIf="!generatedContent" class="empty">
                <i class="pi pi-sparkles icon-empty"></i>
                <p>AI sẽ đưa ra những gì bạn muốn ở đây.</p>
            </div>
            <div *ngIf="generatedContent" class="card">
              <div class="card-head">
                  <h3>Kết quả</h3>
                  <div class="tools">
                      <button pButton icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Sao chép" tooltipPosition="top" (click)="copyContent()"></button>
                  </div>
              </div>
              <div class="card-body">
                  <div class="result-content">
                      {{ generatedContent }}
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
      .control { width:100%; }
      .textarea { min-height: 100px; }
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
      .result-content { white-space: pre-wrap; line-height: 1.6; }

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
      @media (max-width: 1024px){ .page-container { grid-template-columns: 1fr; } .left { border-right: none; } }
    `
  ]
})
export class InnovationToolComponent implements OnInit, OnDestroy {
  @ViewChild('modelPopover') modelPopover!: Popover;
  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService);
  private modelsSubscription?: Subscription;

  selectedThinkingTool: SelectOption | null = null;
  researchSubject: string = '';
  selectedLanguage: SelectOption | null = null;
  generatedContent: string | null = null;

  thinkingTools: SelectOption[] = [
    { name: 'Phương pháp Đối tượng tiêu điểm', value: 'TDST' },
    { name: 'Phương pháp Tư duy hệ thống', value: 'system_thinking' },
    { name: 'Phương pháp Brainstorming', value: 'brainstorming' },
    { name: 'Phương pháp 5W1H', value: '5w1h' },
    { name: 'Phương pháp Bản đồ tư duy', value: 'mindmap' },
    { name: 'Phương pháp 6 chiếc mũ tư duy', value: 'sixhats' }
  ];
  languages: SelectOption[] = [
    { name: 'Tiếng Việt', value: 'vi' },
    { name: 'Tiếng Anh', value: 'en' }
  ];

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
    this.selectedLanguage = this.languages[0];
    this.selectedThinkingTool = this.thinkingTools[0];
  }

  ngOnDestroy() {
    this.modelsSubscription?.unsubscribe();
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

  generateContent() {
    if(!this.researchSubject.trim()){
      this.generatedContent = 'Vui lòng nhập đối tượng nghiên cứu để tạo nội dung.';
      return;
    }
    this.generatedContent = `Dưới đây là các ý tưởng được tạo ra bằng phương pháp "${this.selectedThinkingTool?.name}" cho vấn đề "${this.researchSubject}":\n\n1. Ý tưởng đầu tiên...\n2. Ý tưởng thứ hai...\n3. Ý tưởng thứ ba...\n\nCác ý tưởng này được đề xuất bằng ngôn ngữ "${this.selectedLanguage?.name}".`;
  }

  clearAll() {
    this.selectedThinkingTool = this.thinkingTools[0];
    this.researchSubject = '';
    this.selectedLanguage = this.languages[0];
    this.generatedContent = null;
  }
  
  copyContent() {
    if (!this.generatedContent) return;
    navigator.clipboard.writeText(this.generatedContent);
  }
}
