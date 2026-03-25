---
title: "Macro Metaprogramming and Compile-Time Computation in Rust"
date: 2026-03-21
summary: A survey of Rust's macro system covering declarative macros, procedural macros, the syn/quote ecosystem, compile-time computation via const fn, and the construction of domain-specific languages — analyzing how Rust's approach to metaprogramming balances power with safety and hygiene.
keywords: [rust, macros, metaprogramming, procedural-macros, const-fn, compile-time]
---

# Macro Metaprogramming and Compile-Time Computation in Rust

*2026-03-21*

## Abstract

Metaprogramming -- the practice of writing programs that generate or transform other programs -- is a foundational technique in systems programming for eliminating boilerplate, enforcing invariants, and constructing domain-specific abstractions. Rust provides an unusually rich and carefully stratified metaprogramming system comprising declarative macros (`macro_rules!`), three varieties of procedural macros (derive, attribute, and function-like), and an evolving compile-time function evaluation mechanism through `const fn` and const generics. Unlike the textual substitution of the C preprocessor or the Turing-complete but syntactically opaque template metaprogramming of C++, Rust's macro system operates on token streams and abstract syntax trees with enforced hygiene guarantees, integrating metaprogramming into the language's broader commitment to memory safety, type safety, and zero-cost abstraction.

This survey provides a comprehensive analysis of Rust's metaprogramming facilities at PhD depth. We trace the theoretical lineage from Kohlbecker's 1986 hygienic macro expansion algorithm through the MTWT (Macros That Work Together) algorithm that underpins Rust's hygiene implementation, to the sets-of-scopes model developed by Flatt for Racket. We examine each macro variety in technical detail: the pattern-matching grammar and fragment specifiers of `macro_rules!`, the `TokenStream`-to-`TokenStream` transformation model of procedural macros, and the `syn`/`quote`/`proc-macro2` ecosystem that has become the de facto standard for procedural macro development. We analyze compile-time computation through `const fn`, const generics, and the Miri-based CTFE engine, situating Rust's approach within Ralf Jung's proposed "const type system" framework. We survey the construction of domain-specific languages through macros, with case studies in serialization (serde), web frameworks (Rocket, Actix, Yew, Leptos), database access (Diesel, SQLx), and compile-time regular expression validation.

The survey concludes with a comparative synthesis against metaprogramming systems in C, C++, Lisp/Scheme/Racket, Haskell (Template Haskell), Zig (comptime), and Nim, and identifies open problems including the stalled macros 2.0 proposal, the fundamental challenges of proc macro IDE integration, eager macro expansion, and the stabilization path for `generic_const_exprs`.

## 1. Introduction

