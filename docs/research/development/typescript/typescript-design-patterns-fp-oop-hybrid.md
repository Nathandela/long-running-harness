---
title: "TypeScript Design Patterns and FP/OOP Hybrid"
date: 2026-03-25
summary: "A survey of design patterns in TypeScript's multi-paradigm environment, covering discriminated unions, branded types, algebraic data types, functional programming patterns, OOP adaptations, the Expression Problem, and state machine encoding."
keywords: [typescript, design-patterns, functional-programming, algebraic-data-types, discriminated-unions]
---

# TypeScript Design Patterns and FP/OOP Hybrid

*2026-03-25*

## Abstract

TypeScript occupies a distinctive position among programming languages: a gradually typed superset of JavaScript whose structural type system supports object-oriented class hierarchies, discriminated union types, higher-order functions, and sophisticated generic constraints within a single coherent framework. This multi-paradigm capacity has produced a rich and sometimes competing ecosystem of design patterns drawn from both functional programming and object-oriented traditions. Discriminated unions serve as TypeScript's approximation of algebraic data types, enabling exhaustive pattern matching through the `never` type. Branded types simulate nominal typing via intersection-based phantom properties, enforcing domain invariants at compile time without runtime cost. The Expression Problem --- the challenge of simultaneously extending a system with new data variants and new operations --- manifests differently depending on whether developers choose union-based or class-based architectures. Libraries such as fp-ts, Effect, and neverthrow bring monadic error handling, function composition via `pipe`/`flow`, and optics to the TypeScript ecosystem, while traditional OOP patterns --- factories, builders, strategies, and dependency injection --- are adapted to leverage generics and structural typing rather than reflection. State machine encoding through the typestate pattern uses the type system itself to make invalid state transitions unrepresentable. This survey maps the full landscape of these patterns, examines their trade-offs, and identifies the open problems --- from the stalled TC39 pattern matching proposal to the absence of native higher-kinded types --- that shape the field's trajectory.

---

## 1. Introduction

### 1.1 Problem Statement

The design of software systems requires choosing patterns that manage complexity, enforce correctness, and remain maintainable as requirements evolve. In statically typed languages, the type system can serve as a powerful ally in this effort, encoding invariants that the compiler checks automatically. However, the expressiveness of the available patterns depends heavily on the features the type system provides. TypeScript's type system --- structural, with union types, intersection types, conditional types, mapped types, and template literal types --- offers an unusually flexible substrate for pattern design, but this flexibility comes with a challenge: the sheer number of available approaches can make it difficult to determine which pattern best fits a given problem.

The functional programming community and the object-oriented programming community have each developed mature pattern vocabularies, but these vocabularies were designed for different type system contexts. Haskell's algebraic data types and type classes assume nominal typing with exhaustive pattern matching built into the language. Java's Gang of Four patterns assume class-based inheritance with single dispatch. TypeScript's structural type system, lack of native pattern matching, and hybrid class/function paradigm mean that patterns from both traditions must be adapted, and the adaptations interact in ways that neither tradition fully anticipates.

### 1.2 Scope

This survey covers design patterns that leverage TypeScript's type system as it exists through TypeScript 5.7 (released late 2025), with discussion of ecosystem libraries (fp-ts v2, Effect v3, neverthrow, ts-pattern, monocle-ts) and relevant language proposals (TC39 pattern matching, Stage 1). The primary axes of analysis are:

- **Data modelling**: Discriminated unions, branded types, phantom types, and algebraic data type encoding
- **The Expression Problem**: How unions and classes address different extensibility axes
- **Composition mechanisms**: Mixins, interface merging, and composition over inheritance
- **Functional patterns**: Monadic error handling, function composition, immutability, and optics
- **OOP adaptations**: Factories, builders, strategies, and dependency injection without reflection
- **State encoding**: Typestate pattern, assertion functions, and state machine typing
- **Error handling**: Discriminated union errors, Result types, exceptions, and cause chaining
- **Encapsulation**: Module patterns, private fields, and symbol-keyed properties
- **Pattern matching**: tc39 proposal status, ts-pattern, and current workarounds

Runtime performance characteristics, bundler integration, and framework-specific patterns (React, Angular, Vue) fall outside this survey's scope except where they directly illuminate type system considerations.

### 1.3 Key Definitions

**Discriminated union**: A union type where each constituent has a common literal-typed property (the discriminant or tag) that TypeScript uses for control-flow-based type narrowing [TypeScript Handbook: Narrowing].

**Branded type**: A type formed by intersecting a base type with a phantom property (e.g., `number & { __brand: 'USD' }`), simulating nominal typing within TypeScript's structural type system [Goldberg 2022].

**Algebraic data type (ADT)**: A composite type formed by sum types (disjoint unions of variants) and product types (records/tuples). In TypeScript, sum types are modelled as discriminated unions and product types as interfaces or tuple types.

**Typestate**: A programming pattern where the type of an object changes as operations are performed on it, encoding protocol or state machine constraints at the type level [Strom and Yemini 1986].

**Expression Problem**: The challenge, named by Wadler [1998], of defining a datatype by cases such that new cases and new functions over the datatype can be added without recompiling existing code and while retaining static type safety.

---

## 2. Foundations

### 2.1 TypeScript's Structural Type System

TypeScript employs structural subtyping: two types are compatible if their structures are compatible, regardless of explicit declarations. A value of type `{ x: number; y: number }` satisfies any interface or type alias requiring those properties, even without an explicit `implements` clause. This stands in contrast to the nominal type systems of Java, C#, or Rust, where a type must explicitly declare its relationship to an interface or trait.

Structural typing profoundly shapes which patterns are natural in TypeScript. It makes the classic visitor pattern less necessary --- discriminated unions with switch statements achieve the same exhaustive dispatch without the ceremony of accept/visit methods. It makes dependency injection possible without reflection, since any object matching the required interface satisfies the dependency. And it creates the problem that branded types exist to solve: without nominal distinctions, a `UserId` and a `ProductId` that are both `string` are interchangeable.

### 2.2 Union Types and Type Narrowing

TypeScript's union types (`A | B | C`) are the foundation of its approach to algebraic data types. The compiler's control flow analysis narrows union types based on type guards --- `typeof` checks, `instanceof` checks, `in` operator checks, and discriminant property checks --- enabling safe access to variant-specific properties after narrowing.

