import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Department } from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly base = `${environment.apiUrl}/departamentos`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Department[]> {
    return this.http.get<Department[]>(this.base);
  }
}
