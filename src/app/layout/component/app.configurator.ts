import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { $t, updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Material from '@primeuix/themes/material';
import Nora from '@primeuix/themes/nora';
import { PrimeNG } from 'primeng/config';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { LayoutService } from '../service/layout.service';

const presets = {
    Aura,
    Lara,
    Material,
    Nora
} as const;

declare type KeyOfType<T> = keyof T extends infer U ? U : never;

declare type SurfacesType = {
    name?: string;
    palette?: {
        0?: string;
        50?: string;
        100?: string;
        200?: string;
        300?: string;
        400?: string;
        500?: string;
        600?: string;
        700?: string;
        800?: string;
        900?: string;
        950?: string;
    };
    gradient?: string;
};

@Component({
    selector: 'app-configurator',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectButtonModule, InputTextModule],
    template: `
        <div class="flex flex-col gap-4">
            <div>
                <span class="text-sm text-muted-color font-semibold">Màu Chính</span>
                <div class="pt-2 flex gap-2 flex-wrap justify-start">
                    @for (primaryColor of primaryColors(); track primaryColor.name) {
                        <button
                            type="button"
                            [title]="primaryColor.name"
                            (click)="updateColors($event, 'primary', primaryColor)"
                            [ngClass]="{
                                    'outline outline-primary': primaryColor.name === selectedPrimaryColor() && !customPrimaryColor()
                                }"
                            class="cursor-pointer w-5 h-5 rounded-full flex shrink-0 items-center justify-center outline-offset-1 shadow-lg transition-all hover:scale-110"
                            [style]="{
                                    'background': primaryColor?.gradient || (primaryColor?.name === 'noir' ? 'var(--text-color)' : primaryColor?.palette?.['500'])
                                }"
                        >
                        </button>
                    }
                </div>
                <div class="mt-3 flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-800 rounded-md border border-surface-200 dark:border-surface-700">
                    <label class="flex items-center gap-2 flex-1">
                        <input
                            type="color"
                            [(ngModel)]="customPrimaryColorValue"
                            (ngModelChange)="onCustomPrimaryColorChange($event)"
                            class="cursor-pointer w-8 h-8 rounded border-2 border-surface-300 dark:border-surface-600"
                            [ngClass]="{
                                'border-primary': customPrimaryColor()
                            }"
                            title="Chọn màu tùy chỉnh"
                        />
                        <div class="flex-1">
                            <div class="text-xs text-muted-color mb-1">Màu Tùy Chỉnh</div>
                            <input
                                pInputText
                                type="text"
                                [(ngModel)]="customPrimaryColorValue"
                                (ngModelChange)="onCustomPrimaryColorChange($event)"
                                placeholder="#11189d"
                                class="w-full text-sm"
                                maxlength="7"
                            />
                        </div>
                    </label>
                </div>
            </div>
            <div>
                <span class="text-sm text-muted-color font-semibold">Màu Nền</span>
                <div class="pt-2 flex gap-2 flex-wrap justify-start">
                    @for (surface of surfaces; track surface.name) {
                        <button
                            type="button"
                            [title]="surface.name"
                            (click)="updateColors($event, 'surface', surface)"
                            class="cursor-pointer w-5 h-5 rounded-full flex shrink-0 items-center justify-center p-0 outline-offset-1"
                            [ngClass]="{
                                    'outline outline-primary': (selectedSurfaceColor() ? selectedSurfaceColor() === surface.name : layoutService.layoutConfig().darkTheme ? surface.name === 'zinc' : surface.name === 'slate') && !customSurfaceColor()
                                }"
                            [style]="{
                                    'background-color': surface?.palette?.['500']
                                }"
                        ></button>
                    }
                </div>
                <div class="mt-3 flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-800 rounded-md border border-surface-200 dark:border-surface-700">
                    <label class="flex items-center gap-2 flex-1">
                        <input
                            type="color"
                            [(ngModel)]="customSurfaceColorValue"
                            (ngModelChange)="onCustomSurfaceColorChange($event)"
                            class="cursor-pointer w-8 h-8 rounded border-2 border-surface-300 dark:border-surface-600"
                            [ngClass]="{
                                'border-primary': customSurfaceColor()
                            }"
                            title="Chọn màu nền tùy chỉnh"
                        />
                        <div class="flex-1">
                            <div class="text-xs text-muted-color mb-1">Màu Tùy Chỉnh</div>
                            <input
                                pInputText
                                type="text"
                                [(ngModel)]="customSurfaceColorValue"
                                (ngModelChange)="onCustomSurfaceColorChange($event)"
                                placeholder="#64748b"
                                class="w-full text-sm"
                                maxlength="7"
                            />
                        </div>
                    </label>
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <span class="text-sm text-muted-color font-semibold">Giao Diện</span>
                <p-selectbutton [options]="presets" [ngModel]="selectedPreset()" (ngModelChange)="onPresetChange($event)" [allowEmpty]="false" size="small" />
            </div>
            <div *ngIf="showMenuModeButton()" class="flex flex-col gap-2">
                <span class="text-sm text-muted-color font-semibold">Chế Độ Menu</span>
                <p-selectbutton [ngModel]="menuMode()" (ngModelChange)="onMenuModeChange($event)" [options]="menuModeOptions" [allowEmpty]="false" size="small" />
            </div>
        </div>
    `,
    host: {
        class: 'hidden absolute top-13 right-0 w-72 p-4 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border origin-top shadow-[0px_3px_5px_rgba(0,0,0,0.02),0px_0px_2px_rgba(0,0,0,0.05),0px_1px_4px_rgba(0,0,0,0.08)]'
    }
})
export class AppConfigurator {
    router = inject(Router);

