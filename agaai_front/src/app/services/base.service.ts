import { Injectable } from "@angular/core";
import { environment } from "../../environment";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { catchError, MonoTypeOperatorFunction, Observable, pipe, throwError } from "rxjs";
import { NotificationService } from "./notification.service";
import { showToast } from "../components/toast/toast";


export interface AppError {
  status: number;
  message: string;
  userMessage: string;
  timestamp: number;
  endpoint?: string;
  fullErrorbody?: any;
}

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  protected readonly baseUrl = environment.apiUrl;

  private readonly USER_MESSAGES: Record<number, string> = {
    0:   'Network error — check your internet connection.',
    400: 'Invalid request. Please check your input.',
    401: 'Authentication error.',
    403: 'You don\'t have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'Request timed out. Please try again.',
    422: 'Validation failed. Please review your data.',
    429: 'Too many requests. Please slow down.',
    500: 'Server error. Our team has been notified.',
    503: 'Service temporarily unavailable. Try again later.',
  };

  constructor(
    protected http: HttpClient,
    private notifications: NotificationService,
  ) {}

  protected get<T>(
    endpoint: string,
    params?: HttpParams | Record<string, string>,
    options?: RequestOptions,
  ): Observable<T> {
    return this.http
      .get<T>(this.url(endpoint), { params })
      .pipe(
        this.handleErrors(endpoint, options)
      );
  }

  protected post<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<T> {
    return this.http
      .post<T>(this.url(endpoint), body)
      .pipe(this.handleErrors(endpoint, options));
  }

  protected put<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>,
    options?: RequestOptions,
  ): Observable<T> {
    return this.http
      .put<T>(this.url(endpoint), body, { headers })
      .pipe(this.handleErrors(endpoint, options));
  }

  protected patch<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<T> {
    return this.http
      .patch<T>(this.url(endpoint), body)
      .pipe(this.handleErrors(endpoint, options));
  }

  protected delete<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Observable<T> {
    return this.http
      .delete<T>(this.url(endpoint))
      .pipe(this.handleErrors(endpoint, options));
  }

  private handleErrors<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): MonoTypeOperatorFunction<T> {
    return pipe(
      catchError((raw: HttpErrorResponse) => {
        const error = this.normalizeError(raw, endpoint);

        this.logError(error);

        if (!options.silentError) {
          const message = options.errorMessage ?? error.userMessage;
          this.notifications.showClientError(message, showToast);
        }

        return throwError(() => error);
      }),
    );
  }

  private normalizeError(raw: HttpErrorResponse, endpoint: string): AppError {
    return {
      status:      raw.status,
      message:     raw.message,
      userMessage: this.USER_MESSAGES[raw.status] ?? 'An unexpected error occurred.',
      fullErrorbody: raw.error,
      timestamp:   Date.now(),
      endpoint,
    };
  }

  private logError(error: AppError): void {
    console.error(`[API ${error.status}] ${error.endpoint}`, error);
  }

  private url(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }
}

interface RequestOptions {
  silentError?: boolean;
  errorMessage?: string;
}