---
title: "Originality Assessment & Differentiation Testing for B2C Product Innovation"
date: 2026-03-21
summary: Surveys the landscape of methods for evaluating whether a B2C product idea is genuinely novel versus a rebrand, covering the 10x improvement threshold, switching cost analysis, prior art search methodology, competitive differentiation scoring, JTBD-based differentiation, perceptual mapping, consumer novelty perception, and emerging AI-assisted approaches. Identifies open problems in cross-method validation, cultural transferability, and the measurement of perceived versus actual novelty.
keywords: [b2c_product, originality-assessment, differentiation-testing, novelty-evaluation, competitive-differentiation]
---

# Originality Assessment & Differentiation Testing for B2C Product Innovation

*2026-03-21*

---

## Abstract

The question of whether a product idea is genuinely novel or merely a repositioned variant of an existing solution is among the most consequential judgments in consumer product innovation. Misjudging originality leads to two symmetric failure modes: overestimating novelty wastes resources on undifferentiated entries that cannot justify switching costs, while underestimating novelty causes teams to abandon or undersell ideas that represent genuine breakpoints. Despite the importance of this judgment, no single canonical method exists for making it. Instead, practitioners and researchers draw on a heterogeneous landscape of frameworks spanning economics, psychology, engineering design, marketing science, and information retrieval.

This survey maps that landscape. It covers threshold-based approaches (the 10x improvement heuristic, Altshuller's five levels of invention), demand-side frameworks (Jobs-to-be-Done differentiation, switching cost analysis, the "would someone switch?" family of tests), competitive intelligence methods (prior art search, perceptual mapping, competitive differentiation scoring), consumer psychology perspectives (novelty perception, the Kano model, Rogers' diffusion attributes), structured innovation tools (Blue Ocean Strategy, TRIZ, Goldenberg-Mazursky creativity templates), and emerging computational approaches (semantic similarity, AI-assisted novelty detection). For each approach, the paper examines the underlying theory, available evidence, known implementations, and principal limitations.

The paper concludes with a comparative synthesis table, an honest enumeration of open problems — including the absence of cross-validated benchmarks, the confounding of novelty with communication quality, and the underexplored role of timing — and a curated set of practitioner resources. No single approach is recommended; the landscape is presented for readers to compose their own assessment stack based on context, stage, and risk tolerance.

---

## 1. Introduction

### 1.1 Problem Statement

Most new consumer products fail. The frequently cited 80-95 percent failure rate (Christensen et al. 2016; Castellion and Markham 2013) has many causes — poor execution, mistimed launches, insufficient distribution — but one cause sits upstream of all others: the product was not different enough to justify the cost of switching. A product that is insufficiently differentiated from incumbents must compete on price, distribution, or marketing spend — all of which favor established players with scale advantages. A product that is genuinely novel along dimensions consumers value, by contrast, can command attention, premium pricing, and organic word-of-mouth even without those structural advantages.

The challenge is that "genuinely novel" is not a binary property with a clear measurement protocol. Novelty exists on a spectrum and is perspective-dependent: novel to the consumer, novel to the industry, novel to the technology stack, and novel to the business model are four distinct claims that do not necessarily coincide. A product can be technologically novel but perceptually identical to the consumer (many B2B middleware products). Conversely, a product can use entirely existing technology but reconfigure it in a way that feels revolutionary to the end user (the original iPhone used no new component technologies; its novelty was architectural and experiential).

This paper surveys the methods available for making this judgment — for assessing whether an idea, concept, or early product is original enough to warrant investment and whether it is differentiated enough to survive contact with the market.

### 1.2 Scope

This survey covers methods applicable to B2C product innovation, from early concept evaluation through post-launch competitive positioning. It draws from:

- Innovation management literature (Cooper, Christensen, Ulwick, Kim and Mauborgne)
- Marketing science (Ehrenberg-Bass, conjoint analysis, perceptual mapping)
- Engineering design (Shah novelty metrics, TRIZ inventive levels, creativity templates)
- Consumer psychology (novelty perception, switching behavior, technology acceptance)
- Information retrieval and AI (semantic similarity, automated prior art search)
- Practitioner frameworks (Sean Ellis test, fake door testing, Stage-Gate screening)

The paper does not cover originality in pure artistic or scientific contexts, patent law doctrine (except as it informs prior art search methodology), or B2B enterprise sales differentiation, though many frameworks translate across these boundaries.

### 1.3 Key Definitions

**Originality**: The degree to which a product, feature, or concept differs from all known existing alternatives along dimensions perceptible and meaningful to the target user. Distinguished from *creativity* (which adds a value/usefulness requirement) and *innovation* (which adds a commercialization/adoption requirement).

**Differentiation**: The subset of originality that is strategically exploitable — differences that consumers can perceive, that they value, and that competitors cannot trivially replicate. Not all original features are differentiating; not all differentiators require deep originality.

**Switching Cost**: The total cost — financial, procedural, and relational — borne by a consumer who moves from an incumbent solution to a new one (Burnham, Frels, and Mahajan 2003). Switching costs set the minimum differentiation threshold: a new product must exceed the switching cost to trigger adoption.

**Prior Art**: Any evidence that an invention or idea was already known before the date of the claim. In product innovation (as opposed to patent law), prior art includes existing products, published concepts, abandoned prototypes, academic publications, and competitive intelligence.

**Rebrand**: A product that differs from an existing solution primarily in naming, packaging, positioning, or marketing language rather than in functional capability, user experience, or value delivered. The rebrand-vs.-novelty boundary is the central diagnostic question of this survey.

---

## 2. Foundations

### 2.1 Theoretical Background on Novelty

Novelty in product innovation has been studied from at least three disciplinary perspectives, each foregrounding different dimensions.

**The Engineering Design Perspective** treats novelty as a measurable property of a design output relative to a reference set. Shah, Vargas-Hernandez, and Smith (2003) proposed what remains the most widely cited formal metric: novelty is computed by weighting the rarity of each design attribute at multiple levels of abstraction (physical principle, working principle, embodiment, detail) using a genealogy tree structure. A design that uses a physical principle not found in the reference set scores higher on novelty than one that merely varies at the detail level. Subsequent work (Sarkar and Chakrabarti 2011; Fiorineschi, Frillici, and Rotini 2018) refined these metrics but did not resolve fundamental debates about reference set construction and weighting.

**The Marketing Science Perspective** distinguishes between *perceived differentiation* — the degree to which consumers see a product as different — and *meaningful differentiation* — the degree to which that difference drives preference. The Ehrenberg-Bass Institute (Sharp 2010) has presented extensive evidence that perceived differentiation between competing brands in a category is typically weak, that consumers buy on availability and habit rather than differentiated preference, and that what matters commercially is *distinctiveness* (being identifiable) rather than *differentiation* (being functionally different). This finding challenges the premise that originality is necessary for commercial success, though Sharp's critics (notably Ritson 2014; Mark Ritson in Marketing Week) argue the evidence applies primarily to mature FMCG categories and does not generalize to new product categories or technology markets.

**The Consumer Psychology Perspective** treats novelty as a perceptual and motivational construct. Hirschman (1980) identified novelty seeking as a stable consumer trait — the desire for new and different experiences — that drives early adoption behavior. Rogers (2003) formalized this through the concept of *relative advantage*: the degree to which an innovation is perceived as better than the idea it supersedes. Relative advantage is the single strongest predictor of adoption rate, accounting for more variance than compatibility, complexity, trialability, or observability. Importantly, relative advantage is perceptual: it depends not on objective technical superiority but on the consumer's assessment of improvement in their own terms.

### 2.2 Differentiation Theory

