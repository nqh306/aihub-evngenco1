import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-aihub-landing',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  styles: [`
    :host { display: block; }
    .section { padding: 3rem 0; }
    @media (min-width: 768px) { .section { padding: 5rem 0; } }

    /* Wrapper trung lập, không phụ thuộc container của layout */
    .wrap { max-width: 1200px; margin: 0 auto; padding-left: 1rem; padding-right: 1rem; }

    .hero-bg {
      background:
        radial-gradient(120% 120% at 90% 10%, rgba(120,162,255,.22) 0%, rgba(120,162,255,0) 60%),
        radial-gradient(120% 120% at 15% 80%, rgba(0,255,194,.18) 0%, rgba(0,255,194,0) 60%),
        linear-gradient(180deg, var(--surface-0), var(--surface-50));
    }

    .hero-image {
      width: 100%;
      max-width: 560px;
      height: 520px;
      border-radius: 1.5rem;
      box-shadow: 0 20px 40px rgba(2,8,23,.12);
      object-fit: cover;
    }

    .stat { line-height: 1.1; }
  `],
  template: `
    <!-- HERO -->
    <section class="hero-bg overflow-hidden">
      <div class="wrap">
        <div class="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm bg-surface-100 dark:bg-surface-800">
              <span class="pi pi-sparkles text-primary"></span>
              <span>EVNGENCO1 • AI HUB</span>
            </div>

            <h1 class="mt-5 text-4xl md:text-6xl font-bold leading-tight">
              Một nền tảng.<br/>
              <span class="font-extrabold bg-clip-text text-transparent"
                style="background-image:linear-gradient(90deg,#6EE7F9 0%,#A78BFA 50%,#F472B6 100%);">
                Khai phóng sức mạnh AI
              </span>
            </h1>

            <p class="mt-5 text-lg md:text-xl text-muted-color max-w-2xl">
              Chỉ <strong>1 tài khoản</strong> — sử dụng <strong>nhiều mô hình AI</strong>, quản lý tập trung,
              tập hợp mọi <strong>công cụ AI</strong> trong một nền tảng duy nhất. Phổ cập AI đến toàn thể CBCNV
              EVNGENCO1 với giao diện <strong>trực quan, thân thiện</strong>, phù hợp mọi đối tượng.
            </p>

            <div class="mt-8 flex flex-wrap gap-4">
              <button pButton pRipple label="Dùng thử ngay" class="px-6 py-3 text-lg"></button>
              <button pButton pRipple label="Xem tính năng" severity="secondary" class="px-6 py-3 text-lg" (click)="scrollTo('#features')"></button>
            </div>

            <div class="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <div class="text-3xl font-bold stat">10.000+</div>
                <div class="text-sm text-muted-color">Lượt sử dụng/tháng</div>
              </div>
              <div>
                <div class="text-3xl font-bold stat">20+</div>
                <div class="text-sm text-muted-color">Mô hình AI tích hợp</div>
              </div>
              <div>
                <div class="text-3xl font-bold stat">99.9%</div>
                <div class="text-sm text-muted-color">Thời gian sẵn sàng</div>
              </div>
            </div>
          </div>

          <div class="relative flex justify-center md:justify-end">
            <!-- Hình robot phong cách tương lai -->
            <img
              class="hero-image"
              src="https://images.unsplash.com/photo-1603791440008-0e9a0a0a2f97?q=80&w=1400&auto=format&fit=crop"
              alt="Futuristic AI Robot"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- TÍNH NĂNG CHÍNH -->
    <section id="features" class="section">
      <div class="wrap">
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-5xl font-bold">Tất cả AI trong một nền tảng</h2>
          <p class="text-muted-color mt-4 max-w-3xl mx-auto">
            Quản trị tập trung, kiểm soát chi phí, log truy vết, bảo mật cấp doanh nghiệp.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div class="card p-6">
            <div class="flex items-center gap-3">
              <span class="pi pi-shield text-2xl text-primary"></span>
              <h3 class="text-xl font-semibold">Một tài khoản – nhiều mô hình AI</h3>
            </div>
            <p class="mt-3 text-muted-color">
              Kết nối OpenAI, Google, xAI và model nội bộ. Phân quyền & định tuyến model theo phòng ban,
              quản lý khóa, định mức & ngân sách tập trung.
            </p>
            <div class="mt-4 text-sm opacity-80">
              Quản lý tập trung • Tập hợp công cụ AI trong một nền tảng
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center gap-3">
              <span class="pi pi-megaphone text-2xl text-primary"></span>
              <h3 class="text-xl font-semibold">Phổ cập AI cho toàn thể CBCNV</h3>
            </div>
            <p class="mt-3 text-muted-color">
              Đưa công nghệ AI đến gần hơn với mọi người: Chat trợ lý, Nhân viên AI (soạn email, tổng hợp văn bản),
              công cụ dịch & tạo tài liệu có định dạng.
            </p>
            <div class="mt-4 text-sm opacity-80">
              Đào tạo nhanh • Hướng dẫn trong sản phẩm
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center gap-3">
              <span class="pi pi-compass text-2xl text-primary"></span>
              <h3 class="text-xl font-semibold">Khai thác dễ dàng</h3>
            </div>
            <p class="mt-3 text-muted-color">
              Giao diện trực quan, thân thiện, phù hợp mọi đối tượng. Tìm kiếm, gợi ý nhanh, mẫu prompt theo ngữ cảnh,
              hỗ trợ tiếng Việt toàn diện.
            </p>
            <div class="mt-4 text-sm opacity-80">
              UI/UX thân thiện • Sẵn sàng cho di động
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SHOWCASE -->
    <section class="section">
      <div class="wrap">
        <div class="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 class="text-2xl md:text-3xl font-bold">Nhân viên AI & Bộ công cụ thông minh</h3>
            <ul class="mt-4 space-y-3 text-muted-color">
              <li class="flex items-start gap-3">
                <span class="pi pi-envelope mt-1"></span>
                <span>Soạn email, công văn, tờ trình — đúng ngữ điệu EVNGENCO1.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="pi pi-language mt-1"></span>
                <span>Dịch & giữ nguyên định dạng (DOCX, PDF, XLSX) với kiểm duyệt nội bộ.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="pi pi-share-alt mt-1"></span>
                <span>Tạo sơ đồ quy trình, lưu đồ & slide chỉ với vài câu lệnh.</span>
              </li>
            </ul>

            <div class="mt-6 flex gap-3">
              <button pButton pRipple label="Khám phá công cụ" class="px-5"></button>
              <button pButton pRipple label="Liên hệ triển khai" severity="secondary" class="px-5"></button>
            </div>
          </div>

          <div class="relative">
            <img
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1400&auto=format&fit=crop"
              alt="AI Tools"
              class="w-full h-[420px] md:h-[520px] object-cover rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="wrap">
        <div class="card p-10 md:p-12 text-center bg-surface-0/70 dark:bg-surface-900/70 backdrop-blur">
          <h3 class="text-2xl md:text-4xl font-bold">Sẵn sàng phổ cập AI tại EVNGENCO1?</h3>
          <p class="mt-3 text-muted-color max-w-2xl mx-auto">
            Trải nghiệm AI HUB với mô hình đa dạng, bảo mật doanh nghiệp và quản trị tập trung.
          </p>
          <div class="mt-6 flex justify-center gap-4">
            <button pButton pRipple label="Dùng thử miễn phí" class="px-6 py-3 text-lg"></button>
            <button pButton pRipple label="Nhận tư vấn" severity="secondary" class="px-6 py-3 text-lg"></button>
          </div>
          <div class="mt-8 text-sm text-muted-color">© {{ year }} EVNGENCO1 AI HUB — All rights reserved.</div>
        </div>
      </div>
    </section>
  `
})
export class AihubLandingPage {
  readonly year = new Date().getFullYear();

  scrollTo(hash: string) {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
