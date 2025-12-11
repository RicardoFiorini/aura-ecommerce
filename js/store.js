/**
 * =================================================================
 * AURA E-COMMERCE - STORE.JS
 * =================================================================
 * Este arquivo controla a lógica de exibição de produtos.
 * 1. Lógica da 'loja.html' (filtros, ordenação, renderização).
 * 2. Lógica da 'produto.html' (carregamento dinâmico, galeria, variações).
 * 3. Lógica da 'busca.html' (resultados da busca).
 * =================================================================
 */

// --- 1. INICIALIZADORES DE PÁGINA (Chamados pelo main.js) ---

/**
 * Armazena todos os produtos da loja para filtragem.
 * @type {Array}
 */
let allShopProducts = [];

/**
 * Inicializa a página da Loja (loja.html)
 */
async function initShopPage() {
    // Pega os elementos principais
    const gridEl = document.getElementById('product-grid');
    const loadingEl = document.getElementById('products-loading');
    const filters = document.querySelectorAll('#category-filters input, #price-range, #color-filters input, #sort-by');

    if (!gridEl) return; // Garante que estamos na página certa

    // Mostra o loading
    loadingEl.classList.remove('d-none');

    // 1. Busca os produtos
    allShopProducts = await fetchProducts(); // (main.js)

    // 2. Adiciona listeners aos filtros e ordenação
    filters.forEach(el => {
        el.addEventListener('change', () => runFiltersAndSort());
    });

    // Listener especial para o range de preço (para atualizar o valor em tempo real)
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-range-value');
    if (priceRange && priceValue) {
        priceRange.addEventListener('input', (e) => {
            priceValue.innerText = formatCurrency(e.target.value);
        });
    }

    // 3. Renderiza os produtos pela primeira vez
    runFiltersAndSort();

    // 4. Esconde o loading
    loadingEl.classList.add('d-none');
}

/**
 * Inicializa a Página de Produto (produto.html)
 */
async function initProductPage() {
    const loadingEl = document.getElementById('product-loading');
    const errorEl = document.getElementById('product-error');
    const contentEl = document.getElementById('product-content');

    if (!contentEl) return; // Garante que estamos na página certa

    loadingEl.classList.remove('d-none'); // Mostra o loading

    try {
        // 1. Pega o ID da URL
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        if (!productId) {
            throw new Error('ID do produto não encontrado na URL.');
        }

        // 2. Busca o produto
        const allProducts = await fetchProducts();
        const product = allProducts.find(p => p.id == productId); // Cuidado com '==' vs '===' (ID pode ser string)

        if (!product) {
            throw new Error(`Produto com ID ${productId} não encontrado.`);
        }

        // 3. Preenche os dados da página
        document.title = `${product.name} | Aura`;
        document.getElementById('product-name').innerText = product.name;
        document.getElementById('product-price').innerText = formatCurrency(product.price);
        document.getElementById('product-description').innerText = product.description;

        // 4. Renderiza a galeria de imagens
        renderProductGallery(product);

        // 5. Renderiza as variações (cores, tamanhos)
        renderProductVariations(product);

        // 6. Configura o formulário (botões de qtd e 'Adicionar ao Carrinho')
        setupProductForm(product);

        // 7. Renderiza produtos relacionados
        renderRelatedProducts(product.category, product.id);

        // 8. Mostra o conteúdo
        contentEl.classList.remove('d-none');

    } catch (error) {
        console.error(error);
        errorEl.classList.remove('d-none'); // Mostra o erro
    } finally {
        loadingEl.classList.add('d-none'); // Esconde o loading
    }
}

/**
 * Inicializa a Página de Busca (busca.html)
 */
async function initSearchPage() {
    const gridEl = document.getElementById('search-results-grid');
    const titleEl = document.getElementById('search-page-title');
    const countEl = document.getElementById('search-results-count');

    if (!gridEl) return; // Garante que estamos na página certa

    // 1. Pega o termo da URL
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    
    if (!query) {
        titleEl.innerText = "Busca Inválida";
        countEl.innerText = "Nenhum termo de busca fornecido.";
        return;
    }

    titleEl.innerText = `Resultados para "${query}"`;
    const lowerQuery = query.toLowerCase();

    // 2. Busca produtos
    const allProducts = await fetchProducts();

    // 3. Filtra os resultados (checa nome e tags)
    const results = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );

    // 4. Renderiza os resultados
    countEl.innerText = `${results.length} resultado(s) encontrado(s)`;
    gridEl.innerHTML = ''; // Limpa o grid

    if (results.length === 0) {
        gridEl.innerHTML = `
            <div class="col-12 text-center">
                <i class="bi bi-emoji-frown fs-1 text-muted"></i>
                <h3 class="mt-3">Nenhum resultado encontrado</h3>
                <p class="text-muted">Tente buscar por um termo diferente.</p>
            </div>
        `;
    } else {
        results.forEach(product => {
            gridEl.innerHTML += createProductCardHTML(product);
        });
    }
}


