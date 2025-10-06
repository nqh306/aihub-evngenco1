import {
  Component, ElementRef, ViewChild,
  AfterViewChecked, OnInit, OnDestroy, inject, HostListener, NgZone
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
// THÊM: Import MessageService
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Menu, MenuModule } from 'primeng/menu';
// THÊM: Import ToastModule
import { ToastModule } from 'primeng/toast';


// App services & models
import { Subscription } from 'rxjs';
import { AiModelService } from '../../core/services/ai-model.service';
import { AICategory, AIModel, ChatMessage, ChatSession } from '../../core/models/ai-models.model';
import { AiModelSelectorComponent } from '../../core/shared/components/ai-model-selector.component';
import { MarkdownModule, provideMarkdown } from 'ngx-markdown';
import { AuthService } from '../../core/services/auth.service';

// Drag & Drop
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

type PaneKey = 'left' | 'right';
type ChatMsgExt = ChatMessage & { thinking?: string; __showThinking?: boolean };

interface ChatPaneState {
  scrollEl?: ElementRef;
  selectedModel: AIModel | null;
  chatMessages: ChatMsgExt[];
  isStreaming: boolean;
  liveStatus: string;
  liveThinking: string;
  liveDelta: string;
  showThinkingLive: boolean;
}
interface ChatFolder {
  id: string;
  name: string;
  createdAt: Date;
  expanded?: boolean;
}
interface DualChatSession extends ChatSession {
  messagesLeft: ChatMsgExt[];
  messagesRight: ChatMsgExt[];
  leftModel?: AIModel | null;
  rightModel?: AIModel | null;
  folderId?: string | null;
}

const MOCK_CFG = { stepDelayMs: 150, typeDelayMs: 12, typeChunkMin: 8, typeChunkMax: 20 };

