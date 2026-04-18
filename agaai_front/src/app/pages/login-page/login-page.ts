import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPage {
  mode: 'login' | 'register' = 'login';
  formData = {
    name: '',
    email: '',
    password: '',
    confirm: ''
  };
  message = '';

  constructor(private router: Router) {}

  switchMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.message = '';
  }

  submit() {
    this.message = '';

    if (this.mode === 'login') {
      if (!this.formData.email || !this.formData.password) {
        this.message = 'Введите email и пароль';
        return;
      }

      localStorage.setItem('auth_token', 'demo-token');
      localStorage.setItem('user_email', this.formData.email);
      this.router.navigate(['/']);
      return;
    }

    if (!this.formData.name || !this.formData.email || !this.formData.password || !this.formData.confirm) {
      this.message = 'Заполните все поля для регистрации';
      return;
    }

    if (this.formData.password !== this.formData.confirm) {
      this.message = 'Пароли не совпадают';
      return;
    }

    localStorage.setItem('auth_token', 'demo-token');
    localStorage.setItem('user_email', this.formData.email);
    this.router.navigate(['/']);
  }
}
