---
title: "Automated Debugging and Program Repair"
date: 2026-03-21
summary: A comprehensive survey of automated program repair techniques from genetic programming to LLM-based approaches, covering generate-and-validate, semantics-based, template-based, neural, and search-based repair methods.
keywords: [automated program repair, APR, program repair, automated debugging, neural repair, LLM debugging]
---

# Automated Debugging and Program Repair

## Abstract

Automated Program Repair (APR) has matured from an aspirational research vision into a diverse field encompassing genetic programming, constraint solving, pattern mining, neural machine translation, and large language model-based agents. The central goal remains unchanged: given a program exhibiting faulty behavior (typically witnessed by a failing test), automatically produce a patch that corrects the defect while preserving intended functionality. This survey provides a comprehensive examination of the intellectual lineage, technical mechanisms, empirical findings, and open problems across the full spectrum of APR approaches developed over the past fifteen years (2009--2026).

We organize the field into six principal families---generate-and-validate, semantics-based, template/pattern-based, search-based software engineering, neural program repair, and LLM-based debugging---and trace the evolution from GenProg's existence proof through modern agentic systems that resolve real GitHub issues autonomously. For each family, we present the underlying theory, canonical implementations, benchmark performance, and inherent trade-offs. We also examine cross-cutting concerns including fault localization, patch correctness assessment, the overfitting problem, and the end-to-end repair loop that connects these stages.

The survey covers 63+ LLM-based APR systems published between 2022 and 2025, alongside the classical techniques that preceded them. We synthesize findings across the canonical benchmarks---Defects4J, QuixBugs, BugsInPy, ManyBugs/IntroClass, and the emergent SWE-bench family---and identify persistent open problems including multi-hunk repair, semantic patch correctness, cross-language generalization, and the tension between repair autonomy and developer trust.

---

## 1. Introduction

### 1.1 Problem Statement

Software defects impose enormous economic and societal costs. The U.S. National Institute of Standards and Technology estimated that software bugs cost the U.S. economy approximately $59.5 billion annually, and subsequent estimates have placed the global figure substantially higher. While testing and static analysis detect the presence of faults, the task of *repairing* them---diagnosing root causes, synthesizing correct modifications, and validating their correctness---remains predominantly manual, time-consuming, and error-prone.

Automated Program Repair (APR) seeks to mechanize this process. Formally, given a program $P$ that fails on at least one test case in a test suite $T = \{t_1, \ldots, t_n\}$, an APR system produces a modified program $P'$ such that $P'$ passes all tests in $T$. A patch is termed *plausible* if it passes the full test suite and *correct* if it is semantically equivalent to the developer's intended fix. The gap between plausibility and correctness---the *overfitting problem*---is one of the field's central challenges.

### 1.2 Scope and Definitions

This survey covers the following technical areas:

- **Generate-and-validate repair**: Stochastic search approaches that generate candidate patches and validate them against test suites, including genetic programming (GenProg), random search (RSRepair), and learned search strategies (Prophet, SPR).
- **Semantics-based repair**: Constraint-based approaches that use symbolic execution and program synthesis to derive patches that satisfy formal constraints (SemFix, Angelix, DirectFix).
- **Template/pattern-based repair**: Approaches that mine fix patterns from human-written patches and apply them via AST-level transformations (PAR, TBar, FixMiner).
- **Search-based software engineering for repair**: Multi-objective optimization formulations that seek Pareto-optimal patches balancing correctness, minimality, and other objectives (ARJA).
- **Neural program repair**: Deep learning approaches that treat repair as neural machine translation or code generation (SequenceR, CoCoNuT, CURE, RewardRepair).
- **LLM-based debugging and repair**: Large language model approaches spanning fine-tuning, prompting, procedural pipelines, and autonomous agents (AlphaRepair, ChatRepair, Repilot, SWE-agent, RepairAgent).
- **Automated fault diagnosis**: Test generation, fault localization, bug reproduction, and crash deduplication as prerequisites to repair.
- **APR benchmarks**: Defects4J, QuixBugs, BugsInPy, ManyBugs/IntroClass, SWE-bench, and their roles in measuring progress.
- **Patch correctness**: The overfitting problem, patch ranking, anti-patterns, and correctness assessment techniques.
- **The repair loop**: End-to-end pipelines from fault localization through patch generation, validation, and ranking.

### 1.3 Historical Context

The field traces its origins to the landmark GenProg system (Le Goues et al., 2012), which demonstrated that genetic programming could produce patches for real-world C programs. While many of GenProg's specific design decisions proved less important than initially believed, its contribution as an *existence proof*---showing that useful patches for non-trivial bugs could be generated automatically---launched the discipline of generate-and-validate APR.

The subsequent decade witnessed rapid diversification: semantics-based approaches (SemFix, 2013) introduced constraint solving; template-based methods (PAR, 2013) leveraged human fix patterns; neural approaches (SequenceR, 2019) applied sequence-to-sequence learning; and LLM-based systems (AlphaRepair, 2022) harnessed pre-trained code models. By 2025, agentic systems autonomously resolve real GitHub issues, and the field has expanded from single-line C repairs to multi-file Python repository modifications.

---

## 2. Foundations

### 2.1 The Repair Problem Formalization

The test-suite-based repair problem can be stated as follows. Let $P$ be a program, $T_f \subset T$ the set of failing tests, and $T_p = T \setminus T_f$ the set of passing tests. An APR system seeks a patch $\delta$ such that the modified program $P' = P \oplus \delta$ satisfies:

$$\forall t \in T: P'(t) = \text{expected}(t)$$

This formulation is inherently incomplete: the test suite $T$ is a *partial specification*, and a patch that satisfies $T$ may not satisfy the developer's full intent. This incompleteness is the root cause of the overfitting problem.

### 2.2 The Plastic Surgery Hypothesis

A foundational empirical finding is the *plastic surgery hypothesis* (Barr et al., 2014), which posits that the code ingredients needed to fix a bug usually already exist within the same project. An examination of over 15,723 commits across 12 open-source projects found that approximately 43% of code changes are "graftable"---their raw material exists elsewhere in the codebase. This finding provides theoretical grounding for generate-and-validate approaches that construct patches by copying, moving, or recombining existing code fragments (the *redundancy assumption*).

### 2.3 Fault Localization as a Prerequisite

Before a patch can be generated, the faulty program location must be identified. Fault localization (FL) is the process of ranking program elements by their likelihood of being faulty. The two dominant families are:

**Spectrum-Based Fault Localization (SBFL)** uses test execution coverage data to compute suspiciousness scores for each program statement. Classic formulae include:

- *Tarantula* (Jones and Harrold, 2005): One of the earliest and most widely cited SBFL techniques, using a ratio of failing-test coverage to total coverage.
- *Ochiai* (Abreu et al., 2007): Borrowed from molecular biology's similarity coefficient, consistently outperforms Tarantula and Jaccard on standard benchmarks. On Defects4J, Ochiai and DStar(2) localize 109+ faults within Top-1 and 209+ faults within Top-3.

**Mutation-Based Fault Localization (MBFL)** generates mutants of the program and uses their test outcomes to identify faulty locations. Metallaxis-FL (Papadakis and Le Traon) assigns suspiciousness based on whether mutants at a given location are killed by failing tests. MUSE (Moon et al.) averages mutant suspiciousness scores per statement. MBFL techniques generally outperform SBFL but at substantially higher computational cost.

**Learning-Based Fault Localization** represents a more recent direction. DeepFL (Li et al., 2019) integrates suspiciousness values, fault-proneness features, and textual similarity features through deep learning, localizing 50+ more faults within Top-1 than prior techniques (TraPT/FLUCCS) on 395 Defects4J bugs.

### 2.4 Test Suite Adequacy

The quality of the test suite fundamentally constrains repair quality. If the test suite poorly covers the buggy behavior, a plausible patch may trivially satisfy it while introducing new defects. Mutation testing, code coverage metrics, and independently generated test suites (via tools like EvoSuite and Randoop) serve as proxies for test suite adequacy, though none fully eliminates the specification gap.

---

## 3. Taxonomy of Approaches

The following classification framework organizes APR techniques along two axes: the *repair strategy* (how patches are generated) and the *knowledge source* (what information drives generation). We adopt the widely-used four-category classical taxonomy---search-based, constraint-based, template-based, and learning-based---extended with subcategories for neural and LLM-based methods.

