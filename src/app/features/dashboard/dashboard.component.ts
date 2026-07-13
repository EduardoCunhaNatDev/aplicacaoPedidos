import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AccessRequestService } from '../../core/services/access-request.service';
import { AccessRequest, DashboardSummary } from '../../core/models/access-request.model';
import { RequestState } from '../../core/models/enums';
import { StateBadgeComponent } from '../../shared/components/state-badge/state-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StateBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly loading = signal(true);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly recentRequests = signal<AccessRequest[]>([]);
  readonly deletingId = signal<number | null>(null);

  constructor(
    readonly auth: AuthService,
    private readonly requestsService: AccessRequestService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    const isAprovador = this.auth.isAprovador();
    const recent$ = isAprovador
      ? this.requestsService.getPendingRequests({ page: 0, size: 5 })
      : this.requestsService.getMyRequests({ page: 0, size: 5 });

    forkJoin({
      summary: this.requestsService.getDashboardSummary(),
      recent: recent$,
    }).subscribe({
      next: ({ summary, recent }) => {
        this.summary.set(summary);
        this.recentRequests.set(recent.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // NEW: delete action for the Ações column — only ever called for the user's own Pendente
  // requests (the template only renders the button in that case), reloads the dashboard
  // afterward so both the table and the summary counts stay in sync.
  deleteRequest(request: AccessRequest): void {
    if (!confirm(`Eliminar o pedido #${request.id} (${request.aplicacaoNome})? Esta ação não pode ser revertida.`)) {
      return;
    }

    this.deletingId.set(request.id);
    this.requestsService.delete(request.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadDashboard();
      },
      error: () => {
        this.deletingId.set(null);
        alert('Não foi possível eliminar o pedido. Tente novamente.');
      },
    });
  }

  protected readonly RequestState = RequestState;
}
