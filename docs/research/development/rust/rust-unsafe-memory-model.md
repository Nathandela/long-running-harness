---
title: "Unsafe Rust and the Formal Memory Model"
date: 2026-03-21
summary: A survey of Rust's unsafe subset and formal memory model — covering the Stacked Borrows and Tree Borrows aliasing models, pointer provenance, interior mutability, Miri verification, and the theoretical foundations in RustBelt that prove the soundness of safe abstractions built on unsafe primitives.
keywords: [rust, unsafe, memory-model, stacked-borrows, tree-borrows, miri, formal-verification]
---

# Unsafe Rust and the Formal Memory Model

*2026-03-21*

## Abstract

Rust's safety guarantee rests on a deceptively simple invariant: *safe code cannot cause undefined behaviour*. This invariant is not enforced by eliminating low-level operations but by quarantining them behind the `unsafe` keyword, where the programmer assumes responsibility for upholding contracts the compiler cannot verify. The resulting architecture — safe abstractions erected atop unsafe primitives — pervades the language from `Vec<T>` and `HashMap` in the standard library to every FFI boundary and lock-free data structure in the ecosystem. Understanding precisely what contracts unsafe code must satisfy, and proving that well-known abstractions do satisfy them, requires a formal memory model: a mathematical specification of which pointer operations are defined and which constitute undefined behaviour.

This survey examines the current state of that formal memory model across three strata. At the specification level, we analyse the Stacked Borrows aliasing model (Jung et al., POPL 2020) and its successor Tree Borrows (Villani et al., PLDI 2025), the pointer provenance framework codified in RFC 3559 and stabilised in Rust 1.84, and the interior mutability hierarchy rooted in `UnsafeCell<T>`. At the tooling level, we assess Miri, the MIR interpreter that operationally detects undefined behaviour across more than 100,000 crates (Jung et al., POPL 2026), alongside the formal verification tools Prusti, Creusot, Verus, and RefinedRust. At the foundational level, we survey RustBelt (Jung et al., POPL 2018) and its extensions, which use the Iris separation logic framework to provide machine-checked soundness proofs for Rust's type system and key standard-library types. We compare Rust's approach with the undefined behaviour models of C/C++, Java, and Go, and catalogue the open problems — including memory model incompleteness, Tree Borrows finalisation, and the gap between formal models and the actual compiler — that define the research frontier.

The paper synthesises material from over thirty primary sources spanning programming language theory, systems programming, and software verification, targeting researchers and practitioners who need a unified view of the landscape as it stands in early 2026.

---

## 1. Introduction

### 1.1 The Problem of Unsafe Code in a Safe Language

Systems programming demands direct control over memory layout, pointer arithmetic, foreign-function calls, and concurrent data access. Historically, these capabilities have been inseparable from the risk of undefined behaviour (UB): use-after-free, data races, type confusion, and aliasing violations that silently corrupt program state and open security vulnerabilities. C and C++ embed undefined behaviour deeply into their standards, relying on programmer discipline and external tools to avoid it. Garbage-collected languages such as Java and Go eliminate most UB at the cost of runtime overhead, deterministic resource management, or both.

Rust's contribution is architectural: it factors the language into a *safe dialect*, where the compiler statically guarantees the absence of UB, and an *unsafe dialect*, where five additional capabilities — collectively termed the "unsafe superpowers" — become available at the cost of programmer-assumed proof obligations [Rust Book, ch. 20.1]. The five superpowers are:

1. Dereferencing a raw pointer (`*const T` or `*mut T`).
2. Calling an unsafe function or method.
3. Accessing or modifying a mutable static variable.
4. Implementing an unsafe trait.
5. Accessing fields of a `union`.

Crucially, `unsafe` does not disable the borrow checker or any other static analysis; it merely grants access to operations the compiler cannot verify [Rustonomicon, "What Unsafe Can Do"]. The fundamental property of Safe Rust is the *soundness property*: no matter what, Safe Rust cannot cause undefined behaviour [Rustonomicon, "How Safe and Unsafe Interact"]. A *sound* function is one that maintains this invariant — any program composed solely of sound functions and containing no other `unsafe` code is free of UB [Jackson 2023].

### 1.2 Why a Formal Memory Model Matters

The soundness property is only as strong as the specification of what constitutes undefined behaviour. As of early 2026, the Rust Reference explicitly warns: "The memory model of Rust is incomplete and not fully decided" [Rust Reference, "Memory Model"]. Rust's abstract machine operates on *bytes* that can be initialised (carrying a `u8` value and optional provenance) or uninitialised, but the full set of UB-inducing operations remains an open enumeration [Rust Reference, "Behavior Considered Undefined"]. Without a complete formal model, unsafe code authors cannot be certain their invariants are sufficient, compiler developers cannot know which optimisations are sound, and verification tools cannot claim completeness.

The research programme surveyed here aims to close this gap. Stacked Borrows and Tree Borrows propose operational aliasing semantics. RFC 3559 establishes that pointers carry provenance. RustBelt and its descendants provide denotational soundness proofs. Miri operationalises the current best-guess model as a practical testing tool. Together, these efforts constitute one of the most ambitious attempts to give a systems language a rigorous formal foundation while it is still under active development.

### 1.3 Scope and Organisation

Section 2 establishes foundations: the concept of undefined behaviour in systems languages, the distinction between safety and soundness, and the role of memory models. Section 3 provides a taxonomy of the approaches to Rust's memory model — specification, operational testing, and denotational proof. Section 4 analyses each topic area in depth: the safety boundary, raw pointers, interior mutability, Stacked Borrows, Tree Borrows, pointer provenance, Miri, FFI, the unsafe abstraction pattern, and formal verification. Section 5 offers a comparative synthesis across languages. Section 6 catalogues open problems. Section 7 concludes.

---

## 2. Foundations

### 2.1 Undefined Behaviour in Systems Languages

Undefined behaviour is a specification-level concept: the language standard declares that certain operations have no defined semantics, granting the compiler freedom to assume they never occur. In C11 and C++11 onward, UB encompasses data races, signed integer overflow, null pointer dereference, strict aliasing violations, and over two hundred other conditions [ISO/IEC 9899:2011; ISO/IEC 14882:2011]. The optimiser exploits UB assumptions aggressively — a well-known consequence captured in the slogan "DRF-SC or Catch Fire": if a program is data-race free it executes in a sequentially consistent manner; if not, its behaviour is entirely undefined [Boehm and Adve 2008].

