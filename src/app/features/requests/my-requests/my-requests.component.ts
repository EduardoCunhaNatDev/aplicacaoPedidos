import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccessRequestService } from '../../../core/services/access-request.service';
import { ApplicationService } from '../../../core/services/application.service';
import { AccessRequest, RequestFilters } from '../../../core/models/access-request.model';
import { Application } from '../../../core/models/application.model';
import { RequestState } from '../../../core/models/enums';
import { StateBadgeComponent } from '../../../shared/components/state-badge/state-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StateBadgeComponent, PaginationComponent],
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.scss',
})
export class MyRequestsComponent implements OnInit {
  readonly loading = signal(true);
  readonly requests = signal<AccessRequest[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly deletingId = signal<number | null>(null);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly totalElements = signal(0);

  filters: RequestFilters = { estado: 'TODOS', aplicacaoId: 'TODOS', pesquisa: '' };
  readonly RequestState = RequestState;

  constructor(
    private readonly requestsService: AccessRequestService,
    private readonly applicationsService: ApplicationService,
  ) {}

  ngOnInit(): void {
    this.applicationsService.listActive().subscribe((apps) => this.applications.set(apps));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.requestsService.getMyRequests({ ...this.filters, page: this.page(), size: 10 }).subscribe({
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

  deleteRequest(request: AccessRequest): void {
    if (!confirm(`Eliminar o pedido #${request.id} (${request.aplicacaoNome})? Esta ação não pode ser revertida.`)) {
      return;
    }

    this.deletingId.set(request.id);
    this.requestsService.delete(request.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.load();
      },
      error: () => {
        this.deletingId.set(null);
        alert('Não foi possível eliminar o pedido. Tente novamente.');
      },
    });
  }
}