| Category | Subcategory | Representative Tools | Knowledge Source | Search Mechanism |
|---|---|---|---|---|
| **Generate-and-Validate** | Genetic programming | GenProg, RSRepair | Existing code (redundancy assumption) | Stochastic mutation/crossover |
| | Learned heuristics | SPR, Prophet | Human patch history | Condition synthesis + learned ranking |
| **Semantics-Based** | Constraint solving | SemFix, DirectFix, Angelix | Symbolic execution traces | SMT/MaxSMT solving |
| **Template/Pattern-Based** | Manually curated | PAR | Human-studied fix patterns | Pattern matching + instantiation |
| | Automatically mined | TBar, FixMiner | Mined from patch corpora | Iterative clustering + pattern application |
| **Search-Based (SBSE)** | Multi-objective GP | ARJA | Existing code + test suite | NSGA-II multi-objective optimization |
| **Neural** | Seq-to-seq NMT | SequenceR, CoCoNuT | Bug-fix pairs (supervised) | Encoder-decoder beam search |
| | Code-aware NMT | CURE | Pre-trained PL model + bug-fix pairs | Subword tokenization + code-aware search |
| | Reward-guided | RewardRepair | Bug-fix pairs + execution signals | Compilation/test reward in loss |
| **LLM-Based** | Zero-shot/cloze | AlphaRepair | Pre-trained code model | Masked token prediction |
| | Conversational | ChatRepair, ThinkRepair | LLM + test feedback | Iterative prompting with feedback |
| | Completion-guided | Repilot | LLM + completion engine | Token-level pruning/completion |
| | Agentic | SWE-agent, RepairAgent, AutoCodeRover | LLM + tool APIs | Autonomous planning + tool use |
| | Agentless pipeline | Agentless | LLM + hierarchical localization | Two-phase localize-then-repair |

**Temporal evolution of paradigm dominance.** Template-based approaches constituted approximately 29.3% of the APR literature through the mid-2010s. By 2024--2025, deep learning solutions account for 43.9% of new work, with LLM-based approaches (fine-tuning, prompting, procedural, and agentic) representing the fastest-growing segment. A recent survey of 63 LLM-based APR systems (2022--2025) documents 2 systems in 2022, 14 in 2023, 30 in 2024, and 17 in the first half of 2025 alone.

---

## 4. Analysis

### 4.1 Generate-and-Validate Repair

#### Theory and Mechanism

Generate-and-validate (G&V) repair operates by (1) localizing the fault, (2) generating a pool of candidate patches through stochastic or heuristic transformations, and (3) validating each candidate against the test suite. The approach rests on the redundancy assumption: the raw material for a correct patch already exists somewhere in the codebase.

**GenProg** (Le Goues et al., 2012) pioneered this approach using genetic programming (GP). A program is represented as an abstract syntax tree (AST), and GP operators---mutation (inserting, deleting, or replacing AST nodes) and crossover (combining subtrees from different variants)---evolve a population of program variants. Fitness is determined by the number of test cases passed. Structural differencing and delta debugging reduce the evolved variant to a minimal patch. In its landmark evaluation, GenProg repaired bugs across 16 programs totaling 1.25 million lines of C code in an average of 357 seconds.

**RSRepair** (Qi et al., 2014) challenged the necessity of GP by demonstrating that random search, considered far simpler, outperformed GenProg in most cases (23 out of 24 bug versions), requiring fewer patch trials and fewer test case executions. This finding raised fundamental questions about whether the GP search landscape provides meaningful gradient information for program repair.

**SPR and Prophet** advanced the G&V paradigm by introducing smarter search strategies. SPR (Long and Rinard, 2015) uses condition synthesis to explore its search space up to two orders of magnitude faster than GenProg. Prophet (Long and Rinard, 2016) builds on SPR by learning a probabilistic, application-independent model of correct code from successful human patches. On a benchmark of 69 real-world defects, Prophet found correct patches for 18 of 19 defects within a 12-hour time limit, compared to 16 for SPR.

#### Literature Evidence

The seminal overfitting study by Smith et al. (2015), "Is the Cure Worse Than the Disease?", evaluated GenProg and TrpAutoRepair using tests independent from those used during repair. The study found that the tools were unlikely to improve the proportion of independent tests passed, and that patch quality was proportional to the coverage of the repair test suite. This paper catalyzed the field's reckoning with the overfitting problem.

#### Implementations and Benchmarks

- **GenProg**: Evaluated on ManyBugs (C programs); later adaptations include jGenProg for Java.
- **RSRepair**: Evaluated on the same ManyBugs benchmark, demonstrating that random search is a strong baseline.
- **Prophet/SPR**: Evaluated on 69 defects from 8 open-source C projects.

#### Strengths and Limitations

| Strengths | Limitations |
|---|---|
| Language-agnostic in principle | High overfitting rates due to weak test specifications |
| Scales to large programs (1M+ LoC) | GP fitness landscape contains many plateaus |
| No formal specification required | Random search often competitive with GP |
| Existence proof for automated repair | Patches may be semantically meaningless |

---

### 4.2 Semantics-Based Repair

#### Theory and Mechanism

Semantics-based repair converts the repair problem into a constraint-solving task. Rather than stochastically searching for patches, these methods use symbolic execution to derive constraints that a correct patch must satisfy, then employ program synthesis or SMT solving to construct patches meeting those constraints.

**SemFix** (Nguyen et al., 2013) introduced a three-stage workflow: (1) spectrum-based fault localization identifies suspicious statements; (2) symbolic execution over test cases derives a specification (input-output constraints) for the correct behavior at the fault location; (3) component-based program synthesis generates an expression satisfying the constraints. SemFix was limited to single-line fixes involving assignments and conditions.

**DirectFix** (Mechtaev et al., 2015) extended SemFix by using a MaxSMT solver to synthesize *minimal* changes that make the program pass all tests, removing the single-line restriction. However, the MaxSMT formulation proved substantially less scalable than SemFix.

**Angelix** (Mechtaev et al., 2016) addressed the scalability gap by introducing a novel symbolic analysis technique. Angelix scales to programs of comparable size to those handled by search-based tools like GenProg and SPR, while retaining the semantic precision of constraint-based methods. It is powered by the KLEE symbolic execution engine and the Z3 SMT solver. The key innovation is the use of "angelic values"---abstract specifications of the correct behavior at each suspicious location---which are then synthesized into concrete patches.

#### Literature Evidence

Mechtaev's doctoral thesis (National University of Singapore, 2018) provides a comprehensive treatment of semantic program repair, establishing the theoretical foundations for constraint-based synthesis and demonstrating the progression from SemFix through DirectFix to Angelix.

#### Implementations and Benchmarks

- **SemFix**: Evaluated on small C programs with single-line faults.
- **DirectFix**: Evaluated on the same programs as SemFix, demonstrating multi-line capability at reduced scale.
- **Angelix**: Evaluated on the GenProg/ManyBugs benchmark, demonstrating scalability to programs of 100K+ lines of C code.
- **JFIX**: Extended semantic repair to Java using Symbolic PathFinder.

#### Strengths and Limitations

| Strengths | Limitations |
|---|---|
| Produces patches with formal correctness guarantees relative to the specification | Scalability limited by symbolic execution path explosion |
| Minimal patches reduce overfitting risk | Requires programs amenable to symbolic execution |
| Can handle complex expressions and conditions | Language-specific (tied to KLEE/Z3 infrastructure for C) |
| Sound with respect to the derived constraints | Constraint solving can be NP-hard in the worst case |

---

### 4.3 Template/Pattern-Based Repair

#### Theory and Mechanism

Template-based approaches observe that many real-world bug fixes follow recurring structural patterns. By mining these patterns from large corpora of human-written patches and encoding them as AST-level transformation templates, repair systems can generate patches that are structurally similar to human fixes.

**PAR** (Kim et al., 2013) was the seminal template-based tool. The researchers manually inspected more than 60,000 human-written patches and identified common fix patterns (e.g., null pointer checks, boundary condition adjustments, method replacements). PAR applies these patterns at fault locations identified by fault localization. On 119 real bugs, PAR generated patches for 27 bugs compared to GenProg's 16. A user study with 89 students and 164 developers confirmed that PAR's patches were more acceptable than GenProg's, addressing the criticism that G&V patches are often semantically nonsensical.

**TBar** (Liu et al., 2019) systematically collected, summarized, and labeled 35 fix patterns from the APR literature and implemented them in a unified tool. TBar serves as a comprehensive baseline for template-based repair. Assuming perfect fault localization, TBar correctly fixes 74 bugs and plausibly fixes 101 bugs on Defects4J. Without perfect localization, TBar correctly fixes 43 bugs---an unprecedented result at the time of publication that exceeded all prior approaches regardless of category (template-based, stochastic, or synthesis-based).

