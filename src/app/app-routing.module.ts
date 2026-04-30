import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingComponent } from './features/landing/landing/landing.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';
import { BudgetGuard } from './core/guards/budget.guard';
import { BudgetComponent } from './features/budget/budget.component';

const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  {path: '' , component: LandingComponent},
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