Java took a different path. The Java Memory Model (JMM), formalised by Manson, Pugh, and Adve (2005), specifies semantics even for programs with data races, ensuring that the type system cannot be violated at runtime (with the narrow exception of JNI). This comes at the cost of constraining compiler optimisations on multi-word accesses and requiring careful specification of happens-before relationships [Russ Cox, "Programming Language Memory Models"].

Go occupies an intermediate position. Its memory model promises that data-race-free programs behave sequentially consistently, but programs with races on certain types — interfaces, slices, maps — can exhibit undefined behaviour including arbitrary memory corruption. As Jung (2025) demonstrates, a carefully crafted data race on a Go interface can mix vtable pointers and cause a segmentation fault at a controlled address, which can be escalated to arbitrary code execution. Go is thus, strictly speaking, not a memory-safe language under the definition that memory safety requires the absence of all UB [Jung 2025, "There is no memory safety without thread safety"].

### 2.2 Safety vs. Soundness

In Rust's terminology, *safety* and *soundness* are related but distinct. Safe code is code that does not use the `unsafe` keyword. Sound code is code that cannot cause UB regardless of how it is called from safe contexts. All safe Rust is sound (this is the language's guarantee), but not all sound code is safe — sound `unsafe` code exists and is the backbone of the standard library [Jackson 2023].

The relationship between safe and unsafe code is one of asymmetric trust. Safe Rust must trust that any `unsafe` code it calls is sound. Conversely, unsafe Rust cannot blindly trust safe Rust: a `BTreeMap` whose internal unsafe code relies on the `Ord` trait must be robust against a buggy `Ord` implementation, since safe traits can be implemented by anyone. The map may behave erratically given a bad ordering, but it must never trigger UB [Rustonomicon, "How Safe and Unsafe Interact"]. When the required trust is too great — for instance, guaranteeing that a type is safe to send across threads — Rust introduces *unsafe traits* such as `Send` and `Sync`, shifting the proof obligation to the implementor [Rustonomicon, "Unsafe Traits"].

### 2.3 The Role of Memory Models

A memory model specifies, for a given language, which sequences of memory operations are well-defined and what values they may return. It must answer at least three questions: (1) what constitutes a valid pointer, (2) what aliasing relationships are permitted, and (3) what ordering constraints apply to concurrent accesses. For Rust, question (1) is addressed by the pointer provenance framework, question (2) by the Stacked/Tree Borrows models, and question (3) by the atomics memory model inherited from C++20. The ongoing research programme aims to unify these into a single coherent specification.

---

## 3. Taxonomy of Approaches

The efforts to formalise Rust's memory model can be organised into three strata:

**Specification models** propose precise operational or axiomatic rules for what unsafe code may and may not do. Stacked Borrows (2020) and Tree Borrows (2025) define aliasing semantics. RFC 3559 (stabilised as the provenance APIs in Rust 1.84) establishes that pointers carry provenance metadata. The Unsafe Code Guidelines (UCG) working group maintains a repository of open questions and emerging consensus.

**Operational testing tools** execute Rust programs under an instrumented abstract machine that detects UB violations at runtime. Miri, the MIR interpreter, is the primary tool in this category. It tracks pointer provenance, validates type invariants, detects data races, and explores weak-memory behaviours. Its evaluation on over 100,000 crates demonstrates practical reach [Jung et al. 2026].

**Denotational proof frameworks** provide machine-checked mathematical proofs that Rust's type system — and specific unsafe library implementations — are sound. RustBelt (2018) models Rust types as predicates in the Iris separation logic and proves soundness of a simplified Rust variant called lambda-Rust. Extensions include RustBelt Relaxed (relaxed memory), RustHornBelt (functional correctness), and RefinedRust (semi-automated verification of real Rust code). Alongside these, Prusti, Creusot, and Verus offer increasingly practical tools for verifying user-written Rust programs.

---

## 4. Analysis

### 4.1 The Safety Boundary

The `unsafe` keyword serves two grammatical roles in Rust. On functions and trait declarations, it *declares* the existence of contracts the compiler cannot check. On blocks and trait implementations, it *asserts* that the programmer has verified those contracts are upheld [Rustonomicon, "How Safe and Unsafe Interact"].

The list of behaviours considered undefined in Rust, as enumerated in the Rust Reference, includes: data races; accessing dangling or misaligned pointers; violating pointer aliasing rules (the precise content of which is what Stacked/Tree Borrows aim to specify); mutating immutable bytes; invoking compiler intrinsics incorrectly; calling functions with the wrong ABI or calling convention; producing invalid values for a type (e.g. a `bool` that is neither 0 nor 1, a `char` outside the valid range, an uninitialised integer); incorrect use of inline assembly; and violating runtime assumptions around stack unwinding [Rust Reference, "Behavior Considered Undefined"]. The Reference explicitly notes that this list is not exhaustive and may grow or shrink as the formal model matures.

The safety boundary is not merely a syntactic marker but an engineering discipline. The Rust hypothesis — that programmers use `unsafe` sparingly, make it easy to review, and hide it behind safe abstractions — has been empirically validated: approximately 75% of crates on crates.io contain no `unsafe` blocks, and among those that do, the primary motivation is FFI interoperability, followed by complex data structures requiring raw pointer manipulation [Astrauskas et al. 2020]. Nevertheless, more than half of all crates cannot be entirely statically checked because `unsafe` appears somewhere in their transitive dependency chain.

### 4.2 Raw Pointers

Raw pointers `*const T` and `*mut T` are Rust's escape hatch from the borrow checker. Unlike references, raw pointers:

- Are not guaranteed to point to valid memory.
- Are not guaranteed to be non-null.
- Do not implement automatic cleanup via `Drop`.
- Are freely copyable regardless of aliasing.
- May be created from references via implicit coercion (`&T` to `*const T`, `&mut T` to `*mut T`) or explicit `as` casts.

Dereferencing a raw pointer is one of the five unsafe superpowers. The programmer must ensure the pointer is non-null, properly aligned, points to a valid initialised value of type `T`, and — crucially — that its *provenance* permits the access.

