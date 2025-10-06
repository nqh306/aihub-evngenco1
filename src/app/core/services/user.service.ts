import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { QuotaProfile } from './quota-profile.service'; // Import QuotaProfile

/** Kiểu dữ liệu người dùng */
export type UserStatus = 'active' | 'inactive';
export interface User {
  id: string;
  avatar?: string;
  username: string;
  fullName: string;
  donvi: string;
  phongban: string;
  vitri: string;
  role: string;
  email: string;
  phone: string;
  tokenLimit: string; // This property is now managed by QuotaProfile
  status: UserStatus;
  
  // **SỬA LỖI 3**: Thêm quotaProfileId và quotaProfile
  quotaProfileId?: string; 
  quotaProfile?: QuotaProfile; // Để chứa toàn bộ object profile
}

/** Key lưu mock vào localStorage */
const LS_KEY = 'aihub_users_mock';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = (environment.apiUrl || '') + '/users';
  private readonly useMock = environment.USE_MOCK ?? true;

  private users$ = new BehaviorSubject<User[]>([]);

  constructor() {
    if (this.useMock) {
      localStorage.removeItem(LS_KEY);
      this.users$.next(this.loadSeed());
    }
  }
  
  list(): Observable<User[]> {
    if (!this.useMock) {
      return this.http.get<User[]>(this.apiBase);
    }
    return this.users$.asObservable().pipe(delay(150));
  }
  
  public getMockUsers(): User[] {
    return this.users$.getValue();
  }

  // ... (Các hàm add, update, delete, setStatus, uploadAvatar giữ nguyên) ...
  add(payload: Omit<User, 'id'>): Observable<User> {
    if (!this.useMock) return this.http.post<User>(this.apiBase, payload);
    const newUser: User = { id: crypto.randomUUID(), ...payload };
    const next = [...this.users$.value, newUser];
    this.persist(next);
    return of(newUser).pipe(delay(400));
  }
  update(id: string, patch: Partial<User>): Observable<User> {
    if (!this.useMock) return this.http.put<User>(`${this.apiBase}/${id}`, patch);
    const list = this.users$.value.slice();
    const idx = list.findIndex(u => u.id === id);
    if (idx < 0) return throwError(() => new Error('User not found'));
    list[idx] = { ...list[idx], ...patch };
    this.persist(list);
    return of(list[idx]).pipe(delay(400));
  }
  setStatus(id: string, status: UserStatus): Observable<User> {
    if (!this.useMock) return this.http.patch<User>(`${this.apiBase}/${id}/status`, { status });
    return this.update(id, { status });
  }
  delete(id: string): Observable<void> {
    if (!this.useMock) return this.http.delete<void>(`${this.apiBase}/${id}`);
    const next = this.users$.value.filter(u => u.id !== id);
    this.persist(next);
    return of(void 0).pipe(delay(300));
  }
  uploadAvatar(file: File): Observable<string> {
    if (!this.useMock) {
      const form = new FormData();
      form.append('file', file);
      return this.http.post<{ url: string }>(`${this.apiBase}/upload`, form).pipe(map(r => r.url));
    }
    return new Observable<string>(obs => {
      const reader = new FileReader();
      reader.onload = () => { obs.next(String(reader.result)); obs.complete(); };
      reader.onerror = err => obs.error(err);
      reader.readAsDataURL(file);
    }).pipe(delay(150));
  }

  private persist(list: User[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    this.users$.next(list);
  }

  private loadSeed(): User[] {
    const seed: User[] = [
      {
        id: crypto.randomUUID(),
        avatar: '',
        username: 'huynq91',
        fullName: 'Nguyễn Quang Huy',
        donvi: 'EVNGENCO1',
        phongban: 'Ban Khoa học công nghệ và Đổi mới sáng tạo',
        vitri: 'Phó Trưởng Ban',
        role: 'Quản trị hệ thống',
        email: 'nqh306@gmail.com',
        phone: '0915330999',
        tokenLimit: 'Không giới hạn', // Giữ lại để tương thích, nhưng sẽ được quản lý bởi profile
        status: 'active',
        quotaProfileId: 'default-all' // Gán profile mặc định
      }
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
}

