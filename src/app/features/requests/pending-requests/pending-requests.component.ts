import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccessRequestService } from '../../../core/services/access-request.service';
import { ApplicationService } from '../../../core/services/application.service';
import { UserService } from '../../../core/services/user.service';
import { AccessRequest, RequestFilters } from '../../../core/models/access-request.model';
import { Application } from '../../../core/models/application.model';
import { User } from '../../../core/models/user.model';
import { RequestState } from '../../../core/models/enums';
import { StateBadgeComponent } from '../../../shared/components/state-badge/state-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-pending-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StateBadgeComponent, PaginationComponent],
  templateUrl: './pending-requests.component.html',
  styleUrl: './pending-requests.component.scss',
})
export class PendingRequestsComponent implements OnInit {
  readonly loading = signal(true);
  readonly requests = signal<AccessRequest[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly colaboradores = signal<User[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly totalElements = signal(0);

  filters: RequestFilters = { estado: RequestState.PENDENTE, aplicacaoId: 'TODOS', colaboradorId: 'TODOS', pesquisa: '' };
  readonly RequestState = RequestState;

  constructor(
    private readonly requestsService: AccessRequestService,
    private readonly applicationsService: ApplicationService,
    private readonly usersService: UserService,
  ) {}

  ngOnInit(): void {
    this.applicationsService.listActive().subscribe((apps) => this.applications.set(apps));
    this.usersService.listAll().subscribe((users) => this.colaboradores.set(users));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.requestsService.getPendingRequests({ ...this.filters, page: this.page(), size: 20 }).subscribe({
      next: (result) => {
        this.requests.set(result.content);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    this.page.set(0);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }
}
