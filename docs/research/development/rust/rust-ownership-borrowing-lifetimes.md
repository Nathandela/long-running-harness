---
title: "Ownership, Borrowing, and Lifetimes: Rust's Affine Type System for Memory Safety"
date: 2026-03-21
summary: A comprehensive survey of Rust's ownership model, borrowing rules, and lifetime system — tracing theoretical roots in substructural type systems through practical implementation in the borrow checker and its evolution from NLL to Polonius.
keywords: [rust, ownership, borrowing, lifetimes, affine-types, borrow-checker]
---

# Ownership, Borrowing, and Lifetimes: Rust's Affine Type System for Memory Safety

*2026-03-21*

## Abstract

Rust's ownership, borrowing, and lifetime system represents one of the most significant practical applications of substructural type theory in the history of programming language design. By embedding affine type discipline into a systems programming language, Rust achieves compile-time memory safety guarantees without garbage collection -- a goal that eluded language designers for decades. The core insight is deceptively simple: every value has exactly one owner, ownership can be temporarily lent through references governed by the aliasing XOR mutability principle, and the compiler statically tracks the regions of code where references remain valid. This discipline eliminates use-after-free errors, double frees, data races, and dangling pointers at compile time, while preserving the zero-cost abstraction philosophy inherited from C++.

The theoretical lineage of Rust's type system traces through Girard's linear logic (1987), Tofte and Talpin's region-based memory management (1997), Grossman et al.'s Cyclone language (2002), and the broader family of substructural type systems that restrict the structural rules of weakening and contraction. Rust's specific contribution is the synthesis of affine types with region-based lifetime tracking and a practical borrowing discipline that makes the system ergonomic enough for large-scale systems programming. This synthesis is not merely an engineering achievement but a novel point in the design space of resource-typed languages.

This survey traces the theoretical foundations of Rust's ownership model through its practical realization in the borrow checker, examining the evolution from the original AST-based analysis (2012--2019) through Non-Lexical Lifetimes (RFC 2094, stabilized 2019) to the ongoing Polonius project. It covers lifetime variance and subtyping, the formal semantics established by RustBelt, Oxide, and Stacked/Tree Borrows, and compares Rust's approach with C++ RAII, Swift's ARC, Linear Haskell, and Cyclone's region system. Open problems including partial borrows, view types, and ergonomic self-referential types are assessed against the current research frontier.

---

## 1. Introduction

### 1.1 Problem Statement

Memory safety is the central unsolved problem of systems programming. The C and C++ languages, which together dominate operating systems, embedded firmware, game engines, and performance-critical infrastructure, leave memory management to the programmer. The consequences are severe: Microsoft reported in 2019 that approximately 70% of all CVEs assigned to Microsoft products were memory safety issues [Microsoft Security Response Center 2019]. Google's Chrome security team reported a similar 70% figure for Chromium vulnerabilities [Chromium Security 2020]. The NSA's 2022 guidance explicitly recommended transitioning from C/C++ to memory-safe languages [NSA 2022].

Prior to Rust, the solution landscape offered an unsatisfying choice. Garbage-collected languages (Java, Go, Python) eliminate manual memory management but impose runtime overhead -- stop-the-world pauses, increased memory footprint, and unpredictable latency -- that disqualifies them from domains requiring deterministic performance. Reference counting (Objective-C ARC, Swift ARC, C++ `shared_ptr`) reduces pause times but introduces reference-counting overhead on every copy and cannot handle cyclic data structures without supplementary mechanisms. Region-based systems (ML Kit, Cyclone) demonstrated compile-time memory management but failed to achieve widespread adoption due to annotation burden and limited expressiveness.

Rust's ownership system proposes a different trade-off: shift the complexity of memory management from runtime to compile time, using a type-and-effect system rooted in affine types and region inference. The programmer pays in learning curve and occasional friction with the borrow checker; in return, the compiled program requires no garbage collector, no reference-counting overhead, and no runtime safety checks, while statically guaranteeing the absence of memory safety violations and data races.

### 1.2 Scope

This survey covers Rust's ownership, borrowing, and lifetime system as specified through Rust 1.85 (2026), with particular attention to:

- **Theoretical foundations**: Substructural type systems, linear logic, affine types, and region-based memory management
- **The ownership model**: Move semantics, the Copy/Clone distinction, drop semantics, and RAII
- **Borrowing rules**: Shared and mutable references, aliasing XOR mutability, reborrowing
- **Lifetimes**: Annotations, elision rules, subtyping, and variance
- **Borrow checker implementation**: AST-based to MIR-based evolution, NLL, Polonius
- **Formal foundations**: RustBelt, Oxide, Stacked Borrows, Tree Borrows, Place Capability Graphs
- **Practical patterns**: Self-referential structs, arena allocation, interior mutability
- **Comparative analysis**: C++ RAII, Swift ARC, Linear Haskell, Cyclone

Unsafe Rust, while essential to Rust's practical utility, is discussed only insofar as it interacts with the safe ownership discipline. Concurrency primitives (`Send`/`Sync`) and async/await (`Pin`/`Future`) are mentioned where relevant but receive abbreviated treatment.

### 1.3 Key Definitions

**Affine type**: A type governed by affine logic, in which values may be used *at most once*. This contrasts with linear types (exactly once) and unrestricted types (any number of times) [Walker 2005].

**Ownership**: The compile-time property that exactly one variable binding is responsible for a value's allocation and deallocation at any given program point. When the owner goes out of scope, the value is dropped [Rust Reference].

**Borrowing**: The temporary, compiler-tracked lending of access to a value through references. Shared borrows (`&T`) permit aliasing but not mutation; exclusive borrows (`&mut T`) permit mutation but not aliasing [Rust Reference].

**Lifetime**: A compile-time annotation (often inferred) denoting the region of the program's control-flow graph during which a reference is valid. Lifetimes correspond to regions in Tofte-Talpin style region-based memory management [Pearce 2021].

**Borrow checker**: The component of the Rust compiler (`rustc_borrowck`) that enforces ownership, borrowing, and lifetime rules through a flow-sensitive static analysis over the Mid-level Intermediate Representation (MIR) [rustc Dev Guide].

---

## 2. Foundations

### 2.1 Linear Logic and Substructural Type Systems

The theoretical foundation of Rust's ownership model lies in substructural logic, a family of logical systems that restrict the *structural rules* of classical logic. In classical and intuitionistic logic, three structural rules govern how hypotheses may be used:

- **Weakening** (W): An unused hypothesis may be freely introduced -- if $\Gamma \vdash B$, then $\Gamma, A \vdash B$.
- **Contraction** (C): A hypothesis may be freely duplicated -- if $\Gamma, A, A \vdash B$, then $\Gamma, A \vdash B$.
- **Exchange** (E): The order of hypotheses is irrelevant -- if $\Gamma, A, B, \Delta \vdash C$, then $\Gamma, B, A, \Delta \vdash C$.

Jean-Yves Girard's *linear logic* (1987) restricts both weakening and contraction, treating propositions as *resources* that must be used exactly once [Girard 1987]. In linear logic, the hypothesis $A$ in a derivation represents a resource that is consumed by its use; it cannot be silently discarded (no weakening) or duplicated (no contraction). Girard introduced the *exponential modality* $!A$ ("of course $A$") to recover unrestricted use when needed, creating a refined system that can express both resource-sensitive and resource-insensitive reasoning.

