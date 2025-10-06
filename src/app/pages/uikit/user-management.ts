import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';

import { UserService, User, UserStatus } from '../../core/services/user.service';
import { QuotaProfileService, QuotaProfile } from '../../core/services/quota-profile.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, TagModule, AvatarModule,
    SelectModule, DialogModule, FileUploadModule, ConfirmDialogModule, 
    ProgressSpinnerModule, IconFieldModule, InputIconModule, TooltipModule,
    PasswordModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
  <div class="page p-4">
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Quản trị người dùng</h2>
        <button pButton label="Thêm người dùng" icon="pi pi-plus" 
          (click)="openNewUserDialog()"></button>
      </div>

      <p-table #dt
        [value]="users"
        dataKey="id"
        [rows]="10"
        [rowHover]="true"
        [showGridlines]="true"
        [paginator]="true"
        [rowsPerPageOptions]="[10,25,50]"
        [globalFilterFields]="['username', 'fullName', 'email', 'phone', 'donvi', 'phongban', 'vitri', 'role']"
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
            <th style="width: 5rem">Ảnh</th>
            <th style="min-width: 10rem" pSortableColumn="username">Username</th>
            <th style="min-width: 12rem" pSortableColumn="fullName">Họ và tên</th>
            <th style="min-width: 10rem">Đơn vị</th>
            <th style="min-width: 10rem">Phòng/Ban</th>
            <th style="min-width: 10rem">Vị trí</th>
            <th style="min-width: 8rem">Vai trò</th>
            <th style="min-width: 12rem">Email</th>
            <th style="min-width: 10rem">SĐT</th>
            <th style="min-width: 12rem" pSortableColumn="quotaProfileId">Profile Định Mức</th>
            <th style="min-width: 10rem">Trạng thái</th>
            <th style="width: 9rem; text-align: center">Thao tác</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-user>
          <tr>
            <td>
              <p-avatar [image]="user.avatar || 'assets/logo-evn.png'" shape="circle" size="large"></p-avatar>
            </td>
            <td><span class="font-medium">{{ user.username }}</span></td>
            <td><span class="font-semibold">{{ user.fullName }}</span></td>
            <td><span class="text-sm">{{ user.donvi }}</span></td>
            <td><span class="text-sm">{{ user.phongban }}</span></td>
            <td><span class="text-sm">{{ user.vitri }}</span></td>
            <td><p-tag [value]="user.role" severity="secondary"></p-tag></td>
            <td><span class="text-sm">{{ user.email }}</span></td>
            <td><span class="text-sm">{{ user.phone }}</span></td>
            <td>
              <span class="font-medium">{{ getProfileName(user.quotaProfileId) }}</span>
            </td>
            <td>
              <p-tag [value]="user.status === 'active' ? 'Đang dùng' : 'Ngừng'"
                [severity]="user.status === 'active' ? 'success' : 'danger'"></p-tag>
            </td>
            <td>
              <div class="flex justify-center gap-1">
                <button pButton icon="pi pi-pencil" [rounded]="true" [text]="true" size="small"
                  severity="info" pTooltip="Sửa" (click)="editUser(user)"></button>
                <button pButton icon="pi pi-ban" [rounded]="true" [text]="true" size="small"
                  severity="secondary" pTooltip="Tạm ngừng" *ngIf="user.status === 'active'"
                  (click)="confirmInactive(user)"></button>
                <button pButton icon="pi pi-trash" [rounded]="true" [text]="true" size="small"
                  severity="danger" pTooltip="Xóa" (click)="confirmDelete(user)"></button>
              </div>
            </td>
          </tr>
        </ng-template>
        <!-- ... các template empty, loading giữ nguyên ... -->
      </p-table>
    </div>
  </div>

  <!-- Dialog thêm/sửa -->
  <p-dialog 
    [header]="editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'"
    [(visible)]="showUserDialog" [modal]="true" [style]="{width:'700px'}" [draggable]="false">
    
    <!-- ... phần avatar, thông tin cá nhân, công việc, liên hệ giữ nguyên ... -->
    <div class="flex flex-column items-center gap-3 mb-4">
        <p-avatar [image]="formData.avatar || 'assets/logo-evn.png'" shape="circle" size="xlarge" styleClass="w-20 h-20 text-2xl shadow-md"></p-avatar>
        <p-fileUpload name="avatar" mode="basic" chooseLabel="Chọn ảnh" accept="image/*" [auto]="true" customUpload (uploadHandler)="onAvatarSelect($event)"></p-fileUpload>
    </div>
    <div class="group">
        <h3>Thông tin cá nhân</h3>
        <div class="grid grid-cols-2 gap-3">
            <div><label>Username *</label><input pInputText [(ngModel)]="formData.username" class="w-full"/></div>
            <div><label>Họ và tên *</label><input pInputText [(ngModel)]="formData.fullName" class="w-full"/></div>
        </div>
    </div>
    <div class="group" *ngIf="!editingUser">
        <h3>Bảo mật</h3>
        <div><label for="password">Mật khẩu *</label><p-password [(ngModel)]="formData.password" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password></div>
    </div>
    <div class="group">
        <h3>Công việc</h3>
        <div class="grid grid-cols-2 gap-3">
            <div><label>Đơn vị</label><input pInputText [(ngModel)]="formData.donvi" class="w-full"/></div>
            <div><label>Phòng/Ban</label><input pInputText [(ngModel)]="formData.phongban" class="w-full"/></div>
            <div><label>Vị trí</label><input pInputText [(ngModel)]="formData.vitri" class="w-full"/></div>
            <div><label>Vai trò</label><input pInputText [(ngModel)]="formData.role" class="w-full"/></div>
        </div>
    </div>
    <div class="group">
        <h3>Liên hệ</h3>
        <div class="grid grid-cols-2 gap-3">
            <div><label>Email *</label><input pInputText type="email" [(ngModel)]="formData.email" class="w-full"/></div>
            <div><label>Số điện thoại</label><input pInputText [(ngModel)]="formData.phone" class="w-full"/></div>
        </div>
    </div>

    <div class="group last">
      <h3>Hệ thống</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label>Profile Định Mức</label>
          <p-select [options]="profileOptions" [(ngModel)]="formData.quotaProfileId"
            placeholder="Chọn profile" optionLabel="label" optionValue="value" 
            appendTo="body" class="w-full">
          </p-select>
        </div>
        <div>
          <label>Trạng thái</label>
          <p-select [options]="statusOptions" [(ngModel)]="formData.status" 
            optionLabel="label" optionValue="value" appendTo="body" class="w-full">
          </p-select>
        </div>
      </div>
    </div>

    <ng-template pTemplate="footer">
      <button pButton label="Hủy" class="p-button-text" (click)="showUserDialog=false"></button>
      <button pButton label="Lưu" severity="primary" [disabled]="saving" (click)="saveUser()"></button>
    </ng-template>
  </p-dialog>

  <p-confirmDialog [dismissableMask]="true"></p-confirmDialog>
  `,
  styles: [`
    .group { margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--p-surface-200); }
    .group.last { border-bottom: 0; }
    .group h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; }
    .group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; }
  `]
})
export class UserManagementComponent implements OnInit {
  @ViewChild('globalSearch') globalSearch!: ElementRef;

  private userSvc = inject(UserService);
  private quotaSvc = inject(QuotaProfileService);
  private confirm = inject(ConfirmationService);

  users: User[] = [];
  quotaProfiles: QuotaProfile[] = [];
  profileOptions: { label: string, value: string }[] = [];
  
  loading = false;
  saving = false;

  showUserDialog = false;
  editingUser: User | null = null;
  formData: Partial<User> & { password?: string } = {};

  statusOptions = [
    { label: 'Đang sử dụng', value: 'active' as UserStatus },
    { label: 'Ngừng', value: 'inactive' as UserStatus }
  ];

  ngOnInit(): void { 
    this.fetchUsers(); 
    this.fetchQuotaProfiles();
  }

  fetchUsers() {
    this.loading = true;
    this.userSvc.list().subscribe({
      next: (res) => { this.users = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
  
  fetchQuotaProfiles() {
    this.quotaSvc.list().subscribe(profiles => {
      this.quotaProfiles = profiles;
      this.profileOptions = profiles.map(p => ({ label: p.name, value: p.id }));
    });
  }

  emptyUser(): Partial<User> & { password?: string } {
    return { 
      username: '', 
      password: '',
      fullName: '', 
      donvi: '', 
      phongban: '', 
      vitri: '',
      role: '', 
      email: '', 
      phone: '', 
      status: 'active', 
      avatar: '',
      quotaProfileId: undefined
    };
  }

  openNewUserDialog() {
    this.editingUser = null;
    this.formData = this.emptyUser();
    this.showUserDialog = true;
  }

  editUser(u: User) {
    this.editingUser = u;
    this.formData = { ...u };
    this.showUserDialog = true;
  }

  saveUser() {
    this.saving = true;
    if (this.editingUser) {
      this.userSvc.update(this.editingUser.id, this.formData).subscribe({
        next: () => { this.saving = false; this.showUserDialog = false; this.fetchUsers(); },
        error: () => { this.saving = false; }
      });
    } else {
      const { ...payload } = this.formData;
      this.userSvc.add(payload as Omit<User, 'id'>).subscribe({
        next: () => { this.saving = false; this.showUserDialog = false; this.fetchUsers(); },
        error: () => { this.saving = false; }
      });
    }
  }

  confirmInactive(user: User) {
    this.confirm.confirm({
      header: 'Tạm ngừng người dùng',
      message: `Bạn có chắc muốn tạm ngừng hoạt động của <strong>${user.fullName}</strong>?`,
      accept: () => this.userSvc.setStatus(user.id, 'inactive').subscribe(() => this.fetchUsers())
    });
  }

  confirmDelete(user: User) {
    this.confirm.confirm({
      header: 'Xóa người dùng',
      message: `Bạn có chắc muốn xóa <strong>${user.fullName}</strong>?`,
      accept: () => this.userSvc.delete(user.id).subscribe(() => this.fetchUsers())
    });
  }

  onAvatarSelect(event: any) {
    const file = event.files?.[0];
    if (file) {
      this.userSvc.uploadAvatar(file).subscribe(urlOrB64 => {
        this.formData.avatar = urlOrB64;
      });
    }
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

  getProfileName(profileId?: string): string {
    if (!profileId) return 'Chưa gán';
    const profile = this.quotaProfiles.find(p => p.id === profileId);
    return profile ? profile.name : 'Không rõ';
  }
}

