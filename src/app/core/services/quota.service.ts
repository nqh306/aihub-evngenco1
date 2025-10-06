import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type QuotaStatus = 'active' | 'inactive';

export interface QuotaRule {
  id: string;                 // uuid
  name: string;               // ✅ Tên định mức
  models: string[];           // ✅ Danh sách model được phép
  tokenPerDay: number;        // 0 = không giới hạn
  tokenPerMonth: number;      // 0 = không giới hạn
  description?: string;       // ✅ Mô tả
  status: QuotaStatus;
}

const LS_KEY = 'aihub_quota_mock_v2';

@Injectable({ providedIn: 'root' })
export class QuotaService {
  private readonly apiBase = (environment.apiUrl || '') + '/quota';
  private readonly useMock = environment.USE_MOCK ?? true;

  private store$ = new BehaviorSubject<QuotaRule[]>(this.loadSeed());

  constructor(private http: HttpClient) {}

  list(): Observable<QuotaRule[]> {
    if (!this.useMock) return this.http.get<QuotaRule[]>(this.apiBase);
    return this.store$.asObservable().pipe(delay(150));
  }

  add(payload: Omit<QuotaRule, 'id'>): Observable<QuotaRule> {
    if (!this.useMock) return this.http.post<QuotaRule>(this.apiBase, payload);
    const rule: QuotaRule = { id: crypto.randomUUID(), ...payload };
    const next = [...this.store$.value, rule];
    this.persist(next);
    return of(rule).pipe(delay(300));
  }

  update(id: string, patch: Partial<QuotaRule>): Observable<QuotaRule> {
    if (!this.useMock) return this.http.put<QuotaRule>(`${this.apiBase}/${id}`, patch);
    const list = this.store$.value.slice();
    const idx = list.findIndex(r => r.id === id);
    if (idx < 0) return throwError(() => new Error('Rule not found'));
    list[idx] = { ...list[idx], ...patch };
    this.persist(list);
    return of(list[idx]).pipe(delay(300));
  }

  setStatus(id: string, status: QuotaStatus) {
    if (!this.useMock) return this.http.patch<QuotaRule>(`${this.apiBase}/${id}/status`, { status });
    return this.update(id, { status });
  }

  delete(id: string) {
    if (!this.useMock) return this.http.delete<void>(`${this.apiBase}/${id}`);
    this.persist(this.store$.value.filter(r => r.id !== id));
    return of(void 0).pipe(delay(250));
  }

  // -------- mock helpers ----------
  private persist(list: QuotaRule[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    this.store$.next(list);
  }
  private loadSeed(): QuotaRule[] {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
    const seed: QuotaRule[] = [
      {
        id: crypto.randomUUID(),
        name: 'Mặc định toàn hệ thống',
        models: ['Trợ lý EVNGENCO1', 'GPT 4.1 Mini'],
        tokenPerDay: 0,
        tokenPerMonth: 0,
        status: 'active',
        description: '0 = Không giới hạn; áp dụng toàn hệ thống'
      },
      {
        id: crypto.randomUUID(),
        name: 'Đơn vị bencode.vn',
        models: ['Trợ lý EVNGENCO1'],
        tokenPerDay: 200000,
        tokenPerMonth: 4000000,
        status: 'active',
        description: 'Định mức riêng cho bencode.vn'
      }
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
}
