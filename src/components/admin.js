import { supabase } from '../services/supabase.js';
// Importamos a nova função
import { sanitizeDatabase } from '../services/storage.js';

let areas = [];
let reunioes = [];
let responsaveis = [];
let allowedUsers = [];

async function fetchAdminData() {
    try {
        const { data: areasData, error: areasError } = await supabase.from('areas').select('*').order('name');
        if (areasError) throw areasError;
        areas = areasData || [];

        const { data: reunioesData, error: reunioesError } = await supabase.from('reunioes').select('*').order('name');
        if (reunioesError) throw reunioesError;
        reunioes = reunioesData || [];

        const { data: responsaveisData, error: responsaveisError } = await supabase.from('responsaveis').select('*').order('name');
        if (responsaveisError) throw responsaveisError;
        responsaveis = responsaveisData || [];

        // Tenta buscar usuários permitidos. Se a tabela não existir, ignora (para não travar tudo)
        const { data: usersData, error: usersError } = await supabase.from('allowed_users').select('*').order('email');
        if (!usersError) {
            allowedUsers = usersData || [];
        } else {
            console.warn("Tabela 'allowed_users' provavelmente não existe ainda.", usersError.message);
            allowedUsers = [];
        }

    } catch (error) {
        console.error("Erro ao carregar dados do admin:", error);
        alert("Erro ao carregar dados: " + error.message);
    }
}

