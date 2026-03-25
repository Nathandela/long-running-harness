---
title: "TypeScript Full-Stack Type Safety"
date: 2026-03-25
summary: "A survey of end-to-end type safety in TypeScript ecosystems covering ORM type generation, tRPC, GraphQL codegen, runtime validation libraries, framework integration, and the architectural patterns for maintaining type coherence across the full stack."
keywords: [typescript, full-stack, type-safety, trpc, prisma, zod, graphql]
---

# TypeScript Full-Stack Type Safety

## Abstract

The TypeScript ecosystem has converged on a unifying ambition: types that flow continuously from database schema through API transport to user interface, such that a change at any layer produces compile-time errors at every dependent layer before code reaches production. This survey maps the landscape of tools, libraries, and architectural patterns that pursue this goal as of early 2026. We examine schema-first ORMs (Prisma, Drizzle, MikroORM), SQL-first query builders (Kysely, Slonik), RPC-style API layers (tRPC, oRPC), contract-first REST approaches (ts-rest, Zodios, OpenAPI codegen), GraphQL type generation pipelines (GraphQL Code Generator, Pothos, Relay compiler), runtime validation libraries (Zod, Valibot, ArkType, TypeBox, io-ts), meta-framework integration points (Next.js, Remix, Nuxt, SvelteKit), monorepo type-sharing strategies, form validation bridges, and database migration safety. We identify three fundamental mechanisms -- inference, generation, and contract sharing -- and analyze the trade-offs each imposes on developer experience, build complexity, interoperability, and runtime overhead. Open problems including cross-language boundaries, schema drift detection, and the absence of a unified type-propagation standard are discussed.

---

## 1. Introduction

TypeScript adoption among professional developers exceeded 69% in 2025 according to SlashData and JetBrains surveys, with Fortune 500 adoption surpassing 80% for web development teams [1]. The GitHub Octoverse 2025 report recorded 2.63 million active TypeScript contributors, growing 66% year-over-year -- the first time a typed superset overtook its parent language in contributor growth [2]. A Microsoft Research study analyzing over 600 TypeScript and JavaScript projects found that TypeScript codebases experienced 15% fewer production bugs per 1,000 lines of code [2].

This growth has been accompanied by a conceptual shift. Where TypeScript was initially adopted for editor autocompletion and refactoring safety within individual modules, the contemporary ambition is *full-stack type coherence*: a single change to a database column's type should propagate, at compile time, through ORM-generated types, API response shapes, client-side data hooks, and form validation schemas, producing errors wherever downstream code has not yet been updated.

The "full-stack TypeScript" movement is exemplified by opinionated stacks such as the T3 Stack (Next.js + tRPC + Prisma + NextAuth + Tailwind), Better-T-Stack (tRPC/oRPC + Drizzle + TanStack), and similar compositions that prioritize end-to-end type safety as a first-class architectural constraint [3][4]. These stacks demonstrate that type safety is no longer a per-module concern but a system-level property.

This survey catalogues the tools and patterns that enable this property, examines the mechanisms by which types cross layer boundaries, and identifies the remaining gaps.

---

## 2. Foundations

### 2.1 The Type Gap Problem

TypeScript's type system is *structural* and *erased*: types exist only at compile time and produce no runtime artifacts. This creates a fundamental tension at every system boundary -- network calls, database queries, file I/O, environment variables -- where data arrives as `unknown` and must be narrowed to a static type. The "type gap" is the space between what the compiler believes about data and what actually arrives at runtime.

Three mechanisms have emerged to bridge this gap:

1. **Inference**: Types are derived automatically from source definitions. The compiler traces type information from server-side function signatures to client-side call sites without intermediate artifacts. tRPC is the canonical example.

2. **Generation**: A build step reads a schema (Prisma schema, OpenAPI spec, GraphQL SDL) and emits TypeScript declaration files. The generated types are then imported by application code. Prisma Client, GraphQL Code Generator, and openapi-typescript exemplify this approach.

3. **Contract sharing**: A shared TypeScript module defines the API contract (routes, input/output shapes), and both client and server implementations are typed against it. ts-rest and Zodios operate on this model.

Each mechanism imposes different trade-offs on build complexity, staleness risk, runtime overhead, and cross-language interoperability.

### 2.2 Compile-Time vs. Runtime Validation

A type annotation like `data: User` provides no runtime guarantee. If an API returns `{ name: 42 }` where `string` was expected, the compiler is silent; the error manifests as a downstream `TypeError` or corrupted UI. Runtime validation libraries (Section 4.4) address this by parsing untrusted data against schemas that *also* produce static types, unifying the compile-time and runtime dimensions of type safety.

### 2.3 Standard Schema

In January 2025, the creators of Zod, Valibot, and ArkType jointly released the Standard Schema specification (v1.0), a 58-line TypeScript interface that standardizes the provision and consumption of validation functionality [5]. The `~standard` property exposes a `validate` method, type inference helpers, and a stable versioned contract. By reducing the adapter problem from N*M relationships (N libraries x M consumers) to N+M, Standard Schema enables tools like ts-rest, next-safe-action, tRPC, and oRPC to accept any compliant validator without library-specific adapters.

