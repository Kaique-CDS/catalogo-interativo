<div align="center">

# 🚀 VitrineZap SaaS — Catálogos Interativos Multi-Tenant

### *A plataforma SaaS de catálogos digitais com conversão direta para o WhatsApp — sem atrito, sem login do cliente e com altíssima taxa de fechamento.*

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

[Demonstração](#-visões-e-demonstrações) •
[Arquitetura](#-arquitetura--rotas-multi-tenant) •
[Tecnologias](#-stack-tecnológica) •
[Como Rodar](#-como-executar-o-projeto) •
[Armazenamento em Escala](#-estratégia-de-armazenamento-em-escala-cloudflare-r2)

</div>

---

## 💡 Sobre o Projeto

O **VitrineZap SaaS** resolve uma das maiores dores do comércio local e de prestadores de serviço: **a perda de clientes no processo de checkout tradicional**. 

Em vez de obrigar o visitante a criar conta, preencher cadastros infinitos ou usar carrinhos complexos, a vitrine é **100% otimizada para celular**. Quando o cliente se interessa por um item, ele clica em um botão e cai **diretamente no WhatsApp da loja com a mensagem pré-formatada**, contendo:
- Nome e modelo do produto
- Valor e especificações
- Foto de capa e dados de localização da loja

---

## 🏪 Visões e Demonstrações

O projeto já conta com módulos completos para **dois grandes nichos**:

### 🚗 1. Nicho Veículos / Concessionárias (`/[slug]`)
* **Vitrine Pública**: Cards de alta fidelidade com foto, marca, ano, quilometragem, preço e filtros avançados (marca, ano, faixa de preço e busca por texto).
* **Painel Admin do Lojista (`/[slug]/admin`)**: Mini-ERP com métricas de estoque, publicação/pausa de anúncios com 1 clique e edição de dados de contato.

### 🎂 2. Nicho Gastronomia / Confeitaria & Bolos (`/confeitaria`)
* **Vitrine Pública Afetiva**: Paleta acolhedora, filtros por categorias (*Bolos Festivos, Bento Cakes, Doces Finos, Sobremesas na Taça*), rendimento em fatias e aviso de prazo de encomenda.
* **Painel Admin do Ateliê (`/confeitaria/admin`)**: Acompanhamento de cliques no WhatsApp, gestão de cardápio com foto, rendimento e controle de produtos visíveis.

---

## 🧭 Arquitetura & Rotas Multi-Tenant

Tudo opera sob um único domínio, isolado por slugs e tenants:

```
app/
├── page.tsx                             # Landing page de apresentação do SaaS
├── confeitaria/                         # Vitrine Gastronomia / Confeitaria
│   ├── page.tsx
│   └── admin/                           # Painel Admin exclusivo da Confeitaria
│       ├── page.tsx                     # Dashboard com métricas de cliques
│       ├── produtos/page.tsx            # CRUD do Cardápio
│       ├── produtos/novo/page.tsx       # Cadastro de doces & bolos
│       └── configuracoes/page.tsx       # Configuração de WhatsApp & Loja
└── [slug]/                              # Vitrines Dinâmicas Multi-Tenant (Ex: /loja-exemplo)
    ├── page.tsx                         # Vitrine pública da loja
    ├── loading.tsx                      # Skeleton loading animado
    └── admin/                           # Painel Restrito do Lojista
        ├── layout.tsx                   # Auth Guard do Supabase
        ├── page.tsx                     # Dashboard do estoque
        ├── estoque/page.tsx             # Gerenciamento de veículos
        └── configuracoes/page.tsx       # Edição de WhatsApp, endereço e logo
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Renderização híbrida (SSR/SSG), performance máxima |
| **Linguagem** | TypeScript 5 | Tipagem estrita e segurança em tempo de compilação |
| **Estilização** | Tailwind CSS + shadcn/ui | UI limpa, moderna, responsiva e acessível |
| **Ícones** | Lucide React | Conjunto de ícones leves e consistentes |
| **Banco de Dados** | Supabase (PostgreSQL) | RLS (Row Level Security) nativo por `store_id` |
| **Autenticação** | Supabase Auth | Sessão segura via cookies HTTP-only (`@supabase/ssr`) |
| **Notificações** | Sonner | Toasts modernos e não invasivos |

---

## ☁️ Estratégia de Armazenamento em Escala (Cloudflare R2)

Para garantir **custo quase zero** no upload de dezenas de milhares de fotos de produtos em alta definição, a arquitetura foi desenhada para desacoplar o banco do storage:

```
[Cliente / Admin] 
       │ 
       ├── (1) Upload direto da foto ──► [ Cloudflare R2 ] (Zero Egress Fee)
       │                                        │
       └── (2) Salva apenas a URL pública ──────┴──► [ Supabase PostgreSQL ]
```

* **Zero Taxa de Saída (Egress = $0.00)**: visualizações ilimitadas sem susto no fim do mês.
* **10 GB gratuitos todos os meses** no Cloudflare R2.
* **CDN Global Integrada** para carregamento instantâneo em redes móveis 4G/5G.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ instalado
- Git configurado

### 1. Clonar o repositório
```bash
git clone https://github.com/Kaique-CDS/catalogo-interativo.git
cd catalogo-interativo
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (Opcional para modo Demo)
Copie o arquivo de exemplo:
```bash
cp .env.local.example .env.local
```
> *Obs: O projeto conta com um **Modo Demonstração Inteligente**. Se o `.env.local` não estiver configurado com o Supabase, as vitrines e os painéis admin abrem automaticamente com dados de demonstração interativos!*

### 4. Executar em desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

<div align="center">
  <sub>Desenvolvido com ❤️ por <strong>Kaique Corrêa</strong></sub>
</div>