The critical mechanism for exhaustive handling is the `never` type. In a switch statement over a discriminated union, if all variants are handled, the variable in the `default` case has type `never`. Assigning it to a `never`-typed variable (or passing it to an `assertNever` function) produces a compile-time error if a variant is unhandled:

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.radius ** 2;
    case 'square': return s.side ** 2;
    default: const _exhaustive: never = s; return _exhaustive;
  }
}
```

Adding a `triangle` variant to `Shape` immediately produces a type error at the `default` case, forcing the developer to handle the new variant. This compiler-enforced exhaustiveness is the primary mechanism by which TypeScript approximates the pattern matching of Haskell or Rust [TypeScript Handbook: Narrowing].

### 2.3 Generics and Conditional Types

TypeScript's generic system supports bounded polymorphism (`<T extends Constraint>`), default type parameters, and conditional types (`T extends U ? X : Y`). Conditional types enable type-level computation: extracting return types, inferring tuple element types, and distributing over unions. Mapped types (`{ [K in keyof T]: ... }`) transform object types property by property.

These mechanisms underpin many of the patterns surveyed here. The builder pattern uses generic accumulation to track which properties have been set. Branded types use intersection with phantom properties that conditional types can detect. Monad implementations use higher-kinded type encodings that push the limits of what conditional types and interface merging can express.

### 2.4 Comparison with Haskell and Rust ADTs

Haskell's algebraic data types and Rust's enums are first-class language constructs with native pattern matching, exhaustiveness checking, and --- in Rust's case --- ownership-aware destructuring. TypeScript's discriminated unions approximate these features using the structural type system and control flow analysis, but with notable differences:

| Feature | Haskell | Rust | TypeScript |
|---------|---------|------|-----------|
| Sum type syntax | `data Maybe a = Nothing \| Just a` | `enum Option<T> { None, Some(T) }` | `type Maybe<T> = { tag: 'nothing' } \| { tag: 'just'; value: T }` |
| Pattern matching | Native `case` / function equations | Native `match` expression | `switch` on discriminant / ts-pattern library |
| Exhaustiveness | Compiler-enforced (with `-Wall`) | Compiler-enforced | Via `never` type in `default` / `ts-pattern .exhaustive()` |
| Data attached to variants | Constructor arguments | Enum variant fields | Object properties per union member |
| Nested pattern matching | Native, deep destructuring | Native, deep destructuring | Manual via nested `switch` or ts-pattern |
| Nominal vs structural | Nominal | Nominal | Structural (discriminant is by convention) |

The structural nature of TypeScript's unions means the discriminant property name is a convention, not a language requirement. Any shared literal-typed property serves as a discriminant. This flexibility is a strength --- it enables discriminating on existing properties like `status` or `type` without wrapper types --- but it also means there is no single canonical encoding, increasing cognitive load across codebases [Basarat, TypeScript Deep Dive].

---

## 3. Taxonomy of Approaches

The patterns surveyed here can be organized along two axes: the **paradigm** they originate from (functional, object-oriented, or hybrid) and the **problem domain** they address (data modelling, extensibility, error handling, state management, or encapsulation).

| Pattern | Paradigm | Problem Domain | Key Mechanism |
|---------|----------|---------------|---------------|
| Discriminated unions | Functional | Data modelling | Tagged unions + `never` exhaustiveness |
| Branded/phantom types | Hybrid | Data modelling | Intersection branding |
| Visitor pattern | OOP | Extensibility (new operations) | Double dispatch via accept/visit |
| Union + switch | Functional | Extensibility (new operations) | Exhaustive switch |
| Class hierarchies | OOP | Extensibility (new variants) | Inheritance + polymorphism |
| Mixins | Hybrid | Composition | Class expression pattern |
| Option/Result monads | Functional | Error handling | fp-ts / Effect / neverthrow |
| pipe/flow composition | Functional | Composition | Point-free function chaining |
| Lenses/optics | Functional | Immutable data access | monocle-ts / @fp-ts/optic |
| Factory with generics | OOP | Object creation | Generic type inference |
| Builder with fluent API | OOP | Object creation | Generic state accumulation |
| Strategy with callbacks | Hybrid | Behaviour parameterization | First-class functions |
| Typestate | Hybrid | State management | Generic type parameters encoding state |
| DI without reflection | Hybrid | Decoupling | Structural typing + factories |
| ts-pattern matching | Functional | Control flow | Library-level exhaustive matching |

---

## 4. Analysis

### 4.1 Discriminated Unions and Algebraic Data Types

Discriminated unions are the idiomatic TypeScript encoding of sum types. The pattern consists of a union of object types sharing a common property with literal type values. TypeScript's control flow analysis narrows the union upon checking this discriminant, granting access to variant-specific fields.

The pattern is pervasive in practice: React's `useReducer` actions, Redux action types, API response modelling, and AST node representations all use discriminated unions. The `switch`-based pattern matching approach, combined with the `never`-based exhaustiveness check, provides the closest equivalent to Haskell's `case` expression or Rust's `match`.

However, TypeScript's discriminated unions differ from true ADTs in important ways. First, they are structurally typed: any object with the right shape satisfies the union, which can lead to accidental membership. Second, nested pattern matching requires manual destructuring or library support. Third, there is no native syntax for binding variables during matching --- the developer must access properties after narrowing. Fourth, the discriminant must be a property of a literal type; arbitrary predicates cannot serve as discriminants without type guard functions.

The ts-pattern library (by Gabriel Vergnaud) addresses several of these limitations. Its `.match().with().exhaustive()` API provides nested destructuring, guard predicates (`P.when()`), value extraction (`P.select()`), and compile-time exhaustiveness checking in a fluent chain. The library compiles to approximately 2kB of runtime code. Its existence as a userland library rather than a language feature illustrates both TypeScript's extensibility and the gap between what the type system can express and what the language syntax supports [Vergnaud, ts-pattern GitHub].

### 4.2 Branded and Phantom Types

TypeScript's structural type system treats all `string` values as interchangeable and all `number` values as interchangeable. Branded types introduce nominal distinctions by intersecting a base type with a phantom property:

```typescript
type USD = number & { readonly __brand: unique symbol };
type EUR = number & { readonly __brand: unique symbol };