Michael Porter's (1985) generic strategies framework established differentiation as one of two fundamental competitive strategies (alongside cost leadership). Porter defined differentiation as the creation of something perceived as unique industrywide, achieved through design, brand image, technology, features, customer service, or dealer network. The key insight is that differentiation must be *perceived* by the buyer — it is not an intrinsic property of the product but a relational property between product and market.

This insight has been elaborated in several directions. Kim and Mauborgne (2005) argued that the most powerful form of differentiation is *value innovation* — simultaneously pursuing differentiation and low cost by eliminating and reducing factors the industry competes on while raising and creating factors it has never offered. Their Eliminate-Reduce-Raise-Create (ERRC) grid operationalizes this idea. Christensen's disruption theory (1997, 2003) describes a specific pattern of differentiation where entrants succeed not by being "better" on existing dimensions but by redefining which dimensions matter, typically by being simpler, cheaper, and more accessible.

### 2.3 The Problem-Solution Fit Prerequisite

Any assessment of product originality presupposes that the product addresses a real problem. The "solution in search of a problem" trap — building a technologically novel product that nobody needs — is a failure mode orthogonal to differentiation. Technology push innovation, where the impetus comes from a new capability rather than a market need, has a systematically higher market risk than demand pull innovation (Brem and Voigt 2009). The toothpaste industry exemplifies the pathology: incremental novelty (new flavors, new whitening compounds, new bristle geometries) drives temporary sales lifts but no sustained switching, because the underlying job is already adequately served and the innovations do not change the consumer's experience in a way they value.

This means that originality assessment cannot be performed in isolation. A product must pass a problem-existence test before differentiation testing becomes meaningful. Frameworks like Osterwalder's Value Proposition Canvas (2014), which maps customer jobs, pains, and gains against product features, pain relievers, and gain creators, serve as this prerequisite screen. The paper proceeds under the assumption that this prerequisite has been met.

---

## 3. Taxonomy of Approaches

The methods available for assessing originality and testing differentiation can be organized along two axes: the *perspective* from which novelty is evaluated (supply-side vs. demand-side) and the *stage* at which the assessment occurs (pre-build concept evaluation vs. post-build market testing).

| | **Pre-Build (Concept Stage)** | **Post-Build (Market Stage)** |
|---|---|---|
| **Supply-Side (Product-Out)** | Prior art search; TRIZ inventive levels; Shah novelty metrics; Goldenberg-Mazursky creativity templates; Blue Ocean ERRC analysis; Category design assessment | Competitive differentiation scoring; Feature matrix benchmarking; Patent landscape analysis |
| **Demand-Side (Customer-In)** | JTBD outcome gap analysis; Kano model feature classification; Rogers relative advantage estimation; Value Proposition Canvas fit assessment; Concept testing (MaxDiff, TURF) | Sean Ellis PMF test; Fake door / smoke testing; Switching cost-benefit analysis; Perceptual mapping (MDS); Willingness-to-pay studies (Van Westendorp, conjoint); Consumer novelty perception surveys |
| **Threshold / Heuristic** | 10x improvement threshold; Altshuller's 5 levels of invention; Garcia-Calantone typology | "Would someone switch?" behavioral tests; Retention and cohort analysis; Share-of-voice tracking |

This taxonomy is not rigid — many methods span cells. JTBD analysis, for example, can be applied at concept stage (identifying underserved outcomes) or post-launch (measuring whether the product actually gets the job done better). The table serves as a navigational aid for the detailed analysis that follows.

---

## 4. Analysis

### 4.1 The 10x Improvement Threshold

**Theory and mechanism.** Peter Thiel popularized the heuristic in *Zero to One* (2014): "Proprietary technology must be at least 10 times better than its closest substitute in some important dimension to lead to a real monopolistic advantage." The logic is economic and perceptual. Marginal improvements (2x, 3x) are difficult for consumers to perceive, easy for incumbents to match, and insufficient to overcome switching costs and status quo bias. A 10x improvement is legible — the consumer does not need a spreadsheet to notice it — and creates a structural gap that incumbents cannot close through incremental improvement on their existing architecture.

**Literature evidence.** Thiel's examples are canonical: Amazon offered 10x more books than any physical store; PayPal made eBay payments 10x more convenient than mailing checks; the iPad was 10x better as a tablet than any predecessor. Google's search quality was described as 10x better than AltaVista. The heuristic draws implicitly on disruption theory (Christensen 1997) and the concept of performance overshoot — incumbents tend to improve faster than customers need, creating headroom for disruptors who are "good enough" on traditional dimensions but 10x better on neglected ones (simplicity, accessibility, cost).

DelPrete (2017) examined the claim empirically by surveying the largest technological improvements in history and found that genuine 10x improvements are rare in practice and often visible only in retrospect. The threshold is more useful as an aspiration-setting device than as a precise measurement tool.

**Implementations and benchmarks.** No formal measurement protocol exists. In practice, teams apply the heuristic by identifying the single most important dimension of the product experience (speed, cost, selection, convenience) and asking whether their solution is an order of magnitude better on that dimension. Y Combinator and other accelerators use it as a screening question in applications: "What makes you 10x better than the current solution?"

**Strengths and limitations.** The 10x heuristic has enormous communicative power — it forces teams to articulate a bold claim and then defend it. It is easy to apply and hard to game (claiming 10x on a dimension nobody cares about is immediately obvious). However, it is imprecise (what counts as "10x better"?), dimension-dependent (10x on latency is different from 10x on selection), often unmeasurable before launch, and potentially misleading for innovations that create new categories rather than improving existing ones. A product that is 10x better at something nobody is currently trying to do does not fit the framework cleanly. The heuristic also assumes a single dominant dimension, which may not hold for products where the value is in the configuration of many moderate improvements.

---

### 4.2 Switching Cost Analysis

**Theory and mechanism.** Burnham, Frels, and Mahajan (2003) proposed the most cited typology of consumer switching costs, identifying three categories: *procedural* (time and effort to learn a new product, set it up, evaluate alternatives), *financial* (monetary loss from sunk costs, lost loyalty benefits, or explicit exit fees), and *relational* (emotional attachment to the incumbent brand, loss of personal relationships with service providers, loss of identity associated with the product).

The switching cost framework transforms the differentiation question from "is this product better?" to "is this product better enough to justify what the consumer must give up to adopt it?" This reframing is critical because it explains a common pattern: products that are objectively superior on every dimension but fail to gain traction because the switching costs exceed the perceived differential benefit. Klemperer (1987, 1995) formalized this in economic theory, showing that switching costs create lock-in effects that persist even when competing products are superior, and that rational consumers will include a "real option value" — the value of waiting for a clearly dominant alternative — before switching.

**Literature evidence.** Switching cost research consistently finds that procedural switching costs (effort, learning) are the strongest inhibitor of switching across product categories, followed by relational costs (brand attachment, community), with financial costs being the weakest (Burnham et al. 2003). This has direct implications for differentiation testing: a product that reduces procedural switching costs (e.g., by importing data from the incumbent, by having a familiar interface) can succeed with a lower absolute improvement than one that imposes new learning costs.

Richards (2023) demonstrated in the grocery context that switching costs and brand preference are distinct constructs: brand preference is ex ante product differentiation (choosing before purchase), while switching cost is a post-purchase barrier. Both must be overcome for a new entrant to gain share, but they require different strategies.

**Implementations and benchmarks.** In practice, switching cost analysis involves: (1) mapping all switching costs by type (procedural, financial, relational) for the target customer, (2) estimating the magnitude of each cost through customer interviews or surveys, (3) comparing the total switching cost against the perceived benefit of the new product. Some teams formalize this as a "switching cost budget" — the total pain the customer must absorb — and require the new product to deliver surplus value exceeding 2-3x the switching cost to account for status quo bias and loss aversion (Kahneman and Tversky 1979).

