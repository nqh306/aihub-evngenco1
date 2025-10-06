// src/app/core/services/theme.service.ts
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    // Subject để phát ra sự kiện khi theme thay đổi
    private themeChange$ = new Subject<string>();

    constructor(@Inject(DOCUMENT) private document: Document) {}

    /**
     * Hàm này dùng để chuyển đổi theme.
     * Đây là nơi logic thay đổi theme của bạn sẽ nằm.
     * @param themeName Tên của theme mới (ví dụ 'lara-light-blue', 'arya-purple'...)
     */
    switchTheme(themeName: string) {
        const themeLink = this.document.getElementById('app-theme') as HTMLLinkElement;
        if (themeLink) {
            // Logic thay đổi file CSS của theme
            themeLink.href = `${themeName}.css`; 
            
            // **Quan trọng:** Thông báo cho toàn bộ ứng dụng rằng theme đã thay đổi
            this.themeChange$.next(themeName);
        }
    }

    /**
     * Các component khác sẽ subscribe vào đây để nhận biết sự kiện thay đổi theme.
     */
    onThemeChange(): Observable<string> {
        return this.themeChange$.asObservable();
    }
}