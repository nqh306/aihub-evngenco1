// src/app/core/services/ai-model.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AICategory, AIModel } from '../models/ai-models.model';
import { ApiKeysService, ApiConfig, Provider } from './api-keys.service';

@Injectable({
    providedIn: 'root'
})
export class AiModelService {
    private apiKeysService = inject(ApiKeysService);

    private providerIcons: Record<Provider | string, string> = {
        'OpenAI': 'assets/demo/images/ai-vendors/openai.svg',
        'Google': 'assets/demo/images/ai-vendors/google.svg',
        'xAI': 'assets/demo/images/ai-vendors/xai.svg',
        'EVNGENCO1': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Icon-EVN.png',
        'Custom': 'pi pi-cog'
    };
    
    private modelIcons: Record<string, string> = {
        'gpt-4o': 'https://cdn-icons-png.flaticon.com/128/12222/12222589.png',
        'gpt-4-turbo': 'https://cdn-icons-png.flaticon.com/128/12222/12222589.png',
        'gpt-3.5-turbo': 'https://cdn-icons-png.flaticon.com/128/12222/12222589.png',
        'gemini-1.5-pro-latest': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbsNlmX0r4ICIGkTn47QkNqI3OkkINDd_cPA&s',
        'gemini-1.5-flash-latest': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbsNlmX0r4ICIGkTn47QkNqI3OkkINDd_cPA&s',
        'grok-1': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjSiNUDO__fZluGrW2RLCYxy-eYxtfgRPpfQ&s',
        'evngenco1-assistant-v1': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Icon-EVN.png',
        'evngenco1-law-v1': 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Icon-EVN.png',
    };

    /**
     * Lấy danh sách model, lọc theo profile và chuyển đổi cấu trúc cho selector.
     * @param allowedModelNames — Danh sách tên model được phép. Nếu null, hiển thị tất cả.
     */
    getModels(allowedModelNames: string[] | null): Observable<AICategory[]> {
        return this.apiKeysService.list().pipe(
            map((apiConfigs: ApiConfig[]) => {
                let activeConfigs = apiConfigs.filter(config => config.status === 'active');

                // **LOGIC LỌC MỚI**: Nếu có danh sách cho phép, chỉ giữ lại các model có trong danh sách
                if (allowedModelNames && allowedModelNames.length > 0) {
                    activeConfigs = activeConfigs.filter(config => allowedModelNames.includes(config.model));
                }

                const groupedByProvider = activeConfigs.reduce((acc, config) => {
                    const provider = config.provider;
                    if (!acc[provider]) {
                        acc[provider] = [];
                    }
                    acc[provider].push(config);
                    return acc;
                }, {} as Record<string, ApiConfig[]>);
                
                const categories: AICategory[] = Object.keys(groupedByProvider).map(provider => {
                    const configs = groupedByProvider[provider];
                    const models: AIModel[] = configs.map(config => ({
                        id: config.id,
                        name: config.name,
                        icon: this.modelIcons[config.model] || this.providerIcons[provider] || this.providerIcons['Custom'],
                        profile: {
                            description: config.description || 'Mô hình AI.',
                            sortOrder: 10
                        },
                        costType: config.costType,
                        costInput: config.costInput,   // MODIFIED: Thêm dòng này
                        costOutput: config.costOutput  // MODIFIED: Thêm dòng này
                    }));

                    return {
                        category: provider,
                        icon: this.providerIcons[provider] || this.providerIcons['Custom'],
                        models: models.sort((a, b) => a.name.localeCompare(b.name))
                    };
                });
                
                return categories.sort((a, b) => {
                    if (a.category === 'EVNGENCO1') return -1;
                    if (b.category === 'EVNGENCO1') return 1;
                    return a.category.localeCompare(b.category);
                });
            })
        );
    }
}