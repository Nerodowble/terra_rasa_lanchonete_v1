/**
 * Servidor local (npm run dev).
 * No Vercel quem responde e api/[...path].ts - este arquivo nem sobe.
 */
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { criarApi } from './app';
import { INFO } from './jsonStore';

async function iniciar() {
  const app = criarApi();
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor em http://localhost:${PORT}`);
    console.log(`📄 Banco: ${INFO.modo.toUpperCase()} → ${INFO.destino}`);
  });
}

iniciar().catch(err => {
  console.error('Falha fatal ao iniciar servidor:', err);
  process.exit(1);
});
