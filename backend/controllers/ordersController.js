const PDFDocument = require('pdfkit');
const OrdersModel = require('../models/ordersModel');
const ProductsModel = require('../models/productsModel');

const STORES = ['Nescafe', 'Living Heineken', 'Qualycon', 'Forneria', 'Internacional'];
const AREAS = ['Ar', 'Terra'];

function validateItems(items) {
  return Array.isArray(items) && items.length > 0 && items.every((i) => i.productId && i.quantity > 0);
}

const OrdersController = {
  async create(req, res) {
    const { store, area, items } = req.body;
    // leader will be taken from authenticated user
    const leader = req.user && req.user.username ? req.user.username : null;
    if (!STORES.includes(store)) {
      return res.status(400).json({ error: 'Loja inválida' });
    }
    if (!AREAS.includes(area)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }
    if (!leader || typeof leader !== 'string') {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    if (!validateItems(items)) {
      return res.status(400).json({ error: 'Itens inválidos' });
    }

    try {
      // Validate product existence
      await Promise.all(
        items.map(async (item) => {
          const product = await ProductsModel.findById(item.productId);
          if (!product) throw new Error(`Produto id ${item.productId} não encontrado`);
        })
      );

      const orderId = await OrdersModel.create({ store, area, leader: leader.trim(), items });
      res.status(201).json({ orderId });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar pedido', details: err.message });
    }
  },

  async list(req, res) {
    try {
      const orders = await OrdersModel.list();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar pedidos', details: err.message });
    }
  },

  async detail(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    try {
      const data = await OrdersModel.getWithItems(id);
      if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar pedido', details: err.message });
    }
  },

  async duplicate(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    try {
      const newId = await OrdersModel.duplicate(id);
      if (!newId) return res.status(404).json({ error: 'Pedido não encontrado' });
      res.status(201).json({ orderId: newId });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao duplicar pedido', details: err.message });
    }
  },

  async pdf(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    try {
      const data = await OrdersModel.getWithItems(id);
      if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
      const { order, items } = data;
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=pedido-${id}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).text(`Pedido - ${order.store} (${order.area})`);
      doc.moveDown();
      items.forEach((item) => {
        doc.fontSize(12).text(`${item.name}: ${item.quantity} ${item.unit}`);
      });

      doc.moveDown();
      doc.fontSize(12).text(`Líder responsável: ${order.leader}`);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text(`Criado em: ${order.created_at}`);

      doc.end();
    } catch (err) {
      res.status(500).json({ error: 'Erro ao gerar PDF', details: err.message });
    }
  },

  stores(req, res) {
    res.json({ stores: STORES, areas: AREAS });
  },
};

module.exports = OrdersController;
