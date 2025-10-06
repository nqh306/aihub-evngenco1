import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-ai-tool-hub',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    BadgeModule,
    PaginatorModule
  ],
  template: `
    <div class="ai-hub-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-background">
          <div class="gradient-orb orb-1"></div>
          <div class="gradient-orb orb-2"></div>
          <div class="gradient-orb orb-3"></div>
        </div>
        <div class="header-content">
          <div class="header-icon-wrapper">
            <div class="header-icon">
              <div class="robot-3d">
                <div class="robot-head">
                  <div class="robot-antenna"></div>
                  <div class="robot-eyes">
                    <div class="eye left"></div>
                    <div class="eye right"></div>
                  </div>
                  <div class="robot-mouth"></div>
                </div>
                <div class="robot-body">
                  <div class="body-light"></div>
                </div>
              </div>
            </div>
            <div class="icon-glow"></div>
          </div>
          <h1 class="header-title">KHÁM PHÁ CÁC CÔNG CỤ AI</h1>
          <p class="header-subtitle">Tối ưu hóa công việc với sức mạnh của trí tuệ nhân tạo</p>
          
          <!-- Search Section -->
          <div class="search-wrapper">
            <i class="pi pi-search search-icon"></i>
            <input 
              pInputText 
              type="text" 
              placeholder="Tìm kiếm công cụ AI..." 
              class="search-input" 
              [(ngModel)]="searchQuery" 
              (input)="filterTools()" 
            />
          </div>
        </div>
      </div>

      <!-- Tabs Section -->
      <div class="tabs-section">
        <div class="tabs-container">
          <button 
            *ngFor="let tab of tabs" 
            type="button" 
            class="tab-button" 
            [class.active]="selectedTab === tab.value"
            (click)="selectTab(tab.value)">
            <i [class]="tab.icon"></i>
            <span>{{ tab.label }}</span>
            <span class="tab-count">{{ getToolCount(tab.value) }}</span>
          </button>
        </div>
      </div>

      <!-- Tools Grid Section -->
      <div class="tools-grid">
        <ng-container *ngFor="let tool of paginatedTools">
          <a [routerLink]="tool.route" class="tool-card">
            <div class="tool-icon" [style.background]="tool.color">
              <i [class]="tool.icon"></i>
            </div>
            <div class="tool-content">
              <div class="tool-header-inline">
                <h3 class="tool-title">{{ tool.name }}</h3>
                <span class="tool-badge">{{ getCategoryLabel(tool.category) }}</span>
              </div>
              <p class="tool-description">{{ tool.description }}</p>
            </div>
          </a>
        </ng-container>
        
        <div *ngIf="filteredTools.length === 0" class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <h3 class="empty-title">Không tìm thấy công cụ</h3>
          <p class="empty-text">Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrapper" *ngIf="filteredTools.length > 0">
        <p-paginator 
          [rows]="pageSize" 
          [totalRecords]="filteredTools.length"
          [first]="first"
          (onPageChange)="onPageChange($event)"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Hiển thị {first} - {last} trong tổng số {totalRecords} công cụ">
        </p-paginator>
      </div>
    </div>
  `,
  styles: [`
    .ai-hub-container {
      padding: 0 2rem 2rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header Section */
    .header-section {
      margin-bottom: 2rem;
      margin-top: 0;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, 
        rgba(99, 102, 241, 0.05) 0%, 
        rgba(168, 85, 247, 0.05) 50%,
        rgba(236, 72, 153, 0.05) 100%);
      border-radius: 1.5rem;
      padding: 1.5rem 2rem 2rem 2rem;
    }

    .header-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      z-index: 0;
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.6;
      animation: float 8s ease-in-out infinite;
    }

    .orb-1 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
      top: -100px;
      left: -50px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
      top: -50px;
      right: -30px;
      animation-delay: 2s;
    }

    .orb-3 {
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%);
      bottom: -50px;
      left: 50%;
      transform: translateX(-50%);
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(30px, -30px) scale(1.1);
      }
      66% {
        transform: translate(-20px, 20px) scale(0.9);
      }
    }

    .header-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
    }

    .header-icon-wrapper {
      position: relative;
      margin-bottom: 0;
    }

    .header-icon {
      width: 3.5rem;
      height: 3.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 1.125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
      position: relative;
      z-index: 2;
      animation: float-icon 3s ease-in-out infinite;
      overflow: hidden;
    }

    @keyframes float-icon {
      0%, 100% {
        transform: translateY(0) rotate(0deg);
      }
      25% {
        transform: translateY(-5px) rotate(2deg);
      }
      50% {
        transform: translateY(0) rotate(0deg);
      }
      75% {
        transform: translateY(-5px) rotate(-2deg);
      }
    }

    /* Robot 3D */
    .robot-3d {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform-style: preserve-3d;
      transform: scale(0.8);
    }

    .robot-head {
      width: 2rem;
      height: 2rem;
      background: linear-gradient(145deg, #ffffff, #e6e6ff);
      border-radius: 0.5rem;
      position: relative;
      box-shadow: 
        inset 0 2px 4px rgba(255, 255, 255, 0.3),
        0 2px 8px rgba(0, 0, 0, 0.2);
      animation: head-tilt 4s ease-in-out infinite;
      margin-bottom: 0.25rem;
    }

    @keyframes head-tilt {
      0%, 100% {
        transform: rotate(0deg);
      }
      25% {
        transform: rotate(-5deg);
      }
      50% {
        transform: rotate(0deg);
      }
      75% {
        transform: rotate(5deg);
      }
    }

    .robot-antenna {
      position: absolute;
      top: -0.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 0.5rem;
      background: linear-gradient(to bottom, #fff, transparent);
    }

    .robot-antenna::after {
      content: '';
      position: absolute;
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 6px;
      background: #4facfe;
      border-radius: 50%;
      box-shadow: 0 0 8px #4facfe;
      animation: blink-light 2s ease-in-out infinite;
    }

    @keyframes blink-light {
      0%, 100% {
        opacity: 1;
        box-shadow: 0 0 8px #4facfe;
      }
      50% {
        opacity: 0.3;
        box-shadow: 0 0 4px #4facfe;
      }
    }

    .robot-eyes {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 0.4rem;
    }

    .eye {
      width: 6px;
      height: 6px;
      background: #667eea;
      border-radius: 50%;
      box-shadow: 0 0 6px #667eea;
      animation: blink 3s ease-in-out infinite;
    }

    .eye.right {
      animation-delay: 0.1s;
    }

    @keyframes blink {
      0%, 90%, 100% {
        transform: scaleY(1);
        opacity: 1;
      }
      95% {
        transform: scaleY(0.1);
        opacity: 0.5;
      }
    }

    .robot-mouth {
      position: absolute;
      bottom: 0.3rem;
      left: 50%;
      transform: translateX(-50%);
      width: 0.8rem;
      height: 3px;
      background: #667eea;
      border-radius: 0 0 4px 4px;
      opacity: 0.6;
    }

    .robot-body {
      width: 2.5rem;
      height: 1.5rem;
      background: linear-gradient(145deg, #ffffff, #e6e6ff);
      border-radius: 0.4rem;
      position: relative;
      box-shadow: 
        inset 0 2px 4px rgba(255, 255, 255, 0.3),
        0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .body-light {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background: #4facfe;
      border-radius: 50%;
      box-shadow: 0 0 12px #4facfe;
      animation: pulse-light 2s ease-in-out infinite;
    }

    @keyframes pulse-light {
      0%, 100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      50% {
        opacity: 0.5;
        transform: translate(-50%, -50%) scale(1.2);
      }
    }

    .icon-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4.5rem;
      height: 4.5rem;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      animation: glow 2s ease-in-out infinite;
      z-index: 1;
    }

    @keyframes glow {
      0%, 100% {
        opacity: 0.5;
        transform: translate(-50%, -50%) scale(1);
      }
      50% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
      }
    }

    .header-title {
      font-size: 1.75rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .header-subtitle {
      font-size: 0.9375rem;
      color: var(--text-color-secondary);
      margin: 0.125rem 0 0.375rem 0;
      max-width: 600px;
      font-weight: 500;
      line-height: 1.4;
    }

    /* Search Section */
    .search-wrapper {
      position: relative;
      width: 100%;
      max-width: 600px;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-color-secondary);
      font-size: 1rem;
      z-index: 1;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 0.75rem 0.75rem 3rem;
      font-size: 0.9375rem;
      border: 2px solid rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .search-input:focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
      outline: none;
    }

    .search-input::placeholder {
      color: var(--text-color-secondary);
    }

    /* Tabs Section */
    .tabs-section {
      margin-bottom: 2.5rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .tabs-container {
      display: flex;
      gap: 0.75rem;
      padding-bottom: 0.5rem;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface-card);
      border: 1.5px solid var(--surface-border);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .tab-button:hover {
      border-color: var(--primary-color);
      background: var(--primary-50);
      color: var(--primary-color);
    }

    .tab-button.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
      box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.3);
    }

    .tab-button i {
      font-size: 1rem;
    }

    .tab-count {
      background: rgba(0, 0, 0, 0.15);
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      min-width: 1.5rem;
      text-align: center;
    }

    .tab-button.active .tab-count {
      background: rgba(255, 255, 255, 0.25);
      color: white;
    }

    .tab-button:not(.active) .tab-count {
      background: var(--surface-200);
      color: var(--text-color);
    }

    /* Tools Grid */
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .tool-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 0.75rem;
      padding: 1rem;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 1rem;
      transition: all 0.3s ease;
      cursor: pointer;
      text-decoration: none;
      position: relative;
      overflow: hidden;
    }

    .tool-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--primary-color), var(--primary-400));
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    .tool-card:hover {
      border-color: var(--primary-color);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    .tool-card:hover::before {
      transform: scaleX(1);
    }

    .tool-icon {
      flex-shrink: 0;
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .tool-content {
      flex: 1;
      min-width: 0;
    }

    .tool-header-inline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.375rem;
    }

    .tool-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tool-badge {
      flex-shrink: 0;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      background: var(--surface-100);
      color: var(--text-color-secondary);
      border-radius: 0.75rem;
      white-space: nowrap;
    }

    .tool-description {
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      color: var(--text-color-secondary);
      opacity: 0.5;
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0 0 0.5rem 0;
    }

    .empty-text {
      font-size: 1rem;
      color: var(--text-color-secondary);
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .ai-hub-container {
        padding: 0 1.5rem 1.5rem 1.5rem;
      }

      .header-section {
        padding: 1.25rem 1.5rem 1.75rem 1.5rem;
        margin-bottom: 1.5rem;
      }

      .header-icon {
        width: 3rem;
        height: 3rem;
      }

      .icon-glow {
        width: 4rem;
        height: 4rem;
      }

      .header-title {
        font-size: 1.375rem;
      }

      .header-subtitle {
        font-size: 0.875rem;
      }

      .search-input {
        padding: 0.625rem 0.625rem 0.625rem 2.5rem;
        font-size: 0.875rem;
      }

      .search-icon {
        left: 0.875rem;
        font-size: 0.9375rem;
      }

      .tools-grid {
        grid-template-columns: 1fr;
      }

      .tabs-container {
        gap: 0.5rem;
      }

      .tab-button {
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
      }

      .gradient-orb {
        filter: blur(40px);
      }

      .orb-1 {
        width: 200px;
        height: 200px;
      }

      .orb-2 {
        width: 150px;
        height: 150px;
      }

      .orb-3 {
        width: 120px;
        height: 120px;
      }
    }

    /* Pagination */
    .pagination-wrapper {
      margin-top: 2rem;
      margin-bottom: 1rem;
      display: flex;
      justify-content: center;
    }

    .pagination-wrapper ::ng-deep .p-paginator {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 0.625rem;
      padding: 0.625rem 1rem;
    }

    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-current {
      color: var(--text-color-secondary);
      font-size: 0.8125rem;
      padding: 0 0.5rem;
    }

    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-pages .p-paginator-page {
      min-width: 2rem;
      height: 2rem;
      margin: 0 0.125rem;
      border-radius: 0.375rem;
      border: 1px solid var(--surface-border);
      color: var(--text-color);
      transition: all 0.3s ease;
      font-size: 0.875rem;
    }

    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-pages .p-paginator-page:hover {
      background: var(--primary-50);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-first,
    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-prev,
    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-next,
    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-last {
      min-width: 2rem;
      height: 2rem;
      border-radius: 0.375rem;
      border: 1px solid var(--surface-border);
      color: var(--text-color);
      margin: 0 0.125rem;
      transition: all 0.3s ease;
    }

    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-first:not(.p-disabled):hover,
    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-prev:not(.p-disabled):hover,
    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-next:not(.p-disabled):hover,
    .pagination-wrapper ::ng-deep .p-paginator .p-paginator-last:not(.p-disabled):hover {
      background: var(--primary-50);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .pagination-wrapper ::ng-deep .p-paginator .p-disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .pagination-wrapper {
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
      }

      .pagination-wrapper ::ng-deep .p-paginator {
        padding: 0.5rem 0.75rem;
      }

      .pagination-wrapper ::ng-deep .p-paginator .p-paginator-current {
        font-size: 0.75rem;
      }

      .pagination-wrapper ::ng-deep .p-paginator .p-paginator-pages .p-paginator-page {
        min-width: 1.75rem;
        height: 1.75rem;
        font-size: 0.8125rem;
      }

      .pagination-wrapper ::ng-deep .p-paginator .p-paginator-first,
      .pagination-wrapper ::ng-deep .p-paginator .p-paginator-prev,
      .pagination-wrapper ::ng-deep .p-paginator .p-paginator-next,
      .pagination-wrapper ::ng-deep .p-paginator .p-paginator-last {
        min-width: 1.75rem;
        height: 1.75rem;
      }
    }
  `]
})
export class AiToolHubComponent {
  searchQuery = '';
  selectedTab = 'all';
  
