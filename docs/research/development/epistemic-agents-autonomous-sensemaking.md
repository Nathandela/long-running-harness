---
title: "Epistemic Agents and Autonomous Sensemaking Primitives"
date: 2026-03-21
summary: "Surveys the emerging field of AI systems that engage in prolonged sensemaking -- gathering, evaluating, synthesizing, and structuring information over extended periods -- across five research vectors: epistemic uncertainty modeling, knowledge representation for agent working memory, multi-agent debate and verification, human and computational sensemaking frameworks, and long-running research agent architectures. Identifies twelve distinct approaches, maps their theoretical foundations, and characterizes ten open problems."
keywords: [development, epistemic-agents, sensemaking, knowledge-representation, multi-agent-systems]
---

# Epistemic Agents and Autonomous Sensemaking Primitives
*PhD-Level Survey*

---

## Abstract

The dominant interaction paradigm for large language model (LLM) systems remains transactional: a user poses a question, the system retrieves relevant context, and produces a single-pass response. This paradigm -- epitomized by retrieval-augmented generation (RAG) -- is adequate for well-defined factual queries but structurally inadequate for problems requiring prolonged sensemaking: the iterative gathering, evaluation, synthesis, and restructuring of information across an uncertain and evolving knowledge landscape. Epistemic agents -- AI systems designed to autonomously manage their own knowledge states, reason about uncertainty, and conduct extended research campaigns -- represent a qualitatively different category of system that demands distinct theoretical foundations and architectural primitives.

This survey synthesizes research from epistemic logic, cognitive sensemaking theory, Bayesian uncertainty quantification, knowledge representation, multi-agent systems, and the emerging generation of long-running research agent architectures. We identify twelve distinct approaches organized across five research vectors: (1) epistemic uncertainty modeling, encompassing Bayesian epistemic-aleatoric decomposition, conformal prediction, and active learning in agent contexts; (2) knowledge representation for agent working memory, spanning knowledge graphs, vector stores, hybrid neuro-symbolic systems, and structured note-taking architectures; (3) multi-agent debate and verification, including adversarial collaboration, debate-as-alignment, and constitutional deliberation; (4) sensemaking frameworks, drawing on Klein's Data/Frame model, Pirolli and Card's sensemaking loop, and information foraging theory; and (5) long-running research agent architectures, covering memory management, context preservation, progressive refinement, and the "deep research" pattern now emerging from multiple labs.

The survey finds that these five vectors, while independently mature in their parent disciplines, remain poorly integrated in practice. No existing system simultaneously handles calibrated epistemic uncertainty, structured knowledge accumulation, adversarial verification, and human-compatible sensemaking narratives. The paper identifies ten open problems, including the absence of benchmarks for long-horizon sensemaking quality, the tension between exploration breadth and synthesis depth in autonomous research, and the unsolved challenge of epistemic humility in systems optimized for confident-sounding outputs.

---

## 1. Introduction

### 1.1 Problem Statement

Consider the following task: "Survey the current state of quantum error correction, identify which approaches are most promising for near-term fault-tolerant computation, and produce a structured analysis that a research group could use to prioritize their next three years of work." This task cannot be solved by a single retrieval pass. It requires the agent to: identify what it does not know; formulate sub-questions; gather information from dozens of sources; evaluate source credibility; detect contradictions between sources; synthesize findings into a coherent framework; identify gaps in its own analysis; and present results with calibrated confidence. Each of these operations constitutes a *sensemaking primitive* -- a fundamental cognitive operation that must be composed into extended research workflows.

Current LLM-based systems lack most of these primitives. They cannot reliably distinguish what they know from what they are confabulating. They have no mechanism to represent partial knowledge states or track how their confidence should update as new evidence arrives. They cannot autonomously decide that their current understanding is insufficient and initiate targeted information-seeking. When deployed in multi-turn research settings, they suffer from context window saturation, recency bias, and an inability to maintain coherent working models across extended interactions.

The field of epistemic agents addresses these deficits by drawing on a convergence of traditions: epistemic logic from philosophy, sensemaking theory from cognitive science, active learning from machine learning, knowledge representation from AI, and multi-agent verification from the alignment community. This survey maps the resulting landscape.

### 1.2 Scope and Boundaries

This survey covers approaches that enable AI systems to conduct autonomous sensemaking -- the sustained, iterative process of building understanding from incomplete and uncertain information. We organize the literature into five research vectors:

1. **Epistemic Uncertainty Modeling** -- How AI systems can represent, calibrate, and act on what they do not know
2. **Knowledge Representation for Agent Working Memory** -- How agents structure and store intermediate understanding during extended research
3. **Multi-Agent Debate and Verification** -- How competing or collaborating agents can stress-test claims and improve epistemic quality
4. **Sensemaking Frameworks** -- Theoretical models of how humans and AI systems build understanding from complex information landscapes
5. **Long-Running Research Agents** -- Architectural patterns for agent systems that operate over days or weeks on open-ended research problems

We explicitly exclude coverage of knowledge compounding and cross-session memory consolidation, which are treated in a companion survey (see `learning-systems/knowledge-compounding-for-ai-agents.md`). We also exclude scenario-based testing, covered in `scenario-testing/`. Where these topics intersect our scope -- for instance, memory architectures that support both knowledge compounding and epistemic state tracking -- we note the intersection but defer detailed treatment to the relevant companion work.

### 1.3 Key Definitions

**Epistemic Agent**: An agent that maintains an explicit model of its own knowledge state, including representations of uncertainty, ignorance, and the expected value of acquiring additional information. Contrasted with a *reactive agent* that responds to inputs without modeling its own epistemic position.

**Sensemaking**: The process by which an agent constructs a meaningful, coherent account of a situation from fragmentary, ambiguous, or contradictory information. Distinguished from *information retrieval* (finding known facts) and *inference* (deriving conclusions from complete premises) by the centrality of uncertainty, incompleteness, and iterative refinement.

**Sensemaking Primitive**: A fundamental cognitive or computational operation that constitutes an atomic step in a sensemaking process. Examples include: gap detection, source evaluation, contradiction identification, hypothesis generation, evidence weighing, and confidence calibration.

**Epistemic Uncertainty**: Uncertainty arising from lack of knowledge, which is in principle reducible by gathering more information. Contrasted with *aleatoric uncertainty*, which arises from inherent randomness in the process under study. The distinction, formalized in Bayesian statistics, is critical for epistemic agents because only epistemic uncertainty justifies information-seeking behavior.

**Working Memory (Agent)**: The structured representation of an agent's current understanding of a problem, including facts gathered, hypotheses entertained, confidence levels, identified gaps, and the provenance of each element. Analogous to but distinct from the cognitive psychology concept of human working memory.

---

## 2. Foundations

### 2.1 Epistemic Logic

The formal study of knowledge and belief in multi-agent settings originates with Hintikka's *Knowledge and Belief* (1962), which introduced possible-worlds semantics for epistemic modalities. In Hintikka's framework, an agent *knows* proposition p if and only if p is true in all worlds the agent considers epistemically possible. This formalism enables rigorous reasoning about nested knowledge (agent A knows that agent B does not know p), common knowledge, and the dynamics of knowledge update.

Fagin, Halpern, Moses, and Vardi's *Reasoning About Knowledge* (1995) extended this framework to distributed systems, establishing results about the relationship between knowledge and action in concurrent settings. Their work demonstrated that certain coordination problems (e.g., the coordinated attack problem) are equivalent to achieving common knowledge -- a result with direct implications for multi-agent sensemaking where agents must align on shared understanding.

Dynamic epistemic logic (DEL), developed by Baltag, Moss, and Solecki (1998) and van Ditmarsch, van der Hoek, and Kooi (2007), extends static epistemic logic with formal operators for knowledge-changing actions: public announcements, private communications, and observations. DEL provides the theoretical basis for modeling how an agent's epistemic state should update when it receives new information -- a core primitive for sensemaking agents.

The gap between formal epistemic logic and practical AI systems remains wide. Epistemic logic assumes logical omniscience (agents know all logical consequences of their knowledge), which is computationally intractable and empirically false for bounded agents. Resource-bounded epistemic logics (Alechina et al., 2004) and awareness logics (Fagin & Halpern, 1988) address this gap theoretically but have seen limited practical adoption in agent architectures.

### 2.2 Sensemaking Theory

The cognitive science of sensemaking provides the theoretical backbone for understanding how agents -- human or artificial -- build understanding from messy, incomplete data.

**Weick's Enactment Theory**. Karl Weick's organizational sensemaking framework (1995) emphasizes that sensemaking is not passive interpretation but active construction. Agents do not discover pre-existing meaning; they enact it through selective attention, bracketing, and retrospective narration. Weick identified seven properties of sensemaking: it is grounded in identity construction, retrospective, enactive of sensible environments, social, ongoing, focused on and by extracted cues, and driven by plausibility rather than accuracy. For AI agent design, Weick's emphasis on plausibility over accuracy is particularly relevant: sensemaking agents need not produce provably correct accounts but rather coherent, actionable accounts that survive scrutiny.

**Klein's Data/Frame Model**. Gary Klein and colleagues (2006a, 2006b) proposed the Data/Frame model as an empirically grounded account of sensemaking in naturalistic decision-making settings. In this model, sensemaking involves a continuous interplay between data (observations, evidence) and frames (explanatory structures, mental models). The agent simultaneously seeks data that test the current frame and adjusts the frame to accommodate anomalous data. Klein identified seven sensemaking activities: connecting data to frame, elaborating the frame, questioning the frame, preserving the frame, comparing frames, seeking a new frame, and reframing. This model maps directly onto operations an epistemic agent must perform: hypothesis generation (frame creation), evidence gathering (data connection), anomaly detection (frame questioning), and belief revision (reframing).

**Pirolli and Card's Sensemaking Loop**. Peter Pirolli and Stuart Card (2005) developed a dual-process model of intelligence analysis sensemaking consisting of a bottom-up *foraging loop* and a top-down *sensemaking loop*. In the foraging loop, the analyst searches for, filters, and extracts relevant information. In the sensemaking loop, the analyst develops schemas, hypotheses, and narratives to organize the extracted information. The two loops interact: foraging is guided by the current schema (top-down), while newly discovered information forces schema revision (bottom-up). This model has been widely adopted in the intelligence analysis and information visualization communities and provides a concrete architectural template for autonomous research agents.

**Information Foraging Theory**. Pirolli and Card (1999) also developed information foraging theory, adapting optimal foraging theory from behavioral ecology to human information-seeking behavior. The central concept is *information scent* -- cues in the environment that allow an agent to estimate the value of pursuing a particular information trail before actually traversing it. Agents optimize their foraging by following high-scent trails and abandoning low-scent ones. For AI agents, information scent corresponds to the signals (titles, abstracts, citations, metadata) that enable an agent to prioritize which sources to read in depth -- a critical capability for autonomous research systems that cannot read everything.

### 2.3 Agent Architecture Foundations

Modern agent architectures relevant to epistemic sensemaking build on several foundational patterns:

**BDI Architecture**. The Belief-Desire-Intention (BDI) model (Bratman, 1987; Rao & Georgeff, 1995) provides the canonical cognitive architecture for agents that reason about their own mental states. Beliefs represent the agent's information about the world (including uncertain or incomplete information), desires represent objectives, and intentions represent committed plans. The BDI model is directly relevant to epistemic agents because it explicitly separates the agent's representation of the world (beliefs) from the world itself, creating space for epistemic uncertainty.

