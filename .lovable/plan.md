

# Plano de Implementacao - API Standalone do Construtor de Chatbot

## Resumo Executivo

Este plano detalha as implementacoes necessarias para transformar o construtor de chatbot atual em uma API standalone completa, similar ao Typebot. O objetivo e criar uma camada de autenticacao por tokens (API Keys) independente do Supabase Auth, organizar os endpoints RESTful e preparar a estrutura para venda separada do modulo.

---

## O Que Ja Existe (Nao Sera Modificado)

A base do sistema ja esta funcional:
- Edge Function `chatbot-runtime` com endpoints `/start`, `/start-public`, `/start-preview`, `/message`, `GET /session/:id`, `DELETE /session/:id`
- Edge Function `chatbot-webhook` para triggers externos
- Tabelas `chatbot_flows` e `chatbot_sessions` com estrutura JSON completa
- Processamento de fluxo com condicoes, variaveis, HTTP requests, e todos os tipos de nodes
- Sistema de publicacao (draft vs published)

---

## Fase 1: Sistema de API Keys e Autenticacao por Token

### 1.1 Nova Tabela `chatbot_api_keys`

Armazenara os tokens de autenticacao para uso da API:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Identificador unico |
| company_id | uuid | Empresa dona da chave |
| key_type | text | "workspace" (integracao) ou "public" (venda avulsa) |
| api_key | text | Token gerado (hash) |
| key_prefix | text | Prefixo visivel (ex: "cbk_live_xxxx") |
| name | text | Nome descritivo da chave |
| permissions | jsonb | Permissoes granulares |
| rate_limit | integer | Requisicoes por minuto |
| last_used_at | timestamp | Ultima utilizacao |
| expires_at | timestamp | Data de expiracao (opcional) |
| is_active | boolean | Status ativo/inativo |
| created_at | timestamp | Data de criacao |

### 1.2 Funcao de Geracao de API Keys

Nova Edge Function `chatbot-api-keys` com endpoints:
- `POST /generate` - Gera nova chave
- `GET /list` - Lista chaves da empresa
- `DELETE /:key_id` - Revoga uma chave
- `POST /:key_id/regenerate` - Regenera uma chave

Formato do token: `cbk_{tipo}_{random32chars}`
- `cbk_ws_...` = Workspace Token (integracao com agendamento)
- `cbk_pub_...` = Public API Token (venda avulsa)

---

## Fase 2: Middleware de Autenticacao na API

### 2.1 Atualizacao do `chatbot-runtime`

Adicionar camada de autenticacao por API Key como alternativa ao fluxo atual:

```
// Metodos de autenticacao aceitos:
1. Header: X-API-Key: cbk_ws_xxxxx
2. Header: Authorization: Bearer cbk_pub_xxxxx  
3. Fluxo atual (Supabase Auth) - mantido para retrocompatibilidade
```

### 2.2 Validacao de Permissoes

Cada requisicao verificara:
- Token valido e ativo
- Token nao expirado
- Empresa associada existe
- Permissoes suficientes para a operacao
- Rate limit nao excedido

### 2.3 Logging de Uso

Registrar em nova tabela `chatbot_api_usage`:
- Requisicoes por token
- Endpoints acessados
- Tempo de resposta
- Erros

---

## Fase 3: Endpoints RESTful Organizados

### 3.1 Reorganizacao de Rotas

Nova estrutura da API:

```
/api/v1/bots
  GET    /           - Lista todos os bots da empresa
  POST   /           - Cria novo bot
  GET    /:botId     - Detalhes de um bot
  PUT    /:botId     - Atualiza bot (containers, edges, settings)
  DELETE /:botId     - Remove bot
  POST   /:botId/publish    - Publica versao
  POST   /:botId/unpublish  - Despublica
  POST   /:botId/duplicate  - Duplica bot
  GET    /:botId/export     - Exporta JSON
  POST   /:botId/import     - Importa JSON

/api/v1/sessions
  POST   /start             - Inicia sessao (por flow_id)
  POST   /start-public      - Inicia sessao (por public_id)
  POST   /start-preview     - Inicia preview
  POST   /:sessionId/message - Envia mensagem
  GET    /:sessionId        - Estado da sessao
  DELETE /:sessionId        - Encerra sessao

/api/v1/webhooks
  POST   /:path             - Trigger de webhook (mantido)

/api/v1/keys
  GET    /                  - Lista API keys
  POST   /                  - Gera nova key
  DELETE /:keyId            - Revoga key

/api/v1/usage
  GET    /stats             - Estatisticas de uso
  GET    /logs              - Logs de requisicoes
```

### 3.2 Nova Edge Function `chatbot-api`

Funcao unificada que roteia para os handlers corretos baseado no path. Isso mantem a organizacao e permite versionamento futuro (`/api/v2/...`).

---

## Fase 4: Interface de Configuracao de Tokens

### 4.1 Novo Componente `ApiKeysManager.tsx`

Sera adicionado nas configuracoes do workspace:
- Lista de chaves existentes (mostrando apenas prefixo)
- Botao para gerar nova chave
- Opcoes de permissoes ao criar
- Botao para revogar chaves
- Copia do token (mostrado apenas uma vez apos criacao)

