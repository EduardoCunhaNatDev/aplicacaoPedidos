import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AccessRequestService } from '../../../core/services/access-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { AccessRequest } from '../../../core/models/access-request.model';
import { RequestState } from '../../../core/models/enums';
import { StateBadgeComponent } from '../../../shared/components/state-badge/state-badge.component';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, StateBadgeComponent],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.scss',
})
export class RequestDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly request = signal<AccessRequest | null>(null);
  readonly RequestState = RequestState;

  /** Every possible step, so the timeline can render pending steps as empty/greyed-out. */
  readonly timelineStates = [
    RequestState.PENDENTE,
    RequestState.APROVADO,
    RequestState.REJEITADO,
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly requestsService: AccessRequestService,
    readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    console.log((this.route.snapshot.paramMap))
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.requestsService.getById(id).subscribe({
      next: (req) => {
        this.request.set(req);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void {
    this.location.back();
  }

  historyEntryFor(state: RequestState) {
    const currentRequest = this.request();


    // Safe check: If request or its historico array don't exist yet, return null safely
    if (!currentRequest || !currentRequest.historico) {
      return null;
    }

        return currentRequest.historico.find((h) => {console.log(h); return h.estado === state; }) ?? null;
}
}
