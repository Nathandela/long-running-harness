---
title: "Cross-Domain Innovation & Analogical Reasoning for B2C Product Innovation"
date: 2026-03-21
summary: Surveys the theoretical foundations and practical methodologies for generating B2C product innovation through cross-domain knowledge transfer and analogical reasoning, covering the Medici Effect, structured analogy, biomimicry, TRIZ, exaptation, combinatorial innovation, technology brokering, and AI-assisted ideation, with comparative synthesis and identification of open research gaps.
keywords: [b2c_product, cross-domain-innovation, analogical-reasoning, medici-effect, biomimicry]
---

# Cross-Domain Innovation & Analogical Reasoning for B2C Product Innovation

*2026-03-21*

---

## Abstract

The most consequential B2C product innovations of the past two decades share a structural pattern: they import solutions, mental models, or organizing principles from domains far removed from their target market. Airbnb grafted hospitality trust infrastructure onto a peer-to-peer listing model borrowed from Craigslist. Duolingo applied mobile-game retention mechanics to language education. Peloton fused fitness hardware with Netflix-style content streaming and multiplayer-game leaderboards. These are not isolated strokes of genius; they are instances of a repeatable cognitive and organizational process — analogical reasoning applied across domain boundaries — that has been studied under multiple theoretical lenses for over four decades.

This survey examines the landscape of cross-domain innovation as it applies to B2C product design. It synthesizes research from cognitive science (Gentner's structure-mapping theory, Gick and Holyoak's schema induction, Fauconnier and Turner's conceptual blending), organizational theory (Hargadon and Sutton's technology brokering, Chesbrough's open innovation), evolutionary economics (Schumpeter's recombination, Arthur's combinatorial evolution, Fleming and Sorenson's recombinant search), engineering methodology (Altshuller's TRIZ, biomimicry design), and the emerging field of AI-assisted analogical search (Hope et al.'s analogy mining, LLM-driven cross-domain ideation). For each approach the paper reviews theoretical mechanisms, empirical evidence, implementation patterns, and known limitations.

The paper's central observation is that the challenge of cross-domain innovation is not primarily a creativity problem but a search problem: the space of possible inter-domain mappings is combinatorially vast, and the key differentiator between approaches is how they constrain, structure, and accelerate that search. A comparative synthesis table maps trade-offs across all approaches, and a final section identifies open problems including the measurement of analogical distance, the role of optimal cognitive distance in team composition, and the nascent but rapidly expanding use of large language models as cross-domain search engines.

---

## 1. Introduction

### 1.1 Problem Statement

Most B2C product innovation is incremental: the next version is slightly faster, slightly cheaper, slightly more convenient. This is directional innovation — movement along a known trajectory within a single domain. It is necessary but rarely sufficient for creating new markets or dislodging incumbents. The innovations that reshape consumer categories tend to arrive from the side, carrying structural solutions from one domain into another where they have never been applied. The question is whether this process can be made systematic rather than serendipitous.

The academic literature suggests it can. Cognitive scientists have mapped the mental operations underlying analogical transfer since the 1980s. Engineers have codified cross-domain solution patterns into methodologies like TRIZ since the 1960s. Organizational theorists have identified the structural positions — technology brokers, boundary spanners, interdisciplinary teams — that increase the probability of productive cross-domain collisions. And since 2017, computational methods have begun to automate cross-domain search at scales impossible for individual human cognition.

Yet these literatures remain fragmented. A product designer looking to systematically incorporate cross-domain thinking into their innovation process will find relevant work scattered across cognitive psychology, management science, engineering design, evolutionary economics, and machine learning — with minimal cross-referencing between them. A cognitive scientist studying analogical reasoning may be unaware of TRIZ's 40 Inventive Principles. An engineer trained in biomimicry may not know about technology brokering. A startup founder familiar with the Medici Effect may not realize that computational tools can now automate cross-domain analogy retrieval over millions of patents. This survey addresses that fragmentation by presenting the full landscape in a unified analytical framework, with consistent coverage of theory, evidence, implementations, and limitations for each approach.

### 1.2 Scope

This paper covers:
- Cognitive foundations of analogical reasoning and cross-domain transfer
- Eight major approaches to cross-domain innovation, each with theory, evidence, implementations, and limitations
- B2C product case studies illustrating each approach
- Comparative synthesis across approaches
- Open problems and research gaps

This paper does not cover:
- General creativity research unrelated to cross-domain transfer
- B2B and enterprise innovation processes (different decision dynamics)
- Full organizational design for innovation (covered in management literature)
- Patent law and IP strategy around recombinant inventions
- Neuroscientific substrates of analogical reasoning (fMRI studies of cross-domain mapping)
- Historical analysis of pre-modern cross-domain innovation (prior to systematic methods)

### 1.3 Key Definitions

**Analogical reasoning**: The cognitive process of identifying structural correspondences between a source domain (familiar) and a target domain (novel), then transferring relational knowledge from source to target (Gentner, 1983).

**Cross-domain innovation**: The creation of novel products, services, or business models by importing solutions, principles, or structural patterns from one industry or knowledge domain into another where they have not previously been applied.

**Domain distance**: The degree of conceptual, technical, or industry separation between source and target domains. Near-domain analogies share surface features; far-domain analogies share only deep structural relations.

**Intersectional innovation**: Johansson's (2004) term for innovations that occur at the intersection of two or more fields, cultures, or disciplines, as distinguished from directional innovation within a single domain.

**Exaptation**: A feature or artifact developed for one function that is repurposed for an entirely different function (Gould and Vrba, 1982; Andriani and Cattani, 2016).

**Technology brokering**: An organizational innovation process in which a firm positioned across multiple industries transfers solutions from domains where they are known to domains where they are novel (Hargadon and Sutton, 1997).

**Combinatorial innovation**: The creation of new products or technologies by recombining existing components, ideas, or capabilities in novel configurations (Schumpeter, 1934; Arthur, 2009).

---

## 2. Foundations

### 2.1 Cognitive Basis of Analogical Reasoning

The cognitive science of analogy provides the theoretical bedrock for all cross-domain innovation methods. Three frameworks dominate.

**Structure-Mapping Theory (Gentner, 1983).** Gentner's theory, the most influential formal account, holds that analogy involves mapping relational structure — not surface features — from a base domain to a target domain. The key principle is *systematicity*: people preferentially map interconnected systems of relations rather than isolated predicates. An analogy between the solar system and an atom is powerful not because planets look like electrons (they do not) but because the relational structure — a central body exerting force on orbiting bodies — is preserved. For product innovation, the implication is that the most productive analogies are those that transfer deep relational patterns (e.g., "trust reduces transaction costs") rather than surface similarities (e.g., "both are websites").

**Schema Induction (Gick and Holyoak, 1980, 1983).** Gick and Holyoak demonstrated that analogical problem solving depends on three steps: (1) noticing an analogical connection between source and target, (2) mapping corresponding elements, and (3) applying the mapping to generate a solution. Critically, they showed that exposure to two structurally similar source analogs — rather than one — dramatically increases the probability of spontaneous analogical transfer, because comparing two analogs induces an abstract problem schema that is easier to retrieve and apply. This finding has direct implications for innovation practice: systematically collecting multiple examples of the same structural solution across different industries creates transferable schemas.

**Conceptual Blending (Fauconnier and Turner, 1998, 2002).** Where structure-mapping describes one-directional projection from source to target, conceptual blending describes the construction of a new "blended space" that integrates selective elements from two or more input mental spaces. The blend develops emergent structure not present in either input. Turner argues that this blending capacity is "at the heart of imagination" and underlies the human ability to create genuinely novel concepts. For product innovation, blending better describes cases where the output is not simply a source solution applied to a new domain but a genuinely new hybrid — Airbnb is not merely "Craigslist with trust" but an emergent concept with properties (community belonging, experience economy) absent from either input.

### 2.2 The Geneplore Model and Synectics

Two additional cognitive frameworks inform the operational side of cross-domain innovation.

