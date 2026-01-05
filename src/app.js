import { areas } from './data/areas.js';
import { getCompromissos, deleteCompromisso, initializeData, saveCompromissosBulk, saveCompromisso, getReunioes, getResponsaveis } from './services/storage.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';
import { renderTable } from './components/table.js';
import { openModal } from './components/modal.js';
import { renderAdminPage } from './components/admin.js';
import { renderLogin } from './components/login.js';

let currentFilter = 'TODOS';
let searchTerm = '';
let currentPage = 1;

let filterStatus = '';
let filterResponsavel = '';
let filterReuniao = '';

// --- NOVAS VARIÁVEIS DE ORDENAÇÃO ---
let sortField = 'dataRegistro'; // Campo padrão
let sortDirection = 'desc'; // Ordem padrão: 'desc' (mais novo primeiro)

export async function initApp() {
  const app = document.getElementById('app');

  // VERIFICA SESSÃO
  const session = localStorage.getItem('user_session');
  if (!session) {
    renderLogin(initApp); // Se não logado, renderiza login e passa initApp como callback
    return;
  }

  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <svg class="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="text-lg font-medium text-gray-700">Carregando dados...</p>
      </div>
    </div>`;

  await initializeData();
  renderApp();
  setupEventListeners();
}

function renderApp() {
  const app = document.getElementById('app');
  const user = JSON.parse(localStorage.getItem('user_session') || '{}');

  const reunioesOpts = getReunioes().map(r => `<option value="${r.name}">${r.name}</option>`).join('');
  const responsaveisOpts = getResponsaveis().map(r => `<option value="${r.name}">${r.name}</option>`).join('');

  app.innerHTML = `
    <div class="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden lg:hidden"></div>
      <aside id="sidebar" class="w-80 bg-gray-100 border-r border-gray-200 fixed inset-y-0 left-0 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto">
        ${renderSidebar(areas, currentFilter)}
      </aside>
      <div class="flex-1 flex flex-col overflow-hidden">
        ${renderHeader()}
        <main class="flex-1 overflow-y-auto">
          <div class="p-4 lg:p-6">
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                  <h1 class="text-2xl font-bold text-gray-900">COMPROMISSO</h1>
                  <p class="text-xs text-gray-500">Logado como: ${user.email} | <button id="btn-logout" class="text-red-600 hover:underline">Sair</button></p>
              </div>
              <div class="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
                <input type="file" id="file-input" accept=".xlsx, .xls" class="hidden" />
                <button id="btn-template" class="btn-secondary text-sm">Modelo XLS</button>
                <button id="btn-import" class="btn-secondary text-sm">Importar XLS</button>
                <button id="btn-export" class="btn-secondary text-sm">Exportar</button>
                <button id="btn-add" class="btn-primary text-sm whitespace-nowrap">+ NOVO REG...</button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select id="filter-status" class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-2 border">
                        <option value="">Todos os Status</option>
                        <option value="Não Iniciada">Não Iniciada</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluída">Concluída</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Responsável</label>
                    <select id="filter-responsavel" class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-2 border">
                        <option value="">Todos os Responsáveis</option>
                        ${responsaveisOpts}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Nome da Reunião</label>
                    <select id="filter-reuniao" class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-2 border">
                        <option value="">Todas as Reuniões</option>
                        ${reunioesOpts}
                    </select>
                </div>
            </div>

            <div id="table-container">
              ${renderTable(getCompromissos(), currentFilter, searchTerm, currentPage, filterStatus, filterResponsavel, filterReuniao, sortField, sortDirection)}
            </div>
          </div>
        </main>
      </div>
    </div>
    <div id="modal-container"></div>`;
}

function checkPassword() {
  const user = JSON.parse(localStorage.getItem('user_session') || '{}');
  // Se for admin logado como admin, passa direto
  if (user.role === 'admin') return true;

  // Senão pede senha
  const pass = prompt("Digite a senha de administrador:");
  if (pass === "789512") return true;
  alert("Senha incorreta! Você não tem permissão.");
  return false;
}

function setupEventListeners() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarToggle = document.getElementById('sidebar-toggle');

  const closeSidebar = () => { sidebar?.classList.add('-translate-x-full'); sidebarOverlay?.classList.add('hidden'); };
  const openSidebar = () => { sidebar?.classList.remove('-translate-x-full'); sidebarOverlay?.classList.remove('hidden'); };

  // LOGOUT
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    localStorage.removeItem('user_session');
    window.location.reload();
  });

  document.getElementById('btn-admin-panel')?.addEventListener('click', (e) => {
    e.preventDefault();
    // Verificação de segurança adicional para o painel admin
    if (checkPassword()) renderAdminPage();
  });

  sidebarToggle?.addEventListener('click', (e) => { e.stopPropagation(); sidebar?.classList.contains('-translate-x-full') ? openSidebar() : closeSidebar(); });
  sidebarOverlay?.addEventListener('click', closeSidebar);

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    currentPage = 1;
    updateTable();
  });

  document.getElementById('filter-status')?.addEventListener('change', (e) => { filterStatus = e.target.value; currentPage = 1; updateTable(); });
  document.getElementById('filter-responsavel')?.addEventListener('change', (e) => { filterResponsavel = e.target.value; currentPage = 1; updateTable(); });
  document.getElementById('filter-reuniao')?.addEventListener('change', (e) => { filterReuniao = e.target.value; currentPage = 1; updateTable(); });

  document.getElementById('btn-add')?.addEventListener('click', () => openModal(null, () => updateTable()));
  // -- Debug logs adicionados para verificar funcionamento
  const btnExport = document.getElementById('btn-export');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      console.log("Botão Exportar clicado");
      exportToExcel();
    });
  } else {
    console.error("Botão btn-export não encontrado!");
  }

  const btnTemplate = document.getElementById('btn-template');
  if (btnTemplate) {
    btnTemplate.addEventListener('click', () => {
      console.log("Botão Modelo XLS clicado");
      downloadTemplateExcel();
    });
  }

  const btnImport = document.getElementById('btn-import');
  if (btnImport) {
    btnImport.addEventListener('click', () => {
      console.log("Botão Importar XLS clicado");
      document.getElementById('file-input').click();
    });
  }

  document.getElementById('file-input')?.addEventListener('change', processExcelImport);

  document.body.addEventListener('click', async function (e) {
    // Lógica de Ordenação: Clica no cabeçalho da tabela
    const sortBtn = e.target.closest('#sort-dataRegistro');
    if (sortBtn) {
      if (sortField === 'dataRegistro') {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = 'dataRegistro';
        sortDirection = 'desc';
      }
      currentPage = 1;
      updateTable();
      return;
    }

    // Lógica de Paginação
    if (e.target.closest('#btn-next-page') || e.target.closest('#btn-next-page-mobile')) { currentPage++; updateTable(); return; }
    if (e.target.closest('#btn-prev-page') || e.target.closest('#btn-prev-page-mobile')) { if (currentPage > 1) { currentPage--; updateTable(); } return; }

    // Lógica de Sidebar
    const sidebarItem = e.target.closest('.sidebar-item');
    if (sidebarItem) {
      const area = sidebarItem.dataset.area;
      if (currentFilter !== area) { currentFilter = area; currentPage = 1; updateTable(); }
      if (window.innerWidth < 1024) closeSidebar();
      return;
    }

    // Lógica de Edição/Exclusão
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      // PERMISSÃO: Qualquer um pode editar? Por enquanto, sim. 
      // Se quiser restringir depois: if (!checkPassword()) return;

      const id = editBtn.dataset.id;
      const compromisso = getCompromissos().find(c => c.id === id);
      openModal(compromisso, () => updateTable());
      return;
    }
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      if (!checkPassword()) return; // Só admin deleta
      if (confirm('Excluir este compromisso?')) {
        await deleteCompromisso(deleteBtn.dataset.id);
        updateTable();
      }
    }
  });
}

function updateTable() {
  const compromissos = getCompromissos();

  // --- APLICA A ORDENAÇÃO AQUI ---
  const sortedCompromissos = [...compromissos].sort((a, b) => {
    const dateA = new Date(a[sortField]);
    const dateB = new Date(b[sortField]);

    let comparison = 0;
    if (dateA > dateB) comparison = 1;
    else if (dateA < dateB) comparison = -1;

    return sortDirection === 'desc' ? comparison * -1 : comparison;
  });

  // Passamos o array ORDENADO para a tabela junto com os parâmetros de ordenação
  document.getElementById('table-container').innerHTML = renderTable(sortedCompromissos, currentFilter, searchTerm, currentPage, filterStatus, filterResponsavel, filterReuniao, sortField, sortDirection);
  document.getElementById('sidebar').innerHTML = renderSidebar(areas, currentFilter);
}

function exportToExcel() {
  try {
    if (typeof window.XLSX === 'undefined') {
      alert("Erro: Biblioteca SheetJS não carregada. Verifique sua conexão com a internet.");
      return;
    }

    const compromissos = getCompromissos();
    const data = compromissos.map(c => ({
      'ID': c.id,
      'Status': c.status,
      'Data Registro': formatDate(c.dataRegistro),
      'Data Prazo': formatDate(c.dataPrazo),
      'Nome Reunião': c.nomeReuniao,
      'Tema': c.tema,
      'Ação': c.acao,
      'Responsável': c.responsavel,
      'Área': c.categoria,
      'Prioridade': c.prioridade,
      'Observação': c.observacao
    }));

    const worksheet = window.XLSX.utils.json_to_sheet(data);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Compromissos");
    window.XLSX.writeFile(workbook, `Compromissos_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (e) {
    console.error("Erro ao exportar:", e);
    alert("Erro ao exportar: " + e.message);
  }
}

