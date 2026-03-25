---
title: "Embedded and Systems Programming with No-Std Rust"
date: 2026-03-21
summary: A survey of Rust's embedded and systems programming ecosystem covering no_std development, the embedded-hal abstraction layer, RTIC and Embassy frameworks, Rust in the Linux kernel, OS development, and safety-critical certification — analyzing Rust's growing challenge to C's dominance in bare-metal and real-time systems.
keywords: [rust, embedded, no-std, RTIC, embassy, linux-kernel, bare-metal]
---

# Embedded and Systems Programming with No-Std Rust

*2026-03-21*

## Abstract

Embedded systems constitute a vast and growing segment of the global software market, projected to exceed $200 billion by 2036, yet the programming tools used to build them have changed remarkably little in four decades. C, standardized in 1989 and substantially unchanged in its embedded usage patterns since the 1990s, remains the dominant language for firmware, device drivers, and real-time control systems. This dominance persists despite well-documented categories of defects -- buffer overflows, use-after-free errors, null pointer dereferences, and data races -- that stem directly from C's lack of memory and type safety guarantees. Rust, a systems programming language that enforces memory safety and data race freedom at compile time through its ownership and borrowing discipline, has emerged as the most credible challenger to C's embedded hegemony. Unlike previous challengers, Rust achieves safety without garbage collection, runtime overhead, or mandatory heap allocation, making it structurally compatible with the constraints of bare-metal and real-time environments.

This survey provides a comprehensive analysis of the Rust embedded ecosystem as of early 2026. We examine the foundational `#![no_std]` compilation mode and the layered crate architecture (core, alloc, std) that enables Rust to target devices with as little as a few kilobytes of RAM. We trace the embedded-hal Hardware Abstraction Layer through its constituent layers -- Peripheral Access Crates generated from SVD files, microcontroller-specific HAL implementations, and Board Support Packages -- documenting the stabilization of embedded-hal 1.0 and its unification of blocking, non-blocking, and asynchronous trait families. We analyze in depth the two dominant concurrency frameworks: RTIC, which maps the Stack Resource Policy directly onto hardware interrupt controllers for zero-cost priority-based scheduling, and Embassy, which brings Rust's async/await paradigm to microcontrollers with cooperative multitasking and interrupt-driven wake-up. We survey Rust's penetration into operating system kernels, including the Rust-for-Linux project's contentious journey from experimental status to permanent inclusion, and purpose-built Rust operating systems (Hubris, Tock, Redox, Theseus) that explore diverse points in the design space of memory isolation, scheduling, and intralingual safety. We examine the Ferrocene qualified toolchain and its progressive certification under IEC 61508 and ISO 26262, the emerging Safety-Critical Rust Coding Guidelines, and the relationship between Rust's compiler-enforced guarantees and traditional standards like MISRA C and DO-178C. Finally, we identify open problems including the stabilization of allocator APIs for embedded, the maturation of no_std async, tooling gaps in WCET analysis and debugging, and the ecosystem's fragmented hardware support beyond ARM Cortex-M.

The central finding of this survey is that Rust's embedded ecosystem has crossed a threshold of practical viability for a widening class of applications, while significant gaps in tooling, hardware coverage, and safety certification remain. The ecosystem's maturation trajectory suggests that embedded Rust will coexist with rather than replace C for the foreseeable future, with adoption driven primarily by safety-critical applications where the cost of memory-safety defects justifies the investment in new tooling and developer training.

## 1. Introduction

The embedded systems domain presents a distinctive set of constraints that have historically limited language choice. Firmware for microcontrollers must operate without an operating system, without dynamic memory allocation, without exception handling runtimes, and within strict bounds on code size, RAM usage, and execution latency. Real-time systems add temporal constraints: tasks must complete within guaranteed worst-case deadlines, interrupt latencies must be bounded, and scheduling must be deterministic. Safety-critical systems layer regulatory requirements atop these technical constraints, demanding qualified toolchains, traceable requirements, and evidence of absence of entire categories of runtime errors.

C has dominated this space since the 1980s because it provides direct hardware access, predictable compilation to efficient machine code, and minimal runtime requirements. The language's design gives the programmer complete control over memory layout, register access, and calling conventions. This control comes at a well-documented cost: the 2024 ACM CCS study by Sharma et al. found that 72% of vulnerabilities in embedded systems were caused by memory corruption, use-after-free, or type confusion -- all categories of error that C's type system does not prevent [1]. The U.S. Cybersecurity and Infrastructure Security Agency (CISA) and the White House Office of the National Cyber Director have both issued guidance recommending transitions to memory-safe languages for critical infrastructure [2].

Rust addresses this problem through a system of ownership rules, lifetime analysis, and marker traits that collectively enforce memory safety and data race freedom at compile time, with zero runtime overhead. The `#![no_std]` compilation mode strips away the standard library's OS-dependent functionality, leaving only the freestanding `core` library -- a foundation sufficient for bare-metal development on devices with kilobytes of RAM. The language's trait system enables hardware abstraction without dynamic dispatch, and its enum-based error handling avoids the unpredictable latency of exception unwinding.

The embedded Rust ecosystem has matured substantially since the Rust Embedded Working Group's formation in 2018. The embedded-hal 1.0 release in January 2024 stabilized the core hardware abstraction traits [3]. The RTIC framework provides formally analyzable real-time scheduling. Embassy brings async/await to microcontrollers. Ferrocene has achieved IEC 61508 SIL 4 and ISO 26262 ASIL D qualification for the compiler, with SIL 2 certification for a subset of the core library following in December 2025 [4]. The Rust-for-Linux project, after years of contentious debate, was declared no longer experimental at the December 2025 Kernel Maintainers Summit [5].

This survey synthesizes these developments into a coherent picture of embedded Rust's capabilities, limitations, and trajectory. We target an audience of systems engineers evaluating Rust for embedded projects, researchers studying language-level safety guarantees for cyber-physical systems, and toolchain developers working on the ecosystem's open problems.

## 2. Foundations

### 2.1 Embedded Systems: A Taxonomy of Constraints

Embedded systems span an enormous range of capability, from 8-bit microcontrollers with 512 bytes of RAM to multicore application processors running Linux. This survey adopts a three-tier taxonomy that reflects the distinct programming models required at each level.

**Class 1: Bare-metal microcontrollers** (ARM Cortex-M0/M0+, AVR, MSP430, small RISC-V cores). These devices typically have 2-256 KB of flash and 0.5-64 KB of RAM. They run without an operating system, often without a heap allocator, and require direct register manipulation for peripheral access. Interrupt-driven concurrency is the norm. Code size and RAM usage are primary constraints.

**Class 2: RTOS-class microcontrollers** (Cortex-M4/M7, ESP32, larger RISC-V). These devices have 256 KB to several megabytes of flash and 64-512 KB of RAM. They typically run a real-time operating system or concurrency framework with preemptive scheduling, inter-task communication, and possibly a network stack. Hard real-time deadlines are common.

**Class 3: Application-class processors** (Cortex-A, x86_64) running a full OS kernel. These systems have megabytes to gigabytes of RAM and run Linux or a purpose-built OS. The programming model resembles conventional systems programming with additional constraints on latency, reliability, and hardware access.