**The Geneplore Model (Finke, Ward, and Smith, 1992).** The Geneplore model ("generate" + "explore") describes creativity as a structured two-phase cycle. In the generative phase, cognitive processes — including memory retrieval, association, synthesis, transformation, and analogical transfer — produce "preinventive structures": mental representations that are not yet finished ideas but possess emergent properties (novelty, ambiguity, meaningful interpretability) that make them amenable to creative development. In the exploratory phase, these preinventive structures are examined, interpreted, and refined through attribute finding, conceptual interpretation, functional inference, and contextual shifting. The cycle iterates, with each exploratory pass feeding back into new generative acts. Ward's concept of "structured imagination" — the finding that even highly creative outputs are heavily shaped by existing conceptual structures — provides a cognitive explanation for why analogical transfer tends to follow category-level structural features rather than arbitrary mappings.

**Synectics (Gordon, 1961).** William J.J. Gordon and George Prince developed Synectics at the Arthur D. Little Invention Design Unit in the 1950s as a practical method for forcing cross-domain connections. The method's core operations are "making the familiar strange" and "making the strange familiar," achieved through four types of analogy: direct analogy (explicit comparison to another domain, especially biology), personal analogy (empathetic identification with the problem element), symbolic analogy (compressed poetic descriptions that capture the essence of a problem), and fantasy analogy (wishful thinking unconstrained by feasibility). The "force fit" step — determining how an imperfect analogy from a distant domain can be adapted to actually address the target problem — is the operational heart of the method and distinguishes Synectics from undirected brainstorming. Synectics has been applied in corporate settings since the 1960s and provides one of the earliest formalized methods for systematic cross-domain ideation.

### 2.3 The Search Problem

Cross-domain innovation is fundamentally a search problem. The space of possible mappings between any two domains is combinatorially vast, and the vast majority of mappings are useless. Gavetti, Levinthal, and Rivkin (2005) formalized this in the strategy context: analogical reasoning allows managers to navigate novel competitive landscapes by transferring policies from familiar settings, but the value of analogy depends critically on whether the manager identifies the *right* structural features that distinguish similar situations from different ones. Breadth of experience steadily improves analogical performance, while depth of experience within a single domain shows diminishing returns.

This search perspective unifies the otherwise disparate approaches reviewed in this paper. TRIZ constrains search through a pre-compiled matrix of contradiction-resolution patterns. Technology brokering constrains search through organizational positioning across multiple industries. Biomimicry constrains search by directing designers to a specific source domain (biology). AI-assisted methods attempt to automate search over large corpora. Each approach represents a different strategy for navigating the same underlying combinatorial space.

### 2.4 Optimal Cognitive Distance

Nooteboom et al. (2007) provided the key empirical finding connecting cross-domain innovation to organizational design: there is an inverted U-shaped relationship between cognitive distance and innovation performance. Too little distance yields only incremental ideas — the collaborators already share the same mental models. Too much distance prevents mutual comprehension — the knowledge cannot be absorbed. The peak of the inverted U represents the optimal cognitive distance: enough novelty to generate non-obvious combinations, but enough shared structure to enable communication and integration.

This finding has been replicated across technology-based alliances, R&D collaborations, and patent co-citation studies. It establishes a fundamental constraint on cross-domain innovation: the most productive domain crossings are not the most distant ones but those at the sweet spot where novelty and comprehensibility intersect.

---

## 3. Taxonomy of Approaches

The following classification organizes the major approaches to cross-domain innovation along two dimensions: (1) whether the method operates primarily at the individual cognitive level or at the organizational/computational level, and (2) whether the method relies on pre-structured knowledge or open-ended search.

| | **Pre-Structured Knowledge** | **Open-Ended Search** |
|---|---|---|
| **Individual / Cognitive** | Synectics (forced analogy) | The Medici Effect (intersection seeking) |
| | TRIZ / SIT (pattern libraries) | Structured analogy transfer |
| | Biomimicry (biology as source) | Exaptation (functional repurposing) |
| **Organizational / Computational** | Technology brokering (IDEO model) | Combinatorial innovation |
| | Cross-industry pattern matching | AI-assisted cross-domain search |
| | Open innovation platforms | LLM-driven analogical ideation |

This taxonomy is not rigid — most real innovation processes combine elements from multiple cells. Airbnb's founding involved both intersectional collision (Medici Effect) and deliberate trust-infrastructure transfer (structured analogy). Duolingo's gamification was both a structured analogy from gaming and a combinatorial recombination of existing engagement mechanics. The taxonomy's value is analytical rather than prescriptive: it clarifies the distinct mechanisms and assumptions underlying each approach, which Section 4 examines in detail.

The vertical axis (individual vs. organizational/computational) is particularly important for B2C startups vs. established companies. Individual cognitive methods (top row) can be practiced by small founding teams with diverse backgrounds. Organizational and computational methods (bottom row) typically require either multi-industry positioning, dedicated innovation infrastructure, or access to ML engineering talent. The choice of method is therefore partially determined by the innovator's resources and organizational context.

---

## 4. Analysis

### 4.1 The Medici Effect

**Theory & mechanism.** Frans Johansson (2004) named the Medici Effect after the 15th-century Florentine banking family whose patronage brought together painters, sculptors, poets, scientists, philosophers, and architects — catalyzing the Renaissance by creating conditions for cross-disciplinary collision. Johansson's core thesis is that breakthrough innovations cluster at the "Intersection" where ideas from different fields, cultures, and disciplines collide. He distinguishes two types of innovation: *directional* innovation, which improves a product along a predictable trajectory within a single domain, and *intersectional* innovation, which leaps across domains to create something categorically new.

Johansson identifies three forces driving the increase in intersectional opportunities: globalization (movement of people across cultural boundaries), the convergence of scientific disciplines (rise of multi-authored, cross-disciplinary papers), and the computational revolution (lowering the cost of experimentation at intersections).

**Literature evidence.** The Medici Effect is primarily a practitioner framework rather than an academic theory, but it draws on and is consistent with substantial empirical work. Uzzi et al. (2013) analyzed 17.9 million scientific papers and found that the highest-impact papers are those that combine conventionality with novelty — embedding a small number of unusual cross-domain citations within an otherwise conventional citation structure. This directly supports Johansson's argument that intersectional thinking produces disproportionate impact. Separately, the study by Gabora and colleagues (Hunter and Gabora, 2019) on cross-domain influences in creativity found that approximately 80% of creative professionals' documented inspirations came from outside their primary domain, a figure consistent across both experts and novices.

**Implementations & benchmarks.** The Medici Effect has been operationalized primarily through organizational design rather than formal tools:
- *Interdisciplinary hiring*: Pixar's practice of hiring animators with backgrounds in architecture, biology, and theater, creating structural conditions for intersectional thinking.
- *Innovation labs*: MIT Media Lab's explicit mandate to operate at disciplinary intersections.
- *Hackathons and collider events*: Hacking Health's temporary spaces gathering clinicians, programmers, designers, and entrepreneurs to develop digital health solutions.
- *Physical space design*: Building 20 at MIT, Steve Jobs' design of the Pixar headquarters atrium to force unplanned cross-disciplinary encounters.

**B2C case study: Airbnb.** Airbnb exemplifies the Medici Effect as an intersection of hospitality, peer-to-peer marketplace design (Craigslist), trust infrastructure (eBay-style reputation systems), and the sharing economy. The founders — trained in industrial design, not hospitality — approached accommodation as a design problem rather than a hotel operations problem. The company's early growth hack of auto-posting listings to Craigslist illustrates how cross-domain knowledge (understanding Craigslist's URL-based listing architecture) created an asymmetric advantage. Airbnb's trust mechanisms — verified identities, mutual reviews, host guarantees — were imported from e-commerce trust infrastructure and applied to a context (sleeping in a stranger's home) where trust barriers were dramatically higher.

**Strengths & limitations.** The Medici Effect provides an accessible mental model and compelling case studies. However, it offers limited methodological guidance on *how* to systematically find productive intersections versus unproductive ones. The framework does not address the optimal cognitive distance problem — not all intersections are equally fertile, and some are too distant to yield viable products. It is better understood as an orientation (seek intersections) than as a method (here is how to find the right ones).

