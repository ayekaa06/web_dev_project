import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastMessage {
  id: number;
  message: string;
  type: string;
}

let toastInstance: Toast;

export function showToast(message: string, type: string = 'success') {
  if (toastInstance) toastInstance.show(message, type);
}

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast {
  toasts: ToastMessage[] = [];

  constructor() { toastInstance = this; }

  show(message: string, type: string = 'success') {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 3000);
  }
}
