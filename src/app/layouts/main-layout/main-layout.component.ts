import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, Renderer2 } from '@angular/core';

/**Classe che rappresenta il layout principale */
@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
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
export class MainLayoutComponent implements OnInit {

  /**Definisce se il menu desktop è inattivo */ //TODO verificarne uso, viene inizializzato nel componente ma poi non sembra utilizzato per controlli
  public menuInactiveDesktop: boolean | undefined;

  /**Definisce se è attivo il menu per dispositivi mobili */
  public menuActiveMobile: boolean | undefined;

  /**Definisce se il menu in overlay è attivo */
  public overlayMenuActive: boolean | undefined;

  /**Definisce se il menu statico è chiuso */
  public staticMenuInactive: boolean = false;

  /**Definisce se il menu in alto è attivo */
  public topMenuActive: boolean | undefined;

  /**Definisce se lasciamo il menu in alto (?) */
  public topMenuLeaving: boolean | undefined;

  /**Proprietà per la gestione dei click sul documento */
  documentClickListener: (() => void) | undefined;

  /**Definisce se vi è stato un click sul menu */
  menuClick: boolean | undefined;

  /**Tipologia di menu in uso */
  menuMode = 'static';

  /**Definisce se vi è stato un click sul menu in alto */
  topMenuButtonClick: boolean | undefined;

  /**
   * Costruttore per MainLayoutComponent
   * @param renderer {Renderer2} classe di base per implementare rendering personalizzati
   */
  constructor(public renderer: Renderer2) { }

  /**Metodo dell'interfaccia OnInit */ //TODO valutare rimozione per mancato uso
  ngOnInit(): void {
  }

  /**Metodo dell'interfaccia AfterViewInit, utilizzato per la gestione dei click sul documento */
  ngAfterViewInit() {
    // hides the overlay menu and top menu if outside is clicked
    this.documentClickListener = this.renderer.listen('body', 'click', (event) => {
      if (!this.isDesktop()) {
        if (!this.menuClick) {
            this.menuActiveMobile = false;
        }

        if (!this.topMenuButtonClick) {
            this.hideTopMenu();
        }
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
      this.topMenuButtonClick = false;
    });
  }

  /**
   * Metodo che visualizza o nasconde il menu laterale
   * @param event {Event} evento emesso per attivare/disattiva il sidemenu
   */
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
      this.topMenuActive = false;
    }

    event.preventDefault();
  }

  /**
   * Metodo che visualizza o nasconde il menu in alto
   * @param event {Event} evento emesso per attivare/disattivare il menu in alto
   */
  toggleTopMenu(event: Event) {
    this.topMenuButtonClick = true;
    this.menuActiveMobile = false;

    if (this.topMenuActive) {
        this.hideTopMenu();
    } else {
        this.topMenuActive = true;
    }

    event.preventDefault();
  }

  /**Metodo che nasconde il menu in alto */
  hideTopMenu() {
    this.topMenuLeaving = true;
    setTimeout(() => {
      this.topMenuActive = false;
      this.topMenuLeaving = false;
    }, 1);
  }

  /**Metodo che salva il click sul menu */
  onMenuClick() {
    this.menuClick = true;
  }

  /**Metodo che valuta la dimensione dello schermo per definire se la pagina è in modalità desktop */
  isDesktop() {
    return window.innerWidth > 992;
  }

  /**Metodo che valuta la dimensione dello schermo per definire se la pagina è in modalità mobile */
  isMobile(){
    return window.innerWidth < 1024;
  }

  /**Metodo che verifica se il menu è in modalità statica */
  isStatic() {
    return this.menuMode === 'static';
  }

  /**Metodo che verifica se il menu è in modalità overlay */
  isOverlay() {
    return this.menuMode === 'overlay';
  }
}