**FixMiner** (Koyuncu et al., 2020) automates pattern mining using an iterative clustering strategy applied to atomic changes within patches. Unlike PAR's manual pattern identification, FixMiner infers patterns automatically from patch corpora. The mined patterns were integrated into PARFixMiner, which correctly fixed 26 Defects4J bugs, with 81% of its plausible patches being correct---a notably high precision rate.

#### Literature Evidence

The proliferation of template-based tools has made systematic comparison essential. TBar's contribution lies partly in demonstrating that a straightforward application of known fix patterns, combined with effective fault localization, can outperform sophisticated search and synthesis approaches. The 35 patterns in TBar include 30 single-statement patterns and 7 multi-statement patterns, covering a wide range of common fix types.

#### Implementations and Benchmarks

- **PAR**: Evaluated on 119 Java bugs; patterns manually derived from 60,000+ patches.
- **TBar**: Evaluated on Defects4J v1.2 (395 bugs); 35 fix patterns from literature.
- **FixMiner**: Evaluated on Defects4J; patterns automatically mined via iterative clustering.
- **AVATAR**, **kPAR**: Subsequent template-based tools building on TBar's foundations.

#### Strengths and Limitations

| Strengths | Limitations |
|---|---|
| Patches resemble human fixes (higher acceptability) | Limited to bugs matching known patterns |
| High precision (FixMiner: 81% correct among plausible) | Manual pattern curation is labor-intensive (PAR) |
| Fast patch generation (no expensive search/solving) | Pattern completeness is inherently bounded |
| Transparent and interpretable repairs | Cannot handle novel bug types outside the pattern set |

---

### 4.4 Search-Based Software Engineering for Repair

#### Theory and Mechanism

Search-based software engineering (SBSE) formulates program repair as an optimization problem. The key insight is that multiple objectives---test-suite passage, patch minimality, code naturalness, runtime performance---can conflict, and a single fitness function may not capture the desired trade-offs.

**ARJA** (Yuan and Banzhaf, 2018) is the canonical multi-objective APR system. It formulates repair as a multi-objective optimization problem and uses NSGA-II (Non-dominated Sorting Genetic Algorithm II) to search for Pareto-optimal patches. ARJA introduces several innovations:

1. A *lower-granularity patch representation* that decouples the search subspaces of buggy locations, operation types, and potential fix ingredients, enabling GP to explore the search space more effectively.
2. A *test filtering procedure* that speeds up fitness evaluation.
3. *Type matching rules* and strategies to reduce the search space by avoiding nonsensical manipulations.

On 224 Defects4J bugs, ARJA generated test-suite-adequate patches for 59 bugs (compared to jGenProg's 27) and correct patches for 18 (compared to jGenProg's 5)---roughly a 4x improvement in correctness.

#### Fitness Landscape Analysis

A fundamental challenge in SBSE for repair is the *fitness landscape*. The traditional fitness function depends entirely on Boolean test case results (pass/fail), which creates a landscape with many *plateaus*---large regions where all candidate solutions have identical fitness despite being structurally different. This makes it difficult for search algorithms to identify partially correct solutions or make incremental progress toward a fix.

Recent work has explored fine-grained fitness evaluations that go beyond Boolean test outcomes, including source code checkpoints and execution trace similarity, though results remain unsettled. The fitness landscape problem partially explains RSRepair's success: when the landscape provides no gradient, random search is competitive with guided search.

#### Multi-Objective Formulation

The multi-objective perspective allows engineers to consider trade-offs between:

- **Correctness**: Number of passing tests
- **Minimality**: Patch size (fewer changes preferred)
- **Naturalness**: Similarity to human-written code
- **Performance**: Runtime or memory overhead of the patched program

NSGA-II produces a Pareto front of non-dominated solutions, allowing developers to select patches based on their priorities. The SBSE community has explored both weighted search (combining objectives into a single scalar) and Pareto search, with evidence suggesting that Pareto search avoids the bias introduced by arbitrary weight selection.

#### Strengths and Limitations

| Strengths | Limitations |
|---|---|
| Explicit multi-objective optimization | Fitness landscape plateaus limit search effectiveness |
| Principled trade-off analysis via Pareto fronts | Computationally expensive (many fitness evaluations) |
| ARJA: 4x correctness improvement over jGenProg | Boolean test fitness provides poor gradient |
| Flexible objective formulation | Requires careful search space design |

---

### 4.5 Neural Program Repair

#### Theory and Mechanism

Neural program repair reframes the repair task as a neural machine translation (NMT) problem: given a buggy code sequence, generate the corresponding fixed code sequence. These approaches learn repair transformations from large corpora of bug-fix pairs, capturing implicit patterns that may be difficult to encode as explicit templates.

**SequenceR** (Chen et al., 2019) was one of the first end-to-end neural APR systems. It uses a sequence-to-sequence architecture with a *copy mechanism* to overcome the unlimited vocabulary problem inherent in source code. Trained on 35,578 bug-fix pairs curated from open-source repositories, SequenceR correctly predicted the fixed line for 950 out of 4,711 test samples and found correct patches for 14 Defects4J bugs. While modest compared to later systems, SequenceR demonstrated the viability of treating repair as NMT.

**CoCoNuT** (Lutellier et al., 2020) advanced neural repair through ensemble learning, combining multiple convolutional neural networks (CNNs) with a context-aware NMT architecture. CoCoNuT's key contribution is its portability: with little manual effort, it was applied to four programming languages (Java, C, Python, and JavaScript), making it the first APR technique easily portable across languages. The context-aware architecture captures both local buggy context and broader program context.

**CURE** (Jiang et al., 2021) introduced two innovations. First, it pre-trains a programming language model on a large software codebase to learn developer-like source code *before* the APR task, improving the model's understanding of code structure and idioms. Second, it designs a *code-aware search strategy* that focuses beam search on compilable patches and patches close in length to the buggy code. These innovations improve both the syntactic validity and semantic correctness of generated patches.

**RewardRepair** (Ye et al., 2022) addresses a critical weakness of NMT-based repair: generated patches frequently do not compile. RewardRepair introduces a loss function based on program compilation and test execution information, rewarding the network for producing patches that compile and do not overfit. In the best configuration, RewardRepair achieves a compilable rate of up to 45.3%, substantially improving the practical utility of neural repair.

#### Literature Evidence

A survey by Zhong (2022) on neural program repair systems, challenges, and solutions provides a systematic analysis of the field's evolution. The progression from SequenceR (basic seq-to-seq) through CoCoNuT (context-aware ensemble) to CURE (pre-trained + code-aware search) and RewardRepair (execution-based training signal) illustrates a consistent trend toward incorporating more program-aware inductive biases into neural architectures.

#### Implementations and Benchmarks

| Tool | Architecture | Training Data | Defects4J Bugs Fixed | Key Innovation |
|---|---|---|---|---|
| SequenceR | Seq-to-seq + copy | 35,578 bug-fix pairs | 14 | Copy mechanism for open vocabulary |
| CoCoNuT | CNN ensemble + context NMT | Bug-fix pairs (4 languages) | 44 (Java) | Multi-language portability |
| CURE | Pre-trained PL model + NMT | Large code corpus + bug-fix pairs | 57 | Code-aware beam search |
| RewardRepair | NMT + execution reward | Bug-fix pairs + compilation/test signals | ~45 | Compilability reward in loss function |

#### Strengths and Limitations

| Strengths | Limitations |
|---|---|
| Learns implicit patterns beyond explicit templates | Requires large training corpora of bug-fix pairs |
| Scalable inference (forward pass is fast) | Low compilable rate without code-aware techniques |
| Generalizes across bug types | Limited to the distribution of training data |
| Portable across languages (CoCoNuT) | Black-box nature reduces interpretability |

---

### 4.6 LLM-Based Debugging and Repair

#### Theory and Mechanism

The emergence of large language models (LLMs) pre-trained on massive code corpora has fundamentally transformed APR. Unlike neural repair methods that require supervised training on bug-fix pairs, LLM-based approaches leverage the general code understanding acquired during pre-training. The field has evolved through four paradigms, each representing increasing sophistication in how LLMs are deployed for repair.

##### 4.6.1 Zero-Shot and Cloze-Style Repair