// --- 2. LÓGICA DA PÁGINA DA LOJA (Helpers de 'initShopPage') ---

/**
 * Roda todo o processo de filtragem e ordenação e chama a renderização.
 */
function runFiltersAndSort() {
    let filteredProducts = [...allShopProducts];

    // --- 1. Aplicar Filtros ---
    
    // Categorias (checkboxes)
    const categoryCheckboxes = document.querySelectorAll('#category-filters input:checked');
    const selectedCategories = Array.from(categoryCheckboxes).map(cb => cb.value);
    
    if (selectedCategories.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedCategories.includes(p.category));
    }

    // Preço (range)
    const maxPrice = document.getElementById('price-range').value;
    filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);

    // Cor (radio)
    const selectedColor = document.querySelector('#color-filters input:checked').value;
    if (selectedColor !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.colors && p.colors.includes(selectedColor));
    }

    // --- 2. Aplicar Ordenação ---
    const sortValue = document.getElementById('sort-by').value;
    
    switch (sortValue) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        // 'default' não precisa de 'sort'
    }

    // --- 3. Renderizar ---
    renderShopProducts(filteredProducts);
}

/**
 * Renderiza os produtos filtrados na grade da loja.
 * @param {Array} products - A lista de produtos para renderizar.
 */
function renderShopProducts(products) {
    const gridEl = document.getElementById('product-grid');
    const emptyEl = document.getElementById('products-empty');
    const countEl = document.getElementById('product-count');
    
    // Limpa o grid
    gridEl.innerHTML = '';

    // Atualiza contagem
    countEl.innerText = `Exibindo ${products.length} de ${allShopProducts.length} produtos`;

    // Verifica estado vazio
    if (products.length === 0) {
        gridEl.classList.add('d-none');
        emptyEl.classList.remove('d-none');
    } else {
        gridEl.classList.remove('d-none');
        emptyEl.classList.add('d-none');
        
        // Adiciona cada card
        products.forEach(product => {
            gridEl.innerHTML += createProductCardHTML(product);
        });
    }
}

/**
 * Helper GERAL: Cria o HTML de um card de produto.
 * Usado por 'loja.html', 'busca.html', e 'produto.html' (relacionados).
 * @param {object} product - O objeto do produto.
 * @returns {string} - O HTML do card.
 */
function createProductCardHTML(product) {
    // Nota: Usamos 'data-id-add-to-cart' para um listener global
    // (A ser adicionado no main.js ou aqui)
    return `
        <div class="col-md-6 col-lg-4">
            <div class="product-card card border-0 shadow-sm h-100 animate-on-scroll">
                <a href="produto.html?id=${product.id}" class="text-decoration-none">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                </a>
                <div class="card-body text-center d-flex flex-column">
                    <h5 class="card-title fs-5 fw-normal text-dark">${product.name}</h5>
                    <p class="card-text text-primary fw-bold fs-5">${formatCurrency(product.price)}</p>
                    <button class="btn btn-outline-dark rounded-pill mt-auto" 
                            data-id-add-to-cart="${product.id}"
                            aria-label="Adicionar ${product.name} ao carrinho">
                        Adicionar ao Carrinho
                    </button>
                </div>
            </div>
        </div> 
    `;
}

// --- 3. LÓGICA DA PÁGINA DE PRODUTO (Helpers de 'initProductPage') ---

/**
 * Renderiza a galeria de imagens (principal + thumbnails).
 */
function renderProductGallery(product) {
    const mainImageEl = document.getElementById('product-image');
    const thumbnailsEl = document.getElementById('product-thumbnails');
    
    // Define a imagem principal inicial
    mainImageEl.src = product.gallery[0];
    mainImageEl.alt = product.name;
    thumbnailsEl.innerHTML = ''; // Limpa thumbnails

    // Cria as thumbnails
    product.gallery.forEach((imgSrc, index) => {
        const thumb = document.createElement('img');
        thumb.src = imgSrc;
        thumb.alt = `Miniatura ${index + 1} de ${product.name}`;
        thumb.className = 'product-thumbnail rounded';
        if (index === 0) {
            thumb.classList.add('active'); // Ativa a primeira
        }

        // Adiciona listener para trocar a imagem principal
        thumb.addEventListener('click', () => {
            mainImageEl.src = imgSrc;
            // Atualiza a classe 'active'
            thumbnailsEl.querySelector('.active').classList.remove('active');
            thumb.classList.add('active');
        });

        thumbnailsEl.appendChild(thumb);
    });
}

/**
 * Renderiza as variações (cores e tamanhos), se existirem.
 */
