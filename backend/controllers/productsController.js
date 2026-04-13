const ProductsModel = require('../models/productsModel');

const ProductsController = {
  async list(req, res) {
    try {
      const products = await ProductsModel.list();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar produtos', details: err.message });
    }
  },

  async create(req, res) {
    const { name, category, unit } = req.body;
    if (!name || !category || !unit) {
      return res.status(400).json({ error: 'Preencha nome, categoria e unidade' });
    }
    try {
      const product = await ProductsModel.create({ name: name.trim(), category, unit });
      res.status(201).json(product);
    } catch (err) {
      const conflict = err.message && err.message.includes('UNIQUE');
      res
        .status(conflict ? 409 : 500)
        .json({ error: conflict ? 'Produto já existe' : 'Erro ao criar produto', details: err.message });
    }
  },

  async remove(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    try {
      const deleted = await ProductsModel.remove(id);
      if (!deleted) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao excluir produto', details: err.message });
    }
  },
};

module.exports = ProductsController;
