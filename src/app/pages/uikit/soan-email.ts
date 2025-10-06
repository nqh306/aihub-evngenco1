import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { Subscription } from 'rxjs';

import { AiModelService } from '../../core/services/ai-model.service';
import { AICategory, AIModel } from '../../core/models/ai-models.model';
import { AiModelSelectorComponent } from '../../core/shared/components/ai-model-selector.component';
import { AuthService } from '../../core/services/auth.service'; // **Import AuthService**

interface FilterOption { label: string; selected: boolean; }

@Component({
  selector: 'app-email-composer',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, Select,
    TooltipModule, PopoverModule, TagModule, DialogModule,
    AiModelSelectorComponent
  ],
  template: `
    <div class="page h-full bg-surface-50 dark:bg-surface-900">
      <div class="col left border-r border-surface-200 dark:border-surface-700">
        <div class="container">
          <div class="header"><h1 class="title">Soạn Email</h1></div>
          <div class="field"><label class="label">Phân loại</label><div class="chips"><button *ngFor="let cat of categories" [class]="getFilterButtonClass(cat.selected)" (click)="toggleFilter(categories, cat)">{{cat.label}}</button></div></div>
          <div class="field"><label class="label">Người nhận</label><div class="chips"><button *ngFor="let r of recipients" [class]="getFilterButtonClass(r.selected)" (click)="toggleFilter(recipients, r)">{{r.label}}</button></div></div>
          <div class="field"><label class="label">Mục đích <span class="req">*</span></label><input type="text" pInputText [(ngModel)]="emailPurpose" placeholder="Email giới thiệu sản phẩm mới" class="control" [class.ng-invalid]="showError && !emailPurpose" /><small *ngIf="showError && !emailPurpose" class="error">Mục đích là bắt buộc</small></div>
          <div class="field"><label class="label">Gợi ý nội dung</label><textarea pInputText [(ngModel)]="contentSuggestion" placeholder="Nhấn mạnh sản phẩm đáp ứng tạo nội dung tự động..." rows="4" class="control textarea"></textarea></div>
          <div class="field"><label class="label">Độ dài</label><div class="chips"><button *ngFor="let len of lengths" [class]="getFilterButtonClass(len.selected)" (click)="toggleFilter(lengths, len)">{{len.label}}</button></div></div>
          <div class="field"><label class="label">Phong cách</label><div class="chips"><button *ngFor="let s of styles" [class]="getFilterButtonClass(s.selected)" (click)="toggleFilter(styles, s)">{{s.label}}</button></div></div>
          <div class="field"><label class="label">Ngôn ngữ</label><p-select [(ngModel)]="selectedLanguage" [options]="languages" optionLabel="name" placeholder="Chọn ngôn ngữ" appendTo="body" class="select w-full" (onChange)="onLanguageChange($event)"><ng-template pTemplate="selectedItem"><div class="flex items-center gap-2 text-sm" *ngIf="selectedLanguage"><span class="text-base">{{selectedLanguage.flag}}</span><span>{{selectedLanguage.name}}</span></div></ng-template><ng-template let-language pTemplate="item"><div class="flex items-center gap-2 text-sm"><span class="text-base">{{language.flag}}</span><span>{{language.name}}</span></div></ng-template></p-select></div>

          <div class="actions">
            <button pButton class="btn btn-ghost" (click)="modelPopover.toggle($event)">
              <span class="inline-flex items-center gap-2">
                <ng-container *ngIf="selectedModel.icon; else noIcon">
                    <img [src]="selectedModel.icon" [alt]="selectedModel.name" class="w-5 h-5"/>
                </ng-container>
                <ng-template #noIcon>
                    <i class="pi pi-bolt"></i>
                </ng-template>
                <span>{{ selectedModel.name }}</span>
              </span>
              <i class="pi pi-chevron-down caret"></i>
            </button>
            <button pButton label="Soạn email" icon="pi pi-sparkles" severity="primary" class="btn btn-primary" (click)="composeEmail()"></button>
          </div>
        </div>
      </div>

      <div class="col">
        <div class="container">
          <div *ngIf="!generatedContent" class="empty"><i class="pi pi-file-edit icon"></i><p>Nội dung sẽ được hiển thị tại đây.</p></div>
          <div *ngIf="generatedContent" class="w-full max-w-3xl mx-auto"><div class="card"><div class="card-head"><h3>Email đã tạo</h3><div class="tools"><button pButton icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Sao chép" tooltipPosition="top" (click)="copyContent()"></button><button pButton icon="pi pi-download" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Tải xuống" tooltipPosition="top"></button><button pButton icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" class="icon-btn" pTooltip="Tạo lại" tooltipPosition="top" (click)="regenerateContent()"></button></div></div><div class="card-body"><div><label class="meta">Tiêu đề</label><p class="subject">{{generatedContent.subject}}</p></div><div><label class="meta">Nội dung</label><div class="email-body">{{generatedContent.body}}</div></div></div><div class="card-foot"><button pButton label="Sử dụng email này" icon="pi pi-check" severity="primary" class="btn-block"></button></div></div></div>
        </div>
      </div>

      <p-popover #modelPopover [appendTo]="'body'" [style]="{width:'400px', padding:'0'}" styleClass="model-op">
        <ng-template pTemplate="content">
          <app-ai-model-selector 
            [popoverRef]="modelPopover" 
            (modelSelected)="onModelSelected($event)">
          </app-ai-model-selector>
        </ng-template>
      </p-popover>
      
      <p-dialog header="Lưu ý" [(visible)]="showLanguageWarning" [modal]="true" [style]="{width: '400px'}" [draggable]="false" [resizable]="false">
        <p class="m-0 leading-relaxed text-surface-700 dark:text-surface-200">
            Khi chọn ngôn ngữ "Tự động", bạn vui lòng ghi rõ ngôn ngữ mong muốn (ví dụ: "viết bằng tiếng Anh") trong phần <strong>"Gợi ý nội dung"</strong> để AI có thể tạo ra kết quả chính xác nhất.
        </p>
        <ng-template pTemplate="footer">
            <p-button label="Đã hiểu" (click)="showLanguageWarning = false" styleClass="p-button-sm w-full"></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [
  `
  /* === Compact scale === */
  :host{
    --space-1: 6px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 14px;
    --space-5: 16px;
    --radius: 10px;
    --fs-base: clamp(14px, 0.8vw + 9px, 15px);
    --fs-btn: 0.875rem;
    --fs-label: 0.92rem;
    --fs-small: 0.75rem;
    --fs-h1: 1.02rem;
    --lh: 1.55;
    --lh-tight: 1.4;
  }
  /* Layout */
  .page{ display:grid; grid-template-columns: 1fr 1fr; }
  .col{ overflow:auto; }
  .left{ background: var(--p-surface-0); }
  .container{ padding: clamp(12px, 1.6vw, 18px); max-width: 720px; margin: 0 auto; }
  /* Header */
  .header{ margin-bottom: var(--space-5); }
  .title{ font-size: var(--fs-h1); font-weight: 600; margin:0; color: var(--p-surface-900); line-height:1.2; }
  /* Field block – compact */
  .field{ margin-bottom: var(--space-3); }
  .label{
    display:block;
    margin-bottom: .5rem;
    font-weight: 600;
    font-size: var(--fs-label);
    color: var(--p-surface-700);
  }
  .req{ color:#ef4444; }
  /* Controls */
  .control{
    width:100%;
    padding: 10px 12px;
    border-radius: var(--radius);
    font-size: var(--fs-base);
    line-height: var(--lh);
  }
  .textarea{
    min-height: 110px;
    resize: none;
    font-size: 0.93rem;
    line-height: var(--lh);
  }
  .control::placeholder{ font-size: 0.9rem; color: var(--p-surface-500); }
  .error{ color:#ef4444; font-size: var(--fs-small); margin-top: 4px; display:block; }
  /* Chips (buttons) */
  .chips{ display:flex; flex-wrap:wrap; gap: var(--space-2); }
  .chip{
    padding: 5px 10px;
    border-radius: 9999px;
    font-weight: 500;
    font-size: var(--fs-btn);
    border: 1px solid var(--p-surface-300);
    background:#fff; color: var(--p-surface-700);
    line-height: 1.35; transition: .15s ease;
  }
  .chip--active{
    background: var(--p-primary-50, #eef2ff);
    color: var(--p-primary-700, #3b82f6);
    border-color: var(--p-primary-200, #c7d2fe);
  }
  /* Actions – compact */
  .actions{
    display:flex; justify-content:space-between; align-items:center;
    gap: var(--space-2);
    padding-top: var(--space-3);
    margin-top: var(--space-2);
    border-top: 1px solid var(--p-surface-200);
  }
  .btn{ font-size: var(--fs-btn); padding: 7px 12px; border-radius: 8px; }
  .btn-ghost{
    display:flex; align-items:center; gap:6px;
    background:#fff; border:1px solid var(--p-surface-300); color: var(--p-surface-700);
  }
  .btn-primary{}
  .caret{ font-size: 11px; }
  .emoji{ font-size: 1rem; }
  /* Right preview – compact */
  .empty{ height: calc(100% - 2*var(--space-5)); display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; text-align:center; color:var(--p-surface-500); }
  .empty .icon{ font-size: 52px; color: var(--p-surface-300); }
  .card{
    background:#fff; border:1px solid var(--p-surface-200); border-radius: var(--radius);
    box-shadow: 0 6px 20px rgba(0,0,0,.04);
    padding: clamp(12px, 1.6vw, 18px);
  }
  .card-head{
    display:flex; justify-content:space-between; align-items:center;
    padding-bottom: var(--space-2);
    margin-bottom: var(--space-2);
    border-bottom: 1px solid var(--p-surface-200);
  }
  .tools{ display:flex; gap:4px; }
  .icon-btn{ width:34px; height:34px; }
  .card-body{ display:grid; gap: var(--space-2); }
  .meta{ display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; color:var(--p-surface-600); letter-spacing:.03em; }
  .subject{ margin-top:4px; font-weight:600; line-height: var(--lh-tight); }
  .email-body{ margin-top:4px; white-space:pre-line; font-size: var(--fs-base); line-height: var(--lh); color: var(--p-surface-800); }
  /* === Model picker (popover) === */
  :host ::ng-deep .model-op { border-radius: 14px; overflow: hidden; }
  .model-panel{ background:#fff; }
  .search-bar{
    position: sticky; top:0; z-index:1;
    display:flex; align-items:center; gap:8px;
    padding: 10px 12px; border-bottom: 1px solid var(--p-surface-200);
    background:#fff;
  }
  .search-bar i{ color: var(--p-surface-500); }
  .search-bar input{ width:100%; border:none; outline:none; font-size: .95rem; }
  .list{ max-height: 60vh; overflow:auto; padding: 6px 0; }
  .group{ padding: 6px 8px; }
  .group-title{ font-weight:700; color:#111827; margin: 6px 10px 8px; }
  .group-item{
    display:flex; align-items:center; justify-content:space-between;
    padding: 10px 12px; border-radius: 10px; cursor: pointer;
  }
  .group-item:hover{ background:#f3f4f6; }
  .left{ display:flex; align-items:center; gap:10px; }
  .name{ color:#0f172a; }
  .right{ display:flex; align-items:center; gap:6px; color:#1f2937; font-weight:600; }
  .bolt{ font-size: 14px; color:#6366f1; }
  @media (max-width: 1024px){
    .page{ grid-template-columns: 1fr; }
    .left{ border-right: none; border-bottom: 1px solid var(--p-surface-200); }
  }
`
  ]
})
export class EmailComposerComponent implements OnInit, OnDestroy {
  @ViewChild('modelPopover') modelPopover!: Popover;

  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService); // **Inject AuthService**
  private modelsSubscription?: Subscription;

  categories: FilterOption[] = [ { label: 'Tự động', selected: true }, { label: 'Nội bộ', selected: false }, { label: 'Giao việc', selected: false }, { label: 'Báo cáo', selected: false }, { label: 'Thông báo', selected: false }, { label: 'Phản hồi', selected: false } ];
  recipients: FilterOption[] = [ { label: 'Tự động', selected: true }, { label: 'Đối tác', selected: false }, { label: 'Lãnh đạo', selected: false }, { label: 'Nhân viên', selected: false }, { label: 'Nội bộ', selected: false }, { label: 'Ứng viên', selected: false } ];
  lengths: FilterOption[] = [ { label: 'Tự động', selected: true }, { label: 'Ngắn', selected: false }, { label: 'Vừa', selected: false }, { label: 'Dài', selected: false } ];
  styles: FilterOption[] = [ { label: 'Tự động', selected: true }, { label: 'Thân thiện', selected: false }, { label: 'Chuyên nghiệp', selected: false }, { label: 'Vui vẻ', selected: false }, { label: 'Nghiêm túc', selected: false }, { label: 'Trang trọng', selected: false } ];
  languages = [ { name: 'Tự động', code: 'auto', flag: '🌐' }, { name: 'Việt Nam', code: 'vi', flag: '🇻🇳' }, { name: 'English', code: 'en', flag: '🇺🇸' }];

  emailPurpose = '';
  contentSuggestion = '';
  selectedLanguage: any = null;
  showError = false;
  generatedContent: any = null;
  showLanguageWarning = false;

  selectedModel: AIModel = { id: '', name: 'Đang tải...', icon: '', profile: { description: '', sortOrder: 0 }, costType: 'free' };
  
  aiModels: AICategory[] = [];
  
  ngOnInit() {
    this.selectedLanguage = this.languages[0];
    
    // **SỬA LỖI**: Lấy danh sách model được phép và truyền vào service
    const currentUser = this.authService.currentUser();
    const allowedModelNames = currentUser?.quotaProfile?.models ?? [];

    this.modelsSubscription = this.aiModelService.getModels(allowedModelNames).subscribe((data: AICategory[]) => {
      this.aiModels = data;
      this.setDefaultModel();
    });
  }

  ngOnDestroy() {
    this.modelsSubscription?.unsubscribe();
  }

  setDefaultModel() {
    const defaultModelName = 'Trợ lý EVNGENCO1';
    let defaultModel: AIModel | undefined;
    
    for (const group of this.aiModels) {
        const found = group.models.find(m => m.name === defaultModelName);
        if (found) {
            defaultModel = found;
            break;
        }
    }

    if (!defaultModel && this.aiModels.length > 0 && this.aiModels[0].models.length > 0) {
        defaultModel = this.aiModels[0].models[0];
    }
    
    if (defaultModel) {
      this.selectedModel = defaultModel;
    } else {
        this.selectedModel = {
          id: '',
          name: 'Không có model',
          icon: 'pi pi-exclamation-triangle',
          profile: { description: 'Không tìm thấy model nào', sortOrder: 0 },
          costType: 'free'
        };
    }
  }

  onModelSelected(model: AIModel): void {
    this.selectedModel = model;
  }
  
  getFilterButtonClass(selected: boolean): string { return selected ? 'chip chip--active' : 'chip'; }
  toggleFilter(arr: any[], item: any) { arr.forEach((f: any) => (f.selected = false)); item.selected = true; }
  onLanguageChange(event: any) { if (event.value && event.value.code === 'auto') { this.showLanguageWarning = true; } }

  composeEmail() {
    if (!this.emailPurpose.trim()) { this.showError = true; return; }
    this.showError = false;
    this.generatedContent = {
      subject: `${this.emailPurpose}`,
      body: `Kính gửi Quý khách hàng,\n\nChúng tôi rất vui mừng được giới thiệu đến Quý khách sản phẩm mới nhất...`
    };
  }

  regenerateContent() { this.composeEmail(); }

  copyContent() {
    if (!this.generatedContent) return;
    const content = `${this.generatedContent.subject}\n\n${this.generatedContent.body}`;
    navigator.clipboard.writeText(content);
  }
}
