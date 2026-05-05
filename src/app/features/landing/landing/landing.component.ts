import { Component, OnInit } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
   options: AnimationOptions = {
    path: 'assets/Business Analytics.json'
  };

  constructor() { }

  ngOnInit(): void {
  }

  /** Hide hero sign-up CTAs when already authenticated. */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

}
