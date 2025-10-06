import { Routes } from '@angular/router';
import { ChatbotComponent } from './chatbot-ai';
import { EmailComposerComponent } from './soan-email';
import { AihubLandingPage } from './aihub-landing';
import { DualChatComponent } from './ai-dual-chat';
import { SpeechWriterComponent } from './speech-writer.component';
import { PromptEnhancerComponent } from './prompt-enhancer';
import { InnovationToolComponent } from './innovation_tool';
import { InitiativeWriterComponent } from './initiative-writer';
import { TextSummarizerComponent } from './text-summarizer';
import { DocumentTranslatorComponent } from './document-translator';
import { AiToolHubComponent } from './ai-tool-hub';
import { UserManagementComponent } from './user-management';
import { QuotaSettingsComponent } from './quota-settings';
import { ApiManagementComponent } from './api-management';
import { FeedbackPageComponent } from './feedback';
import { InnovationIdeasComponent } from './innovation-ideas';
import {AIMarketplaceShellComponent,AiModelsPageComponent,ApiKeysPageComponent,AiUsagePageComponent,} from './ai-marketplace';
import { AppDashboardComponent } from './app.dashboard';


export default [
    {path: 'ai-marketplace',component: AIMarketplaceShellComponent,
        children: [
        { path: '', pathMatch: 'full', redirectTo: 'models' },
        { path: 'models', component: AiModelsPageComponent },
        { path: 'api-keys', component: ApiKeysPageComponent },
        { path: 'usage', component: AiUsagePageComponent },],
    },
    { path: 'app.dashboard', data: { breadcrumb: 'Báo cáo' }, component: AppDashboardComponent },
    { path: 'innovation-ideas', data: { breadcrumb: 'Đề xuất ý tưởng ĐMST' }, component: InnovationIdeasComponent },
    { path: 'feedback', data: { breadcrumb: 'Đánh giá Góp ý' }, component: FeedbackPageComponent },
    { path: 'api-management', data: { breadcrumb: 'Quản lý API' }, component: ApiManagementComponent },
    { path: 'quota-settings', data: { breadcrumb: 'Thiết lập định mức' }, component: QuotaSettingsComponent },
    { path: 'user-management', data: { breadcrumb: 'Người dùng' }, component: UserManagementComponent },
    { path: 'ai-tool-hub', data: { breadcrumb: 'Khám phá công cụ AI' }, component: AiToolHubComponent },
    { path: 'document-translator', data: { breadcrumb: 'Dịch văn bản' }, component: DocumentTranslatorComponent },
    { path: 'text-summarizer', data: { breadcrumb: 'Tóm tắt văn bản' }, component: TextSummarizerComponent },
    { path: 'initiative-writer', data: { breadcrumb: 'Hỗ trợ viết sáng kiến' }, component: InitiativeWriterComponent },
    { path: 'innovation_tool', data: { breadcrumb: 'Tư duy Đổi mới sáng tạo' }, component: InnovationToolComponent },
    { path: 'prompt-enhancer', data: { breadcrumb: 'Prompt Enhancement' }, component: PromptEnhancerComponent },
    { path: 'speech-writer.component', data: { breadcrumb: 'Viết bài phát biểu' }, component: SpeechWriterComponent },
    { path: 'soan-email', data: { breadcrumb: 'Soạn Email' }, component: EmailComposerComponent },
    { path: 'ai-dual-chat', data: { breadcrumb: 'Dual Chatbot' }, component: DualChatComponent },
    { path: 'aihub-landing', data: { breadcrumb: 'AI HUB Landing' }, component: AihubLandingPage },
    { path: 'chatbot-ai', data: { breadcrumb: 'Chatbot AI' }, component: ChatbotComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;