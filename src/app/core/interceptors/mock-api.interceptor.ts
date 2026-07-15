import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mockApplications, mockIdCounters, mockRequests, mockUsers } from '../mocks/mock-data';
import { Page } from '../models/page.model';
import { RequestState, UserRole } from '../models/enums';
import { AccessRequest, DecisionPayload, NewAccessRequestPayload } from '../models/access-request.model';
import { Application, ApplicationFormValue } from '../models/application.model';
import { User, UserFormValue } from '../models/user.model';


const LATENCY_MS = 350;

/**
 * Stands in for the Spring Boot backend while it isn't reachable yet.
 * Only active when environment.useMockApi is true — every request to environment.apiUrl
 * is answered here instead of going over the network. Set useMockApi to false (or delete
 * this interceptor from app.config.ts) once the real API is ready; nothing else in the
 * app needs to change, since services/components only ever talk to HttpClient.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockApi || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const path = req.url.slice(environment.apiUrl.length);
  const currentUser = getCurrentUserFromAuthHeader(req.headers.get('Authorization'));

  try {
    const body = route(req.method, path, req.body, req.params, currentUser);
    return of(new HttpResponse({ status: 200, body })).pipe(delay(LATENCY_MS));
  } catch (err) {
    return throwError(() => err).pipe(delay(LATENCY_MS));
  }
};

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

function route(method: string, path: string, body: any, params: any, currentUser: User | null): unknown {
  const idMatch = (pattern: RegExp) => path.match(pattern);

  if (method === 'POST' && path === '/auth/login') return handleLogin(body);

  if (method === 'GET' && path === '/requests/dashboard') return requireUser(currentUser, (u) => dashboardSummary(u));
  if (method === 'GET' && path === '/requests/me') return requireUser(currentUser, (u) => myRequests(u, params));
  if (method === 'GET' && path === '/requests/pendentes') return pendingRequests(params);
  if (method === 'GET' && path === '/requests') return allRequests(params);
  if (method === 'POST' && path === '/requests') return requireUser(currentUser, (u) => createRequest(u, body));

  let m = idMatch(/^\/requests\/(\d+)\/decisao$/);
  if (method === 'PUT' && m) return requireUser(currentUser, (u) => decideRequest(u, Number(m![1]), body));

  m = idMatch(/^\/requests\/(\d+)$/);
  if (method === 'GET' && m) return getRequestById(Number(m![1]));

  if (method === 'GET' && path === '/aplicacoes/ativas') return mockApplications.filter((a) => a.ativa);
  if (method === 'GET' && path === '/aplicacoes') return listApplications(params);
  if (method === 'POST' && path === '/aplicacoes') return createApplication(body);

  m = idMatch(/^\/aplicacoes\/(\d+)$/);
  if (method === 'PUT' && m) return updateApplication(Number(m![1]), body);
  if (method === 'DELETE' && m) return deleteApplication(Number(m![1]));

  if (method === 'GET' && path === '/utilizadores/todos') return mockUsers;
  if (method === 'GET' && path === '/utilizadores') return listUsers(params);
  if (method === 'POST' && path === '/utilizadores') return createUser(body);

  m = idMatch(/^\/utilizadores\/(\d+)$/);
  if (method === 'PUT' && m) return updateUser(Number(m![1]), body);
  if (method === 'DELETE' && m) return deleteUser(Number(m![1]));

  

  throw badRequest(`Mock API: sem rota para ${method} ${path}`, 404);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function getCurrentUserFromAuthHeader(authHeader: string | null): User | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer mock-jwt\.(\d+)$/);
  if (!match) return null;
  return mockUsers.find((u) => u.id === Number(match[1])) ?? null;
}

function requireUser<T>(user: User | null, fn: (user: User) => T): T {
  if (!user) throw badRequest('Sessão inválida. Faça login novamente.', 401);
  return fn(user);
}

function handleLogin(body: any) {
  const email = (body?.email ?? '').toLowerCase().trim();
  const user = mockUsers.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    throw badRequest('Email ou palavra-passe incorretos. (Mock: use um dos emails listados em MOCK_TESTING.md)', 401);
  }
  return { token: `mock-jwt.${user.id}`, usuario: user };
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

function dashboardSummary(user: User) {
  const scoped = user.perfil === UserRole.APROVADOR ? mockRequests : mockRequests.filter((r) => r.colaboradorId === user.id);
  const count = (state: RequestState) => scoped.filter((r) => r.estado === state).length;

  return {
    pedidosAtivos: count(RequestState.PENDENTE),
    limitePedidosAtivos: 3,
    pendentes: count(RequestState.PENDENTE),
    aprovados: count(RequestState.APROVADO),
    rejeitados: count(RequestState.REJEITADO),
  };
}

function myRequests(user: User, params: any): Page<AccessRequest> {
  let items = mockRequests.filter((r) => r.colaboradorId === user.id);
  items = applyRequestFilters(items, params);
  return paginate(sortByDateDesc(items, (r) => r.dataPedido), params);
}

function pendingRequests(params: any): Page<AccessRequest> {
  let items = mockRequests;
  const estado = params.get('estado');
  items = estado ? items.filter((r) => r.estado === estado) : items.filter((r) => r.estado === RequestState.PENDENTE);
  items = applyRequestFilters(items, params, /* skipEstado */ true);
  return paginate(sortByDateDesc(items, (r) => r.dataPedido), params);
}

function allRequests(params: any): Page<AccessRequest> {
  const items = applyRequestFilters(mockRequests, params);
  return paginate(sortByDateDesc(items, (r) => r.dataPedido), params);
}

