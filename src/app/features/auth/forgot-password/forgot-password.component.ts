import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f(): Record<string, any> {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.toastr.error('Enter a valid email address');
      return;
    }
    this.loading = true;
    this.auth.requestPasswordReset(this.form.value.email.trim()).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || 'Check your email for the next step.');
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Could not start password reset.');
        this.loading = false;
      }
    });
  }
}
