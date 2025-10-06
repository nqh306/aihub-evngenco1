# STAGE 1: Build aplication
# Sử dụng một image Node.js để build code Angular
FROM node:20-alpine AS builder

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy file package.json và package-lock.json trước để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Copy toàn bộ mã nguồn còn lại
COPY . .

# Build ứng dụng Angular với cấu hình production
# Thay 'your-project-name' bằng tên project của bạn trong file angular.json
RUN npm run build -- --configuration production

# STAGE 2: Serve application from Nginx
# Sử dụng một image Nginx siêu nhẹ để phục vụ web
FROM nginx:alpine

# Copy các file đã build từ stage 'builder' vào thư mục phục vụ web của Nginx
# !!! LƯU Ý QUAN TRỌNG: Thay 'your-project-name' bằng tên project thực tế của bạn
COPY --from=builder /app/dist/your-project-name/browser /usr/share/nginx/html

# Mở cổng 80 để bên ngoài có thể truy cập vào container
EXPOSE 80