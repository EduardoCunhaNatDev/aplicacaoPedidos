import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { User } from '../models/user.model';
import { UserRole } from '../models/enums';

const TOKEN_KEY = 'nam_token';
const USER_KEY = 'nam_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());

  /** Reactive read-only view of the authenticated user, null when logged out. */
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isAprovador = computed(() => this.currentUserSignal()?.perfil === UserRole.APROVADOR);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.usuario));
        this.currentUserSignal.set(response.usuario);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

    getUserId(): number | null {
      return this.currentUser()?.id || null;
  }
}
