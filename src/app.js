import { areas } from './data/areas.js';
import { getCompromissos, deleteCompromisso, initializeData, saveCompromisso } from './services/storage.js'; // ADICIONEI saveCompromisso
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';
import { renderTable } from './components/table.js';
import { openModal } from './components/modal.js';
import { renderAdminPage } from './components/admin.js'; 

let currentFilter = 'TODOS';
let searchTerm = '';

export async function initApp() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <svg class="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-lg font-medium text-gray-700">Conectando ao banco de dados...</p>
      </div>
    </div>
  `;

  await initializeData();
  
  renderApp();
  setupEventListeners();
}

function renderApp() {
  const app = document.getElementById('app');
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
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h1 class="text-2xl font-bold text-gray-900">COMPROMISSO</h1>
              <div class="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
                
                <input type="file" id="file-input" accept=".csv" class="hidden" />
                
                <button id="btn-template" class="btn-secondary text-sm" title="Baixar Modelo para Preencher">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Modelo
                </button>

                <button id="btn-import" class="btn-secondary text-sm" title="Importar CSV Preenchido">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  Importar
                </button>
                <button id="btn-export" class="btn-secondary text-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Exportar
                </button>
                
                <button id="btn-add" class="btn-primary text-sm whitespace-nowrap">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                  NOVO REG...
                </button>
              </div>
            </div>
            <div id="table-container">
              ${renderTable(getCompromissos(), currentFilter, searchTerm)}
            </div>
          </div>
        </main>
      </div>
    </div>
    <div id="modal-container"></div>
  `;
}

function setupEventListeners() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  const closeSidebar = () => {
    sidebar?.classList.add('-translate-x-full');
    sidebarOverlay?.classList.add('hidden');
  };
  
  const openSidebar = () => {
    sidebar?.classList.remove('-translate-x-full');
    sidebarOverlay?.classList.remove('hidden');
  };

  document.getElementById('btn-admin-panel')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderAdminPage();
  });

  sidebarToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar?.classList.contains('-translate-x-full')) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

  sidebarOverlay?.addEventListener('click', closeSidebar);

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    updateTable();
  });

  document.getElementById('btn-add')?.addEventListener('click', () => {
    openModal(null, () => updateTable());
  });

  document.getElementById('btn-export')?.addEventListener('click', exportToCSV);
  
  // NOVOS LISTENERS
  document.getElementById('btn-template')?.addEventListener('click', downloadTemplate);
  document.getElementById('btn-import')?.addEventListener('click', triggerImport);
  document.getElementById('file-input')?.addEventListener('change', processCSV);

  
  document.body.addEventListener('click', async function(e) {
    const sidebarItem = e.target.closest('.sidebar-item');
    if (sidebarItem) {
      const area = sidebarItem.dataset.area;
      if (currentFilter !== area) {
        currentFilter = area;
        updateTable();
      }
      if (window.innerWidth < 1024) {
        closeSidebar();
      }
      return;
    }

    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const compromisso = getCompromissos().find(c => c.id === id);
      openModal(compromisso, () => updateTable());
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Tem certeza que deseja excluir este compromisso?')) {
        await deleteCompromisso(id);
        updateTable();
      }
      return;
    }
  });
}

function updateTable() {
  const compromissos = getCompromissos();
  document.getElementById('table-container').innerHTML = renderTable(compromissos, currentFilter, searchTerm);
  document.getElementById('sidebar').innerHTML = renderSidebar(areas, currentFilter);
}

function exportToCSV() {
  const compromissos = getCompromissos();
  const headers = ['Prioridade', 'Nome da Reunião', 'Data Registro', 'Tema', 'Ação', 'Responsável', 'Data Prazo', 'Área', 'Status'];
  const rows = compromissos.map(c => [
    c.prioridade,
    `"${(c.nomeReuniao || '').replace(/"/g, '""')}"`,
    formatDate(c.dataRegistro),
    `"${(c.tema || '').replace(/"/g, '""')}"`,
    `"${(c.acao || '').replace(/"/g, '""')}"`,
    `"${(c.responsavel || '').replace(/"/g, '""')}"`,
    formatDate(c.dataPrazo),
    `"${(c.categoria || '').replace(/"/g, '""')}"`,
    `"${(c.status || '').replace(/"/g, '""')}"`
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'compromissos.csv';
  link.click();
}

// NOVA FUNÇÃO: Baixar modelo em branco
function downloadTemplate() {
    // Define os cabeçalhos exatos que esperamos na importação
    const headers = ['Prioridade', 'Nome da Reunião', 'Data Registro (AAAA-MM-DD)', 'Tema', 'Ação', 'Responsável', 'Data Prazo (AAAA-MM-DD)', 'Área', 'Status'];
    
    // Exemplo de linha para ajudar o usuário (opcional)
    const exampleRow = ['1', 'Reunião Diária', '2025-10-20', 'Planejamento', 'Criar pauta', 'João Silva', '2025-10-25', 'TI', 'Em Andamento'];
    
    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao.csv';
    link.click();
}

// NOVA FUNÇÃO: Clicar no input invisível
function triggerImport() {
    document.getElementById('file-input').click();
}

// NOVA FUNÇÃO: Processar o arquivo enviado
async function processCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n');
        
        // Remove cabeçalho
        const dataRows = rows.slice(1); 
        let successCount = 0;
        let errorCount = 0;

        if (confirm(`Encontradas ${dataRows.length} linhas (incluindo possíveis vazias). Deseja importar?`)) {
             // Mostra loading simples
            const btnImport = document.getElementById('btn-import');
            const originalText = btnImport.innerHTML;
            btnImport.innerHTML = 'Importando...';
            btnImport.disabled = true;

            for (let row of dataRows) {
                // Pula linhas vazias
                if (!row || row.trim() === '') continue;

                // Lógica simples para separar por vírgula, respeitando aspas
                // Regex que separa por virgula mas ignora virgula dentro de aspas
                const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                
                // Se o regex falhar ou a linha estiver mal formatada, tenta split simples
                const columns = cols ? cols.map(c => c.replace(/^"|"$/g, '').trim()) : row.split(',');

                if (columns.length < 5) { // Validação mínima
                    errorCount++;
                    continue;
                }

                try {
                    const novoCompromisso = {
                        prioridade: parseInt(columns[0]) || 3, // Padrão 3 se falhar
                        nomeReuniao: columns[1],
                        dataRegistro: columns[2], // Espera formato AAAA-MM-DD
                        tema: columns[3],
                        acao: columns[4],
                        responsavel: columns[5],
                        dataPrazo: columns[6],
                        categoria: columns[7],
                        status: columns[8] || 'Não Iniciada'
                    };

                    await saveCompromisso(novoCompromisso);
                    successCount++;
                } catch (err) {
                    console.error("Erro na linha:", row, err);
                    errorCount++;
                }
            }

            // Restaura botão e atualiza tabela
            btnImport.innerHTML = originalText;
            btnImport.disabled = false;
            document.getElementById('file-input').value = ''; // Limpa input para permitir selecionar mesmo arquivo
            
            await updateTable();
            alert(`Importação concluída!\nSucesso: ${successCount}\nErros/Ignorados: ${errorCount}`);
        }
    };
    reader.readAsText(file);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export { currentFilter, searchTerm, updateTable };