Pointer arithmetic in Rust is performed via the `offset`, `add`, `sub`, and `wrapping_offset` methods. The `offset` family requires that both the starting pointer and the result lie within the same allocation (or one byte past its end), and the offset in bytes must not overflow `isize`. Violating these constraints is UB. `wrapping_offset` is the exception: it performs the arithmetic modularly without UB, but the resulting pointer may not be dereferenceable [std::ptr documentation].

A pointer is *dangling* if it is not valid for any non-zero-sized access. This encompasses null pointers, pointers to freed memory, out-of-bounds pointers, and pointers created with `NonNull::dangling()`. The Rust specification distinguishes dangling from merely invalid: a pointer may be non-dangling but still invalid for a particular access if its provenance is insufficient.

### 4.3 Interior Mutability

Rust's ownership model enforces the aliasing-XOR-mutability invariant: a value may have either multiple shared references (`&T`) or a single mutable reference (`&mut T`), but not both simultaneously. `UnsafeCell<T>` is the language primitive that breaks this invariant, permitting mutation through a shared reference. The compiler treats `UnsafeCell` specially: it does not assume that data behind `&UnsafeCell<T>` is immutable, disabling optimisations that would otherwise exploit that assumption [UnsafeCell documentation].

`UnsafeCell<T>` has the same memory layout as `T` but does not implement the `Freeze` trait, signalling to the compiler that the data may be mutated through shared references. It provides a single method, `get(&self) -> *mut T`, which yields a raw mutable pointer to the interior value. All responsibility for avoiding data races, aliasing violations, and lifetime errors falls on the programmer.

The interior mutability hierarchy builds safe abstractions of increasing capability atop `UnsafeCell`:

| Type | Thread Safety | Mechanism | Overhead |
|------|--------------|-----------|----------|
| `Cell<T>` | `!Sync` | Value replacement (Copy) | Zero runtime cost |
| `RefCell<T>` | `!Sync` | Runtime borrow counting | Counter increment/decrement |
| `Mutex<T>` | `Sync` | OS or spinning lock | Kernel call or spin |
| `RwLock<T>` | `Sync` | Reader-writer lock | Kernel call or spin |
| `Atomic*` | `Sync` | Hardware atomic instructions | Platform-dependent |

`Cell<T>` operates by replacing the entire value rather than lending a reference to it, which avoids aliasing issues entirely but requires `T: Copy` (or explicit `replace`/`swap`). `RefCell<T>` tracks borrows at runtime, panicking on violation — the dynamic analogue of the compile-time borrow checker. `Mutex<T>` and `RwLock<T>` add synchronisation for multi-threaded contexts. Atomics bypass the lock hierarchy entirely, providing lock-free access at the hardware level with memory ordering constraints inherited from the C++20 model [Nomicon, "Atomics"].

### 4.4 Stacked Borrows

Stacked Borrows, developed by Ralf Jung, Hoang-Hai Dang, Jeehoon Kang, and Derek Dreyer and published at POPL 2020, is an operational semantics for Rust's aliasing discipline. It formalises the intuition that references form a stack of permissions: creating a new reference pushes an item onto the stack, and using the reference requires that its item is at or above the point of access [Jung et al. 2020].

**Core mechanism.** Every pointer carries a *tag* (a unique identifier assigned at creation), and every byte of memory maintains a *borrow stack* — an ordered sequence of `(tag, permission)` items. Permissions are `Unique` (for `&mut T`), `SharedReadOnly` (for `&T` outside `UnsafeCell`), and `SharedReadWrite` (for raw pointers and `&T` containing `UnsafeCell`). When a pointer accesses a byte, the model searches the stack top-to-bottom for an item matching the pointer's tag with a compatible permission. If found, all items above the matching item that are incompatible with the access are popped. If not found, the access is UB.

**Retagging.** A new tag is assigned whenever a reference is created (`&expr`, `&mut expr`) or a reference is cast to a raw pointer. Retagging function arguments is special: the new stack items are given a *protector* tied to the function's call ID, ensuring they cannot be popped for the duration of the call. Protectors are the operational equivalent of the borrow checker's guarantee that a reference passed to a function outlives that function.

**Limitations.** Stacked Borrows has two widely recognised problems. First, it enforces *overeager uniqueness* for mutable references: the moment a `&mut T` is created, the model immediately claims exclusive access, invalidating code patterns where the mutable reference is not yet used. Second, it *confines* raw pointers derived from a reference to the size of the type they were created from, which conflicts with common patterns such as deriving a pointer to the first element of an array and then iterating over the entire allocation. Additionally, Stacked Borrows prohibits reordering adjacent reads (a basic compiler optimisation) due to the way it handles the interaction between `Unique` and `SharedReadOnly` items. The model's treatment of two-phase borrows — a feature of the Rust borrow checker developed concurrently with Stacked Borrows — introduces further complexity and edge cases [Jung 2023].

### 4.5 Tree Borrows

Tree Borrows, developed by Neven Villani, Johannes Hostert, Derek Dreyer, and Ralf Jung, was published at PLDI 2025 and received a Distinguished Paper award. It replaces the stack at the heart of Stacked Borrows with a tree, reflecting the observation that pointer derivation naturally forms a hierarchy rather than a linear sequence [Villani et al. 2025].

**Permission states.** Each node in the tree carries one of four permission states:

- **Reserved**: The initial state of a mutable reference or exclusive pointer. Tolerates foreign reads (reads through unrelated pointers) but transitions to Active on the first write through this pointer or a child.
- **Active**: The pointer has been used for writing. Foreign reads cause a transition to Frozen; foreign writes cause a transition to Disabled (UB if protected).
- **Frozen**: The pointer is read-only. Any write (even through this pointer) causes a transition to Disabled.
- **Disabled**: The pointer is invalid. Any access through it is UB.

**Key differences from Stacked Borrows.** Tree Borrows treats all mutable references as *two-phase borrows*, deferring the assertion of uniqueness until the first write. This eliminates the overeager uniqueness problem. Raw pointers inherit their parent's tag and permissions through *lazy initialisation*, allowing `container_of`-style pointer arithmetic and access beyond the original type's size. The tree structure naturally accommodates multiple children derived from the same parent — a pattern that the linear stack could not represent cleanly.

