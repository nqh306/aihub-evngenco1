import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type ApiStatus = 'active' | 'inactive';
export type Provider = 'OpenAI' | 'Google' | 'xAI' | 'EVNGENCO1' | 'Custom';
export type CostType = 'free' | 'paid';

export interface ApiConfig {
  id: string;
  provider: Provider;
  name: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  description?: string;
  status: ApiStatus;
  createdAt: string;
  lastUsedAt?: string;
  costType: CostType;
  costInput?: number;  // Chi phí cho 1 triệu input token (USD)
  costOutput?: number; // Chi phí cho 1 triệu output token (USD)
}

const LS_KEY = 'aihub_api_keys_single_model_v3'; // Changed key to ensure update

@Injectable({ providedIn: 'root' })
export class ApiKeysService {
  private readonly apiBase = (environment.apiUrl || '') + '/apikeys';
  private readonly useMock = environment.USE_MOCK ?? true;

  private store$ = new BehaviorSubject<ApiConfig[]>([]);

  constructor(private http: HttpClient) {
      if(this.useMock) {
        localStorage.removeItem(LS_KEY);
        this.store$.next(this.loadSeed());
      }
  }

  list(): Observable<ApiConfig[]> {
    if (!this.useMock) return this.http.get<ApiConfig[]>(this.apiBase);
    return this.store$.asObservable().pipe(delay(120));
  }

  add(payload: Omit<ApiConfig, 'id'|'createdAt'>): Observable<ApiConfig> {
    if (!this.useMock) return this.http.post<ApiConfig>(this.apiBase, payload);
    const rec: ApiConfig = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...payload };
    const next = [...this.store$.value, rec];
    this.persist(next);
    return of(rec).pipe(delay(300));
  }

  update(id: string, patch: Partial<ApiConfig>): Observable<ApiConfig> {
    if (!this.useMock) return this.http.put<ApiConfig>(`${this.apiBase}/${id}`, patch);
    const list = this.store$.value.slice();
    const idx = list.findIndex(x => x.id === id);
    if (idx < 0) return throwError(() => new Error('Config not found'));
    list[idx] = { ...list[idx], ...patch };
    this.persist(list);
    return of(list[idx]).pipe(delay(300));
  }

  setStatus(id: string, status: ApiStatus) {
    if (!this.useMock) return this.http.patch<ApiConfig>(`${this.apiBase}/${id}/status`, { status });
    return this.update(id, { status });
  }

  delete(id: string) {
    if (!this.useMock) return this.http.delete<void>(`${this.apiBase}/${id}`);
    this.persist(this.store$.value.filter(x => x.id !== id));
    return of(void 0).pipe(delay(220));
  }

  touch(id: string) {
    const t = new Date().toISOString();
    return this.update(id, { lastUsedAt: t });
  }

  maskKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return `${key.slice(0,4)}••••••••${key.slice(-4)}`;
  }
  
  private persist(list: ApiConfig[]) { localStorage.setItem(LS_KEY, JSON.stringify(list)); this.store$.next(list); }
  
  private loadSeed(): ApiConfig[] {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved);
    const seed: ApiConfig[] = [
      // EVNGENCO1 Models
      { 
        id: 'evn-as-1', provider:'EVNGENCO1', name:'Trợ lý EVNGENCO1', model:'evngenco1-assistant-v1', 
        apiKey:'evn-xxxxx', baseUrl:'', description:'Trợ lý AI đa năng cho các nghiệp vụ chung.', status:'active', createdAt:new Date().toISOString(),
        costType: 'free', costInput: 0, costOutput: 0
      },
      { 
        id: 'evn-law-1', provider:'EVNGENCO1', name:'Trợ lý Pháp luật 1.0', model:'evngenco1-law-v1', 
        apiKey:'evn-yyyyy', baseUrl:'', description:'Model chuyên sâu về tra cứu và tư vấn văn bản pháp luật.', status:'active', createdAt:new Date().toISOString(),
        costType: 'free', costInput: 0, costOutput: 0
      },
      // OpenAI Models
      { 
        id: crypto.randomUUID(), provider:'OpenAI', name:'OpenAI GPT-4o', model:'gpt-4o', 
        apiKey:'sk-openai-gpt4o', baseUrl:'https://api.openai.com/v1', description:'Mô hình flagship đa phương tiện, mạnh mẽ và nhanh chóng.', status:'active', createdAt:new Date().toISOString(),
        costType: 'paid', costInput: 5, costOutput: 15
      },
      { 
        id: crypto.randomUUID(), provider:'OpenAI', name:'OpenAI GPT-4 Turbo', model:'gpt-4-turbo', 
        apiKey:'sk-openai-gpt4t', baseUrl:'https://api.openai.com/v1', description:'Mô hình mạnh mẽ với context window lớn, tối ưu cho tác vụ phức tạp.', status:'active', createdAt:new Date().toISOString(),
        costType: 'paid', costInput: 10, costOutput: 30
      },
       { 
        id: crypto.randomUUID(), provider:'OpenAI', name:'OpenAI GPT-3.5 Turbo', model:'gpt-3.5-turbo', 
        apiKey:'sk-openai-gpt35', baseUrl:'https://api.openai.com/v1', description:'Mô hình nhanh, hiệu quả về chi phí cho các tác vụ thông thường.', status:'active', createdAt:new Date().toISOString(),
        costType: 'paid', costInput: 0.5, costOutput: 1.5
      },
      // Google Models
      { 
        id: crypto.randomUUID(), provider:'Google', name:'Gemini 1.5 Pro', model:'gemini-1.5-pro-latest', 
        apiKey:'g-gemini-15pro', baseUrl:'', description:'Model tiên tiến với context window cực lớn (1M tokens).', status:'active', createdAt:new Date().toISOString(),
        costType: 'paid', costInput: 3.5, costOutput: 10.5
      },
       { 
        id: crypto.randomUUID(), provider:'Google', name:'Gemini 1.5 Flash', model:'gemini-1.5-flash-latest', 
        apiKey:'g-gemini-15flash', baseUrl:'', description:'Phiên bản tốc độ cao và chi phí thấp của Gemini 1.5.', status:'active', createdAt:new Date().toISOString(),
        costType: 'paid', costInput: 0.35, costOutput: 1.05
      },
      // xAI Model
      { 
        id: crypto.randomUUID(), provider:'xAI', name:'Grok-1', model:'grok-1', 
        apiKey:'xai-grok1', baseUrl:'', description:'Mô hình lớn từ xAI với khả năng truy cập thông tin thời gian thực.', status:'inactive', createdAt:new Date().toISOString(),
        costType: 'paid', costInput: 3, costOutput: 6
      },
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
}

