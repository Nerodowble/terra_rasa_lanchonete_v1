/**
 * As rotas da API. Usado tanto pelo servidor local (server.ts) quanto pela
 * funcao serverless do Vercel (api/[...path].ts).
 */
import express, { Express } from 'express';
import multer from 'multer';
import {
  lerCardapio, alterarCardapio, lerPedidos, alterarPedidos,
  salvarFoto, lerFoto, INFO,
} from './jsonStore.js';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 }, storage: multer.memoryStorage() });

const CONFIG_PADRAO = {
  name: 'Terra Rasa Lanchonete',
  tagline: 'Lanches e Hot Dogs',
  phone: '(11) 99999-9999',
  whatsapp: '(11) 99999-9999',
  instagram: '@terrarasalanchonete',
  address: 'Diadema - SP',
  logoUrl: '', bannerUrl: '', isOpen: true,
  serviceFeePercent: 0,
  deliveryFee: 5.0,
  defaultDriverPayoutFee: 5.0,
  freeDeliveryThreshold: 50.0,
  estimatedDeliveryMinutes: 35,
  minOrderDelivery: 15.0,
  pixKey: '',
  enableSoundAlerts: true,
  currency: 'BRL',
};

/** Envolve o handler para que qualquer erro vire 500 com mensagem, sem derrubar a funcao. */
const rota = (fn: (req: any, res: any) => Promise<any>) => (req: any, res: any) => {
  fn(req, res).catch((err: any) => {
    console.error(`Erro em ${req.method} ${req.url}:`, err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro interno', detalhe: String(err?.message || err) });
  });
};

export function criarApi(): Express {
  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // ------------------------------------------------------------ health
  app.get('/api/health', rota(async (req, res) => {
    const c = await lerCardapio();
    const p = await lerPedidos();
    res.json({
      status: 'ok',
      engine: `JSON / ${INFO.modo}`,
      destino: INFO.destino,
      produtos: c.products.length,
      pedidos: p.orders.length,
      uptime: process.uptime(),
    });
  }));

  // ------------------------------------------------------------ config
  app.get('/api/config', rota(async (req, res) => {
    const c = await lerCardapio();
    res.json(Object.keys(c.config || {}).length ? c.config : CONFIG_PADRAO);
  }));

  app.post('/api/config', rota(async (req, res) => {
    const c = await alterarCardapio(x => { x.config = req.body; });
    res.json({ success: true, config: c.config });
  }));

  // -------------------------------------------------------- categorias
  app.get('/api/categories', rota(async (req, res) => {
    const c = await lerCardapio();
    res.json([...c.categories].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name).localeCompare(String(b.name))));
  }));

  app.post('/api/categories', rota(async (req, res) => {
    const { id, name, icon, sortOrder, description } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'ID e Nome são obrigatórios' });
    const cat = { id, name, icon: icon || 'Utensils', sortOrder: sortOrder || 0, description: description || '' };
    await alterarCardapio(c => {
      const i = c.categories.findIndex(x => x.id === id);
      if (i >= 0) c.categories[i] = { ...c.categories[i], ...cat }; else c.categories.push(cat);
    });
    res.json({ success: true, category: cat });
  }));

  app.delete('/api/categories/:id', rota(async (req, res) => {
    await alterarCardapio(c => { c.categories = c.categories.filter(x => x.id !== req.params.id); });
    res.json({ success: true, deletedId: req.params.id });
  }));

  // ---------------------------------------------------------- produtos
  app.get('/api/products', rota(async (req, res) => {
    const c = await lerCardapio();
    res.json([...c.products].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name).localeCompare(String(b.name))));
  }));

  app.post('/api/products', rota(async (req, res) => {
    const p = req.body;
    const id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const produto = {
      id,
      name: p.name,
      description: p.description || '',
      price: Number(p.price),
      originalPrice: p.originalPrice ?? undefined,
      category: p.category,
      image: p.image || '',
      station: p.station || 'kitchen',
      isAvailable: p.isAvailable !== false,
      prepTimeMinutes: Number(p.prepTimeMinutes) || 15,
      badges: p.badges || [],
      isVegetarian: !!p.isVegetarian,
      isGlutenFree: !!p.isGlutenFree,
      isHighlight: !!p.isHighlight,
      sortOrder: Number(p.sortOrder) || 0,
      createdAt: p.createdAt || now,
      updatedAt: now,
    };
    await alterarCardapio(c => {
      const i = c.products.findIndex(x => x.id === id);
      if (i >= 0) c.products[i] = { ...c.products[i], ...produto }; else c.products.push(produto);
    });
    res.json({ success: true, id, product: produto });
  }));

  app.delete('/api/products/:id', rota(async (req, res) => {
    await alterarCardapio(c => { c.products = c.products.filter(x => x.id !== req.params.id); });
    res.json({ success: true, deletedId: req.params.id });
  }));

  // ------------------------------------------------------------- fotos
  app.post('/api/upload', upload.single('photo'), rota(async (req, res) => {
    if (req.file) {
      const m = await salvarFoto(req.file.buffer, req.file.mimetype || 'image/jpeg', req.file.originalname);
      return res.json({ success: true, photoId: m.id, url: m.url || `/api/photos/${m.id}`, filename: m.filename, size: m.size });
    }
    if (req.body?.base64Data) {
      const s = req.body.base64Data as string;
      const match = s.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      const mime = match ? match[1] : 'image/jpeg';
      const buffer = Buffer.from(match ? match[2] : s, 'base64');
      const m = await salvarFoto(buffer, mime, req.body.filename || 'upload.jpg');
      return res.json({ success: true, photoId: m.id, url: m.url || `/api/photos/${m.id}`, size: m.size });
    }
    res.status(400).json({ error: 'Nenhuma imagem enviada' });
  }));

  app.get('/api/photos/:id', rota(async (req, res) => {
    const foto = await lerFoto(req.params.id);
    if (!foto) return res.status(404).send('Imagem não encontrada');
    if (foto.url) return res.redirect(foto.url);
    res.setHeader('Content-Type', foto.meta.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(foto.buffer);
  }));

  // ----------------------------------------------------------- pedidos
  app.get('/api/orders', rota(async (req, res) => {
    const p = await lerPedidos();
    res.json([...p.orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
  }));

  app.post('/api/orders', rota(async (req, res) => {
    const o = req.body;
    const id = o.id || `ord_${Date.now()}`;
    const now = new Date().toISOString();
    await alterarPedidos(p => {
      const i = p.orders.findIndex(x => x.id === id);
      if (i >= 0) {
        p.orders[i] = {
          ...p.orders[i],
          status: o.status ?? p.orders[i].status,
          paymentStatus: o.paymentStatus ?? p.orders[i].paymentStatus,
          paymentMethod: o.paymentMethod ?? p.orders[i].paymentMethod,
          driverName: o.driverName ?? p.orders[i].driverName,
          updatedAt: now,
        };
      } else {
        p.orders.push({ ...o, id, createdAt: o.createdAt || now, updatedAt: now });
      }
    });
    res.json({ success: true, order: { ...o, id } });
  }));

  app.patch('/api/orders/:id', rota(async (req, res) => {
    const u = req.body;
    let achou = false;
    const p = await alterarPedidos(x => {
      const i = x.orders.findIndex(o => o.id === req.params.id);
      if (i < 0) return;
      achou = true;
      const a = x.orders[i];
      x.orders[i] = {
        ...a,
        status: u.status !== undefined ? u.status : a.status,
        paymentStatus: u.paymentStatus !== undefined ? u.paymentStatus : a.paymentStatus,
        paymentMethod: u.paymentMethod !== undefined ? u.paymentMethod : a.paymentMethod,
        driverName: u.driverName !== undefined ? u.driverName : a.driverName,
        updatedAt: new Date().toISOString(),
      };
    });
    if (!achou) return res.status(404).json({ error: 'Pedido não encontrado' });
    const atual = p.orders.find(o => o.id === req.params.id);
    res.json({ success: true, id: req.params.id, status: atual?.status, paymentStatus: atual?.paymentStatus });
  }));

  app.delete('/api/orders/:id', rota(async (req, res) => {
    await alterarPedidos(p => { p.orders = p.orders.filter(o => o.id !== req.params.id); });
    res.json({ success: true, deletedId: req.params.id });
  }));

  app.delete('/api/orders', rota(async (req, res) => {
    await alterarPedidos(p => { p.orders = []; });
    res.json({ success: true, message: 'Todos os pedidos foram removidos com sucesso' });
  }));

  app.post('/api/reset-all', rota(async (req, res) => {
    await alterarPedidos(p => { p.orders = []; });
    if (req.body?.clearProducts) await alterarCardapio(c => { c.products = []; });
    res.json({ success: true, message: 'Sistema zerado com sucesso' });
  }));

  app.get('/api/backup', rota(async (req, res) => {
    const c = await lerCardapio();
    const p = await lerPedidos();
    res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.json"`);
    res.json({ ...c, orders: p.orders });
  }));

  return app;
}
