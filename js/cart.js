/**
 * =================================================================
 * AURA E-COMMERCE - CART.JS
 * =================================================================
 * Este arquivo controla toda a lógica de gerenciamento do carrinho.
 * 1. API global para adicionar/remover/ler itens (localStorage).
 * 2. Lógica específica para renderizar a página 'carrinho.html'.
 * =================================================================
 */

// --- 1. FUNÇÕES GLOBAIS DA API DO CARRINHO (Públicas) ---

/**
 * Adiciona um item ao carrinho ou atualiza sua quantidade.
 * Esta é uma função ASYNC pois precisa buscar os dados do produto.
 * @param {number} productId - O ID do produto.
 * @param {number} quantity - A quantidade a ser adicionada.
 * @param {object} options - Variações selecionadas (ex: { color: 'Preto', size: 'M' }).
 */
async function addToCart(productId, quantity, options = {}) {
    try {
        const cart = getCart();
        const cartItemId = generateCartItemId(productId, options); // Gera um ID único (ex: "1-Preto-M")
        
        const existingItem = cart.find(item => item.cartItemId === cartItemId);

        if (existingItem) {
            // Se o item (com as mesmas opções) já existe, apenas soma a quantidade
            existingItem.quantity += quantity;
        } else {
            // Se é um item novo, busca os detalhes do produto no JSON
            const allProducts = await fetchProducts(); // (Função global do main.js)
            const productData = allProducts.find(p => p.id == productId);

            if (!productData) {
                console.error(`Produto com ID ${productId} não encontrado.`);
                return;
            }

            // Cria o novo item para o carrinho
            const newItem = {
                cartItemId: cartItemId,
                id: productData.id,
                name: productData.name,
                price: productData.price,
                image: productData.image,
                gallery: productData.gallery, // Útil para a imagem do carrinho
                quantity: quantity,
                color: options.color || null,
                size: options.size || null
            };
            cart.push(newItem);
        }

        saveCart(cart); // Salva o carrinho atualizado no localStorage
        updateHeaderUI(); // (Função global do main.js) Atualiza o ícone do header

        console.log('Carrinho atualizado:', getCart());
        return true; // Retorna sucesso
    } catch (error) {
        console.error("Erro ao adicionar ao carrinho:", error);
        return false; // Retorna falha
    }
}

/**
 * Remove um item do carrinho pelo seu ID único.
 * @param {string} cartItemId - O ID único do item no carrinho (ex: "1-Preto-M").
 */
function removeFromCart(cartItemId) {
    let cart = getCart();
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    saveCart(cart);
    updateHeaderUI(); // (Função global do main.js)
}

/**
 * Limpa completamente o carrinho.
 * (Usado após o checkout ser finalizado).
 */
function clearCart() {
    localStorage.removeItem('cart');
    sessionStorage.removeItem('cartDiscount'); // Limpa também o cupom
    updateHeaderUI(); // (Função global do main.js)
}

// --- 2. FUNÇÕES ESPECÍFICAS DA PÁGINA 'carrinho.html' ---

/**
 * Função de inicialização da página 'carrinho.html'.
 * Chamada pelo roteador no 'main.js'.
 */
function initCartPage() {
    // Confirma que estamos na página certa
    const cartPage = document.getElementById('cart-full-content');
    if (!cartPage) return; // Sai silenciosamente se não for a página do carrinho

    renderCartPage(); // Desenha os itens do carrinho e os totais
    
    // Adiciona listener para o formulário de cupom
    const couponForm = document.getElementById('coupon-form');
    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponSubmit);
    }
    
    // Adiciona listener para o botão de checkout
    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckoutRedirect);
    }
}

/**
 * Renderiza a tabela de itens do carrinho e os totais.
 * Decide se mostra o carrinho "cheio" ou "vazio".
 */
