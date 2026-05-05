import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { mergeStoredProfileWithUser, readStoredRole } from '../utils/stored-user-profile';

@Injectable({
  providedIn: 'root'
})
export class AdminProfileGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): boolean | Observable<boolean> {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return false;
    }

    const role = readStoredRole();
    if (role === 'admin') {
      return true;
    }
    if (role === 'user') {
      this.router.navigate(['/profile']);
      return false;
    }

    return this.auth.getUserDetails().pipe(
      map((res: any) => {
        const u = res?.user;
        mergeStoredProfileWithUser(u);
        const r = (u?.role || 'user').toString().toLowerCase();
        if (r === 'admin') {
          return true;
        }
        this.router.navigate(['/profile']);
        return false;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
