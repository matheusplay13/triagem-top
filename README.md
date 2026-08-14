# Sem Espera — Sistema Inteligente de Triagem e Fila

> # ⚠️ ATENÇÃO: ESTE PROJETO É APENAS UM PROTÓTIPO!
> **Este sistema está em fase de validação e desenvolvimento inicial. Funcionalidades, arquitetura e fluxo de telas podem (e vão) sofrer grandes mudanças a qualquer momento. Não o utilize ainda em ambientes de produção.**

---

## O que o sistema faz?

O **Sem Espera** é uma solução de saúde pensada para otimizar e humanizar a chegada de pacientes em unidades de pronto atendimento. O sistema elimina as filas de recepção permitindo que o paciente inicie sua jornada antes mesmo de chegar ao hospital.

O fluxo é dividido em três áreas principais:

1. **Autoatendimento do Paciente (Home):**
   - O paciente acessa o aplicativo no próprio celular (a caminho da unidade).
   - Responde a um questionário amigável sobre seus sintomas, intensidade da dor e sinais clínicos críticos (falta de ar, dor no peito, etc).
   - O sistema calcula automaticamente a prioridade (Alta, Média ou Baixa) e gera uma **Senha Digital** com orientações imediatas.

2. **Telão de Chamada (`/queue`):**
   - Painel público para ser exibido em TVs na sala de espera do hospital.
   - Mostra, ao vivo, as senhas chamadas e a fila ordenada por prioridade (os casos graves furam a fila automaticamente).

3. **Painel da Equipe Médica (`/dashboard`):**
   - Área restrita protegida por login exclusivo para médicos e recepcionistas.
   - Permite visualizar quem está a caminho, realizar a chamada das próximas senhas nos consultórios e analisar métricas de atendimento (tempo de espera, histórico e volumetria).

---

## Tecnologias Utilizadas

A stack foi escolhida com foco em alta performance, componentização e segurança de tipos de ponta a ponta:

- **React 19**: Biblioteca UI base do ecossistema.
- **TypeScript**: Para tipagem rigorosa e prevenção de falhas de código.
- **TanStack Start**: Framework Full-Stack moderno para SSR e Server Functions.
- **TanStack Router**: Roteamento 100% type-safe baseado em arquivos (File-based routing).
- **TanStack Query (React Query v5)**: Gerenciamento assíncrono do estado global.
- **Tailwind CSS v4**: Motor de estilização avançado (utility-first).
- **Vite 7**: Servidor de desenvolvimento e bundler extremamente veloz.
- **Lucide React**: Biblioteca moderna de ícones SVG.

---

## Como rodar o projeto localmente

Você precisará ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

```sh
# Clone o repositório
git clone <url-do-repositorio>

# Entre na pasta
cd triagem-top

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:5173` no seu navegador para ver o sistema rodando. Para acessar a área restrita dos médicos, digite a URL oculta `http://localhost:5173/login`.
