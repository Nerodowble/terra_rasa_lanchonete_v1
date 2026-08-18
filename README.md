# Terra Rasa Lanchonete

Sistema de lanchonete completo: cardápio digital para o cliente, carrinho, painel
administrativo com tela de cozinha (KDS), gestão de pedidos, delivery, mesas e
relatórios.

> **Status: projeto de teste.** Está no ar e funcional, rodando no plano gratuito
> do Vercel. A intenção é validar a operação e depois migrar para servidor próprio
> pago — o código já está preparado para isso, ver [Migração](#migração).

**No ar:** https://terra-rasa-lanchonete-v1.vercel.app

---

## Índice

1. [Começando](#começando)
2. [Como o sistema funciona](#como-o-sistema-funciona)
3. [Estrutura de arquivos](#estrutura-de-arquivos)
4. [O banco de dados](#o-banco-de-dados)
5. [Autenticação](#autenticação)
6. [Rotas da API](#rotas-da-api)
7. [Imagens](#imagens)
8. [Variáveis de ambiente](#variáveis-de-ambiente)
9. [Deploy no Vercel](#deploy-no-vercel)
10. [Migração para servidor próprio](#migração)
11. [Limites e pontos de atenção](#limites-e-pontos-de-atenção)
12. [Problemas conhecidos e soluções](#problemas-conhecidos-e-soluções)
13. [Melhorias sugeridas](#melhorias-sugeridas)

---

## Começando

Requisitos: **Node.js 22+** (testado na v22.16.0).

```bash
npm install
npm run dev
```

Abre em **http://localhost:3000**. Não precisa de banco de dados, chave de API
nem variável de ambiente: os dados vão para `data/db.json` e as fotos para
`data/photos/`, ambos criados sozinhos na primeira execução.

Para entrar no painel administrativo localmente, defina as variáveis antes de
subir o servidor (ver [Autenticação](#autenticação)).

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Build do front (usado pelo Vercel) → `dist/` |
| `npm run build:node` | Build do front **e** do servidor → `dist/server.cjs` |
| `npm start` | Roda o build de produção como servidor Node comum |
| `npm run lint` | Checagem de tipos do TypeScript |

---

## Como o sistema funciona

### As duas faces do app

O mesmo endereço serve dois públicos, alternados pelo `viewMode` no contexto:

- **Cliente** — vê o cardápio, monta o carrinho, escolhe mesa/entrega/balcão,
  finaliza o pedido e acompanha o preparo
- **Administrador** — precisa de login; acessa KDS, pedidos, cardápio, mesas,
  delivery, relatórios e configurações

### O caminho de um pedido

```
Cliente monta o carrinho
        ↓
POST /api/orders           (rota pública: o cliente precisa poder pedir)
        ↓
Gravado em orders.json     (arquivo local ou Vercel Blob)
        ↓
Aparece no KDS da cozinha
        ↓
PATCH /api/orders/:id      (rota protegida: só o admin muda status)
        ↓
recebido → preparando → pronto → despachado → entregue
```

### Front e back

O **front** é React 19 + Vite 6 + Tailwind 4. Todo o estado vive num contexto
único, `src/context/ComandaContext.tsx` — carrinho, pedidos, mesas, config,
autenticação. Ele busca os dados da API ao carregar e mantém uma cópia no
`localStorage` como reserva.

O **back** é Express, com as rotas definidas num arquivo só: `app.ts`. Esse
arquivo é usado por dois pontos de entrada diferentes:

| Onde roda | Entrada | O que faz |
|---|---|---|
| Seu PC | `server.ts` | Express + Vite em middleware, escutando na porta 3000 |
| Vercel | `api/index.ts` | Mesmo Express, como função serverless |

Essa separação é o que torna a migração barata: sair do Vercel não exige
reescrever rota nenhuma.

---

## Estrutura de arquivos

```
├── api/
│   └── index.ts           Entrada da API no Vercel (função serverless)
├── src/
│   ├── components/
│   │   ├── admin/         11 telas do painel (KDS, pedidos, cardápio, mesas...)
│   │   ├── client/        9 telas do cliente (cardápio, carrinho, pedido...)
│   │   └── common/        Login e alternador de visão
│   ├── context/
│   │   └── ComandaContext.tsx    Todo o estado do app
│   ├── data/
│   │   └── initialData.ts        Categorias e mesas padrão
│   ├── types/index.ts     Tipos compartilhados
│   └── utils/             Formatação (moeda, cupom térmico) e sons
├── data/
│   ├── seed.json          Cardápio inicial (vai para o Git)
│   ├── db.json            Banco em uso (NÃO vai para o Git)
│   ├── orders.json        Pedidos (NÃO vai para o Git)
│   └── photos/            Fotos enviadas (NÃO vai para o Git)
├── app.ts                 Todas as rotas da API
├── auth.ts                Login e proteção das rotas administrativas
├── jsonStore.ts           Armazenamento: arquivo local ou Vercel Blob
├── server.ts              Servidor local
└── vercel.json            Build e roteamento no Vercel
```

---

## O banco de dados

Não há banco de dados tradicional. Os dados vivem em **arquivos JSON**, o que
elimina a necessidade de provisionar e manter um servidor de banco.

### Dois arquivos, de propósito

| Arquivo | Contém | Muda quando |
|---|---|---|
| `db.json` | config, categorias, produtos, fotos | o admin mexe no cardápio |
| `orders.json` | pedidos | o tempo todo, sozinho |

Estão separados para que um pedido chegando **nunca sobrescreva** uma alteração
que você fez no cardápio no mesmo instante.

### Dois modos de gravação

O `jsonStore.ts` escolhe sozinho, pela presença da variável `BLOB_READ_WRITE_TOKEN`:

```
Sem a variável   →  arquivos em data/        (seu PC, servidor próprio)
Com a variável   →  Vercel Blob privado      (produção no Vercel)
```

O resto do sistema não sabe a diferença. É esse desenho que faz a migração ser
uma questão de *não definir* uma variável.

### Proteções

- **Gravação atômica** no modo arquivo: escreve num `.tmp` e só então renomeia.
  Falta de luz no meio não deixa um JSON pela metade.
- **Recuperação**: se o JSON estiver ilegível, ele é renomeado para
  `.corrompido-<data>` e o sistema começa limpo, em vez de derrubar o servidor.
- **Disco somente leitura**: em hospedagem serverless sem Blob configurado, o
  site continua servindo o cardápio; apenas avisa no log que não vai salvar.
- **Primeira execução**: se não existe banco, ele nasce do `data/seed.json`.

### Backup

`GET /api/backup` (requer login) devolve cardápio, config e pedidos num JSON
único. É o formato que a migração usa.

---

## Autenticação

A senha **não existe no código**. O repositório e o pacote que roda no navegador
não contêm credencial nenhuma.

### Como funciona

```
1. Navegador   →  POST /api/login {username, password}
2. Servidor    →  confere contra ADMIN_USER / ADMIN_PASSWORD
3. Servidor    →  devolve token assinado com HMAC-SHA256 (ADMIN_SECRET)
4. Navegador   →  guarda o token e envia em Authorization: Bearer <token>
5. Rotas admin →  conferem a assinatura antes de executar
```

O token é **assinado, não criptografado**: dá para ler o conteúdo (usuário e
validade), mas não dá para forjar sem o segredo. Validade de **12 horas**.

A comparação de senha é feita em tempo constante (`crypto.timingSafeEqual`),
para o tempo de resposta não revelar quantos caracteres estão certos.

### Sem configuração, tranca

Se `ADMIN_PASSWORD` ou `ADMIN_SECRET` não estiverem definidas, as rotas
administrativas devolvem **503**. Esquecer de configurar resulta em painel
trancado, nunca em painel aberto.

---

## Rotas da API

### Públicas — o cliente precisa delas

| Método | Rota | |
|---|---|---|
| `GET` | `/api/health` | Diagnóstico: modo do banco, contagens |
| `GET` | `/api/auth-status` | Diz se o painel está configurado |
| `POST` | `/api/login` | Devolve o token |
| `GET` | `/api/config` | Dados da loja |
| `GET` | `/api/categories` | Categorias do cardápio |
| `GET` | `/api/products` | Produtos |
| `GET` | `/api/photos/:id` | Serve uma foto |
| `GET` | `/api/orders` | Lista pedidos |
| `POST` | `/api/orders` | Cria pedido |

### Protegidas — exigem `Authorization: Bearer <token>`

| Método | Rota | |
|---|---|---|
| `POST` | `/api/config` | Salva config da loja |
| `POST` | `/api/categories` | Cria/edita categoria |
| `DELETE` | `/api/categories/:id` | Exclui categoria |
| `POST` | `/api/products` | Cria/edita produto |
| `DELETE` | `/api/products/:id` | Exclui produto |
| `POST` | `/api/upload` | Envia foto |
| `PATCH` | `/api/orders/:id` | Muda status/pagamento |
| `DELETE` | `/api/orders/:id` | Exclui pedido |
| `DELETE` | `/api/orders` | Limpa todos os pedidos |
| `POST` | `/api/reset-all` | Zera o sistema |
| `GET` | `/api/backup` | Baixa o banco inteiro |

> **Nota:** `GET /api/orders` é pública porque o cliente acompanha o próprio
> pedido. Isso significa que a lista de pedidos, com nome e telefone, é legível
> por quem souber a rota. Ver [Melhorias sugeridas](#melhorias-sugeridas).

---

## Imagens

Fotos enviadas pelo painel passam por **compressão no servidor**, com `sharp`:

| | |
|---|---|
| Redimensiona | máximo 1200×1200, mantendo proporção |
| Converte | WebP, qualidade 80 |
| Corrige rotação | respeita o EXIF da câmera |
| Nunca amplia | imagem menor passa sem ser esticada |

Na prática, uma foto de celular de 2,5 MB vira **cerca de 100 KB** — redução de
95% sem diferença visível numa tela de telefone.

**Três proteções:** se o `sharp` falhar, guarda o original; se o resultado ficar
maior que a entrada, descarta; SVG passa intacto.

As fotos são servidas por `/api/photos/:id` com `Cache-Control` de 1 ano e
`immutable`, então navegador e CDN guardam — cada imagem custa **uma leitura do
armazenamento por visitante**, não uma por exibição.

---

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `ADMIN_USER` | para usar o painel | Nome de usuário |
| `ADMIN_PASSWORD` | para usar o painel | Senha |
| `ADMIN_SECRET` | para usar o painel | Chave que assina o token. Use algo longo e aleatório |
| `BLOB_READ_WRITE_TOKEN` | só no Vercel | Criada sozinha ao conectar um Blob Store |
| `BLOB_PREFIX` | não | Pasta dos arquivos dentro do Blob |
| `PORT` | não | Porta do servidor (padrão 3000) |

Rodando localmente, nenhuma é obrigatória — só as três de `ADMIN_*` se quiser
abrir o painel.

---

## Deploy no Vercel

### Configuração do projeto

| Campo | Valor |
|---|---|
| Framework Preset | Vite |
| Root Directory | `./` |
| Build / Output / Install Command | **deixe desligados** — o `vercel.json` define |

### Passos

1. Importar o repositório
2. Adicionar as variáveis `ADMIN_USER`, `ADMIN_PASSWORD` e `ADMIN_SECRET`
3. **Deploy**
4. **Storage → Create Database → Blob**
   - Access: **Private**
   - ✅ marcar **"Add a read-write token env var to this connection"** — sem isso
     a variável `BLOB_READ_WRITE_TOKEN` não é criada e nada é salvo
5. Conectar ao projeto e **redeploy** (a variável só chega num deploy novo)

### Conferindo

Abra `/api/health`:

```json
{ "status": "ok", "engine": "JSON / blob", "produtos": 9 }
```

- `"JSON / blob"` → tudo certo
- `"JSON / local"` → o token do Blob não chegou; refaça o passo 4 e 5

### Repositório privado

Funciona normalmente. O Vercel acessa por um GitHub App autorizado, não por
acesso público. Tornar o repositório privado não quebra os deploys.

---

## Migração

O sistema foi construído para sair do Vercel sem reescrita. O `server.ts` é um
servidor Node comum e o `jsonStore.ts` volta a gravar em disco automaticamente
quando a variável do Blob não existe.

### Passo a passo

```bash
# 1. No Vercel, baixe os dados (precisa estar logado no painel)
#    GET /api/backup  →  salve o JSON

# 2. No servidor novo
git clone <repositorio> && cd terra_rasa_lanchonete_v1
npm install
npm run build:node

# 3. Restaure os dados
mkdir -p data
# db.json     ← cardápio, config, categorias e fotos do backup
# orders.json ← { "updatedAt": "...", "orders": [ ...pedidos do backup... ] }

# 4. Variáveis
export ADMIN_USER=...
export ADMIN_PASSWORD=...
export ADMIN_SECRET=...
export PORT=3000

# 5. Suba
npm start
```

### O que fazer além disso

- **Nginx na frente**, com HTTPS (Let's Encrypt)
- **PM2 ou systemd** para reiniciar sozinho se cair
- **Backup automático** de `data/` — é onde tudo vive agora
- **As fotos** precisam ser copiadas do Blob para `data/photos/`, ou reenviadas
  pelo painel

### Quando trocar o JSON por um banco

O JSON aguenta bem enquanto o volume for baixo. O sinal de que chegou a hora:
**gravar o arquivo inteiro a cada pedido** vira gargalo, e dois pedidos no mesmo
instante podem se atropelar (ver limites abaixo).

Na prática, isso aparece a partir de algumas centenas de pedidos por dia. A troca
mexe apenas no `jsonStore.ts` — as rotas e o front continuam iguais. SQLite num
servidor próprio, ou Postgres, resolvem.

---

## Limites e pontos de atenção

### Concorrência na escrita

Cada gravação lê o arquivo, altera e grava de volta. **Dois pedidos finalizados
na mesma fração de segundo podem se atropelar**, com um sobrescrevendo o outro.

Na escala de uma lanchonete começando é improvável. Deixa de ser aceitável quando
o volume subir — é o principal motivo para migrar para um banco de verdade.

### Limites do plano gratuito do Vercel

| Recurso | Limite |
|---|---|
| Blob — armazenamento | 1 GB |
| Blob — transferência | 10 GB/mês |
| Operações simples | 10 mil/mês |
| Operações avançadas | 2 mil/mês |

Com o cardápio ocupando ~6 KB e fotos de ~100 KB, o espaço não é problema. **O
limite de operações é o que aperta primeiro**: cada leitura de pedidos conta, e
o KDS consulta com frequência.

### Uso comercial

O plano Hobby do Vercel é destinado a projetos pessoais e não comerciais. Uma
lanchonete recebendo pedidos reais é uso comercial e pede o plano Pro. É uma das
razões da migração planejada.

### Pedidos são públicos para leitura

`GET /api/orders` não exige token, porque o cliente acompanha o próprio pedido
por ela. Quem souber a rota consegue listar todos os pedidos, com nome e telefone.
Ver a melhoria proposta abaixo.

---

## Problemas conhecidos e soluções

Registro dos problemas enfrentados no deploy — todos já corrigidos, mas o
diagnóstico pode servir se aparecerem de novo.

### `FUNCTION_INVOCATION_FAILED` em todas as rotas

**Causa:** o projeto é `"type": "module"`. Sob ESM do Node, imports relativos
exigem a extensão do arquivo. O `tsx` resolve sem ela no desenvolvimento; a
função serverless roda em Node puro e falha.

**Solução:** `import { criarApi } from '../app.js'` — com `.js`, mesmo apontando
para um `.ts`.

### Rotas com dois segmentos davam 404

`/api/health` funcionava, `/api/orders/:id` não.

**Causa:** o catch-all por nome de arquivo (`api/[...path].ts`) não é reconhecido
num projeto Vite sem framework.

**Solução:** `api/index.ts` mais um rewrite explícito no `vercel.json`, que manda
o caminho original no parâmetro `__path`. O handler remonta a URL antes de
entregar ao Express.

### `Cannot use public access on a private store`

**Causa:** um Blob Store configurado como Private não aceita gravar blob público
dentro dele. O modo vale para o store inteiro.

**Solução:** tudo privado, e as fotos passam a ser servidas por `/api/photos/:id`,
que lê com o token.

### `functions` do `vercel.json` sendo ignorado

**Causa:** colchete é curinga em glob, então a chave `"api/[...path].ts"` nunca
casava com o arquivo. `maxDuration` e `includeFiles` não eram aplicados.

**Solução:** nome de arquivo sem colchetes.

### Push negado com duas contas do GitHub

O Git guarda credencial **por site**, não por repositório — uma conta acaba
valendo para todos os repositórios do GitHub.

```bash
git config --global credential.https://github.com.useHttpPath true
```

Passa a guardar uma credencial por repositório. Se continuar falhando, apague a
credencial genérica:

```
cmdkey /delete:LegacyGeneric:target=git:https://github.com
```

---

## Melhorias sugeridas

Em ordem aproximada de valor.

### Segurança

- [ ] **Proteger `GET /api/orders`.** Hoje é pública e expõe nome e telefone dos
      clientes. O caminho: dar ao cliente um token curto do próprio pedido, e
      exigir login para listar todos.
- [ ] **Guardar a senha como hash** (bcrypt/argon2) em vez de comparar texto puro,
      caso as variáveis de ambiente vazem.
- [ ] **Limitar tentativas de login**, para dificultar força bruta.

### Operação

- [ ] **Backup automático** do banco, agendado, em vez de manual pela rota.
- [ ] **Reduzir a frequência de consulta do KDS** ou usar SSE/WebSocket, para
      economizar operações do Blob.
- [ ] **Registro de alterações** (quem mudou preço, quando) — útil quando mais de
      uma pessoa mexer no sistema.

### Produto

- [ ] **Botão de pedido pelo WhatsApp**, como alternativa ao fluxo completo.
- [ ] **Cupom de desconto** e programa de fidelidade.
- [ ] **Horário de funcionamento** com abertura e fechamento automáticos.
- [ ] **Múltiplas fotos por produto.**

### Técnico

- [ ] **Trocar o JSON por SQLite ou Postgres** quando o volume justificar.
- [ ] **Testes automatizados** das rotas — hoje a validação é manual.
- [ ] **Remover `@google/genai`** do `package.json`: está declarado mas não é
      usado em lugar nenhum do código.
- [ ] **Dividir o `ComandaContext`**, que passou de 1.200 linhas.

---

## Histórico técnico

| Commit | O que mudou |
|---|---|
| `8521d95` | Autenticação no servidor; senha sai do código |
| `54ccbe5` | Fotos privadas, servidas pela API |
| `03f10ac` | Correção do roteamento de `/api` no Vercel |
| `1825d11` | Correção do carregamento da função serverless |
| `abd992a` | Vercel Blob privado |
| `be02c3a` | Troca do SQLite por JSON; deploy no Vercel; compressão de imagem |
| `f59c8f0` | Estrutura inicial |
