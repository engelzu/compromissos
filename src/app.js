import { areas } from './data/areas.js';
import { getCompromissos, deleteCompromisso, initializeData, saveCompromissosBulk, saveCompromisso } from './services/storage.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';
import { renderTable } from './components/table.js';
import { openModal } from './components/modal.js';
import { renderAdminPage } from './components/admin.js'; 

let currentFilter = 'TODOS';
let searchTerm = '';
// VARIÁVEL DE PAGINAÇÃO
let currentPage = 1;

export async function initApp() {
  const app = document.getElementById('app');
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
                <input type="file" id="file-input" accept=".xlsx, .xls" class="hidden" />
                <button id="btn-template" class="btn-secondary text-sm">Modelo XLS 🔒</button>
                <button id="btn-import" class="btn-secondary text-sm">Importar XLS 🔒</button>
                
                <button id="btn-export" class="btn-secondary text-sm">Exportar</button>
                <button id="btn-add" class="btn-primary text-sm whitespace-nowrap">+ NOVO REG...</button>
              </div>
            </div>
            <div id="table-container">
              ${renderTable(getCompromissos(), currentFilter, searchTerm, currentPage)}
            </div>
          </div>
        </main>
      </div>
    </div>
    <div id="modal-container"></div>`;
}

// FUNÇÃO DE SEGURANÇA
function checkPassword() {
    const pass = prompt("Digite a senha de administrador:");
    if (pass === "789512") {
        return true;
    }
    alert("Senha incorreta!");
    return false;
}

function setupEventListeners() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  const closeSidebar = () => { sidebar?.classList.add('-translate-x-full'); sidebarOverlay?.classList.add('hidden'); };
  const openSidebar = () => { sidebar?.classList.remove('-translate-x-full'); sidebarOverlay?.classList.remove('hidden'); };

  document.getElementById('btn-admin-panel')?.addEventListener('click', (e) => { e.preventDefault(); renderAdminPage(); });
  sidebarToggle?.addEventListener('click', (e) => { e.stopPropagation(); sidebar?.classList.contains('-translate-x-full') ? openSidebar() : closeSidebar(); });
  sidebarOverlay?.addEventListener('click', closeSidebar);
  
  // Busca: Reseta para página 1 quando pesquisa
  document.getElementById('search-input')?.addEventListener('input', (e) => { 
      searchTerm = e.target.value; 
      currentPage = 1; // Reseta página
      updateTable(); 
  });
  
  document.getElementById('btn-add')?.addEventListener('click', () => openModal(null, () => updateTable()));
  document.getElementById('btn-export')?.addEventListener('click', exportToExcel);

  // --- EVENTOS COM SENHA ---
  document.getElementById('btn-template')?.addEventListener('click', () => {
      if (checkPassword()) downloadTemplateExcel();
  });

  document.getElementById('btn-import')?.addEventListener('click', () => {
      if (checkPassword()) document.getElementById('file-input').click();
  });
  
  document.getElementById('file-input')?.addEventListener('change', processExcelImport);
  
  // DELEGAÇÃO DE EVENTOS (Para botões que são recriados, como a paginação)
  document.body.addEventListener('click', async function(e) {
    
    // Paginação - Próximo
    if (e.target.closest('#btn-next-page') || e.target.closest('#btn-next-page-mobile')) {
        currentPage++;
        updateTable();
        return;
    }

    // Paginação - Anterior
    if (e.target.closest('#btn-prev-page') || e.target.closest('#btn-prev-page-mobile')) {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
        return;
    }

    const sidebarItem = e.target.closest('.sidebar-item');
    if (sidebarItem) {
      const area = sidebarItem.dataset.area;
      if (currentFilter !== area) {
          currentFilter = area;
          currentPage = 1; // Reseta página ao mudar filtro
          updateTable();
      }
      if (window.innerWidth < 1024) closeSidebar();
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
      if (confirm('Excluir este compromisso?')) {
        await deleteCompromisso(deleteBtn.dataset.id);
        updateTable();
      }
    }
  });
}

function updateTable() {
  // Sempre passa a página atual para renderizar corretamente
  document.getElementById('table-container').innerHTML = renderTable(getCompromissos(), currentFilter, searchTerm, currentPage);
  document.getElementById('sidebar').innerHTML = renderSidebar(areas, currentFilter);
}

function exportToExcel() {
  const compromissos = getCompromissos();
  const dataToExport = compromissos.map(c => ({
    'Prioridade': c.prioridade, 'Nome da Reunião': c.nomeReuniao, 'Data Registro': formatDate(c.dataRegistro),
    'Tema': c.tema, 'Ação': c.acao, 'Responsável': c.responsavel, 'Data Prazo': formatDate(c.dataPrazo),
    'Área': c.categoria, 'Status': c.status
  }));
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  ws['!cols'] = [{wch: 10}, {wch: 30}, {wch: 15}, {wch: 30}, {wch: 40}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Compromissos");
  XLSX.writeFile(wb, "Compromissos.xlsx");
}

function downloadTemplateExcel() {
  const headers = [{
    'Prioridade': 1, 'Nome da Reunião': 'Reunião Diária', 'Data Registro': '2025-11-20', 'Tema': 'Planejamento',
    'Ação': 'Verificar', 'Responsável': 'João', 'Data Prazo': '2025-11-25', 'Área': 'TI', 'Status': 'Em Andamento'
  }];
  const ws = XLSX.utils.json_to_sheet(headers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Modelo Importação");
  XLSX.writeFile(wb, "Modelo_Compromissos.xlsx");
}

async function processExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const btnImport = document.getElementById('btn-import');
    const originalText = btnImport.innerHTML;
    btnImport.innerHTML = 'Lendo...';
    btnImport.disabled = true;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array', cellDates: true});
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

            if (jsonData.length === 0) { alert("Planilha vazia."); btnImport.innerHTML = originalText; btnImport.disabled = false; return; }

            if (confirm(`Encontrados ${jsonData.length} registros. Confirmar importação?`)) {
                btnImport.innerHTML = 'Processando...';
                
                const listaParaSalvar = [];
                for (let row of jsonData) {
                    const safeDate = (val) => {
                        if (!val) return null;
                        if (val instanceof Date) return val.toISOString().split('T')[0];
                        if (typeof val === 'string' && val.includes('/')) {
                           const parts = val.split('/'); return `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                        return new Date().toISOString().split('T')[0];
                    };

                    if (!row['Nome da Reunião']) continue;

                    listaParaSalvar.push({
                        prioridade: parseInt(row['Prioridade']) || 3,
                        nomeReuniao: row['Nome da Reunião'],
                        dataRegistro: safeDate(row['Data Registro']),
                        tema: row['Tema'] || '',
                        acao: row['Ação'] || '',
                        responsavel: row['Responsável'] || '',
                        dataPrazo: safeDate(row['Data Prazo']),
                        categoria: row['Área'] || 'Geral',
                        status: row['Status'] || 'Não Iniciada'
                    });
                }

                const TAMANHO_LOTE = 50;
                let salvos = 0;
                for (let i = 0; i < listaParaSalvar.length; i += TAMANHO_LOTE) {
                    const lote = listaParaSalvar.slice(i, i + TAMANHO_LOTE);
                    btnImport.innerHTML = `Salvando ${i} de ${listaParaSalvar.length}...`;
                    await saveCompromissosBulk(lote);
                    salvos += lote.length;
                }

                await updateTable();
                alert(`Sucesso! ${salvos} registros importados.`);
            }
        } catch (error) {
            console.error(error);
            alert("Erro: " + error.message);
        } finally {
            btnImport.innerHTML = originalText;
            btnImport.disabled = false;
            document.getElementById('file-input').value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export { currentFilter, searchTerm, updateTable };