### 2.2 Real-Time Computing Theory

A real-time system is one in which the correctness of a computation depends not only on its logical result but also on the time at which the result is produced [6]. Hard real-time systems have deadlines whose violation constitutes a system failure (e.g., airbag deployment, engine control). Soft real-time systems tolerate occasional deadline misses with degraded quality (e.g., audio streaming). Firm real-time systems discard late results but do not fail catastrophically.

The feasibility of a real-time schedule depends on worst-case execution time (WCET) analysis -- determining the maximum time a code path can take under all possible inputs and hardware states. WCET analysis requires that code paths be bounded: no unbounded loops, no dynamic memory allocation with unbounded latency, no garbage collection pauses, and no exception unwinding of unpredictable cost. These requirements have historically favored C and Ada, which provide direct control over all runtime behavior.

The Stack Resource Policy (SRP), formalized by Baker in 1991, provides a scheduling discipline for single-processor systems with shared resources [7]. SRP assigns ceiling priorities to resources and requires that a task can only preempt the current task if its priority exceeds the current system ceiling. This guarantees bounded priority inversion (at most one blocking period per task), deadlock freedom, and single-stack execution. SRP is directly implemented by the RTIC framework in Rust, as detailed in Section 4.3.

### 2.3 The Cost of Memory Unsafety in Embedded Systems

Memory safety defects in embedded systems carry consequences beyond those in application software. A buffer overflow in a motor controller can cause physical injury. A use-after-free in a medical device can produce incorrect readings. A data race in an automotive ECU can cause unpredictable actuator behavior. The 2024 empirical study by Sharma et al. analyzed 2,836 Rust embedded crates and 6,408 total embedded Rust software artifacts, finding that 43.88% of embedded Rust crates contain unsafe code -- nearly double the 23.6% rate in general-purpose Rust libraries [1]. This elevated unsafe usage reflects the inherent requirement for hardware register access, DMA buffer management, and FFI calls to vendor libraries.

The economic case for memory safety in embedded systems is sharpened by product liability, recall costs, and certification requirements. The DO-178C standard for airborne software, IEC 61508 for industrial safety, and ISO 26262 for automotive functional safety all require evidence of absence of entire categories of runtime errors. Traditional approaches achieve this evidence through exhaustive testing, code review, and static analysis against coding standards like MISRA C. Rust's compiler-enforced guarantees offer the possibility of achieving a significant portion of this evidence automatically, potentially reducing certification costs while increasing actual safety.

## 3. Taxonomy of Approaches

### 3.1 The Crate Hierarchy: core, alloc, std

Rust's standard library is factored into three layers with distinct dependency requirements [8].

**`core`** (libcore) is the platform-agnostic foundation. It provides fundamental types (Option, Result, integer and float primitives), iterators, slices, string slices, formatting infrastructure, and essential traits (Copy, Clone, Debug, Display). Critically, core requires no OS services, no heap allocation, and no runtime initialization. It is the sole library available in `#![no_std]` programs that do not opt into allocation.

**`alloc`** (liballoc) provides types requiring dynamic memory allocation: Vec, String, Box, Rc, Arc, BTreeMap, and related collections. Using alloc in a no_std program requires the developer to provide a global allocator implementing the GlobalAlloc trait and, on nightly Rust, an allocation error handler via the `#[alloc_error_handler]` attribute. The alloc_error_handler remains unstable as of early 2026, representing one of the most significant gaps in the stable no_std story [9].

**`std`** (libstd) re-exports everything from core and alloc and adds OS-dependent functionality: filesystem access, networking, threading, process management, and environment interaction. Programs using std require a hosted environment with an operating system.

The `#![no_std]` attribute instructs the compiler to link against core instead of std, enabling compilation for bare-metal targets. A program can incrementally opt into alloc by defining a global allocator, gaining access to heap-allocated collections while remaining OS-independent. This graduated layering is central to Rust's embedded viability: the same language and type system that builds web servers can target a Cortex-M0 with 4 KB of RAM, with the compiler enforcing the constraints of each tier.

### 3.2 Bare Metal Programming Primitives

A minimal bare-metal Rust program requires several departure points from the standard compilation model [10].

**`#![no_main]`** disables the standard runtime entry point. The Rust compiler normally inserts startup code that calls the C runtime's `main()` through a shim; `#![no_main]` removes this, giving the developer complete control over the entry point. The actual entry point is typically a reset handler placed at a specific memory address via linker section attributes:

```rust
#[link_section = ".vector_table.reset_vector"]
#[no_mangle]
pub static __RESET_VECTOR: fn() -> ! = reset_handler;
```

**Panic handlers** are mandatory in all Rust programs. In no_std programs, the developer must provide a `#[panic_handler]` function with signature `fn(&PanicInfo) -> !`. Common implementations include entering an infinite loop (panic-halt), executing a breakpoint instruction for debugger attachment (panic-semihosting), or triggering a system reset. The divergent return type `!` reflects the Rust type system's requirement that panic is a non-returning operation.

**Linker scripts** define the memory layout, mapping program sections (.text, .rodata, .data, .bss) to physical memory regions (flash, SRAM). The reset handler must zero the BSS section and copy initialized data from flash to RAM before calling application code -- the same initialization sequence required in C, but made explicit rather than hidden in a C runtime.

**Memory-mapped I/O** is accessed through raw pointer operations to hardware register addresses. Rust's volatile read/write functions (`core::ptr::read_volatile`, `core::ptr::write_volatile`) prevent the compiler from eliding or reordering register accesses, analogous to C's `volatile` qualifier but applied at the operation level rather than the type level.

### 3.3 The Layered Hardware Abstraction Architecture

The Rust embedded ecosystem is organized in a layered architecture that separates concerns and maximizes code reuse across hardware platforms [11].

**Layer 1: Peripheral Access Crates (PACs)** are the lowest abstraction layer, providing type-safe access to a microcontroller's registers. PACs are typically auto-generated from the manufacturer's SVD (System View Description) files using the svd2rust tool [12]. SVD files are XML documents describing every register, bitfield, and enumerated value in a microcontroller's peripheral set. svd2rust transforms these into Rust structs with methods that enforce correct field widths, valid enumeration values, and proper read/write access modes at compile time. The stm32-rs project, for example, provides PACs for the entire STM32 microcontroller family, applying community-maintained patches to correct errors in vendor-supplied SVD files. svd2rust supports Cortex-M, MSP430, RISC-V, and Xtensa architectures.

**Layer 2: Hardware Abstraction Layer (HAL) crates** build on PACs to provide higher-level, ergonomic interfaces for peripheral configuration and use. HAL crates implement the traits defined by the embedded-hal standard, enabling portable driver development. A HAL's GPIO interface, for example, uses Rust's type system to encode pin states (Input, Output, Alternate Function) at the type level, preventing at compile time the misconfiguration errors that are common sources of embedded bugs.

**Layer 3: Board Support Packages (BSPs)** abstract an entire development board, combining HAL configuration with board-specific pin mappings, clock configurations, and peripheral initialization. A BSP for the BBC micro:bit, for example, provides named access to the LED matrix, buttons, and accelerometer without requiring knowledge of the nRF52833's pin assignments.