  // Pagination
  pageSize = 9;
  first = 0;
  paginatedTools: any[] = [];

  tabs = [
    { label: 'Tất cả', value: 'all', icon: 'pi pi-th-large' },
    { label: 'Văn phòng', value: 'office', icon: 'pi pi-briefcase' },
    { label: 'Sáng kiến', value: 'innovation', icon: 'pi pi-lightbulb' },
    { label: 'Dịch thuật', value: 'translation', icon: 'pi pi-globe' },
  ];

  allTools = [
    { 
      name: 'Hỗ trợ viết Email', 
      description: 'Soạn email chuyên nghiệp, đúng ngữ điệu', 
      category: 'office', 
      route: '/uikit/soan-email',
      icon: 'pi pi-envelope',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    { 
      name: 'Viết bài phát biểu', 
      description: 'Tạo bài phát biểu cuốn hút cho mọi sự kiện', 
      category: 'office', 
      route: '/uikit/speech-writer.component',
      icon: 'pi pi-megaphone',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    { 
      name: 'Tóm tắt văn bản', 
      description: 'Rút gọn các tài liệu dài thành ý chính', 
      category: 'office', 
      route: '/uikit/text-summarizer',
      icon: 'pi pi-file-edit',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    { 
      name: 'Hỗ trợ sáng kiến', 
      description: 'Hỗ trợ xây dựng và phát triển ý tưởng sáng kiến', 
      category: 'innovation', 
      route: '/uikit/initiative-writer',
      icon: 'pi pi-star',
      color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    { 
      name: 'Tư duy Đổi mới sáng tạo', 
      description: 'Cung cấp các framework tư duy để sáng tạo', 
      category: 'innovation', 
      route: '/uikit/innovation_tool',
      icon: 'pi pi-bolt',
      color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    },
    { 
      name: 'Dịch văn bản', 
      description: 'Dịch và giữ nguyên định dạng tệp', 
      category: 'translation', 
      route: '/uikit/document-translator',
      icon: 'pi pi-language',
      color: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
    },
    { 
      name: 'Nâng cấp Prompt', 
      description: 'Biến prompt đơn giản thành prompt hiệu quả', 
      category: 'tools', 
      route: '/uikit/prompt-enhancer',
      icon: 'pi pi-sparkles',
      color: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)'
    },
  ];

  filteredTools = [...this.allTools];

  ngOnInit() {
    this.updatePagination();
  }

  filterTools() {
    let tempTools = this.selectedTab === 'all' 
      ? this.allTools 
      : this.allTools.filter(tool => tool.category === this.selectedTab);
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      tempTools = tempTools.filter(tool => 
        tool.name.toLowerCase().includes(query) || 
        tool.description.toLowerCase().includes(query)
      );
    }
    
    this.filteredTools = tempTools;
    this.first = 0; // Reset to first page when filtering
    this.updatePagination();
  }
  
  selectTab(tab: string) {
    this.selectedTab = tab;
    this.filterTools();
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.updatePagination();
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updatePagination() {
    const startIndex = this.first;
    const endIndex = this.first + this.pageSize;
    this.paginatedTools = this.filteredTools.slice(startIndex, endIndex);
  }

  getToolCount(category: string): number {
    if (category === 'all') {
      return this.allTools.length;
    }
    return this.allTools.filter(tool => tool.category === category).length;
  }

  getCategoryLabel(category: string): string {
    const tab = this.tabs.find(t => t.value === category);
    return tab ? tab.label : category;
  }
}