**Strengths and limitations.** Switching cost analysis is grounded in established economic and behavioral theory. It forces teams to confront the customer's full adoption cost rather than focusing solely on product features. It is applicable across categories and stages. However, switching costs are difficult to quantify precisely, especially relational and procedural costs. The framework also assumes a comparison against an identifiable incumbent; for new-market innovations competing against non-consumption, the "switching cost" is the cost of changing a habit, which is conceptually different and harder to measure.

---

### 4.3 Prior Art Search Methodology

**Theory and mechanism.** Prior art search, adapted from patent examination practice, systematically identifies all existing solutions, concepts, and disclosures that address the same problem or job as the proposed product. The purpose is not legal (unless patent filing is the goal) but strategic: to understand the competitive landscape comprehensively enough to make an honest assessment of novelty. The U.S. Patent and Trademark Office (USPTO) identifies several distinct search types with analog applications in product innovation:

- **Novelty search**: Determines whether the core concept already exists. In product terms: has anyone built this before?
- **Landscape search**: Maps the overall state of the art, identifying dense areas (well-served problems) and white space (underserved areas). The product analog is competitive landscape mapping.
- **Freedom-to-operate search**: Determines whether building the product would infringe existing IP. Relevant for hardware and regulated industries.

**Literature evidence.** The patent analysis literature provides the most rigorous methodology. Searches proceed through keyword-based retrieval (using patent databases like Google Patents, USPTO, Espacenet), classification-based browsing (IPC/CPC codes), citation analysis (forward and backward), and expert consultation. Non-patent literature — academic publications, trade press, Kickstarter campaigns, app stores, review sites — extends the search beyond the patent corpus.

Landscape searches are particularly valuable for assessing originality because they reveal the *density* of prior work in an area. A concept with hundreds of prior art references is unlikely to be original in any meaningful sense; a concept with zero prior art may be genuinely novel or may indicate that the problem space has been explored and abandoned for good reason.

**Implementations and benchmarks.** For product teams without patent attorneys, a practical prior art search protocol involves: (1) decompose the product into its functional claims — what does it do for the user?, (2) search each claim independently across Google Patents, Product Hunt, app stores, Crunchbase, and academic databases, (3) score each claim on a novelty scale (identical prior art exists / similar prior art exists / no direct prior art found), (4) assess the overall novelty profile. AI-powered tools like XLSCOUT's Novelty Checker use NLP and reinforcement learning to accelerate patent prior art searches by comparing texts against 150M+ patents and 220M+ research publications, surfacing the closest matches with similarity scores.

**Strengths and limitations.** Prior art search is the most objective of the approaches surveyed — it produces a factual record of what exists. It is essential for any serious originality claim and is standard practice in venture capital due diligence. However, it has significant blind spots: many product innovations are in execution, design, or business model rather than technology, and these are poorly captured in patent databases. App store and Product Hunt searches capture more recent product-level innovation but are noisy and incomplete. The method also requires domain expertise to interpret results — a naive searcher may miss relevant prior art couched in different terminology, or may overweight superficially similar but functionally different products.

---

### 4.4 Competitive Differentiation Scoring

**Theory and mechanism.** Competitive differentiation scoring uses structured matrices to evaluate a product against identified competitors across multiple dimensions. The simplest form is a feature comparison matrix: competitors as columns, features as rows, with cells containing binary (yes/no) or scaled (1-5) assessments. More sophisticated approaches weight dimensions by customer importance, producing a Competitive Profile Matrix (CPM) where each competitor receives a weighted composite score.

Lehmann and Winer's (2002) levels of competition model structures this analysis by distinguishing between: (1) product form competition (functionally identical products), (2) product category competition (products with similar features solving the same problem), (3) generic competition (products solving the same need through different mechanisms), and (4) budget competition (anything competing for the same consumer dollar). Each level reveals different competitive threats and different differentiation requirements.

**Literature evidence.** The competitive matrix approach is ubiquitous in both academic strategy (Porter 1980; Grant 2016) and practitioner contexts (HubSpot, Shopify, Aha! all publish templates). Its value lies in forcing systematic comparison rather than selective attention to favorable dimensions. Research consistently shows that innovators overestimate their differentiation — a bias that structured scoring partially corrects (Lovallo and Kahneman 2003).

The critical success factor (CSF) approach adds rigor by requiring that the dimensions compared are the ones that actually drive customer decisions, not the ones the product team finds interesting. Thrv's competitive analysis matrix aligns this with JTBD by using customer job steps as the comparison dimensions rather than product features.

**Implementations and benchmarks.** Common tooling includes spreadsheets, dedicated competitive intelligence platforms (Crayon, Klue, Kompyte), and survey-based approaches where customers score competing products. G2 and Capterra review data provide a proxy for customer-perceived differentiation at scale. Share-of-voice analysis (Revuze, Brandwatch) measures the relative visibility of differentiation claims in market discourse.

A differentiation score becomes actionable when it reveals: (1) parity zones — dimensions where the product matches but does not exceed competitors, (2) differentiation zones — dimensions where the product measurably exceeds competitors, and (3) deficit zones — dimensions where the product trails competitors. A product with no differentiation zones and many deficit zones is a rebrand at best.

**Strengths and limitations.** Competitive scoring is concrete, communicable, and forces engagement with the competitive reality. It scales well and can be updated continuously. However, it is limited to *known* competitors and *known* dimensions — it cannot detect originality that creates entirely new evaluation criteria. It is also susceptible to dimension selection bias (choosing dimensions that favor the new product) and to the distinction problem identified by Ehrenberg-Bass: consumers may not perceive the differences that a feature matrix reveals, and perceived differences may not drive switching.

---

### 4.5 "Would Someone Switch?" Test Frameworks

**Theory and mechanism.** This family of approaches directly tests the behavioral prediction that matters: will people actually switch from their current solution to this one? The most influential formalization is Sean Ellis's Product-Market Fit survey (2010), which asks existing users: "How would you feel if you could no longer use [product]?" Responses are categorized as "very disappointed," "somewhat disappointed," "not disappointed," or "N/A." Ellis proposed the 40% threshold: if fewer than 40% of respondents answer "very disappointed," the product has not achieved product-market fit.

Rahul Vohra (Superhuman, 2018) operationalized this into a continuous improvement engine. Superhuman initially scored 22% on the Ellis test. By segmenting users, identifying the "very disappointed" cohort, understanding what they loved, and rebuilding around those users while deprioritizing the rest, Superhuman increased its score to 58% within three quarters. The method treats the Ellis test not as a binary gate but as a metric to optimize.

The deeper logic connects to Marc Andreessen's qualitative definition of product-market fit: "the customers are buying the product just as fast as you can make it — or usage is growing just as fast as you can add more servers." Andy Rachleff formalized this as the value hypothesis: an articulation of why a customer is likely to use the product, validated when "your product grows exponentially with no marketing."

**Literature evidence.** The Ellis 40% threshold is empirically derived but not formally validated in peer-reviewed literature. Ellis has stated that companies that struggled to find growth almost always had fewer than 40% "very disappointed" responses, while companies with strong traction almost always exceeded the threshold. The threshold appears to have been calibrated on B2B SaaS companies and may not transfer directly to all B2C categories — a social network, for example, may have high usage but low "disappointment" framing because alternatives exist.

Fake door testing (also called painted door or smoke testing) provides a pre-build analog. A landing page, advertisement, or in-app button is presented for a product that does not yet exist. The click-through rate, sign-up rate, or purchase intent rate serves as a proxy for switching willingness. Buffer validated its initial concept through a fake door test: a landing page with a "Plans and Pricing" button that led to a "coming soon" page. Sign-up rates provided demand validation before any code was written.

