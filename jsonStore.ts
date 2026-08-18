/**
 * Banco de dados em JSON, com dois modos de armazenamento.
 *
 *   LOCAL  (seu PC)   -> grava em data/db.json e data/photos/
 *   BLOB   (Vercel)   -> grava no Vercel Blob, que e o "disco" do Vercel
 *
 * Ele escolhe sozinho: se existir a variavel BLOB_READ_WRITE_TOKEN (o Vercel
 * injeta automaticamente quando voce cria um Blob Store), usa Blob. Senao,
 * usa arquivo. O resto do sistema nao sabe a diferenca.
 *
 * O banco e dividido em dois arquivos de proposito:
 *   db.json      -> cardapio, categorias e config (muda pouco, so o admin mexe)
 *   orders.json  -> pedidos (muda o tempo todo, gravado sozinho)
 * Assim um pedido novo nunca sobrescreve uma alteracao no cardapio.
 */
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------- tipos
export interface PhotoMeta {
  id: string;
  filename: string;
  mimeType: string;
  size: number;            // tamanho ja comprimido
  createdAt: string;
  caminho?: string;         // chave dentro do Blob (modo blob)
  url?: string;             // legado: fotos gravadas antes do store virar privado
  tamanhoOriginal?: number; // quanto tinha antes de comprimir
}

export interface Cardapio {
  version: string;
  updatedAt: string;
  config: Record<string, any>;
  categories: any[];
  products: any[];
  photos: PhotoMeta[];
}

export interface Pedidos {
  updatedAt: string;
  orders: any[];
}

// ------------------------------------------------------------ ambiente
const TOKEN_BLOB = process.env.BLOB_READ_WRITE_TOKEN;
export const MODO: 'blob' | 'local' = TOKEN_BLOB ? 'blob' : 'local';

/**
 * Pasta dos arquivos dentro do Blob. Como o store e PRIVADO, ler exige token -
 * o prefixo aqui e so organizacao, nao seguranca.
 */
const PREFIXO = process.env.BLOB_PREFIX || 'terrarasa-dados';

/**
 * Tudo privado: o store do Vercel e configurado como Private e nao aceita
 * gravar blob publico dentro dele. As fotos, entao, nao tem URL direta -
 * quem serve e a rota /api/photos/:id, que le com o token e devolve os bytes.
 * O navegador do cliente cacheia por um ano, entao isso custa uma leitura so.
 */
const ACESSO_DADOS = 'private' as const;
const ACESSO_FOTOS = 'private' as const;
const CHAVE_CARDAPIO = `${PREFIXO}/db.json`;
const CHAVE_PEDIDOS = `${PREFIXO}/orders.json`;

const DATA_DIR = path.join(process.cwd(), 'data');
const ARQ_CARDAPIO = path.join(DATA_DIR, 'db.json');
const ARQ_PEDIDOS = path.join(DATA_DIR, 'orders.json');
const DIR_FOTOS = path.join(DATA_DIR, 'photos');
const ARQ_SEED = path.join(DATA_DIR, 'seed.json');

const EXT_POR_MIME: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png',
  'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg',
};

function cardapioVazio(): Cardapio {
  return { version: '3.0.0', updatedAt: new Date().toISOString(), config: {}, categories: [], products: [], photos: [] };
}

// ------------------------------------------------------- camada de I/O
async function lerJson<T>(chave: string, arquivo: string): Promise<T | null> {
  if (MODO === 'blob') {
    const { get } = await import('@vercel/blob');
    try {
      // useCache: false garante que dois pedidos seguidos nao leiam versao velha do CDN
      const r = await get(chave, { access: ACESSO_DADOS, token: TOKEN_BLOB, useCache: false });
      if (!r || !r.stream) return null;
      const texto = await new Response(r.stream as any).text();
      return JSON.parse(texto) as T;
    } catch {
      return null; // ainda nao existe
    }
  }
  if (!fs.existsSync(arquivo)) return null;
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf-8')) as T;
  } catch {
    const bkp = `${arquivo}.corrompido-${Date.now()}`;
    fs.renameSync(arquivo, bkp);
    console.error(`⚠️  ${path.basename(arquivo)} ilegível. Guardei como ${path.basename(bkp)}.`);
    return null;
  }
}

