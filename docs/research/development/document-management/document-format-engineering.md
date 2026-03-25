---
title: "Document Format Engineering: PDF Internals, SpreadsheetML Analytics, and WordprocessingML Text Structures"
date: 2026-02-28
summary: Documents the internal object models of PDF (ISO 32000-2), OOXML/Excel SpreadsheetML, and OOXML/DOCX WordprocessingML—covering content streams, CIDFonts, formula graphs, pivot tables, run structures, and tracked changes—and relates them to practical parsing and transformation libraries. Analyzes trade-offs between representational fidelity, semantic accessibility, and cross-tool normalization.
keywords: [development, document-formats, pdf, ooxml, document-engineering]
---

# Document Format Engineering: PDF Internals, SpreadsheetML Analytics, and WordprocessingML Text Structures

*[28 February 2026]*

## Abstract

This survey documents how contemporary document format engineering handles three structurally distinct but operationally coupled ecosystems: PDF page descriptions (with an emphasis on content streams, font encodings, and CIDFonts), OOXML/Excel SpreadsheetML (with an emphasis on formula graphs, pivot tables, and conditional formatting), and OOXML/DOCX WordprocessingML (with an emphasis on run structures and tracked changes). It reconstructs the internal object models specified by ISO 32000‑2 for PDF and ISO/IEC 29500 / ECMA‑376 for Office Open XML, and relates these to practical libraries that expose higher‑level abstractions for parsing, transformation, and preservation. [cdn.standards.iteh](https://cdn.standards.iteh.ai/samples/63534/4229145d18fa4313a506de4cb46ad7fa/ISO-32000-2-2017.pdf)

The analysis identifies three main families of approaches: graphics‑state driven interpretation of PDF content streams with explicit modeling of CID‑keyed fonts; cell‑graph driven modeling of SpreadsheetML workbooks, including optional calculation chains, pivot caches, and worksheet‑level conditional formatting definitions; and inline‑markup driven modeling of WordprocessingML text, where runs, styles, and revision elements jointly determine visible text and its edit history. Trade‑offs arise between representational fidelity and semantic accessibility, between explicit graph representations and on‑the‑fly reconstruction of dependencies, and between fine‑grained revision markup and the practical complexity of normalization across tools. [arxiv](https://arxiv.org/ftp/arxiv/papers/0906/0906.0867.pdf)

## 1. Introduction

The central problem studied here concerns how to engineer robust, semantics‑preserving systems that read, transform, or generate documents stored in three dominant format families: PDF, OOXML/SpreadsheetML workbooks, and OOXML/WordprocessingML word‑processing documents. This matters because high‑value document workflows, such as regulatory reporting, scientific publishing, and legal contracting, rely on precise rendering, stable identifiers, and durable interpretability across decades of software evolution. [ecma-international](https://ecma-international.org/publications-and-standards/standards/ecma-376/)

The scope of this survey includes internal representations and mechanisms that directly affect fidelity and semantics: PDF content streams, font encodings, and CIDFonts; SpreadsheetML formula representation, calculation ordering, pivot caches, and conditional formatting; and WordprocessingML runs, character properties, and tracked revision markup. It excludes user‑interface concerns, high‑level authoring practices, and non‑OOXML competitors such as ODF, except where they serve as comparative reference points in the literature. [en.wikipedia](https://en.wikipedia.org/wiki/Office_Open_XML)

For clarity, this survey first uses plain English and then introduces formal terminology. A “page description” is the sequence of drawing commands that define visible content on a PDF page; the PDF specification terms this a content stream, which is a sequence of operands and operators interpreted against a graphics state. A “character identifier” is the internal integer that selects a glyph within a font program; in CID‑keyed fonts the specification calls this a Character Identifier (CID), mapped from character codes by a CMap and then to glyph indices (GIDs) by a CIDToGIDMap. A “cell dependency graph” is the directed graph connecting spreadsheet formulas to the cells they reference; ISO/IEC 29500 formalizes a related but distinct structure, the Calculation Chain part, that records last evaluation order rather than true dependencies. A “run” is a contiguous region of WordprocessingML text sharing the same character properties, represented as a w:r element containing w:rPr and text or other inline content. [pdf-issues.pdfa](https://pdf-issues.pdfa.org/32000-2-2020/)

## 2. Foundations

PDF is formally specified by ISO 32000‑2 as a structured collection of objects (dictionaries, arrays, streams, and simple scalars) organized into an indirect object graph, with page objects referencing content streams that contain a postfix program in a fixed operator set. Each page’s content stream is interpreted using a stack‑based graphics state that controls coordinate transforms, color spaces, clipping paths, and current text state, so operators like BT/ET, Tf, Td, Tj, and TJ cooperate to render text. ISO 19005‑1’s PDF/A subset constrains this model by forbidding certain constructs (for example external fonts or device‑dependent color spaces) to improve long‑term preservation, which significantly influences engineering strategies for font handling and text extraction. [iso](https://www.iso.org/obp/ui/es/)

CID‑keyed fonts extend this foundation for large character collections, particularly CJK scripts. In this model, PDF treats a Type 0 composite font as a combination of a CMap that maps multi‑byte character codes to CIDs and an associated CIDFont that maps CIDs to glyph descriptions, with an optional ToUnicode CMap mapping character codes to Unicode code points for text extraction and accessibility. Engineering choices about how these mappings are embedded, subset, and combined with PDFDocEncoding or other encodings directly affect whether downstream software can reconstruct Unicode strings, search text, or build tagged‑PDF logical structure trees. [pdfa](https://pdfa.org/resource/iso-32000-2/)

Office Open XML defines a different foundation: a ZIP‑based Open Packaging Conventions (OPC) container with parts addressed by URIs and linked by explicit relationship elements, as codified in ECMA‑376 and ISO/IEC 29500. SpreadsheetML workbooks and WordprocessingML documents are then represented as XML parts (for example workbook.xml, sheetN.xml, document.xml) whose elements and attributes encode structural, formatting, and content information, with separate parts for shared strings, styles, themes, and higher‑level constructs such as pivot caches or revision logs. [web.mit](http://web.mit.edu/~stevenj/www/ECMA-376-new-merged.pdf)

Within SpreadsheetML, formulas are stored as strings in f elements attached to cell elements, while an optional Calculation Chain part (calcChain.xml) maintains an ordered list of formula cells representing the order in which they were last calculated. The ISO/IEC 29500 description emphasizes that this chain does not encode dependencies, only last evaluation order, and that applications are free to ignore or rebuild it as needed, which means that any explicit “formula graph” used by engines is typically reconstructed from cell formulas at load time. Pivot tables introduce additional parts: pivotCacheDefinition and pivotCacheRecords store cached source data and metadata, while pivotTableDefinition describes the layout and aggregations visible to users. Conditional formatting is expressed through worksheet‑level conditionalFormatting elements, each containing one or more cfRule elements that specify conditions and associated differential formats. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_Calculation_topic_ID0EMXZ5.html)

WordprocessingML’s foundation centers on paragraphs (w:p) and runs (w:r), where runs encapsulate contiguous text or inline objects sharing a common set of character properties defined in w:rPr. Styles, defined in a separate styles part, are referenced from paragraphs and runs, and properties cascade from document defaults through paragraph styles, character styles, and direct formatting in a way similar to CSS but encoded explicitly in XML elements and attributes. Revision tracking introduces further complexity: when trackRevisions is enabled in document settings, insertions, deletions, and other changes are recorded using elements such as w:ins, w:del, and a family of “Change” elements (for example w:pPrChange, w:tblPrChange), each carrying author, timestamp, and revision identifiers. [dociq](https://dociq.io/glossary/tracked-changes)

## 3. Taxonomy of Approaches

| ID | Approach name                                                     | Primary formats          | Core representation focus                                                | Key internal artifacts                                      |
|----|-------------------------------------------------------------------|---------------------------|---------------------------------------------------------------------------|-------------------------------------------------------------|
| A1 | Graphics‑state and CIDFont centric PDF engineering               | PDF (ISO 32000‑2)        | Content streams, graphics state, font encodings, CID‑keyed fonts         | Content operators, CMaps, CIDFonts, ToUnicode, tagged PDF   |
| A2 | Cell‑graph and feature‑part centric SpreadsheetML engineering    | Excel OOXML (.xlsx)      | Cell formulas, implicit dependency graph, calcChain, pivot caches, CF    | f elements, calcChain, pivotCacheDefinition/Records, cfRule |
| A3 | Run‑graph and revision‑markup centric WordprocessingML engineering | DOCX OOXML (.docx)       | Runs and paragraphs, style cascades, tracked revisions, complex inline XML | w:r/w:t/w:rPr, styles, w:ins/w:del, change elements         |

In the remainder of this survey, §4.1 analyzes A1, §4.2 analyzes A2, and §4.3 analyzes A3, ensuring that each taxonomy entry is developed with attention to theory, evidence, implementations, and trade‑offs. [officeopenxml](http://officeopenxml.com/WPtext.php)

## 4. Analysis

### 4.1 Graphics‑state and CIDFont centric PDF engineering (A1)

**Theory & mechanism**

From a theoretical perspective, PDF content streams represent a stack‑based graphics program whose instructions modify a graphics state and emit marks on the page, with text drawing treated as a special case of painting glyphs from a current font at transformed coordinates. Each content stream consists of operands and operators parsed in sequence, so operations like q/Q save and restore graphics state, cm applies affine transforms, and BT/ET bracket text objects within which text‑specific operators such as Tf (set font), Tm (set text matrix), Td/TJ/Tj (position and show text) operate. The causal channel connecting bytes in a string operand to visible characters proceeds through the font dictionary: for simple fonts, an 8‑bit code indexes an encoding vector that selects a glyph; for composite Type 0 fonts, a CMap maps multi‑byte codes to CIDs, and the CIDFont maps those CIDs to glyph programs. [verypdf](https://www.verypdf.com/document/pdf-format-reference/pg_0435.htm)

In CID‑keyed fonts, the Adobe CMap and CIDFont specifications further separate concerns: the CMap encapsulates the mapping from character codes (in some chosen encoding space) to CIDs, while the CIDFont program defines outlines or bitmaps for each CID and metrics in a font‑specific glyph space. PDF adds a CIDToGIDMap to map CIDs to glyph indices where the underlying font technology requires it, and may associate a ToUnicode CMap with the Type 0 font dictionary that maps character codes directly to Unicode code points for text extraction. This multi‑stage mapping means that engineering choices around subsetting, embedding, encoding selection, and ToUnicode generation causally determine whether downstream processors can reconstruct Unicode text, maintain searchability, and support assistive technologies. [digitalcollection.zhaw](https://digitalcollection.zhaw.ch/bitstream/11475/25873/1/2022_SchmittKoopmann-etal_Accessible-PDFs-STEM-fields.pdf)

**Literature evidence**

ISO 32000‑2 provides the normative definition of content streams, including the complete operator set, operand types, and the semantics of the graphics state; annexes and errata detail operator tables and encoding issues that arise in practice. The Adobe and VeryPDF documentation for CMap and CIDFont files describes CID‑keyed fonts as combinations of CMaps and CIDFonts, clarifying that a Type 0 font contains an Encoding entry referencing a CMap and a DescendantFonts array referencing a CIDFont object. Community explanations summarize the mapping chain character code → CID via the Type 0 font’s Encoding CMap, and CID → GID via the CIDToGIDMap, with ToUnicode mapping character codes (not CIDs) to Unicode for extraction. [stackoverflow](https://stackoverflow.com/questions/75576696/understanding-pdf-cidfonts-cmaps-and-gids-best-practices)

Research on PDF/A and long‑term archiving emphasizes that embedding fonts and providing complete ToUnicode CMaps are necessary conditions for robust text reuse, since external font dependencies or missing Unicode mappings hinder faithful future rendering and accessibility. Work on accessible PDFs in STEM domains shows that logical structure, reading order, and MathML proxies must often be inferred or remediated because legacy PDFs frequently lack tagged structure or adequate ToUnicode mappings, making native text extraction insufficient. Recent discussions in open‑source typesetting projects document cases where generated ToUnicode CMaps for Type 0 fonts are incomplete or inconsistent, leading to mismatches between visible text and extractable Unicode strings. [github](https://github.com/typst/typst/issues/3416)

**Implementations & benchmarks**

Major open‑source PDF libraries implement the A1 approach by providing abstractions for content streams and CID‑keyed fonts. Apache PDFBox represents CIDFonts via PDCIDFont and concrete subclasses PDCIDFontType0 and PDCIDFontType2, exposing methods to map character codes to CIDs and GIDs, compute widths, and encode Unicode code points into multi‑byte sequences suitable for content streams. iText’s CMapAwareDocumentFont processes ToUnicode streams, parses CMaps, and constructs bidirectional mappings between CIDs and Unicode, falling back to font encodings when ToUnicode is absent and synthesizing CMaps for certain Identity‑H CJK fonts. Text extraction engines such as PyMuPDF and pdfminer similarly reconstruct text by combining font dictionaries, encodings, and ToUnicode maps, and logs from these systems highlight failure modes when CID fonts lack usable Unicode mappings. [pdfbox.apache](https://pdfbox.apache.org/docs/2.0.0/javadocs/org/apache/pdfbox/pdmodel/font/PDCIDFont.html)

Despite widespread deployment of such libraries, the literature contains little in the way of standardized quantitative benchmarks for PDF content‑stream and font processing; published accounts are mostly qualitative or anecdotal, focusing on correctness in edge cases such as non‑embedded fonts, malformed CMaps, or damaged font programs. Some PDF/A conformance tools and accessibility checkers implicitly benchmark capabilities by verifying embedding, Unicode mappings, and tagging, but their results are rarely aggregated into comparative performance or quality metrics across libraries. This gap limits evidence about relative efficiency and resilience of competing implementations under large, diverse corpora. [stackoverflow](https://stackoverflow.com/questions/33413632/extracting-text-from-a-pdf-with-cid-fonts)

**Strengths & limitations**

The A1 approach aligns directly with the ISO 32000‑2 model and therefore captures all expressible constructs, including exotic operators, multi‑byte encodings, and sophisticated CJK typographic features, which makes it suitable when full visual fidelity and low‑level control are required. CID‑keyed fonts combined with carefully constructed CMaps and ToUnicode mappings support large glyph repertoires and robust text extraction, particularly for ideographic scripts, provided that fonts are fully embedded and mappings are consistent. [arxiv](https://arxiv.org/ftp/arxiv/papers/0906/0906.0867.pdf)

However, this approach exhibits limitations when fonts are not embedded, when encodings are custom or undocumented, or when ToUnicode CMaps are missing or incorrect; in such cases, even spec‑compliant libraries may only approximate Unicode mappings, leading to garbled text or search failures. The graphics‑state centric model also decouples visible layout from logical structure, so reconstructing reading order, headings, and semantic zones requires heuristics beyond the content stream, which leads to fragile downstream pipelines for accessibility and reflowed representations. Scalability is generally acceptable for moderate document collections, but performance can degrade when repeated CMap parsing, font subsetting, and complex text layout operations are applied across very large corpora without caching or normalization layers. [pdfbox.apache](https://pdfbox.apache.org/docs/2.0.8/javadocs/org/apache/pdfbox/pdmodel/font/PDCIDFontType0.html)

### 4.2 Cell‑graph and feature‑part centric SpreadsheetML engineering (A2)

**Theory & mechanism**

In SpreadsheetML, the workbook’s essential semantic content consists of cells arranged in worksheets, where individual cells may contain values, formulas, and formatting, all encoded in XML elements referencing shared style and string tables. Formulas are stored as textual expressions in f elements associated with cell elements c, using a formula language largely aligned with Excel’s user‑visible syntax, including functions, references, and operators. Conceptually, the evaluation semantics form a directed dependency graph over cells, where edges connect formulas to referenced cells, and recalculation corresponds to traversing this graph in a topological order that respects dependencies and volatility semantics. [arxiv](https://arxiv.org/pdf/2208.01043.pdf)

ISO/IEC 29500 introduces an optional Calculation Chain part (calcChain.xml), whose calcChain element lists references to formula cells in the order in which they were last calculated. The specification explicitly notes that this chain does not encode dependency information and that spreadsheet applications may ignore or reconstruct it, treating it as a cache of evaluation order rather than a canonical dependency graph. Pivot tables add another layer: the workbook part references pivotCacheDefinition parts, which in turn reference pivotCacheRecords parts holding cached source data; worksheets hosting pivot tables reference pivotTableDefinition parts that define row, column, page, and data fields and associate them with caches. Conditional formatting is defined at the worksheet level through one or more conditionalFormatting elements, each specifying a cell range (sqref) and a sequence of cfRule elements whose types (for example cellIs, expression, dataBar, colorScale) and formulas determine when differential formats apply. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-the-calculation-chain)

**Literature evidence**

The ECMA‑376 and ISO/IEC 29500 standards define SpreadsheetML’s structural model, supplemented by technical primers and overviews that describe parts, relationships, and typical workbook layouts. Microsoft’s documentation on SpreadsheetML structure emphasizes that workbooks contain a workbook part, worksheet parts, shared strings, styles, themes, and optional parts including calculation chains and pivot caches, which collectively encode computation and presentation. The official discussion of the Calculation Chain clarifies that calcChain lists all cells whose values are determined by formulas, records only last calculation order, and is not required for correct spreadsheet evaluation since engines may reconstruct dependency information from formulas at load time. [c-rex](https://c-rex.net/samples/ooxml/e1/Part1/OOXML_P1_Fundamentals_Part_topic_ID0EE.html)

Technical documentation of pivot tables in SpreadsheetML explains that the pivotCacheDefinition part defines fields, data types, formatting, and shared items, while pivotCacheRecords stores row‑wise records of cached data; pivotTableDefinition describes the layout and aggregations, and multiple pivot tables may share a single cache. Microsoft’s and community tutorials show that conditional formatting settings are stored per worksheet after sheetData, with conditionalFormatting elements specifying ranges and cfRule elements expressing threshold rules, data bars, icon sets, or formulas, consistent with the ISO/IEC 29500 definition of ConditionalFormatting. Empirical and methodological work on spreadsheet modeling and error prevention documents the prevalence of subtle formula and reference errors, supporting the view that explicit graph modeling and validation can improve reliability, even though formats themselves only encode formulas and optional calculation chains. [arxiv](https://arxiv.org/pdf/1707.02833.pdf)

**Implementations & benchmarks**

The Open XML SDK exposes SpreadsheetML constructs as strongly typed classes such as WorkbookPart, WorksheetPart, Cell, Formula, CalculationChain, PivotTableDefinition, and ConditionalFormatting, allowing developers to navigate and manipulate parts and relationships consistent with the underlying XML. Libraries such as ClosedXML and XlsxWriter build on these foundations, presenting higher‑level abstractions for defining formulas, pivot tables, and conditional formats while mapping them back to the appropriate XML structures and parts. Microsoft’s documentation for working with conditional formatting and pivot tables in the Open XML SDK demonstrates example code that populates cfRule elements, sqref ranges, pivotCacheDefinition, and pivotCacheRecords, highlighting the separation between semantic modeling and storage optimization. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-conditional-formatting)

Formal benchmarks for SpreadsheetML processing tend to focus on end‑user performance and scalability of spreadsheet applications rather than low‑level format manipulation; experimental work on analytical semantics and intelligent tools analyzes real‑world spreadsheets to infer patterns, build models, or recommend visualizations, often by reconstructing formula graphs from cell ranges. Studies of spreadsheet error rates and structured modeling techniques illustrate that complex workbooks with deeply nested formulas, linked workbooks, and extensive conditional formatting are susceptible to hard‑to‑detect errors, but these studies rarely quantify the incremental cost of format‑level engineering strategies such as maintaining calcChain parts or normalizing pivot caches. [arxiv](https://arxiv.org/html/2407.09025v1)

**Strengths & limitations**

When engineered according to A2, SpreadsheetML workbooks preserve both computational semantics and rich analytic features, because formulas, pivot caches, and conditional formatting rules are captured in structured XML parts that can be inspected, transformed, or regenerated. The separation between formula expressions, optional calculation chains, and feature‑specific parts such as pivotCacheDefinition/PivotTableDefinition allows tools to rebuild dependency graphs, recalculate, or regenerate caches while maintaining a single source of truth for formulas and layout. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document)

At the same time, this approach faces limitations in interoperability and complexity. The optional nature of calcChain means that some producers omit it or leave it stale, requiring consumers either to rebuild evaluation order or risk inconsistencies, and the specification confirms that applications may disregard it. Pivot caches can diverge from source data if producers or consumers fail to refresh them, leading to discrepancies between visible pivot tables and underlying data, which complicates validation and reproducibility. Conditional formatting rules, stored at the worksheet level with range references and formula expressions, can become difficult to manage or refactor at scale, especially when rules overlap or depend on volatile functions, and empirical work suggests that end‑user practices often produce opaque and fragile rule sets. [github](https://github.com/dotnet/Open-XML-SDK/discussions/1279)

### 4.3 Run‑graph and revision‑markup centric WordprocessingML engineering (A3)

**Theory & mechanism**

WordprocessingML represents document text as a sequence of paragraphs (w:p) and runs (w:r), where each run groups inline content (typically w:t text elements, but also breaks, drawings, fields, and other constructs) sharing a common set of character properties defined in w:rPr. The style system introduces a cascade: default fonts and properties in the styles part apply unless overridden by paragraph styles, character styles, or direct formatting, with inheritance rules similar to those of CSS but made explicit in XML elements such as w:pStyle, w:rStyle, and nested property elements. This run‑graph perspective treats the visible text as the result of traversing document.xml and related header/footer parts, concatenating the text nodes of relevant runs while applying style and property resolution logic. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_WordprocessingML_topic_ID0EZYAG.html)

Tracked revisions extend this model by recording insertions, deletions, and property changes in dedicated markup when the trackRevisions setting is enabled. Insertion of content is represented by wrapping affected elements (for example runs, paragraphs, or table rows) in w:ins elements that carry attributes recording author, timestamp, and revision identifiers, while deletions are represented by w:del elements or specialized change elements for paragraph and table properties. The specification’s Revisions subclause enumerates 28 revision‑related elements, and tutorials on detecting tracked revisions show that revision markup can appear in many parts including the main document, headers, footers, and footnotes. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_trackRevisions_topic_ID0EKXKY.html)

**Literature evidence**

ECMA‑376 and ISO/IEC 29500 define WordprocessingML semantics, and reference material explains that runs encapsulate non‑block text segments with a shared set of formatting, with w:rPr elements holding run‑level properties and w:t holding literal text where whitespace significance may be modified by xml:space attributes. WordML style tutorials describe how styles are defined in a styles part, how paragraph, character, and table styles reference each other, and how direct formatting in w:rPr and w:pPr overrides style‑inherited properties, yielding a cascaded property resolution that determines final presentation. The Document settings element trackRevisions is documented as enabling revision tracking, with the Revisions subclause detailing how insertions, deletions, moves, and property changes are represented so that consumers can present, accept, or reject them. [loc](https://www.loc.gov/preservation/digital/formats/fdd/fdd000397.shtml)

Practical discussions highlight the complexity of revision markup. An introductory definition notes that at the OOXML level, tracked changes are encoded as w:ins for insertions and w:del for deletions, with attributes storing author, date, and revision identifiers, but further elements such as w:pPrChange and w:tblPrChange capture property changes. Articles and code samples on detecting and accepting revisions using the Open XML SDK show that revision elements may nest, that deletions can encompass runs or larger structures, and that accepting revisions programmatically often involves applying XSLT or DOM transformations that remove w:del elements and unwrap w:ins. Community examples also show that user‑level formatting operations can split text across multiple runs and w:t elements, so logical tokens may be fragmented by run boundaries, complicating text‑pattern matching or code replacement that assumes contiguous text nodes. [stackoverflow](https://stackoverflow.com/questions/45544974/how-to-accept-revisions-track-changes-ins-del-in-a-docx)

**Implementations & benchmarks**

The Open XML SDK models WordprocessingML through classes such as WordprocessingDocument, Body, Paragraph, Run, Text, and a variety of revision and style classes, allowing programmatic traversal of the run graph and detection or transformation of tracked changes. Tutorials illustrate how to iterate through paragraphs and runs, inspect w:rPr for styles and properties, and handle complex constructs like fields, bookmarks, and content controls embedded within runs, as well as how to identify and accept or reject revisions by processing w:ins, w:del, and related elements. Third‑party libraries and tools for DOCX manipulation, such as docx4j and other .NET or Java frameworks, similarly expose runs and revision markup, with examples describing how to handle nested w:ins and w:del and remove deleted content while concatenating or normalizing runs. [learn.microsoft](https://learn.microsoft.com/fr-fr/office/dev/add-ins/word/create-better-add-ins-for-word-with-office-open-xml)

Public benchmarks on the performance or correctness of run‑graph and revision‑markup handling remain sparse. Descriptions from tooling developers indicate that the variety and nesting of revision elements, combined with fragmented runs, can make algorithm design for accepting or rejecting changes non‑trivial, particularly when revisions interact with tables, numbered lists, or complex fields. Format‑interoperability studies between OOXML and alternative standards report that tracked changes and complex style cascades are among the more challenging features to translate without loss, reinforcing the view that A3‑style engineering must fully model these constructs to preserve both presentational and historical semantics. [mdpi](https://www.mdpi.com/2078-2489/6/2/111/pdf?version=1427448454)

**Strengths & limitations**

Approach A3 affords fine‑grained control and visibility over document content, formatting, and revision history because runs, styles, and revision elements collectively encode both the current visible text and the sequence of recorded changes. This granularity allows applications to implement sophisticated features such as per‑author change tracking, selective acceptance/rejection, and detailed differencing that respects WordprocessingML’s structural units rather than line‑oriented heuristics. [ericwhite](http://www.ericwhite.com/blog/using-xml-dom-to-detect-tracked-revisions-in-an-open-xml-wordprocessingml-document/)

Conversely, the run‑graph and revision‑markup model can be difficult to process correctly at scale. Frequent fragmentation of text across runs, cross‑cutting style inheritance, and nested or overlapping revision elements mean that naive algorithms for text search, replacement, or normalization may fail or produce structurally invalid documents. The richness of revision constructs also complicates interoperability: formats that lack equivalent constructs may either flatten revisions into final text or lose history, and empirical evaluations of OOXML–UOF translators document that only a subset of features, including tracked changes, can be translated perfectly, with the remainder incurring discrepancies. [stackoverflow](https://stackoverflow.com/questions/54986183/docx-wt-text-elements-crossing-multiple-wr-run-elements)

## 5. Comparative Synthesis

### Structural comparison of approaches A1–A3

| Dimension                        | A1: PDF graphics‑state & CIDFonts                         | A2: SpreadsheetML cell‑graph & feature parts                                  | A3: WordprocessingML run‑graph & revisions                                       |
|---------------------------------|------------------------------------------------------------|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| Primary specification           | ISO 32000‑2 (PDF 2.0) [cdn.standards.iteh](https://cdn.standards.iteh.ai/samples/63534/4229145d18fa4313a506de4cb46ad7fa/ISO-32000-2-2017.pdf)                     | ECMA‑376 / ISO/IEC 29500 SpreadsheetML [ecma-international](https://ecma-international.org/publications-and-standards/standards/ecma-376/)                        | ECMA‑376 / ISO/IEC 29500 WordprocessingML [ecma-international](https://ecma-international.org/publications-and-standards/standards/ecma-376/)               |
| Core representation             | Stack‑based content streams and graphics state            | Worksheets with cell formulas; optional calcChain; pivot and CF parts [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_Calculation_topic_ID0EMXZ5.html) | Paragraphs and runs with style cascades and revision markup [officeopenxml](http://officeopenxml.com/WPtext.php)     |
| Semantics encoding              | Visual page description; logical structure optional [cdn.standards.iteh](https://cdn.standards.iteh.ai/samples/63534/4229145d18fa4313a506de4cb46ad7fa/ISO-32000-2-2017.pdf) | Computational semantics in formulas; analytic structures in pivots and CF [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document) | Textual and structural semantics; edit history in tracked changes [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_WordprocessingML_topic_ID0EZYAG.html) |
| Text encoding                   | Font encodings, CMaps, CIDFonts, optional ToUnicode [verypdf](https://www.verypdf.com/document/pdf-format-reference/pg_0435.htm) | Cell values and shared strings; formulas as text expressions [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document)  | Text in w:t within w:r; styles and properties determine presentation [officeopenxml](http://officeopenxml.com/WPtext.php) |
| Change / history representation | Implicit via incremental updates; no standard revision log | Optional calcChain records last evaluation order only [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_Calculation_topic_ID0EMXZ5.html)        | Explicit tracked revisions with w:ins, w:del, and change elements [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_trackRevisions_topic_ID0EKXKY.html) |
| Typical engineering focus       | Font embedding, Unicode mapping, layout fidelity, tagging | Dependency reconstruction, cache management, rule normalization               | Run normalization, style resolution, revision acceptance/rejection               |
| Ecosystem libraries             | PDFBox, iText, PyMuPDF, pdfminer [pdfbox.apache](https://pdfbox.apache.org/docs/2.0.0/javadocs/org/apache/pdfbox/pdmodel/font/PDCIDFont.html)  | Open XML SDK, ClosedXML, XlsxWriter [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-the-calculation-chain)          | Open XML SDK, docx4j, other DOCX frameworks [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/word/how-to-accept-all-revisions-in-a-word-processing-document)             |
| Evidence on robustness          | Standards plus case studies; limited empirical benchmarks [arxiv](https://arxiv.org/ftp/arxiv/papers/0906/0906.0867.pdf) | Methodological studies on spreadsheet errors and models [arxiv](http://arxiv.org/pdf/1503.03122.pdf) | Interoperability and tooling case reports; sparse systematic metrics [mdpi](https://www.mdpi.com/2078-2489/6/2/111/pdf?version=1427448454) |
| Scalability characteristics     | Generally good; complex fonts and tagging add overhead [pdfbox.apache](https://pdfbox.apache.org/docs/2.0.0/javadocs/org/apache/pdfbox/pdmodel/font/PDCIDFont.html) | Large workbooks and complex features increase parsing and recomputation cost [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document) | Deeply nested runs and revisions increase traversal and transformation cost [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_WordprocessingML_topic_ID0EZYAG.html) |

The table suggests several non‑obvious trade‑offs. PDF’s content‑stream model centralizes visual semantics but externalizes text semantics into font and ToUnicode mappings, whereas SpreadsheetML internalizes computational semantics in formulas while externalizing evaluation order to optional calculation chains. WordprocessingML, by contrast, internalizes both presentational and historical semantics, at the cost of substantial structural complexity and fragmentation that can make even simple transformations non‑trivial. [cdn.standards.iteh](https://cdn.standards.iteh.ai/samples/63534/4229145d18fa4313a506de4cb46ad7fa/ISO-32000-2-2017.pdf)

## 6. Open Problems & Gaps

1. **Incomplete and inconsistent Unicode mappings in PDF**.  
   Many real‑world PDFs lack complete ToUnicode CMaps for CID‑keyed fonts, or provide mappings that do not fully correspond to visible glyph usage, which impedes reliable text extraction, search, and accessibility. Resolving this would require improved authoring‑tool behavior, stronger conformance requirements (for example in archival profiles), and empirical studies quantifying the prevalence and impact of missing or incorrect mappings across large corpora. [stackoverflow](https://stackoverflow.com/questions/58829597/how-to-solve-no-unicode-mapping-error-from-pdfbox)

2. **Lack of standardized benchmarks for PDF content‑stream and font handling**.  
   Although multiple mature libraries implement ISO 32000‑2, the literature offers little in the way of head‑to‑head comparisons on correctness, performance, and robustness across diverse PDFs, particularly edge cases involving damaged fonts, exotic encodings, or malformed CMaps. Addressing this gap would require curated benchmark suites, reference renderings and extraction outputs, and shared evaluation protocols analogous to those used in information retrieval or compiler testing. [github](https://github.com/itext/itextsharp/blob/develop/src/core/iTextSharp/text/pdf/CMapAwareDocumentFont.cs)

3. **Ambiguity and under‑use of the SpreadsheetML Calculation Chain**.  
   The specification explicitly describes calcChain as optional and non‑authoritative for dependencies, and documentation notes that spreadsheet engines can ignore it and reconstruct evaluation order from formulas. This flexibility benefits implementations but complicates format‑level reasoning about recalculation semantics and reproducibility, suggesting a need for clearer guidance or complementary representations for dependency graphs, particularly in safety‑critical or auditable spreadsheets. [arxiv](http://arxiv.org/pdf/1503.03122.pdf)

4. **Staleness and inconsistency of pivot caches**.  
   Pivot caches store snapshots of source data and shared items, and documentation highlights that multiple pivot tables can share a cache, which improves performance but introduces the possibility that cached data diverges from source data when refresh operations are omitted or partially applied. Systematic studies of real‑world workbooks could quantify how often such divergence occurs, how it affects analytical correctness, and what engineering patterns most effectively maintain cache–source consistency over time. [arxiv](https://arxiv.org/pdf/0809.3584.pdf)

5. **Complexity of conditional formatting at scale**.  
   Conditional formatting rules are stored as worksheet‑level conditionalFormatting elements with ranges and formulas, and tutorials demonstrate considerable expressive power, including data bars, color scales, and arbitrary formulas. Empirical work on spreadsheet errors suggests that complex webs of conditional formats can obscure semantics and increase maintenance costs, yet there is limited research on analysis, simplification, or visualization techniques that operate at the format level to manage large rule sets. [c-rex](https://c-rex.net/samples/ooxml/e1/part4/OOXML_P4_DOCX_conditionalFormattin_topic_ID0EN4R4.html)

6. **Robust handling of fragmented runs and nested revisions in WordprocessingML**.  
   Community reports and tutorials show that text tokens are often split across multiple w:r and w:t elements and that revision elements can nest or interact with styles and tables, making straightforward text manipulation or revision acceptance unreliable. There is little published work on formal models or algorithms that guarantee structural validity while performing transformations such as normalization, refactoring, or merge operations on complex documents with rich revision histories. [stackoverflow](https://stackoverflow.com/questions/15917747/how-to-apply-a-character-style-to-a-run-in-a-wordprocessing-document)

7. **Cross‑format interoperability and semantic preservation**.  
   Studies evaluating translators between OOXML and alternative office formats report that only a subset of features can be converted without loss, with tracked changes, complex styles, and advanced spreadsheet features among the most problematic. A systematic characterization of which internal constructs in PDF, SpreadsheetML, and WordprocessingML are inherently difficult to map across formats, and under what constraints, remains incomplete, limiting the design of truly interoperable document ecosystems. [officeopenxml](http://officeopenxml.com/WPsection.php)

## 7. Conclusion

This survey documents how three primary document ecosystems represent and manage visual, computational, and textual semantics at the format level: PDF via content streams and font mappings, SpreadsheetML via formulas, optional calculation chains, pivot caches, and conditional formatting, and WordprocessingML via runs, styles, and revision markup. The analysis reveals that each system chooses different loci for explicit representation (for example visual state in PDF, computational logic in SpreadsheetML, and textual plus historical semantics in WordprocessingML), which in turn shapes the engineering challenges and opportunities associated with each approach. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_Pivot_topic_ID0EU2Y6.html)

Across the three approaches, there is a consistent tension between fidelity and accessibility: mechanisms that maximize expressiveness and backward compatibility (such as CID‑keyed fonts or deeply nested revision markup) often render downstream semantic extraction and transformation more complex, whereas simplifications that favor accessibility or alternative renderings risk discarding or approximating information encoded in the original format. Evidence from standards, technical documentation, and empirical studies suggests that while current implementations are mature enough to support large‑scale production use, significant open problems remain concerning Unicode mapping completeness, reproducible spreadsheet evaluation, pivot cache management, scalable conditional formatting, and robust normalization of complex WordprocessingML documents, each of which has implications for long‑term preservation, interoperability, and automated analysis. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-pivottables)

## References

Adobe / ISO, 2017, *International Standard ISO 32000‑2: Document management — Portable document format — Part 2: PDF 2.0*, ISO / PDF Association (hosted copies). [iso](https://www.iso.org/obp/ui/es/)

Adobe Systems, 2000, *Adobe CMap and CIDFont Files Specification*, cited via “PDF Format Reference – CMap and CIDFont Files”. [verypdf](https://www.verypdf.com/document/pdf-format-reference/pg_0435.htm)

Artifex Software, 2025, *PyMuPDF Text Extraction Strategies*, Artifex blog. [artifex](https://artifex.com/blog/text-extraction-strategies-with-pymupdf)

Chen, Y. et al., 2015, “Evaluate the Interoperability of Document Format: Based on Translation Practice of OOXML and UOF”, *Information*, MDPI. [mdpi](https://www.mdpi.com/2078-2489/6/2/111/pdf?version=1427448454)

Ecma International, 2011, *ECMA‑376: Office Open XML File Formats*, merged edition. [ecma-international](https://ecma-international.org/publications-and-standards/standards/ecma-376/)

Eric White, 2020, “Using XML DOM to Detect Tracked Revisions in an Open XML WordprocessingML Document”, Eric White’s Blog. [ericwhite](http://www.ericwhite.com/blog/using-xml-dom-to-detect-tracked-revisions-in-an-open-xml-wordprocessingml-document/)

Eric White, 2020, “Formula Processing in SpreadsheetML”, Eric White’s Blog. [ericwhite](http://www.ericwhite.com/blog/formula-processing-in-spreadsheetml/)

ISO, 2009, *ISO 19005‑1: Document management — Electronic document file format for long‑term preservation — Part 1: Use of PDF 1.4 (PDF/A‑1)*, cited via “PDF/A standard for long term archiving”. [arxiv](https://arxiv.org/ftp/arxiv/papers/0906/0906.0867.pdf)

ISO, 2020, *ISO 32000‑2:2020 Document management — Portable document format — Part 2: PDF 2.0*, overview. [iso](https://www.iso.org/obp/ui/)

Kost‑CECO, 2020, “DOCX, PPTX (OOXML) – Overview”, Kost‑CECO. [kost-ceco](https://kost-ceco.ch/cms/kad_ooxml_fr.html)

Liang, X. et al., 2015, “ODQ: A Fluid Office Document Query Language”, *Information*. [mdpi](https://www.mdpi.com/2078-2489/6/2/275/pdf?version=1434025204)

Microsoft, 2025, “Structure of a SpreadsheetML Document”, Microsoft Learn. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document)

Microsoft, 2025, “Working with the Calculation Chain”, Microsoft Learn. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_Calculation_topic_ID0EMXZ5.html)

Microsoft, 2025, “Working with PivotTables”, Microsoft Learn. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-pivottables)

Microsoft, 2025, “Working with Conditional Formatting”, Microsoft Learn. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-conditional-formatting)

Microsoft, 2025, “How to: Accept All Revisions in a Word Processing Document”, Microsoft Learn. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/word/how-to-accept-all-revisions-in-a-word-processing-document)

Officeopenxml.com, 2012, “Spreadsheet Content Overview”, Office Open XML – What is OOXML?. [officeopenxml](http://officeopenxml.com/SScontentOverview.php)

Officeopenxml.com, 2010, “Word Processing – Text”, Office Open XML – What is OOXML?. [officeopenxml](http://officeopenxml.com/WPtext.php)

Officeopenxml.com, 2012, “Spreadsheets – Overview of Styles”, Office Open XML – What is OOXML?. [officeopenxml](http://officeopenxml.com/SSstyles.php)

PDF Association, 2020, “ISO 32000‑2:2020 PDF 2.0 — Errata and overview”, PDF Association. [pdf-issues.pdfa](https://pdf-issues.pdfa.org/32000-2-2020/)

Schmitt‑Koopmann, I. et al., 2022, “Accessible PDFs: Applying Artificial Intelligence for Automated Remediation of STEM PDFs”, ZHAW. [digitalcollection.zhaw](https://digitalcollection.zhaw.ch/bitstream/11475/25873/1/2022_SchmittKoopmann-etal_Accessible-PDFs-STEM-fields.pdf)

Stack Overflow, 2011, “PDF ToUnicode CMap Glyph Mapping”. [stackoverflow](https://stackoverflow.com/questions/7790783/pdf-tounicode-cmap-glyph-mapping)

Stack Overflow, 2013, “How to Apply a Character Style to a Run in a Wordprocessing Document”. [stackoverflow](https://stackoverflow.com/questions/15917747/how-to-apply-a-character-style-to-a-run-in-a-wordprocessing-document)

Stack Overflow, 2015, “Extracting Text from a PDF with CID Fonts”. [stackoverflow](https://stackoverflow.com/questions/33413632/extracting-text-from-a-pdf-with-cid-fonts)

Stack Overflow, 2017, “How to Accept Revisions / Track Changes (ins/del) in a DOCX?”. [stackoverflow](https://stackoverflow.com/questions/45544974/how-to-accept-revisions-track-changes-ins-del-in-a-docx)

Stack Overflow, 2019, “DOCX w:t Text Elements Crossing Multiple w:r Run Elements?”. [stackoverflow](https://stackoverflow.com/questions/54986183/docx-wt-text-elements-crossing-multiple-wr-run-elements)

Stack Overflow, 2020, “When and Why Does a .xlsx File Contain a .bin File?”. [stackoverflow](https://stackoverflow.com/questions/60866047/when-and-why-does-a-xlsx-file-contain-a-bin-file)

Stack Overflow, 2023, “Understanding PDF CIDFonts, CMaps, and GIDs: Best Practices”. [stackoverflow](https://stackoverflow.com/questions/75576696/understanding-pdf-cidfonts-cmaps-and-gids-best-practices)

Typst project, 2024, “ToUnicode in PDF for a Type 0 CID Font Might be Wrong”, GitHub issue. [github](https://github.com/typst/typst/issues/3416)

VeryPDF, 2012, “PDF Format Reference – Adobe Portable Document Format”, CMap and CIDFont section. [verypdf](https://www.verypdf.com/document/pdf-format-reference/pg_0435.htm)

Wang, T. et al., 2015, “Structured Spreadsheet Modeling and Implementation”, working paper. [arxiv](http://arxiv.org/pdf/1503.03122.pdf)

Wastl, M. et al., 2013, “How Do You Know Your Spreadsheet Is Right? Principles, Techniques and Practice of Spreadsheet Style”, report. [arxiv](https://arxiv.org/pdf/1301.5878.pdf)

Xu, Z. et al., 2017, “Tabula: A Language to Model Spreadsheet Tables”, arXiv preprint. [arxiv](https://arxiv.org/pdf/1707.02833.pdf)

Zhang, X. et al., 2023, “ASTA: Learning Analytical Semantics over Tables for Intelligent Data Analysis and Visualization”, arXiv preprint. [arxiv](https://arxiv.org/pdf/2208.01043.pdf)

Zhou, H. et al., 2023, “FormaT5: Abstention and Examples for Conditional Table Formatting with Natural Language”, arXiv preprint. [arxiv](http://arxiv.org/abs/2310.17306)

DocIQ, 2016, “Tracked Changes: Definition”, DocIQ glossary. [dociq](https://dociq.io/glossary/tracked-changes)

Data2Type GmbH, 2025, “WordML Introduction – Styles”, Data2Type. [data2type](https://www.data2type.de/en/xml-xslt-xslfo/wordml/wordml-introduction/styles)

c‑rex.net, 2006, “Part 1: Fundamentals”, Office Open XML sample. [c-rex](https://c-rex.net/samples/ooxml/e1/Part1/OOXML_P1_Fundamentals_Part_topic_ID0EE.html)

c‑rex.net, 2006, “WordprocessingML Reference Material”, Office Open XML sample. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_WordprocessingML_topic_ID0EZYAG.html)

c‑rex.net, 2006, “trackRevisions (Track Revisions to Document)”, Office Open XML sample. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_trackRevisions_topic_ID0EKXKY.html)

c‑rex.net, 2006, “Calculation Chain”, SpreadsheetML sample. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_Calculation_topic_ID0EMXZ5.html)

c‑rex.net, 2006, “Pivot Tables”, SpreadsheetML sample. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_Pivot_topic_ID0EU2Y6.html)

c‑rex.net, 2006, “conditionalFormatting (Conditional Formatting)”, SpreadsheetML sample. [c-rex](https://c-rex.net/samples/ooxml/e1/part4/OOXML_P4_DOCX_conditionalFormattin_topic_ID0EN4R4.html)

Library of Congress, 2020, “DOCX Transitional (Office Open XML), ISO 29500:2008‑2016”, Format Description Document. [loc](https://www.loc.gov/preservation/digital/formats/fdd/fdd000397.shtml)

Wikipedia, 2005–2025, “Office Open XML”, Wikipedia. [en.wikipedia](https://en.wikipedia.org/wiki/Office_Open_XML)

## Practitioner Resources

- **PDF libraries and tools**  
  – Apache PDFBox – https://pdfbox.apache.org – Java library implementing PDF content‑stream parsing, CIDFont handling, and text extraction consistent with ISO 32000‑2. [pdfbox.apache](https://pdfbox.apache.org/docs/2.0.0/javadocs/org/apache/pdfbox/pdmodel/font/PDCIDFont.html)
  – iText 7 / iTextSharp – https://itextpdf.com – PDF library with CMap‑aware font handling (CMapAwareDocumentFont) and extensive content‑stream manipulation APIs. [github](https://github.com/itext/itextsharp/blob/develop/src/core/iTextSharp/text/pdf/CMapAwareDocumentFont.cs)
  – PyMuPDF – https://pymupdf.readthedocs.io – Python bindings for MuPDF with detailed text extraction, font, and glyph access suitable for analyzing CIDFonts and ToUnicode behavior. [github](https://github.com/pymupdf/PyMuPDF/discussions/1140)
  – PDF Association resources – https://pdfa.org/resource/iso-32000-2 – Central hub for PDF 2.0, PDF/A, and related conformance and interoperability documentation. [pdfa](https://pdfa.org/resource/iso-32000-2/)

- **SpreadsheetML / Excel OOXML libraries and documentation**  
  – Open XML SDK – https://learn.microsoft.com/office/open-xml – Official .NET SDK for manipulating SpreadsheetML workbooks, including calcChain, pivot caches, and conditional formatting. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-the-calculation-chain)
  – ClosedXML – https://github.com/ClosedXML/ClosedXML – High‑level .NET library over Open XML SDK for creating and editing .xlsx files with formulas, tables, and conditional formats. [github](https://github.com/closedxml/closedxml/wiki/Conditional-Formatting)
  – XlsxWriter – https://xlsxwriter.readthedocs.io – Python library for writing .xlsx files with support for formulas, formatting, and conditional formatting rules. [xlsxwriter.readthedocs](https://xlsxwriter.readthedocs.io/working_with_conditional_formats.html)
  – Officeopenxml.com Spreadsheet tutorials – http://officeopenxml.com/SScontentOverview.php – Didactic examples of SpreadsheetML structure, pivot caches, and styles. [officeopenxml](http://officeopenxml.com/SSstyles.php)
  – Microsoft Learn SpreadsheetML articles – “Structure of a SpreadsheetML document”, “Working with the calculation chain”, “Working with PivotTables”, “Working with conditional formatting”. [learn.microsoft](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-the-calculation-chain)

- **WordprocessingML / DOCX libraries and documentation**  
  – Open XML SDK – https://learn.microsoft.com/office/open-xml – Official .NET SDK for WordprocessingML, including APIs for runs, styles, and tracked revisions. [learn.microsoft](https://learn.microsoft.com/fr-fr/office/dev/add-ins/word/create-better-add-ins-for-word-with-office-open-xml)
  – docx4j – https://www.docx4java.org – Java library for DOCX manipulation with examples for handling w:ins and w:del elements and complex run structures. [stackoverflow](https://stackoverflow.com/questions/45544974/how-to-accept-revisions-track-changes-ins-del-in-a-docx)
  – Officeopenxml.com WordprocessingML text reference – http://officeopenxml.com/WPtext.php – Detailed description of runs, text elements, and run properties. [officeopenxml](http://officeopenxml.com/WPtext.php)
  – Data2Type WordML style tutorials – https://www.data2type.de/en/xml-xslt-xslfo/wordml/wordml-introduction/styles – Explanation of style cascades and font defaults in WordprocessingML. [data2type](https://www.data2type.de/en/xml-xslt-xslfo/wordml/wordml-introduction/styles)
  – c‑rex.net WordprocessingML reference and trackRevisions documentation – https://c-rex.net/samples/ooxml/e1/Part4/ – Normative excerpts for revision‑related elements. [c-rex](https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_WordprocessingML_topic_ID0EZYAG.html)
  – Eric White’s Open XML blog – http://www.ericwhite.com/blog – Practical articles on detecting and processing tracked revisions and complex WordprocessingML structures. [ericwhite](http://www.ericwhite.com/blog/using-xml-dom-to-detect-tracked-revisions-in-an-open-xml-wordprocessingml-document/)
