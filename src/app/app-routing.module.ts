import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingComponent } from './features/landing/landing/landing.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';
import { BudgetGuard } from './core/guards/budget.guard';
import { BudgetComponent } from './features/budget/budget.component';
import { ProfileComponent } from './features/auth/profile/profile.component';
import { ProfileDashboardComponent } from './features/auth/profile-dashboard/profile-dashboard.component';
import { AdminProfileComponent } from './features/auth/admin-profile/admin-profile.component';
import { AdminProfileGuard } from './core/guards/admin-profile.guard';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'landing' },

  { path: 'landing', component: LandingComponent },

  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
// { path: 'dashboard/page/:page', component: DashboardComponent },
{ 
  path: 'dashboard/page/:page', 
  component: DashboardComponent,
  canActivate: [AuthGuard]
},

  // 🔐 Protected Route
  {
    path : 'budget',
    component : BudgetComponent,
    canActivate: [AuthGuard ] 
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard ]  
  },
  {
    path: 'profile/edit',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileDashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin-profile',
    component: AdminProfileComponent,
    canActivate: [AuthGuard, AdminProfileGuard]
  },

  { path: '**', redirectTo: 'landing' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes ,{
      scrollPositionRestoration: 'top',   // 🔥 THIS LINE FIXES IT
      anchorScrolling: 'enabled'
    })],
  exports: [RouterModule]
})
export class AppRoutingModule {}