async function gravarJson(chave: string, arquivo: string, dados: any): Promise<void> {
  const texto = JSON.stringify(dados, null, 2);
  if (MODO === 'blob') {
    const { put } = await import('@vercel/blob');
    await put(chave, texto, {
      access: ACESSO_DADOS,
      token: TOKEN_BLOB,
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    return;
  }
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${arquivo}.tmp`;
    fs.writeFileSync(tmp, texto, 'utf-8');
    fs.renameSync(tmp, arquivo); // troca atomica: nunca fica um json pela metade
  } catch (err: any) {
    // Em hospedagem serverless o disco e somente leitura. Sem Blob configurado,
    // o site continua de pe mostrando o cardapio - so nao guarda alteracao.
    if (['EROFS', 'EACCES', 'EPERM'].includes(err?.code)) {
      if (!avisouSomenteLeitura) {
        avisouSomenteLeitura = true;
        console.warn(
          '⚠️  Disco somente leitura e nenhum Blob configurado. O site funciona, ' +
          'mas pedidos e alterações NÃO serão salvos. Crie um Blob Store no Vercel.',
        );
      }
      return;
    }
    throw err;
  }
}

let avisouSomenteLeitura = false;

// ------------------------------------------------------------ cardapio
export async function lerCardapio(): Promise<Cardapio> {
  const salvo = await lerJson<Cardapio>(CHAVE_CARDAPIO, ARQ_CARDAPIO);
  if (salvo) return { ...cardapioVazio(), ...salvo };

  // primeira execucao: nasce do seed.json que vive no repositorio
  if (fs.existsSync(ARQ_SEED)) {
    const seed = { ...cardapioVazio(), ...JSON.parse(fs.readFileSync(ARQ_SEED, 'utf-8')) };
    delete (seed as any).orders;
    await gravarCardapio(seed);
    console.log(`🌱 Cardápio criado do seed.json: ${seed.products.length} produtos`);
    return seed;
  }
  const vazio = cardapioVazio();
  await gravarCardapio(vazio);
  return vazio;
}

export async function gravarCardapio(c: Cardapio): Promise<void> {
  c.updatedAt = new Date().toISOString();
  await gravarJson(CHAVE_CARDAPIO, ARQ_CARDAPIO, c);
}

/** Le, deixa voce alterar e grava. Sempre relendo antes, para nao perder alteracao. */
export async function alterarCardapio(fn: (c: Cardapio) => void): Promise<Cardapio> {
  const c = await lerCardapio();
  fn(c);
  await gravarCardapio(c);
  return c;
}

// ------------------------------------------------------------- pedidos
export async function lerPedidos(): Promise<Pedidos> {
  const salvo = await lerJson<Pedidos>(CHAVE_PEDIDOS, ARQ_PEDIDOS);
  return salvo || { updatedAt: new Date().toISOString(), orders: [] };
}

export async function alterarPedidos(fn: (p: Pedidos) => void): Promise<Pedidos> {
  const p = await lerPedidos();
  fn(p);
  p.updatedAt = new Date().toISOString();
  await gravarJson(CHAVE_PEDIDOS, ARQ_PEDIDOS, p);
  return p;
}

// --------------------------------------------------------------- fotos

/** Tamanho maximo da foto no cardapio. Acima disso ninguem ve diferenca no celular. */
const LARGURA_MAX = 1200;
const ALTURA_MAX = 1200;
const QUALIDADE = 80;

/**
 * Reduz e converte a foto para WebP.
 *
 * Uma foto de celular tem 2 a 5 MB; depois disso fica em 80 a 200 KB, sem
 * diferenca visivel numa tela de telefone. Se der qualquer problema, devolve
 * a imagem original - comprimir nunca pode impedir o upload de funcionar.
 */
async function comprimir(
  buffer: Buffer,
  mimeType: string,
): Promise<{ buffer: Buffer; mimeType: string; comprimida: boolean }> {
  if (mimeType === 'image/svg+xml' || !mimeType.startsWith('image/')) {
    return { buffer, mimeType, comprimida: false };
  }
  try {
    const sharp = (await import('sharp')).default;
    const otimizada = await sharp(buffer, { failOn: 'none' })
      .rotate() // respeita a orientacao da camera do celular
      .resize({ width: LARGURA_MAX, height: ALTURA_MAX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALIDADE })
      .toBuffer();

    // se por algum motivo ficar maior, fica com a original
    if (otimizada.length >= buffer.length) return { buffer, mimeType, comprimida: false };

    const antes = (buffer.length / 1048576).toFixed(2);
    const depois = (otimizada.length / 1024).toFixed(0);
    console.log(`🖼️  Foto comprimida: ${antes} MB → ${depois} KB (-${Math.round((1 - otimizada.length / buffer.length) * 100)}%)`);
    return { buffer: otimizada, mimeType: 'image/webp', comprimida: true };
  } catch (err) {
    console.warn('Não consegui comprimir a imagem, guardando original:', err);
    return { buffer, mimeType, comprimida: false };
  }
}

export async function salvarFoto(original: Buffer, mimeOriginal: string, filename: string): Promise<PhotoMeta> {
  const r = await comprimir(original, mimeOriginal);
  const buffer = r.buffer;
  const mimeType = r.mimeType;

  const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const ext = EXT_POR_MIME[mimeType] || '.bin';
  const meta: PhotoMeta = {
    id,
    filename: filename || 'upload' + ext,
    mimeType,
    size: buffer.length,
    createdAt: new Date().toISOString(),
    tamanhoOriginal: original.length,
  };

  if (MODO === 'blob') {
    const { put } = await import('@vercel/blob');
    meta.caminho = `${PREFIXO}/photos/${id}${ext}`;
    await put(meta.caminho, buffer, {
      access: ACESSO_FOTOS, token: TOKEN_BLOB, contentType: mimeType,
      addRandomSuffix: false, allowOverwrite: true,
    });
  } else {
    fs.mkdirSync(DIR_FOTOS, { recursive: true });
    fs.writeFileSync(path.join(DIR_FOTOS, id + ext), buffer);
  }

  await alterarCardapio(c => { c.photos.push(meta); });
  return meta;
}

export async function lerFoto(id: string): Promise<{ meta: PhotoMeta; buffer: Buffer } | null> {
  const c = await lerCardapio();
  const meta = c.photos.find(p => p.id === id);
  if (!meta) return null;

  if (MODO === 'blob') {
    const { get } = await import('@vercel/blob');
    const caminho = meta.caminho || `${PREFIXO}/photos/${id}${EXT_POR_MIME[meta.mimeType] || '.bin'}`;
    try {
      const r = await get(caminho, { access: ACESSO_FOTOS, token: TOKEN_BLOB });
      if (!r || !r.stream) return null;
      const ab = await new Response(r.stream as any).arrayBuffer();
      return { meta, buffer: Buffer.from(ab) };
    } catch {
      return null;
    }
  }

  const arq = path.join(DIR_FOTOS, id + (EXT_POR_MIME[meta.mimeType] || '.bin'));
  return fs.existsSync(arq) ? { meta, buffer: fs.readFileSync(arq) } : null;
}

export const INFO = {
  modo: MODO,
  destino: MODO === 'blob' ? `Vercel Blob (${PREFIXO}/)` : DATA_DIR,
};