---

### 4.2 Structured Analogy Transfer

**Theory & mechanism.** Structured analogy transfer is the deliberate, systematic practice of identifying solutions in a source domain and mapping them to a target domain through explicit structural correspondence. Unlike the Medici Effect's emphasis on serendipitous collision, structured analogy requires a defined process: (1) abstract the target problem to its functional essence (what needs to be achieved, what constraints apply), (2) search for structurally similar problems in distant domains, (3) map the source solution back to the target context, and (4) adapt the solution to target-specific constraints.

The theoretical foundations come from Gentner's (1983) structure-mapping theory and its extension into design methodology through the Design-by-Analogy (DbA) paradigm. Moreno et al. (2014) showed that designers who use far-domain analogies (domains sharing only deep structural relations) produce more novel solutions than those using near-domain analogies (domains sharing surface features), though near-domain analogies produce more feasible solutions. This creativity-feasibility trade-off is a central tension in structured analogy transfer.

**Literature evidence.** Dahl and Moreau (2002) demonstrated in controlled experiments that the originality of product designs is significantly influenced by the extent of analogical transfer, with far-field analogies producing more original outputs. Chan et al. (2011) found that exposure to far-field examples during ideation increased the novelty of solutions by 40-60% compared to within-domain examples, though participants required more time to extract useful principles. Fu et al. (2013) developed a computational approach to Design-by-Analogy using patent databases, encoding analogies through function-behavior-structure representations and achieving retrieval precision significantly above baseline information-retrieval methods.

**Implementations & benchmarks.** Structured analogy transfer has been operationalized through several formal methods:
- *Wordtrees and function-structure diagrams*: Visual tools that decompose a product's function into sub-functions, enabling search for analogous solutions at each sub-function level.
- *Knowledge graph-assisted DbA*: Recent work integrates knowledge graph technology to systematically organize analogical knowledge and their interrelationships using directed graphs to map semantic connections across domains.
- *The "problem schema" approach*: Hope et al. (2017) demonstrated that encoding products as purpose-mechanism pairs — what the product does and how it does it — enables effective computational analogy retrieval from large patent databases.
- *Analogical reasoning workshops*: Formalized innovation sessions where teams explicitly decompose their problem, search curated databases of cross-domain solutions, and force-fit mappings.

**B2C case study: Duolingo.** Duolingo represents structured analogy transfer from mobile gaming to language education. The Duolingo team explicitly studied retention mechanics from games like Angry Birds and Clash Royale — streaks, experience points, leaderboards, lives, level progression — and mapped them onto the learning context. The analogy was not surface-level ("make it look like a game") but structural: games solve the engagement-over-time problem through variable reward schedules and social competition; language learning has the same structural problem (sustained daily practice). The mapping was deliberate: game "levels" became language "skills," game "lives" became lesson "hearts," game "daily quests" became "daily XP goals." With 120M+ monthly active users and academic evidence that 80% of users attribute their continued engagement to gamification features, Duolingo demonstrates that structured analogy transfer can produce category-defining B2C products.

**Strengths & limitations.** Structured analogy transfer is the most methodologically rigorous approach to cross-domain innovation. It converts an open-ended creative challenge into a systematic search-and-mapping procedure. However, it requires significant cognitive effort to abstract problems to the right level of generality — too abstract and the analogy becomes vacuous, too specific and it becomes untransferable. The method also suffers from retrieval bias: designers tend to search for analogies in domains they already know, limiting the effective search radius. Computational approaches (Section 4.8) address this limitation.

---

### 4.3 Biomimicry in Product Design

**Theory & mechanism.** Biomimicry — innovation inspired by biological strategies — treats the 3.8 billion years of evolution as a pre-existing R&D laboratory. The core premise is that natural selection has already solved many of the functional problems that engineers and product designers face, and these biological solutions can be transferred to human design contexts through analogical mapping. The Biomimicry Institute's methodology follows a structured process: (1) define the function to be achieved, (2) "biologize" the question (how does nature perform this function?), (3) discover biological models, (4) abstract biological strategies into design principles, and (5) emulate those principles in the target context.

The theoretical justification for biomimicry as a cross-domain innovation source is that biology operates under extreme selection pressure across an enormous diversity of functional challenges (thermoregulation, adhesion, drag reduction, self-repair, information processing), producing solutions that are often structurally elegant and resource-efficient. The domain distance between biology and technology is large enough to generate genuine novelty but structured enough — both domains deal with physical and information-processing constraints — to support productive analogical transfer.

**Literature evidence.** Deldin and Schuknecht (2014) documented the AskNature database as a systematic enabler of biomimetic design, cataloguing over 1,800 biological strategies organized by function. Helms et al. (2009) analyzed the biomimicry design process and identified two primary pathways: "solution-driven" (starting from an interesting biological phenomenon and seeking applications) and "problem-driven" (starting from a design challenge and searching for biological analogs). Badarnah and Kadri (2015) developed a framework for systematically mapping biological strategies to building envelope design, demonstrating that formalized biomimicry processes can outperform ad hoc bio-inspiration.

**Implementations & benchmarks.**
- *AskNature.org*: The world's largest open-access database of biological strategies for innovation, with 1,800+ strategies organized by the Biomimicry Taxonomy (a function-based classification). Since 2024, the platform has integrated RAG (Retrieval-Augmented Generation) with LLMs, combining a curated database of 2,106 documents with a large language model to support biomimicry design queries.
- *DANE (Design by Analogy to Nature Engine)*: A computational tool developed at Georgia Tech that matches engineering problems to biological solutions using structure-behavior-function representations.
- *BioTRIZ*: An extension of classical TRIZ that maps biological conflict-resolution strategies onto the TRIZ contradiction matrix, enabling systematic biomimetic problem solving.

**B2C case studies.**
- *Speedo Fastskin*: Swimwear designed to mimic sharkskin's drag-reducing denticle structure, developed in collaboration with NASA. The structural analogy — sharkskin reduces hydrodynamic drag through micro-scale surface texture — was mapped to competitive swimwear with measurable performance gains.
- *Velcro*: The canonical biomimicry case. Swiss engineer George de Mestral noticed how burdock burrs adhered to his dog's fur via tiny hooks engaging with fabric loops, and mapped this biological attachment mechanism to a reusable fastener system.
- *Shinkansen bullet train*: Chief engineer Eiji Nakatsu, a birdwatcher, redesigned the train's nose to mimic the kingfisher's beak shape, which allows the bird to transition between air and water with minimal splash. The biomimetic redesign reduced the sonic boom when exiting tunnels, cut noise by 30%, and improved energy efficiency by 15%.

**Strengths & limitations.** Biomimicry constrains the cross-domain search problem by directing designers to a single, extraordinarily rich source domain. The Biomimicry Taxonomy provides a structured retrieval mechanism organized by function, reducing the search cost. However, the method has significant limitations: biological solutions operate at scales, with materials, and under constraints that often do not translate directly to engineered systems. The "abstracting biological strategies to design principles" step is cognitively demanding and error-prone. Furthermore, biomimicry's applicability to software and digital product design is more limited than to physical product design — the biological analogies are strongest for material, structural, and energy problems rather than information architecture and user experience problems.

---

### 4.4 Cross-Industry Pattern Matching (TRIZ and SIT)

**Theory & mechanism.** TRIZ (Teoriya Resheniya Izobretatelskikh Zadach — Theory of Inventive Problem Solving), developed by Genrich Altshuller beginning in 1946, represents the most systematic attempt to codify cross-domain innovation patterns. Working in the Soviet Navy's patent inspection department, Altshuller analyzed over 40,000 patents across engineering fields and discovered that inventive solutions share common patterns regardless of the specific industry or technology involved. He distilled these patterns into 40 Inventive Principles and organized them using a Contradiction Matrix — a 39x39 grid where rows represent parameters to improve and columns represent parameters that worsen, with each cell pointing to the most frequently successful Inventive Principles for that specific contradiction type.

