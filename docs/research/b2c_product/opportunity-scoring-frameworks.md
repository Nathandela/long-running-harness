---
title: "Opportunity Scoring Frameworks for B2C Product Ideation"
date: 2026-03-21
summary: Survey of VC evaluation methods (TAM/SAM/SOM), PM prioritization frameworks (ICE, RICE), indie hacker evaluation heuristics, and composite scoring models for solo dev + AI factory product selection.
keywords: [b2c-product, opportunity-scoring, prioritization-frameworks, tam-sam-som, ice-rice]
---

# Opportunity Scoring Frameworks for B2C Product Ideation

*2026-03-21*

---

## Abstract

Selecting which product to build is the highest-leverage decision a builder makes, yet the decision is typically made with the least rigor. A venture capitalist deploying a $200M fund, a product manager triaging a backlog of 400 feature requests, and a solo developer deciding how to spend the next six weekends all face the same structural problem: how to rank opportunities under uncertainty when evaluation criteria are heterogeneous, data is incomplete, and the cost of exploring one path forecloses others. Each community has developed its own scoring frameworks, optimized for its particular constraints, time horizons, and failure modes.

This paper surveys the landscape of opportunity scoring frameworks relevant to B2C product ideation, spanning three practitioner traditions: venture capital market sizing (TAM/SAM/SOM, bottom-up customer-count methods), product management prioritization (ICE, RICE, weighted scoring matrices, opportunity-solution trees), and indie hacker evaluation heuristics (effort-revenue ratios, competition density analysis, distribution advantage assessment). It examines each framework's theoretical foundations, empirical evidence base, practical implementations, and documented failure modes. The survey then addresses cross-cutting concerns: the persistent problem of false precision in numerical scoring, calibration techniques borrowed from forecasting research, and the emerging question of how AI-augmented solo builders should adapt traditional frameworks designed for teams with different resource profiles.

The central finding is that no single scoring framework dominates across all contexts. Frameworks optimized for speed sacrifice analytical depth; frameworks optimized for rigor demand data that early-stage builders do not have; and frameworks that appear to provide numerical precision often obscure rather than resolve the underlying uncertainty. The paper presents a comparative synthesis of all surveyed approaches, identifies six open problems in the field, and catalogs practitioner resources without recommending any single methodology.

---

## 1. Introduction

### 1.1 Problem Statement

Every product decision begins with an implicit or explicit evaluation: "Is this opportunity worth pursuing?" The answer depends on what "worth" means to the evaluator. For a venture capitalist, worth means risk-adjusted return potential over a 7-10 year fund life. For a product manager at an established company, worth means incremental business value delivered per unit of engineering effort consumed. For an indie hacker, worth means net income generated per hour of personal time invested, discounted by the probability that the product reaches paying customers at all.

These are structurally different optimization problems, yet the frameworks developed to address them are frequently borrowed across contexts without adaptation. Product managers use TAM/SAM/SOM slides in feature prioritization meetings where they add no signal. Solo developers apply RICE scoring to compare two product ideas when they have no data for reach, impact, or confidence. Venture capitalists dismiss products in large markets because they applied indie-hacker effort-to-revenue heuristics designed for solo economics. The frameworks are not interchangeable, and misapplication produces systematically wrong decisions.

The problem is compounded by the rise of AI-augmented solo builders -- individuals using AI coding tools, managed infrastructure, and automated workflows to ship products that historically required teams. This population sits at the intersection of all three traditions: they think about markets like founders (TAM/SAM/SOM), prioritize features like product managers (RICE, weighted scoring), and evaluate personal effort-to-reward ratios like indie hackers. They need a composite evaluation framework, but the literature has not provided one.

### 1.2 Scope

This paper covers:

- **Venture capital evaluation frameworks**: TAM/SAM/SOM top-down market sizing, bottom-up customer-count sizing, VC deal scoring criteria
- **Product management prioritization frameworks**: ICE scoring, RICE scoring, weighted scoring matrices, opportunity-solution trees, value-vs-complexity matrices
- **Indie hacker evaluation heuristics**: Effort-revenue ratio analysis, competition density assessment, distribution advantage evaluation, the Levels/Fitzpatrick validation traditions
- **Outcome-Driven Innovation**: Ulwick's opportunity algorithm as a distinct quantitative approach
- **Cross-cutting concerns**: False precision traps, calibration methods, reference class forecasting
- **Composite scoring for AI-augmented solo builders**: Novel synthesis of frameworks adapted for the solo dev + AI factory context

This paper does not cover: corporate innovation portfolio management (Stage-Gate, real options valuation), government policy evaluation (cost-benefit analysis, social return on investment), or academic research prioritization frameworks (grant scoring). It focuses on B2C product contexts, though many frameworks discussed originated in B2B settings and transfer with adaptation.

### 1.3 Key Definitions

**Opportunity scoring**: Any systematic method of assigning a quantitative or semi-quantitative value to a potential product, feature, or market opportunity for the purpose of comparison and selection.

**Framework**: A structured methodology specifying inputs (criteria), transformations (scoring rules), and outputs (ranks or scores). Distinguished from informal heuristics by the presence of explicit, repeatable procedures.

**False precision**: The presentation of a numerical estimate with more significant figures or decimal places than the underlying data warrants, creating an unearned impression of accuracy. In opportunity scoring, the phenomenon of a framework producing a score of 7.3 vs. 7.1 when the input estimates have error margins of plus or minus 3.

**AI-augmented solo builder**: A single developer using AI-powered tools (agentic coding assistants, full-stack generators, AI design and copy tools) combined with managed cloud infrastructure, working without co-founders or employees, to ship B2C products. The "AI factory" denotes the ensemble of AI tools operating as an integrated production pipeline.

**Scoring vs. ranking vs. classification**: Three distinct output types. Scoring assigns a cardinal number to each option. Ranking assigns an ordinal position. Classification assigns options to categories (e.g., "build," "explore," "kill"). These outputs serve different decision needs and are not interchangeable.

---

## 2. Foundations

### 2.1 Decision Theory Under Uncertainty

Opportunity scoring is a special case of multi-criteria decision making under uncertainty -- a problem with deep roots in decision theory, operations research, and behavioral economics.

**Expected utility theory** (von Neumann and Morgenstern 1944) provides the normative foundation: a rational agent should choose the option that maximizes expected utility, where utility is a function of outcomes and probabilities. In opportunity scoring, this translates to selecting the product opportunity with the highest probability-weighted value. The challenge is that neither probabilities nor utilities are known with precision in early-stage product decisions. Savage (1954) extended the framework to handle subjective probability, establishing that rational decision making is possible even when objective probabilities are unavailable -- a condition that characterizes virtually all product ideation decisions.

**Bounded rationality** (Simon 1955) describes the actual human condition: decision makers lack the time, information, and cognitive capacity to optimize. They "satisfice" -- choosing the first option that meets an acceptable threshold rather than exhaustively evaluating all alternatives. Most practitioner opportunity scoring frameworks implicitly operationalize satisficing: they do not claim to identify the optimal opportunity, only to filter out clearly inferior ones and provide a defensible basis for selection.

**Prospect theory** (Kahneman and Tversky 1979) identifies systematic deviations from rational choice: loss aversion causes builders to overweight the downside of abandoning a current project relative to the upside of starting a new one; the certainty effect causes overvaluation of "sure thing" small opportunities relative to higher-expected-value uncertain ones; and framing effects mean that presenting the same opportunity data in different formats produces different decisions. These biases are not merely academic curiosities -- they directly distort opportunity scoring in practice.

### 2.2 Multi-Criteria Decision Analysis (MCDA)

Multi-Criteria Decision Analysis encompasses the formal methods for evaluating alternatives across multiple, potentially conflicting dimensions (Belton and Stewart 2002). The field provides the mathematical infrastructure underlying most opportunity scoring frameworks, whether practitioners recognize the lineage or not.

MCDA methods divide into four families (Cinelli et al. 2020):

1. **Full aggregation approaches** (weighted sum, MAUT/MAVT): Combine all criteria into a single score using weights and value functions. ICE, RICE, and weighted scoring matrices all belong to this family. The assumption is compensatory -- a high score on one criterion can offset a low score on another.

2. **Outranking approaches** (ELECTRE, PROMETHEE): Instead of computing a single score, they build pairwise preference relations, determining for each pair of alternatives whether one outranks the other. More suitable when criteria are incommensurable or when compensability is undesirable (e.g., a product with zero distribution cannot compensate with high market size).

