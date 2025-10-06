import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';

import { AICategory, AIModel } from '../../models/ai-models.model';
import { AiModelService } from '../../services/ai-model.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ai-model-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PopoverModule, TooltipModule],
  template: `
    <div class="model-panel">
        <div class="search-bar">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="modelQuery" (input)="filterModels()"
                   placeholder="Tìm kiếm mô hình..."/>
        </div>
        <div class="list" role="listbox">
            <ng-container *ngFor="let g of visibleGroups">
                <div class="group" *ngIf="g.models.length">
                    <div class="group-title">{{ g.category }}</div>
                    <div class="group-item" *ngFor="let m of g.models" (click)="selectModel(m)" [pTooltip]="m.profile.description" tooltipPosition="top">
                        <div class="left">
                            <img [src]="m.icon" [alt]="m.name" class="w-5 h-5"/>
                            <span class="name">{{ m.name }}</span>
                        </div>
                        <div class="right">
                            <div *ngIf="m.costType === 'free'" class="cost-display cost-free">
                                <i class="pi pi-check-circle"></i>
                                <span>Miễn phí</span>
                            </div>
                            <div *ngIf="m.costType === 'paid'" class="cost-display cost-paid">
                                <div class="cost-line">In: <strong>&#36;{{ m.costInput ?? 0 | number:'1.2-2' }}</strong></div>
                                <div class="cost-line">Out: <strong>&#36;{{ m.costOutput ?? 0 | number:'1.2-2' }}</strong></div>
                            </div>
                        </div>
                        </div>
                </div>
            </ng-container>
            <div *ngIf="!hasAnyVisibleModel" class="py-8 text-center text-surface-500 dark:text-surface-400">Không tìm thấy mô hình phù hợp</div>
        </div>
    </div>
  `,
  styleUrls: ['./ai-model-selector.component.scss'],
})
export class AiModelSelectorComponent implements OnInit, OnDestroy {
    @Output() modelSelected = new EventEmitter<AIModel>();
    @Input() popoverRef?: Popover;
  
    private aiModelService = inject(AiModelService);
    private authService = inject(AuthService);
  
    private modelsSubscription?: Subscription;
  
    modelQuery: string = '';
    aiModels: AICategory[] = []; 
    visibleGroups: AICategory[] = [];
  
    ngOnInit() {
      const currentUser = this.authService.currentUser();
      const allowedModelNames = currentUser?.quotaProfile?.models ?? null;

      this.modelsSubscription = this.aiModelService.getModels(allowedModelNames).subscribe((data: AICategory[]) => {
        this.aiModels = data;
        this.filterModels();
      });
    }
  
    ngOnDestroy() {
      this.modelsSubscription?.unsubscribe();
    }
  
    filterModels() {
      const q = (this.modelQuery || '').toLowerCase().trim();
      if (!q) {
        this.visibleGroups = JSON.parse(JSON.stringify(this.aiModels));
        return;
      }
      this.visibleGroups = this.aiModels
        .map(g => ({ ...g, models: g.models.filter((m: AIModel) => m.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)) }))
        .filter(g => g.models.length > 0);
    }
  
    selectModel(model: AIModel) {
      this.modelSelected.emit(model);
      this.popoverRef?.hide();
    }
  
    get hasAnyVisibleModel(): boolean { 
      return this.visibleGroups.some(g => g.models.length > 0); 
    }
}