The Curry-Howard correspondence extends to linear logic: linear proofs correspond to programs in a linear lambda calculus where every bound variable is used exactly once [Wadler 1993]. This correspondence provides the bridge from logic to type theory. Substructural type systems, surveyed comprehensively by Walker (2005), form a hierarchy based on which structural rules are present [Walker 2005]:

| Type System | Weakening | Contraction | Use Constraint |
|---|---|---|---|
| **Unrestricted** (standard) | Yes | Yes | Any number of times |
| **Affine** | Yes | No | At most once |
| **Relevant** | No | Yes | At least once |
| **Linear** | No | No | Exactly once |
| **Ordered** | No | No | Exactly once, in order |

Rust's ownership discipline corresponds to an **affine** type system: values may be used at most once (moved), but may also be silently discarded (dropped) without explicit consumption [without.boats 2024]. This is a critical distinction from true linear types, where every value must be explicitly consumed. As the without.boats blog observes: "Rust may have affine types, but it currently doesn't have types which cannot be weakened; that is, types which must be used at least once" [without.boats 2024]. The `Drop` trait bridges affine and linear semantics by allowing types to define cleanup logic that runs automatically when values are discarded, but the compiler does not *require* that values be used before being dropped.

### 2.2 Region-Based Memory Management

The second theoretical pillar of Rust's lifetime system is region-based memory management, originating in Tofte and Talpin's work on the ML Kit compiler (1994, 1997). Their key insight was that dynamic memory allocation and deallocation could be organized into lexically-scoped *regions*: contiguous blocks of memory that are allocated upon entry to a scope and deallocated upon exit [Tofte and Talpin 1997]. They proved that well-typed programs under their region inference system are free of dangling pointers, even in the presence of sharing and explicit deallocation.

Tofte and Talpin's system infers region annotations automatically using a type-and-effect discipline. Every allocation expression is annotated with the region into which it allocates, and every function type carries an effect that describes which regions it accesses. The compiler infers these annotations through a constraint-based algorithm, then verifies that no reference escapes the region that contains its referent.

Grossman et al.'s Cyclone language (2002) brought region-based memory management into the C programming tradition, adding explicit region annotations to a C-like surface syntax [Grossman et al. 2002]. Cyclone's region polymorphism -- where functions could be parameterized by region variables written as backtick-prefixed identifiers like `` `r `` -- directly anticipates Rust's lifetime parameters written as `'a`. Cyclone extended Tofte-Talpin regions with subtyping (region outlives relationships), integration with stack allocation and a fallback garbage collector, and support for separate compilation.

Rust's official influences page lists "ML Kit, Cyclone: region based memory management" as direct ancestors [Rust Reference: Influences]. Rust's lifetime annotations (`'a`, `'b`, `'static`) are syntactic and semantic descendants of Cyclone's region variables, and Rust's outlives relation (`'a: 'b`, meaning lifetime `'a` completely contains `'b`) mirrors Cyclone's region subtyping. However, Rust's embrace of single-owner semantics gives it a more constrained but also more predictable model: whereas Cyclone supported multiple memory management strategies (regions, unique pointers, reference counting, garbage collection), Rust unifies them under the ownership discipline.

### 2.3 From Theory to Practice: The Synthesis

Rust's contribution is not the invention of affine types or region-based memory management, but their synthesis into a coherent, practical programming model. The key elements of this synthesis are:

1. **Ownership as default affine typing**: Every value has exactly one owner. Assignment transfers ownership (move semantics), making the original binding unusable. This enforces the "at most once" rule of affine types at the value level.

2. **Borrowing as controlled relaxation**: References (`&T`, `&mut T`) temporarily suspend the affine discipline by lending access without transferring ownership. The borrow checker enforces that borrows do not outlive the owned value and that aliasing and mutability do not coexist.

3. **Lifetimes as lightweight regions**: Lifetime annotations parameterize the regions during which references are valid. Unlike Tofte-Talpin regions, Rust's lifetimes do not correspond to heap regions but to spans of the control-flow graph, enabling more fine-grained tracking.

4. **Drop as affine resource release**: The `Drop` trait provides a destructor that runs when a value's owner goes out of scope, implementing RAII semantics. The interaction between `Drop` and move semantics ensures that resources are released exactly once.

This synthesis was not immediate. Graydon Hoare's original Rust design (circa 2006--2010) included garbage collection, and the language went through several ownership models before arriving at the current system around 2012--2014 [Rust Wikipedia]. The removal of garbage collection and the commitment to ownership as the sole memory management discipline was a defining design decision that distinguished Rust from Cyclone's multi-strategy approach.

---

## 3. Taxonomy of Approaches

### 3.1 Classification Framework

Resource management strategies in programming languages can be classified along several axes. The following taxonomy positions Rust's ownership model relative to alternative approaches:

| Dimension | Manual (C) | RAII/Ownership (Rust) | Ref. Counting (Swift) | Tracing GC (Go/Java) | Region-Based (Cyclone) |
|---|---|---|---|---|---|
| **When is safety checked?** | Never (programmer responsibility) | Compile time | Runtime | Runtime | Compile time |
| **Deallocation timing** | Explicit (`free`) | Deterministic (scope exit) | Deterministic (refcount zero) | Non-deterministic (GC cycle) | Deterministic (region exit) |
| **Runtime overhead** | None | None | Per-copy increment/decrement | GC pauses, memory pressure | None |
| **Annotation burden** | None (but correctness burden) | Moderate (lifetime annotations) | Low (weak refs for cycles) | None | High (region annotations) |
| **Handles cycles?** | N/A | Via `Rc`/`Weak` | Via `weak` references | Yes (tracing) | Yes (within region) |
| **Aliasing control** | None | Enforced (XOR mutability) | None (runtime checks) | None | Partial (unique pointers) |
| **Concurrency safety** | None | Compile-time (`Send`/`Sync`) | Runtime (`@Sendable`) | Runtime (race detector) | Limited |

### 3.2 The Substructural Type System Landscape

Within the family of substructural type systems applied to programming languages, the following approaches have been realized:

| Language/System | Type Discipline | Key Mechanism | Status |
|---|---|---|---|
| **Rust** | Affine + regions | Ownership + borrow checker | Production (2015--) |
| **Linear Haskell** | Linear (opt-in) | Multiplicity-annotated arrows (`%1 ->`) | GHC extension, experimental (2021--) |
| **Clean** | Uniqueness types | Unique attributes on types | Production (1987--) |
| **Cyclone** | Regions + unique ptrs | Region annotations, fat pointers | Research, discontinued (2001--2006) |
| **ATS** | Linear + dependent | Proof-level linear types | Research/production (2005--) |
| **Austral** | Linear | First-class linear types, no borrowing | Experimental (2023--) |
| **Val (Hylo)** | Mutable value semantics | Law of exclusivity, no references | Experimental (2022--) |

---

## 4. Analysis

### 4.1 The Ownership Model

#### 4.1.1 Theory

