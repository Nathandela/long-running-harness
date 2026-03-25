---
title: "The Cognitive Science of Debugging"
date: 2026-03-21
summary: A survey of cognitive science research applied to software debugging, covering expert mental models, hypothesis-driven reasoning, cognitive biases, information foraging, and the psychology of bug-finding.
keywords: [cognitive science, debugging psychology, mental models, cognitive biases, expertise, program comprehension]
---

# The Cognitive Science of Debugging

## Abstract

Debugging---the process of locating, understanding, and correcting defects in software---is among the most cognitively demanding activities in software engineering. Empirical studies consistently report that developers spend 35--50% of their time validating and debugging software, with the cost of debugging, testing, and verification estimated at 50--75% of total development budgets. Despite this centrality, debugging has historically received less systematic attention from cognitive science than program comprehension or design. This survey synthesizes four decades of research at the intersection of cognitive science and software debugging, spanning foundational work on expert-novice differences (Vessey, 1985; Gugerty & Olson, 1986) through contemporary neurocognitive models employing functional near-infrared spectroscopy (Hu et al., 2024).

The survey is organized around ten cognitive dimensions of debugging: expertise and chunking, hypothesis-driven reasoning, mental models of execution, cognitive biases, information foraging, sensemaking, cognitive load, social debugging, expertise development, and emotional-motivational factors. For each dimension, we examine the theoretical foundations, the primary empirical evidence, the implications for tool design, and the strengths and limitations of the research program. We present a classification framework that situates these dimensions along axes of individual-vs-social cognition and representational-vs-strategic processes.

A comparative synthesis reveals several cross-cutting findings: that program comprehension is the fundamental bottleneck in debugging performance; that developers systematically underestimate their susceptibility to cognitive biases during fault diagnosis; that information foraging models predict developer navigation behavior more accurately than verbal self-reports; and that the field lacks longitudinal studies of debugging expertise acquisition. We identify open problems including the absence of validated cognitive architectures for debugging, the need for ecologically valid laboratory paradigms, and the challenge of studying debugging cognition in the age of AI-assisted development tools.

## 1. Introduction

### 1.1 Problem Statement

Software debugging is a diagnostic reasoning task in which a developer must bridge the gap between observed program behavior and expected program behavior, identify the root cause of the discrepancy, and implement a correction. This process engages virtually every facet of human cognition: perception, attention, memory, reasoning, problem-solving, and metacognition. Yet for much of the history of software engineering, debugging was treated as a "black art"---an unteachable skill acquired only through experience (Zeller, 2009). The emergence of cognitive science perspectives on debugging, beginning in the early 1980s, has progressively transformed this view, revealing debugging to be a structured cognitive activity amenable to scientific analysis, pedagogical intervention, and tool support.

### 1.2 Scope and Definitions

This survey covers research on the cognitive processes involved in interactive debugging by human developers. We define *debugging* following Zeller (2009) as the process encompassing (1) observing a failure, (2) reproducing the failure, (3) simplifying the failure, (4) locating the defect, (5) understanding the defect, and (6) correcting the defect. We use *fault* to denote the defective code, *error* to denote the incorrect internal state, and *failure* to denote the externally observable incorrect behavior, consistent with IEEE terminology.

The survey encompasses work from cognitive psychology, human-computer interaction, software engineering, and computing education. We exclude purely automated debugging techniques (e.g., spectrum-based fault localization, automated program repair) except where they interact with human cognition. We focus on studies involving general-purpose programming languages and professional or advanced-student participants, noting where findings from end-user programming or visual programming environments may generalize.

### 1.3 Historical Context

The cognitive study of debugging emerged from two converging research traditions. The first was the *psychology of programming*, initiated by Weinberg's (1971) "The Psychology of Computer Programming" and formalized through Shneiderman's (1980) cognitive models and the empirical tradition at the annual Workshop on Empirical Studies of Programmers. The second was *expert-novice research* in cognitive psychology, inspired by Chase and Simon's (1973) chunking studies of chess expertise and extended to programming by Soloway, Adelson, and Ehrlich (1988), Détienne (1990), and others. These traditions converged in the 1980s when researchers such as Vessey (1985), Gugerty and Olson (1986), and Katz and Anderson (1987) began applying rigorous experimental methods to the specific problem of debugging.

## 2. Foundations

### 2.1 Cognitive Theories of Program Comprehension

Debugging is fundamentally dependent on program comprehension---the ability to construct an accurate mental representation of what a program does and how it does it. Several cognitive models of program comprehension provide the theoretical substrate for understanding debugging cognition.