**Implementations and benchmarks.** The PMF Survey tool (pmfsurvey.com) provides a standardized implementation of the Ellis test. A minimum of 30 responses is directionally useful; 100+ responses provide meaningful confidence. Fake door tests are implemented through landing page builders (Unbounce, Carrd), in-app feature flags (LaunchDarkly, Statsig), or advertising platforms (Google Ads, Meta Ads) to measure click-through as a demand proxy.

**Strengths and limitations.** These tests measure what matters most — actual or predicted switching behavior — rather than abstract assessments of novelty. They are cheap, fast, and produce quantitative signals. However, they require either an existing user base (Ellis test) or a credible-enough concept to test (fake door). They are susceptible to framing effects (the "very disappointed" wording biases toward the current product), selection bias (only enthusiasts complete surveys), and the gap between stated and revealed preference (people who click a fake door may not actually adopt). The Ellis test also conflates differentiation with other PMF drivers — a product could score 40%+ because it is the only option in a niche, not because it is differentiated.

---

### 4.6 Novelty vs. Rebrand Detection

**Theory and mechanism.** The distinction between genuine novelty and a rebrand is not a binary classification but a spectrum. At one end, a product with identical functionality repackaged under a new name is a pure rebrand. At the other end, a product that solves a problem no existing product addresses is pure novelty. Most products fall in between — they combine existing capabilities in new ways, improve on existing solutions along known dimensions, or apply established technology to new contexts.

Apex International (industry perspective) draws a useful distinction: novelty is an incremental change designed to help marketers differentiate products from the competition, while innovation involves more substantial changes that create lasting value. The toothpaste industry is the canonical example of novelty-without-innovation: each new product generates a temporary sales lift that dissipates as soon as the next "new" product appears, because the underlying job is already adequately served.

Garcia and Calantone (2002) provided the most rigorous academic typology, classifying innovations along two axes — technological novelty and market novelty — and identifying five categories: imitative, incremental, really new, discontinuous, and radical. Critically, they demonstrated that the innovation literature uses these terms inconsistently: what one researcher calls "really new" another calls "radical" or "discontinuous." Their framework requires evaluating both macro-level (new to the world) and micro-level (new to the firm or customer) novelty perspectives.

**Literature evidence.** The Ehrenberg-Bass finding that consumers perceive weak differentiation between competing brands (Sharp 2010) suggests that many products marketed as "innovative" are functionally rebrands — they differ in brand assets (packaging, naming, advertising) but not in ways that change consumer behavior. However, the Ehrenberg-Bass research focuses primarily on mature FMCG categories. In technology and digital product markets, where switching costs are lower and feature differences are more salient, the novelty-vs.-rebrand distinction may matter more.

Goldenberg, Mazursky, and Solomon (1999) found that the majority of successful new product innovations can be accounted for by a small number of "creativity templates" — structural patterns like attribute dependency, component control, replacement, displacement, and division. Products that follow these templates are more likely to represent genuine innovation rather than cosmetic variation, because the templates operate on the structural relationships within a product rather than on surface attributes.

**Implementations and benchmarks.** A practical novelty-vs.-rebrand diagnostic involves three tests: (1) **Functional equivalence test**: Can the consumer achieve the same outcomes with existing products? If yes, the new product must demonstrate a meaningful improvement on at least one valued dimension. (2) **Structural novelty test**: Does the product reconfigure the relationship between components, create new dependencies, or eliminate existing constraints (per Goldenberg-Mazursky templates)? If yes, it is structurally novel regardless of whether individual components are new. (3) **Behavioral change test**: Does the product require or enable the consumer to behave differently? A product that slots into existing behavior without changing it is likely a rebrand; one that enables new behavior is more likely novel.

**Strengths and limitations.** These diagnostic tests provide a practical checklist that is more rigorous than intuition alone. The Garcia-Calantone typology provides a shared vocabulary that reduces terminological confusion. The Goldenberg-Mazursky templates offer a generative complement: they help teams distinguish structural innovation from surface variation. However, the boundary between "meaningful improvement" and "cosmetic variation" remains subjective, category-dependent, and sensitive to framing. A new flavor of yogurt is a rebrand in one analysis and a meaningful innovation in another, depending on whether flavor is treated as a surface attribute or a core experience dimension.

---

### 4.7 Jobs-to-be-Done Differentiation Lens

**Theory and mechanism.** JTBD theory (Christensen et al. 2016; Ulwick 2016) reframes differentiation from "how is this product different from competitors?" to "how much better does this product get the job done?" The unit of analysis shifts from product features to customer outcomes. Ulwick's Outcome-Driven Innovation (ODI) methodology operationalizes this through a structured process: (1) define the job-to-be-done, (2) map the job into sequential steps, (3) identify the desired outcomes at each step, (4) survey customers on the importance and satisfaction of each outcome, (5) calculate an opportunity score (importance + max(importance - satisfaction, 0)) to identify underserved outcomes.

A product is differentiated in JTBD terms if it serves underserved outcomes — outcomes that customers rate as highly important but poorly satisfied by current solutions. Ulwick has stated that products addressing outcomes with an opportunity score above 10 (on a 0-20 scale) have a high probability of market success, and that new products that get the job done 20% better or more are very likely to win.

**Literature evidence.** Strategyn claims an 86% success rate for products developed using ODI methodology, compared to an industry average of 17% (Ulwick 2016). These figures are self-reported and have not been independently validated, but the case studies are detailed: Bosch power tools, Arm & Hammer dental care, and the medical device company Cordis (which increased market share from 1% to over 20% after applying ODI to identify underserved outcomes in the interventional cardiology job).

The JTBD lens is particularly powerful for detecting the "solution in search of a problem" trap: if no outcome in the job map scores as underserved, the product — however technically novel — is solving a problem that customers do not have, or solving one that existing solutions already address adequately.

**Implementations and benchmarks.** ODI requires primary research: typically quantitative surveys of 180-600 respondents scoring 50-150 desired outcomes on importance and satisfaction. Strategyn's proprietary software supports this workflow. Lighter-weight JTBD approaches (Moesta's switch interview, Intercom's JTBD interview framework) use qualitative methods to identify struggling moments and switching triggers without the full quantitative apparatus.

**Strengths and limitations.** JTBD provides the most rigorous demand-side framework for differentiation assessment. It avoids the supply-side bias of feature comparison by anchoring in customer-defined outcomes. The opportunity score provides a quantitative threshold for differentiation adequacy. However, ODI is resource-intensive (requiring large-sample surveys and proprietary methodology), depends on correctly defining the job (an error at this stage propagates through the entire analysis), and struggles with jobs that customers cannot articulate or do not yet know they have — precisely the domain where the most radical innovations occur.

---

### 4.8 Perceptual Mapping and Multidimensional Scaling

**Theory and mechanism.** Perceptual mapping visualizes how consumers perceive products relative to one another in a low-dimensional space. The canonical technique is Multidimensional Scaling (MDS), which takes consumer similarity judgments (how similar are products A and B?) and produces a spatial configuration where distance corresponds to perceived dissimilarity. Products that cluster tightly are perceived as substitutes; products in open space represent potential differentiation opportunities.

MDS was developed in psychometrics in the 1950s-1960s (Torgerson 1958; Kruskal 1964) and adopted by marketing researchers in the 1970s. It operates on proximities — values denoting how similar or different two objects are perceived to be — and outputs a geometric configuration where points represent products and distances represent perceived differences. Factor analysis and correspondence analysis provide alternative implementations with different mathematical assumptions.

Conjoint analysis complements perceptual mapping by decomposing consumer preferences into the relative importance of product attributes and the part-worth utilities of attribute levels. Where MDS shows *where* products sit in perceptual space, conjoint analysis shows *why* — which attributes drive the perceived differences.