Ownership in Rust implements the affine type discipline at the value level. Every value is bound to exactly one variable (its *owner*) at any given program point. When a value is assigned to a new variable or passed to a function, ownership is *moved*: the source binding becomes invalid, and the compiler rejects subsequent use of it. This is the "at most once" rule of affine types, applied not to the type itself but to the binding.

```rust
let s1 = String::from("hello");
let s2 = s1;          // ownership moves to s2
// println!("{}", s1); // ERROR: s1 has been moved
```

The move is a bitwise copy of the value's stack representation (pointer, length, capacity for `String`), followed by the compiler marking the source as uninitialized. No custom move constructor is invoked, and no runtime check occurs. This is what Rust calls *destructive move* semantics: the moved-from value ceases to exist as a value, and its destructor will not run [The Coded Message 2022].

#### 4.1.2 Copy vs. Clone

Rust distinguishes two mechanisms for value duplication:

**`Copy`** is a marker trait for types where bitwise duplication produces a semantically valid copy -- typically scalar types (`i32`, `f64`, `bool`, `char`) and fixed-size aggregates of `Copy` types. For `Copy` types, assignment performs an implicit bitwise copy rather than a move, and both the source and destination remain valid. A type implementing `Copy` cannot also implement `Drop`, because the combination would create ambiguity about which copy's destructor should run [Rust std::marker::Copy].

**`Clone`** is an explicit duplication mechanism. Calling `.clone()` on a value produces a deep copy through user-defined logic. `Clone` is a supertrait of `Copy` -- every `Copy` type is automatically `Clone`, but not every `Clone` type is `Copy`. Types like `String`, `Vec<T>`, and `HashMap<K, V>` implement `Clone` but not `Copy`, because their duplication involves heap allocation.

This distinction aligns with the type-theoretic framework: `Copy` types behave as unrestricted types (supporting implicit contraction), while non-`Copy` types behave as affine types (at most one use without explicit cloning).

#### 4.1.3 Drop Order and RAII

Rust inherits the RAII (Resource Acquisition Is Initialization) pattern from C++: resources are acquired in constructors and released in destructors, with the type system guaranteeing that destructors run when values go out of scope [Rust by Example: RAII]. The `Drop` trait provides Rust's destructor mechanism:

```rust
impl Drop for MyResource {
    fn drop(&mut self) {
        // cleanup logic
    }
}
```

Drop order in Rust follows specific, stabilized rules (RFC 1857):

- **Local variables**: Dropped in reverse order of declaration (LIFO), matching C++ behavior.
- **Struct fields**: Dropped in declaration order (FIFO), diverging from C++.
- **Enum variants**: Fields dropped in declaration order.
- **Tuples and arrays**: Dropped in forward order (first to last).

The divergence between variable drop order (reverse) and struct field drop order (forward) is a known source of confusion but was deliberately stabilized because real-world code, including `rust-openssl`, relies on the current ordering [RFC 1857; RFC Issue 744].

A critical invariant: `Copy` and `Drop` are mutually exclusive. If a type can be implicitly duplicated (`Copy`), the compiler cannot know which copy should run the destructor. If a type has a destructor (`Drop`), it must use affine (move) semantics to ensure the destructor runs exactly once.

#### 4.1.4 Comparison: Rust RAII vs. C++ RAII

Both Rust and C++ use RAII for deterministic resource management, but the guarantees differ substantially:

| Property | Rust | C++ |
|---|---|---|
| **Move semantics** | Destructive (source invalidated) | Non-destructive (source in "valid but unspecified" state) |
| **Custom move constructors** | Not supported (bitwise copy only) | Supported and common |
| **Use-after-move** | Compile-time error | Undefined behavior or logic error |
| **Double-free prevention** | Guaranteed by type system | Programmer responsibility |
| **Exception safety** | No exceptions (panic unwind is limited) | Complex exception safety levels |

C++ move semantics leave the moved-from object in a "valid but unspecified state," which means the programmer must reason about whether the moved-from object will be used again. Rust's destructive moves eliminate this entire class of bugs: the compiler statically prevents any access to a moved-from binding [The Coded Message 2022].

### 4.2 Borrowing Rules

#### 4.2.1 Theory: Aliasing XOR Mutability

The central invariant of Rust's borrowing system is the *aliasing XOR mutability* principle: at any given program point, a value may be accessed through either *any number* of shared references (`&T`) or *exactly one* exclusive reference (`&mut T`), but not both simultaneously [Rustonomicon: Aliasing]. This invariant prevents data races, iterator invalidation, and a wide class of aliasing-related bugs.

The principle has deep roots in programming language theory. Aliasing -- having multiple references to the same memory location -- is inherently problematic in the presence of mutation, because a mutation through one reference can invalidate assumptions made through another. The classical formulation is that aliasing and mutation are individually harmless but *jointly* dangerous. Rust's solution is to make them mutually exclusive at the type level.

Formally, the borrowing rules are:

1. **Shared references** (`&T`): Read-only access. Multiple shared references to the same value may coexist. The referent cannot be mutated through a shared reference (absent interior mutability).

2. **Exclusive references** (`&mut T`): Read-write access. At most one exclusive reference to a value may exist at any program point, and no shared references may coexist with it.

3. **Lifetime constraint**: Every reference must have a lifetime that does not exceed the lifetime of the referent (the value being borrowed).

#### 4.2.2 Reborrowing

Reborrowing is a compiler-inserted mechanism that allows passing a mutable reference to a function without permanently transferring the borrow. When a function takes `&mut T` and the caller has `&mut T`, the compiler creates a *reborrow* -- a new, shorter-lived mutable reference derived from the original -- rather than moving the original reference. The original reference is suspended for the duration of the reborrow and becomes usable again after the reborrow expires.

```rust
fn process(data: &mut Vec<i32>) { /* ... */ }

let mut v = vec![1, 2, 3];
let r = &mut v;
process(r);    // reborrow: r is temporarily suspended
r.push(4);     // r is usable again after reborrow expires
```

Reborrowing is essential for ergonomic use of mutable references and is tracked by the borrow checker as a chain of nested borrows, each with a lifetime no longer than its parent.

#### 4.2.3 Interior Mutability

The aliasing XOR mutability rule admits a controlled escape hatch: *interior mutability*, where a type provides mutation through shared references by encapsulating runtime safety checks. The standard library provides several interior mutability primitives:

- **`Cell<T>`**: For `Copy` types; allows get/set through `&Cell<T>` with no runtime cost beyond preventing compiler optimizations based on immutability.
- **`RefCell<T>`**: Runtime borrow checking; panics on aliasing violations at runtime.
- **`Mutex<T>`** / **`RwLock<T>`**: Thread-safe interior mutability using OS synchronization primitives.
- **`UnsafeCell<T>`**: The fundamental building block; all other interior mutability types are built on `UnsafeCell`, which is the only type for which creating a mutable reference from a shared reference is not undefined behavior.

Interior mutability types are *invariant* in their type parameter (see Section 4.3.3), which prevents the compiler from making incorrect aliasing assumptions.