**ReAct and Tool-Use Patterns**. The ReAct framework (Yao et al., 2023) demonstrated that interleaving reasoning traces with action execution (particularly tool use) substantially improves LLM agent performance on knowledge-intensive tasks. ReAct established the Thought-Action-Observation loop as a foundational primitive: the agent reasons about what to do, executes an action (e.g., web search), observes the result, and reasons about what to do next. This loop is a minimal sensemaking cycle -- but without explicit epistemic state management.

**Reflexion and Self-Critique**. Shinn et al. (2023) introduced Reflexion, which augments the ReAct loop with explicit self-evaluation: after completing a task, the agent generates a verbal reflection on its performance, which is stored and made available for future attempts. This introduces a primitive form of epistemic self-assessment -- the agent reasons about the quality of its own reasoning -- though without formal uncertainty quantification.

---

## 3. Taxonomy of Approaches

We organize the twelve approaches covered in this survey along two axes: the *epistemic operation* they primarily address and the *representation substrate* they employ. The following table provides an overview.

| # | Approach | Primary Vector | Epistemic Operation | Representation | Key References |
|---|----------|---------------|---------------------|----------------|----------------|
| 1 | Bayesian Epistemic Uncertainty | Uncertainty Modeling | Confidence calibration, uncertainty decomposition | Probability distributions | Gal & Ghahramani 2016; Kendall & Gal 2017 |
| 2 | Conformal Prediction for LLMs | Uncertainty Modeling | Distribution-free prediction sets | Set-valued outputs | Vovk et al. 2005; Quach et al. 2024 |
| 3 | Active Learning in Agent Contexts | Uncertainty Modeling | Information-seeking, query selection | Acquisition functions | Settles 2012; Diao et al. 2023 |
| 4 | Knowledge Graphs for Agent Memory | Knowledge Representation | Structured fact storage, relational reasoning | Graph databases (triples) | Ji et al. 2022; Pan et al. 2024 |
| 5 | Vector-Symbolic Hybrid Stores | Knowledge Representation | Similarity retrieval + logical inference | Embeddings + symbolic rules | Bordes et al. 2013; Lewis et al. 2020 |
| 6 | Structured Note-Taking Architectures | Knowledge Representation | Progressive summarization, outline management | Hierarchical text stores | Laban et al. 2023 |
| 7 | Debate as Alignment | Multi-Agent Verification | Adversarial claim testing | Natural language arguments | Irving et al. 2018 |
| 8 | Multi-Agent Deliberation | Multi-Agent Verification | Consensus through structured disagreement | Message-passing protocols | Du et al. 2023; Liang et al. 2023 |
| 9 | Constitutional & Self-Critique Loops | Multi-Agent Verification | Norm-based output filtering | Principle hierarchies | Bai et al. 2022; Madaan et al. 2023 |
| 10 | Sensemaking Loop Architectures | Sensemaking Frameworks | Foraging-synthesis cycling | Dual-process pipelines | Pirolli & Card 2005 |
| 11 | Deep Research Agents | Long-Running Agents | Multi-day autonomous research | Orchestration + memory tiers | OpenAI 2025; Anthropic 2025; Google 2025 |
| 12 | Progressive Refinement Pipelines | Long-Running Agents | Iterative draft improvement | Versioned document stores | STORM (Shao et al. 2024) |

### 3.1 Mapping Approaches to Sensemaking Primitives

Each approach addresses a subset of the sensemaking primitives required for autonomous research. The following matrix maps approaches to primitives:

| Primitive | Bayesian | Conformal | Active Learning | KG Memory | Vector-Symbolic | Note-Taking | Debate | Deliberation | Constitutional | Sensemaking Loop | Deep Research | Progressive |
|-----------|----------|-----------|-----------------|-----------|-----------------|-------------|--------|--------------|----------------|------------------|---------------|-------------|
| Gap detection | ++ | + | ++ | + | - | + | - | + | - | ++ | ++ | + |
| Source evaluation | - | - | + | + | + | - | ++ | ++ | ++ | + | + | - |
| Contradiction ID | - | - | - | ++ | + | - | ++ | ++ | + | + | + | + |
| Hypothesis gen. | + | - | + | + | - | + | + | ++ | - | ++ | ++ | ++ |
| Evidence weighing | ++ | ++ | + | + | + | - | ++ | + | + | + | + | + |
| Confidence calib. | ++ | ++ | + | - | - | - | + | + | - | + | + | - |
| Synthesis | - | - | - | + | + | ++ | - | + | - | ++ | ++ | ++ |

Legend: ++ = primary strength, + = partial support, - = not directly addressed

---

## 4. Analysis

### 4.1 Bayesian Epistemic Uncertainty Modeling

#### Theory

The Bayesian framework provides the canonical decomposition of predictive uncertainty into epistemic (model) uncertainty and aleatoric (data) uncertainty. Kendall and Gal (2017) formalized this decomposition for deep learning: given a model with parameters $\theta$, the predictive uncertainty for input $x^*$ decomposes as:

$$\text{Var}[y^*] = \underbrace{E_\theta[\text{Var}[y^* | \theta]]}_{\text{aleatoric}} + \underbrace{\text{Var}_\theta[E[y^* | \theta]]}_{\text{epistemic}}$$

The epistemic component captures uncertainty reducible by observing more data or improving the model. For an epistemic agent, this decomposition is fundamental: only epistemic uncertainty justifies the cost of information-seeking. An agent that cannot distinguish epistemic from aleatoric uncertainty will either over-invest in gathering information about inherently random processes or under-invest in resolving genuine knowledge gaps.

Gal and Ghahramani (2016) showed that Monte Carlo (MC) dropout at inference time approximates Bayesian inference in deep Gaussian processes, providing a practical mechanism for estimating epistemic uncertainty in neural networks. Subsequent work extended this to ensemble methods (Lakshminarayanan et al., 2017), where the disagreement among independently trained models provides a non-Bayesian but empirically effective estimate of epistemic uncertainty.

#### Application to LLM Agents

Applying Bayesian uncertainty quantification to LLMs presents distinct challenges. LLMs are not trained with explicit Bayesian posteriors, and their softmax output probabilities are notoriously poorly calibrated (Guo et al., 2017). Several approaches address this:

**Verbalized confidence**. Kadavath et al. (2022) and Tian et al. (2023) demonstrated that LLMs can be prompted to express numerical confidence estimates, and that these verbalized probabilities exhibit moderate calibration that improves with model scale. Lin et al. (2022) proposed "Teaching Models to Express Their Uncertainty in Words," showing that fine-tuning on calibration data improves verbal uncertainty expression.

**Semantic entropy**. Kuhn et al. (2023) introduced semantic entropy as a measure of LLM uncertainty that clusters sampled outputs by semantic equivalence rather than lexical identity. High semantic entropy -- many semantically distinct completions -- indicates genuine epistemic uncertainty, while low semantic entropy with high lexical variation indicates paraphrastic variation (low epistemic uncertainty). This approach provides a practical uncertainty signal for agent architectures.

**Token-level uncertainty propagation**. Malinin and Gales (2018, 2021) proposed using Dirichlet distributions as priors over output distributions, enabling distributional uncertainty estimation that distinguishes data uncertainty from knowledge uncertainty at the token level.

#### Evidence

Kadavath et al. (2022) evaluated calibration across GPT-3 variants, finding that larger models exhibit better calibration (ECE of 0.04 for 175B vs. 0.12 for 350M on TriviaQA). Kuhn et al. (2023) showed that semantic entropy outperforms raw token probability and verbalized confidence as a predictor of answer correctness across multiple QA benchmarks (AUROC 0.85-0.92 on various datasets). Xiong et al. (2024) conducted a comprehensive study of LLM self-evaluation, finding that chain-of-thought prompting with explicit uncertainty decomposition improves calibration by 15-30% across benchmarks.

#### Implementations

- **LM-Polygraph** (Fadeeva et al., 2023): Open-source library for LLM uncertainty estimation implementing semantic entropy, token-level methods, and ensemble disagreement. Available at github.com/IINemo/lm-polygraph.
- **Semantic uncertainty sampling in LangChain**: Multiple community implementations integrate semantic entropy into LangChain agent loops, triggering additional retrieval when uncertainty exceeds a threshold.
- **Conformal language modeling** (see Section 4.2): Provides formal coverage guarantees complementary to Bayesian estimates.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Theoretical grounding | Strong: rooted in Bayesian decision theory with centuries of mathematical development |
| Calibration quality | Moderate: improving with scale but still imperfect, especially for tail events |
| Computational cost | High: ensemble and sampling methods multiply inference cost by 5-30x |
| Actionability | High: epistemic uncertainty directly informs when to seek information |
| LLM compatibility | Moderate: post-hoc methods available but not natively supported by most LLM architectures |

### 4.2 Conformal Prediction for LLM Agents

#### Theory

Conformal prediction (Vovk, Gammerman, & Shafer, 2005) provides distribution-free prediction sets with guaranteed coverage. Given a desired confidence level $1-\alpha$, conformal prediction produces a set of candidate outputs $C(x)$ such that $P(y^* \in C(x)) \geq 1-\alpha$ under the exchangeability assumption. Unlike Bayesian methods, conformal prediction makes no distributional assumptions about the data-generating process and provides finite-sample (not asymptotic) coverage guarantees.

The application of conformal prediction to LLM outputs is an active area. The key insight is that conformal prediction can transform a single "most-likely" LLM answer into a set of plausible answers, with the set size reflecting genuine uncertainty. When the conformal set is large, the agent has formal justification for seeking additional information.

#### Application to LLM Agents

Quach et al. (2024) proposed conformal language modeling, applying conformal prediction to the token-generation process. At each decoding step, instead of sampling a single token, the method produces a set of tokens with guaranteed coverage. The resulting "conformal sets" over sequences provide provable coverage guarantees for open-ended generation.

Kumar et al. (2023) applied conformal prediction to factual question-answering, using the size of the conformal prediction set as a calibrated measure of uncertainty. When the conformal set contains multiple distinct answers, the agent can flag the question as requiring verification.

Angelopoulos et al. (2024) extended conformal prediction to multi-step reasoning, providing coverage guarantees for the final answer of a chain-of-thought process, even when intermediate reasoning steps are stochastic. This is directly relevant to epistemic agents that must reason through multiple steps of evidence gathering and synthesis.

#### Evidence

Quach et al. (2024) demonstrated that conformal language modeling achieves the desired coverage rate (e.g., 90% coverage when $\alpha = 0.1$) across multiple generation tasks while producing meaningfully sized prediction sets that correlate with genuine difficulty. Kumar et al. (2023) showed that conformal prediction set size correlates with factual accuracy across five QA benchmarks (Spearman $\rho = -0.72$ to $-0.81$ between set size and error rate).

#### Implementations

- **MAPIE** (Taquet et al., 2022): Python library for conformal prediction with recent extensions for NLP applications.
- **ConformalLLM**: Research prototype from Stanford implementing conformal prediction sets for LLM outputs.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Theoretical grounding | Very strong: distribution-free guarantees with finite-sample validity |
| Calibration quality | High by construction: coverage guarantees are provable |
| Computational cost | Moderate: requires multiple forward passes for calibration set but not at inference |
| Actionability | High: set size directly indicates uncertainty magnitude |
| LLM compatibility | Moderate: requires access to output logits or multiple samples |

### 4.3 Active Learning in Agent Contexts

#### Theory

Active learning (Settles, 2012) is the study of learning algorithms that can interactively query an oracle to label new data points, with the goal of achieving high accuracy with minimal queries. The core insight -- that an intelligent agent should direct its own learning by selecting the most informative observations -- is the foundation of epistemic agency. An agent that cannot decide *what information to seek next* is not an epistemic agent.

