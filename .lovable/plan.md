

# Plano: Remover chatbot interno do Flow-Appoint e integrar o Builder-Flow-API (TalkMap) como módulo embutido

## Resumo da análise do Builder-Flow-API

Boa notícia: **o builder-flow-api JÁ FOI projetado pra esse cenário**. Ele tem:

1. **`EmbedContext`** com modos `standalone` e `embedded` — esconde header, perfil, billing, signup, etc. quando embutido.
2. **Contrato JWT (HS256)** documentado em `docs/embed-contract.md` — o host (no caso, Flow-Appoint, identificado como "bookingfy") emite um JWT com `tenantId`, `userId`, `slug`, `plan` e injeta no iframe via `#embed_token=...&host=bookingfy`.
3. **PostMessage handshake** (`talkmap:embed:ready`, `talkmap:embed:init`, `talkmap:embed:logout`) pra atualizar sessão dinamicamente.
4. **DB de duas camadas**: o builder usa SEMPRE o `SYSTEM DB` próprio dele para auth/profiles/bots; opcionalmente um `CLIENT DB` (BYO) salvo via UI em Configs → Integrações.
5. **Roteamento `HashRouter`** — todas as rotas internas vivem após `#/`, o que torna o embed por iframe trivial: o path do host é totalmente independente do path interno do builder.

---

## Resposta direta à sua pergunta

> "Como o builder-flow-api é embutido, ele perde a URL base e passa a usar o path do flow-appoint? É possível?"

**Sim, mas não da forma que você imaginou.** Você **não consegue** servir os arquivos do builder-flow-api a partir do mesmo bundle do Flow-Appoint sem fundir os dois projetos (são apps Vite separados, com `package.json`, `node_modules`, builds próprios e mecanismos de auth diferentes — fundir geraria conflitos enormes de dependências e quebraria a premissa de "vender separado").

A forma correta — e que **o próprio builder já suporta** — é embutir via **`<iframe>`** apontando pro domínio dele (`talkbuilder.lovable.app` hoje, `app.talkmap.com.br` em produção), e dentro do iframe ele **se comporta como se fosse parte do Flow-Appoint** (sem header/perfil/billing próprios, recebendo identidade via JWT). Pro usuário final, parece nativo: ele fica dentro do layout do Flow-Appoint, sidebar do Flow-Appoint à esquerda, e o conteúdo central é o builder. **A "URL base" some visualmente** porque o iframe não mostra barra de endereço; o que o usuário vê na barra é sempre `flowappoint.com/{slug}/admin/chatbot/...`.

Isso é exatamente o padrão usado por Stripe Connect, Intercom Inbox embutido, Typeform embed, etc. É a única forma viável de manter os dois produtos vendáveis separadamente sem duplicar código.

---

## Arquitetura final

```
┌──────────────────────────────────────────────────────┐
│  Flow-Appoint  (flowappoint.com/{slug}/admin/...)   │
│  ┌────────────┬───────────────────────────────────┐ │
│  │            │                                    │ │
│  │ Sidebar do │   /admin/chatbot/integracao  ←── página própria │
│  │ Flow-      │   /admin/chatbot/talkmap     ←── iframe builder │
│  │ Appoint    │   ┌─────────────────────────────┐ │ │
│  │            │   │  <iframe                    │ │ │
│  │ • Dashboard│   │   src="talkbuilder.lovable. │ │ │
│  │ • Agenda…  │   │       app/#/embed           │ │ │
│  │ • Chatbot ▾│   │       #embed_token=eyJ...   │ │ │
│  │   ├ Integ. │   │       &host=bookingfy"      │ │ │
│  │   └ TalkMap│   │  />                         │ │ │
│  └────────────┴───┴─────────────────────────────┘ │ │
└──────────────────────────────────────────────────────┘
```

---

## Etapa 1 — Remoção do chatbot interno do Flow-Appoint

