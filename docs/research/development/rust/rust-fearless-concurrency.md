---
title: "Fearless Concurrency: Send, Sync, and Data Race Freedom in Rust"
date: 2026-03-21
summary: A survey of Rust's compile-time approach to concurrency safety through the Send and Sync marker traits, examining how the ownership system eliminates data races, the ecosystem of synchronization primitives and lock-free data structures, and comparison with concurrency models in Go, Java, and C++.
keywords: [rust, concurrency, send-sync, data-races, lock-free, atomics, rayon]
---

# Fearless Concurrency: Send, Sync, and Data Race Freedom in Rust

*2026-03-21*

## Abstract

Concurrent programming has historically been one of the most error-prone domains in systems software. Data races -- unsynchronized concurrent accesses to shared memory where at least one is a write -- constitute undefined behavior in C and C++ and have been a persistent source of critical security vulnerabilities and correctness bugs. Rust addresses this problem through a novel synthesis of ownership types, affine type theory, and marker traits that statically guarantee the absence of data races in safe code. The language's `Send` and `Sync` auto traits, combined with the borrow checker's enforcement of exclusive mutable access, create a compile-time discipline where concurrent programs are either provably data-race-free or rejected by the type checker.

This survey examines the theoretical foundations and practical mechanisms of Rust's concurrency model in depth. We analyze the `Send` and `Sync` marker traits, their automatic derivation, and the types that opt out of thread safety guarantees. We trace the connection from Rust's ownership discipline through its synchronization primitives (`Mutex<T>`, `RwLock<T>`, atomics), lock-free data structures (crossbeam, dashmap), data-parallel frameworks (Rayon), and message-passing channels (mpsc, crossbeam-channel, flume). We situate Rust's approach within the broader landscape of concurrency models including Go's goroutine-channel paradigm, Java's memory model with synchronized blocks, C++'s thread-and-atomics model, and Erlang/Elixir's actor system on the BEAM VM.

The survey identifies several open problems at the frontier of Rust's concurrency story: the Send bound problem for async trait methods, the absence of a formally specified memory model, incomplete tooling for deadlock detection, and the ongoing design of structured concurrency primitives. We draw on the RustBelt formal verification project, the PLDI 2020 empirical study of Rust safety bugs, and the RUDRA static analysis tool to assess both the strengths and residual weaknesses of Rust's compile-time approach to concurrency safety.

## 1. Introduction

The phrase "fearless concurrency" was introduced by Aaron Turon in a 2015 Rust blog post to describe a then-novel insight: the same ownership discipline that gives Rust memory safety without garbage collection also prevents data races at compile time [1]. This was not a coincidence of implementation but a consequence of a deep structural connection: data races require aliased mutable access to shared memory, and Rust's borrow checker forbids precisely this pattern. The result is that safe Rust code cannot exhibit data races -- a guarantee enforced entirely at compile time with zero runtime cost.

This guarantee is remarkable in the landscape of systems programming languages. C and C++ define data races as undefined behavior, meaning the compiler is entitled to assume they never occur and may generate arbitrary code when they do [2]. Java's memory model defines data races as producing "surprising" but not undefined results, at the cost of a complex formal specification that took nearly a decade to finalize [3]. Go relies on a runtime race detector powered by ThreadSanitizer that incurs 2-20x performance overhead and can only detect races that are triggered during execution [4]. Erlang and Elixir sidestep the problem entirely through process isolation and message passing, at the cost of mandatory data copying between processes [5].

Rust's approach is distinctive in providing a static, zero-cost guarantee against data races while still permitting shared-memory concurrency, lock-free algorithms, and fine-grained atomics. The mechanism is not a single feature but an interlocking system of ownership rules, lifetime analysis, marker traits, and type-level encoding of synchronization invariants. This survey provides a comprehensive analysis of that system.

The remainder of this paper is organized as follows. Section 2 establishes the theoretical foundations, defining data races and distinguishing them from race conditions. Section 3 provides a taxonomy of concurrency approaches across languages. Section 4 analyzes Rust's concurrency mechanisms in detail, from marker traits through lock-free data structures. Section 5 offers a comparative synthesis with trade-off analysis. Section 6 identifies open problems and active areas of research. Section 7 concludes.

## 2. Foundations

### 2.1 Data Races: Definition and Consequences

A data race is formally defined as a situation where all of the following conditions hold simultaneously: (1) two or more threads concurrently access the same memory location, (2) at least one of the accesses is a write, and (3) the accesses are not ordered by any synchronization mechanism [6]. This definition, drawn from the C++11 standard and adopted by Rust's Nomicon, distinguishes data races from the broader category of race conditions.

In C and C++, data races constitute undefined behavior (UB). Hans Boehm's foundational analysis demonstrated why this must be so: if the language were to assign defined semantics to data races, it would either preclude critical compiler optimizations or require hardware-level support that does not exist on commodity processors [7]. The consequence is severe: a program containing a data race may exhibit any behavior whatsoever, including memory corruption, security vulnerabilities, and seemingly impossible control flow. The compiler is entitled to assume data races do not exist and may optimize accordingly, potentially transforming a benign-looking race into a catastrophic failure.

The distinction between data races and race conditions is critical. A race condition is a semantic error where program correctness depends on the relative timing of concurrent operations. Race conditions are a superset of data races: all data races are race conditions, but not all race conditions are data races [8]. A program can be free of data races yet still exhibit race conditions -- for example, a time-of-check-to-time-of-use (TOCTOU) bug where a file's existence is checked and then opened without holding a lock. Rust's Nomicon explicitly acknowledges this distinction: "Safe Rust guarantees an absence of data races... However, it cannot prevent general race conditions" [6]. Preventing all race conditions would require controlling the thread scheduler, which is mathematically impossible in a general-purpose operating system environment.

### 2.2 The Aliasing-Mutation Exclusion Principle

Rust's data race freedom derives from a principle that can be stated concisely: if mutable access is exclusive, data races are impossible. This is because a data race requires concurrent access where at least one is a write; if the type system guarantees that only one reference can write to a location at any time, the precondition for a data race cannot be satisfied.

Rust enforces this through its borrowing rules: at any given time, a value may have either one mutable reference (`&mut T`) or any number of shared references (`&T`), but never both simultaneously. This rule, enforced by the borrow checker at compile time, eliminates the possibility of concurrent aliased mutation. The connection to concurrency safety was formalized by the RustBelt project, which proved type soundness for a realistic subset of Rust using the Iris higher-order concurrent separation logic [9]. RustBelt's proof demonstrates that the ownership discipline, combined with the `Send` and `Sync` traits, is sufficient to guarantee data-race freedom for all safe Rust programs.

