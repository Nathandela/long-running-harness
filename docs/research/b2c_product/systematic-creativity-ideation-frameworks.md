---
title: "Systematic Creativity & Ideation Frameworks for B2C Product Innovation"
date: 2026-03-21
summary: Surveys the major systematic creativity and ideation frameworks applicable to B2C product innovation, covering TRIZ, SCAMPER, bisociation theory, lateral thinking, morphological analysis, design sprints, structured brainstorming techniques, and AI-augmented ideation. Provides theoretical foundations, empirical evidence, implementation guidance, comparative synthesis, and open research gaps.
keywords: [b2c_product, systematic-creativity, ideation-frameworks, TRIZ, innovation-methods]
---

# Systematic Creativity & Ideation Frameworks for B2C Product Innovation

*2026-03-21*

---

## Abstract

The belief that creativity is an innate, ungovernable talent has been progressively dismantled by seventy years of research in cognitive psychology, engineering methodology, and organizational science. From Guilford's identification of divergent thinking in 1950 through Altshuller's patent-derived theory of inventive problem solving, a body of structured methods has emerged that treats creative output as a tractable process rather than an inscrutable gift. For B2C product innovators operating under time, resource, and competitive pressure, the question is not whether to use a framework but which framework to use, when, and in what combination.

This survey examines eight major systematic creativity and ideation approaches: TRIZ and its 40 inventive principles adapted for software products, the SCAMPER checklist method, Koestler's bisociation theory, de Bono's lateral thinking, Zwicky's morphological analysis, the design sprint methodology, structured brainstorming techniques (including brainwriting and nominal group technique), and AI-augmented ideation using large language models. For each approach, the paper presents theoretical foundations, empirical evidence of effectiveness, implementation details, and documented strengths and limitations.

The comparative synthesis reveals a fundamental tension: highly structured methods (TRIZ, morphological analysis) produce more inventive but less accessible output, while lower-structure methods (SCAMPER, brainstorming variants) are easier to adopt but more prone to incremental thinking. AI-augmented ideation is emerging as a potential bridge, offering the exhaustive exploration of structured methods with the accessibility of conversational interaction, though at the cost of reduced inter-group diversity and a tendency toward surface-level cross-domain transfer. The paper identifies seven open problems including the absence of validated software-specific contradiction matrices, the homogenization risk of AI-assisted ideation, and the lack of longitudinal studies comparing framework-generated ideas against commercial outcomes.

---

## 1. Introduction

### 1.1 Problem Statement

B2C product innovation faces a paradox. The tools for building software products have never been more accessible — AI coding assistants, no-code platforms, and composable APIs reduce implementation time from months to days. Yet the bottleneck has shifted upstream: identifying genuinely novel product concepts that address real unmet needs rather than repackaging existing solutions. The constraint is no longer "can we build it?" but "can we think of something worth building?"

Unstructured ideation — the whiteboard brainstorming session, the shower epiphany, the post-it note wall — remains the dominant mode of idea generation in most product teams. The empirical record, however, is unflattering. Mullen, Johnson, and Salas's 1991 meta-analysis of brainstorming studies found that nominal groups (individuals working alone, outputs pooled) consistently outperformed interactive brainstorming groups on both quantity and quality of ideas. Diehl and Stroebe's experimental work identified production blocking, social loafing, and evaluation apprehension as the primary mechanisms of group productivity loss. The mythology of brainstorming far exceeds its measured performance.

Systematic creativity frameworks offer an alternative: structured methods that constrain the search space in productive ways, force exploration of solution regions that intuition would skip, and reduce dependence on the contingent presence of a "creative person" in the room. These frameworks differ substantially in theoretical basis, cognitive mechanism, required expertise, time investment, and type of output produced. No single method dominates across all dimensions.

This paper surveys the landscape of systematic creativity and ideation frameworks with specific attention to their applicability to B2C software product innovation. The goal is not to recommend a winner but to characterize the territory — what each method does, what evidence supports it, what it costs, and where it fails — so that practitioners can make informed selections and combinations.

### 1.2 Scope and Key Definitions

**Systematic creativity** refers to any method that structures the creative process through explicit procedures, heuristics, or constraints, as opposed to relying solely on unstructured imagination or serendipity.

**Ideation framework** refers to a complete methodology for generating candidate solutions to a problem, including problem formulation, idea generation, and initial evaluation phases.

**B2C product innovation** is scoped to consumer-facing software products — mobile apps, web applications, browser extensions, SaaS tools for individuals — where the builder is typically a small team or solo developer with AI-assisted tooling.

**Non-obvious output** means ideas that would not be generated by straightforward market research, competitive feature copying, or first-pass brainstorming. The central question is how to systematically reach ideas that lie outside the obvious solution space.

The paper excludes general project management methods, agile ceremonies (except design sprints), and downstream validation techniques (A/B testing, landing page experiments) which are covered elsewhere in this research series.

---

## 2. Foundations

### 2.1 The Science of Creative Cognition

The modern scientific study of creativity begins with J.P. Guilford's 1950 address to the American Psychological Association, in which he argued that creativity was not a unitary trait but a constellation of cognitive abilities amenable to measurement and training. Guilford's Structure-of-Intellect model distinguished divergent production (generating multiple solutions from a single starting point) from convergent production (narrowing to a single correct answer), establishing the conceptual vocabulary that still organizes the field.

Divergent thinking is characterized by four measurable properties: fluency (number of ideas), flexibility (variety of categories represented), originality (statistical rarity of ideas), and elaboration (level of detail). These metrics, operationalized through instruments like the Torrance Tests of Creative Thinking, provide the empirical foundation against which ideation methods can be compared. A method that increases fluency but not originality is producing quantity without novelty; a method that increases originality but not elaboration is producing provocations without substance.

Teresa Amabile's componential model of creativity (1983, updated 2012) expanded the frame beyond cognition to include three intra-individual components — domain-relevant skills (knowledge and technical ability in the relevant field), creativity-relevant processes (cognitive styles, heuristics for generating novelty, and working styles characterized by persistence), and intrinsic task motivation — plus one environmental component: the social environment's effect on motivation. Amabile's central finding, replicated across numerous experimental studies, is the intrinsic motivation principle: people produce their most creative work when driven by interest and challenge rather than external reward or surveillance. This has direct implications for how ideation sessions should be designed and facilitated.

The dual-process architecture of creative cognition — alternating between generative (divergent) and evaluative (convergent) phases — appears across virtually all effective ideation frameworks, whether explicitly acknowledged or not. TRIZ structures this as problem formulation followed by principle-guided solution search. Design sprints encode it as "diverge" (Monday-Tuesday) and "converge" (Wednesday). Even unstructured brainstorming implicitly assumes a generate-then-evaluate sequence, though its failure to enforce temporal separation between these phases is precisely what undermines it.

### 2.2 The Case Against Unstructured Brainstorming

Alex Osborn codified brainstorming in his 1953 book *Applied Imagination*, proposing four rules: defer judgment, aim for quantity, encourage wild ideas, and build on others' ideas. Osborn claimed that groups following these rules would generate roughly twice as many ideas as the same number of individuals working alone. The claim was testable, and when tested, it failed.

The systematic empirical record began with Taylor, Berry, and Block's 1958 Yale study, which found that nominal groups (individuals working separately, ideas pooled and de-duplicated) outperformed interactive brainstorming groups. This finding has been replicated with remarkable consistency. Mullen, Johnson, and Salas's 1991 meta-analysis across 20 studies confirmed that brainstorming groups produce fewer ideas and fewer high-quality ideas than equivalent nominal groups, with larger groups showing greater productivity loss.

Diehl and Stroebe (1987) decomposed this productivity loss into three mechanisms:

1. **Production blocking**: In interactive groups, only one person can speak at a time. Others must hold ideas in working memory while waiting, leading to forgetting, suppression, and reduced cognitive elaboration. Diehl and Stroebe's experiments demonstrated that production blocking alone accounts for the majority of the brainstorming deficit.

2. **Evaluation apprehension**: Despite the "defer judgment" rule, participants self-censor ideas they fear will be judged negatively, particularly in groups with status hierarchies.

3. **Social loafing**: Individual effort declines when contributions are pooled and individual accountability is diffused.

These findings do not mean that groups cannot ideate effectively. They mean that *unstructured* group ideation is reliably inferior to structured alternatives. The methods surveyed in this paper represent, in varying ways, attempts to preserve the benefits of collaborative idea generation while mitigating production blocking, evaluation apprehension, and social loafing through procedural design.

