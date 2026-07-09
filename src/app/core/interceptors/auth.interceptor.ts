import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (!token) return next(req);

  // Busca o ID do usuário atual. Ajuste o método 'getUserId()' 
  // conforme o nome real que você usa no seu AuthService.
  const userId = auth.getUserId(); 

  // Cria o objeto de headers base
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };

  // Se o ID do usuário existir, adiciona o header que o backend está cobrando
  if (userId) {
    headers['X-User-ID'] = String(userId);
  }

  return next(
    req.clone({
      setHeaders: headers,
    }),
  );
};