### 2.3 The DRF-SC Guarantee

The Data-Race-Free Sequential Consistency (DRF-SC) theorem, established independently by Adve and Hill (1990) and formalized in the C++11 standard, states that programs free of data races execute as if operations from different threads were arbitrarily interleaved on a single processor [10]. This is significant because modern hardware and compilers aggressively reorder memory operations for performance. Without DRF-SC, programmers would need to reason about all possible hardware and compiler reorderings -- a task that is practically impossible.

Rust inherits the DRF-SC guarantee through its adoption of the C++ memory model. Since safe Rust programs are guaranteed to be data-race-free, they automatically receive sequential consistency semantics. Programs that use atomic operations with weaker memory orderings must reason about the memory model explicitly, but this is confined to `unsafe` code or explicit atomic operations with deliberately chosen orderings.

## 3. Taxonomy of Approaches

Concurrency models in programming languages can be classified along several axes: whether safety is enforced statically or dynamically, whether the model favors shared memory or message passing, and whether the runtime provides lightweight concurrency primitives.

**Static shared-memory with ownership types (Rust).** Rust uses compile-time ownership analysis to prevent data races while permitting direct shared-memory access through synchronized primitives. The cost is a steep learning curve and occasional friction with the borrow checker; the benefit is zero-cost data-race freedom.

**Dynamic shared-memory with runtime detection (Go).** Go permits unrestricted shared-memory access and provides a runtime race detector based on ThreadSanitizer [4]. The race detector has no false positives but can only detect races triggered during execution, and it imposes 2-20x slowdown and 5-10x memory overhead. Go idiomatically favors channels over shared memory, but the language does not enforce this preference.

**Shared-memory with a formal memory model (Java).** Java's Memory Model (JMM), specified in JSR-133 (2004), defines happens-before relationships for `synchronized` blocks and `volatile` variables [3]. Data races in Java produce defined but potentially surprising results rather than undefined behavior. The JMM took nearly a decade to formalize correctly and is still known to have subtle issues with out-of-thin-air values.

**Shared-memory with undefined-behavior data races (C++).** C++11 adopted a "DRF-SC or Catch Fire" model where data races are undefined behavior [2]. C++ provides three tiers of atomic operations (sequentially consistent, acquire/release, and relaxed), giving maximum control at the cost of maximum complexity and danger.

**Process isolation with message passing (Erlang/Elixir).** The BEAM VM runs lightweight processes (actors) that share no memory and communicate exclusively through message passing with data copying [5]. This model eliminates data races by construction but imposes overhead from copying and limits the expressiveness of shared-state algorithms.

## 4. Analysis

### 4.1 Send and Sync: The Marker Trait Foundation

The `Send` and `Sync` traits are the keystone of Rust's concurrency safety model. They are marker traits -- traits with no methods -- that encode thread-safety properties in the type system [11].

**`Send`** indicates that ownership of a value can be safely transferred to another thread. Its definition in the standard library is:

```rust
pub unsafe auto trait Send { }
```

**`Sync`** indicates that a value can be safely shared between threads via shared references. Formally, `T: Sync` if and only if `&T: Send` -- that is, a type is `Sync` precisely when its shared references can be safely sent to other threads [11].

Both traits are `unsafe` to implement manually, reflecting the fact that incorrect implementations can lead to undefined behavior that `unsafe` code elsewhere in the program may depend on for soundness. Both are `auto` traits, meaning the compiler automatically implements them for types whose constituent fields all implement the respective trait [12]. This auto-derivation is a critical design decision: it means that most user-defined types are automatically `Send` and `Sync` without any programmer annotation, and the types that are not thread-safe are precisely those containing non-thread-safe components.

The types that do not implement `Send` or `Sync` reveal the boundaries of thread safety:

| Type | Send | Sync | Rationale |
|------|------|------|-----------|
| `Rc<T>` | No | No | Non-atomic reference count would race under concurrent cloning |
| `Cell<T>` | Yes | No | Interior mutability without synchronization; `&Cell<T>` permits mutation |
| `RefCell<T>` | Yes | No | Runtime borrow checking is not thread-safe |
| `UnsafeCell<T>` | Yes | No | Fundamental interior mutability primitive; `&UnsafeCell<T>` permits mutation |
| `*const T`, `*mut T` | No | No | Raw pointers carry no safety guarantees; serves as a lint to prevent auto-derivation |
| `MutexGuard<'a, T>` | No | Yes | POSIX requires mutex unlock on the same thread as lock; destructor must run on originating thread |

The design of raw pointers as `!Send` and `!Sync` deserves particular attention. The Nomicon explains that this is "more of a lint" than a fundamental safety requirement: raw pointers themselves cannot cause data races, but types containing raw pointers likely have unsafe invariants that the compiler cannot verify [12]. This forces authors of types containing raw pointers to explicitly opt in to `Send` and `Sync` via `unsafe impl`, creating a deliberate checkpoint where the programmer asserts thread safety. Standard library collections like `Vec<T>` and `HashMap<K, V>` use raw pointers internally but provide safe abstractions, so they include `unsafe impl Send` and `unsafe impl Sync` with appropriate bounds on their type parameters.

The relationship between `Send`, `Sync`, and interior mutability forms a coherent system. `UnsafeCell<T>` is the sole primitive for interior mutability in Rust -- all other interior-mutability types (`Cell`, `RefCell`, `Mutex`, `RwLock`, atomics) are built on top of it [13]. `UnsafeCell` is `!Sync` because it permits mutation through shared references without synchronization. Types that wrap `UnsafeCell` with proper synchronization -- such as `Mutex<T>` and `AtomicU64` -- can be `Sync` because they enforce the necessary ordering guarantees.

### 4.2 The Ownership-Concurrency Connection

The connection between ownership and concurrency safety manifests at thread boundaries. The signature of `std::thread::spawn` encodes the requirements precisely:

```rust
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
```

The `Send` bound ensures the closure and its return value can cross thread boundaries safely. The `'static` bound ensures the closure does not borrow any stack-local data that might be deallocated before the thread completes [14]. Together, these bounds make it a compile-time error to share non-thread-safe data across threads or to create dangling references in spawned threads.