@Component({
  selector: 'app-dual-chat',
  standalone: true,
  imports: [
    CommonModule, FormsModule, HttpClientModule, MarkdownModule,
    InputTextModule, ButtonModule, DialogModule, TooltipModule,
    AvatarModule, AvatarGroupModule, PopoverModule, TagModule,
    ConfirmDialogModule, AiModelSelectorComponent,
    DragDropModule, MenuModule,
    ToastModule // THÊM: ToastModule vào imports
  ],
  template: `
<p-toast position="top-center"></p-toast>

<div class="dual-root" [style.height]="'calc(100vh - 12rem)'">
  <p-confirmDialog [style]="{ width: '28rem' }" [closable]="false" [breakpoints]="{ '640px': '95vw' }" acceptLabel="Xoá" rejectLabel="Huỷ" icon="pi pi-exclamation-triangle" header="Xoá?" [acceptButtonStyleClass]="'p-button-danger'" [rejectButtonStyleClass]="'p-button-text p-button-secondary'"></p-confirmDialog>

  <p-menu #moveMenu [popup]="true" [model]="moveMenuModel" [appendTo]="'body'"></p-menu>

  <div *ngIf="!showSidebar" class="floating-hamburger">
    <p-button icon="pi pi-bars" [rounded]="true" severity="secondary" [raised]="true" (onClick)="toggleSidebar()" pTooltip="Hiện lịch sử" tooltipPosition="right"></p-button>
  </div>

  <ng-template #robotWelcome>
    <div class="rw-root"><div class="rw-center"><div class="rw-robot animate-float"><svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="rw-shadow"><line x1="60" y1="20" x2="60" y2="8" stroke="#6366F1" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="6" r="4" fill="#6366F1"><animate attributeName="fill" values="#6366F1;#818CF8;#6366F1" dur="2s" repeatCount="indefinite"/></circle><rect x="30" y="22" width="60" height="50" rx="12" fill="white" stroke="#6366F1" stroke-width="3"/><circle cx="45" cy="42" r="5" fill="#6366F1"></circle><circle cx="75" cy="42" r="5" fill="#6366F1"></circle><path d="M 45 56 Q 60 64 75 56" stroke="#6366F1" stroke-width="3" stroke-linecap="round" fill="none"/><rect x="35" y="75" width="50" height="35" rx="8" fill="white" stroke="#6366F1" stroke-width="3"/><image href="assets/logo-evn.png" x="45" y="83" width="30" height="20" preserveAspectRatio="xMidYMid meet"></image><rect x="20" y="75" width="12" height="28" rx="6" fill="#6366F1"/><rect x="88" y="75" width="12" height="28" rx="6" fill="#6366F1"/></svg></div><div class="rw-cloud animate-fadeIn"><svg width="380" height="180" viewBox="0 0 380 180" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><filter id="cloudShadow" x="-50%" y="-50%" width="200%" height="200%"><feOffset dx="0" dy="8" in="SourceAlpha" result="off"/><feGaussianBlur in="off" stdDeviation="10" result="blur"/><feColorMatrix in="blur" type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.18 0" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M 75 55 C 75 42, 87 32, 103 32 C 108 22, 123 17, 135 23 C 147 17, 163 21, 170 32 C 188 32, 203 45, 203 62 C 215 64, 223 75, 223 88 C 223 105, 211 117, 195 117 L 95 117 C 77 117, 63 105, 63 88 C 63 75, 70 64, 75 55 Z" fill="#FFFFFF" stroke="#E6ECFF" stroke-width="2" filter="url(#cloudShadow)"/><circle cx="8"  cy="88" r="3"  fill="#FFFFFF" stroke="#E6ECFF" stroke-width="2" filter="url(#cloudShadow)" class="dot dot-1"/><circle cx="25" cy="85" r="6"  fill="#FFFFFF" stroke="#E6ECFF" stroke-width="2" filter="url(#cloudShadow)" class="dot dot-2"/><circle cx="50" cy="82" r="10" fill="#FFFFFF" stroke="#E6ECFF" stroke-width="2" filter="url(#cloudShadow)" class="dot dot-3"/></svg><div class="rw-cloud-text"><p class="rw-cloud-title">Xin chào! 👋<br/>Tôi có thể giúp gì<br/>cho bạn hôm nay?</p></div></div></div></div>
  </ng-template>

  <div class="layout-wrap">
    <div *ngIf="showSidebar" class="w-72 bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 flex flex-col shrink-0">
      <div class="p-3 border-b border-surface-200 dark:border-surface-700 flex items-center gap-2">
        <p-button icon="pi pi-bars" [text]="true" [rounded]="true" severity="secondary" size="small" pTooltip="Ẩn lịch sử" tooltipPosition="bottom" (onClick)="toggleSidebar()"></p-button>
        <div class="ml-auto flex items-center gap-2">
            <p-button label="Folder" icon="pi pi-folder-plus" severity="secondary" size="small" (onClick)="createFolder()"></p-button>
            <p-button label="Chat mới" icon="pi pi-plus" severity="primary" size="small" (onClick)="createNewChat()"></p-button>
        </div>
      </div>

      <div class="flex items-center justify-between px-3 pt-3 pb-1 text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 cursor-pointer hover:text-surface-700 dark:hover:text-surface-200" (click)="isFoldersCollapsed = !isFoldersCollapsed">
        <span>Folders</span>
        <i class="pi text-xs" [ngClass]="isFoldersCollapsed ? 'pi-chevron-right' : 'pi-chevron-down'"></i>
      </div>
      <div *ngIf="!isFoldersCollapsed" class="flex-0 px-2">
          <div *ngFor="let f of folders; trackBy: trackByFolder" class="mb-2 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
              <div class="group flex items-center gap-2 px-2 py-1.5 bg-surface-50 dark:bg-surface-700/40">
                  <button class="icon-btn" type="button" (click)="f.expanded = !f.expanded" [pTooltip]="f.expanded ? 'Thu gọn' : 'Mở rộng'"><i class="pi" [ngClass]="f.expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i></button>
                  <i class="pi pi-folder text-surface-500"></i>
                  <ng-container *ngIf="editingFolderId !== f.id; else editFolderTpl">
                      <div class="flex-1 min-w-0 flex items-center">
                        <span class="text-sm font-medium truncate" [pTooltip]="f.name" tooltipPosition="top">{{ f.name }}</span>
                        <span class="ml-2 text-xs text-surface-400">({{ sessionsByFolder[f.id]?.length || 0 }})</span>
                      </div>
                      <div class="hidden group-hover:flex items-center ml-auto">
                        <button class="icon-btn" type="button" (click)="startRenameFolder(f)" pTooltip="Đổi tên"><i class="pi pi-pencil"></i></button>
                        <button class="icon-btn" type="button" (click)="confirmDeleteFolder(f)" pTooltip="Xoá folder"><i class="pi pi-trash text-red-500"></i></button>
                      </div>
                  </ng-container>
                  <ng-template #editFolderTpl>
                    <div class="w-full flex items-center gap-1">
                      <input type="text" class="p-inputtext p-inputtext-sm w-full" [(ngModel)]="editingFolderName" (keydown.enter)="commitRenameFolder(f)" />
                      <button class="icon-btn" type="button" (click)="commitRenameFolder(f)" pTooltip="Lưu"><i class="pi pi-check text-green-500"></i></button>
                      <button class="icon-btn" type="button" (click)="cancelRenameFolder()" pTooltip="Hủy"><i class="pi pi-times"></i></button>
                    </div>
                  </ng-template>
              </div>

              <div *ngIf="f.expanded" class="p-2">
                  <div cdkDropList [id]="'folder-' + f.id" [cdkDropListData]="sessionsByFolder[f.id]" [cdkDropListConnectedTo]="connectedIdsForFolder(f.id)" (cdkDropListDropped)="dropOnFolder(f, $event)" class="drop-zone">
                      <div *ngIf="sessionsByFolder[f.id]?.length === 0" class="empty-hint">Kéo chat vào đây</div>
                      <div *ngFor="let session of sessionsByFolder[f.id]; trackBy: trackBySession" class="group px-2.5 py-1.5 mb-1 rounded-lg transition-all duration-150 flex items-center gap-2" [ngClass]="{ 'bg-primary-50': session.id === currentSessionId, 'hover:bg-surface-100': session.id !== currentSessionId }" cdkDrag [cdkDragData]="session">
                          <div class="flex-1 min-w-0" (click)="switchChatSession(session.id)">
                            <ng-container *ngIf="editingSessionId !== session.id; else editSessionTpl">
                              <p class="m-0 text-sm font-medium truncate cursor-pointer">{{session.title}}</p>
                              <p class="m-0 text-xs text-surface-500 cursor-pointer">{{formatTimestamp(session.timestamp)}}</p>
                            </ng-container>
                             <ng-container *ngTemplateOutlet="editSessionTpl; context: {$implicit: session}"></ng-container>
                          </div>
                          <div class="hidden group-hover:flex items-center ml-auto" *ngIf="editingSessionId !== session.id">
                              <button class="icon-btn" type="button" (click)="openMoveMenu($event, session)" pTooltip="Chuyển folder"><i class="pi pi-folder-open"></i></button>
                              <button class="icon-btn" type="button" (click)="startRenameSession(session, $event)" pTooltip="Đổi tên"><i class="pi pi-pencil"></i></button>
                              <button class="icon-btn" type="button" (click)="confirmDelete(session.id, $event)" pTooltip="Xóa"><i class="pi pi-trash"></i></button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div class="flex items-center justify-between px-3 pt-3 pb-1 text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 cursor-pointer hover:text-surface-700 dark:hover:text-surface-200" (click)="isChatsCollapsed = !isChatsCollapsed">
        <span>Chats</span>
        <i class="pi text-xs" [ngClass]="isChatsCollapsed ? 'pi-chevron-right' : 'pi-chevron-down'"></i>
      </div>
      <div *ngIf="!isChatsCollapsed" class="flex-1 overflow-y-auto p-2">
          <div cdkDropList id="root-list" [cdkDropListData]="rootSessions" [cdkDropListConnectedTo]="connectedIdsForRoot()" (cdkDropListDropped)="dropOnRoot($event)" class="drop-zone">
              <div *ngIf="rootSessions.length === 0" class="text-center py-6 px-4 text-sm text-surface-500 dark:text-surface-400">Không có chat ở Root.</div>
              <div *ngFor="let session of rootSessions; trackBy: trackBySession" class="group px-2.5 py-1.5 mb-1 rounded-lg transition-all duration-150 flex items-center gap-2" [ngClass]="{ 'bg-primary-50': session.id === currentSessionId, 'hover:bg-surface-100': session.id !== currentSessionId }" cdkDrag [cdkDragData]="session">
                  <div class="flex-1 min-w-0" (click)="switchChatSession(session.id)">
                      <ng-container *ngIf="editingSessionId !== session.id; else editSessionTpl">
                          <p class="m-0 text-sm font-medium truncate cursor-pointer">{{session.title}}</p>
                          <p class="m-0 text-xs text-surface-500 cursor-pointer">{{formatTimestamp(session.timestamp)}}</p>
                      </ng-container>
                      <ng-container *ngTemplateOutlet="editSessionTpl; context: {$implicit: session}"></ng-container>
                  </div>
                  <div class="hidden group-hover:flex items-center ml-auto" *ngIf="editingSessionId !== session.id">
                      <button class="icon-btn" type="button" (click)="openMoveMenu($event, session)" pTooltip="Chuyển folder"><i class="pi pi-folder-open"></i></button>
                      <button class="icon-btn" type="button" (click)="startRenameSession(session, $event)" pTooltip="Đổi tên"><i class="pi pi-pencil"></i></button>
                      <button class="icon-btn" type="button" (click)="confirmDelete(session.id, $event)" pTooltip="Xóa"><i class="pi pi-trash"></i></button>
                  </div>
              </div>
          </div>
      </div>
    </div>
    
    <ng-template #editSessionTpl let-session>
      <div *ngIf="editingSessionId === session.id" class="w-full flex items-center gap-1">
        <input type="text" class="p-inputtext p-inputtext-sm w-full" [(ngModel)]="editingSessionTitle" (keydown.enter)="commitRenameSession(session)" (click)="$event.stopPropagation()" />
        <button class="icon-btn" type="button" (click)="commitRenameSession(session); $event.stopPropagation()" pTooltip="Lưu"><i class="pi pi-check text-green-500"></i></button>
        <button class="icon-btn" type="button" (click)="cancelRenameSession(); $event.stopPropagation()" pTooltip="Hủy"><i class="pi pi-times"></i></button>
      </div>
    </ng-template>

    <div class="content-col">
      <div class="pane-grid">
        <div class="pane-card">
          <div class="pane-head justify-center"><button type="button" class="model-button" (click)="leftModelPopover?.toggle($event)"><img *ngIf="left.selectedModel?.icon" [src]="left.selectedModel?.icon!" class="w-5 h-5 rounded-full"/><span class="font-semibold"></span><span>{{ left.selectedModel?.name || 'Chọn model' }}</span><i class="pi pi-chevron-down text-xs"></i></button></div>
          <div #leftScroll class="pane-body">
            <ng-container *ngIf="left.chatMessages.length === 0 && !left.isStreaming"><div class="welcome-abs"><ng-container *ngTemplateOutlet="robotWelcome"></ng-container></div></ng-container>
            <div class="max-w-3xl w-full mx-auto px-3 pt-4 pb-2" *ngIf="left.chatMessages.length > 0 || left.isStreaming">
              <div *ngIf="left.chatMessages.length > 0" class="py-2"><ng-container *ngFor="let msg of left.chatMessages; let i = index"><div *ngIf="msg.sender === 'user'" class="flex justify-end mb-6"><div class="bubble-user"><p class="m-0">{{msg.text}}</p></div></div><div *ngIf="msg.sender === 'ai'" class="mb-8"><div class="ai-meta"><img *ngIf="msg.modelIcon" [src]="msg.modelIcon" class="ai-meta__icon"/><span class="ai-meta__name">{{ msg.modelName || left.selectedModel?.name }}</span></div><div class="flex items-center gap-2 mb-2 justify-end"><p-button *ngIf="msg.thinking" size="small" [text]="true" [rounded]="true" severity="primary" [icon]="msg.__showThinking ? 'pi pi-eye-slash' : 'pi pi-eye'" [label]="msg.__showThinking ? 'Ẩn suy luận' : 'Hiển thị suy luận'" (onClick)="toggleMessageThinking('left', i)"></p-button></div><div *ngIf="msg.thinking && msg.__showThinking" class="thinking-box"><div class="thinking-hint">AI đang phân tích</div><pre class="m-0 text-xs whitespace-pre-wrap">{{msg.thinking}}</pre></div><div *ngIf="msg.thinking && !msg.__showThinking" class="thinking-inline">Đã ẩn phần suy luận. <a class="text-primary cursor-pointer" (click)="toggleMessageThinking('left', i)">Hiển thị</a></div><markdown [data]="msg.text" class="prose max-w-none text-surface-800"></markdown><div class="answer-toolbar"><p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" pTooltip="Tạo lại" tooltipPosition="top" (onClick)="regenerate('left', msg)"></p-button><p-button icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" pTooltip="Sao chép nội dung" tooltipPosition="top" (onClick)="copyToClipboard(msg)"></p-button></div></div></ng-container></div>
              <div *ngIf="left.isStreaming" class="mb-8"><div class="live-row"><i class="pi pi-spinner pi-spin"></i><span class="text-sm text-surface-500">{{ left.liveStatus || 'Đang tạo câu trả lời…' }}</span><span class="ai-meta__name ml-2">· {{ left.selectedModel?.name }}</span><p-button *ngIf="!!left.liveThinking" size="small" [text]="true" [rounded]="true" severity="primary" [icon]="left.showThinkingLive ? 'pi pi-eye-slash' : 'pi pi-eye'" [label]="left.showThinkingLive ? 'Ẩn suy luận' : 'Hiển thị suy luận'" (onClick)="toggleThinkingLive('left')"></p-button></div><div *ngIf="left.liveThinking && left.showThinkingLive" class="thinking-box"><div class="thinking-hint">AI đang phân tích</div><pre class="m-0 text-xs whitespace-pre-wrap">{{left.liveThinking}}</pre></div><div *ngIf="left.liveThinking && !left.showThinkingLive" class="thinking-inline">Đang ẩn phần suy luận. <a class="text-primary cursor-pointer" (click)="toggleThinkingLive('left')">Hiển thị</a></div><div class="live-delta"><markdown [data]="left.liveDelta" class="prose max-w-none text-sm"></markdown></div></div>
            </div>
          </div>
          <p-popover #leftModelPopover [style]="{width: '420px'}" [appendTo]="'body'"><ng-template pTemplate="content"><app-ai-model-selector [popoverRef]="leftModelPopover" (modelSelected)="onModelSelected('left', $event)"></app-ai-model-selector></ng-template></p-popover>
        </div>
        <div class="pane-card">
          <div class="pane-head justify-center"><button type="button" class="model-button" (click)="rightModelPopover?.toggle($event)"><img *ngIf="right.selectedModel?.icon" [src]="right.selectedModel?.icon!" class="w-5 h-5 rounded-full"/><span class="font-semibold"></span><span>{{ right.selectedModel?.name || 'Chọn model' }}</span><i class="pi pi-chevron-down text-xs"></i></button></div>
          <div #rightScroll class="pane-body">
            <ng-container *ngIf="right.chatMessages.length === 0 && !right.isStreaming"><div class="welcome-abs"><ng-container *ngTemplateOutlet="robotWelcome"></ng-container></div></ng-container>
            <div class="max-w-3xl w-full mx-auto px-3 pt-4 pb-2" *ngIf="right.chatMessages.length > 0 || right.isStreaming">
              <div *ngIf="right.chatMessages.length > 0" class="py-2"><ng-container *ngFor="let msg of right.chatMessages; let i = index"><div *ngIf="msg.sender === 'user'" class="flex justify-end mb-6"><div class="bubble-user"><p class="m-0">{{msg.text}}</p></div></div><div *ngIf="msg.sender === 'ai'" class="mb-8"><div class="ai-meta"><img *ngIf="msg.modelIcon" [src]="msg.modelIcon" class="ai-meta__icon"/><span class="ai-meta__name">{{ msg.modelName || right.selectedModel?.name }}</span></div><div class="flex items-center gap-2 mb-2 justify-end"><p-button *ngIf="msg.thinking" size="small" [text]="true" [rounded]="true" severity="primary" [icon]="msg.__showThinking ? 'pi pi-eye-slash' : 'pi pi-eye'" [label]="msg.__showThinking ? 'Ẩn suy luận' : 'Hiển thị suy luận'" (onClick)="toggleMessageThinking('right', i)"></p-button></div><div *ngIf="msg.thinking && msg.__showThinking" class="thinking-box"><div class="thinking-hint">AI đang phân tích</div><pre class="m-0 text-xs whitespace-pre-wrap">{{msg.thinking}}</pre></div><div *ngIf="msg.thinking && !msg.__showThinking" class="thinking-inline">Đã ẩn phần suy luận. <a class="text-primary cursor-pointer" (click)="toggleMessageThinking('right', i)">Hiển thị</a></div><markdown [data]="msg.text" class="prose max-w-none text-surface-800"></markdown><div class="answer-toolbar"><p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" pTooltip="Tạo lại" tooltipPosition="top" (onClick)="regenerate('right', msg)"></p-button><p-button icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" pTooltip="Sao chép nội dung" tooltipPosition="top" (onClick)="copyToClipboard(msg)"></p-button></div></div></ng-container></div>
              <div *ngIf="right.isStreaming" class="mb-8"><div class="live-row"><i class="pi pi-spinner pi-spin"></i><span class="text-sm text-surface-500">{{ right.liveStatus || 'Đang tạo câu trả lời…' }}</span><p-button *ngIf="!!right.liveThinking" size="small" [text]="true" [rounded]="true" severity="primary" [icon]="right.showThinkingLive ? 'pi pi-eye-slash' : 'pi pi-eye'" [label]="right.showThinkingLive ? 'Ẩn suy luận' : 'Hiển thị suy luận'" (onClick)="toggleThinkingLive('right')"></p-button></div><div *ngIf="right.liveThinking && right.showThinkingLive" class="thinking-box"><div class="thinking-hint">AI đang phân tích</div><pre class="m-0 text-xs whitespace-pre-wrap">{{right.liveThinking}}</pre></div><div *ngIf="right.liveThinking && !right.showThinkingLive" class="thinking-inline">Đang ẩn phần suy luận. <a class="text-primary cursor-pointer" (click)="toggleThinkingLive('right')">Hiển thị</a></div><div class="live-delta"><markdown [data]="right.liveDelta" class="prose max-w-none text-sm"></markdown></div></div>
            </div>
          </div>
          <p-popover #rightModelPopover [style]="{width: '420px'}" [appendTo]="'body'"><ng-template pTemplate="content"><app-ai-model-selector [popoverRef]="rightModelPopover" (modelSelected)="onModelSelected('right', $event)"></app-ai-model-selector></ng-template></p-popover>
        </div>
      </div>
      <section class="composer-wrap">
        <div class="max-w-5xl mx-auto px-4">
          <div class="composer-card"><div class="flex items-center gap-1.5 mb-2 flex-wrap"><p-button icon="pi pi-paperclip" [text]="true" [rounded]="true" severity="secondary" pTooltip="Đính kèm file" tooltipPosition="top" (onClick)="triggerFile()" styleClass="btn-toggle"></p-button><input #fileInput type="file" multiple class="hidden" (change)="onFilesChosen($event)" /><p-button label="Tìm kiếm web" icon="pi pi-search" severity="primary" [outlined]="!webSearch" [raised]="webSearch" styleClass="btn-toggle" [ngClass]="{'is-active': webSearch}" (onClick)="webSearch = !webSearch"></p-button><p-button label="Suy luận" icon="pi pi-sparkles" severity="primary" [outlined]="!extendedReasoning" [raised]="extendedReasoning" styleClass="btn-toggle" [ngClass]="{'is-active': extendedReasoning}" (onClick)="extendedReasoning = !extendedReasoning"></p-button><p-button label="Nghiên cứu sâu" icon="pi pi-book" severity="primary" [outlined]="!deepResearch" [raised]="deepResearch" styleClass="btn-toggle" [ngClass]="{'is-active': deepResearch}" (onClick)="deepResearch = !deepResearch"></p-button></div>
            <div class="relative"><textarea [(ngModel)]="message" (keydown.enter)="sendBoth(); $event.preventDefault()" placeholder="Hỏi một lần — gửi song song đến cả 2 chatbox…" rows="2" class="composer-textarea" style="padding-bottom: 45px;"></textarea><div class="composer-actions"><p-button icon="pi pi-send" [rounded]="true" (onClick)="sendBoth()" [disabled]="!message.trim() || left.isStreaming || right.isStreaming" styleClass="send-button"></p-button></div></div>
            <div *ngIf="selectedFiles.length>0" class="attachments-row mt-3 flex flex-wrap items-center gap-2"><div class="flex flex-wrap gap-2 items-center"><span *ngFor="let f of selectedFiles; let idx = index" class="file-chip inline-flex items-center gap-2"><i class="pi pi-file"></i><span class="truncate max-w-[14rem]">{{f.name}}</span><button type="button" class="chip-close" (click)="removeFile(idx)"><i class="pi pi-times"></i></button></span></div><a class="clear-link ml-auto" (click)="clearFiles()">Xoá tất cả</a></div>
          </div>
          <p class="tip text-center mt-2">Hãy xác minh thông tin quan trọng từ các nguồn khác trước khi đưa ra quyết định.</p>
        </div>
      </section>
    </div>
  </div>
</div>
  `,
  styles: [`
  .ai-meta{ display:flex; align-items:center; gap:.4rem; margin-bottom:.25rem; color:#64748b; font-size:.8rem; }
  .ai-meta__icon{ width:16px; height:16px; border-radius:9999px; }
  .ai-meta__name{ font-weight:600; color:#475569; }
  .dual-root { position: relative; overflow: hidden; background:#eef2f6; }
  .layout-wrap { display:flex; height:100%; min-height:0; }
  .content-col { display:flex; flex-direction:column; min-width:0; flex:1 1 auto; }
  .pane-grid { flex:1 1 auto; min-height:0; overflow:auto; padding:1rem; display:grid; grid-template-columns:1fr; gap:1rem; }
  @media (min-width:1280px){ .pane-grid { grid-template-columns:1fr 1fr; } }
  .floating-hamburger { position:absolute; left:12px; top:12px; z-index:10; }
  .pane-card { background:#fff; border:1px solid #e6ebf2; border-radius:20px; box-shadow:0 10px 30px rgba(2,8,20,.06); display:flex; flex-direction:column; overflow:hidden; }
  .pane-head { display:flex; align-items:center; gap:.5rem; padding:.6rem .75rem; border-bottom:1px solid #eef2f6; background:#fff; }
  .model-button { display:inline-flex; align-items:center; gap:.5rem; padding:.45rem .75rem; border-radius:9999px; background:#f4f7fb; border:1px solid #e0e6ef; color:#2f3c48; font-weight:600; transition: box-shadow .12s, transform .12s, background-color .15s, border-color .15s; }
  .model-button:hover { transform: translateY(-1px); box-shadow:0 8px 20px rgba(0,0,0,.08); }
  .pane-body { position:relative; min-height:260px; background:#fff; overflow-y:auto; }
  .welcome-abs{ position:absolute; top:50%; left:50%; transform: translate(-50%, -50%); pointer-events:none; }
  .bubble-user { background:#f0f4fa; color:#263238; padding:1rem; border-radius:1rem; max-width:36rem; box-shadow:0 4px 10px rgba(0,0,0,.05); }
  .thinking-box { margin-bottom:.5rem; border-radius:.75rem; border:1px dashed #c9d4e5; background:#f9fbff; padding:.6rem; }
  .thinking-hint { font-size:.68rem; text-transform:uppercase; letter-spacing:.06em; color:#7a8a99; margin-bottom:.25rem; }
  .thinking-inline { font-size:.8rem; color:#7a8a99; margin-bottom:.5rem; }
  .answer-toolbar { margin-top:.5rem; display:flex; align-items:center; gap:.5rem; color:#7a8a99; }
  .live-row { display:flex; align-items:center; gap:.5rem; color:#7a8a99; margin-bottom:.5rem; }
  .live-delta { background:#f0f4fa; color:#263238; padding:.5rem .75rem; border-radius:.75rem; }
  .composer-wrap { flex:0 0 auto; padding:0 1rem 1rem; }
  .composer-card { background:#fff; border:1px solid #e6ebf2; border-radius:18px; box-shadow:0 14px 30px rgba(2,8,20,.08); padding:.75rem; }
  .composer-textarea { width:100%; border:2px solid #e1e7f0; border-radius:14px; padding:.75rem; outline:none; transition:border-color .15s; background:#fff; color:#263238; resize:vertical; }
  .composer-textarea:focus { border-color:#7c9dfb; }
  .composer-actions { position:absolute; right:.5rem; bottom:.5rem; display:flex; gap:.5rem; align-items:center; }
  .btn-toggle.p-button { transition: transform .12s ease, box-shadow .12s ease, background-color .15s ease, color .15s ease, border-color .15s ease; border-radius:9999px; }
  .btn-toggle.is-active { background:#6e8bff !important; color:#fff !important; border-color:#6e8bff !important; }
  .btn-toggle:not(.is-active).p-button { background:transparent; color:#263238; border-color:#cfd8e3; }
  .attachments-row { align-items:center; }
  .file-chip { background:#f4f7fb; color:#263238; border:1px solid #dde6f2; border-radius:9999px; padding:6px 10px; font-size:12px; line-height:1; box-shadow:inset 0 -1px 0 rgba(0,0,0,.03); }
  .chip-close { border:none; background:transparent; padding:0; margin:0; cursor:pointer; display:inline-flex; align-items:center; }
  .chip-close i { font-size:12px; opacity:.7; }
  .chip-close:hover i { opacity:1; }
  .clear-link { color:#6e8bff; font-size:12px; cursor:pointer; text-decoration:none; }
  .clear-link:hover { text-decoration:underline; }
  .tip { color:#6b7a90; font-size:.85rem; }
  .rw-root{ background:transparent; padding:0; min-height:0; }
  .rw-center{ display:inline-flex; align-items:center; justify-content:center; gap:20px; flex-wrap:nowrap; transform: scale(var(--rw-scale,1)); transform-origin:center; will-change: transform; }
  .rw-robot{ position:relative; z-index:10; margin-top:0; }
  .rw-shadow{ filter: none !important; }
  .rw-cloud{ position:relative; margin:0; }
  .rw-cloud-text{ position:absolute; top:40px; left:40px; width:208px; text-align:center; }
  .rw-cloud-title{ color:#4F46E5; font-weight:600; font-size:1rem; line-height:1.5; margin:0; }
  @keyframes dotPulse { 0% { opacity:.35; transform: scale(0.85); } 50% { opacity:1; transform: scale(1); } 100% { opacity:.35; transform: scale(0.85); } }
  .dot { animation: dotPulse 1.4s ease-in-out infinite; transform-origin:center; }
  .dot-1 { animation-delay: 0s; } .dot-2 { animation-delay: .18s; } .dot-3 { animation-delay: .36s; }
  @keyframes float { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-8px); } }
  .animate-float{ animation: float 3s ease-in-out infinite; }
  @keyframes fadeIn { from{ opacity:0; transform: translateX(-16px); } to{ opacity:1; transform: translateX(0); } }
  .animate-fadeIn{ animation: fadeIn .8s ease-out .4s both; }
  .icon-btn{ background:transparent; border:none; padding:6px; border-radius:8px; cursor:pointer; color: var(--text-color-secondary); }
  .icon-btn:hover{ background: var(--surface-100); color: var(--text-color); }
  .dark .icon-btn:hover { background: var(--surface-700); }
  .drop-zone{ min-height: 24px; border-radius: .5rem; }
  .empty-hint{ font-size:.8rem; color: var(--text-color-secondary); padding: .25rem .25rem .5rem; }
  .cdk-drag-preview { box-shadow: 0 8px 24px rgba(0,0,0,.2); border-radius: .5rem; background: #fff; }
  .cdk-drag-placeholder { opacity: .3; }
  .drop-zone.cdk-drop-list-dragging { outline: 2px dashed #6e8bff; outline-offset: 4px; }
  `],
  providers: [
    ConfirmationService,
    MessageService, // THÊM: MessageService vào providers
    provideMarkdown()
  ]
})
export class DualChatComponent implements AfterViewChecked, OnInit, OnDestroy {
  @ViewChild('leftScroll') set leftScrollRef(el: ElementRef) { this.left.scrollEl = el; }
  @ViewChild('rightScroll') set rightScrollRef(el: ElementRef) { this.right.scrollEl = el; }
  @ViewChild('leftModelPopover') leftModelPopover?: Popover;
  @ViewChild('rightModelPopover') rightModelPopover?: Popover;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('moveMenu') moveMenu!: Menu;

