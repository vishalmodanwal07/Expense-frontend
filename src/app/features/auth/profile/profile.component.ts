import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/services/auth.service';
import {
  mergeStoredProfileWithUser,
  profileRouteForRole,
  readStoredRole
} from 'src/app/core/utils/stored-user-profile';
import { indianMobileValidator } from 'src/app/shared/validators/indian-mobile.validator';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  saving = false;
  /** Shown read-only; not part of the editable form. */
  emailDisplay = '';

  /** Account overview (profile dashboard or admin hub). */
  get accountOverviewPath(): string {
    return profileRouteForRole(readStoredRole());
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      mobile: ['', [Validators.required, indianMobileValidator]],
      newPassword: [''],
      confirmPassword: ['']
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.auth.getUserDetails().subscribe({
      next: (res: any) => {
        const u = res?.user;
        if (u) {
          mergeStoredProfileWithUser(u);
          this.form.patchValue({
            name: u.name ?? '',
            mobile: u.mobile ?? ''
          });
          this.emailDisplay = u.email ?? '';
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Could not load your profile.');
      }
    });
  }

  save(): void {
    if (this.form.get('name')?.invalid || this.form.get('mobile')?.invalid) {
      this.form.get('name')?.markAsTouched();
      this.form.get('mobile')?.markAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const newPwd = (raw.newPassword || '').trim();
    const confirm = (raw.confirmPassword || '').trim();

    if (newPwd) {
      if (newPwd.length < 6) {
        this.form.get('newPassword')?.markAsTouched();
        return;
      }
      if (newPwd !== confirm) {
        this.toastr.error('New password and confirmation do not match.');
        this.form.get('confirmPassword')?.markAsTouched();
        return;
      }
    }

    this.saving = true;
    const payload: { name: string; mobile: string; newPassword?: string } = {
      name: (raw.name || '').trim(),
      mobile: (raw.mobile || '').trim()
    };

    if (newPwd) {
      payload.newPassword = newPwd;
    }

    this.auth.updateProfile(payload).subscribe({
      next: (res: any) => {
        const u = res?.user;
        mergeStoredProfileWithUser(u);
        this.form.patchValue({
          newPassword: '',
          confirmPassword: ''
        });
        this.toastr.success('Profile saved.');
        this.saving = false;
        this.router.navigate([profileRouteForRole(u?.role ?? readStoredRole())]);
      },
      error: (err) => {
        this.saving = false;
        this.toastr.error(err.error?.message || 'Could not save profile.');
      }
    });
  }

  cancel(): void {
    this.router.navigate([profileRouteForRole(readStoredRole())]);
  }
}