function createUSD(amount: number): USD {
  if (amount < 0) throw new Error('Negative amount');
  return amount as USD;
}
```

The `__brand` property exists only in the type system; it has no runtime representation. The `as` assertion at the construction boundary is the controlled point of unsafety, typically guarded by validation logic. After construction, the branded value carries its type through the program, and the compiler prevents mixing `USD` with `EUR` or with plain `number`.

Four implementation strategies exist in the literature, with increasing type safety:

1. **String literal brand**: `number & { __brand: 'USD' }`. Simple but the brand property is visible in autocomplete and type display.
2. **Unique symbol brand**: Uses `declare const brand: unique symbol` to create an invisible type marker. The brand does not appear in property listings.
3. **Type predicate validation**: Functions returning `value is USD` that narrow within conditionals, requiring explicit checking at usage sites.
4. **Assertion function validation**: Functions with `asserts value is USD` return type that throw on failure and narrow unconditionally after the call.

Phantom types extend this idea by adding type parameters that have no runtime representation but encode compile-time information. A common application is state machines: `Connection<'open'>` vs `Connection<'closed'>` are distinct types despite identical runtime structure, allowing the type system to enforce that only open connections can send data [Beraliv 2021; Learning TypeScript: Branded Types].

The `ts-brand` library by Kourge provides reusable utilities for branding, including a `Brand<Base, Branding>` generic type and a `make` function that encapsulates the assertion boundary.

### 4.3 The Expression Problem in TypeScript

The Expression Problem, named by Wadler in a 1998 email to a mailing list on adding generics to Java, asks whether a language allows both new data variants and new operations to be added to an existing system without modifying existing code and without sacrificing static type safety [Wadler 1998; Eli Bendersky 2016].

In TypeScript, the two extensibility axes map to different architectural choices:

**Adding new variants (easy with classes, hard with unions)**: A class hierarchy with a base interface allows new subclasses to be added freely. Existing code that accepts the base interface continues to work. However, adding a new operation requires modifying the base interface and all existing classes.

**Adding new operations (easy with unions, hard with classes)**: A discriminated union with switch-based dispatch allows new functions to be written over the existing variants without modifying them. However, adding a new variant requires updating every function that switches on the union.

The **visitor pattern** attempts to address the OOP side: by extracting operations into visitor classes, new operations can be added without modifying the data types. However, the visitor interface must enumerate all variants, so adding a new variant still requires updating the visitor interface and all existing visitors. In TypeScript, the visitor pattern is heavier than in Java because JavaScript lacks true method overloading; dispatch must be handled through explicit method names or property discrimination [Vasiltsov 2021; Refactoring Guru: Visitor in TypeScript].

Neither approach fully solves the Expression Problem in TypeScript. The closest approximation involves a combination of techniques: open-ended union types (using module augmentation and declaration merging to extend a union after the fact), protocol-based dispatch (using a registry object mapping variant tags to handler functions), or the "finally tagless" encoding adapted from functional programming. Each approach sacrifices some degree of either type safety or convenience.

The practical guidance in the TypeScript community is architectural: choose unions when the set of variants is closed and operations will grow, choose classes when the set of variants is open and the operation set is stable. This is a design-time decision rather than a language-level solution [Fillo 2023; ZenStack: Visitor Pattern Reflection].

### 4.4 Mixins and Composition

TypeScript supports mixins through the class expression pattern, where a mixin is a function that takes a constructor and returns a new class extending it:

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
  };
}

function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;
    activate() { this.isActive = true; }
  };
}

class User extends Timestamped(Activatable(class {})) {
  name: string;
  constructor(name: string) { super(); this.name = name; }
}
```

This pattern enables composition of behaviors without multiple inheritance, which JavaScript does not support. The TypeScript compiler correctly infers the intersection of all mixed-in properties on the resulting class.

**Constrained mixins** add generic bounds to require that the base class satisfy certain interfaces, enabling mixins that depend on properties provided by other mixins or the base class. **Declaration merging** --- TypeScript's ability to merge interface declarations with the same name --- complements mixins by allowing type augmentation after the fact.

However, mixins have documented limitations. Abstract classes with protected members create type compatibility issues when used as mixin bases, because TypeScript's structural typing becomes nominal for protected properties (the compiler checks that protected members come from the same declaration chain) [TypeScript GitHub Issue #29653]. The `this` type within mixins can be difficult to constrain correctly. And the interaction between mixins and decorator metadata (used by some DI frameworks) is fragile.

The broader pattern of **composition over inheritance** in TypeScript often takes a simpler form than class-based mixins: plain object composition using interfaces, factory functions that close over shared state, or the `Object.assign`-based merge pattern. These approaches avoid the complexity of class expression mixins while achieving similar goals [TypeScript Handbook: Mixins].

### 4.5 Functional Programming Patterns

#### 4.5.1 Option/Result Monads

Three libraries dominate typed functional error handling in TypeScript:

**fp-ts** (by Giulio Canti) provides a comprehensive functional programming toolkit including `Option<A>` (values that may be absent), `Either<E, A>` (computations that may fail with a typed error), `Task<A>` (lazy async computations), and `TaskEither<E, A>` (async computations that may fail). fp-ts implements higher-kinded types through a module-level encoding (`URI` type tag + `HKT` type), working around TypeScript's lack of native HKT support. The library provides type classes (`Functor`, `Applicative`, `Monad`, `Foldable`, `Traversable`) with lawful implementations [Canti, fp-ts GitHub; fp-ts Documentation].

**Effect** (formerly Effect-TS, v3 stable) is a more comprehensive framework built around the `Effect<A, E, R>` type, where `A` is the success type, `E` is the error type, and `R` is the requirements (dependency context) type. Effect provides built-in dependency injection through its `Context` and `Layer` system, structured concurrency, resource management, and retry/timeout combinators. The error channel `E` carries tagged error types, making every possible failure explicit in function signatures. Effect has seen adoption by companies including Vercel and Prisma [Effect-TS Documentation; Effect-TS in 2026, DEV Community].

**neverthrow** takes a minimalist approach, providing only a `Result<T, E>` type with `ok()` and `err()` constructors, `.map()`, `.mapErr()`, `.andThen()`, and `.match()` methods. Its simplicity makes it suitable for projects that want typed error handling without adopting an entire functional programming framework [neverthrow GitHub].

