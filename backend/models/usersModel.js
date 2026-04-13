const db = require('../db');

const UsersModel = {
  create({ username, password_hash }) {
    return new Promise((resolve, reject) => {
      const stmt = 'INSERT INTO users (username, password_hash) VALUES (?,?)';
      db.run(stmt, [username, password_hash], function cb(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, username, created_at: new Date().toISOString() });
      });
    });
  },

  findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
};

module.exports = UsersModel;
