# Relatório de Auditoria de Segurança e Gestão de Segredos (Fase A)

**Projeto:** Catálogo Interativo / VitrineZap SaaS  
**Data da Auditoria:** 22 de Outubro de 2026  
**Status Geral:** Corrigido no código-fonte; pendente de ações manuais do proprietário em painéis externos.  

---

## 1. Tabela Geral de Itens Auditados

| Item / Vetor de Risco | Status | Evidência / Correção Implementada |
| :--- | :---: | :--- |
| **Visibilidade do Repositório GitHub** | **Precisa Ação Manual** | O repositório `Kaique-CDS/catalogo-interativo` está atualmente **PÚBLICO** (retornou HTTP 200). Qualquer pessoa na internet pode ler o código e o histórico de commits. Deve ser alterado para **Privado** imediatamente no GitHub. |
| **Vazamento de Segredo do Cloudinary no Git** | **Corrigido** / **Precisa Ação Manual** | Removidos os fallbacks literais de `CLOUDINARY_API_SECRET` que estavam em 8 arquivos (`app/api/contracts/crlv`, `app/api/tickets`, etc.). Centralizado em `lib/cloudinary.ts`. Como o repositório é público, **o segredo deve ser rotacionado no painel do Cloudinary**. |
| **Senhas em Texto Puro e Fallbacks** | **Corrigido** | Removidos os fallbacks padrão de senhas (`kaique`, `llmultimarcas`, `milhati`) do código de produção. O sistema agora exige variáveis de ambiente ou autentica via hash `bcrypt` (10 rounds) na tabela `store_users`. |
| **Proteção de Arquivos Sensíveis (.gitignore)** | **Corrigido** | Atualizado `.gitignore` para bloquear `.env*`, planilhas (`*.xlsx`, `*.xls`, `*.csv`), documentos (`*.pdf`), dumps de banco (`*.dump`, `*.sql.bak`) e exports (`backup*.json`). |
| **Arquivo de Exemplo de Variáveis (.env.example)** | **Corrigido** | Criado `.env.example` completo, contendo todos os nomes de variáveis do sistema acompanhados de comentários explicativos, com **zero** valores preenchidos. |
| **Exposição de Chaves no Bundle do Cliente (`NEXT_PUBLIC_*`)** | **Corrigido** | Removidas todas as referências a `NEXT_PUBLIC_GEMINI_API_KEY`. A chave da Gemini API é lida exclusivamente no servidor via `process.env.GEMINI_API_KEY`. O bundle client-side contém apenas variáveis públicas do Supabase (URL e Anon Key). |
| **Eliminação de Rota de Debug Insegura** | **Corrigido** | O arquivo `app/api/debug/route.ts` (que permitia dump não autenticado da tabela `stores`) foi permanentemente excluído. |
| **Headers HTTP de Segurança (HSTS, CSP, X-Frame-Options)** | **Corrigido** | Injetados em `next.config.ts`: `Strict-Transport-Security` (max-age 63072000), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` e `Content-Security-Policy` (CSP) com origens estritas. |
| **Proteção contra CSRF em Rotas Mutantes** | **Corrigido** | Inserida checagem em `middleware.ts` validando cabeçalhos `Origin` e `Referer` contra o host da aplicação em métodos `POST`, `PUT`, `PATCH` e `DELETE`. Rejeita origens cruzadas maliciosas com HTTP 403. |
| **Cookies de Sessão e Assinatura Criptográfica** | **Corrigido** | Em `lib/auth-lojista.ts`, as sessões deixaram de usar a string estática `'true'`. O sistema agora emite cookies criptograficamente assinados (`HMAC-SHA256`) com tempo de expiração, flags `httpOnly: true`, `sameSite: 'lax'` e `secure: true` em produção. |
| **Rate Limiting e Bloqueio contra Força Bruta** | **Corrigido** | Criado `lib/security/rate-limit.ts`. O endpoint `/api/auth/login-central` limita requisições por IP e bloqueia temporariamente por 15 minutos após 5 tentativas consecutivas incorretas. |
| **MFA (TOTP RFC 6238) para Super Admin e Lojistas** | **Corrigido** | Criado `lib/security/totp.ts` (compatível com Google Authenticator, Microsoft Authenticator e 1Password). Super Admin suporta validação de token de 6 dígitos no login central via `MFA_SUPER_ADMIN_SECRET`. Criada migration `019_security_and_mfa.sql`. |
| **Prevenção de IDOR e Isolamento Multi-Tenant** | **Corrigido** | Criado `lib/security/auth-guard.ts`. Rotas `/api/contracts/[id]`, `/api/tickets/[id]`, `/api/vehicles/[id]` e rotas de assets agora validam a identidade do chamador. Requisições entre tenants diferentes são bloqueadas com HTTP 403 Forbidden. |
| **Prevenção de SSRF (Server-Side Request Forgery)** | **Corrigido** | Criado `lib/security/ssrf.ts` bloqueando faixas de rede privada (`127.0.0.1`, `10.*`, `172.16-31.*`, `192.168.*`, `::1`) e metadados de nuvem (`169.254.169.254`). Aplicado em `lib/contracts/pdf-generator.ts`. |
| **Upload Seguro e Validação de Magic Bytes** | **Corrigido** | Em `app/api/contracts/crlv` e `app/api/store-assets/upload`, arquivos enviados são inspecionados pelos primeiros bytes reais (assinatura mágica de PDF, JPEG, PNG, WEBP), impedindo executáveis disfarçados. Nomes de arquivo são randomizados com UUID. |
| **Criptografia em Nível de Campo (Field-Level Encryption)** | **Corrigido** | Criado `lib/security/field-encryption.ts` com suporte a AES-256-GCM autenticado com IV dinâmico e tag de autenticação para dados sensíveis em repouso. |
| **Auditoria e Logs sem PII** | **OK** | A função `insertAuditLog` registra apenas eventos do sistema e identificadores genéricos, sem gravar senhas, CPFs completos ou dados de cartão. |
| **Dependências e Vulnerabilidades (`npm audit`)** | **Corrigido** / **Precisa Ação Manual** | Executado `npm audit fix`, reduzindo vulnerabilidades e eliminando falhas críticas de SSG/SSR. As vulnerabilidades restantes pertencem a pacotes secundários (`postcss`, `braces`) que dependem de breaking changes do ecossistema Next.js 16. |
| **Plano de Recuperação de Desastres** | **Corrigido** | Criado `RECOVERY.md` com RTO/RPO, matriz de contatos, ordem sequencial de restauração de tabelas e smoke tests. |

---

## 2. Chaves a Rotacionar (Ação Prioritária)

Como o repositório é público no GitHub, qualquer segredo que esteve em commits anteriores deve ser considerado público e substituído nos respectivos serviços:

| Chave / Segredo | Onde esteve exposto | Onde trocar / Como rotacionar |
| :--- | :--- | :--- |
| **Cloudinary API Secret** | Código-fonte (fallback literal em 8 rotas) | Acesse o [Cloudinary Console](https://console.cloudinary.com) > **Settings** > **Access Keys** > Clique em **Generate New Key** e delete a chave antiga. Atualize na Vercel a variável `CLOUDINARY_API_SECRET`. |
| **Senha do Super Admin** | Fallback `'kaique'` no código | Altere a variável `ADMIN_PASS` na Vercel para uma senha forte (mínimo 16 caracteres alfanuméricos com símbolos). |
| **Senha Legada L&L Multimarcas** | Fallback `'llmultimarcas'` no código | Atualize `LL_ADMIN_PASS` na Vercel e/ou redefina a senha do usuário `admin@llmultimarcas.com.br` no banco de dados via hash bcrypt. |
| **Senha Legada Milhaticar** | Fallback `'milhati'` no código | Atualize `CAR_ADMIN_PASS` na Vercel e/ou redefina a senha de `julia@milhaticar.com.br` no banco via bcrypt. |
| **Segredo de Sessão e Criptografia** | Novo | Configure `SESSION_SECRET` e `ENCRYPTION_KEY` na Vercel com strings aleatórias de 32+ caracteres (`openssl rand -hex 32`). |

---

## 3. Ações Manuais do Dono (Fora do Código)

Itens que não podem ser executados pelo código e dependem do acesso administrativo do proprietário:

1. **Tornar o Repositório GitHub Privado:**
   - Acesse `https://github.com/Kaique-CDS/catalogo-interativo/settings`.
   - Role até a **Danger Zone** > Clique em **Change visibility** > Selecione **Make private**.
