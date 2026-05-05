import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HttpClientModule} from "@angular/common/http"
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { ReactiveFormsModule } from '@angular/forms';
import { LandingModule } from './features/landing/landing.module';
import { AuthModule } from './features/auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { LottieModule } from 'ngx-lottie';
import * as player from 'lottie-web';
import { BudgetComponent } from './features/budget/budget.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { MatPaginatorModule } from '@angular/material/paginator';



export function playerFactory() : any {
  return player;
}

@NgModule({
  declarations: [
    AppComponent,
    BudgetComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
   LottieModule.forRoot({ player: playerFactory }),
     ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot(),
     LandingModule,
     AuthModule,
     SharedModule,
     DashboardModule,
      MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
     MatPaginatorModule
  ],
  providers: [
    {
      provide : HTTP_INTERCEPTORS,
      useClass : AuthInterceptor,
      multi : true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
