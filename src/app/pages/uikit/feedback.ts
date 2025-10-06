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
import { RatingModule } from 'primeng/rating';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { ConfirmationService } from 'primeng/api';
import { FeedbackService, Feedback, FeedbackStatus, FeedbackType } from '../../core/services/feedback.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, DialogModule, ConfirmDialogModule,
    TooltipModule, TagModule, SelectModule, FileUploadModule, RatingModule,
    IconFieldModule, InputIconModule
  ],
  providers: [ConfirmationService],
  template: `
  <div class="page p-4">
    <div class="card mb-4">
      <h2 class="text-xl font-semibold mb-4">Gửi đánh giá & góp ý</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Loại góp ý *</label>
          <p-select appendTo="body" class="w-full"
            [options]="typeOptions" optionLabel="label" optionValue="value"
            [(ngModel)]="form.type" (onChange)="onTypeChange()">
          </p-select>
        </div>

        <div *ngIf="!isRatingType()" class="md:col-span-2">
          <label>Tiêu đề *</label>
          <input pInputText [(ngModel)]="form.title" class="w-full" 
            placeholder="Mô tả ngắn gọn vấn đề"/>
        </div>

        <div *ngIf="isRatingType()" class="md:col-span-2">
          <label>Điểm đánh giá *</label>
          <div class="mt-1">
            <p-rating [(ngModel)]="form.rating" [stars]="5"></p-rating>
          </div>
          <small class="text-surface-500 block mt-1">Chọn từ 1-5 sao</small>
        </div>

        <div class="md:col-span-3">
          <label>Nội dung chi tiết *</label>
          <textarea pInputText [(ngModel)]="form.comment" rows="4" class="w-full" 
            placeholder="Mô tả chi tiết về lỗi, ý kiến hoặc đánh giá của bạn..."></textarea>
        </div>

        <div class="md:col-span-3">
          <label>Đính kèm ảnh</label>
          <p-fileUpload 
            name="files" 
            mode="basic" 
            chooseLabel="Chọn ảnh" 
            accept="image/*" 
            [multiple]="true"
            [auto]="true"
            customUpload
            (uploadHandler)="onFilesSelected($event)">
          </p-fileUpload>
          <small class="text-surface-500 block mt-1">Có thể đính kèm ảnh chụp màn hình</small>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button pButton label="Làm mới" class="p-button-outlined" 
          (click)="resetForm()"></button>
        <button pButton label="Gửi góp ý" icon="pi pi-send"
          [disabled]="submitting" [loading]="submitting"
          (click)="submit()"></button>
      </div>
    </div>

    <div class="card">
      <h2 class="text-xl font-semibold mb-4">Danh sách góp ý</h2>

      <p-table #dt
        [value]="list"
        dataKey="id"
        [rows]="10"
        [rowHover]="true"
        [showGridlines]="true"
        [paginator]="true"
        [rowsPerPageOptions]="[10,25,50]"
        [globalFilterFields]="['title', 'comment', 'reporterName', 'reporterEmail']"
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
            <th style="min-width: 8rem">
              <div class="flex justify-between items-center">
                Loại
                <p-columnFilter field="type" matchMode="equals" display="menu">
                  <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                    <p-select [ngModel]="value" [options]="typeOptions" 
                      optionLabel="label" optionValue="value"
                      placeholder="Tất cả" (onChange)="filter($event.value)" 
                      [style]="{'min-width': '10rem'}">
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

            <th style="min-width: 10rem" pSortableColumn="rating">
              <div class="flex justify-between items-center">
                Đánh giá
                <p-sortIcon field="rating" />
              </div>
            </th>

            <th style="min-width: 12rem">Người gửi</th>

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

        <ng-template pTemplate="body" let-fb>
          <tr>
            <td>
              <p-tag [value]="typeLabel(fb.type)" 
                [severity]="getTypeSeverity(fb.type)"
                [icon]="getTypeIcon(fb.type)">
              </p-tag>
            </td>

            <td>
              <span class="font-semibold">{{ fb.title }}</span>
            </td>

            <td>
              <p-rating [ngModel]="fb.rating || 0" [readonly]="true" 
                [stars]="5" *ngIf="fb.type === 'rating'">
              </p-rating>
              <span class="text-surface-400 text-sm" *ngIf="fb.type !== 'rating'">-</span>
            </td>

            <td>
              <div class="flex flex-column gap-1">
                <span class="font-medium">{{ fb.reporterName || 'Ẩn danh' }}</span>
                <small class="text-surface-500" *ngIf="fb.reporterEmail">
                  {{ fb.reporterEmail }}
                </small>
              </div>
            </td>

            <td>
              <p-tag [value]="statusText(fb.status)" 
                [severity]="statusColor(fb.status)">
              </p-tag>
            </td>

            <td>
              <span class="text-sm">
                {{ fb.createdAt | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </td>

            <td>
              <div class="flex justify-center gap-1">
                <button pButton icon="pi pi-eye" 
                  [rounded]="true" [text]="true" size="small"
                  pTooltip="Xem chi tiết" tooltipPosition="top"
                  (click)="openDetail(fb)"></button>
                <button pButton icon="pi pi-step-forward"
                  [rounded]="true" [text]="true" size="small"
                  severity="secondary" pTooltip="Chuyển trạng thái" tooltipPosition="top"
                  (click)="nextStatus(fb)"></button>
                <button pButton icon="pi pi-trash"
                  [rounded]="true" [text]="true" size="small"
                  severity="danger" pTooltip="Xóa" tooltipPosition="top"
                  (click)="confirmDelete(fb)"></button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center py-6">
              <div class="flex flex-column items-center gap-3">
                <i class="pi pi-comments text-4xl text-surface-300"></i>
                <span class="text-surface-500">Chưa có góp ý nào</span>
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
    header="Chi tiết góp ý" 
    [(visible)]="showDetail" 
    [modal]="true" 
    [style]="{width:'720px'}" 
    [draggable]="false">
    
    <div *ngIf="selected">
      <div class="detail-section">
        <h4>Thông tin chung</h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="detail-item">
            <span class="detail-label">Loại:</span>
            <p-tag [value]="typeLabel(selected.type)" 
              [severity]="getTypeSeverity(selected.type)"
              [icon]="getTypeIcon(selected.type)">
            </p-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">Trạng thái:</span>
            <p-tag [value]="statusText(selected.status)" 
              [severity]="statusColor(selected.status)">
            </p-tag>
          </div>
          <div class="detail-item">
            <span class="detail-label">Ngày gửi:</span>
            <span>{{ selected.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Người gửi:</span>
            <div>
              <div>{{ selected.reporterName || 'Ẩn danh' }}</div>
              <small class="text-surface-500" *ngIf="selected.reporterEmail">
                {{ selected.reporterEmail }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section" *ngIf="selected.type === 'rating'">
        <h4>Đánh giá</h4>
        <p-rating [ngModel]="selected.rating || 0" [readonly]="true" [stars]="5"></p-rating>
      </div>

      <div class="detail-section">
        <h4>Tiêu đề</h4>
        <p class="font-semibold">{{ selected.title }}</p>
      </div>

      <div class="detail-section">
        <h4>Nội dung chi tiết</h4>
        <div class="content-box">{{ selected.comment }}</div>
      </div>

      <div class="detail-section" *ngIf="selected.attachments?.length">
        <h4>Đính kèm ({{ selected.attachments?.length }})</h4>
        <div class="attachments">
          <img *ngFor="let img of selected.attachments" 
            [src]="img" alt="attachment"
            class="attachment-img"/>
        </div>
      </div>
    </div>

    <ng-template pTemplate="footer">
      <button pButton label="Đóng" class="p-button-text" 
        (click)="showDetail=false"></button>
      <button pButton label="Open" severity="contrast"
        (click)="setStatus(selected!, 'open')" 
        *ngIf="selected && selected.status !== 'open'"></button>
      <button pButton label="In Progress" severity="info"
        (click)="setStatus(selected!, 'in_progress')" 
        *ngIf="selected && selected.status !== 'in_progress'"></button>
      <button pButton label="Resolved" severity="success"
        (click)="setStatus(selected!, 'resolved')" 
        *ngIf="selected && selected.status !== 'resolved'"></button>
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

    .attachments {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .attachment-img {
      width: 140px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--p-surface-200);
      cursor: pointer;
      transition: transform 0.2s;
    }

    .attachment-img:hover {
      transform: scale(1.05);
    }

    :host ::ng-deep .p-fileupload-choose {
      font-size: 0.875rem;
    }

    :host ::ng-deep .p-rating .p-rating-icon {
      font-size: 1.25rem;
    }
  `]
})
export class FeedbackPageComponent implements OnInit {
  @ViewChild('globalSearch') globalSearch!: ElementRef;

