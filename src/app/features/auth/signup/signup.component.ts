import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { indianMobileValidator } from 'src/app/shared/validators/indian-mobile.validator';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;

  emailOtpPanelOpen = false;
  emailOtpSending = false;
  emailOtpVerifying = false;
  emailVerified = false;
  emailOtpToken: string | null = null;

  mobileOtpPanelOpen = false;
  mobileOtpSending = false;
  mobileOtpVerifying = false;
  mobileVerified = false;
  mobileOtpToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, indianMobileValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      emailOtp: [''],
      mobileOtp: ['']
    }, { validators: this.matchPassword });

    this.form.get('email')?.valueChanges.subscribe(() => {
      this.emailVerified = false;
      this.emailOtpToken = null;
      this.emailOtpPanelOpen = false;
      this.form.patchValue({ emailOtp: '' }, { emitEvent: false });
    });

    this.form.get('mobile')?.valueChanges.subscribe(() => {
      this.mobileVerified = false;
      this.mobileOtpToken = null;
      this.mobileOtpPanelOpen = false;
      this.form.patchValue({ mobileOtp: '' }, { emitEvent: false });
    });
  }

  matchPassword(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  get f(): Record<string, any> {
    return this.form.controls;
  }

  sendEmailOtp(): void {
    const email = (this.form.get('email')?.value || '').trim();
    if (!email || this.form.get('email')?.invalid) {
      this.form.get('email')?.markAsTouched();
      this.toastr.error('Enter a valid email first');
      return;
    }
    this.emailOtpSending = true;
    this.auth.sendSignupEmailOtp(email).subscribe({
      next: (res: any) => {
        if (res?.devOtp) {
          this.form.patchValue({ emailOtp: String(res.devOtp) }, { emitEvent: false });
          this.toastr.info(
            `Your code is ${res.devOtp}. It is filled in the OTP box. Remove OTP_DEV_DISPLAY on the server to send real email.`,
            'Dev OTP mode',
            { timeOut: 90000 }
          );
        } else {
          this.toastr.success(res?.message || 'Code sent. Check your inbox.');
        }
        this.emailOtpPanelOpen = true;
        this.emailOtpSending = false;
      },
      error: (err: any) => {
        const body = err?.error;
        const msg = [body?.message, body?.hint].filter(Boolean).join(' — ') || 'Could not send email code';
        if (err?.status === 429) {
          this.toastr.warning(msg);
        } else {
          this.toastr.error(msg);
        }
        this.emailOtpSending = false;
      }
    });
  }

  verifyEmailOtpDone(): void {
    const email = (this.form.get('email')?.value || '').trim();
    const code = (this.form.get('emailOtp')?.value || '').trim();
    if (!code || code.length < 6) {
      this.toastr.error('Enter the 6-digit code from your email');
      return;
    }
    this.emailOtpVerifying = true;
    this.auth.verifySignupEmailOtp({ email, code }).subscribe({
      next: (res: any) => {
        this.emailOtpToken = res?.verificationToken ?? null;
        this.emailVerified = !!this.emailOtpToken;
        this.emailOtpPanelOpen = false;
        this.form.patchValue({ emailOtp: '' }, { emitEvent: false });
        this.toastr.success(res?.message || 'Email verified');
        this.emailOtpVerifying = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Invalid code');
        this.emailOtpVerifying = false;
      }
    });
  }

  sendMobileOtp(): void {
    if (!this.emailVerified) {
      this.toastr.error('Verify your email first, then request a mobile code.');
      return;
    }
    const email = (this.form.get('email')?.value || '').trim();
    const mobile = this.form.get('mobile')?.value;
    if (this.form.get('mobile')?.invalid) {
      this.form.get('mobile')?.markAsTouched();
      this.toastr.error('Enter a valid mobile number');
      return;
    }
    this.mobileOtpSending = true;
    this.auth.sendSignupMobileOtp({ email, mobile }).subscribe({
      next: (res: any) => {
        if (res?.devOtp) {
          this.form.patchValue({ mobileOtp: String(res.devOtp) }, { emitEvent: false });
          this.toastr.info(
            `Your code is ${res.devOtp}. It is filled in the OTP box. Remove OTP_DEV_DISPLAY on the server to send real email.`,
            'Dev OTP mode',
            { timeOut: 90000 }
          );
        } else {
          this.toastr.success(res?.message || 'Code sent to your email.');
        }
        this.mobileOtpPanelOpen = true;
        this.mobileOtpSending = false;
      },
      error: (err: any) => {
        const body = err?.error;
        const msg = [body?.message, body?.hint].filter(Boolean).join(' — ') || 'Could not send mobile code';
        if (err?.status === 429) {
          this.toastr.warning(msg);
        } else {
          this.toastr.error(msg);
        }
        this.mobileOtpSending = false;
      }
    });
  }

  verifyMobileOtpDone(): void {
    const mobile = this.form.get('mobile')?.value;
    const code = (this.form.get('mobileOtp')?.value || '').trim();
    if (!code || code.length < 6) {
      this.toastr.error('Enter the 6-digit code (check your email)');
      return;
    }
    this.mobileOtpVerifying = true;
    this.auth.verifySignupMobileOtp({ mobile, code }).subscribe({
      next: (res: any) => {
        this.mobileOtpToken = res?.verificationToken ?? null;
        this.mobileVerified = !!this.mobileOtpToken;
        this.mobileOtpPanelOpen = false;
        this.form.patchValue({ mobileOtp: '' }, { emitEvent: false });
        this.toastr.success(res?.message || 'Mobile verified');
        this.mobileOtpVerifying = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Invalid code');
        this.mobileOtpVerifying = false;
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.toastr.error('Please fill all fields correctly');
      return;
    }
    if (!this.emailVerified || !this.mobileVerified || !this.emailOtpToken || !this.mobileOtpToken) {
      this.toastr.error('Verify your email and mobile with OTP before signing up.');
      return;
    }

    this.loading = true;
    const { name, email, mobile, password } = this.form.value;

    this.auth
      .signup({
        name,
        email,
        mobile,
        password,
        emailOtpToken: this.emailOtpToken,
        mobileOtpToken: this.mobileOtpToken
      })
      .subscribe({
        next: () => {
          this.toastr.success('Signup successful 🎉');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Signup failed');
          this.loading = false;
        }
      });
  }
}