The term "metaprogramming" encompasses any computational process in which programs treat other programs as their data -- generating, analyzing, or transforming source code at compile time rather than operating on runtime values. In systems programming, metaprogramming serves several critical functions: it eliminates repetitive boilerplate that would otherwise violate the DRY (Don't Repeat Yourself) principle, it enables the construction of domain-specific abstractions that would be impossible within the base language's syntax, and it permits compile-time validation of invariants that would otherwise require runtime checks [1].

Rust's approach to metaprogramming is distinctive in the landscape of systems programming languages. Where C relies on a textual preprocessor that operates before parsing and has no understanding of the language's type system or syntax structure, and where C++ evolved template metaprogramming as an accidental Turing-complete computation system layered atop a substitution mechanism designed for generic data structures, Rust was designed from its earliest versions with explicit macro support as a first-class language concern [2]. The `macro_rules!` system was included in Rust 1.0 despite known limitations, with the keyword `macro` reserved for an anticipated improved system. Procedural macros were stabilized incrementally: custom derive macros in Rust 1.15 (February 2017), attribute macros and function-like procedural macros in Rust 1.30 (October 2018) [3].

The significance of macros in the Rust ecosystem cannot be overstated. The `serde` serialization framework, whose `#[derive(Serialize, Deserialize)]` macros have accumulated over 196 million downloads on crates.io, demonstrates how procedural macros enable zero-boilerplate integration of complex cross-cutting concerns [4]. The `tokio` async runtime's `#[tokio::main]` attribute macro transforms synchronous-looking entry points into fully configured async executors. Web frameworks like Rocket use attribute macros (`#[get("/")]`, `#[post("/")]`) to generate type-safe routing and request handling code at compile time [5]. In each case, macros serve not merely as convenience features but as load-bearing architectural components that would be difficult or impossible to replicate through functions and generics alone.

This survey is organized as follows. Section 2 establishes the theoretical foundations of macro systems and hygiene. Section 3 provides a taxonomy of Rust's macro kinds. Section 4 analyzes each mechanism in depth, including the `syn`/`quote` ecosystem, compile-time computation, and DSL construction. Section 5 offers a comparative synthesis with other languages. Section 6 identifies open problems. Section 7 concludes.

## 2. Foundations

### 2.1 The Theory of Hygienic Macro Expansion

The concept of macro hygiene was introduced by Kohlbecker, Friedman, Felleisen, and Duba in their 1986 paper "Hygienic Macro Expansion," presented at the ACM Conference on LISP and Functional Programming [6]. The fundamental problem they identified is variable capture: when a macro introduces a binding (a local variable, for instance), that binding might accidentally shadow a variable with the same name in the macro's invocation context, or conversely, a variable in the expansion might accidentally refer to a binding in the invoking context rather than the one intended by the macro author.

The KFFD algorithm solved this by systematically renaming variables introduced by macro expansion to ensure they could not collide with variables in the surrounding program. This was followed by Clinger and Rees's 1991 work on syntactic closures, which provided an alternative mechanism where the programmer explicitly specifies the resolution scope of each identifier [7]. Dybvig, Hieb, and Bruggeman's `syntax-case` system (1993) unified pattern-based and procedural macro definitions while preserving hygiene [8].

Matthew Flatt's "Binding as Sets of Scopes" (2016) represented a fundamental reconceptualization of hygiene for Racket's macro expander [9]. Rather than tracking expansion history through variable renamings, Flatt's model attaches a set of scopes to each identifier. A scope is introduced whenever a binding form or macro expansion occurs, and an identifier's binding is determined by finding the binding whose set of scopes is the largest subset of the identifier's scopes. This model is simpler, more uniform, and handles edge cases (particularly around local macro definitions and `let-syntax` forms) that the renaming-based approach struggled with.

### 2.2 Hygiene in Rust: The MTWT Algorithm

Rust's macro hygiene implementation draws from the paper "Macros That Work Together: Compile-time Bindings, Partial Expansion, and Definition Contexts" by Flatt, Culpepper, Darais, and Findler [10]. The algorithm -- referred to as MTWT in the Rust compiler's source -- is applied during macro expansion as the compiler walks the entire AST.

The MTWT algorithm operates through two primary mechanisms: *marking* and *renaming*. When a macro is expanded, all tokens in the generated code receive a fresh mark. Crucially, tokens that were passed as arguments to the macro (i.e., tokens originating from the call site) are *not* marked, preserving their original identity. When the compiler enters a new scope during expansion, identifiers are renamed: a renaming operation maps a "from" identifier to a "to" name, where the "to" name is a fresh interned string that is textually identical but numerically distinct in the compiler's interning table [11].

The practical effect is that two identifiers are considered equal only if both their textual name and their syntax context match. An `x` defined inside a macro body and an `x` passed as an argument to that macro are distinct identifiers despite sharing the same textual representation. This prevents the accidental capture that plagues unhygienic macro systems like the C preprocessor.

However, Rust's `macro_rules!` macros implement only *partial* hygiene, sometimes called "mixed-site" hygiene. Local variables and loop labels are resolved at the definition site (hygienic behavior), but other identifiers -- including types, functions, modules, and traits -- are resolved at the call site (unhygienic behavior) [12]. This pragmatic compromise reflects the observation that most accidental capture involves local variables, while macros frequently need to refer to types and functions visible at their invocation site. The `$crate` metavariable provides a controlled escape hatch, allowing macros to refer to items in their defining crate regardless of where they are invoked.

### 2.3 From Textual Substitution to AST Transformation

The evolution of macro systems can be understood as a progression along a spectrum of abstraction levels at which the transformation operates:

1. **Textual substitution** (C preprocessor): The macro system operates on raw character sequences before parsing. It has no understanding of the language's syntax, types, or scoping rules. This produces well-known pathologies: unsanitary variable capture, operator precedence errors (the classic `#define SQUARE(x) x*x` where `SQUARE(1+2)` evaluates to `1+2*1+2 = 5`), and the impossibility of recursive or context-sensitive transformations [13].

2. **Token-stream transformation** (Rust procedural macros): The macro system operates on a stream of lexed tokens, preserving their syntactic identity (identifier, literal, punctuation, delimited group) and source location. The transformation can be arbitrary Rust code, but the output must be a valid token stream that the compiler can parse. This level provides hygiene through span information and prevents precedence errors while allowing maximum flexibility [3].

3. **AST-to-AST transformation** (Template Haskell, Nim macros, OCaml PPX): The macro system operates on a typed abstract syntax tree, allowing pattern matching on specific syntactic constructs. This provides strong guarantees about output well-formedness but couples the macro system to the language's AST representation, which may change between compiler versions [14].

4. **Compile-time function evaluation** (Zig comptime, D CTFE): Rather than transforming syntax, the language allows ordinary functions to execute at compile time, using the same semantics as runtime execution. This eliminates the need for a separate macro language but limits transformations to those expressible as function computation rather than syntactic manipulation [15].

Rust occupies a distinctive position in this taxonomy: its declarative macros operate through pattern matching on token trees (between levels 1 and 2), its procedural macros operate on token streams (level 2) but are typically used with the `syn` crate to perform AST-level transformations (level 3), and its `const fn` mechanism provides compile-time function evaluation (level 4). This stratification allows programmers to choose the appropriate level of abstraction for each metaprogramming task.

## 3. Taxonomy of Approaches

Rust provides five distinct mechanisms for compile-time code generation and computation, which can be organized into a taxonomy based on their abstraction level, power, and complexity:

### 3.1 Declarative Macros (`macro_rules!`)

Declarative macros use a pattern-matching syntax to match against token trees and produce replacement token trees. They are defined using the `macro_rules!` keyword and consist of one or more rules, each containing a *matcher* (the pattern) and a *transcriber* (the replacement). Matchers use *fragment specifiers* to bind portions of the input to metavariables, and *repetition operators* (`*`, `+`, `?`) to handle variable-length input [16]. Declarative macros are expanded during parsing and participate in the compiler's mixed-site hygiene system.

### 3.2 Derive Macros

Derive macros are procedural macros invoked through the `#[derive(...)]` attribute on struct, enum, or union definitions. They receive the token stream of the annotated type definition as input and produce zero or more new items (typically trait implementations) as output. The original type definition is preserved unchanged. Derive macros may declare *helper attributes* that can appear on fields or variants within the annotated type [3].

### 3.3 Attribute Macros

Attribute macros are procedural macros invoked as attributes on items. They receive two token streams as input: the attribute's arguments and the annotated item. They produce a replacement for the annotated item as output -- the original item is consumed and must be re-emitted by the macro if it should be preserved. This gives attribute macros the power to arbitrarily transform the items they annotate [3].

### 3.4 Function-Like Procedural Macros

Function-like procedural macros are invoked with the syntax `name!(...)` and receive the contents of the delimiters as a single token stream. They produce a replacement token stream as output. Unlike declarative macros, they can perform arbitrary computation during expansion and are not limited to pattern matching [3].

### 3.5 Compile-Time Function Evaluation (`const fn`, Const Generics)

The `const fn` qualifier marks functions whose bodies can be evaluated at compile time when called in a *const context* (array lengths, `const` item initializers, const generic arguments, `const {}` blocks). The Miri-based CTFE engine interprets the function's MIR (Mid-level Intermediate Representation) using an abstract machine model. Const generics allow types to be parameterized by constant values, enabling type-level computation [17].

## 4. Analysis

### 4.1 Declarative Macros: `macro_rules!`

#### 4.1.1 Syntax and Semantics

A `macro_rules!` definition consists of one or more *rules*, each comprising a matcher and a transcriber separated by `=>`. Matchers and transcribers are enclosed in delimiters (`()`, `[]`, or `{}`), and the choice of outer delimiter has no semantic effect. The macro invocation syntax permits any of these delimiter forms: `name!(...)`, `name![...]`, or `name!{...}` [16].

Matchers contain a mixture of literal tokens (matched exactly) and *metavariable bindings* of the form `$name:specifier`, where the fragment specifier determines what syntactic construct the metavariable will match. Rust defines the following fragment specifiers:

| Specifier | Matches | Follow-set restrictions |
|-----------|---------|----------------------|
| `block` | Block expression `{ ... }` | None |
| `expr` | Any expression (2024+: includes `_` and const blocks) | `=>`, `,`, `;` |
| `expr_2021` | Expression excluding `_` and const blocks | `=>`, `,`, `;` |
| `ident` | Identifier (excluding `_`, `$crate`, raw identifiers) | None |
| `item` | Any item (fn, struct, impl, etc.) | None |
| `lifetime` | Lifetime token (`'a`) | None |
| `literal` | Literal expression, optionally negated | None |
| `meta` | Attribute content | None |
| `pat` | Pattern (2021+: top-level or-patterns) | `=>`, `,`, `=`, `if`, `in` |
| `pat_param` | Pattern without top-level `\|` | `=>`, `,`, `=`, `\|`, `if`, `in` |
| `path` | Type path | `=>`, `,`, `=`, `\|`, `;`, `:`, `>`, `>>`, `[`, `{`, `as`, `where` |
| `stmt` | Statement without trailing semicolon | `=>`, `,`, `;` |
| `tt` | Single token tree | None |
| `ty` | Type | `=>`, `,`, `=`, `\|`, `;`, `:`, `>`, `>>`, `[`, `{`, `as`, `where` |
| `vis` | Visibility qualifier (possibly empty) | `,`, non-`priv` ident, type-starting tokens |

The follow-set restrictions are a critical design constraint: certain fragment specifiers can only be followed by specific tokens to prevent ambiguity in the macro parser, which uses single-token lookahead without backtracking [16]. These restrictions ensure that `macro_rules!` grammars are unambiguously parseable, at the cost of limiting the syntactic forms that macros can accept.

#### 4.1.2 Repetition and Recursion

Repetitions are enclosed in `$(...)` followed by an optional separator token and a repetition operator: `*` (zero or more), `+` (one or more), or `?` (zero or one, no separator permitted). The transcriber must use each metavariable at the same nesting depth of repetition as the matcher, and all metavariables within a single repetition must bind the same number of fragments [16].

Because `macro_rules!` has no built-in support for accumulating intermediate results, Rust macro authors have developed several well-known patterns to work around this limitation. *TT munching* is a recursive technique where the macro consumes tokens from the front of its input one step at a time, processing each token and recursing on the tail. *Push-down accumulation* allows intermediate results to be built up incrementally by passing an accumulator through recursive macro invocations [18]. Both patterns are inherently quadratic in the length of the input: TT munching because each recursive invocation must re-match the remaining tokens, and push-down accumulation because the accumulator grows linearly and must be copied at each step. A macro using both patterns simultaneously exhibits doubly quadratic behavior, which can cause compile times to deteriorate sharply on long inputs [18].

#### 4.1.3 Fragment Opacity and Forwarding

A subtle but important property of `macro_rules!` is *fragment opacity*: once a metavariable has been bound to a fragment through a specifier other than `tt`, `ident`, or `lifetime`, it becomes an opaque AST node that cannot be decomposed by subsequent macro invocations. If macro `A` captures `$e:expr` and forwards `$e` to macro `B`, then `B` can only match `$e` against the `expr` specifier -- it cannot match it against a literal token like `3`, even if the original input was the literal `3` [16]. The `tt` specifier is the exception: it preserves the original token structure and can be matched against any subsequent pattern. This opacity is a consequence of the compiler's eager parsing of fragment specifiers and has significant implications for macro composition.

#### 4.1.4 Scoping and Visibility

Declarative macros have *textual scope* by default: they are visible from the point of definition to the end of the enclosing scope. This is fundamentally different from Rust's normal item scoping rules, where items are visible throughout their containing module regardless of definition order. The `#[macro_export]` attribute places a macro in the crate root's path-based scope, making it available for import by other crates. The `#[macro_use]` attribute on a module extends a macro's scope beyond its defining module, and on an `extern crate` declaration, imports exported macros from another crate [16].

### 4.2 Procedural Macros

#### 4.2.1 Architecture and Compilation Model

Procedural macros must be defined in a dedicated crate with `proc-macro = true` in `Cargo.toml`. This architectural requirement stems from the compilation model: procedural macros are compiled as dynamic libraries that are loaded by the compiler during expansion [19]. The compiler makes two separate calls to `rustc` -- one to compile the proc-macro crate into a shared library, and a second to compile the dependent crate, passing the shared library for macro expansion [20].

This separation also addresses ABI compatibility concerns. Because the Rust compiler may use different code generation backends (LLVM, Cranelift, GCC), procedural macros communicate with the compiler through an indirection layer. Before calling a procedural macro, the compiler places the input `TokenStream` into a handle table and passes the handle's ID to the macro function. When the macro calls methods on the `TokenStream`, those calls are routed back to the compiler through the handle, which dereferences the original data structure. This decoupling ensures that the macro's compiled code need not share the compiler's internal data representation [20].

A consequence of this design is that procedural macros cannot be used from the crate in which they are defined. A proc-macro crate can only export procedural macro functions -- no regular functions, types, modules, or `macro_rules!` macros. This has led to the common "facade crate" pattern where a public-facing crate re-exports items from both a proc-macro crate and a runtime support crate.

#### 4.2.2 The Three Kinds

**Derive macros** are declared with `#[proc_macro_derive(Name)]` on a `pub fn(TokenStream) -> TokenStream`. The input is the token stream of the annotated struct, enum, or union. The output is zero or more new items that are appended after the original item. The original item is preserved unchanged. Derive macros may declare helper attributes via `#[proc_macro_derive(Name, attributes(helper1, helper2))]`; these inert attributes can appear on fields and variants within the annotated type and are available to the macro for inspection [3].

**Attribute macros** are declared with `#[proc_macro_attribute]` on a `pub fn(TokenStream, TokenStream) -> TokenStream`. The first parameter contains the attribute's arguments (the tokens inside the parentheses after the attribute name), and the second contains the annotated item including all its other attributes. The output replaces the annotated item entirely -- the macro must re-emit the item if it should be preserved. Attribute macros can be applied to items, items in `extern` blocks, inherent and trait implementations, and trait definitions [3].

**Function-like procedural macros** are declared with `#[proc_macro]` on a `pub fn(TokenStream) -> TokenStream`. The input is the contents of the macro invocation's delimiters. The output replaces the entire invocation. Function-like proc macros can appear in statement, expression, pattern, type, item, and implementation positions [3].

#### 4.2.3 Error Reporting

Procedural macros have two mechanisms for reporting errors. The simplest is to panic, which the compiler catches and converts into a compile error pointing to the macro invocation. The more precise mechanism is to emit a `compile_error!` invocation in the output token stream, which allows the macro to specify custom error messages and attach them to specific spans for accurate source location reporting [3].

### 4.3 The syn/quote/proc-macro2 Ecosystem

#### 4.3.1 proc-macro2: The Bridge Crate

The `proc_macro` crate provided by the compiler is available only within procedural macro contexts -- its types cannot exist in regular library code, which makes unit testing proc-macro logic impossible. The `proc-macro2` crate by David Tolnay provides a nearly identical API that works in all contexts [21]. Types from `proc_macro2` can be converted to and from their `proc_macro` equivalents at the macro's API boundary, while all internal logic operates on `proc_macro2` types. This design enables comprehensive testing of macro logic through standard `#[test]` functions without requiring the full compiler infrastructure.

#### 4.3.2 syn: Parsing Rust Syntax

The `syn` crate (version 2.0.117 as of February 2026, used by approximately 945,000 dependent crates) provides a full parser for Rust syntax operating on `proc_macro2::TokenStream` inputs [22]. Its key types include:

- `DeriveInput`: The entry point for derive macros, representing a struct, enum, or union with its generics, attributes, and fields.
- `ItemStruct`, `ItemEnum`, `ItemFn`, `ItemImpl`: Representations of specific item types.
- `Expr`, `Type`, `Pat`, `Stmt`: Expression, type, pattern, and statement nodes.
- `Attribute`, `Meta`: Attribute and metadata representations.

Parsing is driven by the `Parse` trait, which defines a `parse(input: ParseStream) -> Result<Self>` method. Every syntax tree node in `syn` implements `Parse`, and the trait can be implemented for custom types to define parsers for arbitrary syntax -- enabling function-like procedural macros that accept domain-specific input syntax [22].

The `syn` crate uses feature flags to control compilation scope. The default features (`derive`, `parsing`, `printing`, `proc-macro`, `clone-impls`) support common derive macro use cases. The `full` feature enables parsing of all Rust syntax, while `visit`, `visit-mut`, and `fold` provide AST traversal and transformation utilities.

#### 4.3.3 quote: Code Generation Through Quasi-Quoting

The `quote` crate provides the `quote!` macro for generating `proc_macro2::TokenStream` values through quasi-quoting -- a technique where code is written in its target syntax with interpolation points for computed values [23]. Within a `quote!` invocation, `#var` interpolates a variable that implements the `ToTokens` trait, and `#(#var),*` provides repetition analogous to `macro_rules!` repetition syntax.

The `quote!` macro produces values of type `proc_macro2::TokenStream`, which themselves implement `ToTokens` and can therefore be interpolated into subsequent `quote!` invocations. This compositionality allows complex code generation to be built up incrementally from helper functions, each producing a fragment of the final output [23].

#### 4.3.4 Practical Pattern: The Derive Macro Pipeline

The canonical pipeline for implementing a derive macro using this ecosystem follows a consistent structure:

1. The proc-macro entry point receives a `proc_macro::TokenStream`, converts it to `proc_macro2::TokenStream`, and passes it to `syn::parse2::<DeriveInput>()`.
2. The parsed `DeriveInput` is analyzed: fields are enumerated, attributes are inspected, generic parameters are extracted.
3. Code generation uses `quote!` to produce trait implementations, interpolating field names, types, and generic bounds.
4. The generated `proc_macro2::TokenStream` is converted back to `proc_macro::TokenStream` and returned.

This pipeline separates parsing, analysis, and generation into distinct phases, each independently testable through the `proc_macro2` abstraction layer.

### 4.4 Derive Macros in Depth: The Serde Case Study

#### 4.4.1 Architecture of serde_derive

The `serde` framework provides the most widely deployed example of derive macro engineering in the Rust ecosystem. When `#[derive(Serialize, Deserialize)]` is applied to a type, the `serde_derive` procedural macro crate generates implementations of the `Serialize` and `Deserialize` traits [4]. The generated code is substantial: a simple struct with three fields may expand into hundreds of lines of trait implementation code.

#### 4.4.2 The Visitor Pattern in Generated Code

The `Deserialize` implementation generated by serde employs a multi-layered visitor pattern. For a struct with named fields, the expansion produces:

1. A **field enum** with variants for each field plus an `__ignore` variant for unknown fields during deserialization.
2. A **field visitor** implementing `serde::de::Visitor` that maps field names (via `visit_str`) or field indices (via `visit_u64`) to the field enum variants.
3. A **struct visitor** implementing `serde::de::Visitor` with methods for `visit_map` (key-value deserialization) and `visit_seq` (positional deserialization).
4. The top-level `Deserialize::deserialize` implementation that calls `deserializer.deserialize_struct()` with the struct's name, field names, and the struct visitor [24].

The `visit_map` implementation iterates through deserialized key-value pairs, matches keys against the field enum, deserializes values to their correct types, validates that all required fields are present, and detects duplicate fields -- all through generated code that is fully monomorphized and zero-cost at runtime. The format-agnostic visitor pattern allows a single derived implementation to work across JSON, TOML, YAML, MessagePack, bincode, and any other format implementing `serde`'s `Deserializer` trait.

#### 4.4.3 Attribute-Driven Customization

Serde's derive macros accept a rich set of helper attributes (`#[serde(rename = "...")]`, `#[serde(skip)]`, `#[serde(default)]`, `#[serde(flatten)]`, etc.) that customize the generated code without requiring the user to write manual implementations. The macro inspects these attributes during expansion and adjusts its code generation accordingly. This demonstrates a key strength of procedural macros: they can accept declarative configuration through attributes and translate it into imperative code generation logic.

### 4.5 Attribute Macros: Framework-Level Code Generation

#### 4.5.1 Async Runtime Entry Points

The `#[tokio::main]` attribute macro transforms a synchronous `async fn main()` into a standard `fn main()` that constructs a Tokio runtime and blocks on the async body. The macro consumes the annotated function, extracts its body, and generates a replacement function that wraps the body in `tokio::runtime::Runtime::new().unwrap().block_on(async { ... })` (or a multi-threaded variant). This pattern has become idiomatic in async Rust, with Actix-Web providing `#[actix_web::main]` for similar purposes [25].

#### 4.5.2 Web Framework Routing

Rocket's routing attribute macros (`#[get("/path")]`, `#[post("/path")]`, `#[put("/path")]`, etc.) demonstrate how attribute macros can transform simple function declarations into fully configured HTTP request handlers. The attribute macro:

1. Parses the route URI template from the attribute arguments, extracting path segments, query parameters, and dynamic segments.
2. Inspects the function's parameters to match them against dynamic segments and determine which parameters are extracted from the request path, query string, headers, or body.
3. Generates a `Route` struct containing the handler function, HTTP method, URI pattern, content type negotiation rules, and a ranking for disambiguation.
4. Generates a wrapper function that validates and extracts all parameters using Rocket's `FromParam`, `FromRequest`, and `FromData` traits, invoking the user's handler only after all type-safe extractions succeed [5].

The generated handler validates request guards from left to right, forwarding the request if a guard returns `Forward` or failing with an error if a guard returns `Error`. The return type of the user's function must implement `Responder`, ensuring type-safe response generation. This architecture demonstrates how attribute macros can encode an entire web framework's request-handling pipeline as compile-time code generation.

#### 4.5.3 Testing Infrastructure

The `#[test]` attribute in Rust's standard library is itself an attribute macro (though built into the compiler rather than implemented as a procedural macro). It transforms a function into a test case that the test harness can discover and execute. The `#[tokio::test]` attribute macro extends this pattern to async tests, generating a test function that constructs a Tokio runtime before executing the async body. This pattern of attribute macros as test infrastructure has been adopted widely: `#[sqlx::test]` provisions a database connection, `#[rstest::rstest]` provides parameterized testing, and `#[proptest]` generates property-based test cases.

### 4.6 Macro Hygiene in Practice

#### 4.6.1 Declarative Macro Hygiene

As discussed in Section 2.2, `macro_rules!` macros implement mixed-site hygiene. Local variables and labels defined within a macro body are resolved at the definition site, preventing them from capturing identically named variables at the call site. However, types, functions, modules, and other items are resolved at the call site, allowing macros to refer to items visible in the invoking context [12].

The `$crate` metavariable provides a crucial mechanism for cross-crate macro hygiene. When a macro defined in crate `A` is invoked in crate `B`, `$crate` resolves to `A`'s crate root, allowing the macro to reliably reference items in its defining crate regardless of what is imported at the call site. Without `$crate`, macros would need to rely on users importing specific items, or use absolute paths that might conflict with the user's module structure [16].

#### 4.6.2 Procedural Macro Hygiene

Procedural macros are fundamentally *unhygienic* in their default behavior: generated code is treated as if it were written directly at the invocation site. Every token in the output stream carries a `Span` that determines its hygiene behavior. The `proc_macro` crate provides three span constructors:

- `Span::call_site()`: The identifier resolves at the invocation location, accessing external definitions freely. This is the default and produces fully unhygienic behavior.
- `Span::mixed_site()`: The identifier resolves using the same mixed-site rules as `macro_rules!` -- local variables and labels are hygienic, while other identifiers resolve at the call site.
- `Span::def_site()` (unstable): The identifier resolves exclusively at the macro's definition location, providing full hygiene. This remains unstable because its interaction with proc-macro crate boundaries is not fully resolved [26].

In practice, procedural macro authors must manually manage hygiene by using fully qualified paths (`::std::option::Option` rather than `Option`) to avoid name collisions, choosing unlikely names for generated items (`__internal_foo` rather than `foo`), and using `Span::mixed_site()` when definition-site hygiene for local variables is desired [3].

#### 4.6.3 Comparison with Scheme and Racket

Scheme's original hygienic macro system, stabilized in R5RS's `syntax-rules`, provides full hygiene by default: all identifiers introduced by a macro are resolved at the definition site, and identifiers passed as arguments are resolved at the use site [7]. Racket extends this with Flatt's sets-of-scopes model, which handles complex cases involving local macro definitions and nested expansion more uniformly than the renaming-based approach [9].

Rust's mixed-site hygiene for `macro_rules!` occupies a middle ground: it is hygienic for local variables (preventing the most common class of capture bugs) but unhygienic for items (allowing macros to interact naturally with their invocation context). Procedural macros default to fully unhygienic behavior, placing the burden of hygiene management on the macro author. This pragmatic design reflects Rust's systems programming heritage, where explicit control is often preferred over implicit safety guarantees.

### 4.7 Compile-Time Computation

#### 4.7.1 The `const fn` Mechanism

The `const fn` qualifier, proposed in RFC 911 (accepted April 2015), marks functions whose bodies can be evaluated at compile time [27]. When a `const fn` is called in a *const context* -- the initializer of a `const` item, an array length expression, a const generic argument, or a `const {}` block -- the compiler's CTFE engine interprets the function's MIR rather than generating machine code for it. Outside const contexts, `const fn` calls behave as normal function calls with no compile-time evaluation guarantee [17].

The set of operations permitted in `const fn` has expanded substantially over successive Rust releases. Initially limited to simple arithmetic and constructor calls, `const fn` now supports:

- Control flow: `if`, `match`, `loop`, `while` (stabilized in Rust 1.46)
- Mutable local variables and references (stabilized in Rust 1.46)
- Trait bounds on parameters (stabilized in Rust 1.61, though trait methods cannot be called)
- Closures without environment capture
- Dereferences, including mutable dereferences in `unsafe` blocks
- `let` statements with irrefutable patterns

Notable restrictions remain: `const fn` cannot call non-`const` functions, cannot perform pointer-to-integer casts (which would introduce non-determinism), cannot access `extern static` items, and cannot be `async` [17].

#### 4.7.2 The Miri CTFE Engine

Compile-time function evaluation in Rust is performed by Miri, a MIR interpreter originally developed as a standalone project by Ralf Jung and subsequently integrated into the compiler [28]. Miri operates on an abstract model of a hypothetical machine, interpreting MIR instructions step by step. It maintains an abstract memory model that tracks allocation lifetimes, pointer provenance, and access permissions.

Two critical properties govern the CTFE engine's behavior:

1. **Determinism**: CTFE must produce identical results for identical inputs regardless of the host platform, compilation order, or other environmental factors. This is essential because const-evaluated values can appear in type-level positions (array lengths, const generic arguments) where inconsistent evaluation would compromise type safety [28].

2. **Correctness**: When CTFE evaluates a function, the result must match what runtime execution would produce (modulo platform-dependent behavior like `usize` width, which tracks the *target* platform rather than the host). This ensures that `const fn` functions are semantically identical whether evaluated at compile time or runtime [28].

Ralf Jung's proposed "const type system" framework formalizes these requirements by defining a parallel type system for const contexts that rejects operations incompatible with deterministic compile-time evaluation [28]. Under this framework, a value that is valid for `usize` at runtime (e.g., an integer derived from a pointer address) may not be valid for `usize` in const mode, because pointer addresses are non-deterministic. This formalization clarifies which `unsafe` operations should be permitted in const contexts: those that are *const-safe* (deterministic and unable to observe environmental state).

#### 4.7.3 Const Generics

Const generics, stabilized in `min_const_generics` form in Rust 1.51 (March 2021), allow types and functions to be parameterized by constant values. The stabilized subset permits const generic parameters of integer types, `bool`, and `char`, used as bare parameters in type positions [29]:

```rust
struct Array<T, const N: usize> {
    data: [T; N],
}
```

The unstable `generic_const_exprs` feature would allow arbitrary expressions involving const generic parameters in type positions (e.g., `[T; N + 1]`), but its design has been acknowledged as fundamentally flawed. The feature's current implementation introduces significant compiler complexity and has numerous unresolved design questions around where-clause syntax for const evaluability bounds, interaction with type inference, and coherence rules [30]. A ground-up redesign called `min_generic_const_args` was proposed in 2024 with a significantly reduced scope, aiming for a viable stabilization path through careful limitation of expressible computations [30].

#### 4.7.4 Comparison with C++ constexpr/consteval

C++ has developed compile-time evaluation through three mechanisms: `constexpr` (C++11, significantly enhanced in C++14 and C++17), `consteval` (C++20), and `constinit` (C++20). `constexpr` marks functions that *may* be evaluated at compile time; `consteval` marks functions that *must* be evaluated at compile time (immediate functions); `constinit` ensures that a variable is initialized at compile time without requiring it to be `const` thereafter [31].

C++'s `constexpr` evolution has been more aggressive than Rust's `const fn` in expanding the set of permitted operations. C++20 `constexpr` functions can perform dynamic memory allocation (with `new`/`delete`), use virtual function calls, and include `try`-`catch` blocks. C++23 further permits `static` local variables and `goto` in `constexpr` contexts. The `if consteval` construct (C++23) allows a single function to have both compile-time and runtime code paths [31].

Rust's `const fn`, by contrast, has taken a more conservative approach that prioritizes determinism and safety guarantees. The "const type system" framework provides a principled basis for determining which operations are safe in const contexts, rather than expanding the set of permitted operations opportunistically. This conservatism means that Rust's const evaluation is currently less expressive than C++'s, but its safety properties are better understood and more formally grounded.

### 4.8 Domain-Specific Languages

#### 4.8.1 Serialization DSLs: serde Attributes

While serde's derive macros (Section 4.4) handle the code generation, the `#[serde(...)]` attribute system constitutes a declarative domain-specific language for specifying serialization behavior. Users express serialization policies through attribute annotations rather than imperative code: `#[serde(rename_all = "camelCase")]` specifies naming conventions, `#[serde(tag = "type")]` selects enum representation strategies, and `#[serde(with = "module")]` delegates to custom serialization logic. The derive macro interprets these attributes and generates code implementing the specified policies [4].

#### 4.8.2 SQL DSLs: Diesel and SQLx

The Diesel ORM provides a type-safe query builder that uses Rust's type system and macro-generated schema types to ensure query correctness at compile time [32]. The `table!` macro generates Rust types mirroring database tables, and the query builder API composes these types to produce SQL queries where type errors (column name typos, type mismatches, invalid joins) are caught by the Rust compiler. Diesel's approach requires schema synchronization between the database and generated Rust types, managed through the `diesel print-schema` command.

SQLx takes a fundamentally different approach: rather than providing a Rust DSL for query construction, it accepts raw SQL strings and verifies them at compile time by connecting to a development database during compilation [33]. The `sqlx::query!` macro parses the SQL string, sends it to the connected database for validation, retrieves result column types, and generates a strongly typed struct for the query results. This approach provides compile-time safety for arbitrary SQL without requiring users to learn a Rust-specific query DSL, at the cost of requiring a running database during compilation.

#### 4.8.3 Web UI DSLs: html! and RSX

The Yew web framework provides an `html!` macro that accepts JSX-like syntax for declaring reactive user interface components [34]. The macro parses a token stream containing HTML-like element declarations with Rust expressions for dynamic values, validates the structure at compile time, and generates Rust code that constructs virtual DOM nodes. Leptos extends this pattern with RSX (Rust Syntax Extensions) that compiles to reactive signal-based DOM updates rather than virtual DOM diffing, achieving significantly better performance by generating fine-grained reactive subscriptions at compile time rather than runtime tree diffing [35].

#### 4.8.4 Compile-Time Regex Validation

The `lazy-regex` crate provides a `regex!` macro that validates regular expression syntax at compile time, catching malformed patterns before the program runs [36]. The compiled regex is stored in a lazy static, avoiding recompilation on each use. Since Rust 1.80 stabilized `LazyLock` in the standard library, the underlying lazy initialization mechanism is available without external dependencies, though the compile-time validation of regex syntax still requires a procedural macro.

## 5. Comparative Synthesis

### 5.1 Trade-Off Analysis

The following table synthesizes the key design trade-offs across metaprogramming systems in major languages:

| Dimension | C Preprocessor | C++ Templates | Rust `macro_rules!` | Rust Proc Macros | Lisp Macros | Template Haskell | Zig comptime | Nim Macros |
|-----------|---------------|---------------|---------------------|------------------|-------------|-----------------|-------------|------------|
| **Abstraction level** | Textual | Token/type substitution | Token-tree pattern matching | Token stream transformation | S-expression AST | Typed AST (splice/quote) | Same-language CTFE | AST nodes |
| **Hygiene** | None | N/A (name mangling) | Mixed-site (partial) | Unhygienic by default; manual span control | Full (syntax-rules) or manual (syntax-case) | Full (renaming-based) | N/A (no syntactic macros) | None |
| **Type awareness** | None | Full (post-substitution) | None (pre-type-checking) | None (pre-type-checking) | None (pre-type-checking) | Full (typed splices) | Full (same type system) | Partial (AST-level) |
| **Error quality** | Poor (post-substitution) | Poor for templates; good with Concepts (C++20) | Moderate (pattern-level) | Depends on implementation | Poor (expansion-site) | Moderate | Good (same-language errors) | Moderate |
| **Debugging** | Difficult (preprocessor output) | Very difficult | `cargo expand`, trace macros | `cargo expand`, trybuild | `macroexpand` | `-ddump-splices` | Standard debugging | `dumpTree` |
| **IDE integration** | Good (simple substitution) | Moderate | Moderate | Challenging (external process) | Limited | Limited | Good (standard code) | Limited |
| **Expressiveness** | Low (no recursion, no types) | Turing-complete (accidentally) | Turing-complete (recursion) | Turing-complete (arbitrary Rust) | Turing-complete (full language) | Turing-complete (full Haskell) | Turing-complete (full language) | Turing-complete (full Nim) |
| **Compile-time cost** | Minimal | High (instantiation explosion) | Moderate (quadratic patterns) | Moderate (external process) | Minimal | High (GHC invocation) | Moderate | Moderate |
| **Separate language** | Yes (preprocessor directives) | Partial (template syntax) | Partial (matcher syntax) | No (regular Rust) | No (same language) | Partial (Oxford brackets) | No (same language) | No (same language) |

### 5.2 Detailed Comparisons

#### 5.2.1 C Preprocessor

The C preprocessor operates through textual substitution before parsing, making it the lowest-abstraction macro system in common use. Its limitations are well-documented: no hygiene (the classic `#define max(a,b) ((a) > (b) ? (a) : (b))` evaluates its arguments multiple times), no type awareness (macro parameters are raw text), no recursion (macros cannot invoke themselves), and no syntactic validation (the preprocessor cannot distinguish expressions from statements) [13]. Rust's macro system improves on every one of these dimensions while retaining the C preprocessor's zero-runtime-cost property.

#### 5.2.2 C++ Templates and constexpr

C++ template metaprogramming evolved as an unintended consequence of the template instantiation mechanism. Erwin Unruh demonstrated in 1994 that templates could perform arbitrary computation at compile time, and the technique was subsequently systematized as a programming paradigm [14]. Template metaprogramming is notoriously difficult: computation is expressed through type-level recursion and partial specialization rather than functions and control flow, error messages involve deeply nested type names, and debugging requires specialized tools.

C++20 Concepts address the error-message problem by allowing template authors to specify constraints on type parameters, moving errors from deep inside template instantiation to the point where an unsatisfied constraint is detected. C++ `constexpr` and `consteval` provide a more natural compile-time computation model using standard function syntax, but these mechanisms are separate from and complementary to templates rather than replacements for them [31].

Rust's approach is more unified: `macro_rules!` and procedural macros handle syntactic code generation, `const fn` handles compile-time computation, and trait bounds on generics handle constrained polymorphism. These mechanisms have clearer boundaries and interact more predictably than C++'s layered accumulation of template metaprogramming, SFINAE, Concepts, `constexpr`, and `consteval`.

#### 5.2.3 Lisp Macros

Lisp's homoiconic syntax -- where code and data share the same representation as S-expressions -- makes macro writing natural: a macro is simply a function that takes code as data and returns transformed code as data [37]. This conceptual simplicity, combined with the full power of the host language being available during macro expansion, gives Lisp macros unmatched flexibility. However, the lack of static types in traditional Lisp means that macro-generated code is not type-checked until execution, and the absence of a module system in many Lisp dialects (outside Racket) means that macros can have far-reaching and difficult-to-predict effects on their environment.

Rust's procedural macros achieve similar expressiveness to Lisp macros -- arbitrary Rust code can run during expansion -- but operate within a statically typed context where the generated code must pass type checking. This trades some flexibility for earlier error detection: a Rust proc macro that generates type-incorrect code will fail at compile time rather than at runtime.

#### 5.2.4 Template Haskell

Template Haskell provides compile-time metaprogramming through *splicing* (inserting generated code) and *quoting* (lifting code to an AST representation) [38]. Splices are written as `$(expr)` where `expr` has type `Q Exp`, `Q Dec`, or `Q Type` (the `Q` monad provides access to compiler information during code generation). Quotation brackets `[| ... |]` convert concrete syntax to AST representations.

Template Haskell operates on *typed* ASTs, meaning the compiler can verify that spliced code is well-typed before insertion. This provides stronger guarantees than Rust's token-stream-based procedural macros, where type errors in generated code are detected only after expansion. However, Template Haskell's reliance on GHC internals (the AST types) means that macros can break across GHC versions, and the staging restriction (spliced expressions must be defined in a separate module) imposes architectural constraints similar to Rust's separate-crate requirement for proc macros [38].

#### 5.2.5 Zig comptime

Zig's `comptime` provides perhaps the most radical departure from traditional macro systems. Rather than providing a separate macro language, Zig allows ordinary functions and data structures to be used at compile time when parameters are marked `comptime` [15]. Type itself is a first-class comptime value, enabling generics through `fn max(comptime T: type, a: T, b: T) T`. The compiler evaluates comptime expressions using the same semantics as runtime execution, generating specialized code for each set of comptime arguments.

Zig's approach eliminates the "two languages" problem that plagues C++ templates and, to a lesser extent, Rust's `macro_rules!`. However, it cannot perform syntactic transformations: there is no way to define new syntax, create DSLs, or transform the structure of code (only its parameterization). Zig also lacks traits or interfaces, so the requirements of a generic function are implicit in its body rather than declared in its signature -- a trade-off that sacrifices Rust's clear error messages at constraint boundaries for Zig's syntactic simplicity [15].

#### 5.2.6 Nim Macros

Nim provides a three-tiered metaprogramming system: templates (syntactic substitution), generic functions (type-parameterized), and macros (AST transformation) [39]. Nim macros receive the AST of their arguments and can inspect, deconstruct, and construct new AST nodes using the same Nim language used for runtime code. The `macros` module provides access to the compiler's AST types, and `parseStmt`/`parseExpr` functions allow macros to generate AST from string representations.

Like Zig's comptime, Nim macros use the same language for compile-time and runtime code, avoiding the dual-language problem. Unlike Zig, Nim macros operate on the AST and can perform arbitrary syntactic transformations, enabling DSL construction. However, Nim macros are not hygienic: generated identifiers can capture or be captured by surrounding code, requiring the macro author to manage naming conflicts manually [39].

## 6. Open Problems & Gaps

### 6.1 Declarative Macros 2.0

RFC 1584 proposed a new declarative macro system using the `macro` keyword to replace `macro_rules!`, with three key improvements: proper module-system integration with `pub` visibility qualifiers, definition-site hygiene (rather than mixed-site), and a syntax closer to Rust functions [40]. The `macro` keyword was reserved in Rust 1.0 for this purpose.

As of 2026, the `decl_macro` feature remains unstable, tracked under issue #39412 on the Rust repository. The implementation has proceeded incrementally but faces challenges in resolving interactions with the existing `macro_rules!` system, particularly around backwards compatibility for macros that rely on mixed-site hygiene to access items at the call site. The practical impact is that `macro_rules!` remains the only stable declarative macro system, with its textual scoping, mixed-site hygiene, and syntactic limitations intact.

### 6.2 Eager Macro Expansion

Rust's macro expansion is *lazy* by default: outer macros are expanded before inner macros. This means that in `outer!(inner!())`, `outer!` receives the unexpanded token sequence `inner!()` rather than its expansion. Eager expansion -- where inner macros are expanded first -- is available only for a small set of built-in macros (`concat!`, `include!`, `env!`, etc.) and is not available to user-defined macros [41].

RFC 2320 proposed a mechanism for eager expansion of user-defined macros, but the proposal was never accepted due to concerns about interaction with name resolution (eager expansion of an inner macro might depend on names introduced by the outer macro's expansion) and the resulting increase in compiler complexity. The `eager` and `eager2` crates provide workarounds through procedural macros, but these are limited in scope and add compilation overhead [41].

### 6.3 Procedural Macro IDE Integration

IDE support for procedural macros remains one of the most challenging open problems in Rust tooling. The fundamental difficulty is bidirectional mapping: while the compiler only needs to expand macros forward (from source to generated code), IDEs must also map backward (from generated code to the source that produced it) to support features like go-to-definition, rename, and code completion within macro-generated code [42].

Additional challenges include:

- **Name resolution circularity**: Macros can introduce new top-level names, but resolving which macro is invoked requires knowing the existing set of names, creating a circular dependency that prevents embarrassingly parallel analysis [42].
- **Incomplete code tolerance**: IDEs must analyze code while the programmer is actively typing, producing incomplete syntax that causes procedural macros to panic or emit `compile_error!`. Recovering from these failures without losing all analysis results requires defensive engineering throughout the macro expansion pipeline [42].
- **Resource containment**: Procedural macros execute arbitrary code and may consume unbounded resources or produce non-deterministic results. IDEs run macros in external processes with resource limits, adding IPC complexity and latency to every analysis pass [42].
- **Determinism assumptions**: rust-analyzer assumes all computations are deterministic for its incremental computation model, but procedural macros may use system time, random numbers, or network access during expansion [42].

### 6.4 Macro Debugging and Stepping

Debugging macro-generated code remains a largely manual process. The primary tools available are:

- `cargo expand` (by David Tolnay): Expands all macros in a crate and prints the resulting code, optionally formatted with `rustfmt` [43].
- `trybuild` (by David Tolnay): Tests that procedural macros produce expected compilation errors by comparing compiler output against stored `.stderr` files [44].
- `macrotest`/`tryexpand`: Tests that macro expansions match expected `.expanded.rs` files [44].
- rust-analyzer's "Expand Macro Recursively" command: Shows the expansion of a specific macro invocation within the IDE [42].
- The unstable `-Zproc-macro-backtrace` compiler flag: Provides backtraces when procedural macros panic during expansion.

What remains absent is the ability to *step through* macro expansion interactively, set breakpoints on specific expansion rules, or inspect intermediate expansion states. The declarative nature of `macro_rules!` pattern matching makes traditional step debugging conceptually awkward, while the external-process execution model of procedural macros makes debugger attachment logistically complex.

### 6.5 Const Generics: The `generic_const_exprs` Problem

The full vision of const generics -- where arbitrary expressions involving const generic parameters can appear in type positions -- remains unrealized. The `generic_const_exprs` feature has been acknowledged by the compiler team as having fundamental design flaws that preclude stabilization in its current form [30]. Key unresolved issues include:

- **Where-clause syntax**: Users currently add `where [u8; expr]: Sized` bounds as a workaround for expressing that a const expression is evaluable, but this is semantically incorrect and a dedicated syntax is needed.
- **Interaction with type inference**: Complex const expressions in type positions create unification problems that the current inference engine cannot reliably solve.
- **Coherence rules**: How const expressions interact with Rust's trait coherence (orphan rules) is not fully specified.

The `min_generic_const_args` proposal aims for a significantly reduced scope that would be stabilizable, focusing on const parameters that are either bare generic parameters or fully concrete expressions, with arithmetic and other operations on generic const parameters deferred to future work [30].

### 6.6 Const Trait Methods

A significant limitation of `const fn` is that trait methods cannot be marked as `const`. While `const fn` functions can accept parameters bounded by traits (since Rust 1.61), they cannot call methods defined by those traits. The `const_trait_impl` feature is under active development but faces design challenges around how to express that a trait implementation is const (all methods are evaluable at compile time) and how this interacts with dynamic dispatch (`dyn Trait`) and trait objects.

## 7. Conclusion

Rust's metaprogramming system represents a carefully engineered set of trade-offs between power, safety, and usability. The stratification into declarative macros, procedural macros, and compile-time function evaluation provides programmers with tools at multiple abstraction levels, each suited to different classes of metaprogramming tasks.

Declarative macros offer a lightweight, partially hygienic mechanism for pattern-based code generation that handles the majority of "simple" metaprogramming needs: variadic argument lists, repetitive trait implementations, and conditional compilation. Their limitations -- fragment opacity, textual scoping, quadratic expansion patterns -- are well-understood and drive the adoption of procedural macros for more complex use cases.

Procedural macros, powered by the `syn`/`quote`/`proc-macro2` ecosystem, provide the full power of the Rust language during compilation. The serde framework demonstrates that this power can be deployed to create seamless, zero-cost abstractions that would be impossible through any other mechanism. The trade-offs are equally significant: the separate-crate requirement, the external-process execution model, the absence of default hygiene, and the challenges for IDE integration all impose engineering costs that must be weighed against the benefits.

Compile-time function evaluation through `const fn` and const generics is the youngest and most rapidly evolving area, with Ralf Jung's "const type system" framework providing theoretical guidance for principled expansion of capabilities. The gap between Rust's conservative approach and C++'s more aggressive `constexpr` evolution reflects a deeper philosophical difference: Rust prioritizes formal safety guarantees over immediate expressiveness, accepting temporary limitations in exchange for a clearer path to correct-by-construction compile-time evaluation.

The open problems identified in this survey -- macros 2.0, eager expansion, IDE integration, macro debugging, and `generic_const_exprs` -- represent active areas of research and development within the Rust project. Their resolution will determine whether Rust's metaprogramming system can maintain its position as one of the most thoughtfully designed in any production programming language, balancing the expressive power that systems programmers demand with the safety guarantees that Rust promises.

## References

[1] D. Spinellis, "Notable Design Patterns for Domain-Specific Languages," *Journal of Systems and Software*, vol. 56, no. 1, pp. 91-99, 2001.

[2] S. Klabnik and C. Nichols, "Macros," in *The Rust Programming Language*, ch. 20.5, https://doc.rust-lang.org/book/ch20-05-macros.html

[3] "Procedural Macros," *The Rust Reference*, https://doc.rust-lang.org/reference/procedural-macros.html

[4] D. Tolnay, "Serde: Serialization Framework for Rust," https://serde.rs/derive.html; GitHub: https://github.com/serde-rs/serde

[5] "Overview," *Rocket Web Framework Guide v0.5*, https://rocket.rs/guide/v0.5/overview/

[6] E. Kohlbecker, D. P. Friedman, M. Felleisen, and B. Duba, "Hygienic Macro Expansion," *Proceedings of the 1986 ACM Conference on LISP and Functional Programming*, pp. 151-161, 1986, https://dl.acm.org/doi/10.1145/319838.319859

[7] W. Clinger and J. Rees, "Macros That Work," *Proceedings of the 18th ACM SIGPLAN-SIGACT Symposium on Principles of Programming Languages*, 1991.

[8] R. K. Dybvig, R. Hieb, and C. Bruggeman, "Syntactic Abstraction in Scheme," *Lisp and Symbolic Computation*, vol. 5, no. 4, pp. 295-326, 1993.

[9] M. Flatt, "Binding as Sets of Scopes," *Proceedings of the 43rd ACM SIGPLAN-SIGACT Symposium on Principles of Programming Languages (POPL)*, 2016, https://www-old.cs.utah.edu/plt/scope-sets/

[10] M. Flatt, R. Culpepper, D. Darais, and R. B. Findler, "Macros That Work Together: Compile-time Bindings, Partial Expansion, and Definition Contexts," *Journal of Functional Programming*, vol. 22, no. 2, pp. 181-216, 2012, https://david.darais.com/assets/papers/macros-that-work-together/mtwt.pdf

[11] N. Cameron, "Macros in Rust, pt3," 2015, https://www.ncameron.org/blog/macros-in-rust-pt3/

[12] "Hygiene," *The Little Book of Rust Macros*, https://lukaswirth.dev/tlborm/decl-macros/minutiae/hygiene.html

[13] "Macros: A Guide to Porting C and C++ code to Rust," https://locka99.gitbooks.io/a-guide-to-porting-c-to-rust/content/features_of_rust/macros.html

[14] T. Hume, "Models of Generics and Metaprogramming: Go, Rust, Swift, D and More," 2019, https://thume.ca/2019/07/14/a-tour-of-metaprogramming-models-for-generics/

[15] R. Athaydes, "Zig comptime: Does Anything Come Close?" https://renato.athaydes.com/posts/comptime-programming

[16] "Macros by Example," *The Rust Reference*, https://doc.rust-lang.org/reference/macros-by-example.html

[17] "Constant Evaluation," *The Rust Reference*, https://doc.rust-lang.org/reference/const_eval.html

[18] "Push-down Accumulation" and "Incremental TT Munchers," *The Little Book of Rust Macros*, https://lukaswirth.dev/tlborm/decl-macros/patterns/push-down-acc.html; https://lukaswirth.dev/tlborm/decl-macros/patterns/tt-muncher.html

[19] "Procedural Macros Under the Hood: Part II," *The RustRover Blog*, JetBrains, 2022, https://blog.jetbrains.com/rust/2022/07/07/procedural-macros-under-the-hood-part-ii/

[20] "Why Do We Need Procedural Macro Separation on a Crate Level?" *The Rust Programming Language Forum*, https://users.rust-lang.org/t/why-do-we-need-procedural-macro-separation-on-a-crate-level/107295

[21] "proc-macro2," crates.io, https://crates.io/crates/proc-macro2

[22] D. Tolnay, "syn: Parser for Rust Source Code," GitHub, https://github.com/dtolnay/syn

[23] D. Tolnay, "quote: Rust Quasi-Quoting," GitHub, https://github.com/dtolnay/quote

[24] O. Gage, "Understanding Rust's serde Using Macro Expansion," 2021, https://owengage.com/writing/2021-07-23-serde-expand/

[25] "main," *actix-web documentation*, https://docs.rs/actix-web/latest/actix_web/attr.main.html

[26] "Hygiene and Spans," *The Little Book of Rust Macros*, https://lukaswirth.dev/tlborm/proc-macros/hygiene.html

[27] "RFC 0911: const fn," *The Rust RFC Book*, https://rust-lang.github.io/rfcs/0911-const-fn.html

[28] R. Jung, "Thoughts on Compile-Time Function Evaluation and Type Systems," 2018, https://www.ralfj.de/blog/2018/07/19/const.html

[29] "RFC 2000: Const Generics," *The Rust RFC Book*, https://rust-lang.github.io/rfcs/2000-const-generics.html

[30] "Tracking Issue for Complex Generic Constants: `feature(generic_const_exprs)`," rust-lang/rust #76560, https://github.com/rust-lang/rust/issues/76560; "Stabilizable Prototype for Expanded Const Generics," *Rust Project Goals 2024h2*, https://rust-lang.github.io/rust-project-goals/2024h2/min_generic_const_arguments.html

[31] "const vs constexpr vs consteval vs constinit in C++20," *C++ Stories*, https://www.cppstories.com/2022/const-options-cpp20/

[32] "Compare Diesel," *Diesel*, https://diesel.rs/compare_diesel.html

[33] "SQLx: The Rust SQL Toolkit," GitHub, https://github.com/launchbadge/sqlx; "query macro," https://docs.rs/sqlx/latest/sqlx/macro.query.html

[34] "Yew: Rust/Wasm Framework for Building Client Web Apps," https://yew.rs/

[35] "Leptos: Build Fast Web Applications with Rust," GitHub, https://github.com/leptos-rs/leptos; https://book.leptos.dev/

[36] "lazy-regex: Lazy Static Regular Expressions Checked at Compile Time," GitHub, https://github.com/Canop/lazy-regex

[37] S. Dobson, "C++ Template Macroprogramming versus Lisp Macros," 2024, https://simondobson.org/2024/06/21/c++-template-macroprogramming-versus-lisp-macros/

[38] "Template Haskell," *Glasgow Haskell Compiler User's Guide*, https://ghc.gitlab.haskell.org/ghc/doc/users_guide/exts/template_haskell.html; T. Sheard, "Template Meta-programming for Haskell," https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/meta-haskell.pdf

[39] "Nim Tutorial Part III," https://nim-lang.org/docs/tut3.html; "Introduction to Metaprogramming in Nim," *HookRace*, https://hookrace.net/blog/introduction-to-metaprogramming-in-nim/

[40] "RFC 1584: Macros 2.0," *The Rust RFC Book*, https://rust-lang.github.io/rfcs/1584-macros.html; "Tracking Issue: Declarative Macros 2.0," rust-lang/rust #39412, https://github.com/rust-lang/rust/issues/39412

[41] "RFC: Eager Macro Expansion," rust-lang/rfcs #2320, https://github.com/rust-lang/rfcs/pull/2320; "eager2: Rust Proc-Macros for Eager Macro Expansion," GitHub, https://github.com/Daniel-Aaron-Bloom/eager2

[42] "IDEs and Macros," *rust-analyzer Blog*, 2021, https://rust-analyzer.github.io//blog/2021/11/21/ides-and-macros.html; "What Every Rust Developer Should Know About Macro Support in IDEs," *The RustRover Blog*, JetBrains, 2022, https://blog.jetbrains.com/rust/2022/12/05/what-every-rust-developer-should-know-about-macro-support-in-ides/

[43] D. Tolnay, "cargo-expand: Subcommand to Show Result of Macro Expansion," GitHub, https://github.com/dtolnay/cargo-expand

[44] D. Tolnay, "trybuild," crates.io, https://crates.io/crates/trybuild; "macrotest," https://docs.rs/macrotest; "Structuring, Testing and Debugging Procedural Macro Crates," *Ferrous Systems*, https://ferrous-systems.com/blog/testing-proc-macros/

## Practitioner Resources

**Reference Documentation**
- *The Rust Reference: Macros by Example* -- Authoritative specification of `macro_rules!` syntax, fragment specifiers, and scoping rules: https://doc.rust-lang.org/reference/macros-by-example.html
- *The Rust Reference: Procedural Macros* -- Specification of derive, attribute, and function-like procedural macros: https://doc.rust-lang.org/reference/procedural-macros.html
- *The Rust Reference: Constant Evaluation* -- Specification of const contexts, `const fn`, and evaluation rules: https://doc.rust-lang.org/reference/const_eval.html

**Learning Resources**
- *The Little Book of Rust Macros* (maintained by Lukas Wirth) -- The most comprehensive guide to `macro_rules!` patterns, hygiene, and advanced techniques: https://lukaswirth.dev/tlborm/
- *Procedural Macros in Rust* by LogRocket Blog -- Practical tutorial covering the `syn`/`quote` workflow: https://blog.logrocket.com/procedural-macros-in-rust/
- *Guide to Rust Procedural Macros* by developerlife.com -- Detailed walkthrough of all three proc macro kinds: https://developerlife.com/2022/03/30/rust-proc-macro/

**Essential Crates**
- `syn` (v2.x) -- Rust syntax parser for proc macros: https://github.com/dtolnay/syn
- `quote` -- Quasi-quoting for token stream generation: https://github.com/dtolnay/quote
- `proc-macro2` -- Compiler-independent token stream types: https://crates.io/crates/proc-macro2
- `cargo-expand` -- View expanded macro output: https://github.com/dtolnay/cargo-expand
- `trybuild` -- Test compilation errors from proc macros: https://crates.io/crates/trybuild
- `macrotest` -- Snapshot testing for macro expansions: https://docs.rs/macrotest

**Research Papers**
- Kohlbecker et al., "Hygienic Macro Expansion" (1986) -- The foundational paper on macro hygiene: https://dl.acm.org/doi/10.1145/319838.319859
- Flatt et al., "Macros That Work Together" (2012) -- The algorithm underlying Rust's hygiene implementation: https://david.darais.com/assets/papers/macros-that-work-together/mtwt.pdf
- Flatt, "Binding as Sets of Scopes" (2016) -- Modern hygiene theory for Racket: https://www-old.cs.utah.edu/plt/scope-sets/
- Jung, "Thoughts on Compile-Time Function Evaluation and Type Systems" (2018) -- Theoretical framework for const evaluation safety: https://www.ralfj.de/blog/2018/07/19/const.html
- Hume, "Models of Generics and Metaprogramming" (2019) -- Cross-language taxonomy of metaprogramming approaches: https://thume.ca/2019/07/14/a-tour-of-metaprogramming-models-for-generics/

**Tracking Issues and RFCs**
- Declarative Macros 2.0: https://github.com/rust-lang/rust/issues/39412
- Const Generics (RFC 2000): https://github.com/rust-lang/rust/issues/44580
- `generic_const_exprs`: https://github.com/rust-lang/rust/issues/76560
- Eager Macro Expansion: https://github.com/rust-lang/rfcs/pull/2320
- Proc Macro IDE Integration: https://github.com/rust-lang/rust-analyzer/issues/11014
