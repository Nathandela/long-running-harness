---
title: "TypeScript Metaprogramming and Code Generation"
date: 2026-03-25
summary: "A survey of metaprogramming capabilities in TypeScript covering decorators (legacy and TC39), reflect-metadata, AST manipulation, ts-morph, custom transformers, code generation approaches, and runtime metaprogramming patterns."
keywords: [typescript, metaprogramming, decorators, code-generation, ast, transformers]
---

# TypeScript Metaprogramming and Code Generation

*2026-03-25*

## Abstract

TypeScript occupies an unusual position in the metaprogramming landscape: it is a statically typed language whose types are entirely erased at compile time, producing plain JavaScript with no residual type information at runtime. This erasure creates a fundamental tension between the richness of TypeScript's compile-time type system and the poverty of its runtime reflection capabilities -- a tension that the ecosystem has addressed through a heterogeneous collection of metaprogramming techniques spanning decorators, compiler API manipulation, code generation toolchains, and runtime validation libraries.

This survey provides a comprehensive analysis of TypeScript's metaprogramming facilities. We trace the evolution of decorators from TypeScript's experimental implementation (based on the abandoned Stage 2 TC39 proposal) through the TC39 Stage 3 specification implemented in TypeScript 5.0, examining the semantic differences, the introduction of auto-accessors, and the migration challenges facing frameworks that depend on parameter decorators and `emitDecoratorMetadata`. We analyze the `reflect-metadata` polyfill and the design-time type emission mechanism that enables dependency injection in Angular and NestJS, situating it against the emerging TC39 Decorator Metadata proposal (`Symbol.metadata`). We examine the TypeScript Compiler API -- `ts.createProgram`, `ts.transform`, and `ts.factory` -- and the `ts-morph` library that wraps it for programmatic code analysis and generation. We survey custom transformer plugins, the `ts-patch` ecosystem for integrating them into build pipelines, and the three-phase (before/after/afterDeclarations) transformation architecture. We analyze code generation approaches including schema-first codegen (OpenAPI, GraphQL, Prisma), template-based generation, and AST-based generation. We examine runtime metaprogramming through `Proxy` and `Reflect`, the runtime validation libraries (Zod, io-ts, Valibot) that reconstruct type information erased by compilation, and the interaction of TypeScript with alternative compilers (Babel, SWC) that perform type-unaware transformations. Finally, we survey source code analysis tools, particularly `typescript-eslint`'s typed linting architecture.

The survey identifies a central theme: TypeScript's type erasure forces the ecosystem into a perpetual cycle of reconstructing, at various stages, the type information that compilation discards. Each metaprogramming technique represents a different strategy for bridging this gap -- at decoration time, at compile time, at code-generation time, or at runtime.

## 1. Introduction

Metaprogramming -- programs that operate on programs -- has been a persistent concern in programming language design since the macro systems of Lisp in the 1960s [1]. In statically typed languages, metaprogramming takes on additional complexity because transformations must respect the type system's invariants. TypeScript adds a further dimension: because it compiles to JavaScript, a dynamically typed language with no native type reification, any metaprogramming that depends on type information must either execute before type erasure (compile-time) or reconstruct type information independently (runtime).

TypeScript's metaprogramming surface area has expanded substantially since the language's initial release in 2012. The experimental decorators flag (`--experimentalDecorators`) was introduced in TypeScript 1.5 (2015), based on a TC39 proposal that would undergo radical redesigns before reaching Stage 3 in 2022 [2]. The TypeScript Compiler API, though never formally documented as a public stable API, has been used extensively for tooling, from ESLint integration to bespoke code generators. The `reflect-metadata` polyfill, combined with `emitDecoratorMetadata`, created a de facto standard for runtime type reflection that Angular and NestJS built their dependency injection systems upon [3]. Meanwhile, the broader JavaScript ecosystem developed its own metaprogramming layer through Babel plugins, and more recently SWC's Rust-based transformation system, both of which process TypeScript without access to its type checker.

This survey is organized as follows. Section 2 establishes the foundational concepts underlying TypeScript metaprogramming. Section 3 provides a taxonomy of the major approaches. Section 4 analyzes each approach in technical depth. Section 5 offers a comparative synthesis. Section 6 identifies open problems and gaps. Section 7 concludes.

## 2. Foundations

### 2.1 Type Erasure and Its Consequences

TypeScript's compilation model is fundamentally one of erasure: all type annotations, interfaces, type aliases, and generic type parameters are removed during compilation, producing JavaScript that contains no trace of the original type information [4]. This design decision, inherited from TypeScript's goal of being a strict superset of JavaScript, has profound implications for metaprogramming.