The `move` keyword on closures interacts with this system: `move || { ... }` transfers ownership of captured variables into the closure, satisfying the `'static` bound by ensuring the thread owns its data outright. Without `move`, the closure would attempt to borrow local variables, and the compiler would reject the program because borrowed references cannot satisfy `'static`.

Scoped threads, stabilized in Rust 1.63 via `std::thread::scope` (RFC 3151), relax the `'static` requirement [15]. Within a scope, spawned threads are guaranteed to complete before the scope exits, allowing them to safely borrow local variables:

```rust
let mut data = vec![1, 2, 3];
std::thread::scope(|s| {
    s.spawn(|| {
        println!("{:?}", &data); // borrowing is safe: thread joins before scope exits
    });
});
```

The `spawn` method within a scope requires `F: Send + 'env` rather than `F: Send + 'static`, where `'env` is the lifetime of the enclosing scope. The borrow checker verifies that all borrowed references outlive the scope, and the scope implementation guarantees that all spawned threads are joined before returning. This design, pioneered by the crossbeam crate and refined through years of experience, resolves a long-standing limitation where thread-based concurrency required owned data [15, 16].

### 4.3 Synchronization Primitives

Rust's standard library provides a complete suite of synchronization primitives, all of which leverage the type system to enforce correct usage.

**`Mutex<T>`** is the primary mutual exclusion primitive. Unlike C++ where `std::mutex` is a standalone object and the programmer must remember which data it protects, Rust's `Mutex<T>` wraps and owns the protected data [17]. Access is mediated through a `MutexGuard<'a, T>` that implements `Deref<Target = T>` and `DerefMut`, providing transparent access to the inner value. The guard's `Drop` implementation releases the lock automatically, ensuring that locks cannot be leaked through forgotten unlocks. The type signature enforces that `T: Send` for `Mutex<T>: Send`, and `T: Send` for `Mutex<T>: Sync`, reflecting that the mutex may transfer the inner value to whichever thread acquires the lock [17].

Rust's `Mutex` implements lock poisoning: if a thread panics while holding the lock, the mutex is marked as poisoned, and subsequent lock attempts return a `PoisonError`. This prevents other threads from observing potentially inconsistent state left by the panicking thread. The non-poisoning variant is available experimentally in the `std::sync::nonpoison` module.

**`RwLock<T>`** provides a reader-writer lock that allows multiple concurrent readers or a single exclusive writer. It additionally requires `T: Sync` because multiple reader threads may hold shared references to the inner value simultaneously [17]. The `RwLockReadGuard` and `RwLockWriteGuard` types enforce the reader-writer discipline through the type system.

**`Condvar`** implements condition variables for blocking threads until a condition is met. The `wait` method atomically releases the associated mutex and blocks, preventing the race between checking the condition and waiting. When woken, `wait` reacquires the lock before returning a new `MutexGuard` [17].

**`Barrier`** synchronizes multiple threads at a checkpoint, blocking each until all threads have arrived. Unlike C++20's `std::barrier` which supports a completion function, Rust's `Barrier` designates one thread as the "leader" via `BarrierWaitResult::is_leader()`.

**`Once`, `OnceLock<T>`, and `LazyLock<T>`** provide thread-safe one-time initialization. `Once` executes a closure exactly once across all threads. `OnceLock<T>` stores a value that can be initialized once with potentially different initializers. `LazyLock<T>` combines lazy evaluation with one-time initialization, replacing the common pattern of `lazy_static!` or `once_cell` [18]. Unlike `Mutex`, these types are never poisoned on panic.

**`parking_lot`** is a third-party crate providing alternative synchronization primitives with different performance characteristics. Its `Mutex` uses a single byte of storage (versus the standard library's OS-dependent size), implements eventual fairness with a 0.5ms timer to prevent starvation, and benchmarks show 1.5x faster uncontended performance and up to 5x faster contended performance on Linux x86_64 compared to `std::sync::Mutex` [19]. The standard library's primitives delegate to OS kernel facilities for thread scheduling, while `parking_lot` manages wait queues in user space via a global hash table.

### 4.4 Atomic Operations and Memory Ordering

Rust's atomic types (`AtomicBool`, `AtomicI8` through `AtomicI64`, `AtomicU8` through `AtomicU64`, `AtomicUsize`, `AtomicPtr<T>`) provide lock-free concurrent access to values that fit in a machine word [20]. All atomic operations require an explicit `Ordering` parameter that specifies the memory ordering guarantee.

Rust exposes five memory orderings, directly inherited from the C++20 memory model (with the deliberate omission of `memory_order_consume`, which was deprecated in C++17 due to implementation difficulties) [21]:

**`Relaxed`**: The weakest ordering. Guarantees atomicity of the individual operation but establishes no happens-before relationships with other operations. Operations may be freely reordered by the compiler and hardware. Appropriate for simple counters where the current value need not be synchronized with other data [21].

**`Acquire`**: When applied to a load operation, guarantees that all subsequent memory operations in the current thread observe the effects of all operations that preceded the corresponding `Release` store in the writing thread. Operations before the `Acquire` load may be reordered after it, but operations after it may not be reordered before it [21].

**`Release`**: When applied to a store operation, guarantees that all preceding memory operations in the current thread are visible to any thread that performs a corresponding `Acquire` load of the same atomic variable. Operations after the `Release` store may be reordered before it, but operations before it may not be reordered after it [21].

**`AcqRel`**: Combines `Acquire` and `Release` semantics. Applied to read-modify-write operations (such as `compare_exchange` or `fetch_add`), it ensures both acquire semantics on the read and release semantics on the write [21].

**`SeqCst`**: The strongest ordering. Establishes a single total order over all `SeqCst` operations that is consistent across all threads. Every `SeqCst` operation both acquires and releases, and additionally all `SeqCst` operations appear in the same order to all threads. This is the easiest ordering to reason about but the most expensive on weakly-ordered architectures [21].

The practical implications of ordering choices vary dramatically by hardware architecture. On strongly-ordered architectures like x86-64, `Acquire` and `Release` orderings are essentially free because the hardware already provides those guarantees. On weakly-ordered architectures like ARM and RISC-V, weaker orderings translate to cheaper instructions (or the absence of memory fence instructions), making the choice performance-relevant [21]. The Nomicon advises using `SeqCst` as a default and downgrading to weaker orderings only after proving correctness, since "the cost of SeqCst is rarely the bottleneck" [21].

A canonical example of acquire-release pairing is the spinlock:

```rust
use std::sync::atomic::{AtomicBool, Ordering};

