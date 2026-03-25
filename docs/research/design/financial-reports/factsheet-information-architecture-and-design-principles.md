---
title: "Factsheet Information Architecture & Design Principles"
date: 2026-03-19
summary: "Synthesises research from visual cognition, behavioral finance, information architecture theory, and financial regulation to produce a unified account of how factsheet information architecture functions and can be optimally designed."
keywords: [design, financial-reports, information-architecture, factsheets, behavioral-finance]
---

# Factsheet Information Architecture & Design Principles

*March 2026*

---

## Abstract

Investment factsheets occupy an unusual position in the information design landscape: they must simultaneously satisfy regulatory mandates that prescribe content and length, institutional conventions that signal credibility, and cognitive constraints that govern how non-expert retail investors actually read and interpret financial data. This survey synthesises research from visual cognition (eye-tracking studies, Gestalt psychology), behavioral finance (anchoring, recency bias, availability heuristics), information architecture theory, and financial regulation (UCITS KIID, PRIIPs KID, Swiss CISA) to produce a unified account of how factsheet information architecture functions and how it can be optimally designed.

The central finding is that effective factsheet design requires a layered reading architecture that serves at least three distinct engagement modes — the 5-second glance, the 30-second scan, and the deliberate full read — while behaviorally aware layout decisions can either amplify or mitigate the cognitive biases investors bring to financial documents. Regulatory standardisation (particularly UCITS KIID and PRIIPs KID) constrains the design solution space in ways that create genuine tension between investor protection objectives and the usability of the resulting documents, a tension that internal or semi-institutional factsheets (such as Swiss SICAV quarterly communications) can partially resolve through editorial freedom.

---

## 1. Introduction

### 1.1 Problem Statement

A fund factsheet is a condensed communication artifact — typically one to four A4 pages — that must convey the essential character of an investment product to a reader who may range from a retail investor encountering a fund for the first time to a sophisticated institutional allocator conducting due diligence. This diversity of audiences, combined with the density of financial data that product regulations require to be disclosed, makes factsheet design one of the most constrained and consequential problems in financial communication.

Poor information architecture in factsheets carries measurable costs. Research shows that investors exhibit attenuated response to information embedded in less readable disclosures (Bonsall et al., 2017; arxiv 2507.07037). Eye-tracking studies demonstrate that salient layout features — position, color, font size — redirect attention in ways that systematically distort investor judgment independently of the information content itself (Vrecko et al., 2022; ResearchGate 361543253). Where regulatory disclosure aims to neutralise information asymmetry, bad design re-introduces it through the back door.

### 1.2 Scope

This survey covers:
- Factsheets for publicly offered collective investment vehicles: UCITS, AIFs, Swiss contractual funds (SICAVs), and exchange-listed real estate funds.
- Both regulatory-mandated documents (KIID, KID/PRIIPs) and the broader class of editorial factsheets produced by asset managers as investor relations instruments.
- The full design stack: information architecture (what appears where), visual design (grid, typography, color), and behavioral design (how layout choices influence investor cognition and decisions).
- Swiss-specific market conventions, with reference to EdR REIM, UBS real estate funds, Baloise Swiss Property Fund, and Swiss Life REF.

### 1.3 Key Definitions

**Information Architecture (IA)**: The structural design of a document — the organisation, labeling, and hierarchy of information — that determines what readers perceive first, what they can find, and what they remember.

**Layered Reading**: A design strategy that supports multiple engagement depths simultaneously: at-a-glance impression, scanning for specific data, and deliberate analytical reading.

**Cognitive Load**: The mental effort required to process a given piece of information. Cognitive Load Theory (Sweller, 1988) holds that working memory is limited and that excess load degrades both comprehension and decision quality.

**Behavioral Finance of Design**: The application of behavioral economics insights (anchoring, framing, availability, recency bias) to explain how document design choices alter investor judgment independently of content.

**Regulatory Hierarchy**: The obligatory content structure imposed by financial regulation (ESMA guidelines for KIID, Commission Regulation (EU) No 583/2010 for UCITS, PRIIPs Regulation (EU) No 1286/2014 for KID).

**Editorial Hierarchy**: The discretionary content and salience choices made by asset managers in non-mandated factsheets or within regulatory slack.

---

## 2. Foundations

### 2.1 Information Architecture Theory

