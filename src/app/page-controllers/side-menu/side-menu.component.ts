import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit {
  faChevronDown = faChevronDown;
  faChevronLeft = faChevronLeft;
  display: any;

  public currentPath: string[] = [''];

  constructor(
    private router: Router
  ) {
    router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(evt => this.onNavigate((<NavigationEnd>evt).urlAfterRedirects));
  }

  ngOnInit(): void {
  }

  public get canManageUsers(): boolean {
    return true;
    //return this.authorizationService.canManageUsers();
  }

  public isActive(urls: string[]): boolean {
    var isActive = false;
    urls.forEach(url => {
      if (this.isActiveInternal(url)) {
        isActive = true;
        return;
      }
    });

    return isActive;
  }

  public isActiveInternal(url: string): boolean {
    const requiredPath = url.split("/") || [''];
    for (let i = 0; i < requiredPath.length; i++) {
      if ((this.currentPath.length <= i) ||
        (requiredPath[i].toLowerCase() != this.currentPath[i].toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  public onNavigate(url: string) {
    const withoutLeadingSlash = url.startsWith("/") ? url.substr(1) : url;
    const withoutLeadingEndingSlash = url.endsWith("/") ? url.slice(0, -1) : withoutLeadingSlash;
    this.currentPath = withoutLeadingEndingSlash.split("/");
  }

}
