import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/services/auth.service';
import { mergeStoredProfileWithUser, readStoredRole } from 'src/app/core/utils/stored-user-profile';

@Component({
  selector: 'app-profile-dashboard',
  templateUrl: './profile-dashboard.component.html',
  styleUrls: ['./profile-dashboard.component.css']
})
export class ProfileDashboardComponent implements OnInit {
  loading = false;
  nameDisplay = '';
  emailDisplay = '';
  mobileDisplay = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.auth.getUserDetails().subscribe({
      next: (res: any) => {
        const u = res?.user;
        if (u) {
          mergeStoredProfileWithUser(u);
          this.nameDisplay = u.name ?? '';
          this.emailDisplay = u.email ?? '';
          this.mobileDisplay = u.mobile ?? '';
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Could not load your account.');
      }
    });
  }

  goExpenseDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goEditAccount(): void {
    this.router.navigate(['/profile/edit']);
  }

  /** Admins use the same edit screen; overview for admin is admin hub. */
  get isAdmin(): boolean {
    return (readStoredRole() || '').toLowerCase() === 'admin';
  }

  goAdminOverview(): void {
    this.router.navigate(['/admin-profile']);
  }
}
