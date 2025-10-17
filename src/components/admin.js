import { supabase } from '../services/supabase.js';

// Variáveis para guardar os dados em memória
let areas = [];
let reunioes = [];
let responsaveis = [];

// Função para buscar todos os dados iniciais das tabelas de configuração
async function fetchAdminData() {
    const { data: areasData, error: areasError } = await supabase.from('areas').select('*').order('name');
    if (areasError) console.error('Erro ao buscar áreas:', areasError);
    else areas = areasData;

    const { data: reunioesData, error: reunioesError } = await supabase.from('reunioes').select('*').order('name');
    if (reunioesError) console.error('Erro ao buscar reuniões:', reunioesError);
    else reunioes = reunioesData;
    
    const { data: responsaveisData, error: responsaveisError } = await supabase.from('responsaveis').select('*').order('name');
    if (responsaveisError) console.error('Erro ao buscar responsáveis:', responsaveisError);
    else responsaveis = responsaveisData;
}

// Renderiza uma tabela de gestão genérica
function renderManagementTable(tableName, items, columns) {
    const tableTitle = tableName.charAt(0).toUpperCase() + tableName.slice(1);
    return `
        <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 class="text-xl font-bold text-gray-800">${tableTitle}</h3>
                <button class="btn-primary text-sm btn-add-item w-full sm:w-auto" data-table="${tableName}">+ Novo(a) ${tableTitle.slice(0, -1)}</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            ${columns.map(col => `<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">${col.name}</th>`).join('')}
                            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${items.map(item => `
                            <tr class="hover:bg-gray-50">
                                ${columns.map(col => `<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${item[col.key] || ''}</td>`).join('')}
                                <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <button class="btn-edit-item text-blue-600 hover:text-blue-800 p-1" data-table="${tableName}" data-id="${item.id}" title="Editar">✏️</button>
                                    <button class="btn-delete-item text-red-600 hover:text-red-800 p-1" data-table="${tableName}" data-id="${item.id}" title="Excluir">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                 ${items.length === 0 ? '<p class="text-center text-gray-500 py-4">Nenhum item encontrado.</p>' : ''}
            </div>
        </div>
    `;
}

// Renderiza a página de administração completa
export async function renderAdminPage() {
    await fetchAdminData();
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div class="max-w-5xl mx-auto">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h2 class="text-3xl font-bold text-gray-900">Painel de Administração</h2>
                    <button id="back-to-app" class="btn-secondary text-sm w-full sm:w-auto">← Voltar para Compromissos</button>
                </div>

                ${renderManagementTable('areas', areas, [{name: 'Nome', key: 'name'}, {name: 'Ícone', key: 'icon'}])}
                ${renderManagementTable('reunioes', reunioes, [{name: 'Nome da Reunião', key: 'name'}])}
                ${renderManagementTable('responsaveis', responsaveis, [{name: 'Nome do Responsável', key: 'name'}])}
            </div>
        </div>
    `;

    setupAdminEventListeners();
}

// Lida com os eventos da página de admin
function setupAdminEventListeners() {
    document.getElementById('back-to-app').addEventListener('click', () => {
        window.location.reload(); 
    });

    document.querySelectorAll('.btn-add-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const tableName = e.currentTarget.dataset.table;
            openItemModal(tableName, null, renderAdminPage);
        });
    });

    document.body.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-item');
        if (editBtn) {
            const tableName = editBtn.dataset.table;
            const id = editBtn.dataset.id;
            let item;
            if (tableName === 'areas') item = areas.find(i => i.id == id);
            if (tableName === 'reunioes') item = reunioes.find(i => i.id == id);
            if (tableName === 'responsaveis') item = responsaveis.find(i => i.id == id);
            
            openItemModal(tableName, item, renderAdminPage);
        }

        const deleteBtn = e.target.closest('.btn-delete-item');
        if (deleteBtn) {
            const tableName = deleteBtn.dataset.table;
            const id = deleteBtn.dataset.id;
            // Usar um modal customizado para confirmação
            showConfirmationModal(`Tem certeza que deseja excluir este item de '${tableName}'?`, async () => {
                const { error } = await supabase.from(tableName).delete().eq('id', id);
                if (error) {
                    alert('Erro ao excluir item: ' + error.message);
                } else {
                    await renderAdminPage();
                }
            });
        }
    });
}

// Modal genérico para adicionar/editar itens
function openItemModal(tableName, item = null, onSave) {
    const isEdit = !!item;
    let columns = [];
    if (tableName === 'areas') columns = [{name: 'Nome', key: 'name'}, {name: 'Ícone', key: 'icon'}];
    if (tableName === 'reunioes') columns = [{name: 'Nome da Reunião', key: 'name'}];
    if (tableName === 'responsaveis') columns = [{name: 'Nome do Responsável', key: 'name'}];
    
    const fields = columns.map(col => `
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">${col.name}</label>
            <input type="text" name="${col.key}" required value="${item ? item[col.key] : ''}" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
        </div>
    `).join('');

    const modalHTML = `
        <div class="modal-overlay" id="item-modal-overlay">
            <div class="modal-content max-w-md">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-4">${isEdit ? 'Editar' : 'Novo'} Item em ${tableName}</h3>
                    <form id="item-form">
                        ${fields}
                        <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button type="button" id="item-cancel-btn" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">${isEdit ? 'Atualizar' : 'Salvar'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('item-modal-overlay');
    const form = document.getElementById('item-form');
    const cancelBtn = document.getElementById('item-cancel-btn');

    const closeModal = () => overlay.remove();

    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    cancelBtn.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const newData = Object.fromEntries(formData.entries());

        let error;
        if (isEdit) {
            ({ error } = await supabase.from(tableName).update(newData).eq('id', item.id));
        } else {
            ({ error } = await supabase.from(tableName).insert([newData]));
        }

        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            closeModal();
            onSave();
        }
    });
}

// Função para mostrar um modal de confirmação
function showConfirmationModal(message, onConfirm) {
  const modalHTML = `
    <div id="confirmation-modal" class="modal-overlay">
      <div class="modal-content max-w-sm">
        <div class="p-6">
          <p class="text-gray-800 mb-6">${message}</p>
          <div class="flex justify-end gap-3">
            <button id="confirm-cancel" class="btn-secondary">Cancelar</button>
            <button id="confirm-ok" class="btn-primary bg-red-600 hover:bg-red-700">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('confirmation-modal');
  const cancelBtn = document.getElementById('confirm-cancel');
  const okBtn = document.getElementById('confirm-ok');

  const closeModal = () => modal.remove();

  cancelBtn.addEventListener('click', closeModal);
  okBtn.addEventListener('click', () => {
    onConfirm();
    closeModal();
  });
  modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
  });
}

