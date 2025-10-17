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
    };
}

export async function initializeData() {
    const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao buscar compromissos:", error);
    } else {
        compromissosStore = data.map(fromSupabase);
    }
    
    const { data: areasData, error: areasError } = await supabase.from('areas').select('*').order('name');
    if (areasError) console.error('Erro ao buscar áreas:', areasError);
    else areasStore = areasData;

    const { data: reunioesData, error: reunioesError } = await supabase.from('reunioes').select('*').order('name');
    if (reunioesError) console.error('Erro ao buscar reuniões:', reunioesError);
    else reunioesStore = reunioesData;

    const { data: responsaveisData, error: responsaveisError } = await supabase.from('responsaveis').select('*').order('name');
    if (responsaveisError) console.error('Erro ao buscar responsáveis:', responsaveisError);
    else responsaveisStore = responsaveisData;
}

export function getCompromissos() {
    return [...compromissosStore];
}

export function getAreas() {
    return [{ name: 'TODOS', icon: '📋' }, ...areasStore];
}

export function getReunioes() {
    return reunioesStore.map(r => r.name);
}

export function getResponsaveis() {
    return responsaveisStore.map(r => r.name);
}


export async function saveCompromisso(compromisso) {
    const supabaseCompromisso = toSupabase(compromisso);

    const { data, error } = await supabase
        .from('compromissos')
        .insert([supabaseCompromisso])
        .select()
        .single();
    
    if (error) {
        console.error("Erro detalhado ao salvar compromisso:", error);
        throw error;
    }

    const newCompromisso = fromSupabase(data);
    compromissosStore.unshift(newCompromisso);
    return newCompromisso;
}

export async function updateCompromisso(id, updates) {
    const supabaseUpdates = toSupabase(updates);

    const { data, error } = await supabase
        .from('compromissos')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error("Erro detalhado ao atualizar compromisso:", error);
        throw error;
    }

    const updatedCompromisso = fromSupabase(data);
    const index = compromissosStore.findIndex(c => c.id === id);
    if (index !== -1) {
        compromissosStore[index] = updatedCompromisso;
    }
}

export async function deleteCompromisso(id) {
    const { error } = await supabase
        .from('compromissos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Erro ao excluir compromisso:", error);
        throw error;
    }
    
    compromissosStore = compromissosStore.filter(c => c.id !== id);
}