### 4.2 Integracao no Header do Editor

Adicionar nas configuracoes do bot:
- Secao "Integracao API"
- Token do workspace (copiavel)
- Instrucoes de uso
- Link para documentacao

---

## Fase 5: Preparacao para Integracao Externa

### 5.1 SDK JavaScript (Frontend)

Criar arquivo exportavel `chatbot-sdk.js`:

```javascript
// Uso no sistema de agendamento ou qualquer frontend
import { ChatbotClient } from '@seuapp/chatbot-sdk';

const client = new ChatbotClient({
  apiKey: 'cbk_ws_xxxxx',
  baseUrl: 'https://api.seudominio.com'
});

// Iniciar sessao
const session = await client.startSession({ botId: 'xxx' });

// Enviar mensagem
const response = await client.sendMessage(session.id, 'Ola!');

// Usar com React
<ChatbotWidget 
  apiKey="cbk_ws_xxxxx"
  botId="xxx"
  theme={{ primaryColor: '#3b82f6' }}
/>
```

### 5.2 Documentacao da API

Criar pagina de documentacao com:
- Autenticacao
- Endpoints disponiveis
- Exemplos de requisicoes
- Codigos de erro
- Rate limits

---

## Fase 6: Controle de Features por Plano (Integracao Agendamento)

### 6.1 Verificacao de Plano

No sistema de agendamento, ao acessar menu Chatbot:
1. Verificar `subscription_plans.features` da empresa
2. Se `features.chatbot === true`, carregar modulo
3. Se nao, mostrar tela de upgrade

### 6.2 Campo na Tabela `subscription_plans`

Adicionar no JSONB `features`:
```json
{
  "chatbot": true,
  "chatbot_bots_limit": 5,
  "chatbot_sessions_month": 1000,
  "chatbot_custom_domain": false
}
```

---

## Arquivos a Serem Criados

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/chatbot-api/index.ts` | Edge Function unificada da API |
| `supabase/functions/chatbot-api-keys/index.ts` | Gerenciamento de API Keys |
| `src/components/chatbot/ApiKeysManager.tsx` | UI para gerenciar tokens |
| `src/components/chatbot/IntegrationSettings.tsx` | Configuracoes de integracao |
| `src/lib/chatbot-sdk/index.ts` | SDK JavaScript exportavel |
| `src/lib/chatbot-sdk/client.ts` | Cliente HTTP do SDK |
| `src/lib/chatbot-sdk/widget.tsx` | Widget React do SDK |

## Arquivos a Serem Modificados

| Arquivo | Modificacao |
|---------|-------------|
| `supabase/functions/chatbot-runtime/index.ts` | Adicionar middleware de API Key |
| `supabase/functions/chatbot-webhook/index.ts` | Adicionar autenticacao por token |
| `src/components/chatbot/BotSettingsDialog.tsx` | Adicionar aba de integracao |
| `src/pages/business/ChatbotList.tsx` | Adicionar link para API Keys |

---

## Migracao de Banco de Dados

```sql
-- Tabela de API Keys
CREATE TABLE chatbot_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('workspace', 'public')),
  api_key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '{"read": true, "write": true, "execute": true}'::jsonb,
  rate_limit INTEGER DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Uso da API
CREATE TABLE chatbot_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES chatbot_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX idx_api_keys_company ON chatbot_api_keys(company_id);
CREATE INDEX idx_api_keys_prefix ON chatbot_api_keys(key_prefix);
CREATE INDEX idx_api_usage_key ON chatbot_api_usage(api_key_id);
CREATE INDEX idx_api_usage_created ON chatbot_api_usage(created_at);

-- RLS
ALTER TABLE chatbot_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_api_usage ENABLE ROW LEVEL SECURITY;
```

---

## Fluxo de Autenticacao

```text
+------------------+     +-------------------+     +------------------+
|   Requisicao     |---->|   Middleware      |---->|   Processar      |
|   com Token      |     |   de Auth         |     |   Fluxo          |
+------------------+     +-------------------+     +------------------+
                               |
                               v
                    +-------------------+
                    | 1. Extrair token  |
                    | 2. Hash e busca   |
                    | 3. Validar status |
                    | 4. Check rate     |
                    | 5. Log uso        |
                    +-------------------+
```

---

## Estimativa de Implementacao

| Fase | Descricao | Complexidade |
|------|-----------|--------------|
| Fase 1 | Sistema de API Keys | Media |
| Fase 2 | Middleware de Auth | Media |
| Fase 3 | Endpoints RESTful | Alta |
| Fase 4 | Interface de Tokens | Baixa |
| Fase 5 | SDK JavaScript | Media |
| Fase 6 | Controle por Plano | Baixa |

---

## Beneficios Apos Implementacao

1. **Venda Separada**: O construtor pode ser vendido como SaaS independente
2. **Integracao Facil**: Qualquer sistema pode usar via API Key
3. **Escalabilidade**: Rate limiting e monitoramento de uso
4. **Seguranca**: Tokens podem ser revogados a qualquer momento
5. **Flexibilidade**: Diferentes niveis de permissao por token