    config: PrimeNG = inject(PrimeNG);

    layoutService: LayoutService = inject(LayoutService);

    platformId = inject(PLATFORM_ID);

    primeng = inject(PrimeNG);

    presets = Object.keys(presets);

    showMenuModeButton = signal(!this.router.url.includes('auth'));

    customPrimaryColor = signal(false);
    customPrimaryColorValue = '#11189d';

    customSurfaceColor = signal(false);
    customSurfaceColorValue = '#64748b';

    menuModeOptions = [
        { label: 'Đầy đủ', value: 'static' },
        { label: 'Rút gọn', value: 'overlay' }
    ];

    // Màu gradient hiện đại
    modernGradientColors: SurfacesType[] = [
        {
            name: 'royal-blue',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            palette: {
                0: '#ffffff',
                50: '#f0f1fe',
                100: '#e1e3fd',
                200: '#c9cdfb',
                300: '#a7adf7',
                400: '#8488f1',
                500: '#667eea',
                600: '#5563dd',
                700: '#4750c3',
                800: '#3c429d',
                900: '#353b7d',
                950: '#22254a'
            }
        },
        {
            name: 'ocean-breeze',
            gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
            palette: {
                0: '#ffffff',
                50: '#f0f9fc',
                100: '#dbf0f7',
                200: '#bae3f0',
                300: '#8bcfe5',
                400: '#54b3d3',
                500: '#2193b0',
                600: '#1d7f9b',
                700: '#1b677e',
                800: '#1c5568',
                900: '#1c4758',
                950: '#0f2d3b'
            }
        },
        {
            name: 'sunset-glow',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            palette: {
                0: '#ffffff',
                50: '#fef2f9',
                100: '#fee5f4',
                200: '#ffcbeb',
                300: '#ffa1da',
                400: '#ff69bf',
                500: '#f5576c',
                600: '#e62e5c',
                700: '#c71f4a',
                800: '#a51d40',
                900: '#8a1e38',
                950: '#540b1e'
            }
        },
        {
            name: 'emerald-dream',
            gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            palette: {
                0: '#ffffff',
                50: '#edfdf7',
                100: '#d4f9ea',
                200: '#adf2d8',
                300: '#77e6c0',
                400: '#40d1a3',
                500: '#11998e',
                600: '#0d8077',
                700: '#0d6761',
                800: '#0e524e',
                900: '#0f4441',
                950: '#052726'
            }
        },
        {
            name: 'cosmic-fusion',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            palette: {
                0: '#ffffff',
                50: '#fefce8',
                100: '#fef9c3',
                200: '#fef08a',
                300: '#fde047',
                400: '#facc15',
                500: '#fa709a',
                600: '#ca8a04',
                700: '#a16207',
                800: '#854d0e',
                900: '#713f12',
                950: '#422006'
            }
        },
        {
            name: 'midnight-city',
            gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
            palette: {
                0: '#ffffff',
                50: '#f6f6f6',
                100: '#e7e7e7',
                200: '#d1d1d1',
                300: '#b0b0b0',
                400: '#888888',
                500: '#414345',
                600: '#5d5d5d',
                700: '#4f4f4f',
                800: '#454545',
                900: '#232526',
                950: '#0a0a0a'
            }
        },
        {
            name: 'aurora-sky',
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            palette: {
                0: '#ffffff',
                50: '#fef6f9',
                100: '#fdeef4',
                200: '#fcdde9',
                300: '#fbc0d7',
                400: '#f893b8',
                500: '#fed6e3',
                600: '#e93d82',
                700: '#d01f65',
                800: '#ad1d54',
                900: '#901d49',
                950: '#580a28'
            }
        },
        {
            name: 'neon-life',
            gradient: 'linear-gradient(135deg, #b3ffab 0%, #12fff7 100%)',
            palette: {
                0: '#ffffff',
                50: '#ecfffe',
                100: '#cffffc',
                200: '#a5fff9',
                300: '#67fdf5',
                400: '#12fff7',
                500: '#00e1d9',
                600: '#00b3b6',
                700: '#058e92',
                800: '#0b7175',
                900: '#0e5d61',
                950: '#003940'
            }
        }
    ];