  // THÊM: inject MessageService
  private messageService = inject(MessageService);
  private aiModelService = inject(AiModelService);
  private authService = inject(AuthService);
  private modelsSubscription?: Subscription;
  private confirmationService = inject(ConfirmationService);
  private zone = inject(NgZone);

  showSidebar = true;
  collapseBreakpoint = 1024;
  private forceHiddenByViewport = false;

  @HostListener('window:resize') onWindowResize() { this.updateSidebarForViewport(); this.updateWelcomeScale(); }

  message = '';
  webSearch = false; extendedReasoning = false; deepResearch = false;
  selectedFiles: File[] = [];

  left: ChatPaneState = this.newPane();
  right: ChatPaneState = this.newPane();
  aiModels: AICategory[] = [];
  chatSessions: DualChatSession[] = [];
  currentSessionId = '';
  useMock = true;

  folders: ChatFolder[] = [];
  sessionsByFolder: Record<string, DualChatSession[]> = {};
  get rootSessions() {
    return this.chatSessions.filter(s => !s.folderId);
  }
  editingFolderId: string | null = null;
  editingFolderName = '';
  isFoldersCollapsed = false;
  isChatsCollapsed = false;
  
  editingSessionId: string | null = null;
  editingSessionTitle = '';
  moveMenuModel: MenuItem[] = [];
  private menuSession: DualChatSession | null = null;
  
  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    const allowedModelNames = currentUser?.quotaProfile?.models ?? null;

