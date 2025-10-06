import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `
      <div class="layout-footer">
        <a href="https://www.evngenco1.vn" target="_blank" rel="noopener noreferrer" 
           class="text-primary hover:underline"
           style="font-family: 'HelveticaBlackVU'; font-size: 12px; font-weight: bold;">
          AI HUB -
          <span style="margin-left: 4px;">
            <span style="color: #164397;">EVN</span>
            <span style="color: #ed1c24;"><i>GENCO1</i></span>
          </span>
        </a>
      </div>
    `
})
export class AppFooter {}