---
title: "Competitive Intelligence Methodology"
date: 2026-03-21
summary: Surveys the systematic methods, data sources, and analytical frameworks used to map competitive landscapes, analyze startup failures, and decompose the causes of market-level outcomes into timing, execution, and structural factors. Compares tools from Crunchbase mining to patent landscaping, evaluates postmortem databases, and identifies open methodological problems including survivorship bias, data decay, and the attribution problem in failure analysis.
keywords: [competitive-intelligence, startup-failure, market-mapping, postmortem-analysis, competitive-landscape]
---

# Competitive Intelligence Methodology

*2026-03-21*

---

## Abstract

Competitive intelligence (CI) -- the systematic collection, analysis, and dissemination of information about the external business environment -- has evolved from a niche discipline practiced by a handful of corporate strategists into a core function supported by an ecosystem of specialized databases, AI-powered monitoring platforms, and structured analytical frameworks. For anyone attempting to build something new, a prior question must be answered before strategy can begin: *What has already been tried, what failed, who funded it, and why did it die?* This paper surveys the methodological landscape for answering that question.

The survey covers six major domains of competitive intelligence practice: (1) structured startup databases and funding intelligence (Crunchbase, PitchBook, Dealroom, Tracxn); (2) startup failure postmortem analysis and competitive graveyard databases (CB Insights, Failory, Loot Drop); (3) App Store and Product Hunt archaeology for historical product intelligence; (4) patent landscape analysis for technology mapping and white space identification; (5) digital footprint and alternative data analysis (Similarweb, BuiltWith, job posting signals, SEC filings); and (6) AI-powered competitive monitoring platforms (Crayon, Klue, G2 Market Intelligence). Each domain is analyzed for its theoretical basis, empirical evidence, practical implementations, and known limitations.

Three cross-cutting problems undermine all competitive intelligence methodologies: survivorship bias in available data (dead startups leave fewer traces than living ones), the attribution problem in failure decomposition (distinguishing timing-was-wrong from execution-was-wrong from market-does-not-exist), and accelerating data decay as platforms restrict API access and companies disappear from the public record. The paper synthesizes these findings into a comparative framework and identifies the open problems that define the frontier of competitive intelligence research.

---

## 1. Introduction

### 1.1 Problem Statement

Before committing resources to a new product or market entry, strategists face a deceptively simple question: *What has been tried here before?* The answer is rarely available in a single source. It is distributed across funding records, app store histories, patent filings, corporate press releases, postmortem blog posts, archived websites, and the memories of people who were there. Assembling this distributed evidence into a coherent picture -- a competitive landscape that includes not just current players but the ghosts of past attempts -- requires methodology, not just effort.

The challenge is compounded by several structural problems. Dead companies leave fewer traces than living ones. Founders who fail are less likely to publish detailed accounts than those who succeed. Databases that track the startup ecosystem are biased toward companies that raised venture capital, missing the vast majority of bootstrapped efforts. Patent filings reveal intent but not outcome. App Store rankings are snapshots, not histories. And the very concept of "failure" is ambiguous: a company that shut down because the timing was wrong is fundamentally different from one that shut down because the market does not exist, yet both appear as the same data point in a postmortem database.

This paper surveys the methodological tools and frameworks available for conducting what might be called "competitive archaeology" -- the systematic reconstruction of what has been tried in a given market, why it failed or succeeded, and what structural conditions have changed since the last attempt.

### 1.2 Scope

The survey covers competitive intelligence as it applies to product strategy and market entry decisions, with particular emphasis on consumer-facing products and technology markets. It does not address national security intelligence, financial market intelligence for trading, or corporate espionage, except where methodological parallels are instructive. The focus is on *legal and ethical* intelligence gathering from publicly available sources -- the domain that the Strategic Consortium of Intelligence Professionals (SCIP) defines as "the action of defining, gathering, analyzing, and distributing intelligence about products, customers, suppliers, competitors, and any aspect of the external business environment needed to support executives and managers in strategic decision making" (SCIP, 2023).

### 1.3 Key Definitions

**Competitive intelligence (CI):** The systematic process of collecting, analyzing, and disseminating information about the competitive environment to improve organizational performance. CI is distinguished from industrial espionage by its adherence to legal and ethical boundaries.

**Competitive landscape:** The totality of current and former market participants, their strategies, resources, outcomes, and the structural forces shaping competitive dynamics in a defined market.

**Competitive graveyard:** The set of defunct or failed ventures that previously operated in a given market space. Graveyard analysis attempts to extract strategic intelligence from the patterns of failure.

**Failure decomposition:** The analytical process of attributing a venture's failure to specific causal factors -- market timing, execution quality, structural market absence, regulatory barriers, capital constraints, or combinations thereof.

**Intelligence cycle:** The iterative process of planning, collection, analysis, dissemination, and feedback that structures professional CI practice.

---

## 2. Foundations

### 2.1 History of Competitive Intelligence

Modern competitive intelligence traces its institutional origins to the founding of the Society of Competitive Intelligence Professionals (SCIP) in 1986, which was renamed the Strategic Consortium of Intelligence Professionals in April 2023. SCIP now claims over 25,000 members across 120 countries. The intellectual roots, however, extend further back -- to Michael Porter's competitive strategy frameworks of the 1980s, and before that to military intelligence methodologies adapted for commercial use.

Three foundational figures shaped the field's development. Leonard Fuld, often called the father of competitive intelligence, established the first dedicated CI consulting firm in 1979 and authored *The New Competitor Intelligence* (1995). Ben Gilad developed the early warning and blind spots analysis methodologies, with his books *The Business Intelligence System* (1988) and *Business Blindspots* (1994) establishing the theoretical framework for proactive competitive monitoring. Jan Herring, a former CIA officer, brought intelligence community methodologies into the corporate context and co-founded the Fuld-Gilad-Herring Academy of Competitive Intelligence in 1999.

Gilad's contribution is particularly relevant to this survey. He argued that a unique set of tools distinguishes CI from general market research: key intelligence topics (KITs), business war games, and blind spots analysis. His Strategic Early Warning (SEW) methodology proposed that 20% of CI practitioners' effort should be dedicated to detecting weak signals of market shifts -- an approach that prefigures the modern emphasis on predictive competitive intelligence. The Blindspots Identification Methodology (BIM) specifically addresses the organizational cognitive biases that prevent companies from recognizing threats and opportunities in their competitive environment.

Fleisher and Bensoussan (2003, 2007) systematized the field's analytical toolkit, cataloging 48 competitive intelligence analysis techniques and developing the FAROUT evaluation framework (Forward-oriented, Accurate, Resource-efficient, Objective, Useful, Timely) for assessing the effectiveness of analytical methods. Their work remains the most comprehensive practitioner-oriented taxonomy of CI analytical approaches.

### 2.2 The Intelligence Cycle

The intelligence cycle provides the procedural backbone for all CI activity. As formalized by SCIP and adapted from military intelligence doctrine, it consists of five phases:

1. **Planning and direction:** Identifying intelligence consumers, defining their decision requirements, and translating these into specific collection objectives (Key Intelligence Topics).
2. **Collection:** Gathering raw information from primary sources (interviews, trade shows, observation) and secondary sources (databases, publications, filings, digital signals).
3. **Processing and analysis:** Converting raw information into finished intelligence through techniques ranging from simple synthesis to sophisticated modeling, including Porter's Five Forces, SWOT analysis, war gaming, scenario planning, and patent landscaping.
4. **Dissemination:** Delivering intelligence products to decision-makers in formats calibrated to their needs -- briefings, dashboards, battle cards, early warning alerts.
5. **Feedback:** Evaluating the utility and impact of delivered intelligence and adjusting collection priorities accordingly.