**Optimisation trade-offs.** Tree Borrows enables *read-read reorderings* that Stacked Borrows prohibits, which is significant for compiler optimisation. It loses *speculative writes* (the ability to insert writes in unexecuted code paths), but this is considered an acceptable trade-off. The formal proofs, mechanised in the Rocq proof assistant (formerly Coq), demonstrate that Tree Borrows preserves most of the optimisation potential of Stacked Borrows while enabling new ones.

**Empirical evaluation.** When evaluated against the test suites of the 30,000 most-downloaded crates on crates.io, Tree Borrows rejects 54% fewer test cases than Stacked Borrows, indicating substantially better compatibility with real-world unsafe Rust code [Villani et al. 2025]. Tree Borrows is implemented as an alternative mode in Miri (activated via `-Zmiri-tree-borrows`).

### 4.6 Pointer Provenance

Rust's pointer provenance model, established by RFC 3559 ("Rust has Provenance") and stabilised in Rust 1.84, holds that a pointer semantically consists of two components: an *address* (the memory location, representable as `usize`) and *provenance* (the permission to access specific memory). Provenance has three dimensions: spatial (which addresses may be accessed), temporal (during what period of the allocation's lifetime), and mutability (read-only vs. read-write) [std::ptr documentation].

**Prescriptive vs. descriptive provenance.** RFC 3559 distinguishes *prescriptive* provenance — part of the language specification that determines whether code has UB — from *descriptive* provenance — a data-flow analysis concept that never creates UB. Rust implements prescriptive provenance: accessing memory through a pointer that lacks provenance over that memory is UB, even if the address happens to be correct.

**Strict Provenance APIs.** The strict provenance API, stabilised in Rust 1.84, provides methods that make provenance manipulation explicit:

- `ptr.addr() -> usize`: Extracts the address, discarding provenance.
- `ptr.with_addr(addr: usize) -> *T`: Creates a new pointer with the given address and the provenance of `ptr`.
- `ptr.map_addr(f: impl Fn(usize) -> usize) -> *T`: Applies a function to the address while preserving provenance.
- `ptr::without_provenance(addr: usize) -> *const T`: Creates a pointer with no provenance (cannot be dereferenced for non-zero-sized accesses).

These APIs are designed to replace integer-to-pointer casts (`addr as *const T`), which are problematic because integers do not carry provenance. The strict provenance discipline is compatible with Miri's provenance tracking and with capability-based hardware architectures such as CHERI, where provenance is enforced in hardware [std::ptr documentation; Revill 2023].