**Layer 4: Platform-agnostic drivers** are generic libraries written against embedded-hal traits, portable across any hardware with a conforming HAL implementation. A driver for an SSD1306 OLED display, for instance, works identically on an STM32F4, an nRF52840, and an ESP32, because it depends only on the I2c and SpiDevice traits rather than any hardware-specific type.

### 3.4 The embedded-hal 1.0 Stabilization

The release of embedded-hal 1.0 in January 2024 was a watershed moment for the Rust embedded ecosystem [3]. After years of 0.x releases with frequent breaking changes, the 1.0 release stabilized the core abstraction traits and committed to semantic versioning compatibility for future 1.x releases. Key changes included unification of previously fragmented trait hierarchies: the multiple I2C traits (Read, Write, WriteRead, WriteIter, WriteIterRead, Transactional, TransactionalIter) were consolidated into a single I2c trait, and the multiple SPI traits (Write, WriteIter, Transfer, Transactional) were unified into SpiBus and SpiDevice [3].

The 1.0 release introduced three execution model families as separate crates: embedded-hal for blocking synchronous operations, embedded-hal-nb for non-blocking polling using the `nb` crate's WouldBlock pattern, and embedded-hal-async for async/await-based asynchronous operations. The async variant became practical with Rust 1.75's stabilization of async trait methods, enabling zero-allocation async hardware access suitable for bare-metal environments.

The SpiDevice trait introduced first-class support for SPI bus sharing between multiple devices with independent chip-select pins, solving a long-standing pain point in embedded driver development where unrelated drivers needed to coordinate access to a shared bus.

## 4. Analysis

### 4.1 Memory Management Without an Allocator

Embedded systems frequently operate without a heap allocator, either because the device lacks sufficient RAM or because dynamic allocation introduces unpredictable latency incompatible with real-time constraints. Rust's no_std ecosystem provides a rich set of statically-allocated data structures that eliminate heap allocation while preserving familiar collection APIs [13].

The **heapless** crate is the cornerstone of allocator-free embedded Rust. It provides Vec, String, Deque, LinearMap, BinaryHeap, and sorted/indexed variants, all backed by fixed-size inline storage specified via const generic parameters. A `heapless::Vec<u8, 64>` allocates its 64-byte backing array inline -- on the stack, in a static variable, or embedded within another struct -- with no heap allocation at any point. Operations like `push` are truly O(1) with bounded execution time, unlike `std::vec::Vec::push` which is amortized O(1) with occasional O(n) reallocations. This bounded worst-case behavior is essential for WCET analysis in hard real-time systems [13].

**BBQueue** provides a statically-allocated single-producer single-consumer (SPSC) queue optimized for DMA transfers and batch processing [14]. Unlike traditional item-at-a-time queues, BBQueue operates on contiguous slices, allowing a producer to request a chunk of writable memory and a consumer to read a chunk of available data. This "slice-at-a-time" model pairs naturally with DMA controllers that transfer contiguous memory regions, enabling zero-copy data flow from peripheral to application code.

The **embedded-alloc** crate provides a simple bump allocator for environments that need dynamic allocation but can tolerate its limitations. The allocator manages a statically-defined memory region and supports allocation but not individual deallocation -- memory can only be freed by resetting the entire allocator. For more capable allocation, the **talc** crate provides a fast, flexible allocator designed for no_std and WebAssembly environments, supporting standard allocation and deallocation with configurable arena sizes.

Compile-time memory guarantees are a distinctive advantage of Rust's approach. When all data structures have statically-known sizes, the compiler can verify at build time that a program's total memory usage fits within the target device's RAM. Stack overflow remains possible, but tools like `flip-link` (which places the stack below rather than above static data) convert stack overflows from silent corruption into hardware faults that can be detected and handled.

### 4.2 Device Driver Patterns

Rust's type system enables driver design patterns that are impossible or impractical in C, transforming categories of runtime error into compile-time violations.

**Typestate programming** encodes peripheral state in the type system. A UART peripheral, for example, might transition through types Uart<Unconfigured>, Uart<Configured>, and Uart<Enabled>, with methods available only in appropriate states. Attempting to transmit data on an unconfigured UART is a compile error, not a runtime check. This pattern is pervasive in embedded Rust HALs and eliminates the "initialize before use" class of bugs that are endemic in C driver code.

**SPI, I2C, and UART abstractions** in embedded-hal 1.0 define standardized trait interfaces that separate bus access from device logic. The SpiDevice trait, for instance, manages chip-select assertion and bus access coordination, allowing multiple independent drivers to share a physical SPI bus without awareness of each other. This composability enables an ecosystem of portable sensor and actuator drivers that work across any compliant HAL implementation.

**DMA handling** presents a particular challenge for Rust's ownership model, because a DMA transfer involves two concurrent actors (the processor and the DMA controller) accessing the same memory buffer [15]. The Embedonomicon documents a pattern using ownership transfer: a Transfer<B> struct takes ownership of both the buffer and the peripheral, preventing any other code from accessing the buffer while the DMA controller is using it. Compiler fences with Release ordering before starting the transfer and Acquire ordering after completion prevent the compiler from reordering memory operations across the DMA boundary. The buffer must have a 'static lifetime to prevent stack deallocation during an active transfer, and Pin<B> guarantees address stability. This pattern achieves memory-safe DMA with zero runtime overhead, encoding the safety invariants in the type system rather than relying on programmer discipline.

**Zero-copy driver design** builds on these primitives to eliminate unnecessary memory copies in the data path. A sensor driver, for example, can request a DMA transfer directly into an application buffer, with the ownership transfer pattern guaranteeing exclusive access during the transfer. Double-buffering (ping-pong) patterns allow hardware to fill one buffer while the application processes another, with ownership swapping at each iteration.

The **usb-device** crate provides a framework for implementing USB device functionality on microcontrollers [16]. It defines a UsbBus trait for hardware-specific USB peripheral drivers and a UsbClass trait for USB device classes (CDC-ACM serial, HID, Mass Storage). This separation allows the same USB serial implementation to work across STM32, RP2040, and other microcontrollers by swapping only the UsbBus implementation.

### 4.3 RTIC: Real-Time Interrupt-driven Concurrency

RTIC is a concurrency framework that maps the Stack Resource Policy directly onto hardware interrupt controllers, providing compile-time guarantees of deadlock freedom and data race absence with minimal runtime overhead [17]. The framework's design philosophy is that scheduling should be performed by hardware, not software: task priorities are encoded as interrupt priority levels in the Nested Vectored Interrupt Controller (NVIC) on ARM Cortex-M, with context switching handled entirely by the hardware's interrupt entry and exit mechanisms.

**Architecture.** An RTIC application is defined declaratively through the `#[app]` macro, which specifies shared resources, local resources, and tasks. Tasks come in two varieties: hardware tasks bound to specific interrupt vectors, and software tasks scheduled by an async executor at a specified priority level. The framework analyzes the task-resource dependency graph at compile time under SRP theory and generates optimized code with the following properties: guaranteed race-free resource access, deadlock-free execution, a single shared call stack for all tasks, and wait-free access to resources from the highest-priority task accessing each resource [17].

