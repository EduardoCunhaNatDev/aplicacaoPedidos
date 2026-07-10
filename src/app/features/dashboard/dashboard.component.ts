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

  constructor(
    readonly auth: AuthService,
    private readonly requestsService: AccessRequestService,
  ) {}

  ngOnInit(): void {
    const isAprovador = this.auth.isAprovador();
    const recent$ = isAprovador
      ? this.requestsService.getPendingRequests({ page: 0, size: 5 })
      : this.requestsService.getMyRequests({ page: 0, size: 5 });
    
    /*Debugging request */
    console.log('Recent requests:', recent$);

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

  protected readonly RequestState = RequestState;
}
