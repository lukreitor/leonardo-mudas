# Leonardo Consultoria

App Expo para consultoria de mudas de mangueira. Organiza visitas semanais a fazendas, captura anotações livres (fotos/vídeos/áudios/texto), gerencia pagamentos (visita/mensal/comissão) e mantém histórico completo por ano.

## Stack

- Expo SDK 54 / React Native / TypeScript
- Expo Router (file-based)
- `expo-sqlite` + **Drizzle ORM** (DB local + migrations)
- `expo-local-authentication` (Face ID / digital)
- `expo-secure-store` (creds)
- `expo-camera`, `expo-image-picker`, `expo-av` (mídia)
- **NativeWind v4** + **Reanimated 3** (UI + animations)
- **date-fns** (ISO weeks)
- **Zustand** (state)

## Design System: Mango Grove

| Token | Hex | Uso |
|-------|-----|-----|
| Verde mata | `#1A3A2E` | BG dark, headlines |
| Verde broto | `#4A7C59` | Botões secundários, success |
| Manga madura | `#E8A04C` | CTA principal |
| Casca | `#7BA05B` | Progress, acentos |
| Papel kraft | `#F5F0E6` | BG light |
| Carvão noite | `#0E1B14` | BG dark |
| Branco neblina | `#FAFAF7` | Cards light |

Tipografia: **Fraunces** (display) + **Inter** (UI).

Mockup HTML aprovado em `C:\Users\auxlu\OneDrive\Documentos\LeonardoMudas\mockups\index.html` (6 telas).

## Arquitetura

Repository Pattern: UI → Service → Repository → SQLite. Permite swap pra HTTP remoto no futuro sem refactor de UI. Tabela `sync_queue` já no schema MVP.

```
app/              # Expo Router screens
  (tabs)/         # 4 tabs: Semana, Fazendas, Financeiro, Perfil
  farm/[id]       # Detalhe da fazenda
  record          # Gravar visita full-screen
components/       # Componentes atomicos
db/
  schema.ts       # Drizzle schema
  seeds/          # 18 fazendas pre-cadastradas
  migrations/     # Migrations versionadas
repositories/     # Acesso ao DB (swappable)
services/         # Logica de negocio
lib/              # Helpers (date, contracts)
theme/            # Design tokens
```

## Funcionalidades core

- **Home**: marcar visitada (tap), pular semana (long press), contador dinâmico
- **Detalhe**: anotações livres (mix de mídia), calendário heatmap ano, semanas recentes
- **Financeiro**: dashboard mensal, lista por fazenda, auto-pending de visita/mensal, registro manual de comissão, alerta de atraso
- **Backup**: export `.sqlite` + media zip preserva tudo entre versões

## Setup

```bash
npm install
npx expo start
```

## Persistência crítica

- Drizzle migrations versionadas
- Backup automático antes de migration breaking
- ISO 8601 timestamps no DB (anos futuros funcionam)
- Soft-delete em fazendas (preserva histórico)
- Pagamentos congelam valor no momento (mudar % não recalcula passado)

## Cadastro mínimo

Único campo obrigatório: **nome**. Tudo o resto opcional.

## Fases

1. **MVP** (3-4 sem): Auth + seed + home com gestos + detalhe + anotações + heatmap
2. Exportar + delete multi-step + polish
3. Financeiro completo
4. Mapa + auto-sugestão localização
5. Backend Node/Postgres + sync multi-device
6. Transcrição IA + resumo semanal