**AlphaRepair** (Xia and Zhang, 2022) pioneered cloze-style APR, treating repair as a "fill-in-the-blank" task. Each potentially buggy line is replaced with a mask token, and a pre-trained code model (CodeBERT) predicts the replacement. This approach completely frees APR from historical bug-fix datasets, since the model leverages only its pre-training knowledge. AlphaRepair fixed 3.3x more bugs than prior baselines on Defects4J, demonstrating that zero-shot learning can substantially outperform supervised neural repair.

##### 4.6.2 Conversational and Iterative Repair

**ChatRepair** (Xia et al., 2024) is the first fully automated conversation-driven APR approach. Rather than generating all patches from a single prompt and validating them post-hoc, ChatRepair interleaves patch generation with instant feedback in a conversational loop:

1. The LLM receives the buggy code and relevant test failure information.
2. For patches that fail tests, the system feeds the incorrect patch and its test failure back to the LLM for the next generation attempt.
3. For patches that pass all tests, ChatRepair asks the LLM to generate alternative variations, building on earlier successes.

ChatRepair fixed 162 out of 337 Defects4J bugs (v1.2 + v2.0) at a cost of approximately $0.42 per bug using ChatGPT, achieving state-of-the-art results with substantially fewer generations than static prompt baselines.

**ThinkRepair** (2024) extends conversational repair with chain-of-thought (CoT) reasoning. In a collection phase, it builds a "pre-fixed knowledge pool" of reasoning chains by instructing LLMs with CoT prompts. In the fixing phase, it selects high-quality examples for few-shot learning and interacts with the LLM, optionally appending test feedback. ThinkRepair fixed 98 Defects4J bugs, improving baselines by 27%.

##### 4.6.3 Completion-Engine-Guided Repair

**Repilot** (Wei et al., 2023) addresses a fundamental limitation of LLMs: they treat programs as token sequences and are ignorant of underlying semantic constraints. Repilot synergistically combines an LLM with a completion engine that (1) prunes infeasible tokens suggested by the LLM and (2) proactively completes tokens based on program context (type information, scope, available identifiers). This token-level collaboration improved bug-fix counts by 27% on Defects4J v1.2 and 47% on Defects4J v2.0 compared to the base LLM alone.

##### 4.6.4 Agentic Repair Systems

The most recent paradigm treats the LLM as an autonomous agent that plans, executes, and adapts its repair strategy using external tools.

**SWE-agent** (Yang et al., 2024) facilitates LLM agents in autonomously navigating repositories, creating and editing files, and executing tests through a custom agent-computer interface (ACI). On SWE-bench (2,294 real GitHub issues), SWE-agent achieved 12.5% pass@1, far exceeding the prior RAG baseline of 3.8%. Published at NeurIPS 2024.

**AutoCodeRover** (Zhang et al., 2024) is program-structure-aware, working on AST representations rather than treating projects as file collections. Its code search APIs navigate classes and methods in the abstract syntax tree, and it optionally uses spectrum-based fault localization. AutoCodeRover resolved 30.67% of SWE-bench Lite issues at less than $0.70 per task, with two-thirds of its patches being correct.

**RepairAgent** (Bouzenia et al., 2024) is an autonomous agent with 14 tools covering the full repair workflow---reading code, searching the codebase, gathering repair ingredients, and applying patches. A finite state machine guides tool invocation. RepairAgent fixed 164 Defects4J bugs, including 39 not fixed by any prior technique, at an average cost of 270,000 tokens ($0.14) per bug using GPT-3.5.

**Agentless** (Xia et al., 2024) challenges the complexity of agentic approaches with a simple two-phase pipeline: hierarchical fault localization (narrowing from files to classes/functions to specific locations) followed by patch generation in diff format. Agentless resolved 32.0% of SWE-bench Lite issues at $0.70 per bug, achieving the highest performance among open-source approaches while demonstrating that simplicity can be competitive with sophisticated agent architectures.

#### LLM-Based APR Paradigm Distribution (2022--2025)

| Year | Fine-Tuning | Prompting | Procedural | Agentic | Total Systems |
|---|---|---|---|---|---|
| 2022 | 0 | 2 | 0 | 0 | 2 |
| 2023 | 7 | 6 | 1 | 0 | 14 |
| 2024 | 10 | 4 | 9 | 7 | 30 |
| 2025 (Jan--Jun) | 4 | 2 | 4 | 7 | 17 |
| **Total** | **21** | **14** | **14** | **14** | **63** |

*Source: Yang et al. (2025), "A Survey of LLM-based Automated Program Repair"*

#### Cross-Cutting Enhancements

Two augmentation layers cut across all four paradigms:

- **Retrieval-Augmented Generation (RAG)**: Augments LLM input with external knowledge---code snippets, documentation, historical fixes---improving repair accuracy. RLCE raised GPT-3.5's fix rate on RepoBugs from 22.6% to 56.0%.
- **Analysis-Augmented Generation (AAG)**: Incorporates static/dynamic analysis results---error traces, data-flow facts, compiler diagnostics---guiding regeneration toward root causes. D4C fixed 180 of 437 single-function Defects4J bugs, 10% above prior state-of-the-art.

#### Strengths and Limitations

| Strengths | Limitations |
|---|---|
| No task-specific training required (zero-shot) | High token consumption and API costs at scale |
| Conversational refinement improves accuracy iteratively | Non-deterministic outputs complicate reproducibility |
| Agentic systems handle multi-file, multi-hunk repairs | Black-box reasoning reduces developer trust |
| Rapid deployment via API access | Sensitive to prompt engineering and context window limits |
| State-of-the-art results on all major benchmarks | Correctness assessment remains an open problem |

---

### 4.7 Automated Fault Diagnosis

#### Automated Test Generation for Debugging

Automated test generation tools serve dual roles in the APR ecosystem: they can expose latent defects and provide additional test oracles for patch validation.

**EvoSuite** (Fraser and Arcuri, 2011) generates test suites for Java classes using a hybrid approach that optimizes whole test suites toward coverage criteria. EvoSuite detected twice as many failures in terms of undeclared exceptions compared to traditional random testing across 100 open-source projects. In the context of APR, EvoSuite-generated tests can strengthen the specification against which patches are validated, reducing overfitting.

**Randoop** (Pacheco and Ernst, 2007) performs feedback-directed random test generation, reporting violations of predefined contracts. While easier to use than EvoSuite, Randoop lacks guidance toward complex code structures. Comparative studies show an average fault detection rate of 50.8% for EvoSuite versus 36.8% for Randoop. When three tools (AgitarOne, EvoSuite, Randoop) were applied to fixed program versions and their test suites executed on buggy versions, they detected 55.7% of faults overall, but only 19.9% of individual test suites detected a fault.

#### Bug Reproduction

Crash reproduction is the process of generating a test case that triggers the same crash observed in production. **EvoCrash** uses a guided genetic algorithm to automatically reproduce crashes from stack traces, outperforming prior state-of-the-art techniques. Reliable bug reproduction is a prerequisite for repair: without a deterministic way to trigger the fault, both fault localization and patch validation become unreliable.

#### Crash Deduplication

Organizations like Mozilla, Microsoft, and Apple receive thousands of automated crash reports daily. Crash deduplication identifies which reports correspond to the same underlying defect.

**Igor** (Jiang et al., 2021) uses a dual-phase approach: first minimizing each proof-of-concept's execution trace to obtain pruned test cases, then using graph similarity comparison to cluster crashes based on control-flow graphs.

**DeFault** (Zhang et al., 2022) applies mutual information-based crash triage for massive crash volumes.

**GPTrace** (Herter et al., 2025) represents the newest generation, using LLM embeddings for effective crash deduplication, leveraging the semantic understanding of pre-trained models to identify similar crash patterns.

---

### 4.8 APR Benchmarks

Benchmarks serve as the empirical foundation for measuring APR progress. The field's reliance on a small number of benchmarks raises both standardization benefits and threats to validity.

#### Defects4J

**Defects4J** (Just et al., 2014) is the *de facto* standard benchmark for Java APR research. Version 2.0 contains 835 bugs (plus 10 deprecated) from 17 Java open-source projects spanning compilers, parsers, testing infrastructure, and libraries. Each bug consists of a buggy and fixed source code version, with bugs curated from issue trackers where: (1) an issue was filed, (2) the fix was committed in a single commit, and (3) irrelevant changes (refactorings, feature additions) were manually pruned.

