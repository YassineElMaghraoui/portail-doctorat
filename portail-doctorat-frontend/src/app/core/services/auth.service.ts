import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User, Role } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private authUrl = environment.userServiceUrl;

  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly userRole = computed(() => this.currentUserSignal()?.role);
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === Role.ADMIN);
  readonly isDoctorant = computed(() => this.currentUserSignal()?.role === Role.DOCTORANT);
  readonly isDirecteur = computed(() => this.currentUserSignal()?.role === Role.DIRECTEUR_THESE);

  constructor(
      private http: HttpClient,
      private router: Router
  ) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/auth/register`, request)
        .pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(this.handleError)
        );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/auth/login`, request)
        .pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(this.handleError)
        );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return this.http.post<AuthResponse>(`${this.authUrl}/auth/refresh`, { refreshToken })
        .pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
              this.logout();
              return throwError(() => error);
            })
        );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  // ✅ CORRECTION ICI : Ajout de "as Role" pour corriger l'erreur TS2345
  hasRole(role: Role | Role[]): boolean {
    const userRole = this.currentUserSignal()?.role;
    if (!userRole) return false;

    if (Array.isArray(role)) {
      return role.includes(userRole as Role);
    }
    return userRole === role;
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.authUrl}/auth/me`);
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);

    const user: User = {
      id: response.userId,
      username: response.username,
      email: response.email,
      nom: response.nom,
      prenom: response.prenom,
      role: response.role,
      enabled: true
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  private handleError(error: any) {
    let errorMessage = 'Une erreur est survenue';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}