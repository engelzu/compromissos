import { supabase } from '../services/supabase.js';

export function renderLogin(onLoginSuccess) {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 px-4">
            <div class="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
                <div class="text-center mb-10">
                    <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 mb-2">
                        COMPROMISSO V2.0
                    </h1>
                    <p class="text-gray-500 font-medium tracking-wide">ÁREA RESTRITA</p>
                </div>

                <form id="login-form" class="space-y-6">
                    <div>
                        <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">E-mail Corporativo</label>
                        <input type="email" id="email" name="email" required 
                            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
                            placeholder="seu.email@empresa.com">
                    </div>

                    <div id="login-error" class="hidden bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                        E-mail não encontrado. Verifique com o administrador.
                    </div>

                    <button type="submit" id="btn-login" 
                        class="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg flex justify-center items-center">
                        ENTRAR NO SISTEMA
                    </button>
                    
                    <div class="mt-6 pt-6 border-t border-gray-100 text-center">
                        <button type="button" id="btn-admin-login" class="text-xs text-gray-400 hover:text-green-600 transition-colors font-medium">
                            Acesso Administrativo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error');
    const btnLogin = document.getElementById('btn-login');

    // Admin backdoor (mantendo funcionalidade antiga por enquanto)
    document.getElementById('btn-admin-login').addEventListener('click', () => {
        const pass = prompt("Senha Master:");
        if (pass === "789512") {
            const adminUser = { email: 'admin@sistema.com', role: 'admin', name: 'Administrador' };
            localStorage.setItem('user_session', JSON.stringify(adminUser));
            onLoginSuccess(adminUser);
        } else {
            alert("Senha incorreta");
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim().toLowerCase();

        if (!email) return;

        // Feedback visual
        btnLogin.disabled = true;
        btnLogin.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        errorMsg.classList.add('hidden');

        try {
            // Verifica na tabela allowed_users
            const { data, error } = await supabase
                .from('allowed_users')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // SUCESSO!
                const userSession = {
                    email: data.email,
                    role: 'user', // Futuramente pode vir do banco
                    name: data.email.split('@')[0] // Nome provisório
                };

                // Salva sessão local
                localStorage.setItem('user_session', JSON.stringify(userSession));

                // Inicia o app
                onLoginSuccess(userSession);
            } else {
                // FALHA - EMAIL NÃO ENCONTRADO
                errorMsg.textContent = "Acesso negado. E-mail não cadastrado.";
                errorMsg.classList.remove('hidden');
            }

        } catch (err) {
            console.error("Erro no login:", err);
            errorMsg.textContent = "Erro de conexão. Tente novamente.";
            errorMsg.classList.remove('hidden');
        } finally {
            btnLogin.disabled = false;
            btnLogin.innerText = "ENTRAR NO SISTEMA";
        }
    });
}

