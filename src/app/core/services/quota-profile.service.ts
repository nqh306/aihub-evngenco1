import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type QuotaStatus = 'active' | 'inactive';

export interface QuotaProfile {
  id: string;
  name: string;
  models: string[];
  tokenPerDay: number;
  tokenPerMonth: number;
  description?: string;
  status: QuotaStatus;
}

const LS_KEY = 'aihub_quota_profiles_v1';

@Injectable({ providedIn: 'root' })
export class QuotaProfileService {
  private readonly apiBase = (environment.apiUrl || '') + '/quotaprofiles';
  private readonly useMock = environment.USE_MOCK ?? true;

  private store$ = new BehaviorSubject<QuotaProfile[]>([]);

  constructor(private http: HttpClient) {
    if (this.useMock) {
      localStorage.removeItem(LS_KEY);
      this.store$.next(this.loadSeed());
    }
  }
  
  // **SỬA LỖI 1**: Đảm bảo hàm này tồn tại và là public
  public getMockProfiles(): QuotaProfile[] {
    return this.store$.getValue();
  }

  list(): Observable<QuotaProfile[]> {
    if (!this.useMock) return this.http.get<QuotaProfile[]>(this.apiBase);
    return this.store$.asObservable().pipe(delay(150));
  }
  
  // ... (Các hàm add, update, setStatus, delete giữ nguyên) ...

  add(payload: Omit<QuotaProfile, 'id'>): Observable<QuotaProfile> {
    if (!this.useMock) return this.http.post<QuotaProfile>(this.apiBase, payload);
    const rule: QuotaProfile = { id: crypto.randomUUID(), ...payload };
    const next = [...this.store$.value, rule];
    this.persist(next);
    return of(rule).pipe(delay(300));
  }
  update(id: string, patch: Partial<QuotaProfile>): Observable<QuotaProfile> {
    if (!this.useMock) return this.http.put<QuotaProfile>(`${this.apiBase}/${id}`, patch);
    const list = this.store$.value.slice();
    const idx = list.findIndex(r => r.id === id);
    if (idx < 0) return throwError(() => new Error('Rule not found'));
    list[idx] = { ...list[idx], ...patch };
    this.persist(list);
    return of(list[idx]).pipe(delay(300));
  }
  setStatus(id: string, status: QuotaStatus) {
    if (!this.useMock) return this.http.patch<QuotaProfile>(`${this.apiBase}/${id}/status`, { status });
    return this.update(id, { status });
  }
  delete(id: string) {
    if (!this.useMock) return this.http.delete<void>(`${this.apiBase}/${id}`);
    this.persist(this.store$.value.filter(r => r.id !== id));
    return of(void 0).pipe(delay(250));
  }

  private persist(list: QuotaProfile[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    this.store$.next(list);
  }

  private loadSeed(): QuotaProfile[] {
    const seed: QuotaProfile[] = [
      {
        id: 'default-all',
        name: 'Mặc định (Toàn quyền)',
        models: ['evngenco1-assistant-v1', 'evngenco1-law-v1', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
        tokenPerDay: 0,
        tokenPerMonth: 0,
        status: 'active',
        description: 'Profile mặc định, có quyền truy cập tất cả các model đang hoạt động.'
      },
      {
        id: 'evn-only',
        name: 'Nội bộ EVN',
        models: ['evngenco1-assistant-v1', 'evngenco1-law-v1'],
        tokenPerDay: 200000,
        tokenPerMonth: 4000000,
        status: 'active',
        description: 'Chỉ sử dụng các model nội bộ do EVNGENCO1 phát triển.'
      }
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
}

