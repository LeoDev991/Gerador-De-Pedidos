# Resumo das alterações — Gerador de Pedidos

Este documento descreve, em detalhes, todas as alterações que eu implementei no projeto "Gerador-De-Pedidos". O objetivo é fornecer um material que você possa estudar e usar como base para explicar o trabalho em uma entrevista para desenvolvedor júnior.

Conteúdo deste documento
- Visão geral do que foi implementado
- Arquitetura do projeto e arquivos principais
- Esquema do banco de dados
- Endpoints da API (descrição e exemplos)
- Autenticação (fluxo, implementação, segurança)
- Frontend (páginas e comportamento)
- Comandos para rodar o projeto e testes realizados
- Pontos para falar em entrevista (perguntas e respostas rápidas)
- Próximos passos e melhorias sugeridas

---

## 1) Visão geral

Eu corrigi bugs existentes e adicionei autenticação por usuário com registro/login usando bcrypt (hash de senhas) e JWT (json web tokens). Também criei uma página de login/registro no frontend. Após autenticação, o usuário (username) passa a ser o "líder" do pedido e esse nome é inserido no PDF gerado para cada pedido.

Principais objetivos atendidos:
- Corrigir o fallback de rota que causava erro (PathError) na inicialização do servidor.
- Garantir que o servidor suba corretamente e que banco/tabelas sejam criados automaticamente.
- Adicionar autenticação segura (hash + JWT).
- Proteger endpoints sensíveis (criar/duplicar pedidos).
- Criar UI de login/registro e integrar token no frontend.

---

## 2) Arquitetura e arquivos importantes

Estrutura modificada (resumida):

```
server.js                  # ponto de entrada Express
backend/
  db.js                    # inicializa SQLite e cria tabelas
  controllers/
    ordersController.js    # lógica de pedidos e PDF
    productsController.js  # CRUD produtos
    authController.js      # register/login/me
  models/
    ordersModel.js
    productsModel.js
    usersModel.js          # novo: persistência de usuários
  routes/
    orders.js
    products.js
    auth.js                # novo: rotas de auth
  middleware/
    authMiddleware.js      # novo: valida JWT e popula req.user
frontend/
  index.html               # página principal (pedidos)
  script.js                # lógica do app (modificado para usar token)
  login.html               # novo: página de login/registro
  login.js                 # novo: script de auth no cliente
  style.css
database.sqlite            # arquivo SQLite (criado automaticamente)
documento.md               # este documento
README.md                  # atualizado com instruções
```

---

## 3) Esquema do banco de dados

As tabelas principais criadas/alteradas em `backend/db.js`:

- `products` (id, name, category, unit, created_at)
- `orders` (id, store, area, leader, created_at)
- `order_items` (id, order_id, product_id, quantity, created_at)
- `users` (id, username, password_hash, created_at) — NOVA

Observações:
- O arquivo SQLite `database.sqlite` é criado na raiz quando o servidor inicializa.
- A coluna `password_hash` armazena o hash gerado pelo bcrypt (não a senha em texto puro).

---

## 4) Endpoints da API

Resumo dos endpoints relevantes (método, rota, payload e comportamento):

- Auth
  - POST /api/auth/register
    - body: { username, password }
    - cria usuário (hash de senha), retorna { token, user }
  - POST /api/auth/login
    - body: { username, password }
    - valida credenciais, retorna { token, user }
  - GET /api/auth/me
    - header Authorization: Bearer <token>
    - retorna { user }

- Products
  - GET /api/products — lista produtos
  - POST /api/products — cria produto { name, category, unit }
  - DELETE /api/products/:id — remove produto

- Orders
  - GET /api/orders — lista pedidos resumidos
  - GET /api/orders/:id — detalhes com items
  - GET /api/orders/:id/pdf — gera/stream do PDF do pedido
  - POST /api/orders — CRIAR pedido (PROTEGIDO)
    - header Authorization: Bearer <token>
    - body: { store, area, items: [{ productId, quantity }] }
    - o `leader` será preenchido automaticamente com o username do token
  - POST /api/orders/:id/duplicate — DUPLICA pedido (PROTEGIDO)

Erros comuns retornados pela API:
- 400 — Bad request (dados faltando ou inválidos)
- 401 — Não autenticado / token inválido
- 404 — Não encontrado
- 409 — Conflito (ex.: usuário já existe)

---

## 5) Autenticação: fluxo e implementação

Fluxo do registro/login (resumido):

1. Usuário preenche formulário de registro com `username` e `password`.
2. Frontend chama `POST /api/auth/register`.
3. Backend gera salt e hash com `bcryptjs` e salva `password_hash` no banco.
4. Backend cria um JWT que contém { id, username } (assinatura com secret) e retorna ao cliente.
5. Cliente armazena o token (ex.: `localStorage.setItem('token', token)`) e redireciona para a página principal.

Login:
- Cliente envia `POST /api/auth/login` com username+password.
- Backend recupera usuário, usa `bcrypt.compare` para validar senha.
- Se OK, gera e retorna token JWT parecido com o de registro.

