const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsersModel = require('../models/usersModel');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = '7d';

const AuthController = {
  async register(req, res) {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    try {
      const existing = await UsersModel.findByUsername(username);
      if (existing) return res.status(409).json({ error: 'Usuário já existe' });
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const user = await UsersModel.create({ username, password_hash: hash });
      const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
      res.status(201).json({ token, user: { id: user.id, username } });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar usuário', details: err.message });
    }
  },

  async login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    try {
      const user = await UsersModel.findByUsername(username);
      if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
      res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao autenticar', details: err.message });
    }
  },

  me(req, res) {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    res.json({ user: req.user });
  },
};

module.exports = AuthController;
