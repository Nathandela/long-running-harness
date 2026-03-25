---
title: "Build Feasibility Scoring for AI-Augmented Development Teams"
date: 2026-03-21
summary: Survey of complexity classifiers for product types, infrastructure dependency mapping, AI tool coverage matrices, maintenance burden estimation, and technical debt trajectory analysis for solo developers augmented by AI coding tools.
keywords: [b2c-product, build-feasibility, ai-augmented-development, complexity-classification, technical-debt]
---

# Build Feasibility Scoring for AI-Augmented Development Teams

*2026-03-21*

---

## Abstract

The emergence of AI-powered code generation, agentic coding assistants, and managed infrastructure platforms has shifted the production frontier for software development. A solo developer or small team augmented by AI tools can now ship products that would have required significantly larger teams three years ago. Yet the magnitude of this shift varies dramatically by product type, architectural complexity, and infrastructure requirements. The central problem for B2C product ideation in 2026 is not whether AI tools help -- they do -- but how much they help for a given product category, and whether the resulting build is maintainable over time. Feasibility scoring attempts to answer this question systematically.

This paper surveys eight approaches to build feasibility scoring in the context of AI-augmented development: product complexity classification taxonomies, infrastructure dependency mapping, AI tool coverage matrices, COCOMO-style estimation adapted for AI augmentation, maintenance burden estimation, technical debt trajectory analysis, build-versus-buy decision frameworks, and rapid prototyping feasibility scoring. For each approach, we examine theory and mechanism, literature evidence, existing implementations and benchmarks, and strengths and limitations. The survey draws on controlled experiments (Peng et al. 2023; METR 2025), large-scale observational data (DORA 2025; Jellyfish 2025; DX 2025; Stack Overflow 2025; Sonar 2026; CodeRabbit 2025), software estimation theory (Boehm 1981, 2000; Putnam 1978), complexity science (Cynefin; Stacey), and practitioner frameworks emerging from the indie developer and micro-SaaS communities.

The central finding across approaches is that AI tools compress the implementation phase of development but leave architecture, infrastructure, operations, and maintenance phases largely unchanged. Products whose complexity concentrates in implementation see the largest feasibility gains. Products whose complexity concentrates in distributed state, compliance, real-time coordination, or multi-stakeholder trust see marginal gains. No single scoring approach captures the full feasibility picture; practitioners need a composite model that combines complexity classification, infrastructure dependency analysis, AI coverage estimation, and maintenance trajectory projection. The paper presents a comparative synthesis of all eight approaches and identifies six open problems in the field.

---

## 1. Introduction

### 1.1 Problem Statement

Build feasibility scoring addresses a deceptively simple question: given a product idea, how long will it take to build, what infrastructure does it require, how much of the work can AI tools handle, and what will it cost to maintain? For AI-augmented development teams -- particularly solo developers and micro-teams building B2C products -- this question determines whether a product idea is a weekend project, a month-long sprint, or a quarter-long commitment. Misjudging feasibility in either direction is costly: overestimating leads to abandoned projects and wasted effort; underestimating leads to shipping products that cannot be maintained.

The difficulty is that feasibility is multidimensional. A product may be simple to implement but complex to operate (a real-time chat application). It may be complex to implement but trivial to maintain (a static data visualization tool). It may require minimal custom code but extensive compliance infrastructure (a fintech product using Stripe Connect). AI tools affect each dimension differently, and the net feasibility depends on the interaction of these dimensions, not on any single factor.

### 1.2 Scope

**Covered:** Complexity classifiers for B2C product types (weekend project vs. month vs. quarter). Infrastructure dependency mapping -- what needs databases, real-time systems, mobile SDKs, payment processing, compliance. AI tool coverage matrices -- what percentage of the build can be AI-assisted, by product type. COCOMO-style estimation adapted for AI-augmented development. Maintenance burden estimation and ongoing cost modeling. Technical debt trajectory by architecture choice. Build-versus-buy decision frameworks for AI-era developers. Rapid prototyping feasibility scoring and MVP scope calibration.

**Excluded:** Enterprise software estimation (teams > 20 engineers). Hardware-dependent product development. AI/ML model training as a product development activity (as opposed to using AI tools for coding). Regulatory approval processes specific to individual jurisdictions (though compliance as an infrastructure dependency is covered).

### 1.3 Key Definitions

**Build feasibility score:** A composite assessment of technical complexity, infrastructure requirements, AI-assistable work fraction, implementation timeline, and maintenance burden for a proposed software product.

**AI-augmented development team:** One to five developers using AI-powered tools for code generation, testing, design, and content creation, supplemented by managed cloud services. The canonical case is a solo developer with an agentic coding assistant (Claude Code, Cursor), full-stack generators (Bolt.new, Lovable), and managed infrastructure (Supabase, Vercel, Stripe).

**Product complexity class:** A categorical assignment of a product idea to a timeline tier -- weekend (1-3 days), sprint (1-4 weeks), month (1-3 months), or quarter (3-6 months) -- based on architectural requirements, not feature count.

**AI coverage fraction:** The estimated percentage of total development effort (design, implementation, testing, deployment, maintenance) that can be meaningfully accelerated by current AI tools, for a given product type.

**Maintenance burden ratio:** The ratio of ongoing operational and maintenance effort to initial development effort, measured over a defined time horizon (typically 12-36 months).

---

## 2. Foundations

### 2.1 Software Estimation Theory

Software effort estimation has a six-decade history of attempting to predict how long projects will take. The foundational models remain relevant because AI-augmented development changes the coefficients but not the underlying structure of the estimation problem.

**COCOMO (Constructive Cost Model).** Barry Boehm's 1981 model estimates effort in person-months as a function of thousands of lines of code (KLOC), modified by 15 cost drivers (effort multipliers) covering product attributes, hardware constraints, personnel capabilities, and project characteristics (Boehm 1981). COCOMO II (2000) extended the model to support iterative and component-based development, introducing five scale factors and 17 effort multipliers (Boehm et al. 2000). The effort equation takes the form E = a * (KLOC)^b * EAF, where EAF is the product of all effort multiplier values. For AI-augmented development, the critical question is which multipliers change and by how much. No standardized AI augmentation factor has been adopted as of March 2026, though practitioners have proposed an AI Augmentation Factor (AAF) ranging from 0.5 to 1.5, where lower values indicate higher AI productivity gains (Agarwal 2025).

**Putnam Model (SLIM).** Lawrence Putnam's 1978 model uses a Rayleigh curve to model effort distribution over time, predicting that total effort decreases as schedule is extended (Putnam 1978). The model's key insight -- that compressing schedule increases effort nonlinearly -- applies directly to AI-augmented development. AI tools may compress the peak of the Rayleigh curve (implementation) without changing the tails (requirements, maintenance), creating a bimodal effort distribution that neither COCOMO nor SLIM was designed to model.

**Function Points and COSMIC.** Function point analysis, introduced by Allan Albrecht at IBM in 1979, measures software size by counting functional operations (inputs, outputs, inquiries, files, interfaces) rather than lines of code. COSMIC (Common Software Measurement International Consortium), standardized as ISO/IEC 19761, refines this for modern architectures including real-time, embedded, and service-oriented systems. COSMIC measures size in COSMIC Function Points (CFP), where each data movement (entry, exit, read, write) counts as one CFP. Recent work demonstrates COSMIC's applicability to agile and scaled-agile methodologies, and its estimation can be automated more accurately than IFPUG function points (COSMIC 2024). For AI-augmented development, function point counts remain stable -- AI changes the effort per function point, not the number of function points.

**Story Points.** Agile teams use story points as relative complexity estimates, typically on Fibonacci or power-of-two scales. Story points resist standardization by design -- they encode team-specific velocity. AI tools disrupt this calibration: a task estimated at 8 points by a human developer may be 3 points with AI assistance, but only if the task falls within AI's competence zone. Recent research explores multimodal generative AI for story point estimation, integrating text, image, and categorical data using BERT, CNN, and XGBoost models (ArXiv 2505.16290, 2025). Jira's Intelligent Story Point Estimation add-on uses machine learning to predict story points from historical data. The fundamental challenge remains: story points measure relative complexity within a team's context, and AI changes the context.

### 2.2 Complexity Science Applied to Software

Two frameworks from complexity science provide the theoretical grounding for product complexity classification.

