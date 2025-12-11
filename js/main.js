/**
 * =================================================================
 * AURA E-COMMERCE - MAIN.JS (O MAESTRO)
 * =================================================================
 * Este arquivo controla a lógica global do site.
 * 1. Inicializa componentes globais (Header, Animações de Scroll).
 * 2. Roteia para funções específicas da página (ex: initShopPage).
 * 3. Fornece funções "helpers" globais (ex: fetchProducts).
 * =================================================================
 */

// --- GLOBAL CACHE ---
/**
 * @type {Promise<Array> | null}
 * Usamos um cache (Promise) para armazenar os produtos.
 * Isso evita que o 'products.json' seja baixado em toda página.
 */
let productsCache = null;

// --- ENTRY POINT ---
/**
 * O ponto de entrada principal. Espera o DOM carregar antes de rodar.
 */
document.addEventListener('DOMContentLoaded', main);

/**
 * Função principal que orquestra a inicialização do site.
 */
function main() {
    // 1. Funções globais (rodam em TODAS as páginas)
    updateHeaderUI();
    initScrollAnimations();
    initPageTransitions();

    // 2. Roteador para lógica específica da página
    pageRouter();
}

// =================================================================
// --- 1. GLOBAL UI FUNCTIONS ---
// =================================================================

/**
 * Atualiza o Header (Carrinho e Login) em CADA carregamento de página.
 * Lê os dados do localStorage.
 */
function updateHeaderUI() {
    // --- Atualizar Status do Usuário ---
    const userLink = document.getElementById('user-account-link');
    const user = JSON.parse(localStorage.getItem('user'));

    if (userLink) {
        if (user) {
            // Usuário está logado
            userLink.href = 'conta.html';
            // Pega o primeiro nome para um "Olá" amigável
            const firstName = user.name.split(' ')[0];
            userLink.innerHTML = `<i class="bi bi-person-fill fs-5 me-1"></i> Olá, ${firstName}`;
            userLink.setAttribute('aria-label', `Minha Conta, ${user.name}`);
        } else {
            // Usuário deslogado
            userLink.href = 'login.html';
            userLink.innerHTML = `<i class="bi bi-person fs-5"></i>`;
            userLink.setAttribute('aria-label', 'Login');
        }
    }

    // --- Atualizar Contagem do Carrinho ---
    const cartCountBadge = document.getElementById('cart-item-count');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Calcula o total de *itens* (somando as quantidades)
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCountBadge) {
        cartCountBadge.innerText = totalItems;
        // Opcional: esconder o "0" se preferir
        if (totalItems > 0) {
            cartCountBadge.classList.remove('d-none'); // Garante que está visível
        } else {
            cartCountBadge.classList.add('d-none'); // Esconde o "0"
        }
    }
}

/**
 * Inicializa o 'IntersectionObserver' para as animações de scroll.
 * Adiciona a classe 'is-visible' em elementos com '.animate-on-scroll'
 * quando eles entram na tela.
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    // Se não houver elementos para animar nesta página, não faz nada
    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Quando o elemento está 10% visível
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Para a animação não repetir
            }
        });
    }, { threshold: 0.1 }); // threshold: 0.1 = 10%

    // Observa cada elemento
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

/**
 * Cria o efeito de transição de página (fade-in/fade-out) para
 * uma sensação de SPA (Single Page Application).
 */
function initPageTransitions() {
    // 1. Fade-in da página ao carregar
    document.body.classList.add('is-visible');

    // 2. Intercepta cliques em links internos
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
        const href = link.getAttribute('href');

        // Ignora links externos, âncoras (#) ou JS
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || link.target === '_blank') {
            return;
        }

        // Se for um link para uma página .html do nosso projeto
        if (href.endsWith('.html')) {
            link.addEventListener('click', (e) => {
                // Previne a navegação imediata
                e.preventDefault();
                
                // Inicia o fade-out
                document.body.classList.remove('is-visible');
                
                // Espera a animação de fade-out (300ms) e então navega
                setTimeout(() => {
                    window.location.href = href;
                }, 300); // Este tempo DEVE ser o mesmo da transição no CSS
            });
        }
    });
}

// =================================================================
// --- 2. PAGE ROUTER ---
// =================================================================

/**
 * Roteador de Página.
 * Verifica o nome do arquivo HTML atual e chama a função de 
 * inicialização correspondente (que estará em outros arquivos JS).
 */
function pageRouter() {
    const path = window.location.pathname;
    const page = path.split("/").pop(); // Pega o nome do arquivo (ex: "loja.html")

    // Verifica se a função específica da página existe antes de chamá-la
    // (Elas virão de 'store.js', 'auth.js', 'cart.js', etc.)
    switch (page) {
        case 'index.html':
        case '': // Lida com a raiz (ex: "meusite.com/")
            if (typeof initHomePage === 'function') initHomePage();
            break;
        case 'loja.html':
            if (typeof initShopPage === 'function') initShopPage();
            break;
        case 'produto.html':
            if (typeof initProductPage === 'function') initProductPage();
            break;
        case 'carrinho.html':
            if (typeof initCartPage === 'function') initCartPage();
            break;
        case 'checkout.html':
            if (typeof initCheckoutPage === 'function') initCheckoutPage();
            break;
        case 'login.html':
            if (typeof initLoginPage === 'function') initLoginPage();
            break;
        case 'conta.html':
            if (typeof initAccountPage === 'function') initAccountPage();
            break;
        case 'contato.html':
            if (typeof initContactPage === 'function') initContactPage();
            break;
        case 'busca.html':
            if (typeof initSearchPage === 'function') initSearchPage();
            break;
        case 'confirmacao.html':
            if (typeof initConfirmationPage === 'function') initConfirmationPage();
            break;
    }
}

// =================================================================
// --- 3. GLOBAL HELPERS ---
// =================================================================

/**
 * Helper: Busca os produtos do 'products.json'.
 * Usa um cache para evitar múltiplas chamadas de rede.
 * @returns {Promise<Array>} Uma Promise que resolve para a lista de produtos.
 */
async function fetchProducts() {
    // Se o cache (a Promise) ainda não existe, crie-o
    if (!productsCache) {
        productsCache = fetch('products.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error("Falha catastrófica ao carregar 'products.json'.", error);
                productsCache = null; // Reseta o cache em caso de erro
                return []; // Retorna array vazio para não quebrar o site
            });
    }
    // Retorna a Promise (seja a nova ou a cacheada)
    return productsCache;
}

/**
 * Helper: Formata um número para a moeda BRL (Real Brasileiro).
 * @param {number} value - O valor numérico (ex: 299.9).
 * @returns {string} - O valor formatado (ex: "R$ 299,90").
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}