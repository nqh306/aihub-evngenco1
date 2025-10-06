import { Component, ElementRef, HostListener, ViewChild, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
  template: `
  <div class="layout-topbar">
    <!-- Phần Logo và Actions không thay đổi -->
    <div class="layout-topbar-logo-container">
      <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
        <i class="pi pi-bars"></i>
      </button>
        <a class="layout-topbar-logo flex items-center" routerLink="/uikit/aihub-landing">
          <img src="assets/logo-evn.png"
              alt="EVN Genco 1 Logo"
              style="height: 40px; margin-right: 0px;">
          <div class="flex flex-col" style="margin-left: -2px;">
            <span style="font-family: 'HelveticaBlackVU'; font-size: 18px;">
               <span style="color: #11189d;">EVN</span>
              <span style="color: #ed1c24;"><i>GENCO1</i></span>
            </span>
            <img src="assets/logo-aihub.png"
                alt="AI HUB"
                style="height: 18px; width: auto; margin-top: 2px; transform: scaleX(1); margin-left: -1px;">
          </div>
        </a>
    </div>

    <div class="layout-topbar-actions">
      <!-- =================================================================== -->
      <!-- ============ START: TOKEN POPOVER (ĐÃ THIẾT KẾ LẠI) ============== -->
      <!-- =================================================================== -->
      <div #tokenWrap
           class="hidden md:flex items-center gap-3 mr-2 relative"
           (mouseenter)="openTokenPopup()"
           (mouseleave)="scheduleCloseTokenPopup()">
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm hover:shadow transition"
          (click)="toggleTokenPopupForTouch()">
          <i class="pi pi-building text-sm"></i>
          <span class="font-semibold tracking-tight">{{ paidTokenBalance | number }}</span>
          <i class="pi pi-bolt text-primary text-sm"></i>
        </button>
        <div *ngIf="showTokenPopup"
             class="absolute z-50 top-12 right-0 w-96 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl p-4"
             (mouseenter)="cancelCloseTokenPopup()"
             (mouseleave)="scheduleCloseTokenPopup()"
             (click)="$event.stopPropagation()">

            <!-- Header -->
            <h3 class="text-xl font-bold mb-3 text-surface-800 dark:text-surface-100">Tổng quan sử dụng</h3>

            <!-- Paid Token Quota -->
            <div class="mb-4">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-base font-medium text-surface-600 dark:text-surface-300">Hạn mức trả phí còn lại</span>
                    <span class="text-base font-semibold text-surface-800 dark:text-surface-100">
                        {{ paidTokenBalance | number }} / {{ monthlyTokenLimit | number }}
                     </span>
                </div>
                <div class="h-2 w-full rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                    <div class="h-full rounded-full bg-primary" [style.width.%]="paidTokenRemainingPercent"></div>
                </div>
            </div>

            <!-- Divider -->
            <hr class="border-surface-200 dark:border-surface-700 my-4">

            <!-- Usage Breakdown Chart -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-base font-medium text-surface-600 dark:text-surface-300">Phân bổ Token đã sử dụng</span>
                    <span class="text-base font-bold text-surface-800 dark:text-surface-100">{{ totalTokensUsed | number }}</span>
                </div>
                <div class="h-2 w-full flex rounded-full overflow-hidden bg-surface-200 dark:bg-surface-700">
                    <div class="h-full bg-primary" [style.width.%]="paidTokenUsagePercent" title="Token trả phí"></div>
                    <div class="h-full bg-teal-500" [style.width.%]="freeTokenUsagePercent" title="Token miễn phí"></div>
                </div>
                <div class="flex items-center justify-between text-sm text-surface-500 dark:text-surface-400 mt-2">
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-primary"></span>
                        <span>Trả phí: {{ paidTokensUsed | number }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-teal-500"></span>
                        <span>Miễn phí: {{ freeTokensUsed | number }}</span>
                     </div>
                </div>
            </div>

            <!-- Divider -->
            <hr class="border-surface-200 dark:border-surface-700 my-4">
            
            <!-- Statistics -->
            <div class="space-y-3">
                 <div class="flex items-center justify-between">
                    <span class="text-base text-surface-700 dark:text-surface-200">Tổng số requests</span>
                    <span class="text-base font-semibold text-surface-800 dark:text-surface-100">{{ totalRequests | number }}</span>
                </div>
            </div>
            
            <!-- Divider -->
            <hr class="border-surface-200 dark:border-surface-700 my-4">

            <!-- Expiry and Action Button -->
             <div class="flex items-center justify-between mb-4">
                <span class="text-base text-surface-700 dark:text-surface-200">Ngày làm mới hạn mức</span>
                <span class="text-base font-semibold text-surface-800 dark:text-surface-100">{{ expiryDate | date:'dd/MM/yyyy' }}</span>
            </div>
            <button type="button" class="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-contrast font-semibold hover:opacity-90 transition-opacity text-base" (click)="onTopUp()">
              Yêu cầu bổ sung Token
            </button>
        </div>
      </div>
      <!-- =================================================================== -->
      <!-- ============= END: TOKEN POPOVER (ĐÃ THIẾT KẾ LẠI) =============== -->
      <!-- =================================================================== -->

      <button #themeButton style="position: absolute; left: -9999px; opacity: 0;" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
        <i class="pi pi-palette"></i>
      </button>
      <app-configurator />

      <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
        <i class="pi pi-ellipsis-v"></i>
      </button>
      <div class="layout-topbar-menu hidden lg:flex lg:items-center">
        <div class="layout-topbar-menu-content">
          <button type="button" class="layout-topbar-action">
             <i class="pi pi-inbox"></i><span>Messages</span>
          </button>
        </div>
      </div>

      <div #profileWrap class="relative">
          <button type="button"
                  class="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  (click)="toggleProfileMenu()">
              <img [src]="user().avatarUrl" [alt]="user().fullName" class="w-10 h-10 rounded-full object-cover">
              <div class="hidden md:flex flex-col text-left leading-tight">
                  <span class="font-semibold text-sm text-surface-800 dark:text-surface-100">{{ user().fullName }}</span>
                  <span class="text-xs text-surface-500 dark:text-surface-400">{{ user().department }}</span>
              </div>
          </button>

          <div *ngIf="showProfileMenu"
               class="absolute z-50 top-full right-0 mt-2 w-80 rounded-xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl overflow-hidden animate-scalein"
               style="transform-origin: top right;"
               (click)="$event.stopPropagation()">

              <div class="flex flex-col items-center pt-5 pb-3">
                  <img [src]="user().avatarUrl" [alt]="user().fullName" class="w-24 h-24 rounded-full mb-1 object-cover">
                  <h3 class="font-bold text-2xl text-surface-800 dark:text-surface-100">{{ user().fullName }}</h3>
                  <p class="text-base text-surface-500 dark:text-surface-400">@{{ user().username }}</p>
              </div>

              <ul class="px-2 pb-2 flex flex-col space-y-1">
                  <li>
                      <div class="flex items-center gap-4 p-2 rounded-md">
                          <i class="pi pi-sitemap text-xl text-surface-500 dark:text-surface-400 w-6 text-center"></i>
                          <div>
                              <span class="text-sm font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Đơn vị</span>
                              <p class="text-base font-medium text-surface-700 dark:text-surface-200">{{ user().unit }}</p>
                          </div>
                      </div>
                  </li>
                  <li>
                      <div class="flex items-center gap-4 p-2 rounded-md">
                          <i class="pi pi-users text-xl text-surface-500 dark:text-surface-400 w-6 text-center"></i>
                          <div>
                              <span class="text-sm font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Phòng ban</span>
                              <p class="text-base font-medium text-surface-700 dark:text-surface-200">{{ user().department }}</p>
                          </div>
                      </div>
                  </li>

                  <li class="!my-2">
                      <hr class="border-surface-200 dark:border-surface-700">
                  </li>

                  <li>
                      <button type="button"
                              class="w-full flex items-center gap-4 p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-left"
                              (click)="onThemeClick()">
                          <i class="pi pi-palette text-xl text-surface-500 dark:text-surface-400 w-6 text-center"></i>
                          <span class="font-medium text-base text-surface-700 dark:text-surface-200">Chỉnh màu giao diện</span>
                      </button>
                  </li>
                   <li>
                      <button type="button"
                              class="w-full flex items-center gap-4 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors text-red-500 dark:text-red-400 text-left"
                              (click)="onLogout()">
                          <i class="pi pi-sign-out text-xl w-6 text-center"></i>
                          <span class="font-medium text-base">Đăng xuất</span>
                      </button>
                  </li>
              </ul>
          </div>
      </div>
      </div>
  </div>
  `
})
export class AppTopbar {
  // Inject các services cần thiết
  private authService = inject(AuthService);
  private router = inject(Router);
  public layoutService = inject(LayoutService);

