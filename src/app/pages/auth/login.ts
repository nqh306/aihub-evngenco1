import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    RouterModule
  ],
  template: `
    <!-- Main container with new background image -->
    <div class="main-container">
      <!-- Login panel with glassmorphism effect -->
      <div class="login-panel">
        <!-- New logo container -->
        <div
          class="logo-container"
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2rem;
          "
        >
          <img
            src="assets/logo-evn.png"
            alt="EVN Genco 1 Logo"
            style="height: 80px; margin-right: 0px"
          />
          <div
            style="display: flex; flex-direction: column; margin-left: -4px"
          >
            <span
              style="
                font-family: 'HelveticaBlackVU', sans-serif;
                font-size: 36px;
              "
            >
              <span style="color: #11189d">EVN</span>
              <span style="color: #ed1c24"><i>GENCO1</i></span>
            </span>
            <img
              src="assets/logo-aihub.png"
              alt="AI HUB"
              style="
                height: 36px;
                width: auto;
                margin-top: 4px;
                transform: scaleX(1);
                margin-left: -2px;
              "
            />
          </div>
        </div>
        
        <!-- Welcome text -->
        <div class="welcome-text">
          <h2 class="welcome-title">NỀN TẢNG AI TẬP TRUNG</h2>
          <p class="welcome-subtitle">
            Khai phá sức mạnh của Trí tuệ Nhân tạo để tối ưu hóa công việc và đổi mới sáng tạo
          </p>
        </div>

        <!-- Login form -->
        <form class="login-form" (ngSubmit)="handleLogin()">
          <!-- Username input -->
          <div class="input-group">
            <label for="username">Tài khoản</label>
            <input
              type="text"
              id="username"
              [(ngModel)]="username"
              name="username"
              placeholder="Nhập tên tài khoản của bạn"
              required
            />
          </div>

          <!-- Password input -->
          <div class="input-group">
            <label for="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <!-- Remember me checkbox -->
          <div class="remember-me">
            <input
              type="checkbox"
              id="remember"
              [(ngModel)]="checked"
              name="remember"
            />
            <label for="remember">Ghi nhớ đăng nhập</label>
          </div>

          <!-- Error message -->
          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>

          <!-- Login button -->
          <button type="submit" class="login-button" [disabled]="isLoggingIn">
             <span *ngIf="!isLoggingIn">Đăng Nhập</span>
             <span *ngIf="isLoggingIn">
               <i class="pi pi-spin pi-spinner" style="font-size: 1.2rem"></i>
             </span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      /* Import Google Font */
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

      /* Main container styling */
      .main-container {
        font-family: 'Poppins', sans-serif;
        min-height: 100vh;
        background-color: #000;
        background-size: cover;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        overflow: hidden;
        position: relative;
      }

      /* Animated background với hiệu ứng parallax và pan */
      .main-container::after {
        content: '';
        position: absolute;
        top: -10%;
        left: -10%;
        right: -10%;
        bottom: -10%;
        background-image: url('https://plus.unsplash.com/premium_photo-1664302004020-a69eec567967?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29ubmVjdGlvbiUyMGFpJTIwd2l0aCUyMHBlb3BsZXxlbnwwfHwwfHx8MA%3D%3D');
        background-size: cover;
        background-position: center;
        z-index: 0;
        animation: kenBurns 30s ease-in-out infinite;
      }

      /* Ken Burns effect - zoom + pan cho sinh động hơn */
      @keyframes kenBurns {
        0% {
          transform: scale(1) translate(0, 0);
        }
        25% {
          transform: scale(1.15) translate(-2%, -2%);
        }
        50% {
          transform: scale(1.08) translate(2%, 1%);
        }
        75% {
          transform: scale(1.12) translate(-1%, 2%);
        }
        100% {
          transform: scale(1) translate(0, 0);
        }
      }

      /* Dark overlay cho background */
      .main-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, 
          rgba(0, 0, 0, 0.7) 0%, 
          rgba(17, 24, 157, 0.3) 50%, 
          rgba(0, 0, 0, 0.7) 100%);
        z-index: 1;
        animation: gradientShift 15s ease-in-out infinite;
      }

      @keyframes gradientShift {
        0%, 100% {
          opacity: 0.8;
        }
        50% {
          opacity: 0.6;
        }
      }

      /* Login panel với glassmorphism cải tiến - mờ đẹp hơn */
      .login-panel {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 450px;
        background: rgba(255, 255, 255, 0.08); /* Giảm opacity để mờ hơn */
        backdrop-filter: blur(20px) saturate(180%); /* Tăng blur và thêm saturation */
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.25); /* Border mờ hơn */
        border-radius: 24px;
        padding: 2.5rem;
        color: #ffffff; /* Đổi màu chữ chính sang trắng */
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.1); /* Thêm inner shadow */
        animation: fadeIn 1s ease-out, float 6s ease-in-out infinite 1s;
        transition: all 0.4s ease;
      }

      /* Hover effect cho panel */
      .login-panel:hover {
        transform: translateY(-10px) scale(1.02);
        box-shadow: 
          0 12px 40px rgba(0, 0, 0, 0.4),
          0 0 60px rgba(17, 24, 157, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.12);
      }

      /* Fade in animation */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Floating animation */
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      /* Welcome text styling */
      .welcome-text {
        text-align: center;
        margin-bottom: 2.5rem;
      }

      .welcome-title {
        font-family: 'Roboto', sans-serif;
        font-size: 1.8rem;
        font-weight: 600;
        margin: 0;
        color: #ffffff;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }

      .welcome-subtitle {
        font-family: 'Roboto', sans-serif;
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.85);
        margin-top: 0.5rem;
        text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
      }

      /* Login form styling */
      .login-form {
        display: flex;
        flex-direction: column;
      }

      /* Input group styling */
      .input-group {
        margin-bottom: 1.5rem;
        position: relative;
      }

      .input-group label {
        display: block;
        font-size: 0.95rem;
        font-weight: 600; /* Tăng độ đậm */
        color: #ffffff; /* Đổi màu sang trắng */
        margin-bottom: 0.6rem;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); /* Thêm shadow để nổi bật */
        letter-spacing: 0.3px; /* Khoảng cách chữ */
      }

      .input-group input {
        width: 100%;
        padding: 0.85rem 1.2rem;
        background: rgba(255, 255, 255, 0.1); /* Background mờ hơn */
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 10px;
        color: #ffffff;
        font-size: 1rem;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .input-group input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }

      .input-group input:focus {
        outline: none;
        border-color: #11189d;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 
          0 0 0 3px rgba(17, 24, 157, 0.2),
          0 4px 15px rgba(17, 24, 157, 0.3);
        transform: translateY(-2px);
      }

      /* Remember me checkbox styling */
      .remember-me {
        display: flex;
        align-items: center;
        margin-bottom: 2rem;
        font-size: 0.875rem;
      }

      .remember-me input[type='checkbox'] {
        margin-right: 0.5rem;
        appearance: none;
        width: 18px;
        height: 18px;
        border: 1.5px solid rgba(255, 255, 255, 0.5);
        border-radius: 4px;
        cursor: pointer;
        position: relative;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.1);
      }

      .remember-me input[type='checkbox']:checked {
        background-color: #11189d;
        border-color: #11189d;
        box-shadow: 0 0 10px rgba(17, 24, 157, 0.5);
      }

      .remember-me input[type='checkbox']:checked::after {
        content: '✔';
        font-size: 12px;
        color: #ffffff;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .remember-me label {
        color: rgba(255, 255, 255, 0.9);
        cursor: pointer;
      }

      /* Login button styling */
      .login-button {
        padding: 0.9rem 1rem;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, #11189d, #ed1c24);
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(17, 24, 157, 0.4);
      }

      .login-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.5s ease;
      }

      .login-button:hover::before {
        left: 100%;
      }

      .login-button:hover {
        transform: translateY(-3px);
        box-shadow: 
          0 6px 25px rgba(17, 24, 157, 0.6),
          0 0 30px rgba(237, 28, 36, 0.3);
      }

      .login-button:active {
        transform: translateY(-1px);
      }

      /* Responsive adjustments */
      @media (max-width: 480px) {
        .login-panel {
          padding: 2rem;
        }
        .welcome-title {
          font-size: 1.5rem;
        }
      }

      /* Error message styling */
      .error-message {
        color: #ffffff;
        background: rgba(237, 28, 36, 0.2);
        border: 1px solid rgba(237, 28, 36, 0.5);
        backdrop-filter: blur(10px);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.875rem;
        margin-bottom: 1.5rem;
        text-align: center;
        animation: shake 0.5s ease-in-out;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }

      .login-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .login-button:disabled:hover {
        box-shadow: 0 4px 15px rgba(17, 24, 157, 0.4);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  username = '';
  password = '';
  checked = false;
  isLoggingIn = false;
  errorMessage: string | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);

  handleLogin() {
    if (!this.username || !this.password || this.isLoggingIn) {
      return;
    }

    this.isLoggingIn = true;
    this.errorMessage = null;

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/']); 
      },
      error: (err: any) => {
        this.errorMessage = "Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.";
        console.error('Login failed:', err);
        this.isLoggingIn = false;
      },
      complete: () => {
        this.isLoggingIn = false;
      }
    });
  }
}