The choice among these libraries reflects a fundamental trade-off documented in the literature. Harbor's engineering team articulated it explicitly: Effect's theoretical advantages in composability and type safety come at the cost of ecosystem integration friction (bridging between Effect-aware and Promise-based code), a steep learning curve, and a constrained hiring pool. Their team adopted neverthrow and ts-pattern as lighter-weight alternatives that provide FP benefits without framework lock-in [Harbor Engineering Blog, November 2025].

#### 4.5.2 Function Composition: pipe and flow

fp-ts provides two primary composition mechanisms. `pipe(value, f, g, h)` threads a value through a sequence of unary functions, equivalent to `h(g(f(value)))`. `flow(f, g, h)` produces a new function that is the left-to-right composition of its arguments, equivalent to Haskell's composition operator but in reverse order. Both mechanisms are typesafe: the compiler verifies that each function's return type matches the next function's input type [fp-ts: function.ts module; This Dot Labs: pipe and flow].

The `pipe` pattern has become idiomatic beyond fp-ts. Effect uses it as its primary API surface, and many TypeScript developers use standalone pipe implementations for general function composition. The pattern compensates for JavaScript's lack of a pipeline operator (`|>`), which remains at TC39 Stage 2.

#### 4.5.3 Immutability Patterns

TypeScript provides several mechanisms for encoding immutability:

- `readonly` property modifier: Prevents reassignment of individual properties at the type level.
- `Readonly<T>` utility type: Makes all properties of `T` readonly (shallow).
- `ReadonlyArray<T>` / `readonly T[]`: Array type without mutating methods (`push`, `pop`, `splice` are absent from the type).
- `ReadonlyMap<K, V>` and `ReadonlySet<T>`: Collection types without mutating methods.
- `as const` assertions: Infer the narrowest possible type, making all properties readonly and all values literal types.
- `Object.freeze()`: Runtime immutability (shallow). TypeScript types `Object.freeze<T>(obj: T)` as returning `Readonly<T>`.

Deep immutability requires recursive type definitions. A common utility type is `DeepReadonly<T>`, which recursively applies `Readonly` to all nested objects. This is purely a compile-time construct with zero runtime overhead, unlike `Object.freeze()` which incurs runtime cost for each frozen object and only freezes shallowly [Medium: Rashed Alam on readonly; Dale Jefferson: Object.freeze and Readonly].

#### 4.5.4 Lenses and Optics

**monocle-ts** (by Giulio Canti) ports Scala's Monocle library to TypeScript, providing composable optics for immutable data access: `Lens` (total getter/setter), `Optional` (getter that may fail), `Prism` (variant-selecting optic for sum types), `Traversal` (multi-focus optic), and `Iso` (bidirectional transformation). Lenses compose via `.compose()` or through fp-ts's `pipe`, enabling deep immutable updates without spread-operator nesting:

```typescript
import * as L from 'monocle-ts/Lens';
import { pipe } from 'fp-ts/function';

const streetName = pipe(
  L.id<Person>(),
  L.prop('address'),
  L.prop('street'),
  L.prop('name')
);
```

The `@fp-ts/optic` library, also by Canti, is a more recent alternative porting ZIO Optics (from the Scala ZIO ecosystem) with an API designed for Effect integration [monocle-ts GitHub; @fp-ts/optic GitHub; Solomon, Optics in TypeScript].

### 4.6 OOP Patterns Adapted

#### 4.6.1 Factory Patterns with Generics

TypeScript's generic inference allows factory functions to return precisely typed results without the consumer specifying type arguments:

```typescript
function createStore<T>(initial: T) {
  let state = initial;
  return {
    get: (): T => state,
    set: (next: T): void => { state = next; },
  };
}

const numStore = createStore(42); // inferred as { get: () => number; set: (next: number) => void }
```

Generic factories replace the abstract factory pattern of classical OOP: the generic parameter serves the role that the abstract product type plays in the Gang of Four formulation. Since TypeScript generics are erased at compile time, there is no runtime overhead from the generic parameterization [Refactoring Guru: Factory Method in TypeScript; CopyProgramming: TypeScript Factory Pattern 2026].

#### 4.6.2 Builder Pattern with Fluent Interfaces

The builder pattern in TypeScript can leverage generics to provide compile-time tracking of which properties have been set, preventing construction of incomplete objects:

```typescript
class RequestBuilder<T extends Record<string, unknown> = {}> {
  private data: T;
  constructor(data: T = {} as T) { this.data = data; }
  url<U extends string>(url: U) {
    return new RequestBuilder({ ...this.data, url });
  }
  method<M extends string>(method: M) {
    return new RequestBuilder({ ...this.data, method });
  }
  build(this: RequestBuilder<{ url: string; method: string }>): Request {
    return new Request(this.data.url, { method: this.data.method });
  }
}
```

The `build` method's `this` parameter constrains the builder to a state where both `url` and `method` have been set. Calling `build()` without those properties produces a type error. This is a form of typestate encoding applied to the builder pattern [Scott Logic: TypeScript Builders; Kravchenko: Type-Safe Object Builder; Sammons: Fluent Interface with Generics].

The Vattenfall engineering team has argued that the builder pattern is often unnecessary in TypeScript because the language natively supports optional properties and default values in object literals, with the compiler enforcing required property presence. The builder adds value primarily when construction involves validation, side effects, or complex conditional logic [Vattenfall Tech Blog, 2025].

#### 4.6.3 Strategy Pattern with Type-Safe Callbacks

In classical OOP, the strategy pattern extracts a family of algorithms into separate classes implementing a common interface. In TypeScript/JavaScript, since functions are first-class values, the strategy pattern reduces to passing callback functions:

```typescript
type SortStrategy<T> = (a: T, b: T) => number;

function sortedBy<T>(items: T[], strategy: SortStrategy<T>): T[] {
  return [...items].sort(strategy);
}
```

The type signature enforces that the strategy accepts the same type as the array elements and returns a number. No interface declaration, no strategy class hierarchy --- the function type itself is the contract. This simplification is characteristic of TypeScript pattern adaptation: many OOP patterns that exist to simulate first-class functions in Java/C# become trivial in a language that has them natively [Refactoring Guru: Strategy in TypeScript; Visual Studio Magazine: Strategy Pattern and Callbacks].

