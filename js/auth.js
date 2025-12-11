/**
 * =================================================================
 * AURA E-COMMERCE - AUTH.JS
 * =================================================================
 * Este arquivo controla a lógica de autenticação do usuário.
 * 1. Lógica da 'login.html' (Login, Registro).
 * 2. Lógica da 'conta.html' (Auth Guard, Logout, Preenchimento de dados).
 * =================================================================
 */

/**
 * Inicializa a página de Login (login.html)
 */
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- 1. Redirecionamento ---
    // Se o usuário já está logado, não tem por que estar aqui.
    // Mande-o para a página da conta.
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        window.location.href = 'conta.html';
        return; // Para a execução
    }

    // --- 2. Listeners dos Formulários ---
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

/**
 * Lida com o submit do formulário de LOGIN.
 */
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error-msg');

    // --- SIMULAÇÃO DE LOGIN ---
    // Como não temos backend, vamos simular.
    // Qualquer email é válido, mas a senha DEVE ser '123456'.
    if (password === '123456') {
        // Sucesso!
        errorMsg.classList.add('d-none');
        
        // Cria um objeto de usuário (pegando o nome do email)
        const name = email.split('@')[0]; // Ex: "ricardo"
        const user = {
            name: name,
            email: email
        };
        
        // Salva no localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        // Atualiza o header (função do main.js)
        updateHeaderUI();
        
        // Redireciona o usuário
        performRedirect();
        
    } else {
        // Falha!
        errorMsg.innerText = 'Senha inválida. (Dica: tente "123456")';
        errorMsg.classList.remove('d-none');
    }
}

/**
 * Lida com o submit do formulário de REGISTRO.
 */
function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const pass1 = document.getElementById('register-password').value;
    const pass2 = document.getElementById('register-confirm-password').value;
    
    const errorMsg = document.getElementById('register-error-msg');
    const successMsg = document.getElementById('register-success-msg');

    // Esconde mensagens antigas
    errorMsg.classList.add('d-none');
    successMsg.classList.add('d-none');

    // --- Validação ---
    if (pass1 !== pass2) {
        errorMsg.innerText = 'As senhas não coincidem.';
        errorMsg.classList.remove('d-none');
        return;
    }
    if (pass1.length < 6) {
        errorMsg.innerText = 'A senha deve ter no mínimo 6 caracteres.';
        errorMsg.classList.remove('d-none');
        return;
    }

    // --- Sucesso na Simulação ---
    // (Em um app real, aqui você enviaria para a API)

    // Cria o objeto de usuário
    const user = {
        name: name,
        email: email
    };

    // Salva no localStorage (logando o usuário automaticamente)
    localStorage.setItem('user', JSON.stringify(user));

    // Atualiza o header (função do main.js)
    updateHeaderUI();

    // Redireciona o usuário
    // (Mostramos a msg de sucesso brevemente antes de redirecionar)
    successMsg.innerText = 'Conta criada com sucesso! Redirecionando...';
    successMsg.classList.remove('d-none');

    setTimeout(() => {
        performRedirect();
    }, 1500); // Espera 1.5s para o usuário ver a msg
}

/**
 * Helper: Verifica se há um 'redirect' no sessionStorage e redireciona.
 * (Usado após login/registro)
 */
function performRedirect() {
    // Verifica se o usuário estava tentando ir para o checkout
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    
    if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin'); // Limpa o item
        window.location.href = redirectUrl; // Ex: 'checkout.html'
    } else {
        // Se não, vai para a página da conta
        window.location.href = 'conta.html';
    }
}


/**
 * Inicializa a página "Minha Conta" (conta.html)
 */
function initAccountPage() {
    const logoutButton = document.getElementById('logout-button');
    const userNameEl = document.getElementById('user-name');
    const accountNameEl = document.getElementById('account-name');
    const accountEmailEl = document.getElementById('account-email');

    // --- 1. Auth Guard (Porteiro) ---
    // Esta é a parte mais importante.
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        // Se NÃO há usuário, expulsa da página
        window.location.href = 'login.html';
        return; // Para a execução
    }

    // --- 2. Preencher Dados ---
    // Se o usuário existe, preenche os campos da página
    if (userNameEl) userNameEl.innerText = user.name;
    if (accountNameEl) accountNameEl.value = user.name;
    if (accountEmailEl) accountEmailEl.value = user.email;

    // --- 3. Listener de Logout ---
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

/**
 * Lida com o clique no botão "Sair"
 */
function handleLogout(event) {
    event.preventDefault();
    
    // 1. Limpa o usuário do localStorage
    localStorage.removeItem('user');
    
    // 2. (Opcional) Limpa o carrinho também, se for regra de negócio
    // localStorage.removeItem('cart'); 
    
    // 3. (Opcional) Limpa o desconto
    // sessionStorage.removeItem('cartDiscount');
    
    // 4. Atualiza o header (função do main.js)
    updateHeaderUI();
    
    // 5. Redireciona para a Home
    window.location.href = 'index.html';
}