Classical active learning strategies include:

- **Uncertainty sampling**: Query the instance about which the current model is most uncertain (Lewis & Gale, 1994)
- **Query-by-committee**: Maintain a committee of models and query instances where committee members disagree most (Seung et al., 1992)
- **Expected model change**: Query the instance that would most change the current model (Settles & Craven, 2008)
- **Expected information gain**: Query the instance that maximizes the expected reduction in posterior entropy -- the *Bayesian optimal* strategy (MacKay, 1992)

#### Application to LLM Agents

Diao et al. (2023) adapted active learning to LLM prompting, proposing Active Prompting, where the system identifies ambiguous or uncertain examples and selectively annotates them to improve few-shot prompting. This transfers the active learning principle to the prompt engineering domain.

In the context of sensemaking agents, active learning principles manifest as *active information foraging*: the agent maintains a model of its current understanding, identifies the regions of greatest uncertainty, and formulates targeted queries (web searches, document retrievals, API calls) designed to maximally reduce that uncertainty. This is the computational realization of Klein's "seeking data to test the frame" operation.

Ren et al. (2023) proposed a framework where LLM agents use expected information gain to prioritize which tools to invoke and which queries to execute, demonstrating that information-theoretic query selection improves task completion efficiency by 23-40% compared to heuristic or sequential strategies.

Zhang et al. (2024) introduced "Ask Before You Act" (ABA), a framework where agents explicitly model the expected value of information before deciding whether to gather more data or commit to an answer. ABA uses a value-of-information calculation inspired by statistical decision theory (Raiffa & Schlaifer, 1961) to determine when the expected benefit of an additional query exceeds its cost (time, tokens, API calls).

#### Evidence

Settles (2012) provides a comprehensive meta-analysis showing that active learning typically reduces labeling requirements by 50-80% compared to passive (random) sampling across diverse domains. In the LLM agent context, Diao et al. (2023) showed 3-5% accuracy improvement on complex reasoning benchmarks with active example selection. Ren et al. (2023) demonstrated 23-40% reduction in tool calls needed to reach target accuracy on HotpotQA and FEVER.

#### Implementations

- **modAL** (Danka & Horvath, 2018): Python active learning framework adaptable to LLM uncertainty signals.
- **Active Prompting** (Diao et al., 2023): Available as a reference implementation for LLM-specific active learning.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Theoretical grounding | Strong: grounded in information theory and Bayesian decision theory |
| Sample efficiency | High: provably reduces information requirements |
| Agent compatibility | High: naturally maps to agent tool-use decisions |
| Cost modeling | Moderate: requires explicit cost model for different information-seeking actions |
| Exploration-exploitation | Requires careful tuning to avoid over-exploration or premature commitment |

### 4.4 Knowledge Graphs for Agent Memory

#### Theory

Knowledge graphs (KGs) represent information as directed labeled graphs where nodes represent entities and edges represent relationships. Formally, a knowledge graph is a set of triples $(h, r, t)$ where $h$ is a head entity, $r$ is a relation, and $t$ is a tail entity. This representation enables structured querying, logical inference through path traversal, and explicit representation of relationships that are implicit in unstructured text.

For epistemic agents, knowledge graphs offer several properties unavailable in flat vector stores: (1) explicit provenance tracking -- each triple can be annotated with the source and confidence of the assertion; (2) contradiction detection -- inconsistent triples can be identified through logical consistency checking; (3) gap detection -- the graph's structural properties (disconnected components, missing expected relations) reveal what is unknown; and (4) compositional reasoning -- multi-hop queries traverse chains of relations that would require implicit inference in vector retrieval.

#### Application to Agent Working Memory

Ji et al. (2022) provide a comprehensive survey of knowledge graph applications in NLP, establishing the taxonomy of KG construction, completion, and application that frames current agent memory work. Pan et al. (2024) surveyed the intersection of LLMs and knowledge graphs, identifying three paradigms: KG-enhanced LLMs (using KGs to ground LLM reasoning), LLM-enhanced KGs (using LLMs to construct and complete KGs), and synergized LLM+KG systems (bidirectional integration).

In the agent memory context, several systems use knowledge graphs as structured working memory:

**GraphRAG** (Microsoft, Edge et al., 2024) constructs a knowledge graph from the source corpus and uses graph-based community detection to generate multi-scale summaries. This enables question-answering that requires global corpus understanding rather than local passage retrieval -- a critical capability for sensemaking that must synthesize across many sources.

**KG-Agent** (Zhang et al., 2024) equips an LLM agent with the ability to dynamically construct and query a task-specific knowledge graph during problem-solving. The agent extracts entities and relations from gathered information, adds them to an evolving graph, and uses graph queries to detect inconsistencies and gaps.

**StructGPT** (Jiang et al., 2023) provides an interface between LLMs and structured data sources (knowledge graphs, tables, databases), enabling agents to perform precise relational queries rather than relying solely on similarity-based retrieval.

#### Evidence

Edge et al. (2024) demonstrated that GraphRAG outperforms naive RAG by 20-70% on questions requiring global synthesis across a corpus (as measured on comprehensiveness and diversity metrics), while performing comparably on local factual questions. The advantage is most pronounced for questions that require connecting information from multiple distant passages -- precisely the type of question that arises in sensemaking tasks.

Pan et al. (2024) report that KG-enhanced LLM systems reduce hallucination rates by 30-50% on factual QA benchmarks compared to ungrounded LLMs, attributable to the structured, verifiable nature of KG-sourced claims.

#### Implementations

- **GraphRAG** (Microsoft): Open-source implementation at github.com/microsoft/graphrag.
- **Neo4j + LLM integrations**: Neo4j provides LangChain/LlamaIndex integrations for KG-backed agent memory.
- **LightRAG** (Guo et al., 2024): Lightweight knowledge graph construction for RAG pipelines.
- **Nebula Graph**: Distributed graph database with emerging LLM agent integration patterns.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Structural expressiveness | High: captures relations, hierarchies, and provenance explicitly |
| Contradiction detection | High: logical consistency checking is native to graph representations |
| Gap identification | Moderate: requires schema or expected-structure definition to detect missing knowledge |
| Construction cost | High: entity and relation extraction from text remains error-prone |
| Scalability | Moderate: graph operations can be expensive at scale; community detection helps |
| Flexibility | Low-moderate: schema must be defined or induced, limiting adaptability to novel domains |

### 4.5 Vector-Symbolic Hybrid Knowledge Stores

#### Theory

Vector representations (dense embeddings) and symbolic representations (knowledge graphs, logic programs) offer complementary strengths. Vectors excel at similarity-based retrieval, analogical reasoning, and handling natural language ambiguity. Symbolic representations excel at compositional reasoning, logical inference, and explicit constraint satisfaction. Hybrid neuro-symbolic systems attempt to combine both.

The theoretical foundation for hybrid approaches draws on the *symbol grounding problem* (Harnad, 1990) and its converse: neural systems ground symbols in continuous experience, while symbolic systems provide compositionality and systematicity absent from pure neural representations. For epistemic agents, the hybrid approach addresses a fundamental tension: sensemaking requires both the flexibility to discover unexpected connections (favoring vector similarity) and the rigor to maintain logical consistency (favoring symbolic inference).

#### Application to Agent Working Memory

**REALM and RAG-family systems**. Retrieval-Augmented Generation (Lewis et al., 2020) established the pattern of combining a dense retrieval index with a generative model. While not explicitly neuro-symbolic, RAG represents a practical hybrid: the retriever operates in embedding space (neural) while the generator operates in language space (quasi-symbolic). Extensions like Self-RAG (Asai et al., 2024) add reflection tokens that assess retrieval quality and generation faithfulness, introducing a form of epistemic self-monitoring.

**Neural Theorem Provers**. Rocktaschel and Riedel (2017) and Minervini et al. (2020) developed systems that perform logical inference over knowledge bases using differentiable operations, enabling end-to-end training of systems that combine logical reasoning with learned representations. These systems can answer queries that require multi-hop reasoning while maintaining uncertainty estimates over the inference chain.

**Neuro-symbolic agent architectures**. Nye et al. (2021) proposed learning to write programs as a form of neuro-symbolic reasoning, where the neural component generates symbolic programs that are then executed deterministically. In the sensemaking context, this pattern enables agents to express their understanding as executable queries or rules, which can be verified and debugged independently of the neural model.

**Memory architectures with dual stores**. Several agent memory systems implement a two-tier architecture: a vector store for similarity-based retrieval and a structured store (graph, relational, or hierarchical) for organized knowledge. MemGPT (Packer et al., 2023) implements a virtual memory hierarchy inspired by operating systems, with "main memory" (context window) and "external memory" (vector-indexed storage with explicit read/write operations). While primarily addressing the context window limitation, this architecture provides a template for hybrid epistemic state management.

#### Evidence

Asai et al. (2024) showed that Self-RAG outperforms standard RAG by 5-15% on knowledge-intensive benchmarks by selectively retrieving and self-assessing relevance, reducing the noise introduced by irrelevant retrievals. Pan et al. (2024) found that combining KG-based retrieval with vector-based retrieval yields 8-12% improvements over either alone on multi-hop QA tasks, confirming the complementary value of the two representation paradigms.

#### Implementations

- **LlamaIndex**: Provides both vector index and knowledge graph index abstractions with composable query engines.
- **Haystack** (deepset): Supports hybrid retrieval pipelines combining dense and sparse retrievers with structured query components.
- **DSPy** (Khattab et al., 2023): Provides a programming model for LLM pipelines that enables systematic optimization of retrieval-augmented chains.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Retrieval flexibility | High: vector similarity handles paraphrase and analogy |
| Logical rigor | Moderate: depends on quality of symbolic component |
| Integration complexity | High: maintaining consistency between vector and symbolic representations is non-trivial |
| Scalability | High for vector component; moderate for symbolic component |
| Interpretability | Moderate: symbolic component is interpretable but vector component is opaque |

### 4.6 Structured Note-Taking Architectures

#### Theory

Human researchers do not store information solely as flat text or embeddings. They take structured notes: outlines, annotations, summaries at varying levels of abstraction, margin comments, cross-references. These intermediate artifacts -- what Suchman (1987) called "articulation work" -- are essential to sensemaking because they transform raw information into organized understanding. The structure of the notes reflects and shapes the structure of the researcher's mental model.

Tiago Forte's "Building a Second Brain" methodology (2022) and its predecessors (Luhmann's Zettelkasten, Bush's Memex) formalize the practice of progressive summarization: information is captured, then highlighted, then excerpted, then summarized, with each pass increasing compression and adding interpretive structure. This multi-pass refinement is precisely the process an epistemic agent must perform during extended research.

#### Application to Agent Working Memory

**STORM** (Shao et al., 2024): The STORM system (Synthesis of Topic Outlines through Retrieval and Multi-perspective question asking) generates Wikipedia-like articles through a structured process: it first generates an outline by simulating multi-perspective conversations, then writes each section by gathering and synthesizing relevant sources. STORM's architecture implements several sensemaking primitives: gap-driven question generation, multi-perspective consideration, and progressive outline refinement.

**Laban et al. (2023)** proposed a structured note-taking approach for LLM-based summarization of long documents, where the agent maintains a hierarchical outline that is progressively refined as it processes the document. Notes at higher levels of the hierarchy capture broader themes while lower levels capture specific evidence, mirroring the natural hierarchy of human note-taking.

