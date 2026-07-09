import { forwardRef, Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccessRequest,
  DashboardSummary,
  DecisionPayload,
  NewAccessRequestPayload,
  RequestFilters,
} from '../models/access-request.model';
import { Page } from '../models/page.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AccessRequestService {
  private readonly base = `${environment.apiUrl}/requests`;

  constructor(
    private readonly http: HttpClient,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService
  ) {}

  /** "Meus Pedidos" — requests created by the logged-in colaborador. */
  getMyRequests(filters: RequestFilters): Observable<Page<AccessRequest>> {
    const userId = this.authService.getUserId();
    const headers = new HttpHeaders().set('X-User-ID', String(userId ?? ''));

    return this.http.get<Page<AccessRequest>>(`${this.base}/me`, { 
      params: this.toParams(filters),
      headers 
    });
  }
 
  getPendingRequests(filters: RequestFilters): Observable<Page<AccessRequest>> {
    return this.http.get<Page<AccessRequest>>(this.base, { params: this.toParams(filters) });
  }

  /** "Todos os Pedidos" — full history view available to approvers. */
  getAllRequests(filters: RequestFilters): Observable<Page<AccessRequest>> {
    return this.http.get<Page<AccessRequest>>(this.base, { params: this.toParams(filters) });
  }

  getById(id: number): Observable<AccessRequest> {
    return this.http.get<AccessRequest>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<any> {
    const userId = this.authService.getUserId();

    const payloadComUser = {
      ...payload,
      idUtilizador: userId
    };
    
    return this.http.post(`${environment.apiUrl}/requests`, payloadComUser);
  }

  decide(id: number, payload: DecisionPayload): Observable<AccessRequest> {
    return this.http.put<AccessRequest>(`${this.base}/${id}/decisao`, payload);
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/dashboard`);
  }

  private toParams(filters: RequestFilters): HttpParams {
    let params = new HttpParams();
    if (filters.estado && filters.estado !== 'TODOS') params = params.set('estado', filters.estado);
    if (filters.aplicacaoId && filters.aplicacaoId !== 'TODOS') params = params.set('aplicacaoId', filters.aplicacaoId);
    if (filters.colaboradorId && filters.colaboradorId !== 'TODOS') params = params.set('colaboradorId', filters.colaboradorId);
    if (filters.pesquisa) params = params.set('pesquisa', filters.pesquisa);
    params = params.set('page', filters.page ?? 0);
    params = params.set('size', filters.size ?? 10);
    return params;
  }
}