**Priority ceiling protocol.** When a task accesses a shared resource, RTIC raises the system ceiling to the resource's ceiling priority (the maximum priority of any task that accesses the resource). On Cortex-M, this maps to writing the BASEPRI register, which masks all interrupts at or below the specified priority. This critical section requires only 2-3 machine instructions and is computed entirely at compile time. The result is bounded priority inversion: a low-priority task holding a resource can block a higher-priority task for at most the duration of one critical section, and the blocking is analytically bounded for WCET purposes [7].

**Performance characteristics.** The MDPI Sensors study measured RTIC's total interrupt-to-task scheduling latency at 4.01 microseconds on the nRF52840-DK (speed-optimized), compared to 9.83 microseconds for Embassy, 62.69 microseconds for Tock (cooperative scheduling), and 83.42 microseconds for Tock (round-robin) [18]. RTIC's memory footprint for a minimal LED blink application was 6,904 bytes, compared to 43,964 bytes for Embassy and 51,956 bytes for a minimal Tock kernel. These measurements confirm RTIC's position as the most resource-efficient option for hard real-time applications.

**WCET analyzability.** RTIC's task model is explicitly designed for WCET analysis. Tasks execute run-to-completion (no blocking within a task), critical sections have compile-time-bounded duration, and the scheduling behavior is entirely deterministic given the task priorities and resource ceilings. The Rauk tool provides measurement-based WCET analysis for RTIC applications, using the KLEE symbolic execution engine to generate test vectors for path coverage [19].

**Comparison with FreeRTOS.** FreeRTOS provides a traditional RTOS model with dynamic task creation, software timers, and preemptive priority scheduling. While mature and widely deployed, FreeRTOS requires careful manual management of synchronization primitives, offers no compile-time guarantees against data races or deadlocks, and incurs overhead from software-managed context switching and dynamic memory allocation for task stacks. Rust bindings to FreeRTOS exist but sacrifice Rust's safety guarantees because the concurrency model is implemented in C. RTIC provides comparable real-time scheduling capabilities with stronger safety properties and lower overhead, at the cost of a more constrained programming model (static task set, no dynamic task creation) [17].

### 4.4 Embassy: Async Embedded Rust

Embassy is a modern embedded framework that brings Rust's async/await paradigm to microcontrollers, providing cooperative multitasking with interrupt-driven wake-up and hardware-specific HAL implementations [20].

**Architecture.** Embassy comprises several crates with distinct responsibilities. **embassy-executor** provides the async task scheduler, which allocates a fixed number of tasks at startup and runs them cooperatively within priority-level executors. When no task is ready to execute, the executor puts the processor to sleep (via WFI on ARM), and tasks are woken by hardware interrupts with zero busy-loop polling. **embassy-time** provides a timer abstraction with alarm and ticker primitives. **embassy-stm32** and **embassy-nrf** provide comprehensive HAL implementations for STM32 and Nordic nRF microcontroller families respectively, implementing both blocking (embedded-hal) and async (embedded-hal-async) trait interfaces.

**Async on microcontrollers.** Embassy's key innovation is demonstrating that Rust's async/await machinery -- which compiles to state machines with no heap allocation -- is a natural fit for embedded concurrency. Each `async fn` compiles to a state machine that captures only the local variables needed across yield points, with the entire state machine allocated inline. This is fundamentally different from thread-based concurrency, which requires a separate stack per thread (typically 1-4 KB each on Cortex-M), allowing many more concurrent tasks within the same memory budget.

**Cooperative vs. preemptive scheduling.** Tasks within a single Embassy executor run cooperatively, meaning a long-running computation can delay other tasks at the same priority level. To provide preemption, Embassy supports multiple executors at different interrupt priority levels: a higher-priority executor preempts a lower-priority one through the hardware interrupt mechanism, identical to RTIC's approach. This hybrid model combines the efficiency of cooperative scheduling (no context-switch overhead between same-priority tasks) with the responsiveness of preemptive scheduling (guaranteed preemption across priority levels).

**HAL coverage.** Embassy provides the most comprehensive async HAL implementations in the embedded Rust ecosystem. embassy-stm32 covers all STM32 microcontroller families with async drivers for GPIO, UART, SPI, I2C, USB, Ethernet, ADC, DAC, timers, DMA, and more. embassy-nrf covers the Nordic nRF52, nRF53, nRF54, and nRF91 series. These HALs implement interrupt-driven I/O with zero-copy DMA transfers, allowing peripheral operations to proceed asynchronously while the processor sleeps or executes other tasks.

**Comparison with RTIC.** Embassy and RTIC represent complementary rather than competing approaches. RTIC excels in applications requiring minimal overhead, formal real-time analysis, and strict preemptive scheduling -- the characteristics needed for hard real-time control systems. Embassy excels in applications with many concurrent I/O operations (sensor polling, network communication, display updates) where the async/await programming model reduces complexity compared to explicit state machines. For moderate-complexity projects, the choice is largely one of programming model preference, as both achieve comparable performance. RTIC's official documentation acknowledges this complementarity and notes that Embassy's async executors can be used within RTIC's task structure [21].

### 4.5 Rust in the Linux Kernel

The Rust-for-Linux project represents the most visible and contentious effort to introduce Rust into an existing C codebase. Its trajectory illuminates both the technical promise and the sociopolitical challenges of introducing memory safety into established systems.

**Technical architecture.** Rust support in the Linux kernel is built around the `kernel` crate, which provides safe abstractions over the kernel's C APIs [22]. Rather than rewriting existing C code, the approach wraps unsafe C interfaces in safe Rust types that enforce correct usage through the type system. A `pci::Device` struct, for example, provides safe methods for reading and writing PCI configuration space, eliminating raw pointer manipulation. Synchronization primitives (Mutex, SpinLock) are implemented in Rust wrappers that leverage the type system to prevent data races at compile time. The kernel's Rust support is compiled alongside the C code using the same build system, with C-Rust interoperability through carefully designed FFI boundaries.

**Timeline and milestones.** Initial Rust support was merged in Linux 6.1 (December 2022) as an experimental feature. The first Rust drivers were accepted into Linux 6.8 (March 2024). By April 2025, the kernel contained approximately 25,000 lines of Rust code alongside 34 million lines of C. Android 16 devices shipping on the 6.12 kernel include the ashmem memory allocator built in Rust, marking the first production deployment of Rust kernel code to millions of devices [5]. At the December 2025 Kernel Maintainers Summit in Tokyo, the top Linux maintainers reached consensus that Rust is no longer experimental, with the "experimental" tag being removed [23].

**Political and technical challenges.** The integration has been marked by significant friction between the Rust and C kernel communities. Wedson Almeida Filho, a primary maintainer of the Rust-for-Linux project, resigned in September 2024 citing frustration with "nontechnical nonsense" -- specifically, resistance from established C maintainers who objected to providing information needed for Rust bindings [24]. Christoph Hellwig, a veteran DMA subsystem maintainer, opposed Rust integration in his subsystem, characterizing multi-language maintenance as an unacceptable burden, and ultimately stepped down as DMA mapping maintainer rather than work with Rust after Linus Torvalds overruled his objection [25]. In February 2025, a clash between Hellwig and Asahi Linux developer Hector Martin over a Rust driver patch escalated to social media, with Torvalds dismissing Martin's approach as "brigading" [25]. Alex Gaynor, another Rust-for-Linux maintainer, stepped down in December 2025.