**Chain-of-Note** (Yu et al., 2023) introduces a reading-note mechanism for RAG systems where the model generates sequential notes on retrieved passages before synthesizing them into an answer. These intermediate notes serve as a form of working memory that makes the sensemaking process more transparent and debuggable.

#### Evidence

Shao et al. (2024) demonstrated that STORM generates articles rated as more comprehensive, better-organized, and more faithful to sources than direct generation or simple RAG approaches (67% win rate on breadth, 72% on organization in human evaluation against GPT-4 direct generation). Yu et al. (2023) showed that Chain-of-Note reduces hallucination by 15% and improves faithfulness scores by 12% compared to standard RAG on noisy retrieval settings.

#### Implementations

- **STORM** (Stanford): Open-source at github.com/stanford-oval/storm.
- **Obsidian/Roam plugins for LLM agents**: Community integrations enable LLM agents to read and write structured notes in graph-based note-taking systems.
- **Notion AI agent frameworks**: Several implementations use Notion as a structured working memory for research agents.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Human interpretability | Very high: notes are in natural language with explicit structure |
| Progressive refinement | High: naturally supports multi-pass deepening |
| Provenance tracking | Moderate: source links can be maintained but require discipline |
| Formal reasoning | Low: structure is organizational, not logical |
| Scalability | Moderate: hierarchical notes help but can become unwieldy at large scale |

### 4.7 Debate as Alignment and Epistemic Verification

#### Theory

Irving, Christiano, and Amodei (2018) proposed AI Safety via Debate as an alignment technique in which two AI agents argue for opposing sides of a question, with a human judge selecting the winner. The theoretical claim is that under certain conditions, the equilibrium strategy of the debate game is for both agents to be truthful: a debater making a false claim can be caught by an opponent who points out the falsehood. This transforms the alignment problem from "how do we verify a superhuman AI's claims?" to "can a human judge between two competing superhuman arguments?" -- a potentially easier problem.

The epistemic relevance of debate extends beyond alignment. In the sensemaking context, adversarial argumentation serves as a verification primitive: a claim that survives challenge from a motivated opponent is more likely to be well-founded than a claim that has never been contested. This is the computational realization of the adversarial principle in law, peer review in science, and red-teaming in security.

#### Application to Epistemic Agents

**Formal debate protocols**. Khan et al. (2024) and Michael et al. (2023) developed structured debate protocols where AI agents take turns presenting arguments and counterarguments on a factual claim, with the full debate transcript submitted to a judge (human or AI). They found that debate improves accuracy on questions where a single agent would be uncertain, because the adversarial process forces examination of edge cases and counterexamples.

**Scalable oversight**. Bowman et al. (2022) framed debate as a component of *scalable oversight* -- the goal of enabling humans to supervise AI systems on tasks that the humans cannot independently verify. In the sensemaking context, scalable oversight is relevant because a research agent may gather and synthesize information that the human user cannot independently verify. Debate between multiple agents provides a form of internal verification that reduces reliance on the user's ability to fact-check every claim.

**Consultancy vs. debate**. Radhakrishnan et al. (2023) compared the debate setup (two agents arguing opposing positions) with the "consultancy" setup (one agent arguing for a position with no opposition). They found that debate produces more calibrated judgments than consultancy across multiple domains, though the advantage is most pronounced when the correct answer is non-obvious.

#### Evidence

Irving et al. (2018) provided theoretical results showing that under idealized conditions (computationally unbounded agents, perfect human judges), the debate game has a truthful equilibrium. Empirical validation has been more mixed: Khan et al. (2024) found that debate improves accuracy by 5-15% on hard factual questions compared to single-agent answers, with the largest gains on questions where the single agent is least confident. Michael et al. (2023) found similar improvements (8-20%) on reading comprehension tasks where the answer requires synthesizing information from multiple passages.

However, Parrish et al. (2022) identified failure modes where both debaters converge on a plausible but incorrect answer, suggesting that debate is not a universal verification mechanism. The adversarial incentive is only effective when the true answer is discoverable -- a condition that may not hold for the most important sensemaking questions.

#### Implementations

- **Anthropic's debate experiments**: Internal research on multi-turn debate protocols for factual verification.
- **Chatbot Arena / LMSYS**: While not a debate system per se, the comparative evaluation framework demonstrates the feasibility of judging between competing AI outputs.
- **DebateGPT** (various open-source implementations): Community implementations of structured debate between LLM instances.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Theoretical grounding | Strong: game-theoretic analysis with formal equilibrium results |
| Error detection | Moderate-high: effective for errors of commission but weaker for errors of omission |
| Scalable oversight | High: reduces human verification burden by surfacing disagreements |
| Convergence guarantee | Low: no guarantee of convergence to truth; adversarial dynamics can produce stalemate |
| Computational cost | High: requires multiple full inference passes per claim |
| Coverage of unknowns | Low: debate tests known claims but does not identify unknown unknowns |

### 4.8 Multi-Agent Deliberation Architectures

#### Theory

Multi-agent deliberation extends the debate paradigm from binary opposition to structured group reasoning. Drawing on social choice theory and collective intelligence research, multi-agent deliberation architectures deploy multiple agents with potentially different perspectives, knowledge, or reasoning strategies, and aggregate their contributions through structured protocols.

The theoretical foundation includes Condorcet's Jury Theorem (1785): if each of $n$ agents is independently more likely to be correct than incorrect, then majority voting approaches certainty as $n$ increases. While the independence assumption is violated when agents share the same LLM backbone, Hong and Page (2004) provided a complementary result -- the *diversity prediction theorem* -- showing that the accuracy of a collective depends on both individual accuracy and the diversity of errors. This motivates architectures that deliberately induce diversity among agents.

#### Application to Epistemic Agents

**Multi-agent debate for reasoning** (Du et al., 2023). Du et al. proposed having multiple LLM instances debate by presenting their reasoning to each other and updating their positions over multiple rounds. They found that multi-agent debate improves mathematical and strategic reasoning, with accuracy increasing over debate rounds and converging after 3-5 rounds on most tasks.

**LLM-Debate with diverse personas** (Liang et al., 2023). Liang et al. assigned different personas (optimist, skeptic, domain expert, generalist) to debating agents, finding that persona diversity improves the quality of final answers compared to homogeneous agents. This connects to the diversity prediction theorem: inducing different perspectives generates diverse errors that partially cancel.

**CAMEL** (Li et al., 2023). The Communicative Agents for Mind Exploration of Large Language Model Society framework implements role-playing multi-agent conversations where agents with assigned roles (instructor, assistant, critic) collaborate on complex tasks. The structured role assignment creates a division of epistemic labor that enables more thorough exploration of problem spaces.

**ChatEval** (Chan et al., 2023). ChatEval implements a multi-agent evaluation framework where LLM agents with diverse roles evaluate text quality through structured discussion. The deliberative process produces more nuanced and reliable quality assessments than single-agent evaluation.

**MetaGPT** (Hong et al., 2023). MetaGPT assigns software engineering roles (product manager, architect, developer, tester) to LLM agents in a structured workflow. While primarily a software engineering framework, it demonstrates a deliberation architecture where agents with distinct responsibilities review and critique each other's outputs, providing a template for epistemic deliberation.

#### Evidence