The GhostCell pattern, introduced by Yanovski et al. (2021), offers a more sophisticated approach: it separates permissions from data using branded types (analogous to Haskell's `ST` monad), enabling safe synchronized access to collections of data without runtime overhead. GhostCell's soundness has been formally verified within the RustBelt framework [Yanovski et al. 2021].

### 4.3 Lifetimes

#### 4.3.1 Lifetime Annotations and Semantics

A lifetime in Rust denotes the region of the control-flow graph during which a reference is valid. Lifetime annotations are written as `'a`, `'b`, etc., and appear in function signatures, struct definitions, and impl blocks:

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

The annotation `'a` here is a lifetime *parameter* -- a universally quantified variable that the caller instantiates with a concrete lifetime. The signature states: "given any lifetime `'a`, if both inputs live for at least `'a`, the output also lives for at least `'a`." The compiler verifies at each call site that the actual lifetimes of the arguments satisfy this constraint.

The special lifetime `'static` denotes values that live for the entire duration of the program, such as string literals and leaked heap allocations.

#### 4.3.2 Lifetime Elision Rules

To reduce annotation burden, Rust applies three *elision rules* that allow lifetime parameters to be omitted in common patterns (RFC 141):

1. **Input rule**: Each elided lifetime in input position becomes a distinct lifetime parameter. `fn foo(x: &i32, y: &i32)` becomes `fn foo<'a, 'b>(x: &'a i32, y: &'b i32)`.

2. **Single-input rule**: If there is exactly one input lifetime (elided or not), that lifetime is assigned to all elided output lifetimes. `fn foo(x: &i32) -> &i32` becomes `fn foo<'a>(x: &'a i32) -> &'a i32`.

3. **Self rule**: If one of the inputs is `&self` or `&mut self`, the lifetime of `self` is assigned to all elided output lifetimes. This covers the common method pattern where a method returns a reference derived from `self`.

If the compiler reaches the end of these rules and there remain output lifetimes that cannot be determined, it emits an error requiring explicit annotation. The elision rules are purely syntactic sugar; they do not change the semantics of lifetime checking [Rust Reference: Lifetime Elision].

#### 4.3.3 Lifetime Subtyping and Variance

Lifetimes in Rust form a subtyping relation: `'long <: 'short` if and only if the region denoted by `'long` completely contains the region denoted by `'short`. Intuitively, a reference that lives longer can always be used where a shorter-lived reference is expected. The lifetime `'static` is a subtype of every other lifetime.

This subtyping relation interacts with generic types through *variance*, which describes how subtyping of type parameters relates to subtyping of the enclosing type [Rustonomicon: Subtyping]. Rust recognizes three variance kinds:

**Covariance**: `F<Sub>` is a subtype of `F<Super>` when `Sub <: Super`. Subtyping "passes through." Shared references `&'a T` are covariant in both `'a` and `T`: a `&'long T` can be used where `&'short T` is expected, and a `&'a SubType` can be used where `&'a SuperType` is expected.

**Contravariance**: `F<Super>` is a subtype of `F<Sub>` when `Sub <: Super`. Subtyping is "inverted." Function argument types `fn(T)` are contravariant in `T`: a function accepting a broader type can substitute for one accepting a narrower type.

**Invariance**: No subtyping relationship exists regardless of the parameters' relationship. Exclusive references `&'a mut T` are covariant in `'a` but *invariant* in `T`. This is essential for soundness: if `&mut T` were covariant in `T`, one could store a short-lived reference through a `&mut &'static str` that was widened to `&mut &'a str`, creating a dangling pointer.

The variance table for standard types is:

| Type | Variance in `'a` | Variance in `T` |
|---|---|---|
| `&'a T` | covariant | covariant |
| `&'a mut T` | covariant | **invariant** |
| `Box<T>` | -- | covariant |
| `Vec<T>` | -- | covariant |
| `Cell<T>` | -- | **invariant** |
| `UnsafeCell<T>` | -- | **invariant** |
| `*const T` | -- | covariant |
| `*mut T` | -- | **invariant** |
| `fn(T) -> U` | -- | **contravariant** (T), covariant (U) |

For user-defined structs, variance is computed from field usage: a struct is covariant in a parameter if all field usages are covariant, contravariant if all are contravariant, and invariant if usages are mixed or any field usage is invariant (RFC 738) [Rust RFC 0738].

### 4.4 The Borrow Checker: Implementation and Evolution

#### 4.4.1 The AST-Based Borrow Checker (2012--2019)

The original borrow checker operated on Rust's Abstract Syntax Tree (AST), computing lifetimes based on lexical scopes. Under this scheme, a reference's lifetime extended to the end of the enclosing block, regardless of whether the reference was actually used after a certain point. This produced correct but overly conservative results, rejecting many programs that were intuitively safe.

The AST-based checker served Rust from its early development through Rust 1.0 (2015) and several years beyond. Its lexical lifetime model was a persistent source of programmer frustration, as it required artificial scope blocks and variable rebinding to satisfy the checker. After seven years of service, the AST borrow checker was removed entirely in PR #64790 (September 2019) [rust-lang/rust PR #64790].

#### 4.4.2 Non-Lexical Lifetimes (NLL, RFC 2094)

The transition to Non-Lexical Lifetimes (NLL) was the most significant improvement to the borrow checker since Rust 1.0. Proposed in RFC 2094 by Niko Matsakis (August 2017), NLL redefined lifetimes based on the control-flow graph derived from MIR (Mid-level Intermediate Representation) rather than lexical scopes [RFC 2094].

The key technical changes were:

**Liveness-based lifetimes**: A lifetime extends only through the portions of the control-flow graph where the reference is *live* -- i.e., where it may be used in the future. Once a reference is last used, its lifetime ends, even if the variable binding remains in scope. This replaced the lexical model where lifetimes extended to the closing brace.

**Location-aware subtyping**: Subtyping constraints between lifetimes are annotated with the program point at which they apply. This enables different constraints on different execution paths, allowing conditional borrows to work correctly across match arms.

**Region inference algorithm**: The algorithm operates through fixed-point iteration. Each lifetime variable starts as an empty set of program points. Constraints are generated from liveness analysis (if a lifetime appears in a live variable at point P, it must include P), subtyping (from reference assignments), and reborrowing (from reference dereferences). The algorithm iteratively grows lifetime variables until all constraints are satisfied.

Three motivating examples drove the RFC:

1. **Problem Case #1**: A mutable reference assigned to a variable blocked subsequent use of the original value until the variable's scope ended, even if the reference was never used again.

2. **Problem Case #2**: Borrowing from a map in one match arm prevented modifying the map in another arm, even though the borrow was branch-specific.

3. **Problem Case #3**: Conditional returns of references created overly broad lifetime requirements. (This case was deferred and is handled by Polonius.)

NLL was feature-complete by December 2017, stabilized for the 2018 edition, and enabled for the 2015 edition in Rust 1.36 (June 2019). All subsequent Rust editions use NLL [Huey 2022].

#### 4.4.3 Polonius: The Next-Generation Borrow Checker

Polonius, named after the Shakespeare character, represents a fundamental rethinking of how the borrow checker reasons about references. Where NLL asks "where does this reference live?" (tracking regions -- sets of program points), Polonius asks "where might this reference have come from?" (tracking origins -- sets of loans) [Matsakis 2023].

The inversion from regions to origins enables more precise analysis. In NLL, a lifetime is a set of program points during which a reference is valid. In Polonius, an *origin* is a set of *loans* (borrowing operations) that might have produced a given reference. The key insight is that loan-based reasoning is inherently flow-sensitive: the set of possible loans that produced a reference can change at each program point as references are reassigned or new borrows are introduced.

Polonius models borrow checking as a reachability problem in a graph that combines region information with control-flow information. Loan propagation determines which loans are *active* at each program point -- i.e., which borrows are still in effect and must be respected. A conflict occurs when a loan is active at a point that would invalidate it (e.g., mutating a value while a shared borrow of it is active).

**Current status (as of early 2026)**: An "alpha" version of Polonius has been implemented within the existing borrow checker, achieving behavioral compatibility with all existing rustc tests. The 2025H2 Rust project goals targeted a stabilizable implementation for nightly, with the main remaining blocker being an opaque type soundness issue. Polonius addresses NLL Problem Case #3 (conditional returns) and enables future patterns like lending iterators [Rust Project Goals 2025H2; Rust Blog December 2025 Update].

### 4.5 Formal Foundations

#### 4.5.1 Patina (Reed 2015)

The first major effort to formalize Rust was Patina, Eric Reed's 2015 Master's thesis at the University of Washington. Patina presented a formal semantics capturing Rust's key memory-safety features -- unique pointers and borrowed references -- and described the operation of the borrow checker. The formalization included partial proofs of progress and preservation, demonstrating that the combined system of affine types and regions was sound [Reed 2015].

#### 4.5.2 RustBelt (Jung et al. 2018)

RustBelt, published at POPL 2018, provided the first machine-checked safety proof for a realistic subset of Rust. The central challenge was that Rust's safety claims extend to programs using `unsafe` code within libraries, which cannot be checked by the borrow checker alone. RustBelt addressed this by defining a semantic model of Rust's type system in the Iris separation logic framework, mechanized in Coq [Jung et al. 2018].

RustBelt's key contribution is a *lifetime logic* whose primary feature is *borrow propositions* that mirror Rust's borrowing mechanism. The framework is extensible: for each new library that uses `unsafe` features, a verification condition can be specified and checked against the model. Standard library types verified under RustBelt include `Arc`, `Rc`, `Cell`, `RefCell`, `Mutex`, `RwLock`, `mem::swap`, `thread::spawn`, `rayon::join`, and `take_mut`.

Ralf Jung's doctoral dissertation (2020), which encompassed both RustBelt and Stacked Borrows, received multiple awards including an Honorable Mention for the ACM Doctoral Dissertation Award and the ACM SIGPLAN John C. Reynolds Doctoral Dissertation Award [Jung 2020].

#### 4.5.3 Oxide (Weiss et al. 2019)

Oxide, by Weiss, Gierczak, Patterson, and Ahmed, presents a formalized type system close to source-level Rust with fully-annotated types. Its novel contribution is a view of lifetimes as approximations of reference *provenances* -- where references came from -- rather than mere validity regions. The type system automatically computes provenance information through a substructural typing judgment [Weiss et al. 2019].

Oxide provided the first syntactic proof of type safety for borrow checking using progress and preservation, without relying on separation logic. This makes it more accessible for reasoning about Rust's surface-level type system, complementing RustBelt's semantic approach.

#### 4.5.4 Stacked Borrows and Tree Borrows

Stacked Borrows, introduced by Jung et al. (2020) at POPL, defines an operational semantics for memory accesses in Rust, particularly for `unsafe` code. It specifies the conditions under which a Rust program exhibits undefined behavior due to aliasing violations. The model maintains a per-location stack of tags that tracks the nesting of borrows; an access through a reference is valid only if that reference's tag is at or above the top of the stack. Raw pointers receive their own stack entries, enabling reasoning about interactions between safe and unsafe code [Jung et al. 2020].

Tree Borrows (2023--2025) refines Stacked Borrows by replacing the stack model with a tree structure. The tree model addresses two major issues with Stacked Borrows: overly eager uniqueness enforcement for mutable references, and the confinement of references to the size of their originating type. When evaluated against a test suite, Tree Borrows reduced aliasing violations by 54% compared to Stacked Borrows, while preserving nearly all optimizations [Ralf Jung 2023; PLDI 2025].

Both models are implemented in Miri, the Rust MIR interpreter, which dynamically checks Rust programs against these aliasing models. Miri has become an essential tool for verifying the correctness of `unsafe` code in the Rust ecosystem.

#### 4.5.5 Place Capability Graphs (Grannan et al. 2025)

The most recent formal contribution is Place Capability Graphs (PCGs), presented at OOPSLA 2025. PCGs model Rust's type checking as a directed acyclic hypergraph where nodes represent Rust *places* (memory locations) annotated with *capabilities* describing permitted operations. The graph is constructed through a forward analysis over MIR, directly connecting to the compiler's internal representations [Grannan et al. 2025].

PCGs address a gap in prior work: existing models either support a small idealized language disconnected from real Rust code, or have limited precision in modeling borrows, composite types, and function signatures. PCGs support over 97% of Rust functions in the most popular crates and have been validated by integrating into two existing tools: Flowistry (information-flow analysis) and Prusti (deductive verifier).

### 4.6 Practical Patterns

#### 4.6.1 Self-Referential Structs

Self-referential structs -- structures containing a pointer to their own data -- are fundamentally challenging in Rust because Rust's move semantics invalidate internal pointers when a value is moved. If a struct contains both owned data and a reference into that data, moving the struct will copy the pointer without updating it, creating a dangling reference.

Several approaches exist for handling self-referential structures:

**`Pin<T>`**: The `Pin` wrapper prevents a value from being moved after it has been pinned, ensuring internal pointers remain valid. `Pin` is the foundation for Rust's async/await system, where `Future` state machines are self-referential. However, `Pin` is notoriously difficult to use correctly, requiring `unsafe` code for most non-trivial patterns.

**Arena allocation**: By allocating all components of a self-referential structure in an arena (e.g., `typed-arena`, `bumpalo`), all references share the arena's lifetime, eliminating the self-referential problem. Arena allocation trades memory flexibility for lifetime simplicity: all values in an arena are deallocated simultaneously when the arena is dropped [Manish Goregaokar 2021].

**Library solutions**: The `ouroboros` crate provides procedural macros for generating safe self-referential struct wrappers, using `Pin` and careful lifetime management internally. The `self_cell` crate offers a lighter-weight alternative without procedural macros. Both abstract over the underlying `unsafe` code required for self-referential patterns.

**Index-based designs**: Rather than storing references, many Rust data structures (graphs, trees, ECS systems) store indices into a backing `Vec` or `SlotMap`. This sidesteps the borrow checker entirely by converting pointer relationships into integer relationships, at the cost of an extra indirection on access.

#### 4.6.2 Arena Allocation

Arena allocators are a natural fit for Rust's lifetime system because they create a single lifetime that governs all allocations within the arena. The two primary crate implementations illustrate different design trade-offs:

**`typed-arena`**: Allocates objects of a single type, runs destructors on allocated objects when the arena is dropped, and supports creating cycles between arena-allocated values (since all values share the same lifetime). The single-type restriction enables a simpler and more efficient implementation.

**`bumpalo`**: A bump allocator supporting heterogeneous types with extremely fast allocation (pointer increment). It does not run destructors by default (though `bumpalo::boxed::Box` provides opt-in destructors). Bumpalo is widely used in web frameworks and parsers where many short-lived allocations share a request or parse lifetime.

Both crates enforce that references to arena-allocated values cannot outlive the arena, using Rust's standard lifetime mechanisms. This makes arenas an effective tool for graph-like data structures where pointer relationships between nodes must be expressed without fighting the borrow checker.

---

## 5. Comparative Synthesis

### 5.1 Cross-System Comparison

| Dimension | Rust Ownership | C++ RAII | Swift ARC | Linear Haskell | Cyclone Regions |
|---|---|---|---|---|---|
| **Type discipline** | Affine (move by default) | Unrestricted (copy by default) | Unrestricted (reference types) | Linear (opt-in via `%1 ->`) | Regions + unique ptrs |
| **Aliasing control** | Compile-time XOR | None (programmer discipline) | Runtime (COW, exclusivity checks) | Via linearity constraints | Partial (unique pointers only) |
| **Lifetime tracking** | Explicit annotations + inference | Implicit (scope-based) | None (reference counted) | None (GC or linearity) | Explicit region annotations |
| **Move semantics** | Destructive (source invalidated) | Non-destructive (valid-but-unspecified) | N/A (reference types) | N/A (pure/persistent) | Unique pointer consumption |
| **Concurrency safety** | `Send`/`Sync` traits, compile-time | Programmer responsibility | `@Sendable`, runtime | STM, pure functions | Not addressed |
| **Cycle handling** | `Rc`/`Weak` (manual) | `shared_ptr`/`weak_ptr` | `weak` references | N/A (pure) | Within-region references |
| **Annotation overhead** | Moderate | Low | Low | Low (multiplicities only) | High |
| **Formal verification** | RustBelt, Oxide, PCGs | Partial (individual libraries) | Limited | Metatheory proofs | Type safety proofs |

### 5.2 Trade-off Analysis

**Rust vs. C++ RAII**: Rust's destructive moves eliminate use-after-move bugs that remain possible in C++, where moved-from objects persist in a "valid but unspecified state." However, Rust's inability to define custom move constructors means that types requiring non-trivial relocation (e.g., self-referential types) face additional complexity. C++ pays for its flexibility with an entire dimension of complexity -- exception safety levels, the Rule of Five, and subtle interactions between moves, copies, and destructors -- that Rust avoids through its simpler model.

**Rust vs. Swift ARC**: Swift's Automatic Reference Counting trades compile-time complexity for runtime cost. ARC requires no lifetime annotations and handles most aliasing patterns naturally, but imposes per-copy reference count increments/decrements that can measurably impact performance in tight loops. Swift's recent introduction of noncopyable types (`~Copyable`, Swift 5.9) and the strict concurrency model (`@Sendable`, `actor` isolation) represent a partial convergence toward Rust-like compile-time guarantees, though the approaches remain fundamentally different in their default assumptions [Swift Evolution].

**Rust vs. Linear Haskell**: Linear Haskell (GHC `-XLinearTypes`) introduces linearity through *multiplicity-annotated function arrows*: `a %1 -> b` ensures the argument is used exactly once. This is a *dual* approach to Rust's ownership: in Linear Haskell, the *function* guarantees it will use the argument exactly once, with no restriction on the caller. In Rust, the *caller* guarantees unique access (ownership), and the function has no restriction on how many times it uses the value internally [Bernardy et al. 2018]. Linear Haskell operates within a garbage-collected runtime, so linearity serves primarily as a discipline for resource management (file handles, mutable arrays) rather than memory safety. The systems are complementary rather than competing, targeting different domains.

**Rust vs. Cyclone**: Cyclone is Rust's most direct intellectual ancestor in the region-based memory management lineage. Both use explicit region/lifetime annotations, both enforce region subtyping (outlives relationships), and both perform intra-procedural inference to reduce annotation burden. The key difference is scope: Cyclone supported multiple memory management strategies (regions, unique pointers, reference counting, garbage collection) within a single program, while Rust commits to ownership as the universal discipline. Cyclone's wider strategy space provided more flexibility but also more complexity and less predictable performance characteristics. Cyclone's discontinuation and Rust's success suggest that the narrower, more opinionated design was more viable for adoption [Pling: The Fascinating Influence of Cyclone].

---

## 6. Open Problems & Gaps

### 6.1 Partial Borrows and View Types

The borrow checker's most significant practical limitation is that it treats struct borrows monolithically: borrowing one field of a struct through a method call borrows the *entire* struct, preventing concurrent access to other fields. Within a single function body, the compiler can often prove that borrows of different fields are disjoint. But across function boundaries, the function signature can only express a borrow of the whole struct, not of individual fields.

**View types** are a proposed language extension that would allow function signatures to specify which fields of a struct are borrowed:

```rust
// Hypothetical view type syntax
fn process(&{field_a, field_b} self) -> &str {
    &self.field_a
}
```

This would enable callers to simultaneously borrow other fields not mentioned in the view. A short paper on view types was presented at SPLASH 2025 (OOPSLA companion), and active discussion continues on Rust Internals [ACM SPLASH 2025; Rust Internals 2024]. The main challenges are: defining a coherent syntax and semantics that compose well with existing Rust features, handling nested fields and projections, and avoiding exponential growth in the number of possible views.

### 6.2 Self-Referential Types and Immovable Types

Ergonomic self-referential types remain one of Rust's most frequently requested features. The current `Pin` API is correct but ergonomically painful, requiring `unsafe` code for most non-trivial use cases. Yoshua Wuyts has proposed a comprehensive approach involving several interrelated features [Wuyts 2024]:

- A `'self` lifetime for references within a struct that point to other fields of the same struct.
- A `!Move` auto-trait to mark types that must not be moved after initialization.
- *Safe out-pointer notation* (`super let` / `-> super Type`) for initializing self-referential fields.
- **View types** (Section 6.1) to enable safe projection into pinned self-referential types.

Each of these features can be designed and stabilized independently, but the full ergonomic benefit requires their composition. This remains an active area of language design with no consensus timeline.

### 6.3 Polonius Completion and Stabilization

While the Polonius "alpha" has demonstrated behavioral compatibility with existing Rust code and handles key problem cases (conditional reference returns, lending iterators), several challenges remain before stabilization:

- **Performance**: The original Datalog-based Polonius prototype had scalability issues. The in-tree reimplementation using dataflow analysis has better performance characteristics but requires further optimization.
- **Opaque type soundness**: An outstanding soundness issue involving opaque types (e.g., `impl Trait` in return position) must be resolved before all tests pass.
- **Diagnostic quality**: Polonius's origin-based model requires new error messages that explain loan conflicts rather than lifetime conflicts, which may be less intuitive for users accustomed to NLL-style errors.

The Rust project goals for 2025H2 targeted a stabilizable implementation on nightly, with full stabilization projected for 2026 [Rust Project Goals 2025H2].

### 6.4 Aliasing Models for Unsafe Code

The transition from Stacked Borrows to Tree Borrows as the operational semantics for unsafe Rust code is not yet complete. While Tree Borrows reduces false positives by 54% and supports all optimizations that the Rust compiler currently performs, the model is not yet finalized. Key open questions include:

- Precise treatment of `UnsafeCell` and interior mutability patterns.
- Interactions between aliasing models and compiler optimizations based on `noalias` LLVM annotations.
- Whether the aliasing model should be *prescriptive* (defining what programs are valid) or *descriptive* (characterizing what the compiler assumes), and whether these perspectives can be reconciled.

### 6.5 True Linear Types

Rust's affine type discipline allows values to be silently dropped, which means the type system cannot enforce that a resource is *used* (not merely allocated). Protocols that require explicit completion -- transactions that must be committed or aborted, network connections that must be cleanly shut down -- cannot be expressed through types alone. True linear types (`must_use` on steroids) would enable the compiler to reject programs that discard resources without explicit consumption. Several pre-RFC discussions have explored adding a `#[must_use]` attribute that the compiler enforces at the type level rather than as a lint, but no consensus design has emerged [without.boats 2024].

---

## 7. Conclusion

Rust's ownership, borrowing, and lifetime system represents the most successful practical application of substructural type theory to date. By synthesizing affine types (from Girard's linear logic, via the substructural type systems literature), region-based memory management (from Tofte-Talpin, via Cyclone), and a carefully designed borrowing discipline (the aliasing XOR mutability principle), Rust achieves compile-time memory safety and data-race freedom without runtime overhead.