function downloadTemplateExcel() {
  try {
    if (typeof window.XLSX === 'undefined') {
      alert("Erro: Biblioteca SheetJS não carregada.");
      return;
    }
    const headers = [
      {
        'ID': '',
        'Status': 'Não Iniciada',
        'Data Registro': '2023-01-01',
        'Data Prazo': '2023-01-15',
        'Nome Reunião': 'Reunião Exemplo',
        'Tema': 'Tema Exemplo',
        'Ação': 'Descrição da Ação',
        'Responsável': 'João Silva',
        'Área': 'Manutenção',
        'Prioridade': 'Alta',
        'Observação': 'Obs'
      }
    ];

    const worksheet = window.XLSX.utils.json_to_sheet(headers);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo");
    window.XLSX.writeFile(workbook, "Modelo_Importacao.xlsx");
  } catch (e) {
    console.error("Erro ao baixar modelo:", e);
    alert("Erro ao baixar modelo: " + e.message);
  }
}

async function processExcelImport(event) {
  try {
    if (typeof window.XLSX === 'undefined') {
      alert("Erro: Biblioteca SheetJS não carregada.");
      return;
    }
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = window.XLSX.utils.sheet_to_json(firstSheet);

        const compromissosParaSalvar = jsonData.map(row => {
          // Helper para converter data Excel (serial ou texto)
          const parseExcelDate = (val) => {
            if (!val) return null;
            if (typeof val === 'number') {
              // Se window.XLSX.SSF estiver disponível (parte do SheetJS)
              if (window.XLSX && window.XLSX.SSF) {
                try {
                  const d = window.XLSX.SSF.parse_date_code(val);
                  if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
                } catch (e) { console.error("Erro parse SSF", e); }
              }
              // Fallback manual aproximado se falhar: (val - 25569) * 86400 * 1000
              return new Date((val - 25569) * 86400 * 1000).toISOString().split('T')[0];
            }
            return val; // Assume string YYYY-MM-DD ou DD/MM/YYYY válida
          };

          return {
            status: row['Status'] || 'Não Iniciada',
            dataRegistro: parseExcelDate(row['Data Registro']) || new Date().toISOString().split('T')[0],
            dataPrazo: parseExcelDate(row['Data Prazo']),
            nomeReuniao: row['Nome Reunião'],
            tema: row['Tema'],
            acao: row['Ação'],
            responsavel: row['Responsável'],
            categoria: row['Área'] || row['Categoria'],
            prioridade: row['Prioridade'],
            observacao: row['Observação']
          };
        });

        if (confirm(`Deseja importar ${compromissosParaSalvar.length} compromissos?`)) {
          await saveCompromissosBulk(compromissosParaSalvar);
          alert('Importação concluída com sucesso!');
          updateTable();
        }
      } catch (innerError) {
        console.error("Erro ao processar arquivo:", innerError);
        alert("Erro ao processar arquivo: " + innerError.message);
      }
      // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
      event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  } catch (e) {
    console.error("Erro ao iniciar importação:", e);
    alert("Erro na importação: " + e.message);
  }
}
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export { currentFilter, searchTerm, updateTable };
