import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { ConfirmationService } from 'primeng/api';

// Types
export type IdeaCategory = 'feature' | 'tool' | 'production' | 'management' | 'other';
export type IdeaStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'implemented';
export type IdeaPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface InnovationIdea {
  id: string;
  category: IdeaCategory;
  title: string;
  description: string;
  expectedBenefit: string;
  implementationCost?: string;
  priority: IdeaPriority;
  attachments?: string[];
  submitterName: string;
  submitterEmail: string;
  submitterDepartment?: string;
  status: IdeaStatus;
  reviewNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Mock Service
class InnovationIdeaService {
  private readonly LS_KEY = 'evn_innovation_ideas_v1';

  list() {
    const saved = localStorage.getItem(this.LS_KEY);
    return { subscribe: (obs: any) => {
      setTimeout(() => obs.next(saved ? JSON.parse(saved) : []), 100);
    }};
  }

  add(payload: Omit<InnovationIdea, 'id' | 'createdAt'>) {
    const ideas = this.getAll();
    const newIdea: InnovationIdea = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    ideas.push(newIdea);
    this.save(ideas);
    return { subscribe: (obs: any) => setTimeout(() => obs.next(newIdea), 200) };
  }

  update(id: string, payload: Partial<InnovationIdea>) {
    const ideas = this.getAll();
    const idx = ideas.findIndex((x: InnovationIdea) => x.id === id);
    if (idx >= 0) {
      ideas[idx] = { ...ideas[idx], ...payload, updatedAt: new Date().toISOString() };
      this.save(ideas);
    }
    return { subscribe: (obs: any) => setTimeout(() => obs.next(ideas[idx]), 200) };
  }

  setStatus(id: string, status: IdeaStatus, reviewNotes?: string) {
    return this.update(id, { status, reviewNotes });
  }

  delete(id: string) {
    const ideas = this.getAll().filter((x: InnovationIdea) => x.id !== id);
    this.save(ideas);
    return { subscribe: (obs: any) => setTimeout(() => obs.next(null), 200) };
  }

  uploadAttachment(file: File) {
    return { subscribe: (obs: any) => setTimeout(() => obs.next('data:image/...'), 300) };
  }

  private getAll(): InnovationIdea[] {
    const saved = localStorage.getItem(this.LS_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  private save(ideas: InnovationIdea[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(ideas));
  }
}

@Component({
  selector: 'app-innovation-ideas',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, DialogModule, ConfirmDialogModule,
    TooltipModule, TagModule, SelectModule, FileUploadModule,
    IconFieldModule, InputIconModule
  ],
  providers: [ConfirmationService, InnovationIdeaService],
  template: `
  <div class="page p-4">
    <div class="card mb-4">
      <div class="flex items-center gap-3 mb-4">
        <i class="pi pi-lightbulb text-4xl text-yellow-500"></i>
        <div>
          <h2 class="text-xl font-semibold">Đề xuất ý tưởng đổi mới sáng tạo</h2>
          <p class="text-surface-500 text-sm mt-1">
            Đóng góp ý tưởng cải tiến công nghệ, quy trình SXKD và quản trị tại EVNGENCO1
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Danh mục *</label>
          <p-select appendTo="body" class="w-full"
            [options]="categoryOptions" optionLabel="label" optionValue="value"
            [(ngModel)]="form.category">
          </p-select>
          <small class="text-surface-500 block mt-1">Chọn danh mục phù hợp nhất</small>
        </div>

        <div>
          <label>Mức độ ưu tiên *</label>
          <p-select appendTo="body" class="w-full"
            [options]="priorityOptions" optionLabel="label" optionValue="value"
            [(ngModel)]="form.priority">
          </p-select>
        </div>

        <div class="md:col-span-2">
          <label>Tiêu đề ý tưởng *</label>
          <input pInputText [(ngModel)]="form.title" class="w-full" 
            placeholder="VD: Ứng dụng AI dự báo nhu cầu điện năng"/>
        </div>

        <div class="md:col-span-2">
          <label>Mô tả chi tiết *</label>
          <textarea pInputText [(ngModel)]="form.description" rows="4" class="w-full" 
            placeholder="Mô tả chi tiết về ý tưởng, vấn đề cần giải quyết, giải pháp đề xuất..."></textarea>
        </div>

        <div class="md:col-span-2">
          <label>Lợi ích kỳ vọng *</label>
          <textarea pInputText [(ngModel)]="form.expectedBenefit" rows="3" class="w-full" 
            placeholder="Lợi ích mang lại cho đơn vị (tiết kiệm chi phí, nâng cao hiệu quả, giảm thời gian...)"></textarea>
        </div>

        <div class="md:col-span-2">
          <label>Tài liệu đính kèm</label>
          <p-fileUpload 
            name="files" 
            mode="basic" 
            chooseLabel="Chọn file" 
            accept="image/*,.pdf,.doc,.docx" 
            [multiple]="true"
            [auto]="true"
            customUpload
            (uploadHandler)="onFilesSelected($event)">
          </p-fileUpload>
          <small class="text-surface-500 block mt-1">
            Có thể đính kèm sơ đồ, mô hình, tài liệu tham khảo
          </small>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button pButton label="Làm mới" class="p-button-outlined" 
          (click)="resetForm()"></button>
        <button pButton label="Gửi đề xuất" icon="pi pi-send"
          [disabled]="submitting" [loading]="submitting"
          (click)="submit()"></button>
      </div>
    </div>

    <div class="card">
      <h2 class="text-xl font-semibold mb-4">Danh sách ý tưởng đề xuất</h2>

      <p-table #dt
        [value]="list"
        dataKey="id"
        [rows]="10"
        [rowHover]="true"
        [showGridlines]="true"
        [paginator]="true"
        [rowsPerPageOptions]="[10,25,50]"
        [globalFilterFields]="['title', 'description', 'submitterName', 'submitterDepartment']"
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
            <th style="min-width: 10rem">
              <div class="flex justify-between items-center">
                Danh mục
                <p-columnFilter field="category" matchMode="equals" display="menu">
                  <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                    <p-select [ngModel]="value" [options]="categoryOptions" 
                      optionLabel="label" optionValue="value"
                      placeholder="Tất cả" (onChange)="filter($event.value)" 
                      [style]="{'min-width': '12rem'}">
                    </p-select>
                  </ng-template>
                </p-columnFilter>
              </div>
            </th>

            <th style="min-width: 15rem" pSortableColumn="title">
              <div class="flex justify-between items-center">
                Tiêu đề
                <p-sortIcon field="title" />
              </div>
            </th>

            <th style="min-width: 8rem">
              <div class="flex justify-between items-center">
                Ưu tiên
                <p-columnFilter field="priority" matchMode="equals" display="menu">
                  <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                    <p-select [ngModel]="value" [options]="priorityOptions" 
                      optionLabel="label" optionValue="value"
                      placeholder="Tất cả" (onChange)="filter($event.value)" 
                      [style]="{'min-width': '10rem'}">
                    </p-select>
                  </ng-template>
                </p-columnFilter>
              </div>
            </th>

            <th style="min-width: 12rem">Người đề xuất</th>

            <th style="min-width: 10rem">
              <div class="flex justify-between items-center">
                Trạng thái
                <p-columnFilter field="status" matchMode="equals" display="menu">
                  <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                    <p-select [ngModel]="value" [options]="statusOptions" 
                      optionLabel="label" optionValue="value"
                      placeholder="Tất cả" (onChange)="filter($event.value)" 
                      [style]="{'min-width': '10rem'}">
                    </p-select>
                  </ng-template>
                </p-columnFilter>
              </div>
            </th>

            <th style="min-width: 10rem" pSortableColumn="createdAt">
              <div class="flex justify-between items-center">
                Ngày gửi
                <p-sortIcon field="createdAt" />
              </div>
            </th>

            <th style="width: 9rem; text-align: center">Thao tác</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-idea>
          <tr>
            <td>
              <p-tag [value]="categoryLabel(idea.category)" 
                [severity]="getCategorySeverity(idea.category)"
                [icon]="getCategoryIcon(idea.category)">
              </p-tag>
            </td>

            <td>
              <span class="font-semibold">{{ idea.title }}</span>
            </td>

            <td>
              <p-tag [value]="priorityLabel(idea.priority)" 
                [severity]="getPrioritySeverity(idea.priority)">
              </p-tag>
            </td>

            <td>
              <div class="flex flex-column gap-1">
                <span class="font-medium">{{ idea.submitterName }}</span>
              </div>
            </td>

            <td>
              <p-tag [value]="statusLabel(idea.status)" 
                [severity]="getStatusSeverity(idea.status)">
              </p-tag>
            </td>

            <td>
              <span class="text-sm">
                {{ idea.createdAt | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </td>

            <td>
              <div class="flex justify-center gap-1">
                <button pButton icon="pi pi-eye" 
                  [rounded]="true" [text]="true" size="small"
                  pTooltip="Xem chi tiết" tooltipPosition="top"
                  (click)="openDetail(idea)"></button>
                <button pButton icon="pi pi-pencil"
                  [rounded]="true" [text]="true" size="small"
                  severity="info" pTooltip="Sửa" tooltipPosition="top"
                  (click)="editIdea(idea)"
                  *ngIf="idea.status === 'pending'"></button>
                <button pButton icon="pi pi-trash"
                  [rounded]="true" [text]="true" size="small"
                  severity="danger" pTooltip="Xóa" tooltipPosition="top"
                  (click)="confirmDelete(idea)"></button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center py-6">
              <div class="flex flex-column items-center gap-3">
                <i class="pi pi-lightbulb text-4xl text-surface-300"></i>
                <span class="text-surface-500">Chưa có ý tưởng nào được đề xuất</span>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="loadingbody">
          <tr>
            <td colspan="7" class="text-center py-6">
              <i class="pi pi-spin pi-spinner text-2xl"></i>
              <div class="mt-2">Đang tải dữ liệu...</div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  </div>

  <!-- Dialog chi tiết -->
  <p-dialog 
    header="Chi tiết ý tưởng đổi mới" 
    [(visible)]="showDetail" 
    [modal]="true" 
    [style]="{width:'800px'}" 
    [draggable]="false">
    
    <div *ngIf="selected">
      <div class="detail-section">
        <h4>Thông tin chung</h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="detail-item">
            <span class="detail-label">Danh mục:</span>
            <p-tag [value]="categoryLabel(selected.category)" 
              [severity]="getCategorySeverity(selected.category)"
              [icon]="getCategoryIcon(selected.category)">
            </p-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">Mức độ ưu tiên:</span>
            <p-tag [value]="priorityLabel(selected.priority)" 
              [severity]="getPrioritySeverity(selected.priority)">
            </p-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">Trạng thái:</span>
            <p-tag [value]="statusLabel(selected.status)" 
              [severity]="getStatusSeverity(selected.status)">
            </p-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">Ngày gửi:</span>
            <span>{{ selected.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Người đề xuất</h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="detail-item">
            <span class="detail-label">Họ tên:</span>
            <span class="font-medium">{{ selected.submitterName }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span>{{ selected.submitterEmail }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Tiêu đề</h4>
        <p class="font-semibold text-lg">{{ selected.title }}</p>
      </div>

      <div class="detail-section">
        <h4>Mô tả chi tiết</h4>
        <div class="content-box">{{ selected.description }}</div>
      </div>

      <div class="detail-section">
        <h4>Lợi ích kỳ vọng</h4>
        <div class="content-box bg-green-50">{{ selected.expectedBenefit }}</div>
      </div>

      <div class="detail-section" *ngIf="selected.reviewNotes">
        <h4>Ghi chú đánh giá</h4>
        <div class="content-box bg-blue-50">{{ selected.reviewNotes }}</div>
      </div>

      <div class="detail-section" *ngIf="selected.attachments?.length">
        <h4>Tài liệu đính kèm ({{ selected.attachments?.length }})</h4>
        <div class="attachments">
          <div *ngFor="let file of selected.attachments" class="attachment-item">
            <i class="pi pi-file text-2xl text-surface-400"></i>
            <span class="text-sm">Tài liệu</span>
          </div>
        </div>
      </div>
    </div>

    <ng-template pTemplate="footer">
      <button pButton label="Đóng" class="p-button-text" 
        (click)="showDetail=false"></button>
      <button pButton label="Đang xem xét" severity="info"
        (click)="setStatus(selected!, 'reviewing')" 
        *ngIf="selected && selected.status === 'pending'"></button>
      <button pButton label="Phê duyệt" severity="success"
        (click)="approveIdea(selected!)" 
        *ngIf="selected && selected.status === 'reviewing'"></button>
      <button pButton label="Từ chối" severity="danger"
        (click)="rejectIdea(selected!)" 
        *ngIf="selected && (selected.status === 'pending' || selected.status === 'reviewing')"></button>
      <button pButton label="Đã triển khai" severity="contrast"
        (click)="setStatus(selected!, 'implemented')" 
        *ngIf="selected && selected.status === 'approved'"></button>
    </ng-template>
  </p-dialog>

  <!-- Dialog Reject -->
  <p-dialog 
    header="Từ chối ý tưởng" 
    [(visible)]="showRejectDialog" 
    [modal]="true" 
    [style]="{width:'500px'}">
    
    <div class="mb-3">
      <label>Lý do từ chối *</label>
      <textarea pInputText [(ngModel)]="rejectNotes" rows="4" class="w-full" 
        placeholder="Nhập lý do từ chối ý tưởng này..."></textarea>
    </div>

    <ng-template pTemplate="footer">
      <button pButton label="Hủy" class="p-button-text" 
        (click)="showRejectDialog=false"></button>
      <button pButton label="Xác nhận từ chối" severity="danger"
        (click)="confirmReject()"></button>
    </ng-template>
  </p-dialog>

  <p-confirmDialog [dismissableMask]="true"></p-confirmDialog>
  `,
  styles: [`
    .card {
      background: var(--p-content-background);
      border-radius: var(--p-content-border-radius);
      padding: 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .card:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.375rem;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 0.75rem 1rem;
      vertical-align: middle;
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      padding: 0.75rem 1rem;
      background: var(--p-surface-50);
      font-weight: 600;
    }

    :host ::ng-deep .p-tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }

    :host ::ng-deep .p-button.p-button-text {
      padding: 0.5rem;
    }

    :host ::ng-deep .p-datatable-emptymessage > td {
      padding: 2rem !important;
    }

    :host ::ng-deep textarea.p-inputtext {
      resize: vertical;
      min-height: 100px;
    }

    .detail-section {
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--p-surface-200);
    }

    .detail-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .detail-section h4 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--p-primary-color);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.875rem;
      color: var(--p-text-muted-color);
    }

    .content-box {
      white-space: pre-wrap;
      line-height: 1.6;
      background: var(--p-surface-50);
      padding: 1rem;
      border-radius: 8px;
    }

    .bg-green-50 {
      background-color: #f0fdf4 !important;
    }

    .bg-blue-50 {
      background-color: #eff6ff !important;
    }

    .attachments {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .attachment-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 1px solid var(--p-surface-200);
      border-radius: 8px;
      background: var(--p-surface-50);
    }
  `]
})
export class InnovationIdeasComponent implements OnInit {
  @ViewChild('globalSearch') globalSearch!: ElementRef;

  private svc = inject(InnovationIdeaService);
  private confirm = inject(ConfirmationService);

  list: InnovationIdea[] = [];
  loading = false;
  submitting = false;

  form: Partial<InnovationIdea> = {
    category: 'feature',
    title: '',
    description: '',
    expectedBenefit: '',
    priority: 'medium',
    attachments: []
  };

  showDetail = false;
  selected: InnovationIdea | null = null;

  showRejectDialog = false;
  rejectNotes = '';

  categoryOptions = [
    { label: 'Bổ sung tính năng', value: 'feature' as IdeaCategory },
    { label: 'Phát triển công cụ mới', value: 'tool' as IdeaCategory },
    { label: 'Cải tiến SXKD', value: 'production' as IdeaCategory },
    { label: 'Quản trị & Vận hành', value: 'management' as IdeaCategory },
    { label: 'Khác', value: 'other' as IdeaCategory },
  ];

  priorityOptions = [
    { label: 'Thấp', value: 'low' as IdeaPriority },
    { label: 'Trung bình', value: 'medium' as IdeaPriority },
    { label: 'Cao', value: 'high' as IdeaPriority },
    { label: 'Khẩn cấp', value: 'urgent' as IdeaPriority },
  ];

  statusOptions = [
    { label: 'Chờ xử lý', value: 'pending' as IdeaStatus },
    { label: 'Đang xem xét', value: 'reviewing' as IdeaStatus },
    { label: 'Đã phê duyệt', value: 'approved' as IdeaStatus },
    { label: 'Từ chối', value: 'rejected' as IdeaStatus },
    { label: 'Đã triển khai', value: 'implemented' as IdeaStatus },
  ];

  ngOnInit() { this.fetch(); }

  fetch() {
    this.loading = true;
    this.svc.list().subscribe({
      next: (res: InnovationIdea[]) => {
        this.list = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onFilesSelected(event: any) {
    const files: File[] = event.files || [];
    files.forEach(f => {
      this.svc.uploadAttachment(f).subscribe((url: string) => {
        this.form.attachments = this.form.attachments || [];
        this.form.attachments.push(url);
      });
    });
  }

  resetForm() {
    this.form = {
      category: 'feature',
      title: '',
      description: '',
      expectedBenefit: '',
      priority: 'medium',
      attachments: []
    };
  }

  submit() {
    if (!this.form.title?.trim() || !this.form.description?.trim() || !this.form.expectedBenefit?.trim()) {
      return;
    }

    this.submitting = true;

    // TODO: Lấy từ auth service
    const currentUser = 'Nguyễn Văn A';
    const currentEmail = 'nguyenvana@evngenco1.vn';

    const payload = {
      category: this.form.category!,
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      expectedBenefit: this.form.expectedBenefit.trim(),
      priority: this.form.priority!,
      submitterName: currentUser,
      submitterEmail: currentEmail,
      attachments: this.form.attachments ?? [],
      status: 'pending' as IdeaStatus
    };

    this.svc.add(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.resetForm();
        this.fetch();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  editIdea(idea: InnovationIdea) {
    this.form = {
      category: idea.category,
      title: idea.title,
      description: idea.description,
      expectedBenefit: idea.expectedBenefit,
      priority: idea.priority,
      attachments: [...(idea.attachments || [])]
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  categoryLabel(c: IdeaCategory) {
    const labels = {
      'feature': 'Tính năng',
      'tool': 'Công cụ',
      'production': 'SXKD',
      'management': 'Quản trị',
      'other': 'Khác'
    };
    return labels[c] || c;
  }

  getCategorySeverity(c: IdeaCategory): any {
    const severities = {
      'feature': 'info',
      'tool': 'success',
      'production': 'warn',
      'management': 'contrast',
      'other': 'secondary'
    };
    return severities[c] || 'secondary';
  }

  getCategoryIcon(c: IdeaCategory): string {
    const icons = {
      'feature': 'pi-plus-circle',
      'tool': 'pi-wrench',
      'production': 'pi-cog',
      'management': 'pi-sitemap',
      'other': 'pi-ellipsis-h'
    };
    return icons[c] || 'pi-lightbulb';
  }

  priorityLabel(p: IdeaPriority) {
    const labels = {
      'low': 'Thấp',
      'medium': 'Trung bình',
      'high': 'Cao',
      'urgent': 'Khẩn cấp'
    };
    return labels[p] || p;
  }

  getPrioritySeverity(p: IdeaPriority): any {
    const severities = {
      'low': 'secondary',
      'medium': 'info',
      'high': 'warn',
      'urgent': 'danger'
    };
    return severities[p] || 'secondary';
  }

  statusLabel(s: IdeaStatus) {
    const labels = {
      'pending': 'Chờ xử lý',
      'reviewing': 'Đang xem xét',
      'approved': 'Đã phê duyệt',
      'rejected': 'Từ chối',
      'implemented': 'Đã triển khai'
    };
    return labels[s] || s;
  }

  getStatusSeverity(s: IdeaStatus): any {
    const severities = {
      'pending': 'warn',
      'reviewing': 'info',
      'approved': 'success',
      'rejected': 'danger',
      'implemented': 'contrast'
    };
    return severities[s] || 'secondary';
  }

  openDetail(idea: InnovationIdea) {
    this.selected = idea;
    this.showDetail = true;
  }

  setStatus(idea: InnovationIdea, status: IdeaStatus) {
    this.svc.setStatus(idea.id, status).subscribe(() => {
      this.fetch();
      this.showDetail = false;
    });
  }

  approveIdea(idea: InnovationIdea) {
    this.confirm.confirm({
      header: 'Phê duyệt ý tưởng',
      message: `Bạn có chắc muốn phê duyệt ý tưởng <strong>${idea.title}</strong>?`,
      icon: 'pi pi-check-circle',
      acceptLabel: 'Phê duyệt',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.setStatus(idea, 'approved')
    });
  }

  rejectIdea(idea: InnovationIdea) {
    this.selected = idea;
    this.rejectNotes = '';
    this.showRejectDialog = true;
  }

  confirmReject() {
    if (!this.rejectNotes.trim() || !this.selected) return;

    this.svc.setStatus(this.selected.id, 'rejected', this.rejectNotes.trim()).subscribe(() => {
      this.fetch();
      this.showDetail = false;
      this.showRejectDialog = false;
      this.rejectNotes = '';
    });
  }

  confirmDelete(idea: InnovationIdea) {
    this.confirm.confirm({
      header: 'Xóa ý tưởng',
      message: `Bạn có chắc muốn xóa ý tưởng <strong>${idea.title}</strong>? Hành động này không thể hoàn tác.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.delete(idea.id).subscribe(() => this.fetch())
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
}