function renderProductVariations(product) {
    const colorsContainer = document.getElementById('product-colors-container');
    const colorsEl = document.getElementById('product-colors');
    
    if (product.colors && product.colors.length > 0) {
        colorsEl.innerHTML = '';
        product.colors.forEach((color, index) => {
            const id = `color-${color.toLowerCase().replace(' ', '-')}`;
            colorsEl.innerHTML += `
                <input type="radio" class="btn-check" name="color-option" 
                       id="${id}" value="${color}" autocomplete="off" ${index === 0 ? 'checked' : ''}>
                <label class="btn btn-outline-dark rounded-pill" for="${id}">${color}</label>
            `;
        });
        colorsContainer.classList.remove('d-none');
    }

    const sizeContainer = document.getElementById('product-size-container');
    const sizeEl = document.getElementById('product-size');

    if (product.sizes && product.sizes.length > 0) {
        sizeEl.innerHTML = '';
        product.sizes.forEach(size => {
            sizeEl.innerHTML += `<option value="${size}">${size}</option>`;
        });
        sizeContainer.classList.remove('d-none');
    }
}

/**
 * Configura os botões de quantidade (+, -) e o submit do formulário.
 */
function setupProductForm(product) {
    const form = document.getElementById('add-to-cart-form');
    const qtyInput = document.getElementById('product-quantity');
    const btnDecrease = document.getElementById('btn-decrease-qty');
    const btnIncrease = document.getElementById('btn-increase-qty');
    const feedbackEl = document.getElementById('add-to-cart-feedback');

    // Botão de diminuir
    btnDecrease.addEventListener('click', () => {
        let currentQty = parseInt(qtyInput.value);
        if (currentQty > 1) {
            qtyInput.value = currentQty - 1;
        }
    });

    // Botão de aumentar
    btnIncrease.addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
    });

    // Listener do formulário (Adicionar ao Carrinho)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedbackEl.classList.add('d-none'); // Esconde feedback antigo

        // 1. Coleta os dados
        const quantity = parseInt(qtyInput.value);
        const options = {};
        
        const colorInput = document.querySelector('input[name="color-option"]:checked');
        if (colorInput) {
            options.color = colorInput.value;
        }
        
        const sizeInput = document.getElementById('product-size');
        if (sizeInput && !sizeInput.closest('.d-none')) {
            options.size = sizeInput.value;
        }

        // 2. Chama a API do Carrinho (do cart.js)
        const success = await addToCart(product.id, quantity, options);

        // 3. Mostra feedback
        if (success) {
            feedbackEl.innerText = 'Produto adicionado ao carrinho!';
            feedbackEl.classList.replace('alert-danger', 'alert-success');
            feedbackEl.classList.remove('d-none');
        } else {
            feedbackEl.innerText = 'Erro ao adicionar produto.';
            feedbackEl.classList.replace('alert-success', 'alert-danger');
            feedbackEl.classList.remove('d-none');
        }

        // Esconde o feedback após 3 segundos
        setTimeout(() => {
            feedbackEl.classList.add('d-none');
        }, 3000);
    });
}

/**
 * Renderiza 4 produtos relacionados (mesma categoria, ID diferente).
 */
async function renderRelatedProducts(category, currentProductId) {
    const gridEl = document.getElementById('related-products-grid');
    const sectionEl = document.getElementById('related-products-section');

    const allProducts = await fetchProducts();
    
    const related = allProducts
        .filter(p => p.category === category && p.id != currentProductId)
        .slice(0, 4); // Limita a 4 produtos

    if (related.length > 0) {
        gridEl.innerHTML = '';
        related.forEach(product => {
            gridEl.innerHTML += createProductCardHTML(product);
        });
        sectionEl.classList.remove('d-none');
    }
}

// --- 4. LISTENER GLOBAL PARA CARDS (Adicionar ao Carrinho) ---

/**
 * Adiciona um listener global ao documento para capturar cliques
 * em botões "Adicionar ao Carrinho" em grids de produtos (loja, busca, home).
 * * NOTA: Isso só adiciona o item com opções padrão (sem cor/tamanho).
 * O formulário da 'produto.html' tem sua própria lógica mais complexa.
 */
document.addEventListener('click', async (e) => {
    // Procura por um elemento pai que corresponda ao seletor
    const addButton = e.target.closest('[data-id-add-to-cart]');
    
    if (addButton) {
        e.preventDefault();
        const productId = addButton.dataset.idAddToCart;
        
        // Simula um feedback rápido no botão
        const originalText = addButton.innerHTML;
        addButton.innerHTML = '<i class="bi bi-check-lg"></i> Adicionado!';
        addButton.disabled = true;

        // Chama a API do carrinho
        await addToCart(Number(productId), 1, {}); // Adiciona 1, sem opções

        // Restaura o botão após 1.5 segundos
        setTimeout(() => {
            addButton.innerHTML = originalText;
            addButton.disabled = false;
        }, 1500);
    }
});