**Literature evidence.** Perceptual maps have been used extensively in brand positioning research since the 1970s. Their value for originality assessment lies in identifying white space — regions of the perceptual map where no existing product sits but where consumer preferences suggest demand exists. A product concept that maps to white space is, by definition, perceptually differentiated.

However, Ehrenberg-Bass research has shown that in many categories, brands cluster tightly in the center of perceptual maps, with consumers perceiving only marginal differences. This finding limits the utility of perceptual mapping for mature categories but enhances it for categories in formation, where larger perceptual gaps exist.

**Implementations and benchmarks.** Modern implementations use survey platforms (Qualtrics, SurveyMonkey, Appinio) to collect similarity ratings or attribute evaluations, with statistical software (R, SPSS, XLSTAT) performing the MDS or factor analysis. Lighter-weight approaches use attribute-based positioning maps constructed from expert judgment rather than consumer data, though these sacrifice the demand-side grounding that gives the method its power.

**Strengths and limitations.** Perceptual mapping provides the most visual representation of competitive positioning and differentiation. It reveals both the current competitive structure and potential opportunity spaces. It is grounded in actual consumer perceptions rather than product specifications. However, it requires primary consumer research (expensive and time-consuming), is sensitive to the choice of competitive set and attributes, captures perceptions at a point in time (which may shift as markets evolve), and can only map dimensions that consumers can articulate. Latent, unarticulated dimensions of value — often the basis of breakthrough innovation — are invisible to MDS.

---

### 4.9 Consumer Novelty Perception Research

**Theory and mechanism.** Consumer psychology research has established that novelty perception is not a passive registration of objective difference but an active psychological process modulated by individual traits, situational factors, and the manner in which novelty is communicated.

Hirschman (1980) identified three interrelated constructs: *innovativeness* (willingness to adopt new products), *novelty seeking* (desire for new and different stimuli), and *consumer creativity* (ability to generate novel uses for products). These traits are positively correlated with early adoption but mediate perception of novelty differently. A high-novelty-seeking consumer may perceive a product as more novel than an otherwise identical consumer with low novelty seeking.

Min (2022) demonstrated that novelty perception interacts with perceived psychological control: consumers who feel in control of their environment treat novelty as an opportunity, while those who feel low control treat novelty as a risk. This has direct implications for how differentiation is communicated — the same level of objective novelty can be perceived as exciting or threatening depending on the consumer's psychological state.

The Kano model (Kano 1984) provides a complementary framework for understanding how different types of product features contribute to perceived differentiation. Must-be (basic) features are expected and do not generate differentiation — their absence causes dissatisfaction but their presence is taken for granted. One-dimensional (performance) features generate differentiation linearly — more is proportionally better. Attractive (delight) features generate disproportionate satisfaction when present but no dissatisfaction when absent. A product achieves perceived differentiation most efficiently through attractive features, because they create surprise and delight without the expectation baseline that erodes the novelty of performance features.

**Literature evidence.** Im, Bayus, and Mason (2003) found that new product creativity (composed of novelty and meaningfulness dimensions) positively influences consumer perceptions of value, coolness, and purchase attitude, but the relationship is moderated by product category and consumer characteristics. Products perceived as novel but not meaningful are seen as gimmicks; products perceived as meaningful but not novel are seen as commodities.

The Kano model's dynamic property is particularly relevant: today's attractive features become tomorrow's performance features and eventually must-be features as consumer expectations adapt. This means that differentiation based on delight features has a limited shelf life and must be continuously renewed — a finding that complicates long-term differentiation assessment.

**Implementations and benchmarks.** Kano analysis is implemented through a standardized survey format where customers are asked a functional question ("How would you feel if this feature were present?") and a dysfunctional question ("How would you feel if this feature were absent?") for each feature. The combination of responses classifies features into Kano categories. MaxDiff analysis provides a complementary scaling method: respondents choose the most and least important features from subsets, producing a robust importance ranking. TURF (Total Unduplicated Reach and Frequency) analysis then identifies which combination of features appeals to the broadest audience.

**Strengths and limitations.** Consumer perception research provides the most psychologically grounded approach to understanding how differentiation actually registers in the consumer's mind. The Kano model directly identifies which features drive perceived novelty (attractive features) versus which are table stakes. However, consumer perception research is expensive, requires representative samples, captures current rather than future perceptions, and is subject to the well-documented gap between what consumers say they want and what they actually adopt.

---

### 4.10 Blue Ocean Strategy and Value Innovation

**Theory and mechanism.** Kim and Mauborgne (2005) proposed that the most effective form of differentiation is not competing better within existing market boundaries but reconstructing market boundaries to create uncontested space — a "blue ocean." Their analytical toolkit centers on the *strategy canvas*, which plots the competitive factors an industry competes on (x-axis) against the offering level delivered by each competitor (y-axis). A product that traces a distinctly different curve from all competitors — raising some factors, creating new ones, eliminating others, reducing still others — has achieved value innovation.

The ERRC (Eliminate-Reduce-Raise-Create) grid operationalizes this. The *Buyer Utility Map* extends the analysis by mapping six utility levers (customer productivity, simplicity, convenience, risk reduction, fun/image, environmental friendliness) against six stages of the buyer experience cycle (purchase, delivery, use, supplements, maintenance, disposal), creating a 36-cell matrix that reveals unexplored utility combinations.

**Literature evidence.** Kim and Mauborgne's research examined over 150 strategic moves across 100+ years and 30+ industries, finding that blue ocean moves — those that pursued value innovation rather than incremental improvement — accounted for 62% of total profits despite representing only 14% of total launches. The strategy canvas has been widely adopted in MBA curricula and corporate strategy but has attracted criticism for survivorship bias (studying only successful blue ocean moves) and for the difficulty of prospectively identifying which market boundary reconstruction will succeed.

**Implementations and benchmarks.** The strategy canvas is implemented by: (1) listing the 5-12 factors the industry currently competes on, (2) scoring each major competitor on each factor (typically 1-5 scale), (3) plotting the curves, (4) designing a new curve that diverges from all existing curves using the ERRC grid. The resulting visual immediately communicates whether a product concept is differentiated (divergent curve) or imitative (parallel curve). The Six Paths Framework provides structured methods for identifying reconstruction opportunities: looking across alternative industries, strategic groups, buyer groups, complementary offerings, functional-emotional orientation, and time.

**Strengths and limitations.** Blue Ocean Strategy provides the most holistic framework for differentiation assessment, because it considers the entire value curve rather than individual features. The visual representation is powerful for communication and decision-making. However, the framework is better at identifying potential differentiation than at validating whether consumers will value it. The Buyer Utility Map is useful but subjective. And the strategy canvas requires defining the relevant competitive factors — a judgment that can be manipulated to make any product look differentiated.

---

### 4.11 TRIZ Inventive Levels and Systematic Innovation

**Theory and mechanism.** Genrich Altshuller's Theory of Inventive Problem Solving (TRIZ), developed from the analysis of over 200,000 patents between 1946 and 1985, provides a formal classification of inventive novelty across five levels:

| Level | Description | Knowledge Scope | % of Patents |
|-------|-------------|-----------------|--------------|
| 1 | Routine design — solved by methods well known within the specialty | Within specialty | ~32% |
| 2 | Minor improvement to existing system | Within industry | ~45% |
| 3 | Fundamental improvement using methods from outside the industry | Cross-industry | ~18% |
| 4 | New system using interdisciplinary knowledge | Cross-disciplinary | ~4% |
| 5 | New scientific discovery | Pioneering science | ~1% |

This classification provides an objective, historically grounded scale for assessing the novelty of an invention. A Level 1 product uses known solutions in known ways — it is likely a rebrand or incremental variant. A Level 3+ product imports solutions from outside its industry — it is likely genuinely novel.

