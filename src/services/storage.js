import { supabase } from './supabase.js';

let compromissosStore = [];
let areasStore = [];
let reunioesStore = [];
let responsaveisStore = [];

function fromSupabase(supabaseObj) {
    if (!supabaseObj) return null;
    return {
        id: supabaseObj.id,
        createdAt: supabaseObj.created_at,
        prioridade: supabaseObj.prioridade,
        categoria: supabaseObj.categoria,
        nomeReuniao: supabaseObj.nome_reuniao,
        dataRegistro: supabaseObj.data_registro,
        dataPrazo: supabaseObj.data_prazo,
        tema: supabaseObj.tema,
        acao: supabaseObj.acao,
        responsavel: supabaseObj.responsavel,
        status: supabaseObj.status,
        observacao: supabaseObj.observacao, 
    };
}

function toSupabase(jsObj) {
    if (!jsObj) return null;
    return {
        prioridade: jsObj.prioridade,
        categoria: jsObj.categoria,
        nome_reuniao: jsObj.nomeReuniao,
        data_registro: jsObj.dataRegistro,
        data_prazo: jsObj.dataPrazo,
        tema: jsObj.tema,
        acao: jsObj.acao,
        responsavel: jsObj.responsavel,
        status: jsObj.status,
        observacao: jsObj.observacao, 
    };
}

export async function initializeData() {
    const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3000); 

    if (error) {
        console.error("Erro ao buscar compromissos:", error);
        compromissosStore = [];
    } else {
        compromissosStore = data.map(fromSupabase);
    }
    
    const { data: areasData } = await supabase.from('areas').select('*');
    areasStore = areasData || [];

    const { data: reunioesData } = await supabase.from('reunioes').select('*');
    reunioesStore = reunioesData || [];

    const { data: responsaveisData } = await supabase.from('responsaveis').select('*');
    responsaveisStore = responsaveisData || [];
}

export function getCompromissos() { return [...compromissosStore]; }
export function getAreas() { return [{ name: 'TODOS', icon: '📋' }, ...areasStore]; }
export function getReunioes() { return [...reunioesStore]; }
export function getResponsaveis() { return [...responsaveisStore]; }

export async function saveCompromisso(compromisso) {
    const compromissoComStatus = { ...compromisso, status: compromisso.status || 'Não Iniciada' };
    const supabaseCompromisso = toSupabase(compromissoComStatus);

    const { data, error } = await supabase.from('compromissos').insert([supabaseCompromisso]).select().single();
    if (error) throw error;

    const newCompromisso = fromSupabase(data);
    compromissosStore.unshift(newCompromisso);
    return newCompromisso;
}

export async function saveCompromissosBulk(listaCompromissos) {
    if (!listaCompromissos || listaCompromissos.length === 0) return;
    const dadosParaSalvar = listaCompromissos.map(c => ({ ...toSupabase(c), status: c.status || 'Não Iniciada' }));
    
    const { data, error } = await supabase.from('compromissos').insert(dadosParaSalvar).select();
    if (error) throw error;

    const novos = data.map(fromSupabase);
    compromissosStore.unshift(...novos);
    return novos;
}

export async function updateCompromisso(id, updates) {
    const supabaseUpdates = toSupabase(updates);
    const { data, error } = await supabase.from('compromissos').update(supabaseUpdates).eq('id', id).select().single();
    if (error) throw error;

    const updatedCompromisso = fromSupabase(data);
    const index = compromissosStore.findIndex(c => c.id === id);
    if (index !== -1) compromissosStore[index] = updatedCompromisso;
}

export async function deleteCompromisso(id) {
    const { error } = await supabase.from('compromissos').delete().eq('id', id);
    if (error) throw error;
    compromissosStore = compromissosStore.filter(c => c.id !== id);
}

export async function sanitizeDatabase(onProgress) {
    const { data: todos, error } = await supabase.from('compromissos').select('*');
    if (error) throw error;

    let corrigidos = 0;
    const total = todos.length;

    for (let i = 0; i < total; i++) {
        const item = todos[i];
        
        const nomeLimpo = item.nome_reuniao ? item.nome_reuniao.trim() : null;
        const respLimpo = item.responsavel ? item.responsavel.trim() : null;
        const temaLimpo = item.tema ? item.tema.trim() : null;
        const catLimpo  = item.categoria ? item.categoria.trim() : null;
        const statusLimpo = item.status ? item.status.trim() : null;

        if (
            (item.nome_reuniao !== nomeLimpo) || (item.responsavel !== respLimpo) ||
            (item.tema !== temaLimpo) || (item.categoria !== catLimpo) || (item.status !== statusLimpo)
        ) {
            await supabase.from('compromissos').update({
                nome_reuniao: nomeLimpo, responsavel: respLimpo, tema: temaLimpo, categoria: catLimpo, status: statusLimpo
            }).eq('id', item.id);
            corrigidos++;
        }

        if (i % 20 === 0 && onProgress) {
            onProgress(i, total, corrigidos);
        }
    }
    await initializeData();
    return corrigidos;
}
