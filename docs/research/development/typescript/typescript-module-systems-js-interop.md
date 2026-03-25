---
title: "TypeScript Module Systems and JavaScript Interop"
date: 2026-03-25
summary: "A survey of TypeScript's module system evolution covering ESM/CJS duality, module resolution strategies, declaration files, DefinitelyTyped, bundler integration, and the ongoing challenges of JavaScript ecosystem interoperability."
keywords: [typescript, modules, esm, commonjs, declaration-files, interop]
---

# TypeScript Module Systems and JavaScript Interop

*2026-03-25*

## Abstract

TypeScript's module system represents one of the most complex intersections of language design and ecosystem engineering in modern software development. As a strict syntactic superset of JavaScript, TypeScript does not define its own module semantics but instead must faithfully model and type-check whatever module system the host runtime or bundler implements. This constraint has forced the TypeScript compiler to navigate a JavaScript ecosystem that has cycled through at least six distinct module formats -- script-concatenated namespaces, AMD, CommonJS, UMD, SystemJS, and ES Modules -- each with its own resolution algorithm, interoperability quirks, and runtime semantics.

The consequences are substantial. The `moduleResolution` compiler option has grown from two values (`classic` and `node`) to five (`classic`, `node10`, `node16`, `nodenext`, `bundler`), each modeling a different host's behavior. The transition from CommonJS to ES Modules has produced a "duality crisis" where packages must simultaneously support `require()` and `import`, leading to dual-package publishing patterns, conditional exports, new file extensions (`.mts`, `.cts`), and configuration options (`verbatimModuleSyntax`, `erasableSyntaxOnly`) that did not exist three years ago. Declaration files (`.d.ts`) serve as the type-level bridge between TypeScript and the vast JavaScript ecosystem, mediated by the DefinitelyTyped repository and its `@types` infrastructure. Meanwhile, the rise of transpile-only tools -- esbuild, SWC, Vite -- has shifted TypeScript's role from compiler to type-checker, introducing the `noEmit` pattern and motivating Node.js itself to add native type stripping.

This survey provides a comprehensive analysis of TypeScript's module landscape as of early 2026. We trace the historical evolution from pre-ESM module formats through the current ESM/CJS duality, examine each module resolution strategy in detail, analyze the declaration file ecosystem, evaluate bundler integration patterns, and identify the open problems that continue to generate friction for practitioners. We draw on official TypeScript documentation, Node.js specifications, TC39 proposals, TypeScript team blog posts, and ecosystem tooling analyses, covering over thirty sources. The paper describes the landscape without prescribing solutions, reflecting the reality that correct module configuration depends on deployment target, toolchain, and organizational constraints that vary across projects.

## 1. Introduction

JavaScript was designed in 1995 without a module system. Scripts loaded via `<script>` tags shared a single global namespace, and the only mechanism for code organization was the immediately-invoked function expression (IIFE) pattern. This absence of modularity was tolerable for the small scripts of the early web but became untenable as applications grew. The decade between 2009 and 2019 saw the JavaScript community invent, standardize, and partially adopt no fewer than six module formats, each addressing the modularity problem with different trade-offs for synchronous vs. asynchronous loading, server vs. browser environments, and static vs. dynamic resolution [1].

TypeScript, first released by Microsoft in October 2012, entered this landscape with a dual mandate: provide static types for existing JavaScript code, and emit valid JavaScript that runs without modification on existing runtimes. The second mandate means that TypeScript cannot invent its own module semantics. Instead, the compiler must understand what the target runtime or bundler will do with the emitted JavaScript and ensure that the type-level view of module boundaries matches the runtime behavior. As Andrew Branch of the TypeScript team has articulated, "for TypeScript, module resolution is mostly a matter of accurately modeling the host's module resolution algorithm between output files, with a little bit of remapping applied to find type information" [2].

This modeling problem is what makes TypeScript's module story uniquely complex. The compiler must answer questions such as: When the user writes `import { foo } from "./utils"`, what file will the runtime actually load? Does the runtime require a file extension? Does the runtime consult `package.json` `exports` fields? Does a default import from a CommonJS module bind to `module.exports` or `module.exports.default`? The answers depend entirely on the host, and TypeScript has had to add new `module` and `moduleResolution` settings as new hosts with new resolution algorithms have emerged.

This paper is organized as follows. Section 2 establishes the foundations of JavaScript module systems and TypeScript's relationship to them. Section 3 provides a taxonomy of module formats and resolution strategies. Section 4 analyzes the major facets of TypeScript's module system in depth across ten subsections. Section 5 offers a comparative synthesis. Section 6 identifies open problems and gaps. Section 7 concludes.

## 2. Foundations

### 2.1 The JavaScript Module Problem

The absence of a built-in module system in JavaScript created three distinct problems: namespace pollution (all top-level declarations are global), dependency management (no mechanism to declare that file A depends on file B), and encapsulation (no way to expose a public API while hiding internal implementation). The community responded with a series of increasingly sophisticated solutions [1].

