AI HUB - Nền tảng AI Tập Trung cho EVNGENCO1
Chào mừng đến với dự án AI HUB, một nền tảng web hiện đại được xây dựng để tập trung hóa việc sử dụng và quản lý các công cụ Trí Tuệ Nhân Tạo trong môi trường doanh nghiệp của EVNGENCO1.

Dự án được phát triển bằng Angular CLI phiên bản 20.

Giới Thiệu
AI HUB là một Single Page Application (SPA) được thiết kế để cung cấp một cổng giao tiếp duy nhất cho người dùng và quản trị viên, giúp khai thác sức mạnh của nhiều mô-hìn AI khác nhau một cách hiệu quả, an toàn và có kiểm soát. Nền tảng hỗ trợ từ các tác vụ trò chuyện thông thường đến các công cụ chuyên dụng và quản lý chi phí, người dùng.

✨ Tính Năng Nổi Bật
Nền tảng được chia thành các khu vực chức năng chính:

Dành cho Người Dùng
AI Chat & Dual Chat: Giao diện trò chuyện trực quan, hỗ trợ tương tác với một hoặc so sánh hai mô hình AI cùng lúc.

Bộ Công Cụ AI: Một thư viện các công cụ chuyên dụng được xây dựng sẵn để giải quyết các bài toán nghiệp vụ cụ thể như:

Soạn thảo Email, Bài phát biểu, Sáng kiến.

Tóm tắt và Dịch thuật văn bản.

Các công cụ hỗ trợ tư duy, sáng tạo.

AI Marketplace: Khám phá danh sách các mô hình AI được hỗ trợ và gửi yêu cầu truy cập.

Dành cho Quản Trị Viên
Dashboard Tổng Quan: Theo dõi số liệu sử dụng AI theo người dùng, phòng ban, và chi phí.

Quản lý Người Dùng: Thêm, sửa, xóa và phân quyền cho người dùng trong hệ thống.

Quản lý Profile Định Mức: Tạo và gán các chính sách sử dụng (giới hạn token, model được phép) cho từng người dùng hoặc nhóm.

Quản lý API: Quản lý tập trung các API key, chi phí và trạng thái của các mô hình AI từ nhiều nhà cung cấp (OpenAI, Google, v.v.).

💻 Công Nghệ Sử Dụng
Framework: Angular 20 (với kiến trúc Standalone Components).

Ngôn ngữ: TypeScript 5.9.

Thư viện UI: PrimeNG 20.

Styling: Tailwind CSS 4 & SCSS.

Theming: PrimeUIx Themes cho phép tùy chỉnh giao diện động.

Chất lượng code: ESLint và Prettier.

🚀 Bắt Đầu
Yêu cầu
Node.js (phiên bản 18.x trở lên)

Angular CLI (phiên bản 20.x)

Cài Đặt và Chạy Dự Án
Clone a repository:
Mở terminal và clone repository về máy của bạn:

git clone <your-repository-url>
cd sakai-ng-master

Cài đặt các gói phụ thuộc:

npm install

Chạy server phát triển:
Thực thi lệnh sau để khởi động server.

ng serve

Mở trình duyệt và truy cập vào http://localhost:4200/. Ứng dụng sẽ tự động tải lại nếu bạn thay đổi bất kỳ file mã nguồn nào.

🛠️ Chế Độ Giả Lập (MOCK Mode)
Dự án được tích hợp sẵn một chế độ giả lập (MOCK) cho phép frontend hoạt động đầy đủ mà không cần kết nối tới backend. Điều này rất hữu ích cho việc phát triển và kiểm thử giao diện.

Để bật chế độ MOCK: Mở file src/environments/environment.ts và đặt USE_MOCK: true. Dữ liệu sẽ được đọc/ghi vào localStorage của trình duyệt.

Để tắt chế độ MOCK và kết nối API thật: Đặt USE_MOCK: false và cấu hình apiUrl cho đúng với địa chỉ backend của bạn.

🏗️ Cấu Trúc Dự Án
src/app/core: Chứa các services cốt lõi (auth, user, api-keys), models, và guards. Đây là bộ não của ứng dụng.

src/app/layout: Định nghĩa cấu trúc giao diện chính (topbar, sidebar, footer).

src/app/pages: Chứa tất cả các trang chức năng của ứng dụng, được chia theo từng module (uikit, auth, landing...).

src/assets: Chứa các tài nguyên tĩnh như ảnh, fonts, và các file SCSS global.

📦 Build Dự Án
Để build dự án cho môi trường production, chạy lệnh:

ng build --configuration production

Các file đã build sẽ được lưu trong thư mục dist/.

📚 Tham Khảo Thêm
Để tìm hiểu thêm về Angular CLI, hãy truy cập Angular CLI Overview and Command Reference.