TRIZ also provides the Contradiction Matrix and 40 Inventive Principles, which help innovators identify whether a proposed solution represents a genuine resolution of a technical contradiction (inventive) or a compromise between conflicting requirements (routine). Products that resolve contradictions — achieving both lightness and strength, both simplicity and capability — are structurally more novel than those that trade off one against the other.

**Literature evidence.** Bhushan (2013) proposed a quantitative scoring method for TRIZ inventive levels, enabling patent analysts to estimate the inventive strength and commercial life of patents based on their level classification. Mishra (2014) provided detailed criteria for distinguishing between the five levels using patent claim analysis. The TRIZ literature is extensive but concentrated in engineering and manufacturing rather than consumer product innovation, which limits direct applicability.

**Implementations and benchmarks.** TRIZ is implemented through structured workshops using the contradiction matrix (39 engineering parameters on each axis, mapped to the 40 inventive principles), the function analysis method, and the Algorithm for Inventive Problem Solving (ARIZ). The inventive level classification can be applied retrospectively to existing products as a benchmarking exercise or prospectively to product concepts as a novelty screen. The Systematic Inventive Thinking (SIT) method, developed by Roni Horowitz and colleagues from the TRIZ tradition, provides a more accessible version focused on five "thinking tools" applicable to consumer products.

**Strengths and limitations.** TRIZ provides the most rigorous and objective framework for assessing inventive novelty, backed by the largest empirical base (hundreds of thousands of patents). The five-level scale offers clear gradations. However, TRIZ was developed for engineering and manufacturing contexts, not consumer product innovation, and many B2C differentiators (user experience, brand design, business model) do not map cleanly to technical contradictions. The methodology requires specialized training and vocabulary that limit accessibility.

---

### 4.12 Emerging Computational Approaches

**Theory and mechanism.** Machine learning and NLP techniques are increasingly applied to the novelty assessment problem, particularly in patent analysis and idea management. The core approach involves representing product descriptions or patent claims as vector embeddings and computing similarity to the corpus of existing products. Products with high cosine similarity to existing entries are likely unoriginal; products with low similarity may be novel (or may be poorly described).

Chikkamath and Endres (2021) demonstrated a machine learning approach to patent novelty detection that compares the full text of a patent application to existing patents using NLP, testing Doc2Vec, SBERT, and GPT-3-based Ada Similarity embeddings. SBERT embeddings best matched human novelty assessments. Beel and colleagues (2023) extended this to crowdsourced idea spaces, using language models for automated novelty detection in innovation management platforms.

An explainable AI (XAI) model for patent novelty analysis (Sharma et al. 2023) adds interpretability, allowing analysts to understand *why* a concept is classified as novel or non-novel rather than relying on a black-box similarity score.

**Literature evidence.** AI-powered patent search tools (XLSCOUT, PatSnap, Ambercite) now screen ideas against 150M+ patents and 220M+ research publications in real time, providing similarity scores and closest-match prior art. These tools have demonstrated significant time savings over manual search (hours vs. weeks) and improved recall (finding relevant prior art that manual searchers miss). However, precision remains imperfect — the tools surface false positives and miss conceptual similarities expressed in different terminology.

For product (as opposed to patent) novelty, no established AI-powered tool exists at scale. Product Hunt and similar platforms provide searchable databases of launched products, and LLM-based tools can compare product descriptions semantically, but no validated scoring system maps semantic distance to commercial novelty.

**Implementations and benchmarks.** Current implementations include: XLSCOUT's Novelty Checker (patent-focused), Google Patents' semantic search, PatSnap's competitive intelligence platform, and custom pipelines using sentence-transformers (SBERT) for computing embedding similarity against product description corpora. Teams can build lightweight novelty screens by embedding their product concept using OpenAI's or Cohere's embedding APIs and computing cosine similarity against a curated corpus of competitor descriptions.

**Strengths and limitations.** Computational approaches offer speed, scale, and objectivity that human analysis cannot match. They are particularly valuable for the prior art search component of originality assessment. However, they are limited by corpus quality (garbage in, garbage out), by the gap between textual similarity and functional similarity (two products with different descriptions may solve the same problem), and by the fundamental limitation that novelty is not just distance from the known — it is distance in a direction that matters. A product concept that is semantically distant from all existing products may be distant in an irrelevant or incoherent direction. No current system can reliably distinguish "novel and valuable" from "novel and nonsensical."

---

## 5. Comparative Synthesis

The following table compares all approaches across key dimensions relevant to practitioners selecting an assessment method.

| Approach | Stage | Perspective | Input Required | Rigor | Cost | Speed | Captures Demand Signal | Captures Supply Novelty | Key Limitation |
|---|---|---|---|---|---|---|---|---|---|
| 10x Improvement Threshold | Concept | Supply | Team judgment | Low | Nil | Fast | Indirectly | Yes | Unmeasurable before launch; single-dimension |
| Switching Cost Analysis | Concept / Launch | Demand | Customer research | Medium-High | Medium | Medium | Yes | No | Hard to quantify relational/procedural costs |
| Prior Art Search | Concept | Supply | Database access, expertise | High | Medium-High | Slow | No | Yes | Misses execution/UX/model novelty |
| Competitive Diff. Scoring | Concept / Launch | Both | Competitor data, customer input | Medium | Low-Medium | Medium | Partially | Yes | Limited to known competitors/dimensions |
| "Would Someone Switch?" Tests | Launch | Demand | Users or prospects | Medium | Low | Fast | Yes | No | Requires product or credible concept |
| Novelty vs. Rebrand Detection | Concept | Both | Team analysis | Low-Medium | Low | Fast | No | Yes | Subjective boundary judgment |
| JTBD Differentiation Lens | Concept / Launch | Demand | Primary survey research | High | High | Slow | Yes | Indirectly | Resource-intensive; depends on correct job definition |
| Perceptual Mapping (MDS) | Launch | Demand | Consumer survey | High | High | Slow | Yes | Indirectly | Cannot capture unarticulated dimensions |
| Consumer Novelty Perception | Concept / Launch | Demand | Consumer research | High | Medium-High | Medium | Yes | No | Gap between stated and revealed preference |
| Blue Ocean / ERRC | Concept | Both | Industry analysis | Medium | Low-Medium | Medium | Indirectly | Yes | Subjective factor selection; survivorship bias |
| TRIZ Inventive Levels | Concept | Supply | Technical analysis | High | Low | Medium | No | Yes | Engineering-centric; poor UX/model coverage |
| Computational / AI | Concept | Supply | Text corpus, embeddings | Medium | Low | Fast | No | Yes | Distance ≠ value; corpus-dependent |

**Cross-cutting observations:**

1. **No single method captures both supply-side novelty and demand-side differentiation.** The most robust assessment stacks a supply-side method (prior art search, TRIZ) with a demand-side method (JTBD, switching cost analysis, PMF test).

2. **Speed and rigor trade off predictably.** The 10x threshold and computational similarity are fast but imprecise. JTBD-ODI and perceptual mapping are rigorous but expensive and slow. Concept-stage teams typically use fast heuristics; pre-launch teams invest in rigorous validation.

3. **The demand-side methods share a common limitation: they cannot evaluate innovations that consumers cannot yet imagine.** Perceptual mapping, conjoint analysis, and even JTBD surveys ask consumers to evaluate concepts within their existing frame of reference. Radical innovations that redefine the frame — the iPhone, Airbnb, the automobile — would score poorly on pre-launch demand-side assessments because consumers lack the category to evaluate them.

4. **The supply-side methods share a complementary limitation: they can confirm novelty but not value.** A product may be genuinely novel by every supply-side metric and still fail because the novelty addresses no real need.

---

## 6. Open Problems & Gaps

### 6.1 Absence of Cross-Validated Benchmarks