The canonical framework for information architecture — originating in Rosenfeld, Morville, and Arango's *Information Architecture for the Web and Beyond* (4th ed., 2015) — identifies four core components: organisation systems, labeling systems, navigation systems, and search systems. In a print factsheet, navigation and search reduce to visual hierarchy and scanning affordances (since there are no hyperlinks or search bars), leaving organisation and labeling as the primary design levers.

For financial documents, organisation systems must resolve a fundamental tension: chronological/logical sequencing (how a fund works, then what it has returned, then what it costs) versus salience sequencing (what the investor most needs to know to make a decision). These orderings rarely coincide. Research in information design consistently shows that readers assign greater credibility and importance to information appearing early and prominently in a document — a finding with direct regulatory implications when performance data appears before risk disclosures.

### 2.2 Cognitive Load Theory

Sweller's Cognitive Load Theory (1988, updated 2019) distinguishes three types of cognitive load in information processing:

1. **Intrinsic load**: Complexity inherent to the material itself (e.g., understanding a Sharpe ratio requires prior financial knowledge).
2. **Extraneous load**: Complexity introduced by poor design — cluttered layouts, inconsistent typography, redundant information, dense text blocks.
3. **Germane load**: The cognitive effort devoted to schema construction (building understanding), which is the productive load designers should maximise.

Good factsheet design minimises extraneous load (through white space, typographic hierarchy, and consistent grid) and reduces intrinsic load (through plain language, visual encodings of complex metrics, and contextualisation). Research on financial disclosure readability confirms that investors confronted with less readable reports express lower comfort in evaluating firms and assign less weight to the information therein (arxiv 2507.07037). The Fog Index for 10-K filings increased from 17.6 in 1996 to 20.19 in 2022, suggesting that regulatory complexity is eroding comprehension at a systematic rate.

White space — the empty areas between and around design elements — is a primary tool for extraneous load reduction. Research demonstrates that increased white space around text and titles significantly improved participants' reading comprehension and attention retention (Orrbitt, 2025). In the factsheet context, this creates a genuine tension with regulatory density requirements: the UCITS KIID must contain fund name, objectives, risk/reward profile, charges, past performance, and practical information — all within two A4 pages.

### 2.3 Gestalt Psychology in Financial Layout

The Gestalt principles, developed by Wertheimer, Koffka, and Kohler in the 1920s, describe how the human visual system organises information into perceived wholes. Six principles have direct applicability to factsheet design:

**Proximity**: Elements placed near each other are perceived as belonging to the same group. In factsheets, proximity governs the grouping of KPI blocks, chart-and-commentary pairings, and fund characteristics tables. Violating proximity — placing related data in non-adjacent zones — forces readers to perform cross-page referencing that dramatically increases cognitive load.

**Similarity**: Elements sharing visual attributes (color, shape, size, typeface) are perceived as functionally related. This principle underlies the use of consistent color encoding across a factsheet: the fund's primary brand color applied to all performance metrics creates an implicit category; grey applied to benchmarks creates the counter-category. The SRRI risk scale in KIID documents (a numbered 1–7 bar) exploits similarity through shape to create an instant comparative system.

**Figure-Ground**: The perceptual distinction between a focal element (figure) and its background (ground). High-contrast KPI callout boxes — a large number in brand color against a white card — exploit figure-ground to make key metrics pop from the page. The choice of which metrics receive this treatment is itself a design decision with behavioral consequences.

**Closure**: The tendency to perceive incomplete shapes as complete. Designers use partial borders, rules, and tinted zones to imply structure without drawing full-weight grid lines, reducing visual noise while maintaining organisational clarity.

**Continuity**: Elements arranged along a line or curve are perceived as related and sequential. Performance tables exploit continuity to create the perception of a narrative arc — typically a temporal sequence from left (past) to right (present) — which interacts with recency bias in ways discussed in Section 4.3.

**Prägnanz** (Good Form): The visual system prefers the simplest possible interpretation of any scene. This principle motivates minimalism in factsheet design: every extraneous element competes with the signals the designer intends to transmit.

### 2.4 Behavioral Finance of Document Design

The behavioral finance literature identifies several cognitive biases that are specifically activated or amplified by factsheet design choices:

**Anchoring**: Investors use the first salient number they encounter as a reference point for all subsequent evaluation (Tversky and Kahneman, 1974). In a factsheet, the prominent placement of NAV, market price, or inception-to-date return establishes an anchor that shapes interpretation of all subsequent data. A fund priced at CHF 107 (premium of 1.8%) reads differently depending on whether the reader first encounters the NAV (CHF 105.15) or the market price. The sequencing and visual salience of these figures is therefore not neutral.

