/**
 * Ponto de entrada da API no Vercel.
 *
 * Todas as rotas /api/* chegam aqui por um rewrite do vercel.json, que manda
 * o caminho original no parametro __path. Antes de entregar ao Express, a
 * URL e remontada - assim o app.ts nao precisa saber que roda em serverless
 * e as mesmas rotas servem o desenvolvimento local.
 *
 * Por que nao usar api/[...path].ts: o catch-all por nome de arquivo nao e
 * reconhecido neste projeto (Vite, sem framework). Rotas de um segmento
 * chegavam, /api/orders/:id devolvia 404 do proprio Vercel.
 *
 * A carga do app acontece dentro do handler, com try/catch: se algo falhar
 * ao importar, a resposta vira um JSON explicando, em vez de um
 * FUNCTION_INVOCATION_FAILED sem diagnostico.
 */
type Handler = (req: any, res: any) => any;

let app: Handler | null = null;
let erroCarga: string | null = null;

export default async function handler(req: any, res: any) {
  if (!app && !erroCarga) {
    try {
      const mod = await import('../app.js');
      app = mod.criarApi() as unknown as Handler;
    } catch (err: any) {
      erroCarga = err?.stack || err?.message || String(err);
      console.error('Falha ao carregar a API:', err);
    }
  }

  if (erroCarga) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Falha ao carregar a API', detalhe: erroCarga }, null, 2));
  }

  // remonta a URL original a partir do __path que o rewrite injetou
  try {
    const u = new URL(req.url || '/', 'http://local');
    const caminho = u.searchParams.get('__path');
    if (caminho !== null) {
      u.searchParams.delete('__path');
      const query = u.searchParams.toString();
      req.url = '/api/' + caminho + (query ? '?' + query : '');
    }
  } catch {
    // se a URL vier estranha, deixa como esta e o Express responde 404
  }

  return app!(req, res);
}
