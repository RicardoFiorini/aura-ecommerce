# Aura Ecommerce - Front-end Store
O Aura é um projeto de interface para e-commerce que busca equilibrar estética minimalista com funcionalidades essenciais de uma loja virtual moderna.
> [!TIP]
> Este projeto foi construído focando na performance de carregamento e na suavidade das transições entre as páginas de produtos.
## Principais Tecnologias

- **React.js / Vue.js:** Estrutura modular de componentes reativos.
- **State Management:** Controle centralizado do carrinho de compras e filtros.
- **CSS Modules / Tailwind:** Estilização isolada e design system consistente.
- **Responsive Design:** Experiência otimizada para Desktop, Tablet e Mobile.

## Funcionalidades de Destaque
- [x] Catálogo de produtos com carregamento dinâmico
- [x] Sistema de busca e filtragem por categorias
- [x] Carrinho de compras com persistência local
- [x] Página de detalhes do produto com galeria
- [ ] Simulação de checkout e integração de pagamento
## Como Instalar e Rodar
Siga os passos abaixo para configurar o ambiente de desenvolvimento:
```bash

Clonar o repositório
git clone https://github.com/RicardoFiorini/aura-ecommerce.git
Acessar o diretório
cd aura-ecommerce
Instalar as dependências
npm install
Iniciar a aplicação
npm run dev

```
## Arquitetura de Pastas
| Diretório | Função |
| --- | --- |
| /components | Componentes reutilizáveis (Botões, Cards, Navbar) |
| /pages | Views principais da aplicação (Home, Cart, Product) |
| /context | Gerenciamento de estado global da loja |
| /assets | Imagens, ícones e recursos visuais |
## Exemplo de Uso do Contexto (Carrinho)
`const { addToCart } = useCart();`
## Considerações Finais
*O Aura Ecommerce serviu como um laboratório para aplicar padrões de design de grandes lojas do mercado, priorizando a conversão e a facilidade de navegação do usuário final através de uma interface limpa e intuitiva.*
