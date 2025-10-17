
import { supabase } from '../services/supabase.js';

// Variáveis para guardar os dados em memória
let areas = [];
let reunioes = [];
let responsaveis = [];

// Função para buscar todos os dados iniciais
async function fetchData() {
    const { data: areasData, error: areasError } = await supabase.from('areas').select('*');
    if (areasError) console.error('Erro ao buscar áreas:', areasError);
    else areas = areasData;

    // Adicione aqui a busca por 'reunioes' e 'responsaveis' se desejar
}

// Renderiza a tabela de gestão para um item específico (ex: 'areas')
function renderManagementTable(tableName, items, columns) {
    return `
        <div class="bg-white p-6 rounded-lg shadow-md mb-8">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800 capitalize">${tableName}</h3>
                <button class="btn-primary text-sm btn-add-item" data-table="${tableName}">+ Nova</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50">
                            ${columns.map(col => `<th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">${col}</th>`).join('')}
                            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr class="border-b">
                                ${columns.map(col => `<td class="px-4 py-2">${item[col] || ''}</td>`).join('')}
                                <td class="px-4 py-2">
                                    <button class="btn-edit-item text-blue-600 p-1" data-table="${tableName}" data-id="${item.id}">✏️</button>
                                    <button class="btn-delete-item text-red-600 p-1" data-table="${tableName}" data-id="${item.id}">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Renderiza a página de administração completa
export async function renderAdminPage() {
    await fetchData();
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div class="max-w-4xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-bold text-gray-900">Painel de Administração</h2>
                    <button id="back-to-app" class="btn-secondary text-sm">← Voltar para Compromissos</button>
                </div>

                <!-- Gestão de Áreas -->
                ${renderManagementTable('areas', areas, ['name', 'icon'])}

                <!-- Adicione aqui as tabelas para 'reunioes' e 'responsaveis' -->

            </div>
        </div>
    `;

    setupAdminEventListeners();
}

// Lida com os eventos da página de admin
function setupAdminEventListeners() {
    document.getElementById('back-to-app').addEventListener('click', () => {
        // Esta função precisa ser importada de app.js ou definida globalmente
        // Por agora, vamos apenas recarregar a aplicação principal.
        window.location.reload(); 
    });

    document.querySelectorAll('.btn-add-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const tableName = e.currentTarget.dataset.table;
            openItemModal(tableName, null, async () => {
                await renderAdminPage();
            });
        });
    });

    document.querySelectorAll('.btn-edit-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const tableName = e.currentTarget.dataset.table;
            const id = e.currentTarget.dataset.id;
            const item = (tableName === 'areas' ? areas : []).find(i => i.id == id);
            openItemModal(tableName, item, async () => {
                await renderAdminPage();
            });
        });
    });

     document.querySelectorAll('.btn-delete-item').forEach(button => {
        button.addEventListener('click', async (e) => {
            const tableName = e.currentTarget.dataset.table;
            const id = e.currentTarget.dataset.id;
            if (confirm(`Tem certeza que deseja excluir este item de '${tableName}'?`)) {
                const { error } = await supabase.from(tableName).delete().eq('id', id);
                if (error) {
                    alert('Erro ao excluir item: ' + error.message);
                } else {
                    await renderAdminPage();
                }
            }
        });
    });
}

// Modal genérico para adicionar/editar itens
function openItemModal(tableName, item = null, onSave) {
    const isEdit = !!item;
    const columns = (tableName === 'areas' ? ['name', 'icon'] : []);
    
    const fields = columns.map(col => `
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2 capitalize">${col}</label>
            <input type="text" name="${col}" required value="${item ? item[col] : ''}" class="w-full px-4 py-2 border rounded-lg">
        </div>
    `).join('');

    const modalHTML = `
        <div class="modal-overlay" id="item-modal-overlay">
            <div class="modal-content max-w-md">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-4">${isEdit ? 'Editar' : 'Novo'} Item em ${tableName}</h3>
                    <form id="item-form">
                        ${fields}
                        <div class="flex justify-end gap-3 mt-6">
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

