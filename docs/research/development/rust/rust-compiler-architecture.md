---
title: "The Rust Compiler: From Source to LLVM IR"
date: 2026-03-21
summary: A deep survey of the Rust compiler architecture covering the full pipeline from parsing through HIR, MIR, and LLVM codegen -- with emphasis on the query-based incremental compilation system, MIR-based borrow checking, and the diagnostic infrastructure.
keywords: [rust, compiler, MIR, LLVM, incremental-compilation, borrow-checker]
---

# The Rust Compiler: From Source to LLVM IR

*2026-03-21*

## Abstract

The Rust programming language has distinguished itself among systems languages through a compiler architecture that enforces memory safety and data-race freedom at compile time without garbage collection. The `rustc` compiler achieves this through a carefully layered pipeline of intermediate representations -- from the initial Abstract Syntax Tree (AST), through High-Level IR (HIR) and Typed HIR (THIR), to Mid-Level IR (MIR), and finally to LLVM IR for machine code generation. Each representation serves a distinct purpose: the AST captures syntactic structure and supports macro expansion; the HIR provides a desugared, compiler-friendly representation for type checking and trait resolution; MIR reduces the language to a control-flow graph of primitive operations suitable for borrow checking, dataflow analysis, and Rust-specific optimizations; and LLVM IR enables the full suite of industrial-strength backend optimizations and multi-architecture code generation.

What makes `rustc` architecturally distinctive among production compilers is its demand-driven query system, which organizes the entire compilation process as a graph of memoized pure functions rather than sequential passes. This design enables incremental compilation through a red-green algorithm that fingerprints query results and recomputes only those subgraphs affected by source changes. The query system, inspired by the Salsa framework used in rust-analyzer, represents a mature implementation of the ideas behind adapton-style incremental computation applied to a production compiler serving millions of developers.

This survey examines each stage of the `rustc` pipeline at PhD depth, with particular attention to the design decisions that differentiate Rust's compilation model from those of comparable languages. We analyze the MIR-based borrow checker and its Non-Lexical Lifetimes (NLL) algorithm, the incremental compilation infrastructure, the procedural macro expansion system, the diagnostic architecture that produces Rust's famously helpful error messages, and the emerging alternative backends -- Cranelift and GCC -- that are reshaping the compiler's codegen story. We situate these design choices within the broader landscape of compiler architectures for systems languages, drawing comparisons with Go's `gc` compiler, GHC's Core/STG/Cmm pipeline, and Swift's SIL-based approach.

## 1. Introduction

### 1.1 The Compilation Challenge of Rust

Rust presents a uniquely demanding compilation problem among systems programming languages. Its type system encodes ownership, borrowing, and lifetime constraints that must be verified at compile time -- a class of static analyses with no direct precedent in mainstream language implementations. The compiler must perform affine type checking (ensuring values are used at most once unless explicitly copied), region inference (determining the minimal valid lifetimes for all references), and trait resolution (a form of logic programming that resolves generic constraints to concrete implementations). These analyses interact with one another and with conventional type inference in ways that make the compilation process substantially more complex than that of languages like C, C++, or Go.

The `rustc` compiler addresses this complexity through a multi-stage pipeline where each intermediate representation is designed to make specific analyses tractable. Rather than attempting to verify all safety properties on a single representation, the compiler progressively desugars and simplifies the program, checking different properties at the representation level most suited to each analysis. Type checking and trait resolution operate on HIR, where the connection to user-written syntax remains visible. Borrow checking operates on MIR, where control flow is explicit and all implicit operations have been made manifest. Code generation operates on LLVM IR, where Rust-specific semantics have been fully lowered to machine-level abstractions.

### 1.2 Scope and Organization

This survey covers the complete `rustc` pipeline from source text to machine code. Section 2 establishes the theoretical foundations underlying Rust's compilation model. Section 3 provides a taxonomy of the pipeline stages as a classification framework. Section 4 analyzes each stage in depth: lexing and parsing (4.1), macro expansion (4.2), HIR lowering and type checking (4.3), MIR construction and borrow checking (4.4), the query system and incremental compilation (4.5), LLVM codegen and optimization (4.6), alternative backends (4.7), and the diagnostic infrastructure (4.8). Section 5 provides a comparative synthesis with other compiler architectures. Section 6 identifies open problems and active research directions. Section 7 concludes.

### 1.3 Key Definitions

**Intermediate Representation (IR)**: A data structure used internally by a compiler to represent the source program at a particular level of abstraction. Modern compilers typically employ multiple IRs, each optimized for specific analyses or transformations.

**Control-Flow Graph (CFG)**: A representation of a program as a directed graph where nodes are basic blocks (sequences of instructions with a single entry and exit point) and edges represent possible transfers of control. CFGs are the standard representation for dataflow analyses.

**Region inference**: The process of determining the minimal set of program points at which each reference (borrow) must be valid, subject to the constraints imposed by how references are used and the control flow of the program. In Rust, regions correspond to lifetimes.

**Monomorphization**: The compiler strategy of generating specialized copies of generic code for each concrete type instantiation, as opposed to type erasure (used by Java) or dictionary passing (used by Haskell). Monomorphization produces faster code at the cost of larger binaries and longer compilation times.

**Demand-driven compilation**: An architecture where compilation tasks are organized as queries that are executed only when their results are needed, rather than as a fixed sequence of passes over the entire program. Results are memoized and can be reused across compilation sessions.

## 2. Foundations

### 2.1 Type Theory and Ownership

Rust's type system draws from substructural type theory, specifically affine types where values can be used at most once [Walker, 2005]. The ownership system can be understood as a practical realization of affine typing combined with a region-based memory management discipline [Tofte and Talpin, 1997]. Each value in Rust has a single owner, and when ownership is transferred (moved), the source becomes invalid. References (borrows) provide temporary access to values without transferring ownership, subject to the constraint that at any program point, a value may have either one mutable reference or any number of shared references -- but not both simultaneously.

This discipline, enforced statically by the borrow checker, eliminates data races at compile time: shared access is always immutable, and mutable access is always exclusive. The theoretical foundation connects to the work of Boyapati, Lee, and Rinard [2002] on ownership types for safe programming and to the Cyclone language's region-based memory safety [Jim et al., 2002], though Rust's system is substantially more ergonomic due to lifetime elision rules and the Non-Lexical Lifetimes analysis.

### 2.2 Query-Based Compilation

Traditional compilers are organized as a pipeline of sequential passes: each pass reads the entire program in one representation, transforms it, and writes the result in another representation. This architecture, while simple, has poor incremental compilation properties because a change to any part of the input forces re-execution of all subsequent passes.

An alternative, pioneered by systems like the Roslyn C# compiler and formalized by frameworks like Adapton [Hammer et al., 2014], organizes computation as a graph of memoized pure functions. Each function (query) declares its inputs and produces a deterministic output. When inputs change, a change-propagation algorithm determines which cached results remain valid and which must be recomputed. This approach, known as demand-driven or query-based compilation, is the architectural foundation of `rustc` and, via the Salsa framework [Matsakis, 2018], of rust-analyzer.

### 2.3 Dataflow Analysis on Control-Flow Graphs