**Exposed Provenance APIs.** For situations where integer-to-pointer roundtrips are unavoidable — bare-metal code, memory-mapped I/O, legacy platform APIs — the exposed provenance API provides `ptr.expose_provenance() -> usize` (which adds the pointer's provenance to a global "exposed" set) and `ptr::with_exposed_provenance(addr: usize) -> *const T` (which attempts to reconstruct a pointer by selecting from the exposed set). The semantics of exposed provenance are deliberately less well-defined than strict provenance and are incompatible with Miri and CHERI.

**The provenance challenge.** Provenance is the deep reason why `transmute`-ing a pointer to a `[u8; N]` array and back does not restore the original pointer: the byte representation loses provenance information. The RFC recommends using `MaybeUninit<u8>` for pointer-containing byte buffers, as it preserves provenance across copies.

### 4.7 Miri

Miri (MIR Interpreter) is a practical UB detection tool that executes Rust programs by interpreting the compiler's Mid-level Intermediate Representation (MIR) statement by statement, basic block by basic block. It was the subject of a paper accepted to POPL 2026, one of the most prestigious venues in programming language research [Jung et al. 2026].

**Capabilities.** Miri tracks pointer provenance, validates Rust type invariants (e.g. that a `bool` is 0 or 1), detects data races, explores weak-memory behaviours (using a concurrency model upgraded to C++20 semantics), and implements enough OS API shims — file system operations, concurrency primitives, network sockets — to run unmodified real-world Rust code. It supports both Stacked Borrows and Tree Borrows as selectable aliasing models. Recent additions include Intel SIMD intrinsics from SSE2 through AVX-512, experimental FFI support for executing native code, and non-deterministic scheduler exploration via `-Zmiri-many-seeds` [Jung 2025, "What's new in Miri"].

**Evaluation.** In an evaluation on more than 100,000 Rust libraries, Miri successfully executed more than 70% of the tests across their combined test suites. It has found dozens of real-world bugs — including aliasing violations, use-after-free errors, and data races — and has been integrated into the continuous integration pipelines of the Rust standard library and many prominent community crates [Jung et al. 2026].

**Limitations.** Miri explores only one execution path per run for non-deterministic programs, though `-Zmiri-many-seeds` enables randomised exploration across multiple runs. Because Rust has not stabilised its UB specification, Miri targets "de-facto UB" based on current compiler behaviour; programs that pass Miri today may exhibit UB under future compiler versions or a tightened specification. Miri's runtime overhead (typically 100-1000x slower than native execution) limits its applicability to test suites rather than production workloads.

**GenMC integration.** Early-stage work explores combining Miri with GenMC, a weak-memory model checker, to exhaustively enumerate all possible orderings of concurrent program executions and verify each for UB. This would address the fundamental limitation that Miri's single-path exploration cannot guarantee the absence of concurrency bugs.

### 4.8 Foreign Function Interface (FFI)

Rust's FFI enables calling C (and, with appropriate tooling, C++) functions from Rust and vice versa. FFI crossings are inherently unsafe: the Rust compiler cannot verify the correctness of foreign type declarations, calling conventions, or memory management across the language boundary.

**`repr(C)` and layout compatibility.** Rust's default struct layout is unspecified — the compiler may reorder fields for alignment or size optimisation. The `#[repr(C)]` attribute instructs the compiler to lay out the struct according to C's rules, ensuring binary compatibility. Without `repr(C)`, passing a struct across FFI is UB because the foreign code will read fields at the wrong offsets [Rustonomicon, "FFI"].

**Binding generators.** `bindgen` parses C (and some C++) header files and generates Rust `extern "C"` declarations, type definitions, and constants. `cbindgen` performs the inverse, generating C/C++ header files from Rust source code. These tools produce *low-level bindings* — raw `extern "C"` functions and `repr(C)` types — that are collected into a `-sys` crate by convention. A separate crate then wraps these bindings in safe Rust APIs.

**CXX.** For C++ interoperability, the `cxx` crate provides a higher-level bridge that statically verifies type compatibility at compile time. Unlike `bindgen`, which produces unsafe C-style bindings, CXX prevents common errors such as passing types by value that contain internal pointers (which would be invalidated by Rust's move semantics). CXX generates static assertions and signature checks with zero-copy overhead [CXX documentation].

**The safety wrapper pattern.** The canonical FFI architecture in Rust follows a two-layer structure:

1. A `-sys` crate containing raw, unsafe bindings generated by `bindgen`.
2. A safe wrapper crate that validates inputs, manages lifetimes (often using Rust's ownership types to model C resource handles), converts error codes to `Result<T, E>`, and ensures that callers never need to write `unsafe`.

This pattern mirrors the broader unsafe abstraction discipline: a thin unsafe core surrounded by a safe boundary that is the only code requiring manual audit.

### 4.9 The Unsafe Abstraction Pattern

The architectural insight underlying Rust's safety model is that a small amount of carefully audited unsafe code can support an arbitrarily large surface area of safe code. The standard library exemplifies this pattern:

**`Vec<T>`** maintains a raw pointer to a heap allocation, a length, and a capacity. Its `push`, `pop`, `index`, and iterator methods are safe because they enforce bounds checking, capacity management, and proper drop semantics internally. The unsafe code — raw pointer arithmetic in `RawVec`, unchecked element access during reallocation — is confined to a few hundred lines that maintain a well-documented invariant: the pointer is non-null, the allocation has at least `capacity` elements of space, and the first `length` elements are initialised.

**`String`** is a wrapper around `Vec<u8>` that additionally maintains the invariant that the byte contents are valid UTF-8. Methods like `push_str` and `from_utf8` validate this invariant; `unsafe fn from_utf8_unchecked` permits callers who have independently verified UTF-8 validity to skip the check.

**`HashMap<K, V>`** uses raw pointer manipulation for its Robin Hood or Swiss Table implementation (the latter adopted from Google's Abseil library), managing hash probing, bucket metadata, and element storage through unsafe code that is invisible to users of the `insert`, `get`, and `remove` APIs.

The Rustonomicon articulates the core principle: "It is possible to write a completely safe abstraction that relies on complex invariants, which is critical to the relationship between Safe Rust and Unsafe Rust" [Rustonomicon, "Working with Unsafe"]. The unsafe boundary is the minimal surface area of unsafe code that, if correct, guarantees the soundness of the entire abstraction. Reviewing and verifying this boundary is the central engineering challenge of unsafe Rust.

### 4.10 Formal Verification

#### 4.10.1 RustBelt

RustBelt, published at POPL 2018 by Ralf Jung, Jacques-Henri Jourdan, Robbert Krebbers, and Derek Dreyer, provides the first machine-checked proof of soundness for a realistic subset of Rust. It models a simplified language called lambda-Rust (lambda-Rust) and interprets its types as predicates in Iris, a higher-order concurrent separation logic framework implemented in the Rocq proof assistant (formerly Coq) [Jung et al. 2018].

The key technical innovation is a *lifetime logic* whose central feature is *borrow propositions* — logical predicates that mirror Rust's borrowing mechanism for tracking aliasing. This makes it possible to give direct semantic interpretations to Rust's most complex types. RustBelt proved the soundness of several standard-library types that use unsafe code internally: `Cell`, `RefCell`, `Rc`, `Arc`, `Mutex`, `RwLock`, `mem::swap`, `thread::spawn`, and the third-party `take_mut::take` [Jung et al. 2018].

**RustBelt Relaxed** (Dang et al., POPL 2020) extends the proof to account for relaxed-memory atomics — the `Relaxed`, `Acquire`, `Release`, `AcqRel`, and `SeqCst` orderings that Rust inherits from C++20. This is the first formal validation of Rust's soundness under a weak memory model.

**RustHornBelt** (Matsushita et al., PLDI 2022) combines the RustBelt semantic model with automated Horn-clause-based verification, using a novel *parametric prophecy* framework in Iris to handle mutable borrows. This enables semi-automated functional correctness proofs.

#### 4.10.2 RefinedRust

RefinedRust (Sammler et al., PLDI 2024) is a refinement type system for Rust that achieves foundational semi-automated verification of both safe and unsafe code. It translates annotated Rust code into a model embedded in Coq and checks adherence to the RefinedRust type system using separation-logic automation. All proofs are machine-checked by the Coq proof assistant, so neither the automation nor the type system needs to be trusted. RefinedRust was evaluated by verifying a variant of Rust's `Vec` implementation involving intricate unsafe pointer manipulation [Sammler et al. 2024]. It is the first approach that simultaneously handles real Rust syntax, provides proof automation for both safe and unsafe code, and produces foundational machine-checkable proofs.

#### 4.10.3 Oxide

Oxide (Weiss et al. 2019) is a formalisation of Rust's type system at the source level, taking a novel view of lifetimes as sets of locations called *regions*. Unlike RustBelt's denotational approach, Oxide provides an inductive definition of borrow checking in terms of conventional inference rules, serving as an "explainable essence of Rust." It includes a compiler (Reducer) from Rust to Oxide and a type checker (OxideTC) validated against a subset of Rust's official test suite.

#### 4.10.4 Prusti

Prusti is an automated verifier for Rust built on the Viper verification infrastructure, which uses Implicit Dynamic Frames (a variant of separation logic). Prusti extracts aliasing and ownership information from Rust's type system automatically, allowing programmers to write function contracts (preconditions, postconditions, loop invariants) using Rust expression syntax without exposure to separation logic. By default, Prusti verifies absence of integer overflows and panics; with annotations, it can verify functional correctness properties [Astrauskas et al. 2022].

#### 4.10.5 Creusot

Creusot is a deductive verification tool developed at Inria that translates annotated Rust programs into the Why3 verification framework. Its distinguishing feature is a *prophecy-based encoding* of mutable references: the final value of a mutable reference is modelled as a prophecy (denoted by the `^` operator, pronounced "final"), which the specification language Pearlite can reference in postconditions. This encoding, which has recently been extended to handle ghost code and type invariants in practical settings, enables natural specification of mutation through Rust's borrowing discipline [Denis et al. 2022; Music et al. 2025]. A Creusot tutorial was presented at POPL 2026.

#### 4.10.6 Verus

Verus is an SMT-based verifier developed at Carnegie Mellon University and VMware Research (now Broadcom). It embeds specifications and proofs directly in Rust syntax, using a novel *mode system* that distinguishes specifications (not checked for linearity), proofs (checked for linearity), and executable code (checked for linearity and borrowing). Verus is particularly notable for its use of *linear ghost types*: proofs manipulate linearly typed permissions that model safe memory manipulation, pointer access, and concurrent resource ownership. Ghost code is erased at compilation, incurring zero runtime overhead [Lattuada et al. 2023].

#### 4.10.7 The Verify Rust Std Initiative

The Verify Rust Std initiative, supported by the Rust Foundation and hosted at github.com/model-checking/verify-rust-std, is a community effort to verify the safety of the Rust standard library. The accepted verification tools include Kani (a bit-precise bounded model checker), Flux (a refinement type checker), VeriFast (unbounded verification via separation logic), and the GOTO Transcoder backed by ESBMC. Kani has been the most widely used tool due to the convenience of bounded model checking, though VeriFast is necessary for properties requiring unbounded reasoning such as linked-list invariants [Verify Rust Std 2025].

---

## 5. Comparative Synthesis

### 5.1 Cross-Language Comparison

| Dimension | C/C++ | Java | Go | Rust |
|-----------|-------|------|----|------|
| **UB scope** | Pervasive (200+ conditions in standard) | Minimal (only via JNI) | Data races on certain types | Restricted to `unsafe` blocks |
| **Memory model** | C++11/C++20 atomics; DRF-SC or Catch Fire | JMM with defined racy semantics | DRF-SC; races on interfaces/slices are UB | C++20 atomics; safe code is data-race-free by construction |
| **Aliasing model** | Strict aliasing (type-based) | None needed (GC + no raw pointers) | None (GC-managed) | Stacked Borrows / Tree Borrows (ownership-based) |
| **Provenance** | Informally assumed; PNVI-ae-udi model proposed | N/A | N/A | RFC 3559; strict/exposed provenance APIs |
| **UB detection tooling** | ASan, MSan, UBSan, Valgrind | N/A (UB mostly absent) | Race detector (`-race` flag) | Miri (abstract machine interpreter) |
| **Formal soundness proof** | CompCert (C subset); no proof for full language | Limited (JMM correctness proofs) | None | RustBelt, RefinedRust (Iris/Coq) |
| **Unsafe escape hatch** | Entire language is "unsafe" | JNI (separate language boundary) | `unsafe` package (3 types, 3 functions) | `unsafe` keyword (5 superpowers) |

### 5.2 Aliasing Model Comparison

| Property | C/C++ Strict Aliasing | Stacked Borrows | Tree Borrows |
|----------|----------------------|-----------------|--------------|
| **Basis** | Type-based (TBAA) | Stack of tagged permissions | Tree of tagged permissions |
| **Granularity** | Per-type | Per-byte, per-pointer | Per-byte, per-pointer |
| **Uniqueness enforcement** | Via restrict keyword (C99) | Immediate on creation | Deferred until first write |
| **Read-read reordering** | Permitted | Prohibited | Permitted |
| **Speculative writes** | Permitted | Permitted | Prohibited |
| **Real-world rejection rate** | N/A | Higher (baseline) | 54% fewer rejections |
| **Formal proof** | None | Soundness of key optimisations | Rocq-mechanised proofs |

### 5.3 Verification Tool Comparison

| Tool | Approach | Handles Unsafe | Automation | Proof Foundation | Target |
|------|----------|---------------|------------|------------------|--------|
| RustBelt | Semantic model in Iris | Yes | Manual Coq proofs | Foundational (Coq) | Type system soundness |
| RefinedRust | Refinement types in Iris | Yes | Semi-automated | Foundational (Coq) | Functional correctness |
| Prusti | Viper/IDF encoding | Safe only | Automated | Non-foundational | Contracts, panics |
| Creusot | Why3/prophecy encoding | Safe primarily | Semi-automated | Non-foundational | Functional correctness |
| Verus | SMT with ghost types | Yes (via ghost) | Automated (SMT) | Non-foundational | Functional correctness |
| Kani | Bounded model checking | Yes | Fully automated | Bounded | Safety properties |
| Miri | Runtime interpretation | Yes | Fully automated | Operational (no proof) | UB detection |

---

## 6. Open Problems & Gaps

### 6.1 Complete Memory Model Specification

The Rust Reference acknowledges that the memory model is "incomplete and not fully decided." Key unresolved questions include: the precise UB rules for `union` field access, the semantics of `MaybeUninit` in generic contexts, and whether the list of behaviours considered undefined is final or will continue to evolve. The Unsafe Code Guidelines working group's effort to produce a comprehensive guide has been "largely abandoned" in favour of incremental T-opsem (operational semantics team) decisions, leaving a gap between the informal consensus and a formal specification document [UCG repository 2025].

### 6.2 Tree Borrows Finalisation

While Tree Borrows received a Distinguished Paper award at PLDI 2025 and is implemented in Miri, it has not been adopted as the official aliasing model for Rust. The Rust project has not committed to either Stacked Borrows or Tree Borrows as the definitive model. Open questions include the interaction between Tree Borrows and `UnsafeCell` (Tree Borrows simplifies `UnsafeCell` handling but sacrifices field-level precision), the treatment of function call boundaries under protectors, and the performance impact of tree-based tracking in Miri relative to the stack-based approach.

### 6.3 Strict Provenance Completeness

Although RFC 3559 established that Rust has provenance and the strict provenance APIs were stabilised in Rust 1.84, the RFC deliberately remains "minimal and non-prescriptive" about the details of the provenance model. A complete provenance specification — covering allocation identity, sub-allocation provenance (e.g. individual fields of a struct), and the interaction between provenance and the aliasing model — remains future work. The exposed provenance semantics are particularly underspecified: the mechanism by which the compiler selects from the global exposed set is not formally defined.

### 6.4 The Gap Between Models and the Compiler

Stacked Borrows, Tree Borrows, and RustBelt all model idealised versions of Rust (e.g. lambda-Rust) rather than the actual language accepted by `rustc`. The gap between the model and the compiler means that optimisations validated against the model may not be sound for the full language, and conversely, existing compiler optimisations may violate the model's assumptions. Bridging this gap requires either extending the models to cover more of Rust's surface syntax or restricting the compiler to match the models — both are active areas of work.

### 6.5 Verification Scalability

Current formal verification tools face scalability challenges. RustBelt proofs are manual and labour-intensive. RefinedRust can verify `Vec`-like structures but has not yet been applied to the full standard library. Kani and VeriFast cover a growing but still incomplete set of standard-library functions. Miri can execute 70% of test suites across 100,000 crates but cannot provide guarantees about the 30% it cannot run (typically due to unsupported syscalls, inline assembly, or external dependencies). Scaling verification to the full Rust ecosystem — including the long tail of unsafe FFI bindings — remains an open challenge.

### 6.6 Relaxed Memory and Concurrency

Rust inherits the C++20 atomics model, including its known problems: the thin-air problem (the impossibility of a sound formal model that permits all intended compiler optimisations while prohibiting out-of-thin-air values) remains unsolved across all languages that adopt this model [Cox, "Programming Language Memory Models"]. RustBelt Relaxed addresses a subset of relaxed-memory semantics, but a complete proof of Rust's soundness under the full atomics model — including `SeqCst` fences, `compiler_fence`, and platform-specific memory ordering — has not been achieved. The experimental GenMC integration with Miri represents one path toward more comprehensive concurrency verification, but it is in early stages.

### 6.7 Unsafe Fields and New Language Features

The Rust project goals for H2 2025 include *unsafe fields* — struct fields that require `unsafe` to access, enabling finer-grained safety boundaries within types [Rust Project Goals 2025]. This feature would change the granularity of the safety boundary and require corresponding updates to the formal models. Other evolving features, such as async functions in traits, generators, and the `Pin` API, introduce new interactions with the memory model that have not yet been fully formalised.

---

## 7. Conclusion

Rust's approach to memory safety — quarantining dangerous operations behind `unsafe` rather than eliminating them — creates a unique research challenge: formalising the contract between safe and unsafe code precisely enough to enable both compiler optimisations and verified correctness. The Stacked Borrows and Tree Borrows models represent significant progress on aliasing semantics, with Tree Borrows achieving 54% fewer false rejections while preserving (and in some cases extending) optimisation potential. The stabilisation of pointer provenance APIs in Rust 1.84 addresses a foundational gap in the specification. Miri demonstrates that operational UB detection can scale to the entire crate ecosystem, and the RustBelt family of proofs establishes that Rust's type system is sound on firm mathematical ground.

Yet the programme is unfinished. The memory model remains officially incomplete. Neither Stacked Borrows nor Tree Borrows has been adopted as the definitive aliasing model. The gap between formal models and the actual compiler persists. Verification tools, while maturing rapidly — evidenced by the POPL 2026 Miri paper, the Verify Rust Std initiative, and the growing capabilities of Prusti, Creusot, and Verus — have not yet achieved coverage of the full language or the full ecosystem.

The trajectory is nonetheless encouraging. The convergence of specification (Tree Borrows), testing (Miri), and proof (RustBelt/RefinedRust) provides mutual reinforcement: Miri operationalises the models, the models guide Miri's implementation, and the proofs validate that the models justify the intended optimisations. This three-legged approach — specification, testing, proof — may serve as a template for future systems languages that aspire to combine low-level control with rigorous safety guarantees.

---

## References

1. Astrauskas, V., Matheja, C., Muller, P., Poli, F., and Summers, A.J. (2020). "How Do Programmers Use Unsafe Rust?" *Proc. ACM Program. Lang.* (OOPSLA). https://dl.acm.org/doi/10.1145/3428204

2. Astrauskas, V., Bily, A., Fiala, J., Grannan, Z., Matheja, C., Muller, P., Poli, F., and Summers, A.J. (2022). "The Prusti Project: Formal Verification for Rust." *NASA Formal Methods (NFM)*. https://link.springer.com/chapter/10.1007/978-3-031-06773-0_5

3. Boehm, H.-J. and Adve, S.V. (2008). "Foundations of the C++ Concurrency Memory Model." *PLDI 2008*. https://dl.acm.org/doi/10.1145/1375581.1375591

4. Cox, R. "Programming Language Memory Models." *research!rsc*. https://research.swtch.com/plmm

5. Dang, H.-H., Jourdan, J.-H., Kang, J., and Dreyer, D. (2020). "RustBelt Meets Relaxed Memory." *Proc. ACM Program. Lang.* (POPL). https://dl.acm.org/doi/10.1145/3371102

6. Denis, X., Jourdan, J.-H., and Marche, C. (2022). "Creusot: A Foundry for the Deductive Verification of Rust Programs." *Formal Methods and Software Engineering (ICFEM)*. https://inria.hal.science/hal-03737878

7. dtolnay. "CXX — Safe Interop Between Rust and C++." https://cxx.rs/

8. Jackson, J. (2023). "Safety and Soundness in Rust." https://jacko.io/safety_and_soundness.html

9. Jung, R. (2023). "From Stacks to Trees: A New Aliasing Model for Rust." *Ralf's Ramblings*. https://www.ralfj.de/blog/2023/06/02/tree-borrows.html

10. Jung, R. (2025). "There Is No Memory Safety Without Thread Safety." *Ralf's Ramblings*. https://www.ralfj.de/blog/2025/07/24/memory-safety.html

11. Jung, R. (2025). "What's 'New' in Miri (and Also, There's a Miri Paper!)." *Ralf's Ramblings*. https://www.ralfj.de/blog/2025/12/22/miri.html

12. Jung, R., Dang, H.-H., Kang, J., and Dreyer, D. (2020). "Stacked Borrows: An Aliasing Model for Rust." *Proc. ACM Program. Lang.* (POPL). https://dl.acm.org/doi/10.1145/3371109

13. Jung, R., Jourdan, J.-H., Krebbers, R., and Dreyer, D. (2018). "RustBelt: Securing the Foundations of the Rust Programming Language." *Proc. ACM Program. Lang.* (POPL). https://dl.acm.org/doi/10.1145/3158154

14. Jung, R., Kimock, B., Poveda, C., Sanchez Munoz, E., Scherer, O., and Wang, Q. (2026). "Miri: Practical Undefined Behavior Detection for Rust." *Proc. ACM Program. Lang.* (POPL). https://dl.acm.org/doi/10.1145/3776690

15. Jung, R. (2022). "Pointers Are Complicated III, or: Pointer-Integer Casts Exposed." *Ralf's Ramblings*. https://www.ralfj.de/blog/2022/04/11/provenance-exposed.html

16. Lattuada, A., Hance, T., Cho, C., Brun, M., Suber, I., Yi, Y., Crichton, C., Swamy, N., Chen, L., and Parno, B. (2023). "Verus: Verifying Rust Programs using Linear Ghost Types." *Proc. ACM Program. Lang.* (OOPSLA). https://dl.acm.org/doi/10.1145/3586037

17. Matsushita, Y., Denis, X., Jourdan, J.-H., and Dreyer, D. (2022). "RustHornBelt: A Semantic Foundation for Functional Verification of Rust Programs." *PLDI 2022*. https://people.mpi-sws.org/~dreyer/papers/rusthornbelt/paper.pdf

18. Music, S. et al. (2025). "Using a Prophecy-Based Encoding of Rust Borrows in a Realistic Verification Tool." *Inria*. https://inria.hal.science/hal-05244847

19. Revill, L. (2023). "A Rusty CHERI: The Path to Hardware Capabilities in Rust." *FOSDEM 2023*. https://archive.fosdem.org/2023/schedule/event/rust_a_rusty_cheri_the_path_to_hardware_capabilities_in_rust/

20. Rust Lang. "Behavior Considered Undefined." *The Rust Reference*. https://doc.rust-lang.org/reference/behavior-considered-undefined.html

21. Rust Lang. "How Safe and Unsafe Interact." *The Rustonomicon*. https://doc.rust-lang.org/nomicon/safe-unsafe-meaning.html

22. Rust Lang. "Memory Model." *The Rust Reference*. https://doc.rust-lang.org/reference/memory-model.html

23. Rust Lang. "std::ptr — Manually Manage Memory Through Raw Pointers." *Standard Library Documentation*. https://doc.rust-lang.org/std/ptr/index.html

24. Rust Lang. "UnsafeCell in std::cell." *Standard Library Documentation*. https://doc.rust-lang.org/std/cell/struct.UnsafeCell.html

25. Rust Lang. "Unsafe Rust." *The Rust Programming Language*, ch. 20.1. https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html

26. Rust Lang. "RFC 3559: Rust Has Provenance." *The Rust RFC Book*. https://rust-lang.github.io/rfcs/3559-rust-has-provenance.html

27. Rust Lang. "Unsafe Code Guidelines." *GitHub*. https://github.com/rust-lang/unsafe-code-guidelines

28. Sammler, M., Lepigre, R., Krebbers, R., Memarian, K., Dreyer, D., and Garg, D. (2024). "RefinedRust: A Type System for High-Assurance Verification of Rust Programs." *Proc. ACM Program. Lang.* (PLDI). https://dl.acm.org/doi/10.1145/3656422

29. Villani, N., Hostert, J., Dreyer, D., and Jung, R. (2025). "Tree Borrows." *Proc. ACM Program. Lang.* (PLDI). https://dl.acm.org/doi/10.1145/3735592

30. Weiss, A., Patterson, D., Matsakis, N.D., and Ahmed, A. (2019). "Oxide: The Essence of Rust." *arXiv:1903.00982*. https://arxiv.org/abs/1903.00982

31. Verify Rust Std. "Verifying the Rust Standard Library." *GitHub*. https://github.com/model-checking/verify-rust-std

32. Iris Project. "Iris: A Higher-Order Concurrent Separation Logic Framework." https://iris-project.org/

33. Tratt, L. (2022). "Making Rust a Better Fit for CHERI and Other Platforms." https://tratt.net/laurie/blog/2022/making_rust_a_better_fit_for_cheri_and_other_platforms.html

34. Rust Lang. "Stabilize Strict Provenance and Exposed Provenance APIs." *Pull Request #130350*. https://github.com/rust-lang/rust/pull/130350

35. Rust Lang. "Atomics." *The Rustonomicon*. https://doc.rust-lang.org/nomicon/atomics.html

36. Rust Lang. "FFI." *The Rustonomicon*. https://doc.rust-lang.org/nomicon/ffi.html

---

## Practitioner Resources

**Primary documentation:**
- The Rustonomicon ("The Dark Arts of Unsafe Rust"): https://doc.rust-lang.org/nomicon/
- The Rust Reference, "Behavior Considered Undefined": https://doc.rust-lang.org/reference/behavior-considered-undefined.html
- std::ptr module documentation (provenance model): https://doc.rust-lang.org/std/ptr/index.html

**Tooling:**
- Miri installation and usage: https://github.com/rust-lang/miri
- Running Miri in CI: `cargo +nightly miri test`
- Tree Borrows mode: `MIRIFLAGS="-Zmiri-tree-borrows" cargo +nightly miri test`
- Strict provenance linting: `#![deny(fuzzy_provenance_casts, lossy_provenance_casts)]`

**Verification tools:**
- Prusti user guide: https://viperproject.github.io/prusti-dev/user-guide/
- Creusot repository: https://github.com/creusot-rs/creusot
- Verus repository: https://github.com/verus-lang/verus
- Kani getting started: https://model-checking.github.io/kani/

**Key papers (recommended reading order):**
1. Jung et al. (2018), "RustBelt" — foundational soundness proof.
2. Jung et al. (2020), "Stacked Borrows" — first formal aliasing model.
3. Villani et al. (2025), "Tree Borrows" — current aliasing model.
4. Jung et al. (2026), "Miri" — practical UB detection at scale.
5. Sammler et al. (2024), "RefinedRust" — semi-automated verification of unsafe code.

**Community resources:**
- Unsafe Code Guidelines working group: https://github.com/rust-lang/unsafe-code-guidelines
- Rust Formal Methods Interest Group: https://rust-formal-methods.github.io/
- Verify Rust Std initiative: https://github.com/model-checking/verify-rust-std
- Google's "Learn Unsafe Rust" course: https://google.github.io/learn_unsafe_rust/