**Recency Bias**: Investors over-weight recent returns relative to longer-term performance (Kahneman, 2011). Performance tables that display data in reverse chronological order (most recent year leftmost) amplify recency bias. Research confirms that prior fund performance, despite being normatively irrelevant to future returns, received considerable attention from investors in eye-tracking experiments, and that this attention fully mediated the effect of past performance on purchasing intentions (ResearchGate 265515253; Journal of Financial Services Marketing, 2014).

**Availability Heuristic**: Information that is more visually prominent, more recently encountered, or more emotionally resonant is judged as more probable or important (Tversky and Kahneman, 1973). In factsheets, the asset spotlight or property photo section is the primary availability trigger — a vivid individual property description creates a mental image that dominates the reader's sense of the fund's character far more than portfolio statistics would warrant.

**Framing**: Identical financial information presented as gains versus losses produces systematically different evaluations (Kahneman and Tversky, 1979). Performance disclosures framed as absolute returns versus drawdowns, or in absolute versus annualised form, change investor risk perception independent of the underlying data.

---

## 3. Taxonomy of Approaches

### 3.1 Regulatory-Constrained vs. Editorial-Free Factsheets

Two broad categories of investment factsheet can be identified:

**Regulatory-Constrained Documents** are mandated by law and subject to prescriptive content, format, and length requirements. The primary examples are:
- **UCITS KIID** (being superseded by PRIIPs KID for most funds from 2023): Two A4 pages maximum. Content prescribed by Commission Regulation (EU) No 583/2010. Sections: fund name and identifier, objectives and investment policy, risk and reward profile (SRRI), charges, past performance (bar chart), practical information.
- **PRIIPs KID**: Three A4 pages maximum (PRIIPs Regulation (EU) No 1286/2014). Content: product description, comprehension alert (where applicable), risk indicator (1–7 SRI scale), performance scenarios (four mandated scenarios), costs (total/annual cost amounts), required holding period, complaint information.
- **Swiss CISA fund documentation**: Under the Federal Act on Collective Investment Schemes (CISA) and FINMA Circular 2013/9, Swiss funds offered to retail investors must produce a prospectus and simplified prospectus. FINMA approves fund documentation before establishment.

**Editorial Factsheets** are produced voluntarily by asset managers as investor relations or marketing instruments. These documents have no mandatory format beyond general marketing communication guidelines (MiFID II for EU distribution; FIDLEG for Swiss distribution to retail clients). Editorial factsheets include the quarterly one- or two-page fund update sheets produced by Swiss real estate fund managers (UBS Direct Residential, Baloise Swiss Property Fund, Swiss Life REF, EdR REIM) and the four-page institutional factsheets common in the broader European fund industry.

### 3.2 Two-Page vs. Four-Page Formats

**Two-page formats** are the standard for regulatory documents (KIID, PRIIPs KID) and for Swiss listed real estate funds' quarterly communications. The severe space constraint forces absolute prioritisation: typically one column of essential KPIs (NAV, market price, premium/discount, distribution yield, TER, debt ratio) and one visual element (performance chart or risk indicator), with minimal prose.

**Four-page formats** are the standard for editorial institutional factsheets. A canonical four-page factsheet structure (as observed in the EdR REIM ERES-CI factsheet and industry peers) follows this layout:
- Page 1 (Cover): Brand identity, fund name, sub-fund, reporting date. No data content.
- Page 2 (Snapshot): Strategy narrative + primary KPI grid + performance chart.
- Page 3 (Detail): Semi-annual KPIs + manager commentary + asset spotlight.
- Page 4 (Characteristics + Disclaimer): Full regulatory characteristics table + disclaimer.

This four-page structure implements a natural progressive disclosure arc: identity → performance snapshot → analytical detail → legal characteristics.

### 3.3 Data-First vs. Narrative-First Designs

**Data-first factsheets** lead with numerical tables and charts, relegating prose to the later pages or to small footnotes. This approach is dominant in regulatory documents and in quantitative-oriented institutional communication. It serves experienced investors who can scan a KPI block and a performance chart and reach a decision in under 30 seconds.

**Narrative-first factsheets** open with an investment thesis or manager's letter before presenting data. This approach is common in private equity, real estate, and infrastructure fund communications, where the asset story is as important as quantitative metrics. It optimises for the full-read mode and for readers who are evaluating the manager as much as the fund.