// Acquire the lock
while lock.compare_exchange_weak(false, true, Ordering::Acquire, Ordering::Relaxed).is_err() {
    std::hint::spin_loop();
}
// Critical section: all writes by the previous lock holder are visible here
// Release the lock
lock.store(false, Ordering::Release);
```

The `Acquire` on the compare-exchange ensures that the critical section observes all writes made by the previous lock holder before their `Release` store. The `Relaxed` failure ordering is acceptable because a failed compare-exchange does not enter the critical section.

### 4.5 The Memory Model

Rust does not yet have a formally specified memory model independent of C++. The Rust Reference explicitly warns that "the Rust memory model is incomplete and not fully decided" [22]. In practice, Rust inherits the C++20 memory model through its use of LLVM as a backend, adopting the DRF-SC or Catch Fire semantics, the full hierarchy of memory orderings, and the happens-before relation [10, 21].

This inheritance is pragmatic rather than principled. As Russ Cox's survey of programming language memory models observes, Rust and Swift "adopted C++'s model via LLVM integration, inheriting its complete atomic hierarchy and DRF-SC approach" [10]. The C++ memory model is known to have several formal deficiencies, most notably the inability to prevent "out-of-thin-air" values -- executions where a value appears to justify itself through circular causality. A 2015 assessment noted that "40+ years after the first relaxed-memory hardware was introduced... the field still does not have a credible proposal for the concurrency semantics of any general-purpose high-level language" [10].

RFC 1643 established a "memory model strike team" to develop a Rust-specific memory model, but the effort has not yet produced a formal specification [23]. The RustBelt project has extended its formal verification to account for relaxed-memory concurrency, but this covers a subset of the language rather than a complete operational model [9]. The question of Rust's memory model is also relevant to the Rust-for-Linux project, where kernel code must interact with the Linux memory model (LKMM), which differs from C++ in subtle ways [24].

### 4.6 Thread-Based Concurrency

Rust's standard library provides OS-native threads via `std::thread::spawn`, which creates a 1:1 mapping between Rust threads and operating system threads. Each thread receives its own stack (typically 2-8 MB depending on the OS) and is scheduled by the OS kernel [14].

`JoinHandle<T>` provides the mechanism for waiting on thread completion and retrieving results. The `join()` method blocks the calling thread until the spawned thread finishes, returning `Ok(T)` on success or `Err(Box<dyn Any>)` if the thread panicked. This design allows panics to be caught across thread boundaries.

Thread-local storage is provided through the `thread_local!` macro, which creates variables with a separate instance for each thread. Thread-local variables have the type `LocalKey<T>` and are accessed through a closure via the `with` method, ensuring the reference does not escape the current thread.

Scoped threads, as discussed in Section 4.2, were stabilized in Rust 1.63 following RFC 3151 [15]. The design propagates unhandled panics from child threads (unlike crossbeam's original design which silently ignored them), and the closure passed to `Scope::spawn` receives a `&Scope<'env>` argument enabling nested thread spawning. The `ScopedJoinHandle` is parameterized over the scope lifetime `'scope` to prevent the handle from escaping the scope.

### 4.7 Lock-Free and Wait-Free Data Structures

Lock-free data structures avoid mutual exclusion by using atomic compare-and-swap (CAS) operations to make progress without holding locks. The fundamental challenge in implementing lock-free data structures in a non-garbage-collected language is memory reclamation: when a node is unlinked from a data structure, other threads may still hold references to it, making immediate deallocation unsafe [25].

**Crossbeam** is the foundational crate for lock-free programming in Rust, providing epoch-based memory reclamation, concurrent data structures, and work-stealing deques [16, 25].

Crossbeam's epoch-based reclamation scheme addresses the memory reclamation problem through a three-epoch rotating counter with per-thread active flags [25]. When a thread wishes to access shared data, it "pins" the current epoch, receiving a `Guard` whose lifetime bounds all `Shared<'a, T>` pointers obtained during the epoch. When a node is unlinked, it is placed in the garbage list for the current global epoch. The global epoch can advance when all active threads have observed the current epoch; garbage from two epochs ago is then safe to reclaim, because no active thread could possibly hold a reference to it.

The Rust type system enforces correct epoch usage: the `Atomic<T>::load()` method requires a `&Guard` reference, tying the lifetime of the returned `Shared` pointer to the guard. This statically prevents use-after-free: the guard cannot be dropped while shared pointers derived from it are still live [25]. The performance characteristics of epoch-based reclamation are attractive: the cost of garbage management is proportional to the number of threads, not the volume of garbage, yielding consistent and predictable performance even under asymmetric workloads.

Crossbeam provides several concrete data structures:

- **`SegQueue`**: An unbounded multi-producer, multi-consumer (MPMC) queue that allocates memory in segments on demand.
- **`ArrayQueue`**: A bounded MPMC queue with a fixed-capacity ring buffer allocated at construction time.
- **`crossbeam-deque`**: Work-stealing deques for building task schedulers, where each thread maintains a local deque and idle threads steal from the tail of other threads' deques [16].

**DashMap** is a concurrent hash map that uses shard-based locking rather than lock-free algorithms [26]. It partitions keys across `Box<[RwLock<HashMap<K, V>>]>` shards (one per CPU core by default), so that operations on different shards can proceed in parallel. The API mirrors `std::collections::HashMap`, with all methods taking `&self` rather than `&mut self` to enable concurrent access. While not technically lock-free -- readers still acquire read locks and writers acquire write locks on individual shards -- the contention is distributed across enough shards that throughput scales well for read-heavy workloads. For write-heavy workloads, DashMap may outperform global-lock alternatives due to reduced contention [26].

**Flurry** is a Rust port of Java's `java.util.concurrent.ConcurrentHashMap`, adapting its segment-based concurrent design [27]. Since Rust lacks a runtime garbage collector, flurry uses the `seize` crate for batch reference-counting-based reclamation. The project acknowledges performance and memory usage issues under load and suggests alternatives such as `papaya` or `dashmap` for production use [27].

### 4.8 Data Parallelism with Rayon

Rayon is a data-parallelism library that provides structured parallel computation through parallel iterators and the `join` primitive [28]. Its design demonstrates how Rust's type system enables safe parallelism as a library concern rather than a language feature.

Rayon's core abstraction is the parallel iterator (`par_iter`), which provides the same API as sequential iterators (`map`, `filter`, `fold`, `reduce`, etc.) but executes operations across a thread pool. Converting sequential code to parallel code is often as simple as replacing `.iter()` with `.par_iter()` [28].

