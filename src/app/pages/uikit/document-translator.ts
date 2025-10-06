import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { Select } from 'primeng/select';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { AiModelService } from '../../core/services/ai-model.service'; 
import { AICategory, AIModel } from '../../core/models/ai-models.model';
import { AuthService } from '../../core/services/auth.service';

interface SelectOption { name: string; value: string; }
type TranslationStatus = 'processing' | 'completed' | 'failed';
interface TranslationJob {
  id: number;
  fileName: string;
  status: TranslationStatus;
  timestamp: Date;
  resultUrl?: string;
}

@Component({
  selector: 'app-document-translator',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TooltipModule, PopoverModule, Select,
    FileUploadModule, CheckboxModule, TableModule, TagModule
  ],
  template: `
    <div class="page-container h-full">
      <div class="col left">
        <div class="left-panel-container">
          <div class="header-left"><h1 class="title">Tùy chọn dịch thuật</h1></div>
          <div class="options-grid">
            <div class="field"><label class="label">Ngôn ngữ gốc</label><p-select [options]="languages" [(ngModel)]="sourceLanguage" optionLabel="name" placeholder="Phát hiện ngôn ngữ" styleClass="w-full custom-dropdown" appendTo="body"></p-select></div>
            <div class="field"><label class="label">Dịch ra ngôn ngữ</label><p-select [options]="languages" [(ngModel)]="targetLanguage" optionLabel="name" placeholder="Chọn ngôn ngữ" styleClass="w-full custom-dropdown" appendTo="body"></p-select></div>
            <div class="field"><label class="label">Phong cách</label><p-select [options]="styles" [(ngModel)]="selectedStyle" optionLabel="name" placeholder="Nghiêm túc" styleClass="w-full custom-dropdown" appendTo="body"></p-select></div>
            <div class="field"><label class="label">Chuyên ngành</label><p-select [options]="domains" [(ngModel)]="selectedDomain" optionLabel="name" placeholder="AI tự nhận diện" styleClass="w-full custom-dropdown" appendTo="body"></p-select></div>
          </div>
          <div class="switches-grid">
              <div class="switch-field"><p-checkbox [(ngModel)]="bilingualMode" [binary]="true" inputId="bilingualSwitch"></p-checkbox><label for="bilingualSwitch">Dịch song ngữ</label></div>
              <div class="switch-field"><p-checkbox [(ngModel)]="useGlossary" [binary]="true" inputId="glossarySwitch"></p-checkbox><label for="glossarySwitch">Từ điển của tôi</label></div>
              <div class="switch-field"><p-checkbox [(ngModel)]="useOCR" [binary]="true" inputId="ocrSwitch"></p-checkbox><label for="ocrSwitch">OCR (cho PDF scan)</label></div>
          </div>
          <div class="field">
              <label class="label">Tải tệp lên</label>
              <p-fileUpload #fileUploader name="document[]" (onSelect)="onFileSelect($event)"
                  [multiple]="true" accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.txt"
                  [maxFileSize]="300000000" [showUploadButton]="false" [showCancelButton]="true"
                  chooseLabel="Chọn tệp để tải lên" styleClass="custom-uploader" (onClear)="onClearFiles()" (onRemove)="onRemoveFile($event)">
                  <ng-template pTemplate="content">
                      <div class="uploader-content" *ngIf="filesToTranslate.length === 0">
                          <i class="pi pi-upload"></i>
                          <span>Kéo và thả tệp vào đây</span>
                          <span class="formats">Hỗ trợ: Word, PDF, Excel, PowerPoint, Text</span>
                      </div>
                  </ng-template>
              </p-fileUpload>
          </div>
        </div>
        <div class="actions-footer"><button pButton label="Dịch ngay" icon="pi pi-language" class="btn btn-main" (click)="startTranslation()" [disabled]="!filesToTranslate.length"></button></div>
      </div>
      <div class="col right">
        <div class="header-right"><i class="pi pi-language icon"></i><h1 class="title">Dịch thuật tài liệu</h1></div>
        <div class="output-container">
          <p-table [value]="translationJobs" styleClass="p-datatable-striped custom-table" responsiveLayout="scroll">
              <ng-template pTemplate="header"><tr><th>Tên tệp</th><th style="width: 15rem">Thời gian</th><th style="width: 12rem">Trạng thái</th><th style="width: 10rem">Thao tác</th></tr></ng-template>
              <ng-template pTemplate="body" let-job>
                  <tr>
                      <td>{{ job.fileName }}</td><td>{{ job.timestamp | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td><p-tag [severity]="getStatusSeverity(job.status)" [value]="job.status" [icon]="getStatusIcon(job.status)"></p-tag></td>
                      <td>
                        <div class="action-buttons" *ngIf="job.status === 'completed'"><button pButton icon="pi pi-eye" class="p-button-text p-button-secondary" pTooltip="Xem nhanh"></button><button pButton icon="pi pi-download" class="p-button-text p-button-secondary" pTooltip="Tải về"></button></div>
                        <span *ngIf="job.status === 'failed'" class="text-danger-500 text-sm">Thất bại</span>
                      </td>
                  </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage"><tr><td colspan="4" class="text-center py-8"><div class="empty"><i class="pi pi-history icon-empty"></i><p>Lịch sử dịch sẽ được hiển thị ở đây.</p></div></td></tr></ng-template>
          </p-table>
        </div>
      </div>
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
        grid-template-columns: 450px 1fr;
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
      :host ::ng-deep .custom-dropdown.p-select { border-radius: var(--radius); border: 1px solid var(--border-color); }
      :host ::ng-deep .custom-dropdown .p-select-label { font-weight: 500; }
      
      .options-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3) var(--space-4);
        margin-bottom: var(--space-4);
      }
      
      .switches-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .switch-field {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .switch-field label {
        font-weight: 500;
        cursor: pointer;
        color: var(--text-color-dark);
      }

      /* Uploader */
       :host ::ng-deep .custom-uploader .p-fileupload-buttonbar {
         display: none;
       }
      :host ::ng-deep .custom-uploader .p-fileupload-content {
        border: 2px dashed var(--border-color);
        border-radius: var(--radius);
        padding: 0;
      }
       .uploader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        color: var(--text-color-light);
      }
      .uploader-content i {
        font-size: 2rem;
        color: var(--p-primary-500);
        margin-bottom: var(--space-3);
      }
       .uploader-content span {
        font-weight: 500;
      }
       .uploader-content .formats {
        font-size: 0.8rem;
        color: #aaa;
        margin-top: var(--space-2);
      }

      /* Actions Footer */
      .actions-footer {
        padding: var(--space-3) var(--space-4);
        border-top: 1px solid var(--border-color);
        display: flex; gap: var(--space-2); background: var(--left-bg);
      }
      .btn { flex-grow: 1; border-radius: var(--radius) !important; padding: 10px 0 !important; }
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
      .output-container { flex-grow: 1; overflow-y: auto; }
      .empty { text-align: center; color: #aaa; padding: 48px 0; }
      .icon-empty { font-size: 3rem; margin-bottom: var(--space-3); display: block; }
      
      /* Table Styles */
      :host ::ng-deep .custom-table.p-datatable .p-datatable-thead > tr > th {
        background: var(--left-bg);
        color: var(--text-color-light);
        font-weight: 600;
      }
      .action-buttons {
        display: flex;
        gap: var(--space-2);
      }
    `
  ]
})
export class DocumentTranslatorComponent implements OnInit, OnDestroy {
  @ViewChild('fileUploader') fileUploader!: FileUpload;

  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService);
  private modelsSubscription?: Subscription;

  sourceLanguage: SelectOption | null = null; targetLanguage: SelectOption | null = null;
  selectedStyle: SelectOption | null = null; selectedDomain: SelectOption | null = null;
  bilingualMode = false; useGlossary = false; useOCR = false;
  filesToTranslate: File[] = [];
  translationJobs: TranslationJob[] = [];
  
  languages: SelectOption[] = [ { name: 'Tiếng Việt', value: 'vi' }, { name: 'Tiếng Anh', value: 'en' }, { name: 'Tiếng Pháp', value: 'fr' }, { name: 'Tiếng Nhật', value: 'ja' }, ];
  styles: SelectOption[] = [ { name: 'Nghiêm túc', value: 'formal' }, { name: 'Thân thiện', value: 'informal' }, ];
  domains: SelectOption[] = [ { name: 'Kỹ thuật', value: 'technical' }, { name: 'Tài chính', value: 'financial' }, { name: 'Pháp lý', value: 'legal' }, ];
  
  aiModels: AICategory[] = [];

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    const allowedModelNames = currentUser?.quotaProfile?.models ?? null;

    this.modelsSubscription = this.aiModelService.getModels(allowedModelNames).subscribe((data: AICategory[]) => {
      this.aiModels = data;
    });
    this.targetLanguage = this.languages[1];
    this.selectedStyle = this.styles[0];
  }

  ngOnDestroy() { this.modelsSubscription?.unsubscribe(); }

  onFileSelect(event: any) { this.filesToTranslate = [...event.files]; }
  onClearFiles() { this.filesToTranslate = []; }
  onRemoveFile(event: any) { this.filesToTranslate = this.filesToTranslate.filter(f => f.name !== event.file.name); }

  startTranslation() {
    if (!this.filesToTranslate.length) return;
    this.filesToTranslate.forEach(file => {
      const newJob: TranslationJob = { id: Date.now() + Math.random(), fileName: file.name, status: 'processing', timestamp: new Date(), };
      this.translationJobs.unshift(newJob);
      this.simulateApiCall(newJob);
    });
    this.filesToTranslate = [];
    this.fileUploader.clear();
  }

  private simulateApiCall(job: TranslationJob) {
    const randomDelay = Math.random() * 3000 + 2000;
    setTimeout(() => {
      const jobIndex = this.translationJobs.findIndex(j => j.id === job.id);
      if (jobIndex !== -1) {
        const success = Math.random() > 0.2;
        this.translationJobs[jobIndex].status = success ? 'completed' : 'failed';
        if (success) { this.translationJobs[jobIndex].resultUrl = '#'; }
      }
    }, randomDelay);
  }
  
  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) { case 'completed': return 'success'; case 'processing': return 'warn'; case 'failed': return 'danger'; default: return 'secondary'; }
  }

  getStatusIcon(status: string): string {
    switch (status) { case 'processing': return 'pi pi-spin pi-spinner'; case 'completed': return 'pi pi-check'; case 'failed': return 'pi pi-times'; default: return ''; }
  }
}