Defects4J's strengths include reproducible build and test environments, detailed metadata, and broad adoption enabling cross-study comparisons. Its limitations include the restriction to Java, a focus on single-commit fixes, and potential data leakage concerns as models may have been pre-trained on Defects4J projects.

#### QuixBugs

**QuixBugs** (Lin et al., 2017) contains 40 algorithm implementations, each with a buggy and fixed version in both Python and Java. Bugs are simple (mostly single-line, single-token), making it useful for quick evaluation but limited in representing real-world complexity. Despite its small size, QuixBugs has been extensively used due to its simplicity and multilingual nature.

#### BugsInPy

**BugsInPy** (Widyasari et al., 2020) extends the Defects4J paradigm to Python, containing 493 real bugs from 17 real-world Python programs. It addresses the gap in non-Java APR evaluation and has become increasingly important as Python-focused repair tools proliferate.

#### ManyBugs and IntroClass

**ManyBugs** and **IntroClass** (Le Goues et al., 2015) consist of 1,183 defects in 15 C programs. ManyBugs contains bugs from large open-source projects (e.g., PHP, GCC, Python interpreter), while IntroClass contains bugs from student programs. Both provide empirically defined guarantees of reproducibility and categorize bugs to facilitate qualitative evaluation. These benchmarks were instrumental in the early G&V era for evaluating tools like GenProg, RSRepair, and Prophet.

#### SWE-bench

**SWE-bench** (Jimenez et al., 2024) represents a paradigm shift in APR benchmarking. It contains 2,294 software engineering problems drawn from real GitHub issues and pull requests across 12 popular Python repositories. Unlike prior benchmarks that provide isolated buggy functions, SWE-bench requires navigating entire repositories, localizing faults across multiple files, and generating multi-hunk patches. Evaluation uses Docker-based execution environments that check whether "fail-to-pass" tests now pass after applying the generated patch.

**SWE-bench Verified** is a human-curated subset designed for higher-fidelity evaluation. **SWE-bench Live** (2025) contains 1,319 tasks from issues created since 2024 across 93 repositories, addressing data contamination concerns by using post-training-cutoff issues.

The initial RAG baseline scored 1.96% on SWE-bench. By 2025, leading systems (SWE-RL) achieve 41.0% on SWE-bench Verified, documenting extraordinary progress.

#### Benchmark Comparison

| Benchmark | Language | Bugs | Scope | Year | Primary Use |
|---|---|---|---|---|---|
| ManyBugs | C | 185 | Large OSS projects | 2015 | G&V repair (GenProg, Prophet) |
| IntroClass | C | 998 | Student programs | 2015 | G&V repair, introductory evaluation |
| Defects4J v1.2 | Java | 395 | 6 OSS projects | 2014 | Template/neural/LLM repair |
| Defects4J v2.0 | Java | 835 | 17 OSS projects | 2020 | Comprehensive Java repair evaluation |
| QuixBugs | Java/Python | 40 | Algorithm implementations | 2017 | Quick cross-language evaluation |
| BugsInPy | Python | 493 | 17 OSS projects | 2020 | Python repair evaluation |
| SWE-bench | Python | 2,294 | 12 repositories (full repo) | 2024 | Repository-level agentic repair |
| SWE-bench Verified | Python | ~500 | Curated subset | 2024 | High-fidelity agentic evaluation |

#### Threats to Validity

Several threats affect benchmark-based evaluation:

1. **Data leakage**: Pre-trained models may have seen benchmark projects during training. SWE-bench Live addresses this with post-cutoff issues.
2. **Perfect fault localization assumption**: Many studies evaluate patch generation assuming the fault location is known, inflating repair counts relative to real-world settings.
3. **Test suite adequacy**: Benchmark test suites may be insufficient to distinguish correct from overfitting patches.
4. **Benchmark overfitting**: Tools may be tuned to specific benchmarks, reducing generalizability.
5. **Manual correctness assessment**: The practice of authors manually labeling patches as "correct" or "overfitting" introduces subjectivity.

---

### 4.9 Patch Correctness

#### The Overfitting Problem

The overfitting problem is the central challenge in test-suite-based APR. A patch is *overfitting* if it passes the test suite but is incorrect with respect to the developer's intended behavior. This occurs because test suites are partial specifications---they encode some but not all desired behaviors.

Smith et al. (2015) demonstrated the severity of overfitting for G&V tools. Subsequent studies have found that overfitting rates vary significantly across tool categories: template-based tools produce patches with higher correctness ratios (e.g., FixMiner: 81% of plausible patches are correct), while G&V tools and early neural approaches exhibit lower ratios.

However, recent work by Petke et al. (2024) nuances the severity assessment: the median number of plausible patches generated by any APR tool for a given Defects4J bug is remarkably low (median of 2), suggesting that a developer typically needs to inspect only 2 patches to find a correct fix or confirm its nonexistence. This finding suggests the overfitting problem "might not be as bad as previously thought" in practical settings.

#### Patch Correctness Assessment Techniques

**Manual assessment** remains the most common practice: paper authors annotate patches as "correct" or "overfitting" based on semantic analysis. While the gold standard, this introduces subjectivity and does not scale.

**Random Testing based on Ground Truth (RGT)** generates random test inputs and executes them on both the machine-generated patch and the human-written reference patch. If any generated test produces different behavior, the machine patch is deemed overfitting. RGT automates assessment but requires a ground-truth reference.

**PATCH-SIM** (Xiong et al., 2018) predicts patch correctness by comparing execution traces of passing tests on buggy and patched programs, under the assumption that correct patches should exhibit similar trace changes. However, PATCH-SIM is computationally demanding.

**Anti-patterns** (Tan et al., 2016) identify characteristic structures of incorrect patches. Analysis of 86 bugs across 12 projects yielded a set of erroneous modification patterns. Among 139 patches, anti-patterns filtered out 28 (27 incorrect, 1 correct), demonstrating high precision but limited recall.

**Shibboleth** (Ghanbari et al., 2022) assesses patch correctness along three complementary facets: syntactic similarity to the original program, semantic similarity via execution behavior, and impact on test code coverage. This multi-dimensional approach outperforms individual features.

**Poracle** (Yi et al., 2023) introduces *preservation conditions*---conditions under which the patched and pre-patched versions should produce the same output---and uses differential fuzzing to test these conditions. This semi-automatic methodology bridges the gap between manual assessment and fully automated (but less accurate) techniques.

**ComPass** (2025) applies contrastive learning for automated patch correctness assessment, representing the newest generation of machine learning-based correctness predictors.

#### Patch Ranking

When multiple plausible patches exist, ranking them by likelihood of correctness is critical for developer trust. Approaches include:

- **Test case prioritization**: Ordering tests so that those most likely to detect overfitting are executed first.
- **Patch clustering**: Grouping similar patches and preferring clusters that contain multiple independently generated patches, under the assumption that convergent solutions are more likely correct.
- **ObjSim**: A lightweight patch prioritization technique based on object similarity.

---

### 4.10 The Repair Loop

#### End-to-End Pipeline Architecture

The automated debugging pipeline consists of four stages, each feeding into the next:

```
Fault Localization --> Patch Generation --> Patch Validation --> Patch Ranking
       |                    |                    |                    |
  SBFL/MBFL/DL         G&V/Semantic/         Test Suite          Correctness
  Suspiciousness        Template/Neural/      Execution +         Assessment +
  Ranking               LLM Generation        Compilation         Developer Review
```

**Stage 1: Fault Localization.** Given a failing test, FL produces a ranked list of suspicious program locations. The quality of this ranking directly impacts repair efficiency: if the true fault location is ranked low, the repair system wastes time generating patches at incorrect locations. Studies show that fault localization is a critical bottleneck---many APR papers assume "perfect fault localization" to isolate the contribution of their patch generation technique, but this assumption inflates results relative to real-world deployment.

**Stage 2: Patch Generation.** At each suspicious location, the repair engine generates candidate patches using one or more of the techniques described in Sections 4.1--4.6. The number of candidates generated, their diversity, and the efficiency of generation all affect the pipeline's overall effectiveness.

**Stage 3: Patch Validation.** Each candidate patch is validated by compiling the modified program and executing the test suite. A patch is *plausible* if it passes all tests. Validation is typically the bottleneck in terms of wall-clock time, as each candidate requires compilation and test execution. Test filtering (executing only relevant tests) and patch prioritization (validating more promising patches first) are common optimizations.

**Stage 4: Patch Ranking.** When multiple plausible patches are found, they are ranked by estimated correctness using the techniques described in Section 4.9. The top-ranked patches are presented to the developer for inspection.

