import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';
import { JsPanelWindowsAdapter } from './jspanel-windows.adapter';
import { TaskbarWindow, TaskbarWindowType, TaskbarWindowsSource } from './taskbar-window.model';

/** Icona (PrimeIcons) di ciascun tipo di finestra. */
const ICONS: Record<TaskbarWindowType, string> = {
  corpus: 'pi-folder-open',
  text: 'pi-file',
  lexicon: 'pi-list',
  lexiconEdit: 'pi-pencil',
  search: 'pi-search',
  dictionary: 'pi-book',
  dictionaryEdit: 'pi-file-edit',
  ontology: 'pi-sitemap',
  ontologyView: 'pi-share-alt',
  other: 'pi-window-maximize'
};

/**
 * Barra in basso con le finestre aperte del workspace, come la barra delle applicazioni di un window manager:
 * clic = ripristina / porta davanti / minimizza; tasto destro = menu (ripristina o minimizza, ingrandisci, chiudi).
 */
@Component({
  selector: 'app-workspace-taskbar',
  templateUrl: './workspace-taskbar.component.html',
  styleUrls: ['./workspace-taskbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class WorkspaceTaskbarComponent implements OnInit, OnDestroy {
  @ViewChild('menu') menu?: ContextMenu;

  windows: TaskbarWindow[] = [];
  menuItems: MenuItem[] = [];

  private source: TaskbarWindowsSource = new JsPanelWindowsAdapter(this.zone);
  private stopWatching?: () => void;

  constructor(private zone: NgZone, private cd: ChangeDetectorRef, private translate: TranslateService) { }

  ngOnInit(): void {
    this.stopWatching = this.source.watch(windows => {
      this.windows = windows;
      this.cd.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.stopWatching?.();
  }

  icon(w: TaskbarWindow): string { return ICONS[w.type]; }

  trackById(_: number, w: TaskbarWindow) { return w.id; }

  onClick(w: TaskbarWindow) { this.source.toggle(w.id); }

  onContextMenu(event: MouseEvent, w: TaskbarWindow) {
    event.preventDefault();
    const t = (key: string) => this.translate.instant('TASKBAR.' + key);
    this.menuItems = [
      w.state === 'minimized' || !w.active
        ? { label: t('restore'), icon: 'pi pi-window-restore', command: () => this.source.toggle(w.id) }
        : { label: t('minimize'), icon: 'pi pi-window-minimize', command: () => this.source.minimize(w.id) },
      { label: t('maximize'), icon: 'pi pi-window-maximize', disabled: w.state === 'maximized', command: () => this.source.maximize(w.id) },
      { separator: true },
      { label: t('close'), icon: 'pi pi-times', command: () => this.source.close(w.id) }
    ];
    this.cd.detectChanges();
    this.menu?.show(event);
  }
}
