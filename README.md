# Sistema de pedidos de insumos

Aplicação full-stack para que líderes de lojas façam pedidos de insumos rapidamente, com geração automática de PDF por loja e categoria.

## Tecnologias
- Node.js + Express
- SQLite (arquivo `database.sqlite` na raiz)
- PDFKit para geração de PDF
- Frontend em HTML, CSS e JavaScript puro

## Estrutura
```
backend/
  controllers/
  models/
  routes/
frontend/
  index.html
  script.js
  style.css
server.js
database.sqlite
```

## Como rodar
1. Instale dependências  
  ```bash
  npm install
  ```
2. Inicie o servidor  
  ```bash
  npm start        # produção / execução normal
  npm run dev     # desenvolvimento (recarrega com nodemon)
  ```  
  Ele sobe em `http://localhost:3000`.
3. Acesse no navegador `http://localhost:3000`.

O banco e as tabelas são criados automaticamente no primeiro start.

## Funcionalidades
- Cadastro, listagem e exclusão de produtos.
- Criação de pedidos por loja e categoria (Ar/Terra) com múltiplos itens.
- Campo obrigatório para nome do líder.
- Geração de PDF organizada por loja e categoria com nome do líder no rodapé.
- Listagem de pedidos anteriores e opção de reutilizar.
- Botão “Gerar pedido da semana automaticamente” duplica o último pedido da loja/categoria selecionada.

## Endpoints principais
- `GET /api/orders/meta` — lojas e categorias disponíveis.
- `GET /api/products` — lista produtos.
- `POST /api/products` — cria produto `{ name, category, unit }`.
- `DELETE /api/products/:id` — exclui produto.
- `POST /api/orders` — cria pedido `{ store, area, leader, items:[{productId, quantity}] }`.
- `GET /api/orders` — lista pedidos.
- `GET /api/orders/:id` — detalhes com itens.
- `POST /api/orders/:id/duplicate` — duplica um pedido.
- `GET /api/orders/:id/pdf` — abre PDF do pedido.

## Observações
- Lojas fixas: Nescafe, Living Heineken, Qualycon, Forneria, Internacional.
- Categorias fixas: Ar, Terra.
- PDFs são gerados sob demanda (stream), sem arquivos temporários.
