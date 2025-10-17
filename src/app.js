import { getCompromissos, deleteCompromisso, initializeData, getAreas, getReunioes, getResponsaveis } from './services/storage.js';
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
        <p class="text-lg font-medium text-gray-700">Carregando dados...</p>
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
        ${renderSidebar(getAreas(), currentFilter)}
      </aside>

      <div class="flex-1 flex flex-col overflow-hidden">
        ${renderHeader()}
        <main class="flex-1 overflow-y-auto">
          <div class="p-4 lg:p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h1 class="text-2xl font-bold text-gray-900">COMPROMISSO</h1>
              <div class="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
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
  
  document.getElementById('btn-admin-panel')?.addEventListener('click', () => {
    showAdminPasswordPrompt();
  });

  document.getElementById('btn-export')?.addEventListener('click', exportToCSV);
  
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
      // Corrigido: Chama a função que pede a senha.
      showDeletePasswordPrompt(async () => {
          await deleteCompromisso(id);
          updateTable();
          showCustomAlert('Item excluído com sucesso!');
      });
      return;
    }
  });
}

// Função para pedir a senha para exclusão
function showDeletePasswordPrompt(onSuccess) {
    const modalHTML = `
        <div class="modal-overlay" id="password-modal-overlay">
            <div class="modal-content max-w-sm">
                <div class="p-6">
                    <h3 class="text-lg font-bold mb-4">Confirmação Necessária</h3>
                    <p class="text-sm text-gray-600 mb-4">Para excluir este item, por favor, insira a senha de administrador.</p>
                    <form id="password-form">
                        <input type="password" id="password-input" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Senha" required>
                        <div id="password-error" class="text-red-500 text-sm mt-2 hidden">Senha incorreta.</div>
                        <div class="flex justify-end gap-3 mt-6">
                            <button type="button" id="password-cancel-btn" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">Confirmar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('password-modal-overlay');
    const form = document.getElementById('password-form');
    const cancelBtn = document.getElementById('password-cancel-btn');
    const passwordInput = document.getElementById('password-input');
    const errorDiv = document.getElementById('password-error');

    const closeModal = () => overlay.remove();

    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    cancelBtn.addEventListener('click', closeModal);
    passwordInput.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = passwordInput.value;
        if (password === '789512') {
            onSuccess();
            closeModal();
        } else {
            errorDiv.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
}

// Função para pedir a senha para o painel de admin
function showAdminPasswordPrompt() {
    const modalHTML = `
        <div class="modal-overlay" id="admin-password-modal-overlay">
            <div class="modal-content max-w-sm">
                <div class="p-6">
                    <h3 class="text-lg font-bold mb-4">Acesso ao Painel Admin</h3>
                     <p class="text-sm text-gray-600 mb-4">Insira a senha para gerir as tabelas.</p>
                    <form id="admin-password-form">
                        <input type="password" id="admin-password-input" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Senha" required>
                        <div id="admin-password-error" class="text-red-500 text-sm mt-2 hidden">Senha incorreta.</div>
                        <div class="flex justify-end gap-3 mt-6">
                            <button type="button" id="admin-password-cancel-btn" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">Aceder</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('admin-password-modal-overlay');
    const form = document.getElementById('admin-password-form');
    const cancelBtn = document.getElementById('admin-password-cancel-btn');
    const passwordInput = document.getElementById('admin-password-input');
    const errorDiv = document.getElementById('admin-password-error');

    const closeModal = () => overlay.remove();

    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    cancelBtn.addEventListener('click', closeModal);
    passwordInput.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = passwordInput.value;
        if (password === '789512') {
            closeModal();
            renderAdminPage();
        } else {
            errorDiv.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
}

function showCustomAlert(message) {
    const alertHTML = `
        <div id="custom-alert" class="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-pulse">
            ${message}
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    setTimeout(() => {
        document.getElementById('custom-alert')?.remove();
    }, 3000);
}

function updateTable() {
  const compromissos = getCompromissos();
  document.getElementById('table-container').innerHTML = renderTable(compromissos, currentFilter, searchTerm);
  document.getElementById('sidebar').innerHTML = renderSidebar(getAreas(), currentFilter);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function exportToCSV() {
  const compromissos = getCompromissos();
  const headers = ['Prioridade', 'Nome da Reunião', 'Data Registro', 'Tema', 'Ação', 'Responsável', 'Data Prazo', 'Área'];
  const rows = compromissos.map(c => [
    c.prioridade,
    `"${c.nomeReuniao ? c.nomeReuniao.replace(/"/g, '""') : ''}"`,
    formatDate(c.dataRegistro),
    `"${c.tema ? c.tema.replace(/"/g, '""') : ''}"`,
    `"${c.acao ? c.acao.replace(/"/g, '""') : ''}"`,
    c.responsavel,
    formatDate(c.dataPrazo),
    c.categoria
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'compromissos.csv';
  link.click();
}

export { currentFilter, searchTerm, updateTable, initApp };