#### Retrospective Fault Localization

An important recent insight is that the repair process itself can improve fault localization. **RESTORE** (Wen et al., 2019) proposes *retrospective fault localization*: using information from patch generation and validation to refine the initial fault localization ranking. If patches at a particular location frequently pass more tests, that location becomes more suspicious. This creates a feedback loop between FL and repair that improves both stages.

#### Integration Challenges

Combining FL, patch generation, validation, and ranking into a seamless pipeline introduces integration challenges:

1. **FL-repair coupling**: The choice of FL technique affects which bugs a repair tool can fix; Ochiai-based FL and SBFL are most commonly used, but learning-based FL (DeepFL) may better serve neural repair tools.
2. **Validation overhead**: Each candidate patch requires compilation and test execution, creating a time-quality trade-off.
3. **Information flow**: Test failure information from validation can be fed back to the LLM (as in ChatRepair) or used to update FL rankings (as in RESTORE), creating opportunities for iterative refinement.
4. **End-to-end optimization**: Most pipeline stages are optimized independently; joint optimization remains an open research direction.

---

## 5. Comparative Synthesis

### 5.1 Cross-Cutting Trade-Off Analysis

The following table synthesizes trade-offs across all major APR families:

| Dimension | G&V | Semantics-Based | Template-Based | SBSE | Neural | LLM-Based |
|---|---|---|---|---|---|---|
| **Correctness rate** | Low (high overfitting) | Moderate-High (formal constraints) | High (human-like patterns) | Moderate | Moderate | High (state-of-the-art) |
| **Scalability** | High (1M+ LoC) | Low-Moderate (symbolic exec. limits) | High | Moderate | High (fast inference) | High (API-based) |
| **Training/setup cost** | None | Tool-chain setup | Pattern curation | None | Large corpus + GPU | None (API) or GPU (fine-tune) |
| **Patch interpretability** | Low (random mutations) | High (formal derivation) | High (known patterns) | Moderate | Low (black-box) | Low-Moderate |
| **Multi-line repair** | Yes (but often incorrect) | Yes (Angelix) | Limited (mostly single-statement) | Yes | Limited (single-hunk) | Yes (agentic systems) |
| **Language generality** | Moderate | Low (C-centric) | Moderate (Java-centric) | Moderate | High (CoCoNuT: 4 languages) | High (LLMs are multilingual) |
| **Cost per bug** | CPU time only | CPU time only | CPU time only | CPU time only | GPU time | $0.14--$0.70 (API) |
| **Specification requirement** | Test suite | Test suite + symbolic exec. amenability | Test suite | Test suite | Training corpus | Test suite (optional for agentic) |
| **Peak Defects4J performance** | ~5 correct (jGenProg) | ~15 (Angelix on C benchmarks) | 43 correct (TBar) | 18 correct (ARJA) | 57 correct (CURE) | 162 bugs fixed (ChatRepair, v1.2+v2.0) |

### 5.2 Evolution of State-of-the-Art Performance

The trajectory of APR performance on Defects4J illustrates the field's rapid progress:

| Era | Period | Representative Tool | Correct Fixes (Defects4J v1.2) | Approach |
|---|---|---|---|---|
| Early G&V | 2012--2014 | GenProg/jGenProg | ~5 | Genetic programming |
| Semantics | 2013--2016 | SemFix/Angelix | ~10--15 (C benchmarks) | Constraint solving |
| Templates | 2013--2019 | PAR -> TBar | 43 | Pattern application |
| Multi-objective | 2018 | ARJA | 18 | NSGA-II optimization |
| Neural NMT | 2019--2021 | SequenceR -> CURE | 14 -> 57 | Encoder-decoder NMT |
| Pre-trained LLM | 2022 | AlphaRepair | 3.3x prior baselines | Cloze-style zero-shot |
| Conversational LLM | 2024 | ChatRepair | 162 (v1.2 + v2.0) | Iterative prompting |
| Agentic LLM | 2024--2025 | RepairAgent | 164 | Autonomous tool use |

### 5.3 SWE-bench Performance Trajectory

For the newer repository-level SWE-bench benchmark:

| System | Year | SWE-bench Variant | Resolution Rate | Cost per Bug |
|---|---|---|---|---|
| RAG Baseline | 2023 | Full | 1.96% | N/A |
| SWE-agent | 2024 | Full | 12.47% | N/A |
| AutoCodeRover | 2024 | Lite | 30.67% | <$0.70 |
| Agentless | 2024 | Lite | 32.00% | $0.70 |
| KGCompass | 2025 | Lite | 46.00% | $0.20 |
| SWE-RL | 2025 | Verified | 41.00% | N/A |

---

## 6. Open Problems and Gaps

### 6.1 Multi-Hunk and Cross-File Repair

Most classical APR tools target single-location, single-hunk repairs. Real-world bugs frequently require coordinated changes across multiple files and functions. While agentic LLM systems (SWE-agent, AutoCodeRover) have begun addressing this, their success rates remain below 50% even on curated benchmarks. The search space for multi-hunk repair grows combinatorially, and current techniques lack principled methods for decomposing complex repairs into coordinated sub-patches.

### 6.2 Semantic Patch Correctness

The overfitting problem remains fundamentally unsolved. Test suites are inherently partial specifications, and no automated technique reliably distinguishes correct from overfitting patches without human judgment. While anti-patterns, execution-trace similarity, and contrastive learning (ComPass) show promise, correctness assessment accuracy remains insufficient for fully autonomous deployment. The specification gap---the difference between what tests encode and what developers intend---is the deepest open problem in the field.

### 6.3 Repair for Non-Functional Properties

Nearly all APR research targets functional correctness (making failing tests pass). Repair of non-functional defects---performance regressions, security vulnerabilities, concurrency bugs, memory leaks---remains underexplored. VulDebugger (2025) addresses security vulnerability repair, fixing 60% of vulnerabilities in 50 C/C++ projects, but the broader space of non-functional repair is largely open.

### 6.4 Cross-Language and Multilingual Repair

While LLMs are inherently multilingual, systematic evaluation of repair quality across languages remains limited. CoCoNuT demonstrated portability across four languages, and QuixBugs provides dual-language evaluation, but comprehensive multilingual benchmarks are lacking. Language-specific idioms, type systems, and runtime behaviors create challenges that generic approaches may not capture.

### 6.5 Developer Trust and Adoption

A persistent gap exists between research results and industrial adoption. Developers must trust that generated patches are correct, maintainable, and do not introduce new defects. The acceptability study in PAR (2013) showed that human-like patches improve developer trust, but LLM-generated patches---while often correct---lack the transparency of template-based approaches. Explainable repair, where the system provides rationale for its changes, is an emerging research direction.

### 6.6 Benchmark Saturation and Data Contamination

As APR tools achieve high fix rates on established benchmarks, the community faces diminishing returns from continued evaluation on the same datasets. Data contamination is a particular concern for LLM-based tools, as pre-training corpora may include benchmark projects and their fixes. SWE-bench Live addresses this with post-cutoff issues, but the fundamental tension between benchmark stability (enabling comparison) and freshness (preventing contamination) remains.

### 6.7 Cost-Effectiveness at Scale

While per-bug costs for LLM-based repair are low ($0.14--$0.70), scaling to entire codebases with thousands of potential defects raises questions about economic viability. The cost of false positives (incorrectly flagged bugs) and false fixes (overfitting patches deployed to production) may dominate the cost of correct repairs. Cost-effectiveness analysis that accounts for the full lifecycle---fault detection, localization, repair, validation, review, and deployment---is needed.

### 6.8 Integration with Development Workflows

APR tools must integrate with existing development workflows---CI/CD pipelines, code review processes, issue trackers, and version control systems. GitHub Copilot's coding agent (2025) represents one integration model, automatically creating pull requests for bug fixes and running security/quality checks, but the gap between research prototypes and production-ready tools remains substantial.

### 6.9 The Specification Problem

The deepest theoretical limitation of test-suite-based APR is the *specification problem*: tests are an incomplete specification of intended behavior. VibeRepair (2025) addresses this by first translating buggy programs into behavior specifications, inferring the intended behavior, and then generating repairs from corrected specifications. Formal specification inference from natural-language documentation, commit messages, and issue descriptions is a promising direction that may bridge the specification gap.

---

## 7. Conclusion