  // Dữ liệu người dùng động, lấy từ AuthService
  user = computed(() => {
    const loggedInUser = this.authService.currentUser();
    if (loggedInUser) {
      return {
        fullName: loggedInUser.fullName,
        username: loggedInUser.username,
        department: loggedInUser.phongban,
        unit: loggedInUser.donvi,
        avatarUrl: loggedInUser.avatar || `https://ui-avatars.com/api/?name=${loggedInUser.fullName.replace(/\s/g, '+')}&background=3B82F6&color=fff&size=128`
      };
    }
    // Dữ liệu mặc định khi chưa có ai đăng nhập
    return {
      fullName: 'Guest User',
      username: 'guest',
      department: 'N/A',
      unit: 'N/A',
      avatarUrl: `https://ui-avatars.com/api/?name=G&background=808080&color=fff&size=128`
    };
  });
  
  // ===== Dữ liệu giả lập cho popover Token (có thể thay bằng API sau) =====
  paidTokenBalance = 150000;
  monthlyTokenLimit  = 1000000;
  expiryDate   = new Date(2025, 9, 30);
  showTokenPopup   = false;
  showProfileMenu = false;

  // ===== Dữ liệu giả lập cho thống kê (có thể thay bằng API sau) =====
  paidTokensUsed = 850000;
  freeTokensUsed = 250000;
  paidRequests = 1250;
  freeRequests = 500;
  
