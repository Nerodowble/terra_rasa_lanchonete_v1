/**
 * Ponto de entrada da API no Vercel.
 *
 * O nome [...path] faz este arquivo atender TUDO que comeca com /api/ -
 * /api/products, /api/orders, /api/health e assim por diante. O Express
 * de app.ts cuida do roteamento a partir dai.
 *
 * A carga do app e feita dentro do handler, com try/catch, de proposito:
 * se algo falhar ao importar, a resposta vira um JSON dizendo o que houve
 * em vez de um FUNCTION_INVOCATION_FAILED sem explicacao.
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

  return app!(req, res);
}
