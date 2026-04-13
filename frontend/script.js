const storeSelect = document.getElementById('storeSelect');
const areaSelect = document.getElementById('areaSelect');
const itemsContainer = document.getElementById('itemsContainer');
const addItemBtn = document.getElementById('addItem');
const addNewProductBtn = document.getElementById('addNewProduct');
const newProductForm = document.getElementById('newProductForm');
const closeNewProductBtn = document.getElementById('closeNewProduct');
const saveNewProductBtn = document.getElementById('saveNewProduct');
const leaderInput = document.getElementById('leaderInput');
const submitOrderBtn = document.getElementById('submitOrder');
const feedback = document.getElementById('feedback');
const productsListEl = document.getElementById('productsList');
const ordersListEl = document.getElementById('ordersList');
const duplicateLatestBtn = document.getElementById('duplicateLatest');

let products = [];
let orders = [];

async function fetchJSON(url, opts = {}) {
  const headers = Object.assign({}, opts.headers || {});
  headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers, ...opts });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Erro na requisição');
  }
  return res.json();
}

function renderSelectOptions(select, options) {
  select.innerHTML = '';
  options.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    select.appendChild(o);
  });
}

function productOptionLabel(p) {
  return `${p.name} (${p.unit})`;
}

function addItemRow(prefill) {
  const row = document.createElement('div');
  row.className = 'item-row';

  const select = document.createElement('select');
  products.forEach((p) => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = productOptionLabel(p);
    if (prefill && prefill.product_id === p.id) option.selected = true;
    select.appendChild(option);
  });

  const qty = document.createElement('input');
  qty.type = 'number';
  qty.min = '0';
  qty.step = '0.1';
  qty.placeholder = 'Qtd';
  qty.value = prefill ? prefill.quantity : '';

  const remove = document.createElement('button');
  remove.textContent = 'Remover';
  remove.addEventListener('click', () => row.remove());

  row.appendChild(select);
  row.appendChild(qty);
  row.appendChild(remove);
  itemsContainer.appendChild(row);
}

function serializeItems() {
  const rows = [...itemsContainer.querySelectorAll('.item-row')];
  return rows
    .map((row) => {
      const productId = Number(row.querySelector('select').value);
      const quantity = Number(row.querySelector('input').value);
      return { productId, quantity };
    })
    .filter((i) => i.productId && i.quantity > 0);
}

function showFeedback(msg, isError = false) {
  feedback.textContent = msg;
  feedback.classList.toggle('danger', isError);
}

async function loadProducts() {
  products = await fetchJSON('/api/products');
  renderProductList();
  // rebuild selects
  itemsContainer.innerHTML = '';
  addItemRow();
}