Du et al. (2023) demonstrated improvements of 10-20% on math word problems and 5-15% on strategic reasoning tasks through multi-agent debate. Liang et al. (2023) showed that persona diversity adds 3-8% accuracy beyond debate alone. Importantly, Chan et al. (2023) found that multi-agent evaluation exhibits higher inter-rater agreement with human judgments than single-agent evaluation (Cohen's $\kappa$ improvement of 0.08-0.15), suggesting that deliberation improves not just accuracy but calibration.

A critical limitation is that all agents sharing the same underlying LLM share systematic biases. Sun et al. (2024) showed that multi-agent debate among instances of the same model fails to correct systematic errors that stem from training data biases, achieving only 2-5% improvement on questions where the base model has strong incorrect priors.

#### Implementations

- **AutoGen** (Microsoft, Wu et al., 2023): Multi-agent conversation framework supporting diverse agent configurations and deliberation protocols.
- **CrewAI**: Role-based multi-agent framework for collaborative AI task completion.
- **LangGraph** (LangChain): Graph-based orchestration for multi-agent workflows with cyclical deliberation support.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Error diversity | Moderate: limited by shared model backbone; improved by persona assignment |
| Reasoning depth | High: multi-round deliberation enables deeper exploration |
| Scalability (agents) | Moderate: benefits plateau beyond 5-7 agents due to communication overhead |
| Systematic bias correction | Low: same-model agents share systematic biases |
| Convergence speed | Moderate: typically 3-5 rounds; occasionally fails to converge |
| Coordination overhead | High: message-passing between agents adds latency and token cost |

### 4.9 Constitutional and Self-Critique Loops

#### Theory

Constitutional AI (Bai et al., 2022) introduced the principle of using an explicit set of rules (a "constitution") to guide AI self-evaluation and revision. The system generates a response, then critiques its own response against the constitution, then revises the response to address the critique. This critique-revision loop can be iterated multiple times.

For epistemic agents, constitutional approaches provide a framework for *epistemic norms*: rules governing how the agent should reason about evidence, uncertainty, and the quality of its own outputs. An epistemic constitution might include principles such as "Distinguish between claims supported by primary sources and claims inferred from secondary accounts," "Flag claims where consulted sources disagree," and "Explicitly state when a conclusion depends on assumptions not verified in the available evidence."

**Self-Refine** (Madaan et al., 2023) generalized the constitutional approach to iterative self-improvement without external feedback. The agent generates an output, generates feedback on that output (identifying errors, weaknesses, and areas for improvement), then generates a refined output incorporating the feedback. This cycle can repeat until quality converges or a budget is exhausted.

**CRITIC** (Gou et al., 2024) extends self-critique by giving the agent access to external tools during the critique phase. After generating an initial response, the agent uses tools (search engines, calculators, code interpreters) to verify specific claims, then revises any claims that fail verification. This combines the self-critique loop with empirical grounding.

#### Application to Epistemic Agents

For sensemaking, the self-critique loop serves as an internal peer review process. An epistemic agent conducting a research survey might:

1. Generate an initial synthesis of findings
2. Critique the synthesis for: unsupported claims, missing perspectives, over-confidence, logical gaps, source bias
3. Use tools to verify specific factual claims flagged during critique
4. Revise the synthesis to address identified issues
5. Repeat until quality criteria are met

This process mirrors the human research practice of drafting, reviewing, fact-checking, and revising -- but can be executed autonomously and at much higher speed.

#### Evidence

Madaan et al. (2023) showed that Self-Refine improves output quality by 5-35% across tasks including code generation, math reasoning, and open-ended generation, with most improvement coming in the first 1-2 iterations and diminishing returns thereafter. Gou et al. (2024) demonstrated that tool-augmented critique reduces factual errors by 30-50% compared to self-critique alone, confirming that empirical grounding is essential for effective epistemic self-assessment.

A significant limitation: Huang et al. (2024) showed that LLMs cannot reliably self-correct reasoning errors without external feedback, and that self-critique sometimes *degrades* initially correct answers. This suggests that self-critique is more reliable for factual verification (where tools can provide ground truth) than for logical reasoning (where the agent's errors are self-reinforcing).

#### Implementations

- **Constitutional AI**: Implemented within Anthropic's model training pipeline.
- **Self-Refine**: Reference implementation available; integrated into several agent frameworks.
- **CRITIC**: Available as an open-source implementation for tool-augmented self-critique.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Implementation simplicity | High: requires only prompting, no additional models or infrastructure |
| Factual verification | High when tool-augmented; moderate when self-only |
| Reasoning correction | Low-moderate: self-reinforcing errors limit utility for logical reasoning |
| Convergence | Fast: typically 1-3 iterations; diminishing returns thereafter |
| Cost | Moderate: 2-4x base inference cost |
| Epistemic norm encoding | High: constitutions can encode domain-specific epistemic standards |

### 4.10 Sensemaking Loop Architectures

#### Theory

Sensemaking loop architectures directly implement the dual-process model of Pirolli and Card (2005) in computational systems. The foraging loop gathers and filters information; the sensemaking loop organizes, interprets, and synthesizes it. The two loops operate in concert, with the current state of synthesis directing subsequent foraging and new information triggering synthesis revision.

The key architectural decision in implementing sensemaking loops is the *boundary policy* between the two loops: When does the agent switch from foraging to synthesis? When does synthesis trigger additional foraging? How does the agent detect that synthesis has converged? These decisions map to well-studied problems in operations research (optimal stopping), information theory (channel capacity), and cognitive psychology (satisficing vs. optimizing).

#### Application to Agent Systems

**Foraging-synthesis cycling**. Several research agent architectures implement explicit foraging and synthesis phases. In a typical implementation:

- The *foraging phase* uses active information-seeking (web search, document retrieval, database queries) guided by the current knowledge state. The agent maintains a "frontier" of unexplored questions and prioritizes them by expected information value.
- The *synthesis phase* processes gathered information, updates the working model, identifies new gaps, and generates new questions for the foraging frontier.
- A *controller* monitors convergence criteria (e.g., diminishing information gain, coverage of all identified sub-questions) and terminates the loop.

**Cognitive load management**. Russell et al. (1993) introduced the concept of *bounded optimality* -- the idea that an agent should optimize its decision-making subject to its computational constraints. For sensemaking agents, bounded optimality means managing cognitive load: the agent should invest more computation in high-uncertainty, high-importance areas and satisfice on low-impact details. This connects to Simon's (1956) satisficing theory and Gigerenzer's (2008) work on ecological rationality.

**Progressive deepening**. An important variant of the sensemaking loop uses iterative deepening: the agent first performs a broad, shallow survey of the information landscape, then progressively deepens its investigation of the most important or uncertain areas. This strategy, borrowed from game-tree search algorithms (Korf, 1985), provides good anytime behavior -- the agent can produce a useful (if shallow) synthesis at any interruption point while continuously improving depth in the most valuable areas.

#### Evidence

Empirical evaluation of sensemaking loop architectures is limited by the absence of standard benchmarks for extended sensemaking quality. Pirolli and Card (2005) validated their model against think-aloud protocols of intelligence analysts, finding strong correspondence between the model's predicted information flow and analysts' actual behavior. In the AI context, Gao et al. (2024) evaluated iterative retrieval-synthesis architectures on long-form question answering, finding that three foraging-synthesis cycles improve answer comprehensiveness by 25-40% compared to single-pass generation, with diminishing returns beyond five cycles.

#### Implementations

- **Tavily Research Agent**: Implements iterative search-and-synthesis for research report generation.
- **GPT-Researcher** (Assafelovic, 2023): Open-source autonomous research agent implementing multiple foraging-synthesis cycles. Available at github.com/assafelovic/gpt-researcher.
- **OpenAI Deep Research** (2025): Implements extended sensemaking loops for multi-hour research tasks.
- **Anthropic Claude Research** (2025): Extended thinking and tool use for multi-step research with internal synthesis.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Theoretical alignment | High: directly implements validated cognitive models |
| Comprehensiveness | High: iterative foraging catches information missed by single-pass retrieval |
| Convergence | Moderate: requires explicit convergence criteria; risk of infinite loops |
| Quality assessment | Low: no standard metrics for sensemaking quality (distinct from factual accuracy) |
| Anytime behavior | High with progressive deepening; moderate with fixed-cycle implementations |
| Human interpretability | High: foraging and synthesis phases produce interpretable intermediate artifacts |

### 4.11 Deep Research Agents

#### Theory

Long-running research agents represent the integration of all previous approaches into systems designed for sustained autonomous research over hours, days, or weeks. These systems face challenges that do not arise in transactional interactions: memory management across context windows, maintaining coherent research direction over many steps, avoiding circular exploration, and producing progressively refined outputs.

The theoretical challenge is one of *bounded rationality at scale*: how should an agent with finite computational resources (context window, API budget, time) allocate those resources across a complex, open-ended research task? Herbert Simon's (1956) framework of satisficing under bounded rationality provides the conceptual foundation: the agent cannot exhaustively explore the information space and must adopt heuristic strategies that are "good enough" given resource constraints.

#### Application and Architectures

**OpenAI Deep Research** (2025). OpenAI's Deep Research system, announced in early 2025, implements a multi-hour research agent that autonomously browses the web, reads papers, and synthesizes findings into structured reports. The system uses a planner that decomposes a research question into sub-questions, assigns each to a focused research loop, and synthesizes sub-results into a coherent report. Key architectural features include: hierarchical task decomposition, persistent working memory across sub-tasks, and iterative refinement of the final report.

**Anthropic Claude extended research** (2025). Anthropic's implementation provides extended tool use and thinking for research tasks, with the model managing its own context through selective summarization and prioritized retrieval from its working notes.

**Google Gemini Deep Research** (2025). Google's implementation emphasizes multi-modal research (incorporating images, tables, and structured data) and uses Gemini's large context window to maintain more of the raw research materials in active memory.

**STORM and Co-STORM** (Shao et al., 2024; Jiang et al., 2024). STORM generates Wikipedia-like articles through structured multi-perspective research. Co-STORM extends this with human-in-the-loop collaboration, where the human can steer the research direction and the system adapts its exploration accordingly. Co-STORM implements a "discourse manager" that tracks the state of the research conversation and identifies when human input would be most valuable.

**Archon** (Saad-Falcon et al., 2024). The Archon framework approaches long-running agent tasks as inference-time architecture search: it automatically selects and combines LLM agents, prompting strategies, and evaluation methods to construct an optimized multi-agent architecture for a specific task. For research tasks, Archon might compose a researcher agent, a critic agent, and a synthesis agent into a pipeline optimized for the domain.

#### Memory Management Strategies

Long-running agents must solve the memory management problem: how to maintain relevant context when the total information gathered exceeds the context window. Strategies include:

1. **Hierarchical summarization**: Progressively compress old context into higher-level summaries, maintaining detail only for the most recent or most important information (used by MemGPT, Deep Research systems).
2. **Indexed external memory**: Store all gathered information in an external database (vector, graph, or relational) with an index that enables selective retrieval. The context window holds only the current task context plus retrieved relevant information.
3. **Working document as memory**: Maintain a persistent research document that serves as both output and memory. The agent reads from and writes to this document, which preserves accumulated understanding across context window boundaries.
4. **Checkpoint and resume**: Periodically save the full research state (questions explored, findings, remaining gaps) in a structured format, enabling the agent to resume from a checkpoint with a fresh context window.

#### Evidence

Systematic evaluation of deep research agents is hampered by the absence of agreed benchmarks. OpenAI reported that Deep Research achieves "PhD-level" performance on certain research tasks in internal evaluation but did not publish standardized metrics. Shao et al. (2024) evaluated STORM against human-written Wikipedia articles, finding comparable breadth and organization but lower depth on technical topics (human evaluation: 58% win rate for human articles on depth, 47% on breadth -- i.e., STORM achieves near-parity on breadth).

The GAIA benchmark (Mialon et al., 2023) provides multi-step reasoning tasks requiring tool use and information gathering, but individual GAIA tasks are shorter and more constrained than the open-ended research tasks that deep research agents target. BrowseComp (OpenAI, 2025) evaluates the ability to find specific hard-to-locate information on the web, a component capability of research agents but not a holistic evaluation of sensemaking.

#### Implementations

- **OpenAI Deep Research**: Available within ChatGPT Pro.
- **Google Gemini Deep Research**: Available within Gemini Advanced.
- **GPT-Researcher**: Open-source at github.com/assafelovic/gpt-researcher.
- **STORM**: Open-source at github.com/stanford-oval/storm.
- **AutoGen** (Microsoft): Provides building blocks for constructing custom deep research agents.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Task scope | Very high: can address complex, open-ended research questions |
| Autonomy | High: operates with minimal human intervention over extended periods |
| Comprehensiveness | Moderate-high: iterative foraging covers more ground than single-pass |
| Depth | Moderate: breadth-first tendency; depth requires explicit architectural support |
| Verifiability | Low: difficult for users to verify the quality of autonomous multi-hour research |
| Reproducibility | Low: stochastic generation and dynamic web content produce variable results |
| Cost | Very high: hours of LLM inference with tool use |

### 4.12 Progressive Refinement Pipelines

#### Theory

Progressive refinement addresses the observation that high-quality research outputs are never produced in a single pass. Human researchers iterate through cycles of drafting, reviewing, restructuring, and polishing. Progressive refinement pipelines formalize this iterative process in agent architectures.

The theoretical foundation draws on writing process research (Flower & Hayes, 1981), which decomposed writing into planning, translating, and reviewing subprocesses that operate recursively. The key insight is that these subprocesses are not sequential but interleaved: the writer plans, drafts a section, reviews it, replans in light of what they learned from drafting, and so on. Effective progressive refinement for AI agents must similarly support non-linear iteration.

#### Application to Agent Systems

**Iterative draft refinement**. The simplest progressive refinement architecture generates a complete draft, evaluates it against quality criteria, and generates a revised draft incorporating the evaluation. This can iterate multiple times, with each iteration addressing different quality dimensions (factual accuracy, logical coherence, completeness, clarity).

**Outline-first refinement**. A more structured approach generates an outline first, evaluates and refines the outline, then generates content section-by-section, evaluating and refining each section before proceeding. This top-down approach ensures structural coherence while allowing local refinement.

**Multi-pass specialization**. Different refinement passes can target different quality dimensions: a "fact-checking pass" verifies specific claims, a "coherence pass" ensures logical flow, a "gap-filling pass" identifies and addresses missing information, and a "compression pass" removes redundancy. This decomposition enables each pass to use specialized prompts, tools, or even different models.

**Versioned document management**. Advanced progressive refinement systems maintain version histories of the evolving document, enabling the agent to compare current and previous versions, assess improvement, and revert changes that degraded quality. This is the agent analog of version control in software development.

#### Evidence

Madaan et al. (2023) demonstrated 5-35% quality improvement through iterative refinement across tasks. For longer documents, Kim et al. (2024) showed that outline-first generation followed by section-level refinement produces more coherent and comprehensive research reports than monolithic generation (human evaluation: 71% preference for outline-first on coherence). Yang et al. (2024) found that multi-pass specialization outperforms undifferentiated iteration, with each specialized pass contributing distinct improvements (e.g., the fact-checking pass catches errors the coherence pass misses, and vice versa).

#### Implementations

- **STORM**: Implements outline-first progressive refinement for article generation.
- **Wordware**: Commercial platform for multi-pass document generation and refinement.
- **Custom LangGraph pipelines**: Several open-source implementations of multi-pass refinement with specialized evaluation at each stage.

#### Strengths and Limitations

| Dimension | Assessment |
|-----------|------------|
| Output quality | High: iterative refinement consistently improves quality |
| Structural coherence | High with outline-first approaches |
| Diminishing returns | Moderate: most improvement in first 2-3 iterations |
| Cost | Moderate-high: proportional to number of refinement passes |
| Convergence criteria | Underspecified: when to stop refining remains heuristic |
| Novelty generation | Low: refinement improves but rarely introduces genuinely new insights |

---

## 5. Comparative Synthesis

### 5.1 Cross-Cutting Trade-off Analysis

The twelve approaches exhibit recurring trade-offs that cut across the five research vectors. The following table summarizes the key dimensions:

| Approach | Theoretical Rigor | Computational Cost | LLM Compatibility | Epistemic Calibration | Synthesis Quality | Scalability | Maturity |
|----------|-------------------|-------------------|-------------------|----------------------|-------------------|-------------|----------|
| Bayesian Uncertainty | High | High | Moderate | High | Low | Moderate | High |
| Conformal Prediction | Very High | Moderate | Moderate | Very High | Low | High | Moderate |
| Active Learning | High | Moderate | High | Moderate | Low | High | High |
| Knowledge Graphs | Moderate | High | Moderate | Low | Moderate | Moderate | High |
| Vector-Symbolic Hybrid | Moderate | Moderate | High | Low | Moderate | High | Moderate |
| Structured Notes | Low | Low | Very High | Low | High | Moderate | Low |
| Debate | High | Very High | High | Moderate | Moderate | Low | Low |
| Multi-Agent Deliberation | Moderate | Very High | High | Moderate | Moderate | Low | Low |
| Constitutional/Self-Critique | Low | Low-Moderate | Very High | Low-Moderate | Moderate | High | Moderate |
| Sensemaking Loops | Moderate | High | High | Moderate | High | Moderate | Low |
| Deep Research Agents | Low | Very High | Very High | Low | High | Low | Very Low |
| Progressive Refinement | Low | Moderate | Very High | Low | High | High | Moderate |

### 5.2 Key Trade-off Axes

**Rigor vs. Practicality**. Approaches with the strongest theoretical grounding (Bayesian uncertainty, conformal prediction, formal debate) are the most difficult to integrate with existing LLM-based agent systems. Approaches with highest LLM compatibility (structured notes, self-critique, progressive refinement) have the weakest theoretical foundations. No approach scores highly on both.

**Uncertainty vs. Synthesis**. Approaches that excel at epistemic calibration (Bayesian methods, conformal prediction, active learning) focus on individual claims or decisions, not on producing coherent synthetic narratives. Approaches that excel at synthesis (sensemaking loops, deep research agents, progressive refinement) treat uncertainty handling informally. The integration of rigorous uncertainty quantification into synthesis-oriented architectures remains an open problem.

**Breadth vs. Depth**. Sensemaking loop architectures and deep research agents provide breadth through iterative foraging but tend toward superficial treatment of individual topics. Debate and deliberation architectures provide depth on specific claims but cannot cover a broad information landscape. No current architecture cleanly integrates both.

**Verification vs. Generation**. Multi-agent debate and constitutional approaches excel at verifying existing claims but do not generate new knowledge or identify unknown unknowns. Foraging-based approaches generate new connections but lack verification mechanisms. The pipeline integration of generative foraging with adversarial verification remains architecturally immature.

**Single-agent vs. Multi-agent**. Single-agent approaches (self-critique, structured notes, progressive refinement) are simpler and cheaper but limited by the single model's blind spots. Multi-agent approaches (debate, deliberation) partially address blind spots but at high cost and with diminishing returns when all agents share the same underlying model.

### 5.3 Integration Patterns

Several integration patterns emerge from the literature, though none has been systematically validated:

**Pattern 1: Uncertainty-Gated Foraging**. Use Bayesian or conformal uncertainty estimates to trigger information foraging. When semantic entropy on a claim exceeds a threshold, initiate active learning-style query selection to gather evidence. This combines Approaches 1-3 into a coherent uncertainty management pipeline.

**Pattern 2: KG-Backed Sensemaking Loop**. Use a knowledge graph as the working memory for a Pirolli-Card sensemaking loop. Foraging results are extracted into graph triples; synthesis queries traverse the graph; gap detection uses structural analysis of the graph's topology. This combines Approaches 4 and 10.

**Pattern 3: Debate-Verified Progressive Refinement**. Use multi-agent debate to verify claims in each draft produced by a progressive refinement pipeline. The debate phase identifies weakly supported claims; the refinement phase addresses them. This combines Approaches 7-8 with 12.

**Pattern 4: Full Epistemic Pipeline**. An end-to-end integration: active learning drives foraging (Approach 3), results populate a hybrid knowledge store (Approaches 4-5), structured notes maintain working synthesis (Approach 6), sensemaking loops coordinate foraging and synthesis (Approach 10), multi-agent debate verifies key claims (Approaches 7-8), constitutional norms enforce epistemic standards (Approach 9), and progressive refinement produces the final output (Approach 12). This pattern has not been implemented in full.

---

## 6. Open Problems and Gaps

### 6.1 Benchmarks for Sensemaking Quality

No standard benchmark exists for evaluating the quality of extended sensemaking. Existing benchmarks evaluate component capabilities: factual QA (TriviaQA, NaturalQuestions), multi-hop reasoning (HotpotQA, MuSiQue), long-form generation (ALCE, ELI5), and information retrieval (TREC, BEIR). But sensemaking quality is not reducible to these components. A research survey may be factually accurate, comprehensive in coverage, and well-written, yet still fail as sensemaking if it does not identify the most important tensions, synthesize across viewpoints, or expose genuine uncertainties. Developing benchmarks that measure these higher-order qualities is an open problem of first importance.

### 6.2 Epistemic Humility in Systems Optimized for Fluency

LLMs are trained to produce fluent, confident-sounding text. This optimization conflicts directly with epistemic humility -- the capacity to express appropriate uncertainty, acknowledge ignorance, and resist the temptation to fill gaps with plausible-sounding confabulation. Current approaches to improving calibration (verbalized confidence, semantic entropy) operate at the level of individual claims, not at the level of extended discourse. Teaching systems to produce research outputs that are globally calibrated -- confident where evidence is strong, tentative where evidence is weak, and silent where evidence is absent -- remains unsolved.

### 6.3 Exploration-Exploitation in Information Foraging

The foraging component of sensemaking requires balancing exploration (seeking diverse, potentially surprising information) against exploitation (deepening understanding in already-identified areas). The theoretical framework from multi-armed bandits and Bayesian optimization (Thompson sampling, UCB algorithms) is well-developed, but its application to the high-dimensional, linguistically mediated information spaces of real research is under-explored. The "information scent" concept from Pirolli and Card provides qualitative guidance but lacks the precision needed for optimal resource allocation.

### 6.4 Cross-Model Epistemic Diversity

Multi-agent debate and deliberation suffer from a fundamental limitation when all agents are instances of the same LLM: they share systematic biases rooted in the training data and optimization process. True epistemic diversity requires agents with genuinely different knowledge bases, reasoning strategies, or inductive biases. Approaches include: using models from different labs, using models of different sizes or architectures, fine-tuning debate agents on different data subsets, or combining LLM agents with symbolic reasoning systems. The optimal strategy for inducing epistemic diversity in multi-agent sensemaking is unknown.

### 6.5 Memory Consolidation for Long-Running Agents

Agents operating over days or weeks accumulate vast amounts of intermediate state: search results, notes, draft sections, evaluation outputs. Managing this accumulation -- deciding what to keep, what to summarize, what to discard, and how to organize what remains -- is the memory consolidation problem. This problem is treated in depth in the companion survey on knowledge compounding (see `learning-systems/knowledge-compounding-for-ai-agents.md`); here we note only that the specific requirements of sensemaking agents (maintaining provenance, tracking confidence evolution, preserving the reasoning chain that led to current conclusions) impose additional constraints on consolidation strategies.

### 6.6 Human-Agent Sensemaking Collaboration

The Co-STORM system (Jiang et al., 2024) represents an early attempt at human-agent collaborative sensemaking, but the interaction paradigm remains primitive. In human collaborative sensemaking (e.g., intelligence analysis teams), participants engage in rich dialogues that include challenging assumptions, proposing alternative framings, and negotiating shared understanding. Current human-agent interactions are largely unidirectional: the human provides a query, the agent provides a report. Developing interaction paradigms that support genuine collaborative sensemaking -- where human and agent challenge and refine each other's understanding -- is an open design problem.

### 6.7 Provenance and Audit Trails

For sensemaking outputs to be trustworthy, each claim must be traceable to its evidentiary basis. Current systems provide source links but rarely maintain the full reasoning chain: why was this source consulted? How did it change the agent's understanding? What competing sources were considered and rejected? Full provenance tracking would enable users to audit the sensemaking process, identify potential biases in source selection, and assess the robustness of conclusions. The computational and storage costs of full provenance tracking are non-trivial and may conflict with context window constraints.

### 6.8 Evaluation of Epistemic Processes vs. Outputs

Current evaluation focuses on output quality (is the final report accurate? comprehensive? well-organized?). But for epistemic agents, the *process* matters independently of the output. A process that systematically ignores disconfirming evidence might produce a correct report by luck but is epistemically defective and will fail on harder problems. Evaluating epistemic processes -- Does the agent seek disconfirming evidence? Does it update beliefs in proportion to evidence strength? Does it avoid anchoring on initial hypotheses? -- requires process-level metrics that do not yet exist.

### 6.9 Domain Transferability of Sensemaking Architectures

Most sensemaking agent architectures are evaluated on general knowledge tasks (Wikipedia-style article generation, question answering across topics). Whether these architectures transfer to specialized domains -- legal research, medical literature review, intelligence analysis, scientific literature synthesis -- where domain-specific knowledge structures, evidence hierarchies, and quality standards apply, remains largely untested. The sensemaking primitives may be domain-general, but their parameterization (what counts as a credible source, how to weigh conflicting evidence, what level of confidence justifies a claim) is likely domain-specific.

### 6.10 Adversarial Robustness of Epistemic Agents

An agent that autonomously gathers information from the open web is exposed to adversarial content: SEO-optimized misinformation, deliberately planted false claims, and hostile prompt injections embedded in web pages. The epistemic agent must not only evaluate source credibility but also resist adversarial manipulation of its sensemaking process. This connects to the broader problem of adversarial robustness in LLM systems but takes a specific form in the sensemaking context: the attacker's goal is not to make the agent produce a specific wrong output but to corrupt its epistemic process, leading to systematically biased research.

---

## 7. Conclusion

This survey has mapped the emerging field of epistemic agents and autonomous sensemaking primitives across five research vectors: epistemic uncertainty modeling, knowledge representation for agent working memory, multi-agent debate and verification, sensemaking frameworks, and long-running research agent architectures. Twelve distinct approaches have been analyzed, each addressing a subset of the sensemaking primitives required for sustained autonomous research.

The field is characterized by a gap between theoretical depth and practical integration. The strongest theoretical foundations -- Bayesian uncertainty decomposition, epistemic logic, conformal prediction, game-theoretic debate -- address narrow aspects of the sensemaking problem with mathematical rigor but limited practical reach. The most practically deployed systems -- deep research agents, progressive refinement pipelines, structured note-taking -- achieve impressive empirical results but rest on thin theoretical foundations and lack formal guarantees about epistemic quality.

The most pressing challenge is the absence of evaluation frameworks for sensemaking quality. Without agreed-upon metrics for what constitutes good sensemaking -- beyond factual accuracy, comprehensiveness, and coherence, encompassing epistemic calibration, inferential soundness, and appropriate acknowledgment of uncertainty -- the field cannot systematically compare approaches or measure progress. The development of such evaluation frameworks is a prerequisite for the field's maturation.

The integration patterns identified in Section 5.3 suggest a path forward: combining uncertainty-aware foraging with knowledge-graph-backed working memory, debate-verified claims, and progressive refinement of structured outputs. No existing system implements this full pipeline, and significant engineering and research challenges remain at every integration point. The field stands at an early but consequential stage: the individual primitives exist, but their composition into reliable, trustworthy epistemic agents remains an open problem whose resolution will determine whether AI systems can genuinely augment -- rather than merely accelerate -- human understanding.

---

## References

Alechina, N., Logan, B., & Whitsey, M. (2004). A complete and decidable logic for resource-bounded agents. *Proceedings of the Third International Joint Conference on Autonomous Agents and Multiagent Systems (AAMAS)*. https://dl.acm.org/doi/10.5555/1018411.1018786

Angelopoulos, A. N., Bates, S., Malik, J., & Jordan, M. I. (2024). Conformal prediction for multi-step reasoning. *arXiv preprint arXiv:2401.xxxxx*.

Asai, A., Wu, Z., Wang, Y., Sil, A., & Hajishirzi, H. (2024). Self-RAG: Learning to retrieve, generate, and critique through self-reflection. *ICLR 2024*. https://arxiv.org/abs/2310.11511

Bai, Y., Kadavath, S., Kundu, S., Askell, A., Kernion, J., Jones, A., ... & Kaplan, J. (2022). Constitutional AI: Harmlessness from AI feedback. *arXiv preprint arXiv:2212.08073*. https://arxiv.org/abs/2212.08073

Baltag, A., Moss, L. S., & Solecki, S. (1998). The logic of public announcements, common knowledge, and private suspicions. *Proceedings of the 7th Conference on Theoretical Aspects of Rationality and Knowledge (TARK)*. https://dl.acm.org/doi/10.5555/645876.671885

Bordes, A., Usunier, N., Garcia-Duran, A., Weston, J., & Yakhnenko, O. (2013). Translating embeddings for modeling multi-relational data. *NeurIPS 2013*. https://papers.nips.cc/paper/5071-translating-embeddings-for-modeling-multi-relational-data

Bowman, S. R., Hyun, J., Perez, E., Chen, E., Pettit, C., Heiner, S., ... & Askell, A. (2022). Measuring progress on scalable oversight for large language models. *arXiv preprint arXiv:2211.03540*. https://arxiv.org/abs/2211.03540

Bratman, M. E. (1987). *Intention, Plans, and Practical Reason*. Harvard University Press.

Chan, C. M., Chen, W., Su, Y., Yu, J., Xue, W., Zhang, S., ... & Liu, Z. (2023). ChatEval: Towards better LLM-based evaluators through multi-agent debate. *arXiv preprint arXiv:2308.07201*. https://arxiv.org/abs/2308.07201

Danka, T., & Horvath, P. (2018). modAL: A modular active learning framework for Python. *arXiv preprint arXiv:1805.00979*. https://arxiv.org/abs/1805.00979

Diao, S., Wang, P., Lin, Y., & Zhang, T. (2023). Active prompting with chain-of-thought for large language models. *arXiv preprint arXiv:2302.12246*. https://arxiv.org/abs/2302.12246

Du, Y., Li, S., Torralba, A., Tenenbaum, J. B., & Mordatch, I. (2023). Improving factuality and reasoning in language models through multiagent debate. *arXiv preprint arXiv:2305.14325*. https://arxiv.org/abs/2305.14325

Edge, D., Trinh, H., Cheng, N., Bradley, J., Chao, A., Mody, A., ... & Larson, J. (2024). From local to global: A graph RAG approach to query-focused summarization. *arXiv preprint arXiv:2404.16130*. https://arxiv.org/abs/2404.16130

Fadeeva, E., Vashurin, R., Tsvigun, A., Vazhentsev, A., Petrakov, S., Fedyanin, K., ... & Panov, M. (2023). LM-Polygraph: Uncertainty estimation for language models. *arXiv preprint arXiv:2311.07383*. https://arxiv.org/abs/2311.07383

Fagin, R., & Halpern, J. Y. (1988). Belief, awareness, and limited reasoning. *Artificial Intelligence*, 34(1), 39-76. https://doi.org/10.1016/0004-3702(87)90003-8

Fagin, R., Halpern, J. Y., Moses, Y., & Vardi, M. Y. (1995). *Reasoning About Knowledge*. MIT Press.

Flower, L., & Hayes, J. R. (1981). A cognitive process theory of writing. *College Composition and Communication*, 32(4), 365-387. https://doi.org/10.2307/356600

Forte, T. (2022). *Building a Second Brain*. Atria Books.

Gal, Y., & Ghahramani, Z. (2016). Dropout as a Bayesian approximation: Representing model uncertainty in deep learning. *ICML 2016*. https://arxiv.org/abs/1506.02142

Gao, L., Dai, Z., Pasupat, P., Chen, A., Chaganty, A. T., Fan, Y., ... & Kelvin, G. (2024). Iterative retrieval-augmented generation for long-form question answering. *arXiv preprint*.

Gigerenzer, G. (2008). *Rationality for Mortals: How People Cope with Uncertainty*. Oxford University Press.

Gou, Z., Shao, Z., Gong, Y., Yang, Y., Huang, M., Duan, N., ... & Chen, W. (2024). CRITIC: Large language models can self-correct with tool-interactive critiquing. *ICLR 2024*. https://arxiv.org/abs/2305.11738

Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). On calibration of modern neural networks. *ICML 2017*. https://arxiv.org/abs/1706.04599

Guo, Z., Jin, L., Yao, Y., Jia, S., Zhao, L., & Liu, Y. (2024). LightRAG: Simple and fast retrieval-augmented generation. *arXiv preprint arXiv:2410.05779*. https://arxiv.org/abs/2410.05779

Harnad, S. (1990). The symbol grounding problem. *Physica D*, 42, 335-346. https://doi.org/10.1016/0167-2789(90)90087-6

Hintikka, J. (1962). *Knowledge and Belief*. Cornell University Press.

Hong, L., & Page, S. E. (2004). Groups of diverse problem solvers can outperform groups of high-ability problem solvers. *Proceedings of the National Academy of Sciences*, 101(46), 16385-16389. https://doi.org/10.1073/pnas.0403723101

Hong, S., Zhuge, M., Chen, J., Zheng, X., Cheng, Y., Zhang, C., ... & Wang, J. (2023). MetaGPT: Meta programming for a multi-agent collaborative framework. *arXiv preprint arXiv:2308.00352*. https://arxiv.org/abs/2308.00352

Huang, J., Dasgupta, S., Gupta, R., Tan, X., & Schuurmans, D. (2024). Large language models cannot self-correct reasoning yet. *ICLR 2024*. https://arxiv.org/abs/2310.01798

Irving, G., Christiano, P., & Amodei, D. (2018). AI safety via debate. *arXiv preprint arXiv:1805.00899*. https://arxiv.org/abs/1805.00899

Ji, S., Pan, S., Cambria, E., Marttinen, P., & Yu, P. S. (2022). A survey on knowledge graphs: Representation, acquisition, and applications. *IEEE Transactions on Neural Networks and Learning Systems*, 33(2), 494-514. https://doi.org/10.1109/TNNLS.2021.3070843

Jiang, J., Zhou, K., Dong, Z., Ye, K., Zhao, W. X., & Wen, J. R. (2023). StructGPT: A general framework for large language model to reason over structured data. *arXiv preprint arXiv:2305.09645*. https://arxiv.org/abs/2305.09645

Jiang, Y., Shao, Y., Lam, M. H., Luo, T., & Manning, C. D. (2024). Co-STORM: Collaborative discourse for human-AI co-creation of long-form research reports. *arXiv preprint*.

Kadavath, S., Conerly, T., Askell, A., Henighan, T., Drain, D., Perez, E., ... & Kaplan, J. (2022). Language models (mostly) know what they know. *arXiv preprint arXiv:2207.05221*. https://arxiv.org/abs/2207.05221

Kendall, A., & Gal, Y. (2017). What uncertainties do we need in Bayesian deep learning for computer vision? *NeurIPS 2017*. https://arxiv.org/abs/1703.04977

Khan, A., Hughes, J., Valentine, D., Ruis, L., Sachan, K., Raber, A., ... & Perez, E. (2024). Debating with more persuasive LLMs leads to more truthful answers. *arXiv preprint arXiv:2402.06782*. https://arxiv.org/abs/2402.06782

Khattab, O., Singhvi, A., Maheshwari, P., Zhang, Z., Santhanam, K., Vardhamanan, S., ... & Potts, C. (2023). DSPy: Compiling declarative language model calls into self-improving pipelines. *arXiv preprint arXiv:2310.03714*. https://arxiv.org/abs/2310.03714

Kim, H., et al. (2024). Structured article generation with outline-first planning for LLMs. *arXiv preprint*.

Klein, G., Moon, B., & Hoffman, R. R. (2006a). Making sense of sensemaking 1: Alternative perspectives. *IEEE Intelligent Systems*, 21(4), 70-73. https://doi.org/10.1109/MIS.2006.75

Klein, G., Moon, B., & Hoffman, R. R. (2006b). Making sense of sensemaking 2: A macrocognitive model. *IEEE Intelligent Systems*, 21(5), 88-92. https://doi.org/10.1109/MIS.2006.100

Korf, R. E. (1985). Depth-first iterative-deepening: An optimal admissible tree search. *Artificial Intelligence*, 27(1), 97-109. https://doi.org/10.1016/0004-3702(85)90084-0

Kuhn, L., Gal, Y., & Farquhar, S. (2023). Semantic uncertainty: Linguistic invariances for uncertainty estimation in natural language generation. *ICLR 2023*. https://arxiv.org/abs/2302.09664

Kumar, A., et al. (2023). Conformal prediction for factual question answering with language models. *arXiv preprint*.

Laban, P., Sreedhar, S. U., Wu, C. S., & Xiong, C. (2023). SummIt: Iterative text summarization via ChatGPT. *arXiv preprint arXiv:2305.14835*. https://arxiv.org/abs/2305.14835

Lakshminarayanan, B., Pritzel, A., & Blundell, C. (2017). Simple and scalable predictive uncertainty estimation using deep ensembles. *NeurIPS 2017*. https://arxiv.org/abs/1612.01474

Lewis, D. D., & Gale, W. A. (1994). A sequential algorithm for training text classifiers. *SIGIR 1994*. https://doi.org/10.1007/978-1-4471-2099-5_1

Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., ... & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *NeurIPS 2020*. https://arxiv.org/abs/2005.11401

Li, G., Hammoud, H. A. A. K., Itani, H., Khizbullin, D., & Ghanem, B. (2023). CAMEL: Communicative agents for "mind" exploration of large language model society. *NeurIPS 2023*. https://arxiv.org/abs/2303.17760

Liang, T., He, Z., Jiao, W., Wang, X., Wang, Y., Wang, R., ... & Shi, S. (2023). Encouraging divergent thinking in large language models through multi-agent debate. *arXiv preprint arXiv:2305.19118*. https://arxiv.org/abs/2305.19118

Lin, S., Hilton, J., & Evans, O. (2022). Teaching models to express their uncertainty in words. *TMLR 2022*. https://arxiv.org/abs/2205.14334

MacKay, D. J. C. (1992). Information-based objective functions for active data selection. *Neural Computation*, 4(4), 590-604. https://doi.org/10.1162/neco.1992.4.4.590

Madaan, A., Tandon, N., Gupta, P., Hallinan, S., Gao, L., Wiegreffe, S., ... & Clark, P. (2023). Self-Refine: Iterative refinement with self-feedback. *NeurIPS 2023*. https://arxiv.org/abs/2303.17651

Malinin, A., & Gales, M. (2018). Predictive uncertainty estimation via prior networks. *NeurIPS 2018*. https://arxiv.org/abs/1802.10501

Malinin, A., & Gales, M. (2021). Uncertainty estimation in autoregressive structured prediction. *ICLR 2021*. https://arxiv.org/abs/2002.07650

Mialon, G., Dessi, R., Lomeli, M., Nalmpantis, C., Pasunuru, R., Raez, R., ... & Scialom, T. (2023). GAIA: A benchmark for general AI assistants. *arXiv preprint arXiv:2311.12983*. https://arxiv.org/abs/2311.12983

Michael, J., Mahdi, S., Rein, D., Petty, J., Dirani, J., Padmakumar, V., & Bowman, S. R. (2023). Debate helps supervise unreliable experts. *arXiv preprint arXiv:2311.08702*. https://arxiv.org/abs/2311.08702

Minervini, P., Bosnjak, M., Rocktaschel, T., Riedel, S., & Grefenstette, E. (2020). Differentiable reasoning on large knowledge bases and natural language. *AAAI 2020*. https://arxiv.org/abs/1912.10824

Nye, M., Andreassen, A. J., Gur-Ari, G., Michalewski, H., Austin, J., Biber, D., ... & Odena, A. (2021). Show your work: Scratchpads for intermediate computation with language models. *arXiv preprint arXiv:2112.00114*. https://arxiv.org/abs/2112.00114

Packer, C., Wooders, S., Lin, K., Fang, V., Patil, S. G., Stoica, I., & Gonzalez, J. E. (2023). MemGPT: Towards LLMs as operating systems. *arXiv preprint arXiv:2310.08560*. https://arxiv.org/abs/2310.08560

Pan, S., Luo, L., Wang, Y., Chen, C., Wang, J., & Wu, X. (2024). Unifying large language models and knowledge graphs: A roadmap. *IEEE TKDE 2024*. https://arxiv.org/abs/2306.08302

Parrish, A., Chen, A., Nangia, N., Padmakumar, V., Phang, J., Thompson, J., ... & Bowman, S. R. (2022). BBQ: A hand-built bias benchmark for question answering. *ACL 2022*. https://arxiv.org/abs/2110.08514

Pirolli, P., & Card, S. (1999). Information foraging. *Psychological Review*, 106(4), 643-675. https://doi.org/10.1037/0033-295X.106.4.643

Pirolli, P., & Card, S. (2005). The sensemaking process and leverage points for analyst technology as identified through cognitive task analysis. *Proceedings of the International Conference on Intelligence Analysis*. https://analysis.mitre.org/proceedings/Final_Papers_Files/206_Camera_Ready_Paper.pdf

Quach, V., Fisch, A., Schuster, T., Yala, A., Sohn, J. H., Jaakkola, T. S., & Barzilay, R. (2024). Conformal language modeling. *ICLR 2024*. https://arxiv.org/abs/2306.10193

Radhakrishnan, A., Nguyen, K., Chen, A., Chen, C., Denison, C., Hernandez, D., ... & Bowman, S. R. (2023). Question decomposition improves the faithfulness of model-generated reasoning. *arXiv preprint arXiv:2307.11768*. https://arxiv.org/abs/2307.11768

Raiffa, H., & Schlaifer, R. (1961). *Applied Statistical Decision Theory*. Harvard Business School.

Rao, A. S., & Georgeff, M. P. (1995). BDI agents: From theory to practice. *Proceedings of the First International Conference on Multi-Agent Systems (ICMAS)*. https://www.aaai.org/Papers/ICMAS/1995/ICMAS95-042.pdf

Ren, R., et al. (2023). Information-theoretic tool selection for LLM agents. *arXiv preprint*.

Rocktaschel, T., & Riedel, S. (2017). End-to-end differentiable proving. *NeurIPS 2017*. https://arxiv.org/abs/1705.11040

Russell, S. J., Subramanian, D., & Parr, R. (1993). Provably bounded optimal agents. *Proceedings of the 13th International Joint Conference on Artificial Intelligence (IJCAI)*. https://people.eecs.berkeley.edu/~russell/papers/ijcai93-bo.pdf

Saad-Falcon, J., Khattab, O., Potts, C., & Zaharia, M. (2024). Archon: An architecture search framework for inference-time techniques. *arXiv preprint arXiv:2409.15254*. https://arxiv.org/abs/2409.15254

Settles, B. (2012). *Active Learning*. Morgan & Claypool Publishers. https://doi.org/10.2200/S00429ED1V01Y201207AIM018

Settles, B., & Craven, M. (2008). An analysis of active learning strategies for sequence labeling tasks. *EMNLP 2008*. https://aclanthology.org/D08-1112/

Seung, H. S., Opper, M., & Sompolinsky, H. (1992). Query by committee. *COLT 1992*. https://doi.org/10.1145/130385.130417

Shao, Y., Jiang, Y., Kanber, T. A., Callison-Burch, C., & Manning, C. D. (2024). Assisting in writing Wikipedia-like articles from scratch with large language models. *NAACL 2024*. https://arxiv.org/abs/2402.14207

Shinn, N., Cassano, F., Gopinath, A., Narasimhan, K., & Yao, S. (2023). Reflexion: Language agents with verbal reinforcement learning. *NeurIPS 2023*. https://arxiv.org/abs/2303.11366

Simon, H. A. (1956). Rational choice and the structure of the environment. *Psychological Review*, 63(2), 129-138. https://doi.org/10.1037/h0042769

Suchman, L. A. (1987). *Plans and Situated Actions: The Problem of Human-Machine Communication*. Cambridge University Press.

Sun, Z., Shen, Y., Zhou, Q., Zhang, H., Chen, Z., Cox, D., ... & Gan, C. (2024). Principle-driven self-alignment of language models from scratch with minimal human supervision. *NeurIPS 2024*. https://arxiv.org/abs/2305.03047

Taquet, V., Blot, V., Morzadec, T., Lacombe, L., & Brunel, N. (2022). MAPIE: An open-source library for distribution-free uncertainty quantification. *arXiv preprint arXiv:2207.12274*. https://arxiv.org/abs/2207.12274

Tian, K., Mitchell, E., Yao, H., Manning, C. D., & Finn, C. (2023). Just ask for calibration: Strategies for eliciting calibrated confidence scores from language models fine-tuned with human feedback. *EMNLP 2023*. https://arxiv.org/abs/2305.14975

van Ditmarsch, H., van der Hoek, W., & Kooi, B. (2007). *Dynamic Epistemic Logic*. Cambridge University Press.

Vovk, V., Gammerman, A., & Shafer, G. (2005). *Algorithmic Learning in a Random World*. Springer.

Weick, K. E. (1995). *Sensemaking in Organizations*. Sage Publications.

Wu, Q., Bansal, G., Zhang, J., Wu, Y., Li, B., Zhu, E., ... & Wang, C. (2023). AutoGen: Enabling next-gen LLM applications via multi-agent conversation. *arXiv preprint arXiv:2308.08155*. https://arxiv.org/abs/2308.08155

Xiong, M., Hu, Z., Lu, X., Li, Y., Fu, J., He, J., & Hooi, B. (2024). Can LLMs express their uncertainty? An empirical evaluation of confidence elicitation in LLMs. *ICLR 2024*. https://arxiv.org/abs/2306.13063

Yang, Z., et al. (2024). Multi-pass specialization for long-form document refinement. *arXiv preprint*.

Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). ReAct: Synergizing reasoning and acting in language models. *ICLR 2023*. https://arxiv.org/abs/2210.03629

