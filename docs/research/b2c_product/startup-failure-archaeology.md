---
title: "Startup Failure Archaeology: Mining Postmortems for Product Opportunity"
date: 2026-03-21
summary: Survey of startup postmortem databases, failure decomposition methodologies, timing-was-wrong revival identification, competitive graveyard analysis, and systematic approaches to extracting product opportunities from failed ventures.
keywords: [b2c-product, startup-failure, postmortem-analysis, failure-archaeology, opportunity-revival]
---

# Startup Failure Archaeology: Mining Postmortems for Product Opportunity

*2026-03-21*

---

## Abstract

The overwhelming majority of entrepreneurship research, pedagogy, and popular discourse is organized around success. The entrepreneurs studied in business schools, profiled in media, and invited to conferences are survivors. This produces a systematically distorted knowledge base: the strategies, timing decisions, market choices, and product architectures that lead to failure are undersampled relative to their base rate. Since approximately 90% of startups fail, and since many of those failures contain within them the seeds of viable future ventures, the systematic study of startup failure constitutes a large and underexploited source of product opportunity.

This paper surveys the emerging discipline of "startup failure archaeology"---the structured extraction of product opportunity intelligence from postmortem databases, shutdown records, and failure narratives. It covers the theoretical foundations (survivorship bias, organizational ecology, liability of newness), the major postmortem databases and their methodologies (CB Insights, Failory, Autopsy, Loot Drop, Startup Graveyard), failure decomposition frameworks (timing vs. execution vs. market vs. distribution), systematic approaches to identifying "good idea, bad timing" revival candidates, competitive graveyard analysis, shutdown pattern mining using Crunchbase and PitchBook data, natural language processing of postmortem corpora, pivot pattern analysis, and the use of micro-signals such as domain expiry and trademark lapse as opportunity indicators.

The survey finds that while the raw materials for failure archaeology are increasingly available---over 2,000 startup postmortems are now publicly accessible, and shutdown data from commercial databases covers millions of companies---the analytical methodologies remain fragmented and largely atheoretical. The field sits at the intersection of entrepreneurship research, competitive intelligence, and product strategy, and would benefit from greater integration across these domains.

---

## 1. Introduction

### 1.1 Problem Statement

Every year, tens of thousands of startups shut down. Each shutdown represents a natural experiment: a team invested time, capital, and effort into a specific combination of product concept, market timing, distribution strategy, and business model, and the experiment produced a negative result. These negative results contain structured information about what does not work under specific conditions---and, by implication, about what might work under different conditions. Yet this information is overwhelmingly discarded. Founders move on. Investors write off losses. The institutional memory of failure is thin and unsystematic.

The problem is not merely academic. For product strategists seeking to identify B2C opportunities, the graveyard of failed startups represents a uniquely valuable data source. A failed startup in a category that subsequently grew (Webvan before Instacart, Pets.com before Chewy, Kozmo before DoorDash) is direct evidence of latent demand that was blocked by contingent factors---insufficient enabling technology, premature market education costs, or flawed unit economics at pre-scale infrastructure costs. The systematic identification of such cases, and the decomposition of their failure into addressable and non-addressable components, is a legitimate product discovery methodology.

This paper surveys the theoretical foundations, data sources, analytical frameworks, and practical tools available for conducting this kind of failure archaeology.

### 1.2 Scope

**Covered:** Postmortem databases and their collection methodologies; academic and practitioner frameworks for failure decomposition; timing-based revival identification; competitive graveyard analysis; shutdown pattern mining from commercial databases; NLP-based postmortem corpus analysis; pivot pattern analysis; micro-signal detection from domain and trademark data; machine learning approaches to failure prediction and classification.

**Excluded:** Corporate failure in established firms (the turnaround and restructuring literature); financial distress prediction in public companies (the Altman Z-score tradition); failure in non-technology sectors; psychological and affective dimensions of entrepreneurial failure (grief, stigma, identity); the normative question of whether failure should be celebrated or destigmatized.

### 1.3 Key Definitions

**Startup postmortem:** A retrospective account, written by a founder, investor, or journalist, describing the circumstances and causes of a startup's shutdown. Postmortems vary from brief announcements to extended analytical essays.

**Failure archaeology:** The systematic extraction of product opportunity intelligence from records of failed ventures. The term emphasizes that the raw material is historical and must be excavated, contextualized, and interpreted rather than passively observed.

**Revival candidate:** A failed startup concept whose primary failure mode was contingent (timing, enabling technology, regulatory environment) rather than structural (no market need, fundamental unit economics problem), making it a candidate for re-execution under changed conditions.

**Competitive graveyard:** The set of defunct companies in a particular market category. Analysis of the graveyard can reveal whether a category is structurally hostile to startups or whether specific execution patterns differentiate survivors from casualties.

**Failure mode:** The primary mechanism by which a startup failed. Failure modes may be internal (execution, team, business model) or external (timing, regulation, competitive dynamics, enabling technology absence).

---

## 2. Foundations

### 2.1 Survivorship Bias in Entrepreneurship Research

The concept of survivorship bias---the systematic error produced by studying only entities that have passed through a selection filter---is foundational to failure archaeology. First described formally by Abraham Wald's work on aircraft damage patterns during World War II, survivorship bias has been extensively documented in finance (Elton, Gruber & Blake, 1996), management research (Denrell, 2003), and entrepreneurship studies.

In the startup context, survivorship bias operates at multiple levels. Entire academic curricula are built around case studies of successful companies: the Harvard Business School case method, which has influenced global business education, draws disproportionately from surviving firms. Popular entrepreneurship literature amplifies this: books like *Good to Great* (Collins, 2001) and *Built to Last* (Collins & Porras, 1994) have been critiqued for selecting on the dependent variable. When researchers study the characteristics of Bill Gates, Steve Jobs, or Mark Zuckerberg and attribute their success to identifiable traits, they commit the classic survivorship error by failing to examine whether failed founders shared those same traits.

Denrell (2003) formalized this problem in "Vicarious Learning, Undersampling of Failure, and the Myths of Management" (*Organization Science*), demonstrating that organizational learning from others' experience is systematically biased when failure is undersampled. The implication for product strategy is direct: if you study only successful products to identify opportunity, you will overweight the factors that correlate with survival and underweight the factors that distinguish survival from failure.

### 2.2 Organizational Ecology and Population-Level Analysis

The organizational ecology tradition, initiated by Hannan and Freeman (1977) in "The Population Ecology of Organizations" (*American Journal of Sociology*), provides the theoretical infrastructure for studying startup failure as a population-level phenomenon rather than as a series of individual tragedies. In this framework, organizations are born, compete for resources within ecological niches, and die at rates determined by population density, environmental carrying capacity, and organizational form.

Hannan and Freeman's (1984) concept of structural inertia---the tendency of organizations to resist change as they age---produces a paradox: the same rigidity that increases survival probability in stable environments increases mortality when environments shift. For startup failure archaeology, this framework suggests that waves of startup death in a particular category may signal environmental shift rather than category invalidity.

Carroll and Hannan (2000), in *The Demography of Corporations and Industries*, extended population ecology with detailed empirical studies of organizational founding and mortality rates across industries. Their work established that organizational death rates are not random but follow predictable patterns shaped by population density, age, and environmental conditions. This empirical foundation supports the premise that startup failure data contains extractable signal, not just noise.

### 2.3 Liability of Newness

Stinchcombe's (1965) concept of the "liability of newness," introduced in "Social Structure and Organizations," identifies the specific mechanisms by which new organizations face elevated mortality risk. Stinchcombe argued that new organizations are vulnerable because: (1) they require members to learn new roles without established routines; (2) they lack standardized problem-solving procedures; (3) they depend on cooperation among strangers without shared history; and (4) they have not yet established stable exchange relationships with external actors.

