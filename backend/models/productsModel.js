const db = require('../db');

const ProductsModel = {
  list() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM products ORDER BY name', (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  create({ name, category, unit }) {
    return new Promise((resolve, reject) => {
      const stmt = 'INSERT INTO products (name, category, unit) VALUES (?,?,?)';
      db.run(stmt, [name, category, unit], function cb(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name, category, unit });
      });
    });
  },

  remove(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE id = ?', [id], function cb(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  },

  findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
};

module.exports = ProductsModel;