Most four-page institutional real estate fund factsheets adopt a hybrid: data-first on page 2 (the snapshot) with narrative elements on page 3 (the asset spotlight), reflecting the dual audience of quantitative allocators (who go directly to page 2) and board members or trustees (who want to understand the manager's thinking on page 3).

---

## 4. Analysis

### 4.1 Layered Reading Architecture

A well-designed factsheet must function simultaneously at three distinct engagement depths. Designing for all three without sacrificing coherence at any level is the central challenge of factsheet information architecture.

**The 5-Second Glance** is the dominant engagement mode for most readers, most of the time. In five seconds, a reader can extract: fund name and category (from header branding), one or two salient numbers (from large-type KPI callouts), approximate performance direction (from a chart's general slope), and overall document tone (from color palette and white space density). Design decisions that affect the 5-second glance include: the visual hierarchy of the header zone, the presence and placement of KPI callout blocks, and the choice of primary KPI displayed in the largest typeface.

The 5-second test, a usability methodology formalised in UX research (Trymata; Lyssna, 2025), measures exactly this first impression. Applied to factsheet design, a passing 5-second test would see a reader correctly identify: the fund's name, its primary asset class, its most recent performance (positive or negative), and whether it currently trades at a premium or discount to NAV.

**The 30-Second Scan** is the mode in which an investor determines whether a fund deserves further investigation. In 30 seconds, a practiced reader will scan the entire KPI block, read the performance table's most recent row, glance at the expense ratio (TER), and check the risk indicator. Eye-tracking research consistently shows that investors follow an F-pattern or spotted pattern when scanning financial documents: they read the first line fully (fund name, header), then make shorter horizontal sweeps across the page, then drop to the left-column elements that interest them (Nielsen, 2006; NNG 2006). The spotted pattern — direct fixation on pre-defined targets like "premium" and "yield" numbers — is characteristic of expert investors who know what they are looking for.

Designing for the 30-second scan requires: clear section headers that function as navigational landmarks, consistent placement of recurring KPIs across editions, and typography that makes the difference between a heading, a data value, and a label immediately parseable without reading.

**The Full Read** is the mode in which a reader engages with the complete document — typically when making a final allocation decision, preparing a presentation for an investment committee, or conducting compliance review. This mode requires narrative coherence across the document, logical sequencing of sections, and sufficient prose depth to explain the quantitative data.

**Progressive Disclosure on Paper** is the print-specific mechanism for layered reading. Unlike web or digital documents that can literally hide advanced content behind tabs or accordions, paper factsheets must implement progressive disclosure through visual weight: the most important content occupies the most prominent visual position (top-left of the first data page, largest type, highest color weight); secondary content occupies moderate positions; tertiary content (legal characteristics, full disclaimer) occupies the final page in small type. This spatial encoding of importance is the paper equivalent of Nielsen's progressive disclosure principle (Nielsen, 1995), and it is the primary tool available to print-focused factsheet designers.

### 4.2 Gestalt Principles in Financial Layout

**Proximity as Grouping Mechanism**: The standard Swiss real estate fund factsheet typically groups data into three visual clusters: market metrics (market price, NAV, premium/discount, market cap, trading volume, volatility), financial metrics (distribution per share, payout ratio, TER, debt ratio, EBIT margin), and valuation metrics (gross/net yield, investment yield, rental loss rate). The visual separation between these clusters — achieved through whitespace, rule lines, or tinted box backgrounds — is the primary IA mechanism that enables a reader to locate a specific metric by cluster rather than by linear search.

**Similarity for Comparative Encoding**: Swiss SICAV factsheets routinely display fund performance against an index benchmark (typically the SXI Real Estate Funds index). The visual encoding of fund vs. benchmark data — consistent use of the brand primary color for the fund line and a neutral grey for the benchmark — creates a similarity-based perceptual grouping that allows readers to assess relative performance at a glance.

**Figure-Ground for KPI Salience**: The most behaviorally significant design choice in a factsheet is which KPIs receive figure-ground treatment — that is, which metrics are displayed in large type against a contrasting background (the "figure") versus which appear as labeled rows in a table (the "ground"). In an EdR REIM-style four-page factsheet, six market KPIs are displayed in a 3×2 tcolorbox grid with large blue numbers — these are figure-treated. The remaining key figures appear in a two-column table — ground-treated. This hierarchy is both a design decision and a claim about what matters most.

**Continuity and Temporal Sequence**: Performance bar charts and time-series line charts exploit continuity to create temporal narratives. The direction of time encoding (left-to-right is standard in Western typography) interacts with recency bias: placing the most recent performance bar at the right end of the chart gives it natural prominence as the terminal point of a continuous narrative. A designer who understands this can choose to extend the time axis to longer periods, contextualising recent performance against a longer arc — a design choice that actively counteracts recency bias rather than amplifying it.

### 4.3 Behavioral Finance of Factsheet Design

**NAV as Anchor**: For listed real estate funds (SICAVs, FCPs, investment trusts), the relationship between NAV per share and market price is one of the most analytically important metrics — but it is also one of the most behaviorally loaded. When NAV is displayed first, it establishes the investor's reference point. The market price is then perceived as a deviation from this anchor, naturally framing the premium/discount as the salient variable. Swiss real estate fund factsheets typically display all three values in direct proximity with the premium or discount explicitly calculated. The positioning of these three related values — and which is given prominence through figure treatment — determines the investor's default frame.

**Recency Bias in Performance Tables**: Eye-tracking research on simplified fund prospectuses (Journal of Financial Services Marketing, 2014) demonstrates that investors show consistent attentional bias toward past performance data, and that this attention mediates the effect of past performance on purchase intentions. Performance tables displayed with the most recent year on the left — visually salient and scanned first — disproportionately influence investor judgment. Regulatory bodies recognise this risk: ESMA guidance on KIID performance charts mandates specific time periods and bar chart formats designed to prevent selective presentation.

**Availability Heuristic in Asset Spotlights**: The asset spotlight section is the factsheet's primary availability trigger. A vivid description of a specific property (location, tenant quality, acquisition price, yield, WAULT) accompanied by a photo creates a strong, accessible mental image that will dominate the reader's characterisation of the fund far beyond what the asset's weight in the portfolio would warrant. The behavioral awareness required is to calibrate the prominence of the spotlight relative to portfolio-level data.

**Framing Effects in Risk Communication**: The SRRI and SRI risk scales (1–7 for UCITS KIID and PRIIPs KID respectively) are designed as neutral ordinal scales. The choice to represent the risk scale as a numbered bar (the KIID convention) rather than as a traffic-light color scheme reflects regulatory recognition of the framing problem: red-green color encoding of risk levels introduces framing effects that the numbered bar deliberately avoids.

### 4.4 Regulatory Layout Constraints

**UCITS KIID (Commission Regulation (EU) No 583/2010)**: The KIID is a two-page A4 document (three pages for structured UCITS). Content sections are mandated in prescribed order:
1. Fund name, ISIN, and management company (header)
2. Objectives and investment policy (plain language, ≤ 150 words recommended)
3. Risk and reward profile (SRRI bar chart, seven-point scale)
4. Charges (entry/exit charges, ongoing charges, performance fee)
5. Past performance (standardised bar chart, 10-year maximum, with mandatory disclaimer)
6. Practical information (depositary, tax treatment, dealing information, reference to prospectus)

The regulation explicitly states that the KIID "must follow the sequence set out" and that "the layout should make the KIID appear to be an important and easily accessible document." The KIID's mandatory sequence embeds a specific information hierarchy: objectives before risk, risk before charges, charges before performance — a behavioral finance-informed design choice that deliberately postpones the availability of performance data.

**PRIIPs KID (PRIIPs Regulation (EU) No 1286/2014, revised from January 2023)**: The PRIIPs KID replaces the KIID for most investment products sold to retail clients from January 2023. The document is three pages maximum and adds: a comprehension alert for complex products, performance scenarios (unfavourable, moderate, favourable, stress), and a required holding period recommendation. The presentation of performance scenarios using forward-looking projections rather than backward-looking performance charts reflects a regulatory theory that historical performance is insufficiently informative about future outcomes.

**Swiss CISA/CISO Framework**: Under the Federal Act on Collective Investment Schemes (CISA, 2006) and FINMA Circular 2013/9, Swiss publicly-offered collective investment schemes must provide a prospectus and simplified prospectus. The simplified prospectus under CISA is less prescriptive in format than the EU KIID, requiring core disclosures without the KIID's strict two-page limit or mandated section ordering.

The AMAS "Specialist information factsheet on the key figures of real estate funds" represents a form of industry-led standardisation that, while not legally mandated, has achieved near-universal adoption among Swiss real estate fund managers — creating a de facto uniform KPI vocabulary that enables side-by-side comparison without the legal coercive force of EU KIID standardisation.

**FIDLEG (Swiss Financial Services Act, 2020)**: Under FIDLEG, financial service providers must produce a key information document (Basisinformationsblatt, BIB) for non-complex financial instruments. For Swiss SICAVs distributed to retail clients, the BIB requirements effectively align with PRIIPs KID standards.

### 4.5 Grid Architecture and White Space

**The Grid as Constraint System**: A document grid — the underlying geometric framework of columns, rows, gutters, and margins — is the invisible architecture of a factsheet. Swiss-style grid systems (derived from the International Typographic Style pioneered by Müller-Brockmann, Ruder, and Huber in 1950s Zurich) use a modular grid of equal columns with consistent gutters. For a two-column A4 factsheet layout, a standard configuration might use a 12-column grid with 5mm gutters and 15mm margins, allowing content blocks to span 2, 3, 4, or 6 columns.

**Fixed Regulatory Blocks vs. Editorial Zones**: The regulatory and editorial elements of a factsheet should be visually distinguished. In a well-designed four-page factsheet:
- The cover page is purely editorial (brand identity, no regulatory content).
- Pages 2–3 mix editorial content (strategy, commentary) with regulatory-adjacent content (KPI tables, performance charts).
- Page 4 is primarily regulatory (characteristics table, regulatory disclaimer, regulatory footer).

The visual weight and white space allocation should reflect this structure: pages 2–3 carry the highest information density and the most sophisticated typographic hierarchy; page 4 adopts a more standardised, tabular appearance consistent with its regulatory character.

**White Space as Signifier**: Research consistently finds that white space is perceived as a signal of premium quality and institutional confidence. In the factsheet context, generous margins (15–20mm), adequate leading (14–15pt for 10pt body text), and breathing room between data blocks signal that the document was produced with care and resources — indirectly signalling the manager's institutional quality. However, white space competes with regulatory density requirements: the AIC's investor research confirmed that many retail investors find KIIDs difficult to understand and fail to read them completely.

The Swiss editorial factsheet partially resolves this tension by relegating the highest-density regulatory content (characteristics table, disclaimer) to page 4, where density is expected and contextually appropriate, and giving more breathing room to the analytical pages (2–3) that carry the highest decision-making value.

---

## 5. Comparative Synthesis

| Dimension | Pole A | Pole B | Resolution Strategy |
|-----------|--------|--------|---------------------|
| Regulatory density vs. premium perception | Two-page KIID/KID (6+ mandatory sections, 8pt minimum) | Four-page editorial factsheet (60%+ white space possible) | Relegate regulatory content to back pages; use editorial pages for premium layout |
| Standardisation vs. differentiation | UCITS KIID (fully prescribed format, enables side-by-side comparison) | Editorial factsheet (full creative freedom, unique brand) | Use AMAS KPI vocabulary for comparability; differentiate through editorial design |
| Data completeness vs. readability | All AMAS key figures (11+ metrics) on one page | Curated 6-KPI highlight grid | Layer: callout grid for 5-second read, full table for analytical read |
| Recency bias risk vs. performance communication | Chronological (oldest first, mitigates recency) | Reverse-chronological (most recent first, amplifies recency) | Lead with long-term performance bar chart; most recent period clearly labeled but not disproportionately large |
| Availability heuristic (asset spotlight) vs. portfolio completeness | Single featured property (vivid, memorable) | Portfolio summary statistics only | Feature the spotlight as an illustration of thesis, frame explicitly as "representative example" |
| Figure-ground (KPI prominence) vs. equal disclosure | Large-type KPI callouts for 3–6 metrics | All metrics in uniform table | Reserve figure-ground treatment for metrics most decision-relevant to target audience |
| Anchoring (NAV sequence) vs. market orientation | NAV first, then market price | Market price first, then NAV | Display NAV and market price in proximity with premium/discount explicitly calculated |
| White space vs. information density | Swiss International Style minimalism | Regulatory document density | Front pages: minimal density; back pages: high density; editorial tone governs the face of the document |

The analysis consistently converges on the four-page editorial factsheet as the optimal format for a Swiss real estate SICAV seeking to serve multiple reader types without sacrificing regulatory completeness. This format serves the 5-second glance through a high-impact cover and page 2 KPI grid; serves the 30-second scan through consistent visual landmarks on pages 2–3; serves the full read through narrative coherence and complete characteristics on page 4; and satisfies Swiss CISA/AMAS disclosure requirements without compressing the analytical content into illegibility.

---

## 6. Open Problems & Gaps

### 6.1 Empirical Gaps in Financial Document Eye-Tracking

The existing eye-tracking literature on financial documents is dominated by studies of simplified prospectuses and web-based displays. There is a near-complete absence of published eye-tracking research specifically focused on four-page institutional factsheets in print or high-fidelity PDF format. The reading behavior differences between web-rendered and print-quality PDF financial documents — particularly gaze path sequencing, fixation duration on KPI callouts, and cross-page navigation patterns — remain empirically uncharacterised.

### 6.2 The Generative AI Design Challenge

As large language models increasingly generate financial document text (commentary, strategy descriptions, disclaimer text), the risk of optimised-for-scanning prose that reads well in isolation but lacks logical coherence across the document increases. There is no established design framework for ensuring cross-section coherence in AI-assisted factsheet production.

### 6.3 Multilingual Factsheet Architecture

Swiss institutional factsheets are routinely produced in English, French, and German. The typographic and grid implications of language length variance (German words are typically 30–40% longer than English equivalents) are poorly addressed in available design guidance. Word-wrapping, line-length adjustments, and KPI label truncation in German represent a systematic design challenge largely solved by ad hoc editing rather than principled grid design.

### 6.4 Digital vs. Print Factsheet Divergence

The PRIIPs KID and UCITS KIID were designed for print distribution. As digital distribution (interactive PDFs, web portals, mobile apps) becomes dominant, the static layout assumptions of the regulatory format increasingly misalign with how investors actually encounter these documents. Interactive elements (tooltips, drilldown data, animated performance charts) could radically improve comprehension but are explicitly outside the scope of current regulatory mandates.

### 6.5 Behavioral Finance Mitigation vs. Regulatory Design

Current regulatory frameworks partially address cognitive bias through content mandates (required disclaimer text about past performance) but have not systematically incorporated visual design requirements that would structurally mitigate bias amplification. This represents an open policy and design research problem.

---

## 7. Conclusion

Investment factsheet information architecture is a multi-constrained design problem where regulatory compliance, investor cognition, behavioral finance, and institutional brand identity must be simultaneously satisfied. Five principal conclusions emerge:

First, no single layout serves all readers equally. The layered reading architecture — designing simultaneously for the 5-second glance, 30-second scan, and full read — is the most important structural principle for a factsheet targeting diverse investor audiences.

Second, Gestalt principles are not stylistic options but cognitive necessities. Proximity, similarity, figure-ground, and continuity are the mechanisms through which investors construct meaning from a dense financial document. Violating these principles imposes extraneous cognitive load that degrades both comprehension and decision quality.

Third, behavioral finance considerations should inform every major layout decision. The prominence of NAV versus market price, the chronological direction of performance tables, the vividity of asset spotlights, and the figure-ground treatment of specific KPIs are all behavioral interventions, whether or not they are recognised as such.

Fourth, the tension between regulatory density and premium perception is structurally resolvable through page architecture. The four-page editorial factsheet achieves this resolution by treating the document as a spatial progressive disclosure system.

Fifth, current regulatory frameworks are behaviorally inconsistent. The gap between what behavioral finance research recommends and what regulation requires represents an ongoing policy design problem with material consequences for retail investor welfare.

---

## References

1. Bonsall, S.M., Miller, B.P., and Rennekamp, K. (2017). "The impact of disclosure complexity on investor comprehension." *Contemporary Accounting Research*. https://arxiv.org/html/2507.07037

2. Cognitive Load and Information Processing in Financial Markets: Theory and Evidence from Disclosure Complexity. *arXiv preprint 2507.07037* (2025). https://arxiv.org/pdf/2507.07037

3. Eye-tracking for the study of financial decision-making: A systematic review of the literature. *Journal of Behavioral and Experimental Finance* (2022). https://www.researchgate.net/publication/361543253

4. Do investors show an attentional bias toward past performance? An eye-tracking experiment on visual attention to mutual fund disclosures in simplified fund prospectuses. *Journal of Financial Services Marketing* (2014). https://www.researchgate.net/publication/265515253

5. Eye-tracking Insights into Investor Choices. *eScholarship, UC* (2022). https://escholarship.org/content/qt7sc26039/qt7sc26039.pdf

6. Nielsen, J. (2006). F-Shaped Pattern of Reading on the Web. *Nielsen Norman Group*. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/

7. Text Scanning Patterns: Eyetracking Evidence. *Nielsen Norman Group*. https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/

8. Progressive Disclosure. *Nielsen Norman Group*. https://www.nngroup.com/articles/progressive-disclosure/

9. Vanguard (2025). Principles for Behavioral Design. https://corporate.vanguard.com/content/dam/corp/research/pdf/principles_for_behavioral_design_nudging_for_better_investor_outcomes.pdf

10. ESMA. Questions and Answers Key Investor Information Document (KIID) for UCITS (2015). https://www.esma.europa.eu/sites/default/files/library/2015/11/2015-631_ucits_kiid_march_update.pdf

11. ESMA. JC PRIIPs Q&As (2023). https://www.esma.europa.eu/sites/default/files/2023-05/JC_2023_22_-_Consolidated_JC_PRIIPs_Q_As.pdf

12. White Space and Cognitive Load: Designing for Easier Processing. *Orrbitt* (2025). https://orrbitt.com/news/white-space-cognitive-load-designing-easier-processing/

13. Swiss real estate funds — overpriced or undervalued? *Swisscanto* (2024). https://www.swisscanto.com/ch/en/institutionelle/blog/asset-management/2024/swiss-real-estate-premium-discount.html

14. FINMA SICAVs. https://www.finma.ch/en/authorisation/asset-management/sicavs/

15. AMAS CISA overview. https://www.am-switzerland.ch/en/topics/regulation/financial-market-architecture/cisa

16. Lost in the fog: growing complexity in financial reporting. *Nature Humanities and Social Sciences Communications* (2025). https://www.nature.com/articles/s41599-025-06094-y

17. AIC (2018). Burn Before Reading: investor research on KIID. https://www.theaic.co.uk/system/files?file=private-file/AICBurnBeforeReadingSep18.pdf

18. Best Design Practices for Fund Factsheets. *Anevis Solutions* (2016). https://www.anevis-solutions.com/2016/best-design-practices-for-your-fund-factsheets/

19. Essential Components of a Fund Factsheet. *Acuity Knowledge Partners*. https://www.acuitykp.com/essential-components-of-a-fund-factsheet/

20. Fund Communication Guidance. *The Investment Association* (2019). https://www.theia.org/sites/default/files/2019-08/20190218-fundcommunicationguidance.pdf

21. KIID Practical Guide. *Deloitte Luxembourg*. https://www2.deloitte.com/content/dam/Deloitte/lu/Documents/financial-services/lu-kiid-practical-guide.pdf

---

## Practitioner Resources

### Regulatory Documents
- Commission Regulation (EU) No 583/2010 (UCITS KIID): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32010R0583
- PRIIPs Regulation (EU) No 1286/2014: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014R1286
- ESMA UCITS KIID Q&A (2015): https://www.esma.europa.eu/sites/default/files/library/2015/11/2015-631_ucits_kiid_march_update.pdf
- ESMA PRIIPs Q&A (2023): https://www.esma.europa.eu/sites/default/files/2023-05/JC_2023_22_-_Consolidated_JC_PRIIPs_Q_As.pdf
- FINMA Circular 2013/9 Distribution: https://assets.kpmg.com/content/dam/kpmgsites/ch/pdf/ch-finma-circular-2013-09-en.pdf

### Swiss Market References
- Swiss Fund Data (SICAV factsheet portal): https://www.swissfunddata.ch
- AMAS Real Estate Fund Key Figures Guidance: https://www.am-switzerland.ch
- SIX Swiss Exchange Real Estate Index: https://www.six-group.com/en/market-data/indices/switzerland/real-estate/further-indices.html

### Design and UX References
- Vanguard Behavioral Design Research: https://corporate.vanguard.com/content/dam/corp/research/pdf/principles_for_behavioral_design_nudging_for_better_investor_outcomes.pdf
- Nielsen's Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- IxDF Gestalt Principles: https://ixdf.org/literature/topics/gestalt-principles
- Orrbitt White Space Research: https://orrbitt.com/news/white-space-cognitive-load-designing-easier-processing/

---

*This survey was produced as part of the SAMOA institutional report design system research corpus. It should be read alongside the companion surveys on Financial Data Visualization, Swiss International Typographic Style, and Editorial Design Principles.*
