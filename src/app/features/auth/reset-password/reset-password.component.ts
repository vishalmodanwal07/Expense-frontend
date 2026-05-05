import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.css']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  submitted = false;
  loading = false;
  token = '';
  private sub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.matchPassword }
    );

    this.sub = this.route.queryParams.subscribe((params) => {
      this.token = (params['token'] || '').trim();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  matchPassword(group: FormGroup): { mismatch: true } | null {
    const a = group.get('newPassword')?.value;
    const b = group.get('confirmPassword')?.value;
    return a === b ? null : { mismatch: true };
  }

  get f(): Record<string, any> {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.token) {
      this.toastr.error('This page needs a valid link from your email. Request a new reset from login.');
      return;
    }
    if (this.form.invalid) {
      if (this.form.errors?.['mismatch']) {
        this.toastr.error('Passwords do not match');
      } else {
        this.toastr.error('Password must be at least 6 characters');
      }
      return;
    }

    this.loading = true;
    const newPassword = (this.form.value.newPassword || '').trim();
    this.auth.resetPasswordWithToken({ token: this.token, newPassword }).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || 'Password updated. You can sign in now.');
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Could not reset password.');
        this.loading = false;
      }
    });
  }
}