function renderProductList() {
  productsListEl.innerHTML = '';
  products.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div>
        <strong>${p.name}</strong><br>
        <small>${p.category} • ${p.unit}</small>
      </div>
    `;
    const del = document.createElement('button');
    del.textContent = 'Excluir';
    del.addEventListener('click', async () => {
      if (!confirm(`Excluir ${p.name}?`)) return;
      await fetchJSON(`/api/products/${p.id}`, { method: 'DELETE' });
      products = products.filter((prod) => prod.id !== p.id);
      renderProductList();
      loadOrders(); // in case items depend
    });
    item.appendChild(del);
    productsListEl.appendChild(item);
  });
}

async function loadMeta() {
  const meta = await fetchJSON('/api/orders/meta');
  renderSelectOptions(storeSelect, meta.stores);
  renderSelectOptions(areaSelect, meta.areas);
}

async function loadOrders() {
  orders = await fetchJSON('/api/orders');
  renderOrders();
}

function renderOrders() {
  ordersListEl.innerHTML = '';
  if (!orders.length) {
    ordersListEl.innerHTML = '<small>Nenhum pedido ainda.</small>';
    return;
  }
  orders.forEach((o) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    const left = document.createElement('div');
    left.innerHTML = `<strong>${o.store} (${o.area})</strong><br>
      <small>${new Date(o.created_at).toLocaleString()} • ${o.items_count} itens</small><br>
      <small>Líder: ${o.leader}</small>`;
    const actions = document.createElement('div');
    actions.className = 'actions';

    const reuse = document.createElement('button');
    reuse.textContent = 'Reutilizar';
    reuse.addEventListener('click', async () => {
      const detail = await fetchJSON(`/api/orders/${o.id}`);
      storeSelect.value = detail.order.store;
      areaSelect.value = detail.order.area;
      leaderInput.value = detail.order.leader;
      itemsContainer.innerHTML = '';
      detail.items.forEach((it) => addItemRow(it));
      showFeedback('Pedido carregado para edição');
    });

    const pdfBtn = document.createElement('button');
    pdfBtn.textContent = 'PDF';
    pdfBtn.addEventListener('click', () => {
      window.open(`/api/orders/${o.id}/pdf`, '_blank');
    });

    actions.appendChild(reuse);
    actions.appendChild(pdfBtn);
    item.appendChild(left);
    item.appendChild(actions);
    ordersListEl.appendChild(item);
  });
}

async function submitOrder() {
  try {
    const items = serializeItems();
    if (!items.length) return showFeedback('Adicione ao menos um item', true);
    const leader = leaderInput.value.trim();
    if (!leader) return showFeedback('Informe o nome do líder', true);
    const payload = {
      store: storeSelect.value,
      area: areaSelect.value,
      leader,
      items,
    };
    const result = await fetchJSON('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    showFeedback('Pedido salvo. PDF aberto em nova aba.');
    window.open(`/api/orders/${result.orderId}/pdf`, '_blank');
    leaderInput.value = '';
    itemsContainer.innerHTML = '';
    addItemRow();
    loadOrders();
  } catch (err) {
    showFeedback(err.message || 'Erro ao salvar', true);
  }
}

async function saveNewProduct() {
  const name = document.getElementById('npName').value.trim();
  const category = document.getElementById('npCategory').value.trim();
  const unit = document.getElementById('npUnit').value.trim();
  if (!name || !category || !unit) {
    return alert('Preencha nome, categoria e unidade');
  }
  try {
    const product = await fetchJSON('/api/products', {
      method: 'POST',
      body: JSON.stringify({ name, category, unit }),
    });
    products.push(product);
    products.sort((a, b) => a.name.localeCompare(b.name));
    renderProductList();
    addItemRow({ product_id: product.id, quantity: '' });
    newProductForm.classList.add('hidden');
    document.getElementById('npName').value = '';
    document.getElementById('npCategory').value = '';
    document.getElementById('npUnit').value = '';
    showFeedback('Produto adicionado');
  } catch (err) {
    alert(err.message || 'Erro ao salvar produto');
  }
}

function toggleNewProduct(show) {
  newProductForm.classList.toggle('hidden', !show);
}

function findLatestOrderForSelection() {
  return orders.find((o) => o.store === storeSelect.value && o.area === areaSelect.value);
}

async function duplicateLatest() {
  const latest = findLatestOrderForSelection();
  if (!latest) {
    return showFeedback('Nenhum pedido anterior para esta loja/categoria', true);
  }
  const res = await fetchJSON(`/api/orders/${latest.id}/duplicate`, { method: 'POST' });
  showFeedback('Pedido duplicado. PDF aberto.');
  window.open(`/api/orders/${res.orderId}/pdf`, '_blank');
  loadOrders();
}

function wireEvents() {
  addItemBtn.addEventListener('click', () => addItemRow());
  submitOrderBtn.addEventListener('click', submitOrder);
  addNewProductBtn.addEventListener('click', () => toggleNewProduct(true));
  closeNewProductBtn.addEventListener('click', () => toggleNewProduct(false));
  saveNewProductBtn.addEventListener('click', saveNewProduct);
  duplicateLatestBtn.addEventListener('click', duplicateLatest);

  // Logout button in header
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login.html';
    });
  }
}

async function init() {
  // require authentication
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  if (!token) {
    // redirect to login page
    if (!location.pathname.endsWith('/login.html')) location.href = '/login.html';
    return;
  }
  // fill leader input and make it readonly
  if (username && leaderInput) {
    leaderInput.value = username;
    leaderInput.setAttribute('readonly', 'true');
  }
  // show username in header if present
  const loggedUserEl = document.getElementById('loggedUser');
  if (loggedUserEl && username) {
    loggedUserEl.textContent = username;
  }
  wireEvents();
  await loadMeta();
  await loadProducts();
  await loadOrders();
}

init().catch((err) => showFeedback(err.message || 'Erro ao iniciar', true));