function applyRequestFilters(items: AccessRequest[], params: any, skipEstado = false): AccessRequest[] {
  const estado = params.get('estado');
  const aplicacaoId = params.get('aplicacaoId');
  const colaboradorId = params.get('colaboradorId');
  const pesquisa = (params.get('pesquisa') ?? '').toLowerCase();

  return items.filter((r) => {
    if (!skipEstado && estado && r.estado !== estado) return false;
    if (aplicacaoId && r.aplicacaoId !== Number(aplicacaoId)) return false;
    if (colaboradorId && r.colaboradorId !== Number(colaboradorId)) return false;
    if (pesquisa && !`${r.aplicacaoNome} ${r.colaboradorNome} ${r.justificacaoPedido}`.toLowerCase().includes(pesquisa)) return false;
    return true;
  });
}

function getRequestById(id: number): AccessRequest {
  const found = mockRequests.find((r) => r.id === id);
  if (!found) throw badRequest(`Pedido #${id} não encontrado.`, 404);
  return found;
}

function createRequest(user: User, payload: NewAccessRequestPayload): AccessRequest {
  const activeCount = mockRequests.filter(
    (r) => r.colaboradorId === user.id && r.estado === RequestState.PENDENTE,
  ).length;
  if (activeCount >= 3) {
    throw badRequest('Limite de 3 pedidos ativos atingido. Aguarde a resolução de um pedido existente.', 400);
  }

  const app = mockApplications.find((a) => a.id === payload.aplicacaoId);
  if (!app) throw badRequest('Aplicação inválida.', 400);

  const now = new Date().toISOString();
  const id = mockIdCounters.request++;
  const request: AccessRequest = {
    id,
    aplicacaoId: app.id,
    aplicacaoNome: app.nome,
    colaboradorId: user.id,
    colaboradorNome: user.nome,
    justificacaoPedido: payload.justificativa,
    estado: RequestState.PENDENTE,
    dataPedido: now,
    atualizadoEm: now,
    historico: [
      {
        id: mockIdCounters.requestHistory++,
        estado: RequestState.PENDENTE,
        responsavelId: user.id,
        responsavelNome: `${user.nome} (Colaborador)`,
        data: now,
        justificativa: 'Pedido criado.',
      },
    ],
  };

  mockRequests.unshift(request);

  return request;
}

function decideRequest(user: User, id: number, payload: DecisionPayload): AccessRequest {
  if (user.perfil !== UserRole.APROVADOR) throw badRequest('Apenas aprovadores podem decidir pedidos.', 403);

  const request = mockRequests.find((r) => r.id === id);
  if (!request) throw badRequest(`Pedido #${id} não encontrado.`, 404);

  const now = new Date().toISOString();
  request.estado = payload.decisao;
  request.atualizadoEm = now;
  request.decisorId = user.id;
  request.decisorNome = user.nome;
  request.justificativaDecisao = payload.justificativaDecisao;
  request.historico.push({
    id: mockIdCounters.requestHistory++,
    estado: payload.decisao,
    responsavelId: user.id,
    responsavelNome: `${user.nome} (Aprovador)`,
    data: now,
    justificativa: payload.justificativaDecisao,
  });

  

  return request;
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

function listApplications(params: any): Page<Application> {
  const pesquisa = (params.get('pesquisa') ?? '').toLowerCase();
  const items = mockApplications.filter(
    (a) => !pesquisa || `${a.codigo} ${a.nome}`.toLowerCase().includes(pesquisa),
  );
  return paginate(items, params);
}

function createApplication(payload: ApplicationFormValue): Application {
  const app: Application = { id: mockIdCounters.application++, ...payload };
  mockApplications.push(app);
  return app;
}

function updateApplication(id: number, payload: ApplicationFormValue): Application {
  const app = mockApplications.find((a) => a.id === id);
  if (!app) throw badRequest(`Aplicação #${id} não encontrada.`, 404);
  Object.assign(app, payload);
  return app;
}

function deleteApplication(id: number): null {
  const index = mockApplications.findIndex((a) => a.id === id);
  if (index === -1) throw badRequest(`Aplicação #${id} não encontrada.`, 404);
  mockApplications.splice(index, 1);
  return null;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

function listUsers(params: any): Page<User> {
  const pesquisa = (params.get('pesquisa') ?? '').toLowerCase();
  const items = mockUsers.filter(
    (u) => !pesquisa || `${u.nome} ${u.email}`.toLowerCase().includes(pesquisa),
  );
  return paginate(items, params);
}

function createUser(payload: UserFormValue): User {
  const { password, ...rest } = payload;
  const user: User = { id: mockIdCounters.user++, ...rest };
  mockUsers.push(user);
  return user;
}

function updateUser(id: number, payload: UserFormValue): User {
  const user = mockUsers.find((u) => u.id === id);
  if (!user) throw badRequest(`Utilizador #${id} não encontrado.`, 404);
  const { password, ...rest } = payload;
  Object.assign(user, rest);
  return user;
}

function deleteUser(id: number): null {
  const index = mockUsers.findIndex((u) => u.id === id);
  if (index === -1) throw badRequest(`Utilizador #${id} não encontrado.`, 404);
  mockUsers.splice(index, 1);
  return null;
}



// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function paginate<T>(items: T[], params: any): Page<T> {
  const page = Number(params.get('page') ?? 0);
  const size = Number(params.get('size') ?? 10);
  const start = page * size;
  const content = items.slice(start, start + size);

  return {
    content,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
    number: page,
    size,
    first: page === 0,
    last: start + size >= items.length,
  };
}

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string): T[] {
  return [...items].sort((a, b) => getDate(b).localeCompare(getDate(a)));
}

function badRequest(message: string, status: number): HttpErrorResponse {
  return new HttpErrorResponse({ error: { message }, status, statusText: 'Mock API Error' });
}