Remover do projeto Flow-Appoint **todo** o construtor antigo (não excluo nada agora — só listo, com sua aprovação eu apago):

**Componentes (`src/components/chatbot/`):**
- `ButtonEdge.tsx`, `ButtonGroupNodeItem.tsx`, `CanvasEditor.tsx`, `ChatWidget.tsx`, `ConditionNodeItem.tsx`, `ContainerNode.tsx`, `ImportExportDialog.tsx`, `LinkModal.tsx`, `NodeConfigDialog.tsx`, `NodeItem.tsx`, `NodesSidebar.tsx`, `PublishDialog.tsx`, `TestPanel.tsx`, `TiptapEditor.tsx`, `VariableModal.tsx`, `BotSettingsDialog.tsx`
- `nodesConfigs/` inteira (Bubbles, Flow, Inputs, Logic)
- `tiptap/VariableExtension.ts`

**Páginas:**
- `src/pages/business/ChatbotBuilder.tsx`
- `src/pages/business/ChatbotEditor.tsx`
- `src/pages/business/ChatbotList.tsx`
- `src/pages/company/ChatbotPublicPage.tsx`

**Edge Functions:**
- `supabase/functions/chatbot-runtime/`
- `supabase/functions/chatbot-webhook/`
- Entradas em `supabase/config.toml`

**Tipos & contextos:**
- `src/types/chatbot.ts`
- `src/contexts/VariablesContext.tsx`

**Tabelas (mantidas no banco por enquanto, mas não usadas pelo Flow-Appoint):**
- `chatbot_flows` e `chatbot_sessions` ficam intocadas — quando o builder estiver conectado via API key, ele vai gravar lá, não no banco dele. Mais sobre isso na Etapa 4.

**Rotas removidas em `App.tsx`** e dependências TipTap/ReactFlow do `package.json`.

---

## Etapa 2 — Submenu "Chatbot" na sidebar

Editar `src/components/business/BusinessSidebar.tsx` pra transformar o item "Chatbot" em grupo expansível com dois subitens:

```
Chatbot ▾
  ├─ Integração   → /{slug}/admin/chatbot/integracao
  └─ TalkMap      → /{slug}/admin/chatbot/talkmap
```

Implementação: usar `Collapsible` do shadcn (já está em `src/components/ui/collapsible.tsx`) dentro do `SidebarMenuItem`. O ícone Bot fica no pai; subitens recebem ícones `Plug` (Integração) e `Workflow` (TalkMap).

---

## Etapa 3 — Página `/admin/chatbot/integracao`

Nova página `src/pages/business/chatbot/Integracao.tsx`. Funcionalidade:

1. **Card "Status da conexão"** — mostra se o builder está conectado (verde) ou não (amarelo).
2. **Card "Chave de API do TalkMap"**:
   - Input pra colar a API key gerada no builder-flow-api standalone.
   - Botão "Conectar" → valida a key chamando um endpoint do builder e salva.
   - Botão "Desconectar" → remove a key.
3. **Card "Como obter sua chave"** — instruções passo-a-passo (acesse talkbuilder.lovable.app → Workspace → Configs → API Keys → Gerar).
4. **Card "Plano"** — exibe se o plano atual do Flow-Appoint inclui o módulo TalkMap (gating por `subscription_plans.features.chatbot`).

**Persistência da API key:**

Nova tabela no banco do Flow-Appoint:

```sql
CREATE TABLE chatbot_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  api_key_encrypted text NOT NULL,
  builder_workspace_slug text,
  builder_user_id text,
  connected_at timestamptz DEFAULT now(),
  last_validated_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE chatbot_integration ENABLE ROW LEVEL SECURITY;
-- policy: empresa só lê/edita a sua
```

A key bruta nunca é exposta no frontend após salvar — só prefixo (`tmk_xxxx…`).