#### 4.6.4 Dependency Injection Without Reflection

TypeScript's structural type system enables dependency injection without the reflection metadata that Java-style DI containers require. A service can declare its dependencies as constructor parameters typed by interfaces, and any object structurally matching those interfaces satisfies the dependency:

```typescript
interface Logger { log(msg: string): void; }
interface Database { query(sql: string): Promise<unknown[]>; }

class UserService {
  constructor(private logger: Logger, private db: Database) {}
}
```

No decorators, no `@Injectable()`, no `reflect-metadata` --- the type checker ensures the injected objects have the required shape. For production wiring, a composition root (a single function or module that assembles the dependency graph) replaces the DI container.

Libraries exist across the spectrum. **InversifyJS** uses decorators and metadata for a Spring-like experience. **tsyringe** (Microsoft) uses decorators with lighter configuration. **Awilix** avoids decorators entirely, using explicit registration with a functional API. **typed-inject** uses TypeScript's type system to verify the dependency graph at compile time without any decorators or metadata, representing the furthest point on the "no reflection" axis [InversifyJS docs; tsyringe GitHub; npm-compare: DI containers; Vady: DI Benchmark].

### 4.7 State Machine Encoding and the Typestate Pattern

The typestate pattern uses type parameters to encode the current state of an object, with method signatures constrained to specific states. In TypeScript, this can be achieved through discriminated unions, generic type parameters, or a combination of both.

**Discriminated union approach**: Each state is a separate interface with a literal `type` property. The transition function takes a state and an event and returns a new state. TypeScript's exhaustive switch checking ensures all state-event combinations are considered:

```typescript
type State =
  | { type: 'idle' }
  | { type: 'loading'; startedAt: number }
  | { type: 'success'; data: string }
  | { type: 'error'; error: Error };

type Event =
  | { type: 'FETCH' }
  | { type: 'RESOLVE'; data: string }
  | { type: 'REJECT'; error: Error };

function transition(state: State, event: Event): State {
  switch (state.type) {
    case 'idle':
      if (event.type === 'FETCH') return { type: 'loading', startedAt: Date.now() };
      return state;
    // ... exhaustive handling
  }
}
```

**Generic typestate approach**: A class is parameterized by its state, and methods are available only when the type parameter satisfies a constraint:

```typescript
class Connection<S extends 'open' | 'closed'> {
  private constructor(private state: S) {}
  static create(): Connection<'closed'> { return new Connection('closed'); }

  open(this: Connection<'closed'>): Connection<'open'> {
    return new Connection('open');
  }
  send(this: Connection<'open'>, data: string): void { /* ... */ }
  close(this: Connection<'open'>): Connection<'closed'> {
    return new Connection('closed');
  }
}
```

The `this` parameter constraint ensures that `send` can only be called on an open connection. Calling `connection.send('data')` on a `Connection<'closed'>` produces a type error. This is a direct translation of the typestate pattern from Rust and other systems languages.

**Assertion functions** complement state machines by narrowing types imperatively. A function with return type `asserts value is State` throws if the assertion fails and narrows the type if it succeeds, enabling state precondition checks without conditional wrapping [TypeScript 3.7 Release Notes; Dr. Axel Rauschmayer: Type Guards and Assertion Functions; OneUpTime: Type-Safe State Machines 2026].

The **XState** library (by David Khourshid) provides a runtime state machine framework with TypeScript integration, generating types from state machine definitions. While XState operates at a different abstraction level than the type-level patterns described here, its v5 release significantly improved type inference for states and events.

### 4.8 Error Handling Patterns

TypeScript's error handling landscape spans four distinct approaches, each with different type safety characteristics:

**Exceptions (throw/catch)**: JavaScript's native mechanism. TypeScript does not type the `catch` clause --- the caught value is `unknown` (since TypeScript 4.4 with `useUnknownInCatchVariables`). This means exception-based error handling provides no compile-time guidance about which errors a function may throw. The `cause` property, standardized in ES2022, enables error chaining: `throw new Error('Query failed', { cause: originalError })` [ECMAScript Proposal: Error Cause; Dr. Axel Rauschmayer 2021].

**Discriminated union returns**: Functions return `{ success: true; data: T } | { success: false; error: E }`, forcing callers to check the discriminant before accessing the data. This approach is entirely within TypeScript's type system with no library dependency, but it lacks the composability of monadic chaining.

**Result/Either types**: Libraries like neverthrow and fp-ts provide `Result<T, E>` / `Either<E, A>` with `.map()`, `.mapErr()`, `.andThen()` / `.chain()`, and `.match()` for composable error handling. The error type `E` appears in the function signature, making possible failures visible at call sites.

**Effect error channel**: Effect's `Effect<A, E, R>` type carries the error type `E` as a type parameter, with tagged error classes enabling exhaustive matching on error variants. Effect also provides defect tracking (unexpected errors that are not part of the error channel) and interruption handling for concurrent computations.

