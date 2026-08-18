import express from 'express';
import path from 'path';
import fs from 'fs';
import { createClient } from '@libsql/client';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

// Initialize SQLite Client with local file
const dbPath = path.join(process.cwd(), 'restaurant.db');
const db = createClient({
  url: `file:${dbPath}`,
});

// Configure Multer for memory upload (stored directly into SQLite)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  storage: multer.memoryStorage(),
});

// Initialize SQLite Tables
async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS config (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category TEXT NOT NULL,
      image TEXT,
      station TEXT DEFAULT 'kitchen',
      is_available INTEGER DEFAULT 1,
      prep_time_minutes INTEGER DEFAULT 15,
      badges TEXT,
      is_vegetarian INTEGER DEFAULT 0,
      is_gluten_free INTEGER DEFAULT 0,
      is_highlight INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      filename TEXT,
      mime_type TEXT NOT NULL,
      data BLOB NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number INTEGER NOT NULL,
      order_type TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      payment_method TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      table_number INTEGER,
      delivery_address TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      delivery_fee REAL DEFAULT 0,
      service_fee REAL DEFAULT 0,
      driver_fee REAL DEFAULT 0,
      driver_name TEXT,
      total REAL NOT NULL,
      notes TEXT,
      estimated_prep_time INTEGER DEFAULT 20,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Ensure orders table starts completely empty from zero
  await db.execute(`DELETE FROM orders`);
  const existingConfig = await db.execute(`SELECT id FROM config WHERE id = 'store_config'`);
  if (existingConfig.rows.length === 0) {
    const defaultConfig = {
      name: 'Meu Restaurante',
      tagline: 'Cardápio Digital & Delivery',
      phone: '(11) 99999-9999',
      whatsapp: '(11) 99999-9999',
      instagram: '@meurestaurante',
      address: 'Rua Principal, 100 - Centro',
      logoUrl: '',
      bannerUrl: '',
      isOpen: true,
      serviceFeePercent: 10,
      deliveryFee: 6.0,
      defaultDriverPayoutFee: 5.0,
      freeDeliveryThreshold: 70.0,
      estimatedDeliveryMinutes: 35,
      minOrderDelivery: 20.0,
      pixKey: 'contato@meurestaurante.com.br',
      enableSoundAlerts: true,
      currency: 'BRL',
    };
    await db.execute({
      sql: `INSERT INTO config (id, data, updated_at) VALUES ('store_config', ?, ?)`,
      args: [JSON.stringify(defaultConfig), new Date().toISOString()],
    });
  }

  // Check categories, insert default base categories if empty
  const existingCategories = await db.execute(`SELECT COUNT(*) as count FROM categories`);
  if (Number(existingCategories.rows[0]?.count || 0) === 0) {
    const defaultCategories = [
      { id: 'burgers', name: 'Hambúrgueres & Lanches', icon: 'Flame', sort_order: 1 },
      { id: 'portions', name: 'Porções & Entradas', icon: 'UtensilsCrossed', sort_order: 2 },
      { id: 'drinks', name: 'Bebidas & Drinks', icon: 'Wine', sort_order: 3 },
      { id: 'desserts', name: 'Sobremesas', icon: 'Sparkles', sort_order: 4 },
    ];
    for (const cat of defaultCategories) {
      await db.execute({
        sql: `INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)`,
        args: [cat.id, cat.name, cat.icon, cat.sort_order],
      });
    }
  }

  console.log(' SQLite database and tables initialized successfully');
}