function renderCartPage() {
    const cart = getCart();
    const cartFullEl = document.getElementById('cart-full-content');
    const cartEmptyEl = document.getElementById('cart-empty-content');
    const itemListEl = document.getElementById('cart-items-list');
    const checkoutBtn = document.getElementById('btn-checkout');

    if (cart.length === 0) {
        // --- CARRINHO VAZIO ---
        cartFullEl.classList.add('d-none');
        cartEmptyEl.classList.remove('d-none');
        checkoutBtn.disabled = true;
    } else {
        // --- CARRINHO CHEIO ---
        cartFullEl.classList.remove('d-none');
        cartEmptyEl.classList.add('d-none');
        checkoutBtn.disabled = false;
        
        itemListEl.innerHTML = ''; // Limpa a lista antes de redesenhar
        
        cart.forEach(item => {
            const itemTotalPrice = item.price * item.quantity;
            
            // Gera o HTML para a linha da tabela (template)
            const itemHTML = `
                <tr data-cart-item-id="${item.cartItemId}">
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${item.image || (item.gallery && item.gallery[0])}" 
                                 alt="${item.name}" 
                                 style="width: 80px; height: 80px; object-fit: cover;" 
                                 class="rounded me-3">
                            <div>
                                <h6 class="mb-0">${item.name}</h6>
                                <small class="text-muted">
                                    ${item.color ? `Cor: ${item.color}` : ''}
                                    ${item.size ? `, Tamanho: ${item.size}` : ''}
                                </small>
                            </div>
                        </div>
                    </td>
                    <td class="item-price">${formatCurrency(item.price)}</td>
                    <td>
                        <div class="input-group" style="width: 130px; margin: 0 auto;">
                            <button class="btn btn-outline-secondary btn-sm btn-decrease-qty" type="button" data-id="${item.cartItemId}">-</button>
                            <input type="text" class="form-control form-control-sm text-center item-quantity" value="${item.quantity}" readonly>
                            <button class="btn btn-outline-secondary btn-sm btn-increase-qty" type="button" data-id="${item.cartItemId}">+</button>
                        </div>
                    </td>
                    <td class="text-end item-total-price">${formatCurrency(itemTotalPrice)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger rounded-circle btn-remove-item" data-id="${item.cartItemId}" aria-label="Remover item">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            itemListEl.innerHTML += itemHTML;
        });

        // Adiciona listeners aos botões recém-criados
        addCartItemListeners();
    }
    
    // Atualiza os totais (Subtotal, Frete, Total)
    updateCartTotals();
}

/**
 * Atualiza os blocos de Subtotal, Frete e Total.
 * Lê o 'sessionStorage' para verificar se há um cupom ativo.
 */
function updateCartTotals() {
    const cart = getCart();
    
    // Pega os elementos do DOM
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    const totalsListEl = document.querySelector('.card-body ul.list-group-flush');

    // Calcula valores
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 15.00 : 0; // Frete fixo
    
    // Verifica cupom
    const discountPercent = parseFloat(sessionStorage.getItem('cartDiscount')) || 0;
    const discountAmount = subtotal * discountPercent;
    const total = subtotal + shipping - discountAmount;

    // Atualiza o HTML
    subtotalEl.innerText = formatCurrency(subtotal);
    shippingEl.innerText = formatCurrency(shipping);
    totalEl.innerText = formatCurrency(total);

    // Lógica para injetar/remover a linha de desconto
    const existingDiscountRow = document.getElementById('cart-discount-row');
    existingDiscountRow?.remove(); // Remove a linha antiga, se existir

    if (discountAmount > 0) {
        const discountLi = document.createElement('li');
        discountLi.id = 'cart-discount-row';
        discountLi.className = 'list-group-item d-flex justify-content-between align-items-center border-0 px-0 pb-2 text-success';
        discountLi.innerHTML = `
            <span>Desconto (AURA10)</span>
            <span class="fw-bold">- ${formatCurrency(discountAmount)}</span>
        `;
        // Insere a linha de desconto antes da linha de Total
        const totalLi = totalEl.closest('li');
        totalsListEl.insertBefore(discountLi, totalLi);
    }
}

// --- 3. HANDLERS DE EVENTOS (Página 'carrinho.html') ---

/**
 * Adiciona listeners de clique aos botões (+, -, remover)
 */
function addCartItemListeners() {
    document.querySelectorAll('.btn-remove-item').forEach(button => {
        button.addEventListener('click', handleRemoveItem);
    });
    document.querySelectorAll('.btn-increase-qty').forEach(button => {
        button.addEventListener('click', handleIncreaseQuantity);
    });
    document.querySelectorAll('.btn-decrease-qty').forEach(button => {
        button.addEventListener('click', handleDecreaseQuantity);
    });
}

function handleRemoveItem(event) {
    const cartItemId = event.currentTarget.dataset.id;
    removeFromCart(cartItemId);
    renderCartPage(); // Redesenha a página do carrinho
}

function handleIncreaseQuantity(event) {
    const cartItemId = event.currentTarget.dataset.id;
    let cart = getCart();
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (item) {
        item.quantity++;
        saveCart(cart);
        renderCartPage(); // Redesenha a página do carrinho
    }
}

function handleDecreaseQuantity(event) {
    const cartItemId = event.currentTarget.dataset.id;
    let cart = getCart();
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (item) {
        if (item.quantity > 1) {
            item.quantity--;
            saveCart(cart);
            renderCartPage(); // Redesenha
        } else {
            // Se a quantidade for 1, diminuir significa remover
            removeFromCart(cartItemId);
            renderCartPage(); // Redesenha
        }
    }
}

/**
 * Lida com o submit do formulário de cupom.
 * Valida o cupom 'AURA10' e salva no sessionStorage.
 */
function handleCouponSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('coupon-code');
    const messageEl = document.getElementById('coupon-message');
    
    if (input.value.toUpperCase() === 'AURA10') {
        sessionStorage.setItem('cartDiscount', '0.10'); // 10%
        messageEl.innerText = 'Cupom AURA10 aplicado! (10% OFF)';
        messageEl.className = 'mt-2 small text-success fw-bold';
    } else {
        sessionStorage.removeItem('cartDiscount');
        messageEl.innerText = 'Cupom inválido.';
        messageEl.className = 'mt-2 small text-danger';
    }
    input.value = '';
    updateCartTotals(); // Recalcula os totais com/sem o desconto
}

/**
 * Lida com o clique no botão "Ir para o Checkout".
 * Verifica se o usuário está logado antes de redirecionar.
 */
function handleCheckoutRedirect(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user) {
        // Se logado, vai para o checkout
        window.location.href = 'checkout.html';
    } else {
        // Se deslogado, vai para o login (e armazena o "próximo passo")
        sessionStorage.setItem('redirectAfterLogin', 'checkout.html');
        window.location.href = 'login.html';
    }
}

// --- 4. HELPERS INTERNOS (Storage e IDs) ---

/**
 * Lê o carrinho do localStorage.
 * @returns {Array} O array do carrinho (vazio se não houver).
 */
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

/**
 * Salva o array do carrinho no localStorage.
 * @param {Array} cart - O array do carrinho.
 */
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

/**
 * Gera um ID único para o item do carrinho baseado no produto e suas opções.
 * @param {number} productId - ID do produto.
 * @param {object} options - Opções (color, size).
 * @returns {string} - ID único (ex: "1-Preto-M").
 */
function generateCartItemId(productId, options) {
    const color = options.color || 'default';
    const size = options.size || 'default';
    return `${productId}-${color}-${size}`;
}