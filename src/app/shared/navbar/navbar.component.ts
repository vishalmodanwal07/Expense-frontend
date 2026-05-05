import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatMenuTrigger } from '@angular/material/menu';
import { AuthService } from 'src/app/core/services/auth.service';
import { mergeStoredProfileWithUser } from 'src/app/core/utils/stored-user-profile';

const THEME_STORAGE_KEY = 'appTheme';
const LEGACY_THEME_KEY = 'dashboardTheme';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  @ViewChild('mobileNavMenuTrigger') private mobileNavMenuTrigger?: MatMenuTrigger;
  @ViewChild('desktopProfileMenuTrigger')
  private desktopProfileMenuTrigger?: MatMenuTrigger;

  constructor(
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  isDarkTheme = false;
  userName = '';
  userEmail = '';
  userMobile = '';

  ngOnInit(): void {
    const saved =
      localStorage.getItem(THEME_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_THEME_KEY);
    this.isDarkTheme = saved === 'dark';
    this.applyThemeClass();
    this.hydrateProfileFromStorage();
    this.loadUserForNav();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.loadUserForNav();
        this.cdr.detectChanges();
      });
  }

  /** Current path without query, hash, or trailing slash (reliable for route checks). */
  private normalizedPath(): string {
    let p = this.router.url.split('?')[0].split('#')[0];
    if (p.length > 1 && p.endsWith('/')) {
      p = p.slice(0, -1);
    }
    return p || '/';
  }

  private isLandingRoute(): boolean {
    const p = this.normalizedPath();
    return p === '/' || p === '/landing';
  }

  get userInitials(): string {
    const n = (this.userName || '').trim();
    if (!n) {
      return '?';
    }
    return n.charAt(0).toUpperCase();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem(
      THEME_STORAGE_KEY,
      this.isDarkTheme ? 'dark' : 'light'
    );
    this.applyThemeClass();
  }

  /** Close the mobile drawer menu (Material keeps it open on non-navigation items). */
  closeMobileNav(): void {
    queueMicrotask(() => this.mobileNavMenuTrigger?.closeMenu());
  }

  private applyThemeClass(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Login control only on the marketing home (landing), not on login/signup
   * or the rest of the app.
   */
  showLoginNav(): boolean {
    if (this.isLoggedIn()) {
      return false;
    }
    return this.isLandingRoute();
  }

  /** Account menu whenever a session exists. */
  showProfileMenu(): boolean {
    return this.isLoggedIn();
  }

  /**
   * Top-level Dashboard link: on landing, always (guests hit AuthGuard → login
   * with returnUrl). Elsewhere, only when signed in.
   */
  showDashboardNavLink(): boolean {
    if (this.isLandingRoute()) {
      return true;
    }
    return this.isLoggedIn();
  }

  private hydrateProfileFromStorage(): void {
    try {
      const raw = localStorage.getItem('userProfile');
      if (!raw) {
        return;
      }
      const u = JSON.parse(raw);
      this.userName = u?.name ?? '';
      this.userEmail = u?.email ?? '';
      this.userMobile = u?.mobile ?? '';
    } catch {
      /* ignore */
    }
  }

  private loadUserForNav(): void {
    if (!this.isLoggedIn()) {
      return;
    }
    this.auth.getUserDetails().subscribe({
      next: (res: any) => {
        const u = res?.user;
        if (u) {
          this.userName = u.name ?? '';
          this.userEmail = u.email ?? '';
          this.userMobile = u.mobile ?? '';
          mergeStoredProfileWithUser(u);
        }
      },
      error: () => {
        this.hydrateProfileFromStorage();
      }
    });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  /** Open the account edit form (after menu closes). */
  goToEditProfilePage(): void {
    this.navigateFromMenu('/profile/edit');
  }

  private navigateFromMenu(url: string): void {
    const go = (): void => {
      void this.router.navigateByUrl(url);
    };

    let navigated = false;
    const safeGo = (): void => {
      if (navigated) {
        return;
      }
      navigated = true;
      go();
    };

    const trig =
      this.desktopProfileMenuTrigger?.menuOpen
        ? this.desktopProfileMenuTrigger
        : this.mobileNavMenuTrigger?.menuOpen
          ? this.mobileNavMenuTrigger
          : undefined;

    if (trig) {
      const sub = trig.menuClosed.subscribe(() => {
        sub.unsubscribe();
        safeGo();
      });
      window.setTimeout(() => {
        sub.unsubscribe();
        safeGo();
      }, 280);
      return;
    }

    window.setTimeout(safeGo, 0);
  }
}