3. **Goal and reference-level approaches** (goal programming, TOPSIS): Evaluate alternatives by their distance from an ideal point or aspiration level. Relevant when a builder has a clear target profile ("I need a product that reaches $5K MRR within 6 months with fewer than 20 hours per week of maintenance").

4. **Non-classical approaches** (fuzzy MCDA, rough sets): Handle imprecise and uncertain input data without forcing artificial precision. Particularly relevant for early-stage opportunity scoring where inputs are genuinely uncertain.

The Analytic Hierarchy Process (AHP), developed by Thomas Saaty in the 1970s, deserves special mention as the most widely cited formal MCDA method. AHP structures the decision as a hierarchy (goal, criteria, sub-criteria, alternatives), elicits pairwise comparisons of criteria importance, checks for consistency, and derives priority weights through eigenvector computation (Saaty 1980). AHP's academic literature is enormous -- over 10,000 published applications by 2020 -- and it provides the theoretical backbone for many "weighted scoring" approaches used in product management, even when practitioners do not use the full AHP protocol. The Institute for Operations Research and the Management Sciences (INFORMS) formally recognized AHP's contribution to the field in 2008.

### 2.3 Scoring, Ranking, and Classification

A critical but often overlooked distinction in opportunity evaluation is the type of output a framework produces.

**Scoring** assigns a cardinal number (e.g., RICE score of 42). Cardinal scores support arithmetic operations: a score of 42 is supposed to be "twice as good" as a score of 21. This is the strongest claim and requires the most rigorous input data. Most practitioner scoring frameworks (ICE, RICE) claim cardinal properties but are applied with ordinal-quality inputs, producing false precision.

**Ranking** assigns an ordinal position (first, second, third). Ordinal ranks support only "greater than" comparisons: the top-ranked item is preferred to the second-ranked, but the gap between them is undefined. Many practical uses of ICE and RICE scores reduce to ranking -- teams look at the sorted list, not the absolute numbers.