**Edge Function nova `chatbot-integration`** (Flow-Appoint):
- `POST /validate` — recebe API key, chama o builder pra validar, retorna metadados.
- `POST /save` — salva a key cifrada (usa `pgcrypto`).
- `DELETE /disconnect` — revoga.
- `POST /sign-embed-token` — gera o JWT HS256 (assinado com `EMBED_SHARED_SECRET`) toda vez que o usuário entra na aba TalkMap. Esse endpoint **é o único** que toca a key bruta no servidor.

Secret necessário no Flow-Appoint: `EMBED_SHARED_SECRET` (mesmo valor configurado no builder-flow-api).

---

## Etapa 4 — Página `/admin/chatbot/talkmap` (iframe embutido)

Nova página `src/pages/business/chatbot/TalkMap.tsx`:

1. Verifica se a integração está ativa em `chatbot_integration`. Se não, redireciona pra aba Integração com aviso.
2. Chama `chatbot-integration/sign-embed-token` pra obter um JWT de 5 min com claims:
   ```json
   {
     "iss": "bookingfy",
     "aud": "talkmap",
     "sub": user.id,
     "tenantId": company.id,
     "userId": user.id,
     "slug": company.slug,
     "plan": "pro",
     "exp": now + 300
   }
   ```
3. Renderiza:
   ```tsx
   <iframe
     src={`https://talkbuilder.lovable.app/#/embed#embed_token=${jwt}&host=bookingfy`}
     className="w-full h-[calc(100vh-4rem)] border-0"
     allow="clipboard-read; clipboard-write"
   />
   ```
4. Setup `window.addEventListener('message')` pra:
   - Reenviar `talkmap:embed:init` quando o JWT estiver perto de expirar (renova a cada 4 min).
   - Tratar `talkmap:embed:resize` se o builder pedir altura dinâmica.
   - Tratar `talkmap:embed:navigate` pra atualizar breadcrumb se quiser (opcional).
5. Quando o usuário sai da aba (logout do Flow-Appoint), envia `talkmap:embed:logout` antes de descarregar.

**Nada de URL composta**. O iframe roda no domínio do builder; o path interno (`/teste02/workspace/bot/...`) fica encapsulado no hash e invisível na barra de endereço do navegador, que continua mostrando `flowappoint.com/{slug}/admin/chatbot/talkmap`.

---

## Etapa 5 — Compartilhamento de banco de dados (opcional, recomendado depois)

Hoje o builder usa o `SYSTEM DB` próprio (`fwoescubnnagdvwasbjl.supabase.co`). Opções pra "passar a usar o banco do Flow-Appoint":

**Opção A (mais simples, recomendada agora):** mantém o builder gravando no DB dele. O Flow-Appoint só consome via API (chamadas REST ao builder usando a API key) quando precisar listar bots, sessões, métricas. Vantagem: zero mudança no builder. Desvantagem: dois bancos.

**Opção B (longo prazo):** usar o mecanismo BYO (`saveClientSupabaseConfig`) já existente. Quando a integração é ativada no Flow-Appoint, o builder recebe via JWT um claim extra `byoSupabase: { url, anonKey }` e passa a gravar no Supabase do Flow-Appoint. Requer:
- Adicionar leitura desse claim no `EmbedContext` do builder.
- Replicar as tabelas do builder (`flows`, `folders`, `bot_sessions`, `api_keys`, `variables`, etc.) no banco do Flow-Appoint via migration.
- Configurar RLS pra escopar tudo por `tenant_id = company.id`.

**Recomendação:** Etapa 5 fica como Fase 2 do projeto. Começamos com Opção A pra colocar tudo funcionando, depois migramos pra B se quiser unificação total.

---

## Etapa 6 — Gating por plano

Em `subscription_plans.features` (JSONB já existe), adicionar:
```json
{ "chatbot": true, "chatbot_bots_limit": 5 }
```

Hook `usePlanFeatures(companyId)` retorna `{ chatbot: boolean, ... }`. Sidebar esconde o grupo Chatbot quando `chatbot !== true`. Páginas mostram tela "Faça upgrade" quando acessadas direto via URL sem permissão.

---

## Arquivos a criar

| Arquivo | Função |
|---|---|
| `src/pages/business/chatbot/Integracao.tsx` | UI de configuração da API key |
| `src/pages/business/chatbot/TalkMap.tsx` | Wrapper do iframe |
| `src/components/business/chatbot/ApiKeyForm.tsx` | Form de input/validação |
| `src/components/business/chatbot/IntegrationStatusCard.tsx` | Card de status |
| `src/hooks/use-chatbot-integration.tsx` | Hook que lê/escreve `chatbot_integration` |
| `src/hooks/use-plan-features.tsx` | Gating de features por plano |
| `src/lib/embedToken.ts` | Helper para chamar `sign-embed-token` |
| `supabase/functions/chatbot-integration/index.ts` | validate/save/disconnect/sign-embed-token |

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/components/business/BusinessSidebar.tsx` | Item Chatbot vira `Collapsible` com 2 subitens |
| `src/App.tsx` | Adicionar rotas `/admin/chatbot/integracao` e `/admin/chatbot/talkmap`; remover rotas antigas |
| `src/integrations/supabase/types.ts` | Auto-gerado após migration |
| `supabase/config.toml` | Registrar `chatbot-integration` com `verify_jwt = false` |

