import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, throwError, delay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User, UserService } from './user.service';
import { QuotaProfile, QuotaProfileService } from './quota-profile.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly quotaProfileService = inject(QuotaProfileService);
  private readonly apiBase = environment.apiUrl + '/auth';
  private readonly useMock = environment.USE_MOCK ?? true;

  public currentUser = signal<User | null>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const userJson = localStorage.getItem('currentUser');

      if (token && userJson) {
        try {
          const user: User = JSON.parse(userJson);
          this.currentUser.set(user);
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
          this.logout();
        }
      }
    }
  }

  login(credentials: {username: string, password: string}): Observable<{token: string, user: User}> {
    if (!this.useMock) {
      return this.http.post<{token: string, user: User}>(`${this.apiBase}/login`, credentials).pipe(
        tap(response => {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUser.set(response.user);
        })
      );
    }

    // --- MOCK LOGIC ---
    const mockUsers: User[] = this.userService.getMockUsers();
    const userToLogin = mockUsers.find(u => u.username === credentials.username);

    if (userToLogin) {
      const mockProfiles = this.quotaProfileService.getMockProfiles();
      // **SỬA LỖI 2**: Thêm kiểu dữ liệu cho 'p'
      const userProfile = mockProfiles.find((p: QuotaProfile) => p.id === userToLogin.quotaProfileId);
      if (userProfile) {
        // **SỬA LỖI 3**: Gán vào thuộc tính 'quotaProfile' đã được thêm vào interface User
        userToLogin.quotaProfile = userProfile;
      }

      const mockResponse = {
        token: 'mock-jwt-token-for-testing-purposes',
        user: userToLogin
      };

      return of(mockResponse).pipe(
        delay(500),
        tap(response => {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUser.set(response.user);
        })
      );
    } else {
      return throwError(() => new Error('Tài khoản hoặc mật khẩu không đúng (Mock Mode)')).pipe(delay(500));
    }
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }
}