Freeman, Carroll, and Hannan (1983) provided systematic empirical support, demonstrating across multiple industries that organizational mortality rates decline monotonically with age. The liability of newness has been revisited in systematic literature reviews (Abatecola, Cafferata & Poggesi, 2012) and remains one of the most robust findings in organizational research.

For failure archaeology, the liability of newness is a critical filter: it predicts that a substantial fraction of startup failures will be attributable to organizational immaturity rather than to deficiencies in the underlying product concept. This means that, within any cohort of failed startups, there exists a subset whose product ideas may have been sound but whose organizational execution was fatally compromised by the challenges of newness. These are the highest-value targets for revival analysis.

### 2.4 Perez's Techno-Economic Paradigm Framework

Carlota Perez's framework of techno-economic paradigms, developed in *Technological Revolutions and Financial Capital* (2002), provides a macro-level theory of why startup timing failures cluster. Perez identifies recurring 50-60 year cycles driven by technological revolutions, each proceeding through four phases: Irruption, Frenzy, Synergy, and Maturity. The transition from Frenzy to Synergy (the "turning point") is marked by speculative bubble collapse and a period of institutional adjustment.

The Irruption and Frenzy phases produce a systematic overshooting of entrepreneurial ambition relative to infrastructure readiness. Capital floods into new technology applications before the supporting infrastructure (broadband penetration, mobile adoption, payment systems, logistics networks) has matured sufficiently to support them. The dot-com bubble is the canonical example: Webvan, Kozmo, Pets.com, and dozens of others built products for which genuine latent demand existed but for which the enabling infrastructure was five to fifteen years premature.

Perez's framework suggests that the period immediately following a bubble collapse is uniquely rich in revival candidates: the Frenzy phase generated and tested many product concepts, the bubble collapse killed them, and the subsequent Synergy phase provides the infrastructure maturity that the original ventures lacked. This is a structural, not anecdotal, prediction about the distribution of "good idea, bad timing" failures across economic history.

---

## 3. Taxonomy of Approaches

The following table classifies the major approaches to startup failure archaeology along five dimensions: data source, analytical method, primary output, temporal scope, and accessibility.

| Approach | Data Source | Method | Primary Output | Temporal Scope | Accessibility |
|---|---|---|---|---|---|
| Postmortem database analysis | CB Insights, Failory, Autopsy, Loot Drop | Qualitative coding, thematic analysis | Failure reason taxonomy, frequency distributions | 2000--present | Free to freemium |
| Failure mode decomposition | Academic frameworks (Eisenmann, Cantamessa) | Structured classification against theoretical models | Typed failure diagnoses (timing/execution/market/distribution) | N/A (framework) | Open (published research) |
| Revival identification | Postmortem databases + market data | Gap analysis: failed concept vs. current enabling conditions | Prioritized list of revival candidates | Rolling | Manual, high-effort |
| Competitive graveyard analysis | Crunchbase, PitchBook, category databases | Population-level mortality statistics by category | Category risk profiles, survivor-vs-casualty contrasts | 2005--present | Paid (database subscriptions) |
| Shutdown pattern mining | Crunchbase, PitchBook, Tracxn | Quantitative analysis of funding, team, timing data | Predictive models, cohort survival curves | 2005--present | Paid |
| Postmortem corpus NLP | Autopsy, HN, blog posts | Topic modeling, sentiment analysis, NER | Automated failure theme extraction | 2010--present | Open (with engineering effort) |
| Pivot pattern analysis | CB Insights, media reports, GitHub datasets | Case survey, pattern matching | Pivot type taxonomy, triggering factors | 2000--present | Open to freemium |
| Micro-signal mining | WHOIS records, USPTO/EUIPO, DNS logs | Domain monitoring, trademark search | Early shutdown detection, lapsed IP opportunities | Rolling | Free to low-cost |

---

## 4. Analysis

### 4.1 Postmortem Database Analysis

#### Theory & Mechanism

Postmortem databases aggregate retrospective accounts of startup failure into searchable, categorized collections. The theoretical premise is that founder-written postmortems, despite their inherent biases (self-serving attribution, incomplete information, narrative smoothing), contain extractable signal about failure causes when analyzed at scale. The aggregation of many postmortems enables statistical regularities to emerge that are invisible in any individual account.

The major databases differ in scope, curation methodology, and analytical depth:

**CB Insights** maintains the most widely cited postmortem collection, with 483 startup failure postmortems compiled as of 2024. CB Insights pairs the raw postmortems with structured analysis, including their frequently cited "Top Reasons Startups Fail" reports. Their methodology involves reading each postmortem and coding the stated failure reasons against a standardized taxonomy. The most recent analysis (covering October 2023 through May 2024) reflects the post-2022 funding contraction, with venture funding remaining 68% below 2021 peak levels. The top failure reasons in the CB Insights taxonomy are: lack of market need (42%), running out of cash (29%), wrong team (23%), outcompeted (19%), pricing/cost issues (18%), and poor product (17%).

**Autopsy** (getautopsy.com), launched in 2015, holds over 2,000 postmortems---the largest publicly accessible collection. Marc Andreessen described it at launch as "the catalog of future successful startups." Autopsy accepts community submissions, filters out spam and what they term "bitter posts," and publishes curated postmortems predominantly covering Pre-seed to Series A startups. Their own analysis of 300 postmortems produced a top-10 failure reason ranking.

**Failory** operates both a postmortem database (400+ entries with structured metadata: country, industry, customer type, cause of failure) and a "Startup Cemetery" featuring detailed analytical writeups of individual failures. Failory's differentiator is its interview-based methodology, conducting structured interviews with failed founders to produce standardized failure narratives.

**Loot Drop** (loot-drop.io) represents the most explicitly opportunity-oriented database, tracking 1,600+ failed startups representing over $40 billion in burned venture capital across 22 product categories, 10 sectors, and 50+ countries. Its distinctive contribution is the "Rebuild Plan"---an AI-generated business concept extracted from each failed startup, including updated market analysis, suggested tech stack, revenue model, and mistakes to avoid. Loot Drop also produces "Deep Dives" into failure patterns within specific product categories and generates market potential scores, difficulty ratings, and scalability ratings.