**Subsystem coverage gaps.** While support for character devices, platform drivers, and PCI drivers represents significant progress, many kernel subsystems lack safe Rust abstractions. The networking stack, filesystem implementations (ext4, Btrfs, XFS), graphics drivers, and scheduler internals present substantial challenges due to their complexity and the deeply intertwined nature of their C implementations. Greg Kroah-Hartman noted that with misc driver bindings complete and PCI/platform driver support arriving, "almost all driver subsystems" can begin accepting Rust drivers, but the path from "can accept" to "fully abstracted" remains long [26].

### 4.6 Operating System Development in Rust

Several operating systems written primarily or entirely in Rust explore different points in the embedded OS design space.

**Hubris** (Oxide Computer Company) is a microkernel RTOS for deeply-embedded Cortex-M systems, designed for high-reliability applications like server management controllers [27]. Its kernel is approximately 2,000 lines of Rust, handling only task scheduling, memory isolation via the Memory Protection Unit (MPU), and inter-process communication (IPC). All driver code runs in unprivileged tasks with MPU-enforced isolation, enabling individual task restart on failure without system reboot. The system's task set is defined entirely at build time -- no dynamic task creation, no dynamic memory allocation, no runtime configuration. This static architecture eliminates entire categories of runtime failure and makes the system amenable to exhaustive analysis. Hubris is used in production in Oxide Computer's server hardware.

**Tock** is a secure embedded OS for Cortex-M and RISC-V microcontrollers, originating from Stanford and the University of Virginia [28]. Tock's distinctive contribution is a two-tier isolation model: kernel components ("capsules") are isolated at compile time using Rust's type and module systems, while userland processes are isolated at runtime using the hardware MPU. Capsules operate in the kernel's address space with zero overhead for isolation, but can only access resources explicitly granted through Rust's visibility rules. This architecture allows sensor drivers, networking stacks, and virtualization layers to be mutually isolated with no runtime cost inside the kernel while providing traditional process isolation for untrusted application code. Tock supports multiple pluggable schedulers (round-robin, priority, MLFQ, cooperative) and a grant-based memory sharing model for efficient kernel-userland data transfer.

**Redox OS** is a Unix-like operating system written almost entirely in Rust, featuring a microkernel architecture with drivers, filesystems, and network stacks running as user-space processes [29]. As of late 2025, Redox is working on running the Servo web engine and transitioning to the upstream Rust compiler. The project's ambition is to demonstrate that a fully Rust-based general-purpose OS is viable, though it remains primarily a research and hobbyist platform.

**Theseus OS** explores "intralingual design" -- the principle that operating system safety and resource management should be achieved through programming language mechanisms rather than hardware protection [30]. Theseus leverages Rust's ownership system and affine types to manage OS resources (memory, CPU time, file descriptors) with the same compile-time discipline that Rust applies to memory. This approach aims to close the "semantic gap" between compiler and hardware, enabling safe live evolution (hot-swapping of OS components) without the overhead of address-space isolation. Theseus is a research prototype exploring the limits of language-based OS safety.

### 4.7 Safety-Critical Systems and Certification

The adoption of Rust in safety-critical domains requires qualified toolchains, coding standards, and certification evidence that meets the requirements of functional safety standards.

**Ferrocene** is the first Rust compiler toolchain qualified for safety-critical applications, developed by Ferrous Systems and certified by TÜV SÜD [4]. As of February 2026, Ferrocene holds qualifications for ISO 26262 (ASIL D, the highest automotive integrity level), IEC 61508 (SIL 4, the highest industrial safety integrity level), and IEC 62304 (Class C, the highest medical device software class). Ferrocene 25.11.0 (December 2025) included the first TÜV SÜD certification of a subset of the Rust core library to IEC 61508 SIL 2, covering 2,903 functions. Ferrocene 26.02.0 (February 2026) extended this to ISO 26262 ASIL B and expanded coverage to 5,169 certified core library functions [31]. Ferrocene supports Armv7E-M and Armv8-A targets, covering the most common embedded and automotive processor architectures.

**Coding guidelines.** The Rust Foundation's Safety-Critical Rust Consortium is developing coding guidelines modeled on the approach of MISRA C but adapted to Rust's language semantics [32]. MISRA published Addendum 6 to MISRA C:2025, assessing the applicability of MISRA C guidelines to Rust and identifying areas where Rust's language-level enforcement supersedes the need for external rule checking. Research by Reif et al. found that approximately 90% of what MISRA C checks through external static analysis is enforced by Rust's compiler, with the remaining 10% requiring supplementary guidelines for unsafe code usage, naming conventions, and documentation practices [33]. The emerging consensus is on a "conservative subset" of Rust for safety-critical applications: no dynamic allocation, restricted use of unsafe, deterministic error handling, and controlled use of advanced type-level features.

**MC/DC coverage.** Modified Condition/Decision Coverage (MC/DC) is required by DO-178C at Design Assurance Level A for avionics software. The Safety-Critical Rust Consortium established a 2026 Rust Project Goal to collaborate on MC/DC support in the Rust compiler's code coverage instrumentation, with implementation led by companies with direct aviation industry requirements [34].

**Formal verification.** Rust's type system provides compile-time proofs of memory safety and data race freedom, but does not guarantee functional correctness. Tools like Kani (Amazon), Creusot, and Prusti provide model checking and deductive verification for Rust code, enabling proofs that functions satisfy their specifications. These tools complement Ferrocene's compiler qualification by providing evidence of correct behavior in addition to correct compilation.

**Relationship to SPARK.** Ada/SPARK remains the gold standard for formally verified embedded software, with SPARK providing mathematical proof of absence of runtime errors (array bounds violations, null dereferences, arithmetic overflow) through its proof system [35]. Rust and SPARK address overlapping but distinct safety concerns: Rust prevents memory safety and data race violations through the type system, while SPARK proves absence of a broader class of runtime errors through formal contracts and automated theorem proving. SPARK's proofs are more comprehensive but require significant annotation effort; Rust's guarantees are narrower but automatic. In practice, both are being used in safety-critical domains, with Rust gaining traction in automotive and industrial applications through Ferrocene, and SPARK maintaining its position in aerospace and defense through AdaCore's toolchain.

### 4.8 Real-Time Constraints and Rust

Rust's suitability for hard real-time systems depends on the predictability of its compilation and runtime behavior.

**Favorable characteristics.** Rust compiles to native machine code through LLVM with no garbage collector, no runtime exceptions (panics can be configured to abort), and no hidden allocations in no_std mode. Error handling through Result types compiles to branch instructions with deterministic latency. Pattern matching compiles to jump tables or decision trees with bounded depth. Trait dispatch is monomorphized (resolved at compile time) for generic code, avoiding the overhead and unpredictability of virtual method tables. These properties make Rust's generated code as amenable to WCET analysis as C's.