Automated program repair has undergone a remarkable transformation over its fifteen-year history. GenProg's 2009 existence proof---demonstrating that genetic programming could patch real C programs---launched a discipline that now encompasses constraint solving, pattern mining, neural machine translation, and autonomous LLM agents. The progression from fixing 5 bugs on Defects4J (jGenProg) to resolving 162 bugs for $0.42 each (ChatRepair) and autonomously resolving 46% of real GitHub issues (KGCompass on SWE-bench Lite) represents an extraordinary acceleration.

Several structural shifts characterize the field's evolution. First, the knowledge source has shifted from program-internal redundancy (the plastic surgery hypothesis) to massive external corpora (pre-trained LLMs). Second, the repair paradigm has shifted from single-shot generate-and-validate to iterative conversational refinement and autonomous agent loops. Third, benchmark expectations have escalated from isolated function repair (Defects4J) to full repository-level issue resolution (SWE-bench). Fourth, the cost model has shifted from CPU time to API token consumption.

The overfitting problem remains the field's central challenge. While the practical severity may be lower than initially feared (median 2 plausible patches per bug), the fundamental specification gap between test suites and developer intent is not closable by any purely test-based technique. The most promising directions---specification inference, formal verification of patches, contrastive learning for correctness assessment---all seek to augment or transcend the test-suite-as-specification paradigm.

The convergence of APR with broader trends in AI-assisted software engineering---code generation, code review, test generation, and project management---suggests that automated debugging will increasingly be embedded in comprehensive development assistants rather than deployed as standalone tools. The field's next chapter will likely be defined by integration, trust, and the pursuit of semantic correctness guarantees that match the operational demands of production software.

---

## References

### Foundational Works

1. Le Goues, C., Nguyen, T., Forrest, S., & Weimer, W. (2012). GenProg: A Generic Method for Automatic Software Repair. *IEEE Transactions on Software Engineering*, 38(1), 54--72. https://ieeexplore.ieee.org/document/6035728

2. Qi, Y., Mao, X., Lei, Y., Dai, Z., & Wang, C. (2014). The Strength of Random Search on Automated Program Repair. *Proceedings of ICSE 2014*. http://qiyuhua.github.io/publications/icse2014-qi.pdf

3. Nguyen, H.D.T., Qi, D., Roychoudhury, A., & Chandra, S. (2013). SemFix: Program Repair via Semantic Analysis. *Proceedings of ICSE 2013*. https://www.comp.nus.edu.sg/~abhik/pdf/ICSE13-SEMFIX.pdf

4. Mechtaev, S., Yi, J., & Roychoudhury, A. (2016). Angelix: Scalable Multiline Program Patch Synthesis via Symbolic Analysis. *Proceedings of ICSE 2016*. https://dl.acm.org/doi/10.1145/2884781.2884807

5. Kim, D., Nam, J., Song, J., & Kim, S. (2013). Automatic Patch Generation Learned from Human-Written Patches. *Proceedings of ICSE 2013*. https://dl.acm.org/doi/10.5555/2486788.2486893

6. Liu, K., Koyuncu, A., Kim, D., & Bissyandé, T.F. (2019). TBar: Revisiting Template-based Automated Program Repair. *Proceedings of ISSTA 2019*. https://dl.acm.org/doi/10.1145/3293882.3330577

7. Koyuncu, A., Liu, K., Bissyandé, T.F., Kim, D., Klein, J., Monperrus, M., & Le Traon, Y. (2020). FixMiner: Mining Relevant Fix Patterns for Automated Program Repair. *Empirical Software Engineering*, 25, 1980--2024. https://link.springer.com/article/10.1007/s10664-019-09780-z

### Search-Based and Multi-Objective Repair

8. Yuan, Y., & Banzhaf, W. (2018). ARJA: Automated Repair of Java Programs via Multi-Objective Genetic Programming. *IEEE Transactions on Software Engineering*, 46(10), 1040--1067. https://ieeexplore.ieee.org/document/8485732

9. Long, F., & Rinard, M. (2016). Automatic Patch Generation by Learning Correct Code. *Proceedings of POPL 2016*. https://dl.acm.org/doi/10.1145/2837614.2837617

10. Long, F., & Rinard, M. (2015). Staged Program Repair with Condition Synthesis. *Proceedings of ESEC/FSE 2015*. https://dl.acm.org/doi/10.1145/2786805.2786811

### Neural Program Repair

11. Chen, Z., Kommrusch, S., Tufano, M., Pouchet, L.-N., Poshyvanyk, D., & Monperrus, M. (2019). SequenceR: Sequence-to-Sequence Learning for End-to-End Program Repair. *IEEE Transactions on Software Engineering*, 47(9), 1943--1959. https://ieeexplore.ieee.org/document/8827954

12. Lutellier, T., Pham, H.V., Pang, L., Li, Y., Wei, M., & Tan, L. (2020). CoCoNuT: Combining Context-Aware Neural Translation Models Using Ensemble for Program Repair. *Proceedings of ISSTA 2020*. https://www.cs.purdue.edu/homes/lintan/publications/coconut-issta20.pdf

13. Jiang, N., Lutellier, T., & Tan, L. (2021). CURE: Code-Aware Neural Machine Translation for Automatic Program Repair. *Proceedings of ICSE 2021*. https://dl.acm.org/doi/10.1109/ICSE43902.2021.00107

14. Ye, H., Martínez, M., & Monperrus, M. (2022). Neural Program Repair with Execution-based Backpropagation. *Proceedings of ICSE 2022*. https://arxiv.org/abs/2105.04123

### LLM-Based Repair

15. Xia, C.S., & Zhang, L. (2022). Less Training, More Repairing Please: Revisiting Automated Program Repair via Zero-Shot Learning. *Proceedings of ESEC/FSE 2022*. https://arxiv.org/abs/2207.08281

16. Xia, C.S., Paltenghi, M., Tian, J.L., Pradel, M., & Zhang, L. (2024). Automated Program Repair via Conversation: Fixing 162 out of 337 Bugs for $0.42 Each using ChatGPT. *Proceedings of ISSTA 2024*. https://dl.acm.org/doi/10.1145/3650212.3680323

17. Wei, Y., Xia, C.S., & Zhang, L. (2023). Copiloting the Copilots: Fusing Large Language Models with Completion Engines for Automated Program Repair. *Proceedings of ESEC/FSE 2023*. https://dl.acm.org/doi/10.1145/3611643.3616271

18. Yang, J., Jimenez, C.E., Wettig, A., Liber, K., Narasimhan, K., & Press, O. (2024). SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering. *Proceedings of NeurIPS 2024*. https://arxiv.org/abs/2405.15793

19. Zhang, Y., Ruan, H., Fan, Z., & Roychoudhury, A. (2024). AutoCodeRover: Autonomous Program Improvement. *Proceedings of ISSTA 2024*. https://dl.acm.org/doi/10.1145/3650212.3680384

20. Bouzenia, I., Pradel, M., & Eggers, J. (2024). RepairAgent: An Autonomous, LLM-Based Agent for Program Repair. *Proceedings of ICSE 2025*. https://arxiv.org/abs/2403.17134

21. Xia, C.S., Deng, Y., Dunn, S., & Zhang, L. (2024). Agentless: Demystifying LLM-based Software Engineering Agents. https://arxiv.org/abs/2407.01489

### Benchmarks

22. Just, R., Jalali, D., & Ernst, M.D. (2014). Defects4J: A Database of Existing Faults to Enable Controlled Testing Studies for Java Programs. *Proceedings of ISSTA 2014*. https://dl.acm.org/doi/10.1145/2610384.2628055

23. Le Goues, C., Holtschulte, N., Smith, E.K., Brun, Y., Devanbu, P., Forrest, S., & Weimer, W. (2015). The ManyBugs and IntroClass Benchmarks for Automated Repair of C Programs. *IEEE Transactions on Software Engineering*, 41(12), 1236--1256. https://ieeexplore.ieee.org/document/7153570

24. Lin, D., Koppel, J., Chen, A., & Solar-Lezama, A. (2017). QuixBugs: A Multi-Lingual Program Repair Benchmark Set Based on the Quixey Challenge. *Proceedings of the ACM SIGPLAN International Conference on Systems, Programming, Languages, and Applications: Software for Humanity (SPLASH Companion)*. https://www.sciencedirect.com/science/article/abs/pii/S0164121220302193

