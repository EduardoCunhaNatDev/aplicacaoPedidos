import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccessRequestService } from '../../../core/services/access-request.service';
import { ApplicationService } from '../../../core/services/application.service';
import { Application } from '../../../core/models/application.model';

@Component({
  selector: 'app-new-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-request.component.html',
  styleUrl: './new-request.component.scss',
})
export class NewRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly applicationsService = inject(ApplicationService);
  private readonly requestsService = inject(AccessRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly applications = signal<Application[]>([]);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    aplicacaoId: [null as number | null, [Validators.required]],
    justificativa: ['', [Validators.required, Validators.minLength(20)]],
  });

  ngOnInit(): void {
    const applicationId = this.getApplicationIdFromQuery();

    this.applicationsService.listActive().subscribe((apps) => {
      this.applications.set(apps);

      if (applicationId === null) return;

      const selectedApplication = apps.find((app) => app.id === applicationId);
      if (selectedApplication) {
        this.form.patchValue({ aplicacaoId: selectedApplication.id });
      }
    });
  }

  private getApplicationIdFromQuery(): number | null {
    const rawValue = this.route.snapshot.queryParamMap.get('aplicacaoId');
    if (!rawValue) return null;

    const parsedValue = Number(rawValue);
    return Number.isInteger(parsedValue) ? parsedValue : null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { aplicacaoId, justificativa } = this.form.getRawValue();

    const idUtilizadorLogado = 1; 

    const payload = {
      idAplicacao: aplicacaoId!,
      idUtilizador: idUtilizadorLogado,
      justificacaoPedido: justificativa!
    };

    this.requestsService.create(payload).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.router.navigate(['/meus-pedidos']); 
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Não foi possível submeter o pedido.',
        );
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/meus-pedidos']);
  }
}