Proteção do servidor:
- O middleware `authMiddleware` verifica o header Authorization, valida o token com `jwt.verify`, busca o usuário por ID no banco e popula `req.user` com `{ id, username }`.
- Endpoints sensíveis usam `authMiddleware` (ex.: criação de pedidos).

Sobre segurança e segredos:
- O JWT é assinado com `JWT_SECRET`, que por padrão está codificado no código (`'change_this_secret'`) para desenvolvimento. Idealmente, defina `JWT_SECRET` como variável de ambiente em produção.
- As senhas não ficam em texto plano — apenas hashes bcrypt.

---

## 6) Frontend: comportamentos adicionados

- `frontend/login.html` + `frontend/login.js`
  - Permitem registrar e logar. Ao receber um token, o cliente salva `token` e `username` no `localStorage` e redireciona para `/`.
- `frontend/script.js` (página principal)
  - Ao inicializar, verifica se existe `token` em `localStorage`; caso não exista, redireciona para `/login.html`.
  - Adiciona header Authorization: `Bearer <token>` em requisições.
  - Prefill do campo `Líder` com o `username` armazenado e torna o campo readonly — o nome do líder será o username autenticado.

Observações UX:
- O fluxo é simples e funcional; não há ainda um botão de logout visível. Para fazer logout basta executar `localStorage.removeItem('token')` / `removeItem('username')` ou adicionar um botão que faça isso e redirecione para `/login.html`.

---

## 7) Comandos para rodar e checagens que fiz

Instalação das dependências (já executado durante o desenvolvimento):

```bash
npm install
```

Iniciar o servidor:

```bash
npm start
```

Endpoints testados manualmente (com curl):
- POST /api/auth/register — registrei `testuser` e obtive token
- POST /api/auth/login — validei login para `testuser`
- GET /api/auth/me — verifiquei token
- POST /api/products — criei produtos
- POST /api/orders — criei pedido autenticado (o leader do pedido foi o username)
- GET /api/orders/:id/pdf — baixei e abri o PDF (verifiquei que o nome do líder aparece no PDF)

---

## 8) Perguntas e respostas úteis para entrevista (pontos que você pode mencionar)

- Por que usei bcrypt e não outro método?
  - Bcrypt é um algoritmo de hash adaptativo amplamente usado para senhas. Ele inclui salt e é mais resistente a ataques de força bruta.

- Por que JWT para autenticação?
  - JWT permite transmitir de forma segura um token assinado contendo informações (claims) do usuário sem estado no servidor. É simples de integrar ao frontend (Authorization header) e não exige sessão server-side.

- Quais são riscos de segurança aqui?
  - Se o `JWT_SECRET` for fraco ou exposto, tokens podem ser forjados. Tokens guardados no localStorage são vulneráveis a XSS; idealmente, usar HTTP-only cookies em produção.
  - Também é necessário validar corretamente os dados de entrada (ex.: quantidades) para evitar erros ou abuso.

- O que é validação server-side e por que é importante aqui?
  - Validação server-side garante que os dados recebidos tenham o formato e tipos esperados, independentemente do que o cliente envie. O frontend pode ser manipulado, por isso o servidor deve sempre checar.

- Como o PDF é gerado?
  - Uso a biblioteca PDFKit para criar um documento em streaming; o servidor envia o resultado diretamente na resposta (stream), sem criar arquivos temporários.

---

## 9) Próximos passos e melhorias (curto/médio prazo)

- Forçar a presença de `JWT_SECRET` via variável de ambiente e falhar no start se não estiver definido (mais seguro).
- Adicionar `nodemon` e script `dev` no `package.json` para desenvolvimento mais rápido.
- Implementar logout no frontend e exibir usuário logado com opção de sair.
- Mover tokens para cookies HttpOnly e usar refresh tokens para maior segurança.
- Adicionar testes automatizados (unit + integração) para rotas de auth e orders.
- Melhorar mensagens de erro no frontend e UX para estados de carregamento.

---

## 10) Troubleshooting — problemas comuns e como resolver

- Erro PathError na inicialização: geralmente causado por uso de `app.get('*')` em algumas versões de dependências. Eu substituí por middleware que ignora `/api/*` e serve `index.html` apenas para rotas não-API.
- Porta já em uso: verifique com `lsof -i :3000` e finalize o processo que conflita.
- Token inválido: verifique se `JWT_SECRET` mudou ou se o token expirou; teste com `POST /api/auth/login` para obter token novo.

---

Se quiser, eu posso:

- Adicionar o botão de logout e exibir o usuário no `header`.
- Adicionar `nodemon` como dependência de desenvolvimento e script `dev`.
- Forçar `JWT_SECRET` por variáveis de ambiente e documentar melhor a implantação.

Diga qual destes itens prefere e eu implemento automaticamente no repositório.

---

Boa sorte na entrevista — se quiser, eu adapto este documento para um formato de apresentação (slides) ou resumo curto para entregar ao entrevistador.