---

## 3. Taxonomy of Approaches

The full-stack type safety landscape can be organized along two axes: the *layer* at which types originate (database, API, validation, UI) and the *mechanism* by which types cross boundaries (inference, generation, contract).

| Layer | Inference | Generation | Contract/Shared |
|-------|-----------|------------|-----------------|
| Database -> App | Drizzle, Kysely | Prisma, TypeORM | -- |
| Server -> Client (RPC) | tRPC, oRPC | -- | -- |
| Server -> Client (REST) | -- | openapi-typescript, Orval, @hey-api/openapi-ts | ts-rest, Zodios |
| Server -> Client (GraphQL) | Pothos (schema) | GraphQL Codegen, Relay compiler | -- |
| Runtime boundaries | Zod, Valibot, ArkType, TypeBox, io-ts | -- | Standard Schema |
| Framework data flow | SvelteKit, Nuxt | Next.js (partial) | Remix (partial) |
| Cross-package | Live types (monorepo) | Published types (npm) | Workspace protocols |

---

## 4. Analysis

### 4.1 Database Layer: Schema-to-Type Pipelines

#### 4.1.1 Prisma

Prisma adopts a schema-first, generation-based architecture [6]. Developers define data models in Prisma Schema Language (`.prisma` files), and `prisma generate` emits a fully typed client into a configurable output directory. The generated `PrismaClient` provides type-safe CRUD methods where input types (`UserCreateInput`, `UserUpdateInput`), select/include options, and result types are all derived from the schema. Prisma distinguishes between safe `Input` types (using relation fields) and `UncheckedInput` types (permitting direct scalar field manipulation).

Four type utilities -- `Exact<Input, Shape>`, `Args<Type, Operation>`, `Result<Type, Arguments, Operation>`, and `Payload<Type, Operation>` -- enable extension authors and advanced consumers to compose derived types without losing safety [7]. Prisma Migrate provides declarative migrations: the `.prisma` schema is the source of truth, and the CLI computes the diff against the database, generating SQL migration files.

The generation step introduces a build-time dependency: types can become stale if `prisma generate` is not re-run after schema changes. CI pipelines must orchestrate generation before type-checking.

#### 4.1.2 Drizzle ORM

Drizzle takes the inverse approach: schemas are defined *in TypeScript*, and types are inferred directly from the schema definitions with no generation step [8]. A table definition like `pgTable('users', { id: serial('id').primaryKey(), name: text('name').notNull() })` immediately produces inferred `Select` and `Insert` types. Changing a column type updates TypeScript errors instantly in the editor.

Drizzle Kit provides migration tooling via `generate` (schema diff to SQL files), `push` (direct application), `pull` (database introspection to TypeScript schema), and `migrate` (pending migration execution). The migration output is widely regarded as cleaner and more transparent than Prisma's [9].

Performance benchmarks show Drizzle queries running 2-3x faster than Prisma with an 85% smaller bundle (7.4KB vs. 6.5MB), making it particularly suitable for serverless and edge runtimes [10]. Drizzle supports PostgreSQL, MySQL, SQLite, MSSQL, CockroachDB, SingleStore, and Gel, with drivers for Bun, Deno, Node.js, Expo, React Native, Cloudflare Workers, and Vercel Edge Functions.

#### 4.1.3 Kysely

Kysely is a SQL-first query builder that provides type-safe autocompletion for raw SQL composition [11]. Developers supply a `Database` interface mapping table names to row types, and Kysely's generic query builder ensures that only valid table names, column names, and join paths are expressible. Result types reflect selected columns with correct aliases. Kysely is used in production at Deno, Maersk, and Cal.com.