    // Màu mặc định
    defaultCustomColor: SurfacesType = {
        name: 'default-blue',
        gradient: 'linear-gradient(135deg, #11189d 0%, #1e3a8a 100%)',
        palette: {
            0: '#ffffff',
            50: '#e8e9f8',
            100: '#d1d3f1',
            200: '#a3a7e3',
            300: '#757bd5',
            400: '#474fc7',
            500: '#11189d',
            600: '#0e147e',
            700: '#0a0f5e',
            800: '#070a3f',
            900: '#03051f',
            950: '#020310'
        }
    };

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            // Thiết lập màu mặc định nếu chưa có
            const currentPrimary = this.layoutService.layoutConfig().primary;
            if (!currentPrimary || currentPrimary === 'blue') {
                this.layoutService.layoutConfig.update((state) => ({ 
                    ...state, 
                    primary: 'default-blue' 
                }));
                this.applyTheme('primary', this.defaultCustomColor);
            }
            
            this.onPresetChange(this.layoutService.layoutConfig().preset);
        }
    }

    surfaces: SurfacesType[] = [
        {
            name: 'slate',
            palette: {
                0: '#ffffff',
                50: '#f8fafc',
                100: '#f1f5f9',
                200: '#e2e8f0',
                300: '#cbd5e1',
                400: '#94a3b8',
                500: '#64748b',
                600: '#475569',
                700: '#334155',
                800: '#1e293b',
                900: '#0f172a',
                950: '#020617'
            }
        },
        {
            name: 'gray',
            palette: {
                0: '#ffffff',
                50: '#f9fafb',
                100: '#f3f4f6',
                200: '#e5e7eb',
                300: '#d1d5db',
                400: '#9ca3af',
                500: '#6b7280',
                600: '#4b5563',
                700: '#374151',
                800: '#1f2937',
                900: '#111827',
                950: '#030712'
            }
        },
        {
            name: 'zinc',
            palette: {
                0: '#ffffff',
                50: '#fafafa',
                100: '#f4f4f5',
                200: '#e4e4e7',
                300: '#d4d4d8',
                400: '#a1a1aa',
                500: '#71717a',
                600: '#52525b',
                700: '#3f3f46',
                800: '#27272a',
                900: '#18181b',
                950: '#09090b'
            }
        },
        {
            name: 'neutral',
            palette: {
                0: '#ffffff',
                50: '#fafafa',
                100: '#f5f5f5',
                200: '#e5e5e5',
                300: '#d4d4d4',
                400: '#a3a3a3',
                500: '#737373',
                600: '#525252',
                700: '#404040',
                800: '#262626',
                900: '#171717',
                950: '#0a0a0a'
            }
        },
        {
            name: 'stone',
            palette: {
                0: '#ffffff',
                50: '#fafaf9',
                100: '#f5f5f4',
                200: '#e7e5e4',
                300: '#d6d3d1',
                400: '#a8a29e',
                500: '#78716c',
                600: '#57534e',
                700: '#44403c',
                800: '#292524',
                900: '#1c1917',
                950: '#0c0a09'
            }
        },
        {
            name: 'soho',
            palette: {
                0: '#ffffff',
                50: '#ececec',
                100: '#dedfdf',
                200: '#c4c4c6',
                300: '#adaeb0',
                400: '#97979b',
                500: '#7f8084',
                600: '#6a6b70',
                700: '#55565b',
                800: '#3f4046',
                900: '#2c2c34',
                950: '#16161d'
            }
        },
        {
            name: 'viva',
            palette: {
                0: '#ffffff',
                50: '#f3f3f3',
                100: '#e7e7e8',
                200: '#cfd0d0',
                300: '#b7b8b9',
                400: '#9fa1a1',
                500: '#87898a',
                600: '#6e7173',
                700: '#565a5b',
                800: '#3e4244',
                900: '#262b2c',
                950: '#0e1315'
            }
        },
        {
            name: 'ocean',
            palette: {
                0: '#ffffff',
                50: '#fbfcfc',
                100: '#F7F9F8',
                200: '#EFF3F2',
                300: '#DADEDD',
                400: '#B1B7B6',
                500: '#828787',
                600: '#5F7274',
                700: '#415B61',
                800: '#29444E',
                900: '#183240',
                950: '#0c1920'
            }
        }
    ];

    selectedPrimaryColor = computed(() => {
        return this.layoutService.layoutConfig().primary;
    });

    selectedSurfaceColor = computed(() => this.layoutService.layoutConfig().surface);

    selectedPreset = computed(() => this.layoutService.layoutConfig().preset);

    menuMode = computed(() => this.layoutService.layoutConfig().menuMode);

    primaryColors = computed<SurfacesType[]>(() => {
        const presetPalette = presets[this.layoutService.layoutConfig().preset as KeyOfType<typeof presets>].primitive;
        const colors = ['emerald', 'green', 'lime', 'orange', 'amber', 'yellow', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
        
        // Bắt đầu với màu gradient hiện đại
        const palettes: SurfacesType[] = [
            this.defaultCustomColor,
            ...this.modernGradientColors,
            { name: 'noir', palette: {} }
        ];

        // Thêm các màu preset truyền thống
        colors.forEach((color) => {
            palettes.push({
                name: color,
                palette: presetPalette?.[color as KeyOfType<typeof presetPalette>] as SurfacesType['palette']
            });
        });

        return palettes;
    });

    onCustomPrimaryColorChange(color: string) {
        if (!this.isValidHexColor(color)) {
            return;
        }

        this.customPrimaryColor.set(true);
        const palette = this.generateColorPalette(color);
        const customColor: SurfacesType = {
            name: 'custom',
            palette: palette
        };

        this.layoutService.layoutConfig.update((state) => ({ ...state, primary: 'custom' }));
        this.applyTheme('primary', customColor);
    }

    onCustomSurfaceColorChange(color: string) {
        if (!this.isValidHexColor(color)) {
            return;
        }

        this.customSurfaceColor.set(true);
        const palette = this.generateColorPalette(color);
        const customSurface: SurfacesType = {
            name: 'custom-surface',
            palette: palette
        };

        this.layoutService.layoutConfig.update((state) => ({ ...state, surface: 'custom-surface' }));
        this.applyTheme('surface', customSurface);
    }

    isValidHexColor(color: string): boolean {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    generateColorPalette(baseColor: string): SurfacesType['palette'] {
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const palette: any = {};
        const shades = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        
        shades.forEach((shade) => {
            let factor: number;
            if (shade === 0) {
                palette['0'] = '#ffffff';
            } else if (shade < 500) {
                factor = (500 - shade) / 500;
                const newR = Math.round(r + (255 - r) * factor);
                const newG = Math.round(g + (255 - g) * factor);
                const newB = Math.round(b + (255 - b) * factor);
                palette[shade.toString()] = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
            } else if (shade === 500) {
                palette['500'] = baseColor;
            } else {
                factor = (shade - 500) / 500;
                const newR = Math.round(r * (1 - factor));
                const newG = Math.round(g * (1 - factor));
                const newB = Math.round(b * (1 - factor));
                palette[shade.toString()] = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
            }
        });

        return palette as SurfacesType['palette'];
    }

    getPresetExt() {
        let color: SurfacesType | undefined;
        
        if (this.customPrimaryColor()) {
            const palette = this.generateColorPalette(this.customPrimaryColorValue);
            color = { name: 'custom', palette: palette };
        } else {
            const primaryColorName = this.selectedPrimaryColor();
            
            // Kiểm tra màu gradient hiện đại
            const gradientColor = this.modernGradientColors.find((c) => c.name === primaryColorName);
            if (gradientColor) {
                color = gradientColor;
            } else if (primaryColorName === 'default-blue') {
                color = this.defaultCustomColor;
            } else {
                color = this.primaryColors().find((c) => c.name === primaryColorName) || {};
            }
        }

        const preset = this.layoutService.layoutConfig().preset;

        if (color.name === 'noir') {
            return {
                semantic: {
                    primary: {
                        50: '{surface.50}',
                        100: '{surface.100}',
                        200: '{surface.200}',
                        300: '{surface.300}',
                        400: '{surface.400}',
                        500: '{surface.500}',
                        600: '{surface.600}',
                        700: '{surface.700}',
                        800: '{surface.800}',
                        900: '{surface.900}',
                        950: '{surface.950}'
                    },
                    colorScheme: {
                        light: {
                            primary: {
                                color: '{primary.950}',
                                contrastColor: '#ffffff',
                                hoverColor: '{primary.800}',
                                activeColor: '{primary.700}'
                            },
                            highlight: {
                                background: '{primary.950}',
                                focusBackground: '{primary.700}',
                                color: '#ffffff',
                                focusColor: '#ffffff'
                            }
                        },
                        dark: {
                            primary: {
                                color: '{primary.50}',
                                contrastColor: '{primary.950}',
                                hoverColor: '{primary.200}',
                                activeColor: '{primary.300}'
                            },
                            highlight: {
                                background: '{primary.50}',
                                focusBackground: '{primary.300}',
                                color: '{primary.950}',
                                focusColor: '{primary.950}'
                            }
                        }
                    }
                }
            };
        } else {
            if (preset === 'Nora') {
                return {
                    semantic: {
                        primary: color.palette,
                        colorScheme: {
                            light: {
                                primary: {
                                    color: '{primary.600}',
                                    contrastColor: '#ffffff',
                                    hoverColor: '{primary.700}',
                                    activeColor: '{primary.800}'
                                },
                                highlight: {
                                    background: '{primary.600}',
                                    focusBackground: '{primary.700}',
                                    color: '#ffffff',
                                    focusColor: '#ffffff'
                                }
                            },
                            dark: {
                                primary: {
                                    color: '{primary.500}',
                                    contrastColor: '{surface.900}',
                                    hoverColor: '{primary.400}',
                                    activeColor: '{primary.300}'
                                },
                                highlight: {
                                    background: '{primary.500}',
                                    focusBackground: '{primary.400}',
                                    color: '{surface.900}',
                                    focusColor: '{surface.900}'
                                }
                            }
                        }
                    }
                };
            } else {
                return {
                    semantic: {
                        primary: color.palette,
                        colorScheme: {
                            light: {
                                primary: {
                                    color: '{primary.500}',
                                    contrastColor: '#ffffff',
                                    hoverColor: '{primary.600}',
                                    activeColor: '{primary.700}'
                                },
                                highlight: {
                                    background: '{primary.50}',
                                    focusBackground: '{primary.100}',
                                    color: '{primary.700}',
                                    focusColor: '{primary.800}'
                                }
                            },
                            dark: {
                                primary: {
                                    color: '{primary.400}',
                                    contrastColor: '{surface.900}',
                                    hoverColor: '{primary.300}',
                                    activeColor: '{primary.200}'
                                },
                                highlight: {
                                    background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                                    focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
                                    color: 'rgba(255,255,255,.87)',
                                    focusColor: 'rgba(255,255,255,.87)'
                                }
                            }
                        }
                    }
                };
            }
        }
    }

    updateColors(event: any, type: string, color: any) {
        if (type === 'primary') {
            this.customPrimaryColor.set(false);
            this.layoutService.layoutConfig.update((state) => ({ ...state, primary: color.name }));
        } else if (type === 'surface') {
            this.customSurfaceColor.set(false);
            this.layoutService.layoutConfig.update((state) => ({ ...state, surface: color.name }));
        }
        this.applyTheme(type, color);

        event.stopPropagation();
    }

    applyTheme(type: string, color: any) {
        if (type === 'primary') {
            updatePreset(this.getPresetExt());
        } else if (type === 'surface') {
            updateSurfacePalette(color.palette);
        }
    }

    onPresetChange(event: any) {
        this.layoutService.layoutConfig.update((state) => ({ ...state, preset: event }));
        const preset = presets[event as KeyOfType<typeof presets>];
        const surfacePalette = this.surfaces.find((s) => s.name === this.selectedSurfaceColor())?.palette;
        $t().preset(preset).preset(this.getPresetExt()).surfacePalette(surfacePalette).use({ useDefaultOptions: true });
    }

    onMenuModeChange(event: string) {
        this.layoutService.layoutConfig.update((prev) => ({ ...prev, menuMode: event }));
    }
}