**Classification** assigns alternatives to categories (e.g., "quick win," "strategic bet," "not now," "never"). The value-vs-complexity 2x2 matrix and MoSCoW (Must/Should/Could/Won't) are classification frameworks. Classification tolerates the most imprecise inputs because it requires only that an item be placed in the correct bin, not that it be precisely scored or ranked within that bin.

The appropriate output type depends on the decision context. When choosing between two similar opportunities, cardinal scoring (if achievable) provides the most information. When triaging a backlog of 50 items, ordinal ranking suffices. When a solo builder is deciding whether a product category is worth exploring at all, classification is usually the right level of resolution.

---

## 3. Taxonomy of Approaches

The following table classifies the major opportunity scoring frameworks surveyed in this paper across five dimensions: origin community, output type, data requirements, time to apply, and primary use case.

| Framework | Origin | Output Type | Data Required | Time to Apply | Primary Use Case |
|---|---|---|---|---|---|
| TAM/SAM/SOM | Venture Capital | Score (dollar) | Industry reports, census data | Days-weeks | Market sizing for investment decisions |
| Bottom-Up Sizing | Venture Capital / Strategy | Score (dollar) | Customer counts, pricing data | Days-weeks | Validating top-down estimates |
| ICE Scoring | Growth Hacking | Score (1-1000) | Expert judgment only | Minutes | Rapid experiment prioritization |
| RICE Scoring | Product Management | Score (continuous) | Usage data, estimates | Hours | Feature/project prioritization |
| Weighted Scoring Matrix | Operations Research / PM | Score (continuous) | Varies by criteria | Hours-days | Multi-stakeholder feature prioritization |
| Value vs. Complexity | Product Management | Classification (4 quadrants) | Rough estimates | Minutes-hours | Visual triage of backlog |
| Opportunity-Solution Tree | Product Discovery | Structure (tree) | Customer research | Days-weeks | Mapping solution space to outcomes |
| Opportunity Algorithm (ODI) | Innovation Strategy | Score (0-20) | Customer survey data | Weeks-months | Identifying underserved needs |
| Indie Hacker Heuristics | Bootstrapping | Classification / ranking | Market observation, personal assessment | Hours | Solo builder product selection |
| Composite AI-Solo Scoring | Emerging | Score / classification | Mixed | Hours | AI-augmented solo builder selection |

The frameworks partition along two primary axes: **data intensity** (from "expert judgment only" for ICE to "structured customer survey" for ODI) and **output precision** (from categorical classification for Value vs. Complexity to continuous dollar scores for market sizing). No framework is universally superior; each represents a different point in the trade-off space between analytical rigor and practical applicability.

---

## 4. Analysis

### 4.1 TAM/SAM/SOM Market Sizing

#### Theory & Mechanism

TAM/SAM/SOM is a hierarchical market sizing framework that decomposes total market opportunity into three nested layers. TAM (Total Addressable Market) represents the total revenue opportunity if every potential customer adopted the solution. SAM (Serviceable Available Market) narrows TAM to the segment the company's current business model and capabilities can realistically serve. SOM (Serviceable Obtainable Market) further narrows SAM to the share the company can realistically capture given competition, distribution, and execution constraints.

The framework originates in industrial economics and strategic management, operationalizing the distinction between market potential and capturable demand. It connects to Porter's (1980) competitive strategy framework: TAM relates to industry structure, SAM to strategic positioning, and SOM to competitive dynamics and firm capabilities. The implicit theory is that opportunity quality correlates with market size -- larger markets provide more room for error, more acquisition targets, and more exit opportunities.

Top-down TAM calculation starts from aggregate industry data (market research reports, government statistics) and narrows downward. A fitness app startup might begin with the global wellness market ($5.6 trillion), narrow to mobile fitness applications ($15 billion), further narrow to English-speaking markets ($8 billion SAM), and estimate 0.1% capture ($8 million SOM). The method is fast but prone to the "everyone needs our product" fallacy, where TAM estimates become meaninglessly large.

#### Literature Evidence

Academic research on TAM/SAM/SOM as a formal methodology is thin. The framework is more practitioner-canonical than academically validated. Its intellectual lineage traces to Porter's industry analysis, Ansoff's (1965) product-market growth matrix, and the strategy consulting tradition of market attractiveness assessment (McKinsey/GE matrix, BCG matrix).

Empirical studies of VC decision making consistently rank "market size" among the top evaluation criteria, though its relative importance varies. Tyebjee and Bruno (1984) identified market attractiveness as one of five primary VC evaluation criteria. Kaplan and Stromberg (2004) found that VCs emphasize market size as a necessary but insufficient condition -- the team assessment dominates marginal investment decisions. Gompers et al. (2020) analyzed 889 VC deals and found that market sizing accuracy is poor: the median VC's TAM estimate at initial investment differs from realized market size by 3-5x at exit.

#### Implementations & Benchmarks

**Standard VC thresholds**: Seed-stage companies are typically expected to demonstrate $1-10M SOM within 3 years; Series A companies need $10-50M SOM projections over 5 years; venture-scale investment generally requires TAM exceeding $1 billion (GoingVC 2024; Pear VC 2025). These thresholds are heuristic norms, not formal decision rules.

**Tools**: Free calculators (pmtoolkit.ai, zenitdata.com), spreadsheet templates, and Gartner/Statista/IBISWorld as data sources. More rigorous implementations triangulate top-down and bottom-up estimates and flag gaps exceeding 3x between methods.

**Common errors**: Overly broad TAM definitions ("the global SaaS market is $200B, so our CRM plugin addresses a $200B market"), confusion between revenue TAM and profit TAM, failure to account for willingness-to-pay variance across segments, and static analysis that ignores market growth trajectories.

#### Strengths & Limitations

**Strengths**: Universal language understood by investors, board members, and strategic partners. Forces market definition and competitive scoping. Provides absolute dollar context that relative scoring frameworks lack. Useful for "smell test" filtering -- eliminating opportunities in trivially small markets.

**Limitations**: Deeply susceptible to the "garbage in, garbage out" problem. Top-down TAM estimates for novel product categories are essentially fiction because the market does not yet exist. The framework says nothing about timing, competition intensity, or the builder's ability to capture any share. For solo developers, TAM is largely irrelevant -- a $100 billion TAM and a $1 billion TAM are equally unactionable when the builder's realistic SOM is $50K-$500K ARR. The framework's precision obscures its uncertainty: a TAM of "$3.2 billion" implies measurement accuracy that does not exist.

---

### 4.2 Bottom-Up Market Sizing

#### Theory & Mechanism

Bottom-up market sizing inverts the TAM/SAM/SOM approach by starting from identifiable customer units rather than aggregate industry statistics. The core equation is: Market Size = Number of Potential Customers x Average Revenue Per Customer. The method requires defining a specific customer segment, counting or estimating its population, establishing a realistic price point, and multiplying.

The theoretical basis is microeconomic: market size is an emergent property of individual demand curves, not an exogenous given. Bottom-up sizing operationalizes this by grounding the estimate in observable customer characteristics -- job titles, company sizes, behavioral indicators, geographic density -- that can be independently verified.

#### Literature Evidence

Investors and strategy consultants consistently prefer bottom-up estimates because they reveal the builder's understanding of customer economics (Visible.vc 2024; Pear VC 2025). Blank (2013) in the Lean Startup tradition argues that bottom-up sizing is the only defensible approach for novel markets where top-down data is unreliable or nonexistent. Maurya (2012) extends this by connecting bottom-up sizing to the customer development process: the sizing exercise itself generates testable hypotheses about customer segments and willingness to pay.

The limitation, well-documented in practice, is that bottom-up estimates are only as good as the customer definition and pricing assumptions. Cross-referencing with top-down data serves as a sanity check: Qubit Capital (2025) recommends investigating any gap exceeding 3x between bottom-up and top-down estimates, as it signals a flawed assumption.

#### Implementations & Benchmarks

**Standard methodology**: (1) Define target customer segment with specificity (e.g., "US-based freelance graphic designers earning $50K-$150K annually who currently use Canva"), (2) count or estimate segment population using LinkedIn, census data, industry surveys, or platform-specific data, (3) estimate annual revenue per customer based on comparable product pricing, (4) apply realistic penetration rate (typically 1-5% for Year 1, 5-15% for Year 3), (5) multiply to get SOM.

**Timeline**: A thorough bottom-up analysis takes 1-2 weeks (Zimt.ai 2025), though rapid versions using readily available data sources can be completed in hours.

**Validation**: Compare with top-down TAM from industry reports. Run sensitivity analysis on the three input parameters. Interview 10-20 potential customers to validate willingness to pay.

#### Strengths & Limitations

**Strengths**: Forces specificity about customer identity and pricing. Produces estimates grounded in observable data. Reveals assumptions that can be independently tested. Preferred by sophisticated investors because it demonstrates market understanding.

**Limitations**: Labor-intensive compared to top-down estimates. Accuracy depends on quality of customer segment definition, which is itself uncertain at the ideation stage. Risk of underestimation if the segment definition is too narrow, or overestimation if adoption rates are optimistic. For genuinely novel product categories where no comparable product exists, even bottom-up pricing assumptions are speculative.

---

### 4.3 ICE Scoring

#### Theory & Mechanism

ICE scoring was developed by Sean Ellis, who coined the term "growth hacking" and applied the framework at LogMeIn and Dropbox in the early 2010s. ICE stands for Impact, Confidence, and Ease. Each candidate idea receives a score from 1 to 10 on each dimension, and the three scores are multiplied to produce an overall score ranging from 1 to 1,000.

**Impact** assesses how much the idea will move the target metric (e.g., conversion rate, retention, revenue). **Confidence** captures certainty about the impact estimate, incorporating both data quality and historical analogies. **Ease** measures implementation effort inversely -- higher ease means less effort required.

The formula is: ICE Score = Impact x Confidence x Ease.

The theoretical basis is a simplified expected-value calculation. Multiplying Impact by Confidence approximates expected impact (analogous to expected value = magnitude x probability). Dividing by effort (via inverse coding as Ease) converts expected impact to expected impact per unit of effort -- an efficiency metric. The framework belongs to the full-aggregation family of MCDA methods: it assumes compensability (high impact can offset low ease) and commensurability (impact, confidence, and ease can be meaningfully combined on a single scale).

#### Literature Evidence

ICE has no formal academic literature. It emerged from the growth hacking practitioner community and is documented primarily in blog posts, conference talks, and practitioner handbooks (Ellis 2010, 2017; Gilad 2019). Its validation is empirical-anecdotal: teams at Dropbox, LogMeIn, and subsequently hundreds of growth teams report that ICE helps structure experiment prioritization decisions that would otherwise default to the Highest-Paid Person's Opinion (HiPPO).

Gilad (2019) proposed a refinement called the "Confidence Meter" that disaggregates the confidence dimension into sub-components (supporting evidence, thematic evidence, market data, user data, test data) with increasing confidence levels, partially addressing the problem that a single 1-10 confidence score is too coarse.

#### Implementations & Benchmarks

**Standard implementation**: A spreadsheet with one row per idea and columns for Impact (1-10), Confidence (1-10), Ease (1-10), and ICE Score (product). Teams typically score individually and then discuss discrepancies.

**Tools**: Built into ProductPlan, airfocus, Productfolio, and many project management tools as a native prioritization method.

**Typical usage context**: Growth teams prioritizing 10-30 experiment ideas per sprint or quarter. The framework is designed for rapid decision making -- scoring a full backlog takes minutes, not hours.

#### Strengths & Limitations

**Strengths**: Speed is ICE's defining advantage. A team can score 30 ideas in 15 minutes. The framework's simplicity means it can be applied without specialized training or data infrastructure. It forces explicit consideration of confidence, which many faster methods (gut feel, voting) omit.

**Limitations**: The 1-10 scales are unanchored -- one person's "7 Impact" is another person's "4." Without calibration, ICE scores are not comparable across individuals or time periods. The multiplicative formula amplifies noise: if each dimension has plus-or-minus 2 points of error on a 10-point scale, the product can vary by a factor of 8x. Few people in an organization have enough information to score all three dimensions accurately for a given idea (ProductPlan 2024). There is no mechanism for weighting criteria differently -- the framework implicitly assumes Impact, Confidence, and Ease are equally important. For solo developers evaluating product ideas (not feature experiments), the "Ease" dimension conflates implementation ease with operational ease, which are different constraints.

---

### 4.4 RICE Scoring

#### Theory & Mechanism

RICE was developed at Intercom and published by Sean McBride in 2018 as a response to perceived limitations of simpler frameworks. RICE stands for Reach, Impact, Confidence, and Effort. The formula is:

RICE Score = (Reach x Impact x Confidence) / Effort

**Reach** is the number of users or events affected within a defined time period (e.g., "10,000 users per quarter"). This is a quantitative input, not a judgment score, which distinguishes RICE from ICE. **Impact** is scored on a discrete scale (3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal). **Confidence** is expressed as a percentage (100% = high confidence, 80% = medium, 50% = low). **Effort** is measured in person-months.

The formula operationalizes a simple decision principle: prioritize ideas that affect the most people, most strongly, with the most certainty, per unit of effort.

#### Literature Evidence

Like ICE, RICE has no formal academic validation. It was published as a practitioner blog post by Intercom (McBride 2018) and has been adopted widely across the product management community. Its adoption is driven by perceived objectivity: the inclusion of quantitative Reach data and percentage-based Confidence scores makes RICE feel more rigorous than ICE's purely subjective 1-10 scales.

Product management literature (Cagan 2018; Torres 2021) positions RICE as one of several "useful but imperfect" prioritization tools. The primary criticism in the literature is that RICE optimizes for incremental feature additions (items with known reach and estimable impact) and systematically disadvantages exploratory or platform-level work where reach is unknown and impact is speculative (Atlassian 2023; Product School 2024).

#### Implementations & Benchmarks

**Standard implementation**: A spreadsheet or product management tool (ProductPlan, Aha!, Jira) with columns for Reach (number), Impact (3/2/1/0.5/0.25), Confidence (100%/80%/50%), Effort (person-months), and RICE Score (computed).

**Tools**: Native integration in ProductPlan, airfocus, monday.com, Savio, and most modern product management platforms. Many provide templates and auto-computation.

**Typical usage context**: Product teams with 20-100+ items competing for engineering capacity. RICE is designed for ongoing backlog prioritization, not one-time product selection. It assumes a stable product with measurable user base (for Reach) and historical performance data (for Impact estimation).

#### Strengths & Limitations

**Strengths**: Separating Reach from Impact forces teams to distinguish between ideas that affect many users weakly and ideas that affect few users strongly. The explicit Effort dimension in person-months connects prioritization to capacity planning. Confidence as a percentage is more intuitive than ICE's 1-10 scale. The framework fits naturally into Agile sprint planning workflows.

**Limitations**: Reach requires usage data that does not exist for new products or features. The Impact scale (3/2/1/0.5/0.25) is arbitrary and compresses the range of possible impacts into five bins. Person-months are notoriously difficult to estimate, reintroducing the same uncertainty the framework claims to manage. For solo developers evaluating product ideas, Reach is unknowable (the product does not exist yet), Effort is personal (not person-months in the team sense), and Impact cannot be separated from market dynamics. RICE is optimized for established products with existing user bases, not for greenfield product selection.

---

### 4.5 Weighted Scoring Matrices

#### Theory & Mechanism

A weighted scoring matrix is the general form of the multi-criteria scoring approach from which ICE and RICE are specialized instances. The builder defines N criteria, assigns each a weight reflecting relative importance (weights sum to 1.0 or 100%), scores each alternative on each criterion (typically 0-100 or 1-5), and computes the weighted sum.

Weighted Score = SUM(weight_i x score_i) for all criteria i.

The method derives from the additive multi-attribute value theory (MAVT) tradition in MCDA (Keeney and Raiffa 1976). MAVT establishes conditions under which the weighted sum is a valid aggregation: criteria must be preferentially independent (the preference for levels on one criterion does not depend on levels of another), and value functions must be properly constructed. In practice, these conditions are rarely tested by product teams, who use weighted scoring as a pragmatic heuristic rather than a formally valid utility model.

The power of weighted scoring is its extensibility. Unlike ICE (3 fixed dimensions) or RICE (4 fixed dimensions), a weighted scoring matrix can include any number of criteria tailored to the decision context: market size, competitive intensity, technical risk, strategic alignment, regulatory exposure, revenue potential, personal interest, learning value, distribution advantage, and so on.

#### Literature Evidence

Weighted scoring is the most extensively studied approach in the MCDA literature, with thousands of published applications across domains including engineering design, healthcare, environmental policy, and project management. The academic literature identifies several well-characterized failure modes: criteria proliferation (adding criteria until the matrix becomes unmanageable), weight manipulation (adjusting weights post hoc to rationalize a preferred outcome), anchoring bias in scoring (first-scored alternatives disproportionately influence subsequent scores), and the illusion of objectivity (the mathematical apparatus creates confidence that exceeds the input data quality) (Velasquez and Hester 2013).

In product management specifically, weighted scoring is documented in Cagan (2018), Olsen (2015), and Savio (2024) as the most flexible prioritization approach, suitable when teams need to incorporate diverse stakeholder perspectives and domain-specific criteria.

#### Implementations & Benchmarks

**Standard implementation**: A spreadsheet with alternatives as rows, criteria as columns, a weight row at the top, scores in the body, and a weighted-sum column at the right. Variants include Keeney-Raiffa style construction with explicit value functions, Saaty-style AHP with pairwise comparison of criteria weights, and informal "assign weights by discussion" approaches.

**Tools**: Every product management platform (ProductPlan, airfocus, monday.com, Aha!, Jira) supports weighted scoring. Standalone tools include 1000minds (which implements the PAPRIKA method for weight elicitation) and Decision Matrix platforms.

**Typical usage context**: Multi-stakeholder prioritization decisions where different teams (engineering, design, marketing, sales) weight criteria differently. The matrix makes implicit trade-offs explicit and provides an auditable decision record.

#### Strengths & Limitations

**Strengths**: Maximum flexibility -- criteria can be customized to any decision context. Weight transparency makes trade-offs explicit and auditable. The method accommodates both quantitative and qualitative criteria. It can be as simple (3 criteria, eyeball weights) or as rigorous (20 criteria, AHP-derived weights, formally constructed value functions) as the situation demands.

**Limitations**: Flexibility is also the vulnerability: the builder must choose criteria, set weights, and define scoring scales, each of which introduces judgment and potential bias. The "garbage in, garbage out" problem is amplified by the mathematical veneer of objectivity. Criteria proliferation leads to decision fatigue and diminishing marginal information per criterion. Weight sensitivity is underappreciated: small changes in weights can flip rankings, but sensitivity analysis is rarely performed in practice. For solo developers, the overhead of constructing a proper weighted matrix may exceed the value of the analysis for simple binary product decisions.

---

### 4.6 Opportunity-Solution Trees (Teresa Torres)

#### Theory & Mechanism

The Opportunity-Solution Tree (OST), introduced by Teresa Torres in 2016 and elaborated in her book *Continuous Discovery Habits* (2021), is not a scoring framework in the traditional sense. It is a structural framework that organizes the relationship between desired business outcomes, customer opportunities (needs, pain points, desires), candidate solutions, and assumption tests into a hierarchical tree visualization.

The root node is a measurable business outcome (e.g., "increase 30-day retention by 10%"). The next level down identifies the customer opportunities that, if addressed, would drive that outcome. Below that are solution ideas for each opportunity. Below that are assumption tests that would validate or invalidate each solution.

The framework's theory is that product teams fail not because they lack good ideas but because they lack a structured way to connect ideas to customer needs and business outcomes. The OST makes this connection explicit and visual, serving as a living document that evolves as the team learns from customer research and experiments.

#### Literature Evidence

Torres (2021) is the primary source. The framework draws on earlier product discovery literature: the dual-track agile approach (Patton 2014), continuous discovery (Cagan 2018), and the broader design thinking tradition (Brown 2009). The OST's specific contribution is the visual tree structure that maps the solution space to the opportunity space.

The framework has been widely adopted in product management, with implementations documented at Amplitude, Chameleon, Miro, and many product organizations. It has been featured in product management curricula at Product School and Mind the Product. Critical analysis from practitioners (Mind the Product 2024) has explored "reversing" the OST -- starting from existing solutions to discover the underlying opportunities -- as a diagnostic tool for products that have lost connection to customer needs.

#### Implementations & Benchmarks

**Standard implementation**: A visual tree diagram (whiteboard, Miro, FigJam, or dedicated tools) with outcome at the root, opportunities as first-level branches, solutions as second-level branches, and experiments as leaf nodes. The tree is maintained across sprints and updated as research and experiment results arrive.

**Tools**: Miro (free OST template), FigJam, Productboard, and any diagramming tool. Torres provides templates and courses through producttalk.org.

**Typical usage context**: Product teams practicing continuous discovery, where the problem is not "which single product to build" but "which opportunities within an existing product to pursue." The framework is complementary to scoring methods: the OST identifies what to evaluate, and scoring methods rank the identified opportunities.

#### Strengths & Limitations

**Strengths**: Makes the connection between business outcomes and customer opportunities explicit. Prevents the common failure mode of pursuing solutions without understanding the underlying customer need. The visual format makes assumptions visible and discussable. It naturally accommodates learning -- branches can be pruned or expanded as evidence accumulates.

**Limitations**: Not a scoring or prioritization framework per se -- it structures the decision space but does not rank alternatives. Requires ongoing customer research to populate meaningfully, which presupposes access to customers (a problem for pre-launch products). The framework assumes a team context with dedicated product managers and researchers; adaptation for solo builders requires significant simplification. The tree can become unwieldy if not regularly pruned, and the visual format does not scale well beyond 50-100 nodes.

---

### 4.7 Outcome-Driven Innovation (Ulwick's Opportunity Algorithm)

#### Theory & Mechanism

Outcome-Driven Innovation (ODI), developed by Anthony Ulwick and his firm Strategyn beginning in the 1990s, is the most quantitatively rigorous of the practitioner opportunity scoring frameworks. ODI is grounded in Jobs-to-be-Done theory: customers hire products to accomplish functional jobs, and each job involves multiple desired outcomes that can be precisely stated and measured.

The Opportunity Algorithm calculates an opportunity score for each desired outcome:

Opportunity Score = Importance + max(Importance - Satisfaction, 0)

Where Importance is the percentage of customers who rate the outcome as important (typically 8+ on a 10-point scale) and Satisfaction is the percentage of customers who are satisfied with current solutions on that outcome. Scores range from 0 to 20. Outcomes scoring above 10 are "underserved" -- important but not well-satisfied -- and represent innovation opportunities. Outcomes scoring below 6 are "overserved" -- well-satisfied or unimportant -- and represent areas of potential cost reduction.

The formula's asymmetry is deliberate: overserved outcomes score a minimum of their Importance value (not negative), reflecting that an outcome's importance establishes a floor of relevance regardless of current satisfaction.

#### Literature Evidence

Ulwick has published the framework in two books (Ulwick 2005; Ulwick 2016), a Harvard Business Review article (Ulwick 2002), and through Strategyn's consulting practice. He claims an 86% innovation success rate for ODI-guided projects, compared to industry averages of 5-20% (Strategyn 2024). This claim has not been independently validated in peer-reviewed literature, though several published case studies (Cordis in coronary stents, Bosch in power tools) document successful ODI applications.

The framework's connection to JTBD theory provides a stronger theoretical foundation than pure prioritization frameworks like ICE or RICE. By grounding opportunity scoring in measured customer importance and satisfaction, ODI avoids the purely internal assessment problem that plagues judgment-only frameworks. Carrascal (2022) at Microsoft provided a detailed methodological walkthrough of computing opportunity scores from survey data, including statistical considerations for sample size and significance.

#### Implementations & Benchmarks

**Standard implementation**: (1) Identify the job-to-be-done through qualitative research, (2) decompose the job into 50-150 desired outcome statements using Ulwick's specific grammatical formula ("Minimize the time it takes to [outcome]"), (3) survey 180-600 customers on importance and satisfaction for each outcome, (4) compute opportunity scores, (5) cluster high-scoring outcomes into opportunity themes.

**Tools**: Strategyn's proprietary platform. Academic implementations use survey platforms (Qualtrics, SurveyMonkey) with custom analysis scripts.

**Typical usage context**: Large-scale product strategy and new market entry decisions. The investment required (months of research, hundreds of survey respondents) limits ODI to decisions with significant resource implications.

#### Strengths & Limitations

**Strengths**: The most empirically grounded opportunity scoring framework, based on actual customer data rather than internal judgment. The mathematical formula is simple but well-motivated by the importance-satisfaction gap logic. Outcome statements are testable and specific, avoiding the vagueness of "impact" scores. The framework systematically identifies both underserved (innovation) and overserved (disruption/cost-reduction) opportunities.

**Limitations**: The research investment is substantial -- a full ODI study costs $50K-$200K and takes 3-6 months. Survey-based importance and satisfaction measures are subject to stated-preference bias: customers may rate outcomes as important that do not actually drive behavior. The framework requires a well-defined job-to-be-done as input, which itself requires prior qualitative research. For solo developers, the cost and timeline of a full ODI study are prohibitive, though simplified versions using smaller samples (20-50 interviews) can capture directional signal.

---

### 4.8 Indie Hacker Evaluation Heuristics

#### Theory & Mechanism

The indie hacker community has developed a distinct set of evaluation heuristics optimized for individuals building products alone or in very small teams, with personal capital at risk, seeking lifestyle-scale revenue ($1K-$100K MRR) rather than venture-scale outcomes. These heuristics are not formalized into a single framework but emerge as convergent practices across the community's literature and culture (Levels 2018; Fitzpatrick 2013; Kahl 2023).

The core heuristics include:

**Effort-to-Revenue Ratio**: How much recurring revenue can be generated per hour of ongoing effort? This is the indie hacker's fundamental efficiency metric. A product requiring 10 hours per week of maintenance generating $5K MRR ($500/hour equivalent) is preferred to one requiring 40 hours per week generating $10K MRR ($250/hour). The metric implicitly captures operational complexity, support burden, and scalability characteristics.

**Competition Density Assessment**: Not "how big is the market?" but "how many competitors exist, and what is their quality?" Markets with no competitors may indicate no demand. Markets with thousands of low-quality competitors may indicate a commodity space with no pricing power. Markets with a few strong competitors and identifiable gaps represent the indie hacker sweet spot. Tools like NichesHunter (2025) automate competition analysis by scanning app stores, SaaS directories, and search results.

**Distribution Advantage**: Does the builder have a pre-existing channel to reach customers? An audience (Twitter/X following, newsletter, YouTube channel), a community position (active in a niche subreddit, forum moderator), or domain expertise that confers credibility? In 2026, distribution advantage has become the primary differentiator for indie products because AI tools have commoditized the build phase -- attention and trust are the scarce resources (Grey Journal 2026).

**Personal-Market Fit**: Does the builder have personal domain knowledge, sustained interest, and credible authority in the problem space? Products built by domain experts fail less frequently because the builder can distinguish real problems from apparent ones without formal research.

**Monetization as Validation**: Pieter Levels (2018) articulated the principle that willingness to pay is the only reliable validation signal. Adding a "Buy" button before the product exists, running a pre-sale, or charging from day one are all implementations of this principle. The heuristic rejects elaborate market sizing in favor of direct demand testing.

#### Literature Evidence

The primary literature is practitioner-authored: Levels' *MAKE: Bootstrapper's Handbook* (2018), Fitzpatrick's *The Mom Test* (2013), Kahl's *The Bootstrapped Founder* newsletter and podcast (2020-present), and the collective output of the Indie Hackers community (2016-present). Academic treatment is limited to entrepreneurship research on bootstrapping (Bhide 1992) and lifestyle entrepreneurship (Marcketti et al. 2006).

Empirical data from 2025 SaaS benchmarks provides context for indie hacker economics: 30% of solo-founded micro-SaaS products never reach $1K MRR; 50% plateau at $1K-$10K MRR; 15% scale to $10K-$100K MRR; and 5% exceed $100K MRR (SoftwareSeni 2025). Solo founders achieving profitability average 45% profit margins, with top-quartile operators exceeding 80% margins through strict prioritization of profitability over growth velocity (SaaS Capital 2025). Median time to $1M ARR is 24 months.

#### Implementations & Benchmarks

**Standard implementation**: No single tool or template, but a common evaluation pattern emerges: (1) Generate ideas from personal frustration, community observation, or trend monitoring, (2) assess competition density via Product Hunt, G2, Capterra, Google search, and niche directories, (3) estimate effort via time-boxing (can I build an MVP in 2-4 weekends?), (4) validate monetization with a landing page, pre-sale, or direct outreach, (5) set a "kill criteria" timeline (if no paying customer within 30 days, move on).

**Characteristic tools**: Indie Hackers forums (ideation and peer validation), NichesHunter (niche analysis), Stripe/LemonSqueezy (monetization validation), Carrd/Framer (rapid landing pages), Google Trends and Ahrefs (demand signals).

#### Strengths & Limitations

**Strengths**: Optimized for the actual constraints of solo builders: limited time, limited capital, high opportunity cost of persistence on a failing idea. The heuristics emphasize speed-to-validation over analytical depth. Distribution advantage assessment is particularly valuable in the AI era when build cost has collapsed. Monetization-as-validation eliminates the most common indie failure mode (building something nobody pays for).

**Limitations**: The heuristics are informal and unsystematic -- two builders applying the same heuristics to the same idea may reach opposite conclusions. Competition density assessment is often superficial (counting competitors without analyzing their positioning, pricing, or vulnerability). Effort-to-revenue estimates are subject to the planning fallacy (systematic underestimation of effort and overestimation of revenue). The heuristics work well for filtering obviously bad ideas but provide little resolution when comparing two reasonably good ideas. There is survivorship bias in the community's canonical examples: the builders who share their frameworks are disproportionately the ones who succeeded.

---

### 4.9 False Precision Traps and Calibration Methods

#### Theory & Mechanism

False precision is a pervasive meta-problem affecting all numerical scoring frameworks. It occurs when a framework produces scores with more apparent precision than the underlying inputs warrant, leading decision makers to treat meaningless score differences as actionable signal.

The psychological mechanism is well-characterized. Kahneman and Tversky (1979) identified the "inside view" problem: decision makers focus on the specifics of the decision at hand rather than consulting base rates from comparable decisions. Lovallo and Kahneman (2003) expanded this into the planning fallacy: systematic underestimation of time, costs, and risks combined with systematic overestimation of benefits. In opportunity scoring, the planning fallacy manifests as consistently inflated Impact scores, consistently deflated Effort scores, and consistently overestimated Confidence scores.

The problem is structural, not merely psychological. When a RICE score is computed as (Reach x Impact x Confidence) / Effort, small errors in each input compound multiplicatively. If Reach is estimated at 10,000 with a true range of 5,000-20,000, Impact at 2 with a true range of 1-3, Confidence at 80% with a true range of 50%-100%, and Effort at 2 person-months with a true range of 1-4, the RICE score ranges from 625 to 30,000 -- a 48x range. Yet the framework presents a single point estimate (8,000) with no uncertainty bounds.

#### Literature Evidence

The calibration literature from forecasting research provides the empirical foundation. Tetlock (2005, 2015) demonstrated that untrained forecasters are poorly calibrated -- when they say they are 80% confident, they are correct approximately 60% of the time. Training in probabilistic reasoning and regular feedback improve calibration, but the improvement requires sustained practice. Tetlock's "superforecasters" -- the top 2% of calibrated predictors -- share specific cognitive habits: they think in terms of base rates, update frequently, consider multiple hypotheses, and express uncertainty in fine-grained probabilities.

Moore and Healy (2008) distinguished three forms of overconfidence: overestimation (thinking you will perform better than you will), overplacement (thinking you will perform better than others), and overprecision (excessive certainty in one's estimates). Overprecision is the most directly relevant to opportunity scoring: it manifests as tight confidence intervals around inherently uncertain estimates.

Martin (2025) found that calibration feedback using practical scoring rules does not reliably improve calibration of confidence judgments, suggesting that calibration is a skill that requires more than mechanical feedback to develop.

#### Implementations & Benchmarks

**Reference class forecasting** (Kahneman and Lovallo 2003; Flyvbjerg 2006): Instead of estimating from the inside view, identify a reference class of similar past projects, establish the empirical distribution of outcomes for that class, and use the distribution (not a point estimate) as the starting point. For opportunity scoring, this means: before scoring a new SaaS product idea, assemble base rates from 50-100 similar SaaS launches (conversion rates, time to revenue, churn rates) and anchor estimates to the distribution.

**Pre-mortem analysis** (Klein 1998): Before scoring, imagine the product has failed and enumerate the reasons. This counteracts the optimism bias by making failure modes salient before they are suppressed by scoring optimism.

**Calibration training**: Specific exercises that improve probability estimation accuracy, drawn from the forecasting literature. Philip Tetlock's Good Judgment Project demonstrated that calibration training produces durable improvements in forecast accuracy.

**Interval estimation**: Instead of single point scores, estimate ranges. "Impact will be between 1 and 3, most likely 2" conveys more honest information than "Impact = 2."

**Monte Carlo simulation**: For high-stakes decisions, parameterize each scoring input as a probability distribution and simulate thousands of scenarios to produce a distribution of total scores. This makes the uncertainty in the final score explicit.

#### Strengths & Limitations

**Strengths**: Calibration methods directly address the most fundamental problem in opportunity scoring -- that the inputs are uncertain and the outputs inherit that uncertainty. Reference class forecasting and pre-mortems are cheap to apply and produce measurable improvements in estimation accuracy. Making uncertainty explicit (through ranges or distributions) prevents the false-precision-driven failure mode of over-investing in marginally-higher-scoring alternatives.

**Limitations**: Calibration methods add cognitive overhead to every scoring exercise. Reference class construction requires historical data that may not exist for novel product categories. Pre-mortems can induce excessive caution if not balanced with pre-parade exercises (imagining success and tracing the causal path). Solo developers, who are both the estimator and the executor, face the sharpest calibration challenge: they cannot externalize the assessment to an independent evaluator, and their personal attachment to ideas systematically biases their estimates upward.

---

### 4.10 Composite Scoring for AI-Augmented Solo Builders

#### Theory & Mechanism

The AI-augmented solo builder occupies a position that no existing framework was designed for. They combine the market ambition of a startup founder (thinking in TAM/SAM/SOM terms), the feature-level decision making of a product manager (needing ICE/RICE-style prioritization), and the personal economics of an indie hacker (evaluating effort-to-revenue ratios against opportunity cost). They also face a unique constraint profile: AI tools compress implementation time but not architecture, customer discovery, or go-to-market time. Build cost has collapsed; distribution cost has not.

A composite scoring framework for this population must satisfy five design requirements:

1. **Multi-scale**: It must evaluate at both the product level (should I build this?) and the feature level (what should I build first?).
2. **Low-data compatible**: It must produce useful output when the builder has no usage data, no customer surveys, and limited market research.
3. **Effort-realistic**: It must account for AI-compressed implementation time while properly weighting the non-implementation phases (architecture, distribution, operations) that AI does not compress.
4. **Calibration-aware**: It must incorporate mechanisms to counteract the planning fallacy and overconfidence.
5. **Time-bounded**: The scoring process itself must be completable in hours, not weeks.

The composite approach synthesizes elements from multiple frameworks:

- **From TAM/SAM/SOM**: A simplified market viability check -- not a dollar estimate, but a three-level classification (niche: <$100M TAM; mid-market: $100M-$1B; large: >$1B) that determines the ceiling on personal revenue.
- **From bottom-up sizing**: A customer-count exercise: "Can I identify 1,000 potential customers by name, handle, or location?" as a binary viability signal.
- **From ICE**: The speed-oriented scoring mechanism, adapted with anchored scales and explicit calibration checks.
- **From indie hacker heuristics**: Distribution advantage as a first-class scoring dimension, weighted at 30% or more of total score.
- **From calibration research**: Mandatory pre-mortem, reference class anchoring, and interval estimation instead of point scores.

#### Literature Evidence

No published academic literature exists on composite opportunity scoring for AI-augmented solo builders specifically. The synthesis draws on three streams:

First, the AI-augmented development literature (Grey Journal 2026; PrometAI 2026; Azilen 2026) documents the economic transformation: in 2026, a full solopreneur tech stack costs $3,000-$12,000 per year, solo founders represent 35% of new startups (up from 17% in 2015), and cases like Maor Shlomo's Base44 ($80M acquisition, built entirely solo with AI tools) demonstrate the ceiling of AI-augmented solo building.

Second, the distribution-over-build literature (Kahl 2023; numerous indie hacker practitioners) establishes that in an AI-commoditized build environment, the recommended time allocation is approximately 30% building, 70% distributing. This has direct implications for scoring: frameworks that weight "ease of implementation" heavily are miscalibrated for the current environment where implementation is cheap and distribution is expensive.

Third, the calibration and forecasting literature (Tetlock 2015; Kahneman and Lovallo 2003) provides the tools for avoiding false precision in a framework that will be applied by a single person with obvious conflicts of interest (the builder scoring their own idea).

#### Implementations & Benchmarks

**Proposed structure** (synthesized from surveyed frameworks):

A composite scoring approach for AI-augmented solo builders might evaluate opportunities across five dimensions:

1. **Market Viability** (pass/fail gate): Can 1,000+ potential customers be identified? Is there evidence of willingness to pay (existing competitors charging, adjacent products with revenue)?
2. **Distribution Advantage** (1-10, anchored): Does the builder have an existing channel, audience, community position, or domain credibility? Anchored scale: 1 = no channel, no expertise; 5 = domain expert with no audience; 8 = active audience of 1,000+ in the target niche; 10 = established authority with direct distribution to target customers.
3. **AI-Adjusted Effort** (1-10, inverted): How much non-implementation work does this product require? High scores (easy) for products whose complexity concentrates in implementation (UI, CRUD, content). Low scores (hard) for products requiring novel architecture, real-time systems, regulatory compliance, or multi-stakeholder coordination. This dimension explicitly excludes implementation effort, which AI compresses.
4. **Revenue Ceiling** (1-10, anchored): What is the realistic solo-operator revenue potential? Anchored to reference classes: 1 = $0-$1K MRR; 3 = $1K-$5K MRR; 5 = $5K-$10K MRR; 7 = $10K-$30K MRR; 9 = $30K-$100K MRR; 10 = >$100K MRR.
5. **Confidence** (50%-100%): How much supporting evidence exists? 50% = gut feeling only; 70% = observed competition and demand signals; 85% = direct customer conversations; 100% = pre-sales or waitlist data.

**Calibration checks**: (a) Pre-mortem: "What would cause this to fail?" List three failure modes before scoring. (b) Reference class: "What are three similar products? What revenue did they reach? How long did it take?" (c) Interval estimation: Score each dimension as a range (e.g., Distribution: 4-6) and compute best-case and worst-case composite scores.

**No validated benchmarks exist** for this composite approach. It represents a synthesis that has not been empirically tested at scale.

#### Strengths & Limitations

**Strengths**: Addresses the specific constraint profile of AI-augmented solo builders. Weights distribution (the binding constraint in 2026) appropriately. Incorporates calibration mechanisms that most practitioner frameworks lack. The pass/fail market viability gate prevents wasting scoring effort on non-viable opportunities. Anchored scales reduce inter-temporal inconsistency.

**Limitations**: The framework is novel and unvalidated -- it has no empirical track record. The five dimensions and their implicit weights reflect current (2026) conditions; as AI tools evolve to compress more of the non-implementation work, the weights should shift. A single builder scoring their own idea cannot fully debias through self-administered calibration checks; external review (mastermind group, advisor, community feedback) remains necessary. The composite score still produces a number, and the temptation to over-interpret small score differences remains.

---

## 5. Comparative Synthesis

The following table compares all surveyed frameworks across eight dimensions relevant to B2C product ideation.

| Dimension | TAM/SAM/SOM | Bottom-Up Sizing | ICE | RICE | Weighted Matrix | OST | ODI (Ulwick) | Indie Heuristics | Composite AI-Solo |
|---|---|---|---|---|---|---|---|---|---|
| **Output type** | Dollar estimate | Dollar estimate | Score (1-1000) | Score (continuous) | Score (continuous) | Structure (tree) | Score (0-20) | Classification | Score + classification |
| **Data requirement** | Industry reports | Customer counts | Expert judgment | Usage data | Varies | Customer research | Survey (n=180+) | Market observation | Mixed (low-data compatible) |
| **Time to apply** | Days-weeks | Days-weeks | Minutes | Hours | Hours-days | Days-weeks | Weeks-months | Hours | Hours |
| **Pre-launch usable** | Partially | Yes | Yes | Poorly | Yes | Partially | Requires customers | Yes | Yes |
| **Solo-dev appropriate** | Poorly | Moderately | Moderately | Poorly | Moderately | Poorly | Poorly | Yes | Yes (designed for) |
| **Calibration built-in** | No | Cross-reference check | No | Confidence % only | No | No | Survey-based | Monetization test | Pre-mortem + reference class |
| **False precision risk** | High (dollar precision) | Moderate | High (multiplicative) | High (multiplicative) | High (additive) | Low (structural) | Moderate (survey-based) | Low (categorical) | Moderate (mitigated) |
| **Bias vulnerability** | TAM inflation | Segment definition bias | Unanchored scales | Effort underestimation | Weight manipulation | Confirmation bias in research | Stated-preference bias | Survivorship bias | Self-assessment bias |

**Key trade-offs observed across the landscape**:

**Speed vs. Rigor**: ICE and indie hacker heuristics can be applied in minutes; ODI and full TAM/SAM/SOM analysis require weeks to months. The frameworks occupy a Pareto frontier: no framework is simultaneously fast and rigorous. The appropriate choice depends on the stakes of the decision and the cost of being wrong.

**Data Dependence vs. Judgment Dependence**: ODI and RICE require external data (customer surveys, usage metrics); ICE and indie hacker heuristics require only the evaluator's judgment. Data-dependent frameworks are more accurate when data is available and more misleading when data is fabricated to satisfy the framework's requirements. Judgment-dependent frameworks are faster but vulnerable to cognitive biases.

**Feature-Level vs. Product-Level**: RICE, ICE, and weighted scoring matrices were designed for feature prioritization within an existing product. TAM/SAM/SOM, ODI, and indie hacker heuristics were designed for product-level or market-level evaluation. Applying a feature-level framework to a product-level decision (or vice versa) produces category errors -- using RICE to choose between "build a fitness app" and "build a bookkeeping tool" is a misuse of the framework.

**Individual vs. Team**: ICE, RICE, weighted scoring, and OST assume a team context where multiple perspectives calibrate against each other. TAM/SAM/SOM is typically a specialist analyst function. Indie hacker heuristics and the composite AI-solo framework are the only approaches designed for individual use, which makes them simultaneously more efficient and more vulnerable to individual biases.

**Compensatory vs. Non-Compensatory**: Most numerical scoring frameworks (ICE, RICE, weighted scoring) are compensatory -- high scores on one dimension offset low scores on another. This means a product with zero distribution advantage but high revenue potential can score well, even though zero distribution may be a fatal flaw. Non-compensatory approaches (pass/fail gates, ODI's underserved threshold) enforce minimum standards on critical dimensions.

---

## 6. Open Problems & Gaps

### 6.1 No Validated Benchmark Dataset

The opportunity scoring field lacks a standardized benchmark -- a dataset of scored opportunities with known outcomes that could be used to evaluate framework accuracy. Unlike weather forecasting (where Brier scores compare forecasts to observed outcomes) or medical diagnosis (where sensitivity/specificity are computed against pathology), opportunity scoring frameworks cannot be objectively evaluated because the counterfactual (what would have happened if a different opportunity were pursued) is unobservable. This is a fundamental epistemological limitation, not merely a data collection problem.

### 6.2 Calibration for Solo Evaluators

All calibration research (Tetlock 2005, 2015; Moore and Healy 2008) assumes either group forecasting or external feedback loops. Solo developers evaluating their own product ideas have neither. How to calibrate a single individual's opportunity assessments when they are both the forecaster and the executor, when they have emotional attachment to outcomes, and when feedback is delayed by months or years, is an unsolved problem. The closest analog is the calibration training programs for individual intelligence analysts, which show modest but durable improvements.

### 6.3 Dynamic Scoring in Shifting Markets

All surveyed frameworks produce static scores -- snapshots valid at the time of assessment. Markets, competition, technology, and personal circumstances change continuously. No widely adopted framework incorporates a mechanism for systematic re-scoring, decay functions (automatically reducing confidence over time), or trigger-based re-evaluation (re-score when a major competitor enters or a key assumption is invalidated). The OST comes closest with its "living document" philosophy, but even it lacks a formal update protocol.

### 6.4 Distribution Weighting in the AI Era

The collapse of build costs due to AI tools has shifted the binding constraint from implementation to distribution. Most existing frameworks (ICE, RICE, weighted scoring) were designed in an era when implementation effort was the primary bottleneck and weight it accordingly. No empirically validated framework exists that properly weights distribution advantage in the post-AI-commoditization environment. The composite framework proposed in Section 4.10 addresses this conceptually but lacks empirical validation.

### 6.5 Cross-Framework Comparability

Scores from different frameworks are incommensurable. A RICE score of 500 cannot be compared to an ICE score of 500 or an ODI opportunity score of 14. When a team or individual uses different frameworks for different decisions (RICE for features, TAM/SAM/SOM for markets, indie heuristics for product selection), there is no meta-framework for integrating these assessments into a coherent decision. Portfolio theory from finance (Markowitz 1952) provides conceptual tools for optimizing across opportunities with different risk-return profiles, but translating these tools to product portfolios requires solving the measurement problems first.

### 6.6 Interaction Effects Between Opportunities

All surveyed frameworks evaluate opportunities independently. In practice, opportunities interact: building product A may create distribution advantage for product B; entering market X may cannibalize revenue from market Y; the skills developed while building one product reduce effort for the next. No opportunity scoring framework accounts for these interaction effects, portfolio synergies, or temporal dependencies between sequential product decisions. This is particularly relevant for solo builders who develop portfolios of small products (the "30-app portfolio" model documented in the indie hacker community), where portfolio-level optimization differs from opportunity-level optimization.

---

## 7. Conclusion

Opportunity scoring frameworks for B2C product ideation span a wide landscape from venture capital market sizing to indie hacker gut-check heuristics, with product management prioritization methods occupying the middle ground. The frameworks differ along every relevant dimension: input data requirements, output precision, time to apply, target user, and theoretical foundations. The landscape is characterized by a fundamental tension between analytical rigor (which demands data, time, and expertise) and practical applicability (which demands speed, simplicity, and low-data compatibility).

The surveyed frameworks share a common failure mode: they produce numerical outputs that appear more precise than their inputs warrant. This false precision problem is structural, arising from the multiplicative or additive combination of uncertain estimates, and is amplified by psychological biases (overconfidence, planning fallacy, anchoring) that systematically distort the inputs. Calibration methods from the forecasting literature offer partial mitigation but require sustained practice and external feedback that solo evaluators may lack.

The emergence of AI-augmented solo builders creates demand for a new class of composite framework that combines market viability assessment, distribution advantage weighting, AI-adjusted effort estimation, and built-in calibration mechanisms. No such framework has been empirically validated. The field's open problems -- the absence of benchmark datasets, the unsolved calibration problem for solo evaluators, the need for dynamic re-scoring, and the lack of portfolio-level optimization -- represent both obstacles to progress and opportunities for future research.

The practitioner choosing a framework faces the same type of decision the frameworks themselves are designed to support: which tool is worth the investment, given the available data, time constraints, and stakes of the decision? The meta-answer mirrors the object-level answer: the appropriate framework depends on context, and the greatest risk is not choosing the wrong framework but applying any framework with unwarranted confidence in its precision.

---

## References

Ansoff, H. I. (1965). *Corporate Strategy*. McGraw-Hill.

Belton, V. and Stewart, T. J. (2002). *Multiple Criteria Decision Analysis: An Integrated Approach*. Springer.

Bhide, A. (1992). "Bootstrap Finance: The Art of Start-Ups." *Harvard Business Review*, 70(6), 109-117.

Blank, S. (2013). *The Four Steps to the Epiphany*. K&S Ranch.

Brown, T. (2009). *Change by Design*. Harper Business.

Cagan, M. (2018). *Inspired: How to Create Tech Products Customers Love*. 2nd ed. Wiley.

Carrascal, J. P. (2022). "What is the Opportunity Score? (And how to calculate it)." *UXR @ Microsoft*, Medium. https://medium.com/uxr-microsoft/what-is-the-opportunity-score-and-how-to-obtain-it-bb81fcbf79b7

Christensen, C. M., Hall, T., Dillon, K., and Duncan, D. S. (2016). *Competing Against Luck*. Harper Business.

Cinelli, M., Kadziński, M., Miebs, G., Gonzalez, M., and Słowiński, R. (2020). "How to Support the Application of Multiple Criteria Decision Analysis? Let Us Start with a Comprehensive Taxonomy." *Omega*, 96, 102261. https://pmc.ncbi.nlm.nih.gov/articles/PMC7970504/

Ellis, S. (2017). *Hacking Growth*. Crown Business.

Fitzpatrick, R. (2013). *The Mom Test*. CreateSpace.

Flyvbjerg, B. (2006). "From Nobel Prize to Project Management: Getting Risks Right." *Project Management Journal*, 37(3), 5-15.

Gilad, I. (2019). "Product Discovery With ICE and The Confidence Meter." https://itamargilad.com/the-tool-that-will-help-you-choose-better-product-ideas/

Gompers, P. A., Gornall, W., Kaplan, S. N., and Strebulaev, I. A. (2020). "How Do Venture Capitalists Make Decisions?" *Journal of Financial Economics*, 135(1), 169-190.

Kahl, A. (2023). *The Bootstrapped Founder*. Newsletter and podcast. https://thebootstrappedfounder.com/

Kahneman, D. and Tversky, A. (1979). "Prospect Theory: An Analysis of Decision under Risk." *Econometrica*, 47(2), 263-291.

Kaplan, S. N. and Stromberg, P. (2004). "Characteristics, Contracts, and Actions: Evidence from Venture Capitalist Analyses." *Journal of Finance*, 59(5), 2177-2210.

Keeney, R. L. and Raiffa, H. (1976). *Decisions with Multiple Objectives*. Wiley.

Klein, G. (1998). *Sources of Power: How People Make Decisions*. MIT Press.

Levels, P. (2018). *MAKE: Bootstrapper's Handbook*. https://readmake.com/

Limaylla-Lunarejo, M. I. et al. (2025). "Systematic Mapping of AI-Based Approaches for Requirements Prioritization." *IET Software*. https://ietresearch.onlinelibrary.wiley.com/doi/abs/10.1049/sfw2/8953863

Lovallo, D. and Kahneman, D. (2003). "Delusions of Success: How Optimism Undermines Executives' Decisions." *Harvard Business Review*, 81(7), 56-63.

Marcketti, S. B., Niehm, L. S., and Fuloria, R. (2006). "An Exploratory Study of Lifestyle Entrepreneurship and Its Relationship to Life Quality." *Family and Consumer Sciences Research Journal*, 34(3), 241-259.

Markowitz, H. (1952). "Portfolio Selection." *Journal of Finance*, 7(1), 77-91.

Martin, A. (2025). "Calibration Feedback With the Practical Scoring Rule Does Not Improve Calibration of Confidence." *Futures & Foresight Science*. https://onlinelibrary.wiley.com/doi/full/10.1002/ffo2.199

Maurya, A. (2012). *Running Lean*. O'Reilly Media.

McBride, S. (2018). "RICE: Simple prioritization for product managers." Intercom Blog. https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/

Moore, D. A. and Healy, P. J. (2008). "The Trouble with Overconfidence." *Psychological Review*, 115(2), 502-517.

Olsen, D. (2015). *The Lean Product Playbook*. Wiley.

Patton, J. (2014). *User Story Mapping*. O'Reilly Media.

Porter, M. E. (1980). *Competitive Strategy*. Free Press.

Saaty, T. L. (1980). *The Analytic Hierarchy Process*. McGraw-Hill.

Savage, L. J. (1954). *The Foundations of Statistics*. Wiley.

Simon, H. A. (1955). "A Behavioral Model of Rational Choice." *Quarterly Journal of Economics*, 69(1), 99-118.

Tetlock, P. E. (2005). *Expert Political Judgment*. Princeton University Press.

Tetlock, P. E. and Gardner, D. (2015). *Superforecasting: The Art and Science of Prediction*. Crown.

Torres, T. (2021). *Continuous Discovery Habits*. Product Talk LLC. https://www.producttalk.org/

Tyebjee, T. T. and Bruno, A. V. (1984). "A Model of Venture Capitalist Investment Activity." *Management Science*, 30(9), 1051-1066.

Ulwick, A. W. (2002). "Turn Customer Input into Innovation." *Harvard Business Review*, 80(1), 91-97.

Ulwick, A. W. (2005). *What Customers Want*. McGraw-Hill.

Ulwick, A. W. (2016). *Jobs to Be Done: Theory to Practice*. Idea Bite Press. https://anthonyulwick.com/

Velasquez, M. and Hester, P. T. (2013). "An Analysis of Multi-Criteria Decision Making Methods." *International Journal of Operations Research*, 10(2), 56-66.

von Neumann, J. and Morgenstern, O. (1944). *Theory of Games and Economic Behavior*. Princeton University Press.

Yaseen, M. et al. (2025). "Scalability and Limitations of Existing Software Requirements Prioritization Techniques: A Systematic Literature Review." *Journal of Software: Evolution and Process*. https://onlinelibrary.wiley.com/doi/abs/10.1002/smr.70039

---

## Practitioner Resources

### Market Sizing Tools
- **PM Toolkit TAM/SAM/SOM Calculator** -- Free interactive calculator with investor-ready output. https://pmtoolkit.ai/calculators/market-sizing
- **Pear VC Market Sizing Guide** -- Detailed walkthrough of both top-down and bottom-up methods with startup examples. https://pear.vc/market-sizing-guide/
- **Visible.vc Bottom-Up Sizing Guide** -- Step-by-step bottom-up methodology with data source recommendations. https://visible.vc/blog/bottom-up-market-sizing/
- **Statista, IBISWorld, Gartner** -- Industry report databases for top-down TAM data (paid subscriptions).

### Prioritization Framework Tools
- **airfocus** -- Product management platform with native ICE, RICE, weighted scoring, and custom framework support. https://airfocus.com/
- **ProductPlan** -- Roadmap tool with built-in RICE and weighted scoring. https://www.productplan.com/
- **1000minds** -- MCDA tool implementing the PAPRIKA method for formal weight elicitation and multi-criteria ranking. https://www.1000minds.com/
- **Savio** -- Feature voting and prioritization with RICE, ICE, and weighted scoring templates. https://www.savio.io/

### Opportunity Discovery
- **Product Talk (Teresa Torres)** -- OST templates, courses, and the Continuous Discovery Habits community. https://www.producttalk.org/
- **Strategyn (Anthony Ulwick)** -- ODI methodology resources and published case studies. https://anthonyulwick.com/
- **Miro OST Template** -- Free Opportunity Solution Tree template for collaborative mapping. https://miro.com/templates/opportunity-solution-tree/

### Indie Hacker Evaluation
- **Indie Hackers** -- Community forum with revenue-verified product profiles, AMAs, and ideation discussions. https://www.indiehackers.com/
- **NichesHunter** -- AI-powered niche validation tool for solo developers, scanning competition and demand. https://nicheshunter.app/
- **MAKE by Pieter Levels** -- Bootstrapper's handbook covering idea validation, building, launching, and monetization. https://readmake.com/
- **The Mom Test by Rob Fitzpatrick** -- Customer conversation framework for validating ideas without leading questions. https://www.momtestbook.com/

### Calibration & Decision Quality
- **Good Judgment Open** -- Free forecasting tournament for calibration practice, based on Tetlock's research. https://www.gjopen.com/
- **CFAR (Center for Applied Rationality)** -- Workshops on debiasing and calibrated decision making. https://www.rationality.org/
- **Reference Class Forecasting resources** -- Flyvbjerg's publications on mitigating the planning fallacy through base-rate analysis. https://arxiv.org/abs/2202.00125

### Comparative Guides
- **Atlassian Prioritization Frameworks** -- Side-by-side comparison of RICE, MoSCoW, Kano, and value-vs-effort. https://www.atlassian.com/agile/product-management/prioritization-framework
- **monday.com Product Prioritization Guide (2026)** -- Overview of 10+ frameworks with use-case recommendations. https://monday.com/blog/rnd/product-prioritization-frameworks/
- **Highberg Framework Comparison** -- Structured comparison of Kano, MoSCoW, RICE, and weighted scoring methods. https://highberg.com/insights/a-comparison-of-prioritization-methods/