**CommonJS (2009)** emerged from the ServerJS project and was adopted by Node.js as its native module system. CommonJS modules use synchronous `require()` calls and `module.exports` assignments. Resolution follows a deterministic algorithm: relative paths resolve against the requiring file's directory, bare specifiers trigger a walk up the `node_modules` directory tree, and the algorithm checks for files with `.js`, `.json`, and `.node` extensions as well as `index.js` files inside directories [3]. CommonJS's synchronous loading model made it unsuitable for browsers but ideal for Node.js, where filesystem access is effectively instantaneous.

**AMD (Asynchronous Module Definition, 2011)** was designed for browser environments where synchronous loading would block rendering. AMD modules use `define()` calls with an array of dependency specifiers and a factory function callback. RequireJS was the dominant AMD loader. AMD's asynchronous model enabled lazy loading and build-time optimization but introduced syntactic verbosity that many developers found unacceptable [1].

**UMD (Universal Module Definition)** attempted to bridge CommonJS and AMD by wrapping modules in a factory function that detects the available module system at runtime. UMD modules check for `define.amd`, `module.exports`, and fall back to global assignment. This pragmatic approach enabled single-file distribution across environments but added boilerplate and prevented static analysis [4].

**SystemJS** provided a universal module loader capable of loading AMD, CommonJS, UMD, and ES Module formats in the browser. It was particularly important for Angular 2's early development, which used SystemJS for in-browser module loading before the ecosystem converged on bundlers [5].

### 2.2 ES Modules: The Standard