The cycle's apparent simplicity masks significant practical challenges. Collection is constrained by access, ethics, and cost. Analysis is limited by cognitive biases, particularly confirmation bias and anchoring. Dissemination often fails because intelligence products do not match the cognitive style or temporal rhythm of decision-makers. Gilad and Fuld (2020) found that only half of companies actually use the competitive intelligence they collect, suggesting that the dissemination-to-action gap remains the field's most persistent operational problem.

### 2.3 Failure Taxonomy: Why Ventures Die

The systematic study of startup failure has produced several overlapping taxonomies, each contributing a different lens for decomposing competitive outcomes.

**CB Insights (2014-2025)** analyzed over 480 startup postmortems and identified the top reasons for failure: no market need (42%), ran out of cash (29%), wrong team (23%), outcompeted (19%), pricing/cost issues (18%), unfriendly product (17%), poor business model (17%), bad marketing (14%), customer ignorance (14%), and mistiming (13%). The percentages sum to more than 100% because most failures involve multiple contributing factors -- a critical finding that undermines single-cause attribution.

**Eisenmann (2021)**, drawing on years of research at Harvard Business School, proposed six distinct failure patterns organized by venture stage:

- *Early-stage patterns:* (1) Bad Bedfellows -- misaligned stakeholders destroy viable ventures; (2) False Starts -- skipping customer discovery leads to products nobody wants; (3) False Positives -- early adopter enthusiasm is misread as mainstream demand.
- *Late-stage patterns:* (4) Speed Traps -- rapid growth exhausts addressable market and raises acquisition costs; (5) Help Wanted -- operational gaps in management or funding; (6) Cascading Miracles -- ventures requiring multiple simultaneous breakthroughs face exponentially compounding risk.

Eisenmann's "Cascading Miracles" pattern is particularly instructive for competitive graveyard analysis: a venture requiring five independent do-or-die achievements each with a 50% probability of success has a combined probability of approximately 3% -- equivalent to picking the winning number in roulette.

**Bill Gross / Idealab (2015)** analyzed 200 companies (100 Idealab ventures and 100 external companies) and ranked five factors by their contribution to the variance between success and failure: timing (42%), team/execution (32%), idea (28%), business model (24%), and funding (14%). The dominance of timing as the single largest factor has been widely cited, though the methodology (retrospective expert rating by a single assessor) has been criticized for subjectivity.

**Gompers, Kovner, Lerner, and Scharfstein (2010)** provided rigorous empirical evidence on performance persistence in entrepreneurship, finding that previously successful entrepreneurs had a 34% chance of success in subsequent ventures, compared to 23% for those who had previously failed and 22% for first-time entrepreneurs. Their finding that successful entrepreneurs demonstrate superior market timing -- selecting the right industry and time to start -- provides empirical support for Gross's claim about timing's primacy but also suggests that what appears as "timing" may actually be a durable skill in environmental reading.

### 2.4 The Data Sources Landscape

The raw material of competitive intelligence comes from an increasingly diverse set of structured and unstructured sources. A useful categorization distinguishes:

**Structured databases:** Crunchbase, PitchBook, Dealroom, Tracxn, CB Insights -- providing standardized records of company formation, funding rounds, acquisitions, and closures.

**Product intelligence platforms:** App Store data (via Sensor Tower/data.ai), Product Hunt archives, G2 reviews, Capterra -- tracking product launches, usage metrics, and user sentiment over time.

**Digital footprint sources:** Similarweb (traffic analytics), BuiltWith (technology stack detection), Wayback Machine (historical website snapshots), social media monitoring tools -- revealing competitive behavior through its digital traces.

**Filing and regulatory sources:** USPTO/EPO patent databases, SEC EDGAR filings, state incorporation records, trademark registrations -- providing legal and financial signals of competitive intent and status.

**Human intelligence sources:** Industry conferences, expert network interviews, former employee conversations, customer interviews -- yielding contextual understanding that no database can provide.

**Alternative data signals:** Job postings (via JobsPikr, LinkUp, Aura), GitHub commit activity, mobile device panel data, satellite imagery, credit card transaction data -- providing real-time behavioral proxies for company health and strategic direction.

---

## 3. Taxonomy of Approaches

The following classification framework organizes competitive intelligence methodologies by their primary data source, analytical method, output type, temporal orientation, and cost structure.

| Approach | Primary Data Source | Analytical Method | Output | Temporal Orientation | Cost Range |
|---|---|---|---|---|---|
| Startup Database Mining | Crunchbase, PitchBook, Dealroom, Tracxn | Filtering, cohort analysis, network mapping | Landscape maps, funding timelines, competitor lists | Historical + current | $0-$25K/yr |
| Postmortem / Graveyard Analysis | CB Insights, Failory, Loot Drop, founder accounts | Thematic coding, failure pattern matching | Failure taxonomy, risk factors, cautionary patterns | Retrospective | $0-$5K/yr |
| App Store Archaeology | Sensor Tower / data.ai, Product Hunt archives | Time-series analysis, category tracking, survival analysis | Product lifecycle maps, category evolution, dead product inventories | Historical | $5K-$50K/yr |
| Patent Landscape Analysis | USPTO, EPO, WIPO via PatSnap, Orbit, Google Patents | Citation mapping, clustering, white space analysis | Technology maps, innovation trajectories, IP risk assessment | Historical + forward | $10K-$100K/yr |
| Digital Footprint Analysis | Similarweb, BuiltWith, Wayback Machine, SEO tools | Traffic estimation, technology detection, historical comparison | Competitive benchmarks, growth trajectories, strategic shifts | Near real-time | $5K-$30K/yr |
| Alternative Data Signals | Job postings, SEC filings, GitHub, app usage panels | Signal detection, anomaly detection, trend extraction | Early indicators of strategic moves, hiring/firing patterns | Predictive | $10K-$100K/yr |
| AI-Powered CI Platforms | Crayon, Klue, Compete (via web crawling + NLP) | Automated monitoring, NLP summarization, battlecard generation | Competitor alerts, battle cards, win/loss analysis | Real-time | $12K-$50K/yr |
| War Gaming / Red Teaming | CI-derived competitor profiles + expert judgment | Role-play simulation, scenario modeling | Strategy stress-tests, contingency plans, blind spot identification | Forward-looking | $20K-$200K per exercise |

---

## 4. Analysis

### 4.1 Startup Database Mining

#### Theory and Mechanism

Startup databases operate on the premise that the history of venture formation, funding, and dissolution in a market contains extractable strategic intelligence. By examining who has entered a space, when they entered, how much capital they raised, who invested, what happened to them, and how long they survived, an analyst can construct a temporal map of competitive activity that reveals patterns invisible to snapshot analysis.

The theoretical basis draws on population ecology of organizations (Hannan and Freeman, 1977), which models market entry and exit as outcomes of environmental selection pressures, and on resource-based theory, which predicts that the availability and allocation of capital shapes competitive dynamics. The practical premise is simpler: if many well-funded teams have tried and failed in a space, that is a different signal than if a space has never been attempted.

#### Literature and Evidence

