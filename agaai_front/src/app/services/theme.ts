import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(true);

  toggle() {
    this.isDark.set(!this.isDark());
  }

  get bg() { return this.isDark() ? '#020617' : '#f1f5f9'; }
  get text() { return this.isDark() ? '#fff' : '#0f172a'; }
  get nav() { return this.isDark() ? '#0f172a' : '#fff'; }
  get border() { return this.isDark() ? '#1e293b' : '#e2e8f0'; }
  get card() { return this.isDark() ? 'rgba(30,41,59,0.6)' : '#fff'; }
  get input() { return this.isDark() ? '#1e293b' : '#fff'; }
  get block() { return this.isDark() ? '#1e293b' : '#fff'; }
  get subtext() { return this.isDark() ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'; }
}