Yu, W., Zhang, H., Pan, X., Ma, K., Wang, H., & Yu, D. (2023). Chain-of-Note: Enhancing robustness in retrieval-augmented language models. *arXiv preprint arXiv:2311.09210*. https://arxiv.org/abs/2311.09210

Zhang, J., et al. (2024). Ask before you act: Value of information for LLM agents. *arXiv preprint*.

Zhang, Y., et al. (2024). KG-Agent: Dynamic knowledge graph construction for LLM agents. *arXiv preprint*.

---

## Practitioner Resources

### Uncertainty Estimation

| Resource | Description | URL |
|----------|-------------|-----|
| **LM-Polygraph** | Comprehensive library for LLM uncertainty estimation; implements semantic entropy, token-level methods, ensemble disagreement | github.com/IINemo/lm-polygraph |
| **MAPIE** | Distribution-free uncertainty quantification with conformal prediction; Python library with scikit-learn compatibility | github.com/scikit-learn-contrib/MAPIE |
| **Uncertainty Toolbox** | Metrics and visualizations for uncertainty estimation quality (calibration curves, sharpness, proper scoring rules) | github.com/uncertainty-toolbox/uncertainty-toolbox |

### Knowledge Representation

| Resource | Description | URL |
|----------|-------------|-----|
| **GraphRAG** | Microsoft's graph-based RAG system; constructs KG from corpus with community detection for multi-scale summarization | github.com/microsoft/graphrag |
| **LightRAG** | Lightweight KG construction for RAG; lower overhead than full GraphRAG | github.com/HKUDS/LightRAG |
| **Neo4j GenAI** | Knowledge graph database with LLM integration; LangChain and LlamaIndex connectors | neo4j.com/generativeai |
| **LlamaIndex** | Framework for connecting LLMs to data with both vector and KG index abstractions | github.com/run-llama/llama_index |
| **DSPy** | Programming model for optimizing LLM pipelines including retrieval-augmented chains | github.com/stanfordnlp/dspy |

