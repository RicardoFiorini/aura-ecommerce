/**
 * =================================================================
 * AURA E-COMMERCE - VALIDATION.JS
 * =================================================================
 * Este arquivo controla a lógica de validação de formulários complexos.
 * 1. Lógica da 'contato.html' (Validação e Envio).
 * 2. Lógica da 'checkout.html' (Wizard Multi-Etapas, Validação, Guards, Submit).
 * 3. Lógica da 'confirmacao.html' (Exibir número do pedido).
 * =================================================================
 */

// --- 1. PÁGINA DE CONTATO (contato.html) ---

/**
 * Inicializa a página de Contato.
 */
function initContactPage() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Usa 'novalidate' para o Bootstrap não validar sozinho
        contactForm.setAttribute('novalidate', '');
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

/**
 * Lida com o submit do formulário de contato.
 */
function handleContactSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const successMsg = document.getElementById('contact-success-msg');

    // Valida o formulário
    if (!form.checkValidity()) {
        event.stopPropagation();
    } else {
        // --- Simulação de Envio ---
        console.log("Formulário de contato enviado (simulado).");
        successMsg.classList.remove('d-none'); // Mostra sucesso
        form.classList.remove('was-validated'); // Limpa validação
        form.reset(); // Limpa os campos

        // Esconde a mensagem de sucesso após 5 segundos
        setTimeout(() => {
            successMsg.classList.add('d-none');
        }, 5000);
    }

    // Adiciona a classe do Bootstrap para mostrar os erros/sucessos
    form.classList.add('was-validated');
}


// --- 2. PÁGINA DE CHECKOUT (checkout.html) ---

/**
 * Inicializa a página de Checkout.
 */
function initCheckoutPage() {
    const form = document.getElementById('checkout-form');
    if (!form) return; // Garante que estamos na página certa

    // --- 1. Guardas de Rota (Auth & Cart) ---
    const user = JSON.parse(localStorage.getItem('user'));
    const cart = getCart(); // (cart.js)

    if (!user) {
        // Se não está logado, expulsa para o login
        sessionStorage.setItem('redirectAfterLogin', 'checkout.html');
        window.location.href = 'login.html';
        return;
    }
    if (cart.length === 0) {
        // Se o carrinho está vazio, expulsa para o carrinho
        window.location.href = 'carrinho.html';
        return;
    }

    // --- 2. Preencher Dados ---
    // Preenche os dados do usuário logado
    document.getElementById('firstName').value = user.name.split(' ')[0] || '';
    document.getElementById('lastName').value = user.name.split(' ').slice(1).join(' ') || '';
    document.getElementById('email').value = user.email || '';
    
    // Renderiza o resumo do pedido
    renderCheckoutSummary(cart);

    // --- 3. Listeners de Navegação do Wizard ---
    form.setAttribute('novalidate', ''); // Previne validação nativa

    document.getElementById('btn-to-step-2').addEventListener('click', () => {
        if (validateStep('#step-1')) goToStep(2);
    });

    document.getElementById('btn-to-step-3').addEventListener('click', () => {
        if (validateStep('#step-2')) goToStep(3);
    });

    document.getElementById('btn-back-to-step-1').addEventListener('click', () => goToStep(1));
    document.getElementById('btn-back-to-step-2').addEventListener('click', () => goToStep(2));

    // --- 4. Listener do Envio Final ---
    form.addEventListener('submit', handleFinalSubmit);
}

/**
 * Renderiza o resumo do pedido no checkout.
 */
