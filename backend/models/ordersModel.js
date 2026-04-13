const db = require('../db');

const OrdersModel = {
  async create({ store, area, leader, items }) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(
          'INSERT INTO orders (store, area, leader) VALUES (?,?,?)',
          [store, area, leader],
          function orderInserted(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            const orderId = this.lastID;
            const stmt = db.prepare(
              'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?,?,?)'
            );
            for (const item of items) {
              stmt.run([orderId, item.productId, item.quantity]);
            }
            stmt.finalize((finalizeErr) => {
              if (finalizeErr) {
                db.run('ROLLBACK');
                return reject(finalizeErr);
              }
              db.run('COMMIT', (commitErr) => {
                if (commitErr) return reject(commitErr);
                resolve(orderId);
              });
            });
          }
        );
      });
    });
  },

  list() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT o.id, o.store, o.area, o.leader, o.created_at,
               COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      db.all(sql, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  getWithItems(orderId) {
    return new Promise((resolve, reject) => {
      const orderSql = 'SELECT * FROM orders WHERE id = ?';
      db.get(orderSql, [orderId], (err, order) => {
        if (err) return reject(err);
        if (!order) return resolve(null);
        const itemsSql = `
          SELECT oi.id, oi.quantity, p.id as product_id, p.name, p.category, p.unit
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = ?
        `;
        db.all(itemsSql, [orderId], (itemsErr, items) => {
          if (itemsErr) return reject(itemsErr);
          resolve({ order, items });
        });
      });
    });
  },

  async duplicate(orderId) {
    const data = await this.getWithItems(orderId);
    if (!data) return null;
    const { order, items } = data;
    const newItems = items.map((i) => ({
      productId: i.product_id,
      quantity: i.quantity,
    }));
    const newId = await this.create({
      store: order.store,
      area: order.area,
      leader: order.leader,
      items: newItems,
    });
    return newId;
  },
};

module.exports = OrdersModel;