Error subtyping interacts with these patterns: a function returning `Result<T, NetworkError | ValidationError>` communicates its failure modes precisely. Callers can match on the error discriminant to handle each case differently, or propagate the union to their own callers. This is analogous to Rust's error enum pattern and Java's checked exceptions, but without the syntactic burden of `throws` declarations [Resnick: Fixing TypeScript's Error Handling; Jones: Strongly Typed Error Handling].

### 4.9 Module Patterns and Encapsulation

TypeScript provides three encapsulation mechanisms with different guarantees:

**The `private` keyword**: A compile-time-only modifier. The property remains fully accessible at runtime; `Object.keys()` lists it, and bracket notation (`obj['secret']`) bypasses the compiler check. Useful for API documentation and IDE support, but not for security boundaries.

**ECMAScript `#private` fields**: True runtime privacy. The `#` prefix creates a private name that is inaccessible outside the class, even through reflection. `Object.keys()` does not list it, and bracket notation cannot access it. This is the only mechanism that provides hard encapsulation in both the type system and the runtime [MDN: Private Elements; Cory Rylan: Private Methods in TypeScript].

**Symbol-keyed properties**: Properties keyed by `Symbol()` are not enumerable via `Object.keys()` or `for...in`, though they are accessible via `Object.getOwnPropertySymbols()`. When the symbol is not exported from the module, external code cannot access the property because it lacks the key. This provides module-scoped privacy: any code within the module can access the property, but external consumers cannot (without deliberate reflection) [Robin Viktorsson: Symbols in TypeScript].

The **revealing module pattern** --- exporting only selected functions from a module while keeping helper functions module-private --- is naturally expressed through ES module syntax (`export` vs non-exported declarations). This pattern has largely replaced the IIFE-based module pattern of pre-ES6 JavaScript.

### 4.10 Pattern Matching: Present and Future

The **TC39 pattern matching proposal** has been at Stage 1 since May 2018. Its current form introduces a `match` expression with `when` clauses supporting destructuring, guards, and binding patterns. The proposal has undergone significant design iteration but has not advanced to Stage 2, in part due to debates about syntax (expression vs statement, implicit vs explicit binding) and semantic interactions with existing JavaScript features [TC39 Proposal: Pattern Matching; TC39 Issue #175: Path to Stage 4].

In the absence of native pattern matching, the TypeScript community has developed workarounds:

**ts-pattern**: The most widely adopted library, providing `.match(value).with(pattern, handler).exhaustive()` with full type inference. Supports nested patterns, guards (`P.when()`), value extraction (`P.select()`), and logical combinators (`P.union()`, `P.intersection()`, `P.not()`). Bundle size is approximately 2kB. The library's exhaustiveness checking operates at the type level: `.exhaustive()` produces a type error if any variant of the input union is unhandled [Vergnaud, ts-pattern GitHub; ts-pattern npm].

**Destructuring with type narrowing**: Manual pattern matching using `if`/`switch` statements with TypeScript's control flow analysis. Verbose but zero-dependency and fully understood by all TypeScript developers.

**Custom match functions**: Some codebases define project-specific `match` utilities that map discriminant values to handler functions via an object literal, achieving a form of pattern matching through computed property access.

The gap between ts-pattern's capabilities and what native pattern matching could provide is primarily syntactic: ts-pattern requires function call syntax where native matching would use expression syntax, and ts-pattern's nested patterns require explicit `P.` prefix calls where native matching would use destructuring notation. The type-level capabilities are approximately equivalent.

---

## 5. Comparative Synthesis

| Dimension | Union-Based Patterns | Class-Based Patterns | Library FP (fp-ts/Effect) |
|-----------|---------------------|---------------------|--------------------------|
| **New variants** | Requires updating all switch sites | Easy (new subclass) | Requires updating match functions |
| **New operations** | Easy (new function) | Requires modifying interface + all classes | Easy (new pipe stage) |
| **Exhaustiveness** | Compiler-enforced via `never` | Not enforced (open hierarchy) | Library-enforced (`.exhaustive()`) |
| **Error typing** | Discriminated union returns | Exception-based (untyped catch) | `Either<E, A>` / `Effect<A, E, R>` |
| **Composition** | Function composition, `pipe` | Inheritance, mixins | Monadic chaining, `pipe`/`flow` |
| **State encoding** | Discriminated union states | Class per state (state pattern) | Effect fibers and refs |
| **Immutability** | `Readonly<T>`, `as const` | Defensive copying | Lenses/optics for updates |
| **DI approach** | Factory functions | Constructor injection | Effect `Context`/`Layer` |
| **Learning curve** | Low (native TS features) | Moderate (classical OOP) | High (category theory concepts) |
| **Ecosystem integration** | Native | Native | Requires bridging with Promise/throw |
| **Bundle size impact** | Zero | Zero | 2kB (neverthrow) to significant (Effect) |

The synthesis reveals a three-tier landscape. **Tier 1** consists of patterns native to TypeScript that require no libraries: discriminated unions, branded types, generic factories, and structural DI. These patterns are universally accessible, zero-cost, and compose well with any codebase. **Tier 2** consists of lightweight libraries that augment the type system: ts-pattern for matching, neverthrow for Result types, and Zod for runtime validation with static type inference. These add targeted functionality with minimal ecosystem coupling. **Tier 3** consists of comprehensive frameworks: fp-ts for full Haskell-style FP, and Effect for a complete application framework with typed errors, DI, concurrency, and observability. These provide maximum type safety but require significant commitment and create interoperability boundaries with the broader JavaScript ecosystem.

---

## 6. Open Problems and Gaps

### 6.1 No Native Higher-Kinded Types

TypeScript lacks higher-kinded types (HKTs): there is no way to abstract over type constructors like `Array<_>` or `Promise<_>`. fp-ts works around this using a URI-based encoding where each type constructor registers a string tag and a type-level map resolves the tag to the concrete type. This encoding is ingenious but fragile --- it requires module augmentation of a global interface, produces opaque error messages, and cannot be checked by the compiler for law compliance. A native HKT mechanism would simplify the implementation of functors, monads, and traversables, and would make libraries like fp-ts significantly more approachable.

### 6.2 TC39 Pattern Matching Stalled at Stage 1

The pattern matching proposal has not advanced beyond Stage 1 since 2018, despite active discussion. The TypeScript team has indicated they would follow a TC39 standard rather than implement a TypeScript-specific matching syntax. Until the proposal advances, ts-pattern and manual switch statements remain the only options, and the language lacks the ergonomic pattern matching that Rust, Swift, and Scala provide natively.

### 6.3 The Expression Problem Remains Unsolved

No TypeScript pattern fully solves the Expression Problem. Unions favor operation extensibility, classes favor variant extensibility, and the visitor pattern trades one problem for the other. Language features like declaration merging and module augmentation provide partial escape hatches (e.g., extending a union type in a separate module), but these mechanisms are fragile and not widely used for this purpose. Row polymorphism or extensible variants, as found in OCaml's polymorphic variants, would address this gap but are not on the TypeScript roadmap.

### 6.4 Branded Types Lack Language Support

Branded types are a community convention, not a language feature. There is no syntax for declaring a nominal type, no compiler support for validating branding boundaries, and no way to prevent `as` casts that bypass validation. A proposal for opaque type aliases (similar to Flow's `opaque type`) would formalize this pattern and make the construction boundary enforceable [TypeScript GitHub discussions; Flow: Opaque Type Aliases].

### 6.5 Generic Type Parameter Erasure

TypeScript's type erasure means generic type parameters are unavailable at runtime. This prevents generic-based dependency injection from resolving dependencies by type at runtime (as Java's Spring or .NET's DI containers do), forcing TypeScript DI solutions to use string or symbol tokens, decorators with metadata, or compile-time verification. The typed-inject library demonstrates that compile-time verification is possible, but the approach requires careful API design.

### 6.6 Decorator and Metadata Standardization

The TC39 decorators proposal (Stage 3, with TypeScript 5.0+ support) differs from the legacy "experimental decorators" that InversifyJS and tsyringe depend on. The transition creates ecosystem fragmentation: libraries must support both decorator versions or migrate, and the metadata reflection API that legacy decorators used (`reflect-metadata`) has no direct equivalent in the standard decorators specification.

### 6.7 Immutability Depth and Runtime Mismatch

TypeScript's `Readonly<T>` is shallow and compile-time only. `Object.freeze()` is shallow and runtime. There is no built-in mechanism for deep immutability that operates at both levels. The `DeepReadonly<T>` utility type addresses the compile-time gap, but runtime deep freezing requires recursive traversal with performance implications. The mismatch between type-level and runtime immutability guarantees is a recurring source of bugs in codebases that assume `Readonly` prevents all mutation.

---

## 7. Conclusion

TypeScript's design pattern landscape reflects its nature as a multi-paradigm language with a uniquely expressive structural type system. Discriminated unions provide the closest approximation to algebraic data types available in a mainstream language, with compiler-enforced exhaustiveness that catches unhandled variants at compile time. Branded types simulate nominal typing through intersection-based phantom properties, enabling domain-specific type safety without runtime overhead. The Expression Problem manifests as a genuine architectural choice between union-based and class-based designs, with neither approach achieving the extensibility that language-level solutions in OCaml or Haskell provide.

The functional programming ecosystem in TypeScript has matured from academic curiosity to production tooling. fp-ts established that Haskell-style abstractions are expressible in TypeScript's type system, Effect demonstrated that a comprehensive functional application framework is viable, and neverthrow proved that lightweight typed error handling can be adopted incrementally. The monocle-ts and @fp-ts/optic libraries bring composable optics for immutable data manipulation. Meanwhile, traditional OOP patterns have been adapted to TypeScript's strengths: factories leverage generic inference, builders use generic state accumulation for compile-time completeness checking, strategies reduce to typed callbacks, and dependency injection leverages structural typing to avoid reflection.

The typestate pattern demonstrates TypeScript's capacity for encoding protocol constraints at the type level, making invalid state transitions unrepresentable. Combined with assertion functions for runtime narrowing and discriminated unions for state representation, TypeScript provides a rich --- if verbose --- toolkit for state machine encoding.

The field's trajectory depends on several unresolved questions. The stalled TC39 pattern matching proposal, the absence of native higher-kinded types, the lack of language-level support for branded/opaque types, and the ongoing decorator standardization each represent gaps between what the community has demonstrated is possible through library-level ingenuity and what the language provides natively. The tension between TypeScript's role as a JavaScript superset (constrained by TC39's pace) and its aspirations as an expressive type system (driven by its community's demand for stronger guarantees) will continue to shape the evolution of design patterns in this space.

---

## References

1. Wadler, P. "The Expression Problem." Email to java-generics mailing list, 12 November 1998. https://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt

2. Strom, R. E. and Yemini, S. "Typestate: A programming language concept for enhancing software reliability." *IEEE Transactions on Software Engineering*, 12(1), 1986.

3. Krishnamurthi, S., Felleisen, M., and Friedman, D. P. "Synthesizing Object-Oriented and Functional Design to Promote Re-Use." *ECOOP 1998*.

4. Bendersky, E. "The Expression Problem and its solutions." 2016. https://eli.thegreenplace.net/2016/the-expression-problem-and-its-solutions/

5. TypeScript Handbook: Narrowing. https://www.typescriptlang.org/docs/handbook/2/narrowing.html

6. TypeScript Handbook: Mixins. https://www.typescriptlang.org/docs/handbook/mixins.html

7. Canti, G. fp-ts: Functional programming in TypeScript. https://github.com/gcanti/fp-ts

8. Canti, G. monocle-ts: Functional optics for TypeScript. https://github.com/gcanti/monocle-ts

9. Canti, G. @fp-ts/optic: A porting of ZIO Optics to TypeScript. https://github.com/fp-ts/optic

10. Canti, G. "Getting started with fp-ts: Monad." DEV Community. https://dev.to/gcanti/getting-started-with-fp-ts-monad-6k

11. Vergnaud, G. ts-pattern: The exhaustive Pattern Matching library for TypeScript. https://github.com/gvergnaud/ts-pattern

12. Effect-TS Documentation and Framework. https://effect.website/

13. "Effect-TS in 2026: Functional Programming for TypeScript That Actually Makes Sense." DEV Community. https://dev.to/ottoaria/effect-ts-in-2026-functional-programming-for-typescript-that-actually-makes-sense-1go

14. Harbor Engineering. "Why We Love Functional Programming but Don't Use Effect-TS." November 2025. https://runharbor.com/blog/2025-11-24-why-we-dont-use-effect-ts

15. neverthrow: A Result type for TypeScript. https://github.com/supermacro/neverthrow

16. Kourge. ts-brand: Reusable type branding in TypeScript. https://github.com/kourge/ts-brand

17. Beraliv. "Opaque Type in TypeScript." 2021. https://blog.beraliv.dev/2021-05-07-opaque-type-in-typescript

18. Learning TypeScript. "Branded Types." https://www.learningtypescript.com/articles/branded-types

19. Zalecki, M. "Nominal typing techniques in TypeScript." https://michalzalecki.com/nominal-typing-in-typescript/

20. Basarat, A. S. "TypeScript Deep Dive: Discriminated Unions." https://basarat.gitbook.io/typescript/type-system/discriminated-unions

21. Vasiltsov, K. "Visitor pattern in TypeScript." https://www.kirillvasiltsov.com/writing/visitor-pattern-typescript/

22. ZenStack. "Reflection on Visitor Pattern in Typescript." DEV Community. https://dev.to/zenstack/reflection-on-visitor-pattern-in-typescript-4gjd

23. Fillo, P. "Pattern matching with Typescript done right." Medium. https://medium.com/@fillopeter/pattern-matching-with-typescript-done-right-94049ddd671c

24. TC39 Proposal: Pattern Matching. https://github.com/tc39/proposal-pattern-matching

25. Rauschmayer, A. "Narrowing types via type guards and assertion functions." 2ality, 2020. https://2ality.com/2020/06/type-guards-assertion-functions-typescript.html

26. Rauschmayer, A. "ECMAScript proposal: Error cause." 2ality, 2021. https://2ality.com/2021/06/error-cause.html

27. Refactoring Guru. "Visitor in TypeScript." https://refactoring.guru/design-patterns/visitor/typescript/example

28. Refactoring Guru. "Factory Method in TypeScript." https://refactoring.guru/design-patterns/factory-method/typescript/example

29. Refactoring Guru. "Strategy in TypeScript." https://refactoring.guru/design-patterns/strategy/typescript/example

30. Scott Logic. "TypeScript Builders: Improving your types one step at a time." https://blog.scottlogic.com/2020/09/16/typescript-builders.html

31. Kravchenko, A. "Implementing a type-safe object builder in TypeScript." Medium. https://medium.com/geekculture/implementing-a-type-safe-object-builder-in-typescript-e973f5ecfb9c

32. Sammons, B. "Building a fluent interface with TypeScript using generics." Medium. https://medium.com/@bensammons/building-a-fluent-interface-with-typescript-using-generics-in-typescript-3-4d206f00dba5

33. Vattenfall Tech. "You might not need all those design patterns in TypeScript." 2025. https://medium.com/vattenfall-tech/you-might-not-need-all-those-design-patterns-in-typescript-d5671b34410a

34. InversifyJS Documentation. https://inversify.io/

35. Microsoft. tsyringe: Lightweight dependency injection container. https://github.com/microsoft/tsyringe

36. Vady. "DI Benchmark: Vanilla, RegistryComposer, typed-inject, tsyringe, inversify, nest.js." https://blog.vady.dev/di-benchmark-vanilla-registrycomposer-typed-inject-tsyringe-inversify-nestjs

37. MDN Web Docs. "Private elements." https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements

38. Rylan, C. "Private Methods and Properties in TypeScript Classes." https://coryrylan.com/blog/private-methods-and-properties-in-typescript-classes

39. Viktorsson, R. "Understanding Symbols in TypeScript." Medium. https://medium.com/@robinviktorsson/understanding-symbols-in-typescript-a-deep-dive-with-practical-examples-82011a838783

40. Solomon, M. "Optics in TypeScript." Medium. https://medium.com/pleasework/optics-in-typescript-c1a190fb3963

41. OneUpTime. "How to Build Type-Safe State Machines in TypeScript." January 2026. https://oneuptime.com/blog/post/2026-01-30-typescript-type-safe-state-machines/view

42. This Dot Labs. "Functional Programming in TypeScript using the fp-ts library: Pipe and Flow Operator." https://www.thisdot.co/blog/functional-programming-in-typescript-using-the-fp-ts-library-pipe-and-flow

43. Expression Problem. Wikipedia. https://en.wikipedia.org/wiki/Expression_problem

44. Resnick, E. "Fixing TypeScript's Error Handling." Medium. https://medium.com/@ethanresnick/fixing-error-handling-in-typescript-340873a31ecd

45. Jones, M. "Strongly Typed Error Handling in TypeScript." Medium. https://mjones44.medium.com/strongly-typed-error-handling-in-typescript-bb2819b75653

46. Jefferson, D. "JavaScript's Object.freeze and TypeScript's Readonly." https://www.dalejefferson.com/articles/2019-06-12-object-freeze-typescript-readonly/

---

## Practitioner Resources

### Libraries

| Library | Purpose | Bundle Size | URL |
|---------|---------|-------------|-----|
| ts-pattern | Exhaustive pattern matching | ~2kB | https://github.com/gvergnaud/ts-pattern |
| neverthrow | Lightweight Result type | ~1kB | https://github.com/supermacro/neverthrow |
| fp-ts | Comprehensive FP toolkit | ~50kB (tree-shakeable) | https://github.com/gcanti/fp-ts |
| Effect | Full FP application framework | Significant | https://effect.website/ |
| monocle-ts | Functional optics/lenses | ~10kB | https://github.com/gcanti/monocle-ts |
| @fp-ts/optic | ZIO-style optics for Effect | ~8kB | https://github.com/fp-ts/optic |
| ts-brand | Reusable type branding | <1kB | https://github.com/kourge/ts-brand |
| Zod | Runtime validation + static types | ~13kB | https://github.com/colinhacks/zod |
| InversifyJS | Decorator-based DI container | ~15kB | https://inversify.io/ |
| tsyringe | Lightweight DI container | ~5kB | https://github.com/microsoft/tsyringe |
| typed-inject | Compile-time verified DI | ~3kB | https://github.com/nicojs/typed-inject |
| XState | State machine framework | ~20kB | https://github.com/statelyai/xstate |

### Documentation

- TypeScript Handbook: Narrowing --- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript Handbook: Mixins --- https://www.typescriptlang.org/docs/handbook/mixins.html
- TypeScript Handbook: Utility Types --- https://www.typescriptlang.org/docs/handbook/utility-types.html
- fp-ts Learning Resources --- https://gcanti.github.io/fp-ts/learning-resources/
- Effect Documentation --- https://effect.website/docs
- TC39 Pattern Matching Proposal --- https://github.com/tc39/proposal-pattern-matching

### Key Blog Posts and Articles

- Eli Bendersky, "The Expression Problem and its solutions" --- https://eli.thegreenplace.net/2016/the-expression-problem-and-its-solutions/
- Dr. Axel Rauschmayer, "Type guards and assertion functions" --- https://2ality.com/2020/06/type-guards-assertion-functions-typescript.html
- Harbor Engineering, "Why We Love FP but Don't Use Effect-TS" --- https://runharbor.com/blog/2025-11-24-why-we-dont-use-effect-ts
- Vattenfall Tech, "You might not need all those design patterns in TypeScript" --- https://medium.com/vattenfall-tech/you-might-not-need-all-those-design-patterns-in-typescript-d5671b34410a
- Learning TypeScript, "Branded Types" --- https://www.learningtypescript.com/articles/branded-types