The work-stealing scheduler is the engine of Rayon's performance. Each thread in the pool maintains a local deque of tasks (built on `crossbeam-deque`). When `join(a, b)` is called, task `b` is pushed onto the local deque and the thread begins executing `a`. Idle threads steal tasks from the tail of other threads' deques. When `a` completes, the thread checks whether `b` was stolen; if not, it executes `b` locally. This strategy achieves near-optimal load balancing for irregular workloads without centralized coordination [28].

Safety is enforced through trait bounds. Rayon's parallel operations require closures to be `Send + Sync + Fn`, meaning they must be thread-safe and callable multiple times. As Josh Stone explains in his analysis of Rayon's design, "Rayon doesn't know anything about your code: it just specifies simple constraints and lets the Rust compiler do the hard work of proving it" [29]. A closure that attempts to mutate a captured local variable will fail to compile because it violates the `Fn` bound (which requires `&self`, not `&mut self`). Using `AtomicI32` instead of a plain `i32` allows the same pattern to compile because atomic operations are safe to invoke from shared references.

The `ThreadPool` and `ThreadPoolBuilder` types allow configuring the number of threads and creating isolated pools. Rayon's global thread pool is initialized lazily and sized to match the number of logical CPU cores.

### 4.9 Message Passing

Rust provides multiple channel implementations for inter-thread communication, following the principle articulated in Go's documentation: "Do not communicate by sharing memory; instead, share memory by communicating" [30].

**`std::sync::mpsc`** provides the standard library's multi-producer, single-consumer channels. `channel()` creates an unbounded asynchronous channel, while `sync_channel(n)` creates a bounded synchronous channel with capacity `n`. The `Sender<T>` is cloneable (enabling multiple producers), while `Receiver<T>` is not (enforcing single-consumer semantics). When data is sent through a channel, ownership transfers from the sending thread to the receiving thread, and the `Send` bound on `T` ensures this transfer is safe [18].

