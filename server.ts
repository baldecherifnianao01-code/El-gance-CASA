import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { app, attachApiFallbacks } from './server/app.ts';

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  attachApiFallbacks();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ÉLÉGANCE CASA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
