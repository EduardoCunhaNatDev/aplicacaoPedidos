import { User } from '../models/user.model';
import { Application } from '../models/application.model';
import { AccessRequest } from '../models/access-request.model';
import { RequestState, UserRole } from '../models/enums';

/**
 * In-memory data used only when environment.useMockApi is true (see mock-api.interceptor.ts).
 * Mutated at runtime by the interceptor so create/edit/delete/approve actions are reflected
 * immediately in the UI. Resets whenever the page is fully reloaded.
 */

export const mockUsers: User[] = [
  { id: 1, nome: 'Eduardo Silva', email: 'eduardo.silva@natixis.com', departamento: 'IT', perfil: UserRole.COLABORADOR, ativo: true },
  { id: 2, nome: 'Ana Costa', email: 'ana.costa@natixis.com', departamento: 'IT', perfil: UserRole.APROVADOR, ativo: true },
  { id: 3, nome: 'João Santos', email: 'joao.santos@natixis.com', departamento: 'Finanças', perfil: UserRole.COLABORADOR, ativo: true },
  { id: 4, nome: 'Mariana Rocha', email: 'mariana.rocha@natixis.com', departamento: 'Operações', perfil: UserRole.COLABORADOR, ativo: true },
];

export const mockApplications: Application[] = [
  { id: 1, codigo: 'SAP', nome: 'SAP', descricao: 'Sistema ERP', ativa: true },
  { id: 2, codigo: 'JIRA', nome: 'Jira', descricao: 'Gestão de Projetos', ativa: true },
  { id: 3, codigo: 'CONFL', nome: 'Confluence', descricao: 'Base de Conhecimento', ativa: true },
  { id: 4, codigo: 'GITLAB', nome: 'GitLab', descricao: 'Repositórios Git', ativa: false },
];

export const mockRequests: AccessRequest[] = [
  {
    id: 15,
    aplicacaoId: 1,
    aplicacaoNome: 'SAP',
    colaboradorId: 1,
    colaboradorNome: 'Eduardo Silva',
    justificacaoPedido: 'Necessário para acesso ao sistema SAP para execução de atividades do projeto X.',
    estado: RequestState.PENDENTE,
    dataPedido: '2025-06-12T10:30:00',
    atualizadoEm: '2025-06-12T10:30:00',
    historico: [
      { id: 1, estado: RequestState.PENDENTE, responsavelId: 1, responsavelNome: 'Eduardo Silva (Colaborador)', data: '2025-06-12T10:30:00', justificativa: 'Pedido criado.' },
    ],
  },
  {
    id: 12,
    aplicacaoId: 4,
    aplicacaoNome: 'GitLab',
    colaboradorId: 1,
    colaboradorNome: 'Eduardo Silva',
    justificacaoPedido: 'Acesso aos repositórios da equipa de plataforma.',
    estado: RequestState.APROVADO,
    dataPedido: '2025-06-08T10:30:00',
    atualizadoEm: '2025-06-09T14:20:00',
    decisorId: 2,
    decisorNome: 'Ana Costa',
    justificativaDecisao: 'Acesso aprovado.',
    historico: [
      { id: 4, estado: RequestState.PENDENTE, responsavelId: 1, responsavelNome: 'Eduardo Silva (Colaborador)', data: '2025-06-08T10:30:00', justificativa: 'Pedido criado.' },
      { id: 6, estado: RequestState.APROVADO, responsavelId: 2, responsavelNome: 'Ana Costa (Aprovador)', data: '2025-06-09T14:20:00', justificativa: 'Acesso aprovado.' },
    ],
  },
  {
    id: 11,
    aplicacaoId: 3,
    aplicacaoNome: 'Confluence',
    colaboradorId: 1,
    colaboradorNome: 'Eduardo Silva',
    justificacaoPedido: 'Consulta de documentação técnica do projeto Y.',
    estado: RequestState.REJEITADO,
    dataPedido: '2025-06-01T11:05:00',
    atualizadoEm: '2025-06-02T10:00:00',
    decisorId: 2,
    decisorNome: 'Ana Costa',
    justificativaDecisao: 'Justificação insuficiente para o nível de acesso pedido.',
    historico: [
      { id: 7, estado: RequestState.PENDENTE, responsavelId: 1, responsavelNome: 'Eduardo Silva (Colaborador)', data: '2025-06-01T11:05:00', justificativa: 'Pedido criado.' },
      { id: 8, estado: RequestState.REJEITADO, responsavelId: 2, responsavelNome: 'Ana Costa (Aprovador)', data: '2025-06-02T10:00:00', justificativa: 'Justificação insuficiente para o nível de acesso pedido.' },
    ],
  },
  {
    id: 18,
    aplicacaoId: 2,
    aplicacaoNome: 'Jira',
    colaboradorId: 3,
    colaboradorNome: 'João Santos',
    justificacaoPedido: 'Necessário para reportar despesas no board financeiro.',
    estado: RequestState.PENDENTE,
    dataPedido: '2025-06-13T11:05:00',
    atualizadoEm: '2025-06-13T11:05:00',
    historico: [
      { id: 9, estado: RequestState.PENDENTE, responsavelId: 3, responsavelNome: 'João Santos (Colaborador)', data: '2025-06-13T11:05:00', justificativa: 'Pedido criado.' },
    ],
  },
  {
    id: 19,
    aplicacaoId: 3,
    aplicacaoNome: 'Confluence',
    colaboradorId: 4,
    colaboradorNome: 'Mariana Rocha',
    justificacaoPedido : 'Consulta de procedimentos operacionais.',
    estado: RequestState.PENDENTE,
    dataPedido: '2025-06-13T13:00:00',
    atualizadoEm: '2025-06-13T13:00:00',
    historico: [
      { id: 10, estado: RequestState.PENDENTE, responsavelId: 4, responsavelNome: 'Mariana Rocha (Colaborador)', data: '2025-06-13T13:00:00', justificativa: 'Pedido criado.' },
    ],
  },
];


/** Simple auto-increment counters so mock creates get unique, ascending ids. */
export const mockIdCounters = {
  request: 20,
  requestHistory: 11,
  application: 5,
  user: 5,
  
};