Borrow checking in `rustc` is implemented as a collection of dataflow analyses on the MIR control-flow graph. The theoretical foundation is the lattice-theoretic framework of Kildall [1973], where program properties are represented as elements of a lattice and transfer functions propagate information along CFG edges until a fixed point is reached. The key analyses -- liveness, reaching definitions, and available borrows -- are all instances of this framework, computed via iterative forward or backward passes over the CFG's basic blocks.

The Non-Lexical Lifetimes system [Matsakis, 2017] extends classical dataflow analysis by representing lifetimes as sets of CFG points and computing minimal lifetime sets through constraint propagation. This formulation allows lifetimes to have gaps (a reference need not be valid at all points between its creation and last use) and to follow control flow precisely (a reference can be valid along one branch but not another).

## 3. Taxonomy of Approaches

The `rustc` pipeline can be classified into six major stages, each corresponding to a distinct intermediate representation and a characteristic set of analyses or transformations:

| Stage | Representation | Key Operations | Primary Crate(s) |
|-------|---------------|----------------|-------------------|
| Lexing and Parsing | Token stream, AST | Tokenization, syntax analysis, macro expansion, name resolution, early linting | `rustc_lexer`, `rustc_parse`, `rustc_expand`, `rustc_resolve` |
| HIR Lowering | HIR | Desugaring, `DefId`/`HirId` assignment, out-of-band storage | `rustc_ast_lowering` |
| Type Analysis | HIR + `Ty<'tcx>` | Type inference, trait resolution, type checking, coherence | `rustc_hir_typeck`, `rustc_trait_selection`, `rustc_infer` |
| MIR Construction | THIR, MIR | CFG construction, borrow checking, dataflow analysis, MIR optimization, const evaluation | `rustc_mir_build`, `rustc_borrowck`, `rustc_mir_transform`, `rustc_const_eval` |
| Code Generation | LLVM IR | Monomorphization collection, CGU partitioning, LLVM IR emission, LLVM optimization | `rustc_monomorphize`, `rustc_codegen_llvm`, `rustc_codegen_ssa` |
| Linking | Object files, executables | Symbol resolution, relocation, binary emission | System linker, `rustc_codegen_ssa` |

This staging reflects a progressive lowering of abstraction: user-facing syntax in the AST gives way to compiler-friendly desugared forms in HIR, then to a flat CFG of primitive operations in MIR, and finally to the machine-oriented abstractions of LLVM IR. Each transition discards information that is no longer needed while making previously implicit structure explicit -- a pattern common to multi-IR compilers but taken to an unusual degree of refinement in `rustc` due to the complexity of Rust's semantic analysis requirements.

## 4. Analysis

### 4.1 Lexing, Parsing, and AST Construction

The compilation process begins when the `rustc_driver` crate parses command-line arguments and creates a `rustc_interface::Config` specifying compilation parameters. Source text enters the pipeline through a two-level lexing architecture. The `rustc_lexer` crate performs low-level tokenization, converting raw Unicode source text into a stream of atomic tokens. This crate is deliberately minimal and dependency-free, supporting use cases beyond the compiler itself (syntax highlighting, IDE integration). The higher-level `rustc_parse::Lexer` then performs validation and string interning -- "a way of storing only one immutable copy of each distinct string value" [rustc-dev-guide] -- converting string tokens into interned `Symbol` values for efficient comparison throughout the rest of compilation.

Parsing uses a handwritten recursive descent approach rather than a parser generator. The parser is organized semantically, with separate modules for expressions (`expr.rs`), patterns (`pat.rs`), types (`ty.rs`), and statements (`stmt.rs`). Entry points include `Parser::parse_crate_mod` for top-level parsing and `Parser::parse_nonterminal` for macro arguments. The resulting AST, defined in `rustc_ast`, intentionally accepts a superset of valid Rust -- syntactically plausible but semantically invalid constructs are parsed successfully and diagnosed in later stages, improving error recovery and enabling the parser to report multiple errors per compilation.

The parsing stage encompasses several concurrent activities beyond pure syntax analysis. Macro expansion, performed by `rustc_expand`, iteratively resolves and expands declarative and procedural macros. Name resolution, performed by `rustc_resolve`, binds identifiers to their definitions. AST validation checks syntactic well-formedness properties that the grammar alone does not enforce. Early linting performs initial code quality checks. These activities are interleaved because macro expansion can introduce new names and new macro invocations, requiring iterative resolution until a fixed point is reached.

### 4.2 Procedural Macro Expansion

Macro expansion in `rustc` is a sophisticated iterative process orchestrated by `MacroExpander::fully_expand_fragment`. The expander maintains a queue of unresolved macro invocations and processes them in cycles: resolving imports in the partially built crate, collecting new macro invocations (function-like macros, attribute macros, and derive macros), attempting to resolve the first queued invocation, executing the macro's expander function if resolution succeeds, and integrating the output back into the AST. This cycle continues until the queue is empty or no further progress can be made, in which case a compilation error is reported [rustc-dev-guide, Macro Expansion].

Procedural macros operate on `TokenStream` objects -- collections of `TokenTree` values representing individual tokens or delimited groups. This abstraction decouples macro implementation from the compiler's internal AST representation. The stable `proc_macro::TokenStream` type used by procedural macro crates differs from the compiler's internal `rustc_ast::tokenstream::TokenStream`; conversion between the two occurs via a C ABI boundary in `rustc_expand::proc_macro`. Declarative macros (macros-by-example) use a dedicated NFA-based parser that matches input token sequences against pattern rules, binding metavariables that are then substituted during transcription of the rule's right-hand side.

Rust's macro hygiene system prevents the name-collision bugs endemic to C preprocessor macros through a three-level hierarchy of contexts tracked on every token. The first hierarchy tracks expansion order -- when macro output contains other macro invocations, each expansion receives a unique `ExpnId` linked to its parent. The second hierarchy, tracked via `SyntaxContext`, records the chain of macro definitions through which a token has passed, preventing accidental variable shadowing within macro bodies. The third hierarchy traces invocation locations via `ExpnData::call_site`, enabling the compiler to distinguish tokens based on where a macro was invoked [rustc-dev-guide, Macro Expansion]. This system ensures that declarative macros are hygienic by default, while procedural macros -- which operate on raw token streams -- are deliberately unhygienic, behaving as if their output were written inline at the invocation site.

### 4.3 HIR, Type Checking, and Trait Resolution

After macro expansion and name resolution complete, the AST is lowered to the High-Level Intermediate Representation (HIR) by `rustc_ast_lowering`. HIR is "a sort of desugared AST" [rustc-dev-guide] that remains close to user-written syntax but makes certain implicit constructs explicit. For example, `for` loops are desugared into `loop` constructs with explicit iterator calls, and elided lifetimes are given explicit names. The HIR employs out-of-band storage: modules contain only `ItemId` references to their children, with actual item data stored in separate maps. This design enables efficient iteration over all items in a crate without tree traversal and supports fine-grained dependency tracking for incremental compilation.

HIR introduces multiple complementary identifier systems. `DefId` identifies top-level definitions across crates, composed of a `CrateNum` and a `DefIndex`. `LocalDefId` is a specialized variant guaranteed to originate from the current crate. `HirId` uniquely identifies any HIR node in the current crate by combining an `owner` (the enclosing definition) and a `local_id`, enabling fine-grained references to expressions and sub-item entities while maintaining incremental compilation stability [rustc-dev-guide, HIR].

