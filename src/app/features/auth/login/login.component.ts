import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetService } from 'src/app/core/services/budget.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private budgetService: BudgetService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f(): any {
    return this.form.controls;
  }

 onSubmit() {
  this.submitted = true;

  if (this.form.invalid) {
    this.toastr.error('Please enter valid credentials');
    return;
  }

  this.loading = true;

  this.auth.login(this.form.value).subscribe({
    next: (loginRes: any) => {

      // TOKEN SAVE (correct place)
      if (loginRes?.accessToken) {
        localStorage.setItem('token', loginRes.accessToken);
      }
       if (loginRes?.userdetails?.id) {
        localStorage.setItem('userId', JSON.stringify(loginRes.userdetails.id));
      }
      const ud = loginRes?.userdetails;
      const role = (ud?.role || 'user').toString().toLowerCase();
      if (ud?.name != null && ud?.email != null) {
        localStorage.setItem(
          'userProfile',
          JSON.stringify({
            name: ud.name,
            email: ud.email,
            mobile: ud.mobile ?? '',
            role
          })
        );
      }

      const goDashboard = () => {
        this.router.navigate(['/dashboard']);
        this.toastr.success('Login successful 🎉');
        this.loading = false;
      };

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (
        returnUrl &&
        returnUrl.startsWith('/') &&
        !returnUrl.startsWith('//') &&
        !returnUrl.includes('://')
      ) {
        this.router.navigateByUrl(returnUrl);
        this.toastr.success('Login successful 🎉');
        this.loading = false;
        return;
      }

      if (role === 'admin') {
        goDashboard();
        return;
      }

      this.budgetService.getCurrentBudget().subscribe({
        next: (budgetRes: any) => {
          if (budgetRes && budgetRes.amount_limit) {
            goDashboard();
          } else {
            this.router.navigate(['/budget']);
            this.toastr.success('Login successful 🎉');
            this.loading = false;
          }
        },
        error: () => {
          this.router.navigate(['/budget']);
          this.toastr.success('Login successful 🎉');
          this.loading = false;
        }
      });
    },

    error: (err) => {
      this.toastr.error(err.error?.message || 'Login failed');
      this.loading = false;
    }
  });
}
}