**Crossbeam-channel** provides multi-producer, multi-consumer (MPMC) channels with significantly richer functionality [31]. It supports both bounded and unbounded channels, a `select!` macro for waiting on multiple channels simultaneously (analogous to Go's `select` statement), and zero-capacity channels for synchronous rendezvous. Benchmarks show crossbeam-channel outperforming `std::sync::mpsc` in most scenarios, particularly under high contention [31].

**Flume** is another high-performance channel implementation offering both synchronous and asynchronous interfaces, making it suitable for bridging sync and async code [32].

The comparison with Go channels is instructive. Go channels are built into the language with first-class syntax support (`<-` operator, `select` statement). Rust channels are library types with no special syntax. Go channels support both MPSC and MPMC patterns natively. One stress-test comparison found that Rust's `sync_channel` processes workloads approximately 2.5x faster than Go channels with steadier tail latency, attributed to Go's goroutine piling, GC pressure, and scheduler overhead creating performance cliffs under bursty producers [33].

### 4.10 Unsafe Code and the Limits of Static Safety

Rust's data-race freedom guarantee applies only to safe code. The `unsafe` keyword permits operations that the compiler cannot verify, including dereferencing raw pointers, calling foreign functions, and manually implementing `Send` and `Sync`. When programmers write incorrect `unsafe` code, the guarantee breaks.

The PLDI 2020 study by Qin et al. examined 170 bugs across five Rust applications and five libraries [34]. Of the 100 thread-safety bugs studied, 17 involved unsynchronized shared memory accesses performed through `unsafe` code that bypassed the borrow checker entirely. The study also found bugs in standard library APIs and developed two static detectors (for use-after-free and double-lock bugs) that found ten previously unknown bugs.

The RUDRA static analysis tool, presented at SOSP 2021, discovered 264 previously unknown memory safety bugs across 43,000 crates in the Rust package registry, resulting in 76 CVE records [35]. These bugs represented 39% of all bugs and 51.6% of memory safety bugs reported to the RustSec advisory database since 2016. A notable example is CVE-2020-35905 in the official `futures` crate, where a `MappedMutexGuard` had incorrect `Send` and `Sync` bounds: the bounds were applied to the source type `T` but not to the mapped type `U`, allowing a non-thread-safe `U` to be shared across threads through safe code [35].

These findings underscore a crucial point: Rust's safety guarantee is only as strong as the correctness of `unsafe impl Send` and `unsafe impl Sync` declarations. The compiler's auto-derivation of these traits is provably sound (incorrect auto-derivation is impossible by construction [12]), but manual implementations are unverified assertions that can introduce soundness holes.

## 5. Comparative Synthesis

### 5.1 Trade-Off Analysis

| Dimension | Rust | Go | Java | C++ | Erlang/BEAM |
|-----------|------|-----|------|-----|-------------|
| **Data race prevention** | Compile-time (type system) | Runtime (race detector, opt-in) | Runtime (JMM defines behavior) | None (undefined behavior) | By construction (no shared memory) |
| **Mechanism** | Ownership + Send/Sync | Goroutines + channels + race detector | `synchronized` + `volatile` + JMM | `std::thread` + `std::mutex` + atomics | Processes + message passing |
| **Lightweight tasks** | Library (tokio, async-std) | Language (goroutines) | Language (virtual threads, JDK 21+) | Library (coroutines, C++20) | Language (BEAM processes) |
| **Memory model** | Inherited from C++20 (informal) | DRF-SC (defined in spec) | JMM (JSR-133, formal) | DRF-SC or Catch Fire (formal) | Not applicable (no shared memory) |
| **Shared mutable state** | `Mutex<T>`, `RwLock<T>`, atomics | `sync.Mutex`, atomics | `synchronized`, `volatile`, `java.util.concurrent` | `std::mutex`, `std::atomic<T>` | Not supported (copy semantics) |
| **Channel support** | Library (mpsc, crossbeam, flume) | Language (`chan`, `select`) | Library (`BlockingQueue`, etc.) | Library (no standard channels) | Language (mailboxes, `receive`) |
| **Lock-free ecosystem** | Crossbeam, dashmap, papaya | Limited (sync.Map) | `java.util.concurrent` (rich) | Boost.Lockfree, folly | Not applicable |
| **Cost of safety** | Compile time (borrow checker) | Runtime overhead (2-20x with -race) | Runtime overhead (GC, synchronization) | None (programmer responsibility) | Runtime overhead (copying, scheduling) |
| **False positive rate** | None (sound type system) | None (dynamic detection) | N/A | N/A | N/A |
| **False negative rate** | None in safe code; unsafe code unchecked | Misses unexecuted paths | N/A | N/A | N/A |

### 5.2 Key Distinctions

**Rust vs. C++**: The most instructive comparison is between Rust and C++, as both target the same performance niche and share a memory model lineage. The critical difference is type-level enforcement. In C++, `std::mutex` is a standalone object with no type-level connection to the data it protects; in Rust, `Mutex<T>` owns and wraps the protected data, and the compiler enforces that access occurs only through the guard [36]. C++ provides `std::atomic<T>` for arbitrary types, falling back to lock-based implementations for types larger than the hardware supports; Rust provides only platform-native atomic sizes, preventing silent performance degradation [36]. C++ permits copying `std::shared_ptr` across threads (with atomic reference counting for the control block); Rust's `Rc<T>` is `!Send` and `!Sync`, requiring the programmer to explicitly use `Arc<T>` for cross-thread sharing.

**Rust vs. Go**: Go's concurrency model prioritizes simplicity and developer productivity. Goroutines are extremely cheap to create (a few kilobytes of stack space, dynamically growing), and the `go` keyword makes concurrency syntactically trivial [37]. Rust requires explicit thread management or an async runtime, with the `Send + 'static` bounds creating friction that Go developers do not face. However, Go's runtime race detector is a testing tool, not a safety guarantee: it can only detect races that are triggered during execution, and production code runs without it. Rust's guarantee holds for all safe code regardless of execution path.

**Rust vs. Java**: Java's `synchronized` keyword and `volatile` fields provide a simpler mental model than Rust's ownership system, but at the cost of runtime overhead (monitor acquisition) and the risk of deadlocks. Java's `java.util.concurrent` package provides a rich ecosystem of concurrent data structures (ConcurrentHashMap, ConcurrentLinkedQueue, etc.) that predates Rust's ecosystem, and flurry is explicitly a port of Java's ConcurrentHashMap to Rust [27]. Java's virtual threads (JDK 21+) bring Go-like lightweight concurrency to the JVM.

**Rust vs. Erlang/BEAM**: Erlang represents the opposite end of the design spectrum from Rust. The BEAM VM can support millions of lightweight processes, each with its own heap, communicating through immutable message passing [5]. This model is inherently immune to data races but requires copying data between processes and cannot efficiently express shared-state algorithms. Rust's Actix and Ractor frameworks attempt to bring actor-model patterns to Rust while retaining its safety guarantees and shared-memory capabilities.

### 5.3 Performance Characteristics

Raw computational throughput generally favors Rust, which can match or exceed C++ performance while providing safety guarantees. Benchmark comparisons for concurrent workloads show Rust achieving the smallest tail latency and best throughput for CPU-bound work [38]. For I/O-bound workloads with many lightweight tasks, Go and Java (with virtual threads) are competitive due to their lighter-weight concurrency primitives and runtime scheduling.

## 6. Open Problems & Gaps

### 6.1 The Send Bound Problem for Async Traits

Async functions in traits were stabilized in Rust, but a significant ergonomic and safety gap remains: there is currently no way to write a generic function that requires trait implementations to return `Send` futures [39]. When a trait contains an async method, the compiler generates an opaque `impl Future` return type, but there is no stable syntax for constraining that future to be `Send`. This blocks the adoption of async trait methods in core ecosystem crates like Tower, which need to work across multi-threaded executors where spawned tasks must be `Send`.

RFC 3654 proposes a solution, and the async working group has identified this as one of its highest priorities [39]. The `trait_variant` crate provides a workaround by generating a separate trait variant with `Send` bounds, but this approach is verbose and does not compose well with trait hierarchies.

### 6.2 Structured Concurrency

Structured concurrency -- the principle that every concurrent task should be created within a scope and the scope should not exit until all tasks complete -- is well-established for synchronous threads via `std::thread::scope` but remains unsolved for async Rust [40]. The `futures-concurrency` crate by Yoshua Wuyts provides `FutureGroup` and other combinators that enforce structured cancellation and error propagation [40]. Niko Matsakis's experimental `moro` crate explores structured concurrency with async scopes. The `async_nursery` crate brings Python Trio's nursery pattern to Rust.

However, there is no standard, language-level structured concurrency primitive for async code. The ability to call `tokio::spawn` (or equivalent) to launch unbounded tasks that outlive their calling scope means that most async Rust programs use unstructured concurrency by default, with the attendant risks of leaked tasks, unhandled cancellation, and orphaned resources.

### 6.3 The Formally Unspecified Memory Model

As noted in Section 4.5, Rust does not have a formally specified memory model. The Reference states that the model is "incomplete and not fully decided" [22]. While the practical semantics are inherited from C++ through LLVM, this inheritance is informal and leaves open questions: Does Rust inherit C++'s problematic relaxed atomics semantics, including the out-of-thin-air problem? How should Rust's memory model interact with the Linux Kernel Memory Model (LKMM) for the Rust-for-Linux project [24]? Can Rust's memory model diverge from C++ to provide stronger guarantees (e.g., by restricting relaxed atomics) without sacrificing performance?

### 6.4 Deadlock Detection and Concurrency Bug Tooling

Rust's type system prevents data races but does not prevent deadlocks, livelocks, or other concurrency bugs. The tooling landscape for detecting these issues is fragmented:

- **Miri**, Rust's interpreter for detecting undefined behavior, can detect some deadlocks but only reports them when all threads stop running, missing partial deadlocks where two threads are blocked while others continue [41].
- **ThreadSanitizer** can be used with Rust through compiler flags but is designed for C/C++ and has limited Rust-specific support.
- **LockBud** is a static analysis tool specifically designed for detecting lock-related concurrency bugs in Rust, including double-lock and conflicting-lock-order patterns [42].
- **RUDRA** focuses on memory safety bugs stemming from incorrect `unsafe` implementations but does not address deadlocks [35].

The Miri project has open issues for improving deadlock diagnostics [41], and recent work on Miri (presented at POPL 2026) has advanced its capability to detect all de-facto undefined behavior in deterministic Rust programs, including data-race detection and exploration of weak memory behaviors [43]. However, comprehensive concurrency bug detection in Rust remains an open problem, with no single tool covering the full spectrum of data races in `unsafe` code, deadlocks, and logic-level race conditions.

### 6.5 Async Drop and Cancellation Safety

The absence of `async Drop` in Rust creates complications for concurrent resource management. When a future is dropped (cancelled), its destructor runs synchronously, which means any asynchronous cleanup (such as sending a cancellation message, flushing a buffer, or closing a network connection) cannot be performed in the destructor. This forces library authors to design their APIs around cancellation safety, adding significant complexity to concurrent async code [39].

### 6.6 Pin and Self-Referential Futures

The `Pin<P>` type, required for safe self-referential futures, adds significant complexity to the async concurrency story. Futures that borrow from local state (which is common after an `.await` point) must be pinned in memory to prevent moves that would invalidate internal references. The ergonomics of `Pin` have been widely criticized, and language-level improvements are under active discussion.

## 7. Conclusion

Rust's approach to concurrency safety represents a genuine advance in the state of the art for systems programming languages. The synthesis of ownership types, the `Send` and `Sync` marker traits, and the borrow checker creates a system where data-race freedom is a structural property of well-typed programs rather than a property that must be tested for or verified post-hoc. The formal foundation provided by the RustBelt project [9] gives confidence that this guarantee is not merely an empirical observation but a provable consequence of the type system's design.

The practical ecosystem built on this foundation -- from the synchronization primitives in `std::sync` through the lock-free data structures in crossbeam, the data-parallel iterators in Rayon, and the rich channel implementations -- demonstrates that compile-time safety does not preclude expressive concurrent programming. The type system's requirements propagate through library APIs, ensuring that third-party abstractions inherit the same safety guarantees as standard library primitives.

At the same time, the boundaries of the guarantee are important to acknowledge. Unsafe code can violate data-race freedom, and empirical studies show that incorrect `unsafe impl Send` and `unsafe impl Sync` declarations are a real source of production bugs [34, 35]. The formally unspecified memory model, the Send bound problem for async traits, and the absence of structured concurrency primitives for async code represent significant open problems. The tension between Rust's static analysis and the inherently dynamic nature of concurrent execution means that some classes of bugs -- deadlocks, livelocks, and logic-level race conditions -- remain outside the type system's reach.

Nonetheless, Rust demonstrates that a substantial fraction of concurrency bugs can be eliminated at compile time without sacrificing the performance characteristics that systems programmers require. The question for the field is no longer whether static prevention of data races is feasible, but how far the approach can be extended and how its remaining gaps can be addressed.

## References

[1] A. Turon, "Fearless Concurrency with Rust," Rust Blog, April 10, 2015. https://blog.rust-lang.org/2015/04/10/Fearless-Concurrency/

[2] H. Boehm, "Why Undefined Semantics for C++ Data Races?" https://www.hboehm.info/c++mm/why_undef.html

[3] J. Manson, W. Pugh, and S. V. Adve, "The Java Memory Model," JSR-133 FAQ. https://www.cs.umd.edu/~pugh/java/memoryModel/jsr-133-faq.html

[4] "Introducing the Go Race Detector," The Go Blog. https://go.dev/blog/race-detector

[5] "BEAM and JVM Virtual Machines: Comparing and Contrasting," Erlang Solutions. https://www.erlang-solutions.com/blog/beam-jvm-virtual-machines-comparing-and-contrasting/

[6] "Races," The Rustonomicon. https://doc.rust-lang.org/nomicon/races.html

[7] H. Boehm, "How to Miscompile Programs with 'Benign' Data Races," in Proc. HotPar, 2011. Referenced via https://www.hboehm.info/c++mm/why_undef.html

[8] J. Regehr, "Race Condition vs. Data Race," Embedded in Academia. https://blog.regehr.org/archives/490

[9] R. Jung, J.-H. Jourdan, R. Krebbers, and D. Dreyer, "RustBelt: Securing the Foundations of the Rust Programming Language," Proc. ACM Program. Lang. (POPL), 2018. https://plv.mpi-sws.org/rustbelt/popl18/paper.pdf

[10] R. Cox, "Programming Language Memory Models," research!rsc, 2021. https://research.swtch.com/plmm

[11] "Extensible Concurrency with the Send and Sync Traits," The Rust Programming Language. https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html

[12] "Send and Sync," The Rustonomicon. https://doc.rust-lang.org/nomicon/send-and-sync.html

[13] "UnsafeCell in std::cell," Rust Standard Library Documentation. https://doc.rust-lang.org/std/cell/struct.UnsafeCell.html

[14] "spawn in std::thread," Rust Standard Library Documentation. https://doc.rust-lang.org/std/thread/fn.spawn.html

[15] "RFC 3151: Scoped Threads," The Rust RFC Book. https://rust-lang.github.io/rfcs/3151-scoped-threads.html

[16] "Crossbeam: Tools for Concurrent Programming in Rust," GitHub. https://github.com/crossbeam-rs/crossbeam

[17] M. Bos, Rust Atomics and Locks: Low-Level Concurrency in Practice, O'Reilly Media, 2023, Chapter 1. https://mara.nl/atomics/basics.html

[18] "std::sync," Rust Standard Library Documentation. https://doc.rust-lang.org/std/sync/index.html

[19] "parking_lot: Compact and Efficient Synchronization Primitives for Rust," GitHub. https://github.com/Amanieu/parking_lot

[20] "std::sync::atomic," Rust Standard Library Documentation. https://doc.rust-lang.org/std/sync/atomic/

[21] "Atomics," The Rustonomicon. https://doc.rust-lang.org/nomicon/atomics.html

[22] "Memory Model," The Rust Reference. https://doc.rust-lang.org/reference/memory-model.html

[23] "RFC 1643: Memory Model Strike Team," The Rust RFC Book. https://rust-lang.github.io/rfcs/1643-memory-model-strike-team.html

[24] "A Memory Model for Rust Code in the Kernel," LWN.net. https://lwn.net/Articles/967049/

[25] A. Turon, "Lock-freedom without Garbage Collection," aturon.github.io, August 27, 2015. https://aturon.github.io/blog/2015/08/27/epoch/

[26] "DashMap: Blazing Fast Concurrent HashMap for Rust," GitHub. https://github.com/xacrimon/dashmap

[27] "Flurry: A Port of Java's ConcurrentHashMap to Rust," GitHub. https://github.com/jonhoo/flurry

[28] "Rayon: A Data Parallelism Library for Rust," GitHub. https://github.com/rayon-rs/rayon

[29] J. Stone, "How Rust Makes Rayon's Data Parallelism Magical," Red Hat Developer, April 30, 2021. https://developers.redhat.com/blog/2021/04/30/how-rust-makes-rayons-data-parallelism-magical

[30] "Fearless Concurrency," The Rust Programming Language. https://doc.rust-lang.org/book/ch16-00-concurrency.html

[31] "Crossbeam Channel RFC," crossbeam-rs/rfcs. https://github.com/crossbeam-rs/rfcs/blob/master/text/2017-11-09-channel.md

[32] "Rust Channel Comparison Table," Code and Bitters. https://codeandbitters.com/rust-channel-comparison/

[33] K. Lathi, "Go Channels vs Rust's MPSC: I Stress-Tested Both," Medium. https://medium.com/@Krishnajlathi/go-channels-vs-rusts-mpsc-i-stress-tested-both-and-one-got-wrecked-f240f00070e7

[34] B. Qin, Y. Chen, Z. Yu, L. Song, and Y. Zhang, "Understanding Memory and Thread Safety Practices and Issues in Real-World Rust Programs," Proc. ACM SIGPLAN Conference on Programming Language Design and Implementation (PLDI), 2020. https://cseweb.ucsd.edu/~yiying/RustStudy-PLDI20.pdf

[35] Y. Bae, Y. Kim, A. Asber, J. Lim, and T. Kim, "RUDRA: Finding Memory Safety Bugs in Rust at the Ecosystem Scale," Proc. ACM Symposium on Operating Systems Principles (SOSP), 2021. https://taesoo.kim/pubs/2021/bae:rudra.pdf

[36] M. Bos, "Comparing Rust's and C++'s Concurrency Library," blog.m-ou.se. https://blog.m-ou.se/rust-cpp-concurrency/

[37] "Journey to Fearless Concurrency -- Rust vs. Go," Medium. https://medium.com/@AlexanderObregon/journey-to-fearless-concurrency-rust-vs-go-31d49255d6b6

[38] K. Lathi, "Rust vs Go vs Java: The 2025 Concurrency Benchmark Cage Match," Medium. https://medium.com/@Krishnajlathi/rust-vs-go-vs-java-the-2025-concurrency-benchmark-cage-match-943e53d04b8d

[39] "Bring the Async Rust Experience Closer to Parity with Sync Rust," Rust Project Goals, 2024h2. https://rust-lang.github.io/rust-project-goals/2024h2/async.html

[40] Y. Wuyts, "futures-concurrency: Structured Concurrency Operations for Async Rust," GitHub. https://github.com/yoshuawuyts/futures-concurrency

[41] "Improve Deadlock Diagnostics," rust-lang/miri, Issue #3424. https://github.com/rust-lang/miri/issues/3424

[42] B. Qin, "LockBud: Detect Concurrency and Memory Bugs in Rust Projects," GitHub. https://github.com/BurtonQin/lockbud

[43] R. Jung et al., "Miri: Practical Undefined Behavior Detection for Rust," Proc. ACM SIGPLAN Symposium on Principles of Programming Languages (POPL), 2026. https://research.ralfj.de/papers/2026-popl-miri.pdf

[44] "Send in std::marker," Rust Standard Library Documentation. https://doc.rust-lang.org/std/marker/trait.Send.html

[45] "Sync in std::marker," Rust Standard Library Documentation. https://doc.rust-lang.org/std/marker/trait.Sync.html

[46] "Ordering in std::sync::atomic," Rust Standard Library Documentation. https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html

[47] M. Bos, Rust Atomics and Locks: Low-Level Concurrency in Practice, O'Reilly Media, 2023, Chapter 3. https://mara.nl/atomics/memory-ordering.html

[48] "Data Race Detector," The Go Programming Language. https://go.dev/doc/articles/race_detector

[49] "A Comparison between Rust and Erlang," InfoQ. https://www.infoq.com/articles/rust-erlang-comparison/

[50] R. Jung, J.-H. Jourdan, R. Krebbers, and D. Dreyer, "Safe Systems Programming in Rust," Communications of the ACM, 2021. https://iris-project.org/pdfs/2021-rustbelt-cacm-final.pdf

## Practitioner Resources

**Books**
- Mara Bos, *Rust Atomics and Locks: Low-Level Concurrency in Practice* (O'Reilly, 2023). The definitive treatment of low-level concurrency in Rust, covering atomics, memory ordering, and building synchronization primitives from scratch. Freely available online at https://mara.nl/atomics/
- Jon Gjengset, *Rust for Rustaceans* (No Starch Press, 2021). Chapter on concurrency covers advanced patterns including lock-free data structures and the `Send`/`Sync` trait system.

**Official Documentation**
- The Rustonomicon, "Send and Sync" and "Atomics" chapters: https://doc.rust-lang.org/nomicon/send-and-sync.html and https://doc.rust-lang.org/nomicon/atomics.html
- The Rust Reference, "Memory Model": https://doc.rust-lang.org/reference/memory-model.html
- `std::sync` module documentation: https://doc.rust-lang.org/std/sync/index.html

**Crate Ecosystem**
- `crossbeam` (epoch-based reclamation, lock-free queues, channels, work-stealing deques): https://crates.io/crates/crossbeam
- `rayon` (parallel iterators, work-stealing thread pool): https://crates.io/crates/rayon
- `dashmap` (sharded concurrent hash map): https://crates.io/crates/dashmap
- `parking_lot` (high-performance synchronization primitives): https://crates.io/crates/parking_lot
- `flume` (high-performance MPMC channels with async support): https://crates.io/crates/flume
- `tokio` (async runtime with concurrency primitives): https://crates.io/crates/tokio
- `futures-concurrency` (structured concurrency for async): https://crates.io/crates/futures-concurrency

**Formal Verification and Research**
- RustBelt project (formal soundness proof for Rust's type system): https://plv.mpi-sws.org/rustbelt/
- Iris separation logic framework: https://iris-project.org/
- RustSec advisory database (security advisories for Rust crates): https://rustsec.org/

**Tooling**
- Miri (interpreter for detecting undefined behavior): https://github.com/rust-lang/miri
- ThreadSanitizer (dynamic data race detection, usable with Rust via `-Zsanitizer=thread`): https://doc.rust-lang.org/unstable-book/compiler-flags/sanitizer.html
- LockBud (static concurrency bug detector for Rust): https://github.com/BurtonQin/lockbud
- RUDRA (static analysis for unsafe Rust soundness bugs): https://github.com/aspect-build/rudra