**Bottom-up models.** Shneiderman and Mayer (1979) proposed that programmers construct understanding by reading code sequentially and building progressively higher-level abstractions. Pennington (1987) elaborated this model, finding that programmers first develop a control-flow abstraction (the sequence of operations) before constructing a functional abstraction (the program's goals and data transformations). This bottom-up process is particularly relevant to debugging unfamiliar code.

**Top-down models.** Brooks (1983) proposed that comprehension proceeds from a hypothesis about the program's purpose, which is progressively refined by mapping domain concepts onto code structures. This model aligns with how expert debuggers approach familiar codebases: they begin with expectations about what the code should do and search for discrepancies.

**Integrated models.** Letovsky (1987) proposed a model combining both directions: programmers maintain a *knowledge base* of programming and domain expertise, a *mental model* of the program under study, and an *assimilation process* that generates why, how, and what conjectures to enrich the mental model using evidence from source code and documentation. Storey (2006) reviewed these models and proposed that comprehension strategies are context-dependent, with programmers switching between top-down and bottom-up approaches based on task demands, code familiarity, and available tool support.

### 2.2 Schema Theory and Programming Plans

A central concept bridging cognitive psychology and programming expertise is the notion of *programming plans*---stereotyped patterns of code that implement common computational goals. Soloway and Ehrlich (1984) demonstrated that expert programmers recognize and deploy a repertoire of plans (e.g., counter-controlled loops, sentinel-based input processing, running-total accumulation) as cognitive chunks. Détienne (1990) extended this framework, distinguishing between *strategic plans* (language-independent solution approaches) and *implementation plans* (language-dependent code patterns). During debugging, plan recognition allows experts to rapidly identify anomalies: a deviation from a known plan triggers a localized search for the fault.

### 2.3 Chunking and Working Memory

Chase and Simon's (1973) chunking theory, originally developed for chess expertise, posits that experts encode domain information in larger, more meaningful units (*chunks*) stored in long-term memory. When applied to programming (Adelson, 1981; Vessey, 1985), chunking theory predicts that expert programmers perceive code not as individual statements but as meaningful groups corresponding to programming plans or algorithmic patterns. This allows experts to hold more program information in working memory simultaneously, facilitating the kind of multi-variable reasoning that debugging requires.

Miller (1956) established the classic working memory limit of 7 +/- 2 items, later revised downward by Cowan (2001) to approximately 4 chunks. For debugging, this constraint is critical: a developer tracing a bug through multiple function calls, data transformations, and conditional branches may easily exceed working memory capacity, necessitating external support through tools, notes, or social interaction.

### 2.4 Dual-Process Theory and Problem Solving

Kahneman's (2011) dual-process framework distinguishes between fast, automatic System 1 thinking and slow, deliberate System 2 thinking. In debugging, System 1 processes underlie expert pattern recognition---the immediate, intuitive recognition that "something is wrong here." System 2 processes are engaged in systematic hypothesis testing, careful code tracing, and the deliberate evaluation of alternative explanations. Many of the cognitive biases observed in debugging (Section 4.4) arise from inappropriate reliance on System 1 heuristics when System 2 reasoning is required.

## 3. Taxonomy of Approaches

### 3.1 Classification Framework

We organize the cognitive science of debugging along two orthogonal dimensions. The first dimension ranges from *individual cognition* (processes occurring within a single developer's mind) to *social cognition* (processes distributed across multiple developers or between developers and artifacts). The second dimension ranges from *representational processes* (how developers encode and maintain mental models of program behavior) to *strategic processes* (how developers plan, execute, and evaluate debugging actions).

| | **Representational** | **Strategic** |
|---|---|---|
| **Individual** | Mental models of execution (4.3) | Hypothesis-driven debugging (4.2) |
| | Cognitive biases (4.4) | Information foraging (4.5) |
| | Cognitive load (4.7) | Expert vs. novice strategies (4.1) |
| **Social** | Sensemaking (4.6) | Pair/mob debugging (4.8) |
| | Shared mental models | Social debugging practices |
| **Developmental** | Expertise development (4.9) | Deliberate practice |
| | Emotional factors (4.10) | Motivational regulation |

### 3.2 Methodological Traditions

Research on debugging cognition has employed diverse methodologies, each with characteristic strengths and limitations:

- **Think-aloud protocols**: Participants verbalize their thought processes while debugging (Vessey, 1985; Gugerty & Olson, 1986). Rich qualitative data, but potential reactivity effects.
- **Eye-tracking**: Captures visual attention patterns during code reading (Bednarik & Tukiainen, 2006). Objective temporal data, but limited inference about cognitive processes.
- **Neuroimaging (fNIRS, fMRI)**: Measures neural activity during debugging tasks (Hu et al., 2024). Direct cognitive load measurement, but constrained ecological validity.
- **Log analysis**: Captures navigation and editing patterns from IDE instrumentation (Parnin & Rugaber, 2011). Large-scale data collection, but limited access to cognitive states.
- **Controlled experiments**: Manipulates specific variables (e.g., bug type, tool availability, expertise level) to isolate causal effects. High internal validity, but often reduced ecological validity.
- **Field studies and ethnographies**: Observes debugging in naturalistic settings (Ko et al., 2006). High ecological validity, but limited experimental control.

## 4. Analysis

### 4.1 Expert vs. Novice Debugging

#### Theory and Mechanism

The study of expert-novice differences in debugging builds on the broader expertise literature in cognitive psychology. The central theoretical claim is that expert debuggers differ from novices not primarily in the strategies they employ but in the quality of their program comprehension, which in turn depends on the richness and organization of their domain knowledge (chunking, plans, schemas).

Vessey (1985) proposed a five-phase model of debugging: (1) problem determination, (2) gaining familiarity with the program, (3) exploration of particular aspects, (4) hypothesis formulation, and (5) error repair. She demonstrated that programmer expertise, operationalized through chunking ability, was strongly related to debugging strategy selection. Experts adopted a *breadth-first*, system-level view of the problem area, while novices tended toward *depth-first* approaches, pursuing single hypotheses without considering the broader system context. Critically, experts displayed "smooth-flowing" debugging behavior, transitioning fluidly between phases, while novices exhibited erratic, non-systematic patterns.

#### Literature Evidence

Gugerty and Olson (1986) conducted two experiments comparing expert and novice debugging in LOGO and Pascal programs. Their central finding was that experts' superior debugging performance was due primarily to superior program comprehension ability rather than better debugging strategies per se. Experts generated high-quality hypotheses with less code study than novices, while novices frequently *introduced new bugs* during their repair attempts---a striking finding that highlights the importance of accurate mental models.

Adelson (1981) demonstrated that expert programmers recalled meaningful code segments significantly better than novices, paralleling Chase and Simon's chess results. Crucially, this advantage disappeared when code was scrambled into meaningless arrangements, confirming that expert memory superiority depends on meaningful pattern recognition rather than raw memory capacity. Wiedenbeck (1985) extended this finding, showing that experts' recall advantage was mediated by their ability to identify and encode programming plans.

Bednarik and Tukiainen (2006) used eye-tracking to study expertise-dependent visual attention during debugging with multiple code representations. They found that expert debuggers developed distinct attention strategies over time, integrating information from code and graphical representations more efficiently than novices, who frequently switched between representations without systematic integration.

More recently, Hu et al. (2024) proposed the first neurally justified cognitive model of dynamic debugging, using functional near-infrared spectroscopy (fNIRS) with 28 participants. Their model identifies five neurally and behaviorally distinct stages: task comprehension, fault localization, code editing, compiling, and output comprehension. They found significant differences in cognitive load as a function of expertise and code identifier morphology, though not in end-to-end programming outcomes.

#### Implementations and Benchmarks

The expert-novice paradigm has been operationalized in numerous educational interventions. Context-specific debugging instruction that pairs concrete bug-localization steps with problem-specific details achieved 80% correctness in a single session, compared to 20--44% for abstract guidelines or no instruction (McCauley et al., 2024). The Debug-It system (Murphy et al., 1998) implemented a practice environment based on the finding that deliberate debugging practice improves comprehension, and the Robobug game teaches debugging strategies through interactive play (McCauley et al., 2008).

#### Strengths and Limitations

The expert-novice paradigm provides robust, replicable findings that have direct pedagogical implications. However, the dichotomous expert-novice categorization obscures the developmental trajectory of debugging expertise. Most studies use small, artificial programs that may not engage the full range of expert strategies. The ecological validity of think-aloud protocols has been questioned, as verbalization may alter the debugging process itself. Furthermore, expertise is typically operationalized through years of experience or course completion, rather than through validated measures of debugging skill.

### 4.2 Hypothesis-Driven Debugging

#### Theory and Mechanism

Hypothesis-driven debugging treats fault diagnosis as an instance of scientific reasoning. The theoretical foundation comes from Klahr and Dunbar's (1988) *Scientific Discovery as Dual Search* (SDDS) model, which characterizes scientific reasoning as search through two spaces: a *hypothesis space* (possible explanations) and an *experiment space* (possible tests). Applied to debugging, the hypothesis space contains potential fault locations and mechanisms, while the experiment space contains possible test cases, breakpoint placements, and print statements.

Zeller (2009) formalized this connection in "Why Programs Fail," presenting debugging as a process of applying the scientific method: (1) observe a failure, (2) form a hypothesis about the cause, (3) predict consequences of the hypothesis, (4) test the prediction through experiment, (5) refine the hypothesis based on results. Delta debugging (Zeller, 1999) automates the hypothesis-trial-result loop by systematically narrowing failure-inducing inputs until a minimal set remains.

*Abductive reasoning*---inference to the best explanation---is the logical form of hypothesis generation in debugging. Given an observed failure, the debugger generates candidate explanations (possible faults) that, if true, would account for the observed behavior. This is formally an instance of the abduction problem studied in AI diagnostic reasoning (Peng & Reggia, 1990). The challenge in debugging is that the hypothesis space is enormous: any statement in the program is potentially faulty, and faults may interact in complex ways.

#### Literature Evidence

Vessey's (1985) five-phase model placed hypothesis formulation as the fourth phase, preceded by three phases of comprehension-building. This ordering is significant: it implies that effective hypothesis generation depends on prior program understanding, consistent with Gugerty and Olson's (1986) finding that comprehension ability, not debugging strategy, is the primary differentiator between experts and novices.

Lawrance et al. (2013) compared hypothesis-driven navigation against information scent-following during professional programmers' debugging of real-world open-source programs. They found that scent-following was a more effective predictor of programmer navigation than the programmers' verbally stated hypotheses, suggesting that explicit hypothesis articulation may be an incomplete account of actual debugging behavior. Developers may follow implicit, perceptually driven strategies even when they report following explicit hypotheses.

Spinellis (2018) distinguished between *backward reasoning* (starting from the failure and tracing causality back to the fault) and *forward reasoning* (starting from a suspected fault and tracing consequences forward to the failure). Expert debuggers appear to flexibly switch between these modes, while novices tend to perseverate in forward reasoning even when backward reasoning would be more efficient.

#### Implementations and Benchmarks

Zeller's delta debugging algorithm (1999) is the most prominent computational implementation of hypothesis-driven debugging. It systematically bisects the space of input changes to isolate the minimal failure-inducing change. Program slicing (Weiser, 1984) provides another computational approach: by identifying only those statements that could influence an incorrect variable value, it constrains the hypothesis space that the developer must search. Empirical evaluations of slicing for fault localization report mixed results: Böhme et al. (2021) found slicing effective for narrowing search in C programs, but noted that not all statements within a slice are equally relevant.

Ko and Myers' Whyline (2004, 2008) operationalized hypothesis-driven debugging through an interrogative interface: developers select from automatically generated "why did" and "why didn't" questions about program output, and the tool provides answers derived from static and dynamic program analysis. Evaluation showed that novice programmers with the Whyline were twice as fast as expert programmers without it, and the tool reduced debugging time by nearly a factor of 8 while enabling 40% more task completions.

#### Strengths and Limitations

The hypothesis-driven framework provides a normative model of how debugging *should* proceed, and evidence that expert behavior approximates this ideal. However, the framework may overstate the role of explicit, articulated reasoning; much expert debugging appears to rely on implicit pattern recognition. The SDDS model was developed for simple, well-defined discovery tasks and may not fully capture the complexity of debugging large software systems where the hypothesis space is effectively unbounded. Additionally, the framework assumes that developers can formulate and test hypotheses independently, which may not hold when debugging involves distributed systems, concurrency, or other domains that resist mental simulation.

### 4.3 Mental Models of Program Execution

#### Theory and Mechanism

A mental model of program execution is an internal representation that allows a developer to mentally simulate---"run"---a program and predict its behavior for given inputs. Du Boulay (1986) introduced the term *notional machine* to describe the abstract computer that a programmer must understand: a simplified, idealized model of how programs execute that captures essential semantics while omitting implementation details (e.g., the Java notional machine includes objects, references, method dispatch, and a call stack, but omits memory management details).

Sorva (2013) provided the definitive treatment of notional machines in computing education, arguing that the notional machine is an explicit learning objective that instructors should address directly. He synthesized literature on programming misconceptions, the cognitive theory of mental models (Johnson-Laird, 1983), constructivist learning theory, and phenomenographic research on experiencing programming. His analysis showed that learners develop both insights and misconceptions as their mental models are gradually refined, and that many persistent debugging difficulties stem from inaccurate or incomplete notional machine models.

The role of visualization in mental model formation is substantial. Visual program simulation (VPS), as developed by Sorva and colleagues, involves the learner in interactive simulations where they take on the role of the computer executing a program, using a given visualization of a notional machine to illustrate what happens in memory. This approach draws on embodied cognition research suggesting that physical and perceptual engagement strengthens mental model formation.

#### Literature Evidence

Pea (1986) documented systematic misconceptions in novice programmers' mental models, including the "superbug"---the belief that the computer understands the programmer's intentions and will do what was meant rather than what was written. These misconceptions directly impair debugging: a programmer who believes the computer understands intent will fail to recognize specification-level faults.

Pennington (1987) demonstrated that programmers working on unfamiliar code first construct a control-flow mental model (what happens in what order) and only subsequently develop a functional model (what goals the code achieves). This developmental sequence has implications for debugging: developers working with unfamiliar code may be unable to evaluate the correctness of program behavior because they lack the functional mental model needed to specify expected behavior.

Research on program visualization tools provides evidence that external representations can scaffold mental model formation. Sorva's (2012) review of generic program visualization systems found that interactive engagement (where users predict or construct execution steps) was more effective than passive viewing. The UUhistle system, which implements VPS for Python programming, required students to predict execution outcomes before the system revealed the actual behavior, thereby engaging the comparison process that refines mental models.

#### Implementations and Benchmarks

Tools supporting mental model formation include: Python Tutor (Guo, 2013), which provides step-by-step visualization of Python program execution with an explicit memory model; UUhistle (Sorva et al., 2013), which implements visual program simulation; and Java Visualizer, which provides object graph visualization for Java programs. Time-travel debuggers such as rr (Mozilla) and UDB (Undo) provide a different form of mental model support: by allowing developers to step backward through execution, they relieve the need to maintain a forward-only mental simulation, reducing the working memory demand of tracking causal chains.

#### Strengths and Limitations

Mental model research provides a principled account of why debugging is difficult (inaccurate or incomplete models) and suggests clear intervention strategies (explicit notional machine instruction, interactive visualization). However, the concept of "mental model" is itself somewhat loosely defined, with debate over whether mental models are propositional representations, analog simulations, or some combination. Measuring mental model accuracy is methodologically challenging---researchers typically infer model quality from prediction accuracy or verbal protocols, both indirect measures. Furthermore, the relationship between static mental models and dynamic debugging behavior is not well characterized: having an accurate mental model is necessary but not sufficient for effective debugging.

### 4.4 Cognitive Biases in Debugging

#### Theory and Mechanism

Cognitive biases are systematic deviations from normative rationality that arise from heuristic processing. In debugging, several biases are particularly consequential:

**Confirmation bias** is the tendency to seek, interpret, and privilege information that confirms existing beliefs. In debugging, this manifests as a tendency to design test cases that confirm a suspected fault location rather than tests that could falsify it. Wason's (1960) classic selection task demonstrates that even intelligent adults consistently fail to seek disconfirming evidence; this tendency is amplified in debugging where the hypothesis space is large and disconfirmation requires creative test construction.

**Anchoring** is the tendency to rely excessively on the first piece of information encountered. In debugging, initial hypotheses about fault location exert a disproportionate influence on subsequent search behavior, even when contradictory evidence accumulates. A developer who initially suspects a particular module may continue investigating that module long after evidence points elsewhere.

**Availability heuristic** refers to judging the likelihood of an event by the ease with which examples come to mind. Developers who have recently encountered a particular type of bug (e.g., null pointer dereference, off-by-one error) are disproportionately likely to suspect that same bug type in new debugging episodes, regardless of its actual base rate.

**Functional fixedness** is the inability to use an object or concept in a novel way, beyond its familiar function. Duncker (1945) introduced this concept; in programming, it manifests as the inability to consider that a function or variable might behave differently from its typical usage. Luchins' (1942) *Einstellung effect*---the tendency to apply previously successful problem-solving strategies even when simpler alternatives exist---is a closely related phenomenon that affects debugging when developers persist with familiar debugging approaches (e.g., print statements) even when other tools (e.g., conditional breakpoints, reverse debuggers) would be more efficient.

#### Literature Evidence

Teasley et al. (1994) investigated confirmation bias specifically in novice programmers' testing and debugging behavior. They found that novices overwhelmingly constructed test cases designed to demonstrate correct program behavior rather than to expose potential faults. This "testing to pass" rather than "testing to fail" orientation directly impairs debugging by reducing the probability of encountering failure-revealing inputs.

Mohanani et al. (2018) conducted a systematic mapping study of cognitive biases in software engineering, published in IEEE Transactions on Software Engineering. They analyzed 65 primary studies and found that confirmation bias and anchoring were the most frequently studied biases, and that about 70% of observed developer actions in studied contexts were associated with at least one cognitive bias. The anchoring effect was particularly pronounced in debugging scenarios where initial error messages or stack traces focused attention on specific code regions.

Chattopadhyay et al. (2020) studied functional fixedness among novice student programmers asked to use Java methods in novel ways. All students exhibited at least one instance of functional fixedness, though no significant relationship was found between fixedness and overall problem-solving performance, suggesting that functional fixedness may slow but not prevent eventual bug resolution.

Steffens et al. (2012) examined the relationship between confirmation bias, company size, experience level, and reasoning skills in software development and testing. They found that experience did not reliably reduce confirmation bias---expert developers were sometimes *more* susceptible to confirmation bias due to stronger prior beliefs about likely fault locations.

#### Implementations and Benchmarks

Several tool-based mitigation strategies have been proposed. Mutation testing (DeMillo et al., 1978) forces developers to consider whether their tests can detect specific code changes, counteracting confirmation bias by requiring disconfirmation-capable test suites. Code review checklists that include explicit prompts to consider alternative hypotheses and disconfirming evidence can reduce anchoring effects. The Whyline (Ko & Myers, 2004) addresses functional fixedness by presenting questions developers might not have considered, expanding the hypothesis space beyond familiar patterns.

#### Strengths and Limitations

Cognitive bias research provides compelling explanations for specific debugging failures and suggests concrete mitigation strategies. However, several limitations exist. Most studies use artificial debugging tasks with single, planted bugs, which may not elicit the full range of biases present in real-world debugging. The interaction between multiple simultaneous biases is poorly understood. Furthermore, some degree of heuristic processing is adaptive---an expert's initial hypothesis, informed by pattern recognition, is often correct, and systematic bias mitigation may slow debugging in cases where heuristic judgment would suffice. The challenge is not to eliminate heuristic processing but to develop metacognitive awareness of when it is likely to mislead.

### 4.5 Information Foraging Theory

#### Theory and Mechanism

Information Foraging Theory (IFT), developed by Pirolli and Card (1999) at Xerox PARC, applies optimal foraging theory from behavioral ecology to human information-seeking behavior. The core metaphor treats the developer as a *predator* seeking *prey* (information needed to fix the bug) in an *information environment* composed of *patches* (code files, documentation, stack traces, debugger output). The developer navigates between patches using *links* (IDE navigation features, function calls, search results) that carry *information scent*---cues about the likelihood that following a particular link will lead to relevant information.

The theory specifies a decision framework: developers continually choose between (1) continuing to forage within the current patch, (2) navigating to a different patch via a link, or (3) enriching the environment (e.g., performing a search query, adding a bookmark). The optimal choice maximizes the ratio of expected information value to expected cost: *selected choice = max E(v)/E(c)*.

#### Literature Evidence

Lawrance et al. (2013) applied IFT to model professional programmers' debugging behavior in real-world open-source programs. Using an executable model of the theory, they predicted programmers' navigation choices and compared these predictions against the programmers' own verbal reports of their reasoning. The critical finding was that *scent and scent-plus-topology were more effective predictors of programmer navigation than the programmers' stated hypotheses*, suggesting that much debugging navigation is driven by perceptual cues in the code environment rather than by explicit reasoning.

Piorkowski et al. (2015) extended IFT to characterize developers' foraging "diets"---the patterns of information sources they typically consume during debugging. They found that developers spend approximately 50% of their debugging time foraging for information, with approximately 50% of navigations yielding less information than expected and 40% requiring more effort than predicted. This persistent misestimation of information value and cost suggests that debugging environments systematically provide poor information scent.

Fleming et al. (2013) applied IFT to analyze debugging, refactoring, and reuse tasks, finding that information foraging patterns differed substantially across task types. Debugging tasks involved more between-patch navigation and more reliance on scent from identifier names, while refactoring tasks involved more systematic, topology-driven navigation.

Ko et al. (2006) studied how developers seek, relate, and collect relevant information during software maintenance tasks, finding that developers frequently failed to find relevant information even when it was present in the codebase, suggesting that information scent in source code is often weak or misleading.

#### Implementations and Benchmarks

IFT-informed tool design principles have influenced several debugging environments. Recommendations include enriching information scent through better identifier naming, providing contextual navigation aids that reduce between-patch navigation cost, supporting scent-following through features like "find all references" and call hierarchy views, and designing search interfaces that surface relevant code fragments with appropriate contextual cues. The PFIS2 model (Piorkowski et al., 2016) provided a computational implementation of IFT for predicting developer navigation, achieving prediction accuracy substantially above baseline.

#### Strengths and Limitations

IFT provides a rigorous, quantitative framework for understanding debugging navigation that makes testable predictions. Its ecological metaphor is intuitive and has yielded practical design insights. However, IFT was originally developed for web navigation and its adaptation to code navigation involves several assumptions (e.g., that identifier names constitute the primary scent source) that may not hold in all development contexts. The theory focuses on navigation behavior and does not directly address the reasoning processes that occur once relevant information is found. Furthermore, IFT models assume approximately rational foraging behavior, which may not capture the biased, emotion-influenced navigation patterns observed in practice.

### 4.6 Sensemaking in Debugging

#### Theory and Mechanism

Sensemaking, as formulated by Russell et al. (1993) and elaborated by Pirolli and Card (2005), is the process of constructing a mental representation that accounts for observed data. Applied to debugging, sensemaking addresses the fundamental challenge: bridging the gap between what a program *does* and what a programmer *expects* it to do. Ko and Myers (2004) operationalized this gap through the concept of *interrogative debugging*---the idea that debugging fundamentally involves asking and answering questions about program behavior.

The sensemaking process in debugging consists of two interleaved loops: an *information foraging loop* (seeking relevant data in code, output, logs, and documentation) and a *sensemaking loop* (constructing and evaluating explanations that account for the foraged data). Debugging progresses as developers cycle between these loops, gathering evidence, formulating explanations, and seeking additional evidence to confirm or disconfirm their emerging understanding.

#### Literature Evidence

Ko and Myers (2004, 2008) identified that the critical cognitive challenge in debugging is the *translation problem*: developers must translate their observations of incorrect behavior into questions about code. The Whyline addressed this by allowing programmers to pose "why did" and "why didn't" questions directly about program output, with the system translating these into the appropriate program analyses. The dramatic effectiveness of this approach---novices with the Whyline outperforming experts without it---suggests that the translation problem is a major bottleneck in debugging and that interrogative interfaces can substantially reduce it.

Grigoreanu et al. (2012) derived a detailed sensemaking model for end-user debugging through empirical analysis of debugging episodes. They categorized participants' activities according to the dual-loop sensemaking framework and identified two successful strategies for traversing the sensemaking model: a *systematic* strategy (methodical foraging followed by deliberate explanation construction) and an *opportunistic* strategy (rapid alternation between foraging and explanation). They found that 73% of end-user debugging time was spent in the information foraging loop, suggesting that finding relevant information, not reasoning about it, is the primary time sink.

The concept of *discrepancy detection*---noticing a mismatch between expected and actual program behavior---has been identified as the most common global strategy in debugging (McCauley et al., 2008). This process engages what Piaget termed *disequilibrium*: the cognitive discomfort arising from a conflict between existing mental models and new evidence. Effective debugging requires not only detecting discrepancies but correctly attributing them to specific faults, a process that is susceptible to the cognitive biases discussed in Section 4.4.

#### Implementations and Benchmarks

Beyond the Whyline, several tools support debugging sensemaking. Omniscient debuggers (Lewis, 2003) record complete program execution histories, allowing developers to query any past state. This directly supports sensemaking by making the information foraging loop more efficient: developers can navigate the execution history to gather evidence for or against explanations without re-running the program. Metamorphic testing frameworks (Chen et al., 2018) support sensemaking by providing systematic ways to express expected relationships between program behaviors, making discrepancy detection more principled.

#### Strengths and Limitations

The sensemaking framework provides a rich, process-level account of debugging that integrates information seeking and reasoning. Its dual-loop structure maps well onto observed debugging behavior and provides clear design implications for tools. However, sensemaking is a broad framework that can accommodate almost any observed behavior, potentially limiting its falsifiability. The relationship between sensemaking and hypothesis-driven debugging (Section 4.2) is underspecified: both frameworks describe iterative search-and-evaluate processes, and it is unclear when the sensemaking lens provides explanatory value beyond the hypothesis-testing lens. Additionally, most sensemaking studies focus on individual developers, leaving the social dimensions of sensemaking in debugging (e.g., collaborative debugging sessions) relatively unexplored.

### 4.7 Cognitive Load and Debugging

#### Theory and Mechanism

Cognitive Load Theory (CLT), developed by Sweller (1988), distinguishes three types of cognitive load: *intrinsic* load (inherent to the material's complexity), *extraneous* load (imposed by the presentation format), and *germane* load (devoted to schema construction and learning). Debugging is characterized by high intrinsic load---the developer must simultaneously maintain the intended program behavior, the actual behavior, the mapping between code and behavior, and the current debugging hypothesis. Any additional extraneous load (e.g., poor IDE design, unfamiliar codebase layout, interruptions) directly competes for limited working memory resources.

Distributed cognition theory (Hutchins, 1995) complements CLT by emphasizing that cognitive processes are not confined to individual minds but are distributed across people, artifacts, and environments. In debugging, cognition is distributed across the developer's brain, the source code, the debugger interface, log files, documentation, and (in collaborative settings) other developers. External representations---watch windows, call stacks, variable inspectors, execution traces---serve as cognitive offloading mechanisms that extend effective working memory capacity.

#### Literature Evidence

Parnin and Rugaber (2011) conducted an exploratory analysis of 10,000 recorded programming sessions from 86 programmers and surveyed 414 programmers about interruption and task resumption. They found that only 10% of sessions resumed programming activity within one minute of an interruption, and 93% of sessions involved navigation to other code locations before editing could resume. This suggests that debugging context---the set of active hypotheses, the current code location, the remembered execution state---is fragile and easily disrupted, consistent with the working memory limitations predicted by CLT.

Sweller and colleagues demonstrated the *worked example effect*: learners who study annotated solutions develop problem-solving skills more effectively than those who solve equivalent problems from scratch. Applied to debugging, this suggests that studying annotated debugging traces (showing expert reasoning alongside code examination) may be more effective for skill development than unguided debugging practice. However, this runs counter to the "productive failure" paradigm (Kapur, 2016), which argues that initial failure on complex problems can enhance subsequent learning. The resolution may be that worked examples are optimal for novices, while productive failure benefits intermediates who have sufficient domain knowledge to learn from their mistakes.

Cognitive load measurement using fNIRS during debugging (Hu et al., 2024) has provided direct neurophysiological evidence that different debugging stages impose different cognitive loads. Fault localization imposed the highest cognitive load, consistent with its dependence on simultaneous maintenance of multiple hypotheses and code-state mappings. Code editing imposed lower load, consistent with its more procedural, less diagnostic nature.

The concept of *cognitive offloading*---using external tools and representations to reduce internal cognitive demands---is central to debugging tool design. Debugger UIs that display variable values, call stacks, and execution history serve as external memory stores that reduce the need to hold this information in working memory. However, cognitive offloading has a documented tradeoff: while it boosts immediate performance, it may diminish memory formation (Risko & Gilbert, 2016), potentially impairing the long-term development of debugging expertise.

#### Implementations and Benchmarks

Tools that explicitly manage cognitive load include: debugger UIs with customizable watch expressions (reducing extraneous load by showing only relevant variables); structured logging frameworks that highlight anomalous patterns (enriching information scent while reducing foraging load); notebook-style debugging environments that allow developers to annotate their reasoning alongside code and output (supporting germane load through self-explanation); and IDE features that preserve debugging context across interruptions (addressing the resumption problem identified by Parnin & Rugaber, 2011).

#### Strengths and Limitations

CLT and distributed cognition provide principled frameworks for understanding why debugging is difficult and how tools can help. The three-way load distinction (intrinsic, extraneous, germane) offers actionable design guidance: minimize extraneous load through interface design, manage intrinsic load through progressive disclosure and scaffolding, and promote germane load through activities that encourage schema construction. However, measuring the three load types independently remains methodologically challenging. Furthermore, the relationship between cognitive load and debugging performance is likely nonlinear: some cognitive effort (germane load) is beneficial, and the optimal load level may depend on expertise and task characteristics in ways that CLT does not fully specify.

### 4.8 Pair Debugging and Social Debugging

#### Theory and Mechanism

Social debugging encompasses practices in which multiple people collaborate on fault diagnosis. The theoretical foundation draws from distributed cognition (Hutchins, 1995)---the idea that cognitive processes can be distributed across multiple agents---and from Vygotsky's (1978) zone of proximal development---the idea that learners can accomplish tasks with social support that they cannot accomplish alone.

*Rubber duck debugging*, popularized by Hunt and Thomas (1999) in "The Pragmatic Programmer," formalizes the observation that explaining a problem aloud---even to an inanimate object---often triggers insight. The mechanism is self-explanation (Chi et al., 1989): the act of articulating one's understanding forces the explainer to make implicit knowledge explicit, exposing gaps and inconsistencies in their mental model. The listener (rubber duck, colleague, or student) serves as a social scaffold that motivates the explainer to be complete and coherent.

*Pair debugging* extends pair programming (Beck, 2000) specifically to fault diagnosis tasks. The driver executes debugging actions while the navigator monitors, questions, and suggests alternative hypotheses. This division of labor distributes cognitive load: the driver manages the procedural aspects of tool operation while the navigator maintains strategic oversight, effectively doubling the available working memory for the task.

*Mob debugging* (ensemble debugging) extends this further: the entire team works on the same debugging problem simultaneously, with one person at the keyboard (driver) and all others serving as navigators. Zuill (2014) has advocated for this approach, citing benefits including immediate knowledge sharing, continuous code review, and the integration of diverse perspectives.

#### Literature Evidence

Flor and Hutchins (1991) provided an early distributed cognition analysis of collaborative software development, demonstrating that cognitive processes in pair programming are genuinely distributed---not merely duplicated---across participants. Each participant contributes unique knowledge and perspectives, and the interaction generates reasoning that neither individual would produce alone.

Research on mob programming reports significant defect reductions (up to 60% in some case studies) compared to individual work, attributed to the continuous peer review process and the integration of diverse mental models. However, rigorous controlled studies comparing debugging effectiveness across individual, pair, and mob configurations remain scarce.

The self-explanation effect has been extensively studied in cognitive science (Chi et al., 1989; Chi, 2000) and provides the theoretical basis for rubber duck debugging. Learners who generate explanations of material---even to themselves---learn more effectively than those who do not. In debugging, self-explanation forces the developer to trace through their mental model systematically, often revealing the discrepancy that constitutes the bug. The social context (having a listener) enhances this effect by imposing accountability for coherence and completeness.

Collaborative debugging also has emotional benefits. Thinking aloud with partners helps developers "thoughtfully reason through the problem, while also providing opportunities to vent and process negative emotions associated with the debugging process" (Loksa et al., 2016). This social-emotional function may be particularly important for sustaining motivation during extended debugging episodes.

#### Implementations and Benchmarks

Tools supporting social debugging include: screen-sharing and collaborative IDE features (e.g., VS Code Live Share, JetBrains Code With Me); structured code review platforms that support debugging-focused review; and AI-powered "pair debugging" tools that serve as conversational partners for self-explanation (e.g., ChatGPT, GitHub Copilot Chat). The emergence of AI debugging assistants raises interesting questions about whether the cognitive benefits of self-explanation are preserved when the listener is a language model rather than a human or rubber duck.

#### Strengths and Limitations

Social debugging approaches leverage distributed cognition and self-explanation effects to enhance debugging effectiveness. The theoretical foundations are well-established in cognitive science. However, social debugging introduces coordination costs, conformity pressures, and social loafing risks. The productivity claims for pair and mob programming are primarily based on case studies and practitioner reports rather than controlled experiments. Furthermore, the mechanisms through which social interaction improves debugging---distributed load, diverse hypotheses, self-explanation, emotional regulation---are typically confounded in practice, making it difficult to isolate their individual contributions.

### 4.9 Expertise Development

#### Theory and Mechanism

How does one become an expert debugger? Ericsson et al.'s (1993) *deliberate practice* framework proposes that expert performance in any domain results from extended engagement in practice activities specifically designed to improve performance, conducted with immediate feedback and opportunities for repetition and error correction. The framework distinguishes deliberate practice from mere experience: expertise requires not just accumulated hours but *structured, effortful practice with feedback*.

Ericsson's (2006) model of expertise development identifies three phases: (1) the *cognitive phase*, where performance is slow, effortful, and dependent on explicit rules; (2) the *associative phase*, where performance becomes faster and more fluid as rules are compiled into procedures; and (3) the *autonomous phase*, where performance is automatic and requires minimal conscious effort. Critically, Ericsson argues that expert performers counteract automaticity by developing increasingly complex mental representations, remaining in the cognitive and associative phases for progressively more sophisticated aspects of their skill. This prevents the *arrested development* that occurs when practitioners reach a "good enough" level and stop improving.

Applied to debugging, this framework predicts that expert debuggers have invested extensive deliberate practice in activities such as: reading and tracing code they did not write, systematically generating and testing hypotheses about bug causes, studying resolved bug reports and postmortems, and seeking feedback on their debugging process (not just outcomes).

#### Literature Evidence

The original "10x programmer" claim traces to Sackman, Erikson, and Grant (1968), who reported 28:1 performance differences among professional programmers. Although subsequent methodological critique reduced this estimate, the corrected data still showed more than 10-fold differences in debugging time between the best and worst performers. The persistence of large individual differences across multiple studies (reviewed by McConnell, 2011) suggests that debugging expertise is not normally distributed and that the upper tail represents qualitatively different cognitive strategies, not merely faster execution of the same strategies.

McCauley et al. (2008) reviewed the debugging education literature and found that expert debuggers often find it difficult to describe their debugging process, since their expertise relies on pattern recognition that commonly occurs subconsciously. This is consistent with the dual-process framework (Section 2.4): expert debugging involves a large component of automatic pattern recognition (System 1) that operates below the threshold of verbal reportability. Demonstrating debugging practices is often more effective than verbal instruction alone, consistent with the cognitive apprenticeship model (Collins et al., 1989).

The advancement of debugging practice in professional developers has been studied by Beller et al. (2018), who examined the relationship between experience, debugging strategies, and debugging performance. Their findings suggest that years of experience alone do not reliably predict debugging skill; rather, the *quality* and *diversity* of debugging experiences matter more than their quantity, consistent with the deliberate practice framework.

#### Implementations and Benchmarks

Structured debugging curricula that incorporate deliberate practice principles include: the "context-specific instruction" approach (which pairs concrete debugging steps with problem-specific details); debugging games and interactive environments (Robobug, Debug-It); worked example-based instruction with annotated debugging traces; postmortem analysis exercises using real-world bug reports; and code review participation as a form of debugging practice. The Debug Tutor system (Canow, 2023) implements automated deliberate debugging practice with immediate feedback.

#### Strengths and Limitations

The deliberate practice framework provides a theoretically grounded account of how debugging expertise develops and offers clear prescriptions for educational design. However, the framework's applicability to programming has been questioned: unlike chess or music, software development lacks standardized performance measures, making it difficult to define what constitutes "improvement" and to provide the immediate, specific feedback that deliberate practice requires. The "10,000 hours" heuristic (Gladwell, 2008), popularized from Ericsson's research, has been widely critiqued as an oversimplification; the actual relationship between practice quantity and expertise is mediated by practice quality, individual differences, and domain characteristics. Furthermore, the research on debugging expertise development is almost exclusively cross-sectional (comparing developers at different experience levels) rather than longitudinal (following individual developers as they improve), limiting causal inference.

### 4.10 Emotional and Motivational Factors

#### Theory and Mechanism

Debugging is an intensely emotional activity. The experience of encountering a bug can trigger a cascade of affective responses---confusion, frustration, anxiety, and sometimes panic---that interact with cognitive processes in complex ways. The theoretical framework for understanding these interactions draws from appraisal theory (Lazarus, 1991), which posits that emotions arise from evaluations of events in relation to one's goals; from Csikszentmihalyi's (1990) flow theory, which characterizes the optimal experience state of deep engagement; and from Seligman's (1975) concept of learned helplessness, which describes the motivational deficit that arises from perceived inability to control outcomes.

**Frustration** arises when debugging efforts fail to make progress. Appraisal theory predicts frustration when a goal (fixing the bug) is blocked and the individual perceives the situation as potentially controllable but currently uncontrolled. Persistent frustration can lead to counterproductive behaviors: hasty code changes, abandonment of systematic strategies, or emotional disengagement from the task.

**Flow state** represents the opposite extreme: a state of deep, focused engagement where the developer is fully absorbed in the debugging task, time passes unnoticed, and performance is optimal. Csikszentmihalyi (1990) identified flow as arising when task difficulty is matched to skill level, goals are clear, and immediate feedback is available. Debugging can induce flow when the developer has sufficient skill to make progress, the bug provides an appropriate level of challenge, and the development environment provides clear feedback on each debugging action.

**The "aha moment"** refers to the sudden insight that resolves a debugging problem. Kounios and Beeman (2009) characterized insight as the culmination of unconscious processing that suddenly breaks into awareness, accompanied by a burst of high-frequency neural activity. In debugging, the aha moment typically occurs when the developer suddenly recognizes the discrepancy between their mental model and the program's actual behavior, often after a period of impasse. Research shows that solutions arrived at through insight are remembered better than those arrived at through incremental analysis, suggesting that insight-based debugging may produce more durable learning.

**Learned helplessness** in debugging occurs when developers repeatedly fail to resolve bugs in a particular codebase or technology, leading to the belief that the situation is uncontrollable. This manifests as avoidance ("That part of the code is really buggy, so nobody touches it"), passivity, and reduced problem-solving effort. In organizational contexts, learned helplessness can become cultural, with entire teams adopting a helpless stance toward legacy code or chronic quality problems.

#### Literature Evidence

Müller and Fritz (2015) used biometric sensors to study developers' emotions during programming tasks, finding that progress and positive emotions are strongly associated, while being stuck correlates with negative emotions. Khan et al. (2011) found that mood significantly affects debugging performance: developers in positive moods debugged more effectively than those in negative moods, consistent with Fredrickson's (2001) broaden-and-build theory of positive emotions, which predicts that positive affect broadens cognitive repertoires and enhances creative problem-solving.

Rodrigo et al. (2009) studied the affective experience of novice programmers, finding that confusion (22%), frustration (14%), and boredom (12%) were the most common negative emotions, while flow/engagement (23%) was the most common positive state. Confusion arose primarily when program output did not match expectations, and frustration arose when students encountered logical impasses---precisely the conditions that characterize debugging.

The relationship between frustration and learning is complex. Productive frustration occurs when the difficulty is within the developer's zone of proximal development and can be resolved through sustained effort, leading to enhanced learning and schema construction. Unproductive frustration occurs when the difficulty exceeds the developer's current capabilities, leading to learned helplessness and disengagement. The boundary between these states is determined by the developer's self-efficacy, the availability of support resources, and the perceived controllability of the situation.

Loksa et al. (2016) studied self-regulation in programming, finding that students who received explicit instruction in self-regulation strategies (planning, monitoring, and controlling their emotional and cognitive states) produced higher-quality code and reported lower frustration. This suggests that metacognitive and self-regulatory skills are important components of debugging expertise that are amenable to instruction.

#### Implementations and Benchmarks

Tools addressing emotional and motivational factors include: progress indicators in debugging environments (supporting flow by providing feedback); IDE features that automatically save debugging context and hypotheses (reducing the frustration of lost progress after interruptions); gamified debugging exercises (leveraging intrinsic motivation); and structured debugging methodologies (reducing anxiety by providing clear next steps). The emerging field of *affective computing* in software engineering explores using biometric data (heart rate, skin conductance, facial expression) to detect developer emotional states and provide adaptive support, though this remains largely experimental.

#### Strengths and Limitations

Emotional and motivational research illuminates an underappreciated dimension of debugging that has real consequences for developer productivity and well-being. The theoretical frameworks (appraisal theory, flow theory, learned helplessness) are well-established in psychology. However, studying emotions in laboratory settings may not capture the full intensity of real-world debugging frustration, which can unfold over hours, days, or weeks. Self-report measures of emotion are subject to demand characteristics and retrospective distortion. The causal direction between emotion and performance is difficult to establish: poor performance causes frustration, but frustration also impairs performance, creating a feedback loop that is difficult to disentangle experimentally.

## 5. Comparative Synthesis

### 5.1 Cross-Cutting Themes

Several themes emerge across the ten dimensions surveyed above.

**Comprehension is foundational.** The single most consistent finding across four decades of research is that program comprehension---not debugging strategy, not tool proficiency, not domain knowledge---is the primary determinant of debugging success. This finding, first established by Gugerty and Olson (1986) and replicated across multiple paradigms, has profound implications: improving debugging requires improving comprehension, which in turn requires improving mental models, which requires improving notional machine understanding and code-reading skills.

**Implicit processes dominate.** Although debugging is often modeled as explicit, deliberate hypothesis testing, the evidence suggests that much debugging behavior is driven by implicit, perceptually guided processes. Information foraging models predict navigation better than stated hypotheses (Lawrance et al., 2013); expert pattern recognition operates below the threshold of verbal report (McCauley et al., 2008); and cognitive biases systematically distort reasoning in ways that developers are unaware of. This suggests that both training and tool design should account for the large role of implicit cognition.

**The environment is cognitive.** Debugging cognition is not confined to the developer's brain. It is distributed across source code, IDE interfaces, debugger output, documentation, version control history, and other team members. The cognitive load perspective and distributed cognition framework converge on the conclusion that effective debugging requires well-designed external representations that support rather than impede cognitive processing.

**Emotion is not epiphenomenal.** Affective states---frustration, flow, confidence, helplessness---are not mere byproducts of debugging but active causal factors that influence strategy selection, persistence, and learning. Debugging tool and process design that ignores emotional factors leaves significant performance gains on the table.

### 5.2 Cross-Cutting Trade-Off Table

| Dimension | Primary Contribution | Methodological Strength | Key Limitation | Tool Implications |
|---|---|---|---|---|
| Expert-novice (4.1) | Identifies comprehension as the key differentiator | Robust experimental paradigm with replication | Binary categorization obscures developmental trajectory | Adaptive scaffolding based on expertise level |
| Hypothesis-driven (4.2) | Normative model of debugging reasoning | Clear prescriptive framework | Overstates explicit reasoning; understates implicit processes | Interrogative debugging interfaces (Whyline) |
| Mental models (4.3) | Explains why debugging fails (inaccurate models) | Connects to established cognitive science theory | Mental models are difficult to measure directly | Program visualization and notional machine instruction |
| Cognitive biases (4.4) | Explains systematic debugging errors | Leverages well-established bias research | Most studies use artificial tasks; bias interactions unstudied | Debiasing prompts, mutation testing, diverse test generation |
| Information foraging (4.5) | Quantitative model of debugging navigation | Makes testable, falsifiable predictions | Focuses on navigation, not reasoning; assumes rationality | Scent-enriched code navigation; reduced navigation costs |
| Sensemaking (4.6) | Integrates foraging and reasoning in dual-loop model | Rich process-level description | Broad framework risks unfalsifiability | Question-based debugging interfaces; execution history tools |
| Cognitive load (4.7) | Explains why debugging is hard (WM limitations) | Principled framework for tool evaluation | Three load types hard to measure independently | Context preservation; progressive disclosure; external memory |
| Social debugging (4.8) | Leverages distributed cognition and self-explanation | Strong theoretical foundations in cognitive science | Mostly case studies; mechanisms confounded | Collaborative debugging tools; AI pair debugging |
| Expertise development (4.9) | Framework for debugging skill acquisition | Connects to deliberate practice research | Almost no longitudinal data; no validated skill measures | Structured practice environments; annotated debugging traces |
| Emotional factors (4.10) | Illuminates affective dimension of debugging | Established theories (flow, learned helplessness) | Laboratory settings may not capture real-world intensity | Progress feedback; emotional awareness; self-regulation training |

### 5.3 Integrative Assessment

No single cognitive framework adequately captures the full complexity of debugging. Hypothesis-driven debugging provides a normative model but underestimates implicit processes. Information foraging captures navigation behavior but not reasoning. Sensemaking integrates both but at the cost of specificity. Cognitive load theory explains capacity limitations but not strategic choices. The field would benefit from an integrated cognitive architecture for debugging that combines elements from multiple frameworks---perhaps building on Hu et al.'s (2024) neurally justified model---to provide a unified account of how perception, memory, reasoning, emotion, and social interaction jointly shape debugging behavior.

## 6. Open Problems and Gaps

### 6.1 Absence of Validated Cognitive Architectures

Despite decades of research, no comprehensive cognitive architecture for debugging has been validated. Hu et al.'s (2024) fNIRS-based model is a promising step, but it covers only individual, short-duration debugging episodes and has not been validated across diverse debugging tasks, codebases, or developer populations. Integrating the multiple cognitive dimensions identified in this survey into a single, computationally specified, empirically validated architecture remains an open challenge.

### 6.2 Ecological Validity

The majority of debugging cognition studies use small, artificial programs with single planted bugs, tasks that may not engage the cognitive processes involved in debugging large-scale, real-world software. Naturalistic studies (Ko et al., 2006; Parnin & Rugaber, 2011) provide ecological validity but sacrifice experimental control. Developing paradigms that combine ecological validity with experimental rigor---perhaps using realistic open-source codebases with naturally occurring bugs---is an important methodological frontier.

### 6.3 Longitudinal Studies of Expertise Development

The debugging expertise literature is almost exclusively cross-sectional. We know how experts and novices differ at a given point in time, but we know very little about the developmental trajectory through which novices become experts. Longitudinal studies tracking individual developers' debugging strategies, mental models, and performance over months or years would provide crucial evidence for expertise development theories and for the design of educational interventions.

### 6.4 Debugging in the Age of AI

The rapid adoption of AI-assisted development tools (GitHub Copilot, ChatGPT, Claude) is fundamentally altering the debugging landscape. When developers use AI tools to diagnose and fix bugs, how does this affect their own cognitive development? Does AI assistance reduce cognitive load in a beneficial way, or does it constitute cognitive offloading that impairs long-term learning (as Risko & Gilbert, 2016, suggest for other domains)? How do cognitive biases interact with AI-generated debugging suggestions? These questions are almost entirely unexplored empirically.

### 6.5 Debugging Distributed and Concurrent Systems

Most debugging cognition research focuses on sequential, single-threaded programs. Debugging concurrent, distributed, and asynchronous systems imposes qualitatively different cognitive demands: developers must reason about interleaving, race conditions, message ordering, and partial failures that resist mental simulation. The mental model requirements for these systems may exceed what current notional machine frameworks can support.

### 6.6 Cultural and Individual Differences

The vast majority of debugging cognition research has been conducted with participants from Western, educated, industrialized, rich, and democratic (WEIRD) populations. Cross-cultural studies of debugging strategies are virtually nonexistent. Furthermore, individual differences in cognitive style, working memory capacity, visual-spatial ability, and personality have been largely ignored in debugging research, despite their demonstrated relevance in related domains.

### 6.7 Measurement and Assessment

The field lacks validated instruments for measuring debugging skill. Most studies use ad hoc measures (time to locate a bug, number of bugs fixed, correctness of the fix) that do not distinguish between the cognitive subprocesses involved. Developing standardized assessments that separately measure comprehension, hypothesis generation, hypothesis testing, and repair skills would advance both research and education.

## 7. Conclusion

The cognitive science of debugging has matured considerably since its inception in the early 1980s, producing robust findings about expert-novice differences, the role of mental models, the influence of cognitive biases, and the dynamics of information foraging and sensemaking during fault diagnosis. The field has transitioned from purely descriptive studies to theoretical frameworks that make quantitative, testable predictions about debugging behavior, and from laboratory studies with artificial programs to increasingly ecologically valid investigations of professional practice.

Several findings have achieved sufficient empirical support to be considered well-established: that program comprehension is the primary bottleneck in debugging; that experts differ from novices in the quality of their mental models and their ability to chunk code into meaningful units, not primarily in strategy selection; that developers are systematically susceptible to confirmation bias and anchoring during debugging; that information foraging models predict debugging navigation more accurately than verbal self-reports; and that debugging imposes substantial cognitive load that can be mitigated through appropriate external representations and tool design.

At the same time, significant gaps remain. The field lacks an integrated cognitive architecture for debugging, longitudinal data on expertise development, ecologically valid experimental paradigms, and understanding of how emerging AI tools are reshaping debugging cognition. The emotional and social dimensions of debugging, while increasingly recognized, remain less well-characterized than the cognitive dimensions. Addressing these gaps will require interdisciplinary collaboration among cognitive scientists, software engineers, human-computer interaction researchers, and educators.

The practical stakes are considerable. Software systems are growing in complexity, and debugging consumes an ever-larger share of development effort. A deeper understanding of the cognitive processes underlying debugging can inform the design of more cognitively supportive development environments, more effective educational interventions, and more productive development practices. The cognitive science of debugging is not merely an academic exercise; it is a foundation for improving the human capacity to build and maintain the software infrastructure on which modern civilization depends.

## References

Adelson, B. (1981). Problem solving and the development of abstract categories in programming languages. *Memory & Cognition*, 9(4), 422--433. https://doi.org/10.3758/BF03197568

Beck, K. (2000). *Extreme Programming Explained: Embrace Change*. Addison-Wesley.

Bednarik, R., & Tukiainen, M. (2006). An eye-tracking methodology for characterizing program comprehension processes. *Proceedings of the 2006 Symposium on Eye Tracking Research & Applications*, 125--132. https://doi.org/10.1145/1117309.1117356

Beller, M., Gousios, G., Panichella, A., Proksch, S., Amann, S., & Zaidman, A. (2018). Developer testing in the IDE: Patterns, beliefs, and behavior. *IEEE Transactions on Software Engineering*, 45(3), 261--284. https://doi.org/10.1109/TSE.2017.2776152

Böhme, M., Soremekun, E., Chattopadhyay, S., Ugherughe, E., & Zeller, A. (2021). Locating faults with program slicing: An empirical analysis. *Empirical Software Engineering*, 26(3), Article 51. https://doi.org/10.1007/s10664-020-09931-7

Brooks, R. (1983). Towards a theory of the comprehension of computer programs. *International Journal of Man-Machine Studies*, 18(6), 543--554. https://doi.org/10.1016/S0020-7373(83)80031-5

Canow, E. (2023). *Debug Tutor: Automated deliberate debugging* (Master's thesis). Massachusetts Institute of Technology. https://dspace.mit.edu/handle/1721.1/151452

Chase, W. G., & Simon, H. A. (1973). Perception in chess. *Cognitive Psychology*, 4(1), 55--81. https://doi.org/10.1016/0010-0285(73)90004-2

Chattopadhyay, S., Prasad, I. G., Henley, A. Z., Sarma, A., & Weimer, W. (2020). Functional fixedness: The effect of usage examples among novice student programmers. *Proceedings of the International Conference on Computers in Education*.

Chen, T. Y., Kuo, F.-C., Liu, H., Poon, P.-L., Towey, D., Tse, T. H., & Zhou, Z. Q. (2018). Metamorphic testing: A review of challenges and opportunities. *ACM Computing Surveys*, 51(1), Article 4. https://doi.org/10.1145/3143561

Chi, M. T. H. (2000). Self-explaining expository texts: The dual processes of generating inferences and repairing mental models. In R. Glaser (Ed.), *Advances in Instructional Psychology* (pp. 161--238). Lawrence Erlbaum.

Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989). Self-explanations: How students study and use examples in learning to solve problems. *Cognitive Science*, 13(2), 145--182. https://doi.org/10.1207/s15516709cog1302_1

Collins, A., Brown, J. S., & Newman, S. E. (1989). Cognitive apprenticeship: Teaching the crafts of reading, writing, and mathematics. In L. B. Resnick (Ed.), *Knowing, Learning, and Instruction* (pp. 453--494). Lawrence Erlbaum.

Cowan, N. (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, 24(1), 87--114. https://doi.org/10.1017/S0140525X01003922

Csikszentmihalyi, M. (1990). *Flow: The Psychology of Optimal Experience*. Harper & Row.

DeMillo, R. A., Lipton, R. J., & Sayward, F. G. (1978). Hints on test data selection: Help for the practicing programmer. *Computer*, 11(4), 34--41. https://doi.org/10.1109/C-M.1978.218136

Détienne, F. (1990). Expert programming knowledge: A schema-based approach. In J.-M. Hoc, T. R. G. Green, R. Samurçay, & D. J. Gilmore (Eds.), *Psychology of Programming* (pp. 205--222). Academic Press.

Du Boulay, B. (1986). Some difficulties of learning to program. *Journal of Educational Computing Research*, 2(1), 57--73. https://doi.org/10.2190/3LFX-9RRF-67T8-UVK9

Duncker, K. (1945). On problem-solving. *Psychological Monographs*, 58(5), i--113. https://doi.org/10.1037/h0093599

Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. *Psychological Review*, 100(3), 363--406. https://doi.org/10.1037/0033-295X.100.3.363

Ericsson, K. A. (2006). The influence of experience and deliberate practice on the development of superior expert performance. In K. A. Ericsson, N. Charness, P. J. Feltovich, & R. R. Hoffman (Eds.), *The Cambridge Handbook of Expertise and Expert Performance* (pp. 683--703). Cambridge University Press.

Fleming, S. D., Scaffidi, C., Piorkowski, D., Burnett, M., Rachatasumrit, R., Narayanan, A., ... & Bellamy, R. (2013). An information foraging theory perspective on tools for debugging, refactoring, and reuse tasks. *ACM Transactions on Software Engineering and Methodology*, 22(2), Article 14. https://doi.org/10.1145/2430545.2430551

Flor, N. V., & Hutchins, E. L. (1991). Analyzing distributed cognition in software teams: A case study of team programming during perfective software maintenance. In J. Koenemann-Belliveau, T. G. Moher, & S. P. Robertson (Eds.), *Empirical Studies of Programmers: Fourth Workshop* (pp. 36--59). Ablex.

Fredrickson, B. L. (2001). The role of positive emotions in positive psychology: The broaden-and-build theory of positive emotions. *American Psychologist*, 56(3), 218--226. https://doi.org/10.1037/0003-066X.56.3.218

Gilmore, D. J. (1991). Models of debugging. *Acta Psychologica*, 78(1--3), 151--172. https://doi.org/10.1016/0001-6918(91)90009-O

Grigoreanu, V., Burnett, M., Wiedenbeck, S., Cao, J., Rector, K., & Kwan, I. (2012). End-user debugging strategies: A sensemaking perspective. *ACM Transactions on Computer-Human Interaction*, 19(1), Article 5. https://doi.org/10.1145/2147783.2147788

Gugerty, L., & Olson, G. M. (1986). Debugging by skilled and novice programmers. *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems*, 171--174. https://doi.org/10.1145/22627.22367

Guo, P. J. (2013). Online Python Tutor: Embeddable web-based program visualization for CS education. *Proceedings of the 44th ACM Technical Symposium on Computer Science Education*, 579--584. https://doi.org/10.1145/2445196.2445368

Hu, D., Santiesteban, P., Endres, M., & Weimer, W. (2024). Towards a cognitive model of dynamic debugging: Does identifier construction matter? *IEEE Transactions on Software Engineering*, 50(11), 2898--2913. https://doi.org/10.1109/TSE.2024.3468016

Hunt, A., & Thomas, D. (1999). *The Pragmatic Programmer: From Journeyman to Master*. Addison-Wesley.

Hutchins, E. (1995). *Cognition in the Wild*. MIT Press.

Johnson-Laird, P. N. (1983). *Mental Models: Towards a Cognitive Science of Language, Inference, and Consciousness*. Harvard University Press.

Kahneman, D. (2011). *Thinking, Fast and Slow*. Farrar, Straus and Giroux.

Kapur, M. (2016). Examining productive failure, productive success, and learning from worked examples. *Instructional Science*, 44(2), 161--186. https://doi.org/10.1007/s11251-016-9376-x

Katz, I. R., & Anderson, J. R. (1987). Debugging: An analysis of bug-location strategies. *Human-Computer Interaction*, 3(4), 351--399. https://doi.org/10.1207/s15327051hci0304_2

Khan, I. A., Brinkman, W.-P., & Hierons, R. M. (2011). Do moods affect programmers' debug performance? *Cognition, Technology & Work*, 13(4), 245--258. https://doi.org/10.1007/s10111-010-0164-1

Klahr, D., & Dunbar, K. (1988). Dual space search during scientific reasoning. *Cognitive Science*, 12(1), 1--48. https://doi.org/10.1207/s15516709cog1201_1

Ko, A. J., & Myers, B. A. (2004). Designing the Whyline: A debugging interface for asking questions about program behavior. *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems*, 151--158. https://doi.org/10.1145/985692.985712

Ko, A. J., & Myers, B. A. (2008). Debugging reinvented: Asking and answering why and why not questions about program behavior. *Proceedings of the 30th International Conference on Software Engineering*, 301--310. https://doi.org/10.1145/1368088.1368130

Ko, A. J., Myers, B. A., Coblenz, M. J., & Aung, H. H. (2006). An exploratory study of how developers seek, relate, and collect relevant information during software maintenance tasks. *IEEE Transactions on Software Engineering*, 32(12), 971--987. https://doi.org/10.1109/TSE.2006.116

Kounios, J., & Beeman, M. (2009). The Aha! moment: The cognitive neuroscience of insight. *Current Directions in Psychological Science*, 18(4), 210--216. https://doi.org/10.1111/j.1467-8721.2009.01638.x

Lawrance, J., Bogart, C., Burnett, M., Bellamy, R., Rector, K., & Fleming, S. D. (2013). How programmers debug, revisited: An information foraging theory perspective. *IEEE Transactions on Software Engineering*, 39(2), 197--215. https://doi.org/10.1109/TSE.2010.111

Lazarus, R. S. (1991). *Emotion and Adaptation*. Oxford University Press.

Letovsky, S. (1987). Cognitive processes in program comprehension. *Journal of Systems and Software*, 7(4), 325--339. https://doi.org/10.1016/0164-1212(87)90032-X

Lewis, B. (2003). Debugging backwards in time. *Proceedings of the Fifth International Workshop on Automated Debugging*.

Loksa, D., Ko, A. J., Jernigan, W., Oleson, A., Mendez, C. J., & Burnett, M. M. (2016). Programming, problem solving, and self-regulation: Effects of explicit guidance. *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems*, 1449--1461. https://doi.org/10.1145/2858036.2858252

Luchins, A. S. (1942). Mechanization in problem solving: The effect of Einstellung. *Psychological Monographs*, 54(6), i--95. https://doi.org/10.1037/h0093502

McCauley, R., Fitzgerald, S., Lewandowski, G., Murphy, L., Simon, B., Thomas, L., & Zander, C. (2008). Debugging: A review of the literature from an educational perspective. *Computer Science Education*, 18(2), 67--92. https://doi.org/10.1080/08993400802114581

McConnell, S. (2011). The origins of 10x---how valid is the underlying research? *Construx Software Blog*. https://www.construx.com/blog/the-origins-of-10x-how-valid-is-the-underlying-research/

Miller, G. A. (1956). The magical number seven, plus or minus two: Some limits on our capacity for processing information. *Psychological Review*, 63(2), 81--97. https://doi.org/10.1037/h0043158

Mohanani, R., Salman, I., Turhan, B., Rodriguez, P., & Ralph, P. (2018). Cognitive biases in software engineering: A systematic mapping study. *IEEE Transactions on Software Engineering*, 46(12), 1318--1339. https://doi.org/10.1109/TSE.2018.2877759

Müller, S. C., & Fritz, T. (2015). Stuck and frustrated or in flow and happy: Sensing developers' emotions and progress. *Proceedings of the 37th International Conference on Software Engineering*, 688--699. https://doi.org/10.1109/ICSE.2015.334

Murphy, L., Lewandowski, G., McCauley, R., Simon, B., Thomas, L., & Zander, C. (1998). Debug It: A debugging practicing system. *Computers & Education*, 31(4), 429--447.

Parnin, C., & Rugaber, S. (2011). Resumption strategies for interrupted programming tasks. *Software Quality Journal*, 19(1), 5--34. https://doi.org/10.1007/s11219-010-9104-9

Pea, R. D. (1986). Language-independent conceptual "bugs" in novice programming. *Journal of Educational Computing Research*, 2(1), 25--36. https://doi.org/10.2190/689T-1R2A-9U0R-3PGF

Peng, Y., & Reggia, J. A. (1990). *Abductive Inference Models for Diagnostic Problem-Solving*. Springer-Verlag.

Pennington, N. (1987). Stimulus structures and mental representations in expert comprehension of computer programs. *Cognitive Psychology*, 19(3), 295--341. https://doi.org/10.1016/0010-0285(87)90007-7

Perkins, D. N., Hancock, C., Hobbs, R., Martin, F., & Simmons, R. (1986). Conditions of learning in novice programmers. *Journal of Educational Computing Research*, 2(1), 37--55. https://doi.org/10.2190/GUJT-JCBJ-Q6QU-Q9PL

Piorkowski, D., Fleming, S. D., Scaffidi, C., Burnett, M., Kwan, I., Narayanan, A., ... & Bellamy, R. (2015). To fix or to learn? How production bias affects developers' information foraging during debugging. *Proceedings of the IEEE International Conference on Software Maintenance and Evolution*, 11--20. https://doi.org/10.1109/ICSM.2015.7332447

Pirolli, P., & Card, S. K. (1999). Information foraging. *Psychological Review*, 106(4), 643--675. https://doi.org/10.1037/0033-295X.106.4.643

Pirolli, P., & Card, S. K. (2005). The sensemaking process and leverage points for analyst technology as identified through cognitive task analysis. *Proceedings of the International Conference on Intelligence Analysis*, 2--4.

Risko, E. F., & Gilbert, S. J. (2016). Cognitive offloading. *Trends in Cognitive Sciences*, 20(9), 676--688. https://doi.org/10.1016/j.tics.2016.07.002

Rodrigo, M. M. T., Baker, R. S. J. D., Jadud, M. C., Amarra, A. C. M., Dy, T., Espejo-Lahoz, M. B. V., ... & Tabanao, E. S. (2009). Affective and behavioral predictors of novice programmer achievement. *Proceedings of the ACM SIGCSE Technical Symposium on Computer Science Education*, 156--160. https://doi.org/10.1145/1508865.1508929

Russell, D. M., Stefik, M. J., Pirolli, P., & Card, S. K. (1993). The cost structure of sensemaking. *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems*, 269--276. https://doi.org/10.1145/169059.169209

Sackman, H., Erikson, W. J., & Grant, E. E. (1968). Exploratory experimental studies comparing online and offline programming performance. *Communications of the ACM*, 11(1), 3--11. https://doi.org/10.1145/362851.362858

Seligman, M. E. P. (1975). *Helplessness: On Depression, Development, and Death*. W. H. Freeman.

Shneiderman, B., & Mayer, R. (1979). Syntactic/semantic interactions in programmer behavior: A model and experimental results. *International Journal of Computer & Information Sciences*, 8(3), 219--238. https://doi.org/10.1007/BF00977789

Soloway, E., & Ehrlich, K. (1984). Empirical studies of programming knowledge. *IEEE Transactions on Software Engineering*, SE-10(5), 595--609. https://doi.org/10.1109/TSE.1984.5010283

Soloway, E., Adelson, B., & Ehrlich, K. (1988). Knowledge and processes in the comprehension of computer programs. In M. T. H. Chi, R. Glaser, & M. J. Farr (Eds.), *The Nature of Expertise* (pp. 129--152). Lawrence Erlbaum.

Sorva, J. (2012). *Visual program simulation in introductory programming education* (Doctoral dissertation). Aalto University. https://aaltodoc.aalto.fi/handle/123456789/3534

Sorva, J. (2013). Notional machines and introductory programming education. *ACM Transactions on Computing Education*, 13(2), Article 8. https://doi.org/10.1145/2483710.2483713

Spinellis, D. (2018). Modern debugging: The art of finding a needle in a haystack. *Communications of the ACM*, 61(11), 29--31. https://doi.org/10.1145/3186278

Steffens, M., Haferburg, A., & Lewerentz, C. (2012). Confirmation bias in software development and testing: An analysis of the effects of company size, experience and reasoning skills. *Proceedings of the International Symposium on Empirical Software Engineering and Measurement*, 187--190. https://doi.org/10.1145/2372251.2372286

Storey, M.-A. (2006). Theories, tools and research methods in program comprehension: Past, present and future. *Software Quality Journal*, 14(3), 187--208. https://doi.org/10.1007/s11219-006-9216-4

Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science*, 12(2), 257--285. https://doi.org/10.1207/s15516709cog1202_4

Teasley, B., Leventhal, L., Mynatt, C., & Rohlman, D. (1994). Why software testing is sometimes ineffective: Two applied studies of positive test strategy. *Journal of Applied Psychology*, 79(1), 142--155. https://doi.org/10.1037/0021-9010.79.1.142

Vessey, I. (1985). Expertise in debugging computer programs: A process analysis. *International Journal of Man-Machine Studies*, 23(5), 459--494. https://doi.org/10.1016/S0020-7373(85)80054-7

Vygotsky, L. S. (1978). *Mind in Society: The Development of Higher Psychological Processes*. Harvard University Press.

Wason, P. C. (1960). On the failure to eliminate hypotheses in a conceptual task. *Quarterly Journal of Experimental Psychology*, 12(3), 129--140. https://doi.org/10.1080/17470216008416717

Weinberg, G. M. (1971). *The Psychology of Computer Programming*. Van Nostrand Reinhold.

Weiser, M. (1984). Program slicing. *IEEE Transactions on Software Engineering*, SE-10(4), 352--357. https://doi.org/10.1109/TSE.1984.5010248

Wiedenbeck, S. (1985). Novice/expert differences in programming skills. *International Journal of Man-Machine Studies*, 23(4), 383--390. https://doi.org/10.1016/S0020-7373(85)80041-9

Zeller, A. (1999). Yesterday, my program worked. Today, it does not. Why? *Proceedings of the 7th European Software Engineering Conference / 7th ACM SIGSOFT Symposium on the Foundations of Software Engineering*, 253--267. https://doi.org/10.1007/3-540-48166-4_16

Zeller, A. (2009). *Why Programs Fail: A Guide to Systematic Debugging* (2nd ed.). Morgan Kaufmann.

Zuill, W. (2014). Mob programming: A whole team approach. *Proceedings of the Agile2014 Conference*.

## Practitioner Resources

### Tools for Cognitive-Supportive Debugging

- **Python Tutor** (https://pythontutor.com) --- Web-based program visualization tool by Philip Guo that renders step-by-step execution with memory diagrams. Directly supports mental model formation for sequential program execution. Freely available; widely used in computing education.

- **rr (Record and Replay)** (https://rr-project.org) --- Mozilla-developed lightweight recording and deterministic replay debugger for Linux. Enables time-travel debugging with low overhead (~2x slowdown), reducing cognitive load by allowing backward navigation through execution history. Open source.

- **UDB (Undo)** (https://undo.io) --- Commercial time-travel debugger for C/C++ and Java. Provides full reverse execution, reducing the need for mental forward simulation. Particularly useful for debugging concurrency bugs and intermittent failures.

- **The Whyline for Java** (https://github.com/amyjko/whyline) --- Research prototype implementing interrogative debugging (Ko & Myers, 2008). Allows "why did" and "why not" questions about program output. Unmaintained but conceptually influential; source code available for research purposes.

- **UUhistle** (https://github.com/ksaj/uuhistle) --- Visual program simulation environment implementing Sorva's pedagogical approach for Python. Supports interactive code tracing where students predict execution outcomes before the system reveals them.

### Foundational Texts

- **Zeller, A. (2009). *Why Programs Fail: A Guide to Systematic Debugging* (2nd ed.). Morgan Kaufmann.** --- The definitive treatment of debugging as a systematic, scientific process. Covers delta debugging, cause-effect chains, and the scientific method applied to fault diagnosis. Accessible to practitioners; includes exercises.

- **Spinellis, D. (2017). *Effective Debugging: 66 Specific Ways to Debug Software and Systems*. Addison-Wesley.** --- Practitioner-oriented guide covering debugging strategies, tools, and techniques. Organized as specific, actionable items. Covers both high-level strategies (backward reasoning, differential debugging) and tool-specific techniques.

- **Hunt, A., & Thomas, D. (1999). *The Pragmatic Programmer*. Addison-Wesley.** --- Introduces rubber duck debugging and other pragmatic debugging practices in the context of professional software development. Widely influential in practitioner culture.

- **McCauley, R., et al. (2008). Debugging: A review of the literature from an educational perspective. *Computer Science Education*, 18(2), 67--92.** --- Comprehensive review of debugging research through an educational lens. Covers bug taxonomies, knowledge requirements, and expert-novice differences. Essential background reading for debugging education researchers.

### Research Repositories and Datasets

- **TSE24-fNIRS-DEBUGGING** (https://github.com/pasantiesteban/TSE24-fNIRS-DEBUGGING) --- Dataset and stimuli from Hu et al.'s (2024) fNIRS debugging study. Includes neuroimaging data, debugging task materials, and analysis scripts. Useful for replication and extension studies.

- **PFIS2 Information Foraging Model** --- Piorkowski et al.'s computational implementation of Information Foraging Theory for predicting developer navigation during debugging. Available through Oregon State University's research group (https://web.engr.oregonstate.edu/~burnett/).

- **Defects4J** (https://github.com/rjust/defects4j) --- Database of real bugs from open-source Java projects. While primarily designed for automated debugging research, also useful as a source of ecologically valid debugging tasks for cognitive studies.