## Migration SQL

```sql
CREATE TABLE chatbot_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  api_key_encrypted text NOT NULL,
  api_key_prefix text NOT NULL,
  builder_workspace_slug text,
  builder_user_id text,
  connected_at timestamptz DEFAULT now(),
  last_validated_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE chatbot_integration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage own" ON chatbot_integration
  FOR ALL USING (true);

UPDATE subscription_plans
  SET features = features || '{"chatbot": true}'::jsonb
  WHERE features IS NOT NULL;
```

## Secrets necessários

- `EMBED_SHARED_SECRET` (Flow-Appoint Edge Functions) — mesmo valor que estará no builder-flow-api.
- `TALKMAP_BUILDER_URL` — `https://talkbuilder.lovable.app` (ou `app.talkmap.com.br` em produção). Pode ficar como variável pública `VITE_TALKMAP_BUILDER_URL`.

---

## Mudanças NECESSÁRIAS no builder-flow-api (projeto separado)

Pra fechar a integração, esses ajustes precisam ser feitos lá no `builder-flow-api`:

1. **Rota `/embed`** que monta o app sem header/sidebar próprias (já tem o `EmbedContext` pronto, falta criar a rota dedicada).
2. **Edge Function `validate-api-key`** — aceita uma API key e retorna `{ valid: true, slug, userId, plan }`.
3. **Edge Function de emissão/rotação de API keys** dentro de Configs → API Keys.
4. **Adicionar `https://flowappoint.lovable.app`** e domínio de produção do Flow-Appoint na lista `allowedOrigins` do `EmbedContext`.
5. **Validar JWT no servidor** usando `EMBED_SHARED_SECRET` antes de criar sessão Supabase.

Esses ajustes não fazem parte deste projeto — vou listar pra você executar lá depois.

---

## Ordem de execução sugerida

1. Migration `chatbot_integration` + flag em `subscription_plans.features`.
2. Edge Function `chatbot-integration` (validate/save/disconnect/sign-embed-token).
3. Submenu Chatbot na sidebar (Integração / TalkMap).
4. Página Integração (formulário de API key).
5. Página TalkMap (iframe + handshake).
6. Hook de gating por plano.
7. Remoção do chatbot interno antigo (componentes, páginas, edge functions, tabelas opcionais).
8. Limpeza de dependências do `package.json` (TipTap, ReactFlow se não usados em outro lugar).

Aprova esse plano? Posso ajustar qualquer ponto antes de começar — em especial: (a) se prefere começar pela remoção do chatbot antigo ou pela integração nova primeiro; (b) se quer Opção A ou B do compartilhamento de banco já no MVP.