Type inference in `rustc` is based on the Hindley-Milner algorithm extended with subtyping, region inference, and higher-ranked types [rustc-dev-guide, Type Inference]. The inference context maintains five kinds of inference variables: general type variables (unifiable with any type), integral type variables (restricted to integer types), float type variables (restricted to floating-point types), region variables (representing lifetimes), and const variables (representing compile-time constants). Unification proceeds by equating types through the `eq` method, which constrains inference variables through side effects. Rust's limited notion of subtyping means that subtype constraints can typically be converted to equality constraints -- `?T <: i32` reduces to `?T = i32` in most contexts.

Trait resolution -- "the process of pairing up an impl with each reference to a trait" [rustc-dev-guide, Trait Resolution] -- operates through a two-phase algorithm of candidate assembly and confirmation. During candidate assembly, the compiler searches for potential implementations by checking whether each `impl` block's header can unify with the obligation being resolved, ignoring nested constraints. Winnowing then eliminates incompatible candidates by evaluating whether their nested obligations could succeed. During confirmation, the compiler validates that output type parameters align with the obligation's requirements, potentially yielding type errors. Crucially, during type checking the compiler only verifies that trait obligations can be satisfied without storing the specific resolution -- actual implementation selection is deferred to code generation when all types are fully concrete.

The next-generation trait solver, under active development by the Types Team, reformulates trait resolution as a candidate-based proof search operating on `Goal` objects consisting of predicates and parameter environments [rustc-dev-guide, Next-gen Trait Solving]. This solver, which has replaced the earlier Chalk project, is already used in coherence checking and by rust-analyzer, and is being prepared for stabilization as the default solver. It unblocks language features including implied bounds, negative implementations, and resolves known soundness issues in the current solver.

### 4.4 MIR: Construction, Borrow Checking, and Optimization

#### 4.4.1 MIR Design and Structure

MIR is "Rust's Mid-level Intermediate Representation" [rustc-dev-guide, MIR], a control-flow graph where each function is represented as a collection of basic blocks containing typed statements and terminators. MIR possesses three defining characteristics: it is structured around a control-flow graph (eliminating the nested expression trees of HIR), it avoids nested expressions (complex expressions like `x = a + b + c` are decomposed into temporaries and multiple statements), and it maintains explicit typing throughout.

The fundamental data structures of MIR are:

- **Locals**: Stack-allocated memory locations indexed numerically (e.g., `_1`, `_2`), with the special local `_0` reserved for return values.
- **Places**: Memory locations expressed as a local optionally modified by projections -- field accesses or dereferences. For example, `_1` refers to a local directly, while `_1.f` refers to a field of that local.
- **Rvalues**: Expressions that produce values -- borrows, arithmetic operations, binary operations. Rvalues cannot nest; they are always flat.
- **Operands**: Arguments to rvalues, which are either constants or places marked as copied or moved.
- **Statements**: Sequential operations within a basic block, such as assignments (`_1 = _2 + _3`) or storage markers.
- **Terminators**: The final instruction of each basic block, determining control flow successors. Function calls are terminators because they may unwind (panic).

Variables have no names in MIR; user-visible variable names are preserved through `debug <Name> => <Place>` annotations that map symbolic names to memory locations, used for debugger integration. MIR is constructed not directly from HIR but through an intermediate Typed HIR (THIR), which is "fully typed and a bit more desugared" than HIR -- method calls and implicit dereferences are made explicit, facilitating cleaner lowering to MIR's primitive operations [rustc-dev-guide, Overview].

#### 4.4.2 Borrow Checking and Non-Lexical Lifetimes

The borrow checker operates on MIR rather than the AST or HIR, a design decision motivated by MIR's explicit control flow graph, which enables precise reasoning about program points where references are live. The Non-Lexical Lifetimes (NLL) system, specified in RFC 2094 [Matsakis, 2017], represents "lifetimes as a set of points in the control-flow graph" rather than as lexical scopes tied to syntactic blocks.