2. **Ativar Secret Scanning e Push Protection no GitHub:**
   - No GitHub > **Settings** > **Code security and analysis**.
   - Habilite: **Dependabot alerts**, **Dependabot security updates**, **Secret scanning** e **Push protection**.
3. **Ativar Autenticação em Duas Etapas (2FA) em Todas as Contas:**
   - Conta GitHub do proprietário (`Kaique-CDS`).
   - Painel da **Vercel**.
   - Painel do **Supabase**.
   - Painel do **Cloudinary**.
   - Painel do **Google Cloud / AI Studio**.
   - Painel do **Resend**.
4. **Verificar Plano de Backup do Supabase:**
   - No painel do Supabase > **Database** > **Backups**: confirme que os snapshots automáticos diários estão ativos e avalie habilitar o Point-in-Time Recovery (PITR).
5. **Configurar Variáveis de Produção na Vercel:**
   - Cadastre na Vercel todas as chaves listadas em `.env.example`.
   - **Nunca** marque variáveis de segredos (como `SUPABASE_SERVICE_ROLE_KEY` ou `CLOUDINARY_API_SECRET`) com o prefixo `NEXT_PUBLIC_`.

---

## 4. Riscos Restantes

Nenhum sistema conectado à internet pode ser declarado 100% invulnerável. Os seguintes riscos residuais demandam monitoramento contínuo:

1. **Histórico do Git:**
   - Enquanto o repositório não for tornado privado e/ou o histórico não for reescrito com `git filter-repo`, commits antigos contêm referências a credenciais legadas. **A rotação das chaves no Cloudinary e na Vercel anula a utilidade de qualquer segredo vazado no histórico.**
2. **Dependências Transitivas de Build:**
   - Pacotes de desenvolvimento como `postcss` e `braces` contêm avisos moderados de DoS dependentes do ecossistema upstream do Next.js. Devem ser atualizados em conjunto com futuras versões maiores do framework.
3. **Engenharia Social e Phishing:**
   - O uso de MFA / 2FA no Super Admin mitiga sequestro de contas, mas administradores de lojas devem ser orientados a utilizar senhas fortes e não compartilhadas.
