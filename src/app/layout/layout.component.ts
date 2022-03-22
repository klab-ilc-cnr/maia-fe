import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  animations: [
    trigger('submenu', [
        state('hidden', style({
            height: '0px'
        })),
        state('visible', style({
            height: '*'
        })),
        transition('visible => hidden', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
        transition('hidden => visible', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'))
    ])
]
})
export class LayoutComponent implements OnInit {
  public menuInactiveDesktop: boolean | undefined;

  public menuActiveMobile: boolean | undefined;

  public overlayMenuActive: boolean | undefined;

  public staticMenuInactive: boolean = false;

  documentClickListener: (() => void) | undefined;

  menuClick: boolean | undefined;

  menuMode = 'static';

  constructor(public renderer: Renderer2) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    // hides the overlay menu and top menu if outside is clicked
    this.documentClickListener = this.renderer.listen('body', 'click', (event) => {
      if (!this.isDesktop()) {
        if (!this.menuClick) {
            this.menuActiveMobile = false;
        }

        // if (!this.topMenuButtonClick) {
        //     this.hideTopMenu();
        // }
      }
      else {
        if (!this.menuClick && this.isOverlay()) {
            this.menuInactiveDesktop = true;
        }
        if (!this.menuClick){
            this.overlayMenuActive = false;
        }
      }

      // if (this.configActive && !this.configClick) {
      //   this.configActive = false;
      // }

      // this.configClick = false;
      this.menuClick = false;
      // this.topMenuButtonClick = false;
    });
  }

  toggleMenu(event: Event) {
    this.menuClick = true;

    if (this.isDesktop()) {
      if (this.menuMode === 'overlay') {
        if(this.menuActiveMobile === true) {
            this.overlayMenuActive = true;
        }

        this.overlayMenuActive = !this.overlayMenuActive;
        this.menuActiveMobile = false;
      }
      else if (this.menuMode === 'static') {
        this.staticMenuInactive = !this.staticMenuInactive;
      }
    }
    else {
      this.menuActiveMobile = !this.menuActiveMobile;
      // this.topMenuActive = false;
    }

    event.preventDefault();
  }

  isDesktop() {
    return window.innerWidth > 992;
  }

  isMobile(){
    return window.innerWidth < 1024;
  }

  isStatic() {
    return this.menuMode === 'static';
  }

  isOverlay() {
    return this.menuMode === 'overlay';
  }
}
