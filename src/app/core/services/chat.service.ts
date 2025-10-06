import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatMessage } from '../models/ai-models.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor() { }

  /**
   * Gửi yêu cầu đến backend và nhận về một stream các phản hồi.
   * @param payload Dữ liệu gửi đi, bao gồm prompt, model, mode, và lịch sử chat.
   * @returns Một Observable trả về từng phần (chunk) của tin nhắn.
   */
  getStreamingResponse(payload: { prompt: string; model: any; mode: string; history: ChatMessage[] }): Observable<string> {
    return new Observable(observer => {
      // !!! QUAN TRỌNG: Thay thế URL này bằng API endpoint thật của bạn.
      const apiUrl = 'http://your-backend-api.com/chat-stream';

      // Xây dựng query string từ payload
      const params = new URLSearchParams({
        prompt: payload.prompt,
        model: payload.model.name,
        mode: payload.mode,
        // Chuyển đổi lịch sử thành chuỗi JSON để gửi đi
        history: JSON.stringify(payload.history) 
      });

      const eventSource = new EventSource(`${apiUrl}?${params.toString()}`);

      // Lắng nghe sự kiện 'message' từ server
      eventSource.onmessage = event => {
        // Giả sử server trả về JSON có dạng { "chunk": "nội dung..." }
        const data = JSON.parse(event.data);

        // Server có thể gửi một tín hiệu đặc biệt để báo kết thúc stream
        if (data.done) {
          observer.complete();
          eventSource.close();
        } else {
          observer.next(data.chunk);
        }
      };

      // Xử lý lỗi
      eventSource.onerror = error => {
        console.error('EventSource failed:', error);
        observer.error('Lỗi kết nối tới máy chủ AI.');
        eventSource.close();
      };

      // Khi observable bị hủy (unsubscribe), chúng ta đóng kết nối EventSource
      return () => {
        eventSource.close();
      };
    });
  }
}