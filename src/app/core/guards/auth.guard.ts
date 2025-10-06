import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Bộ bảo vệ (Guard) để kiểm tra xem người dùng đã đăng nhập hay chưa.
 * Nếu chưa, sẽ chuyển hướng về trang login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Kiểm tra xem có token hoặc thông tin người dùng không
  // Bằng cách này, nó hoạt động cả khi người dùng tải lại trang
  if (authService.currentUser() || localStorage.getItem('authToken')) {
    // Đã đăng nhập, cho phép truy cập
    return true;
  }

  // Chưa đăng nhập, chuyển hướng đến trang login
  // Chúng ta trả về một UrlTree để Angular xử lý việc chuyển hướng
  return router.createUrlTree(['/auth/login']);
};