    this.modelsSubscription = this.aiModelService.getModels(allowedModelNames).subscribe((data: AICategory[]) => {
      this.aiModels = data;
      this.setDefaultModels();
    });
    this.createNewChat();
    this.updateSidebarForViewport();
    setTimeout(() => this.updateWelcomeScale());
    this.rebuildFolderIndex();
  }

  ngOnDestroy(): void { this.modelsSubscription?.unsubscribe(); }

  private updateSidebarForViewport() { const narrow = window.innerWidth < this.collapseBreakpoint; if (narrow) { this.forceHiddenByViewport = true; this.showSidebar = false; } else if (this.forceHiddenByViewport) { this.showSidebar = true; this.forceHiddenByViewport = false; } }
  toggleSidebar() { this.showSidebar = !this.showSidebar; }

  private newPane(): ChatPaneState { return { selectedModel: null, chatMessages: [], isStreaming: false, liveStatus: '', liveThinking: '', liveDelta: '', showThinkingLive: true }; }
  
  private setDefaultModels() {
    let first: AIModel | null = null;
    let second: AIModel | null = null;
    if (this.aiModels.length > 0) {
      if (this.aiModels[0].models.length > 0) first = this.aiModels[0].models[0];
      if (this.aiModels[0].models.length > 1) second = this.aiModels[0].models[1];
      else if (this.aiModels.length > 1 && this.aiModels[1].models.length > 0) second = this.aiModels[1].models[0];
    }
    this.left.selectedModel = first;
    this.right.selectedModel = second || first;
  }
  
  private sortSessionsDesc() { this.chatSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); }

  createNewChat(): void {
    const newSession: DualChatSession = { id: this.generateId(), title: 'Chat mới', timestamp: new Date(), messages: [], messagesLeft: [], messagesRight: [], leftModel: this.left.selectedModel, rightModel: this.right.selectedModel, folderId: null };
    this.chatSessions.unshift(newSession);
    this.sortSessionsDesc();
    this.currentSessionId = newSession.id;
    this.left.chatMessages = []; this.right.chatMessages = [];
    this.scrollToBottom('left'); this.scrollToBottom('right');
    this.rebuildFolderIndex();
  }

  switchChatSession(sessionId: string): void {
    if (this.editingSessionId || this.editingFolderId) return;
    const session = this.chatSessions.find(s => s.id === sessionId);
    if (session) {
      this.currentSessionId = sessionId;
      this.left.chatMessages = [...(session.messagesLeft || [])];
      this.right.chatMessages = [...(session.messagesRight || [])];
      this.left.selectedModel = session.leftModel ?? this.left.selectedModel;
      this.right.selectedModel = session.rightModel ?? this.right.selectedModel;
      this.scrollToBottom('left'); this.scrollToBottom('right');
      this.updateWelcomeScale();
    }
  }
  
  copyToClipboard(msg: ChatMessage) {
    const text = (msg as any)?.text || '';
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).catch(() => this._fallbackCopy(text)); } 
    else { this._fallbackCopy(text); }
  }
  private _fallbackCopy(value: string) { const ta = document.createElement('textarea'); ta.value = value; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); } catch {} document.body.removeChild(ta); }
  
  confirmDelete(sessionId: string, event: Event) {
    event.stopPropagation();
    this.confirmationService.confirm({ message: 'Bạn có chắc chắn muốn xoá phiên chat này?', header: 'Xoá phiên chat?', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Xoá', rejectLabel: 'Huỷ', acceptButtonStyleClass: 'p-button-danger', rejectButtonStyleClass: 'p-button-text p-button-secondary', accept: () => this.deleteChatSession(sessionId), });
  }
  
  private deleteChatSession(sessionId: string) {
    const index = this.chatSessions.findIndex(s => s.id === sessionId);
    if (index > -1) {
      this.chatSessions.splice(index, 1);
      if (this.currentSessionId === sessionId) {
        if (this.chatSessions.length) { this.sortSessionsDesc(); this.switchChatSession(this.chatSessions[0].id); }
        else { this.createNewChat(); }
      }
      this.updateWelcomeScale();
      this.rebuildFolderIndex();
    }
  }

  formatTimestamp(date: Date): string { const now = new Date(); const diff = now.getTime() - date.getTime(); const hours = Math.floor(diff / 3600000); if (hours < 1) return 'Vừa xong'; if (hours < 24) return `${hours} giờ trước`; const days = Math.floor(hours / 24); if (days < 7) return `${days} ngày trước`; return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  generateId(): string { return Date.now().toString(36) + Math.random().toString(36).substring(2); }
  onModelSelected(pane: PaneKey, model: AIModel) {
    const p = pane === 'left' ? this.left : this.right;
    p.selectedModel = model;
    const cur = this.chatSessions.find(s => s.id === this.currentSessionId);
    if (cur) { if (pane === 'left') cur.leftModel = model; else cur.rightModel = model; }
  }

  triggerFile() { this.fileInput?.nativeElement?.click(); }
  onFilesChosen(e: Event) { const input = e.target as HTMLInputElement; if (input.files && input.files.length > 0) this.selectedFiles = Array.from(input.files); }
  removeFile(index: number) { this.selectedFiles.splice(index, 1); }
  clearFiles() { this.selectedFiles = []; if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = ''; }

  sendBoth() {
    const text = this.message.trim();
    if (!text || this.left.isStreaming || this.right.isStreaming) return;

    const userMessage: ChatMessage = { sender: 'user', text };
    this.left.chatMessages.push(userMessage); this.right.chatMessages.push(userMessage);
    this.scrollToBottom('left'); this.scrollToBottom('right');

    const currentSession = this.chatSessions.find(s => s.id === this.currentSessionId);
    if (currentSession) {
      if (currentSession.messagesLeft.length === 0 && currentSession.messagesRight.length === 0) { currentSession.title = text.substring(0, 30) + (text.length > 30 ? '...' : ''); }
      currentSession.messagesLeft = [...this.left.chatMessages];
      currentSession.messagesRight = [...this.right.chatMessages];
      currentSession.timestamp = new Date();
      this.sortSessionsDesc();
    }
    this.message = '';
    this.runStream('left', text); this.runStream('right', text);
  }

  toggleThinkingLive(pane: PaneKey) { const p = pane === 'left' ? this.left : this.right; p.showThinkingLive = !p.showThinkingLive; }
  toggleMessageThinking(pane: PaneKey, i: number) { const p = pane === 'left' ? this.left : this.right; const msg = p.chatMessages[i]; if (msg) msg.__showThinking = !msg.__showThinking; }
  regenerate(_pane: PaneKey, orig: ChatMessage & { thinking?: string }) { this.message = (orig as any).prompt || 'Hãy tạo lại câu trả lời theo hướng ngắn gọn và có bullet.'; this.sendBoth(); }
  ngAfterViewChecked() { if (this.left.isStreaming) this.scrollToBottom('left'); if (this.right.isStreaming) this.scrollToBottom('right'); this.updateWelcomeScale(); }
  private scrollToBottom(pane: PaneKey) { const p = pane === 'left' ? this.left : this.right; const el = p.scrollEl?.nativeElement; if (el) { try { el.scrollTop = el.scrollHeight; } catch {} } }
  
  private updateWelcomeScaleForPane(pane: PaneKey) { const p=pane==='left'?this.left:this.right; const host=p.scrollEl?.nativeElement as HTMLElement|undefined; if(!host) return; const isWelcome=p.chatMessages.length===0 && !p.isStreaming; if(!isWelcome)return; const rwRoot=host.querySelector('.rw-root') as HTMLElement|null; if(!rwRoot)return; const containerWidth=Math.max(0,host.clientWidth-32); const BASE_WIDTH=560; let scale=containerWidth/BASE_WIDTH; scale=Math.max(0.70,Math.min(1,scale)); rwRoot.style.setProperty('--rw-scale',String(scale)); }
  private updateWelcomeScale() { this.updateWelcomeScaleForPane('left'); this.updateWelcomeScaleForPane('right'); }

  private rebuildFolderIndex() {
    this.sessionsByFolder = this.folders.reduce((acc, f) => {
      acc[f.id] = this.chatSessions.filter(s => s.folderId === f.id);
      return acc;
    }, {} as Record<string, DualChatSession[]>);
  }

  createFolder() {
    const folder: ChatFolder = { id: this.generateId(), name: 'Folder mới', createdAt: new Date(), expanded: true };
    this.folders.unshift(folder);
    this.rebuildFolderIndex();
    this.editingFolderId = folder.id;
    this.editingFolderName = folder.name;
  }
  startRenameFolder(f: ChatFolder) { this.editingFolderId = f.id; this.editingFolderName = f.name; }
  
  // SỬA: Thay thế alert bằng messageService
  commitRenameFolder(f: ChatFolder) {
    if (this.editingFolderId !== f.id) return;
    const newName = (this.editingFolderName || '').trim();
    if (!newName) {
      this.cancelRenameFolder();
      return;
    }
    const isDuplicate = this.folders.some(
      folder => folder.id !== f.id && folder.name.toLowerCase() === newName.toLowerCase()
    );

    if (isDuplicate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Tên đã tồn tại',
        detail: `Tên folder "${newName}" đã được sử dụng. Vui lòng chọn tên khác.`
      });
      return; 
    }
    f.name = newName;
    this.cancelRenameFolder();
  }
  
  cancelRenameFolder() { this.editingFolderId = null; this.editingFolderName = ''; }
  confirmDeleteFolder(f: ChatFolder) { const hasSessions = this.chatSessions.some(s => s.folderId === f.id); const msg = hasSessions ? 'Folder đang chứa một số chat. Xoá folder sẽ chuyển các chat về Root. Bạn có chắc chắn muốn xoá?' : 'Bạn có chắc chắn muốn xoá folder này?'; this.confirmationService.confirm({ message: msg, header: 'Xoá folder?', accept: () => this.deleteFolder(f) }); }
  private deleteFolder(f: ChatFolder) { for (const s of this.chatSessions) { if (s.folderId === f.id) s.folderId = null; } const idx = this.folders.findIndex(x => x.id === f.id); if (idx > -1) this.folders.splice(idx, 1); this.rebuildFolderIndex(); }

  startRenameSession(session: DualChatSession, event: MouseEvent) {
    event.stopPropagation();
    this.editingSessionId = session.id;
    this.editingSessionTitle = session.title;
  }
  commitRenameSession(session: DualChatSession) {
    if (this.editingSessionId !== session.id) return;
    const newTitle = (this.editingSessionTitle || '').trim();
    if (newTitle) {
        session.title = newTitle;
    }
    this.cancelRenameSession();
  }
  cancelRenameSession() {
    this.editingSessionId = null;
    this.editingSessionTitle = '';
  }

  openMoveMenu(event: MouseEvent, session: DualChatSession) {
    event.stopPropagation();
    this.menuSession = session;
    this.moveMenuModel = [
      { label: 'Chuyển ra Root', icon: 'pi pi-sign-out', disabled: !session.folderId, command: () => this.moveSessionToFolder(null) },
      { separator: this.folders.filter(f => f.id !== session.folderId).length > 0 },
      ...this.folders
        .filter(f => f.id !== session.folderId)
        .map<MenuItem>(f => ({ label: f.name, icon: 'pi pi-folder', command: () => this.moveSessionToFolder(f.id) }))
    ];
    this.moveMenu.toggle(event);
  }
  private moveSessionToFolder(folderId: string | null) {
    if (!this.menuSession) return;
    this.menuSession.folderId = folderId;
    this.sortSessionsDesc();
    this.rebuildFolderIndex();
  }

  dropOnRoot(event: CdkDragDrop<DualChatSession[]>) { if (event.previousContainer === event.container) { moveItemInArray(this.rootSessions, event.previousIndex, event.currentIndex); } else { transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex); event.container.data[event.currentIndex].folderId = null; } this.sortSessionsDesc(); this.rebuildFolderIndex(); }
  dropOnFolder(folder: ChatFolder, event: CdkDragDrop<DualChatSession[]>) { if (event.previousContainer === event.container) { moveItemInArray(this.sessionsByFolder[folder.id], event.previousIndex, event.currentIndex); } else { transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex); event.container.data[event.currentIndex].folderId = folder.id; } this.sortSessionsDesc(); this.rebuildFolderIndex(); }
  
  private allDropIds(): string[] { return ['root-list', ...this.folders.map(f => `folder-${f.id}`)]; }
  connectedIdsForRoot(): string[] { return this.allDropIds().filter(id => id !== 'root-list'); }
  connectedIdsForFolder(folderId: string): string[] { return this.allDropIds().filter(id => id !== `folder-${folderId}`); }
  
  trackByFolder = (_: number, item: ChatFolder) => item.id;
  trackBySession = (_: number, item: DualChatSession) => item.id;
  
  private runStream(pane: PaneKey, prompt: string) {
    const p = pane === 'left' ? this.left : this.right;
    p.isStreaming = true; p.liveStatus = 'Khởi tạo…'; p.liveThinking = ''; p.liveDelta = ''; p.showThinkingLive = true;
    const steps = [ 'Phân tích yêu cầu…', this.webSearch ? 'Đang tìm kiếm trên web…' : 'Đang truy xuất tri thức nội bộ…', this.deepResearch ? 'Đào sâu bằng nhiều nguồn…' : 'Tạo dàn ý trả lời…', this.extendedReasoning ? 'Suy luận đa bước…' : 'Tổng hợp kết quả…' ];
    const thinkingPieces = [ `• Hiểu đề bài: "${prompt}"`, this.webSearch ? '• Tìm nguồn web phù hợp…' : '• Dùng tri thức nội bộ EVNGENCO1…', this.deepResearch ? '• So sánh chéo nguồn, rút insight…' : '• Lập cấu trúc trả lời gọn…', this.extendedReasoning ? '• Chuỗi suy luận: A → B → C → kết luận…' : '• Tổng kết & kiểm tra nhanh…' ];
    const finalMarkdown = `Dưới đây là câu trả lời mô phỏng cho prompt của bạn:\n\n1) **Tóm tắt vấn đề** \n2) **Các điểm chính liên quan** \n3) **Đề xuất bước hành động**\n\n> Lưu ý: Đây là phản hồi *giả lập* để bạn xem giao diện. Khi kết nối backend, phần này sẽ là câu trả lời thật từ **mô hình AI bạn đã chọn**.`;
    let i = 0;
    const stepTimer = window.setInterval(() => {
      this.zone.run(() => {
        if (i < steps.length) { p.liveStatus = steps[i]; p.liveThinking += (p.liveThinking ? '\n' : '') + thinkingPieces[i]; this.scrollToBottom(pane); i++; } 
        else {
          window.clearInterval(stepTimer);
          let idx = 0;
          const typeTimer = window.setInterval(() => {
            this.zone.run(() => {
              p.liveStatus = 'Đang tạo câu trả lời…';
              const chunk = Math.floor(Math.random() * (MOCK_CFG.typeChunkMax - MOCK_CFG.typeChunkMin + 1)) + MOCK_CFG.typeChunkMin;
              idx = Math.min(idx + chunk, finalMarkdown.length);
              p.liveDelta = finalMarkdown.slice(0, idx);
              this.scrollToBottom(pane);
              if (idx >= finalMarkdown.length) {
                window.clearInterval(typeTimer);
                const aiMessage: ChatMsgExt = { sender: 'ai', text: finalMarkdown, modelName: p.selectedModel?.name || '', modelIcon: p.selectedModel?.icon, thinking: p.liveThinking || undefined, __showThinking: false };
                p.chatMessages.push(aiMessage);
                const cur = this.chatSessions.find(s => s.id === this.currentSessionId);
                if (cur) { cur.messagesLeft = [...this.left.chatMessages]; cur.messagesRight = [...this.right.chatMessages]; cur.timestamp = new Date(); this.sortSessionsDesc(); }
                p.isStreaming = false; p.liveStatus = ''; p.liveThinking = ''; p.liveDelta = ''; p.showThinkingLive = false;
                this.scrollToBottom(pane);
              }
            });
          }, MOCK_CFG.typeDelayMs);
        }
      });
    }, MOCK_CFG.stepDelayMs);
  }
}