**Problematic characteristics.** Several Rust features present challenges for real-time analysis [36]. Implicit Drop semantics mean that destructors are called at scope exit, potentially introducing latency in unexpected locations. The implicit nature of drop is particularly concerning because the programmer may not realize that a complex destructor chain is executing at a particular point in the code. Monomorphization of generic functions can cause instruction cache pressure by generating multiple specialized copies of the same function, complicating WCET cache analysis. The critical-section crate, widely used in the embedded ecosystem, can introduce global interrupt disabling from any dependency, creating latency hazards that are not visible in the application code. Cooperative async/await introduces the "long task" problem: a task that does not yield promptly can delay other tasks at the same priority level, and there is no compiler enforcement of yield frequency.

**Lock-free data structures** in Rust rely on compare-and-swap (CAS) operations that can fail under contention, requiring retries. While lock-free algorithms guarantee system-wide progress (some thread always makes progress), they do not guarantee per-thread progress (a specific thread may be delayed indefinitely). This distinction between lock-free and wait-free is critical for hard real-time systems where individual task deadlines must be met [36].

**Interrupt latency** in RTIC and Embassy depends on the hardware's interrupt response time plus any software overhead for context saving and priority management. RTIC's hardware-accelerated approach achieves minimal latency because the Cortex-M hardware handles register saving and priority arbitration. Embassy adds a thin software layer for async task dispatch but remains well within typical real-time requirements, as demonstrated by the 9.83 microsecond latency measurement on the nRF52840 [18].

## 5. Comparative Synthesis

### 5.1 Language Comparison for Embedded Systems

The following table synthesizes the trade-offs between languages commonly used or proposed for embedded systems development.

| Dimension | C | C++ (Embedded) | Rust (no_std) | Ada/SPARK | Zig | MicroPython |
|---|---|---|---|---|---|---|
| Memory safety | None (manual) | Partial (RAII, smart pointers) | Compile-time enforced | Strong typing; SPARK adds formal proof | Compile-time checks, manual management | GC-managed |
| Data race prevention | None | None (by default) | Compile-time enforced | Tasking model with protected objects | None | GIL eliminates in practice |
| Heap-free operation | Native | Possible with discipline | Native (no_std) | Native (no runtime in Ravenscar) | Native | Not practical |
| WCET analyzability | Excellent | Good (if exceptions disabled) | Good (with caveats on generics, drop) | Excellent (SPARK) | Good | Poor |
| Ecosystem maturity | Decades of tooling, libraries | Extensive | Growing rapidly; embedded-hal 1.0 stable | Mature but niche | Early stage | Extensive for prototyping |
| Safety certification | MISRA C, DO-178C, IEC 61508 | MISRA C++, AUTOSAR C++ | Ferrocene (IEC 61508 SIL 4, ISO 26262 ASIL D) | DO-178C DAL A, IEC 61508 SIL 4 | None | None |
| Hardware support | Universal | Universal | ARM Cortex-M strong; RISC-V growing; others limited | Niche (AdaCore targets) | Growing (LLVM targets) | Limited MCU support |
| C interoperability | N/A | Native | FFI (requires unsafe) | Pragma Import/Export | Native C ABI, comptime @cImport | ctypes, FFI |
| Learning curve | Low for C programmers | Moderate | Steep (borrow checker) | Steep (different paradigm) | Low to moderate | Very low |
| Binary size (minimal) | Hundreds of bytes | Kilobytes (with runtime) | Kilobytes (comparable to C with optimization) | Kilobytes | Hundreds of bytes | Not applicable (interpreter required) |
| Toolchain cost | Free (GCC, Clang) | Free (GCC, Clang) | Free (rustc); Ferrocene is commercial | Commercial (AdaCore GNAT Pro) | Free | Free |

### 5.2 Framework Comparison for Embedded Rust

| Dimension | RTIC | Embassy | Tock | Hubris |
|---|---|---|---|---|
| Type | Concurrency framework | Async framework + HAL | Full OS | Microkernel RTOS |
| Scheduling model | Preemptive, SRP-based | Cooperative (per executor) + preemptive (across executors) | Pluggable (round-robin, priority, MLFQ, cooperative) | Priority-based + cooperative within task |
| Memory isolation | None (single address space) | None (single address space) | MPU-based process isolation + Rust-based capsule isolation | MPU-based task isolation |
| Interrupt latency (nRF52840) | 4.01 us | 9.83 us | 62.69-103.41 us | Not independently measured |
| Memory footprint (LED blink) | 6,904 bytes | 43,964 bytes | 51,956-235,236 bytes | Not independently measured |
| IPC mechanism | Shared resources with priority ceilings | Channels, signals | System calls, shared memory grants | Synchronous messages, memory leases |
| Network stack | None (external) | smoltcp integration | Custom (6LoWPAN, UDP) | smoltcp-based |
| Formal analysis | SRP-based, WCET via Rauk | Limited | Limited | Static task model amenable to analysis |
| Hardware targets | ARM Cortex-M, RISC-V | STM32, nRF, RP2040, ESP32, others | Cortex-M, RISC-V | ARM Cortex-M only |
| Best suited for | Hard real-time control, minimal footprint | I/O-heavy applications, rapid development | Multi-tenant embedded, security-critical | High-reliability deeply-embedded |

### 5.3 Ecosystem Maturity Assessment

The 2024 study by Sharma et al. quantified the embedded Rust ecosystem's hardware coverage gaps [1]. Peripheral Access Crates exist for only 37% of the 43 MCU families surveyed. HAL implementations cover 32% of families. Board Support Packages address 44% of boards. Coverage concentrates heavily on ARM Cortex-M, with RISC-V, Xtensa, AVR, and MSP430 receiving substantially less attention. Of the 6,408 embedded Rust crates analyzed, 43.88% contained unsafe code, and approximately 70% used FFI-incompatible types that complicate interoperability with existing C codebases.

Static analysis tools showed poor performance on embedded Rust: 40-90% false positive rates, with complete failure on 42% of crates due to toolchain incompatibilities. C-to-Rust conversion tools failed on 93.8% of embedded RTOS codebases tested, generating syntactically invalid code on 90% of the attempts that did not outright fail [1]. These findings indicate that while the core infrastructure (embedded-hal, RTIC, Embassy) is mature, the broader ecosystem of tooling, hardware support, and migration pathways remains inadequate for many practical deployment scenarios.

## 6. Open Problems & Gaps

### 6.1 Stable no_std Async and Allocator APIs

The `#[alloc_error_handler]` attribute, required to use the alloc crate (and thus Vec, String, Box) in no_std programs, remains unstable [9]. This forces embedded developers who need dynamic allocation to either use nightly Rust (unacceptable for production deployments) or avoid the standard allocation types entirely. The Allocator trait in `std::alloc`, which would enable per-collection allocator selection (essential for embedded systems with multiple memory regions), is also unstable with no clear stabilization timeline.

Async/await is available in no_std on stable Rust, but the inability to use global allocators on stable limits the design space for async executors. Embassy works around this by pre-allocating all task storage at startup, but this requires knowing the maximum number of tasks at compile time.

### 6.2 WCET Analysis Tooling