Systematic Inventive Thinking (SIT), developed in Israel in the mid-1990s by Roni Horowitz and others, is a derivative of TRIZ adapted for broader application including product and service innovation. SIT distills TRIZ's patterns to five core templates: Subtraction (removing a component), Division (dividing a product and rearranging parts), Multiplication (copying a component and modifying the copy), Task Unification (assigning a new task to an existing component), and Attribute Dependency (creating or breaking dependencies between attributes).

**Literature evidence.** Altshuller's original patent analysis — later expanded to over 2.5 million patents by subsequent researchers — remains the largest empirical study of cross-domain innovation patterns ever conducted. Ilevbare et al. (2013) conducted a systematic review of TRIZ applications and found documented use in over 30 industries, with Samsung, Intel, LG, and Procter & Gamble maintaining internal TRIZ training programs. Mann (2002) updated the contradiction matrix based on a modern patent corpus, demonstrating that while the original 40 principles remain valid, their relative frequency of application has shifted with technological change. Horowitz (2001) provided experimental evidence that SIT templates increase the quantity and originality of ideas in controlled ideation sessions.

**Implementations & benchmarks.**
- *Samsung*: Has invested heavily in embedding TRIZ throughout the company, with documented cases of TRIZ-driven patent generation.
- *Procter & Gamble*: Uses TRIZ in product development, including the design of the Swiffer cleaning system (Task Unification — the cleaning pad itself captures dirt rather than using a separate collection mechanism).
- *SIT software tools*: Commercial tools that guide users through the five SIT templates applied to their specific product challenge.

**B2C case study: Swiffer.** The Swiffer exemplifies the Task Unification template from SIT. Traditional mopping requires separate components — a mop, a bucket, water, cleaning solution — with the mop's sole function being to transfer solution to the floor. Applying Task Unification, P&G assigned the cleaning function directly to the pad, creating a disposable pad pre-loaded with cleaning solution. The structural pattern (assign an additional task to an existing component, eliminating a separate component) is domain-independent: the same pattern appears in shampoo-conditioner combinations, phone-camera convergence, and smartwatch-health-monitor integration.

**Strengths & limitations.** TRIZ and SIT are the most systematically validated approaches to cross-domain pattern matching. The pre-compiled pattern libraries dramatically reduce search costs — designers do not need to search the entire space of possible analogies but can instead match their specific contradiction type to proven resolution patterns. However, the classical TRIZ matrix is biased toward mechanical and physical engineering problems; adaptation to software, service design, and digital products requires significant reinterpretation of the 39 parameters. SIT's five templates are more domain-general but correspondingly less specific in their guidance. Both methods also face the "pattern-rigidity" risk: designers may over-rely on codified patterns and miss genuinely novel cross-domain solutions that do not fit the existing taxonomy.

---

### 4.5 Exaptation Theory

**Theory & mechanism.** Exaptation, a concept borrowed from evolutionary biology (Gould and Vrba, 1982), describes the process by which a feature evolved for one function is co-opted for a different function. Andriani and Cattani (2016) extended this concept to technological innovation, arguing that exaptation is a pervasive but under-recognized source of breakthrough innovation. Unlike adaptation (incremental improvement of an existing function), exaptation involves a discontinuous functional shift — the artifact's structure remains the same but its purpose changes fundamentally.

The mechanism differs from analogical transfer in an important way: in analogy, a *solution principle* is transferred from one domain to another; in exaptation, an *existing artifact or capability* is repurposed wholesale. The magnetron, a radar component, was exapted to become the core of the microwave oven. The audio compact disc was exapted as a computer data storage medium. Viagra was developed as a heart medication and exapted when its side effects proved more commercially valuable than its intended function.

**Literature evidence.** Andriani and Cattani's (2016) special section in Industrial and Corporate Change established exaptation as a formal concept in innovation studies, presenting multiple case analyses. Cattani (2005) documented how existing manufacturing capabilities can be exapted for entirely new product categories. Liu et al. (2021) studied 80 cases of exaptation during COVID-19, where firms rapidly repurposed their design and manufacturing capabilities — distilleries producing hand sanitizer, automotive companies manufacturing ventilators — demonstrating that exaptation can be accelerated under crisis conditions. Garud et al. (2016) showed that IKEA customers spontaneously exapt furniture products for uses never intended by designers ("IKEA hacks"), suggesting that user-driven exaptation is a significant source of product innovation that firms can learn from.

**Implementations & benchmarks.**
- *Systematic exaptation scanning*: Monitoring how users repurpose existing products (user forums, social media, support tickets) to identify functional shifts that suggest new product categories.
- *Modular exaptation*: Andriani and Carignani (2014) argued that modular product architectures facilitate exaptation because individual modules can be recombined for new functions without redesigning the entire system.
- *COVID-era exaptation*: LVMH converting perfume manufacturing lines to hand sanitizer production; Dyson repurposing motor and air-handling expertise to produce ventilators.

