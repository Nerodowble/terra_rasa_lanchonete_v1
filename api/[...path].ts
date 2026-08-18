/**
 * Ponto de entrada da API no Vercel.
 *
 * O nome [...path] faz este arquivo atender TUDO que comeca com /api/ -
 * /api/products, /api/orders, /api/health e assim por diante. O Express
 * de app.ts cuida do roteamento a partir dai.
 */
import { criarApi } from '../app';

export default criarApi();
