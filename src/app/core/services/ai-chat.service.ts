import { Injectable } from '@angular/core';

export type ChatBackend =
  | { mode: 'sse'; url: string }           // ví dụ: /api/chat/stream (GET, SSE)
  | { mode: 'http'; url: string };         // ví dụ: /api/chat (POST, JSON)

export interface ChatOptions {
  webSearch: boolean;
  deepResearch: boolean;
  extendedReasoning: boolean;  // “suy luận sâu”/thinking budget bật/tắt
  files?: File[];
  model?: { name: string; provider?: 'openai'|'gemini'|'anthropic'|'evngenco1'|string };
  metadata?: Record<string, any>;
}

export type StreamEvent =
  | { type: 'status'; data: string }                 // “preprocessing…”, “retrieving…”
  | { type: 'thinking'; data: string }               // phần AI đang suy luận (nếu backend gửi)
  | { type: 'delta'; data: string }                  // token text delta
  | { type: 'done'; data?: any }
  | { type: 'error'; data: string };

@Injectable({ providedIn: 'root' })
export class AiChatService {
  // SSE streaming: lắng nghe các event {status|thinking|delta|done|error}
  stream({
    backend,
    prompt,
    options
  }: {
    backend: Extract<ChatBackend, { mode: 'sse' }>;
    prompt: string;
    options: ChatOptions;
  }): { close: () => void; on: (cb: (ev: StreamEvent) => void) => void } {
    const params = new URLSearchParams({
      prompt,
      webSearch: String(!!options.webSearch),
      deepResearch: String(!!options.deepResearch),
      extendedReasoning: String(!!options.extendedReasoning),
      modelName: options.model?.name ?? '',
      provider: options.model?.provider ?? '',
      metadata: options.metadata ? encodeURIComponent(JSON.stringify(options.metadata)) : ''
    });

    // Nếu cần upload file trong SSE, khuyến nghị: upload file trước -> lấy fileIds -> đưa vào params
    if ((options.files?.length ?? 0) > 0) {
      console.warn('[AiChatService] SSE không gửi file trực tiếp. Hãy upload trước để lấy fileIds.');
    }

    const es = new EventSource(`${backend.url}?${params.toString()}`);

    let handler: (ev: StreamEvent) => void = () => {};
    const relay = (type: StreamEvent['type']) => (e: MessageEvent) =>
      handler({ type, data: e.data });

    es.addEventListener('status',   relay('status'));
    es.addEventListener('thinking', relay('thinking'));  // hiển thị trace suy luận nếu backend cho phép
    es.addEventListener('delta',    relay('delta'));
    es.addEventListener('done',     relay('done'));
    es.addEventListener('error',    relay('error'));
    es.onerror = (e) => handler({ type: 'error', data: 'stream connection error' });

    return {
      close: () => es.close(),
      on: (cb) => { handler = cb; }
    };
  }

  // Request thường (không stream): POST JSON/multipart đều OK
  async complete({
    backend,
    prompt,
    options
  }: {
    backend: Extract<ChatBackend, { mode: 'http' }>;
    prompt: string;
    options: ChatOptions;
  }): Promise<{ text: string; thinking?: string; meta?: any }> {
    const hasFiles = (options.files?.length ?? 0) > 0;

    let body: BodyInit;
    let headers: HeadersInit | undefined;

    if (hasFiles) {
      const form = new FormData();
      form.append('prompt', prompt);
      form.append('webSearch', String(!!options.webSearch));
      form.append('deepResearch', String(!!options.deepResearch));
      form.append('extendedReasoning', String(!!options.extendedReasoning));
      form.append('modelName', options.model?.name ?? '');
      form.append('provider', options.model?.provider ?? '');
      form.append('metadata', JSON.stringify(options.metadata ?? {}));
      options.files!.forEach((f, idx) => form.append('files', f, f.name));
      body = form;
    } else {
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify({
        prompt,
        webSearch: !!options.webSearch,
        deepResearch: !!options.deepResearch,
        extendedReasoning: !!options.extendedReasoning,
        modelName: options.model?.name,
        provider: options.model?.provider,
        metadata: options.metadata ?? {}
      });
    }

    const res = await fetch(backend.url, { method: 'POST', headers, body });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}
