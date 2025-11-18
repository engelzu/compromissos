import { getPriorityIcon, getStatusColor, formatDate, getStatusBadge } from '../utils/helpers.js';

const ITEMS_PER_PAGE = 10;

// Recebe os novos parâmetros de ordenação (sortField e sortDirection)
export function renderTable(compromissos, filterArea, search, currentPage = 1, filterStatus = '', filterResponsavel = '', filterReuniao = '', sortField = '', sortDirection = 'desc') {
  
  let filtered = compromissos;

  const statusTerm = filterStatus.trim().toLowerCase();
  const respTerm = filterResponsavel.trim().toLowerCase();
  const reuniaoTerm = filterReuniao.trim().toLowerCase();

  // Filtros (mantidos)
  if (filterArea !== 'TODOS') { filtered = filtered.filter(c => c.categoria === filterArea); }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c => (c.nomeReuniao && c.nomeReuniao.toLowerCase().includes(s)) || (c.tema && c.tema.toLowerCase().includes(s)) || (c.responsavel && c.responsavel.toLowerCase().includes(s)) || (c.acao && c.acao.toLowerCase().includes(s)));
  }
  if (filterStatus) { filtered = filtered.filter(c => c.status && c.status.trim().toLowerCase() === statusTerm); }
  if (filterResponsavel) { filtered = filtered.filter(c => c.responsavel && c.responsavel.trim().toLowerCase() === respTerm); }
  if (filterReuniao) { filtered = filtered.filter(c => c.nomeReuniao && c.nomeReuniao.trim().toLowerCase() === reuniaoTerm); }

  if (filtered.length === 0) {
    return `
      <div class="bg-white rounded-lg shadow-sm p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum compromisso encontrado</h3>
        <p class="text-gray-500">Tente limpar os filtros ou verifique a ortografia.</p>
      </div>
    `;
  }

  // Paginação
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pagedItems = filtered.slice(startIndex, endIndex);
  
  // Ícone de ordenação
  const sortIcon = sortDirection === 'desc' ? 'V' : 'Λ'; // V = Desc, Λ = Asc

  return `
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto hidden md:block">
        <table class="w-full">
          <thead class="table-header">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prioridade</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome da Reunião</th>
              
              <th id="sort-dataRegistro" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1">
                Data Registro
                <span class="${sortField === 'dataRegistro' ? 'text-green-600' : 'text-gray-400'} text-base">
                  ${sortField === 'dataRegistro' ? sortIcon : '—'}
                </span>
              </th>
              
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tema</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ação</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Responsável</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Prazo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Observação</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${pagedItems.map(c => `
              <tr class="table-row">
                <td class="px-4 py-3 whitespace-nowrap">${getPriorityIcon(c.prioridade)}</td>
                <td class="px-4 py-3"><div class="text-sm font-medium text-gray-900">${c.nomeReuniao}</div></td>
                <td class="px-4 py-3 whitespace-nowrap"><div class="text-sm text-gray-600">${formatDate(c.dataRegistro)}</div></td>
                <td class="px-4 py-3"><div class="text-sm text-gray-900">${c.tema}</div></td>
                <td class="px-4 py-3"><div class="text-sm text-gray-600">${c.acao}</div></td>
                <td class="px-4 py-3 whitespace-nowrap"><div class="text-sm font-medium text-gray-800">${c.responsavel}</div></td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full ${getStatusColor(c.dataPrazo)}"></div>
                    <span class="text-sm font-medium ${getStatusColor(c.dataPrazo, true)}">${formatDate(c.dataPrazo)}</span>
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">${getStatusBadge(c.status)}</td>
                <td class="px-4 py-3"><div class="text-xs text-gray-500 line-clamp-2 w-40">${c.observacao || '-'}</div></td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex gap-2">
                    <button class="btn-edit p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-id="${c.id}" title="Editar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button class="btn-delete p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-id="${c.id}" title="Excluir"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      </div>
  `;
}