No published study compares the predictive validity of these approaches against actual market outcomes. We do not know whether a high JTBD opportunity score, a high TRIZ inventive level, a divergent strategy canvas curve, or a high Ellis PMF score is the best predictor of commercial success for a differentiated product. Each framework presents its own success metrics in isolation, often with selection bias (reporting successes, not failures).

### 6.2 The Novelty-Communication Confound

A recurring problem across demand-side methods is the confounding of product novelty with communication quality. A genuinely novel product described poorly will score low on consumer perception surveys, fake door tests, and PMF surveys — not because it lacks differentiation but because the differentiation was not communicated effectively. Conversely, a rebrand with excellent marketing may score high on demand-side tests without possessing genuine novelty. Disentangling "the product is not different enough" from "we have not explained the difference well enough" is an unsolved problem in practice.

### 6.3 Temporal Dynamics of Differentiation

Most frameworks assess differentiation at a point in time, but differentiation is dynamic. The Kano model's category migration (attractive → performance → must-be) implies that today's differentiator is tomorrow's table stake. Blue ocean spaces fill in as competitors imitate. No existing framework provides a reliable method for estimating the *duration* of a differentiation advantage, though Rogers' observability construct and TRIZ's inventive level (higher levels are harder to replicate) offer partial indicators.

### 6.4 Cultural and Contextual Transferability

Virtually all of the frameworks surveyed were developed in and for Western, predominantly US markets. Consumer novelty perception, switching cost tolerance, and the relative importance of Rogers' adoption factors vary significantly across cultures. Hofstede's cultural dimensions (uncertainty avoidance, individualism-collectivism) predict differential receptivity to novelty, but this has not been systematically integrated into any originality assessment framework.

### 6.5 The Radical Innovation Blind Spot

The most consequential originality assessments — those involving radical innovations that create new categories — are precisely where all existing methods are weakest. Demand-side methods fail because consumers cannot evaluate what they cannot imagine. Supply-side methods fail because the relevant comparison set does not yet exist. The 10x threshold is most applicable to radical innovation but least measurable before launch. Category design (Ramadan et al. 2016) attempts to address this by arguing that category creators should not assess differentiation within existing categories but should instead *design* a new category around the problem they uniquely solve — but this converts the assessment problem into a strategy problem without resolving the underlying measurement challenge.

### 6.6 AI-Assisted Assessment Maturity

Current AI tools for novelty assessment operate primarily on text similarity within patent and publication corpora. They do not assess experiential novelty (how different does this *feel* to use?), business model novelty (is the revenue model genuinely different?), or ecosystem novelty (does this create new network effects or platform dynamics?). The gap between what AI can currently assess (textual/conceptual similarity) and what determines commercial success (perceived value of the difference) remains wide.

### 6.7 The Aggregation Problem

Practitioners must combine signals from multiple assessment methods into a single go/no-go decision, but no established aggregation framework exists. How should a team weight a high JTBD opportunity score against a low score on the 10x threshold? What if perceptual mapping shows white space but switching cost analysis shows prohibitive barriers? The field lacks both the empirical evidence and the theoretical framework to resolve multi-method conflicts.

---

## 7. Conclusion

Originality assessment and differentiation testing for B2C products is not a single problem with a single solution but a family of related problems, each addressed by methods with distinct theoretical foundations, empirical grounding, and practical limitations. The landscape can be understood through three fundamental tensions.

First, **novelty versus value**: a product can be novel without being valuable and valuable without being novel. Supply-side methods (prior art search, TRIZ, creativity templates) assess the first; demand-side methods (JTBD, switching cost analysis, PMF tests) assess the second. Neither alone is sufficient.

Second, **measurability versus importance**: the most measurable forms of differentiation (feature counts, speed benchmarks, price differences) are often the least important for consumer switching decisions, while the most important forms (experiential quality, emotional resonance, status signaling) are the least measurable. This creates a persistent bias toward optimizing what can be counted rather than what counts.

Third, **the pre-build paradox**: the most valuable time to assess differentiation is before building the product, when course corrections are cheap, but the most reliable assessments require a product (or credible prototype) to evaluate. Concept-stage heuristics (10x threshold, prior art search, ERRC analysis) are fast but imprecise; market-stage tests (PMF surveys, perceptual mapping) are reliable but expensive and late.

The practical implication is that originality assessment should be treated not as a single gate but as a progressive series of increasingly rigorous tests, matched to the investment stage: lightweight heuristics and prior art search at ideation, structured frameworks (JTBD, Blue Ocean, switching cost analysis) at concept development, and behavioral tests (fake doors, PMF surveys, willingness-to-pay studies) at pre-launch. No single method deserves exclusive reliance, and the failure to assess differentiation through multiple lenses — or the failure to assess it at all — remains among the most common causes of preventable product failure.

---

## References

Altshuller, G. (1996). *And Suddenly the Inventor Appeared: TRIZ, the Theory of Inventive Problem Solving*. Technical Innovation Center.

Andreessen, M. (2007). "The Only Thing That Matters." Pmarchive. https://pmarchive.com/guide_to_startups_part4.html

Bhushan, N. (2013). "Quantifying the TRIZ Levels of Invention: A Tool to Estimate the Strength and Life of a Patent." SSRN. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2322594

Brem, A. and Voigt, K. (2009). "Integration of market pull and technology push in the corporate front end and innovation management." *Technovation*, 29(5), 351-367.

Burnham, T. A., Frels, J. K., and Mahajan, V. (2003). "Consumer Switching Costs: A Typology, Antecedents, and Consequences." *Journal of the Academy of Marketing Science*, 31(2), 109-126. https://journals.sagepub.com/doi/10.1177/0092070302250897

Castellion, G. and Markham, S. K. (2013). "Perspective: New Product Failure Rates." *Journal of Product Innovation Management*, 30(5), 976-979.

Chikkamath, R. and Endres, H. (2021). "An Empirical Study on Patent Novelty Detection: A Novel Approach Using Machine Learning and Natural Language Processing." IEEE Conference Publication. https://ieeexplore.ieee.org/document/9336557/

Christensen, C. M. (1997). *The Innovator's Dilemma*. Harvard Business School Press.

Christensen, C. M., Hall, T., Dillon, K., and Duncan, D. S. (2016). *Competing Against Luck: The Story of Innovation and Customer Choice*. Harper Business.

Cooper, R. G. (2008). "Perspective: The Stage-Gate Idea-to-Launch Process — Update, What's New, and NexGen Systems." *Journal of Product Innovation Management*, 25(3), 213-232. https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1540-5885.2008.00296.x

Davis, F. D. (1989). "Perceived Usefulness, Perceived Ease of Use, and User Acceptance of Information Technology." *MIS Quarterly*, 13(3), 319-340.

DelPrete, M. (2017). "10x and the Largest Technological Improvements of All Time." https://www.mikedp.com/articles/2017/4/12/10x-and-the-largest-technological-improvements-of-all-time

Ellis, S. (2010). "Using Product/Market Fit to Drive Sustainable Growth." GrowthHackers. https://medium.com/growthhackers/using-product-market-fit-to-drive-sustainable-growth-58e9124ee8db

Fiorineschi, L., Frillici, F. S., and Rotini, F. (2018). "Uses of the novelty metrics proposed by Shah et al.: what emerges from the literature?" *Design Science*, 4, e16. https://www.cambridge.org/core/journals/design-science/article/uses-of-the-novelty-metrics-proposed-by-shah-et-al-what-emerges-from-the-literature/28EAA999E457B6A56C3B36AFC181890E

Garcia, R. and Calantone, R. (2002). "A critical look at technological innovation typology and innovativeness terminology: a literature review." *Journal of Product Innovation Management*, 19(2), 110-132. https://onlinelibrary.wiley.com/doi/10.1111/1540-5885.1920110