The system's evolution reflects a productive tension between theoretical soundness and practical ergonomics. The original AST-based borrow checker was sound but frustratingly conservative. NLL (RFC 2094) dramatically improved ergonomics by computing lifetimes from the control-flow graph rather than lexical scopes. Polonius promises further improvements by inverting the analysis from "where does this reference live?" to "where did this reference come from?", enabling more precise reasoning about conditional borrows and reference returns.

The formal foundations are now substantial: RustBelt provides machine-checked safety proofs for the core language and key standard library types; Oxide offers an accessible syntactic proof of borrow-checking soundness; Stacked Borrows and Tree Borrows define operational semantics for unsafe code; and Place Capability Graphs bridge the gap between idealized formalisms and the compiler's actual MIR representation. These foundations enable not just confidence in Rust's safety claims but also principled evolution of the language.

Open challenges remain. Partial borrows and view types would resolve one of the borrow checker's most common sources of friction. Ergonomic self-referential types would eliminate the need for `unsafe` code in async runtimes, parsers, and graph data structures. True linear types would extend the ownership discipline to enforce resource consumption protocols. And the transition from Stacked Borrows to Tree Borrows must be completed to provide a stable foundation for unsafe code guidelines.

These are not signs of a system in crisis but of a system under active, principled development. The trajectory from Girard's linear logic (1987) through Tofte-Talpin regions (1997) and Cyclone (2002) to Rust's production deployment (2015) and its ongoing formalization represents one of the most successful theory-to-practice pipelines in programming language research. The remaining open problems are precisely those that arise when a theoretical framework meets the full complexity of real-world systems programming -- and Rust's track record suggests that they will yield to the same combination of formal rigor and pragmatic engineering that produced the ownership model in the first place.