**B2C case study: Instagram.** Instagram began as Burbn, a location-based check-in app with many features. Users exapted the photo-sharing feature — originally a minor component — as the app's primary function. The founders recognized this user-driven exaptation and stripped the app down to its photo-sharing core, renaming it Instagram. The product's function shifted from "location sharing with photo support" to "photo sharing with location support" — a classic exaptation where the structure (the app's technical infrastructure) remained but the function changed fundamentally. This user-driven exaptation pattern has since been replicated: Slack began as an internal communication tool for a game development company (Tiny Speck), where the game failed but the communication tool was exapted into a standalone product.

**Strengths & limitations.** Exaptation theory provides a powerful explanatory framework for innovations that do not fit the linear model of problem-solution matching. It directs attention to existing assets, capabilities, and user behaviors as sources of innovation rather than requiring novel invention. However, exaptation is inherently difficult to plan for — by definition, the functional shift was not the original intent. The best that organizations can do is create conditions that increase the probability of recognizing exaptive opportunities: modular architectures, close observation of user behavior, and organizational cultures that treat unexpected use patterns as signals rather than noise.

---

### 4.6 Combinatorial Innovation

**Theory & mechanism.** Combinatorial innovation theory holds that new technologies, products, and ideas are fundamentally recombinations of existing ones. Schumpeter (1934) articulated the foundational claim: "innovation consists in carrying out new combinations." Weitzman (1998) formalized this in his recombinant growth model, demonstrating mathematically that the number of possible untried combinations of existing ideas grows much faster than the capacity to explore them — creating an ever-expanding frontier of combinatorial opportunity.

W. Brian Arthur (2009) extended this into a full evolutionary theory of technology in *The Nature of Technology*, articulating three principles: (1) all technologies are combinations of other technologies, (2) each component of a technology is itself a technology, and (3) all technologies harness some physical or informational effect. This recursive structure means that each new technology expands the combinatorial space for future innovations. Fleming and Sorenson (2001) provided large-scale empirical validation using patent data, showing that invention is indeed a process of recombinant search, and that novel component combinations produce higher variance outcomes — more failures on average, but also more breakthroughs.

**Literature evidence.** Fleming and Sorenson's (2001) analysis of patent citations demonstrated that experimentation with unfamiliar component combinations leads to less useful inventions on average but increases variability, producing both more failures and more breakthroughs. Uzzi et al. (2013) found the same pattern in scientific papers: the highest-impact work combines conventional knowledge with a small number of atypical combinations. Youn et al. (2015) analyzed the entire US patent record and showed that while truly novel technological components have become rare, novel *combinations* of existing components continue to increase — supporting Arthur's theory that combinatorial recombination is the dominant mode of technological evolution.

**Implementations & benchmarks.**
- *Combinatorial design matrices*: Systematically enumerating possible pairwise or n-wise combinations of existing product features, technologies, or business model components, then screening for viability.
- *Morphological analysis*: Fritz Zwicky's method of decomposing a problem into independent dimensions and systematically exploring the cross-product of possible values.
- *Platform + module recombination*: API-driven product architectures that enable rapid recombination by third-party developers — the App Store model, Shopify's plugin ecosystem, Zapier's integration layer.

**B2C case study: Uber.** Uber is a recombination of existing technologies and business model components: GPS-enabled smartphones (location), mobile payments (transaction), dynamic pricing algorithms (economics), driver reputation systems (trust), and logistics dispatch software (operations). None of these components were novel in 2009. The innovation was the specific combination, applied to the personal transportation domain. The "Uber for X" pattern — applying the same combinatorial template to different service categories — further demonstrates how a successful combination can be parameterized and reapplied: Uber for food delivery (Uber Eats), Uber for freight (Uber Freight), and hundreds of startups applying the pattern to cleaning, laundry, healthcare, and other service domains.

**Additional B2C case study: Peloton.** Peloton illustrates multi-source combinatorial innovation. The product recombines stationary fitness equipment (decades-old technology), live-streaming video (Netflix/Twitch model), leaderboards and performance metrics (competitive gaming), subscription content libraries (Spotify model), and social community features (social media). When Barry McCarthy — former CFO of both Netflix and Spotify — became Peloton's CEO, it made the cross-domain DNA explicit at the leadership level. Peloton's "Lanebreak" feature, which turns cycling workouts into a video game with avatars, music synchronization, and scoring, represents a second-order recombination: the gamified fitness product itself borrowing again from a new source domain (rhythm games like Guitar Hero). The layered recombination demonstrates Arthur's recursive principle: each new combination creates components available for further combination.

**Strengths & limitations.** Combinatorial innovation theory is both descriptively powerful and practically actionable. It reduces innovation from an open-ended creative challenge to a structured combinatorial search, and it explains why some periods and contexts produce more innovation than others (larger component libraries, lower recombination costs, more diverse teams). However, the theory offers limited guidance on *which* combinations to try — the space is too vast for exhaustive search, and not all combinations are viable. The challenge is filtering: identifying the tiny subset of valuable combinations from the astronomically large set of possible ones. This is where the other approaches in this survey — analogy, pattern matching, AI-assisted search — serve as complementary filters.

---

### 4.7 Technology Brokering

**Theory & mechanism.** Hargadon and Sutton (1997) developed the technology brokering model from an ethnographic study of IDEO, the product design firm. They observed that IDEO's innovation process depended on its structural position: by working for clients across 40+ industries, IDEO accumulated knowledge of existing solutions in diverse domains and acted as a "technology broker" — introducing solutions from one industry where they were well-known into another where they were novel. The brokering cycle has four phases: (1) access to diverse knowledge through multi-industry client work, (2) acquisition and storage of that knowledge in organizational memory (physical prototypes, stories, past project archives), (3) retrieval of stored knowledge when a new problem presents structural similarities, and (4) transformation of the borrowed solution to fit the new context.

Hargadon and Sutton emphasize that brokering is more than simple linking — the knowledge is transformed during transfer, not merely moved. This distinguishes technology brokering from pure matchmaking or knowledge management.

**Literature evidence.** The IDEO ethnography remains the foundational empirical study. Hargadon (2003) extended the framework in *How Breakthroughs Happen*, documenting historical cases including Thomas Edison's laboratory — which Hargadon reinterprets as a technology brokering operation that transferred knowledge across telegraph, telephone, electric power, and lighting industries. Verona et al. (2006) studied innovation intermediaries in multiple industries and confirmed that organizations positioned at industry intersections produce more novel recombinations. Howells (2006) reviewed the broader literature on innovation intermediaries, finding that brokering functions range from information scanning and technology assessment to prototyping and commercialization support.

**Implementations & benchmarks.**
- *IDEO's Tech Box*: A physical collection of hundreds of materials, components, mechanisms, and gadgets from past projects, organized to facilitate serendipitous cross-pollination during brainstorming.
- *Consulting firm model*: McKinsey, BCG, and other consulting firms function as implicit technology brokers, transferring operational and strategic patterns across industries.
- *InnoCentive / Wazoku*: Open innovation platforms that connect organizations with solvers from different fields, structurally replicating the brokering function at scale. InnoCentive's network of 400,000+ experts from diverse domains provides a digital equivalent of IDEO's multi-industry positioning.
- *Design sprints*: Google Ventures' design sprint methodology incorporates elements of technology brokering by bringing diverse expertise to bear on a single problem within a compressed timeframe.

**B2C case study: Apple.** Apple's product innovation history is substantially a technology brokering story. The original Macintosh GUI was brokered from Xerox PARC's research (a laboratory environment) into a consumer product. The iPod combined an existing small-form-factor hard drive (Toshiba), MP3 decoding technology, and FireWire data transfer into a consumer device with a novel scroll-wheel interface. The iPhone combined existing touchscreen technology, mobile telephony, and internet browsing — each familiar in its own industry — into a consumer product that redefined all three categories. In each case, Apple's role was not invention of components but brokering: accessing solutions across industries, recognizing their combinatorial potential, and transforming them for the consumer market.

**Strengths & limitations.** Technology brokering provides both a theoretical model and an organizational design template. It explains *why* certain organizations (IDEO, Apple, Edison's lab) produce disproportionate innovation and suggests structural conditions (multi-industry access, organizational memory, cross-pollination routines) that can be replicated. The main limitation is that it requires sustained investment in breadth — maintaining knowledge across dozens of domains is expensive and difficult to scale. It also depends on organizational memory and retrieval, which are vulnerable to personnel turnover and knowledge decay. Small startups cannot easily replicate the multi-industry positioning that makes brokering possible, though open innovation platforms partially address this constraint.

---

### 4.8 AI-Assisted Cross-Domain Search

**Theory & mechanism.** The most significant recent development in cross-domain innovation methodology is the application of computational methods — particularly natural language processing and large language models — to automate the search for cross-domain analogies. The core insight is that if analogical reasoning is fundamentally a search problem, and if the search space (patents, papers, product descriptions, biological strategies) can be represented computationally, then machine learning can dramatically expand the effective search radius beyond what any individual human can achieve.

Hope, Chan, Kittur, and Shahaf (2017) demonstrated this in their award-winning KDD paper "Accelerating Innovation Through Analogy Mining." They developed purpose-mechanism vector representations from product descriptions, using crowdsourcing to identify structural patterns and recurrent neural networks to learn representations. These learned vectors enabled finding analogies with higher precision and recall than traditional information retrieval, and in ideation experiments, participants exposed to model-retrieved analogies were significantly more likely to generate creative solutions.

More recently, large language models have emerged as powerful cross-domain search tools. LLMs trained on broad corpora implicitly encode relational knowledge across thousands of domains, making them capable of generating cross-domain analogies without requiring explicit structural encoding. Research on LLM-assisted ideation has grown rapidly — from 5 published articles in 2022 to 37 in 2024 — exploring applications ranging from augmenting human brainstorming to fully automated cross-domain concept generation.

**Literature evidence.** Hope et al. (2017) is the foundational empirical study, demonstrating significant improvement in both analogy quality and ideation outcomes using computational methods. Kittur et al. (2019) extended this work through the "Analogy Hub" project, scaling cross-domain retrieval to larger patent databases. Jiang et al. (2022) showed that LLMs can generate cross-domain analogies that, while sometimes "incorrect" in a strict structural sense, still inspire productive problem reformulation. Luo et al. (2025) developed a framework combining LLMs with structured analogy retrieval for conceptual product design. The Idea-Catalyst framework uses metacognition-driven LLM processes — problem decomposition, cross-domain exploration, and strategic prioritization — to systematically surface insights from external source domains, demonstrating 21% improvement in novelty and 16% improvement in insightfulness of generated ideas.

**Implementations & benchmarks.**
- *Analogy mining tools*: Purpose-mechanism vector representations applied to the US Patent and Trademark Office database, enabling search for structurally analogous inventions across all technology classes.
- *AskNature + RAG*: The Biomimicry Institute's integration of a Retrieval-Augmented Generation framework with their curated database of 2,106 biological strategies and a Llama 3.1 LLM, enabling natural-language biomimicry queries.
- *Custom GPT ideation frameworks*: Researchers have developed co-creation frameworks combining custom GPT instances with structured design-thinking processes to enhance cross-domain ideation.
- *Semantic Scholar + citation graph analysis*: Tools that identify structurally analogous research across scientific disciplines by analyzing citation patterns and abstract semantics.
- *Patent-to-product mapping*: Automated systems that scan patent filings across industries and surface technologies potentially applicable to a user-specified product domain.

**B2C case study: Notion.** While not a published case of AI-assisted cross-domain innovation per se, Notion illustrates the combinatorial space that AI tools aim to navigate. Notion combines document editing (Google Docs), database management (Airtable), project management (Trello), wiki functionality (Confluence), and formula computation (spreadsheets) into a single product. The insight required recognizing structural analogies across these distinct tool categories — they all involve structured information with different views and collaboration patterns — and synthesizing them into a unified block-based architecture. Future AI-assisted tools aim to surface such cross-category structural similarities at scale, enabling product designers to identify recombination opportunities that would otherwise require deep familiarity with dozens of software categories.

**Strengths & limitations.** AI-assisted methods address the fundamental bottleneck of cross-domain innovation: the combinatorial explosion of possible cross-domain mappings. They can search corpora orders of magnitude larger than any human can review, and they are not subject to the retrieval bias that limits human analogical search to familiar domains. However, current methods have significant limitations. LLMs can generate superficially plausible but structurally unsound analogies — they match surface patterns rather than deep structural relations, inverting Gentner's hierarchy. The quality of AI-generated analogies requires human evaluation and filtering, creating a human-AI collaboration requirement rather than full automation. Evaluation metrics for analogy quality are poorly developed, making it difficult to benchmark different computational approaches. And the "black box" nature of LLM-generated analogies makes it hard to explain *why* a particular cross-domain connection was suggested, reducing practitioner trust.

---

## 5. Comparative Synthesis

The following table compares all eight approaches across dimensions critical to B2C product innovation practitioners.

| Dimension | Medici Effect | Structured Analogy | Biomimicry | TRIZ / SIT | Exaptation | Combinatorial Innovation | Technology Brokering | AI-Assisted Search |
|---|---|---|---|---|---|---|---|---|
| **Primary mechanism** | Serendipitous intersection | Deliberate structural mapping | Biology as source domain | Pre-compiled pattern library | Functional repurposing | Systematic recombination | Multi-industry knowledge transfer | Computational search over corpora |
| **Domain distance** | Unspecified (any) | Explicitly far | Biology to engineering/design | Cross-industry (engineering-biased) | Within or across domains | Variable (component-level) | Moderate (adjacent industries) | Variable (corpus-dependent) |
| **Systematization** | Low (orientation, not method) | High (formal process) | Medium-High (structured taxonomy) | Very High (matrix + principles) | Low (recognition-dependent) | Medium (combinatorial enumeration) | Medium (organizational design) | High (automated) |
| **Cognitive cost** | Low to adopt, high to execute | High (abstraction + mapping) | Medium (biological literacy required) | Medium (TRIZ training required) | Low (observation-based) | Medium (enumeration + filtering) | High (multi-industry knowledge) | Low (AI does heavy lifting) |
| **Scalability** | Limited by serendipity | Limited by human search radius | Limited by biological knowledge | High (codified patterns) | Limited by observation capacity | High (automated enumeration) | Limited by organizational reach | Very High (computational) |
| **Software/digital applicability** | High | High | Low-Medium | Medium (requires reinterpretation) | High | High | High | High |
| **Evidence base** | Practitioner cases | Cognitive science experiments | Engineering case studies | 2.5M+ patent analyses | Evolutionary biology + cases | Patent data + economic theory | Ethnographic + historical | Growing (2017-present) |
| **Risk of false analogy** | High (no structural validation) | Medium (explicit mapping catches errors) | Medium (biological constraints differ) | Low (empirically validated patterns) | Low (artifact already exists) | Medium (not all combinations viable) | Medium (context-dependent) | High (LLM hallucination) |
| **B2C track record** | Airbnb, Pixar | Duolingo, Nike+ | Speedo, Velcro | Swiffer, Samsung | Instagram, Slack | Uber, Spotify | Apple, IDEO clients | Emerging |
| **Team composition need** | Diverse backgrounds | Domain expert + analogist | Biologist + designer | TRIZ-trained facilitator | Observant product team | Broad component knowledge | Multi-industry experience | ML engineer + domain expert |

### Key Observations from the Synthesis

Several patterns emerge from the comparative table. First, the approaches with the strongest evidence bases (TRIZ, combinatorial innovation, structure-mapping experiments) tend to be those with the narrowest applicability to digital B2C products. Second, the approaches with the highest B2C relevance (Medici Effect, technology brokering, AI-assisted search) tend to have the weakest formal evidence or the most recent provenance. Third, no single approach dominates across all dimensions — each trades off something critical, which argues for portfolio use rather than single-method adoption.

### Cross-Cutting Trade-Offs

Three trade-offs emerge across all approaches:

**1. Novelty vs. feasibility.** Approaches that access more distant domains (Medici Effect, far-field structured analogy, AI-assisted search across all patents) tend to produce more novel ideas but at lower average feasibility. Approaches that operate within more constrained spaces (TRIZ patterns, near-field analogy, technology brokering between adjacent industries) produce more immediately implementable solutions but with less radical novelty. This mirrors the exploration-exploitation trade-off in organizational learning theory.

**2. Systematization vs. serendipity.** TRIZ and computational methods are highly systematic but may miss genuinely novel cross-domain connections that fall outside their training data or pattern libraries. The Medici Effect and exaptation rely on serendipitous recognition but are unreliable and difficult to manage. The most productive approaches in practice combine structured methods with designed serendipity — using systematic tools to expand the search radius while maintaining organizational conditions (diverse teams, physical collider spaces, observation of unexpected use patterns) that allow for unplanned discoveries.

**3. Individual cognition vs. organizational capability.** Some approaches (structured analogy, biomimicry) can be practiced by individual designers. Others (technology brokering, combinatorial innovation at scale) require organizational infrastructure, multi-industry positioning, or computational resources. The choice depends on the innovator's context: a solo founder uses different tools than a corporate innovation lab.

---

## 6. Open Problems & Gaps

### 6.1 Measuring Analogical Distance

There is no consensus metric for the "distance" between two domains in the context of innovation. Nooteboom's optimal cognitive distance concept is well-established theoretically but difficult to operationalize. Patent classification codes provide a rough proxy (technology class distance), but these do not capture the relevant structural similarities that make analogies productive. Developing robust, validated measures of analogical distance — ideally computable from corpus data — remains an open problem with significant practical implications for directing cross-domain search.

### 6.2 The Transfer Gap

Cognitive science experiments consistently show that people fail to spontaneously retrieve and apply analogies from distant domains, even when explicitly told that prior examples are relevant (Gick and Holyoak, 1980). This "transfer gap" is the primary bottleneck for cross-domain innovation in practice. While structured methods, training, and computational tools can reduce the gap, there is limited research on which interventions are most cost-effective for sustained improvement in organizational analogical reasoning capacity.

### 6.3 Evaluation Metrics for Cross-Domain Ideas

How do you evaluate whether a cross-domain analogy is "good" before investing in implementation? Current methods rely on expert judgment, which is subjective, expensive, and inconsistent. The patent citation count serves as a post-hoc measure of recombinant innovation value, but there are no reliable pre-implementation metrics for analogical quality. The development of such metrics — perhaps based on structural coherence of the mapping, specificity of the transferred principle, or computational measures of embedding-space distance — is a significant gap.

### 6.4 LLM Limitations in Structural Analogy

Current large language models are powerful pattern matchers across surface features but struggle with deep structural analogy of the kind Gentner's theory identifies as most productive for innovation. LLMs may suggest that "a hospital is like a factory" based on co-occurrence patterns, but miss the deeper structural mapping (both involve triage, flow optimization, quality control, and capacity management) that would make the analogy actionable. Research on improving LLMs' capacity for structural (rather than surface) analogical reasoning is active but early-stage. The gap between LLM-generated analogies and expert-generated structural analogies remains substantial.

### 6.5 Cross-Domain Innovation in Non-Western Contexts

The overwhelming majority of research on cross-domain innovation originates from North American and European institutions and draws on Western case studies. Whether the cognitive and organizational mechanisms documented in this literature apply equally in cultures with different knowledge organization, different innovation ecosystems, and different attitudes toward cross-disciplinary work is largely unknown. Johansson's Medici Effect argues that cultural diversity drives intersectional innovation, but the empirical evidence for this claim is primarily anecdotal.

### 6.6 Ethical Dimensions of Analogical Transfer

Cross-domain innovation can transfer not only solutions but also pathologies. Gamification mechanics transferred from casino design to consumer products (loot boxes, variable-ratio reward schedules, streak-based engagement) have raised significant ethical concerns about addictive design. The same structural analogy that makes Duolingo's streaks effective for learning makes social media notification patterns effective for compulsive checking. The ethical frameworks for evaluating when cross-domain transfer is beneficial versus harmful are underdeveloped.

### 6.7 Organizational Integration

While individual approaches are well-documented, there is limited research on how organizations should integrate multiple cross-domain innovation methods into a coherent innovation process. Should a product team use TRIZ for engineering challenges, biomimicry for sustainability challenges, and AI-assisted search for market-positioning challenges? How should the outputs of different methods be combined and prioritized? The meta-methodology of cross-domain innovation portfolio management is largely unexplored.

### 6.8 Survivorship Bias in Case Studies

The cross-domain innovation literature relies heavily on successful case studies — Airbnb, Duolingo, Velcro, the Shinkansen — while largely ignoring the far more numerous cases of failed cross-domain transfers. For every successful gamification of education, there are dozens of failed attempts to apply game mechanics to domains where the structural analogy does not hold (gamified compliance training, gamified enterprise CRM). Without systematic study of cross-domain innovation failures, the literature risks overstating the reliability of these methods and understating the filtering and adaptation work required to make transfers succeed.

### 6.9 Temporal Dynamics of Cross-Domain Value

The value of a cross-domain insight decays over time as competitors observe and replicate the transfer. Airbnb's trust infrastructure was novel in 2009 but is now a standard component of marketplace design. Gamification was a differentiator for Duolingo in 2012 but is now expected in all education apps. There is limited research on the temporal dynamics of cross-domain competitive advantage — how quickly do cross-domain innovations become commoditized, and what determines the durability of the advantage?

---

## 7. Conclusion

Cross-domain innovation is not a single method but a family of approaches unified by a common cognitive operation — analogical reasoning — and a common practical challenge — navigating the combinatorial space of possible inter-domain mappings. The approaches surveyed in this paper differ in how they constrain that search (biology, patents, pre-compiled patterns, computational corpora), at what level they operate (individual cognition, team process, organizational structure, automated computation), and what trade-offs they accept (novelty vs. feasibility, systematization vs. serendipity, individual skill vs. organizational infrastructure).

The empirical evidence is clear on several points. Cross-domain influences are pervasive in creative work — approximately 80% of documented creative influences come from outside the creator's primary domain (Hunter and Gabora, 2019). Novel recombinations of existing components produce higher-variance outcomes, with more failures on average but disproportionately more breakthroughs (Fleming and Sorenson, 2001). There is an optimal cognitive distance for collaborative innovation — too little distance yields incrementalism, too much prevents mutual understanding (Nooteboom et al., 2007). And structured methods for analogical transfer outperform unstructured brainstorming in controlled experiments (Dahl and Moreau, 2002; Hope et al., 2017).

The B2C products that have defined the past two decades of consumer technology — Airbnb, Duolingo, Uber, Instagram, Peloton, Notion, Slack — are not primarily the result of novel technological invention. They are the result of novel *combinations* and *transfers*: hospitality meets peer-to-peer marketplace meets trust infrastructure; game design meets spaced repetition meets language pedagogy; streaming media meets fitness equipment meets multiplayer competition. The underlying technologies existed before these products. The innovation was in the cross-domain mapping.

The frontier is computational. AI-assisted methods are expanding the practical search radius for cross-domain analogies by orders of magnitude, but they face fundamental limitations in structural reasoning that cognitive science has long identified as the key to productive analogy. The resolution of this tension — building computational systems that can perform genuinely structural, not merely surface-level, cross-domain mapping — is likely the most consequential open problem in the field.

What remains constant across all approaches is the underlying cognitive mechanism: the human capacity to recognize that a solution operating in one context embodies a relational structure that can be projected onto a different context. Whether that projection is aided by a TRIZ matrix, a biological database, an organizational position spanning multiple industries, or a large language model scanning millions of patents, the final act of evaluating the analogy's structural validity and adapting it to a new domain remains a distinctively human judgment. The methods surveyed here do not replace that judgment — they expand the inputs available to it.

---

## References

Altshuller, G.S. (1984). *Creativity as an Exact Science: The Theory of the Solution of Inventive Problems*. Gordon and Breach.

Andriani, P. and Carignani, G. (2014). Modular exaptation: A missing link in the synthesis of artificial form. *Research Policy*, 43(9), 1608-1620.

Andriani, P. and Cattani, G. (2016). Exaptation as source of creativity, innovation, and diversity: Introduction to the Special Section. *Industrial and Corporate Change*, 25(1), 115-131. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2800356

Arthur, W.B. (2009). *The Nature of Technology: What It Is and How It Evolves*. Free Press. https://sites.santafe.edu/~wbarthur/thenatureoftechnology.htm

Chesbrough, H.W. (2003). *Open Innovation: The New Imperative for Creating and Profiting from Technology*. Harvard Business School Press.

Dahl, D.W. and Moreau, P. (2002). The influence and value of analogical thinking during new product ideation. *Journal of Marketing Research*, 39(1), 47-60. https://journals.sagepub.com/doi/10.1509/jmkr.39.1.47.18930

Deldin, J.M. and Schuknecht, M. (2014). The AskNature database: Enabling solutions in biomimetic design. In *Biologically Inspired Design*, Springer, 17-27. https://link.springer.com/chapter/10.1007/978-1-4471-5248-4_2

Fauconnier, G. and Turner, M. (2002). *The Way We Think: Conceptual Blending and the Mind's Hidden Complexities*. Basic Books.

Finke, R.A., Ward, T.B., and Smith, S.M. (1992). *Creative Cognition: Theory, Research, and Applications*. MIT Press. https://mitpress.mit.edu/9780262560962/creative-cognition/

Fleming, L. and Sorenson, O. (2001). Technology as a complex adaptive system: Evidence from patent data. *Research Policy*, 30(7), 1019-1039. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=238492

Fu, K., Chan, J., Cagan, J., Kotovsky, K., Schunn, C., and Wood, K. (2013). The meaning of "near" and "far": The impact of structuring design databases and the effect of distance of analogy on design output. *Journal of Mechanical Design*, 135(2), 021007.

Gavetti, G., Levinthal, D.A., and Rivkin, J.W. (2005). Strategy making in novel and complex worlds: The power of analogy. *Strategic Management Journal*, 26(8), 691-712. https://sms.onlinelibrary.wiley.com/doi/abs/10.1002/smj.475

Gentner, D. (1983). Structure-mapping: A theoretical framework for analogy. *Cognitive Science*, 7(2), 155-170. https://onlinelibrary.wiley.com/doi/abs/10.1207/s15516709cog0702_3

Gick, M.L. and Holyoak, K.J. (1980). Analogical problem solving. *Cognitive Psychology*, 12(3), 306-355. https://www.sciencedirect.com/science/article/abs/pii/0010028580900134

Gick, M.L. and Holyoak, K.J. (1983). Schema induction and analogical transfer. *Cognitive Psychology*, 15(1), 1-38. https://deepblue.lib.umich.edu/bitstream/2027.42/25331/1/0000776.pdf

Gordon, W.J.J. (1961). *Synectics: The Development of Creative Capacity*. Harper & Row.

Gould, S.J. and Vrba, E.S. (1982). Exaptation — a missing term in the science of form. *Paleobiology*, 8(1), 4-15.

Hargadon, A. and Sutton, R.I. (1997). Technology brokering and innovation in a product development firm. *Administrative Science Quarterly*, 42(4), 716-749. https://www.jstor.org/stable/2393655

Hargadon, A. (2003). *How Breakthroughs Happen: The Surprising Truth About How Companies Innovate*. Harvard Business School Press.

Helms, M., Vattam, S.S., and Goel, A.K. (2009). Biologically inspired design: Process and products. *Design Studies*, 30(5), 606-622.

Hope, T., Chan, J., Kittur, A., and Shahaf, D. (2017). Accelerating innovation through analogy mining. *Proceedings of the 23rd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 235-243. https://arxiv.org/abs/1706.05585

Horowitz, R. (2001). From TRIZ to ASIT in 4 inventive steps. *The TRIZ Journal*.

Howells, J. (2006). Intermediation and the role of intermediaries in innovation. *Research Policy*, 35(5), 715-728.

Hunter, S.T. and Gabora, L. (2019). The ubiquity of cross-domain thinking in the early phase of the creative process. *Frontiers in Psychology*, 10, 1426. https://pmc.ncbi.nlm.nih.gov/articles/PMC6594204/

Johansson, F. (2004). *The Medici Effect: Breakthrough Insights at the Intersection of Ideas, Concepts, and Cultures*. Harvard Business School Press.

Liu, Z., Rathore, A.S., Prasetio, E.A., Dierkes, M., and Moura, E. (2021). Accelerated innovation through repurposing: Exaptation of design and manufacturing in response to COVID-19. *R&D Management*, 51(4), 410-426. https://pmc.ncbi.nlm.nih.gov/articles/PMC8014062/

Mann, D. (2002). *Hands-On Systematic Innovation*. CREAX Press.

Moreno, D.P., Yang, M.C., Hernandez, A.A., Linsey, J.S., and Wood, K.L. (2014). Fundamental studies in design-by-analogy: A focus on domain-knowledge experts and applications to transactional design problems. *Design Studies*, 35(3), 232-272. http://web.mit.edu/~mcyang/www/papers/2014-morenoEtalc.pdf

Nooteboom, B., Vanhaverbeke, W., Duysters, G., Gilsing, V.A., and van den Oord, A. (2007). Optimal cognitive distance and absorptive capacity. *Research Policy*, 36(7), 1016-1034. https://www.sciencedirect.com/science/article/abs/pii/S0048733307000807

Schumpeter, J.A. (1934). *The Theory of Economic Development*. Harvard University Press.

Uzzi, B., Mukherjee, S., Stringer, M., and Jones, B. (2013). Atypical combinations and scientific impact. *Science*, 342(6157), 468-472.

Weitzman, M.L. (1998). Recombinant growth. *Quarterly Journal of Economics*, 113(2), 331-360. https://scholar.harvard.edu/files/weitzman/files/recombinant_growth.pdf

Youn, H., Strumsky, D., Bettencourt, L.M., and Lobo, J. (2015). Invention as a combinatorial process: Evidence from US patents. *Journal of the Royal Society Interface*, 12(106), 20150272.

---

## Practitioner Resources

### Frameworks & Methodologies

- **AskNature** (https://asknature.org/) — The Biomimicry Institute's open-access database of 1,800+ biological strategies organized by function. Now includes AI-powered natural-language search via RAG + LLM integration. Primary tool for biomimicry-based cross-domain innovation.

- **TRIZ40.com** (https://www.triz40.com/) — Interactive contradiction matrix and 40 Inventive Principles browser. Free web tool for applying classical TRIZ to product design problems.

- **SIT (Systematic Inventive Thinking)** (https://www.sitsite.com/) — Commercial methodology and training based on five innovation templates derived from TRIZ. Workshops, certification, and facilitation tools for structured cross-domain pattern application.

- **IDEO Design Thinking** (https://designthinking.ideo.com/) — Framework and toolkit for human-centered design with cross-industry analogical reasoning embedded in the ideation phase. Free online courses available through IDEO U.

### Computational Tools & Platforms

- **Semantic Scholar** (https://www.semanticscholar.org/) — AI-powered academic search engine with citation graph analysis. Useful for discovering structurally analogous research across scientific disciplines.

- **Google Patents** (https://patents.google.com/) — Full-text patent search across international patent offices. Enables manual cross-domain patent search using function-based queries.

- **InnoCentive / Wazoku** (https://www.wazoku.com/) — Open innovation platform connecting organizations with 400,000+ external solvers from diverse domains. Structural technology brokering at scale.

- **Analogy Mining (Hope et al.)** (https://arxiv.org/abs/1706.05585) — Research paper and associated code for purpose-mechanism vector representations enabling computational analogy retrieval from patent databases.

### Books & Long-Form Reading

- **Johansson, F. (2004). *The Medici Effect*** — Accessible introduction to intersectional innovation with practitioner case studies. Best starting point for the general concept.

- **Arthur, W.B. (2009). *The Nature of Technology*** — Deep theoretical treatment of combinatorial evolution in technology. Essential for understanding *why* recombination drives innovation.

- **Hargadon, A. (2003). *How Breakthroughs Happen*** — Historical case studies of technology brokering from Edison to IDEO. Practical organizational implications.

- **Finke, R.A., Ward, T.B., and Smith, S.M. (1992). *Creative Cognition*** — Cognitive science foundations of the Geneplore model and structured imagination. Technical but accessible to non-specialists.

- **Benyus, J.M. (1997). *Biomimicry: Innovation Inspired by Nature*** — Foundational text on biomimicry as an innovation methodology with detailed biological case studies.

- **Gordon, W.J.J. (1961). *Synectics: The Development of Creative Capacity*** — Original statement of the Synectics method for forced analogical connections. Historical interest and still-relevant operational procedures.

- **Chesbrough, H.W. (2003). *Open Innovation*** — Paradigm-defining work on using external knowledge sources. Provides the organizational context for technology brokering and cross-domain search.

### Academic Surveys & Review Articles

- **Fu et al. (2014). "Design-by-Analogy: Experimental evaluation of a functional analogy search methodology"** — Empirical evaluation of computational approaches to design-by-analogy in engineering contexts.

- **Ilevbare, I.M., Probert, D., and Phaal, R. (2013). "A review of TRIZ and its benefits and challenges in practice"** — Systematic review of TRIZ applications across industries with documented outcomes.

- **Gavetti, G., Levinthal, D.A., and Rivkin, J.W. (2005). "Strategy making in novel and complex worlds: The power of analogy"** — Foundational paper on analogical reasoning in strategic management. https://sms.onlinelibrary.wiley.com/doi/abs/10.1002/smj.475

- **Gentner, D. and Markman, A.B. (1997). "Structure mapping in analogy and similarity"** — Comprehensive review of structure-mapping theory and its empirical support. https://groups.psych.northwestern.edu/gentner/papers/GentnerMarkman97.pdf

### LLM and AI-Assisted Innovation (Emerging)

- **"A Review of LLM-Assisted Ideation" (2025)** (https://arxiv.org/html/2503.00946v1) — Survey of 61 papers on LLM-assisted ideation, documenting rapid growth from 5 papers in 2022 to 37 in 2024.

- **"Fluid Transformers and Creative Analogies" (2023)** (https://dl.acm.org/doi/fullHtml/10.1145/3591196.3593516) — Empirical study of LLMs' capacity for augmenting cross-domain analogical creativity in design tasks.

- **"Sparking Scientific Creativity via LLM-Driven Interdisciplinary Inspiration" (2025)** (https://arxiv.org/html/2603.12226) — Idea-Catalyst framework demonstrating 21% novelty improvement through LLM-driven cross-domain exploration.

- **"From analogy to innovation: A creative conceptual design approach leveraging large language models" (2025)** (https://www.sciencedirect.com/science/article/abs/pii/S1474034625003209) — Framework combining LLMs with structured analogy retrieval for product conceptual design.