**Startup Graveyard** (startupgraveyard.io) focuses on data visualization, presenting failure data as an interactive resource with filterable categories and visual pattern exploration. Academic research using this dataset (e.g., published in *Learning from Failure: Insights from the Start-ups' Graveyard*, 2024) has employed qualitative methodology with in-depth thematic analysis, identifying nearly 90 unique failure lessons distilled into 30 distinct failure reasons.

#### Literature Evidence

The Fractl research team analyzed 193 startup postmortems, examining both founder-written essays and press coverage. Their key finding was that no single issue dominated as the primary failure cause; rather, most startups attributed failure to a combination of reasons. The major categories were: weak business model (26%), running out of money (24%), inability to get financing (13%), insufficient traction (18%), and no market need (12%). Sector-specific patterns emerged: fashion companies most frequently cited funding problems; social media companies struggled with traction and business model viability; software companies over-prioritized technical development at the expense of customer needs.

A HackerNoon analysis of 256 failed startups found that product-market fit issues drove shutdowns repeatedly from 2014 to 2018. Failure to pivot away from bad decisions quickly enough accounted for 7% of postmortem mentions. Team and cofounder discord, investor relationship breakdowns, and ignoring user feedback constituted recurring themes across the corpus.

Expert.ai (formerly Expert System) conducted an NLP analysis of the Autopsy.io corpus using their Cogito semantic analysis technology. The automated concept extraction identified "Company," "Product," "Investor," "Startup," "Money," "App," "Team," and "Website" as the ten most frequently referenced concepts in failure narratives, providing a machine-readable decomposition of the semantic space of startup failure.

#### Implementations & Benchmarks

The primary implementation pattern is manual qualitative analysis: researchers read postmortems and code them against a failure taxonomy. This approach is high-fidelity but does not scale. The expert.ai analysis demonstrated that NLP-based approaches can automate concept extraction, but the semantic complexity of failure narratives (irony, counterfactual reasoning, multi-causal attribution) limits the accuracy of fully automated classification.

Loot Drop's AI-generated Rebuild Plans represent the most ambitious attempt to automate the transition from failure analysis to opportunity identification. Each plan includes five sections: what to build, market analysis, execution steps, tech stack, and revenue model. The quality and reliability of these automated plans has not been independently evaluated in peer-reviewed research.

#### Strengths & Limitations

**Strengths:** Postmortem databases provide rich qualitative data unavailable from quantitative databases alone. Founder narratives include strategic reasoning, pivot decisions, customer feedback, and team dynamics that structured data cannot capture. The databases are increasingly comprehensive and accessible.

**Limitations:** Self-report bias is endemic: founders may attribute failure to external factors (market timing, competition) while underreporting internal factors (team conflict, poor execution). Survivorship bias operates even within failure data---founders of the most catastrophic failures may not write postmortems. The databases overrepresent English-speaking, US-centric, technology-focused startups. Taxonomy inconsistency across databases makes cross-database comparison difficult.

---

### 4.2 Failure Mode Decomposition

#### Theory & Mechanism

Failure mode decomposition is the systematic classification of startup failures into typed categories based on the primary mechanism of failure. The premise is that different failure modes have different implications for opportunity identification: a timing failure suggests revival potential, while a "market doesn't exist" failure suggests permanent category avoidance.

The field has produced several competing decomposition frameworks:

**The Four-Mode Framework** (practitioner consensus): The most commonly referenced decomposition distinguishes four primary failure modes: (1) **Timing-was-wrong** --- the product concept was sound but the market, technology, or infrastructure was not ready; (2) **Execution-was-wrong** --- the market existed but the team failed to build, ship, or sell effectively; (3) **Market-doesn't-exist** --- the hypothesized customer need was not real or not large enough; (4) **Distribution-failed** --- the product worked but the startup could not acquire or retain customers at viable unit economics.

**Eisenmann's Diamond-and-Square Framework** (2021): Harvard Business School professor Tom Eisenmann, in *Why Startups Fail*, proposed a more granular framework based on extensive research. The "diamond" represents the opportunity (customer value proposition, go-to-market strategy, technology and operations, cash flow formula) and the "square" represents resource contributors (founders, team, investors, strategic partners). Eisenmann identifies six recurring failure patterns: three early-stage (Bad Bedfellows, False Start, False Positive) and three late-stage (Speed Trap, Help Wanted, Cascading Miracles). The False Start pattern---rushing to market without adequate customer research---directly addresses the execution failure mode. The False Positive pattern---misinterpreting early-adopter traction as mainstream demand---maps to a specific subtype of market-doesn't-exist failure.

**Cantamessa's SHELL Model Adaptation** (2018): Cantamessa et al., publishing in *Sustainability*, adapted the SHELL model from aviation safety analysis to startup failure classification. In this adaptation, Software maps to the business model, Hardware to the product, Environment to the startup's external context, central Liveware to the organization, and peripheral Liveware to the customer/user. This model enables multi-dimensional classification: a single failure can be coded across multiple SHELL interfaces (e.g., Software-Environment = business model failure under specific environmental conditions). Their analysis of startup failures identified main factors including lack of funding, product-market misfit, inexperience, bad organization, and cofounder misalignment.

**Core Competency Deficit Model** (2024): Published in *Frontiers in Psychology*, this framework adapted Spencer's behavioral competency model to startup failure analysis. Using a modified Critical Incident Technique on 50 online failure accounts, the researchers identified two pivotal competency deficits: information-seeking and customer service orientation. Secondary deficits included technical expertise, analytical thinking, and flexibility. This model shifts the unit of analysis from the venture to the team, arguing that competency deficits are the proximal cause of most failure modes.

#### Literature Evidence

Bill Gross's Idealab research, presented in his 2015 TED talk "The Single Biggest Reason Why Startups Succeed," analyzed 200 companies (100 Idealab portfolio companies, 100 externally funded) and ranked five success factors. Timing accounted for 42% of the variance between success and failure, followed by team/execution (32%), idea uniqueness (28%), business model (24%), and funding (14%). This remains the most widely cited empirical evidence for the primacy of timing as a failure mode.

A 2022 study in *Total Quality Management & Business Excellence* applied quality management approaches to entrepreneurial failure analysis, conceptualizing failure factors along two dimensions: locus (internal vs. external) and business domain (financial, organizational, product-market, legal). The intersection of these dimensions produces a grid for positioning specific failure causes, enabling more nuanced decomposition than single-axis taxonomies.

A 2025 study in the *Journal of Innovation and Entrepreneurship* analyzed 40 ICT startups in voluntary liquidation using the SHELL model and found that the dominant failure factors were dynamic capabilities rather than static resources---supporting dynamic capability theory over resource-based view as an explanatory framework for startup failure.

#### Implementations & Benchmarks

Failure mode decomposition is primarily implemented through manual expert analysis. No automated system reliably distinguishes timing failures from execution failures from market-doesn't-exist failures, because the distinction often requires counterfactual reasoning (e.g., "Would this product have succeeded with better technology infrastructure?") that exceeds current NLP capabilities.

Practitioners typically apply decomposition frameworks retroactively to postmortem data. The most structured implementation is Eisenmann's six-pattern model, which provides diagnostic questions for each pattern (e.g., for False Start: "Did the team conduct adequate customer discovery before building?").

#### Strengths & Limitations

**Strengths:** Decomposition transforms raw failure data into actionable categories. A typed failure diagnosis directly implies a response: timing failures suggest monitoring for enabling condition changes; execution failures suggest the same concept with a different team; market failures suggest abandoning the category.

**Limitations:** Most failures are multi-causal, making single-mode classification artificial. The four-mode framework lacks rigorous operationalization---how much timing disadvantage qualifies as a "timing failure" rather than an "execution failure in not waiting"? Attribution is confounded: founders disproportionately attribute failure to external timing while investors disproportionately attribute it to execution. Eisenmann's six-pattern model is richer but was derived inductively from case studies and has not been validated against large-scale quantitative data.

---

### 4.3 "Good Idea, Bad Timing" Revival Identification

#### Theory & Mechanism

Revival identification is the process of systematically scanning failed startup concepts for those whose primary failure mode was timing-related and whose enabling conditions have since changed. The theoretical basis combines Gross's timing primacy finding with Perez's techno-economic paradigm framework: if timing is the single most important factor in startup success, and if technology infrastructure matures on predictable S-curves, then there should exist a population of failed concepts that become viable as infrastructure catches up.

The identification methodology involves three steps: (1) **Failure diagnosis**: classify the failure as primarily timing-related using decomposition frameworks; (2) **Enabling condition assessment**: identify the specific enabling conditions that were absent (bandwidth penetration, smartphone adoption, GPS accuracy, payment rail maturity, regulatory change, consumer behavior shift); (3) **Current readiness evaluation**: assess whether those enabling conditions have been met or are on a trajectory to be met within a relevant planning horizon.

Gabor Cselle's "Four Scenarios of Startup Timing" framework provides a useful typology. Scenario 1 (Small and Not Growing) represents a fundamentally unviable market. Scenario 2 (Too Early) is the classic revival candidate: the market will grow, but the startup arrived before the growth inflection. Scenario 3 (Too Late) represents missed windows. Scenario 4 (Right Timing) is the target state. The revival identification methodology is essentially a search for Scenario 2 failures that have transitioned, or are transitioning, into Scenario 4 conditions.

Wing Venture Capital's "Why Now" framework operationalizes this with three assessment dimensions: enabling technologies (have the necessary technical capabilities matured?), market readiness (have consumer habits shifted sufficiently?), and economic viability (do unit economics work at current infrastructure costs?). All three conditions must be met for a revival to be viable.

#### Literature Evidence

The canonical cases of successful timing-based revival are well documented:

**Webvan to Instacart:** Webvan raised over $400 million and went bankrupt in 2001 attempting grocery delivery. The enabling conditions absent in 2001---ubiquitous smartphones, GPS-equipped gig workers, mature payment APIs, consumer comfort with app-based ordering---were all present by 2012 when Instacart launched. Instacart reached an $8 billion market capitalization.

**Pets.com to Chewy:** Pets.com, the emblematic dot-com failure, liquidated in 2001 after burning through $300 million. Chewy launched in 2011 and achieved a $9 billion+ market capitalization, selling the same core product (pet supplies online) with the benefit of mature e-commerce infrastructure, lower shipping costs, and subscription model innovations.

**Kozmo to DoorDash/GoPuff:** Kozmo.com promised one-hour delivery from 1998 and burned $250 million before shutting down in 2001. DoorDash, Uber Eats, and GoPuff now operate the same model profitably at scale, enabled by smartphone-based logistics coordination that was physically impossible in 1998.

**WebTV to Smart TVs:** WebTV launched internet-connected televisions in the mid-1990s and failed commercially. By 2020, internet-connected TVs were the default configuration.

These cases demonstrate that the magnitude of value created by successful revival can be enormous---measured in tens of billions of dollars in aggregate---and that the temporal gap between failure and revival is typically 10-15 years, corresponding roughly to the technology infrastructure maturation cycle.

#### Implementations & Benchmarks

No standardized tool or database exists specifically for revival identification. Practitioners typically combine postmortem databases (to identify timing-failed concepts) with technology readiness monitoring (to assess current enabling conditions). Loot Drop's Rebuild Plans represent a partial automation of this process, generating updated market analyses for each failed startup in their database.

The Perez framework provides a macro-level heuristic: concepts that failed during a Frenzy-phase bubble collapse are systematically more likely to be revival candidates than concepts that failed during a Synergy phase, because the former were killed by infrastructure prematurity while the latter had the benefit of mature infrastructure and still failed.

#### Strengths & Limitations

**Strengths:** Revival identification exploits a genuine market inefficiency---the psychological difficulty of re-executing a "failed" concept means that revival candidates face less competition than novel concepts of equivalent market potential. The historical data provides validated demand evidence that no amount of customer discovery on a novel concept can match.

**Limitations:** The timing-vs-execution distinction is unreliable in retrospect: were the dot-com grocery failures purely timing, or were they also capital-inefficient execution? Many "timing" failures involved multiple failure modes, and the timing component may be overweighted in hindsight because it is the most narratively satisfying explanation. Revival identification requires deep domain expertise to assess enabling condition maturity---there is no generic checklist. The 10-15 year revival window means that the competitive landscape and consumer expectations may have shifted in ways that make direct concept replication impossible.

---

### 4.4 Competitive Graveyard Analysis

#### Theory & Mechanism

Competitive graveyard analysis examines the population of defunct companies within a specific market category to extract opportunity signals. The method draws on organizational ecology's population-level perspective: the pattern of births and deaths within an industry niche contains information about carrying capacity, competitive dynamics, and the viability of different organizational forms.

The core analytical questions are: How many companies have attempted this category and failed? What were their commonalities? What differentiated the survivors (if any) from the casualties? Is the category structurally hostile to startups, or did the casualties share a specific, avoidable vulnerability?

A graveyard with many casualties but some survivors suggests that the category is viable but execution-sensitive---the challenge is to identify what the survivors did differently. A graveyard with universal casualties suggests either a structural problem (the market doesn't exist, the unit economics are impossible) or a timing problem (the category is premature). A graveyard where the most recent entries died while earlier entries survived may indicate market saturation or competitive consolidation.

#### Literature Evidence

Failory's Startup Cemetery provides structured graveyard data across categories, with detailed analytical writeups for 120+ individual failures. Their categorization identifies No Market Need (35%) as the leading cause of death, followed by Cash Depletion, Team Conflict, Competition, Product/Tech Failure, Legal/Regulatory Issues, and Unit Economics. These category-level statistics enable comparative graveyard analysis: categories where competition is the primary killer differ systematically from categories where no-market-need dominates.

Loot Drop's category "Deep Dives" analyze failure patterns within each of their 22 product categories (SaaS, AI, Marketplace, Blockchain, etc.), reporting failure counts, capital burned, top causes of death, and category-specific patterns. Sankey diagrams map value propositions to ultimate failure modes, revealing industry-specific death patterns.

The Graveyard Index project (GitHub: Yusuf34soysal/graveyard-index) provides a complementary public-company perspective, analyzing 49,315 delisted US companies from 1992-2025. While focused on public companies rather than startups, it identifies characteristic failure velocity patterns: Slow Fade (30% decline, 22% of companies), Steady Decline (30-60%, 31%), Rapid Descent (60-90%, 35%), and Catastrophic (>90%, 12%). The project's Terminal Velocity Indicator predicts death-spiral entry using XGBoost and Cox Hazard models with ROC-AUC of 0.908.

#### Implementations & Benchmarks

Competitive graveyard analysis requires constructing category-specific death lists from multiple data sources. Crunchbase provides shutdown dates and basic metadata for its covered companies. Failory and Loot Drop provide pre-constructed graveyards with analytical annotations. The GitHub repository fikrikarim/companies-with-successful-pivot provides a curated dataset of companies that pivoted successfully, which serves as a complementary "escape from the graveyard" dataset.

The most common implementation is manual: a product strategist identifies all known failed companies in a target category, reads their postmortems (where available), codes their failure modes, and looks for patterns. There is no standard software tool for automated competitive graveyard construction and analysis.

#### Strengths & Limitations

**Strengths:** Graveyard analysis provides category-level intelligence that individual postmortem analysis cannot. It answers the question "Is this category viable?" before addressing the question "How should I execute in this category?" A dense graveyard with no survivors is a strong negative signal that individual founder-level optimism may override.

**Limitations:** Graveyard data is incomplete: many startups shut down without public announcement, and databases cover only a fraction of all startups. Survivor identification may be biased toward well-funded, well-publicized companies. The distinction between "structurally hostile category" and "category that hasn't found the right approach yet" requires subjective judgment. Graveyard analysis is static and does not account for enabling condition changes that may make a previously hostile category viable.

---

### 4.5 Crunchbase/PitchBook Shutdown Pattern Mining

#### Theory & Mechanism

Commercial startup databases---primarily Crunchbase (2+ million companies), PitchBook (4.2+ million organizations), and Tracxn (10+ million companies)---contain structured data on company founding dates, funding rounds, team composition, industry classification, and shutdown status. Mining this data for shutdown patterns enables quantitative analysis at scales impossible with qualitative postmortem databases.

The analytical approach treats startup survival as a time-to-event problem amenable to survival analysis (Cox proportional hazards models, Kaplan-Meier estimators) and classification (predicting shutdown vs. survival based on observable covariates). Covariates available in these databases include: founding year, industry sector, geographic location, funding amount and timing, number of funding rounds, investor identity and quality, team size, founder experience, and media coverage.

PitchBook's VC Exit Predictor, launched in 2023, uses a proprietary machine learning algorithm trained on PitchBook data to predict startup growth prospects, covering deal activity, active investors, and company details. A similar tool was developed by academic researchers in 2021 using public Crunchbase data to predict whether startups would exit via IPO, acquisition, or failure.

#### Literature Evidence

A 2024 study in the *Journal of Big Data* used Crunchbase data (as of March 2023) with generative adversarial networks to resolve data imbalance in startup success prediction. A 2023 study in *Technological Forecasting and Social Change* analyzed 218,207 Crunchbase companies from January 2011 to July 2021 and found that media exposure, monetary funding, industry convergence level, and industry association level were significant predictors of startup success.

A study of 24,965 startups across diverse sectors sourced from Crunchbase developed predictive models using Random Forest, XGBoost, and Support Vector Machines, achieving over 90% accuracy. A 2024 paper in the *European Journal of Operational Research* demonstrated that large language models applied to startup text descriptions outperform traditional bag-of-words machine learning approaches, capturing latent information about business models, strategic focus, and target markets.

The Northwestern University study "Predicting the Outcome of Startups: Less Failure, More Success" (Kaminski et al., 2016) was among the first to apply machine learning to Crunchbase shutdown data, demonstrating that structured features could predict startup outcomes with useful accuracy.

#### Implementations & Benchmarks

Implementation requires database access (Crunchbase Pro at ~$49/month for basic access; PitchBook through institutional subscription, typically $20,000+/year; Tracxn at various tiers). The analytical pipeline typically involves: data extraction via API, feature engineering (converting raw database fields into model-ready covariates), model training (Random Forest and XGBoost are standard baseline methods), and interpretation (feature importance analysis to identify which covariates most strongly predict shutdown).

The most accessible implementation for individual practitioners is Crunchbase's search interface, which allows filtering for closed/dead companies by industry, geography, funding stage, and date range. This enables manual graveyard construction without programming.

#### Strengths & Limitations

**Strengths:** Quantitative analysis at scale. The structured data format enables reproducible analysis and hypothesis testing. Longitudinal data enables survival analysis, revealing not just whether companies fail but when and under what conditions. Machine learning models can identify non-obvious patterns.

**Limitations:** Structured data lacks the causal richness of postmortem narratives---the databases record *that* a company shut down and *when*, but not *why*. Data quality varies: shutdown dates may be inaccurate, industry classifications imprecise, and small companies may be absent entirely. Prediction models suffer from class imbalance (many more failures than successes) and data leakage risks (features that correlate with shutdown may be effects rather than causes). The commercial databases have selection biases toward venture-funded, technology-focused companies.

---

### 4.6 Hacker News Postmortem Corpus Analysis

#### Theory & Mechanism

Hacker News (news.ycombinator.com), Y Combinator's community forum, has accumulated a distinctive corpus of startup postmortems since its founding in 2007. Postmortems shared on Hacker News differ from those in curated databases in three important ways: they are accompanied by extensive community discussion (often hundreds of comments), they skew toward technically sophisticated products, and they tend to be more candid because the audience consists of peers who can identify dissembling.

The theoretical value of the Hacker News corpus lies in the comment threads as much as the postmortems themselves. When a founder posts a postmortem, the community response often includes: alternative causal explanations from people with domain expertise, comparisons to similar failed or successful ventures, identification of factors the founder may have overlooked or underweighted, and technical analysis of product or architectural decisions. This crowdsourced failure analysis can supplement or correct the founder's own attribution.

#### Literature Evidence

HackerNoon's analysis of 256 Hacker News postmortems found that product-market fit issues were the most persistent failure theme across the 2014-2018 period. The analysis identified that failure to pivot (7% of postmortems), team discord, investor conflict, and user neglect were recurring themes.

The Hacker News community's response to the Startup Graveyard project (2025 discussion thread) demonstrated the community's engagement with failure analysis: commenters added companies to the graveyard, debated failure attributions, and identified revival opportunities. This suggests that the HN community functions as a distributed, informal failure analysis system with domain expertise across many technical and market categories.

No systematic academic study has applied topic modeling or sentiment analysis specifically to the Hacker News startup postmortem corpus, though the expert.ai study of Autopsy.io demonstrates the feasibility of applying NLP techniques to postmortem text. The HN corpus is freely accessible through the HN API and Algolia search, making it an attractive target for computational analysis.

#### Implementations & Benchmarks

The Hacker News API (documented at https://github.com/HackerNews/API) provides programmatic access to all stories and comments. The Algolia-powered search (hn.algolia.com) enables keyword-based retrieval of postmortem-related content. A research implementation would involve: (1) constructing a query set to identify postmortem stories (keywords: "postmortem," "shutdown," "why we failed," "lessons learned," "pivoting away"); (2) extracting story text and associated comment threads; (3) applying topic modeling (LDA or BERTopic) to identify failure theme clusters; (4) using sentiment analysis to detect community agreement or disagreement with the founder's causal attribution.

No off-the-shelf tool exists for this analysis. Implementation requires Python programming with libraries such as the HN API client, NLTK or spaCy for text processing, and scikit-learn or BERTopic for topic modeling.

#### Strengths & Limitations

**Strengths:** The comment threads provide crowdsourced expert analysis not available in any other failure data source. The corpus is large (thousands of relevant stories and tens of thousands of comments), freely accessible, and continuously growing. The technical sophistication of the community means that causal reasoning in comments is often more rigorous than in the postmortems themselves.

**Limitations:** HN skews heavily toward B2B, developer tools, and technical products; B2C consumer products are underrepresented. The community has known biases (preference for technical elegance over market viability, skepticism toward marketing-driven companies). Comment quality is highly variable. There is no structured metadata: extracting category, funding amount, or team composition from unstructured text requires NLP that may introduce errors.

---

### 4.7 Pivot Pattern Analysis

#### Theory & Mechanism

Pivot pattern analysis examines the transformations that startups undergo when their initial concept fails, treating the pivot itself as a data source for opportunity identification. The theoretical basis is that a pivot is a founder's real-time, high-stakes reinterpretation of market signal---when a founder abandons one concept for another, they are making an informed judgment (based on customer interaction, market feedback, and technical learning) about where opportunity actually lies. The abandoned concept becomes a documented failure, and the pivot destination becomes a revealed preference about adjacent opportunity.

Bajwa et al. (2017), in "Failures to be Celebrated: An Analysis of Major Pivots of Software Startups" (*Empirical Software Engineering*), conducted a case survey of 49 software startup pivots and identified 10 pivot types and 14 triggering factors. Customer need pivot was the most common type, and negative customer reaction and flawed business model were the most common triggers. This research establishes that pivots are not random---they follow identifiable patterns that can be analyzed systematically.

The canonical examples demonstrate the magnitude of value that pivots can unlock:

- **Instagram** pivoted from Burbn (a complicated check-in app) when founders observed that photo sharing was the only heavily used feature.
- **Slack** emerged from the failure of Tiny Speck's game Glitch, when the team recognized that their internal communication tool had independent value.
- **Twitter** pivoted from Odeo (a podcast platform) when Apple's dominance in podcasting rendered the original product inviable.
- **YouTube** pivoted from a video dating site when organic usage showed that general video uploading had broader appeal.
- **Shopify** pivoted from Snowdevil (a snowboard e-commerce site) when the founders realized their custom e-commerce platform was more valuable than the products it sold.

#### Literature Evidence

Three out of four successful startups did not succeed with their original concept. Nearly 70% of Y Combinator companies pivoted. These statistics, while widely cited, are imprecise and may include minor strategic adjustments alongside genuine business model pivots. Bajwa et al.'s research provides more rigorous evidence with their 10-type pivot taxonomy: customer segment pivot, customer need pivot, platform pivot, zoom-in pivot, zoom-out pivot, technology pivot, channel pivot, revenue model pivot, business architecture pivot, and value capture pivot.

The GitHub repository fikrikarim/companies-with-successful-pivot maintains a curated list of successful pivots spanning multiple industries and eras, from Berkshire Hathaway (textiles to insurance) to Netflix (DVD mail-order to streaming). This dataset reveals that successful pivots are not limited to technology startups but occur across all sectors when founders possess the flexibility to recognize and act on disconfirming market evidence.

The Greylock Partners framework (Reid Hoffman on "The Startup Pivot") emphasizes that the most valuable information in a failed startup is often not what the founder intended to learn but what they accidentally learned. This "accidental learning" hypothesis suggests that pivot analysis should focus not on the failed concept itself but on the unexpected user behavior or market signal that prompted the pivot.

#### Implementations & Benchmarks

Pivot pattern analysis is primarily qualitative. The main data sources are media reports (TechCrunch, The Information), founder interviews (podcasts, conference talks), and curated datasets (the fikrikarim GitHub repository, CB Insights' "Successful Startup Pivots" compilation). There is no automated pivot detection system---identifying pivots requires tracking company strategy over time and recognizing when a fundamental change has occurred, which is difficult to operationalize algorithmically.

For product ideation purposes, the implementation involves: (1) identifying clusters of startups that pivoted away from a particular concept; (2) analyzing the common reasons for pivot (was the concept itself flawed, or were there addressable execution issues?); (3) examining the pivot destinations to identify where the market signal actually pointed; (4) assessing whether the original concept has become viable due to changed conditions.

#### Strengths & Limitations

**Strengths:** Pivot data captures founder-level market intelligence at the moment of maximum information. A pivot decision is based on direct customer interaction, revenue data, and technical learning that no external analyst can replicate. Pivot patterns reveal the topology of opportunity space---which adjacent markets are accessible from a given starting point.

**Limitations:** Pivot narratives are subject to ex-post rationalization: successful pivots are retrospectively described as strategic genius, while unsuccessful pivots are forgotten. The boundary between a "pivot" and a "minor adjustment" is fuzzy, and different researchers code the same company differently. Pivot data overrepresents companies that successfully pivoted (survivorship bias again) and underrepresents companies that recognized the need to pivot but failed to execute the transition.

---

### 4.8 Domain Expiry and Trademark Lapse Mining

#### Theory & Mechanism

Domain name expiration and trademark abandonment are micro-signals that can indicate startup distress or shutdown before any public announcement. The theoretical basis is straightforward: domain names and trademarks require active maintenance (annual renewal fees for domains, periodic filings for trademarks), and when a company stops maintaining these assets, it signals either administrative failure or deliberate abandonment. Both are informative for failure archaeology.

Domain expiration occurs when a registrant fails to renew before a grace period expires, at which point the domain enters a redemption period and eventually becomes available for public registration. Trademark abandonment occurs when a mark is not used in commerce for three consecutive years (in the US) or when required maintenance filings are missed.

As failure signals, these micro-events have an important temporal property: they often precede formal shutdown announcements by weeks or months. A startup that stops renewing its domain or abandoning its trademark filings is revealing financial distress or strategic abandonment before the founders have written a postmortem or the press has reported the shutdown.

As opportunity signals, lapsed domains and trademarks in specific product categories indicate that previous players have exited, potentially reducing competitive density and freeing up brand equity. A domain name that matches a viable product concept, previously held by a now-defunct company, may be available for acquisition.

#### Literature Evidence

There is no academic literature specifically studying domain expiry or trademark lapse as startup failure signals. The approach is derived from competitive intelligence practice and domain investment communities.

The practical evidence is anecdotal but suggestive. Major organizations including Microsoft and Foursquare have experienced accidental domain expiration, demonstrating that even well-resourced companies can fail to maintain domain registrations. Domain monitoring services (UptimeRobot, Domain Monitor, Pinger Man, Sitechecker) provide the technical infrastructure for tracking expiration dates, though these tools are primarily marketed for defensive monitoring rather than competitive intelligence.

The USPTO's Trademark Electronic Search System (TESS) and EUIPO's eSearch plus database provide public access to trademark registration and abandonment data. Trademark status codes (e.g., "Dead - Abandoned" or "Cancelled - Section 8") indicate abandoned marks that may represent category opportunity signals.

#### Implementations & Benchmarks

Implementation requires combining domain monitoring with startup tracking. The workflow is: (1) identify startups in target categories using Crunchbase, PitchBook, or similar databases; (2) record their primary domain names; (3) set up automated monitoring for domain expiration using WHOIS lookup services or monitoring tools; (4) interpret expiration events as potential shutdown signals; (5) cross-reference with other shutdown indicators (social media silence, job posting cessation, employee LinkedIn departures).

For trademark mining, the workflow involves: (1) searching trademark databases for marks in relevant product categories; (2) filtering for abandoned or cancelled marks; (3) analyzing the associated companies to determine whether the abandonment reflects genuine market exit; (4) assessing whether the underlying product concept has revival potential.

Tools include: Pinger Man (monitors domains you do not own and notifies when they become available); ExpiredDomains.net (aggregates expired domain lists); the USPTO TSDR system (Trademark Status and Document Retrieval); and ICANN WHOIS lookup services.

#### Strengths & Limitations

**Strengths:** Micro-signals provide early warning of shutdown before public announcement. Domain and trademark data is publicly accessible and machine-readable. The signals are difficult to fake (a company that is actively operating will maintain its domain). The approach complements macro-level analysis from postmortem databases.

**Limitations:** False positives are common: domain expiration may reflect administrative oversight rather than company failure. Many startups use subdomains or platform-hosted presences (Shopify stores, Substack newsletters) that do not generate domain expiration signals. Trademark abandonment may reflect brand pivots rather than company shutdown. The approach is labor-intensive relative to its yield---monitoring hundreds of domains to detect a handful of shutdowns is a poor signal-to-effort ratio. There is no empirical research validating the reliability of these signals.

---

## 5. Comparative Synthesis

The following table compares the eight approaches across six dimensions relevant to B2C product ideation.

| Dimension | Postmortem DBs | Failure Decomposition | Revival ID | Graveyard Analysis | Shutdown Mining | HN Corpus | Pivot Analysis | Micro-Signals |
|---|---|---|---|---|---|---|---|---|
| **Data richness** | High (qualitative narratives) | Medium (typed categories) | High (concept + context) | Medium (population stats) | Low (structured fields only) | High (narratives + discussion) | High (strategic reasoning) | Low (binary signal) |
| **Scale** | 100s--1,000s of entries | N/A (framework) | 10s per analysis cycle | 100s per category | 100,000s+ companies | 1,000s of stories | 100s of documented pivots | Millions of domains |
| **Automation potential** | Medium (NLP feasible) | Low (requires counterfactual reasoning) | Low (requires domain expertise) | Medium (population queries) | High (ML models) | Medium (NLP feasible) | Low (narrative interpretation) | High (WHOIS monitoring) |
| **B2C coverage** | Medium (tech-skewed) | Full (framework-agnostic) | Medium (depends on source) | Variable by category | Medium (database coverage) | Low (HN skews B2B/dev tools) | Medium (notable B2C pivots) | Full (all domains) |
| **Cost** | Free--freemium | Free (published research) | High (analyst time) | $50--$20,000+/yr (database fees) | $50--$20,000+/yr | Free (API access) | Free (public sources) | Free--low |
| **Actionability** | Medium (requires interpretation) | High (directly implies strategy) | Very high (specific concepts) | Medium (category-level) | Low (correlational, not causal) | Medium (requires synthesis) | High (reveals opportunity topology) | Low (signal only, no explanation) |

### Cross-Cutting Observations

**Complementarity over substitution:** No single approach provides a complete picture. The highest-fidelity failure archaeology combines qualitative depth (postmortem databases, HN corpus) with quantitative breadth (shutdown mining) and strategic framing (failure decomposition, revival identification). The micro-signal approaches serve as early-warning layers that trigger deeper investigation.

**The causal inference gap:** The central weakness across all approaches is the difficulty of distinguishing correlation from causation in failure attribution. Postmortems are self-reports subject to attribution bias. Quantitative models identify covariate associations but cannot establish causal mechanisms. Decomposition frameworks impose categories that may not map cleanly onto the multi-causal reality of most failures. This gap is not unique to failure archaeology---it pervades observational entrepreneurship research---but it is particularly consequential when the goal is to identify revival candidates, which requires confidence that the diagnosed failure mode (timing) was indeed the primary cause.

**The freshness-depth tradeoff:** Approaches that provide the richest causal understanding (detailed postmortems, pivot narratives) are available only for companies that shut down long enough ago for founders to write and publish reflections. Approaches that provide early signals (domain monitoring, database shutdown flags) offer no causal information. The most time-sensitive product ideation decisions---identifying a revival opportunity before competitors do---require acting on incomplete causal information.

**Selection bias compounds across approaches:** Each data source has its own selection bias (postmortems overrepresent articulate, English-speaking founders; databases overrepresent venture-funded companies; HN overrepresents developer-focused products). Combining sources does not eliminate these biases; it compounds them, potentially creating a false sense of comprehensive coverage while systematically missing entire categories of failure (bootstrapped companies, non-English markets, non-technology products).

---

## 6. Open Problems & Gaps

### 6.1 The Attribution Problem

Startup failure is almost always multi-causal, yet the primary analytical frameworks (four-mode decomposition, Eisenmann's six patterns) require assigning failures to typed categories. The field lacks a rigorous methodology for apportioning causal weight across multiple failure modes. When Webvan failed, was it 70% timing, 20% execution, 10% capital management---or some other allocation? The answer matters for revival assessment: if execution accounted for a larger share than commonly assumed, the revival opportunity is smaller.

### 6.2 Non-English and Non-US Coverage

The available postmortem databases, Hacker News corpus, and commercial databases are overwhelmingly English-language and US-centric. Startup ecosystems in China (with its own massive graveyard of O2O, bike-sharing, and community group-buying startups), India, Southeast Asia, Latin America, and Europe are underrepresented. The failure patterns and revival opportunities in these markets may differ systematically from those captured in existing databases.

### 6.3 Automated Failure Mode Classification

Current NLP techniques can extract topics and sentiment from postmortem text but cannot reliably perform causal reasoning---distinguishing "timing was wrong" from "execution was wrong" when both are mentioned in the same narrative. Advances in large language model reasoning may make automated failure mode classification feasible, but this has not been demonstrated.

### 6.4 Longitudinal Revival Tracking

No systematic study has tracked failed startup concepts over time to measure how many become viable and how many are successfully revived. The canonical cases (Webvan-to-Instacart, Pets.com-to-Chewy) are selected precisely because they are dramatic and well-known, which introduces survivorship bias into the revival analysis itself. The base rate of successful revival is unknown.

### 6.5 The LLM Opportunity and Risk

Large language models offer the possibility of automating several failure archaeology tasks: summarizing postmortems, classifying failure modes, generating revival assessments, and monitoring enabling condition changes. Loot Drop's AI-generated Rebuild Plans are an early example. However, LLMs are prone to plausible-sounding but incorrect causal reasoning, and their outputs have not been validated against expert judgment or market outcomes. The risk of "AI-generated failure analysis" producing false confidence in revival candidates is substantial.

### 6.6 Temporal Dynamics of Failure Signals

The 2025 study in the *Journal of Innovation and Entrepreneurship* found that the relevance of failure factors changes with the startup lifecycle. Early-stage failures cluster around product-market fit and team issues; later-stage failures cluster around scaling, unit economics, and competitive dynamics. Existing databases and frameworks do not adequately account for these temporal dynamics, treating failure as a single event rather than a process that unfolds over months or years.

### 6.7 Private Failure

The vast majority of startup failures are private: no postmortem is written, no press coverage exists, no database entry is created. The founders quietly move on. This means that the "visible graveyard" represented by all available data sources is a biased sample of the "actual graveyard." The direction of bias is unclear: it may be that the most catastrophic or the most instructive failures are overrepresented in public postmortems, or it may be that the most common, mundane failure modes (ran out of money, got bored, cofounder left) are underrepresented because they are not narratively interesting.

---

## 7. Conclusion

Startup failure archaeology is a nascent discipline operating at the intersection of entrepreneurship research, competitive intelligence, and product strategy. The raw materials are increasingly available: over 2,000 publicly accessible postmortems, commercial databases covering millions of companies, freely accessible community discussion corpora, and micro-signal data from domain and trademark registries. The analytical frameworks span from qualitative case analysis to machine learning prediction models.

The central finding of this survey is that failure data, despite its biases and limitations, contains genuine and exploitable product opportunity signal. The canonical revivals---Webvan to Instacart, Pets.com to Chewy, Kozmo to DoorDash---represent billions of dollars of value that was identifiable, in principle, from systematic failure analysis. The Bill Gross research establishing timing as the single most important factor in startup outcomes (42% of variance) provides empirical grounding for the revival identification methodology.

The field's primary weaknesses are methodological: multi-causal attribution, non-English coverage, automated classification reliability, and the absence of longitudinal revival tracking studies. The databases that exist were built by practitioners (CB Insights, Failory, Autopsy, Loot Drop) rather than academic researchers, and the academic frameworks (Eisenmann, Cantamessa, Bajwa) have not been systematically applied to the practitioner databases at scale.

For B2C product ideation, the most productive approach combines three layers: macro-level timing assessment using Perez-style paradigm analysis and Gross-style factor weighting; category-level graveyard analysis using commercial databases and curated failure collections; and concept-level revival identification using postmortem narratives, enabling condition assessment, and pivot pattern analysis. No single database, framework, or tool provides all three layers, and the integration across them remains manual and expertise-dependent.

---

## References

Abatecola, G., Cafferata, R., & Poggesi, S. (2012). Arthur Stinchcombe's "liability of newness": Contribution and impact of the construct. *Journal of Management History*, 18(4), 402-418.

Bajwa, S.S., Wang, X., Nguyen Duc, A., & Abrahamsson, P. (2017). "Failures" to be celebrated: An analysis of major pivots of software startups. *Empirical Software Engineering*, 22, 2373-2408. https://link.springer.com/article/10.1007/s10664-016-9458-0

Cantamessa, M., Gatteschi, V., Perboli, G., & Rosano, M. (2018). Startups' Roads to Failure. *Sustainability*, 10(7), 2346. https://www.mdpi.com/2071-1050/10/7/2346

Carroll, G.R., & Hannan, M.T. (2000). *The Demography of Corporations and Industries*. Princeton University Press.

Collins, J. (2001). *Good to Great*. HarperBusiness.

Denrell, J. (2003). Vicarious learning, undersampling of failure, and the myths of management. *Organization Science*, 14(3), 227-243.

Eisenmann, T. (2021). *Why Startups Fail: A New Roadmap for Entrepreneurial Success*. Currency. https://www.whystartupsfail.com/book

Freeman, J., Carroll, G.R., & Hannan, M.T. (1983). The liability of newness: Age dependence in organizational death rates. *American Sociological Review*, 48(5), 692-710.

Gross, B. (2015). The single biggest reason why startups succeed. TED Talk. https://www.ted.com/speakers/bill_gross

Hannan, M.T., & Freeman, J. (1977). The population ecology of organizations. *American Journal of Sociology*, 82(5), 929-964.

Hannan, M.T., & Freeman, J. (1984). Structural inertia and organizational change. *American Sociological Review*, 49(2), 149-164.

Kalyanasundaram, G. (2024). Why do startups fail? A core competency deficit model. *Frontiers in Psychology*, 15, 1299135. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1299135/full

Kaminski, J., Hopp, C., & Tykvova, T. (2016). Predicting the outcome of startups: Less failure, more success. Northwestern University. http://cucis.ece.northwestern.edu/publications/pdf/KAC16.pdf

Kim, K., & Hong, E. (2024). Predicting startup success using two bias-free machine learning: Resolving data imbalance using generative adversarial networks. *Journal of Big Data*, 11, 993. https://journalofbigdata.springeropen.com/articles/10.1186/s40537-024-00993-8

Lee, I. (2023). How to succeed in the market? Predicting startup success using a machine learning approach. *Technological Forecasting and Social Change*, 193. https://ideas.repec.org/a/eee/tefoso/v193y2023ics0040162523002998.html

Maarouf, A. et al. (2024). A fused large language model for predicting startup success. *European Journal of Operational Research*. https://www.sciencedirect.com/science/article/pii/S0377221724007136

Menon, S. (2025). What could we learn from startup failures? *Journal of Innovation and Entrepreneurship*, 14(1). https://link.springer.com/article/10.1186/s13731-025-00493-w

Perez, C. (2002). *Technological Revolutions and Financial Capital: The Dynamics of Bubbles and Golden Ages*. Edward Elgar.

Salamzadeh, A., & Kesim, H.K. (2017). The enterprising communities and startup ecosystem in Iran. *Journal of Enterprising Communities*, 11(4), 456-479.

Stinchcombe, A.L. (1965). Social structure and organizations. In J.G. March (Ed.), *Handbook of Organizations* (pp. 142-193). Rand McNally.

Valentin, A. (2022). Entrepreneurial failure analysis using quality management approaches. *Total Quality Management & Business Excellence*. https://www.tandfonline.com/doi/full/10.1080/14783363.2022.2043739

von Hippel, E. (1986). Lead users: A source of novel product concepts. *Management Science*, 32(7), 791-805.

Wing Venture Capital. (n.d.). Startups and timing: On the "why now" for new businesses. https://www.wing.vc/content/startups-and-timing-on-the-why-now-for-new-businesses

---

## Practitioner Resources

### Postmortem Databases

- **CB Insights Startup Failure Post-Mortems** --- 483 postmortems with structured analysis and top-reason reports. Industry standard for failure reason taxonomy. https://www.cbinsights.com/research/startup-failure-post-mortem/
- **Autopsy** --- 2,000+ postmortems, largest open collection. Community-submitted, curated. Pre-seed to Series A focus. https://www.getautopsy.com/
- **Failory Startup Cemetery** --- 400+ structured entries with country, industry, customer type, and cause filters. Includes founder interviews. https://www.failory.com/cemetery
- **Loot Drop** --- 1,600+ failed startups with AI-generated Rebuild Plans, market scoring, and category Deep Dives. The most explicitly opportunity-oriented database. https://www.loot-drop.io/
- **Startup Graveyard** --- Interactive visualization of failure patterns with filterable categories. https://startupgraveyard.io/

### Commercial Databases

- **Crunchbase** --- 2+ million companies with shutdown status, funding history, and industry classification. API access available. https://www.crunchbase.com/
- **PitchBook** --- 4.2+ million organizations with detailed deal flow, exit data, and VC Exit Predictor ML tool. Institutional pricing. https://pitchbook.com/
- **Tracxn** --- 10+ million companies across 3,000+ sectors. Tracks shutdowns and provides sector-level analytics. https://tracxn.com/
- **Harmonic.ai** --- 30+ million companies with REST/GraphQL API. Focuses on startup data completeness. https://harmonic.ai/

### Academic Frameworks

- **Eisenmann's Six Failure Patterns** --- Diamond-and-Square model with six typed patterns (Bad Bedfellows, False Start, False Positive, Speed Trap, Help Wanted, Cascading Miracles). Book: *Why Startups Fail* (2021). https://www.whystartupsfail.com/book
- **Cantamessa SHELL Model** --- Aviation safety model adapted for startup failure classification. Paper: "Startups' Roads to Failure" (2018). https://www.mdpi.com/2071-1050/10/7/2346
- **Core Competency Deficit Model** --- Behavioral competency analysis of failed startup teams. Paper: Kalyanasundaram (2024). https://pmc.ncbi.nlm.nih.gov/articles/PMC10881814/
- **Bajwa Pivot Taxonomy** --- 10 pivot types and 14 triggering factors from 49 software startups. Paper: "Failures to be Celebrated" (2017). https://link.springer.com/article/10.1007/s10664-016-9458-0

### Timing Assessment Frameworks

- **Bill Gross / Idealab** --- Timing as 42% of startup success variance. TED talk and 25 Lessons series. https://25-lessons.idealab.com/find-great-timing/
- **Gabor Cselle's Four Scenarios** --- Small/Not Growing, Too Early, Too Late, Right Timing. https://medium.com/gabor/the-4-scenarios-of-startup-timing-26bc66d4be8b
- **Wing VC "Why Now" Framework** --- Enabling technologies, market readiness, economic viability. https://www.wing.vc/content/startups-and-timing-on-the-why-now-for-new-businesses
- **Perez Paradigm Framework** --- Techno-economic paradigm shifts and installation/deployment periods. https://carlotaperez.org/

### Open-Source Tools and Datasets

- **Graveyard Index** --- Microstructure analysis of 49,000 delisted US companies (1992-2025) with XGBoost/Cox Hazard failure prediction. https://github.com/Yusuf34soysal/graveyard-index
- **Companies with Successful Pivot** --- Curated list of successful pivots across industries. https://github.com/fikrikarim/companies-with-successful-pivot
- **Kaggle Startup Failures Dataset** --- Structured startup failure data for ML experimentation. https://www.kaggle.com/datasets/dagloxkankwanda/startup-failures
- **Hacker News API** --- Programmatic access to startup postmortem stories and community discussion. https://github.com/HackerNews/API
- **Fractl Startup Failure Study** --- Interactive visualization of 193 startup failure patterns. https://www.frac.tl/work/marketing-research/why-startups-fail-study/

### Domain and Trademark Monitoring

- **ExpiredDomains.net** --- Aggregated expired domain lists with filtering by age, backlinks, and category.
- **Pinger Man** --- Domain monitoring with alerts for domains you do not own. https://pingerman.com/
- **USPTO TESS** --- Trademark Electronic Search System for identifying abandoned marks. https://tmsearch.uspto.gov/
- **EUIPO eSearch plus** --- European trademark and design search with abandonment status filtering. https://euipo.europa.eu/