---

## References

[Bernardy et al. 2018] Jean-Philippe Bernardy, Mathieu Boespflug, Ryan R. Newton, Simon Peyton Jones, and Arnaud Spiwack. "Linear Haskell: Practical Linearity in a Higher-Order Polymorphic Language." *Proceedings of the ACM on Programming Languages (POPL)*, 2(POPL), 2018. https://arxiv.org/abs/1710.09756

[Chromium Security 2020] Chromium Project. "Memory Safety." *The Chromium Projects*, 2020. https://www.chromium.org/Home/chromium-security/memory-safety/

[Girard 1987] Jean-Yves Girard. "Linear Logic." *Theoretical Computer Science*, 50(1):1--102, 1987. https://www.sciencedirect.com/science/article/pii/0304397587900454

[Grannan et al. 2025] Jem Grannan, Facundo Bilyj, Federico Fiala, Robin Geer, Joao Medeiros, Peter Mueller, and Alexander J. Summers. "Place Capability Graphs: A General-Purpose Model of Rust's Ownership and Borrowing Guarantees." *Proceedings of the ACM on Programming Languages (OOPSLA)*, 2025. https://arxiv.org/abs/2503.21691

[Grossman et al. 2002] Dan Grossman, Greg Morrisett, Trevor Jim, Michael Hicks, Yanling Wang, and James Cheney. "Region-Based Memory Management in Cyclone." *ACM SIGPLAN Notices*, 37(5):282--293, 2002. https://dl.acm.org/doi/10.1145/543552.512563