While Rust's compilation model is theoretically amenable to WCET analysis, practical tooling is limited. The Rauk tool provides measurement-based WCET analysis for RTIC applications but is a research prototype, not a production tool [19]. Commercial WCET analysis tools (aiT, RapiTime, Bound-T) target C and Ada but have no Rust support. The monomorphization of generics, implicit destructors, and LLVM's optimization passes (which can radically transform code structure) create challenges for both static and measurement-based WCET analysis that do not exist for C programs.

### 6.3 Hardware Coverage Beyond ARM Cortex-M

The embedded Rust ecosystem's concentration on ARM Cortex-M leaves significant gaps in other architectures. RISC-V support is growing but lacks the breadth of HAL implementations and board support packages available for STM32 and nRF. AVR support exists but is less mature. Xtensa (ESP32) is well-supported through the esp-rs project but represents a special case driven by Espressif's investment. Architectures common in automotive (Infineon AURIX TriCore), industrial (TI C2000), and aerospace (LEON SPARC) applications have minimal or no Rust ecosystem support.

### 6.4 Debugging and Tooling

The **probe-rs** project has emerged as the primary debugging toolset for embedded Rust, reaching version 0.31.0 in January 2026 [37]. probe-rs supports SWD and JTAG debugging through multiple probe types (DAPLink, ST-Link, J-Link, FTDI, ESP32 USB JTAG), implements the Debug Adapter Protocol for VS Code integration, and provides flash programming and real-time trace capabilities. Despite significant progress, probe-rs lacks feature parity with mature C debugging ecosystems: advanced trace analysis (ETM, ITM correlation), RTOS-aware debugging (viewing task states and call stacks across tasks), and integration with commercial IDEs used in automotive and aerospace development remain limited.

The embedded Rust debugging experience also suffers from Rust's compilation model: optimized Rust code frequently has poor debug information due to aggressive inlining, monomorphization, and LLVM optimization passes that eliminate variables and merge code paths. Debug builds are often impractically large for resource-constrained targets, creating a debugging gap where the code that fits on the device is difficult to debug and the code that is debuggable does not fit.

### 6.5 A MISRA-like Rust Subset

While the Safety-Critical Rust Consortium is developing coding guidelines, no equivalent of MISRA C exists for Rust [32]. MISRA Addendum 6 maps MISRA C guidelines to Rust, finding that approximately 90% are enforced by the compiler, but the remaining 10% -- governing unsafe code usage, documentation, naming conventions, and tool qualification -- requires a dedicated Rust-specific standard. The absence of such a standard is a barrier to adoption in regulated industries where assessors and certification authorities expect documented coding standards with tool-enforced compliance.

### 6.6 Kernel Subsystem Abstractions

The Rust-for-Linux project has established the pattern for safe kernel abstractions but covers only a fraction of the kernel's API surface. Networking, filesystems, the scheduler, graphics subsystems, and many specialized driver subsystems lack Rust bindings. The political dimension adds friction: subsystem maintainers must agree to support Rust bindings, and some have explicitly refused. The December 2025 consensus that Rust is "no longer experimental" removes a symbolic barrier but does not resolve the practical challenge of convincing individual maintainers to accept the maintenance burden of dual-language subsystems [24].

### 6.7 Formal Verification for Embedded Rust

Current formal verification tools for Rust (Kani, Creusot, Prusti) target general-purpose Rust and have limited support for no_std code, hardware register access, and interrupt-driven concurrency. Verifying that an embedded Rust program satisfies its real-time requirements -- not just memory safety but temporal correctness -- requires integration of WCET analysis, schedulability analysis, and functional verification that does not currently exist in a unified toolchain.

## 7. Conclusion

Rust's embedded ecosystem has reached a point of practical viability that was speculative five years ago. The embedded-hal 1.0 stabilization provides a durable abstraction layer. RTIC delivers formally analyzable real-time scheduling with performance that matches or exceeds traditional RTOS approaches. Embassy brings the ergonomic benefits of async/await to microcontrollers without sacrificing the constraints of bare-metal deployment. Ferrocene's progressive certification under IEC 61508 and ISO 26262 removes the "no qualified toolchain" objection that previously blocked Rust from regulated industries. The Linux kernel's acceptance of Rust as a permanent, non-experimental language validates Rust's systems programming credentials at the highest level of visibility.

The gaps are real and substantial. Hardware coverage concentrates on ARM Cortex-M. The allocator API and alloc error handler remain unstable on stable Rust. WCET analysis tooling lags far behind what is available for C. The ecosystem's 43.88% unsafe code rate in embedded crates indicates that hardware access inherently requires operating outside Rust's safety guarantees, and the quality and correctness of that unsafe code is not systematically verified. Debugging tooling, while improving rapidly through probe-rs, does not match the maturity of the C embedded debugging ecosystem. No MISRA-equivalent coding standard exists for Rust. And the political dynamics of introducing Rust into established C codebases, as demonstrated by the Linux kernel experience, are a genuine barrier to adoption that technical merit alone cannot resolve.