Goldenberg, J., Mazursky, D., and Solomon, S. (1999). "Toward Identifying the Inventive Templates of New Products: A Channeled Ideation Approach." *Journal of Marketing Research*, 36(2), 200-210. https://journals.sagepub.com/doi/abs/10.1177/002224379903600205

Hirschman, E. C. (1980). "Innovativeness, Novelty Seeking, and Consumer Creativity." *Journal of Consumer Research*, 7(3), 283-295. https://www.semanticscholar.org/paper/Innovativeness,-Novelty-Seeking,-and-Consumer-Hirschman/283222fbe870a9c07a0148c8195cf0a0f7f62c55

Im, S., Bayus, B. L., and Mason, C. H. (2003). "An Empirical Test of the Creative Product Semantic Scale." *Journal of Product Innovation Management*, 20(2), 114-131.

Kahneman, D. and Tversky, A. (1979). "Prospect Theory: An Analysis of Decision under Risk." *Econometrica*, 47(2), 263-291.

Kano, N. (1984). "Attractive quality and must-be quality." *Journal of the Japanese Society for Quality Control*, 14(2), 39-48. https://en.wikipedia.org/wiki/Kano_model

Kim, W. C. and Mauborgne, R. (2005). *Blue Ocean Strategy: How to Create Uncontested Market Space and Make the Competition Irrelevant*. Harvard Business Review Press. https://www.blueoceanstrategy.com/tools/four-actions-framework/

Klemperer, P. (1995). "Competition when Consumers have Switching Costs: An Overview with Applications to Industrial Organization, Macroeconomics, and International Trade." *Review of Economic Studies*, 62(4), 515-539.

Kruskal, J. B. (1964). "Multidimensional scaling by optimizing goodness of fit to a nonmetric hypothesis." *Psychometrika*, 29(1), 1-27.

Lehmann, D. R. and Winer, R. S. (2002). *Product Management*. McGraw-Hill.

Lovallo, D. and Kahneman, D. (2003). "Delusions of Success: How Optimism Undermines Executives' Decisions." *Harvard Business Review*, 81(7), 56-63.

Min, H. (2022). "Novelty as Opportunity and Risk: A Situated Cognition Analysis of Psychological Control and Novelty Seeking." *Journal of Consumer Psychology*, 32(3), 503-514. https://myscp.onlinelibrary.wiley.com/doi/10.1002/jcpy.1264

Mishra, U. (2014). "The Five Levels of Inventions: A Classification of Patents from TRIZ Perspective." SSRN. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2430693

Osterwalder, A., Pigneur, Y., Bernarda, G., and Smith, A. (2014). *Value Proposition Design*. Wiley. https://www.strategyzer.com/library/value-proposition-design-book-summary

Porter, M. E. (1985). *Competitive Advantage: Creating and Sustaining Superior Performance*. Free Press.

Ramadan, A., Peterson, D., Lochhead, C., and Maney, K. (2016). *Play Bigger: How Pirates, Dreamers, and Innovators Create and Dominate Markets*. Harper Business. https://www.playbigger.com/

Richards, T. J. (2023). "Switching cost and store choice." *American Journal of Agricultural Economics*, 105(1), 46-68. https://onlinelibrary.wiley.com/doi/full/10.1111/ajae.12307

Rogers, E. M. (2003). *Diffusion of Innovations*, 5th edition. Free Press. https://en.wikipedia.org/wiki/Diffusion_of_innovations

Shah, J. J., Vargas-Hernandez, N., and Smith, S. M. (2003). "Metrics for measuring ideation effectiveness." *Design Studies*, 24(2), 111-134.

Sharp, B. (2010). *How Brands Grow: What Marketers Don't Know*. Oxford University Press. https://marketingscience.info/differentiation-versus-distinctiveness/

Thiel, P. (2014). *Zero to One: Notes on Startups, or How to Build the Future*. Crown Business. https://www.voltequity.com/article/peter-thiel-on-identifying-disruptive-companies-10x-better

Ulwick, A. W. (2016). *Jobs to Be Done: Theory to Practice*. IDEA BITE PRESS. https://jobs-to-be-done.com/what-is-jobs-to-be-done-fea59c8e39eb

Vohra, R. (2018). "How Superhuman Built an Engine to Find Product-Market Fit." First Round Review. https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit/

---

## Practitioner Resources

### Frameworks and Canvases

- **Value Proposition Canvas** (Strategyzer) — Maps customer jobs/pains/gains against product fit. Free template at https://www.strategyzer.com/library/value-proposition-design-book-summary
- **Blue Ocean Strategy Canvas and ERRC Grid** — Visual differentiation analysis tools. Templates at https://www.blueoceanstrategy.com/tools/errc-grid/
- **Strategyzer Test Card** — Structures differentiation hypothesis testing with explicit success criteria. https://www.strategyzer.com/library/validate-your-ideas-with-the-test-card
- **Competitive Profile Matrix** — Weighted scoring of competitors against critical success factors. Templates at HubSpot, Shopify, Aha!

### Measurement Tools

- **PMF Survey** (pmfsurvey.com) — Standardized Sean Ellis product-market fit survey implementation. https://pmfsurvey.com/
- **Conjointly** — Online platform for conjoint analysis, MaxDiff, TURF, Van Westendorp, and Gabor-Granger pricing studies. https://conjointly.com/
- **Appinio** — Consumer research platform with perceptual mapping and Kano analysis capabilities. https://www.appinio.com/
- **SurveyMonkey Market Research** — Perceptual mapping and brand differentiation tools. https://www.surveymonkey.com/market-research/resources/perceptual-maps-to-differentiate-your-brand/

### Prior Art and Competitive Intelligence

- **Google Patents** — Free semantic search across global patent databases. https://patents.google.com/
- **XLSCOUT Novelty Checker** — AI-powered prior art search across 150M+ patents. https://xlscout.ai/
- **PatSnap** — Patent landscape analysis and competitive intelligence platform.
- **Crayon / Klue / Kompyte** — Competitive intelligence platforms for tracking competitor moves, messaging, and positioning.
- **Product Hunt** — Searchable database of launched products; useful for consumer product prior art. https://www.producthunt.com/

### Switching and Demand Validation

- **Unbounce / Carrd** — Landing page builders for fake door and smoke tests.
- **Statsig / LaunchDarkly** — Feature flagging platforms for in-app painted door experiments.
- **Lyssna** — User research platform for concept testing and differentiation evaluation. https://www.lyssna.com/

### Innovation Methodology

- **Strategyn ODI** — Tony Ulwick's Outcome-Driven Innovation consulting and software platform. https://strategyn.com/jobs-to-be-done/
- **SIT (Systematic Inventive Thinking)** — Accessible TRIZ-derived innovation method for consumer products. https://www.sitsite.com/
- **TRIZ Contradiction Matrix** — 39x39 parameter matrix mapped to 40 inventive principles. https://www.triz.org/triz/levels

### Academic References for Deep Dives

- **Garcia and Calantone (2002)** — Definitive typology of innovation novelty levels. Essential reading for anyone building a novelty classification system. https://onlinelibrary.wiley.com/doi/10.1111/1540-5885.1920110
- **Burnham, Frels, and Mahajan (2003)** — Canonical switching cost typology and measurement. https://journals.sagepub.com/doi/10.1177/0092070302250897
- **Fiorineschi, Frillici, and Rotini (2018)** — Comprehensive review of Shah novelty metrics and their variants. https://www.cambridge.org/core/journals/design-science/article/uses-of-the-novelty-metrics-proposed-by-shah-et-al-what-emerges-from-the-literature/28EAA999E457B6A56C3B36AFC181890E
- **Sharp (2010)** — The case against differentiation as a primary growth strategy. Challenges assumptions underlying most originality assessment methods.