[Huey 2022] Jack Huey. "The Rust borrow checker just got (a little bit) smarter." Blog post, June 2022. http://jackhuey.me/rust/2022/06/10/nll-stabilization.html

[Jung 2020] Ralf Jung. "Understanding and Evolving the Rust Programming Language." PhD Dissertation, Saarland University, 2020. https://research.ralfj.de/thesis.html

[Jung et al. 2018] Ralf Jung, Jacques-Henri Jourdan, Robbert Krebbers, and Derek Dreyer. "RustBelt: Securing the Foundations of the Rust Programming Language." *Proceedings of the ACM on Programming Languages (POPL)*, 2(POPL), 2018. https://plv.mpi-sws.org/rustbelt/popl18/

[Jung et al. 2020] Ralf Jung, Hoang-Hai Dang, Jeehoon Kang, and Derek Dreyer. "Stacked Borrows: An Aliasing Model for Rust." *Proceedings of the ACM on Programming Languages (POPL)*, 4(POPL), 2020. https://plv.mpi-sws.org/rustbelt/stacked-borrows/

[Jung 2023] Ralf Jung. "From Stacks to Trees: A new aliasing model for Rust." Blog post, June 2023. https://www.ralfj.de/blog/2023/06/02/tree-borrows.html

[Manish Goregaokar 2021] Manish Goregaokar. "Arenas in Rust." Blog post, March 2021. https://manishearth.github.io/blog/2021/03/15/arenas-in-rust/

[Matsakis 2023] Niko Matsakis. "Polonius revisited, part 1." *baby steps* blog, September 2023. https://smallcultfollowing.com/babysteps/blog/2023/09/22/polonius-part-1/

[Microsoft Security Response Center 2019] Matt Miller. "Trends, Challenges, and Strategic Shifts in the Software Vulnerability Mitigation Landscape." BlueHat IL, 2019. https://msrc.microsoft.com/blog/2019/07/a-proactive-approach-to-more-secure-code/

[NSA 2022] National Security Agency. "Software Memory Safety." Cybersecurity Information Sheet, November 2022. https://media.defense.gov/2022/Nov/10/2003112742/-1/-1/0/CSI_SOFTWARE_MEMORY_SAFETY.PDF

[Pearce 2021] David J. Pearce. "A Lightweight Formalism for Reference Lifetimes and Borrowing in Rust." *ACM Transactions on Programming Languages and Systems*, 43(1), 2021. https://dl.acm.org/doi/10.1145/3443420

