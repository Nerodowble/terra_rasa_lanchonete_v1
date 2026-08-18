/**
 * Autenticacao do painel administrativo.
 *
 * A senha vive em variavel de ambiente, NUNCA no codigo - o repositorio e
 * publico e o pacote do front vai inteiro para o navegador do visitante.
 *
 * Como funciona:
 *   1. O navegador manda usuario e senha para POST /api/login
 *   2. O servidor confere e devolve um token assinado (HMAC-SHA256)
 *   3. O navegador guarda o token e o envia em Authorization: Bearer <token>
 *   4. As rotas de administracao conferem a assinatura antes de executar
 *
 * O token e assinado, nao criptografado: da para ler o que tem dentro, mas
 * nao da para forjar sem o segredo. E o que basta aqui - dentro so tem o
 * nome de usuario e a data de expiracao.
 */
import crypto from 'crypto';

const USUARIO = process.env.ADMIN_USER || 'admin';
const SENHA = process.env.ADMIN_PASSWORD || '';
const SEGREDO = process.env.ADMIN_SECRET || '';
const VALIDADE_HORAS = 12;

/** Sem senha configurada o painel fica trancado, em vez de aberto. */
export const AUTH_CONFIGURADA = SENHA.length > 0 && SEGREDO.length > 0;

function assinar(dados: string): string {
  return crypto.createHmac('sha256', SEGREDO).update(dados).digest('base64url');
}

/** Comparacao que leva o mesmo tempo com qualquer entrada, para nao vazar a senha pelo relogio. */
function iguais(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // ainda assim compara, para o tempo nao denunciar o tamanho
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

export function conferirSenha(usuario: string, senha: string): boolean {
  if (!AUTH_CONFIGURADA) return false;
  const u = iguais((usuario || '').trim().toLowerCase(), USUARIO.trim().toLowerCase());
  const s = iguais((senha || '').trim(), SENHA.trim());
  return u && s;
}

export function criarToken(usuario: string): string {
  const corpo = JSON.stringify({
    u: usuario.trim().toLowerCase(),
    exp: Date.now() + VALIDADE_HORAS * 3600_000,
  });
  const dados = Buffer.from(corpo).toString('base64url');
  return `${dados}.${assinar(dados)}`;
}

export function tokenValido(token?: string | null): boolean {
  if (!AUTH_CONFIGURADA || !token) return false;
  const [dados, assinatura] = token.split('.');
  if (!dados || !assinatura) return false;
  if (!iguais(assinatura, assinar(dados))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(dados, 'base64url').toString());
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

/** Middleware do Express: barra quem nao tem token valido. */
export function exigirAdmin(req: any, res: any, next: any) {
  if (!AUTH_CONFIGURADA) {
    return res.status(503).json({
      error: 'Painel administrativo não configurado',
      detalhe: 'Defina ADMIN_USER, ADMIN_PASSWORD e ADMIN_SECRET nas variáveis de ambiente.',
    });
  }
  const cabecalho = String(req.headers?.authorization || '');
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  if (!tokenValido(token)) {
    return res.status(401).json({ error: 'Não autorizado', detalhe: 'Faça login novamente.' });
  }
  next();
}

export const INFO_AUTH = {
  configurada: AUTH_CONFIGURADA,
  usuario: AUTH_CONFIGURADA ? USUARIO : null,
  validadeHoras: VALIDADE_HORAS,
};