async function startServer() {
  await initDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'SQLite (libsql)', uptime: process.uptime() });
  });

  // 1. Store Config Endpoints
  app.get('/api/config', async (req, res) => {
    try {
      const result = await db.execute(`SELECT data FROM config WHERE id = 'store_config'`);
      if (result.rows.length > 0 && result.rows[0]?.data) {
        return res.json(JSON.parse(result.rows[0].data as string));
      }
      return res.json({});
    } catch (err: any) {
      console.error('Error fetching config:', err);
      res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
  });

  app.post('/api/config', async (req, res) => {
    try {
      const configData = req.body;
      await db.execute({
        sql: `INSERT INTO config (id, data, updated_at) VALUES ('store_config', ?, ?)
              ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        args: [JSON.stringify(configData), new Date().toISOString()],
      });
      res.json({ success: true, config: configData });
    } catch (err: any) {
      console.error('Error saving config:', err);
      res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
  });

  // 2. Categories Endpoints
  app.get('/api/categories', async (req, res) => {
    try {
      const result = await db.execute(`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`);
      const categories = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon || 'Utensils',
        sortOrder: row.sort_order,
      }));
      res.json(categories);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Erro ao carregar categorias' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const { id, name, icon, sortOrder } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: 'ID e Nome são obrigatórios' });
      }
      await db.execute({
        sql: `INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET name = excluded.name, icon = excluded.icon, sort_order = excluded.sort_order`,
        args: [id, name, icon || 'Utensils', sortOrder || 0],
      });
      res.json({ success: true, category: { id, name, icon, sortOrder } });
    } catch (err: any) {
      console.error('Error saving category:', err);
      res.status(500).json({ error: 'Erro ao salvar categoria' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute({
        sql: `DELETE FROM categories WHERE id = ?`,
        args: [id],
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error('Error deleting category:', err);
      res.status(500).json({ error: 'Erro ao deletar categoria' });
    }
  });

  // 3. Products Endpoints
  app.get('/api/products', async (req, res) => {
    try {
      const result = await db.execute(`SELECT * FROM products ORDER BY sort_order ASC, name ASC`);
      const products = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: Number(row.price),
        originalPrice: row.original_price ? Number(row.original_price) : undefined,
        category: row.category,
        image: row.image || '',
        station: (row.station as string) || 'kitchen',
        isAvailable: Number(row.is_available) === 1,
        prepTimeMinutes: Number(row.prep_time_minutes) || 15,
        badges: row.badges ? JSON.parse(row.badges as string) : [],
        isVegetarian: Number(row.is_vegetarian) === 1,
        isGlutenFree: Number(row.is_gluten_free) === 1,
        isHighlight: Number(row.is_highlight) === 1,
        sortOrder: Number(row.sort_order) || 0,
      }));
      res.json(products);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Erro ao carregar produtos' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const p = req.body;
      const id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO products (
          id, name, description, price, original_price, category, image, station,
          is_available, prep_time_minutes, badges, is_vegetarian, is_gluten_free,
          is_highlight, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          price = excluded.price,
          original_price = excluded.original_price,
          category = excluded.category,
          image = excluded.image,
          station = excluded.station,
          is_available = excluded.is_available,
          prep_time_minutes = excluded.prep_time_minutes,
          badges = excluded.badges,
          is_vegetarian = excluded.is_vegetarian,
          is_gluten_free = excluded.is_gluten_free,
          is_highlight = excluded.is_highlight,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at`,
        args: [
          id,
          p.name,
          p.description || '',
          p.price,
          p.originalPrice || null,
          p.category,
          p.image || '',
          p.station || 'kitchen',
          p.isAvailable === false ? 0 : 1,
          p.prepTimeMinutes || 15,
          JSON.stringify(p.badges || []),
          p.isVegetarian ? 1 : 0,
          p.isGlutenFree ? 1 : 0,
          p.isHighlight ? 1 : 0,
          p.sortOrder || 0,
          now,
          now,
        ],
      });

      res.json({ success: true, id, product: { ...p, id } });
    } catch (err: any) {
      console.error('Error saving product:', err);
      res.status(500).json({ error: 'Erro ao salvar produto' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute({
        sql: `DELETE FROM products WHERE id = ?`,
        args: [id],
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      res.status(500).json({ error: 'Erro ao excluir produto' });
    }
  });

  // 4. Photo Upload & Storage in SQLite
  app.post('/api/upload', upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        // Check if raw base64 data was sent in JSON body
        if (req.body.base64Data) {
          const base64Str = req.body.base64Data as string;
          const mimeMatch = base64Str.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
          let mimeType = 'image/jpeg';
          let buffer: Buffer;

          if (mimeMatch) {
            mimeType = mimeMatch[1];
            buffer = Buffer.from(mimeMatch[2], 'base64');
          } else {
            buffer = Buffer.from(base64Str, 'base64');
          }

          const photoId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          await db.execute({
            sql: `INSERT INTO photos (id, filename, mime_type, data, size, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              photoId,
              req.body.filename || 'uploaded_image.jpg',
              mimeType,
              buffer,
              buffer.length,
              new Date().toISOString(),
            ],
          });

          return res.json({
            success: true,
            photoId,
            url: `/api/photos/${photoId}`,
            size: buffer.length,
          });
        }
        return res.status(400).json({ error: 'Nenhuma imagem enviada' });
      }

      const file = req.file;
      const photoId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      await db.execute({
        sql: `INSERT INTO photos (id, filename, mime_type, data, size, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          photoId,
          file.originalname || 'upload.jpg',
          file.mimetype || 'image/jpeg',
          file.buffer,
          file.size,
          new Date().toISOString(),
        ],
      });

      res.json({
        success: true,
        photoId,
        url: `/api/photos/${photoId}`,
        filename: file.originalname,
        size: file.size,
      });
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
    }
  });

  // Serve photo directly from SQLite
  app.get('/api/photos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.execute({
        sql: `SELECT mime_type, data FROM photos WHERE id = ?`,
        args: [id],
      });

      if (result.rows.length === 0 || !result.rows[0]) {
        return res.status(404).send('Imagem não encontrada');
      }

      const row = result.rows[0];
      const mimeType = (row.mime_type as string) || 'image/jpeg';
      const data = row.data as ArrayBuffer | Buffer;

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(Buffer.from(data));
    } catch (err: any) {
      console.error('Error serving photo:', err);
      res.status(500).send('Erro ao carregar imagem');
    }
  });

  // 5. Orders Endpoints
  app.get('/api/orders', async (req, res) => {
    try {
      const result = await db.execute(`SELECT * FROM orders ORDER BY created_at DESC`);
      const orders = result.rows.map(row => ({
        id: row.id,
        orderNumber: Number(row.order_number),
        orderType: row.order_type,
        status: row.status,
        paymentStatus: row.payment_status,
        paymentMethod: row.payment_method || undefined,
        customerName: row.customer_name || 'Cliente',
        customerPhone: row.customer_phone || '',
        tableNumber: row.table_number ? Number(row.table_number) : undefined,
        deliveryAddress: row.delivery_address ? JSON.parse(row.delivery_address as string) : undefined,
        items: JSON.parse(row.items as string),
        subtotal: Number(row.subtotal),
        deliveryFee: Number(row.delivery_fee) || 0,
        serviceFee: Number(row.service_fee) || 0,
        driverFee: Number(row.driver_fee) || 0,
        driverName: (row.driver_name as string) || undefined,
        total: Number(row.total),
        notes: (row.notes as string) || '',
        estimatedPrepTime: Number(row.estimated_prep_time) || 20,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      res.json(orders);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'Erro ao carregar pedidos' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const o = req.body;
      const id = o.id || `ord_${Date.now()}`;
      const now = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO orders (
          id, order_number, order_type, status, payment_status, payment_method,
          customer_name, customer_phone, table_number, delivery_address, items,
          subtotal, delivery_fee, service_fee, driver_fee, driver_name, total,
          notes, estimated_prep_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          payment_status = excluded.payment_status,
          payment_method = excluded.payment_method,
          driver_name = excluded.driver_name,
          updated_at = excluded.updated_at`,
        args: [
          id,
          o.orderNumber,
          o.orderType,
          o.status,
          o.paymentStatus,
          o.paymentMethod || null,
          o.customerName || 'Cliente',
          o.customerPhone || '',
          o.tableNumber || null,
          o.deliveryAddress ? JSON.stringify(o.deliveryAddress) : null,
          JSON.stringify(o.items || []),
          o.subtotal,
          o.deliveryFee || 0,
          o.serviceFee || 0,
          o.driverFee || 0,
          o.driverName || null,
          o.total,
          o.notes || '',
          o.estimatedPrepTime || 20,
          o.createdAt || now,
          now,
        ],
      });

      res.json({ success: true, order: { ...o, id } });
    } catch (err: any) {
      console.error('Error saving order:', err);
      res.status(500).json({ error: 'Erro ao salvar pedido' });
    }
  });

  app.patch('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const now = new Date().toISOString();

      const existing = await db.execute({
        sql: `SELECT * FROM orders WHERE id = ?`,
        args: [id],
      });

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      const current = existing.rows[0];
      const newStatus = updates.status !== undefined ? updates.status : current.status;
      const newPaymentStatus = updates.paymentStatus !== undefined ? updates.paymentStatus : current.payment_status;
      const newPaymentMethod = updates.paymentMethod !== undefined ? updates.paymentMethod : current.payment_method;
      const newDriverName = updates.driverName !== undefined ? updates.driverName : current.driver_name;

      await db.execute({
        sql: `UPDATE orders SET status = ?, payment_status = ?, payment_method = ?, driver_name = ?, updated_at = ? WHERE id = ?`,
        args: [newStatus, newPaymentStatus, newPaymentMethod, newDriverName, now, id],
      });

      res.json({ success: true, id, status: newStatus, paymentStatus: newPaymentStatus });
    } catch (err: any) {
      console.error('Error updating order:', err);
      res.status(500).json({ error: 'Erro ao atualizar pedido' });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute({
        sql: `DELETE FROM orders WHERE id = ?`,
        args: [id],
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error('Error deleting order:', err);
      res.status(500).json({ error: 'Erro ao excluir pedido' });
    }
  });

  app.delete('/api/orders', async (req, res) => {
    try {
      await db.execute(`DELETE FROM orders`);
      res.json({ success: true, message: 'Todos os pedidos foram removidos com sucesso' });
    } catch (err: any) {
      console.error('Error clearing orders:', err);
      res.status(500).json({ error: 'Erro ao limpar pedidos' });
    }
  });

  app.post('/api/reset-all', async (req, res) => {
    try {
      const { clearProducts } = req.body || {};
      await db.execute(`DELETE FROM orders`);
      if (clearProducts) {
        await db.execute(`DELETE FROM products`);
      }
      res.json({ success: true, message: 'Sistema zerado com sucesso no SQLite' });
    } catch (err: any) {
      console.error('Error in reset-all:', err);
      res.status(500).json({ error: 'Erro ao zerar sistema' });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT} com SQLite local ativo.`);
  });
}

startServer().catch(err => {
  console.error('Falha fatal ao iniciar servidor:', err);
});