25. Widyasari, R., Sim, S.Q., Lok, C., Qi, H., Phan, J., Tay, Q., Tan, C., Wee, F., Tan, J.E., Yieh, Y., Goh, B., Thung, F., Kang, H.J., Hoang, T., Lo, D., & Ouh, E.L. (2020). BugsInPy: A Database of Existing Bugs in Python Programs to Enable Controlled Testing and Debugging Studies. *Proceedings of ESEC/FSE 2020*. https://dl.acm.org/doi/abs/10.1145/3368089.3417943

26. Jimenez, C.E., Yang, J., Wettig, A., Yao, S., Peri, K., Press, O., & Narasimhan, K. (2024). SWE-bench: Can Language Models Resolve Real-World GitHub Issues? *Proceedings of ICLR 2024*. https://arxiv.org/abs/2310.06770

### Patch Correctness and Overfitting

27. Smith, E.K., Barr, E.T., Le Goues, C., & Brun, Y. (2015). Is the Cure Worse Than the Disease? Overfitting in Automated Program Repair. *Proceedings of ESEC/FSE 2015*. https://dl.acm.org/doi/10.1145/2786805.2786825

28. Barr, E.T., Brun, Y., Devanbu, P., Harman, M., & Sarro, F. (2014). The Plastic Surgery Hypothesis. *Proceedings of FSE 2014*. https://dl.acm.org/doi/10.1145/2635868.2635898

29. Ghanbari, A., Benton, S., & Zhang, L. (2022). Patch Correctness Assessment in Automated Program Repair Based on the Impact of Patches on Production and Test Code. *Proceedings of ISSTA 2022*. https://dl.acm.org/doi/10.1145/3533767.3534368

30. Xiong, Y., Liu, X., Zeng, M., Zhang, L., & Huang, G. (2018). Identifying Patch Correctness in Test-Based Program Repair. *Proceedings of ICSE 2018*. https://arxiv.org/abs/1706.09120

31. Yi, J., Tan, S.H., Mechtaev, S., Bohme, M., & Roychoudhury, A. (2023). Poracle: Testing Patches under Preservation Conditions to Combat the Overfitting Problem of Program Repair. *ACM Transactions on Software Engineering and Methodology*. https://dl.acm.org/doi/full/10.1145/3625293

32. Petke, J. (2024). The Patch Overfitting Problem in Automated Program Repair: Practical Magnitude and a Baseline for Realistic Benchmarking. *Proceedings of FSE 2024 (IVR)*. https://dl.acm.org/doi/10.1145/3663529.3663776

### Fault Localization

33. Jones, J.A., & Harrold, M.J. (2005). Empirical Evaluation of the Tarantula Automatic Fault-Localization Technique. *Proceedings of ASE 2005*.

34. Abreu, R., Zoeteweij, P., & Van Gemund, A.J.C. (2007). On the Accuracy of Spectrum-based Fault Localization. *Proceedings of TAICPART 2007*.

35. Li, X., Li, W., Zhang, Y., & Zhang, L. (2019). DeepFL: Integrating Multiple Fault Diagnosis Dimensions for Deep Fault Localization. *Proceedings of ISSTA 2019*. https://dl.acm.org/doi/abs/10.1145/3293882.3330574

### Test Generation and Fault Diagnosis

36. Fraser, G., & Arcuri, A. (2011). EvoSuite: Automatic Test Suite Generation for Object-Oriented Software. *Proceedings of ESEC/FSE 2011*. https://www.evosuite.org/wp-content/papercite-data/pdf/esecfse11.pdf

37. Pacheco, C., & Ernst, M.D. (2007). Randoop: Feedback-Directed Random Testing for Java. *Proceedings of OOPSLA 2007*.

38. Jiang, Z., et al. (2021). Igor: Crash Deduplication Through Root-Cause Clustering. *Proceedings of CCS 2021*. https://dl.acm.org/doi/10.1145/3460120.3485364

### Surveys

39. Yang, X., Cai, Y., et al. (2025). A Survey of LLM-based Automated Program Repair: Taxonomies, Design Paradigms, and Applications. https://arxiv.org/abs/2506.23749

40. ACM Computing Surveys (2024). Evolving Paradigms in Automated Program Repair: Taxonomy, Challenges, and Opportunities. https://dl.acm.org/doi/10.1145/3696450

41. Knowledge and Information Systems (2025). Advancements in Automated Program Repair: A Comprehensive Review. https://link.springer.com/article/10.1007/s10115-025-02383-9

42. Mechtaev, S. (2018). Semantic Program Repair. *PhD Thesis, National University of Singapore*. https://abhikrc.com/Students/Sergey.pdf

43. Weimer, W. (2025). The Evolution of Automated Software Repair. *IEEE Transactions on Software Engineering*. https://web.eecs.umich.edu/~weimerw/p/weimer-tse2025-genprog.pdf

44. Zhong, W. (2022). Neural Program Repair: Systems, Challenges and Solutions. https://arxiv.org/abs/2202.10868

---

## Practitioner Resources

### Benchmark Repositories

- **Defects4J**: https://github.com/rjust/defects4j -- Database of real faults in Java programs with reproducible build/test infrastructure. The standard benchmark for Java APR evaluation. Version 2.0 contains 835 bugs across 17 projects.

- **SWE-bench**: https://github.com/SWE-bench/SWE-bench -- Repository-level benchmark of 2,294 real GitHub issues with Docker-based evaluation. The standard benchmark for agentic repair systems. Includes SWE-bench Lite (300 issues) and SWE-bench Verified (human-curated subset).

- **BugsInPy**: https://github.com/soarsmu/BugsInPy -- 493 real bugs from 17 Python projects, modeled after Defects4J. Essential for Python APR evaluation.

- **QuixBugs**: https://github.com/jkoppel/QuixBugs -- 40 algorithmic bugs in Python and Java. Useful for quick cross-language evaluation.

- **program-repair.org**: https://program-repair.org/benchmarks.html -- Comprehensive listing of APR benchmarks maintained by the research community.

### Repair Tools

- **GenProg**: https://squareslab.github.io/genprog-code/ -- The original genetic programming-based repair tool for C. Historically significant as the existence proof for G&V repair.

- **Angelix**: https://github.com/msv-lab/angelix -- Semantic program repair for C programs using KLEE and Z3. Scalable multiline repair via symbolic analysis.

- **TBar**: https://github.com/TruX-DTF/TBar -- Template-based repair implementing 35 fix patterns. Strong baseline for Defects4J evaluation.

- **ARJA**: https://github.com/yyxhdy/arja -- Multi-objective genetic programming for Java repair using NSGA-II.

- **SequenceR**: https://github.com/ASSERT-KTH/sequencer -- Sequence-to-sequence neural repair for Java using copy mechanism.

- **SWE-agent**: https://github.com/SWE-agent/SWE-agent -- Autonomous agent with custom ACI for repository-level repair. Supports GPT-4o, Claude, and other LLMs.

- **AutoCodeRover**: https://github.com/AutoCodeRoverSG/auto-code-rover -- AST-aware autonomous repair agent with spectrum-based fault localization.

- **RepairAgent**: https://github.com/sola-st/RepairAgent -- Autonomous LLM agent with 14 repair-specific tools and finite state machine guidance.

- **Agentless**: https://github.com/OpenAutoCoder/Agentless -- Simple two-phase localize-then-repair pipeline. Competitive with agentic systems at lower complexity.

- **Repilot**: https://github.com/ise-uiuc/Repilot -- LLM + completion engine fusion for syntactically valid patch generation.

### Fault Localization and Testing

- **EvoSuite**: https://www.evosuite.org/ -- Search-based test suite generation for Java with Maven, IntelliJ, and Jenkins plugins. Useful for strengthening test suites for patch validation.

- **Randoop**: https://randoop.github.io/randoop/ -- Feedback-directed random test generation for Java. Lower setup cost than EvoSuite with moderate fault detection.

- **SBFL Package**: https://github.com/agb94/sbfl -- Python package implementing spectrum-based fault localization formulae (Ochiai, Tarantula, DStar, etc.).

### Survey and Literature Tracking

- **AwesomeLLM4APR**: https://github.com/iSEngLab/AwesomeLLM4APR -- Curated list of LLM-based APR papers, maintained as a living systematic literature review. Organized by year, venue, and paradigm.

- **GLEAM-Lab ProgramRepair**: https://github.com/GLEAM-Lab/ProgramRepair -- Repository accompanying the 2025 survey of LLM-based APR with taxonomy and design paradigm analysis.

- **Spirals-Team Defects4J Repair**: https://github.com/Spirals-Team/defects4j-repair -- Open-science repository tracking experimental results of APR tools on Defects4J.