The ECMAScript 2015 (ES6) specification introduced a native module system with static `import` and `export` declarations. ES Modules (ESM) differ from CommonJS in several fundamental ways: imports are statically analyzable (they must appear at the top level with string literal specifiers), bindings are live (importing a variable creates a read-only reference to the exporter's binding, not a copy), and loading is asynchronous by default. The static structure enables tree-shaking -- dead code elimination based on unused exports -- which is impossible with CommonJS's dynamic `require()` [6].

Node.js added experimental ESM support in version 8.5.0 (2017) and stabilized it in version 12.22.0 (2021). The implementation required a mechanism to distinguish ESM files from CommonJS files, since the two formats have incompatible semantics (top-level `await` in ESM, `require`/`module.exports` in CJS). Node.js uses two signals: the `.mjs` extension forces ESM parsing, and the `"type": "module"` field in the nearest `package.json` causes all `.js` files in that package to be parsed as ESM. Conversely, `.cjs` forces CommonJS parsing regardless of the `type` field [7].

### 2.3 TypeScript's Position

TypeScript occupies a unique position in this landscape. It is not a runtime -- it does not load or execute modules. It is a compiler and type-checker that must understand module semantics well enough to verify that type-level assertions (import types, export signatures) correspond to runtime behavior. The compiler's `module` option controls what JavaScript module format is emitted (CommonJS, ESNext, Node16, etc.), while the `moduleResolution` option controls how the compiler resolves import specifiers to files during type-checking [2].

This separation between emit format and resolution algorithm is a source of persistent confusion. A developer can set `module: "ESNext"` (emit ES Module syntax) with `moduleResolution: "node"` (use Node.js's CommonJS resolution algorithm), producing type-checking behavior that does not match any real runtime. The TypeScript team has spent years refining these options and their interactions, culminating in the `node16`/`nodenext` settings that correctly couple emit format and resolution behavior [8].

## 3. Taxonomy of Approaches

### 3.1 Module Formats Targeted by TypeScript

TypeScript's `module` compiler option has supported the following output formats across its history:

| Format | `module` Value | Era | Characteristics |
|--------|---------------|-----|-----------------|
| Namespaces | `none` | 2012-- | TypeScript-specific; compiles to IIFEs or object literals concatenated into a single output file |
| AMD | `amd` | 2012--2018 | `define()` wrappers for RequireJS; supports `outFile` concatenation |
| CommonJS | `commonjs` | 2012-- | `require()`/`module.exports`; Node.js default until `"type": "module"` |
| UMD | `umd` | 2013--2020 | Factory wrapper detecting AMD/CJS/global; used for isomorphic libraries |
| SystemJS | `system` | 2015--2019 | `System.register()` calls; used primarily with Angular 2 |
| ES2015+ | `es2015`/`es2020`/`es2022`/`esnext` | 2015-- | Native `import`/`export`; each version adds features (dynamic import, top-level await, import assertions) |
| Node16 | `node16` | 2022-- | Emits CJS or ESM depending on file extension and `package.json` `type` field |
| NodeNext | `nodenext` | 2022-- | Tracks latest Node.js behavior; currently identical to `node16` but will evolve |
| Preserve | `preserve` | 2024-- | Emits import/export syntax exactly as written; defers all transformation to bundler |

### 3.2 Module Resolution Strategies

The `moduleResolution` option determines how TypeScript maps an import specifier (e.g., `"./utils"`, `"lodash"`, `"@my-org/core"`) to a file on disk during type-checking:

**Classic** -- TypeScript's original resolution, predating Node.js alignment. For relative imports, it looks for `.ts` and `.d.ts` files adjacent to the importing file. For non-relative imports, it walks up the directory tree looking for the specifier as a `.ts` or `.d.ts` file. It does not consult `node_modules` or `package.json`. This mode is effectively obsolete [9].

**Node10** (formerly `node`) -- Models Node.js's CommonJS resolution algorithm. Resolves relative imports by appending `.ts`, `.tsx`, `.d.ts`, then checking for `index` files in directories. For bare specifiers, walks up `node_modules` directories, checking `package.json` `main` and `types`/`typings` fields. Does not support `package.json` `exports` or `imports` fields [9].

**Node16/NodeNext** -- Models Node.js's dual CJS/ESM resolution. The resolution algorithm depends on whether the importing file is CJS or ESM (determined by file extension and `package.json` `type`). ESM resolution requires explicit file extensions on relative imports, supports `package.json` `exports` and `imports` fields, and does not perform directory index resolution. CJS resolution retains the extensionless and directory index behavior of `node10` but adds `exports` field support [8][10].

**Bundler** -- Introduced in TypeScript 5.0. Models the hybrid resolution used by webpack, Rollup, esbuild, and Vite. Like `node16` ESM resolution, it supports `package.json` `exports` and `imports` fields. Unlike `node16`, it does not require file extensions on relative imports and allows `require()` calls in ESM files. This mode reflects the reality that bundlers implement resolution algorithms that are more permissive than any runtime [11].

## 4. Analysis

### 4.1 ES Modules in TypeScript

TypeScript's ESM support involves several syntactic and semantic layers. The standard `import`/`export` syntax works as expected, with TypeScript adding type annotations to the imported bindings. TypeScript 3.8 introduced `import type` and `export type` syntax, allowing developers to explicitly mark imports that exist only for type-checking and should be completely erased from the JavaScript output [12]:

```typescript
import type { User } from "./models";    // erased entirely
import { validateUser } from "./models";  // preserved in output
```

The distinction matters because JavaScript module imports can have side effects. A module that modifies global state when imported will lose that side effect if the import is elided by the compiler. Before `import type`, TypeScript used heuristics to determine whether an import was "type-only" and could be safely removed -- a process called import elision. This was fragile: a value import that happened to be used only in type positions would be elided, potentially breaking modules with side effects [12].

TypeScript 5.0 introduced `verbatimModuleSyntax`, which replaces the earlier `importsNotUsedAsValues` and `preserveValueImports` flags. Under `verbatimModuleSyntax`, the rule is simple: any import or export without the `type` modifier is preserved in the output; anything with the `type` modifier is erased. This eliminates the heuristic elision and requires developers to be explicit about which imports are type-only [13]. The `isolatedModules` flag, originally introduced for compatibility with single-file transpilers like Babel, enforces that each file can be type-checked in isolation -- a constraint that `verbatimModuleSyntax` subsumes and extends [14].

### 4.2 The CJS/ESM Duality Crisis

The coexistence of CommonJS and ES Modules in the Node.js ecosystem has created what is perhaps the most persistent source of configuration complexity in modern JavaScript development. The root cause is that CJS and ESM have incompatible semantics that cannot be fully abstracted away:

**File format determination.** Node.js determines whether a `.js` file is CJS or ESM based on the `"type"` field in the nearest `package.json`. The value `"module"` makes `.js` files ESM; the default `"commonjs"` (or absence of the field) makes them CJS. TypeScript mirrors this behavior in `module: "node16"/"nodenext"`, introducing `.mts` (always ESM) and `.cts` (always CJS) source extensions that emit to `.mjs` and `.cjs` respectively [7][10].

**Interoperability asymmetry.** ESM can `import` from CJS modules, but CJS cannot `require()` ESM modules in Node.js versions before 22.0. This asymmetry forced the ecosystem into an awkward transition period where ESM-only packages broke CJS consumers. Node.js 22 introduced `require(esm)` support, easing the constraint, but adoption remains incomplete [15].

**The dual package hazard.** When a package ships both CJS and ESM entry points, a CJS consumer and an ESM consumer in the same application may load different copies of the package's module-level state, causing singleton patterns, instance checks (`instanceof`), and caches to break. The Node.js documentation explicitly warns about this hazard and suggests stateless package designs or a wrapper-module approach [7].

**Conditional exports.** The `package.json` `exports` field allows packages to declare different entry points for different conditions (`"import"`, `"require"`, `"types"`, `"default"`). TypeScript 4.7 added support for resolving against `exports` fields under `node16`/`nodenext` resolution, including the `"types"` condition that lets packages provide separate type declarations for CJS and ESM entry points [10]:

```json
{
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  }
}
```

The complexity of this configuration has spawned dedicated validation tools. Andrew Branch's "Are the Types Wrong?" project analyzes npm packages for module-related type issues and found that nearly one third of popular packages with bundled types had some form of module resolution problem [16].

### 4.3 Module Resolution in Detail

The evolution of TypeScript's `moduleResolution` setting reflects the growing complexity of the JavaScript runtime landscape.

**Path mapping** (`paths`, `baseUrl`, `rootDirs`) provides a mechanism for TypeScript to understand non-standard resolution that occurs in the runtime or bundler. The `paths` option maps import specifiers to file locations, but critically does not transform the emitted JavaScript -- it only informs the type-checker. The `baseUrl` option sets the root directory for non-relative module resolution. The `rootDirs` option declares multiple directories that should be treated as a single virtual root, useful for projects where build steps merge output from multiple source directories [17]. A persistent source of confusion is that `paths` requires a runtime counterpart (webpack aliases, `tsconfig-paths` for Node.js, or bundler configuration) to actually work; TypeScript's documentation states that "paths should only be used to inform TypeScript that another tool has this mapping and will use it at runtime or when bundling" [17].

The transition from `node` (now `node10`) to `node16`/`nodenext` introduced two behavioral changes that cause the most migration friction: the requirement for explicit file extensions in ESM files, and the enforcement of `package.json` `exports` fields. Under `node16` ESM resolution, writing `import { foo } from "./utils"` is an error -- the developer must write `import { foo } from "./utils.js"` even though the source file is `utils.ts`. This `.ts`-to-`.js` extension rewriting reflects TypeScript's principle that imports describe the output file graph, not the source file graph [2]. TypeScript 5.8 added the `--rewriteRelativeImportExtensions` flag to automate this rewriting for projects that find the `.js` extension convention confusing [18].

### 4.4 Declaration Files and the Type Bridge

Declaration files (`.d.ts`) are TypeScript's mechanism for describing the types of JavaScript code without containing implementation. They serve three distinct roles: as automatically generated type descriptions of TypeScript libraries (via `--declaration`), as hand-written type descriptions of JavaScript libraries, and as ambient type descriptions of global APIs (`lib.d.ts`) [19].

**Automatic generation.** When `declaration: true` is set in `tsconfig.json`, the compiler emits `.d.ts` files alongside `.js` files. These declarations contain only the public type signatures -- exported function signatures, interface definitions, class declarations, type aliases -- and strip all implementation code. Declaration maps (`declarationMap: true`) generate `.d.ts.map` files that allow IDE features like "Go to Definition" to navigate from the declaration back to the original `.ts` source, which is particularly valuable in monorepo setups using project references [20].

**Ambient declarations.** The `declare` keyword introduces type information without implementation. `declare function`, `declare class`, `declare const` describe values that exist at runtime but whose implementation is not available to the TypeScript compiler. `declare module "some-module"` provides types for a module specifier, enabling typing of third-party packages that lack their own declarations. `declare global { ... }` augments the global scope, adding properties to `Window`, `globalThis`, or other global objects [21].

**Module augmentation.** TypeScript's declaration merging allows augmenting existing module types from external declaration files. A file can `declare module "express"` and add new properties to Express's types without modifying the original package. This mechanism underpins the pattern used by Express middleware packages to extend the `Request` and `Response` interfaces [22].

**Triple-slash directives.** Before ES Module imports were available in declaration files, triple-slash directives (`/// <reference types="..." />`, `/// <reference path="..." />`, `/// <reference lib="..." />`) served as the mechanism for declaring dependencies between declaration files. While largely superseded by `import` statements, they remain necessary in certain contexts: `/// <reference types="node" />` is still used in declaration files that depend on Node.js's built-in type definitions, and `/// <reference lib="dom" />` is used to include specific lib definitions [23]. The TypeScript team has marked triple-slash reference type directives as "generally discouraged in favor of ECMAScript Module imports" [23].

### 4.5 DefinitelyTyped and the @types Ecosystem

DefinitelyTyped is a community-maintained GitHub repository containing type declarations for thousands of JavaScript packages that do not bundle their own types. As of 2026, it contains declarations for over 10,000 packages, making it one of the largest open-source collaboration projects in the TypeScript ecosystem [24].

The publication pipeline works as follows: contributors submit pull requests to the DefinitelyTyped repository with type declarations organized under `types/<package-name>/`. An automated tool called `types-publisher` packages these declarations and publishes them to npm under the `@types` scope (e.g., `@types/react`, `@types/node`, `@types/express`). TypeScript automatically discovers `@types` packages in `node_modules/@types/` and includes them in compilation without explicit configuration [24].

**typesVersions** allows a single `@types` package to provide different type declarations for different TypeScript versions. The `typesVersions` field in `package.json` maps TypeScript version ranges to directories containing version-specific declarations, enabling package maintainers to use newer TypeScript features in their declarations while maintaining backward compatibility with older compiler versions [25].

**Automatic type acquisition (ATA)** is a feature primarily used by editors and the TypeScript playground. When TypeScript detects a `require()` or `import` statement referencing a package without types, ATA automatically downloads the corresponding `@types` package to provide IntelliSense. ATA always downloads declarations for the latest version of the library, which can cause version mismatches in projects pinned to older dependency versions [26].

The long-term trajectory of DefinitelyTyped is uncertain. As more packages bundle their own TypeScript declarations (enabled by tools like tsup, tsdown, and TypeScript's own `declaration` output), the need for external `@types` packages diminishes. The JSR registry, launched in 2024, requires packages to include TypeScript types and does not support a separate `@types` mechanism [15].

### 4.6 Bundler Integration and the noEmit Pattern

The rise of transpile-only tools has fundamentally changed TypeScript's role in many build pipelines. Rather than using `tsc` as both type-checker and compiler, projects increasingly use fast transpilers for JavaScript output and reserve `tsc` for type-checking only.

**esbuild** (written in Go) provides built-in TypeScript syntax support, stripping type annotations without performing type-checking. It operates approximately 20-30x faster than `tsc` for transpilation. esbuild does not understand TypeScript-specific emit features like `const enum` inlining, decorator metadata emission, or namespace merging -- it performs straightforward syntax erasure [27].

**SWC** (written in Rust) follows the same pattern: it strips TypeScript syntax without type-checking, achieving comparable speedups. SWC powers the transpilation layer in Next.js and Parcel 2 [28].

**Vite** uses esbuild for development-time transpilation and Rollup for production bundling. Its documentation recommends running `tsc --noEmit --watch` in a separate process for type-checking during development [29].

**The noEmit pattern.** In these setups, `tsconfig.json` is configured with `noEmit: true`, telling `tsc` to perform type-checking without producing any JavaScript output. The bundler handles all file transformation and output. This separation has several consequences: TypeScript's emit-related options (`target`, `module`, `outDir`) become irrelevant for runtime behavior, but the `moduleResolution` setting remains critical because it determines how the type-checker resolves imports [11].

**The bundler moduleResolution mode** was introduced in TypeScript 5.0 specifically for this pattern. It tells the type-checker to use a resolution algorithm that matches what bundlers actually do: support `package.json` `exports`, allow extensionless relative imports, and permit mixing `import` and `require` within the same file. This mode should only be used when a bundler handles the actual module loading [11].

### 4.7 JSDoc Type Checking

TypeScript's type-checker can operate on plain JavaScript files without requiring any `.ts` files, using JSDoc annotations as the type declaration mechanism. This capability, stabilized across TypeScript 2.3 through 4.x, enables gradual adoption and serves projects that choose to avoid the TypeScript compilation step entirely [30].

Three levels of opt-in exist: per-line (`// @ts-ignore` to suppress, `// @ts-expect-error` to assert and suppress), per-file (`// @ts-check` to enable, `// @ts-nocheck` to disable), and project-wide (`checkJs: true` in `tsconfig.json`). The recommended migration strategy is an allowlist approach: keep `checkJs: false` globally and add `// @ts-check` to files as they are annotated, preventing an overwhelming flood of errors in large codebases [30].

JSDoc annotations support a substantial subset of TypeScript's type system: `@param`, `@returns`, `@type`, `@typedef`, `@template` (generics), `@implements`, `@extends`, and `@enum`. However, certain TypeScript features have no JSDoc equivalent -- conditional types, mapped types, and complex generic constraints require workarounds or separate `.d.ts` files. The approach has notable adopters: the Svelte framework's core library used JSDoc-annotated JavaScript for years, and the approach was famously endorsed by the DHH/Ruby on Rails community as an alternative to TypeScript compilation [31].

### 4.8 The esModuleInterop Problem

The interaction between CJS and ESM default exports is a persistent source of bugs and confusion. A CommonJS module that exports via `module.exports = function() {}` has no ES Module default export in the formal specification -- the entire `module.exports` object becomes the namespace object. However, developers expect `import fn from "cjs-module"` to bind `fn` to `module.exports`, not to `{ default: module.exports }` [32].

TypeScript's `esModuleInterop` flag (introduced in TypeScript 2.7) addresses this by emitting helper functions (`__importDefault`, `__importStar`) that check for the `__esModule` flag on CJS modules. If the flag is present (indicating the module was transpiled from ESM), the helper returns `module.exports.default`; otherwise, it returns `module.exports` directly. The companion `allowSyntheticDefaultImports` flag changes only the type-checker's behavior without affecting emit, allowing `import React from "react"` to type-check even when React's CJS export has no formal default export [32].

Using `allowSyntheticDefaultImports` without `esModuleInterop` is recognized as hazardous: it tells the type-checker that default imports will work, but the emitted JavaScript may not include the runtime helpers needed to make them actually work. TypeScript 6.0 has moved toward making `esModuleInterop` behavior the default, and a GitHub issue (#62529) tracks the discussion of deprecating the non-interop behavior entirely [33].

### 4.9 Node.js Native Type Stripping

Node.js v22.6.0 introduced `--experimental-strip-types`, which runs TypeScript files directly by stripping type annotations at runtime using a fast syntax-level transformation (powered by a fork of the `amaro` package, itself based on SWC). No type-checking is performed. Starting from Node.js v23.6.0, type stripping is enabled by default [34].

The feature has significant constraints. Since it performs only syntax erasure (not transformation), TypeScript constructs that require code generation -- `enum` declarations, `namespace` blocks with runtime code, constructor parameter properties (`constructor(private x: number)`) -- produce errors. The `erasableSyntaxOnly` flag in `tsconfig.json` (introduced in TypeScript 5.8) restricts the codebase to TypeScript features that can be erased without transformation, ensuring compatibility with Node.js type stripping [18][34].

The recommended `tsconfig.json` for Node.js type stripping combines `erasableSyntaxOnly: true` with `verbatimModuleSyntax: true`, ensuring that all TypeScript-specific syntax is erasable and all import/export statements are preserved exactly as written [34].

### 4.10 Import Attributes and the Future

The TC39 Import Attributes proposal (Stage 4) introduces a `with` clause on import statements that provides metadata about the imported module to the host:

```typescript
import data from "./config.json" with { type: "json" };
```

TypeScript 5.3 added support for import attributes syntax, preserving the `with` clause in emitted JavaScript and performing basic syntactic validation. TypeScript does not validate or process the attribute values -- it defers entirely to the runtime or bundler to interpret them [35].

Import attributes evolved from the earlier "import assertions" proposal (using `assert` instead of `with`), which TypeScript 4.5 implemented. Node.js 22 dropped support for `assert` syntax, and TypeScript 5.8 under `module: "nodenext"` errors on `assert` usage, requiring migration to `with` [18].

TypeScript 5.9 introduced support for `import defer` under `module: "nodenext"`, enabling deferred module loading for conditional or lazy initialization patterns. This aligns with a TC39 proposal for deferred module evaluation [36].

The TypeScript 7.0 compiler, rewritten in Go under the "Project Corsa" codename, is expected to maintain full compatibility with the module resolution and emit behaviors of the JavaScript-based compiler while delivering approximately 10x performance improvements. TypeScript 6.0, released in early 2026, represents the final version built on the JavaScript compiler and includes no new module resolution modes, focusing instead on preparing the ecosystem for the native rewrite [37].

## 5. Comparative Synthesis

The following table summarizes the key characteristics of TypeScript's module resolution modes:

| Characteristic | `classic` | `node10` | `node16`/`nodenext` | `bundler` |
|---|---|---|---|---|
| **Era** | 2012--2015 | 2015--2022 | 2022-- | 2023-- |
| **Extension required (relative)** | No | No | ESM: Yes; CJS: No | No |
| **`package.json` `exports`** | No | No | Yes | Yes |
| **`package.json` `imports`** | No | No | Yes | Yes |
| **Directory index resolution** | No | Yes | CJS: Yes; ESM: No | Yes |
| **`node_modules` lookup** | No | Yes | Yes | Yes |
| **Mixed CJS/ESM in same project** | N/A | No (CJS only) | Yes | Yes |
| **Matches a real runtime** | No | Node.js CJS | Node.js CJS+ESM | No (bundler-dependent) |
| **Recommended use** | Legacy only | Legacy Node.js | Node.js direct execution | Bundled applications |

The tension between `node16`/`nodenext` and `bundler` represents the central trade-off in contemporary TypeScript configuration. `node16`/`nodenext` accurately models a real runtime and enforces constraints (file extensions, no directory index in ESM) that guarantee the emitted JavaScript will work in Node.js. `bundler` relaxes these constraints to match what bundlers actually support, but the emitted JavaScript may not run directly in any runtime without bundler processing. Andrew Branch's analysis concludes that `nodenext` is the safer default for library authors because it prevents emitting code that crashes in Node.js, even if the library is also consumed by bundlers [38].

## 6. Open Problems and Gaps

### 6.1 Configuration Complexity

The number of interacting compiler options related to modules remains high: `module`, `moduleResolution`, `target`, `esModuleInterop`, `allowSyntheticDefaultImports`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly`, `resolveJsonModule`, `allowImportingTsExtensions`, `rewriteRelativeImportExtensions`, `paths`, `baseUrl`, `rootDirs`, `typeRoots`, `types`. Incorrect combinations produce confusing errors or, worse, silent type-checking inaccuracies. The TypeScript team's documentation on choosing compiler options acknowledges this complexity but has not reduced the option surface area [8].

### 6.2 Dual Package Publishing Friction

Despite improvements in tooling (tsup, tshy, tsdown) and runtime support (`require(esm)` in Node.js 22+), publishing packages that work correctly for both CJS and ESM consumers remains a multi-step process involving conditional exports, separate declaration files, and careful testing across resolution modes. The "Are the Types Wrong?" tool continues to find issues in nearly a third of popular typed packages [16]. There is no consensus on whether the ecosystem should abandon CJS entirely or maintain dual support indefinitely.

### 6.3 Declaration File Accuracy

Declaration files are the weak link in TypeScript's type safety chain. Hand-written `.d.ts` files in DefinitelyTyped may drift from the libraries they describe, especially when library versions are updated without corresponding type updates. Automatically generated `.d.ts` files are accurate but may expose internal types that the library author did not intend to be part of the public API. The `@types` versioning model (where `@types/foo@1.2.3` is expected to match `foo@1.2.x`) is a convention, not an enforced constraint [24].

### 6.4 The Bundler Abstraction Gap

The `bundler` module resolution mode is an approximation. Each bundler (webpack, Rollup, esbuild, Vite, Parcel) implements slightly different resolution behavior -- different condition priorities in `exports`, different handling of symlinks, different support for `package.json` `imports`. TypeScript's `bundler` mode cannot model all of these differences, creating potential mismatches between type-checker resolution and runtime resolution [11].

### 6.5 Type Stripping Limitations

Node.js native type stripping's restriction to erasable syntax only (`erasableSyntaxOnly`) excludes `enum`, `namespace`, and parameter properties -- features with significant adoption in existing TypeScript codebases. Migration away from these features is non-trivial for large projects. The long-term question is whether these features become effectively deprecated as Node.js type stripping gains adoption [34].

### 6.6 The Go Rewrite's Module Implications

TypeScript 7.0's Go-based compiler must reproduce the exact module resolution behavior of the JavaScript compiler across all five `moduleResolution` modes, including edge cases in `exports` field resolution, `typesVersions` handling, and path mapping. Any behavioral divergence would break existing projects. The TypeScript team has stated full compatibility as a goal, but the complexity of the module resolution logic makes this one of the most challenging aspects of the rewrite [37].

## 7. Conclusion

TypeScript's module system is not a designed system so much as an evolving response to the JavaScript ecosystem's own module story. Each new runtime behavior, bundler innovation, or TC39 proposal has required TypeScript to add configuration options, resolution modes, or syntactic features to maintain accurate type-checking. The result is a system of considerable power and considerable complexity.

The trajectory is toward convergence on ES Modules as the primary format, with CommonJS support maintained for backward compatibility. Node.js's addition of `require(esm)` and native type stripping, TypeScript 5.0's `bundler` resolution mode, and the `verbatimModuleSyntax` flag all move in the direction of simplifying the module story by reducing the number of cases that need special handling. The TC39 import attributes proposal establishes a standard mechanism for module metadata that TypeScript can pass through without interpretation.

The fundamental tension, however, remains: TypeScript must model the behavior of hosts it does not control, and the JavaScript ecosystem continues to evolve. As long as multiple module formats, resolution algorithms, and runtime environments coexist, TypeScript's module configuration will reflect that plurality. The challenge for the TypeScript team, and for the broader ecosystem, is to manage this complexity without sacrificing the type safety guarantees that motivate TypeScript's existence.

## References

[1] Auth0 Engineering. "JavaScript Module Systems Showdown: CommonJS vs AMD vs ES2015." Auth0 Blog. https://auth0.com/blog/javascript-module-systems-showdown/

[2] TypeScript Documentation. "Modules -- Theory." TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/modules/theory.html

[3] Node.js Documentation. "Modules: CommonJS modules." Node.js v22.x Documentation. https://nodejs.org/api/modules.html

[4] Dixin. "Understanding (all) JavaScript Module Formats and Tools." https://weblogs.asp.net/dixin/understanding-all-javascript-module-formats-and-tools/

[5] SystemJS. "Dynamic ES Module Loader." GitHub Repository. https://github.com/systemjs/systemjs

[6] MDN Web Docs. "JavaScript Modules." Mozilla Developer Network. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules

[7] Node.js Documentation. "Modules: Packages." Node.js v22.x Documentation. https://nodejs.org/api/packages.html

[8] TypeScript Documentation. "Modules -- Choosing Compiler Options." TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html

[9] TypeScript Documentation. "TSConfig Reference: moduleResolution." https://www.typescriptlang.org/tsconfig/moduleResolution.html

[10] TypeScript Documentation. "Modules -- Reference." TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/modules/reference.html

[11] Ayc0. "TypeScript 5.0: new mode bundler & ESM." https://ayc0.github.io/posts/typescript-50-new-mode-bundler-esm/

[12] TypeScript Documentation. "TypeScript 3.8 Release Notes." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html

[13] TypeScript Documentation. "TSConfig Reference: verbatimModuleSyntax." https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html

[14] TypeScript Documentation. "TSConfig Reference: isolatedModules." https://www.typescriptlang.org/tsconfig/isolatedModules.html

[15] Liran Tal. "TypeScript in 2025 with ESM and CJS npm publishing is still a mess." https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing

[16] Andrew Branch. "Are the Types Wrong?" https://arethetypeswrong.github.io/

[17] TypeScript Documentation. "TSConfig Reference: paths." https://www.typescriptlang.org/tsconfig/paths.html

[18] TypeScript Blog. "Announcing TypeScript 5.8." Microsoft DevBlogs. https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/

[19] Matt Pocock. "Modules, Scripts, and Declaration Files." Total TypeScript. https://www.totaltypescript.com/books/total-typescript-essentials/modules-scripts-and-declaration-files

[20] TypeScript Documentation. "TSConfig Reference: declarationMap." https://www.typescriptlang.org/tsconfig/declarationMap.html

[21] Convex TypeScript Guide. "Declare." https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-declare

[22] TypeScript Documentation. "Declaration Merging." TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/declaration-merging.html

[23] TypeScript Documentation. "Triple-Slash Directives." TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html

[24] DefinitelyTyped. GitHub Repository. https://github.com/DefinitelyTyped/DefinitelyTyped

[25] TypeScript Documentation. "Publishing Declaration Files." TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html

[26] TypeScript Documentation. "TSConfig Reference: typeAcquisition." https://www.typescriptlang.org/tsconfig/typeAcquisition.html

[27] esbuild Documentation. "FAQ: TypeScript." https://esbuild.github.io/faq/

[28] Steve Kinney. "Traditional approach -- does everything." React with TypeScript. https://stevekinney.com/courses/react-typescript/build-pipeline-tsc-swc

[29] Vite Documentation. "Features: TypeScript." https://vite.dev/guide/features

[30] TypeScript Documentation. "Type Checking JavaScript Files." TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html

[31] Sam Thorogood. "Check your JS with TS." https://samthor.au/2021/check-js-with-ts/

[32] TypeScript Documentation. "TSConfig Reference: esModuleInterop." https://www.typescriptlang.org/tsconfig/esModuleInterop.html

[33] Microsoft/TypeScript. "esModuleInterop and allowSyntheticDefaultImports in TypeScript 6.0+." GitHub Issue #62529. https://github.com/microsoft/TypeScript/issues/62529

[34] Node.js Documentation. "Modules: TypeScript." https://nodejs.org/api/typescript.html

[35] TypeScript Documentation. "TypeScript 5.3 Release Notes." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-3.html

[36] TypeScript Documentation. "TypeScript 5.9 Release Notes." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html

[37] InfoQ. "TypeScript 6 Beta Released: Developers Invited to Upgrade to Prepare for the Go Rewrite." https://www.infoq.com/news/2026/02/typescript-6-released-beta/

[38] Andrew Branch. "Is nodenext right for libraries that don't target Node.js?" https://blog.andrewbran.ch/is-nodenext-right-for-libraries-that-dont-target-node-js/

## Practitioner Resources

- **TypeScript Module Documentation (rewritten 2023):** https://www.typescriptlang.org/docs/handbook/modules/theory.html -- Andrew Branch's comprehensive rewrite of the modules documentation, covering theory, reference, and practical guides
- **Are the Types Wrong?:** https://arethetypeswrong.github.io/ -- Diagnostic tool for analyzing npm package type correctness across module resolution modes
- **TSConfig Cheat Sheet (Total TypeScript):** https://www.totaltypescript.com/tsconfig-cheat-sheet -- Opinionated quick reference for tsconfig settings
- **Node.js Packages Documentation:** https://nodejs.org/api/packages.html -- Authoritative reference for `package.json` `exports`, `imports`, `type` field, and dual-package publishing
- **TC39 Import Attributes Proposal:** https://github.com/tc39/proposal-import-attributes -- Specification repository for the import attributes proposal
- **DefinitelyTyped Contribution Guide:** https://github.com/DefinitelyTyped/DefinitelyTyped#readme -- Instructions for contributing type declarations to the @types ecosystem
- **tsup:** https://tsup.egoist.dev/ -- Zero-config TypeScript bundler powered by esbuild, widely used for dual CJS/ESM package publishing
- **Better Stack: Understanding Module Resolution in TypeScript:** https://betterstack.com/community/guides/scaling-nodejs/typescript-module-resolution/ -- Practical walkthrough of resolution strategies with examples
- **2ality: Publishing ESM-based npm packages with TypeScript:** https://2ality.com/2025/02/typescript-esm-packages.html -- Dr. Axel Rauschmayer's tutorial on modern ESM package publishing
- **TypeScript 5.x to 6.0 Migration Guide:** https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f -- Community-maintained migration guide covering module-related breaking changes
