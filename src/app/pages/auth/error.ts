import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-error',
    imports: [ButtonModule, RippleModule, RouterModule, AppFloatingConfigurator],
    standalone: true,
    template: `
        <app-floating-configurator />
        <div class="main-container">

            <div class="error-card">

                <div class="logo-container">
                    <img src="assets/logo-evn.png" alt="EVN Genco 1 Logo" class="logo-evn" />
                    <div class="logo-text-group">
                        <span class="logo-text">
                            <span class="logo-evn-text">EVN</span>
                            <span class="logo-genco-text"><i>GENCO1</i></span>
                        </span>
                        <img src="assets/logo-aihub.png" alt="AI HUB" class="logo-aihub" />
                    </div>
                </div>

                <div class="error-content">
                    <img src="assets/error.svg" alt="Error Illustration" class="error-illustration" />
                    <div class="button-wrapper">
                        <p-button label="Quay về Trang chủ" routerLink="/" severity="danger" class="go-home-button" />
                    </div>
                </div>

            </div>
        </div>
    `,
    styles: [`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

        :host {
            font-family: 'Poppins', sans-serif;
        }

        /* --- NỀN ĐỘNG (Lấy từ trang Login) --- */
        .main-container {
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

        .main-container::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url('https://plus.unsplash.com/premium_photo-1664302004020-a69eec567967?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29ubmVjdGlvbiUyMGFpJTIwd2l0aCUyMHBlb3BsZXxlbnwwfHwwfHx8MA%3D%3D');
            background-size: cover;
            background-position: center;
            z-index: 0;
            animation: zoomInOut 20s ease-in-out infinite;
        }

        @keyframes zoomInOut {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .main-container::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
            z-index: 1;
        }

        /* --- CARD LỖI (Phong cách Glassmorphism) --- */
        .error-card {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 550px;
            background: rgba(240, 245, 255, 0.2); /* Nền kính mờ */
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 20px;
            padding: 2.5rem;
            color: #ffffff; /* Chữ màu trắng để nổi bật trên nền tối */
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
            animation: fadeIn 1s ease-out;
            text-align: center;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* --- LOGO (Lấy từ trang Login và tinh chỉnh) --- */
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2.5rem; /* Tăng khoảng cách với nội dung lỗi */
        }
        .logo-evn {
            height: 80px;
            margin-right: 0px;
        }
        .logo-text-group {
            display: flex;
            flex-direction: column;
            margin-left: -4px;
        }
        .logo-text {
            font-family: 'HelveticaBlackVU', sans-serif; /* Cần đảm bảo font này được import */
            font-size: 36px;
        }
        .logo-evn-text { color: #11189d; } /* Tạm thời giữ màu này để nhận diện thương hiệu */
        .logo-genco-text { color: #ed1c24; }
        .logo-aihub {
            height: 36px;
            width: auto;
            margin-top: 4px;
            margin-left: -2px;
        }
        
        /* --- NỘI DUNG LỖI (Tinh chỉnh màu sắc) --- */
        .error-content {
             display: flex;
             flex-direction: column;
             align-items: center;
        }

        .icon-wrapper {
            width: 70px;
            height: 70px;
            border: 3px solid #f87171; /* red-400 */
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            background: rgba(248, 113, 113, 0.15);
        }

        .error-icon {
            font-size: 2.5rem;
            color: #f87171; /* red-400 */
        }

        .error-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 0.75rem 0;
            line-height: 1.2;
        }

        .error-subtitle {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 2rem;
            max-width: 400px;
        }

        .error-illustration {
            max-width: 80%;
            height: auto;
            margin-bottom: 2rem;
        }

        .button-wrapper {
            margin-top: 1rem;
        }
        
        /* --- RESPONSIVE --- */
        @media (max-width: 600px) {
            .error-card {
                padding: 2rem;
            }
            .error-title {
                font-size: 2rem;
            }
            .error-subtitle {
                font-size: 1rem;
            }
            .logo-evn { height: 60px; }
            .logo-text { font-size: 28px; }
            .logo-aihub { height: 28px; }
        }
    `]
})
export class Error { }