**Cynefin Framework.** Dave Snowden's Cynefin framework (2003) categorizes situations into five domains: Clear (obvious cause-effect, apply best practice), Complicated (analyzable cause-effect, apply expertise), Complex (emergent cause-effect, probe and sense), Chaotic (no perceivable cause-effect, act immediately), and Confused (the center, where the domain is unknown). Applied to software products, a CRUD application is Clear, a payment integration is Complicated, a recommendation engine is Complex, and a system recovering from a security breach is Chaotic. AI tools are most effective in the Clear and Complicated domains, where patterns are recognizable and solutions are deterministic. In the Complex domain, AI tools generate plausible but potentially wrong solutions, requiring human judgment to evaluate (Snowden and Boone 2007).

**Stacey Matrix.** Ralph Stacey's complexity matrix (1996) maps decisions along two axes: certainty (how predictable outcomes are) and agreement (how much consensus exists on requirements). The four zones -- Simple, Complicated, Complex, and Chaotic -- map onto product types. A to-do application is Simple (high certainty, high agreement). A marketplace with dynamic pricing is Complex (low certainty, low agreement on optimal algorithms). AI tools reduce uncertainty in the Simple and Complicated zones by generating known-good implementations. In the Complex zone, they may increase uncertainty by generating confidently wrong code that passes superficial review.

### 2.3 The Productivity Frontier Shift with AI Tools

The empirical evidence on AI's productivity impact is substantial but contradictory, reflecting the context-dependent nature of AI assistance.

**Controlled experiments show large gains on narrow tasks.** Peng et al. (2023) found that developers with GitHub Copilot completed an HTTP server implementation 55.8% faster than controls in a randomized experiment with 95 professional programmers. The effect was stronger for less experienced developers.

**Controlled experiments show losses on complex, familiar codebases.** METR's 2025 randomized controlled trial -- 16 experienced open-source developers, 246 tasks, mature repositories averaging 10 years old and over 1 million lines of code -- found that AI tools made developers 19% slower. Developers expected AI to speed them up by 24% and believed it had sped them up by 20%, even after experiencing the slowdown. The acceptance rate for AI-generated code was below 44% (METR 2025). METR subsequently updated their experimental design in February 2026 to address methodological concerns, noting that the original results apply specifically to experienced developers working on familiar, large codebases.

**Observational data shows moderate aggregate gains.** DX's Q4 2025 report across 135,000+ developers found self-reported savings of 3.6 hours per week (4.1 for daily users), 22% of merged code AI-authored, and 60% higher PR throughput for daily AI users. Jellyfish's analysis of 2 million+ PRs found a 113% increase in PRs per engineer as AI adoption went from 0% to 100%, and a 24% reduction in median cycle time (Jellyfish 2025). However, self-reported time savings are known to overestimate actual productivity gains.

**Quality trade-offs accompany speed gains.** CodeRabbit's analysis of 470 open-source pull requests found AI-generated code produces 1.7x more issues per PR (10.83 vs. 6.45), with 2.74x more XSS vulnerabilities, 8x more performance inefficiencies from excessive I/O, and 3x more readability problems (CodeRabbit 2025). Sonar's 2026 survey of 1,100+ developers found 96% do not fully trust AI-generated code accuracy, yet only 48% always verify before committing (Sonar 2026).

**The DORA paradox: individual acceleration, organizational stasis.** The 2025 DORA report found AI coding assistants boost individual output -- 21% more tasks completed, 98% more PRs merged -- but organizational delivery metrics remain flat. AI adoption has a negative relationship with software delivery stability. The report identifies seven capabilities that amplify AI's positive impact, including robust version control, small-batch delivery, and strong internal platforms (DORA 2025).

The net picture: AI tools shift the productivity frontier rightward for implementation-heavy tasks, but the shift is smaller than perceived, accompanied by quality degradation, and does not extend to architecture, operations, or maintenance.

---

## 3. Taxonomy of Approaches

The following table classifies the eight build feasibility scoring approaches surveyed in this paper, organized by what each approach measures, the primary inputs required, the output format, and the development phase it addresses.

| # | Approach | Measures | Primary Inputs | Output | Phase |
|---|----------|----------|----------------|--------|-------|
| 1 | Product Complexity Classification | Architectural difficulty tier | Product requirements, feature list | Category: weekend/sprint/month/quarter | Planning |
| 2 | Infrastructure Dependency Mapping | External service and system requirements | Architecture diagram, feature requirements | Dependency graph with cost and risk scores | Planning |
| 3 | AI Tool Coverage Matrix | Fraction of work AI can accelerate | Task decomposition by type | Coverage percentage per task category | Planning/Implementation |
| 4 | COCOMO-AI Estimation | Effort in person-hours or person-months | Size estimate (KLOC/FP), cost drivers, AI factor | Effort, schedule, cost | Planning |
| 5 | Maintenance Burden Estimation | Ongoing operational cost ratio | Architecture, dependencies, user scale | Annual maintenance cost as % of build cost | Operations |
| 6 | Technical Debt Trajectory Analysis | Debt accumulation rate by architecture | Architecture choice, code metrics, time horizon | Debt trajectory curve, maintainability index | Lifecycle |
| 7 | Build-vs-Buy Decision Framework | Make-or-use decision for components | Component list, market alternatives, core vs. commodity | Build/buy/compose decision per component | Planning |
| 8 | Rapid Prototyping Feasibility Scoring | MVP scope and validation speed | Hypothesis list, feature priorities, fidelity targets | Scope-feasibility matrix, timeline estimate | Validation |

Each approach addresses a different facet of feasibility. No single approach provides a complete picture. Sections 4.1 through 4.8 examine each in detail.

---

## 4. Analysis

### 4.1 Product Complexity Classification

#### Theory & Mechanism

Product complexity classification assigns product ideas to timeline tiers based on architectural requirements rather than feature count. The insight is that a product with 50 features in a single domain (CRUD web app) may be simpler than a product with 5 features spanning multiple domains (real-time collaborative editor with payment processing). Classification schemes typically use a multi-axis model where each axis represents an independent complexity dimension.

The dominant classification in the AI-augmented development community uses four tiers:

- **Weekend (1-3 days):** Single-page applications, static sites with dynamic elements, browser extensions, CLI tools, single-API integrations. Architectural pattern: client-only or client + single managed backend. State: local or single-table.
- **Sprint (1-4 weeks):** Multi-page applications with authentication, CRUD operations on 3-10 entities, simple integrations (Stripe Checkout, email/SMS), content management. Architectural pattern: standard three-tier (frontend + API + database). State: relational, single-region.
- **Month (1-3 months):** Multi-role applications, complex business logic, multiple third-party integrations, search/filtering across large datasets, basic analytics dashboards, mobile applications via React Native or Flutter. Architectural pattern: modular monolith or simple service separation. State: relational + caching layer.
- **Quarter (3-6 months):** Marketplace platforms, real-time collaborative systems, applications with regulatory compliance (HIPAA, PCI-DSS, SOC 2), multi-tenant B2B products, applications requiring custom ML models. Architectural pattern: distributed services with event-driven communication. State: distributed, multi-region, eventually consistent.

The Cynefin framework provides theoretical grounding: weekend projects fall in the Clear domain, sprint projects in the Complicated domain, month projects span Complicated-to-Complex, and quarter projects are typically Complex (Snowden 2003). The Stacey Matrix adds nuance: requirement certainty and stakeholder agreement both decrease as tier increases.

#### Literature Evidence

Fenton and Bieman (2014) established that software project complexity is measured either through product attributes (size, coupling, cohesion) or process attributes (team coordination, requirement volatility). Their classification aligns with the tier model: low product complexity + low process complexity = weekend; high product complexity + high process complexity = quarter.

The Y Combinator W25 batch data showed that highly technical founders using 95% AI-generated codebases still required the full three-month accelerator period, suggesting that AI compresses the sprint tier into the weekend tier but does not compress the quarter tier (TechCrunch 2025). Hackathon data from 2025 confirms that functional MVPs with authentication, data persistence, and polished interfaces can be built in 48 hours with AI tools, consistent with the weekend tier definition (Devpost 2025).

#### Implementations & Benchmarks

No standardized, widely adopted product complexity classification tool exists. Practitioners use informal rubrics. The closest systematic implementations are:

- **Karpathy's "vibe coding" heuristic** (2025): AI-first development is "best suited for rapid prototyping, solo projects, internal tools, and throwaway weekend projects where speed matters more than long-term scalability." This implicitly defines the weekend tier as vibe coding's upper bound.
- **Netguru's MVP scoping framework** (2025): Classifies MVPs by technical complexity (low/medium/high) and business model complexity (simple/moderate/complex), producing a 3x3 matrix with estimated timelines.
- **The feasibility mapping for AI-augmented solo builders** (this research series): Classifies six product archetypes by AI feasibility tier, from frontend-only applications (highest feasibility, weekend-sprint) to marketplace platforms (lowest feasibility, quarter+).

#### Strengths & Limitations

**Strengths:** Provides immediate, intuitive guidance. Aligns with how practitioners actually plan. Incorporates architectural thinking, not just feature counting. The tier model is robust across different technology stacks.

**Limitations:** Boundaries between tiers are fuzzy and developer-dependent. Does not account for developer experience with specific technologies. Ignores operational complexity (a weekend build can require month-level maintenance). Classification is typically done once at project inception and not updated as scope evolves.

---

### 4.2 Infrastructure Dependency Mapping

#### Theory & Mechanism

Infrastructure dependency mapping identifies all external services, systems, and platforms a product requires, then assesses each dependency's cost, integration complexity, operational burden, and risk profile. The mechanism is straightforward: decompose the product into features, map each feature to required infrastructure, aggregate dependencies, and score the resulting dependency graph.

The key infrastructure categories for B2C products are:

| Category | Examples | Integration Complexity | Compliance Implications |
|----------|----------|----------------------|------------------------|
| Database | Supabase, PlanetScale, Neon, MongoDB Atlas | Low-Medium | Data residency, GDPR |
| Authentication | Clerk, Auth0, Supabase Auth, Firebase Auth | Low | Identity verification, CCPA |
| Payments | Stripe, Paddle, LemonSqueezy | Medium | PCI-DSS, tax compliance |
| Real-time | Supabase Realtime, Pusher, Ably, Socket.io | Medium-High | Data retention |
| File storage | S3, Cloudflare R2, Supabase Storage | Low | Content moderation |
| Email/SMS | Resend, Twilio, SendGrid | Low-Medium | CAN-SPAM, anti-spam |
| Search | Algolia, Meilisearch, Typesense | Medium | PII in indexes |
| Mobile SDK | Expo, React Native, Flutter | High | App Store review, crash reporting |
| AI/ML APIs | OpenAI, Anthropic, Replicate | Medium | Data processing agreements |
| CDN/Hosting | Vercel, Cloudflare, Fly.io | Low | Geographic restrictions |

Each dependency introduces three types of cost: initial integration effort, ongoing operational cost (API fees, monitoring), and risk exposure (vendor lock-in, API changes, service outages). The total infrastructure burden is not the sum but the product of dependencies, because cross-dependency interactions create emergent complexity. A payment system (Stripe) integrated with a real-time system (WebSockets) and a multi-role auth system (Clerk) is substantially more complex than any individual integration.

#### Literature Evidence

Application dependency mapping has become a formalized discipline in enterprise IT, with tools like Faddom providing agentless, passive discovery with real-time mapping (Faddom 2025). However, most dependency mapping research focuses on existing systems rather than prospective product planning. The software architecture community has studied infrastructure decisions through the lens of architectural technical debt, finding that "architecture tradeoffs are made early in development and have far-reaching consequences, resulting in expensive technical debt" (Verdecchia et al. 2021).

For payment infrastructure specifically, modular payment architecture has become the industry standard, with each module serving a dedicated purpose -- from processing payments to ensuring compliance. ISO 20022 compliance became mandatory in November 2025, adding a hard dependency for any product involving payment messaging (Nuvei 2026).

