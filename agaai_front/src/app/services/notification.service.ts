import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class NotificationService {
  showDebugError(message: string): void {
    // e.g. MatSnackBar, ngx-toastr, PrimeNG toast, etc.
    console.error(`[APP ERROR] ${message}`);
  }

  showClientError(message: string, callback: Function): void {
    callback(message, 'error');
  }
}