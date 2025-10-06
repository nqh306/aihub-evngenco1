import {
  Component, ElementRef, ViewChild,
  AfterViewChecked, OnInit, OnDestroy, inject, HostListener, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { Popover, PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';

// Markdown
import { MarkdownModule, provideMarkdown } from 'ngx-markdown';

// Drag & Drop
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { Subscription } from 'rxjs';

// App services & models
import { AiModelService } from '../../core/services/ai-model.service';
import { AICategory, AIModel, ChatMessage, ChatSession } from '../../core/models/ai-models.model';
import { AiModelSelectorComponent } from '../../core/shared/components/ai-model-selector.component';
import { AuthService } from '../../core/services/auth.service';

type ChatBackend =
  | { mode: 'sse'; url:string }
  | { mode: 'http'; url: string };

interface ChatFolder {
  id: string;
  name: string;
  createdAt: Date;
  expanded?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,

    // PrimeNG
    InputTextModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    AvatarModule,
    AvatarGroupModule,
    PopoverModule,
    TagModule,
    ConfirmDialogModule,
    MenuModule,
    ToastModule,

    // Markdown
    MarkdownModule,

    // CDK
    DragDropModule,

    // Custom
    AiModelSelectorComponent
  ],
  template: `
<div class="chatbot-root">
  <p-toast position="top-center" key="t1"></p-toast>

  <p-confirmDialog
    [style]="{ width: '28rem' }"
    [closable]="false"
    [breakpoints]="{ '640px': '95vw' }"
    acceptLabel="Xoá"
    rejectLabel="Huỷ"
    icon="pi pi-exclamation-triangle"
    header="Xoá?"
    [acceptButtonStyleClass]="'p-button-danger'"
    [rejectButtonStyleClass]="'p-button-text p-button-secondary'">
  </p-confirmDialog>

  <p-menu #moveMenu [popup]="true" [model]="moveMenuModel" [appendTo]="'body'"></p-menu>

  <div *ngIf="!showSidebar" class="floating-hamburger">
    <p-button icon="pi pi-bars" [rounded]="true" severity="secondary" [raised]="true"
              (onClick)="toggleSidebar()" pTooltip="Hiện lịch sử" tooltipPosition="right"></p-button>
  </div>

  <div class="flex" style="height: calc(100vh - 12rem);">
    <div *ngIf="showSidebar"
         class="w-72 bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 flex flex-col shrink-0">
      <div class="p-3 border-b border-surface-200 dark:border-surface-700 flex items-center gap-2">
        <p-button icon="pi pi-bars" [text]="true" [rounded]="true" severity="secondary" size="small"
                  pTooltip="Ẩn lịch sử" tooltipPosition="bottom" (onClick)="toggleSidebar()"></p-button>

        <div class="ml-auto flex items-center gap-2">
          <p-button label="Folder" icon="pi pi-folder-plus" severity="secondary" size="small"
                    (onClick)="createFolder()"></p-button>
          <p-button label="Chat mới" icon="pi pi-plus" severity="primary" size="small"
                    (onClick)="createNewChat()"></p-button>
        </div>
      </div>

      <div class="px-3 pt-3 pb-1 flex items-center justify-between">
        <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400">Folders ({{ folders.length }})</div>
        <button class="icon-btn" type="button" (click)="foldersVisible = !foldersVisible" pTooltip="{{foldersVisible ? 'Thu gọn' : 'Mở rộng'}}">
          <i class="pi text-sm" [ngClass]="foldersVisible ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
        </button>
      </div>
      <div *ngIf="foldersVisible" class="flex-0 px-2">
        <div *ngFor="let f of folders; trackBy: trackByFolder" class="mb-2 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-2 px-2 py-1.5 bg-surface-50 dark:bg-surface-700/40 group">
            <button class="icon-btn" type="button" (click)="f.expanded = !f.expanded" pTooltip="{{f.expanded ? 'Thu gọn' : 'Mở rộng'}}">
              <i class="pi" [ngClass]="f.expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
            </button>
            <i class="pi pi-folder text-surface-500"></i>

            <ng-container *ngIf="editingFolderId !== f.id; else editFolderTpl">
              <div class="flex-1 min-w-0 truncate" [pTooltip]="f.name" tooltipPosition="top">{{ f.name }}</div>
              <span class="text-xs text-surface-400 px-1.5 py-0.5 rounded-md bg-surface-200 dark:bg-surface-600">{{ sessionsByFolder[f.id]?.length || 0 }}</span>
              <div class="items-center gap-1 hidden group-hover:flex ml-auto">
                  <button class="icon-btn" type="button" (click)="startRenameFolder(f)" pTooltip="Đổi tên">
                      <i class="pi pi-pencil"></i>
                  </button>
                  <button class="icon-btn" type="button" (click)="confirmDeleteFolder(f)" pTooltip="Xoá folder">
                      <i class="pi pi-trash text-red-500"></i>
                  </button>
              </div>
            </ng-container>

            <ng-template #editFolderTpl>
              <input type="text" class="p-inputtext p-inputtext-sm w-full" [(ngModel)]="editingFolderName"
                     (keydown.enter)="commitRenameFolder(f)" />
              <button class="icon-btn" type="button" (click)="commitRenameFolder(f)" pTooltip="Lưu"><i class="pi pi-check text-green-500"></i></button>
              <button class="icon-btn" type="button" (click)="cancelRenameFolder()" pTooltip="Huỷ"><i class="pi pi-times"></i></button>
            </ng-template>
          </div>

          <div *ngIf="f.expanded" class="p-2">
            <div
              cdkDropList
              [id]="'folder-' + f.id"
              [cdkDropListData]="sessionsByFolder[f.id]"
              [cdkDropListConnectedTo]="connectedIdsForFolder(f.id)"
              (cdkDropListDropped)="dropOnFolder(f, $event)"
              class="drop-zone"
            >
              <div *ngIf="sessionsByFolder[f.id]?.length === 0" class="empty-hint">
                Kéo chat vào đây
              </div>

              <div *ngFor="let session of sessionsByFolder[f.id]; trackBy: trackBySession"
                   class="group px-2.5 py-1.5 mb-1 rounded-lg transition-all duration-150 flex items-center gap-2 relative"
                   [ngClass]="{
                     'bg-primary-50 dark:bg-primary-900/30': session.id === currentSessionId,
                     'hover:bg-surface-100 dark:hover:bg-surface-700/50': session.id !== currentSessionId
                   }"
                   cdkDrag
                   [cdkDragData]="session"
              >
                <div class="flex-1 min-w-0" (click)="switchChatSession(session.id)">
                  <ng-container *ngIf="editingSessionId !== session.id; else editSessionTpl">
                    <p class="m-0 text-sm font-medium truncate cursor-pointer">{{session.title}}</p>
                  </ng-container>
                  <ng-template #editSessionTpl>
                     <input type="text" class="p-inputtext p-inputtext-sm w-full" [(ngModel)]="editingSessionTitle"
                           (keydown.enter)="commitRenameSession(session)" />
                  </ng-template>
                  <p *ngIf="editingSessionId !== session.id" class="m-0 text-xs text-surface-500 dark:text-surface-400 cursor-pointer">{{formatTimestamp(session.timestamp)}}</p>
                </div>

                <div class="ml-auto items-center gap-1 absolute right-1.5 top-1/2 -translate-y-1/2 bg-inherit rounded-md"
                     [ngClass]="{'flex': editingSessionId === session.id, 'hidden group-hover:flex': editingSessionId !== session.id}">
                    <ng-container *ngIf="editingSessionId !== session.id; else editSessionButtons">
                        <button class="icon-btn" type="button" (click)="openMoveMenu($event, session)" pTooltip="Chuyển folder" tooltipPosition="top"><i class="pi pi-folder-open"></i></button>
                        <button class="icon-btn" type="button" (click)="startRenameSession(session, $event)" pTooltip="Đổi tên" tooltipPosition="top"><i class="pi pi-pencil"></i></button>
                        <button class="icon-btn" type="button" (click)="confirmDelete(session.id, $event)" pTooltip="Xoá chat" tooltipPosition="top"><i class="pi pi-trash"></i></button>
                    </ng-container>
                    <ng-template #editSessionButtons>
                        <button class="icon-btn" type="button" (click)="commitRenameSession(session)" pTooltip="Lưu"><i class="pi pi-check text-green-500"></i></button>
                        <button class="icon-btn" type="button" (click)="cancelRenameSession()" pTooltip="Huỷ"><i class="pi pi-times"></i></button>
                    </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-3 pt-3 pb-1 flex items-center justify-between">
        <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400">Chats ({{ rootSessions.length }})</div>
         <button class="icon-btn" type="button" (click)="chatsVisible = !chatsVisible" pTooltip="{{chatsVisible ? 'Thu gọn' : 'Mở rộng'}}">
          <i class="pi text-sm" [ngClass]="chatsVisible ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
        </button>
      </div>
      <div *ngIf="chatsVisible" class="flex-1 overflow-y-auto p-2">
        <div
          cdkDropList
          id="root-list"
          [cdkDropListData]="rootSessions"
          [cdkDropListConnectedTo]="connectedIdsForRoot()"
          (cdkDropListDropped)="dropOnRoot($event)"
          class="drop-zone"
        >
          <div *ngIf="rootSessions.length === 0" class="text-center py-6 px-4 text-sm text-surface-500 dark:text-surface-400">
            Không có chat ở Root. Kéo chat ra đây để bỏ khỏi folder.
          </div>

          <div *ngFor="let session of rootSessions; trackBy: trackBySession"
               class="group px-2.5 py-1.5 mb-1 rounded-lg transition-all duration-150 flex items-center gap-2 relative"
               [ngClass]="{
                 'bg-primary-50 dark:bg-primary-900/30': session.id === currentSessionId,
                 'hover:bg-surface-100 dark:hover:bg-surface-700/50': session.id !== currentSessionId
               }"
               cdkDrag
               [cdkDragData]="session"
          >
            <div class="flex-1 min-w-0" (click)="switchChatSession(session.id)">
              <ng-container *ngIf="editingSessionId !== session.id; else editSessionTpl">
                  <p class="m-0 text-sm font-medium text-surface-800 dark:text-surface-100 truncate cursor-pointer">{{session.title}}</p>
              </ng-container>
              <ng-template #editSessionTpl>
                   <input type="text" class="p-inputtext p-inputtext-sm w-full" [(ngModel)]="editingSessionTitle"
                         (keydown.enter)="commitRenameSession(session)" />
              </ng-template>
              <p *ngIf="editingSessionId !== session.id" class="m-0 text-xs text-surface-500 dark:text-surface-400 cursor-pointer">{{formatTimestamp(session.timestamp)}}</p>
            </div>

            <div class="ml-auto items-center gap-1 absolute right-1.5 top-1/2 -translate-y-1/2 bg-inherit rounded-md"
                 [ngClass]="{'flex': editingSessionId === session.id, 'hidden group-hover:flex': editingSessionId !== session.id}">
                <ng-container *ngIf="editingSessionId !== session.id; else editSessionButtons">
                    <button class="icon-btn" type="button" (click)="openMoveMenu($event, session)" pTooltip="Chuyển folder" tooltipPosition="top"><i class="pi pi-folder-open"></i></button>
                    <button class="icon-btn" type="button" (click)="startRenameSession(session, $event)" pTooltip="Đổi tên" tooltipPosition="top"><i class="pi pi-pencil"></i></button>
                    <button class="icon-btn" type="button" (click)="confirmDelete(session.id, $event)" pTooltip="Xoá chat" tooltipPosition="top"><i class="pi pi-trash"></i></button>
                </ng-container>
                <ng-template #editSessionButtons>
                    <button class="icon-btn" type="button" (click)="commitRenameSession(session)" pTooltip="Lưu"><i class="pi pi-check text-green-500"></i></button>
                    <button class="icon-btn" type="button" (click)="cancelRenameSession()" pTooltip="Huỷ"><i class="pi pi-times"></i></button>
                </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col bg-gradient-to-br from-surface-50 via-surface-0 to-surface-100 dark:from-surface-900 dark:via-surface-800 dark:to-surface-950">
      <div #scrollContainer class="flex-1 overflow-y-auto relative" style="min-height: 0;">
        <div class="max-w-6xl w-full mx-auto px-4 pt-6 pb-2">

          <ng-container *ngIf="chatMessages.length === 0">
            <div class="welcome-abs">
              <div class="rw-root">
                <div class="rw-center">
                  <div class="rw-robot animate-float">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="rw-shadow">
                      <line x1="60" y1="20" x2="60" y2="8" stroke="#6366F1" stroke-width="3" stroke-linecap="round"/>
                      <circle cx="60" cy="6" r="4" fill="#6366F1">
                        <animate attributeName="fill" values="#6366F1;#818CF8;#6366F1" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <rect x="30" y="22" width="60" height="50" rx="12" fill="white" stroke="#6366F1" stroke-width="3"/>
                      <circle cx="45" cy="42" r="5" fill="#6366F1"></circle>
                      <circle cx="75" cy="42" r="5" fill="#6366F1"></circle>
                      <path d="M 45 56 Q 60 64 75 56" stroke="#6366F1" stroke-width="3" stroke-linecap="round" fill="none"/>
                      <rect x="35" y="75" width="50" height="35" rx="8" fill="white" stroke="#6366F1" stroke-width="3"/>
                      <image href="assets/logo-evn.png" x="45" y="83" width="30" height="20" preserveAspectRatio="xMidYMid meet"></image>
                      <rect x="20" y="75" width="12" height="28" rx="6" fill="#6366F1"/>
                      <rect x="88" y="75" width="12" height="28" rx="6" fill="#6366F1"/>
                    </svg>
                  </div>
                  <div class="rw-cloud animate-fadeIn">
                    <svg width="380" height="180" viewBox="0 0 380 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <filter id="cloudShadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feOffset dx="0" dy="8" in="SourceAlpha" result="off"/>
                          <feGaussianBlur in="off" stdDeviation="10" result="blur"/>
                          <feColorMatrix in="blur" type="matrix"
                            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.18 0" result="shadow"/>
                          <feMerge>
                            <feMergeNode in="shadow"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <path d="M 75 55 C 75 42, 87 32, 103 32 C 108 22, 123 17, 135 23 C 147 17, 163 21, 170 32 C 188 32, 203 45, 203 62 C 215 64, 223 75, 223 88 C 223 105, 211 117, 195 117 L 95 117 C 77 117, 63 105, 63 88 C 63 75, 70 64, 75 55 Z"
                            fill="#FFFFFF" stroke="#E6ECFF" stroke-width="2" filter="url(#cloudShadow)"/>
                      <circle cx="8"  cy="88" r="3"  fill="#FFFFFF" stroke="#E6ECFF" stroke-width="2" filter="url(#cloudShadow)" class="dot dot-1"/>
                      <circle cx="25" cy="85" r="6"  fill="#FFFFFF" stroke="#E6ECFF" stroke-width="2" filter="url(#cloudShadow)" class="dot dot-2"/>
                      <circle cx="50" cy="82" r="10" fill="#FFFFFF" stroke="#E6ECFF" stroke-width="2" filter="url(#cloudShadow)" class="dot dot-3"/>
                    </svg>
                    <div class="rw-cloud-text">
                      <p class="rw-cloud-title">
                        Xin chào! 👋<br/>
                        Tôi có thể giúp gì<br/>
                        cho bạn hôm nay?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <div *ngIf="chatMessages.length > 0" class="py-2">
            <div *ngFor="let msg of chatMessages; let i = index; trackBy: trackByMsg" class="w-full">
              <div *ngIf="msg.sender === 'user'" class="flex justify-end mb-6">
                <div class="bg-surface-100 dark:bg-surface-700 p-4 rounded-2xl max-w-xl shadow-sm">
                  <p class="m-0 text-surface-800 dark:text-surface-100 text-base leading-relaxed">{{msg.text}}</p>
                </div>
              </div>

              <div *ngIf="msg.sender === 'ai'" class="mb-8">
                <div class="flex items-center gap-2 mb-3">
                  <img [src]="msg.modelIcon" [alt]="msg.modelName" class="w-6 h-6 rounded-full" *ngIf="msg.modelIcon"/>
                  <span class="font-semibold text-surface-700 dark:text-surface-200 text-base">{{msg.modelName}}</span>

                  <p-button *ngIf="msg.thinking" size="small" [text]="true" [rounded]="true" severity="primary"
                            styleClass="ml-2"
                            [icon]="msg.__showThinking ? 'pi pi-eye-slash' : 'pi pi-eye'"
                            [label]="msg.__showThinking ? 'Ẩn suy luận' : 'Hiển thị suy luận'"
                            (onClick)="toggleThinkingForMessage(i)"></p-button>
                </div>

                <div *ngIf="msg.thinking && msg.__showThinking"
                     class="mb-3 rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-0/60 dark:bg-surface-800/50 p-3">
                  <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1">AI đang phân tích</div>
                  <pre class="m-0 whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-200">{{msg.thinking}}</pre>
                </div>

                <div *ngIf="msg.thinking && !msg.__showThinking" class="text-xs text-surface-500 dark:text-surface-400 mb-2">
                  Đã ẩn phần suy luận. <a class="text-primary cursor-pointer" (click)="toggleThinkingForMessage(i)">Hiển thị</a>
                </div>

                <markdown [data]="msg.text" class="prose dark:prose-invert max-w-none"></markdown>

                <div class="mt-4 flex items-center gap-2 text-surface-500 dark:text-surface-400">
                  <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary"
                            pTooltip="Tạo lại" tooltipPosition="top" (onClick)="regenerate(msg)"></p-button>
                  <p-button icon="pi pi-clone" [text]="true" [rounded]="true" severity="secondary"
                            pTooltip="So sánh" tooltipPosition="top"></p-button>
                </div>
              </div>
            </div>

            <div *ngIf="isStreaming" class="mb-8">
              <div class="flex items-center gap-2 mb-2 text-surface-500 dark:text-surface-400">
                <i class="pi pi-spinner pi-spin"></i>
                <span>{{ liveStatus || 'Đang tạo câu trả lời…' }}</span>

                <p-button *ngIf="!!liveThinking" size="small" [text]="true" [rounded]="true" severity="primary"
                          styleClass="ml-2"
                          [icon]="showThinkingLive ? 'pi pi-eye-slash' : 'pi pi-eye'"
                          [label]="showThinkingLive ? 'Ẩn suy luận' : 'Hiển thị suy luận'"
                          (onClick)="toggleThinkingLive()"></p-button>
              </div>

              <div *ngIf="liveThinking && showThinkingLive"
                   class="mb-3 rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-0/60 dark:bg-surface-800/50 p-3">
                <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1">AI đang phân tích</div>
                <pre class="m-0 whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-200">{{liveThinking}}</pre>
              </div>

              <div *ngIf="liveThinking && !showThinkingLive" class="text-xs text-surface-500 dark:text-surface-400 mb-2">
                Đang ẩn phần suy luận. <a class="text-primary cursor-pointer" (click)="toggleThinkingLive()">Hiển thị</a>
              </div>

              <div class="rounded-xl bg-surface-100 dark:bg-surface-700 p-3">
                <markdown [data]="liveDelta" class="prose dark:prose-invert max-w-none text-sm"></markdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="shrink-0 w-full mt-auto">
        <div class="max-w-4xl mx-auto px-4 pb-2">
          <div class="bg-white dark:bg-surface-800 rounded-3xl shadow-xl p-3 sm:p-4 border border-surface-100 dark:border-surface-700 w-full">
            <div class="flex items-center gap-1.5 mb-2 flex-wrap">
              <p-button icon="pi pi-paperclip" [text]="true" [rounded]="true" severity="secondary"
                        pTooltip="Đính kèm file" tooltipPosition="top"
                        (onClick)="triggerFile()" styleClass="btn-toggle"></p-button>
              <input #fileInput type="file" multiple class="hidden" (change)="onFilesChosen($event)" />

              <p-button label="Tìm kiếm web" icon="pi pi-search"
                        severity="primary" [outlined]="!webSearch" [raised]="webSearch"
                        styleClass="btn-toggle" [ngClass]="{'is-active': webSearch}"
                        (onClick)="webSearch = !webSearch"></p-button>
              <p-button label="Suy luận" icon="pi pi-sparkles"
                        severity="primary" [outlined]="!extendedReasoning" [raised]="extendedReasoning"
                        styleClass="btn-toggle" [ngClass]="{'is-active': extendedReasoning}"
                        (onClick)="extendedReasoning = !extendedReasoning"></p-button>
              <p-button label="Nghiên cứu sâu" icon="pi pi-book"
                        severity="primary" [outlined]="!deepResearch" [raised]="deepResearch"
                        styleClass="btn-toggle" [ngClass]="{'is-active': deepResearch}"
                        (onClick)="deepResearch = !deepResearch"></p-button>
            </div>
            <div class="relative">
              <textarea
                [(ngModel)]="message"
                (keydown.enter)="sendMessage(); $event.preventDefault()"
                placeholder="Hỏi tôi bất cứ điều gì..."
                rows="2"
                class="p-inputtextarea p-inputtext w-full border-2 border-surface-200 dark:border-surface-600 rounded-2xl p-3 focus:border-primary-500 dark:bg-surface-700 dark:text-surface-0 resize-none transition-colors text-base"
                style="padding-bottom: 45px;"></textarea>
              <div class="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                <button type="button"
                  class="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 rounded-full flex items-center gap-2 font-medium transition-colors text-sm"
                  (click)="modelPopover.toggle($event)">
                  <i class="pi pi-bolt text-sm" [style]="{'color': 'var(--primary-color)'}"></i>
                  <span>{{selectedModel.name}}</span>
                  <i class="pi pi-chevron-down" style="font-size: 0.7rem"></i>
                </button>
                <p-button icon="pi pi-send" [rounded]="true" (onClick)="sendMessage()"
                          [disabled]="!message.trim() || isStreaming" styleClass="send-button"></p-button>
                <p-popover #modelPopover [style]="{width: '400px'}" [appendTo]="'body'">
                  <ng-template pTemplate="content">
                    <app-ai-model-selector [popoverRef]="modelPopover" (modelSelected)="onModelSelected($event)"></app-ai-model-selector>
                  </ng-template>
                </p-popover>
              </div>
            </div>
            <div *ngIf="selectedFiles.length>0" class="attachments-row mt-3 flex flex-wrap items-center gap-2">
              <div class="flex flex-wrap gap-2 items-center">
                <span *ngFor="let f of selectedFiles; let idx = index" class="file-chip inline-flex items-center gap-2">
                  <i class="pi pi-file"></i>
                  <span class="truncate max-w-[14rem]">{{f.name}}</span>
                  <button type="button" class="chip-close" (click)="removeFile(idx)"><i class="pi pi-times"></i></button>
                </span>
              </div>
              <a class="clear-link ml-auto" (click)="clearFiles()">Xoá tất cả</a>
            </div>
          </div>
          <p class="max-w-4xl mx-auto text-center text-sm text-surface-500 dark:text-surface-400 mt-2">
            Hãy xác minh thông tin quan trọng từ các nguồn khác trước khi đưa ra quyết định.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
  /* CSS styles remain identical */
  .chatbot-root { position: relative; }
  .floating-hamburger { position: absolute; left: 12px; top: 12px; z-index: 10; pointer-events: auto; }

  .btn-toggle.p-button { transition: transform .12s ease, box-shadow .12s ease, background-color .15s ease, color .15s ease, border-color .15s ease; border-radius: 9999px; }
  .btn-toggle.is-active { background: var(--primary-color) !important; color: var(--primary-color-text) !important; border-color: var(--primary-color) !important; }
  .btn-toggle:not(.is-active).p-button { background: transparent; color: var(--text-color); border-color: var(--surface-400); }
  .btn-toggle:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,.10); }
  .btn-toggle:active { transform: translateY(0); box-shadow: 0 4px 10px rgba(0,0,0,.10); }
  .send-button.p-button { transition: transform .12s ease, box-shadow .12s ease; }
  .send-button.p-button:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(0,0,0,.12); }
  .send-button.p-button:active { transform: translateY(0); }
  .p-button { transition: transform .12s ease, box-shadow .12s ease; }
  .p-button:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,.10); }
  .p-button:active { transform: translateY(0); box-shadow: 0 4px 10px rgba(0,0,0,.10); }

  .attachments-row { align-items: center; }
  .file-chip { background: var(--surface-100); color: var(--text-color); border: 1px solid var(--surface-300); border-radius: 9999px; padding: 6px 10px; font-size: 12px; line-height: 1; box-shadow: inset 0 -1px 0 rgba(0,0,0,0.03); }
  .file-chip i { font-size: 12px; opacity: .7; }
  .chip-close { border: none; background: transparent; padding: 0; margin: 0; cursor: pointer; display: inline-flex; align-items: center; }
  .chip-close i { font-size: 12px; opacity: .7; }
  .chip-close:hover i { opacity: 1; }
  .clear-link { color: var(--primary-color); font-size: 12px; cursor: pointer; text-decoration: none; }
  .clear-link:hover { text-decoration: underline; }

  .welcome-abs{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
  .rw-root{ background:transparent; padding:0; }
  .rw-center{ display:inline-flex; align-items:center; justify-content:center; gap:20px; }
  .rw-robot{ position:relative; z-index:10; }
  .rw-shadow{ filter:none !important; }
  .rw-cloud{ position:relative; }
  .rw-cloud-text{ position:absolute; top:40px; left:40px; width:208px; text-align:center; }
  .rw-cloud-title{ color:#4F46E5; font-weight:600; font-size:1rem; line-height:1.5; margin:0; }

  @keyframes dotPulse { 0%{opacity:.35; transform:scale(.85)} 50%{opacity:1; transform:scale(1)} 100%{opacity:.35; transform:scale(.85)} }
  .dot{ animation: dotPulse 1.4s ease-in-out infinite; transform-origin:center; }
  .dot-1{ animation-delay: 0s; }
  .dot-2{ animation-delay: .18s; }
  .dot-3{ animation-delay: .36s; }

  @keyframes float { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-8px); } }
  .animate-float{ animation: float 3s ease-in-out infinite; }
  @keyframes fadeIn { from{ opacity:0; transform: translateX(-16px);} to{opacity:1; transform: translateX(0);} }
  .animate-fadeIn{ animation: fadeIn .8s ease-out .4s both; }

  .icon-btn{ background:transparent; border:none; padding:6px; border-radius:8px; cursor:pointer; color:var(--text-color); }
  .icon-btn:hover{ background: var(--surface-100); }
  .dark .icon-btn:hover { background: var(--surface-700); }
  .drop-zone{ min-height: 24px; }
  .empty-hint{ font-size:.8rem; color: var(--text-color-secondary); padding: .25rem .25rem .5rem; }

  .cdk-drag-preview { box-shadow: 0 8px 24px rgba(0,0,0,.2); border-radius: .5rem; }
  .cdk-drag-placeholder { opacity: .3; }
  .drop-zone.cdk-drop-list-dragging { outline: 1px dashed var(--primary-color); outline-offset: 4px; border-radius: .5rem; }
  `],
  providers: [
    ConfirmationService,
    MessageService,
    provideMarkdown()
  ]
})
export class ChatbotComponent implements AfterViewChecked, OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('modelPopover') modelPopover!: Popover;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('moveMenu') moveMenu!: Menu;

  private messageService = inject(MessageService);
  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService);
  private modelsSubscription?: Subscription;
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  useMock = true;
  showSidebar = true;
  collapseBreakpoint = 1024;
  private forceHiddenByViewport = false;

  sseBackend: ChatBackend = { mode: 'sse', url: '/api/chat/stream' };
  httpBackend: ChatBackend = { mode: 'http', url: '/api/chat' };

  message = '';
  selectedModel: AIModel = { id: '', name: 'Đang tải...', icon: '', profile: { description: '', sortOrder: 0 }, costType: 'free' };

  // === Sessions & Folders ===
  chatMessages: Array<ChatMessage & { thinking?: string; __showThinking?: boolean }> = [];
  chatSessions: Array<ChatSession & { folderId?: string | null }> = [];
  currentSessionId = '';

  folders: ChatFolder[] = [];
  sessionsByFolder: Record<string, Array<ChatSession & { folderId?: string | null }>> = {};
  get rootSessions() {
    return this.chatSessions.filter(s => !s.folderId);
  }

  // UI state
  foldersVisible = true;
  chatsVisible = true;

  // inline rename state
  editingFolderId: string | null = null;
  editingFolderName = '';
  editingSessionId: string | null = null;
  editingSessionTitle = '';

  // Menu state
  moveMenuModel: MenuItem[] = [];
  private menuSession: (ChatSession & { folderId?: string | null }) | null = null;

  // === Models & toggles ===
  aiModels: AICategory[] = [];
  webSearch = false;
  extendedReasoning = false;
  deepResearch = false;
  selectedFiles: File[] = [];
  isStreaming = false;
  liveStatus = '';
  liveThinking = '';
  liveDelta = '';
  showThinkingLive = true;

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    const allowedModelNames = currentUser?.quotaProfile?.models ?? null;

    this.modelsSubscription = this.aiModelService.getModels(allowedModelNames).subscribe((data: AICategory[]) => {
      this.aiModels = data;
      this.setDefaultModel();
    });

    this.createNewChat();
    this.updateSidebarForViewport();
    this.rebuildFolderIndex();
  }

  ngOnDestroy(): void { this.modelsSubscription?.unsubscribe(); }

  @HostListener('window:resize') onWindowResize() { this.updateSidebarForViewport(); }

  private updateSidebarForViewport() {
    const narrow = window.innerWidth < this.collapseBreakpoint;
    if (narrow) { this.forceHiddenByViewport = true; this.showSidebar = false; }
    else if (this.forceHiddenByViewport) { this.showSidebar = true; this.forceHiddenByViewport = false; }
  }

  toggleSidebar() { this.showSidebar = !this.showSidebar; }

  setDefaultModel() {
    const defaultModelName = 'Trợ lý EVNGENCO1';
    let foundModel: AIModel | undefined;
    for (const group of this.aiModels) {
      const f = group.models.find(m => m.name === defaultModelName);
      if (f) { foundModel = f; break; }
    }
    if (!foundModel && this.aiModels.length && this.aiModels[0].models.length) {
      foundModel = this.aiModels[0].models[0];
    }
    this.selectedModel = foundModel ?? {
      id: '', name: 'Không có model', icon: 'pi pi-exclamation-triangle',
      profile: { description: 'Không tìm thấy model nào', sortOrder: 0 },
      costType: 'free'
    };
  }

  onModelSelected(model: AIModel): void { this.selectedModel = model; }

  ngAfterViewChecked() { this.scrollToBottom(); }
  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch {}
  }

  private sortSessionsDesc() {
    this.chatSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private rebuildFolderIndex() {
    this.sessionsByFolder = this.folders.reduce((acc, f) => {
      acc[f.id] = this.chatSessions.filter(s => s.folderId === f.id);
      return acc;
    }, {} as Record<string, Array<ChatSession & { folderId?: string | null }>>);
  }

  // ======== FOLDER ACTIONS ========
  createFolder() {
    const folder: ChatFolder = {
      id: this.generateId(),
      name: 'Folder mới',
      createdAt: new Date(),
      expanded: true
    };
    this.folders.unshift(folder);
    this.rebuildFolderIndex();
    this.editingFolderId = folder.id;
    this.editingFolderName = folder.name;
  }

  startRenameFolder(f: ChatFolder) {
    this.editingFolderId = f.id;
    this.editingFolderName = f.name;
  }

  commitRenameFolder(f: ChatFolder) {
    if (this.editingFolderId !== f.id) return;
    const name = (this.editingFolderName || '').trim();
    if (name) {
      const isDuplicate = this.folders.some(folder => folder.id !== f.id && folder.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) {
          this.messageService.add({
            key: 't1',
            severity: 'warn',
            summary: 'Tên đã tồn tại',
            detail: 'Vui lòng chọn một tên khác cho folder.'
          });
          return;
      }
      f.name = name;
    }
    this.cancelRenameFolder();
  }

  cancelRenameFolder() {
    this.editingFolderId = null;
    this.editingFolderName = '';
  }

  confirmDeleteFolder(f: ChatFolder) {
    const hasSessions = this.chatSessions.some(s => s.folderId === f.id);
    const msg = hasSessions
      ? 'Folder đang chứa một số chat. Xoá folder sẽ chuyển các chat về Root. Bạn có chắc chắn muốn xoá?'
      : 'Bạn có chắc chắn muốn xoá folder này?';
    this.confirmationService.confirm({
      message: msg,
      header: 'Xoá folder?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xoá',
      rejectLabel: 'Huỷ',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => this.deleteFolder(f)
    });
  }

  private deleteFolder(f: ChatFolder) {
    for (const s of this.chatSessions) {
      if (s.folderId === f.id) s.folderId = null;
    }
    const idx = this.folders.findIndex(x => x.id === f.id);
    if (idx > -1) this.folders.splice(idx, 1);
    this.rebuildFolderIndex();
  }

  // ======== SESSION ACTIONS ========
  createNewChat(): void {
    const newSession: ChatSession & { folderId?: string | null } = {
      id: this.generateId(),
      title: 'Chat mới',
      timestamp: new Date(),
      messages: [],
      folderId: null
    };
    this.chatSessions.unshift(newSession);
    this.sortSessionsDesc();
    this.currentSessionId = newSession.id;
    this.chatMessages = [];
    this.rebuildFolderIndex();
  }

  switchChatSession(sessionId: string): void {
    if(this.editingSessionId) return;
    const session = this.chatSessions.find(s => s.id === sessionId);
    if (session) { this.currentSessionId = sessionId; this.chatMessages = [...(session.messages as any)]; }
  }

  confirmDelete(sessionId: string, event?: Event) {
    event?.stopPropagation();
    this.confirmationService.confirm({
      message: 'Bạn có chắc chắn muốn xoá phiên chat này? Hành động này không thể hoàn tác.',
      header: 'Xoá phiên chat?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xoá',
      rejectLabel: 'Huỷ',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => this.deleteChatSession(sessionId),
    });
  }

  private deleteChatSession(sessionId: string) {
    const index = this.chatSessions.findIndex(s => s.id === sessionId);
    if (index > -1) {
      this.chatSessions.splice(index, 1);
      if (this.currentSessionId === sessionId) {
        if (this.chatSessions.length) { this.sortSessionsDesc(); this.switchChatSession(this.chatSessions[0].id); }
        else { this.createNewChat(); }
      }
      this.rebuildFolderIndex();
    }
  }

  startRenameSession(s: ChatSession, event?: MouseEvent) {
    event?.stopPropagation();
    this.editingSessionId = s.id;
    this.editingSessionTitle = s.title;
    this.cdr.detectChanges();
  }
  commitRenameSession(s: ChatSession & { folderId?: string | null }) {
    if (this.editingSessionId !== s.id) return;
    const title = (this.editingSessionTitle || '').trim();
    if (title) s.title = title;
    this.cancelRenameSession();
  }
  cancelRenameSession() {
    this.editingSessionId = null;
    this.editingSessionTitle = '';
  }

  openMoveMenu(event: MouseEvent, session: ChatSession & { folderId?: string | null }) {
    event.stopPropagation();
    this.menuSession = session;

    this.moveMenuModel = [
      {
        label: 'Chuyển ra Root',
        icon: 'pi pi-sign-out',
        disabled: !session.folderId,
        command: () => this.moveSessionToFolder(null)
      },
      { separator: true },
      ...this.folders
        .filter(f => f.id !== session.folderId)
        .map<MenuItem>(f => ({
          label: f.name,
          icon: 'pi pi-folder',
          command: () => this.moveSessionToFolder(f.id)
      }))
    ];

    if (this.moveMenuModel.length === 2 && this.folders.filter(f => f.id !== session.folderId).length === 0) {
        this.moveMenuModel.splice(1);
    }

    this.moveMenu.toggle(event);
  }

  private moveSessionToFolder(folderId: string | null) {
    if (!this.menuSession) return;
    this.menuSession.folderId = folderId;
    this.sortSessionsDesc();
    this.rebuildFolderIndex();
  }

  // ======== DRAG & DROP ========
  dropOnRoot(event: CdkDragDrop<Array<ChatSession & { folderId?: string | null }>>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.rootSessions, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      const moved = event.container.data[event.currentIndex];
      if (moved) moved.folderId = null;
    }
    this.sortSessionsDesc();
    this.rebuildFolderIndex();
  }

  dropOnFolder(folder: ChatFolder, event: CdkDragDrop<Array<ChatSession & { folderId?: string | null }>>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.sessionsByFolder[folder.id], event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      const moved = event.container.data[event.currentIndex];
      if (moved) moved.folderId = folder.id;
    }
    this.sortSessionsDesc();
    this.rebuildFolderIndex();
  }

  private allDropIds(): string[] {
    const folderIds = this.folders.map(f => `folder-${f.id}`);
    return ['root-list', ...folderIds];
  }
  connectedIdsForRoot(): string[] {
    return this.allDropIds().filter(id => id !== 'root-list');
  }
  connectedIdsForFolder(folderId: string): string[] {
    const me = `folder-${folderId}`;
    return this.allDropIds().filter(id => id !== me);
  }

  // ======== Utilities ========
  formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  generateId(): string { return Date.now().toString(36) + Math.random().toString(36).substring(2); }

  triggerFile() { this.fileInput?.nativeElement?.click(); }
  onFilesChosen(e: Event) { const input = e.target as HTMLInputElement; if (input.files && input.files.length > 0) this.selectedFiles = Array.from(input.files); }
  removeFile(index: number) { this.selectedFiles.splice(index, 1); }
  clearFiles() { this.selectedFiles = []; if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = ''; }

  async sendMessage(): Promise<void> {
    if (!this.message.trim() || this.isStreaming) return;
    const text = this.message.trim();
    const userMessage: ChatMessage = { sender: 'user', text };
    this.chatMessages.push(userMessage);
    const currentSession = this.chatSessions.find(s => s.id === this.currentSessionId);
    if (currentSession) {
      if (currentSession.messages.length === 0) { currentSession.title = text.substring(0, 30) + (text.length > 30 ? '...' : ''); }
      currentSession.messages = [...this.chatMessages];
      currentSession.timestamp = new Date();
      this.sortSessionsDesc();
    }
    this.message = '';
    this.isStreaming = true; this.liveStatus = 'Khởi tạo…'; this.liveThinking = ''; this.liveDelta = ''; this.showThinkingLive = true;
    if (this.useMock) { this.runMockStream(text); } else { this.runMockStream(text); }
  }

  toggleThinkingLive() { this.showThinkingLive = !this.showThinkingLive; }
  toggleThinkingForMessage(i: number) { const msg = this.chatMessages[i]; if (msg) { msg.__showThinking = !msg.__showThinking; } }

  private runMockStream(prompt: string) {
    const steps = [
      'Phân tích yêu cầu…',
      this.webSearch ? 'Đang tìm kiếm trên web…' : 'Đang truy xuất tri thức nội bộ…',
      this.deepResearch ? 'Đào sâu bằng nhiều nguồn…' : 'Tạo dàn ý trả lời…',
      this.extendedReasoning ? 'Suy luận đa bước…' : 'Tổng hợp kết quả…'
    ];
    const thinkingPieces = [
      `• Hiểu đề bài: "${prompt}"`,
      this.webSearch ? '• Tìm nguồn web phù hợp…' : '• Dùng tri thức nội bộ…',
      this.deepResearch ? '• So sánh chéo nguồn…' : '• Lập cấu trúc trả lời…',
      this.extendedReasoning ? '• Chuỗi suy luận…' : '• Tổng kết & kiểm tra…'
    ];
    const finalText = `Dưới đây là câu trả lời mô phỏng cho prompt của bạn:\n\n1) **Tóm tắt vấn đề** \n2) **Các điểm chính** \n3) **Đề xuất hành động**\n\n> Lưu ý: Đây là phản hồi *giả lập* từ **${this.selectedModel.name}**.`;
    let i = 0;
    const statusTimer = setInterval(() => {
      if (i < steps.length) { this.liveStatus = steps[i]; this.liveThinking += (this.liveThinking ? '\n' : '') + thinkingPieces[i]; i++; }
      else {
        clearInterval(statusTimer);
        let idx = 0;
        const deltaTimer = setInterval(() => {
          this.liveStatus = 'Đang tạo câu trả lời…';
          this.liveDelta = finalText.slice(0, idx);
          idx += Math.max(1, Math.floor(Math.random() * 8));
          if (idx >= finalText.length) {
            clearInterval(deltaTimer);
            const aiMessage: ChatMessage & { thinking?: string; __showThinking?: boolean } = {
              sender: 'ai',
              text: finalText,
              modelName: this.selectedModel.name,
              modelIcon: this.selectedModel.icon,
              thinking: this.liveThinking || undefined,
              __showThinking: false
            };
            this.chatMessages.push(aiMessage);
            const currentSession = this.chatSessions.find(s => s.id === this.currentSessionId);
            if (currentSession) {
              currentSession.messages = [...this.chatMessages];
              currentSession.timestamp = new Date();
              this.sortSessionsDesc();
            }
            this.isStreaming = false; this.liveStatus = ''; this.liveThinking = ''; this.liveDelta = ''; this.showThinkingLive = false;
          }
        }, 20);
      }
    }, 450);
  }

  regenerate(orig: ChatMessage & { thinking?: string }) {
    this.message = (orig as any).prompt || 'Hãy tạo lại câu trả lời theo hướng ngắn gọn và có bullet.';
    this.sendMessage();
  }

  // ======== trackBy helpers ========
  trackByFolder = (_: number, item: ChatFolder) => item.id;
  trackBySession = (_: number, item: ChatSession) => item.id;
  trackByMsg = (_: number, item: ChatMessage) => (item as any).__uuid || (item as any).id || JSON.stringify(item);
}