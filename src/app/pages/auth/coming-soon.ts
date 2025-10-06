import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-maintenance',
    standalone: true,
    imports: [ButtonModule, RouterModule, RippleModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="main-container">

            <div class="maintenance-card">

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

                <div class="maintenance-content">
                    <div class="icon-wrapper">
                        <i class="pi pi-fw pi-spin pi-cog maintenance-icon"></i>
                    </div>
                    <h1 class="maintenance-title">Tính Năng Đang Nâng Cấp</h1>
                    <span class="maintenance-subtitle">
                        Chúng tôi đang triển khai tính năng này và sẽ hoàn thiện trong thời gian sớm nhất.
                        Hãy chờ chúng tôi nhé!
                    </span>
                    <div class="button-wrapper">
                        <p-button label="Quay về Trang chủ" routerLink="/" severity="info" class="go-home-button" />
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

        /* --- NỀN ĐỘNG (Tương tự các trang trước) --- */
        .main-container {
            min-height: 100vh;
            background-color: #000;
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
            background-image: url('https://plus.unsplash.com/premium_photo-1664302004020-a69eec567967?w=900&auto=format&fit=crop&q=60&ixlib-rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29ubmVjdGlvbiUyMGFpJTIwd2l0aCUyMHBlb3BsZXxlbnwwfHwwfHx8MA%DD');
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

        /* --- CARD (Phong cách Glassmorphism) --- */
        .maintenance-card {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 600px; /* Tăng nhẹ độ rộng cho phù hợp với ảnh minh họa */
            background: rgba(240, 245, 255, 0.2);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 20px;
            padding: 2.5rem;
            color: #ffffff;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
            animation: fadeIn 1s ease-out;
            text-align: center;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* --- LOGO --- */
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2.5rem;
        }
        .logo-evn { height: 80px; }
        .logo-text-group {
            display: flex; flex-direction: column; margin-left: -4px;
        }
        .logo-text {
            font-family: 'HelveticaBlackVU', sans-serif; font-size: 36px;
        }
        .logo-evn-text { color: #11189d; }
        .logo-genco-text { color: #ed1c24; }
        .logo-aihub { height: 36px; width: auto; margin-top: 4px; margin-left: -2px; }
        
        /* --- NỘI DUNG (Chủ đề màu xanh dương) --- */
        .maintenance-content {
             display: flex;
             flex-direction: column;
             align-items: center;
        }

        .icon-wrapper {
            width: 70px;
            height: 70px;
            border: 3px solid #60a5fa; /* blue-400 */
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            background: rgba(96, 165, 250, 0.15);
        }

        .maintenance-icon {
            font-size: 2.8rem;
            color: #60a5fa; /* blue-400 */
            /* Animation quay tròn đã có sẵn từ class pi-spin của PrimeIcons */
        }

        .maintenance-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 0.75rem 0;
            line-height: 1.2;
        }

        .maintenance-subtitle {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 2rem;
            max-width: 450px;
            line-height: 1.6;
        }

        .maintenance-illustration {
            max-width: 80%;
            height: auto;
            margin-bottom: 2rem;
        }

        .button-wrapper { margin-top: 1rem; }
        
        /* --- RESPONSIVE --- */
        @media (max-width: 600px) {
            .maintenance-card { padding: 2rem; }
            .maintenance-title { font-size: 2rem; }
            .maintenance-subtitle { font-size: 1rem; }
            .logo-evn { height: 60px; }
            .logo-text { font-size: 28px; }
            .logo-aihub { height: 28px; }
        }
    `]
})
export class Maintenance { }