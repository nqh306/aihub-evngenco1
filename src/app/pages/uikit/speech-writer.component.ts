import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { Subscription } from 'rxjs';

import { AiModelService } from '../../core/services/ai-model.service';
import { AICategory, AIModel } from '../../core/models/ai-models.model';
import { AiModelSelectorComponent } from '../../core/shared/components/ai-model-selector.component';
import { AuthService } from '../../core/services/auth.service'; // **Import AuthService**

interface FilterOption {
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-speech-writer',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule,
    TooltipModule, PopoverModule, TagModule, FileUploadModule, AiModelSelectorComponent
  ],
  template: `
    <div class="page h-full bg-surface-50 dark:bg-surface-900">
      <div class="col left border-r border-surface-200 dark:border-surface-700">
        <div class="container">
          <div class="header"><h1 class="title">Viết bài phát biểu</h1></div>

          <div class="field"><label class="label">Chức vụ, vai trò người phát biểu</label><input type="text" pInputText [(ngModel)]="speakerRole" placeholder="Ví dụ: Tổng Giám đốc EVNGENCO1" class="control" /></div>
          <div class="field"><label class="label">Tên sự kiện <span class="req">*</span></label><input type="text" pInputText [(ngModel)]="eventName" placeholder="Ví dụ: Hội nghị tổng kết năm 2025" class="control" [class.ng-invalid]="showError && !eventName" /><small *ngIf="showError && !eventName" class="error">Tên sự kiện là bắt buộc</small></div>
          <div class="field"><label class="label">Bối cảnh, chủ trương, hiện trạng</label><textarea pInputTextarea [(ngModel)]="context" placeholder="Căn cứ nghị quyết, quyết định..." rows="2" class="control textarea"></textarea></div>
          <div class="field"><label class="label">Thông điệp truyền tải <span class="req">*</span></label><textarea pInputTextarea [(ngModel)]="messageToConvey" placeholder="Kêu gọi hợp tác, công bố chính sách mới..." rows="2" class="control textarea" [class.ng-invalid]="showError && !messageToConvey"></textarea><small *ngIf="showError && !messageToConvey" class="error">Thông điệp là bắt buộc</small></div>
          <div class="field"><label class="label">Đối tượng khán giả</label><input type="text" pInputText [(ngModel)]="audience" placeholder="Đối tác kinh doanh, nhân viên công ty..." class="control" /></div>
          <div class="field"><label class="label">Điểm nhấn cần đưa vào</label><textarea pInputTextarea [(ngModel)]="keyPoints" placeholder="Số liệu, thành tựu, kế hoạch cụ thể..." rows="1" class="control textarea"></textarea></div>
          <div class="field"><label class="label">Phong cách phát biểu</label><div class="chips"><button *ngFor="let s of speechStyles" [class]="getFilterButtonClass(s.selected)" (click)="toggleFilter(speechStyles, s)">{{s.label}}</button></div></div>
          <div class="field"><label class="label">Độ dài (tùy chọn)</label><input type="text" pInputText [(ngModel)]="speechLength" placeholder="Khoảng 800 từ" class="control" /></div>
          <div class="field"><label class="label">Tệp đính kèm (nếu có)</label><div class="grid grid-cols-2 gap-2"><p-fileUpload mode="basic" name="infoFiles[]" chooseLabel="Tệp thông tin" chooseIcon="pi pi-info-circle" [auto]="true" class="w-full"></p-fileUpload><p-fileUpload mode="basic" name="sampleFiles[]" chooseLabel="Tệp mẫu" chooseIcon="pi pi-file" [auto]="true" class="w-full"></p-fileUpload></div></div>
          <div class="actions"><button pButton class="btn btn-ghost" (click)="modelPopover.toggle($event)"><span class="inline-flex items-center gap-2"><img [src]="selectedModel.icon" [alt]="selectedModel.name" class="w-5 h-5" *ngIf="selectedModel.icon"/><span>{{ selectedModel.name }}</span></span><i class="pi pi-chevron-down caret"></i></button><button pButton label="Viết bài phát biểu" icon="pi pi-sparkles" severity="primary" class="btn btn-primary" (click)="generateSpeech()"></button></div>
        </div>
      </div>
      <div class="col"><div class="container"><div *ngIf="!generatedSpeech" class="empty"><i class="pi pi-microphone icon"></i><p>Nội dung bài phát biểu sẽ được hiển thị tại đây.</p></div><div *ngIf="generatedSpeech" class="w-full max-w-3xl mx-auto"><div class="card"><div class="card-head"><h3>Bài phát biểu đã tạo</h3><div class="tools"><button pButton icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Sao chép" tooltipPosition="top" (click)="copyContent()"></button><button pButton icon="pi pi-download" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Tải xuống" tooltipPosition="top"></button><button pButton icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Tạo lại" tooltipPosition="top" (click)="regenerateContent()"></button></div></div><div class="card-body"><div><div class="email-body">{{generatedSpeech}}</div></div></div></div></div></div></div>
      <p-popover #modelPopover [appendTo]="'body'" [style]="{width:'400px', padding:'0'}" styleClass="model-op"><ng-template pTemplate="content"><app-ai-model-selector [popoverRef]="modelPopover" (modelSelected)="onModelSelected($event)"></app-ai-model-selector></ng-template></p-popover>
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
      .left{ background: var(--p-surface-0); border-right: 1px solid var(--p-surface-200); }
      .container{ padding: clamp(12px, 1.6vw, 18px); max-width: 720px; margin: 0 auto; }
      .header{ margin-bottom: var(--space-5); }
      .title{ font-size: var(--fs-h1); font-weight: 600; margin:0; color: var(--p-surface-900); line-height:1.2; }
      .field{ margin-bottom: var(--space-3); }
      .label{ display:block; margin-bottom: .5rem; font-weight: 600; font-size: var(--fs-label); color: var(--p-surface-700); }
      .req{ color:#ef4444; }
      .control{ width:100%; padding: 10px 12px; border-radius: var(--radius); font-size: var(--fs-base); line-height: var(--lh); }
      .textarea{ min-height: 80px; resize: none; font-size: 0.93rem; line-height: var(--lh); }
      .control::placeholder{ font-size: 0.9rem; color: var(--p-surface-500); }
      .error{ color:#ef4444; font-size: var(--fs-small); margin-top: 4px; display:block; }
      .chips{ display:flex; flex-wrap:wrap; gap: var(--space-2); }
      .chip{ padding: 5px 10px; border-radius: 9999px; font-weight: 500; font-size: var(--fs-btn); border: 1px solid var(--p-surface-300); background:#fff; color: var(--p-surface-700); line-height: 1.35; transition: .15s ease; }
      .chip--active{ background: var(--p-primary-50, #eef2ff); color: var(--p-primary-700, #3b82f6); border-color: var(--p-primary-200, #c7d2fe); }
      .actions{ display:flex; justify-content:space-between; align-items:center; gap: var(--space-2); padding-top: var(--space-3); margin-top: var(--space-2); border-top: 1px solid var(--p-surface-200); }
      .btn{ font-size: var(--fs-btn); padding: 7px 12px; border-radius: 8px; }
      .btn-ghost{ display:flex; align-items:center; gap:6px; background:#fff; border:1px solid var(--p-surface-300); color: var(--p-surface-700); }
      .caret{ font-size: 11px; }
      .empty{ height: calc(100% - 2*var(--space-5)); display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; text-align:center; color:var(--p-surface-500); }
      .empty .icon{ font-size: 52px; color: var(--p-surface-300); }
      .card{ background:#fff; border:1px solid var(--p-surface-200); border-radius: var(--radius); box-shadow: 0 6px 20px rgba(0,0,0,.04); padding: clamp(12px, 1.6vw, 18px); }
      .card-head{ display:flex; justify-content:space-between; align-items:center; padding-bottom: var(--space-2); margin-bottom: var(--space-2); border-bottom: 1px solid var(--p-surface-200); }
      .tools{ display:flex; gap:4px; }
      .icon-btn{ width:34px; height:34px; }
      .card-body{ display:grid; gap: var(--space-2); }
      .email-body{ white-space:pre-line; font-size: var(--fs-base); line-height: var(--lh); color: var(--p-surface-800); }
      :host ::ng-deep .model-op { border-radius: 14px; overflow: hidden; }
      .model-panel{ background:#fff; }
      .search-bar{ position: sticky; top:0; z-index:1; display:flex; align-items:center; gap:8px; padding: 10px 12px; border-bottom: 1px solid var(--p-surface-200); background:#fff; }
      .search-bar i{ color: var(--p-surface-500); }
      .search-bar input{ width:100%; border:none; outline:none; font-size: .95rem; }
      .list{ max-height: 60vh; overflow:auto; padding: 6px 0; }
      .group{ padding: 6px 8px; }
      .group-title{ font-weight:700; color:#111827; margin: 6px 10px 8px; }
      .group-item{ display:flex; align-items:center; justify-content:space-between; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
      .group-item:hover{ background:#f3f4f6; }
      .left{ display:flex; align-items:center; gap:10px; }
      .name{ color:#0f172a; }
      .right{ display:flex; align-items:center; gap:6px; color:#1f2937; font-weight:600; }
      @media (max-width: 1024px){ .page{ grid-template-columns: 1fr; } .left{ border-right: none; border-bottom: 1px solid var(--p-surface-200); } }
    `
  ]
})
export class SpeechWriterComponent implements OnInit, OnDestroy {
  @ViewChild('modelPopover') modelPopover!: Popover;
  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService); // **Inject AuthService**
  private modelsSubscription?: Subscription;

  speakerRole = ''; eventName = ''; context = ''; messageToConvey = ''; audience = ''; keyPoints = ''; speechLength = '';
  speechStyles: FilterOption[] = [
    { label: 'Bất kỳ', selected: true }, { label: 'Truyền cảm hứng', selected: false },
    { label: 'Thân thiện/Gần gũi', selected: false }, { label: 'Trang trọng', selected: false },
    { label: 'Hùng hồn', selected: false }
  ];
  generatedSpeech: string | null = null;
  showError = false;

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
      this.selectedModel = { id: '', name: 'Không có model', icon: 'pi pi-exclamation-triangle', profile: {description: 'Không tìm thấy model nào', sortOrder: 0 }, costType: 'free' };
    }
  }

  onModelSelected(model: AIModel): void { this.selectedModel = model; }
  getFilterButtonClass(selected: boolean): string { return selected ? 'chip chip--active' : 'chip'; }
  toggleFilter(arr: FilterOption[], item: FilterOption) { arr.forEach(f => (f.selected = false)); item.selected = true; }

  generateSpeech() {
    if (!this.eventName.trim() || !this.messageToConvey.trim()) { this.showError = true; return; }
    this.showError = false;
    this.generatedSpeech = `Kính thưa quý vị đại biểu, thưa toàn thể các đồng chí,\n\nHôm nay, trong không khí trang trọng của ${this.eventName}, tôi rất vinh dự được đại diện cho [chức danh] để chia sẻ một vài điều.\n\n...`;
  }
  regenerateContent() { this.generateSpeech(); }
  copyContent() { if (this.generatedSpeech) navigator.clipboard.writeText(this.generatedSpeech); }
}
