import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type FeedbackType = 'bug' | 'idea' | 'rating' | 'other';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved';

export interface Feedback {
  id: string;                 // uuid
  type: FeedbackType;         // bug/idea/rating/other
  title: string;              // tiêu đề ngắn
  rating?: number;            // 1..5 (nếu type=rating thì bắt buộc)
  comment: string;            // mô tả chi tiết / nhận xét
  attachments?: string[];     // base64 URL (mock) hoặc URL file (prod)
  reporterName?: string;
  reporterEmail?: string;
  status: FeedbackStatus;
  createdAt: string;          // ISO
  updatedAt: string;          // ISO
}

const LS_KEY = 'aihub_feedback_mock_v1';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly apiBase = (environment.apiUrl || '') + '/feedback';
  private readonly useMock = environment.USE_MOCK ?? true;

  private store$ = new BehaviorSubject<Feedback[]>(this.loadSeed());

  constructor(private http: HttpClient) {}

  list(): Observable<Feedback[]> {
    if (!this.useMock) return this.http.get<Feedback[]>(this.apiBase);
    return this.store$.asObservable().pipe(delay(120));
  }

  add(payload: Omit<Feedback, 'id'|'createdAt'|'updatedAt'|'status'> & { status?: FeedbackStatus }): Observable<Feedback> {
    if (!this.useMock) return this.http.post<Feedback>(this.apiBase, payload);
    const now = new Date().toISOString();
    const rec: Feedback = {
      id: crypto.randomUUID(),
      status: payload.status ?? 'open',
      createdAt: now,
      updatedAt: now,
      ...payload
    };
    const next = [...this.store$.value, rec];
    this.persist(next);
    return of(rec).pipe(delay(300));
  }

  update(id: string, patch: Partial<Feedback>): Observable<Feedback> {
    if (!this.useMock) return this.http.put<Feedback>(`${this.apiBase}/${id}`, patch);
    const list = this.store$.value.slice();
    const idx = list.findIndex(x => x.id === id);
    if (idx < 0) return throwError(() => new Error('Feedback not found'));
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    this.persist(list);
    return of(list[idx]).pipe(delay(300));
  }

  setStatus(id: string, status: FeedbackStatus): Observable<Feedback> {
    if (!this.useMock) return this.http.patch<Feedback>(`${this.apiBase}/${id}/status`, { status });
    return this.update(id, { status });
  }

  delete(id: string): Observable<void> {
    if (!this.useMock) return this.http.delete<void>(`${this.apiBase}/${id}`);
    this.persist(this.store$.value.filter(x => x.id !== id));
    return of(void 0).pipe(delay(200));
  }

  uploadAttachment(file: File): Observable<string> {
    if (!this.useMock) {
      const form = new FormData();
      form.append('file', file);
      // giả định backend trả { url: '...' }
      return this.http.post<{url: string}>(`${this.apiBase}/upload`, form).pipe((src: any) => src);
    }
    return new Observable<string>(obs => {
      const reader = new FileReader();
      reader.onload = () => { obs.next(String(reader.result)); obs.complete(); };
      reader.onerror = err => obs.error(err);
      reader.readAsDataURL(file);
    }).pipe(delay(120));
  }

  // helpers (mock)
  private persist(list: Feedback[]) { localStorage.setItem(LS_KEY, JSON.stringify(list)); this.store$.next(list); }
  private loadSeed(): Feedback[] {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
    const now = new Date().toISOString();
    const seed: Feedback[] = [
      {
        id: crypto.randomUUID(),
        type: 'bug',
        title: 'Không tải được danh sách người dùng',
        comment: 'Khi bấm refresh bảng không hiển thị dữ liệu, F12 thấy lỗi 500.',
        rating: undefined,
        attachments: [],
        reporterName: 'Nguyễn A',
        reporterEmail: 'a@example.com',
        status: 'open',
        createdAt: now, updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        type: 'rating',
        title: 'Trải nghiệm tốt',
        comment: 'UI mượt, thao tác nhanh.',
        rating: 5,
        attachments: [],
        reporterName: 'Trần B',
        reporterEmail: 'b@example.com',
        status: 'resolved',
        createdAt: now, updatedAt: now
      }
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
}
