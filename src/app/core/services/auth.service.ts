import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  signup(data: any) {
    return this.http.post(`${this.baseUrl}/signup`, data);
  }

  sendSignupEmailOtp(email: string) {
    return this.http.post(`${this.baseUrl}/signup/email-otp/send`, { email });
  }

  verifySignupEmailOtp(body: { email: string; code: string }) {
    return this.http.post(`${this.baseUrl}/signup/email-otp/verify`, body);
  }

  sendSignupMobileOtp(body: { email: string; mobile: string }) {
    return this.http.post(`${this.baseUrl}/signup/mobile-otp/send`, body);
  }

  verifySignupMobileOtp(body: { mobile: string; code: string }) {
    return this.http.post(`${this.baseUrl}/signup/mobile-otp/verify`, body);
  }

  login(data: any) {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

logout() {
  return this.http.delete(`${this.baseUrl}/logout`, {
    withCredentials: true  
  });
}

getUserDetails(){
    return this.http.get(`${this.baseUrl}/profile`);
  }

  updateProfile(payload: { name: string; mobile: string; newPassword?: string }) {
    return this.http.patch(`${this.baseUrl}/profile`, payload);
  }

  requestPasswordReset(email: string) {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPasswordWithToken(body: { token: string; newPassword: string }) {
    return this.http.post(`${this.baseUrl}/reset-password`, body);
  }
}