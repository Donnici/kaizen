# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

Always use **pnpm**. This is a pnpm monorepo with workspaces defined in `pnpm-workspace.yaml`.

## Project Structure

Kaizen is a super app — a platform to manage multiple aspects of the user's life. It is organized as a monorepo:

- `apps/api` — NestJS REST API (the main backend)
- `packages/` — shared libraries (future)

## API — NestJS

The API follows the [NestJS documentation conventions](https://docs.nestjs.com) and **DDD (Domain-Driven Design)** for module organization. Each business domain lives in its own module under `apps/api/src/<domain>/` with the following structure:

```
src/
  <domain>/
    application/      # use cases / application services
    domain/           # entities, value objects, domain services, repository interfaces
    infrastructure/   # repository implementations, ORM mappings, external services
    presentation/     # controllers, DTOs, request/response mappers
    <domain>.module.ts
```

The first module being developed is the **financial module**.

## Pacote `@kaizen/utils`

`packages/utils` exporta os tipos e utilitários compartilhados entre todas as aplicações do monorepo. Importe sempre de `@kaizen/utils` — nunca recrie enums ou tipos que já existam lá.

Conteúdo atual:
- `AppModule` enum — módulos de negócio disponíveis
- `AppFeature` enum — features dentro de cada módulo (formato `<modulo>:<acao>`)
- `RequestUser` type — union `AnonymousUser | AuthenticatedUser` que representa o usuário em toda request

## Permissionamento

Toda request possui um `RequestUser` injetado pelo `AuthGuard` global:
- **Sem token** → `AnonymousUser` com `features: [AppFeature.AUTH_SIGN_UP]`
- **Com token válido** → `AuthenticatedUser` com `modules[]` e `features[]` do banco
- **Token inválido** → `401`

Use `@CurrentUser()` nos controllers para acessar o usuário da request.

## Validação de body

Use `ZodValidationPipe` com um schema Zod por endpoint. Em caso de falha lança `BodyValidationError` (422) e emite `Logger.debug` com o payload e os erros.

**Importante:** NestJS usa `reflect-metadata` para injeção de dependência — nunca use `import type` para classes injetáveis (`@Injectable`, `@Controller`, etc.). A regra `useImportType` do Biome está desativada por esse motivo.

## Linting & Formatting

Biome is the single tool for linting and formatting (no ESLint, no Prettier). Configuration is at the root `biome.json` and applies to all workspaces.

```bash
# From apps/api or any workspace
pnpm lint          # biome check --write .
pnpm format        # biome format --write .

# From monorepo root
pnpm biome check --write apps/api
```

## Common Commands (apps/api)

```bash
pnpm start:dev     # start with hot reload
pnpm build         # compile to dist/
pnpm test          # run unit tests (Jest)
pnpm test:watch    # run tests in watch mode
pnpm test:cov      # run tests with coverage
pnpm test:e2e      # run e2e tests
```

Run a single test file:
```bash
pnpm test -- --testPathPattern=<filename>
```

## Database

MongoDB via Mongoose. Connection URI is read from the `MONGODB_URI` env var, configured in `AppModule` through `ConfigModule` + `MongooseModule.forRootAsync`. Copy `apps/api/.env.example` to `apps/api/.env` for local development outside Docker.

## Docker (local development)

The `Dockerfile` at the monorepo root builds the API for production. `docker-compose.yml` spins up both the API and MongoDB:

```bash
# Build and start API + MongoDB
docker compose up --build

# MongoDB only (run API locally with hot reload)
docker compose up mongodb
```

API will be available at `http://localhost:3000`. MongoDB at `mongodb://localhost:27017/kaizen`.

## TDD Workflow

All implementation **must** follow TDD in this order:

1. **Empty test scenarios** — create `*.spec.ts` with `it('should ...', () => {})` stubs
2. **Test body with mocks** — implement test logic using mocks/stubs so tests pass in isolation
3. **Concrete implementation** — implement the real code to make all tests pass

Tests are the stability contract. Never skip or delete tests to make builds pass.
