import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../environment';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  peers?: string[];
  social?: string[];
}

interface LoginResponse {
  access: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

interface RegisterResponse extends LoginResponse {
    refresh: string;
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  readonly tokenKey = 'access_token';
  readonly refreshTokenKey = 'refresh_token';

  login(payload: LoginRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(environment.apiUrl + '/auth/token/', payload).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.access);
        localStorage.setItem(this.refreshTokenKey, response.refresh);
      })
    );
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    console.log('Registering user with payload:', payload);
    return this.http.post<RegisterResponse>(environment.apiUrl + '/auth/reg/', payload).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.access);
        localStorage.setItem(this.refreshTokenKey, response.refresh);
      })
    );
  }

  isAuhtenticated(): Observable<boolean> {
        console.log("Current token:", this.getToken());
        return this.http
            .post<{ valid: boolean }>(`${environment.apiUrl}/auth/token/verify/`, {
                token: this.getToken()
            },
            {
                observe: 'response'
            }
        )
            .pipe(
            map((response) => response.status === 200),
            catchError((e) => {
                console.error("Error occurred while verifying token:", e);
                return of(false)
            })
        );
  };

  updateToken(): Observable<RegisterResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }else{
        return this.http.post<RegisterResponse>(environment.apiUrl + '/auth/token/refresh/', { refresh: refreshToken }).pipe(
            tap((response) => {
                console.log("Update token response", response);
                localStorage.setItem(this.tokenKey, response.access);
            }),
            catchError((e) => { 
                console.error("Error occurred while refreshing token:", e);
                return of({ access: '', refresh: '', user: { id: 0, email: '', name: '' } });
            })
        );
    }
  }
  logout(): void {
    this.http.post(environment.apiUrl + '/auth/logout/', {});
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  getToken(): string {
    return localStorage.getItem(this.tokenKey) || 'noToken';
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}