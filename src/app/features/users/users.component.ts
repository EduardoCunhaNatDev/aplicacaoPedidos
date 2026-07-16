import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { DepartmentService } from '../../core/services/department.service';
import { User, UserFormValue } from '../../core/models/user.model';
import { Department } from '../../core/models/department.model';
import { ROLE_LABEL, UserRole } from '../../core/models/enums';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UserService);
  private readonly departmentsService = inject(DepartmentService);

  readonly loading = signal(true);
  readonly users = signal<User[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly totalElements = signal(0);
  readonly pesquisa = signal('');

  readonly panelOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly UserRole = UserRole;
  readonly ROLE_LABEL = ROLE_LABEL;

  readonly form = this.fb.group({
    nome: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    idDepartamento: [null as number | null, [Validators.required]],
    perfil: [UserRole.COLABORADOR, [Validators.required]],
    ativo: [true],
    password: [''],
  });

  ngOnInit(): void {
    this.load();
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentsService.list().subscribe({
      next: (departments) => this.departments.set(departments),
    });
  }

  load(): void {
    this.loading.set(true);
    this.usersService.list(this.page(), 10, this.pesquisa()).subscribe({
      next: (result) => {
        this.users.set(result.content);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(): void {
    this.page.set(0);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      nome: '',
      email: '',
      idDepartamento: null,
      perfil: UserRole.COLABORADOR,
      ativo: true,
      password: '',
    });
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  openEdit(user: User): void {
    this.editingId.set(user.id);
    this.form.reset({
      nome: user.nome,
      email: user.email,
      idDepartamento: user.idDepartamento,
      perfil: user.perfil,
      ativo: user.ativo,
      password: '',
    });
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const payload = this.form.getRawValue() as UserFormValue;
    const id = this.editingId();
    const request$ = id ? this.usersService.update(id, payload) : this.usersService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.panelOpen.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Não foi possível guardar o utilizador.');
      },
    });
  }

  remove(user: User): void {
    if (!confirm(`Eliminar o utilizador "${user.nome}"? Esta ação não pode ser revertida.`)) return;
    this.usersService.delete(user.id).subscribe(() => this.load());
  }
}