In languages with type reification (Java's reflection API, C#'s `System.Reflection`, F#'s type providers), runtime code can interrogate the type system: discovering the fields of a class, the parameter types of a method, or the generic type arguments of a collection. TypeScript provides none of this natively. A function declared as `function process(input: string): number` compiles to `function process(input) { ... }` -- the parameter type `string` and return type `number` are irrecoverably lost [4].

This erasure is not merely an implementation detail but a foundational constraint that shapes the entire metaprogramming ecosystem. Every technique surveyed in this paper can be understood as a strategy for either (a) executing before erasure occurs, while type information is still available, or (b) maintaining a parallel representation of type information that survives compilation.

### 2.2 The Decorator Model: From Annotations to Transformations

Decorators are syntactic constructs that attach metadata or behavior to class declarations and their members. TypeScript's decorator history reflects the turbulent standardization process in TC39. The experimental decorators implemented in TypeScript 1.5 were based on a Stage 2 proposal that provided decorators with property descriptors, enabling them to modify the `enumerable`, `configurable`, and `writable` characteristics of class members [2]. This proposal was ultimately rejected by TC39 in favor of a redesigned Stage 3 proposal that adopted a more constrained model: decorators receive a value and a context object, and must return a replacement of the same kind (a method decorator returns a method, a field decorator returns an initializer function) [5].

### 2.3 AST Representation in TypeScript

The TypeScript compiler represents source code as an Abstract Syntax Tree (AST) composed of `Node` objects, each with a `kind` property indicating its syntactic category (`FunctionDeclaration`, `ClassDeclaration`, `PropertyAccessExpression`, etc.). Unlike Babel's AST, which follows the ESTree specification, TypeScript's AST is proprietary and tightly coupled to its compiler internals [6]. Each node carries source position information (`pos` and `end`), a `flags` bitmask, and references to child nodes through typed properties. The AST is immutable by convention -- transformations produce new nodes through factory functions rather than mutating existing ones.

### 2.4 The Compile-Emit Pipeline

TypeScript's compilation proceeds through five major phases: parsing (source text to AST), binding (establishing symbol tables and scope relationships), checking (type verification and inference), transformation (AST-to-AST rewrites that lower TypeScript-specific syntax to JavaScript), and emission (AST to output text) [7]. Custom transformers can inject code into the transformation phase, executing before TypeScript's own transformers (seeing TypeScript AST nodes), after them (seeing lowered JavaScript AST nodes), or after declaration emission (seeing `.d.ts` AST nodes). This pipeline architecture is central to understanding where each metaprogramming technique operates.

## 3. Taxonomy of Approaches

TypeScript metaprogramming techniques can be organized along two axes: the *phase* at which they operate (design time, compile time, build time, or runtime) and the *mechanism* they employ (syntactic transformation, metadata attachment, code generation, or runtime interception).

**Phase 1 -- Design-time analysis:** Tools like `typescript-eslint` that use the TypeScript compiler's type checker to analyze source code without transforming it. These operate in the IDE and CI pipeline, leveraging type information for static analysis.

**Phase 2 -- Compile-time transformation:** Custom transformers that run within the TypeScript compilation pipeline, operating on the AST before or after TypeScript's own transformations. The `ts-patch` and legacy `ttypescript` tools integrate these into standard `tsc` invocations.

**Phase 3 -- Build-time code generation:** External tools that read schemas, specifications, or source code and produce TypeScript files as output. This includes OpenAPI codegen, GraphQL Code Generator, Prisma's client generation, and `ts-morph`-based generators. These run before compilation rather than during it.

**Phase 4 -- Runtime metaprogramming:** Techniques that operate on JavaScript at execution time, including `Proxy`/`Reflect`-based interception, decorator-attached metadata, and runtime validation libraries (Zod, io-ts, Valibot) that reconstruct type constraints discarded during compilation.

**Phase 5 -- Alternative compiler transforms:** Babel plugins and SWC plugins that transform TypeScript source code through their own compilation pipelines, operating without access to TypeScript's type checker. These represent type-unaware metaprogramming.

## 4. Analysis

### 4.1 Decorators: Legacy, TC39 Stage 3, and the Migration Gap

#### 4.1.1 Legacy (Experimental) Decorators

TypeScript's experimental decorators, enabled via the `--experimentalDecorators` tsconfig flag, follow a model where decorators are functions that receive different arguments depending on their target: class decorators receive the constructor function, method decorators receive the target object, property key, and property descriptor, parameter decorators receive the target, property key, and parameter index [2]. This model's power lies in its access to property descriptors, allowing decorators to modify `enumerable`, `configurable`, and `writable` attributes, and in its support for parameter decorators, which enable the dependency injection pattern central to Angular and NestJS.

The `emitDecoratorMetadata` compiler option works exclusively with experimental decorators, causing the compiler to emit calls to `Reflect.metadata` that attach design-time type information to decorated elements. Three metadata keys are emitted: `design:type` (the type of the decorated member), `design:paramtypes` (an array of constructor/method parameter types), and `design:returntype` (the return type) [3]. This mechanism is the foundation of TypeScript-based dependency injection: when a class constructor declares `constructor(private userService: UserService)`, the emitted metadata records `[UserService]` as the parameter types, allowing the DI container to resolve dependencies by type at runtime.

#### 4.1.2 TC39 Stage 3 Decorators

TypeScript 5.0 (March 2023) implemented the TC39 Stage 3 decorators proposal, which operates under fundamentally different semantics [5]. TC39 decorators are enabled by default when `experimentalDecorators` is absent or set to `false`. The decorator function receives two arguments: the decorated value (or `undefined` for fields) and a context object containing `kind` (one of `"class"`, `"method"`, `"getter"`, `"setter"`, `"field"`, `"accessor"`), `name`, `access` (an object with `get()` and/or `set()` methods), boolean flags `static` and `private`, an `addInitializer()` method for registering initialization callbacks, and a `metadata` object (from the companion TC39 Decorator Metadata proposal) [5].

The Stage 3 proposal introduces the `accessor` keyword for auto-accessors -- a new class element that desugars into a getter/setter pair backed by a private storage slot:

```typescript
class Example {
  @reactive accessor count = 0;
}
```

Auto-accessors are essential for decorator use cases that require interception of property access, such as reactive state management in frameworks like Lit and MobX. Under legacy decorators, field decorators could not intercept reads and writes because fields do not have property descriptors at decoration time; auto-accessors solve this by providing getter/setter semantics that decorators can wrap [8].

#### 4.1.3 The Migration Gap

The transition from experimental to TC39 decorators presents substantial challenges for the ecosystem. Three critical incompatibilities exist:

First, **parameter decorators are absent** from the TC39 proposal. Legacy parameter decorators (`@Inject() private service: UserService`) are central to Angular and NestJS's dependency injection. The TC39 proposal does not support decorating parameters, and no companion proposal has yet addressed this gap [9]. NestJS has tracked this issue since 2023, and as of early 2026, NestJS v12 (planned Q3 2026) continues to require `experimentalDecorators` [10].

Second, **`emitDecoratorMetadata` has no TC39 equivalent**. The design-time type emission that enables automatic DI resolution is a TypeScript-specific feature with no analog in the TC39 specification. The TC39 Decorator Metadata proposal provides a `Symbol.metadata` property on the class, but this is a general-purpose metadata object that decorators must populate explicitly -- there is no automatic emission of constructor parameter types [11]. A TypeScript GitHub issue (#57533) has requested bridging `emitDecoratorMetadata` with TC39 decorator metadata, but no implementation has materialized [12].

Third, **property descriptor access is removed**. TC39 decorators cannot modify `enumerable`, `configurable`, or `writable` on member descriptors, as the decorator does not receive a property descriptor. The `context.addInitializer()` method provides partial mitigation but runs during instance construction, not at class definition time [5].

### 4.2 Reflect Metadata and Dependency Injection

The `reflect-metadata` polyfill, authored by Ron Buckton (a TypeScript team member), implements the proposed `Reflect.metadata`, `Reflect.defineMetadata`, `Reflect.getMetadata`, and related functions, using a global `WeakMap` to associate metadata with target objects and property keys [3]. When combined with `emitDecoratorMetadata`, it enables a powerful pattern: the TypeScript compiler emits calls to `Reflect.defineMetadata` that store constructor parameter types, and DI containers read this metadata at runtime to resolve dependencies.

Angular's injector resolves dependencies through a sequence: the `@Injectable()` decorator marks a class for DI, the compiler emits `design:paramtypes` metadata, and the injector reads this metadata to recursively instantiate dependencies [13]. NestJS follows the same pattern, using `Reflect.getMetadata('design:paramtypes', target)` in its module system to determine what services each provider requires [10].

This architecture has a critical limitation: it only records concrete class types. Union types, interfaces, generic type parameters, and primitive types either collapse to `Object` or are lost entirely. A parameter typed as `string | number` emits `Object`; a parameter typed as `Array<User>` emits `Array` without the generic argument. This limitation explains why Angular and NestJS require injection tokens for non-class dependencies: `@Inject('CONFIG') config: AppConfig` uses a string token because the interface `AppConfig` has no runtime representation [13].

### 4.3 The TypeScript Compiler API

#### 4.3.1 Program Creation and Type Checking

The compiler API's entry point is `ts.createProgram()`, which accepts an array of root file names, compiler options, and an optional `CompilerHost` that abstracts file system operations [6]:

```typescript
const program = ts.createProgram({
  rootNames: ['src/index.ts'],
  options: { target: ts.ScriptTarget.ES2020, strict: true }
});
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile('src/index.ts');
```

The `TypeChecker` is the gateway to semantic information: `checker.getSymbolAtLocation(node)` retrieves the Symbol (representing a named declaration), `checker.getTypeAtLocation(node)` retrieves the Type (representing the backing type information), and `checker.typeToString(type)` produces a human-readable representation. These APIs enable type-aware tooling that goes beyond what pure AST analysis can achieve [6].

#### 4.3.2 AST Traversal and the Visitor Pattern

AST traversal uses `ts.forEachChild()` for simple iteration or the visitor pattern (`ts.visitNode()`, `ts.visitEachChild()`) for transformations [7]. The visitor function receives each node and must return a node -- returning `undefined` removes the node, returning a different node replaces it:

```typescript
function visitor(node: ts.Node): ts.Node {
  if (ts.isCallExpression(node) && isDebugCall(node)) {
    return ts.factory.createVoidZero(); // remove debug calls
  }
  return ts.visitEachChild(node, visitor, context);
}
```

The `ts.factory` namespace provides factory functions for creating every AST node type: `createFunctionDeclaration`, `createClassDeclaration`, `createPropertyAccessExpression`, and hundreds more. The `ts.createPrinter()` function serializes AST nodes back to source text [6]. This three-step pattern -- parse to AST, transform via visitors, print back to text -- is the foundation of all compiler-API-based metaprogramming.

#### 4.3.3 Limitations of the Compiler API

The TypeScript Compiler API has never been declared a stable public API. Microsoft's documentation warns that it may change between versions without notice [6]. The API surface is enormous (thousands of types and functions), poorly documented (the primary documentation is a GitHub wiki page with minimal examples), and requires deep understanding of compiler internals to use effectively. Error messages from incorrect API usage are often cryptic, and the lack of semantic versioning for the API means that a minor TypeScript version bump can break tooling that depends on internal node structures.

### 4.4 ts-morph: High-Level Compiler API Wrapper

`ts-morph` (formerly `ts-simple-ast`), created by David Sherret, wraps the TypeScript Compiler API in an object-oriented interface designed for programmatic code analysis and manipulation [14]. Where the raw compiler API requires manually constructing AST nodes with factory functions, `ts-morph` provides methods like `sourceFile.addClass({ name: 'Foo', ... })`, `classDeclaration.addMethod({ ... })`, and `sourceFile.getFunction('bar')`.

Key architectural decisions distinguish `ts-morph` from direct compiler API usage. All modifications are held in memory until explicitly saved via `project.save()`, enabling atomic multi-file refactoring. Wrapped node objects remain valid across manipulations -- adding a method to a class does not invalidate references to existing methods. The library manages source file synchronization with the underlying TypeScript `LanguageService`, providing up-to-date diagnostics and type information after each mutation [14].

Common `ts-morph` patterns include programmatic refactoring (renaming symbols, extracting interfaces, moving declarations between files), code generation (reading a schema or configuration and producing TypeScript source files), and automated migration (rewriting import paths, updating API calls to new signatures). The library powers tools like `dts-bundle-generator` and various framework-specific code generators [14].

### 4.5 Custom Transformers and the Plugin Ecosystem

#### 4.5.1 Transformer Architecture

A TypeScript custom transformer is a function that receives a `TransformationContext` and returns a `Transformer<SourceFile>` -- itself a function from `SourceFile` to `SourceFile` [7]. Transformers are registered in the `CustomTransformers` interface under three arrays:

- `before`: transformers that run before TypeScript's own lowering transformations, operating on TypeScript-syntax AST nodes (including type annotations, enums, and namespaces).
- `after`: transformers that run after TypeScript's transformations, operating on JavaScript-syntax AST nodes.
- `afterDeclarations`: transformers that operate on the `.d.ts` declaration file AST.

When using the compiler API directly, transformers are passed to `program.emit()`:

```typescript
program.emit(undefined, undefined, undefined, false, {
  before: [myTransformer],
  after: [myPostTransformer],
  afterDeclarations: [myDeclTransformer]
});
```

The `TransformationContext` provides access to compiler options, the `ts.factory` for node creation, and hook registration methods (`onSubstituteNode`, `onEmitNode`) for post-transformation interception [7].

#### 4.5.2 Integration: ts-patch and the Plugin Gap

TypeScript's `tsc` CLI does not natively support specifying custom transformers. The community has developed two workarounds: `ttypescript` (now deprecated, incompatible with TypeScript 5.0+) and `ts-patch`, which patches the TypeScript installation to read transformer plugins from `tsconfig.json` [15]:

```json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "./my-transformer.ts", "type": "program" },
      { "transform": "my-npm-transformer", "afterDeclarations": true }
    ]
  }
}
```

`ts-patch` supports two patching modes: a "live compiler" that patches on-the-fly at each invocation, and a "persistent patch" that modifies the TypeScript installation in `node_modules` [15]. A long-standing issue (#54276) on the TypeScript repository proposes a minimal native plugin API, but as of early 2026, no official support exists.

#### 4.5.3 Practical Transformer Examples

Common transformer use cases include: compile-time dead code elimination (removing `if (process.env.NODE_ENV === 'development')` blocks), automatic import injection (adding missing imports for framework-specific APIs), logging and instrumentation injection (wrapping function bodies with timing or tracing code), compile-time assertions (evaluating constant expressions and emitting errors), and internationalization (replacing string literals with message catalog lookups, as in FormatJS's `ts-transformer`) [7][16].

### 4.6 Code Generation Approaches

#### 4.6.1 Schema-First Code Generation

Schema-first codegen treats an external schema definition as the source of truth and generates TypeScript types and/or runtime code from it. Three major categories dominate:

**OpenAPI/Swagger codegen** tools read OpenAPI 3.x specifications and produce TypeScript types, API client functions, or both. `openapi-typescript` generates zero-runtime-cost type definitions from OpenAPI schemas, producing only TypeScript types with no JavaScript output [17]. `openapi-typescript-codegen` (now maintained as `@hey-api/openapi-ts`) generates full client implementations with request/response types. The `swagger-codegen` and `openapi-generator` projects provide language-agnostic generation with TypeScript-specific generators (`typescript-fetch`, `typescript-axios`, `typescript-angular`) [17].

**GraphQL Code Generator**, maintained by The Guild, reads GraphQL schemas and operations to produce TypeScript types, typed document nodes, and framework-specific hooks [18]. The `TypedDocumentNode` output format encodes both the GraphQL document and its TypeScript type signature in a single object, enabling type-safe query execution without framework-specific plugins. The architecture is plugin-based: `@graphql-codegen/typescript` generates base types, `@graphql-codegen/typescript-operations` generates operation-specific types, and `@graphql-codegen/typed-document-node` produces the combined typed documents [18].

**Prisma's generator system** reads a Prisma schema (a domain-specific language for data modeling) and produces a fully typed database client. The generation pipeline parses the schema, passes it through the schema engine (recently migrated from Rust to TypeScript), and produces a `PrismaClient` class with methods for each model, each returning precisely typed results based on the `select` and `include` arguments [19]. The generator system is extensible: third-party generators produce GraphQL types, Zod schemas, or TypeScript interfaces from the same Prisma schema [19].

#### 4.6.2 AST-Based Code Generation

AST-based generators construct TypeScript source files by building AST nodes programmatically, either through the raw compiler API or through `ts-morph`. This approach offers precision (the output is guaranteed to be syntactically valid) and composability (generated AST fragments can be assembled programmatically), at the cost of verbosity compared to template-based approaches. AST-based generation is particularly suited to cases where the output structure varies significantly based on input (e.g., generating different class hierarchies for different schema shapes).

#### 4.6.3 Template-Based Code Generation

Template-based generators use string templates (often with Handlebars, EJS, or simple string interpolation) to produce TypeScript source text. This approach is simpler to write and easier to read than AST-based generation, but it risks producing syntactically invalid output if template logic mishandles edge cases (unescaped special characters, incorrect indentation, missing commas). Many codegen tools use a hybrid approach: templates for the overall file structure, with AST construction for complex expressions.

#### 4.6.4 Trade-offs

Schema-first codegen provides strong guarantees of consistency between the schema and the generated types but introduces a build step and a generated-code maintenance burden (generated files must be regenerated when the schema changes, and developers must avoid editing them manually). AST-based generation is the most robust but the most verbose. Template-based generation is the most accessible but the most fragile. The choice depends on the complexity and variability of the output.

### 4.7 Runtime Metaprogramming: Proxy, Reflect, and Validation

#### 4.7.1 Proxy and Reflect

JavaScript's `Proxy` object (ES2015) enables runtime interception of fundamental operations: property access, assignment, function invocation, `in` checks, and more [20]. The `Reflect` namespace provides default implementations of these operations, enabling proxy handlers to modify behavior while delegating to the default for unhandled cases.

TypeScript's typing of `Proxy<T>` preserves the target's type signature: `new Proxy<T>(target, handler)` returns `T`, not a distinct proxy type [21]. This is semantically correct (a proxy is supposed to be transparent) but creates a gap between the static type (which reflects the target's interface) and the runtime behavior (which may intercept or modify any operation). A proxy that transforms property access return values, for instance, will have a static type that does not reflect the transformation.

Practical uses of `Proxy` in TypeScript include: lazy initialization (deferring expensive construction until first access), validation layers (intercepting `set` to enforce constraints), logging and debugging (intercepting all property access for tracing), and dynamic API clients (intercepting property access on an empty object to generate HTTP requests from method names) [20][21].

#### 4.7.2 Runtime Validation Libraries

The type erasure problem is most acute at system boundaries: data entering the application from HTTP requests, database queries, file reads, or inter-process communication has no type guarantee at runtime. The runtime validation ecosystem addresses this by providing a way to define schemas that produce both a runtime validator and a static TypeScript type from the same definition.

**Zod** (Colin McDonnell, 2020) is the dominant library, with 39+ million weekly npm downloads. Zod schemas are defined imperatively: `z.object({ name: z.string(), age: z.number().min(0) })` produces both a validator and the type `{ name: string; age: number }` via `z.infer<typeof schema>` [22]. Zod 4 (2025) introduced significant performance improvements, achieving roughly 2x faster validation through internal restructuring.

**io-ts** (Giulio Canti, 2017) takes a more algebraically rigorous approach based on functional programming concepts. Codecs in io-ts are bidirectional: they both validate (decode) input data and serialize (encode) output data. The library integrates with the `fp-ts` ecosystem, using `Either<Errors, T>` for validation results rather than exceptions [23].

**Valibot** (Fabian Hiller, 2023) prioritizes bundle size through a modular, function-based API that enables aggressive tree-shaking. Where Zod's method-chaining API includes all validation methods in every schema, Valibot's `pipe(string(), minLength(3), email())` pattern imports only the functions actually used, achieving bundles up to 90% smaller than equivalent Zod schemas [24].

All three libraries address the same fundamental problem -- reconstructing type guarantees that TypeScript's compilation erased -- but they make different trade-offs between API ergonomics, bundle size, functional programming alignment, and ecosystem integration.

### 4.8 Babel and SWC: Type-Unaware Transformation

#### 4.8.1 Babel's Plugin System

Babel processes TypeScript through `@babel/plugin-transform-typescript`, which strips type annotations without performing type checking [25]. Babel's plugin system operates on an ESTree-compatible AST, providing visitor-based transformation with a well-documented, stable API. Plugins can transform any AST node through `visitor` objects:

```javascript
module.exports = function(babel) {
  return {
    visitor: {
      CallExpression(path) {
        // transform call expressions
      }
    }
  };
};
```

Babel's strength is its mature plugin ecosystem and well-documented API. Its limitation for TypeScript metaprogramming is fundamental: because Babel does not run the TypeScript type checker, plugins cannot access type information. A Babel plugin cannot determine whether a variable is typed as `string` or `number`, whether a function call is type-safe, or whether a generic type parameter has been instantiated with a specific type [25]. This makes Babel plugins unsuitable for type-directed transformations.

#### 4.8.2 SWC's Rust-Based Plugin System

SWC (Speedy Web Compiler), written in Rust, achieves 20x-70x faster compilation than Babel while supporting a similar transformation model [26]. SWC plugins are written in Rust, compiled to WebAssembly, and loaded at build time. The plugin API uses the `VisitMut` trait for AST transformation:

```rust
impl VisitMut for MyPlugin {
    fn visit_mut_call_expr(&mut self, expr: &mut CallExpr) {
        // transform call expressions
        expr.visit_mut_children_with(self);
    }
}
```

SWC plugins face the same type-blindness as Babel plugins -- they operate on syntax without semantic understanding. Additionally, the SWC plugin ecosystem is less mature than Babel's: the plugin API is marked experimental, the Wasm ABI is not backward-compatible across SWC versions, and the Rust toolchain requirement raises the barrier to entry for JavaScript developers [26].

#### 4.8.3 The Type-Awareness Trade-off

The fundamental trade-off between TypeScript's compiler, Babel, and SWC is between transformation power and compilation speed. Only `tsc` (and tools using its compiler API) can perform type-aware transformations. Babel and SWC can transform syntax but cannot reason about types. The practical consequence is a layered build pipeline in many projects: Babel or SWC for fast compilation, `tsc --noEmit` for type checking, and custom `tsc` transformers only when type-directed transformation is required [25][26].

### 4.9 Type Providers and Compile-Time Execution

F# type providers represent the most advanced form of compile-time metaprogramming in production use: compiler plugins that execute arbitrary code at compile time (and edit time) to generate types from external data sources -- databases, web APIs, CSV files, JSON schemas [27]. A type provider can connect to a SQL database during compilation and generate a type-safe query interface reflecting the database's current schema, with IDE autocompletion updating in real time as the schema changes.

TypeScript has no native type provider mechanism. GitHub issue #3136 on the TypeScript repository, opened in 2015, requested F#-style type providers and remains open [28]. The closest approximations in the TypeScript ecosystem are:

- **Build-time codegen** (Prisma, GraphQL codegen): generates TypeScript files from external schemas before compilation. This achieves similar end results but requires an explicit generation step and does not update in real time during editing.
- **Template literal types** (TypeScript 4.1+): enable limited compile-time string manipulation, allowing types like `type Route = \`/api/${string}\`` that provide some schema-like validation at the type level.
- **Conditional types and mapped types**: enable complex type-level computation that approximates some type provider use cases, though they operate on existing types rather than external data sources.

The absence of type providers is a direct consequence of TypeScript's architecture: the compiler is designed as a pure function from source files to output files, with no mechanism for executing arbitrary code during compilation or connecting to external services. This contrasts with F#'s compiler, which was designed from the outset to support compile-time code execution through a sandboxed provider interface [27].

### 4.10 Source Code Analysis: typescript-eslint

`typescript-eslint` bridges ESLint's rule-based analysis framework with TypeScript's type checker, enabling lint rules that leverage semantic type information [29]. The architecture operates through several layers:

The **parser** (`@typescript-eslint/parser`) converts TypeScript source into an ESTree-compatible AST that ESLint can process, while preserving access to the underlying TypeScript AST and type checker through `parserServices`.

The **project service** (stabilized in v8.0, 2024) uses TypeScript's `ProjectService` API to determine the appropriate `tsconfig.json` for each linted file, creating a `Program` that provides type information [30]. This replaced the earlier `parserOptions.project` configuration, which required manually specifying tsconfig paths and often required ESLint-specific tsconfig files.

**Typed lint rules** access the type checker through `context.parserServices`:

```typescript
const parserServices = ESLintUtils.getParserServices(context);
const checker = parserServices.program.getTypeChecker();
const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
const type = checker.getTypeAtLocation(tsNode);
```

This enables rules that are impossible with syntax-only analysis: `no-floating-promises` detects unawaited Promise-typed expressions, `no-unsafe-member-access` flags property access on `any`-typed values, `unbound-method` identifies class methods referenced without proper `this` binding, and `await-thenable` prevents awaiting non-Promise values [29].

The performance cost of typed linting is substantial: it requires TypeScript to perform full type checking on every linted file, roughly doubling lint time compared to syntax-only rules. The `typescript-eslint` documentation notes that typed linting runs at "roughly the speed of type checking your project" [29]. The project service mitigates this through caching and incremental updates, but the fundamental cost of type checking remains.

## 5. Comparative Synthesis

| Technique | Phase | Type-Aware | Granularity | Ecosystem Maturity | Primary Use Case |
|---|---|---|---|---|---|
| Legacy decorators | Runtime | Partial (via emitDecoratorMetadata) | Class members, parameters | High (Angular, NestJS) | DI, routing, validation |
| TC39 Stage 3 decorators | Runtime | No (metadata must be explicit) | Class members (no parameters) | Growing (Lit, MobX) | Reactive state, access control |
| reflect-metadata | Runtime | Partial (design:paramtypes) | Constructor/method params | High but legacy-coupled | Dependency injection |
| TypeScript Compiler API | Compile-time | Full | AST nodes | Moderate (unstable API) | Tooling, analysis, codegen |
| ts-morph | Compile-time (external) | Full | Source files, declarations | Moderate | Refactoring, codegen |
| Custom transformers | Compile-time | Full | AST nodes during emit | Low (ts-patch required) | Instrumentation, optimization |
| Schema-first codegen | Build-time | N/A (generates types) | Entire files | High (OpenAPI, GraphQL, Prisma) | API clients, DB access |
| Zod/io-ts/Valibot | Runtime | Inferred (schema-to-type) | Values | Very high | Boundary validation |
| Babel plugins | Build-time | No | AST nodes (ESTree) | Very high | Syntax transforms |
| SWC plugins | Build-time | No | AST nodes (SWC AST) | Low (experimental) | Fast syntax transforms |
| typescript-eslint | Design-time | Full | Source files | Very high | Linting, static analysis |

The table reveals a pattern: techniques with full type awareness (compiler API, custom transformers, typescript-eslint) are tied to TypeScript's compiler and its performance characteristics, while techniques that achieve broad ecosystem adoption (Babel, Zod, schema-first codegen) operate independently of the type checker, trading type awareness for speed, simplicity, or build-tool independence.

## 6. Open Problems and Gaps

### 6.1 The Parameter Decorator Gap

The TC39 Stage 3 decorators proposal does not include parameter decorators, and no companion proposal has been advanced to add them. This leaves Angular and NestJS -- two of the most widely adopted TypeScript frameworks -- dependent on the legacy experimental decorators indefinitely. The TC39 Decorator Metadata proposal (`Symbol.metadata`) provides a general-purpose metadata mechanism but does not replicate `emitDecoratorMetadata`'s automatic emission of design-time type information [11][12]. A path from legacy to standard decorators for DI-dependent frameworks remains undefined.

### 6.2 Compiler API Stability

The TypeScript Compiler API has no stability guarantees, no semantic versioning, and minimal documentation [6]. Every tool built on it -- `ts-morph`, `typescript-eslint`, custom transformers, and hundreds of smaller utilities -- is vulnerable to breaking changes in minor TypeScript releases. The lack of a native plugin API (despite the open proposal in #54276) forces the ecosystem to rely on patching tools like `ts-patch` [15]. This situation has persisted for over a decade and shows no signs of resolution.

### 6.3 Type Erasure and Runtime Type Information

TypeScript's type erasure is a foundational design decision that is unlikely to change, yet the ecosystem continuously reinvents mechanisms to work around it. Zod schemas, io-ts codecs, and class-validator decorators all represent parallel type definitions that must be kept in sync with TypeScript interfaces. Proposals for automatic runtime type generation from TypeScript types have appeared periodically but conflict with TypeScript's zero-runtime-overhead design philosophy [22]. The recently proposed Node.js `--experimental-strip-types` flag (and Deno/Bun's native TypeScript execution) further entrenches the erasure model by making it possible to run TypeScript without any compilation step at all.

### 6.4 Type-Unaware Transformation Dominance

The industry trend toward faster compilation (SWC, esbuild, Bun's transpiler) is simultaneously a trend away from type-aware transformation. As more projects adopt type-stripping compilers for production builds, the surface area for compile-time metaprogramming that leverages type information shrinks. Custom TypeScript transformers, which require the full `tsc` pipeline, become increasingly marginal in build configurations optimized for speed [25][26].

### 6.5 Type Providers and Compile-Time Execution

TypeScript lacks any mechanism for compile-time code execution that could enable F#-style type providers [27][28]. The workarounds (build-time codegen, template literal types) are partial solutions that do not achieve the seamless IDE integration that type providers offer. This gap is architectural: TypeScript's compiler is designed as a deterministic function with no side effects, and introducing compile-time execution would require fundamental changes to its execution model.

### 6.6 Cross-Compiler Plugin Portability

A Babel plugin cannot run in SWC, an SWC plugin cannot run in `tsc`, and a `tsc` custom transformer cannot run in Babel or SWC. Each compiler's plugin system is incompatible with the others, forcing tool authors to maintain multiple implementations or choose a single target. No standardization effort for cross-compiler transformation plugins currently exists.

## 7. Conclusion

TypeScript's metaprogramming landscape is characterized by fragmentation driven by a single architectural decision: type erasure. Because types vanish at compilation, the ecosystem has developed a diverse set of techniques to preserve, reconstruct, or work around type information at every phase of the development lifecycle. Decorators attach metadata at definition time; the compiler API and custom transformers operate on the full type-aware AST; code generators produce typed code from external schemas; runtime validation libraries reconstruct type constraints from schema definitions; and alternative compilers trade type awareness for speed.

The current trajectory suggests several developments. The TC39 decorators specification will likely reach Stage 4, but the parameter decorator gap will persist, maintaining the fork between framework-oriented TypeScript (Angular, NestJS) and the evolving standard. Runtime validation libraries will continue to grow as the primary mechanism for boundary type safety, potentially converging with TypeScript's type system through projects that generate validators from TypeScript types. The compiler API will remain unstable but indispensable, with `ts-morph` absorbing much of the complexity. And the tension between type-aware and type-unaware compilation will intensify as faster compilers gain adoption.

The fundamental insight from this survey is that TypeScript metaprogramming is not a single discipline but a collection of distinct practices united only by their shared challenge: making a type system useful beyond the compiler that hosts it.

## References

[1] C. Queinnec, "Lisp in Small Pieces," Cambridge University Press, 1996.

[2] TypeScript Team, "TSConfig Option: experimentalDecorators," TypeScript Documentation. https://www.typescriptlang.org/tsconfig/experimentalDecorators.html

[3] R. Buckton, "reflect-metadata," npm package. https://www.npmjs.com/package/reflect-metadata

[4] TypeScript Team, "TypeScript Design Goals," Microsoft/TypeScript Wiki. https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals

[5] TC39, "Proposal: Decorators," GitHub. https://github.com/tc39/proposal-decorators

[6] TypeScript Team, "Using the Compiler API," Microsoft/TypeScript Wiki. https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

[7] D. Rosenwasser et al., "TypeScript Transformer Handbook," GitHub. https://github.com/itsdouges/typescript-transformer-handbook

[8] TC39, "Proposal: Grouped and Auto-Accessors," GitHub. https://github.com/tc39/proposal-grouped-and-auto-accessors

[9] NestJS Contributors, "Support TC39 decorators that is available since TypeScript 5.0," GitHub Issue #11414. https://github.com/nestjs/nest/issues/11414

[10] K. Mysliwiec, "release: v12.0.0 major release (approx. Q3 2026)," NestJS Pull Request #16391. https://github.com/nestjs/nest/pull/16391

[11] TC39, "Proposal: Decorator Metadata," GitHub. https://github.com/tc39/proposal-decorator-metadata

[12] R. Buckton, "Expose design-time type information in TC39 decorator metadata when emitDecoratorMetadata: true," TypeScript Issue #57533. https://github.com/microsoft/TypeScript/issues/57533

[13] V. Karpinets, "How Reflect Metadata Helps Angular Implement Dependency Injection," Medium, 2022. https://medium.com/@vitaliykarpinets/how-reflect-metadata-helps-angular-implement-dependency-injection-aa9502d1c780

[14] D. Sherret, "ts-morph: TypeScript Compiler API wrapper for static analysis and programmatic code changes," GitHub. https://github.com/dsherret/ts-morph

[15] Nonara, "ts-patch: Augment the TypeScript compiler to support extended functionality," GitHub. https://github.com/nonara/ts-patch

[16] FormatJS, "TS Transformer," FormatJS Documentation. https://formatjs.github.io/docs/tooling/ts-transformer/

[17] OpenAPI TypeScript Contributors, "openapi-typescript," Documentation. https://openapi-ts.dev/

[18] The Guild, "GraphQL Code Generator," Documentation. https://the-guild.dev/graphql/codegen

[19] Prisma Team, "Generators (Reference)," Prisma Documentation. https://www.prisma.io/docs/orm/prisma-schema/overview/generators

[20] MDN Contributors, "Meta programming," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Meta_programming

[21] Microsoft, "TypeScript can't infer types when using Proxy," GitHub Issue #20846. https://github.com/microsoft/TypeScript/issues/20846

[22] C. McDonnell, "Zod: TypeScript-first schema validation with static type inference," GitHub. https://github.com/colinhacks/zod

[23] G. Canti, "io-ts: Runtime type system for IO decoding/encoding," GitHub. https://github.com/gcanti/io-ts

[24] F. Hiller, "Valibot," Documentation. https://valibot.dev/

[25] Babel Team, "@babel/plugin-transform-typescript," Babel Documentation. https://babeljs.io/docs/babel-plugin-transform-typescript

[26] SWC Contributors, "SWC: Rust-based platform for the Web." https://swc.rs/

[27] Microsoft, "Type Providers," F# Documentation. https://learn.microsoft.com/en-us/dotnet/fsharp/tutorials/type-providers/

[28] D. Rosenwasser et al., "Feature Request: F# style Type Provider support?" TypeScript Issue #3136. https://github.com/microsoft/TypeScript/issues/3136

[29] typescript-eslint Contributors, "Typed Linting: The Most Powerful TypeScript Linting Ever." https://typescript-eslint.io/blog/typed-linting/

[30] typescript-eslint Contributors, "Typed Linting with Project Service." https://typescript-eslint.io/blog/project-service/

## Practitioner Resources

- **TypeScript AST Explorer:** https://ts-ast-viewer.com/ -- Interactive visualization of TypeScript AST nodes for developing transformers and compiler API tools.
- **TypeScript Compiler API Wiki:** https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API -- Official (sparse) documentation with code examples.
- **ts-morph Documentation:** https://ts-morph.com/ -- API reference and guides for the high-level compiler API wrapper.
- **TypeScript Transformer Handbook:** https://github.com/itsdouges/typescript-transformer-handbook -- Community-maintained guide to writing custom transformers.
- **ts-patch:** https://github.com/nonara/ts-patch -- Tool for integrating custom transformers into standard `tsc` builds.
- **TC39 Decorators Proposal:** https://github.com/tc39/proposal-decorators -- The Stage 3 specification with detailed semantics and examples.
- **typescript-eslint Getting Started (Typed Linting):** https://typescript-eslint.io/getting-started/typed-linting/ -- Configuration guide for type-aware linting rules.
- **Zod Documentation:** https://zod.dev/ -- API reference for the dominant runtime validation library.
- **OpenAPI TypeScript:** https://openapi-ts.dev/ -- Documentation for generating TypeScript types from OpenAPI schemas.
- **GraphQL Code Generator:** https://the-guild.dev/graphql/codegen -- Documentation for schema-first GraphQL TypeScript codegen.
- **Prisma Generators Reference:** https://www.prisma.io/docs/orm/prisma-schema/overview/generators -- Documentation for Prisma's code generation system.
- **SWC Plugin Guide:** https://swc.rs/docs/plugin/ecmascript/getting-started -- Guide to writing Rust-based SWC plugins.