The NLL algorithm proceeds through several phases. First, **liveness analysis** determines at each program point whether each variable "is live if the current value that it holds may be used later" [RFC 2094]. The analysis distinguishes non-drop liveness (the value may be read) from drop liveness (the value's destructor may run), permitting lifetimes to "dangle" during drop operations -- a refinement critical for accepting ergonomic patterns where references are dropped at block boundaries.

Second, **constraint generation** creates a system of region constraints following a formal grammar. Liveness constraints require that if a lifetime `L` is live at a point `P`, then `P` must be in `L`'s point set. Subtyping constraints, generated whenever references are copied between locations, require that the source lifetime outlives the target lifetime -- and these constraints are location-aware, meaning the outlives obligation holds only at the specific program point where the copy occurs. Reborrow constraints, generated when borrowing through existing references, ensure transitive borrow validity through supporting prefix analysis [RFC 2094].

Third, **constraint solving** proceeds by fixed-point iteration. All lifetime variables are initialized as empty sets and iteratively expanded by performing depth-first search from constraint points, adding all reachable CFG points within the required lifetime's boundary. The search terminates upon exiting the lifetime's boundary, and iteration continues until no further expansion occurs.

Fourth, **loan computation** performs forward dataflow propagation to identify in-scope loans at each program point. Transfer functions kill loans whose regions exclude the current point, generate loans from borrow statements, and kill loans when assignments overwrite their borrowed paths. Fifth, **legality checking** categorizes every access as shallow or deep and as read or write, then verifies that no in-scope borrow conflicts: reads conflict only with exclusive (mutable) borrows; writes conflict with any borrow.

The NLL error reporting framework uses a "three-point" narrative identifying the borrow point (B), the intervening invalidating action (A), and the subsequent use point (U), enabling the compiler to explain precisely why a program violates borrowing rules rather than simply pointing to a scope boundary [RFC 2094].

#### 4.4.3 MIR Optimizations

After borrow checking, MIR undergoes a series of optimization passes defined by the `run_optimization_passes()` function. These operate on generic MIR before monomorphization, meaning optimizations benefit all subsequent type instantiations -- a significant advantage over performing optimizations only after monomorphization. Key passes include:

- **ConstProp**: Constant propagation that evaluates expressions with statically known operands, duplicating an optimization that LLVM also performs but executing it earlier when there is less code, yielding 2--10% improvements in many benchmarks [Nethercote, 2022].
- **Inlining**: MIR-level inlining that reduces reliance on the LLVM backend for inlining decisions, with improvements of up to 10% for primary benchmarks.
- **CleanupPostBorrowck**: Removes analysis-specific information (such as `FakeRead` and `AscribeUserType` statements) that is needed only for borrow checking and not for code generation.
- **Dead code elimination**: Identifies and removes unreachable basic blocks and unused assignments.
- **SimplifyCfg**: Merges basic blocks and removes trivial control flow edges.

The optimization level is controlled by the `-Z mir-opt-level` flag, with experimental optimizations gated behind higher levels to prevent miscompilations in production use. Pass authors can query `tcx.sess.opts.unstable_opts.mir_opt_level` to conditionally enable their transformations.

#### 4.4.4 Constant Evaluation via Miri

MIR also serves as the substrate for compile-time function evaluation (CTFE), implemented through an interpreter called Miri (MIR Interpreter). Miri executes MIR instructions step by step on a virtual stack machine, creating virtual stack frames for each function call and evaluating operations without compiling to machine code. The interpreter starts by creating a frame for the constant being evaluated, with each frame containing all local variable memory. The same `Machine` trait that underlies the in-compiler CTFE engine also powers the standalone Miri tool for detecting undefined behavior in unsafe Rust code [rustc-dev-guide, Interpreter].

MIR distinguishes two forms of constants: MIR constants (`mir::Constant`) used as operands within MIR, and type system constants (`ty::Const`) used in the type system. Evaluated MIR constants become `mir::ConstValue`, while type system constants become `ty::ValTree` -- a representation that supports unique value encoding for arrays, structs, tuples, and enums while deliberately excluding unions and raw pointers to maintain soundness.

### 4.5 The Query System and Incremental Compilation

#### 4.5.1 Query Architecture

The `rustc` compiler organizes "all the major steps...as a bunch of queries that call each other" [rustc-dev-guide, Overview]. Each query is a pure function from a key to a value, with all queries registered on the central `TyCtxt` (typing context) struct. Variables named `tcx` throughout the codebase represent handles to this context, and the `'tcx` lifetime annotation indicates values tied to the current compilation session.

Rather than executing compilation as a fixed sequence of passes, the query system evaluates computations on demand. When a query is invoked, the system first checks whether a cached result exists and is still valid. If so, the cached result is returned directly. If not, the query is executed, its result is cached, and the dependencies accessed during execution are recorded in a directed acyclic graph. This architecture enables two critical capabilities: fine-grained incremental compilation (recomputing only the minimal set of affected queries when inputs change) and lazy evaluation (computing results only for the parts of the program that are actually needed).

Values are allocated in arenas, allowing "identical values (e.g. types in your program)" to be compared cheaply by pointer comparison rather than deep equality checks [rustc-dev-guide, Overview]. This interning strategy is essential for the query system's performance, as type comparison is one of the most frequent operations in the compiler.

#### 4.5.2 Incremental Compilation and the Red-Green Algorithm

Incremental compilation exploits two fundamental properties of the query system: "queries are pure functions -- given the same inputs, a query will always yield the same result," and the query model creates "an acyclic graph that makes dependencies between individual computations explicit" [rustc-dev-guide, Incremental Compilation in Detail].

After each compilation session, the compiler serializes the dependency graph and query results to disk. On the next compilation, it loads the previous graph and uses the **red-green algorithm** to determine which cached results remain valid. Nodes in the dependency graph are colored: **green** if their cached result has been proven valid, **red** if the result has changed, and **unknown** if not yet checked.

The core of the algorithm is the `try_mark_green()` function, which attempts to verify a node by recursively examining its dependencies. If all dependencies are green, the node is green without re-execution. If any dependency is red, the node must be re-executed -- but even then, if the re-execution produces the same result (detected via fingerprint comparison), the node is colored green, preventing unnecessary recomputation of its dependents. This "change propagation firewall" effect is amplified by the **projection query pattern**: monolithic queries that process entire inputs (such as indexed HIR construction) are paired with projection queries that extract individual values, so that changes to the monolithic result do not necessarily invalidate all projections.

Each query result receives a 128-bit **fingerprint** computed via stable hashing. This approach avoids loading previous results from disk for comparison -- only fingerprints need to be compared. The hashing process maps volatile identifiers (like `DefId`, which may change between sessions due to unrelated source modifications) to their stable equivalents (`DefPathHash`, a 128-bit hash of the definition's path such as `std::collections::HashMap`), ensuring fingerprints remain comparable across compilation sessions [rustc-dev-guide, Incremental Compilation in Detail].

The system maintains two dependency graphs simultaneously: a previous graph (immutable, loaded from disk) and a current graph (built during compilation). When a node is marked green, its node and edges are copied from the previous graph to the current graph without re-executing the normal dependency tracking machinery. After compilation completes, the current graph is serialized to disk for the next session. A **cache promotion** step ensures that intermediate results that were successfully green-marked but never loaded from disk are explicitly promoted into the new cache, preventing cache shrinkage.

Query modifiers control incremental behavior: `eval_always` forces unconditional re-execution (for queries reading external inputs), `no_hash` skips fingerprint computation as a performance optimization, `cache_on_disk_if` provides conditional persistence logic, and `anon` creates anonymous dependency nodes identified by their dependency sets rather than query keys [rustc-dev-guide, Incremental Compilation in Detail].

#### 4.5.3 Relationship to Salsa

The Salsa framework [salsa-rs, 2023] is an independent implementation of the same incremental computation principles used in `rustc`, designed as a reusable library. Salsa defines computation as a set of queries where every query acts as a function `K -> V`, with two fundamental varieties: inputs (base data) and functions (pure transformations). The database stores all internal state and intermediate values, and when inputs change, Salsa determines which memoized values to reuse and which to recompute [salsa-rs, GitHub].

While `rustc` has its own query system implementation, Salsa is used extensively by rust-analyzer, the official Language Server Protocol implementation for Rust. The architectural ideas flow bidirectionally: Salsa was inspired by `rustc`'s query system, and innovations in Salsa (particularly around durable incrementality and garbage collection of stale entries) inform potential improvements to `rustc`'s infrastructure. Niko Matsakis has noted that he "long wanted to rename [the red-green algorithm] to the Salsa algorithm" [Matsakis, 2018], reflecting the deep conceptual relationship between the two systems.

### 4.6 LLVM Code Generation

#### 4.6.1 Monomorphization and Codegen Units

The final major phase of compilation translates MIR into LLVM IR for optimization and machine code generation. This process begins with **monomorphization collection**, triggered by the `collect_and_partition_mono_items` query, which traverses the program to identify all concrete type instantiations of generic code. For each generic function used with specific type arguments, the collector ensures a specialized copy will be generated -- using both `Vec<u64>` and `Vec<String>` results in two distinct code copies [rustc-dev-guide, Monomorphization].

Collected monomorphized items are partitioned into **codegen units** (CGUs), the granularity at which LLVM performs optimization. The partitioner creates two CGUs per source-level module: a stable CGU containing non-generic code, and a volatile CGU housing monomorphized and specialized instances. This split optimizes incremental compilation by isolating the frequently changing generic instantiations from the stable per-module code. In non-incremental builds, `rustc` splits code into up to 16 CGUs by default to parallelize LLVM's work; incremental builds use up to 256 smaller CGUs for finer-grained caching [Nethercote, Perf Book].

The actual MIR-to-LLVM-IR translation is performed by the `codegen_crate` entry point. Generic code is instantiated with concrete types through `FunctionCx::monomorphize` and `codegen_instance`, producing LLVM IR described as "a sort of typed assembly language with lots of annotations" [rustc-dev-guide, Overview]. The translation leverages Rust's ownership semantics to enable optimizations unavailable to C/C++ compilers -- notably, mutable references can be annotated with `noalias` (equivalent to C's `restrict`), informing LLVM that the pointed-to memory is not accessed through any other pointer, enabling aggressive load/store optimizations.

#### 4.6.2 LLVM Optimization and LTO

After translation, LLVM receives the IR and performs its standard optimization pipeline, which includes but is not limited to: dead code elimination, constant folding and propagation, loop-invariant code motion, vectorization, function inlining, and instruction scheduling. The optimization level is controlled by `rustc`'s `-C opt-level` flag, mapping to LLVM's optimization levels.

**Link-Time Optimization (LTO)** extends LLVM's optimization scope across crate boundaries. Rust supports two LTO modes: "fat" LTO, which performs whole-program optimization across all crates, and "thin" LTO, which achieves similar performance gains with substantially less compilation time through a summary-based approach that identifies cross-module optimization opportunities without merging all IR into a single module. LTO can improve runtime speed by 10--20% or more and reduce binary size, at the cost of significantly increased compilation time [rustc book, Codegen Options].

**Profile-Guided Optimization (PGO)** leverages runtime profiling data to inform compilation decisions. The workflow involves compiling an instrumented binary with `-C profile-generate`, running it on representative workloads to collect profiling data, then recompiling with `-C profile-use` to guide optimization decisions. Rust's PGO support relies entirely on LLVM's implementation, equivalent to Clang's `-fprofile-generate`/`-fprofile-use` flags, and can improve runtime speed by 10% or more [rustc-dev-guide, PGO].

#### 4.6.3 Debug Information

Debug information generation requires the compiler to inspect MIR and communicate source, symbol, and type information to LLVM via the `DIBuilder` API. LLVM then translates this information into the target-specific DWARF format during code generation. The primary implementation resides in `rustc_codegen_llvm/debuginfo`, with some type-name processing in `rustc_codegen_ssa/debuginfo`. DWARF Debugging Information Entries (DIEs) encode functions, variables, types, and their relationships, enabling debuggers like GDB and LLDB to map between machine instructions and source code, inspect variable values with correct type layouts, and navigate the call stack [rustc-dev-guide, Debug Info].

### 4.7 Alternative Backends

#### 4.7.1 Cranelift

The Cranelift code generator, originally developed as part of the Wasmtime WebAssembly runtime, provides an alternative backend for `rustc` optimized for compilation speed rather than generated code quality. Cranelift is itself written in Rust, making it both a client of and a benchmark for the Rust compiler. The backend is integrated into `rustc` as `rustc_codegen_cranelift` and can be enabled per-project through `Cargo.toml` configuration [rustc_codegen_cranelift, GitHub].

Performance measurements show approximately 20% reduction in code generation time on larger projects (Zed, Tauri, hickory-dns), translating to roughly 5% speedup of total compilation wall-clock time for clean debug builds. On the Cranelift codebase itself, a full debug build takes 29.6 seconds with the Cranelift backend versus 37.5 seconds with LLVM -- a 20% wall-clock reduction [LWN, 2024].

The tradeoff is clear: LLVM "is designed to produce fast binaries, not to produce binaries fast" [LWN, 2024]. Cranelift inverts this priority, stripping down to only the most important optimizations. Current limitations preventing production adoption include incomplete unwinding support, remaining ABI issues, an inadequate strategy for SIMD intrinsics, and limited debugger support. The 2025H2 project goals target Linux and macOS on x86_64 and aarch64, with Windows support acknowledged as substantially more challenging [Rust Project Goals, 2025H2].

#### 4.7.2 GCC Backend (rustc_codegen_gcc)

The `rustc_codegen_gcc` crate provides a GCC-based code generation backend, operating through `libgccjit` (which, despite its name, functions as an ahead-of-time compiler). This backend reuses `rustc`'s entire frontend pipeline, differing from LLVM only in the final code generation step. It implements the same `CodegenBackend`, `ExtraBackendMethods`, and `WriteBackendMethods` traits from `rustc_codegen_ssa` that all backends must satisfy [Gomez, 2025].

The primary motivation is platform support: GCC, first released in 1987, supports numerous processor architectures that LLVM (2003) does not and likely never will. This is particularly relevant for embedded systems and older hardware. In 2025, a Google Summer of Code contributor successfully built `rustc` with the GCC backend and produced a cross-compiler targeting the Motorola 68000 architecture [Rust Blog, GSoC 2025].

The GCC backend should not be confused with `gccrs`, a separate project that reimplements the entire Rust frontend in C++ as a GCC frontend. While `gccrs` aims to compile Rust without depending on `rustc` at all (important for some Linux kernel developers who want a single compiler for both C and Rust code), `rustc_codegen_gcc` provides the pragmatic benefit of GCC's architecture support while preserving `rustc`'s error messages, diagnostics, and semantic analysis [Gomez, 2025].

### 4.8 The Diagnostic Infrastructure

Rust's compiler diagnostics are widely regarded as setting the standard for error message quality in programming language implementations. The diagnostic system is built around the `Diag` type, which provides fine-grained control over error construction before emission. `DiagCtxt` offers two method classes: direct emission methods (e.g., `span_err`) for immediate output, and structured methods (e.g., `struct_span_err`) that return a `Diag` value for further customization before emission [rustc-dev-guide, Diagnostics].

The `Span` type is the primary data structure for representing source code locations. Spans are attached to most constructs in HIR and MIR and can be looked up in a `SourceMap` to retrieve the corresponding source text. This enables spatially-aware error reporting where the compiler can point to specific characters in the user's code, show the surrounding context, and annotate multiple relevant locations in a single diagnostic.

Structured suggestions employ a confidence hierarchy via the `Applicability` enum: `MachineApplicable` (mechanically safe to apply automatically), `HasPlaceholders` (contains placeholder text like `<type>` that the user must fill in), `MaybeIncorrect` (the suggestion might not be correct), and `Unspecified` (unknown confidence). This hierarchy enables tools like `cargo fix` to automatically apply high-confidence suggestions while presenting lower-confidence suggestions for human review [rustc-dev-guide, Diagnostics].

Error messages follow strict style conventions: plain English, lowercase without terminal punctuation, identifiers wrapped in backticks, Oxford commas in lists, and avoidance of terms like "illegal" in favor of "invalid" or more specific alternatives. Each error is assigned a unique code (e.g., `E0308`) with an associated extended explanation accessible via `rustc --explain E0308`. The `#[rustc_on_unimplemented]` attribute allows trait authors to customize the error message shown when a type does not implement their trait, with support for conditional messages based on the failing type's properties.

The diagnostic system supports lint passes that execute at different compilation phases: pre-expansion (AST before macro expansion), early (AST post-expansion, pre-lowering), late (HIR with full type information), and MIR-level. Lints are declared with the `declare_lint!` macro and assigned default levels (`forbid`, `deny`, `warn`, `allow`), with future-incompatibility lints signaling upcoming breaking changes due to soundness fixes or edition transitions. Machine-readable output is available via `--error-format json`, producing newline-delimited JSON objects containing structured diagnostic information including spans with file/line/column, suggested replacements, child diagnostics, and a pre-rendered human-readable string [rustc-dev-guide, Diagnostics].

Modern diagnostics use typed identifiers from Fluent localization files rather than raw strings, enabling potential translation to languages other than English while maintaining type safety across the codebase.

### 4.9 Build System and Cargo Integration

Cargo orchestrates compilation by analyzing the crate dependency graph (a directed acyclic graph) and scheduling parallel `rustc` invocations for independent crates. This crate-level parallelism is the simplest and most effective source of build speedup, as crates without mutual dependencies can be compiled simultaneously on separate cores. Cargo coordinates with `rustc` via a jobserver protocol to stay within the system's concurrency limits [rustc-dev-guide, Parallel Compilation].

Within a single crate, parallelism occurs at two levels. The **backend** splits each crate into multiple codegen units (CGUs), allowing LLVM code generation to proceed in parallel across units. The **frontend**, through the parallel front-end initiative, uses the Rayon work-stealing framework to parallelize query execution, macro expansion, and other front-end tasks. The parallel front-end achieves 20--30% reduction in overall compilation time for single-crate builds, with some measurements showing up to 50% reduction for development builds [Rust Blog, Parallel Rustc 2023].

Cargo's build cache (`target/` directory) stores compiled artifacts keyed by crate identity and compilation flags. Combined with `rustc`'s incremental compilation cache (which stores query results and dependency graphs between invocations), the two-level caching system -- Cargo at the crate level, `rustc` at the query level -- provides granular rebuild avoidance ranging from skipping entire crate compilations down to reusing individual query results within a crate.

The `cargo build --timings` flag produces an HTML report showing the timeline of crate compilation, revealing bottlenecks in the dependency graph where insufficient parallelism is available. This is particularly important for large projects where the critical path through the dependency DAG, rather than total work, determines wall-clock build time.

## 5. Comparative Synthesis

The following table compares `rustc`'s architecture with four other significant compiler implementations, highlighting the design tradeoffs each makes between compilation speed, generated code quality, safety guarantees, and architectural complexity.

| Dimension | rustc (Rust) | gc (Go) | GHC (Haskell) | swiftc (Swift) | gcc/clang (C/C++) |
|-----------|-------------|---------|---------------|----------------|-------------------|
| **Pipeline stages** | AST -> HIR -> THIR -> MIR -> LLVM IR | AST -> SSA -> machine code | AST -> Core -> STG -> Cmm -> asm/LLVM | AST -> SIL -> LLVM IR | AST -> GIMPLE -> RTL -> asm (GCC); AST -> LLVM IR -> machine code (Clang) |
| **Number of IRs** | 5 (AST, HIR, THIR, MIR, LLVM IR) | 2 (AST, SSA) | 4 (AST, Core, STG, Cmm) | 3 (AST, SIL raw/canonical, LLVM IR) | 3 (GCC: AST, GIMPLE, RTL); 2 (Clang: AST, LLVM IR) |
| **Backend** | LLVM (primary), Cranelift, GCC | Custom | NCG or LLVM | LLVM | Custom (GCC) or LLVM (Clang) |
| **Safety analysis** | Borrow checker on MIR (static, compile-time) | GC + race detector (runtime) | GC + type system (Hindley-Milner) | ARC + ownership (SIL-level analysis) | None (C); limited static analysis (C++) |
| **Incremental compilation** | Query-based, red-green algorithm, fingerprinted | Build cache per package | One-shot recompilation (limited) | Fine-grained (since Swift 5.1) | Translation-unit level (header dependencies) |
| **Generics strategy** | Monomorphization | Stenciling (Go 1.18+) with GC shape | Dictionary passing (type classes) | Specialization + witness tables | Templates (C++, fully monomorphized) |
| **Compilation speed** | Slow (minutes for large projects) | Fast (seconds for large projects) | Moderate to slow | Moderate | Slow (C++ templates); moderate (C) |
| **Generated code quality** | Excellent (LLVM optimizations + restrict) | Good (intentionally limited optimization) | Good (lazy evaluation overhead) | Excellent (LLVM optimizations) | Excellent (decades of optimization work) |
| **Macro system** | Hygienic declarative + procedural macros | None (code generation via `go generate`) | Template Haskell (typed, staged) | None (limited property wrappers) | Textual preprocessor (C/C++) |
| **Diagnostic quality** | Excellent (structured, with suggestions) | Good (clear, concise) | Improving (historically weak) | Good (FixIt suggestions) | Good (Clang); moderate (GCC, improving) |

### 5.1 Architectural Depth vs. Compilation Speed

The most striking tradeoff across these compilers is between architectural depth (number of IRs, sophistication of analysis) and compilation speed. Go's `gc` compiler uses only two representations (AST and SSA) and performs approximately 30 optimization passes with a custom backend, compiling the two-million-line Kubernetes codebase in under a minute. Go's language design -- no circular imports, no header files, an unambiguous context-free grammar, explicit dependency declarations -- was shaped by this compilation speed requirement [Pike, 2012].

Rust, by contrast, employs five intermediate representations and performs substantially more analysis (ownership checking, lifetime inference, trait resolution, monomorphization). The payoff is that safety properties verified at compile time eliminate entire categories of runtime errors and eliminate the need for garbage collection, but the cost is compilation times measured in minutes rather than seconds for large projects. The generated code is typically within 0--10% of equivalent C/C++ code, compared to Go's 10--30% gap [various benchmarks].

### 5.2 IR Design Philosophy

GHC's pipeline (Core -> STG -> Cmm) reflects Haskell's lazy evaluation model: Core is a tiny lambda calculus for high-level optimization, STG makes laziness explicit for the code generator, and Cmm provides a low-level imperative representation with an explicit stack. Swift's SIL serves an analogous role to Rust's MIR -- it is "lower-level and more explicit than the AST representation, but still higher-level and more Swift-specific than LLVM IR" [Swift Documentation]. SIL performs ownership-related analyses (particularly ARC optimization and devirtualization) in much the same way that MIR performs borrow checking and Rust-specific optimizations.

The common pattern across these compilers is that language-specific analyses require a language-specific IR positioned between the user-facing syntax and the backend's machine-level abstractions. The number of such IRs correlates with the complexity of the language's type system and runtime semantics.

### 5.3 Incremental Compilation Approaches

Rust's query-based incremental compilation system is among the most sophisticated in production use. C and C++ compilers achieve incremental compilation at the translation-unit level (recompiling only changed `.c`/`.cpp` files), which is coarse-grained. Go's build cache operates at the package level, recompiling only packages whose source files or dependencies have changed -- effective but also coarse-grained. Swift's incremental compilation, introduced in Swift 5.1, performs fine-grained dependency tracking similar in spirit to Rust's approach.

Rust's advantage is that the query system's granularity extends within a single crate: changing a function body may not require re-type-checking unrelated functions in the same crate, let alone regenerating their machine code. The disadvantage is the overhead of maintaining the dependency graph, computing fingerprints, and serializing/deserializing cached results -- costs that can outweigh the benefits for clean builds or small changes that invalidate large portions of the graph.

## 6. Open Problems & Gaps

### 6.1 Compilation Time

Despite incremental compilation, Rust's compile times remain a significant developer experience concern. The 2025 Rust Compiler Performance Survey, with over 3,700 respondents, confirmed that build performance is a persistent pain point [Rust Blog, 2025]. While the compiler has improved substantially -- "on some benchmarks, the compiler is almost twice as fast as it was three years ago" [Nethercote, 2025] -- the combination of monomorphization, LLVM optimization, and deep semantic analysis means that large Rust projects still take minutes to compile in release mode.

Specific recent improvements include a fast path for lowering trivial constants (5--15% reduction for the `libc` crate), VecCache optimizations (beyond 4% in best cases), an LLVM 21 upgrade (1.70% mean instruction count reduction), and a reimplementation of `format_args!()` that produced 30--38% wins for large-workspace stress tests [Nethercote, 2025]. However, these improvements are incremental and require significant domain knowledge; the pool of contributors with both the expertise and the time to work on compiler performance remains limited.

### 6.2 Parallel Frontend

The parallel front-end initiative aims to parallelize `rustc`'s frontend using the Rayon work-stealing framework. Current results show 20--30% reduction in overall compilation time, with the goal of achieving greater speedups through parallelized macro expansion and reduced data contention in query execution. Key challenges that have been addressed include deadlock resolution in the work-stealing scheduler and migration to `rustc-rayon` as a dependency. Remaining work for stabilization includes completing the parallel front-end test suite, enabling it in bootstrap builds, and expanding benchmarking coverage [Rust Project Goals, 2025H2].

### 6.3 Next-Generation Trait Solver

The replacement of the current trait solver with the next-generation solver is a multi-year effort that has progressed from early prototype through production use in coherence checking and rust-analyzer. The new solver provides a cleaner formalization of trait resolution as a proof search, unblocking language features including implied bounds, negative implementations, and fixes for known soundness issues. Stabilization as the default solver is the 2025H2 goal, but the transition requires careful crater testing to identify and resolve edge cases across the entire crates.io ecosystem [Rust Blog, Project Goals November 2025].

The companion `a-mir-formality` project provides a formal model of MIR and the Rust type/trait system, intended to serve as a specification against which the trait solver's behavior can be verified. The team has adopted a "judgment-like" approach for the borrow checker model and is building tooling to compare `a-mir-formality`'s behavior against `rustc` on small test cases [Rust Project Goals, 2025H1].

### 6.4 Polymorphization

Monomorphization produces fast code but at the cost of compile time and binary size -- every instantiation of a generic function generates new machine code. The polymorphization analysis, invoked via `rustc_mir_monomorphize::polymorphize::unused_generic_params`, traverses MIR to determine which generic parameters a function actually depends on, avoiding duplicate code generation for instantiations that would produce identical machine code [rustc-dev-guide, Monomorphization].

Current polymorphization is limited to detecting completely unused generic parameters. The intended extension to more advanced cases -- such as where only the size or alignment of a generic parameter is relevant -- remains an open research problem. Full polymorphization could substantially reduce both compile time (fewer LLVM IR functions to optimize) and binary size (fewer duplicate function bodies), but requires careful analysis to ensure semantic equivalence of the merged instantiations.

### 6.5 Cranelift Production Readiness

Bringing the Cranelift backend to production readiness for debug builds requires resolving several categories of issues: implementing unwinding support on Linux and macOS, fixing remaining ABI incompatibilities, developing a sustainable strategy for SIMD intrinsic support, and adding debugger integration. The 2025H2 goal targets confident recommendation for local development on Linux and macOS (x86_64 and aarch64), with Windows support dependent on additional funding [Rust Project Goals, 2025H2].

### 6.6 Further Open Questions

Several additional areas represent active research or engineering challenges:

- **Build script and proc macro overhead**: Build scripts (`build.rs`) and procedural macros can dominate compilation time for projects with many dependencies, as they require compiling and executing host-target code before the dependent crate can proceed.
- **Crate-level parallelism bottlenecks**: The critical path through a project's dependency DAG often limits wall-clock build time more than per-crate compilation speed. Techniques for breaking large crates into smaller units or enabling pipelined compilation (starting downstream compilation before upstream is complete) are areas of active exploration.
- **LLVM compile time**: A significant fraction of total compilation time is spent in LLVM optimization passes. Reducing this -- whether through more aggressive MIR optimization (reducing the work LLVM must do), thin LTO improvements, or the Cranelift alternative -- remains a persistent challenge.

## 7. Conclusion

The Rust compiler represents one of the most architecturally sophisticated production compilers in current use. Its multi-layered IR pipeline -- AST to HIR to THIR to MIR to LLVM IR -- reflects the inherent complexity of statically verifying memory safety and data-race freedom in a systems programming language. Each intermediate representation is purpose-built: HIR for type checking and trait resolution, MIR for borrow checking and Rust-specific optimization, LLVM IR for industrial-strength code generation.

The query-based incremental compilation system, with its red-green algorithm and fingerprint-based change detection, demonstrates that demand-driven compilation can scale to a production compiler serving millions of developers. The NLL borrow checker, operating on MIR's control-flow graph through constraint-based region inference, provides a formal framework for lifetime analysis that is both sound and substantially more ergonomic than its lexical predecessor.

The diagnostic infrastructure -- with its structured suggestions, confidence hierarchies, and machine-readable output -- establishes a standard for compiler error quality that other language implementations increasingly seek to match. The emerging multi-backend story (LLVM for release quality, Cranelift for development speed, GCC for platform reach) reflects a maturing ecosystem that recognizes no single backend can optimally serve all use cases.

Significant challenges remain. Compilation speed, while improved substantially over recent years, continues to be a friction point for large projects. The parallel frontend, next-generation trait solver, and polymorphization analysis represent the most impactful ongoing efforts to address the fundamental tension between the depth of analysis that Rust demands and the responsiveness that developers expect. The trajectory of these efforts -- incremental, technically demanding, but steadily advancing -- mirrors the trajectory of the Rust project itself.

## References

1. Matsakis, N. (2017). "RFC 2094: Non-Lexical Lifetimes." *The Rust RFC Book*. https://rust-lang.github.io/rfcs/2094-nll.html

2. Matsakis, N. (2016). "RFC 1211: MIR." *The Rust RFC Book*. https://rust-lang.github.io/rfcs/1211-mir.html

3. Rust Compiler Team. "Overview of the Compiler." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/overview.html

4. Rust Compiler Team. "The MIR (Mid-level IR)." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/mir/index.html

5. Rust Compiler Team. "The HIR (High-level IR)." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/hir.html

6. Rust Compiler Team. "Incremental Compilation in Detail." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/queries/incremental-compilation-in-detail.html

7. Rust Compiler Team. "Incremental Compilation." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/queries/incremental-compilation.html

8. Rust Compiler Team. "Errors and Lints." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/diagnostics.html

9. Rust Compiler Team. "Macro Expansion." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/macro-expansion.html

10. Rust Compiler Team. "Trait Solving." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/traits/resolution.html

11. Rust Compiler Team. "Next-gen Trait Solving." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/solve/trait-solving.html

12. Rust Compiler Team. "Type Inference." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/type-inference.html

13. Rust Compiler Team. "Monomorphization." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/backend/monomorph.html

14. Rust Compiler Team. "MIR Optimizations." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/mir/optimizations.html

15. Rust Compiler Team. "Debug Info." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/debuginfo/intro.html

16. Rust Compiler Team. "Interpreter (Constant Evaluation)." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/const-eval/interpret.html

17. Rust Compiler Team. "Parallel Compilation." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/parallel-rustc.html

18. Rust Compiler Team. "Profile-guided Optimization." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/profile-guided-optimization.html

19. Rust Compiler Team. "Chalk-based Trait Solving." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/traits/chalk.html

20. Rust Compiler Team. "Salsa." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/queries/salsa.html

21. The Rust Blog. (2016). "Introducing MIR." https://blog.rust-lang.org/2016/04/19/MIR/

22. The Rust Blog. (2023). "Faster Compilation with the Parallel Front-end in Nightly." https://blog.rust-lang.org/2023/11/09/parallel-rustc/

23. The Rust Blog. (2025). "Rust Compiler Performance Survey 2025 Results." https://blog.rust-lang.org/2025/09/10/rust-compiler-performance-survey-2025-results/

24. The Rust Blog. (2025). "Project Goals Update -- November 2025." https://blog.rust-lang.org/2025/12/16/Project-Goals-2025-November-Update.md/

25. Rust Project Goals. (2025). "Promoting Parallel Front End." https://rust-lang.github.io/rust-project-goals/2025h2/parallel-front-end.html

26. Rust Project Goals. (2025). "Production-ready Cranelift Backend." https://rust-lang.github.io/rust-project-goals/2025h2/production-ready-cranelift.html

27. Rust Project Goals. (2025). "Next-generation Trait Solver." https://rust-lang.github.io/rust-project-goals/2024h2/next-solver.html

28. Nethercote, N. (2025). "How to Speed Up the Rust Compiler in December 2025." https://nnethercote.github.io/2025/12/05/how-to-speed-up-the-rust-compiler-in-december-2025.html

29. Nethercote, N. (2023). "Back-end Parallelism in the Rust Compiler." https://nnethercote.github.io/2023/07/11/back-end-parallelism-in-the-rust-compiler.html

30. Nethercote, N. "Build Configuration." *The Rust Performance Book*. https://nnethercote.github.io/perf-book/build-configuration.html

31. Gomez, G. (2025). "Rust GCC Backend: Why and How." https://blog.guillaume-gomez.fr/articles/2025-12-15+Rust+GCC+backend:+Why+and+how

32. LWN.net. (2024). "Cranelift Code Generation Comes to Rust." https://lwn.net/Articles/964735/

33. rustc_codegen_cranelift. "Readme." *GitHub*. https://github.com/rust-lang/rust/blob/main/compiler/rustc_codegen_cranelift/Readme.md

34. salsa-rs. "Salsa: A Generic Framework for On-demand, Incrementalized Computation." *GitHub*. https://github.com/salsa-rs/salsa

35. The Salsa Book. "The Red-Green Algorithm." https://salsa-rs.github.io/salsa/reference/algorithm.html

36. Rust Types Team. (2024). "Types Team Update and Roadmap." *The Rust Blog*. https://blog.rust-lang.org/2024/06/26/types-team-update/

37. Swift Documentation. "Swift Intermediate Language (SIL)." https://apple-swift.readthedocs.io/en/latest/SIL.html

38. Groff, J. and Lattner, C. (2015). "Swift Intermediate Language: A High Level IR to Complement LLVM." *LLVM Developers' Meeting*. https://llvm.org/devmtg/2015-10/slides/GroffLattner-SILHighLevelIR.pdf

39. Walker, D. (2005). "Substructural Type Systems." In *Advanced Topics in Types and Programming Languages*, ed. B. C. Pierce. MIT Press.

40. Tofte, M. and Talpin, J.-P. (1997). "Region-Based Memory Management." *Information and Computation*, 132(2):109--176.

41. Cytron, R., Ferrante, J., Rosen, B. K., Wegman, M. N., and Zadeck, F. K. (1991). "Efficiently Computing Static Single Assignment Form and the Control Dependence Graph." *ACM Transactions on Programming Languages and Systems*, 13(4):451--490.

42. Hammer, M. A., Phang, K. Y., Hicks, M., and Foster, J. S. (2014). "Adapton: Composable, Demand-Driven Incremental Computation." *PLDI 2014*.

43. Pike, R. (2012). "Go at Google: Language Design in the Service of Software Engineering." https://go.dev/talks/2012/splash.article

44. Kobzol. (2025). "Why Doesn't Rust Care More About Compiler Performance?" https://kobzol.github.io/rust/rustc/2025/06/09/why-doesnt-rust-care-more-about-compiler-performance.html

45. Kobzol. (2022). "Speeding Up the Rust Compiler Without Changing Its Code." https://kobzol.github.io/rust/rustc/2022/10/27/speeding-rustc-without-changing-its-code.html

46. PingCAP. "A Few More Reasons Rust Compiles Slowly." https://www.pingcap.com/blog/reasons-rust-compiles-slowly/

47. Matsakis, N. (2017). "Non-lexical Lifetimes Using Liveness and Location." *Baby Steps Blog*. https://smallcultfollowing.com/babysteps/blog/2017/02/21/non-lexical-lifetimes-using-liveness-and-location/

48. The Rustc Book. "Codegen Options." https://doc.rust-lang.org/rustc/codegen-options/index.html

49. DeepWiki. "Compilation Pipeline." https://deepwiki.com/rust-lang/rust/2-compilation-pipeline

50. DeepWiki. "Borrow Checker." https://deepwiki.com/rust-lang/rust/3.2-borrow-checker

## Practitioner Resources

**Official Documentation**
- *Rust Compiler Development Guide*: https://rustc-dev-guide.rust-lang.org/ -- The authoritative reference for contributors to the Rust compiler, covering every stage of the pipeline with links to source code and worked examples.
- *The Rustc Book*: https://doc.rust-lang.org/rustc/ -- User-facing documentation for compiler options, codegen flags, and diagnostic configuration.
- *The Rust Reference*: https://doc.rust-lang.org/reference/ -- Specification-grade documentation of the language, including macro expansion rules, name resolution, and type system details.

**Compiler Internals Exploration**
- `cargo rustc -- -Z unpretty=hir-tree` -- Dump the HIR as a detailed tree structure for inspection.
- `cargo rustc -- -Z unpretty=hir` -- Dump the HIR as a source-like representation showing desugaring.
- `cargo rustc -- -Z unpretty=mir` -- Dump the MIR for all functions in a crate.
- `cargo rustc -- --emit=llvm-ir` -- Emit LLVM IR for inspection.
- `cargo rustc -- -Z treat-err-as-bug=1` -- Convert the first error to an internal compiler error (ICE) with a full stack trace, useful for finding where in the compiler an error originates.
- `cargo rustc -- -Z track-diagnostics` -- Print the source location where each diagnostic is created.

**Performance Analysis**
- *Rust Compiler Performance Dashboard*: https://perf.rust-lang.org/ -- Continuous benchmarking of the Rust compiler across dozens of crates, tracking both instruction counts and wall-clock times.
- *The Rust Performance Book*: https://nnethercote.github.io/perf-book/ -- Practical guidance on writing fast Rust code and configuring builds for performance, including codegen unit tuning and LTO/PGO setup.
- `cargo build --timings` -- Generate an HTML report showing the timeline of crate compilation, useful for identifying dependency-graph bottlenecks.

**Alternative Backends**
- *Cranelift Backend*: Enable via `[unstable] codegen-backend = "cranelift"` in `.cargo/config.toml` for faster debug builds.
- *GCC Backend*: https://github.com/rust-lang/rustc_codegen_cranelift -- Cranelift integration; https://github.com/rust-lang/rust/tree/main/compiler/rustc_codegen_gcc -- GCC backend via libgccjit.

**Research and Formal Models**
- *a-mir-formality*: https://github.com/rust-lang/a-mir-formality -- A formal model of MIR and the Rust type/trait system under active development by the Types Team.
- *Chalk*: https://github.com/rust-lang/chalk -- The experimental (now sunset) trait solver that informed the next-generation solver's design.
- *Salsa*: https://github.com/salsa-rs/salsa -- The incremental computation framework used by rust-analyzer, sharing architectural principles with `rustc`'s query system.

**Community and Contribution**
- *Rust Compiler Team*: https://rust-lang.github.io/compiler-team/ -- Working groups, meeting minutes, and design documents.
- *Rust Zulip (#t-compiler)*: https://rust-lang.zulipchat.com/ -- Real-time discussion among compiler contributors.
- *This Week in Rust*: https://this-week-in-rust.org/ -- Weekly newsletter covering compiler developments alongside the broader ecosystem.
