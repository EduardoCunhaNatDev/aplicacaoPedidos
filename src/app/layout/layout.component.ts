import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { UserRole } from '../core/models/enums';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  constructor(readonly auth: AuthService) {}

  private readonly colaboradorNav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '⌂' },
    { label: 'Meus Pedidos', path: '/meus-pedidos', icon: '☰' },
    { label: 'Aplicações', path: '/aplicacoes', icon: '▦' },
  ];

    private readonly aprovadorNav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '⌂' },
    { label: 'Pedidos Pendentes', path: '/pedidos-pendentes', icon: '◷' },
    { label: 'Todos os Pedidos', path: '/todos-os-pedidos', icon: '☰' },
    { label: 'Aplicações', path: '/aplicacoes', icon: '▦' },
    { label: 'Utilizadores', path: '/utilizadores', icon: '☺' },
  ];

  readonly navItems = computed<NavItem[]>(() =>
    this.auth.isAprovador() ? this.aprovadorNav : this.colaboradorNav,
  );

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.nome ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  readonly roleLabel = computed(() =>
    this.auth.isAprovador() ? 'Aprovador' : 'Colaborador',
  );

  logout(): void {
    this.auth.logout();
  }
}