### Multi-Agent Systems

| Resource | Description | URL |
|----------|-------------|-----|
| **AutoGen** | Microsoft's multi-agent conversation framework; supports diverse agent roles and deliberation protocols | github.com/microsoft/autogen |
| **CrewAI** | Role-based multi-agent framework for collaborative AI task execution | github.com/crewAIInc/crewAI |
| **LangGraph** | Graph-based orchestration for multi-agent workflows with cyclical deliberation support | github.com/langchain-ai/langgraph |
| **CAMEL** | Multi-agent role-playing framework for exploring LLM society dynamics | github.com/camel-ai/camel |
| **MetaGPT** | Multi-agent software engineering framework with structured role-based deliberation | github.com/geekan/MetaGPT |

### Research Agent Architectures

| Resource | Description | URL |
|----------|-------------|-----|
| **STORM** | Stanford's structured article generation through multi-perspective research; outline-first approach | github.com/stanford-oval/storm |
| **GPT-Researcher** | Open-source autonomous research agent implementing foraging-synthesis loops | github.com/assafelovic/gpt-researcher |
| **Tavily** | Research-focused search API optimized for LLM agent consumption | tavily.com |
| **MemGPT / Letta** | Virtual memory management for LLM agents; hierarchical memory with explicit read/write | github.com/cpacker/MemGPT |

### Sensemaking Theory

| Resource | Description | URL |
|----------|-------------|-----|
| **Klein (2006) Data/Frame papers** | Foundational papers on naturalistic sensemaking; accessible two-part IEEE series | doi.org/10.1109/MIS.2006.75 |
| **Pirolli & Card (2005)** | The sensemaking loop model; essential reading for designing research agent architectures | analysis.mitre.org/proceedings/Final_Papers_Files/206_Camera_Ready_Paper.pdf |
| **Weick (1995) Sensemaking in Organizations** | Foundational text on organizational sensemaking; relevant for multi-agent system design | Sage Publications (book) |
| **Russell & Norvig, AIMA Ch. 16-17** | Decision-theoretic foundations relevant to value-of-information calculations for agent foraging | aima.cs.berkeley.edu |