[Pierce 2002] Benjamin C. Pierce. *Types and Programming Languages*. MIT Press, 2002.

[Reed 2015] Eric Reed. "Patina: A Formalization of the Rust Programming Language." Master's Thesis, University of Washington, 2015. https://dada.cs.washington.edu/research/tr/2015/03/UW-CSE-15-03-02.pdf

[RFC 141] Rust RFC 0141. "Lifetime Elision." https://rust-lang.github.io/rfcs/0141-lifetime-elision.html

[RFC 738] Rust RFC 0738. "Variance." https://rust-lang.github.io/rfcs/0738-variance.html

[RFC 1857] Rust RFC 1857. "Stabilize Drop Order." https://rust-lang.github.io/rfcs/1857-stabilize-drop-order.html

[RFC 2094] Rust RFC 2094. "Non-Lexical Lifetimes." https://rust-lang.github.io/rfcs/2094-nll.html

[Rust Blog December 2025 Update] Rust Blog. "Project goals update -- December 2025." January 2026. https://blog.rust-lang.org/2026/01/05/project-goals-2025-december-update/

[Rust by Example: RAII] "RAII." *Rust by Example*. https://doc.rust-lang.org/rust-by-example/scope/raii.html

[Rust Project Goals 2025H2] "Stabilizable Polonius support on nightly." *Rust Project Goals*. https://rust-lang.github.io/rust-project-goals/2025h2/polonius.html

[Rust Reference: Influences] "Influences." *The Rust Reference*. https://doc.rust-lang.org/reference/influences.html

[Rust Reference: Lifetime Elision] "Lifetime Elision." *The Rust Reference*. https://doc.rust-lang.org/reference/lifetime-elision.html

[Rustonomicon: Aliasing] "Aliasing." *The Rustonomicon*. https://doc.rust-lang.org/nomicon/aliasing.html

[Rustonomicon: Subtyping] "Subtyping and Variance." *The Rustonomicon*. https://doc.rust-lang.org/nomicon/subtyping.html

[rust-lang/rust PR #64790] "Rest In Peace, AST borrowck (2012-2019)." https://github.com/rust-lang/rust/pull/64790

[rustc Dev Guide] "The Borrow Checker." *Rust Compiler Development Guide*. https://rustc-dev-guide.rust-lang.org/borrow_check.html

[Rust std::marker::Copy] "Trait std::marker::Copy." *Rust Standard Library Documentation*. https://doc.rust-lang.org/std/marker/trait.Copy.html

[The Coded Message 2022] Jimmy Hartzell. "C++ Move Semantics Considered Harmful (Rust is better)." *The Coded Message*, 2022. https://www.thecodedmessage.com/posts/cpp-move/

[The Coded Message: RAII] Jimmy Hartzell. "RAII: Compile-Time Memory Management in C++ and Rust." *The Coded Message*. https://www.thecodedmessage.com/posts/raii/

[Tofte and Talpin 1997] Mads Tofte and Jean-Pierre Talpin. "Region-Based Memory Management." *Information and Computation*, 132(2):109--176, 1997. https://www.sciencedirect.com/science/article/pii/S0890540196926139

[Tree Borrows PLDI 2025] Neven Villani, Johannes Hostert, Derek Dreyer, and Ralf Jung. "Tree Borrows." *Proceedings of the ACM on Programming Languages (PLDI)*, 2025. https://iris-project.org/pdfs/2025-pldi-treeborrows.pdf

[Wadler 1993] Philip Wadler. "A Taste of Linear Logic." *Mathematical Foundations of Computer Science*, 1993. https://homepages.inf.ed.ac.uk/wadler/papers/lineartaste/lineartaste-revised.pdf

[Walker 2005] David Walker. "Substructural Type Systems." In *Advanced Topics in Types and Programming Languages*, edited by Benjamin C. Pierce, Chapter 1. MIT Press, 2005.

[Weiss et al. 2019] Aaron Weiss, Olek Gierczak, Daniel Patterson, and Amal Ahmed. "Oxide: The Essence of Rust." arXiv:1903.00982, 2019. https://arxiv.org/abs/1903.00982

[without.boats 2024] without.boats. "Ownership." Blog post, 2024. https://without.boats/blog/ownership/

[Wuyts 2024] Yoshua Wuyts. "Ergonomic Self-Referential Types for Rust." Blog post, July 2024. https://blog.yoshuawuyts.com/self-referential-types/

[Yanovski et al. 2021] Joshua Yanovski, Hoang-Hai Dang, Ralf Jung, and Derek Dreyer. "GhostCell: Separating Permissions from Data in Rust." *Proceedings of the ACM on Programming Languages (ICFP)*, 5(ICFP), 2021. https://dl.acm.org/doi/10.1145/3473597

---

## Practitioner Resources

**The Rustonomicon** -- The official guide to unsafe Rust, including detailed explanations of ownership semantics, variance, `PhantomData`, `Drop` check, and aliasing rules. Essential reading for anyone implementing data structures or FFI bindings.
https://doc.rust-lang.org/nomicon/

**Rust Reference: Destructors** -- The canonical specification of drop order for variables, struct fields, enum variants, tuples, and temporaries. Critical for understanding RAII guarantees.
https://doc.rust-lang.org/reference/destructors.html

**Miri** -- An interpreter for Rust's MIR that checks programs against Stacked Borrows and Tree Borrows aliasing models. Indispensable for validating `unsafe` code. Available via `rustup component add miri`.
https://github.com/rust-lang/miri

**Polonius** -- The repository for the next-generation borrow checker. Contains the Datalog-based prototype and links to the in-tree implementation. Testable on nightly with `-Z polonius`.
https://github.com/rust-lang/polonius

**`typed-arena`** -- A single-type arena allocator that runs destructors and supports cycles between arena-allocated values. Minimal API surface.
https://crates.io/crates/typed-arena

**`bumpalo`** -- A fast bump allocator supporting heterogeneous types. Widely used in web frameworks (e.g., Dioxus, Dodrio) for request-scoped allocations.
https://crates.io/crates/bumpalo

**`ouroboros`** -- Procedural macro for generating safe self-referential struct wrappers. Provides `#[self_referencing]` attribute macro.
https://crates.io/crates/ouroboros

**`self_cell`** -- Lightweight self-referential cell without proc macros. Zero dependencies, `no_std` compatible, Miri-tested.
https://crates.io/crates/self_cell

**Lifetime Variance Example** -- An interactive tutorial on variance in Rust lifetimes, covering formalization and practical examples.
https://lifetime-variance.sunshowers.io/

**Effective Rust: Item 15 (Understand the Borrow Checker)** -- A practitioner-oriented explanation of borrow checking with worked examples of common patterns and workarounds.
https://www.lurklurk.org/effective-rust/borrows.html

**a-mir-formality** -- A Rust project for building a formal model of Rust's MIR, used in Polonius development and testing.
https://github.com/rust-lang/a-mir-formality

**Place Capability Graphs (PCGs)** -- Research prototype implementing the PCG model for Rust analysis, with integrations into Flowistry and Prusti.
https://rust-formal-methods.github.io/meetings/pcg/