Compliance dependencies are particularly insidious because they create hidden coupling. GDPR, HIPAA, and PCI-DSS each require documentation and security controls over application dependencies, and dependency mapping tools help maintain compliance by providing audit trails and enforcing security policies (Faddom 2025). A B2C product that initially avoids compliance requirements (e.g., storing only email addresses) may trigger them through scope creep (e.g., adding payment processing, health data, or children's data).

#### Implementations & Benchmarks

- **Faddom** and similar tools provide automated dependency mapping for running systems but are not designed for prospective product planning.
- **Cloudaware's 5-step strategy** for infrastructure dependency mapping provides a systematic framework: discover, map, visualize, analyze, monitor. This is applicable to prospective planning with modification.
- **Architecture Decision Records (ADRs)** document infrastructure choices and their rationale but do not score dependency risk.
- **The "dependency weight" scoring approach** used by some indie developer communities assigns weights of 1 (managed service, no compliance), 2 (managed service with compliance), 3 (self-hosted required), and 5 (custom implementation required) to each dependency, then sums weights. Scores below 10 indicate weekend-sprint feasibility; 10-25 indicate month; above 25 indicate quarter.

#### Strengths & Limitations

**Strengths:** Makes hidden dependencies explicit before development begins. Forces consideration of compliance requirements early. Provides a concrete cost model for ongoing operations. Dependency graphs can be updated as architecture evolves.

**Limitations:** Requires architecture decisions before building, creating a chicken-and-egg problem for exploratory projects. Dependency weights are subjective and vary by developer experience. Does not capture the interaction effects between dependencies (the combinatorial complexity). Vendor-specific knowledge becomes stale quickly as managed services add capabilities.

---

### 4.3 AI Tool Coverage Matrix

#### Theory & Mechanism

An AI tool coverage matrix estimates what fraction of total development effort can be meaningfully accelerated by AI tools, broken down by task category and product type. The mechanism decomposes development into task categories (UI implementation, API development, database design, testing, DevOps, documentation, design, copywriting) and estimates AI's acceleration factor for each category. The weighted sum produces an overall AI coverage fraction for the product.

The coverage matrix concept rests on a decomposition of development work into layers with different AI amenability:

| Task Category | AI Coverage (2026 est.) | Evidence Basis |
|---------------|------------------------|----------------|
| UI/Frontend implementation | 70-85% | V0, Bolt.new, Lovable generate complete UIs; Render benchmark confirms high quality |
| CRUD API development | 65-80% | Agentic assistants handle standard patterns well (Render 2025) |
| Database schema design | 50-65% | AI generates schemas but misses normalization edge cases |
| Authentication/Authorization | 40-60% | Managed services (Clerk, Auth0) reduce to configuration; AI assists configuration |
| Payment integration | 30-50% | Stripe has excellent docs that AI leverages; edge cases require human judgment |
| Real-time systems | 20-35% | WebSocket, pub-sub patterns partially generated; race conditions missed |
| Testing | 55-70% | Test generation accelerated 60% (TestQuality 2026); business risk assessment remains human |
| DevOps/Deployment | 40-55% | Docker, CI/CD config well-handled; production debugging remains human |
| Compliance implementation | 10-25% | Regulatory interpretation and audit preparation require human expertise |
| Mobile-specific code | 35-55% | React Native/Flutter scaffolding good; platform-specific bugs require human debugging |
| UX/UI design | 50-70% | Figma AI, V0; designers report 50-70% time reduction (NxCode 2026) |
| Copywriting/Content | 75-90% | Strong AI capability; brand voice calibration still human |

The product-level AI coverage is computed by weighting these task-level coverages by the fraction of total effort each task represents for a given product type. A frontend-only application with 60% UI work and 20% testing has an overall AI coverage of approximately 70%. A marketplace platform with 15% UI, 15% APIs, 20% real-time, 15% payments, 15% compliance, and 20% testing has an overall AI coverage of approximately 40%.

#### Literature Evidence

The Stack Overflow 2025 survey provides the adoption context: 84% of developers use or plan to use AI tools, and 51% use them daily. However, trust in AI accuracy has fallen from 40% to 29% year-over-year, and the biggest frustration (66% of developers) is "AI solutions that are almost right, but not quite" (Stack Overflow 2025). This "almost right" problem disproportionately affects high-coverage task categories -- AI generates 90% of a UI component, and the developer spends significant time debugging the remaining 10%.

Jellyfish data shows that companies with 100% AI adoption see a 113% increase in PR throughput, but this measures output volume, not value delivery. The DORA 2025 finding that organizational delivery metrics remain flat despite individual acceleration suggests that AI coverage of implementation does not translate linearly to AI coverage of the overall product lifecycle.

The Sonar 2026 survey adds a critical nuance: "The burden of work has moved from creation to verification and debugging." 38% of developers report that reviewing AI-generated code requires more effort than reviewing human code. This implies that raw AI coverage percentages overstate the net acceleration, because high AI coverage in creation may be partially offset by increased verification burden.

#### Implementations & Benchmarks

- **The Render agent benchmark** (2025) provides task-level performance data for specific AI tools (Cursor, Claude Code, Gemini CLI, OpenAI Codex) across baseline full-stack apps, large Go monorepos, and Astro.js websites. Cursor scored 9/10 on code quality for baseline tasks but struggled with non-standard codebases.
- **SWE-bench Verified** ranks 77 AI models on real-world GitHub issue resolution. Claude Opus 4.5 leads at 80.9%, with an average across all models of 62.2% (SWE-bench 2026). SWE-bench Pro, which uses 1,865 uncontaminated multi-language tasks, shows lower scores, with 46% from the leading system.
- **DX's AI coverage metrics**: 22% of merged code AI-authored across 135,000+ developers (DX 2025). This is an observed coverage rate, not a theoretical maximum.
- **Panto's industry analysis** (2026): 90% of software development professionals use AI tools; almost half of companies have 50%+ AI-generated code.

#### Strengths & Limitations

**Strengths:** Provides a quantitative framework for comparing product types. Decomposition by task category allows targeted analysis. Can be updated as AI tools improve. Integrates with estimation models (multiply task effort by (1 - coverage fraction) to estimate AI-adjusted effort).

**Limitations:** Coverage percentages are estimates, not measurements. The "almost right" problem means 80% coverage does not mean 80% time savings -- it may mean 60% time savings plus 20% additional debugging. Coverage varies dramatically by developer skill, codebase maturity, and tool choice. Does not capture the interaction between task categories (AI-generated frontend code may create integration bugs with AI-generated backend code).

---

### 4.4 COCOMO-Style Estimation Adapted for AI-Augmented Development

#### Theory & Mechanism

The traditional COCOMO II effort equation is:

    E = a * (Size)^b * Product(EM_i)

where E is effort in person-months, Size is measured in KLOC or function points, b is determined by five scale factors (precedentedness, development flexibility, architecture/risk resolution, team cohesion, process maturity), and EM_i are 17 effort multipliers covering product, platform, personnel, and project attributes.

Adapting COCOMO for AI-augmented development requires three modifications:

1. **AI Augmentation Factor (AAF).** A proposed new effort multiplier ranging from 0.5 (maximal AI assistance, well-suited tasks) to 1.5 (AI hindrance, unsuitable tasks), applied to the effort calculation. An AAF of 0.7 means AI reduces effort to 70% of the baseline estimate. The METR 2025 study suggests AAF > 1.0 (approximately 1.19) for experienced developers on familiar, complex codebases, while Peng et al. 2023 suggest AAF approximately 0.64 for straightforward implementation tasks with less experienced developers.

2. **Task Decomposition with Differential AAF.** Rather than applying a single AAF to the entire project, decompose the project into task categories (as in Section 4.3) and apply different AAFs to each. The aggregate effort becomes the sum of category-level efforts, each with its own AAF. This captures the reality that AI helps greatly with UI implementation (AAF = 0.4) but may hinder compliance work (AAF = 1.2).

3. **Modified Personnel Multipliers.** AI tools change the meaning of personnel capability multipliers. "Programmer capability" (PCAP) in COCOMO II measures the development team's ability. With AI augmentation, PCAP should arguably reflect the team's ability to direct and verify AI output, not just write code directly. Similarly, "applications experience" (APEX) may become less important for boilerplate tasks but more important for architectural decisions.

#### Literature Evidence

Boehm's original COCOMO validation used data from 63 projects at TRW (Boehm 1981). COCOMO II was calibrated on 161 projects (Boehm et al. 2000). Both datasets predate AI tools entirely. No published validation of COCOMO with AI augmentation factors exists using comparable rigor, as of March 2026.

The closest empirical grounding comes from combining multiple studies:
- Peng et al. (2023): 55.8% faster on isolated implementation tasks -> AAF approximately 0.64 for implementation.
- METR (2025): 19% slower on complex maintenance tasks in familiar codebases -> AAF approximately 1.19 for maintenance.
- DX (2025): 3.6 hours/week saved (self-reported) out of approximately 40-hour weeks -> approximately 9% time reduction -> AAF approximately 0.91 aggregate.
- Jellyfish (2025): 24% cycle time reduction at full adoption -> AAF approximately 0.76 for throughput-measured tasks.
- A large-scale deployment study (ArXiv 2509.19708, 2025) across 300 engineers over 12 months found a 33.8% cycle time reduction (p = 0.0018) and 29.8% review time reduction (p = 0.0076).

The variance across studies reflects the context-dependency of AI's impact. Any COCOMO-AI model must account for this variance, either through task-level AAFs or through wide confidence intervals on a single AAF.

A recent systematic review of AI-based approaches for software task effort estimation (Scitepress 2025) catalogues methods from 2014-2024 applying machine learning to estimation, finding that random forest and gradient boosting models consistently outperform parametric models when sufficient historical data is available.

#### Implementations & Benchmarks

- **QSM's SLIM tool** implements Putnam model estimation and has been updated with productivity adjustment factors, though not specifically for AI augmentation.
- **ISBSG database** contains data on 11,000+ completed projects with effort, size, and productivity metrics. Recent work uses COSMIC size data from ISBSG to train ML-based effort estimators (ISBSG 2025). This database does not yet contain AI-augmented project data at scale.
- **ScopeMaster** automates COSMIC function point sizing from natural language requirements, potentially enabling rapid size estimation for AI-augmented projects.
- **Dave Browett's COCOMO-AI adaptation** (2025) proposes adjusting COCOMO effort multipliers by task type, suggesting separate multipliers for "AI-amenable" and "AI-resistant" work.

#### Strengths & Limitations

**Strengths:** Builds on six decades of estimation research. Provides quantitative, auditable estimates. The effort multiplier framework naturally accommodates AI as an additional multiplier. Can be calibrated to organizational data as AI-augmented project histories accumulate.

**Limitations:** Requires size estimates (KLOC or FP) that are themselves uncertain at planning time. The AAF values are not empirically validated at scale. COCOMO was designed for large teams and waterfall-adjacent processes; solo developer dynamics differ fundamentally. The model assumes effort scales with size, but AI tools may create a step function (trivial below a complexity threshold, suddenly non-trivial above it) rather than a smooth curve.

---

### 4.5 Maintenance Burden Estimation

#### Theory & Mechanism

Maintenance burden estimation models the ongoing cost of operating, updating, and supporting a deployed product. The classic finding is that maintenance consumes 40-90% of total software lifecycle costs (Vention 2024; Finoit 2025). For AI-augmented development, maintenance burden estimation is critical because AI tools dramatically compress initial build time, potentially masking high maintenance costs. A product that takes one weekend to build with AI may require 10 hours per month to maintain -- a maintenance burden ratio that makes the "weekend project" classification misleading.

The three primary estimation approaches are:

1. **Knowledge-based modeling.** Expert judgment estimates maintenance effort based on architectural complexity, dependency count, user scale, and operational requirements. This is the most common approach for solo developers and is typically applied informally.

2. **Algorithmic modeling.** Parametric models (extensions of COCOMO, SLIM) estimate maintenance as a percentage of initial development effort, adjusted by maintenance-specific factors including code quality, documentation completeness, test coverage, and architectural simplicity. Industry benchmarks suggest 15-20% of initial development cost annually for maintenance, though this varies widely by product type (Product School 2026).

3. **Machine learning modeling.** Recent approaches like ML-PEQRM estimate software quality, reliability, and maintenance costs based on code complexity, maintainability metrics, and size (IRJMS 2025). These models can incorporate AI-generated code quality data (e.g., CodeRabbit's finding of 1.7x more issues in AI code).

The maintenance burden for AI-augmented builds has a distinctive signature: low initial effort combined with elevated ongoing effort due to AI-generated code quality issues. If AI code has 1.7x more issues (CodeRabbit 2025) and performance inefficiencies appear 8x more often, the maintenance curve rises more steeply than for human-authored code. Cloud migration can reduce total cost of ownership by 30-40% (SciSoft 2025), offsetting some of this elevation through managed infrastructure.

Key maintenance cost drivers for B2C products:

| Cost Driver | Monthly Estimate (Solo Dev) | Scaling Factor |
|-------------|---------------------------|----------------|
| Hosting/Infrastructure | $20-500 | Grows with users/data |
| Third-party API fees | $0-2,000 | Per-API-call or per-user |
| Security patches/updates | 2-8 hours | Grows with dependency count |
| Dependency updates | 2-4 hours | Grows with dependency count |
| Bug fixes (user-reported) | 4-16 hours | Grows with user count |
| Feature requests triage | 2-8 hours | Grows with user count |
| Customer support | 4-20 hours | Grows with user count |
| Monitoring/alerting | 1-4 hours | Grows with system complexity |

#### Literature Evidence

A 2024 ISBSG analysis of software cost estimation for maintenance and support provides industry benchmarks based on functional size measurements. The IEEE 2025 critical review of software maintenance cost estimation models identifies a shift toward data-driven approaches using machine learning, finding that ensemble models combining multiple estimators outperform single-model approaches.

The SciSoft analysis (2025) establishes that four types of maintenance -- corrective (bug fixing), adaptive (environment changes), perfective (feature enhancements), and preventive (refactoring) -- have different cost profiles. For AI-augmented builds, corrective maintenance is expected to be higher (due to AI code quality issues), adaptive maintenance similar (environment changes are independent of authorship), perfective maintenance potentially lower (AI can assist with enhancements), and preventive maintenance higher (AI-generated code may require more refactoring).

Critically, the most common misstep identified across multiple sources is underestimating total cost of ownership by budgeting only for development and launch, forgetting ongoing hosting, API fees, monitoring, support, and user acquisition costs. A safe rule of thumb is to reserve 10-20% of total project budget for unexpected costs (Biz4Group 2025).

#### Implementations & Benchmarks

- **ISBSG Maintenance Repository** provides benchmarking data for maintenance effort estimation.
- **SonarQube/SonarCloud** measures technical debt in time-to-fix units, providing a proxy for maintenance burden. The maintainability index formula (171 - 5.2 * ln(Halstead Volume) - 0.23 * Cyclomatic Complexity - 16.2 * ln(LOC)) produces a 0-100 score where higher values indicate lower maintenance burden.
- **The "grey journal" solo dev stack analysis** (2026) estimates the modern solo builder stack at $3,000-$12,000/year, providing a baseline for infrastructure maintenance costs.
- **Stripe's 2024 Indie Founder Report** found that over 44% of profitable SaaS businesses are run by solo founders, suggesting that maintenance burden is manageable for certain product types.

#### Strengths & Limitations

**Strengths:** Forces consideration of lifecycle costs, not just build costs. Provides a reality check on "weekend project" classifications. Can be estimated with reasonable accuracy using dependency counts and user scale projections. Integrates naturally with infrastructure dependency mapping.

**Limitations:** Maintenance burden is inherently uncertain and depends heavily on user adoption trajectory. AI-generated code maintenance data is limited (CodeRabbit's 470 PRs is a small sample). The model assumes steady-state operations; it does not capture crisis events (security breaches, vendor shutdowns). Solo developers have highly variable maintenance efficiency depending on experience and tooling.

---

### 4.6 Technical Debt Trajectory Analysis

#### Theory & Mechanism

Technical debt, a metaphor coined by Ward Cunningham in 1992, frames suboptimal code as financial debt: "Shipping first time code is like going into debt. A little debt speeds development so long as it is paid back promptly with a rewrite... The danger occurs when the debt is not repaid. Every minute spent on not-quite-right code counts as interest on that debt" (Cunningham 1992).

Martin Fowler's Technical Debt Quadrant (2009) classifies debt along two axes:

|  | **Prudent** | **Reckless** |
|--|-------------|-------------|
| **Deliberate** | "We know we're taking a shortcut and will fix it" | "We don't have time for design" |
| **Inadvertent** | "We didn't know a better approach until now" | "What's layering?" |

For AI-augmented development, a new dimension emerges: **AI-introduced debt**. AI tools generate code that is functional but may be architecturally suboptimal, inconsistently patterned, or poorly factored. This debt is often inadvertent-prudent (the developer does not realize the AI's architectural choices are suboptimal) or inadvertent-reckless (the developer does not understand the generated code well enough to evaluate it). CodeRabbit's finding of 3x more readability problems and 8x more performance inefficiencies in AI-generated code quantifies the scale of AI-introduced debt.

Technical debt trajectory analysis models how debt accumulates over time for different architectural choices. The key insight is that debt does not grow linearly -- it compounds, like financial interest. Architecture decisions made at project inception (monolith vs. microservices, relational vs. document database, server-rendered vs. SPA) determine the debt accumulation rate, and AI-generated code modifies this rate.

**Architecture-specific debt trajectories for AI-augmented builds:**

- **Monolith (AI-generated):** Fast initial build, moderate debt accumulation. AI generates coherent code within a single codebase. Debt concentrates in growing function complexity and coupling. The modular monolith pattern mitigates this by enforcing module boundaries.
- **Microservices (AI-generated):** Fast per-service build, rapid debt accumulation at service boundaries. AI generates individual services well but does not maintain consistent contracts, error handling, or observability across services. "Services without clear ownership become orphaned and accumulate technical debt" (Medium 2025). This pattern is particularly dangerous for solo developers who cannot maintain ownership of many services.
- **Serverless (AI-generated):** Very fast initial build, debt accumulates in configuration complexity and vendor coupling. Amazon found a 90% cost reduction when consolidating dozens of Lambda functions into a single modular service, illustrating how serverless debt manifests as infrastructure sprawl rather than code complexity.
- **Modular monolith (AI-generated):** Emerging as the recommended architecture for AI-augmented solo developers. Enforces module boundaries while keeping deployment simple. In 2025-2026, "more enterprises are circling back to monolithic deployments -- this time modular" after wrestling with microservice sprawl (Foojay 2025).

A 2026 ScienceDirect study explored the evolution of technical debt in monolithic and hybrid microservice architectures through an industrial case study, finding that hybrid architectures accumulate debt at service boundaries faster than within services (Paudel et al. 2026).

#### Literature Evidence

Verdecchia et al. (2021) built and evaluated a theory of architectural technical debt in software-intensive systems, establishing that architecture decisions that incur technical debt are often made early and have compounding consequences. The ATDx approach (Architectural Technical Debt Index) uses a clustering algorithm to calculate severity levels of architectural rule violations, aggregating results across technical debt dimensions (PMC 2022). A 2025 systematic mapping study catalogued methods for architecture technical debt management and prioritization from 2018-2023.

The challenge of detecting architectural debt is severe: only 0.13% of technical debt items identified across large codebases were classified as architectural (116 out of 8,812), suggesting that the most consequential form of debt is the least visible (ArXiv 2501.15387, 2025). A 2025 reframing of technical debt (ArXiv 2505.13009) argues that contextual knowledge -- such as inferior or outdated technology choices -- is typically not reported in metrics but well-understood by developers. For AI-augmented builds, this contextual knowledge is precisely what the developer may lack, because AI tools do not communicate architectural trade-offs.

Code-level complexity metrics provide quantitative inputs for debt trajectory analysis:
- **Cyclomatic complexity** (McCabe 1976): counts independent execution paths. Spotify reduced average cyclomatic complexity from 15 to 8 by breaking down complex functions, leading to 30% fewer bugs and 20% faster feature development.
- **Cognitive complexity** (SonarSource): measures human comprehension difficulty, considering nesting depth and control flow breaks.
- **Halstead metrics**: quantify code structure through operator and operand vocabulary.
- **Maintainability Index**: composite of Halstead Volume, Cyclomatic Complexity, and LOC, producing a 0-100 score.

#### Implementations & Benchmarks

- **SonarQube/SonarCloud** calculates technical debt in time-to-fix units and tracks debt trajectory over time. The maintainability rating (A-E) provides a categorical debt assessment.
- **CodeClimate** provides a similar maintainability GPA (A-F) and tracks debt trend.
- **vFunction** provides architectural observability and technical debt measurement, particularly for monolith-to-microservices decisions.
- **Netflix's Chaos Monkey** used complexity metrics to reduce average cyclomatic complexity by 25%, demonstrating that metric-driven debt reduction is achievable at scale.
- **CodeRabbit** provides per-PR debt assessment for AI-generated code specifically.

#### Strengths & Limitations

**Strengths:** Provides a long-term perspective that other approaches miss. Quantifiable through code metrics. Architecture-specific trajectories give actionable guidance (e.g., "choose modular monolith for AI-augmented solo builds"). Debt trajectory analysis directly informs the maintenance burden estimate.

**Limitations:** Debt accumulation is stochastic, not deterministic -- a single bad architectural decision can spike debt unpredictably. Current metrics (cyclomatic complexity, maintainability index) were designed for human-authored code and may not capture AI-specific debt patterns (e.g., working-but-non-idiomatic code). Detecting architectural debt remains extremely difficult (0.13% detection rate). The compound interest metaphor, while intuitive, oversimplifies -- debt sometimes resolves itself (when deprecated code is removed) or becomes irrelevant (when the product pivots).

---

### 4.7 Build-vs-Buy Decision Frameworks

#### Theory & Mechanism

Build-versus-buy decision frameworks determine whether each component of a product should be custom-built, purchased as a service, or composed from existing open-source tools. For AI-augmented solo developers, this framework is particularly consequential because AI tools change the economics of building -- custom code is cheaper to produce -- while simultaneously changing the economics of maintenance -- custom code is more expensive to maintain due to AI quality issues.

The dominant framework uses three categories:

- **Core (build):** Components that represent competitive advantage or unique value proposition. These should be custom-built because differentiation is the goal.
- **Context (buy/compose):** Components that are necessary but not differentiating -- authentication, payments, email, hosting. These should use managed services because they are commodity.
- **Connect (integrate):** Components that bridge core and context -- API integrations, data transformations, workflow automation. These are the "glue" that AI tools handle well.

The "buy 80%, build 20%" rule of thumb suggests that approximately 80% of a B2C application should be commodity (context + connect) and only 20% should be core (ThirstySprout 2025). AI tools are most effective on the connect layer and least effective on the core layer, creating an alignment: use AI for glue code and managed services for commodity infrastructure, reserving human engineering for the differentiating core.

The agentic tooling spectrum -- No-Code, Low-Code, Framework-Based, Full Custom -- provides a finer-grained decision framework (Agentic Web 2025). Each level trades speed for control: no-code platforms (Bubble, Softr) give maximum speed but minimum control; full custom development (Next.js + Supabase + Stripe) gives maximum control but minimum speed. AI tools compress the speed difference between levels without fully eliminating it.

#### Literature Evidence

Total cost of ownership (TCO) analysis over a 3-year horizon is the standard methodology for build-vs-buy decisions (Product School 2026; AppInventiv 2026). The typical calculation budgets 15-20% of initial development cost annually for maintenance. For AI-augmented builds where initial development cost is lower (due to AI acceleration), the ratio shifts: maintenance may exceed 20% of annual cost because the absolute maintenance burden is determined by product complexity, not by how quickly the product was built.

The CIO.com analysis (2025) identifies the key decision factors: whether the function represents core IP or competitive advantage; uniqueness of requirements (industry-standard vs. distinctive workflows); availability and maturity of commercial alternatives; vendor lock-in risk; and internal expertise.

For AI-era solo developers specifically, the Agentic Web Blueprint (2025) provides a decision tree: start with managed services for all context components; use AI coding tools for connect components; build only the core differentiator manually; and only move to custom infrastructure if user scale demands it.

#### Implementations & Benchmarks

- **Product School's TCO calculator** (2026) provides a structured template for 3-year build-vs-buy analysis, including initial development, ongoing maintenance, opportunity cost, and vendor fees.
- **Neontri's 3-Model Decision Framework** evaluates build-vs-buy across capability fit, cost trajectory, and strategic alignment.
- **The "indie hacker stack" pattern:** Solo developers converge on a standard stack -- Next.js/Remix, Supabase, Vercel, Stripe, Clerk, Resend -- that represents the "buy" decision for all context components. This stack costs $50-200/month at low scale and provides database, auth, hosting, payments, and email out of the box.
- **Dev.to's solo dev SaaS stack analysis** (2025) documents the specific tool choices powering $10K/month micro-SaaS products, demonstrating that the buy-heavy approach is economically viable for revenue-generating solo products.

#### Strengths & Limitations

**Strengths:** Reduces scope by eliminating components that should not be custom-built. Aligns AI tool usage with where AI is most effective (connect/glue layer). Forces identification of the core differentiator. TCO analysis provides a financial framework for decision-making.

**Limitations:** The "core" identification is subjective and often wrong at project inception -- founders frequently misidentify what will be differentiating. Managed services create vendor dependency that may become problematic at scale. The "buy 80%" heuristic assumes mature managed service ecosystems, which may not exist for novel product categories. AI tools are blurring the boundary between build and buy -- if AI can generate a payment integration in an hour, is it still "building"?

---

### 4.8 Rapid Prototyping Feasibility Scoring

#### Theory & Mechanism

Rapid prototyping feasibility scoring evaluates whether a product idea can be validated through a prototype within a given timeframe and budget, calibrating MVP scope to learning goals rather than feature completeness. The mechanism uses a sequential risk-reduction model: Proof of Concept (PoC) de-risks technology, Prototype de-risks usability, and MVP de-risks the market (TechMagic 2025).

The core principle is hypothesis-driven scope: each feature in the MVP must be attached to a testable hypothesis about user behavior. The Prototype Validation Grid pairs user tasks with success criteria and probes that confirm or refute underlying assumptions (Arrow North 2025). Features that do not validate a hypothesis are removed from MVP scope, regardless of how easy they are to implement.

For AI-augmented development, the feasibility scoring framework has three dimensions:

1. **Hypothesis coverage:** What fraction of critical hypotheses can be tested with a buildable prototype? If the core hypothesis requires a real-time collaborative feature (e.g., "users will co-edit documents simultaneously"), and real-time is in the quarter tier, then the MVP timeline expands regardless of AI assistance.

2. **Fidelity-to-learning mapping:** What prototype fidelity is required to validate each hypothesis? High-fidelity prototypes (production-quality UI, real data) are faster to build with AI than without, compressing the timeline. Low-fidelity prototypes (wireframes, clickable mockups) were already fast and gain less from AI assistance.

3. **Build-test cycle time:** How quickly can the team iterate from build to test to learn? AI tools compress the build step but not the test and learn steps. The overall cycle time improvement depends on how much of the cycle is build-dominated vs. test-dominated.

The design-led MVP framework uses a Value-vs-Effort matrix to prioritize features, a Design Sprint to compress discovery, and a prototyping strategy that maps fidelity to learning goals. The rule of thumb: "choose the lowest fidelity prototype capable of validating each hypothesis" (Wolf X 2025).

#### Literature Evidence

Modern MVP development in 2025-2026 has been transformed by AI tools. Netguru's analysis (2025) documents that MVP development that previously took months can now be completed in weeks, with founders describing a product idea on Monday and having a working prototype by Tuesday. However, the classic risk of MVPs -- building a feature-complete product instead of a learning-focused prototype -- is amplified by AI tools. Because AI makes building features cheap, the temptation to add "just one more feature" increases, leading to scope creep that defeats the purpose of rapid validation.

The BayTech Consulting framework (2025) for enterprise rapid prototyping distinguishes between innovation theater (prototypes that are never intended to scale) and genuine rapid innovation (prototypes designed with a path to production). AI tools make innovation theater easier and more convincing, potentially increasing organizational investment in ideas that were never feasible at production scale.

Hackathon data provides the strongest evidence for rapid prototyping timelines with AI tools. In 2025, winning hackathon projects incorporate AI in 65% of cases, and judges expect live demos with public URLs, functioning authentication, real data persistence, and polished interfaces -- all built in 48 hours. This establishes the empirical upper bound of what can be prototyped in a weekend with AI augmentation.

#### Implementations & Benchmarks

- **Lovable's prototype-to-production pipeline:** Generates complete applications from natural language descriptions with Supabase backend integration, enabling prototype-level products in hours.
- **Bolt.new v2:** Autonomous debugging reduced error loops by 98%, making rapid prototyping more reliable (DesignMonks 2025).
- **Classic Informatics' MVP scoping framework** (2025): Provides a structured approach to defining MVP scope using user stories prioritized by business value and technical complexity.
- **Bobcat's Rapid MVP Program:** Tests product concepts in 6 weeks, providing a commercial benchmark for AI-augmented MVP timelines.
- **Google Cloud's vibe coding guide** (2026): Positions vibe coding as the prototyping methodology for AI-first development, suitable for "rapid prototyping, solo projects, internal tools, and throwaway weekend projects."

#### Strengths & Limitations

**Strengths:** Directly addresses the product ideation use case. Focuses on learning speed rather than build speed. Hypothesis-driven scope calibration prevents over-building. AI tools naturally align with prototype-level fidelity requirements.

**Limitations:** Feasibility scoring for prototypes does not predict production feasibility. The gap between "demoable prototype" and "production product" can be orders of magnitude in effort, and AI tools compress the former much more than the latter. The "almost right" problem (Stack Overflow 2025) is acceptable in prototypes but catastrophic in production. Rapid prototyping feasibility scoring does not account for the technical debt introduced by prototype-quality AI-generated code that survives into production.

---

## 5. Comparative Synthesis

The following table synthesizes the eight approaches across seven evaluation dimensions. Each cell uses a three-level rating: High, Medium, Low.

| Approach | Accuracy | Effort to Apply | AI-Awareness | Lifecycle Coverage | Quantitative Output | Composability | Maturity |
|----------|----------|-----------------|-------------|-------------------|--------------------|--------------|---------|
| 4.1 Complexity Classification | Medium | Low | Medium | Planning only | Low (categories) | High | Low |
| 4.2 Infrastructure Dependency Mapping | Medium-High | Medium | Low | Planning + Ops | Medium (cost scores) | High | Medium |
| 4.3 AI Tool Coverage Matrix | Medium | Medium | High | Implementation | High (percentages) | High | Low |
| 4.4 COCOMO-AI Estimation | Medium-High | High | Medium | Full lifecycle | High (person-hours) | Medium | High (foundation) / Low (AI adaptation) |
| 4.5 Maintenance Burden Estimation | Medium | Medium | Medium | Operations | High (cost ratios) | High | Medium |
| 4.6 Technical Debt Trajectory | Medium | High | Medium | Full lifecycle | High (metrics) | Medium | Medium |
| 4.7 Build-vs-Buy Framework | Medium | Low-Medium | Medium | Planning | Low (decisions) | High | High |
| 4.8 Rapid Prototyping Scoring | Medium | Low | High | Validation only | Medium (timelines) | Medium | Low |

**Cross-cutting observations:**

1. **No single approach covers the full lifecycle.** Complexity classification and rapid prototyping scoring address only the planning/validation phase. Maintenance burden estimation addresses only operations. A composite model requires at least three approaches: one for planning (4.1 or 4.8), one for estimation (4.3 or 4.4), and one for lifecycle projection (4.5 or 4.6).

2. **AI-awareness is inversely correlated with theoretical maturity.** The most AI-aware approaches (coverage matrices, rapid prototyping scoring) have the weakest theoretical foundations. The most theoretically mature approaches (COCOMO, technical debt) have the weakest AI adaptations.

3. **Quantitative approaches require inputs that are uncertain at planning time.** COCOMO-AI requires size estimates. Maintenance burden estimation requires user scale projections. Technical debt analysis requires architecture decisions. All of these are uncertain when product ideation begins, creating a bootstrapping problem.

4. **All approaches underweight the "almost right" problem.** AI tool coverage of 70% does not mean 70% less work. It means 70% of the code is generated but some fraction requires debugging, and the debugging effort is harder to estimate than the generation effort. This systematic bias toward optimism is the single largest risk in AI-augmented feasibility scoring.

5. **The interaction between approaches reveals emergent constraints.** Infrastructure dependency mapping may reveal that a product requires PCI-DSS compliance. The AI tool coverage matrix shows compliance work at 10-25% AI coverage. The COCOMO-AI estimate must then apply AAF = 1.0+ to the compliance work. The maintenance burden estimate must add compliance-specific ongoing costs. These interactions are not captured by any single approach but are essential for accurate scoring.

6. **Developer experience is the hidden variable.** Every approach implicitly assumes a developer skill level. A senior developer with 10 years of experience will classify a "month" project differently than a junior developer. AI tools partially equalize this -- Peng et al. (2023) found Copilot benefits were strongest for less experienced developers -- but the equalization is incomplete, particularly for architecture and operational decisions.

---

## 6. Open Problems & Gaps

### 6.1 Absence of Validated AI Augmentation Factors

No published, peer-reviewed study provides validated AI augmentation factors (AAFs) across a representative sample of product types, developer experience levels, and AI tool configurations. The METR study (N=16), Peng et al. (N=95), and DX survey (N=135,000 self-reported) each measure different aspects under different conditions. A comprehensive calibration study -- dozens of product types, hundreds of developers, randomized AI access -- does not exist.

### 6.2 The Prototype-to-Production Gap

Current feasibility scoring does not adequately model the gap between a functional prototype and a production-grade product. AI tools compress prototyping dramatically but may actually increase the prototype-to-production gap by generating code that works for demos but fails under production conditions (edge cases, concurrent users, security attacks). No quantitative model of this gap exists.

### 6.3 AI-Generated Technical Debt Characterization

The specific nature and accumulation rate of technical debt introduced by AI tools is not well characterized. CodeRabbit's 470-PR study provides initial data, but debt trajectory analysis requires longitudinal data -- tracking AI-generated codebases over 12-36 months. Such longitudinal studies are only now becoming possible as AI-augmented projects mature.

### 6.4 Maintenance Burden Data for AI-Augmented Products

Industry maintenance benchmarks (40-90% of lifecycle cost) predate AI-augmented development. Whether AI-generated products have higher, lower, or similar maintenance burdens is unknown empirically. The theoretical prediction (higher, due to 1.7x more issues) has not been validated with production data at scale.

### 6.5 Dynamic Feasibility Scoring

All surveyed approaches produce static scores at a point in time. Product requirements evolve, AI tools improve, managed services add capabilities, and user scale changes. A dynamic feasibility scoring system that updates estimates based on changing inputs does not exist, though the DORA 2025 report's seven capabilities model hints at organizational prerequisites for continuous estimation.

### 6.6 Composite Scoring Methodology

No published methodology combines the eight approaches into a single, coherent feasibility score with quantified trade-offs and confidence intervals. Practitioners combine approaches informally, but the weighting, interaction effects, and calibration of a composite model remain open research questions.

---

## 7. Conclusion

Build feasibility scoring for AI-augmented development teams is an emerging discipline at the intersection of software estimation theory, complexity science, and empirical AI productivity research. The eight approaches surveyed -- product complexity classification, infrastructure dependency mapping, AI tool coverage matrices, COCOMO-AI estimation, maintenance burden estimation, technical debt trajectory analysis, build-versus-buy frameworks, and rapid prototyping feasibility scoring -- each illuminate a different facet of the feasibility question. No single approach is sufficient. The empirical evidence consistently shows that AI tools compress the implementation phase of development (Peng et al. 2023 report a 55.8% speedup on implementation tasks; Jellyfish 2025 finds a 113% increase in PR throughput at full adoption) but leave architecture, infrastructure, operations, and maintenance largely unchanged (METR 2025 finds a 19% slowdown on complex maintenance; DORA 2025 finds organizational delivery metrics flat despite individual acceleration).

For B2C product ideation, the practical implications are stark. Weekend-tier products (client-side apps, static sites with dynamic elements, single-API tools) see genuine feasibility compression from AI tools -- an experienced developer can build in hours what previously took days. Sprint-tier products (multi-entity CRUD, simple SaaS with auth and payments) see moderate compression -- weeks become days to two weeks. Month-tier products (multi-role platforms, complex integrations, mobile apps) see modest compression -- months become weeks to months. Quarter-tier products (marketplaces, real-time collaboration, compliance-heavy systems) see minimal compression -- quarters remain quarters, with the implementation phase shortened but architecture, operations, and compliance phases unchanged.

The field's central challenge is calibration. Without validated AI augmentation factors, longitudinal maintenance data, and composite scoring methodologies, feasibility estimates remain expert judgment augmented by partial quantification. The six open problems identified in this survey -- absence of validated AAFs, the prototype-to-production gap, AI-generated debt characterization, maintenance burden data, dynamic scoring, and composite methodology -- define the research agenda for the next generation of build feasibility scoring.

---

## References

Agarwal, A. (2025). "New Rules for Estimating Software Development Time in AI-era." Medium. https://toashishagarwal.medium.com/new-rules-for-estimating-software-development-time-in-ai-era-460ec5347e1a

Boehm, B. W. (1981). *Software Engineering Economics*. Prentice Hall.

Boehm, B. W. et al. (2000). *Software Cost Estimation with COCOMO II*. Prentice Hall. https://dl.acm.org/doi/10.5555/557000

Browett, D. (2025). "Software estimation -- COCOMO and AI." Agile Project Management Blog. https://davebrowettagile.wordpress.com/2025/03/04/software-estimation-cocomo-and-ai/

CodeRabbit. (2025). "State of AI vs Human Code Generation Report." https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report

COSMIC. (2024). "COSMIC Software Sizing -- Open Standard for Software Size Measurement." https://cosmic-sizing.org/

Cunningham, W. (1992). "The WyCash Portfolio Management System." OOPSLA 1992 Experience Report.

DORA. (2025). "State of AI-Assisted Software Development 2025." Google Cloud. https://dora.dev/research/2025/dora-report/

DX. (2025). "AI-Assisted Engineering: Q4 Impact Report." https://getdx.com/blog/ai-assisted-engineering-q4-impact-report-2025/

Faddom. (2025). "Best Application Dependency Mapping Tools: Top 7 Tools in 2025." https://faddom.com/best-application-dependency-mapping-tools-top-7-tools-in-2025/

Fenton, N. E. and Bieman, J. M. (2014). *Software Metrics: A Rigorous and Practical Approach*. 3rd Edition. CRC Press.

Fowler, M. (2009). "Technical Debt Quadrant." https://martinfowler.com/bliki/TechnicalDebtQuadrant.html

Fowler, M. (2003). "Technical Debt." https://martinfowler.com/bliki/TechnicalDebt.html

Jellyfish. (2025). "2025 AI Metrics in Review: What 12 Months of Data Tell Us About Adoption and Impact." https://jellyfish.co/blog/2025-ai-metrics-in-review/

McCabe, T. J. (1976). "A Complexity Measure." *IEEE Transactions on Software Engineering*, SE-2(4), 308-320.

METR. (2025). "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity." https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ ArXiv: 2507.09089.

METR. (2026). "We are Changing our Developer Productivity Experiment Design." https://metr.org/blog/2026-02-24-uplift-update/

Nuvei. (2026). "Payment Infrastructure 2026: Modular Architecture & Smart Routing." https://www.nuvei.com/posts/payment-infrastructure-2026-modular-architecture-smart-routing-real-time-optimization

Paudel, B. et al. (2026). "Exploring the Evolution of Technical Debt in Monolithic and Hybrid Microservice Architecture: An Industrial Case Study." *Journal of Systems and Software*. https://www.sciencedirect.com/science/article/pii/S0164121226000658

Peng, S. et al. (2023). "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot." ArXiv: 2302.06590. https://arxiv.org/abs/2302.06590

Putnam, L. H. (1978). "A General Empirical Solution to the Macro Software Sizing and Estimating Problem." *IEEE Transactions on Software Engineering*, SE-4(4), 345-361.

Render. (2025). "Testing AI Coding Agents (2025): Cursor vs. Claude, OpenAI, and Gemini." https://render.com/blog/ai-coding-agents-benchmark

Snowden, D. J. and Boone, M. E. (2007). "A Leader's Framework for Decision Making." *Harvard Business Review*, November 2007.

Sonar. (2026). "State of Code Developer Survey Report 2026." https://www.sonarsource.com/blog/state-of-code-developer-survey-report-the-current-reality-of-ai-coding/

Stack Overflow. (2025). "2025 Stack Overflow Developer Survey -- AI Section." https://survey.stackoverflow.co/2025/ai

Stacey, R. D. (1996). *Complexity and Creativity in Organizations*. Berrett-Koehler.

SWE-bench. (2026). "SWE-bench Verified Leaderboard." https://www.swebench.com/

Verdecchia, R. et al. (2021). "Building and evaluating a theory of architectural technical debt in software-intensive systems." *Journal of Systems and Software*, 176, 110925. https://www.sciencedirect.com/science/article/pii/S0164121221000224

---

## Practitioner Resources

### Complexity Classification & Estimation Tools

- **ScopeMaster** -- Automated COSMIC function point sizing from natural language requirements. https://www.scopemaster.com/
- **ISBSG Data Repository** -- Benchmarking database of 11,000+ completed software projects with effort and productivity metrics. https://www.isbsg.org/
- **Intelligent Story Point Estimation (Jira)** -- AI-powered story point estimation using historical project data. https://marketplace.atlassian.com/apps/1234430/intelligent-story-point-estimation
- **ClickUp AI Estimation** -- AI-powered estimation assistant that suggests story point values from historical data. https://clickup.com/

### AI Tool Benchmarks & Performance Data

- **SWE-bench Verified** -- Leaderboard ranking 77+ AI models on real-world GitHub issue resolution. https://www.swebench.com/
- **SWE-bench Pro** -- Uncontaminated multi-language benchmark with 1,865 tasks. https://www.morphllm.com/swe-bench-pro
- **Render Agent Benchmark** -- Comparative evaluation of Cursor, Claude Code, Gemini CLI, and OpenAI Codex on production codebases. https://render.com/blog/ai-coding-agents-benchmark
- **Jellyfish AI Impact Dashboard** -- Engineering metrics tracking AI adoption and productivity impact across 2M+ PRs. https://jellyfish.co/platform/jellyfish-ai-impact/

### Code Quality & Technical Debt Analysis

- **SonarQube / SonarCloud** -- Static analysis with technical debt measurement in time-to-fix units. https://www.sonarsource.com/
- **CodeRabbit** -- AI code review with per-PR quality assessment, including AI-vs-human comparison data. https://www.coderabbit.ai/
- **CodeClimate** -- Maintainability GPA and technical debt trend tracking. https://codeclimate.com/
- **vFunction** -- Architectural observability and technical debt measurement for monolith-to-microservices decisions. https://vfunction.com/

### Build-vs-Buy & Architecture Decision Frameworks

- **Agentic Web Blueprint: Build vs. Buy** -- Decision framework for the spectrum from no-code to full custom in the AI era. https://www.theagenticweb.dev/blueprint/build-vs-buy
- **Product School Build vs. Buy Guide** -- TCO calculator and 3-year decision framework. https://productschool.com/blog/leadership/build-vs-buy
- **Neontri 3-Model Decision Framework** -- Evaluates build-vs-buy across capability fit, cost trajectory, and strategic alignment. https://neontri.com/blog/build-vs-buy-software/

### Developer Productivity Surveys & Reports

- **DORA State of AI-Assisted Software Development 2025** -- The definitive report on AI's impact on team performance, identifying seven AI-amplifying capabilities. https://dora.dev/research/2025/dora-report/
- **DX AI-Assisted Engineering Hub** -- Quarterly reports on AI adoption and productivity across 135,000+ developers. https://getdx.com/blog/ai-assisted-engineering-hub/
- **Stack Overflow 2025 Developer Survey (AI Section)** -- Trust, adoption, and frustration data from 49,000+ developers. https://survey.stackoverflow.co/2025/ai
- **Sonar 2026 State of Code Developer Survey** -- Verification gap analysis for AI-generated code. https://www.sonarsource.com/resources/developer-survey-report/
- **JetBrains State of Developer Ecosystem 2025** -- Coding practices, AI adoption, and productivity metrics. https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/

### Rapid Prototyping & MVP Tools

- **Bolt.new** -- Full-stack application generator with autonomous debugging (v2). https://bolt.new/
- **Lovable** -- AI application generator with Supabase integration for rapid MVP development. https://lovable.dev/
- **v0 by Vercel** -- React + Tailwind component generator for production-ready UI. https://v0.dev/
- **Cursor** -- IDE-native AI coding assistant with deep codebase understanding. https://cursor.com/
- **Claude Code** -- Agentic CLI coding assistant for reasoning-heavy development. https://claude.ai/
