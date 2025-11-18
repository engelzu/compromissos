import { areas } from './data/areas.js';
import { getCompromissos, deleteCompromisso, initializeData, saveCompromisso } from './services/storage.js';
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
                
                <input type="file" id="file-input" accept=".xlsx, .xls" class="hidden" />
                
                <button id="btn-template" class="btn-secondary text-sm" title="Baixar Modelo Excel">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Modelo XLS
                </button>

                <button id="btn-import" class="btn-secondary text-sm" title="Importar Planilha Excel">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  Importar XLS
                </button>

                <button id="btn-export" class="btn-secondary text-sm" title="Exportar para Excel">
                  <svg class="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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

  // LISTENERS ATUALIZADOS PARA EXCEL
  document.getElementById('btn-export')?.addEventListener('click', exportToExcel);
  document.getElementById('btn-template')?.addEventListener('click', downloadTemplateExcel);
  document.getElementById('btn-import')?.addEventListener('click', triggerImport);
  document.getElementById('file-input')?.addEventListener('change', processExcel); // Mudou para processExcel

  
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

// --- FUNÇÕES DE EXCEL ---

// 1. EXPORTAR DADOS PARA EXCEL
function exportToExcel() {
  const compromissos = getCompromissos();
  
  // Mapeia os dados para o formato amigável do Excel
  const dataToExport = compromissos.map(c => ({
    'Prioridade': c.prioridade,
    'Nome da Reunião': c.nomeReuniao,
    'Data Registro': formatDate(c.dataRegistro),
    'Tema': c.tema,
    'Ação': c.acao,
    'Responsável': c.responsavel,
    'Data Prazo': formatDate(c.dataPrazo),
    'Área': c.categoria,
    'Status': c.status
  }));

  // Cria a planilha usando a biblioteca XLSX
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  
  // Ajusta largura das colunas (opcional, mas fica bonito)
  const wscols = [
    {wch: 10}, // Prioridade
    {wch: 30}, // Nome
    {wch: 15}, // Data Reg
    {wch: 30}, // Tema
    {wch: 40}, // Ação
    {wch: 25}, // Responsável
    {wch: 15}, // Data Prazo
    {wch: 15}, // Área
    {wch: 15}  // Status
  ];
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Compromissos");

  // Baixa o arquivo
  XLSX.writeFile(wb, "Compromissos.xlsx");
}

// 2. BAIXAR MODELO EM BRANCO (EXCEL)
function downloadTemplateExcel() {
  // Cria apenas os cabeçalhos
  const headers = [
    {
      'Prioridade': 1, 
      'Nome da Reunião': 'Ex: Reunião Diária', 
      'Data Registro': '2025-11-20', 
      'Tema': 'Planejamento', 
      'Ação': 'Verificar pendências', 
      'Responsável': 'João Silva', 
      'Data Prazo': '2025-11-25', 
      'Área': 'TI',
      'Status': 'Em Andamento'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(headers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Modelo Importação");

  XLSX.writeFile(wb, "Modelo_Compromissos.xlsx");
}

function triggerImport() {
    document.getElementById('file-input').click();
}

// 3. PROCESSAR ARQUIVO EXCEL ENVIADO
async function processExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array', cellDates: true}); // cellDates: true converte datas do Excel para JS Date

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            alert("A planilha parece estar vazia.");
            return;
        }

        if (confirm(`Encontrados ${jsonData.length} registros. Deseja importar?`)) {
            const btnImport = document.getElementById('btn-import');
            const originalText = btnImport.innerHTML;
            btnImport.innerHTML = 'Importando...';
            btnImport.disabled = true;

            let successCount = 0;
            let errorCount = 0;

            for (let row of jsonData) {
                try {
                    // Função auxiliar para converter Data JS para string YYYY-MM-DD
                    const safeDate = (val) => {
                        if (!val) return null;
                        if (val instanceof Date) return val.toISOString().split('T')[0];
                        // Se veio como texto dd/mm/aaaa, tenta converter (básico)
                        if (typeof val === 'string' && val.includes('/')) {
                            const parts = val.split('/');
                            return `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                        return val; // Retorna como está se não for data nem texto comum
                    };

                    const novoCompromisso = {
                        prioridade: parseInt(row['Prioridade']) || 3,
                        nomeReuniao: row['Nome da Reunião'] || '',
                        dataRegistro: safeDate(row['Data Registro']) || new Date().toISOString().split('T')[0],
                        tema: row['Tema'] || '',
                        acao: row['Ação'] || '',
                        responsavel: row['Responsável'] || '',
                        dataPrazo: safeDate(row['Data Prazo']),
                        categoria: row['Área'] || 'Geral',
                        status: row['Status'] || 'Não Iniciada'
                    };

                    // Validação mínima
                    if (!novoCompromisso.nomeReuniao) {
                        console.warn('Linha ignorada (sem nome):', row);
                        errorCount++;
                        continue;
                    }

                    await saveCompromisso(novoCompromisso);
                    successCount++;
                } catch (err) {
                    console.error("Erro ao importar linha:", row, err);
                    errorCount++;
                }
            }

            btnImport.innerHTML = originalText;
            btnImport.disabled = false;
            document.getElementById('file-input').value = ''; 
            
            await updateTable();
            alert(`Importação concluída!\nSucesso: ${successCount}\nErros/Ignorados: ${errorCount}`);
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
