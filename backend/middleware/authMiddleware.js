const jwt = require('jsonwebtoken');
const UsersModel = require('../models/usersModel');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token ausente' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await UsersModel.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    req.user = { id: user.id, username: user.username };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido', details: err.message });
  }
}

module.exports = authMiddleware;
