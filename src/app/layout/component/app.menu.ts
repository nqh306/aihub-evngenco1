import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: '',
                items: [
                    { 
                        label: 'Trang chủ', 
                        icon: 'pi pi-fw pi-home', 
                        routerLink: ['/uikit/aihub-landing'] 
                    },
                    { 
                        label: 'Dashboard', 
                        icon: 'pi pi-fw pi-chart-bar', 
                        routerLink: ['/uikit/app.dashboard'] 
                    }
                ]
            },
            {
                label: 'Chức năng AI',
                items: [
                    {
                        label: 'Chat với AI',
                        icon: 'pi pi-fw pi-comment',
                        routerLink: ['/uikit/chatbot-ai']
                    },
                    { 
                        label: 'Dual Chat AI', 
                        icon: 'pi pi-fw pi-clone', 
                        routerLink: ['/uikit/ai-dual-chat'] 
                    },
                    { 
                        label: 'Bộ công cụ AI', 
                        icon: 'pi pi-fw pi-search-plus', 
                        routerLink: ['/uikit/ai-tool-hub'] 
                    },
                    {
                        label: 'Thư viện AI Models',
                        icon: 'pi pi-fw pi-database',
                        routerLink: ['/uikit/ai-marketplace']
                    }
                ]
            },
            {
                label: 'Quản trị',
                items: [
                    {
                        label: 'Quản lý API',
                        icon: 'pi pi-fw pi-cloud',
                        routerLink: ['/uikit/api-management'],
                    },
                    {
                        label: 'Người dùng',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/uikit/user-management'],
                    },
                    {
                        label: 'Cấu hình hạn mức',
                        icon: 'pi pi-fw pi-sliders-v',
                        routerLink: ['/uikit/quota-settings']
                    }
                ]
            },
            {
                label: 'Hỗ trợ & Phản hồi',
                items: [
                    {
                        label: 'Đánh giá & Góp ý',
                        icon: 'pi pi-fw pi-star',
                        routerLink: ['/uikit/feedback']
                    },
                    {
                        label: 'Đề xuất ý tưởng ĐMST',
                        icon: 'pi pi-fw pi-lightbulb',
                        routerLink: ['/uikit/innovation-ideas']
                    }
                ]
            }
        ];
    }
}