The trajectory suggests that Rust will not replace C in embedded systems in any foreseeable timeframe. The installed base of C firmware, the universal hardware support of C compilers, and the deep familiarity of embedded engineers with C create an inertia that no language has overcome in four decades. What Rust offers is a credible alternative for new projects where the cost of memory-safety defects justifies the investment in new tooling, training, and ecosystem development. Safety-critical applications in automotive, industrial, medical, and aerospace domains -- where certification costs can dwarf development costs, and where a single memory corruption vulnerability can trigger recalls affecting millions of devices -- represent the highest-value adoption targets. The convergence of Ferrocene's expanding certification coverage, the Safety-Critical Rust Consortium's coding guidelines, and the growing body of production deployments (including Android's use of Rust in kernel code running on millions of devices) establishes a path toward broader adoption that is driven by risk economics rather than language advocacy.

The embedded systems community is witnessing the first serious challenge to C's dominance since C itself displaced assembly language. Whether Rust ultimately achieves the ubiquity of C in embedded systems or remains a specialized tool for safety-critical applications will depend not only on technical maturation but on the ecosystem's ability to address the practical barriers of tooling, hardware coverage, and organizational adoption that this survey has identified.

## References

[1] A. Sharma, S. Sharma, et al., "Rust for Embedded Systems: Current State and Open Problems," in *Proceedings of the 2024 ACM SIGSAC Conference on Computer and Communications Security (CCS '24)*, October 2024. Extended report: https://arxiv.org/abs/2311.05063

[2] The White House, "Back to the Building Blocks: A Path Toward Secure and Measurable Software," Office of the National Cyber Director, February 2024. https://www.whitehouse.gov/oncd/

[3] Rust Embedded Working Group, "embedded-hal v1.0 now released!" January 2024. https://blog.rust-embedded.org/embedded-hal-v1/

[4] Ferrous Systems, "Ferrocene — Officially Qualified," 2024. https://ferrous-systems.com/ferrocene

[5] C. Artuc, "Rust Officially Mainstream in Linux Kernel: Tokyo Summit Ends Years of Controversy," December 2025. https://canartuc.medium.com/rust-officially-mainstream-in-linux-kernel-tokyo-summit-ends-years-of-controversy-9dbabe17638f

[6] J. Stankovic, "Misconceptions About Real-Time Computing: A Serious Problem for Next-Generation Systems," *Computer*, vol. 21, no. 10, pp. 10-19, October 1988.

[7] T. P. Baker, "Stack-Based Scheduling of Realtime Processes," *Real-Time Systems*, vol. 3, no. 1, pp. 67-99, 1991.

[8] The Embedded Rust Book, "A `#![no_std]` Rust Environment." https://docs.rust-embedded.org/book/intro/no-std.html

[9] Ferrous Systems, "no_std async/await — soon on stable." https://ferrous-systems.com/blog/stable-async-on-embedded/

[10] Memfault, "From Zero to main(): Bare metal Rust." https://interrupt.memfault.com/blog/zero-to-main-rust-1

[11] The Embedded Rust Book, "Portability." https://docs.rust-embedded.org/book/portability/

[12] svd2rust documentation. https://docs.rs/svd2rust/latest/svd2rust/

[13] heapless: Heapless, `static` friendly data structures. https://github.com/rust-embedded/heapless

[14] BBQueue: A SPSC, statically allocatable queue. https://github.com/jamesmunns/bbqueue

[15] The Embedonomicon, "DMA." https://docs.rust-embedded.org/embedonomicon/dma.html

[16] usb-device: Experimental device-side USB framework for microcontrollers. https://github.com/rust-embedded-community/usb-device

[17] RTIC: Real-Time Interrupt-driven Concurrency. https://rtic.rs/dev/book/en/

[18] K. Saltonstall, A. Sampaio, and M. Nassif, "Overview of Embedded Rust Operating Systems and Frameworks," *Sensors*, vol. 24, no. 17, p. 5818, 2024. https://pmc.ncbi.nlm.nih.gov/articles/PMC11398098/

[19] Rauk: Measurement-based WCET analysis for RTIC. https://github.com/markus-k/rauk

[20] Embassy: Modern embedded framework, using Rust and async. https://embassy.dev/

[21] RTIC documentation, "RTIC and Embassy." https://rtic.rs/2/book/en/rtic_and_embassy.html

[22] Rust for Linux, kernel crate documentation. https://rust-for-linux.github.io/docs/kernel/

[23] Rust in Linux's Kernel "is No Longer Experimental," LWN.net, December 2025. https://lwn.net/Articles/1049831/

[24] The Register, "Rust for Linux maintainer steps down in frustration," September 2024. https://www.theregister.com/2024/09/02/rust_for_linux_maintainer_steps_down/

[25] The Register, "Linus Torvalds to Hector Martin: 'Maybe the problem is you,'" February 2025. https://www.theregister.com/2025/02/07/linus_torvalds_rust_driver/

[26] Prossimo, "An Update on Memory Safety in the Linux Kernel," 2025. https://www.memorysafety.org/blog/linux-kernel-2025-update/

[27] Oxide Computer Company, Hubris. https://hubris.oxide.computer/

[28] Tock Embedded Operating System. https://www.tockos.org/

[29] Redox OS. https://www.redox-os.org/

[30] Theseus OS. https://github.com/theseus-os/Theseus

[31] Ferrous Systems, "Ferrocene 26.02.0 now available!" February 2026. https://ferrous-systems.com/blog/ferrocene-26-02-0/

[32] Rust Foundation, Safety-Critical Rust Coding Guidelines. https://github.com/rustfoundation/safety-critical-rust-coding-guidelines

[33] BUGSENG, "C, Rust, C-rusted and MISRA for safe and secure embedded software." https://www.bugseng.com/c-rust-c-rusted-and-misra-for-safe-and-secure-embedded-software/

[34] Rust Blog, "What does it take to ship Rust in safety-critical?" January 2026. https://blog.rust-lang.org/2026/01/14/what-does-it-take-to-ship-rust-in-safety-critical/

[35] EE News Europe, "The Trinity of Trust: Exploring Ada, SPARK, and Rust in Embedded Programming." https://www.eenewseurope.com/en/exploring-ada-spark-rust-in-embedded-programming/

[36] Tweede golf, "Running real-time Rust." https://tweedegolf.nl/en/blog/198/running-real-time-rust

[37] probe-rs: A debugging toolset and library for debugging embedded ARM and RISC-V targets. https://probe.rs/

## Practitioner Resources

### Getting Started

- **The Embedded Rust Book**: The official guide to embedded Rust development, covering no_std setup, hardware abstraction, concurrency, and debugging. https://docs.rust-embedded.org/book/
- **The Embedonomicon**: Advanced topics including linker scripts, memory layout, DMA safety, and custom target specifications. https://docs.rust-embedded.org/embedonomicon/
- **The Discovery Book**: Hands-on introduction to embedded Rust using the BBC micro:bit. https://docs.rust-embedded.org/discovery/microbit/
- **Comprehensive Rust (Bare Metal chapter)**: Google's Rust course includes a bare-metal section covering embedded fundamentals. https://google.github.io/comprehensive-rust/bare-metal/

### Frameworks and HALs

- **Embassy**: Async embedded framework with comprehensive STM32 and nRF HALs. https://embassy.dev/
- **RTIC**: Real-Time Interrupt-driven Concurrency framework. https://rtic.rs/
- **embedded-hal**: The core hardware abstraction traits. https://github.com/rust-embedded/embedded-hal
- **stm32-rs**: PACs and HALs for STM32 microcontrollers. https://github.com/stm32-rs
- **nrf-rs**: HAL and BSPs for Nordic nRF microcontrollers. https://github.com/nrf-rs
- **esp-rs**: Rust support for Espressif ESP32 chips. https://github.com/esp-rs
- **rp-hal**: HAL for Raspberry Pi RP2040/RP2350. https://github.com/rp-rs/rp-hal

### Tooling

- **probe-rs**: Modern debugging and flashing toolkit. https://probe.rs/
- **cargo-embed**: Cargo extension for flashing and RTT logging. https://github.com/probe-rs/cargo-embed
- **defmt**: Efficient, deferred formatting for embedded logging. https://github.com/knurling-rs/defmt
- **flip-link**: Linker wrapper that places the stack below static data. https://github.com/knurling-rs/flip-link

### Safety-Critical

- **Ferrocene**: Qualified Rust toolchain for safety-critical systems. https://ferrous-systems.com/ferrocene
- **Safety-Critical Rust Coding Guidelines**: Community-developed guidelines. https://coding-guidelines.arewesafetycriticalyet.org/
- **High Assurance Rust**: Book on developing secure and robust Rust software. https://highassurance.rs/

### Operating Systems

- **Hubris** (Oxide Computer): https://hubris.oxide.computer/
- **Tock OS**: https://www.tockos.org/
- **Redox OS**: https://www.redox-os.org/
- **Theseus OS**: https://github.com/theseus-os/Theseus

### Community

- **Rust Embedded Working Group**: https://github.com/rust-embedded/wg
- **Awesome Embedded Rust**: Curated resource list. https://github.com/rust-embedded/awesome-embedded-rust
- **Are We RTOS Yet?**: Tracking Rust RTOS ecosystem maturity. https://arewertosyet.com/
- **Rust Embedded Matrix chat**: Real-time community discussion. https://matrix.to/#/#rust-embedded:matrix.org