  private svc = inject(FeedbackService);
  private confirm = inject(ConfirmationService);

  list: Feedback[] = [];
  loading = false;
  submitting = false;

  form: Partial<Feedback> = { 
    type: 'bug', 
    title: '', 
    rating: 0, 
    comment: '', 
    attachments: []
  };

  showDetail = false;
  selected: Feedback | null = null;

  typeOptions = [
    { label: 'Lỗi (Bug)', value: 'bug' as FeedbackType },
    { label: 'Đánh giá (Rating)', value: 'rating' as FeedbackType }
  ];

  statusOptions = [
    { label: 'Open', value: 'open' as FeedbackStatus },
    { label: 'In Progress', value: 'in_progress' as FeedbackStatus },
    { label: 'Resolved', value: 'resolved' as FeedbackStatus }
  ];

  ngOnInit() { this.fetch(); }

  fetch() {
    this.loading = true;
    this.svc.list().subscribe({
      next: res => {
        this.list = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  isRatingType(): boolean {
    return this.form.type === 'rating';
  }

  onTypeChange() {
    // Reset rating khi không phải type rating
    if (!this.isRatingType()) {
      this.form.rating = 0;
    }
  }

  onFilesSelected(event: any) {
    const files: File[] = event.files || [];
    files.forEach(f => {
      this.svc.uploadAttachment(f).subscribe(url => {
        this.form.attachments = this.form.attachments || [];
        this.form.attachments.push(url);
      });
    });
  }

  resetForm() {
    this.form = { 
      type: 'bug', 
      title: '', 
      rating: 0, 
      comment: '', 
      attachments: []
    };
  }

  submit() {
    // Validate
    if (!this.form.type || !this.form.comment?.trim()) {
      return;
    }
    
    // Title bắt buộc cho bug và other, không bắt buộc cho rating
    if (!this.isRatingType() && !this.form.title?.trim()) {
      return;
    }
    
    // Rating bắt buộc cho type rating
    if (this.isRatingType() && (!this.form.rating || this.form.rating < 1)) {
      return;
    }

    this.submitting = true;
    
    // TODO: Lấy thông tin user từ auth service
    const currentUser = 'Current User'; // Thay bằng auth.currentUser
    const currentEmail = 'user@example.com'; // Thay bằng auth.currentUser.email
    
    const payload = {
      type: this.form.type!,
      title: this.form.title?.trim() || `Đánh giá ${this.form.rating} sao`,
      rating: this.isRatingType() ? this.form.rating : undefined,
      comment: this.form.comment!.trim(),
      attachments: this.form.attachments ?? [],
      reporterName: currentUser,
      reporterEmail: currentEmail,
      status: 'open' as FeedbackStatus
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

  typeLabel(t: FeedbackType) {
    return t === 'bug' ? 'Lỗi' : t === 'rating' ? 'Đánh giá' : 'Khác';
  }

  getTypeSeverity(t: FeedbackType): any {
    return t === 'bug' ? 'danger' : t === 'rating' ? 'success' : 'secondary';
  }

  getTypeIcon(t: FeedbackType): string {
    return t === 'bug' ? 'pi-exclamation-circle' : t === 'rating' ? 'pi-star-fill' : 'pi-comment';
  }

  statusText(s: FeedbackStatus) {
    return s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : 'Resolved';
  }

  statusColor(s: FeedbackStatus): any {
    return s === 'open' ? 'contrast' : s === 'in_progress' ? 'info' : 'success';
  }

  openDetail(fb: Feedback) {
    this.selected = fb;
    this.showDetail = true;
  }

  setStatus(fb: Feedback, s: FeedbackStatus) {
    this.svc.setStatus(fb.id, s).subscribe(() => {
      this.fetch();
      this.showDetail = false;
    });
  }

  nextStatus(fb: Feedback) {
    const order: FeedbackStatus[] = ['open', 'in_progress', 'resolved'];
    const idx = order.indexOf(fb.status);
    const next = order[(idx + 1) % order.length];
    this.svc.setStatus(fb.id, next).subscribe(() => this.fetch());
  }

  confirmDelete(fb: Feedback) {
    this.confirm.confirm({
      header: 'Xóa góp ý',
      message: `Bạn có chắc muốn xóa góp ý <strong>${fb.title}</strong>?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.svc.delete(fb.id).subscribe(() => this.fetch())
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