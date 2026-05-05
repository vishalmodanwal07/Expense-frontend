import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css']
})
export class AdminProfileComponent implements OnInit {
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
          this.nameDisplay = u.name ?? '';
          this.emailDisplay = u.email ?? '';
          this.mobileDisplay = u.mobile ?? '';
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Could not load admin profile.');
      }
    });
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  editProfile(): void {
    this.router.navigate(['/profile/edit']);
  }
}