function renderManagementTable(tableName, items, columns, extraButtons = '') {
    const tableTitle = tableName === 'allowed_users' ? 'Usuários Permitidos (Acesso)' : tableName.charAt(0).toUpperCase() + tableName.slice(1);
    return `
        <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 class="text-xl font-bold text-gray-800">${tableTitle}</h3>
                <div class="flex gap-2 w-full sm:w-auto">
                    ${extraButtons}
                    <button class="btn-primary text-sm btn-add-item w-full sm:w-auto" data-table="${tableName}">+ Novo(a)</button>
                </div>
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
                                    <button class="text-blue-600 hover:text-blue-800 p-2 btn-edit-item" data-table="${tableName}" data-id="${item.id}" title="Editar">✏️</button>
                                    <button class="text-red-600 hover:text-red-800 p-2 btn-delete-item" data-table="${tableName}" data-id="${item.id}" title="Excluir">🗑️</button>
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

export async function renderAdminPage() {
    await fetchAdminData();
    const app = document.getElementById('app');

    app.innerHTML = `
        <div id="admin-container" class="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div class="max-w-5xl mx-auto">
                
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h2 class="text-3xl font-bold text-gray-900">Painel de Administração</h2>
                    
                    <div class="flex gap-2">
                        <button id="btn-fix-data" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                           Corrigir Dados
                        </button>

                        <button id="back-to-app" class="btn-secondary text-sm">← Voltar</button>
                    </div>
                </div>

                ${renderManagementTable('allowed_users', allowedUsers, [{ name: 'E-mail Permitido', key: 'email' }],
        `<input type="file" id="import-emails" accept=".csv,.txt" class="hidden">
                     <button id="btn-email-template" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">📄 Template</button>
                     <button onclick="document.getElementById('import-emails').click()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">📂 Importar Lista</button>`
    )}

                ${renderManagementTable('areas', areas, [{ name: 'Nome', key: 'name' }, { name: 'Ícone', key: 'icon' }])}
                ${renderManagementTable('reunioes', reunioes, [{ name: 'Nome da Reunião', key: 'name' }])}
                ${renderManagementTable('responsaveis', responsaveis, [{ name: 'Nome do Responsável', key: 'name' }])}
            </div>
        </div>
    `;

    attachEvents();
}

function attachEvents() {
    document.getElementById('back-to-app').addEventListener('click', () => { window.location.reload(); });

    document.querySelectorAll('.btn-add-item').forEach(btn => {
        btn.addEventListener('click', (e) => { openItemModal(e.target.dataset.table, null, renderAdminPage); });
    });

    // BOTÃO DE TEMPLATE
    document.getElementById('btn-email-template')?.addEventListener('click', () => {
        const content = "exemplo1@email.com.br\nfuncionario@empresa.com\nusuario.teste@gmail.com";
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_emails.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });

    // EVENTO DE IMPORTAÇÃO DE EMAILS
    document.getElementById('import-emails')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm("Isso irá adicionar todos os e-mails do arquivo à lista de permitidos. Continuar?")) {
            e.target.value = ''; // Reset
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            // Quebra por linha, remove espaços, remove vazios e remove duplicatas
            const emails = [...new Set(text.split(/[\r\n,;]+/).map(t => t.trim()).filter(t => t.length > 5 && t.includes('@')))];

            if (emails.length === 0) {
                alert("Nenhum e-mail válido encontrado no arquivo.");
                return;
            }

            try {
                // Prepara para inserção (mapeia para objetos)
                const inserts = emails.map(email => ({ email }));

                // Supabase insert
                const { error } = await supabase.from('allowed_users').insert(inserts).select();

                if (error) throw error;

                alert(`${emails.length} e-mails importados com sucesso!`);
                renderAdminPage();
            } catch (err) {
                console.error(err);
                alert(`Erro ao importar: ${err.message}\nVerifique se a tabela 'allowed_users' existe.`);
            }
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    });

    // EVENTO DO BOTÃO DE CORRIGIR DADOS
    document.getElementById('btn-fix-data')?.addEventListener('click', async () => {
        if (confirm("Isso vai verificar todos os registros e remover espaços em branco dos nomes. Pode levar alguns segundos. Continuar?")) {
            const btn = document.getElementById('btn-fix-data');
            const originalText = btn.innerHTML;
            btn.disabled = true;

            try {
                // Chama a função de limpeza com callback de progresso
                const totalCorrigidos = await sanitizeDatabase((current, total, corrected) => {
                    btn.innerHTML = `Verificando ${current}/${total}...`;
                });

                alert(`Processo concluído!\n${totalCorrigidos} registros foram corrigidos.`);
            } catch (error) {
                alert("Erro ao corrigir: " + error.message);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    });

    const container = document.getElementById('admin-container');
    container.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.btn-delete-item');
        if (deleteBtn) {
            if (confirm(`Tem certeza que deseja EXCLUIR este item?`)) {
                try {
                    const { error } = await supabase.from(deleteBtn.dataset.table).delete().eq('id', deleteBtn.dataset.id);
                    if (error) throw error;
                    await renderAdminPage();
                } catch (err) {
                    alert("Erro ao excluir: " + err.message);
                }
            }
            return;
        }

        const editBtn = e.target.closest('.btn-edit-item');
        if (editBtn) {
            const tableName = editBtn.dataset.table;
            const id = editBtn.dataset.id;
            let item;
            if (tableName === 'areas') item = areas.find(i => i.id == id);
            if (tableName === 'reunioes') item = reunioes.find(i => i.id == id);
            if (tableName === 'responsaveis') item = responsaveis.find(i => i.id == id);
            if (tableName === 'allowed_users') item = allowedUsers.find(i => i.id == id);
            if (item) openItemModal(tableName, item, renderAdminPage);
        }
    });
}

function openItemModal(tableName, item = null, onSave) {
    const isEdit = !!item;
    let columns = [];
    if (tableName === 'areas') columns = [{ name: 'Nome', key: 'name' }, { name: 'Ícone (Emoji)', key: 'icon' }];
    else if (tableName === 'allowed_users') columns = [{ name: 'E-mail', key: 'email' }];
    else columns = [{ name: 'Nome', key: 'name' }];

    const fields = columns.map(col => `
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">${col.name}</label>
            <input type="text" name="${col.key}" required value="${item ? item[col.key] || '' : ''}" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500">
        </div>
    `).join('');

    const modalHTML = `
        <div class="modal-overlay" id="item-modal-overlay">
            <div class="modal-content max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h3 class="text-xl font-bold mb-4">${isEdit ? 'Editar' : 'Novo'} Item</h3>
                <form id="item-form">
                    ${fields}
                    <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button type="button" id="item-cancel-btn" class="btn-secondary">Cancelar</button>
                        <button type="submit" class="btn-primary">${isEdit ? 'Salvar' : 'Criar'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const overlay = document.getElementById('item-modal-overlay');
    const form = document.getElementById('item-form');
    const closeModal = () => overlay.remove();

    document.getElementById('item-cancel-btn').addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const newData = Object.fromEntries(formData.entries());

        const saveBtn = form.querySelector('button[type="submit"]');
        const originalText = saveBtn.innerText;
        saveBtn.disabled = true;
        saveBtn.innerText = "Salvando...";

        try {
            if (isEdit) {
                const { error } = await supabase.from(tableName).update(newData).eq('id', item.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(tableName).insert([newData]);
                if (error) throw error;
            }

            closeModal();
            await onSave();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar: " + error.message);
            saveBtn.disabled = false;
            saveBtn.innerText = originalText;
        }
    });
}