function renderCheckoutSummary(cart) {
    const listEl = document.getElementById('order-summary-list');
    const countEl = document.getElementById('summary-cart-count');
    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    listEl.innerHTML = ''; // Limpa
    let subtotal = 0;
    let totalItems = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        totalItems += item.quantity;
        
        listEl.innerHTML += `
            <li class="list-group-item d-flex justify-content-between lh-sm">
                <div>
                    <h6 class="my-0">${item.name}</h6>
                    <small class="text-muted">Qtd: ${item.quantity}</small>
                </div>
                <span class="text-muted">${formatCurrency(item.price * item.quantity)}</span>
            </li>
        `;
    });

    const shipping = 15.00; // Frete fixo
    // Pega o desconto do cupom (se houver)
    const discountPercent = parseFloat(sessionStorage.getItem('cartDiscount')) || 0;
    const discountAmount = subtotal * discountPercent;
    const total = subtotal + shipping - discountAmount;
    
    // Adiciona linha de desconto se existir
    if (discountAmount > 0) {
        listEl.innerHTML += `
            <li class="list-group-item d-flex justify-content-between text-success">
                <span>Desconto (AURA10)</span>
                <strong>- ${formatCurrency(discountAmount)}</strong>
            </li>
        `;
    }

    // Atualiza os totais
    countEl.innerText = totalItems;
    subtotalEl.innerText = formatCurrency(subtotal);
    shippingEl.innerText = formatCurrency(shipping);
    totalEl.innerText = formatCurrency(total);
}

/**
 * Navega entre as etapas do wizard de checkout.
 * @param {number} stepNum - O número da etapa (1, 2 ou 3).
 */
function goToStep(stepNum) {
    // Esconde todas as etapas
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.add('d-none');
    });
    // Remove 'active' de todos os indicadores
    document.querySelectorAll('#checkout-progress .list-group-item').forEach(li => {
        li.classList.remove('active');
    });

    // Mostra a etapa correta
    document.getElementById(`step-${stepNum}`).classList.remove('d-none');
    // Ativa o indicador correto
    document.getElementById(`progress-step-${stepNum}`).classList.add('active');
}

/**
 * Valida manualmente APENAS os campos 'required' dentro de uma etapa específica.
 * @param {string} stepSelector - O ID da etapa (ex: '#step-1').
 * @returns {boolean} - True se a etapa for válida.
 */
function validateStep(stepSelector) {
    const step = document.querySelector(stepSelector);
    const form = step.closest('form');
    let isValid = true;

    // Remove validações antigas
    step.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
        el.classList.remove('is-invalid', 'is-valid');
    });

    // Encontra todos os inputs e selects 'required' DENTRO da etapa atual
    const inputs = step.querySelectorAll('input[required], select[required]');

    inputs.forEach(input => {
        if (!input.checkValidity()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.add('is-valid');
        }
    });

    // Adiciona a classe ao form para o Bootstrap mostrar as mensagens
    // (mas removemos de novo para não afetar outras etapas)
    form.classList.add('was-validated');
    // Remove 'was-validated' de campos que não são desta etapa
    form.querySelectorAll(':required').forEach(el => {
        if (!step.contains(el)) {
            el.classList.remove('is-valid', 'is-invalid');
        }
    });
    
    return isValid;
}

/**
 * Lida com o envio final do formulário de checkout.
 */
function handleFinalSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitBtn = document.getElementById('btn-submit-order');

    // 1. Valida a última etapa
    if (!validateStep('#step-3')) {
        return;
    }

    // 2. Simula o processamento
    console.log("Processando pagamento (simulado)...");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Processando...
    `;

    // 3. Gera número do pedido
    const orderNumber = '#' + Math.floor(Math.random() * 90000) + 10000;
    sessionStorage.setItem('lastOrderNumber', orderNumber);

    // 4. Limpa o carrinho (função do cart.js)
    clearCart();

    // 5. Redireciona para a confirmação após 2 segundos
    setTimeout(() => {
        window.location.href = 'confirmacao.html';
    }, 2000);
}


// --- 3. PÁGINA DE CONFIRMAÇÃO (confirmacao.html) ---

/**
 * Inicializa a página de Confirmação.
 */
function initConfirmationPage() {
    const orderNumberEl = document.getElementById('order-number');
    if (orderNumberEl) {
        const orderNumber = sessionStorage.getItem('lastOrderNumber');
        
        if (orderNumber) {
            orderNumberEl.innerText = orderNumber;
            sessionStorage.removeItem('lastOrderNumber'); // Limpa para não mostrar de novo
        } else {
            // Se o usuário recarregar a página ou vier direto
            orderNumberEl.innerText = '#00000'; 
        }
    }
}