Unlike Drizzle (which defines schema *and* queries), Kysely concerns itself solely with queries: the `Database` type interface must be supplied from an external source (manually, via `kysely-codegen` from database introspection, or from Prisma's generated types via `prisma-kysely`).

#### 4.1.4 Slonik

Slonik is a PostgreSQL-specific client that uses tagged template literals (`sql\`SELECT ...\``) for SQL injection prevention and provides runtime type safety through Zod integration [12]. The `@slonik/typegen` package generates TypeScript interfaces from SQL queries, offering ORM-level type safety while preserving raw SQL flexibility. Slonik represents the most SQL-native approach in the landscape, appealing to developers who want type safety without query builder abstraction.

#### 4.1.5 TypeORM and MikroORM

TypeORM uses TypeScript decorators to define entities, supporting both Active Record and Data Mapper patterns [13]. Type safety is partial: complex queries and raw SQL escape the type system. TypeORM's migration system generates SQL from entity changes but requires manual review.

MikroORM provides stronger type safety through its Unit of Work and Identity Map patterns, with string-based filters and relations validated at compile time [14]. Its strict typing catches errors during development rather than production, though the decorator-based approach shares TypeORM's dependency on the `experimentalDecorators` compiler option, which the TypeScript team has deprioritized in favor of the TC39 decorators proposal.

### 4.2 API Layer: Type-Safe Remote Procedure Calls

#### 4.2.1 tRPC

tRPC (v11, 2025) achieves end-to-end type safety through direct type inference from server router definitions to client call sites, without code generation, schema files, or build steps [15]. A procedure defined as:

```typescript
t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => db.user.findUnique({ where: { id: input.id } }))
})
```

automatically exposes input and output types to the client via TypeScript's type inference. The client's `trpc.getUser.useQuery({ id: '1' })` is fully typed -- input shape, output shape, and error types -- with zero intermediate artifacts.

tRPC integrates with TanStack Query (React Query) for caching, deduplication, and optimistic updates. It supports batching, subscriptions (via WebSockets or Server-Sent Events), and streaming. The framework is agnostic to transport: HTTP, WebSocket, and serverless function adapters exist for Next.js, Express, Fastify, and AWS Lambda.

The constraint is that tRPC requires a shared TypeScript type context between client and server, making it most natural in monorepos or full-stack TypeScript applications. Cross-language clients cannot consume tRPC types.

#### 4.2.2 oRPC

oRPC (v1.0, December 2025) bridges tRPC's inference model with OpenAPI compatibility [16]. It provides end-to-end type safety for inputs, outputs, and errors while automatically generating a complete OpenAPI specification. oRPC supports native complex types (Date, File), integrates with React Server Actions on Next.js and TanStack Start, and works with Zod, Valibot, ArkType, and other Standard Schema-compliant validators.

oRPC integrates with existing Node.js frameworks (Express, Fastify, Hono, Next.js) without requiring adoption of a new framework, and supports TanStack Query for React, Vue, Solid, and Svelte frontends. Its positioning as "tRPC + OpenAPI" addresses the criticism that tRPC produces APIs that are opaque to non-TypeScript consumers.

### 4.3 API Layer: REST Type Safety

#### 4.3.1 ts-rest

ts-rest provides contract-first REST API development [17]. A shared contract object defines endpoints with HTTP methods, paths, and Zod-validated response shapes. Both server and client implementations are typed against this contract. The server guarantee is bidirectional: the backend must implement all contract endpoints with correct types, and the client receives full type inference for requests and responses.

ts-rest supports Standard Schema-compliant validators and works with Nest, Next.js, Express, and Fastify. Contracts can be published as npm packages for third-party consumption, providing an incremental adoption path for existing REST APIs. Unlike tRPC, ts-rest preserves standard HTTP semantics (methods, status codes, headers), making APIs consumable by non-TypeScript clients.

#### 4.3.2 OpenAPI Code Generation

The OpenAPI-to-TypeScript pipeline converts existing API specifications into typed clients:

- **openapi-typescript** generates static TypeScript types from OpenAPI 3.0/3.1 schemas with zero runtime cost and zero client weight [18]. Types are used for compile-time checking without any generated runtime code.
- **Orval** generates fully functional API clients with hooks for React Query, SWR, Angular, Vue, Svelte, and Solid from OpenAPI v3 or Swagger v2 specifications [19].
- **@hey-api/openapi-ts** (used by Vercel, OpenCode, PayPal) generates production-ready SDKs, Zod schemas, and TanStack Query hooks from OpenAPI specs via a plugin architecture [20].

These tools address the common enterprise scenario where the API is defined in a language-agnostic OpenAPI specification (often generated from a Java, Go, or Python backend), and TypeScript consumers need typed access.

#### 4.3.3 Zodios

Zodios defines API contracts using Zod schemas and generates both client and server implementations with full type inference [21]. Parameters and responses are validated at runtime by default, preventing unrecoverable errors from unexpected API responses. Zodios provides React hooks based on TanStack Query with automatic query key management, and an Express adapter for server-side implementation.

### 4.4 API Layer: GraphQL Type Safety

#### 4.4.1 GraphQL Code Generator

GraphQL Code Generator (The Guild) reads GraphQL operations (queries, mutations, fragments) from source files and generates TypeScript types, typed hooks, and `TypedDocumentNode` artifacts [22]. The `typed-document-node` plugin produces pre-compiled document nodes bundled with result and variable types, enabling any GraphQL client (Apollo, urql, graphql-request) to provide automatic type inference through a single import.

The generation pipeline requires: `@graphql-codegen/cli`, `@graphql-codegen/typescript`, `@graphql-codegen/typescript-operations`, and `@graphql-codegen/typed-document-node`. A watch mode can regenerate types on file save, though the build step introduces latency compared to inference-based approaches.

#### 4.4.2 Pothos

Pothos is a code-first GraphQL schema builder that derives types from TypeScript without code generation or experimental decorators [23]. By leveraging TypeScript's type inference, Pothos requires minimal manual type definitions. Its plugin system (Prisma, Relay, Auth, Scope Auth, Dataloader, Errors) integrates with the type system such that each plugin's features feel native.

Pothos is used at Airbnb and Netflix. The Prisma plugin auto-generates GraphQL types from Prisma models; the Relay plugin implements the Relay specification (node interface, connections, global IDs) with full type safety.

#### 4.4.3 Relay Compiler

The Relay compiler reads GraphQL fragments and queries from JavaScript/TypeScript source files and emits typed artifacts that describe operations and fragments [24]. Each GraphQL snippet produces a TypeScript type, ensuring that data access is statically checked. The compiler enforces Relay's architectural constraints (fragment colocation, absence of over-fetching) at build time.

The combination of Pothos (backend schema) + Relay (frontend data layer) represents a fully type-safe GraphQL stack for 2025, with types flowing from Prisma schema through Pothos to Relay-generated fragment types [25].

### 4.5 Runtime Validation Libraries

Runtime validation libraries occupy a critical position in the full-stack type safety architecture: they are the mechanism by which `unknown` data entering the system (API responses, form submissions, environment variables, configuration files) is narrowed to static types with runtime guarantees.

#### 4.5.1 Zod

Zod (v4, stable 2025) is the most widely adopted TypeScript validation library [26]. Its `z.infer<typeof schema>` utility extracts static types from schema definitions, enabling a single-source-of-truth pattern where validation logic and TypeScript types are defined once. Zod v4 introduced transformative performance improvements: 14x faster string parsing, 7x faster array parsing, and 6.5x faster object parsing compared to v3, with a 57% smaller core [27]. The `@zod/mini` package provides a tree-shakeable subset for frontend-heavy use cases (2KB gzipped core).

Zod supports JSON Schema conversion, codecs (encode/decode transformations), metadata annotations, and composable schema pipelines. Its integration surface spans tRPC, React Hook Form, Conform, Prisma (via `zod-prisma-types`), Next.js Server Actions (via `next-safe-action`), and most major frameworks.

#### 4.5.2 Valibot

Valibot uses a functional, modular API where each validation function is a separate import, enabling aggressive tree-shaking [28]. For a simple login form, Valibot requires 1.37KB compared to Zod's 17.7KB -- a 90% reduction in bundle size. This advantage compounds in client-side applications where bundle weight directly impacts load time. Valibot implements Standard Schema and provides a migration path from Zod via similar API semantics.

#### 4.5.3 ArkType

ArkType uses a syntax resembling TypeScript itself: `type({ name: "string", age: "number > 0" })` [29]. It is consistently the fastest validation library in benchmarks, often 3-4x faster than Zod for 1 million validations. ArkType has zero dependencies and provides both compile-time and runtime type safety with concise, composable definitions. It implements Standard Schema v1.

#### 4.5.4 TypeBox

TypeBox defines types using a JSON Schema-compatible syntax, making schemas usable for validation, documentation, and TypeScript type generation simultaneously [30]. TypeBox integrates with Fastify's built-in validation layer and is particularly suitable for applications that need to generate JSON Schema documents alongside TypeScript types, such as API documentation generators.

#### 4.5.5 io-ts

io-ts uses `fp-ts` algebraic types to provide codec-based validation [31]. A codec of type `Type<A, O, I>` encodes and decodes between static type `A`, output type `O`, and input type `I`. The `decode` method returns an `Either` type (Right for success, Left for failure), following functional programming conventions. While io-ts provides the most mathematically rigorous approach to runtime validation, its learning curve and dependency on `fp-ts` have limited its adoption relative to Zod and Valibot.

### 4.6 Meta-Framework Integration

Modern meta-frameworks implement their own mechanisms for type safety across the server-client boundary.

#### 4.6.1 Next.js

Next.js (v15/v16) provides a custom TypeScript plugin that validates Server Component constraints at compile time, preventing client-only hooks from being used in server contexts and catching invalid exports in `page.tsx`, `layout.tsx`, and `route.ts` [32]. Server Actions marked with `'use server'` enable typed function calls across the network boundary, though the typing of their error states and return values requires manual annotation or libraries like `next-safe-action` [33].

`next-safe-action` provides full TypeScript inference from schema definition to React hooks through chainable middleware with typed context propagation. It supports Standard Schema v1 validators and provides optimistic update hooks with automatic rollback on server failure. Next.js 16 introduced async `PageProps` and experimental typed routes for link-level type checking [34].

#### 4.6.2 SvelteKit

SvelteKit provides the most automatic type inference among meta-frameworks [35]. When running the dev server or build, types are auto-generated such that `load` function return values are inferred as the page's `data` prop type without explicit annotation. Because SvelteKit uses file-system routing, the framework infers correct parameters, parent data, and layout data by traversing the route tree. This "zero-effort type safety" eliminates the manual wiring required in other frameworks.

#### 4.6.3 Nuxt

Nuxt generates `.nuxt/imports.d.ts` files with declarations for all auto-imported composables, providing type safety for `useFetch`, `useAsyncData`, and other composables without explicit imports [36]. Changes to the `/server` directory automatically update intellisense in frontend composables, creating an end-to-end safety net where backend API contract changes are immediately flagged in `useFetch` calls during development. Nuxt uses TypeScript project references for improved type-checking performance and IDE support.

#### 4.6.4 Remix / React Router

Remix loaders and actions return typed data, though the typing story has been more complex than SvelteKit's [37]. The transition from Remix to React Router v7 introduced `typegen` for automatic route module type generation. With single-fetch mode, loaders can return native objects (Date, Map, Set) that are serialized via turbo-stream, improving the type fidelity of the server-client boundary. However, explicit type annotations or utility types are still required in many scenarios where SvelteKit would infer automatically.

### 4.7 Monorepo Type Sharing

Full-stack type safety in multi-package repositories requires coordinated type propagation across package boundaries.

#### 4.7.1 Workspace Protocols

pnpm's `"workspace:*"` protocol and npm/yarn workspaces link local packages without publishing, enabling "live types" -- changes to a shared type package are immediately visible to consuming packages without a build-publish cycle [38]. Turborepo's `^build` dependency notation ensures type packages build before consuming applications, with content-aware hashing that caches unchanged packages.

#### 4.7.2 Internal Packages Pattern

The "internal packages" pattern exports TypeScript source directly (not compiled JavaScript) from shared packages, eliminating the build step for type packages entirely. Consuming applications compile the TypeScript themselves via their bundler's `transpilePackages` configuration (Next.js) or equivalent. This approach provides the tightest feedback loop but requires all consumers to share compatible TypeScript and bundler configurations.

#### 4.7.3 Turborepo and Nx

Turborepo provides content-aware hashing, remote caching, and task dependency orchestration for JavaScript/TypeScript monorepos [39]. If only `apps/web/src/components/Header.tsx` is modified, only the web app rebuilds -- the types package and API stay cached.

Nx offers comprehensive tooling including affected-project detection, computation caching, and project graph visualization [39]. Nx's `@nx/js` plugin provides TypeScript project reference management and incremental compilation. Both tools are complementary to type safety: they do not generate or transform types but ensure that type-checking and generation steps execute in the correct order with minimal redundant work.

### 4.8 Form Validation Bridges

Forms represent a critical type safety boundary: the same validation schema must execute on both client (for UX) and server (for security).

#### 4.8.1 React Hook Form + Zod

The `@hookform/resolvers` package bridges React Hook Form and Zod, providing compile-time type checking of form state, submission handlers, and error messages [40]. A Zod schema defines both the validation rules and the TypeScript type of the form data, ensuring that the `onSubmit` handler receives correctly typed values.

#### 4.8.2 Conform

Conform provides progressive enhancement for HTML forms with full support for Remix and Next.js Server Actions [41]. Using `parseWithZod`, form submissions are validated on the server with Zod schemas, and validation errors are returned with types that match the schema structure. Conform captures form values from the DOM using the FormData Web API and syncs through event delegation, maintaining type safety while respecting web platform standards.

#### 4.8.3 SvelteKit Superforms

Superforms provides type-safe form handling for SvelteKit, inferring form state types from Zod schemas and integrating with SvelteKit's load functions and form actions. The library bridges SvelteKit's server-side validation with client-side form state management.

### 4.9 Database Migration Safety

The "type-safe migration problem" concerns ensuring that schema changes propagate correctly to application types and that migrations themselves are safe to apply.

#### 4.9.1 Prisma Migrate

Prisma Migrate computes diffs between the `.prisma` schema and the database state, generating SQL migration files [42]. Migrations are deterministic and reviewable. However, the migration-to-type propagation requires re-running `prisma generate` after each migration, introducing a coordination requirement in CI/CD pipelines.

#### 4.9.2 Drizzle Migrations

Drizzle Kit's `generate` command produces clean, readable SQL migration files from TypeScript schema changes [43]. Because the schema *is* TypeScript, type updates are immediate -- no generation step is needed for the application code. The migration system supports versioning and folder-based organization. The transparency of generated SQL is a frequently cited advantage over Prisma's migration output.

#### 4.9.3 Atlas

Atlas (Ariga) uses a Terraform-like declarative syntax (`schema.hcl`) where the desired schema state is defined and `atlas migrate diff` generates the migration SQL [44]. Atlas is language-agnostic and integrates with TypeORM, Prisma, and other ORMs via provider plugins. The 2025 release added Drift Inspector for detecting production schema divergence and Vercel Deploy Hooks integration.

---

## 5. Comparative Synthesis

### 5.1 Database Layer Comparison

| Tool | Schema Source | Type Mechanism | Migration System | Bundle Size | SQL Dialect Support |
|------|-------------|----------------|------------------|-------------|-------------------|
| Prisma | `.prisma` DSL | Generation (`prisma generate`) | Declarative (Prisma Migrate) | ~6.5MB | PostgreSQL, MySQL, SQLite, MongoDB, CockroachDB, SQL Server |
| Drizzle | TypeScript | Inference (direct) | Diff-based (Drizzle Kit) | ~7.4KB | PostgreSQL, MySQL, SQLite, MSSQL, CockroachDB, SingleStore, Gel |
| Kysely | TypeScript interface | Inference (manual or codegen) | External | ~30KB | PostgreSQL, MySQL, SQLite, MSSQL |
| MikroORM | TypeScript decorators | Inference (decorators) | Diff-based | ~200KB | PostgreSQL, MySQL, SQLite, MongoDB, MS SQL |
| TypeORM | TypeScript decorators | Partial inference | Generation | ~400KB | PostgreSQL, MySQL, MariaDB, SQLite, MSSQL, Oracle, CockroachDB |
| Slonik | SQL + Zod schemas | Generation (`@slonik/typegen`) | External | ~50KB | PostgreSQL only |

### 5.2 API Layer Comparison

| Tool | Mechanism | Protocol | OpenAPI | Cross-Language | Validation | Framework Integration |
|------|-----------|----------|---------|---------------|------------|---------------------|
| tRPC v11 | Inference | RPC over HTTP/WS | No | No | Zod, Standard Schema | Next.js, Express, Fastify, AWS Lambda |
| oRPC v1 | Inference | RPC over HTTP | Yes (auto-gen) | Yes (via OpenAPI) | Standard Schema | Express, Fastify, Hono, Next.js |
| ts-rest | Contract | REST | Partial | Yes (via contract) | Standard Schema | Nest, Next.js, Express, Fastify |
| Zodios | Contract | REST | No (but zod-to-openapi) | No | Zod | Express, Next.js |
| openapi-typescript | Generation | REST | Source | Yes | None (types only) | Any |
| Orval | Generation | REST | Source | Yes | Zod (optional) | React Query, SWR, Angular, Vue, Svelte, Solid |
| @hey-api/openapi-ts | Generation | REST | Source | Yes | Zod (plugin) | TanStack Query, Axios, Fetch |
| GraphQL Codegen | Generation | GraphQL | N/A | Yes (via SDL) | N/A | Apollo, urql, graphql-request |
| Pothos | Inference (schema) | GraphQL | N/A | Yes (via SDL) | N/A | Any GraphQL server |
| Relay compiler | Generation | GraphQL | N/A | Yes (via SDL) | N/A | React (Relay) |

### 5.3 Validation Library Comparison

| Library | Bundle (min+gzip) | Performance (relative) | Standard Schema | JSON Schema | API Style |
|---------|-------------------|----------------------|-----------------|-------------|-----------|
| Zod v4 | ~2KB (core) | Baseline | Yes | Yes (built-in) | Method chaining |
| Valibot | ~1.4KB (typical) | ~1.5x Zod | Yes | Via plugin | Functional/modular |
| ArkType | ~5KB | ~3-4x Zod | Yes | Partial | TypeScript syntax |
| TypeBox | ~10KB | ~2x Zod | No | Native (is JSON Schema) | JSON Schema builder |
| io-ts | ~5KB + fp-ts | ~1x Zod | No | No | Codec/fp composition |

---

## 6. Open Problems and Gaps

### 6.1 Cross-Language Boundaries

The inference-based approach (tRPC, Drizzle) is fundamentally limited to TypeScript-to-TypeScript communication. When the API must be consumed by Swift, Kotlin, Python, or Go clients, types must be externalized into a language-agnostic format (OpenAPI, GraphQL SDL, Protocol Buffers). oRPC's dual inference+OpenAPI approach addresses this partially, but the ecosystem lacks a general solution for maintaining type safety across polyglot boundaries without duplicating schema definitions.

### 6.2 Schema Drift Detection

No mainstream tool provides continuous verification that production database schemas match application type definitions. Atlas's Drift Inspector (2025) represents an early effort, but integration with TypeScript ORM type systems is limited. A change applied directly to a production database (migration hotfix, manual ALTER TABLE) silently invalidates all generated types. The gap between "types match the migration history" and "types match the actual database" remains largely unmonitored.

### 6.3 Serialization Boundary Typing

Server Components and Server Actions in Next.js introduce a serialization boundary where non-serializable types (Date, Map, Set, class instances) must be converted for network transport. While React's `use server` boundary handles this transparently for some types, the type system does not always reflect what survives serialization. Libraries like `superjson` and `turbo-stream` address the runtime problem but not always the type-level representation.

### 6.4 Environment and Configuration Type Safety

Environment variables (`process.env`) remain typed as `string | undefined` in standard TypeScript configurations. Libraries like `t3-env` use Zod schemas to validate and type environment variables at application startup, but this remains an opt-in pattern rather than a framework-level guarantee. Configuration files (JSON, YAML) present similar challenges.

### 6.5 Error Type Propagation

Most type-safe API tools handle success types well but under-specify error types. tRPC v11 improved error typing, and oRPC provides typed error responses, but the general pattern of typed error discrimination (matching specific error codes to specific error payload shapes) remains inconsistent across the ecosystem. The lack of a standard approach to typed errors means that client-side error handling often falls back to untyped catch blocks.

### 6.6 Type Safety Across Build Boundaries

In monorepos with multiple build tools (Webpack, Vite, esbuild, SWC), type information can be lost or become inconsistent when different packages use different TypeScript configurations. The internal packages pattern (Section 4.7.2) mitigates this but requires careful coordination of `tsconfig.json` settings, path aliases, and module resolution strategies. No tool currently validates that type safety is preserved across the complete build pipeline.

### 6.7 Absence of a Unified Type Propagation Standard

Despite Standard Schema's success in unifying validation interfaces, no equivalent standard exists for the broader type propagation problem. Each tool implements its own mechanism for crossing layer boundaries, and composing tools from different families (e.g., Prisma types -> tRPC -> React Hook Form + Zod) requires manual bridging. A hypothetical "Standard Type Pipe" that could chain type transformations across ORM, API, and validation layers remains an open research direction.

---

## 7. Conclusion

The TypeScript full-stack type safety ecosystem has matured from isolated per-layer solutions to interconnected pipelines where types flow from database definitions through API transports to UI components. Three fundamental mechanisms -- inference, generation, and contract sharing -- each impose distinct trade-offs. Inference (tRPC, Drizzle) provides the tightest developer experience but limits interoperability to TypeScript-only contexts. Generation (Prisma, GraphQL Codegen, OpenAPI tools) supports cross-language boundaries but introduces build-step coordination requirements and staleness risks. Contract sharing (ts-rest, Zodios) balances the two but requires explicit contract maintenance.

The Standard Schema specification represents a significant unification effort at the validation layer, and oRPC's dual inference+OpenAPI model suggests a convergence path for the API layer. At the database layer, the competition between Prisma's generation model and Drizzle's inference model has driven rapid improvement in both approaches, with Drizzle's growth trajectory suggesting that TypeScript-native schema definition may become the dominant pattern.

Open problems -- cross-language type propagation, schema drift detection, serialization boundary typing, error type discrimination, and the absence of a unified type-pipe standard -- define the frontier of the field. The aspiration of a single schema change producing compile-time errors across every dependent layer is achievable within a pure TypeScript stack today; extending that guarantee across language boundaries, runtime environments, and organizational scales remains the central challenge.

---

## References

[1] JetBrains, "The State of Developer Ecosystem 2025," https://www.jetbrains.com/lp/devecosystem-2025/

[2] GitHub, "Octoverse 2025," https://github.blog/news-insights/octoverse/octoverse-2025/; Microsoft Research TypeScript study cited in https://tech-insider.org/typescript-vs-javascript-2026/

[3] T3 Stack, "Create T3 App," https://create.t3.gg/

[4] Better-T-Stack, "2025 TypeScript Scaffolding for E2E Type Safety," https://blog.zhoudw.vip/en-US/blog/46

[5] Standard Schema, "Standard Schema Specification v1.0," https://standardschema.dev/; https://github.com/standard-schema/standard-schema

[6] Prisma, "TypeScript & Prisma," https://www.prisma.io/typescript

[7] Prisma, "Type Safety," https://www.prisma.io/docs/orm/prisma-client/type-safety

[8] Drizzle Team, "Drizzle ORM," https://orm.drizzle.team/

[9] Bytebase, "Drizzle ORM vs Prisma: Which TypeScript ORM Should You Use in 2026?" https://www.bytebase.com/blog/drizzle-vs-prisma/

[10] K. Singh, "Drizzle ORM: The Performance-First TypeScript ORM Challenging Prisma's Dominance," Medium, January 2026, https://kawaldeepsingh.medium.com/drizzle-orm-the-performance-first-typescript-orm-challenging-prismas-dominance-3x-faster-96f6bffa5b1d

[11] Kysely, "Introduction," https://kysely.dev/docs/intro

[12] Slonik, GitHub repository, https://github.com/gajus/slonik

[13] Better Stack, "TypeORM vs. MikroORM: Choosing the Right TypeScript ORM," https://betterstack.com/community/guides/scaling-nodejs/typeorm-v-mikroorm/

[14] MikroORM, "TypeScript ORM for Node.js," https://mikro-orm.io/

[15] tRPC, "Move Fast and Break Nothing," https://trpc.io/

[16] InfoQ, "oRPC Releases Version 1.0 with OpenAPI Support and End-to-End Type Safety," December 2025, https://www.infoq.com/news/2025/12/orpc-v1-typesafe/; oRPC, https://orpc.dev/

[17] ts-rest, "Simple cross-stack type-safety," https://ts-rest.com/

[18] OpenAPI TypeScript, https://openapi-ts.dev/

[19] Orval, "Generate type-safe API clients from OpenAPI," https://orval.dev/

[20] @hey-api/openapi-ts, GitHub repository, https://github.com/hey-api/openapi-ts

[21] Zodios, https://www.zodios.org/

[22] The Guild, "GraphQL Codegen," https://the-guild.dev/graphql/codegen; "TypedDocumentNode plugin," https://the-guild.dev/graphql/codegen/plugins/typescript/typed-document-node

[23] Pothos GraphQL, https://pothos-graphql.dev/; https://github.com/hayes/pothos

[24] Relay, "Relay Compiler," https://relay.dev/docs/guides/compiler/; "Type Emission," https://relay.dev/docs/guides/type-emission/

[25] Tigawanna, "Revisiting GraphQL in 2025: A Type-Safe Stack with Pothos and Relay," DEV Community, https://dev.to/tigawanna/revisiting-graphql-in-2025-a-type-safe-stack-with-pothos-and-relay-ka8

[26] Zod, https://zod.dev/

[27] InfoQ, "Zod v4 Available with Major Performance Improvements and Introduction of Zod Mini," August 2025, https://www.infoq.com/news/2025/08/zod-v4-available/

[28] Valibot, "Comparison," https://valibot.dev/guides/comparison/; Pockit Blog, "Zod vs Valibot vs ArkType in 2026," https://pockit.tools/blog/zod-valibot-arktype-comparison-2026/

[29] ArkType, cited in comparison analyses; https://medium.com/@ruverd/why-use-arktype-instead-of-zod-08c401fd4f6f

[30] Better Stack, "TypeBox vs Zod," https://betterstack.com/community/guides/scaling-nodejs/typebox-vs-zod/; Val.town, "Zod is amazing. Here's why we're also using TypeBox," https://blog.val.town/blog/typebox/

[31] io-ts, https://gcanti.github.io/io-ts/; https://github.com/gcanti/io-ts

[32] Next.js, "Configuration: TypeScript," https://nextjs.org/docs/app/api-reference/config/typescript

[33] next-safe-action, https://next-safe-action.dev/

[34] DEV Community, "Next.js 16 Type Safety: Async PageProps & Typed Routes," https://dev.to/bharathkumar28/nextjs-16-type-safety-async-pageprops-typed-routes-3ilc

[35] Svelte, "Zero-effort type safety," https://svelte.dev/blog/zero-config-type-safety

[36] Nuxt, "TypeScript," https://nuxt.com/docs/4.x/guide/concepts/typescript; "Auto-imports," https://nuxt.com/docs/4.x/guide/concepts/auto-imports

[37] GitHub Discussions, "Typing definition for loader and action hooks," https://github.com/remix-run/react-router/discussions/11411

[38] MagnumCode, "Type-Safe Shared Packages in Turborepo Monorepos," https://www.magnumcode.com/blog/turborepo-shared-types-monorepo

[39] Canopas, "Building a Better Monorepo with TypeScript, Turborepo, or Nx," https://canopas.com/building-better-monorepo-with-type-script-turborepo-or-nx; Leapcell, "Streamlining Full-Stack TypeScript Development with Monorepos," https://leapcell.io/blog/streamlining-full-stack-typescript-development-with-monorepos

[40] Strapi, "Form Validation In TypeScript Using Zod and React Hook Form," https://strapi.io/blog/form-validation-in-typescipt-projects-using-zod-and-react-hook-forma; OneUpTime, "How to Create Type-Safe Forms in React," https://oneuptime.com/blog/post/2026-01-15-type-safe-forms-react-hook-form-zod/view

[41] Conform, https://conform.guide/; Jacob Paris, "Form validation with Conform, Zod, and Remix," https://www.jacobparis.com/content/remix-conform

[42] Prisma, "Prisma Migrate," https://www.prisma.io/docs/orm/prisma-migrate; Prisma vs Drizzle comparison, https://www.prisma.io/docs/orm/more/comparisons/prisma-and-drizzle

[43] Drizzle Team, "Drizzle Kit," https://orm.drizzle.team/docs/kit-overview

[44] Atlas, "Manage your database schema as code," https://atlasgo.io/; https://github.com/ariga/atlas

---

## Practitioner Resources

- **tRPC Documentation**: https://trpc.io/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Drizzle ORM Documentation**: https://orm.drizzle.team/docs/overview
- **Zod Documentation**: https://zod.dev/
- **Kysely Documentation**: https://kysely.dev/docs/intro
- **ts-rest Documentation**: https://ts-rest.com/docs/intro
- **oRPC Documentation**: https://orpc.dev/docs
- **GraphQL Code Generator**: https://the-guild.dev/graphql/codegen
- **Pothos GraphQL**: https://pothos-graphql.dev/docs/guide
- **Standard Schema Specification**: https://standardschema.dev/
- **next-safe-action**: https://next-safe-action.dev/docs/introduction
- **Conform**: https://conform.guide/
- **openapi-typescript**: https://openapi-ts.dev/
- **Orval**: https://orval.dev/
- **Valibot**: https://valibot.dev/
- **ArkType**: https://arktype.io/
- **TypeBox**: https://github.com/sinclairzx81/typebox
- **Relay**: https://relay.dev/
- **Atlas**: https://atlasgo.io/
- **Turborepo**: https://turbo.build/repo
- **Nx**: https://nx.dev/