  private hideTimer: any;
  private openTimer: any;

  @ViewChild('tokenWrap') tokenWrap!: ElementRef;
  @ViewChild('profileWrap') profileWrap!: ElementRef;
  @ViewChild('themeButton') themeButton!: ElementRef;

  // ===== Getters for calculated values =====
  get paidTokenRemainingPercent(): number {
    const p = (this.paidTokenBalance / (this.monthlyTokenLimit || 1)) * 100;
    return Math.max(0, Math.min(100, p));
  }

  get totalTokensUsed(): number {
    return this.paidTokensUsed + this.freeTokensUsed;
  }

  get totalRequests(): number {
      return this.paidRequests + this.freeRequests;
  }

  get paidTokenUsagePercent(): number {
    if (this.totalTokensUsed === 0) return 0;
    return (this.paidTokensUsed / this.totalTokensUsed) * 100;
  }

  get freeTokenUsagePercent(): number {
    if (this.totalTokensUsed === 0) return 0;
    return (this.freeTokensUsed / this.totalTokensUsed) * 100;
  }

  // ===== Logic cho các popover và menu =====
  openTokenPopup() {
    this.cancelCloseTokenPopup();
    clearTimeout(this.openTimer);
    this.openTimer = setTimeout(() => (this.showTokenPopup = true), 80);
  }
   scheduleCloseTokenPopup() {
    this.cancelOpenTokenPopup();
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => (this.showTokenPopup = false), 150);
  }
  cancelCloseTokenPopup() { clearTimeout(this.hideTimer); }
  cancelOpenTokenPopup()  { clearTimeout(this.openTimer); }

  toggleTokenPopupForTouch() { this.showTokenPopup = !this.showTokenPopup; }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  onThemeClick() {
    this.showProfileMenu = false;
    setTimeout(() => {
      if (this.themeButton) {
        const btn = this.themeButton.nativeElement as HTMLButtonElement;
        btn.click();
      }
    }, 50);
  }

  onLogout() {
    this.showProfileMenu = false;
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (this.tokenWrap && this.tokenWrap.nativeElement && !this.tokenWrap.nativeElement.contains(e.target as Node)) {
        this.showTokenPopup = false;
    }

    if (this.profileWrap && this.profileWrap.nativeElement && !this.profileWrap.nativeElement.contains(e.target as Node)) {
        this.showProfileMenu = false;
    }
  }
  
  toggleDarkMode() {
    this.layoutService.layoutConfig.update((s) => ({ ...s, darkTheme: !s.darkTheme }));
  }
  
  onTopUp()  { console.log('Top up token'); }
}