Crunchbase, founded in 2007, has grown into the largest publicly accessible database of startup activity, relying on a community of contributors, a venture partner network, and machine learning to maintain records on companies worldwide. It aggregates data on funding rounds, acquisitions, leadership teams, investors, employee counts, and locations. Academic researchers have used Crunchbase data extensively: a Carnegie Mellon project analyzed the overlap in business areas, geographic proximity, employees, and investors between companies to build competitive landscape maps.

PitchBook, acquired by Morningstar in 2016, offers deeper financial data -- including valuations, cap tables, fund lifecycle information, and analyst-verified financials -- but at significantly higher cost ($20K-$50K/year versus Crunchbase's $0-$5K/year for basic access). The key methodological difference is data provenance: Crunchbase relies heavily on user-generated contributions with automated ingestion, prioritizing coverage over precision, while PitchBook employs dedicated researchers who validate data against regulatory filings.

Dealroom, strongest in European ecosystem coverage, maintains over 1.5 million companies in its database and has developed a proprietary taxonomy mapping 50+ primary sectors with hundreds of sub-categories. Its Sector Signal algorithm combines multiple data points -- unicorn creation rates, VC investment velocity, enterprise value growth -- to identify heating sectors. Tracxn, with 3.7 million tracked companies, combines machine learning with human analyst curation to build sector heatmaps.

#### Implementations and Benchmarks

A typical competitive landscape analysis using Crunchbase follows a structured workflow: (1) define the market category and adjacent categories, (2) filter for companies founded within a relevant time window, (3) segment by funding stage, geography, and status (active/acquired/closed), (4) map investor networks to identify which VCs have thesis conviction in the space, (5) identify patterns in founding dates and funding timing to detect market cycles, and (6) trace the fates of closed companies to understand failure modes.

Crunchbase's own Competitive Landscape Maps feature uses proprietary data and AI-driven analysis to show how companies relate and compare within their markets. The four-quadrant framework classifies companies as Market Leaders (high share, high growth), Challengers (low share, high growth), Niche Players (specialized focus), or Emerging Entrants (new innovators).

#### Strengths and Limitations

**Strengths:** Broad coverage of venture-backed companies; standardized data fields enabling systematic comparison; historical depth going back over a decade; investor network analysis revealing capital thesis patterns; relatively low cost for basic access.

**Limitations:** Severe bias toward venture-backed companies -- the vast majority of startup attempts, including bootstrapped ventures, are invisible in these databases. Data quality varies significantly, particularly for early-stage and non-US companies. Crunchbase's community-contributed model introduces inconsistent fields, outdated funding dates, and partial contact information. Closure dates are often missing or imprecise, making survival analysis unreliable. The databases track *companies* rather than *products*, missing the many pivots and product-line experiments within a single corporate entity.

### 4.2 Postmortem and Graveyard Analysis

#### Theory and Mechanism

Postmortem analysis inverts the conventional approach to competitive intelligence. Rather than studying what exists, it studies what died. The theoretical motivation is straightforward: the population of failed ventures in a market contains information about the market's structural characteristics, its pitfalls, and the conditions required for viability. If every food delivery startup founded between 2012 and 2015 that focused on dinner delivery in mid-size cities failed, that pattern constrains the hypothesis space for any new entrant.

The approach draws on organizational learning theory (Argote, 2013) and the growing recognition that failure analysis is at least as informative as success analysis -- a position articulated by Failory's founding philosophy: "there's more to learn from failures than from successes."

#### Literature and Evidence

CB Insights' collection of 483 startup failure postmortems represents the largest curated repository of founder and investor accounts of why specific ventures failed. Each entry includes the founders' or investors' own narrative, providing first-person causal attribution. The limitation is obvious: self-reported failure attributions are subject to self-serving bias, narrative simplification, and post-hoc rationalization.

Failory maintains two distinct databases: a Startup Cemetery with 120+ analyzed failed startups (Vine, Quibi, MySpace, etc.) and a broader Graveyard with 200+ analyses covering both startups and failed products from established companies. Failory's taxonomy classifies failures across 17 cause categories including Acquisition Flu, Bad Business Model, Bad Management, Bad Marketing, Bad Timing, Competition, Dependence on Others, Failure to Pivot, Lack of Experience, Lack of Focus, Lack of Funds, Lack of PMF, Legal Challenges, Mismanagement of Funds, No Market Need, and Poor Product. Each entry documents the company name, business description, industry category, country, primary failure cause, business outcome, years of operation, funding range, employee count, and number of founders.

Loot Drop represents the most ambitious attempt at systematic competitive graveyard analysis, tracking 1,600+ failed startups representing over $40 billion in burned venture capital across 22 product categories, 10 sectors, and 50+ countries. Its distinctive contribution is the extraction of seven "failure antipatterns": No Market Need, Ran Out of Cash, Team/Founder Conflict, Competition, Product/Tech Failure, Legal/Regulatory Issues, and Unit Economics. Uniquely, Loot Drop generates AI-powered "rebuild plans" for each failed startup, including tech stack recommendations, market analysis, and specific guidance on what to avoid -- effectively treating the competitive graveyard as a source of actionable opportunity intelligence.

Eisenmann's academic research (2021), based on interviews and surveys with hundreds of founders and investors, provides the most theoretically rigorous failure taxonomy. His six patterns -- Bad Bedfellows, False Starts, False Positives, Speed Traps, Help Wanted, and Cascading Miracles -- move beyond surface-level cause categories to identify structural patterns that recur across industries and time periods.

#### Implementations and Benchmarks

A structured graveyard analysis for a specific market involves: (1) identifying all known defunct or failed ventures in the category using multiple databases (CB Insights, Failory, Loot Drop, Crunchbase status filters, manual web research), (2) for each failed venture, documenting founding date, closure date, peak funding, team composition, product description, and stated failure reasons, (3) cross-referencing self-reported failure causes with external evidence (funding timelines, competitive events, market conditions), (4) coding failures according to a consistent taxonomy (timing, execution, market structure, capital, team, regulatory), and (5) looking for patterns -- if most failures cluster around a specific cause, that cause becomes the primary risk factor for new entrants.

Research by a team using the Best-Worst Method for prioritizing startup failure factors demonstrated a mixed-methods approach: qualitative thematic analysis of entrepreneur interviews followed by quantitative ranking of failure factors. This hybrid methodology addresses the limitations of purely quantitative database analysis by incorporating contextual understanding.

#### Strengths and Limitations

**Strengths:** Directly addresses the "what has been tried" question; provides cautionary intelligence that database mining alone cannot; failure pattern analysis constrains hypothesis space for new ventures; founder narratives provide rich contextual detail unavailable in structured databases.

**Limitations:** Severe survivorship bias -- companies that die quietly leave no postmortem. Self-reported failure attributions are unreliable: founders may blame external factors (timing, market) to protect reputation, while investors may blame execution to justify their thesis. Sample bias toward venture-backed failures means bootstrapped failures are invisible. Attribution of failure to a single cause oversimplifies multifactorial dynamics. Temporal decay means older failures have less relevance as market conditions change. The databases themselves may be incomplete or inconsistent, with Loot Drop reporting "Outcompeted (83%)" as the primary killer, while CB Insights finds "No Market Need (42%)" dominant -- a discrepancy likely reflecting different sample compositions and coding methodologies.

### 4.3 App Store and Product Hunt Archaeology

#### Theory and Mechanism

App stores and product launch platforms serve as temporal records of market experimentation. Every app ever published to the iOS App Store or Google Play Store, and every product ever launched on Product Hunt, represents someone's bet about what the market wants. The accumulated history of these bets -- including which survived, which died, which grew, and which categories experienced waves of entry followed by mass extinction -- constitutes a rich dataset for competitive intelligence.

The theoretical basis connects to evolutionary economics (Nelson and Winter, 1982): markets function as selection environments, and the history of variation (new entries), selection (market success or failure), and retention (surviving business models) reveals the fitness landscape of a given product category.

#### Literature and Evidence

**App Store Intelligence:** Sensor Tower (which acquired data.ai, formerly App Annie, combining their respective data panels and estimation models) provides the primary commercial infrastructure for App Store archaeology. The combined platform tracks estimated downloads, revenue, active users, engagement metrics, retention signals, app store rankings, and performance trends by country, category, and platform. The methodology combines a large global panel with direct measurement, contributory networks, partnerships, and AI-driven public data extraction, with machine learning models synthesizing these inputs. Accuracy has been a persistent concern -- Quora discussions and industry commentary suggest that estimates are useful for directional analysis and competitive benchmarking but may deviate significantly from actual figures for individual apps.

For competitive graveyard purposes, App Store data enables a specific form of analysis: identifying all apps that were ever published in a category, determining which are no longer available or no longer updated, and examining the temporal patterns of entry and exit. This "App Store archaeology" can reveal category-level dynamics invisible to company-level databases: how many attempts were made, what features they offered, how long they survived, and what the market conditions were at entry and exit.

**Product Hunt Analysis:** Product Hunt, since its founding in 2013, has accumulated data on over 90,000 featured products across 280+ categories. A ScrapingBee analysis of the complete Product Hunt archive found that approximately 22% of all featured products (roughly 20,970) now return errors when accessed -- meaning they are effectively dead. The further back in time, the higher the error rate, with products from July 2014 showing a peak error rate of 32%. Productivity was the dominant category with 4,243 products listed, followed by Android (1,677) and Design Tools (1,505).

Product Hunt's platform dynamics have shifted dramatically. Between 2020 and 2023, 60-98% of daily launches were featured on the homepage. Following algorithm changes in September 2024, only approximately 10% of launches receive featuring. Daily featured products dropped from 47 in September 2023 to 16 in September 2024. This evolution affects the platform's utility as a competitive intelligence source: recent Product Hunt data is more selective but potentially higher quality, while historical data is more comprehensive but includes a higher proportion of low-effort launches.

Available datasets for analysis include the Piloterr Product Hunt Dataset (2024) and the Hugging Face Product Hunt dataset, which provide structured data for programmatic analysis. The platform's GraphQL API (v2) enables systematic data extraction, though with rate limits.

#### Implementations and Benchmarks

A Product Hunt archaeological analysis for a specific market category would follow this workflow: (1) query the Product Hunt API or a scraped dataset for all products in the relevant category, (2) for each product, check whether it is still accessible and active, (3) analyze the temporal distribution of launches -- periods of high launch density indicate market interest waves, (4) examine the survival rates of products launched in different periods, (5) categorize the dead products by type of death (domain expired, pivot to different product, acqui-hire, simple abandonment), and (6) extract patterns about what features, positioning, and timing correlated with survival.

The Product Haunt project specifically built a tool for browsing the "Product Hunt graveyard" -- products that were once featured but are no longer available.

#### Strengths and Limitations

**Strengths:** Product-level granularity (vs. company-level in startup databases); temporal depth spanning over a decade; captures bootstrapped and indie ventures invisible to funding databases; quantitative survival analysis possible; reveals category-level dynamics and market cycles.

**Limitations:** App Store data requires expensive commercial subscriptions (Sensor Tower pricing ranges from $5K to $50K+ annually); estimation methodologies introduce significant uncertainty in download and revenue figures; Product Hunt data is biased toward consumer-facing tech products with English-speaking audiences; survivorship of websites is an imperfect proxy for product success (a product may be alive but irrelevant, or dead but acquired); the 22% error rate for Product Hunt products likely underestimates true failure because many "alive" products are effectively zombies with no active users; historical App Store data from before commercial intelligence platforms existed (pre-2010) is largely unrecoverable.

### 4.4 Patent Landscape Analysis

#### Theory and Mechanism

Patent filings represent a legally mandated disclosure of inventive intent. Every patent application reveals what a company or inventor is working on, how they propose to solve a technical problem, what prior art they acknowledge, and (through citation networks) how their work relates to the broader technological landscape. For competitive intelligence purposes, patent landscape analysis serves three functions: mapping the current competitive positions of technology-driven players, identifying innovation trajectories and future strategic directions, and finding "white spaces" -- technological areas where no one has filed, potentially indicating either unexplored opportunity or impossible terrain.

The theoretical basis connects to Schumpeterian economics: innovation is the primary engine of competitive advantage, and the patent system creates a public record of innovation activity that would otherwise be hidden inside corporate R&D labs.

#### Literature and Evidence

WIPO's Patent Analytics program provides the institutional framework for patent landscape analysis. WIPO publishes formal Patent Landscape Reports covering specific technology fields, offers a Patent Analytics Handbook introducing advanced methods, and maintains a community of practice. The WIPO methodology involves several steps: obtaining data from patent databases, evaluating it through statistical and semantic analysis to find patterns, and presenting results through visualization.

The commercial patent analytics ecosystem includes several major platforms. PatSnap provides access to a large patent database integrated with legal and technical information, offering 3D visualization of patent activity landscapes and AI-powered semantic search. Orbit Intelligence by Questel focuses on patent search, analysis, and portfolio management with AI-based clustering for technology trend tracking. PatentSight by LexisNexis specializes in competitive intelligence benchmarking through patent portfolio quality metrics. Google Patents offers free basic access to patent full text and classification, increasingly augmented with AI-powered prior art search.

Academic research has validated patent landscape analysis as a strategic intelligence tool. Breitzman and Thomas (2015) demonstrated that patent citation analysis can predict which companies will become acquisition targets. Jaffe and de Rassenfosse (2017) provided a comprehensive review of patent citation analysis methods and their limitations.

#### Implementations and Benchmarks

A patent landscape analysis for competitive intelligence typically follows this process: (1) define the technology domain using IPC/CPC classification codes and keyword searches, (2) retrieve all relevant patents from the target jurisdictions, (3) analyze filing trends over time to identify acceleration or deceleration of innovation activity, (4) map the major filing entities and their relative positions by patent volume, citation impact, and geographic scope, (5) perform citation network analysis to identify foundational patents and emergent clusters, (6) identify white spaces -- classification intersections or technology combinations where filing activity is absent, and (7) analyze patent family structures to understand global filing strategies.

Patent landscaping for competitive graveyard purposes adds a specific lens: identifying companies that once filed actively in a domain but have stopped, suggesting strategic retreat, pivot, or failure. Lapsed patents and abandoned applications provide direct evidence of discontinued technology programs.

#### Strengths and Limitations

**Strengths:** Legally mandated disclosure creates a uniquely comprehensive record of innovation activity; global standardized classification systems enable cross-jurisdictional analysis; citation networks reveal technological relationships and influence; 20+ years of digital patent data available for historical analysis; white space analysis directly identifies unexplored opportunities; patent filing patterns can signal strategic intent 1-3 years before product launches.

**Limitations:** Patent data is biased toward patentable inventions -- software innovations, business methods, and design innovations are underrepresented in many jurisdictions; filing-to-publication lag (typically 18 months) means current activity is invisible; patent filing strategies vary dramatically by industry, company size, and geography (some companies file aggressively as defensive moats, others avoid patents entirely); commercial patent analytics platforms are expensive ($10K-$100K/year); the gap between patent filing and commercial implementation is large and unpredictable; many valuable innovations are never patented (trade secrets); AI-generated patent applications are beginning to introduce noise into the system.

### 4.5 Digital Footprint and Alternative Data Analysis

#### Theory and Mechanism

Every company, whether venture-backed or bootstrapped, alive or dead, leaves digital traces. Website traffic patterns, technology stack choices, job postings, regulatory filings, social media activity, developer community engagement, and hundreds of other signals constitute a digital footprint that can be read for competitive intelligence. The theoretical basis is information economics: even when companies do not voluntarily disclose their strategies, their observable behavior -- what they build, who they hire, what they file -- reveals strategic intent.

Alternative data -- non-traditional data sources used to extract investment and strategic insights -- has expanded from a hedge fund niche into a mainstream competitive intelligence resource. The category includes web-scraped pricing data, satellite imagery of retail parking lots, credit card transaction panels, mobile device location data, and job posting analytics.

#### Literature and Evidence

**Similarweb** provides the primary commercial infrastructure for website traffic competitive analysis. The platform combines a large global panel with direct measurement, contributory networks, and AI-driven estimation to benchmark traffic, engagement, SEO performance, paid search activity, social referrals, audience insights, and market position across competitors. Coverage spans 190 countries with category-level filters. The methodology has been validated by comparison with known traffic figures from publicly reporting companies, though accuracy degrades for smaller sites with less panel representation.

**BuiltWith** approaches competitive intelligence from a different angle: technology detection. By analyzing the front-end and back-end technologies deployed on websites -- from analytics platforms to payment processors to content management systems -- BuiltWith enables technographic profiling of competitors. Technology stack changes can signal strategic shifts: adopting an enterprise CRM suggests B2B pivot; adding a recommendation engine suggests personalization investment; removing a technology suggests feature deprecation.

**The Wayback Machine** (Internet Archive), with over 866 billion archived web pages, provides the most comprehensive historical record of the web. For competitive graveyard analysis, it enables direct examination of dead companies' websites -- their messaging, features, pricing, team pages, and blog posts -- long after the companies themselves have ceased to exist. This is often the only way to reconstruct what a defunct competitor actually offered and how they positioned themselves.

**Job posting intelligence** platforms (JobsPikr, scanning 70,000+ sources daily; LinkUp, indexing millions of listings from 80,000+ employer websites; Aura, providing structured workforce analytics) enable inference about competitive strategy from hiring behavior. A surge in machine learning engineer postings signals AI product development; a wave of sales hiring signals go-to-market expansion; mass layoffs signal strategic retreat or failure. Autobound's signal database monitors 400+ real-time buying signals from 25+ sources, combining financial signals (SEC filings, earnings calls), social signals (Reddit, Glassdoor, G2 reviews), and workforce signals into an integrated intelligence stream.

**SEC EDGAR filings** provide legally mandated disclosure from public companies and companies in the process of going public. 10-K annual reports, 10-Q quarterly reports, 8-K material event disclosures, and Form 4 insider trading reports all contain competitively relevant information. Specialized APIs (such as sec-api.io) and AI-powered extraction tools enable systematic analysis of these filings for competitive intelligence.

#### Implementations and Benchmarks

A comprehensive digital footprint analysis for competitive intelligence combines multiple data streams: (1) Similarweb traffic analysis to benchmark relative competitive positions and identify growth or decline trajectories, (2) BuiltWith technology detection to map technology adoption patterns and strategic investments, (3) Wayback Machine historical analysis to reconstruct the evolution of competitor messaging, features, and positioning, (4) job posting monitoring to detect hiring patterns signaling strategic direction, (5) SEC filing analysis for public companies to extract revenue segment data, risk factor disclosures, and strategic commentary, and (6) GitHub and open-source activity monitoring for technology companies to assess engineering investment and developer ecosystem health.

#### Strengths and Limitations

**Strengths:** Captures signals from companies that do not appear in startup databases; real-time or near-real-time data availability; reveals actual behavior rather than self-reported claims; multiple independent signals enable triangulation; particularly valuable for detecting strategic shifts, pivots, and early signs of failure; applies to both venture-backed and bootstrapped companies.

**Limitations:** Web traffic estimation has known accuracy limitations, particularly for smaller websites; technology detection may miss server-side technologies; Wayback Machine coverage is incomplete -- not all pages are archived, and dynamic content is often not captured; job posting data is noisy (companies post aspirational roles, roles that are already filled internally, and duplicate listings); SEC filing analysis applies only to public companies; alternative data often requires expensive subscriptions or custom scraping infrastructure; legal and ethical boundaries around web scraping vary by jurisdiction and are evolving; correlation between digital signals and actual business health is imperfect.

### 4.6 AI-Powered Competitive Monitoring Platforms

#### Theory and Mechanism

The latest generation of competitive intelligence tools applies natural language processing, machine learning, and increasingly large language models to automate the collection, classification, and synthesis of competitive information. The theoretical proposition is that AI can monitor a vastly larger set of signals than human analysts, identify patterns across these signals at machine speed, and deliver actionable intelligence in real time.

#### Literature and Evidence

**Crayon** is an AI-powered competitive intelligence platform that monitors competitors across digital channels -- website changes, product reviews, marketing campaigns, pricing updates, press releases, and social media -- and uses AI to surface significant insights. Crayon's approach emphasizes breadth of monitoring: it captures data points that would be invisible to manual analysis, such as subtle website copy changes, new pricing tier introductions, or job posting shifts. Pricing ranges from $12,500 to $47,000 per year.

**Klue** is an enterprise-grade competitive enablement platform that focuses on curating intelligence to empower sales teams. Klue's automated web crawler tracks competitor updates across news and press release sites, monitoring "millions of data points from public sources." Klue serves over 200,000 users and in 2025-2026 launched Compete Agent, an AI agent designed to deliver real-time competitive deal intelligence directly to sellers. Klue integrates with Salesforce and Slack, creating a tight feedback loop between field intelligence and competitive analysis. Pricing ranges from $16,000 to $45,750 per year.

**G2 Market Intelligence** provides a distinctive competitive intelligence source: aggregated software buyer behavior and review data. G2 shows who is gaining traction, who teams are replacing, and where competitors are winning deals, with category-wide benchmarking and switching insights. Because G2 captures actual purchase decisions and post-purchase evaluations, it provides a demand-side view that complements the supply-side view offered by monitoring tools.

#### Implementations and Benchmarks

Organizations implementing AI-powered competitive intelligence automation report substantial operational gains: 85-95% reduction in manual research time, 30-40% improvement in competitive win rates, and battlecard freshness improving from 30-day update cycles to continuous accuracy. The shift from reactive/descriptive CI (what did competitors do?) to predictive/prescriptive CI (what will competitors do, and how should we respond?) is the defining trend of 2025-2026. NLP capabilities now enable automated extraction of competitor messaging, value propositions, and market positioning from unstructured text, with sentiment analysis evaluating customer tone and machine learning models classifying content into strategic categories.

#### Strengths and Limitations

**Strengths:** Scale of monitoring far exceeds human capacity; real-time alerting enables rapid response; AI summarization reduces analyst workload; direct integration with sales workflows increases utilization of intelligence; continuous improvement as models are trained on domain-specific data; can detect subtle signals (website changes, pricing adjustments) that human analysts miss.

**Limitations:** High cost ($12K-$50K/year) prices out early-stage startups and individual researchers; AI summarization can introduce hallucination and misclassification; platforms are optimized for ongoing competitive monitoring rather than historical/archaeological analysis; limited coverage of private company activities that do not leave digital traces; the "black box" nature of AI-powered insights makes it difficult to assess reliability; heavy dependence on publicly accessible web data means that competitors who restrict their digital footprint become invisible; battle card and alert fatigue can reduce analyst engagement over time.

### 4.7 War Gaming and Red Teaming

#### Theory and Mechanism

Business war gaming adapts military simulation methodology to commercial strategy. Teams role-play as named competitors, operating under realistic constraints derived from competitive intelligence, and simulate competitive responses to proposed strategic moves. The mechanism is not prediction but *stress testing*: by forcing decision-makers to think from a competitor's perspective, war gaming reveals blind spots, untested assumptions, and vulnerabilities that conventional analysis misses.

The approach was formalized in the CI context by the Academy of Competitive Intelligence (Fuld, Gilad, Herring) and has been adopted by pharmaceutical companies (for product launch scenarios), technology companies (for platform strategy), and consumer goods companies (for category expansion).

#### Literature and Evidence

War gaming exercises typically involve 15-50 participants organized into teams: one "home" team and multiple competitor teams, each receiving confidential role briefs describing objectives, constraints, KPIs, governance cadence, and strategic red lines. Over 3-5 rounds, teams make strategic moves, observe competitor responses, and adapt. The final phase dismantles competitor teams and synthesizes insights into actionable strategy recommendations.

The effectiveness of war gaming depends heavily on the quality of underlying competitive intelligence: the more accurate and detailed the competitor profiles used in role briefs, the more realistic and valuable the simulation outcomes. Gilad's CI curriculum places war gaming (CI 401) as the most advanced analytical technique, requiring mastery of foundational CI skills.

#### Strengths and Limitations

**Strengths:** Forces perspective-taking that overcomes anchoring bias; reveals strategic blind spots impossible to identify through desk research alone; generates organizational alignment around competitive threats; produces actionable contingency plans; particularly valuable for high-stakes strategic decisions (market entry, pricing changes, platform launches).

**Limitations:** Expensive ($20K-$200K per exercise for external facilitation); requires significant participant time (typically 1-3 days); quality depends on accuracy of competitor intelligence inputs; participants may not accurately simulate competitors' decision-making; exercises are snapshot-in-time rather than continuous; organizational politics can distort simulation dynamics; results are qualitative and difficult to validate.

---

## 5. Comparative Synthesis

### 5.1 Cross-Cutting Trade-Off Analysis

| Dimension | Database Mining | Graveyard Analysis | App Store / PH Archaeology | Patent Landscaping | Digital Footprint | AI CI Platforms | War Gaming |
|---|---|---|---|---|---|---|---|
| **Coverage breadth** | High (VC-backed) | Medium (well-known failures) | Medium (app/product layer) | High (patented tech) | High (all web-present) | Medium (monitored set) | Low (selected competitors) |
| **Bootstrapped visibility** | Very Low | Low | Medium-High | Low | Medium-High | Medium | N/A |
| **Historical depth** | 10-15 years | 10-20 years | 10-13 years (App Store: 2008+, PH: 2013+) | 25+ years | 10-25 years (Wayback Machine: 1996+) | 2-5 years | N/A |
| **Data reliability** | Medium (user-contributed) to High (analyst-verified) | Low-Medium (self-reported) | Medium (estimated metrics) | High (legal filings) | Medium (modeled estimates) | Medium (AI-generated) | Low (simulation) |
| **Attribution quality** | Low (tracks what, not why) | Medium (narratives, but biased) | Low (survival/death, not cause) | Low (intent, not outcome) | Medium (behavioral signals) | Medium (pattern-based) | Medium-High (expert judgment) |
| **Cost** | $0-$25K/yr | $0-$5K/yr | $5K-$50K/yr | $10K-$100K/yr | $5K-$30K/yr | $12K-$50K/yr | $20K-$200K/exercise |
| **Failure decomposition** | Weak | Moderate | Weak | N/A | Moderate (indirect) | Weak | Strong (but hypothetical) |
| **Temporal currency** | Days to months lag | Retrospective only | Days to months lag | 18-month filing lag | Near real-time | Real-time | Point-in-time |
| **Manipulation resistance** | Low (can be gamed) | Medium | Medium (rankings gameable) | High (legal process) | Low-Medium (traffic inflation possible) | Low-Medium | High |

### 5.2 The Failure Decomposition Problem

The central analytical challenge in competitive graveyard analysis is *causal decomposition*: given a failed venture, how do you determine whether it failed because the timing was wrong, the execution was wrong, or the market does not exist? This distinction is not academic -- it is the single most important input for a new entrant's strategic calculus:

- **Timing was wrong** implies the market may now be viable: technology has matured, consumer behavior has shifted, regulatory barriers have fallen, or infrastructure costs have declined. This is the most optimistic interpretation for a new entrant.
- **Execution was wrong** implies the market is viable but the specific team, strategy, or operational approach failed. This is moderately optimistic: a better team with a better approach might succeed.
- **Market does not exist** implies the fundamental demand hypothesis is wrong. This is the most cautionary signal: the opportunity itself may be illusory.

No single data source or methodology reliably distinguishes these causes. Instead, triangulation across multiple approaches is required:

| Signal | Timing-Was-Wrong | Execution-Was-Wrong | Market-Doesn't-Exist |
|---|---|---|---|
| Multiple failures at similar time, success later | Strong indicator | - | - |
| Multiple failures across different time periods | - | - | Strong indicator |
| One failure, competitors succeeded | - | Strong indicator | - |
| Founder postmortem cites timing/regulation | Moderate (biased source) | - | - |
| Patent activity continues despite company failures | Indicator of ongoing tech development | - | - |
| Customer discovery data shows demand | Supports timing or execution | Supports execution | Contradicts market absence |
| Category shows zero App Store survivors | - | - | Moderate indicator |
| VC funding continues entering the space | Supports timing (VCs see changed conditions) | Supports execution (VCs think they found better team) | Weakly contradicts market absence |
| Job posting signals in adjacent areas | Supports timing (ecosystem building) | - | - |

Gross's finding that timing accounts for 42% of startup outcome variance, combined with Gompers et al.'s evidence that successful entrepreneurs demonstrate persistent market timing skill, suggests that timing attribution is more common and more consequential than typically acknowledged. But timing is also the most difficult cause to verify ex ante, because the conditions that make a market "ready" are themselves complex and emergent.

---

## 6. Open Problems and Gaps

### 6.1 Survivorship Bias in Failure Data

The most fundamental problem in competitive graveyard analysis is recursive: the database of dead companies is itself subject to survivorship bias. Companies that fail conspicuously -- after raising significant venture capital, receiving press coverage, or publishing postmortems -- are overrepresented. Companies that fail quietly -- bootstrapped ventures that simply close, side projects that are abandoned, indie apps that are unpublished from stores -- leave no systematic record. This means that the most "interesting" failures (well-funded, high-profile) are overrepresented in the analytical sample, while the most "common" failures (underfunded, obscure) are invisible.

The magnitude of this problem is significant. CB Insights' 483 postmortems, Failory's 200+ analyses, and Loot Drop's 1,600+ entries collectively represent a tiny fraction of all startup failures. In the US alone, roughly 305,000 businesses with employees close each year. The postmortem databases capture perhaps 1% of technology-related failures and an even smaller fraction of all business failures.

### 6.2 The Attribution Problem

As discussed in Section 5.2, decomposing failure into timing, execution, and market-structure causes remains an unsolved analytical problem. Self-reported attributions are unreliable. External evidence is circumstantial. And the interaction effects between causes -- a timing problem that manifests as an execution problem because the team runs out of money while waiting for the market to develop -- resist clean categorization.

No existing methodology provides a validated, replicable protocol for failure attribution that achieves inter-rater reliability. Different analysts examining the same failed venture routinely reach different conclusions about root cause. This is not merely an academic limitation -- it directly affects whether a new entrant interprets a graveyard as a warning sign or a opportunity signal.

### 6.3 Data Decay and Platform Restrictions

The raw material of competitive intelligence is decaying. Platform API restrictions are limiting access to historical data: Product Hunt's shift from a permissive to a selective featuring model, combined with GraphQL rate limits, constrains systematic analysis. App stores do not maintain public archives of removed applications. Social media platforms increasingly restrict researcher access. The Wayback Machine, while invaluable, has incomplete coverage and does not capture dynamic content.

Meanwhile, dead companies' digital traces are actively disappearing. Domain registrations lapse, hosting accounts are terminated, and web content vanishes. The average half-life of a URL has been estimated at approximately 2 years. For competitive archaeology purposes, this means that the further back in time you look, the more fragmentary and unreliable the evidence becomes.

### 6.4 AI-Generated Noise

The proliferation of AI-generated content is degrading the signal-to-noise ratio in every competitive intelligence data source. AI-generated press releases, blog posts, social media content, and even patent applications introduce synthetic signals that are difficult to distinguish from genuine competitive activity. For monitoring tools that rely on web scraping and NLP, this means more data but less information -- a worsening signal-to-noise ratio that increases the cost of analysis without improving its quality.

### 6.5 Absence of Counterfactual Analysis

Existing methodologies can describe *what happened* but struggle with *what would have happened under different conditions*. When a startup fails, we observe one realization of a stochastic process. We do not observe the counterfactual: the same startup with different timing, a different team, or a different capital structure. Without counterfactual analysis, all failure attribution is essentially correlational rather than causal. Emerging causal inference methods from economics (difference-in-differences, synthetic controls, instrumental variables) have been applied to firm-level outcomes but have not yet been systematically adapted for competitive graveyard analysis.

### 6.6 Integration Across Data Sources

Each data source -- startup databases, postmortem narratives, App Store metrics, patent filings, digital footprint data -- provides a partial view. No existing tool or methodology provides a comprehensive, integrated view that combines all these sources into a unified competitive landscape analysis. Analysts must manually triangulate across multiple platforms, each with its own biases, blind spots, and data formats. The development of integrated competitive intelligence platforms that combine structured database data, historical product intelligence, patent landscapes, and digital footprint analysis into a single analytical environment remains an open infrastructure problem.

### 6.7 Ethical and Legal Boundaries

The boundary between legitimate competitive intelligence and privacy-invasive surveillance is under increasing regulatory scrutiny. GDPR, CCPA, and emerging AI regulation affect what data can be collected, how it can be processed, and what consent is required. Web scraping legality varies by jurisdiction and is subject to evolving case law (the hiQ Labs v. LinkedIn decision in the US established some protections for scraping public data, but the precedent is narrow). SCIP's ethical code prohibits bribery, theft, electronic eavesdropping, and illegal cyber techniques, but the definition of "illegal" varies across jurisdictions and is shifting as privacy regulations tighten.

---

## 7. Conclusion

Competitive intelligence methodology has evolved from a craft practice into a multi-layered analytical discipline supported by specialized databases, AI-powered monitoring platforms, and structured frameworks for failure analysis. The "what has been tried" layer -- the systematic reconstruction of competitive history including failures, exits, and pivots -- is simultaneously one of the most valuable and most methodologically challenging components of CI practice.

The survey reveals a landscape of complementary but imperfect approaches. Startup databases provide breadth but miss bootstrapped ventures and the causes of failure. Postmortem databases provide narrative richness but suffer from self-reporting bias and survivorship bias. App Store and Product Hunt archaeology capture product-level dynamics but offer limited causal insight. Patent landscape analysis reveals technology trajectories but not market outcomes. Digital footprint analysis provides real-time behavioral signals but requires expensive tooling and careful interpretation. AI-powered platforms offer scale and speed but introduce their own reliability concerns.

The central unresolved problem remains failure decomposition: distinguishing timing failure from execution failure from market-structure failure. This distinction drives the strategic implications of graveyard analysis -- the same set of dead companies can be read as evidence that a market is fundamentally nonviable or that it is ripe for a well-timed, better-executed attempt. No existing methodology reliably resolves this ambiguity, and the development of validated failure decomposition protocols represents the most impactful open problem in the field.

For practitioners, the implication is clear: competitive intelligence requires methodological pluralism. No single tool, database, or framework provides a complete picture. The most reliable competitive landscape analysis triangulates across multiple data sources, combines quantitative pattern analysis with qualitative narrative understanding, and explicitly acknowledges the limitations and biases inherent in each source. The "what has been tried" layer is never complete, but systematic methodology can make it substantially more informative than the ad hoc approaches that remain dominant in practice.

---

## References

Aguilar, F. J. (1967). *Scanning the Business Environment*. New York: Macmillan.

Ansoff, H. I. (1975). Managing strategic surprise by response to weak signals. *California Management Review*, 18(2), 21-33.

Argote, L. (2013). *Organizational Learning: Creating, Retaining and Transferring Knowledge* (2nd ed.). Springer.

Breitzman, A., & Thomas, P. (2015). The emerging clusters model: A tool for identifying emerging technologies across multiple patent systems. *Research Policy*, 44(1), 195-205.

CB Insights. (2025). Why startups fail: Top 12 reasons. CB Insights Research. https://www.cbinsights.com/research/report/startup-failure-reasons-top/

CB Insights. (2025). 483 startup failure post-mortems. CB Insights Research. https://www.cbinsights.com/research/startup-failure-post-mortem/

Eisenmann, T. (2021). Why start-ups fail. *Harvard Business Review*, May-June 2021. https://hbr.org/2021/05/why-start-ups-fail

Eisenmann, T. (2021). *Why Startups Fail: A New Roadmap for Entrepreneurial Success*. Currency/Random House. https://www.hbs.edu/faculty/Pages/item.aspx?num=59201

Fleisher, C. S., & Bensoussan, B. E. (2003). *Strategic and Competitive Analysis: Methods and Techniques for Analyzing Business Competition*. Prentice Hall.

Fleisher, C. S., & Bensoussan, B. E. (2007). *Business and Competitive Analysis: Effective Application of New and Classic Methods*. FT Press.

Fuld, L. M. (1995). *The New Competitor Intelligence: The Complete Resource for Finding, Analyzing, and Using Information about Your Competitors*. Wiley.

Gilad, B. (1994). *Business Blindspots: Replacing Your Company's Entrenched and Outdated Myths, Beliefs and Assumptions with the Realities of Today's Markets*. Probus Publishing.

Gilad, B. (2004). *Early Warning: Using Competitive Intelligence to Anticipate Market Shifts, Control Risk, and Create Powerful Strategies*. AMACOM.

Gilad, B., & Fuld, L. (2020). Only half of companies actually use the competitive intelligence they collect. *Competitive Intelligence Magazine*, 23(2).

Gompers, P. A., Kovner, A., Lerner, J., & Scharfstein, D. S. (2010). Performance persistence in entrepreneurship. *Journal of Financial Economics*, 96(1), 18-32. https://www.sciencedirect.com/science/article/abs/pii/S0304405X09002311

Gross, B. (2015). The single biggest reason why startups succeed [TED Talk]. https://www.idealab.com/videos/bill_gross_ted_2015.php

Hannan, M. T., & Freeman, J. (1977). The population ecology of organizations. *American Journal of Sociology*, 82(5), 929-964.

Jaffe, A. B., & de Rassenfosse, G. (2017). Patent citation data in social science research: Overview and best practices. *Journal of the Association for Information Science and Technology*, 68(6), 1360-1374.

Madureira, L., Popovic, A., & Castelli, M. (2023). Competitive intelligence empirical validation and application: Foundations for knowledge advancement and relevance to practice. *Journal of Information Science*, 49(6). https://journals.sagepub.com/doi/10.1177/01655515231191221

Nelson, R. R., & Winter, S. G. (1982). *An Evolutionary Theory of Economic Change*. Harvard University Press.

Porter, M. E. (1980). *Competitive Strategy: Techniques for Analyzing Industries and Competitors*. Free Press.

Porter, M. E. (1985). *Competitive Advantage: Creating and Sustaining Superior Performance*. Free Press.

SCIP (Strategic Consortium of Intelligence Professionals). (2023). Competitive intelligence foundational tools and practices. https://www.scip.org/page/Competitive-Intelligence-Foundational-Tools-and-Practices

Von Hippel, E. (1986). Lead users: A source of novel product concepts. *Management Science*, 32(7), 791-805.

Von Hippel, E. (2005). *Democratizing Innovation*. MIT Press.

WIPO. (2015). *Guidelines for Preparing Patent Landscape Reports*. World Intellectual Property Organization. https://www.wipo.int/publications/en/details.jsp?id=3938

---

## Practitioner Resources

### Startup Databases and Funding Intelligence

- **Crunchbase** (https://www.crunchbase.com/) -- The largest publicly accessible startup database. Free tier provides basic search; Pro ($49/month) adds advanced filtering, CSV export, and competitive landscape maps. Best for initial landscape scans and investor network mapping.
- **PitchBook** (https://pitchbook.com/) -- Analyst-verified financial data including valuations, cap tables, and fund lifecycle information. Enterprise pricing ($20K-$50K+/year). The standard for institutional-grade due diligence.
- **Dealroom** (https://dealroom.co/) -- Strongest European ecosystem coverage with 1.5M+ companies and proprietary sector taxonomy. Used by ecosystem builders, policymakers, and corporate innovation teams. Subscription required.
- **Tracxn** (https://tracxn.com/) -- 3.7M tracked companies with ML-curated sector heatmaps and analyst-rated company lists. Competitive with PitchBook on early-stage coverage at lower price points.

### Postmortem and Failure Analysis Databases

- **CB Insights Startup Failure Post-Mortems** (https://www.cbinsights.com/research/startup-failure-post-mortem/) -- 483 postmortems in founders' and investors' own words. The largest curated collection but requires subscription for full access.
- **Failory Startup Cemetery** (https://www.failory.com/cemetery) -- 120+ analyzed startup failures with structured taxonomy (17 failure categories). Free access. Particularly useful for consumer-facing and well-known startup failures.
- **Failory Graveyard** (https://www.failory.com/graveyard) -- 200+ analyses covering both startups and failed products from established companies (Google, Amazon, etc.). Free access.
- **Loot Drop** (https://loot-drop.io/) -- 1,600+ failed startups with funding histories, failure antipatterns, market analysis, and AI-generated rebuild plans. The most comprehensive free failure database. Updated twice weekly.
- **Startup Graveyard** (https://startupgraveyard.io/) -- Curated resource emphasizing de-stigmatization of failure and community learning.

### App Store and Product Intelligence

- **Sensor Tower** (https://sensortower.com/) -- The dominant App Store intelligence platform following its acquisition of data.ai. Provides estimated downloads, revenue, active users, retention, and engagement metrics. Pricing starts at approximately $5K/year.
- **Product Hunt** (https://www.producthunt.com/) -- Historical archive of 90,000+ product launches since 2013. GraphQL API (v2) available for programmatic access. Product Haunt tool enables browsing of dead Product Hunt products.
- **G2** (https://www.g2.com/) -- Software buyer review platform providing competitive intelligence through actual purchase decisions, switching patterns, and post-purchase evaluations. G2 Market Intelligence provides category benchmarking.

### Patent Landscape Analysis

- **Google Patents** (https://patents.google.com/) -- Free access to global patent full text with AI-powered prior art search. Best starting point for initial technology landscape scans.
- **WIPO Patent Analytics** (https://www.wipo.int/en/web/patent-analytics) -- Free resources including Patent Landscape Reports by technology field, Patent Analytics Handbook, and community of practice.
- **PatSnap** (https://www.patsnap.com/) -- Commercial patent analytics with 3D landscape visualization, semantic search, and white space analysis. Enterprise pricing.
- **Orbit Intelligence** (https://www.questel.com/) -- Patent search, analysis, and portfolio management by Questel. AI-based clustering for technology trend tracking.

### Digital Footprint and Alternative Data

- **Similarweb** (https://www.similarweb.com/) -- Website traffic estimation and competitive benchmarking across 190 countries. Free tier for basic traffic overview; Pro for detailed analysis.
- **BuiltWith** (https://builtwith.com/) -- Technology stack detection for competitive technographic profiling. Free for basic lookups.
- **Wayback Machine** (https://web.archive.org/) -- Free access to 866 billion+ archived web pages. Essential for reconstructing dead competitors' websites and tracking historical messaging evolution.
- **JobsPikr** (https://www.jobspikr.com/) -- Job posting intelligence scanning 70,000+ sources daily. Useful for detecting competitor hiring patterns and strategic shifts.
- **LinkUp** (https://www.linkup.com/) -- Job listing data from 80,000+ employer websites. Provides labor market intelligence and competitive workforce signals.

### AI-Powered Competitive Monitoring

- **Crayon** (https://www.crayon.co/) -- AI-powered competitor monitoring across digital channels with automated battlecard generation. Pricing: $12,500-$47,000/year.
- **Klue** (https://klue.com/) -- Enterprise competitive enablement with 200,000+ users, Salesforce/Slack integration, and AI-powered Compete Agent. Pricing: $16,000-$45,750/year.

### OSINT and Scraping Tools

- **OSINT Framework** (https://osintframework.com/) -- Open-source collection of tools organized by information category for systematic open-source intelligence gathering.
- **SpiderFoot** (https://www.spiderfoot.net/) -- Automated OSINT reconnaissance tool for competitive footprint analysis.
- **Apify** (https://apify.com/) -- Web scraping and automation platform with pre-built scrapers for Product Hunt, SEC filings, and other competitive intelligence sources.

### Books and Academic Resources

- Eisenmann, T. (2021). *Why Startups Fail*. Currency. -- The most rigorous academic treatment of startup failure patterns, based on HBS research.
- Fleisher, C. S., & Bensoussan, B. E. (2007). *Business and Competitive Analysis*. FT Press. -- Comprehensive catalog of 24 analytical techniques with the FAROUT evaluation framework.
- Gilad, B. (2004). *Early Warning*. AMACOM. -- The foundational text on proactive competitive intelligence and blind spot analysis.
- Fuld, L. M. (1995). *The New Competitor Intelligence*. Wiley. -- Classic practitioner guide to CI methodology.
