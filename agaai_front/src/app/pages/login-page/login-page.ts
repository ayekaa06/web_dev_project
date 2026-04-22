import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule],
templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPage {
  mode: 'login' | 'register' = 'login';
  formData = {
    username: '',
    email: '',
    password: '',
    confirm: '',
    peers: [],
    social: []
  };
  message = signal<string>('');
  authService = inject(AuthService);

  constructor(private router: Router) {}

  switchMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.message.set('');
  }

  submit() {
    this.message.set('');

    if (this.mode === 'login') {
      if (!this.formData.email || !this.formData.password) {
        this.message.set('Введите email и пароль');
        return;
      }
      
      // localStorage.setItem('auth_token', 'demo-token');
      // localStorage.setItem('user_email', this.formData.email);
      console.log('Attempting login with:', this.formData);
      this.authService.login(this.formData).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {          
          this.message.set('Ошибка входа: ' + (err.error?.message || err.statusText) + ' ' + err);
        }
      });      
      return;
    }

    if (!this.formData.username || !this.formData.email || !this.formData.password || !this.formData.confirm) {
      this.message.set('Заполните все поля для регистрации');
      return;
    }

    if (this.formData.password !== this.formData.confirm) {
      this.message.set('Пароли не совпадают');
      return;
    }

    this.authService.register(this.formData).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {          
          this.message.set('Ошибка регистрации: ' + (err.error?.message || err.statusText) + ' ' + JSON.stringify(err));
        }
      });

    // localStorage.setItem('auth_token', 'demo-token');
    // localStorage.setItem('user_email', this.formData.email);

    this.router.navigate(['/']);
  }
}