### 2.3 Structured Invention vs. Brainstorming: When Each Works

The empirical evidence permits a useful heuristic. Unstructured brainstorming (Osborn's rules, no further scaffolding) works adequately when the problem is well-understood, the solution space is familiar, the goal is buy-in rather than novelty, and the group is small (3-4 people) with equal status. It fails predictably when the problem requires cross-domain transfer, when the solution space is large and unfamiliar, when genuine novelty is required, and when the group exceeds 5-6 people or contains status asymmetries.

Structured invention methods — TRIZ, morphological analysis, systematic analogical transfer — are indicated when the problem contains inherent contradictions, when the solution space is large enough that intuitive exploration will miss important regions, when the goal is inventive output rather than incremental improvement, and when the team is willing to invest in learning the method. Their cost is higher training overhead and lower spontaneity.

The practical implication for B2C product ideation is that most teams default to the method suited to incremental improvement (brainstorming) when they actually need the method suited to non-obvious discovery (structured frameworks). The remainder of this paper examines the structured alternatives.

---

## 3. Taxonomy of Approaches

Before analyzing each approach in detail, it is useful to establish a classification framework. Ideation methods can be organized along three independent dimensions: the degree of procedural structure they impose, the cognitive mechanism they primarily exploit, and the phase of the creative process they address.

### 3.1 Classification Matrix

| Method | Structure Level | Primary Mechanism | Phase Focus | Input Required | Time Investment | Training Required |
|--------|----------------|-------------------|-------------|---------------|----------------|-------------------|
| TRIZ (40 Principles) | High | Contradiction resolution | Generation | Problem as contradiction | Hours-days | High |
| SCAMPER | Low-Medium | Checklist-guided transformation | Generation | Existing product/concept | 30-90 min | Low |
| Bisociation (Koestler) | Low | Frame collision | Generation | Two unrelated domains | Variable | Medium |
| Lateral Thinking (de Bono) | Medium | Pattern disruption | Generation | Problem statement | 1-3 hours | Medium |
| Morphological Analysis | High | Combinatorial exploration | Generation + Evaluation | Decomposed problem | Days-weeks | High |
| Design Sprint | High | Time-boxed full cycle | Full process | Business challenge | 4-5 days | Medium |
| Structured Brainstorming | Medium | Social process optimization | Generation | Problem statement | 1-2 hours | Low |
| AI-Augmented Ideation | Medium | Exhaustive semantic search | Generation + Evaluation | Problem + prompt design | Minutes-hours | Low-Medium |

### 3.2 Mechanism Taxonomy

The eight approaches exploit five distinct cognitive mechanisms:

```
Cognitive Mechanisms of Systematic Creativity
│
├── Contradiction Resolution (TRIZ)
│   └── Identify inherent trade-off, apply known resolution pattern
│
├── Checklist-Guided Transformation (SCAMPER)
│   └── Systematically apply modification operators to existing concept
│
├── Frame Collision / Bisociation (Koestler, Lateral Thinking)
│   └── Force connection between previously unrelated domains
│
├── Combinatorial Exploration (Morphological Analysis)
│   └── Decompose problem, enumerate all parameter combinations
│
└── Process Architecture (Design Sprint, Structured Brainstorming, AI-Augmented)
    └── Optimize social/temporal structure of ideation activity
```

This taxonomy reveals a key architectural distinction. TRIZ, morphological analysis, and bisociation are *content-level* methods — they specify what kind of thinking to do. Design sprints, structured brainstorming, and AI-augmented ideation are *process-level* methods — they specify how to organize the activity of thinking. SCAMPER and lateral thinking sit in between, providing both content prompts and light process structure. Effective ideation practice typically combines one content-level method with one process-level method.

---

## 4. Analysis

### 4.1 TRIZ: Theory of Inventive Problem Solving

#### Theory & Mechanism

TRIZ (Teoriya Resheniya Izobretatelskikh Zadach) was developed by Soviet engineer and patent examiner Genrich Altshuller beginning in 1946. Altshuller's foundational insight came from analyzing approximately 200,000 patents (later expanded to over 2 million by his research group): inventive solutions are not random but follow recurring patterns. Across all domains of engineering, the same 40 inventive principles are applied repeatedly to resolve the same types of technical contradictions.

The core TRIZ workflow operates through four steps:

1. **Formulate the specific problem** as a technical contradiction: improving parameter A causes parameter B to worsen.
2. **Generalize** the contradiction using TRIZ's 39 engineering parameters (e.g., speed, reliability, complexity, adaptability).
3. **Look up** the contradiction in Altshuller's matrix, which suggests which of the 40 inventive principles have historically resolved that type of contradiction.
4. **Apply** the suggested principles to generate specific solutions.

The 40 inventive principles include: (1) Segmentation, (2) Extraction, (3) Local Quality, (4) Asymmetry, (5) Combining, (6) Universality, (7) Nesting, (8) Counterweight, (9) Prior Counteraction, (10) Prior Action, (11) Cushion in Advance, (12) Equipotentiality, (13) Inversion, (14) Spheroidality/Curvature, (15) Dynamicity, (16) Partial or Excessive Action, (17) Transition to a New Dimension, (18) Mechanical Vibration, (19) Periodic Action, (20) Continuity of Useful Action, (21) Rushing Through, (22) Convert Harm to Benefit, (23) Feedback, (24) Mediator, (25) Self-Service, (26) Copying, (27) Cheap Short-Living, (28) Replacement of Mechanical System, (29) Pneumatics/Hydraulics, (30) Flexible Membranes, (31) Porous Materials, (32) Colour Change, (33) Homogeneity, (34) Discarding and Recovering, (35) Transformation of Properties, (36) Phase Transition, (37) Thermal Expansion, (38) Accelerated Oxidation, (39) Inert Environment, (40) Composite Materials.

Beyond the contradiction matrix, TRIZ includes several additional tools: Substance-Field (Su-Field) analysis for modeling functional interactions, the Algorithm of Inventive Problem Solving (ARIZ) as a structured problem-solving protocol, the concept of Ideal Final Result (IFR) which asks "what would the perfect solution look like if the problem solved itself?", and the Laws of Technical System Evolution which predict how systems develop over time.

Altshuller also identified five levels of inventiveness in patents, ranging from Level 1 (routine solutions within a single profession, ~32% of patents) through Level 5 (pioneering discoveries requiring new science, ~less than 0.3%). Most product innovation operates at Levels 1-3, where TRIZ tools are most directly applicable.

#### TRIZ Applied to Software Products

The original 39 parameters and contradiction matrix were derived from mechanical and physical engineering patents. Applying TRIZ to software requires translation. Kevin C. Rea published the first systematic mapping of the 40 principles to software contexts in 2000-2001, providing analogies such as:

- **Segmentation** maps to dividing systems into autonomous components (microservices, intelligent agents, modular architectures).
- **Extraction** maps to separating concerns, extracting interfaces from implementations, pulling configuration out of code.
- **Local Quality** maps to making data structures or behaviors context-dependent rather than uniform (adaptive UIs, personalization).
- **Asymmetry** maps to non-uniform resource allocation (load balancing, asymmetric API rate limits).
- **Universality** maps to making components support multiple contexts (polymorphism, plugin architectures).
- **Nesting** maps to object composition, nested classes, recursive data structures.
- **Prior Action** maps to pre-computation, caching, JIT compilation, ahead-of-time processing.
- **Dynamicity** maps to runtime flexibility (dynamic linking, hot-reload, feature flags).

Hargrove, Smith, and Watson (2019) published a significant extension in their MDPI Systems paper, proposing 22 additional characteristics specific to digital systems that were absent from the original methodology. These include parameters such as data integrity, user experience quality, security level, interoperability, and scalability — properties central to software product design but without clear analogues in Altshuller's mechanical parameter set.

The software TRIZ contradiction matrix remains a work in progress. No equivalent of Altshuller's multi-million-patent analysis has been performed on software patents or product design decisions. Existing software adaptations are based on expert judgment and case study rather than statistical analysis of large solution corpora.

#### Literature Evidence

The evidence base for TRIZ in its original engineering domain is substantial. Mann's 2002 analysis of over 2.5 million patents confirmed the recurring application of the 40 principles across mechanical, chemical, and electrical engineering. The TRIZ Journal has published hundreds of industrial case studies from companies including Samsung, Intel, Procter & Gamble, and Boeing.

For software specifically, the evidence is thinner. A systematic review by the International Journal on Software Innovation (IJOSI) documented applications in software architecture design, requirements engineering, and testing, but found that most published work consists of individual case studies rather than controlled experiments. The gap between TRIZ's strong industrial track record in hardware and its limited empirical validation in software is the largest open question in this area.

#### Implementations & Benchmarks

**Software tools**: CREAX Innovation Suite, Goldfire Innovator (now IHS), TRIZ40.com (free interactive contradiction matrix), PRIZ Guru (web-based TRIZ platform), Minitab Workspace (contradiction matrix module).

**Training**: The International TRIZ Association (MATRIZ) certifies practitioners at five levels, from user to master, requiring progression through increasingly complex problem-solving demonstrations. Full TRIZ mastery typically requires 100-200 hours of study and practice.

#### Strengths & Limitations

**Strengths**: TRIZ is the most rigorously grounded ideation method in empirical pattern analysis. The contradiction matrix provides specific, actionable suggestions rather than vague prompts. The method forces problem reformulation as contradictions, which itself is a powerful creative act — many "stuck" problems become tractable once reframed as trade-offs. The Ideal Final Result concept is a powerful heuristic for avoiding over-engineering. Altshuller's five levels of inventiveness provide a useful calibration of ambition.

**Limitations**: The learning curve is steep — practitioners report 40-80 hours before achieving fluency. The original parameters and matrix are mechanical-engineering-centric; software adaptations exist but lack the statistical foundation of the original. TRIZ is better at resolving identified contradictions than at identifying which contradictions matter. The method assumes a well-defined problem, making it less suitable for the fuzzy front end of consumer product discovery where the problem itself is unclear. Group application requires a trained facilitator.

---

### 4.2 SCAMPER

#### Theory & Mechanism

SCAMPER is a checklist-based ideation method developed by Bob Eberle in 1971, building on Alex Osborn's earlier idea-spurring questions from *Applied Imagination* (1953). The acronym encodes seven transformation operators:

- **S — Substitute**: What components, materials, processes, or people could be replaced?
- **C — Combine**: What ideas, functions, or features could be merged?
- **A — Adapt**: What existing solutions from other domains could be adapted?
- **M — Modify** (also Magnify/Minify): What could be made larger, smaller, exaggerated, or diminished?
- **P — Put to another use**: What else could this be used for? Who else could use it?
- **E — Eliminate**: What could be removed, simplified, or reduced?
- **R — Reverse** (also Rearrange): What could be reversed, flipped, or reordered?

The cognitive mechanism is systematic operator application: rather than asking "what should we change?" (which invites anchoring on the status quo), SCAMPER provides seven specific *types* of change to consider, each forcing a different kind of conceptual transformation. This converts the open-ended creative task into seven bounded search problems.

#### Literature Evidence

Empirical evidence for SCAMPER comes primarily from educational research. A 2023 study in *Thinking Skills and Creativity* (ScienceDirect) found that SCAMPER significantly enhanced students' creative idea generation in product design, as measured across fluency, flexibility, originality, and elaboration. A 2025 study on CPS+SCAMPER teaching found that combining Creative Problem Solving with SCAMPER produced statistically significant improvements on all four creativity indicators compared to control groups.

In product innovation contexts, a design conference study comparing SCAMPER to TRIZ-directed methods found that SCAMPER produced ideas with higher utility scores, though TRIZ-directed methods produced ideas with higher novelty. This suggests SCAMPER's strength is practical, incremental innovation rather than breakthrough invention — a finding consistent with its mechanism of transforming existing products rather than resolving contradictions.

Industry adoption is widespread but informally documented. Apple, Procter & Gamble, and Starbucks are frequently cited as organizations that use SCAMPER-style thinking, though formal case studies with controlled comparisons are scarce.

#### Implementations & Benchmarks

SCAMPER requires no specialized software. Implementation typically involves:

1. Select a target product, feature, or process to improve.
2. Apply each of the seven operators sequentially, spending 5-10 minutes per operator.
3. Record all ideas without evaluation during the generation phase.
4. Evaluate and prioritize ideas after completing all seven passes.

For B2C software products, SCAMPER operators map naturally: Substitute (what if we replaced the login with biometrics?), Combine (what if we merged the dashboard and settings?), Adapt (what does the airline industry do for status tiers?), Modify (what if the feed showed 10x more items?), Put to another use (what if freelancers used this instead of agencies?), Eliminate (what if we removed the pricing page entirely?), Reverse (what if the user set the price?).

**Tools**: Boardmix and Miro provide SCAMPER templates. The Interaction Design Foundation (IxDF) offers structured SCAMPER worksheets.

#### Strengths & Limitations

**Strengths**: Extremely low barrier to entry — no training required beyond understanding the seven operators. Completes in under two hours. Forces systematic coverage of transformation types that teams would otherwise skip (Eliminate and Reverse are particularly under-explored in typical ideation). Works well as a warm-up before more intensive methods. Produces actionable, concrete modifications rather than abstract concepts.

**Limitations**: Anchored to an existing product or concept, making it inherently incremental. Does not generate genuinely new categories or products — only modifications of existing ones. Provides no mechanism for resolving contradictions or exploring cross-domain analogies. Quality of output depends heavily on the quality of the starting concept. Not suitable when the goal is breakthrough innovation or category creation. No built-in evaluation criteria.

---

### 4.3 Bisociation Theory (Koestler)

#### Theory & Mechanism

Arthur Koestler introduced bisociation in *The Act of Creation* (1964) as a unified theory of creativity across humor, science, and art. The central thesis: creative acts occur when two previously unconnected "matrices of thought" (habitual frames of reference, associative contexts, or disciplinary paradigms) collide, producing a flash of insight that connects them in a novel way.

Koestler distinguished bisociation from ordinary association. Association operates within a single matrix — connecting "dog" to "bone" follows a well-worn path within one frame. Bisociation operates *between* matrices — connecting "genetic code" to "cryptography" bridges two frames that have no pre-existing associative path. The novelty of creative output is proportional to the distance between the matrices being connected.

Koestler identified three domains of bisociative output:

1. **Humor (Ha-ha)**: Collision of matrices involving self-assertive emotions, producing laughter through sudden recognition of incongruity.
2. **Discovery (Aha)**: Collision of matrices producing a new intellectual synthesis — the "eureka moment" where two previously unrelated bodies of knowledge merge.
3. **Art (Ah)**: Collision of matrices producing participatory emotional experience through juxtaposition of meaning frames.

For product innovation, the relevant domain is discovery-mode bisociation: forcing connections between unrelated conceptual domains to generate solutions that neither domain would produce in isolation.

#### Literature Evidence

Koestler's framework is more philosophical than empirical — *The Act of Creation* draws on historical case studies (Gutenberg combining the wine press with the coin punch to invent the printing press; Pasteur connecting crystallography with fermentation biology) rather than controlled experiments. However, subsequent research has operationalized bisociative thinking in computational and applied contexts.

Dubitzky, Kotter, Schmidt, and Berthold (2012) formalized bisociation for computational knowledge discovery in their Springer volume *Bisociative Knowledge Discovery*. The BISON project developed algorithms for identifying "domain-bridging associations" — connections between concepts that span different knowledge domains and would not be found by conventional single-domain data mining. Their framework demonstrated that Koestler's philosophical model could be implemented as a search procedure over heterogeneous knowledge networks.

More recently, literature-based discovery research has used bisociative principles to identify hidden connections in scientific literature. Swanson's discovery that fish oil might treat Raynaud's disease — by connecting medical literature on blood viscosity with nutrition literature on omega-3 fatty acids — is the canonical example of bisociative knowledge discovery in practice.

#### Implementations & Benchmarks

Bisociation is less a step-by-step method than a cognitive principle that can be operationalized in multiple ways:

1. **Forced analogy**: Select a random domain (biology, architecture, game design, military strategy) and systematically map its structures onto the target problem.
2. **Concept blending**: Take two existing products or services from unrelated markets and explore what their intersection would look like.
3. **Domain-bridging search**: Use knowledge bases or LLMs to identify structural parallels between the problem domain and distant domains.

For B2C product innovation, bisociation is the theoretical basis for cross-domain transfer exercises: "What would Spotify look like if designed by a game studio?", "What would a therapy app look like if designed by a dating app team?", "What would a budgeting tool look like if designed by a fitness tracking company?"

The BISON project's computational tools represent the most formalized implementation, but they are oriented toward scientific literature mining rather than product ideation. No off-the-shelf product ideation tool explicitly implements bisociative search, though LLM-based ideation (Section 4.8) approximates it.

#### Strengths & Limitations

**Strengths**: Bisociation provides the strongest theoretical account of why breakthrough ideas feel surprising — they connect frames that have no prior association. The framework is generative: it suggests an infinite supply of matrix pairs to explore. It maps naturally to product innovation through cross-domain transfer. The underlying principle is domain-independent.

**Limitations**: The theory provides no procedure for selecting which matrix pairs are worth exploring, leading to a combinatorial explosion of possible connections, most of which are unproductive. There is no quality filter built into the method — connecting "gardening" to "cryptocurrency" produces a connection, but probably not a useful one. The framework lacks the procedural specificity of TRIZ or morphological analysis. Effectiveness depends heavily on the practitioner's breadth of domain knowledge, which limits accessibility. Empirical evidence for its superiority over simpler methods in controlled settings is sparse.

---

### 4.4 Lateral Thinking (de Bono)

#### Theory & Mechanism

Edward de Bono introduced the term "lateral thinking" in 1967, distinguishing it from "vertical thinking" (logical, sequential reasoning). De Bono's central argument is that the brain is a self-organizing information system that creates patterns (mental models, established thinking tracks), and these patterns, while efficient for routine cognition, actively prevent the discovery of novel solutions. Lateral thinking is the deliberate disruption of these patterns.

De Bono developed several specific techniques:

**Provocation (PO)**: The thinker deliberately constructs a statement that is logically wrong or absurd, signaled by the marker word "PO" (Provocative Operation). The provocation is not meant to be true — it is meant to force the mind off its established track. Six provocation techniques generate PO statements: wishful thinking ("PO: the product has no user interface"), exaggeration ("PO: it has a million features"), reversal ("PO: the user pays more for using it less"), escape ("PO: there is no onboarding"), distortion ("PO: errors improve the experience"), and arising (arising from a current trend taken to an extreme).

**Movement**: After a provocation, the thinker uses "movement" — deliberately extracting value from the provocation rather than judging it. This means asking "What is interesting about this? Where does it lead?" rather than "Is this feasible?"

**Random Entry**: Introduce a random word or concept and force connections to the problem. The randomness disrupts established thinking patterns and opens unexpected solution paths.

**Six Thinking Hats**: De Bono's most commercially successful framework assigns six colored hats to different modes of thinking — White (data), Red (emotions), Black (caution), Yellow (benefits), Green (creativity), Blue (process management). Groups systematically adopt each perspective, preventing the common failure mode where one person's criticism dominates and shuts down creative contributions.

#### Literature Evidence

The evidence base for de Bono's methods is mixed. His techniques have been adopted by major organizations including NASA, NTT, Siemens, IBM, and Prudential, and de Bono claimed that IBM credited lateral thinking with generating a market-beating product strategy. However, academic validation is limited. De Bono was, by his own account, more interested in practical utility than empirical validation. Multiple reviewers have noted that there is sparse research evidence to show that generalized improvements in thinking performance can be attributed to training in de Bono's CoRT or Six Thinking Hats tools.

Where controlled studies exist, results are modestly positive. Research on the Six Thinking Hats applied to meeting structure shows reductions in meeting time and increases in participant satisfaction, though effects on idea quality are less clearly demonstrated. The provocation technique has face validity and is widely endorsed by practitioners, but lacks the kind of rigorous comparative studies that would establish its superiority over simpler prompting methods.

De Bono published 85 books translated into 46 languages, creating substantial commercial impact. The de Bono Group continues to offer corporate training programs, with published testimonials and ROI claims from adopting organizations. The gap between commercial adoption and academic evidence is one of the distinctive features of this body of work.

#### Implementations & Benchmarks

**Six Thinking Hats** is the most structured and implementable of de Bono's techniques. A typical session:
1. Blue hat: Define the problem and session agenda (5 min)
2. White hat: What data and facts do we have? (10 min)
3. Green hat: Generate ideas without judgment (15-20 min)
4. Yellow hat: What are the benefits of each idea? (10 min)
5. Black hat: What are the risks and problems? (10 min)
6. Red hat: Gut reactions and preferences (5 min)
7. Blue hat: Summarize and decide next steps (5 min)

**Provocation sessions** for product ideation:
1. State the product challenge clearly.
2. Generate 5-10 provocations using the six provocation techniques.
3. Select the 2-3 most outlandish provocations.
4. Apply movement to each: extract principles, follow implications, identify partial solutions.
5. Develop extracted insights into concrete product concepts.

**Tools**: De Bono Group's official training materials, SessionLab templates for Six Thinking Hats workshops, various facilitation card decks incorporating PO prompts.

#### Strengths & Limitations

**Strengths**: The provocation technique is genuinely effective at breaking habitual thinking patterns — its deliberate absurdity grants permission to explore ideas that social pressure would normally suppress. The Six Thinking Hats provides a practical framework for preventing premature evaluation. The methods are accessible and do not require specialized technical knowledge. The "PO" marker creates a clear social contract: what follows is not a proposal but a thinking tool.

**Limitations**: Academic evidence for effectiveness is limited relative to commercial claims. The methods depend heavily on facilitation quality. Without a skilled facilitator, provocation sessions can degenerate into humor without productive movement. The techniques do not provide content-level guidance — they tell you *how* to disrupt thinking patterns but not *where* to look for solutions. There is no built-in mechanism for evaluating or prioritizing the ideas generated. The theoretical basis, while intuitively appealing, lacks the formal grounding of TRIZ or cognitive science models.

---

### 4.5 Morphological Analysis (Zwicky)

#### Theory & Mechanism

General Morphological Analysis (GMA) was developed by Swiss astrophysicist Fritz Zwicky at Caltech in the 1940s. Zwicky's ambition was to make invention "routinizable" — transforming creative discovery from an individual talent into a systematic procedure. His method was first applied to astrophysics (predicting types of propulsion systems) and later extended to engineering design, policy analysis, and strategic planning.

The method proceeds in defined steps:

1. **Define the problem** and identify its key dimensions (parameters). For a B2C product, parameters might include: target user segment, core value proposition, interaction modality, monetization model, distribution channel, and key differentiator.

2. **List possible values** for each parameter. Each parameter receives a set of discrete options. Target user segment might include: students, freelancers, parents, retirees, small business owners. Interaction modality might include: chat, voice, visual dashboard, ambient notification, gamified.

3. **Construct the morphological box** (Zwicky box): an n-dimensional matrix where each cell represents a specific combination of parameter values. A problem with 6 parameters of 5 values each yields 5^6 = 15,625 possible configurations.

4. **Reduce the solution space** through Cross-Consistency Assessment (CCA): systematically evaluate pairs of parameter values for mutual compatibility. Pairs can be logically contradictory (cannot coexist), empirically constrained (technically infeasible), or normatively undesirable (violate design principles). CCA reduces the combinatorial explosion to a manageable set of internally consistent configurations.

5. **Explore the reduced solution space**: examine surviving configurations for novel, non-obvious combinations that would not have been discovered through intuitive brainstorming.

The mathematical elegance of the method lies in the observation that while total configurations grow exponentially with the number of parameters, pair-wise consistency assessments grow only quadratically. For a problem with k parameters each having n values, the total configurations are n^k but the pair-wise assessments number only n^2 * k(k-1)/2 — a much more tractable computation.

#### Literature Evidence

Tom Ritchey, the leading contemporary practitioner, has documented over 100 completed GMA projects at the Swedish Defence Research Agency (FOI) and through the Swedish Morphological Society. Applications span defense policy analysis, organizational design, futures research, technology forecasting, and product innovation. A literature review by Ritchey covering 80 published works between 1950 and 2015 documented four application categories: engineering design and architecture, scenario development and futures research, policy analysis and social modeling, and creativity/innovation/knowledge management.

Alvarez and Ritchey (2015) demonstrated GMA's application to business model innovation, using morphological analysis to map the complete space of possible business model configurations and identify non-obvious combinations. The method proved effective at surfacing configurations that participants had not considered — the primary goal of systematic creativity methods.

For product innovation specifically, morphological analysis has been applied to concept synthesis in engineering design, where researchers found it particularly valuable in the early conceptual phase when the solution space is large and poorly explored. Its weakness in this context is the subjectivity of the CCA phase, where consistency judgments depend on expert knowledge that may itself be biased toward conventional solutions.

#### Implementations & Benchmarks

**Software tools**:
- **MA/Carma**: The most established GMA software, developed by Ritchey and the Swedish Morphological Society. Supports the full GMA process including CCA, scenario generation, input-output modeling, and documentation.
- **Collaborative Morphological Analysis (CMA)**: Browser-based multi-user GMA software developed for real-time collaborative analysis (published in *Technological Forecasting and Social Change*, 2018).
- **InventionPath**: Web-based morphological analysis tool oriented toward product innovation.

**Process benchmark**: A typical GMA workshop with 6-8 experts addressing a complex product strategy question takes 2-3 days for parameter identification and morphological field construction, plus additional time for CCA and exploration.

#### Strengths & Limitations

**Strengths**: Morphological analysis is the most systematic method for exploring a solution space exhaustively. It makes the full space of possibilities visible, preventing the premature closure that characterizes intuitive methods. CCA provides a principled way to eliminate infeasible combinations without discarding the entire space. The method surfaces non-obvious combinations that no participant would have generated individually. It forces explicit articulation of problem dimensions, which is itself a valuable analytical exercise. The output is a bounded, documented set of feasible configurations that can be evaluated against criteria.

**Limitations**: The method is time-intensive — a complete GMA cycle requires days of expert effort. Parameter identification requires substantial domain knowledge and can introduce framing bias (if the "wrong" parameters are chosen, the entire analysis is misguided). CCA judgments are subjective and can prematurely eliminate unconventional combinations. The method assumes the problem can be meaningfully decomposed into independent parameters, which is not always the case for tightly coupled design problems. The combinatorial output can be overwhelming — reducing 15,000 configurations to 200 still leaves significant evaluation work. The method does not generate ideas so much as it enumerates possibilities; converting configurations into compelling product concepts requires additional creative work.

---

### 4.6 Design Sprint Methodology

#### Theory & Mechanism

The design sprint was developed by Jake Knapp at Google in 2010 and refined at Google Ventures (GV) with Braden Kowitz and Michael Margolis. Published in Knapp's 2016 book *Sprint*, the method compresses the entire design thinking cycle — from problem framing to prototype testing with real users — into five days.

The original five-day structure:
- **Monday (Understand)**: Map the problem, interview experts, choose a target.
- **Tuesday (Diverge)**: Generate a wide range of solutions through structured individual sketching.
- **Wednesday (Converge)**: Select the best ideas, storyboard the prototype concept.
- **Thursday (Prototype)**: Build a realistic-looking prototype (facade, not functional).
- **Friday (Test)**: Put the prototype in front of five target users and observe.

The design sprint's theoretical contribution is not a new ideation technique but a process architecture that embeds several research-supported principles:

1. **Individual before group**: Tuesday's sketching exercises (Note-and-Vote, Crazy Eights, Solution Sketch) have each participant work alone before sharing, avoiding production blocking.
2. **Structured convergence**: Wednesday's voting uses dot-voting and Decider authority rather than open debate, reducing evaluation apprehension and status effects.
3. **Time boxing**: Strict time constraints prevent over-deliberation and force commitment.
4. **Rapid prototyping**: Thursday's prototype-building avoids the trap of debating ideas abstractly by making them concrete.
5. **User validation within the sprint**: Friday's testing provides empirical feedback before significant investment.

AJ&Smart subsequently developed Design Sprint 2.0, compressing the process to four days by combining Monday and Tuesday activities, requiring the full team for only two days (rather than five), and reordering some exercises for improved information flow (starting with expert interviews and "How Might We" questions).

#### Literature Evidence

The evidence for design sprints is primarily case-based rather than experimentally controlled. Knapp and his team report running over 150 sprints at companies including Nest, Slack, 23andMe, Flatiron Health, and Blue Bottle Coffee. The method has been adopted by organizations ranging from the British Museum to the United Nations.

Academic research on design sprints is emerging but limited. Banfield, Lombardo, and Wax (2015) provide practitioner documentation in *Design Sprint: A Practical Guidebook for Building Great Digital Products*. Adaptations have been published for specific domains including AR/VR applications in digital heritage (Fernandez et al., 2018). However, controlled experiments comparing sprint-generated ideas to those from other methods are scarce.

The strongest evidence is structural: the sprint embeds multiple individually validated principles (nominal-before-interactive ideation, time-boxing, rapid prototyping, same-week user testing) into a single cohesive process. Its weakness is that the ideation phase (Tuesday) uses relatively simple techniques (sketching, Crazy Eights) that do not incorporate the problem-reformulation power of TRIZ or the exhaustive exploration of morphological analysis.

#### Implementations & Benchmarks

**Standard resources**: *Sprint* (Knapp, 2016), AJ&Smart Design Sprint 2.0 facilitator training, Google Ventures sprint kit, SessionLab sprint templates.

**Typical team**: 5-7 people including a Decider (someone with authority to make decisions), a Facilitator, and representatives from design, engineering, product, and business.

**Cost**: 4-5 person-days per participant, plus facilitator preparation. Total investment for a 7-person sprint: approximately 35-40 person-days including preparation and follow-up.

**Output**: A tested prototype concept with documented user reactions, not a finished product.

#### Strengths & Limitations

**Strengths**: The sprint is the most completely specified process in this survey — every activity, timing, and facilitation move is documented. It embeds user validation into the ideation process rather than treating it as a separate phase. The time constraint forces progress and prevents analysis paralysis. The method works well for teams that have never done structured ideation before. The prototyping requirement makes abstract ideas concrete and testable.

**Limitations**: The sprint assumes a well-defined starting challenge ("solve X for user Y"), making it less suitable for early-stage exploration where the problem itself is undefined. The ideation techniques used on Tuesday are relatively unsophisticated — they avoid production blocking but do not actively force cross-domain thinking or contradiction resolution. Five days is a significant investment for a solo developer or tiny team. The method is optimized for testing one concept with users, not for generating a broad portfolio of options. The sprint's popularity has led to cargo-culting, where teams follow the rituals without understanding the underlying principles.

---

### 4.7 Structured Brainstorming Techniques

#### Theory & Mechanism

Structured brainstorming encompasses a family of methods designed to preserve the social benefits of group ideation while mitigating the production blocking, social loafing, and evaluation apprehension that undermine traditional brainstorming. The major variants:

**Brainwriting / 6-3-5 Method**: Developed by Bernd Rohrbach in 1968. Six participants each write three ideas on a worksheet in five minutes, then pass the worksheet to the next person, who builds on those ideas. After six rounds (30 minutes), the group has generated up to 108 ideas with zero production blocking — everyone writes simultaneously. The building-on-others'-ideas mechanism provides the associative stimulation that Osborn sought from group brainstorming without the turn-taking bottleneck.

**Nominal Group Technique (NGT)**: Participants first generate ideas individually and silently, then share them one at a time in round-robin fashion, followed by group discussion and voting. The individual-first structure prevents anchoring on the first idea shared, while the round-robin sharing ensures all participants contribute equally regardless of status.

**Electronic Brainstorming (EBS)**: Computer-mediated idea generation where participants type ideas into a shared system simultaneously. Ideas are visible to all participants in real-time, providing stimulation without production blocking. Research shows EBS becomes increasingly effective as group size grows, reversing the productivity loss that scales with group size in face-to-face brainstorming.

**How Might We (HMW) Questions**: Originally from Procter & Gamble and popularized by IDEO and the design sprint, HMW reframes problem statements as generative questions. "Users don't understand our pricing" becomes "How might we make pricing self-evident?" The linguistic reframing from problem to opportunity opens rather than constrains the solution space. HMW is typically used as a pre-step to other brainstorming techniques rather than as a standalone method.

**Crazy Eights**: Each participant folds a sheet of paper into eight panels and sketches eight ideas in eight minutes (one minute per idea). The extreme time pressure prevents over-thinking, forces rapid iteration, and often produces more radical ideas in later panels as obvious solutions are exhausted in the first few.

#### Literature Evidence

The evidence base for structured brainstorming variants is the strongest in this survey, drawing on decades of experimental social psychology.

Diehl and Stroebe's (1987, 1991) experiments established that production blocking is the primary cause of brainstorming group productivity loss, directly validating methods (brainwriting, EBS) that eliminate turn-taking. Studies comparing brainwriting to nominal groups found that 6-3-5 groups using words and sketches outperformed nominal groups in idea quantity while maintaining equal quality — one of the few results showing interactive groups *exceeding* nominal group performance.

Electronic brainstorming research shows that EBS groups outperform face-to-face groups, with the advantage increasing as group size grows. DeRosa, Smith, and Hantula's meta-analysis found that EBS was particularly effective for groups of eight or more, precisely the size range where face-to-face brainstorming fails most dramatically.

Research on critique-enhanced brainstorming challenges Osborn's "defer judgment" rule. Studies show that adding structured critique phases to brainstorming can significantly boost idea quality ratings without reducing output volume, contradicting the assumption that any evaluation during ideation is harmful.

#### Implementations & Benchmarks

**Brainwriting 6-3-5**: Requires only worksheets and timers. 30 minutes for generation, 30 minutes for review and clustering. Output: up to 108 ideas from a group of 6.

**Nominal Group Technique**: 10-15 minutes silent generation, 30-45 minutes round-robin sharing and discussion, 15 minutes voting. Output: ranked list of ideas with group endorsement.

**Electronic Brainstorming**: Requires shared digital workspace (Miro, MURAL, FigJam, or dedicated EBS software). 20-40 minutes for generation. Works particularly well for remote teams. Output: tagged, searchable idea corpus.

**Combined approach for B2C ideation**: Begin with HMW reframing (10 min), proceed to Crazy Eights (8 min per person), share and cluster (20 min), then use brainwriting to build on the most promising clusters (30 min).

#### Strengths & Limitations

**Strengths**: The most empirically validated category of ideation methods. Low training requirements. Brainwriting and EBS eliminate production blocking, the primary cause of brainstorming failure. Methods scale well to larger groups. Work effectively in remote/asynchronous settings. Can be combined with content-level methods (SCAMPER prompts during brainwriting, TRIZ-guided HMW questions).

**Limitations**: Process-level methods only — they optimize the *social structure* of ideation but do not provide *content guidance* about where to search for solutions. Output quality depends entirely on the knowledge, creativity, and motivation of participants. Do not force cross-domain thinking or contradiction resolution. Quantity of ideas does not guarantee quality — 108 mediocre ideas from 6-3-5 are not better than 10 good ideas from a skilled individual. Clustering and evaluation of large idea sets remains a manual, time-consuming process.

---

### 4.8 AI-Augmented Ideation

#### Theory & Mechanism

The emergence of large language models (LLMs) has created a new category of ideation support: AI-augmented creativity. Unlike the preceding methods, which were developed as human cognitive techniques, AI-augmented ideation uses LLMs as participants in or facilitators of the creative process.

The theoretical basis draws on two LLM capabilities identified by De Freitas, Nave, and Puntoni (2025) in their Harvard Business Review analysis:

1. **Persistence**: LLMs can produce many variations on a theme without fatigue, boredom, or ego depletion, enabling exhaustive exploration of a solution space.
2. **Flexibility**: LLMs' training on cross-domain corpora enables them to combine distant concepts in unexpected ways, approximating bisociative thinking.

Three primary modes of AI-augmented ideation have been studied:

**AI as brainstorming partner**: The human poses problems, the LLM generates ideas, and the human evaluates and iterates. This mode is accessible but risks anchoring the human to the LLM's first suggestions.

**AI-augmented brainwriting**: The LLM participates as one of several "writers" in a brainwriting process, contributing ideas that human participants then build upon. Shaer et al.'s CHI 2024 study found that integrating LLMs into brainwriting enhanced both the ideation process and its outcomes, with LLM contributions rated as relevant, innovative, and insightful by an automated evaluation engine.

**AI as evaluator**: The LLM rates human-generated ideas on dimensions like relevance, novelty, and feasibility, providing rapid feedback that would otherwise require expert panels. Shaer et al. demonstrated that LLM evaluation ratings correlated with expert evaluator ratings, suggesting LLMs can support the convergent (evaluation) phase as well as the divergent (generation) phase.

#### Literature Evidence

The research base is rapidly growing. Key findings from 2024-2025:

**Idea generation**: A Nature Humanities and Social Sciences Communications study (2025) found that GenAI-augmented ideation improved both efficiency and quality compared to traditional methods and reduced common group brainstorming problems such as production blocking and reluctance to share ideas. However, the same study identified a dual mechanism: for simple tasks, LLMs can cause "creative fixation" (anchoring on the AI's suggestions), while for complex tasks, they serve as effective inspiration boosters.

**Diversity trade-off**: The most significant finding is a systematic diversity reduction. De Freitas et al. (2025) found that while individuals using LLMs may generate more original ideas than they would alone, the overall diversity *across* groups narrows — AI-assisted groups tend to converge on similar themes and expressions. This homogenization effect is a fundamental concern for organizations seeking a *portfolio* of diverse product concepts.

**Cross-domain transfer quality**: Research on LLM-driven interdisciplinary ideation (arxiv, 2025) found that LLM-generated ideas frequently draw inspiration from other disciplines but often do so in surface-level or stereotyped ways that undermine practical grounding. The bisociative connections are syntactically plausible but semantically shallow.

**Evaluation capability**: The CHI 2024 study demonstrated that LLM-based evaluation engines can rate ideas on relevance, innovation, and insightfulness with reliability approaching expert human raters, suggesting LLMs are more valuable as evaluation support than as sole generators.

#### Implementations & Benchmarks

**Direct prompting**: Using ChatGPT, Claude, or Gemini with structured prompts. Effectiveness depends heavily on prompt design — few-shot examples, persona specification, and explicit constraints improve output quality substantially.

**Structured AI ideation frameworks**: Emerging approaches include:
- Human-AI co-ideation frameworks using custom GPTs with domain-specific training (Cambridge AI EDAM, 2025)
- Metacognition-driven ideation where LLMs explicitly decompose problems before generating solutions
- Retrieval-augmented generation (RAG) systems that ground ideation in real market data

**Tool ecosystem**: Miro AI, FigJam AI, Notion AI, and dedicated tools like Ideanote offer LLM-powered ideation features. These typically provide AI-generated suggestions during brainstorming sessions rather than replacing human ideation entirely.

**Prompt patterns for B2C product ideation**:
- Constraint-based: "Generate 20 product concepts that solve [problem] without using [conventional approach]"
- Bisociative: "How would [company from unrelated industry] solve [problem] using their core competency?"
- Contradiction-framed: "What product would be [fast AND thorough], [simple AND powerful], [free AND high-quality]?"
- Persona-driven: "Generate ideas from the perspective of a [domain expert] who has never seen a [current product category]"

#### Strengths & Limitations

**Strengths**: Lowest barrier to entry of any method — requires only a chat interface. Eliminates social dynamics problems (no production blocking, no evaluation apprehension). Can generate large volumes of ideas in minutes. Naturally approximates bisociative thinking through cross-domain training. Can be combined with any other method as an amplifier. Supports both generation and evaluation phases. Available 24/7 without scheduling constraints.

**Limitations**: Homogenization risk — across users, LLMs converge on similar ideas, reducing the portfolio diversity that innovation strategy requires. Surface-level cross-domain connections that lack the depth of genuine domain expertise. Tendency toward plausible-sounding but infeasible ideas. Risk of creative fixation when humans anchor on LLM suggestions. No genuine understanding of user needs, market dynamics, or technical constraints — output requires substantial human evaluation. Prompt sensitivity means that the quality of output varies dramatically with the skill of the prompter. The democratization of idea generation may shift the bottleneck to idea evaluation, where human judgment remains essential.

---

## 5. Comparative Synthesis

### 5.1 Trade-Off Matrix

| Dimension | TRIZ | SCAMPER | Bisociation | Lateral Thinking | Morphological Analysis | Design Sprint | Structured Brainstorming | AI-Augmented |
|-----------|------|---------|-------------|-----------------|----------------------|---------------|------------------------|--------------|
| **Novelty of output** | High | Low-Medium | High | Medium-High | Medium-High | Medium | Low-Medium | Medium |
| **Feasibility of output** | Medium-High | High | Low | Low-Medium | Medium | High | Medium | Low-Medium |
| **Training investment** | 40-200 hrs | <1 hr | 5-10 hrs | 5-20 hrs | 10-40 hrs | 8-16 hrs | 1-4 hrs | 2-8 hrs |
| **Session time** | 4-16 hrs | 0.5-2 hrs | 1-4 hrs | 1-3 hrs | 2-5 days | 4-5 days | 1-2 hrs | 0.5-2 hrs |
| **Min. team size** | 1 | 1 | 1 | 1-2 | 3-8 | 5-7 | 3-6 | 1 |
| **Works solo** | Yes | Yes | Yes | Partially | No | No | No | Yes |
| **Problem definition req'd** | Contradiction | Existing product | Two domains | Problem statement | Decomposed problem | Business challenge | Problem statement | Problem/prompt |
| **Handles fuzzy problems** | Low | Medium | High | High | Low | Medium | Medium | Medium-High |
| **Empirical validation** | Strong (hardware) | Moderate (education) | Weak (philosophical) | Weak | Moderate (policy/defense) | Weak (case-based) | Strong | Emerging |
| **B2C software fit** | Medium | High | Medium | Medium-High | Medium | High | High | High |
| **Scalable with AI tools** | Medium | High | High | Medium | Medium | Low | High | Native |

### 5.2 Cross-Cutting Observations

**Structure-novelty trade-off**: The most structured methods (TRIZ, morphological analysis) tend to produce the most inventive output but require the largest investment. The least structured methods (SCAMPER, basic brainstorming) are cheapest but produce the most incremental output. This is not coincidental — structure forces exploration of unfamiliar solution regions that intuition would avoid.

**Solo developer applicability**: For solo developers or very small teams building B2C products, the team-dependent methods (design sprints, morphological analysis, structured brainstorming) require adaptation. TRIZ, SCAMPER, and AI-augmented ideation work natively for individuals. AI-augmented ideation is particularly suited to the solo context because the LLM provides the diverse perspectives that a team would otherwise supply.

**Method combining**: The taxonomy in Section 3 reveals that most effective ideation practice combines a content-level method (what kind of thinking to do) with a process-level method (how to organize the activity). Natural pairings include: TRIZ principles applied within a design sprint Tuesday; SCAMPER operators used as prompts in brainwriting; bisociative frames explored through AI-augmented generation; morphological parameters generated through structured brainstorming and then systematically combined.

**Evaluation gap**: All methods are stronger at generating ideas than at evaluating them. TRIZ provides some built-in quality signals (the contradiction matrix highlights frequently successful strategies), and morphological analysis includes CCA as a consistency filter, but no method includes robust mechanisms for predicting commercial viability. The evaluation phase remains largely unstructured and dependent on human judgment.

**Diminishing returns in isolation**: Every method exhibits diminishing returns when used exclusively. TRIZ users become fluent with certain principles and neglect others. SCAMPER users anchor on Substitute and Combine while underusing Eliminate and Reverse. AI users converge on the LLM's preferred solution patterns. Method rotation and combination are necessary to sustain novelty over time.

---

## 6. Open Problems & Gaps

### 6.1 Absence of a Software-Specific Contradiction Matrix

The single largest gap in applying TRIZ to B2C product innovation is the lack of a statistically validated contradiction matrix for software. Altshuller's original matrix was derived from analysis of millions of patents. The software adaptations by Rea (2000-2001) and Hargrove et al. (2019) are expert-opinion mappings, not empirical derivations. Building a software contradiction matrix would require analyzing a large corpus of software product innovations, classifying the contradictions they resolved, and identifying which principles were applied. No research group has yet undertaken this project at scale. This represents both a research gap and a practical opportunity — such a matrix would be immediately valuable to thousands of product teams.

### 6.2 Homogenization Risk of AI-Augmented Ideation

The most consequential open problem in AI-augmented ideation is the demonstrated tendency for LLMs to reduce inter-group diversity even while increasing intra-individual originality. If every product team uses the same LLM for ideation, the competitive landscape risks converging on similar solutions. This is the opposite of what innovation strategy requires. Mitigation strategies (fine-tuning on diverse corpora, explicit diversity-promoting prompts, forcing different random seeds or personas) exist in principle but have not been rigorously tested. The problem is analogous to monoculture risk in agriculture: efficiency per unit increases but systemic fragility also increases.

### 6.3 Longitudinal Outcome Validation

Nearly all evidence for ideation methods measures proximal outcomes: number of ideas generated, rated novelty, rated feasibility. Virtually no studies track whether framework-generated ideas lead to commercially successful products. This is methodologically challenging (confounding variables between ideation and execution are numerous) but critical. The field cannot currently answer the question "do products conceived through TRIZ outperform products conceived through brainstorming?" with empirical confidence. What exists is a large body of theoretical argument and case study but a near-total absence of prospective, controlled outcome studies.

### 6.4 Cross-Method Integration Theory

Each method surveyed in this paper was developed independently, with its own theoretical vocabulary and assumptions. No integrative theory explains how to optimally combine methods. Practitioners combine methods through trial and error or facilitator intuition, but there is no framework for predicting which combinations will produce synergistic results versus redundant or interfering effects. A theory of method complementarity — specifying which cognitive mechanisms each method activates and which combinations cover the broadest cognitive ground — would be a significant contribution.

### 6.5 Adaptation to Rapid AI-Assisted Building

The B2C product context is changing faster than ideation methods are evolving. When implementation time drops from months to hours (via AI coding assistants), the optimal ideation investment also changes. Spending five days on a design sprint may not be justified when the prototype could be built in the same time as a functional product. Ideation methods designed for the traditional build cycle (months of development, high cost of wrong direction) may need fundamental restructuring for the AI-assisted build cycle (hours of development, low cost of pivoting). No published framework addresses this recalibration.

### 6.6 Convergent Phase Methods

The ideation literature is overwhelmingly focused on divergent thinking — generating more and better ideas. The convergent phase — selecting which ideas to pursue — receives far less methodological attention. Evaluation criteria, portfolio theory for idea selection, and kill-or-continue decision frameworks remain underdeveloped relative to the generation methods. This asymmetry means that teams often generate excellent ideas and then select poorly among them.

### 6.7 Cultural and Cognitive Diversity Effects

Most ideation research has been conducted in Western, educated, industrialized, rich, and democratic (WEIRD) populations. Cross-cultural differences in creative cognition are documented but poorly integrated into method design. Ideation frameworks may perform differently in cultures with different attitudes toward hierarchy (affecting evaluation apprehension), collectivism (affecting individual-first methods), or uncertainty avoidance (affecting provocation techniques). The generalizability of the evidence base beyond its cultural origins remains an open question.

---

## 7. Conclusion

The landscape of systematic creativity and ideation frameworks is both richer and more fragmented than most practitioners realize. The eight approaches examined in this survey span seven decades of research and practice, from Altshuller's patent analysis in 1946 to LLM-augmented brainwriting experiments in 2024. Each approach embodies a different theory of how creative output is produced and a different set of trade-offs between accessibility, investment, and inventiveness.

The empirical record establishes several durable findings. Unstructured brainstorming reliably underperforms structured alternatives. Methods that eliminate production blocking (brainwriting, electronic brainstorming) consistently improve quantity and quality. Methods that force problem reformulation (TRIZ's contradiction framing, de Bono's provocation technique, morphological decomposition) tend to produce more novel output than methods that transform existing solutions (SCAMPER, basic brainstorming). AI-augmented ideation offers unprecedented accessibility and volume but introduces a systematic diversity reduction that may undermine portfolio innovation strategy.

The most significant gap is not in any individual method but in the spaces between them: the absence of validated integration frameworks, the lack of longitudinal outcome studies linking ideation method to commercial success, and the failure to recalibrate methods for the emerging reality of AI-assisted building where implementation cost approaches zero and ideation quality becomes the sole differentiator.

For B2C product innovators, the practical takeaway is that no single method is sufficient. The strongest ideation practice combines content-level methods (TRIZ contradiction framing, bisociative cross-domain transfer, morphological decomposition) with process-level methods (brainwriting, time-boxed sprints, AI-augmented generation) and rotates combinations to prevent convergence on any single method's blind spots. The goal is not to find the best framework but to assemble a portfolio of frameworks that collectively cover the space of creative possibilities.

---

## References

Altshuller, G. (1984). *Creativity as an Exact Science: The Theory of the Solution of Inventive Problems*. Gordon and Breach.

Altshuller, G. (1996). *40 Principles: TRIZ Keys to Technical Innovation*. Technical Innovation Center. https://triz.org/principles/

Alvarez, A. & Ritchey, T. (2015). Applications of General Morphological Analysis: From Engineering Design to Policy Analysis. *Acta Morphologica Generalis*, 4(1). https://www.swemorph.com/amg/pdf/amg-4-1-2015.pdf

Amabile, T. M. (1983). The social psychology of creativity: A componential conceptualization. *Journal of Personality and Social Psychology*, 45(2), 357-376.

Amabile, T. M. (2012). Componential Theory of Creativity. Harvard Business School Working Paper 12-096. https://www.hbs.edu/ris/Publication%20Files/12-096.pdf

De Bono, E. (1967). *New Think: The Use of Lateral Thinking in the Generation of New Ideas*. Basic Books.

De Bono, E. (1985). *Six Thinking Hats*. Little, Brown and Company. https://www.debonogroup.com/services/core-programs/six-thinking-hats/

De Freitas, J., Nave, G., & Puntoni, S. (2025). Research: When Used Correctly, LLMs Can Unlock More Creative Ideas. *Harvard Business Review*, December 2025. https://hbr.org/2025/12/research-when-used-correctly-llms-can-unlock-more-creative-ideas

Diehl, M. & Stroebe, W. (1987). Productivity loss in brainstorming groups: Toward the solution of a riddle. *Journal of Personality and Social Psychology*, 53(3), 497-509. https://psycnet.apa.org/record/1988-01348-001

Dubitzky, W., Kotter, T., Schmidt, O., & Berthold, M. R. (2012). Towards Creative Information Exploration Based on Koestler's Concept of Bisociation. In *Bisociative Knowledge Discovery*, Springer LNCS 7250. https://link.springer.com/chapter/10.1007/978-3-642-31830-6_2

Eberle, B. (1971). *SCAMPER: Games for Imagination Development*. Prufrock Press.

Guilford, J. P. (1950). Creativity. *American Psychologist*, 5(9), 444-454.

Hargrove, M., Smith, C., & Watson, J. (2019). TRIZ for Digital Systems Engineering: New Characteristics and Principles Redefined. *Systems*, 7(3), 39. https://www.mdpi.com/2079-8954/7/3/39

Knapp, J., Zeratsky, J., & Kowitz, B. (2016). *Sprint: How to Solve Big Problems and Test New Ideas in Just Five Days*. Simon & Schuster. https://www.thesprintbook.com/

Koestler, A. (1964). *The Act of Creation*. Macmillan.

Mullen, B., Johnson, C., & Salas, E. (1991). Productivity loss in brainstorming groups: A meta-analytic integration. *Basic and Applied Social Psychology*, 12(1), 3-23. https://www.tandfonline.com/doi/abs/10.1207/s15324834basp1201_1

Osborn, A. F. (1953). *Applied Imagination: Principles and Procedures of Creative Problem Solving*. Charles Scribner's Sons.

Rea, K. C. (2001). TRIZ and Software: 40 Principle Analogies, Parts 1 & 2. *The TRIZ Journal*. https://novalis.org/triz-talk/softwarearticle.html

Ritchey, T. (2011). *Wicked Problems — Social Messes: Decision Support Modelling with Morphological Analysis*. Springer.

Ritchey, T. (2015). Principles of Cross-Consistency Assessment in General Morphological Modelling. *Acta Morphologica Generalis*, 4(2). https://swemorph.wordpress.com/2015/12/07/principles-of-cross-consistency-assessment-in-morphological-modelling/

Rohrbach, B. (1969). Kreativ nach Regeln: Methode 635, eine neue Technik zum Losen von Problemen. *Absatzwirtschaft*, 12, 73-75.

Savransky, S. D. (2000). *Engineering of Creativity: Introduction to TRIZ Methodology of Inventive Problem Solving*. CRC Press. https://www.taylorfrancis.com/books/mono/10.1201/9781420038958/engineering-creativity-semyon-savransky

Shaer, O. et al. (2024). AI-Augmented Brainwriting: Investigating the use of LLMs in group ideation. *Proceedings of the 2024 CHI Conference on Human Factors in Computing Systems*. https://dl.acm.org/doi/10.1145/3613904.3642414

Simon, H. A. (1969). *The Sciences of the Artificial*. MIT Press.

Taylor, D. W., Berry, P. C., & Block, C. H. (1958). Does group participation when using brainstorming facilitate or inhibit creative thinking? *Administrative Science Quarterly*, 3(1), 23-47.

Zwicky, F. (1969). *Discovery, Invention, Research Through the Morphological Approach*. Macmillan. https://www.swemorph.com/ma.html

---

## Practitioner Resources

### TRIZ Resources

- **TRIZ40.com** — Free interactive contradiction matrix and 40 principles with examples. https://www.triz40.com/aff_Principles_TRIZ.php
- **PRIZ Guru** — Web-based TRIZ platform with guided problem-solving workflows. https://www.priz.guru/
- **The TRIZ Journal** — Largest online collection of TRIZ articles and case studies. https://the-trizjournal.com/
- **MATRIZ** — International TRIZ Association, offers certification at five levels. https://wiki.matriz.org/
- **Rea's Software TRIZ Analogies** — The foundational mapping of 40 principles to software. https://novalis.org/triz-talk/softwarearticle.html
- **MDPI Digital Systems TRIZ** — 22 additional characteristics for digital systems. https://www.mdpi.com/2079-8954/7/3/39

### SCAMPER Resources

- **IxDF SCAMPER Guide** — Comprehensive tutorial with product design examples. https://ixdf.org/literature/article/learn-how-to-use-the-best-ideation-methods-scamper
- **Designorate SCAMPER Guide** — Worked examples and application templates. https://www.designorate.com/a-guide-to-the-scamper-technique-for-creative-thinking/
- **The Decision Lab** — SCAMPER reference with cognitive science context. https://thedecisionlab.com/reference-guide/philosophy/scamper

### Bisociation & Cross-Domain Resources

- **Bisociative Knowledge Discovery (Springer)** — Computational formalization of bisociation. https://link.springer.com/book/10.1007/978-3-642-31830-6
- **The Marginalian on Koestler** — Accessible introduction to bisociation theory. https://www.themarginalian.org/2013/05/20/arthur-koestler-creativity-bisociation/

### Lateral Thinking Resources

- **De Bono Group** — Official training programs and certification. https://www.debonogroup.com/
- **Six Thinking Hats Facilitator Guide** — MindTools summary with session templates. https://www.mindtools.com/ajlpp1e/six-thinking-hats/

### Morphological Analysis Resources

- **Swedish Morphological Society** — Ritchey's GMA methodology documentation. https://www.swemorph.com/ma.html
- **MA/Carma Software** — The standard GMA software tool. https://www.swemorph.com/macarma.html
- **Ness Labs Zwicky Box Guide** — Practitioner-oriented introduction. https://nesslabs.com/zwicky-box
- **InventionPath Morphological Tool** — Web-based morphological analysis. https://www.inventionpath.com/morphological-analysis-tool

### Design Sprint Resources

- **The Sprint Book** — Official site for Knapp's methodology. https://www.thesprintbook.com/
- **Google Ventures Sprint Kit** — Templates and facilitation materials. https://www.gv.com/sprint/
- **AJ&Smart Design Sprint 2.0** — Updated 4-day format. https://go.ajsmart.com/masterclass
- **SessionLab Sprint Template** — Detailed activity-by-activity facilitator guide. https://www.sessionlab.com/templates/design-sprint-2-0/

### Structured Brainstorming Resources

- **SessionLab Ideation Workshop Guide** — Comprehensive facilitation playbook. https://www.sessionlab.com/blog/how-to-run-an-ideation-workshop/
- **IxDF Ideation Methods** — Research-grounded overview of brainstorming variants. https://ixdf.org/literature/article/what-is-ideation-and-how-to-prepare-for-ideation-sessions
- **Workshopper Ideation Exercises** — Practical exercise library. https://www.workshopper.com/post/ideation-exercises

### AI-Augmented Ideation Resources

- **CHI 2024: AI-Augmented Brainwriting** — The leading empirical study. https://dl.acm.org/doi/10.1145/3613904.3642414
- **HBR: LLMs and Creative Ideas (2025)** — Overview of the diversity trade-off. https://hbr.org/2025/12/research-when-used-correctly-llms-can-unlock-more-creative-ideas
- **Cambridge AI EDAM: Human-AI Co-Ideation** — Framework for structured AI-assisted design ideation. https://www.cambridge.org/core/journals/ai-edam/article/enhancing-designer-creativity-through-humanai-coideation-a-cocreation-framework-for-design-ideation-with-custom-gpt/BCC2CBE43EECE6F0D937BBC0D2F44868

### General Creativity Science

- **Amabile's Componential Theory (Harvard Working Paper)** — The foundational motivation-creativity model. https://www.hbs.edu/ris/Publication%20Files/12-096.pdf
- **ScienceDirect Creativity Theory Overview** — Survey of major theoretical frameworks. https://www.sciencedirect.com/topics/psychology/creativity-theory
- **Towards a Taxonomy of Idea Generation Techniques** — Classification framework for 87 ideation methods. https://ideas.repec.org/a/vrs/founma/v11y2019i1p65-80n6.html
