import { getAreas, getReunioes, getResponsaveis } from '../services/storage.js';
import { saveCompromisso, updateCompromisso } from '../services/storage.js';
import { supabase } from '../services/supabase.js';

// Função que busca e formata o histórico de edições
async function fetchHistory(compromissoId) {
    if (!compromissoId) return '';
    
    const { data, error } = await supabase
        .from('compromissos_history')
        .select('*')
        .eq('compromisso_id', compromissoId)
        .order('changed_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar histórico:', error);
        return '<p class="text-red-500 text-xs mt-2">Erro ao carregar histórico.</p>';
    }

    if (data.length === 0) {
        return '<p class="text-gray-500 text-xs mt-2">Nenhuma alteração de Data Prazo registrada.</p>';
    }

    return data.map(log => {
        const dataFormatada = new Date(log.changed_at).toLocaleDateString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const oldDate = log.old_data_prazo ? new Date(log.old_data_prazo).toLocaleDateString('pt-BR') : 'N/A';
        const newDate = log.new_data_prazo ? new Date(log.new_data_prazo).toLocaleDateString('pt-BR') : 'N/A';

        return `
            <div class="border-b border-gray-100 py-1 text-xs">
                <span class="text-gray-700 font-medium">${dataFormatada}</span>: 
                Prazo alterado de <span class="text-red-500">${oldDate}</span> para <span class="text-green-600">${newDate}</span>.
            </div>
        `;
    }).join('');
}


export function openModal(compromisso = null, onSave) {
  const isEdit = !!compromisso;
  const modalContainer = document.getElementById('modal-container');

  const areas = getAreas().filter(c => c.name !== 'TODOS');
  const reunioes = getReunioes();
  const responsaveis = getResponsaveis();

  const renderOptions = (items, currentValue) => {
    const normalizedCurrent = currentValue ? currentValue.trim() : '';
    const exists = items.some(item => item.name.trim() === normalizedCurrent);
    let optionsHtml = '';
    if (currentValue && !exists) { optionsHtml += `<option value="${currentValue}" selected>${currentValue}</option>`; }
    optionsHtml += items.map(item => {
        const isSelected = item.name.trim() === normalizedCurrent;
        return `<option value="${item.name}" ${isSelected ? 'selected' : ''}>${item.name}</option>`;
    }).join('');
    return optionsHtml;
  };

  modalContainer.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-content max-w-4xl">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-900">
              ${isEdit ? 'Editar Compromisso' : 'Novo Compromisso'}
            </h2>
            <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form id="compromisso-form" class="p-6 grid grid-cols-3 gap-6">
            
            <div class="col-span-3 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                  <select name="prioridade" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Selecione...</option>
                    <option value="1" ${compromisso?.prioridade === 1 ? 'selected' : ''}>1 - Crítica</option>
                    <option value="2" ${compromisso?.prioridade === 2 ? 'selected' : ''}>2 - Alta</option>
                    <option value="3" ${compromisso?.prioridade === 3 ? 'selected' : ''}>3 - Média</option>
                    <option value="4" ${compromisso?.prioridade === 4 ? 'selected' : ''}>4 - Baixa</option>
                    <option value="5" ${compromisso?.prioridade === 5 ? 'selected' : ''}>5 - Muito Baixa</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Área</label>
                  <select name="categoria" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Selecione...</option>
                    ${renderOptions(areas, compromisso?.categoria)}
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nome da Reunião</label>
                  <select name="nomeReuniao" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Selecione...</option>
                    ${renderOptions(reunioes, compromisso?.nomeReuniao)}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Responsável</label>
                  <select name="responsavel" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Selecione...</option>
                    ${renderOptions(responsaveis, compromisso?.responsavel)}
                  </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select name="status" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="Não Iniciada" ${(!compromisso || compromisso.status === 'Não Iniciada') ? 'selected' : ''}>Não Iniciada</option>
                        <option value="Em Andamento" ${compromisso?.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                        <option value="Concluída" ${compromisso?.status === 'Concluída' ? 'selected' : ''}>Concluída</option>
                    </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Data do Registro</label>
                  <input 
                    type="date" 
                    name="dataRegistro" 
                    required
                    value="${compromisso?.dataRegistro ? compromisso.dataRegistro.split('T')[0] : new Date().toISOString().split('T')[0]}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Data do Prazo</label>
                  <input 
                    type="date" 
                    name="dataPrazo" 
                    required
                    value="${compromisso?.dataPrazo ? compromisso.dataPrazo.split('T')[0] : ''}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                  <input 
                    type="text" 
                    name="tema" 
                    required
                    value="${compromisso?.tema || ''}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Matriz de risco"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Ação</label>
                  <textarea 
                    name="acao" 
                    required
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Descreva a ação necessária..."
                  >${compromisso?.acao || ''}</textarea>
                </div>
                
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Observação</label>
                  <textarea 
                    name="observacao" 
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Notas adicionais sobre o compromisso..."
                  >${compromisso?.observacao || ''}</textarea>
                </div>
                
                <div class="md:col-span-2 flex gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button type="button" id="cancel-btn" class="flex-1 btn-secondary justify-center">Cancelar</button>
                    <button type="submit" class="flex-1 btn-primary justify-center">${isEdit ? 'Atualizar' : 'Adicionar'}</button>
                </div>
            </div>
            
            ${isEdit ? `
            <div class="col-span-3 md:col-span-1 border-t md:border-t-0 md:border-l border-gray-200 md:pl-6 pt-4 md:pt-0">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Histórico Data Prazo</h3>
                <div id="history-content" class="h-64 overflow-y-auto bg-gray-50 p-3 rounded-lg text-sm">
                    Carregando histórico...
                </div>
            </div>
            ` : ''}
        </form>
      </div>
    </div>
  `;

  // 4. CHAMADA ASSÍNCRONA PARA CARREGAR O HISTÓRICO
  if (isEdit) {
      fetchHistory(compromisso.id).then(html => {
          const historyContent = document.getElementById('history-content');
          if (historyContent) { 
            historyContent.innerHTML = html;
          }
      }).catch(err => {
          // Captura erros na busca do histórico
          console.error("Erro ao carregar o histórico:", err);
          document.getElementById('history-content').innerHTML = '<p class="text-red-500 text-xs mt-2">Falha ao carregar o histórico. Verifique o console.</p>';
      });
  }


  const form = document.getElementById('compromisso-form');
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-btn');

  const closeModal = () => {
    modalContainer.innerHTML = '';
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const data = {
      prioridade: parseInt(formData.get('prioridade')),
      categoria: formData.get('categoria'),
      nomeReuniao: formData.get('nomeReuniao'),
      dataRegistro: formData.get('dataRegistro'),
      dataPrazo: formData.get('dataPrazo'),
      tema: formData.get('tema'),
      acao: formData.get('acao'),
      responsavel: formData.get('responsavel'),
      status: formData.get('status'),
      observacao: formData.get('observacao'),
    };

    try { // <-- NOVO: TRATAMENTO DE ERROS AQUI
        if (isEdit) {
          await updateCompromisso(compromisso.id, data);
        } else {
          await saveCompromisso(data);
        }

        closeModal();
        onSave();
    } catch (error) {
        console.error("ERRO AO ATUALIZAR/SALVAR REGISTRO:", error);
        alert("Falha ao salvar o registro! Verifique o console para mais detalhes.");
    }
  });
}
