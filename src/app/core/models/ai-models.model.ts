// src/app/core/models/ai-models.model.ts

/**
 * Đặc tính của mô hình AI, giúp người dùng lựa chọn.
 */
export interface AIModelProfile {
    description: string; // Mô tả ngắn gọn
    sortOrder: number; // Dùng để sắp xếp nội bộ
}

export interface AIModel {
    id: string; // **SỬA LỖI**: Thêm thuộc tính ID để liên kết
    name: string;
    profile: AIModelProfile;
    icon: string;
    costType: 'free' | 'paid';
    costInput?: number;  // MODIFIED: Thêm thuộc tính này
    costOutput?: number; // MODIFIED: Thêm thuộc tính này
}

export interface AICategory {
    category: string;
    icon: string;
    models: AIModel[];
}

export interface RecentModel {
    name: string;
    vendor: string;
    profile: AIModelProfile;
    icon: string;
}

// ... Các interface khác giữ nguyên
export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
    modelName?: string;
    modelIcon?: string;
    paneId?: 'pane1' | 'pane2';
    thinking?: string;
    __showThinking?: boolean;
}

export interface ChatSession {
    id: string;
    title: string;
    timestamp: Date;
    messages: ChatMessage[];
}