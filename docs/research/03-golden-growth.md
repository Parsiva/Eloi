# Golden ratio and natural growth geometry

> Research angle `golden-growth` — part of the [frame engine research](README.md).

## Summary

The defensible core of "golden ratio in ornament" is self-similarity, not the number 1.618. D'Arcy Thompson's gnomon theorem says that when a structure is built from parts that are similar and similarly placed, corresponding points (tips, bases, curl eyes) lie on logarithmic spirals. So the engine should generate leaves and curls by repeating one spiral-similarity transform (scale times rotation about a pole). "Golden" then just means fixing the scale step at phi per 90 degrees (b = ln(phi)/(pi/2) = 0.30635, pitch 17.03 degrees, 6.854x growth per turn). Sharp's table shows other phi-derived log spirals exist: phi per 54, 108 or 144 degrees, from pentagon and golden-triangle gnomons. That lets the designer pick how tight a curl is and still stay phi-derived. The empirical and historical record argues for honesty. Markowsky shows phi claims only hold within roughly 2% and that people cannot tell 1.6 from 1.7 rectangles. Sharp measured the nautilus at about 3x per turn, not 6.85x. The Renaissance Ionic volutes (Serlio, Salviati, Goldmann) are compass-built, piecewise-Archimedean arc chains, not golden spirals. Hübner (2024) found that people prefer a true golden spiral to the quarter-circle Fibonacci spiral mainly because its curvature is continuous. So what makes ornament read as "printed" is exact repetition under one transform plus curvature continuity (Euler-spiral easements, log-aesthetic curves), not phi to five decimals. For the designer, the workable pattern has three parts. First, a few named parameters (pole, growth rule, angular step, entry tangent and curvature). Second, on-curve authoring in the style of Spiro rather than Bezier handles. Third, a fit, report and snap loop that takes their Illustrator tracing, measures how close it is to golden and corrects it inside a stated tolerance. A conformal "design flat, wrap into spiral" mapping (z = exp(w), as in de Smit and Lenstra's analysis of Escher) is a strong way to let one master leaf be drawn once and stamped through a scroll.

## Case studies

| # | Case study | Kind | Confidence | Verification |
|---|---|---|---|---|
| 1 | [D'Arcy Wentworth Thompson, On Growth and Form (1917): gnomon theorem and the theory of transformations](https://www.gutenberg.org/ebooks/55264) | book | high | verified |
| 2 | [Theodore Andrea Cook, The Curves of Life (1914)](https://archive.org/details/cu31924028937179) | book | high | verified |
| 3 | [George Markowsky, 'Misconceptions about the Golden Ratio', College Mathematics Journal 23(1), 1992](https://assets.speakcdn.com/assets/2433/wijetunge-resource_4.pdf) | paper | high | verified |
| 4 | [John Sharp, 'Spirals and the Golden Section', Nexus Network Journal 4(1), 2002](https://emis.muni.cz/journals/NNJ/Sharp_v4n1-pt04.html) | paper | high | verified |
| 5 | [Ronald Hübner, 'Golden spiral or Fibonacci spiral: Which is more beautiful and why?' (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11005508/) | paper | high | verified |
| 6 | [Renaissance compass volutes: Serlio, Salviati, Philandrier/Dürer (Andrey & Galli 2004), Goldmann's volute (Vollrath), and a programmatic re-implementation (Menezes Leitão)](https://link.springer.com/content/pdf/10.1007/s00004-004-0017-4.pdf) | technique | high | verified |
| 7 | [Vogel's sunflower model, the golden angle, the three-gap theorem and golden-ratio low-discrepancy sequences](https://mathworld.wolfram.com/VogelSpiral.html) | technique | medium | verified |
| 8 | [Log-aesthetic curves (Harada; Miura; Yoshida & Saito), with the interactive G1/G2 Hermite method of Nagy, Yoshida & Hoffmann (2021)](https://arxiv.org/abs/2105.09762) | paper | medium | verified |
| 9 | [Raph Levien: the Euler spiral history, 'From Spiral to Spline' (Spiro), and Euler-spiral parallel curves](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-162.html) | library | high | verified |
| 10 | [B. de Smit & H. W. Lenstra Jr., 'The Mathematical Structure of Escher's Print Gallery' (Notices AMS, 2003)](https://pub.math.leidenuniv.nl/~smitbde/papers/2003-de_smit-lenstra-escher.pdf) | paper | high | verified |
| 11 | [Victorian design grammar: Owen Jones, The Grammar of Ornament (1856), Propositions 8-13, and Christopher Dresser, Principles of Decorative Design (1873)](https://www.gutenberg.org/ebooks/39749) | book | medium | verified |
| 12 | [Proportional scales as designer tools: Tim Brown's modular scale (A List Apart, 2011) and Le Corbusier's Modulor](https://alistapart.com/article/more-meaningful-typography/) | technique | medium | verified |
| 13 | [Harriss spiral (Edmund Harriss; Chalkdust magazine)](https://chalkdustmagazine.com/regulars/on-the-cover/on-the-cover-harriss-spiral/) | technique | medium | verified |

### 1. D'Arcy Wentworth Thompson, On Growth and Form (1917): gnomon theorem and the theory of transformations

<https://www.gutenberg.org/ebooks/55264> · book · confidence: high · verified

**What it is.** The classic morphology text. It has a chapter on the equiangular (logarithmic) spiral, a chapter on phyllotaxis, and Chapter XVII 'On the Theory of Transformations', which compares related forms by deforming a coordinate grid.

**How it works.** Gnomon idea, from Hero and Aristotle: a gnomon is a figure that, added to a shape, leaves the result similar to the original. Thompson states three propositions. (1) If a growing structure is built of successive parts that are similar and similarly situated, log spirals can always be traced through corresponding points. (2) In horns, shells and other organic log-spiral forms, each growth increment is a gnomon to the whole existing structure. (3) Conversely, many gnomonic figures can be inscribed in a spiral by accident. Adding gnomons in succession to a 36-72-72 triangle puts its apices on a log spiral; the same holds for squares, right triangles and hexagons. Corollary: do not expect log spirals in structures whose parts form at the same time, such as a leaf margin. Look for them where growth is accretive. Transformations chapter: inscribe a form in Cartesian coordinates, deform the grid (shear, change the x/y ratio, or substitute other functions), and the figure follows the deformation 'under strain', like a map projection. He limits this to simple, harmonious transformations. The phyllotaxis chapter is skeptical. Close Fibonacci divergences are rare, while 1/2, 2/3 and 3/5 are common. The golden angle is most equable only if all leaves are crushed into a single ring, and he rejects 'ideal angle' teleology.

**Why it matters here.** This is the mathematical license for the owner's request. If every leaf of the flame is the previous leaf scaled and rotated by one fixed similarity about a pole, the curve through the leaf tips is necessarily a log spiral, and golden if the scale per 90 degrees is phi. The transformations chapter is the precedent for defining ornament in a canonical frame and mapping it onto dominant page curves.

**Ideas to borrow:**

- Leaf instancing by a repeated spiral similarity. Leaf_k = O + c^k (Leaf_0 - O) over complex coordinates, with c = s*e^{i*dTheta}. Tips, bases and vein ends then all lie on log spirals with pole O, and they are golden when s = phi^(dTheta/90deg).
- Treat 'stem spiral' (through leaf bases) and 'envelope spiral' (through tips) as rotated copies of one spiral about the same pole. Their ratio is constant, so every leaf has the same aspect.
- Use log spirals for accretive parts (curls, stems, chains of diminishing leaves) and other fair curves (Euler or log-aesthetic) for blade outlines. That follows Thompson's corollary that simultaneously formed margins are not spirals.
- A 'coordinate-strain' layer. The designer draws a motif on a unit grid and the engine maps the grid onto a curved frame region with a simple, documented transformation.

**Evidence read.** Downloaded the Project Gutenberg plain text (55264.txt.utf-8). Read the gnomon passage (book pp. 509-515: Figs 249-260 and the three propositions), the opening of Chapter XVII on transformations, and the end of Chapter XIV on phyllotaxis, including the Fibonacci skepticism and Sachs quote.

### 2. Theodore Andrea Cook, The Curves of Life (1914)

<https://archive.org/details/cu31924028937179> · book · confidence: high · verified

**What it is.** An Edwardian survey of spiral formations in nature and art, with a focus on Leonardo. It is the book where the symbol phi for the golden ratio was introduced, at Mark Barr's suggestion.

**How it works.** Cook (p. 420) records that Mark Barr suggested calling the ratio phi, after Pheidias. He presents the phi series as a 'double Fibonacci series' with exact powers (phi^2 = 1 + phi, phi^3 = 1 + 2phi, ...). He gives Church's 'ideal angle' of 137 deg 30' 27.95" as 2*pi/phi^2. His central thesis argues against strict mathematical conformity. He criticises Colman for treating departures from 'extreme and mean proportion' as negligible, and says that life and beauty are always accompanied by deviations from any simple mathematical expression. For him mathematics is the instrument against which those deviations become measurable. He also reprints a reader's rebuttal (the Giotto's-circle letter): we admire near-exactness for the skill involved, not because it misses perfection.

**Why it matters here.** This is the historical origin of the phi vocabulary, and the first serious argument about strict phi versus deliberate deviation. That is exactly the tension in 'make it look printed and mathematically exact' versus 'make it look natural'.

**Ideas to borrow:**

- Make the dominant function the reference and record any deliberate deviation as a named, stored offset (for example 'tip 3 pushed out 4% from the golden envelope'). Do not add random jitter. That keeps the printed precision while allowing Cook's 'subtle deviation'.
- Compute and show a deviation report: measured ratio versus the phi reference for each element. The math becomes a gauge rather than a straitjacket.
- Use the exact identities phi^n = F(n-1) + F(n)*phi to build scales of related lengths (a phi length palette).

**Evidence read.** Downloaded the archive.org OCR text (cu31924028937179_djvu.txt). Read p. 420 (Barr naming phi, the double Fibonacci series, the 2pi/phi^2 ideal angle), the passage critiquing Colman about deviations, and the 'Slight Divergencies and Subtle Deviations' letter.

### 3. George Markowsky, 'Misconceptions about the Golden Ratio', College Mathematics Journal 23(1), 1992

<https://assets.speakcdn.com/assets/2433/wijetunge-resource_4.pdf> · paper · confidence: high · verified

**What it is.** The standard peer-reviewed debunking of golden-ratio claims about art, architecture, the body and aesthetics. It keeps phi's mathematical properties and rejects most of the empirical claims.

**How it works.** It sets explicit measurement rules. Unstated measurements are assumed accurate to about 1%, and a 1% error in two lengths gives about 2% error in their ratio. That yields an 'acceptance range' of 1.58-1.66 for any claim of phi, and passing it is necessary but not sufficient. It notes that spirals of rectangles can be built from any ratio other than 1:1 (a sqrt(2) example) and cites Thompson for that. On Fechner, it quotes Zusne: 76% of choices fell on three rectangles (0.57, 0.62, 0.67), and many other rectangles were also chosen. In Markowsky's informal tests the most-chosen rectangle was 1.83, people could not find the golden rectangle among 48, and they could not see differences among rectangles between 1.6 and 1.7. It debunks the Parthenon, Pyramid, body and navel claims, and the 'golden' structure of the Aeneid, partly as artefacts of choosing which points to measure.

**Why it matters here.** It sets the honest contract for an engine that 'enforces' phi. Exactness is visually indistinguishable within a few percent, so phi earns its place as a coordinating constant shared across many elements, not as a perceptual magic number.

**Ideas to borrow:**

- Engine tolerance constant: treat a measured ratio within +/-2% of the target as 'golden' when fitting traced art. Report deviations in percent and pixels, not as pass/fail at five decimals.
- Golden-ness checks should compare many elements to each other (do all leaves share one growth factor?), not each to 1.618 in isolation.
- Let any rectangle ratio drive the 'whirling' construction (sqrt(2) is self-similar under halving). Do not hard-code phi into the construction primitive. Make the ratio a parameter whose default is phi.

**Evidence read.** The WebFetch copies on cuhk and goldennumber.net were unreadable (one behind a captcha, one an image scan). Downloaded a JSTOR-scan PDF copy hosted at speakcdn and extracted text with pdftotext. Read the sections on spirals of rectangles, measurement tolerance and acceptance range, the Parthenon, the golden-rectangle aesthetics and Fechner section with Markowsky's experiments, and the human-body section.

### 4. John Sharp, 'Spirals and the Golden Section', Nexus Network Journal 4(1), 2002

<https://emis.muni.cz/journals/NNJ/Sharp_v4n1-pt04.html> · paper · confidence: high · verified

**What it is.** A measured treatment of which spirals are actually 'golden', with measurements of nautilus shells.

**How it works.** All the spirals discussed are logarithmic (equiangular), differing only in tangent angle and multiplication factor per turn. Sharp tabulates golden-section spirals from different gnomons. Rectangle: tangent angle 72.97 deg, factor phi^4 = 6.854 per turn (phi per 90 deg). LLS triangle: 75.68 deg, phi^(10/3) = 4.973 (phi per 108 deg). SSL triangle: 79.16 deg, phi^(5/2) = 3.330 (phi per 144 deg). Pentagon: 62.95 deg, phi^(20/3) = 24.73 (phi per 54 deg). His own nautilus measurements over 360 deg were 2.95, 3.02, 2.83 and 2.97 (mean 2.94; tangent about 80 deg). That is not the rectangle golden spiral. Closeness to the SSL spiral is called 'merely a coincidence'. A small change in tangent angle gives a large change in growth factor. The myth comes from a non-sequitur: shells are log spirals, phi can make a log spiral, so the nautilus must be golden.

**Why it matters here.** It gives the owner a legitimate menu of 'golden' growth rates, because the strict quarter-turn golden spiral is very open (6.85x per turn). It also kills the nautilus justification.

**Ideas to borrow:**

- Growth rule as 'phi per Theta', with Theta chosen from {54, 90, 108, 144, 180, 360} degrees. All of these are phi-derived, and Theta sets how tight the curl is. Derived figures: to grow 9x (Goldmann's volute span) takes 1.14 turns at phi per 90 deg, 1.83 turns at phi per 144 deg, and 2.28 turns at phi per 180 deg.
- Show the tangent (pitch) angle as a designer-facing number alongside the growth factor. Small changes in angle cause big changes in growth, so a slider in angle space gives finer control near tight curls.
- Don't call a nautilus-like spiral (about 3x per turn, roughly phi per 158 deg) golden in documentation.

**Evidence read.** Opened the HTML article and read the measurement section, the golden-section spiral table, and the discussion of why the error persists. A Falbo 1.24-1.43 figure appeared only in a search snippet and was not verified.

### 5. Ronald Hübner, 'Golden spiral or Fibonacci spiral: Which is more beautiful and why?' (2024)

<https://pmc.ncbi.nlm.nih.gov/articles/PMC11005508/> · paper · confidence: high · verified

**What it is.** An online forced-choice experiment (N = 106) comparing a true golden logarithmic spiral with its quarter-circle Fibonacci approximation, and an Archimedean spiral with Dürer's half-circle approximation.

**How it works.** Stimuli: a golden spiral (3.038 turns) versus a Fibonacci spiral of 11 quarter circles in Fibonacci squares (2.75 turns), and an Archimedean spiral (5 turns) versus a Dürer spiral of 10 half circles. Results: 79.2% preferred the golden spiral and 81.1% preferred the Archimedean. The parallel result supports the explanation: the originals have continuously changing curvature, while the approximations have constant curvature per arc with jumps at the joints. The author notes the differences are 'hardly visible', yet the preference is strong. He also says the Fibonacci spiral's beauty reputation rides on the phi 'beauty myth'. Limitations: only curvature continuity was tested, and originals were only compared with their own approximations.

**Why it matters here.** This is direct evidence that the engine's 'printed' quality depends on curvature-continuous primitives. The common designer shortcut, an Illustrator 'golden spiral' made of quarter circles, is measurably less preferred.

**Ideas to borrow:**

- Never ship quarter-circle (Fibonacci or compass) chains as final geometry. Use them only as construction guides. Render true log spirals approximated by cubic Beziers.
- Rendering rule from my own numeric check (Python, Hermite cubic per segment on a golden spiral): max deviation is about 1.2% of local radius at 90 deg per segment, 0.24% at 60 deg, 0.076% at 45 deg and 0.015% at 30 deg. Use 45 deg or less for screen work and 30 deg or less for print or zoom.
- Treat curvature continuity (G2) as a first-class validation check on every junction in the scene graph.

**Evidence read.** Opened the PMC full text (methods, results, discussion and limitations), and the Wikipedia Golden spiral page that summarises it. A 2025 follow-up in Scientific Reports on individual spiral preferences could not be opened (Nature login redirect, PMC captcha).

### 6. Renaissance compass volutes: Serlio, Salviati, Philandrier/Dürer (Andrey & Galli 2004), Goldmann's volute (Vollrath), and a programmatic re-implementation (Menezes Leitão)

<https://link.springer.com/content/pdf/10.1007/s00004-004-0017-4.pdf> · technique · confidence: high · verified

**What it is.** The classical straightedge-and-compass constructions for the Ionic volute, which reconstruct a vague passage in Vitruvius. Also a modern recursive code version of the same idea.

**How it works.** Andrey & Galli redrew Serlio, Salviati and Philandrier, then plotted the radius increments. Serlio's and Salviati's volutes are three truncated Archimedean spirals: the radius decrement is constant within each turn and changes between turns. Salviati diminishes by 1/2 unit per quarter turn in the first turn, 1/3 in the second and 1/6 in the third, and he remarked on the curvature discontinuities at the transitions. Philandrier adopted Dürer's point-by-point spiral, which they identify as points on a tangent-function curve joined by arcs. They conclude the methods were not attempts to approximate any known curve such as a log or golden spiral. Goldmann (Vollrath, JOS): eye radius r, 12 quarter circles centred on the corners of three nested squares (sides r/3, 2r/3, r). The first radius is 7/6 r and the last 51/6 r, with the outer point 9r from the eye centre. Radii grow by the distance between successive centres, giving an involute of nested squares, which is piecewise arithmetic. Leitão's Julia/Khepri book recasts a volute as 'an arc followed by a smaller spiral'. spiral(p, r, a, da, fa, f) draws an arc, then recurses with the centre moved by r(1-f) along the end direction and radius r*f, so arc endpoints stay G1. da = pi, pi/2 or pi/4 imitates Serlio, Salviati or Philandrier.

**Why it matters here.** Victorian engravers inherited these compass methods, not phi. Their logic of a polygon of centres, radii and arcs is a good mental model for designers, and a geometric reduction factor f per arc makes them approximate a log spiral. The curvature jumps are the weakness that Hübner's study measures.

**Ideas to borrow:**

- A 'compass spiral' construction primitive (arc centres on a polygon path, radius increment equal to the side length) used as a guide layer that designers recognise from architecture drawing. The engine then fits a G2 log spiral or log-aesthetic curve through the arc endpoints for the final stroke.
- Leitão's recursive signature (start point, radius, start angle, step angle, stop angle, reduction factor f) maps directly to a log spiral with f = e^(-b*da). For golden, f = 1/phi when da = 90 deg. Expose these exact parameters.
- Use the volute's double line (fillet or listel) as the model for bundles that converge into an eye: a second, phase-shifted spiral, not a constant offset.

**Evidence read.** Downloaded the Andrey & Galli Nexus 6(2) PDF and read its Salviati section, its Graph 1/2 analysis and its conclusions. The Vollrath PDF was saved by WebFetch and text-extracted; read the 'Goldmann's construction of a volute' section. Opened the Leitão Julia book page on the Ionic Order.

### 7. Vogel's sunflower model, the golden angle, the three-gap theorem and golden-ratio low-discrepancy sequences

<https://mathworld.wolfram.com/VogelSpiral.html> · technique · confidence: medium · verified

**What it is.** Geometric models for spreading many elements evenly. Vogel (1979): r_n = c*sqrt(n), theta_n = n*137.508 deg. The 1D form is the additive recurrence x_n = frac(x0 + n/phi).

**How it works.** Vogel's points lie on a Fermat spiral, and r proportional to sqrt(n) gives equal area per element. The golden angle is 360(1 - 1/phi) = 137.5078 deg = 2pi/phi^2. The pattern is described as highly sensitive to the angle, and ThatsMaths says one degree off 'breaks' it. Three-gap theorem: points at multiples of any angle around a circle have at most three distinct gaps, the largest being the sum of the other two. Phi's special status comes from being badly approximable, which gives the most uniform spacing (a Delone set), not fewer gap sizes. The golden-ratio additive recurrence has the lowest discrepancy of its kind. Thompson and ThatsMaths both stress the model is descriptive, not a biological explanation.

**Why it matters here.** This is the honest, mathematically grounded use of phi for 'clustered elements with a logical spread': stippling, beads, a rosette of many petals or dots, and choosing phases so repeated motifs never line up.

**Ideas to borrow:**

- A Vogel scatter operator for rosettes and medallion fills. Use the full-precision golden angle, because rounding errors accumulate as n times the error.
- A 1D golden sequence for 'irregular but even' placement along a curve (beads, dots, small leaves): t_n = frac(t0 + 0.6180339887*n) in arc-length parameter, sorted.
- Don't use golden-angle placement for small counts in a bilaterally symmetric frame. With few items the three-gap structure shows as visibly unequal gaps; use exact symmetric subdivision there.

**Evidence read.** Opened MathWorld (Vogel spiral), Wikipedia Golden angle, Wikipedia Three-gap theorem, Wikipedia Low-discrepancy sequence, and the ThatsMaths sunflower article. Vogel's original paper (Math. Biosci. 44:179-189, doi 10.1016/0025-5564(79)90080-4) is paywalled and was not opened. Martin Roberts' quasirandom article returned 404 or gzip errors and was not used.

### 8. Log-aesthetic curves (Harada; Miura; Yoshida & Saito), with the interactive G1/G2 Hermite method of Nagy, Yoshida & Hoffmann (2021)

<https://arxiv.org/abs/2105.09762> · paper · confidence: medium · verified

**What it is.** A one-parameter family of 'aesthetic' curves from Japanese industrial and automotive design. The log of radius of curvature against the log of arc-length increments (the logarithmic curvature graph, LCG) is a straight line with slope alpha.

**How it works.** Fundamental equation: log(rho * ds/drho) = alpha*log(rho) + c. Yoshida et al. give closed-form relations for radius of curvature against tangent angle and arc length: rho(s) = e^(Lambda*s) for alpha = 0, and rho(s) = (Lambda*alpha*s + 1)^(1/alpha) otherwise. Points come from integrating exp(i*theta(s)). Special cases: alpha = -1 is the clothoid (Euler spiral), alpha = 1 the logarithmic spiral, alpha = 2 the circle involute, and alpha = 0 Nielsen's spiral. The original Yoshida method takes two endpoints, tangents and alpha, but only produces monotone-curvature segments. Nagy et al. extend it to segments that can have an inflection or curvature extremum. The segment is defined by endpoints, a tangent vector at the first point and a tangent direction at the second. Alpha is derived from the length of the first tangent vector, which controls start curvature and allows G2 joins between segments. Known restrictions: some boundary conditions have no solution for a given alpha, and evaluation needs numerical integration. Levien's thesis names log-aesthetic curves as possibly better than Euler spirals for some applications.

**Why it matters here.** This unifies the owner's two curve wishes, 'sweeps' and 'curls', in one primitive. A golden curl is the alpha = 1 member, the easement into it is near alpha = -1, and alpha becomes a character dial for leaves and flames. Harada's reported link between LCG slope and impression (centripetal or sharp versus accelerating) gives designers a vocabulary.

**Ideas to borrow:**

- One 'aesthetic segment' primitive with parameters (P0, T0, P1, T1, alpha). Golden curls are alpha = 1 with the extra constraint b = 0.30635, so rho = b*s measured from the pole (my derivation from the log-spiral arc-length and curvature formulas on Wikipedia).
- Expose alpha as a 'character' slider for leaf blades and flame tongues, and keep alpha = 1 plus golden b for curls.
- G2 chaining: segments share endpoint curvature, so a leaf blade flows into its curl without a visible kink.

**Evidence read.** WebFetch saved the arXiv PDF and I extracted it with pdftotext. Read the abstract, the introduction (Harada, Miura and LCG definitions; Levien's remark) and Section 2 equations (2)-(6). Special-case slopes come from search snippets of Yoshida's notebook and an arXiv polar-LAC paper; the slope sign convention varies between papers.

### 9. Raph Levien: the Euler spiral history, 'From Spiral to Spline' (Spiro), and Euler-spiral parallel curves

<https://www2.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-162.html> · library · confidence: high · verified

**What it is.** A PhD thesis and open-source Spiro spline library (used in FontForge and as an Inkscape pen and path-effect mode). The designer places points on the curve and the engine computes a fair G2 or G4 curve built from Euler-spiral segments. A companion tech report covers the Euler spiral's history as the railway transition curve.

**How it works.** The Euler spiral has curvature linear in arc length. It was posed by Bernoulli, solved by Euler, and reinvented by Fresnel and by Talbot, whose 1890 railway transition spiral has 'degree-of-curve increasing directly as the distance'. The thesis shows that an extensional interpolating spline (adding an on-curve point doesn't change the shape) whose segments form a two-parameter family must cut every segment from one generating curve. The Euler spiral is a strong all-round choice, and it converts to cubic Beziers at interactive speed. Spiro point types (FontForge docs): G4 curve, G2 curve, corner, and left/right constraint points for line-to-curve transitions. Caveat: moving a point too far can make the solver fail into 'erratic spirals'. On parallel curves, a cusp appears where the offset equals the source's radius of curvature. Euler-spiral pieces have closed-form offset curvature, so cusps can be located and split before fitting.

**Why it matters here.** This is the best precedent for making mathematically fair curves designable by someone used to Illustrator: on-curve points plus typed constraints instead of Bezier handles. The railway transition is the right model for where the straight side ribbons enter the corner scrolls.

**Ideas to borrow:**

- Ribbon-to-curl 'easement': join a straight band (kappa = 0) to a golden curl of entry curvature kappa0 with an Euler-spiral segment whose curvature ramps linearly from 0 to kappa0, as in a railway transition spiral.
- Author the dominant curves as Spiro-like on-curve points with typed nodes (G2 curve, corner, line-to-curve constraint). Then add special nodes such as 'golden-curl start' that lock the remainder of the curve to an exact golden spiral.
- Offset rule for clustered lines: an inner parallel at distance d cusps where rho = d. On a golden spiral rho = b*s from the pole, so an inside offset must end before arc length s = d/b, about 3.26d from the pole (where local r is about 0.956d). After that, switch to a phase-rotated spiral.

**Evidence read.** Opened the EECS-2009-162 abstract page. Downloaded and text-extracted the EECS-2008-111 Euler-spiral history PDF and read the abstract and the Talbot and spline sections. Opened the FontForge Spiro editing page and Levien's raphlinus.github.io parallel-curves post. Inkscape Spiro mode details come from search snippets of Inkscape forum and mailing-list posts.

### 10. B. de Smit & H. W. Lenstra Jr., 'The Mathematical Structure of Escher's Print Gallery' (Notices AMS, 2003)

<https://pub.math.leidenuniv.nl/~smitbde/papers/2003-de_smit-lenstra-escher.pdf> · paper · confidence: high · verified

**What it is.** An analysis of how Escher's self-similar, spiralling lithograph can be produced by complex logarithm and exponential maps, and a reconstruction of the conformal grid Escher was trying to draw.

**How it works.** A picture invariant under scaling (a 'cyclic expansion' by 256x per cycle in Escher's straight study) becomes periodic when pulled back by the exponential map. A conformal map h(w) = w^gamma = exp(gamma*log w) turns the straight version into the curved one. The resulting image contains a copy of itself rotated by 157.6 deg and scaled down by 22.58x. Conformality means small squares stay square, so local motifs are only rotated and scaled, never sheared.

**Why it matters here.** It shows how to make 'everything relative to a dominant spiral' authorable. The designer draws a straight strip of repeated motifs, and the engine wraps it into a golden scroll. Every motif becomes an exactly similar, geometrically diminishing copy, the gnomon property, automatically.

**Ideas to borrow:**

- A 'spiral strip' layout. Author in w-space, a flat band with motifs repeated at a fixed spacing along the direction (b + i). Map with z = O + exp(w). Straight lines along that direction become golden spirals (exp(ln a + (b+i)t) = a*e^{bt}*e^{it}), and translation by (b+i)*delta becomes the spiral similarity z -> e^{(b+i)delta}*z.
- Because the map is conformal, leaf angles and tangent junctions drawn in the flat strip are preserved in the scroll, which preserves Owen-Jones-style tangential junctions.
- Keep motifs small relative to the local radius and stop before the pole, which is a singularity. Larger motifs show a natural-looking taper (the far side grows faster).

**Evidence read.** Downloaded the 6-page PDF and text-extracted it. Read the passages on cyclic expansion, the exponential map and period lattice, the conformal grid, and the 157.6 deg / 22.58x result.

### 11. Victorian design grammar: Owen Jones, The Grammar of Ornament (1856), Propositions 8-13, and Christopher Dresser, Principles of Decorative Design (1873)

<https://www.gutenberg.org/ebooks/39749> · book · confidence: medium · verified

**What it is.** Rules for ornament written by the period designers whose aesthetic the site imitates.

**How it works.** Jones, as summarised on readingdesign.org: Prop 8, ornament on a geometric construction. Prop 9, definite proportions on a simple unit, with subtle ratios such as 5:8 preferred to 4:8. Prop 10, balance of straight, inclined and curved lines. Prop 11, every line grows from a parent stem, and every ornament however distant can be traced to its branch and root. Prop 12, junctions of curves with curves or straights should be tangential. Prop 13, conventionalise natural forms rather than copying them. Dresser (primary text): curves are beautiful in proportion to their subtlety, and the arc is the least beautiful because its single centre is instantly detected. Ellipse and egg curves drawn with string or trammel beat compass arcs. Proportion should be subtle: 1:1 and 2:1 are bad, while 3:8, 5:8 and 5:13 are good, because pleasure grows with the difficulty of detecting the ratio. Order and orderly repetition are principles of ornament. He also praises the nautilus for 'following... a particular geometrical curve with rigid precision', which is the Victorian intuition behind the owner's request.

**Why it matters here.** The owner's 'dominant functions with dependent elements' is Jones's Prop 11, and 'leaf integrated into the sweep' is Prop 12. Dresser's arc critique anticipates Hübner's curvature result. Dresser also frames Fibonacci ratios as subtle rather than mystical, which is the honest framing.

**Ideas to borrow:**

- Scene-graph rule: every element must declare a parent curve and an attachment parameter (t or arc length). Orphan strokes fail validation (Prop 11).
- Junction validator: G1 is required (Prop 12) and G2 is preferred (Hübner, Dresser).
- Proportion palette for crest and cartouche subdivisions from Fibonacci fractions (3:5, 5:8, 8:13, 5:13). These sit within Markowsky's tolerance of phi but read as deliberate integers.
- No compass-arc primitives in final output. Arcs are construction-only, in line with Dresser's ranking.

**Evidence read.** Downloaded the Dresser Gutenberg text (#39749) and read the 'Curves will be found to be beautiful...' and 'Proportion... subtle' passages and the nautilus passage. Owen Jones propositions come from the readingdesign.org page via WebFetch summary. I did not read a primary scan of Jones, though a Wisconsin digital-copy snippet confirms the 'parent stem' and 'tangential curvature' wording.

### 12. Proportional scales as designer tools: Tim Brown's modular scale (A List Apart, 2011) and Le Corbusier's Modulor

<https://alistapart.com/article/more-meaningful-typography/> · technique · confidence: medium · verified

**What it is.** Two precedents for giving designers a discrete palette of phi-derived values instead of asking them to compute ratios.

**How it works.** Modular scale: choose a ratio (for example phi) and a base, then multiply and divide to get a sequence (10 gives 16.18, 26.18, 6.18, 3.82). A double-stranded scale interleaves two bases or ratios to fill gaps. Designers pick values from the scale for sizes, measures and margins, round them, combine them, or break from the scale, recording the derivation with 'comment math'. Brown calls scales 'a tool, not magic'. Modulor: red and blue series built by golden division from navel height (1.13 m) and raised-arm height (2.26 m) of a 1.83 m man, rounded to round numbers. It governed the dimensions of the Unité d'Habitation and La Tourette. Its human basis was revised for cultural rather than measured reasons.

**Why it matters here.** This is the realistic workflow answer to 'how do I design inside phi constraints'. Offer a palette of snapped values and log the deviations, rather than demanding the designer compute.

**Ideas to borrow:**

- Design tokens: a phi-scale of stroke gaps, leaf sizes and band widths (base times phi^(k/n), with n = 1, 2 or 3 for finer steps) exported to Illustrator as a swatch-like reference sheet and to the engine as named constants.
- 'Comment math' in the engine: any hand-entered value that is off-scale must carry a reason string. The deviation report shows it.
- Double-stranded scales (phi steps from two bases) give enough choices to avoid the designer fighting the system.

**Evidence read.** Opened the A List Apart article and the Wikipedia Modulor page.

### 13. Harriss spiral (Edmund Harriss; Chalkdust magazine)

<https://chalkdustmagazine.com/regulars/on-the-cover/on-the-cover-harriss-spiral/> · technique · confidence: medium · verified

**What it is.** A branching analogue of the golden-rectangle spiral. A rectangle in the plastic ratio (about 1.3247, root of x^3 = x + 1) splits into one square and two similar rectangles, and arcs drawn in the squares line up into a tree of spirals.

**How it works.** The golden rectangle splits into a square plus one similar rectangle, giving a single spiral chain. The plastic rectangle splits into a square plus two similar rectangles, so recursion branches. Two arcs are drawn per square and chosen to meet the arcs in the sub-rectangles. The page does not give the exact radii or centres.

**Why it matters here.** Acanthus scrolls branch: side scrolls spring from the main stem. This is the cleanest known self-similar branching-spiral construction. It is not golden, which matters if the owner wants strict phi.

**Ideas to borrow:**

- A recursive 'rectangle-split' layout generator (ratio as a parameter) to place where secondary scrolls branch off a dominant scroll, each branch a similar copy.
- Use it as a guide layer, then refit the arcs as G2 curves (same curvature-jump caveat as Fibonacci arcs).

**Evidence read.** Opened the Chalkdust 'On the cover: Harriss spiral' page. Background on Harriss and a 2023 Bridges integer variant came from search snippets only.

## Principles

- **Construction (a): to make the curve through a set of leaf tips a golden spiral, generate the leaves by one repeated spiral similarity about a pole. Do not place the tips by hand.**
  - Source: Thompson, On Growth and Form (gnomon propositions); Wikipedia Spiral similarity (complex form T(x) = x0 + alpha(x - x0)); Golden spiral page (b = ln(phi)/(pi/2))
  - Apply: In complex coordinates choose the pole O, master leaf L0 (with anchors base0 and tip0), angular step dTheta (for example 45 deg) and growth rule 'phi per Theta' (Theta = 90 deg for strict golden). Set c = phi^(dTheta/Theta) * e^(+/- i*dTheta) and L_k = O + c^k (L0 - O). At 45 deg the leaf sizes go 1, 1.272, 1.618, 2.058, 2.618. If the designer instead draws two leaves, compute the transform from corresponding anchors: alpha = (tip1 - base1)/(tip0 - base0) and O = (base0*tip1 - tip0*base1)/(base0 + tip1 - tip0 - base1). Then snap |alpha| to phi^(arg(alpha)/Theta). For traced art with named tip anchors, fit a log spiral: for a candidate O, regress ln|z_k - O| on unwrapped angle theta_k, and minimise the residual over O (2D search). Report b against 0.30635 and per-tip residuals in px, and offer 'snap' (keep O and the fitted angles, set b to golden).
- **Construction (b): make each leaf's curl an exact golden spiral that joins its incoming stroke with matching tangent and curvature (G2), so it reads as one sweep.**
  - Source: Logarithmic spiral formulas (Wikipedia: kappa = 1/(r*sqrt(1+k^2)), arc length (r2 - r1)/sin(alpha)); Levien (Euler-spiral easement, G2 Spiro points); Hübner (curvature continuity)
  - Apply: Inputs: entry point P, forward tangent T (direction toward the eye), and entry curvature kappa0, taken from the incoming blade or stem curve. With golden b = 0.30635, the pole lies 72.97 deg off the forward tangent, on the inside of the turn, at distance r0 = cos(17.03 deg)/kappa0 = 0.9562/kappa0. The radius then shrinks by exactly phi every quarter turn. Stop at eye radius r_e after ln(r0/r_e)/b radians. Total length from entry to the pole is rho0/b, about 3.26 times the entry radius of curvature. If the incoming stroke is straight, insert an Euler-spiral easement whose curvature ramps 0 to kappa0. Use the same b and the same r_e/r0 on every curl so all curls are similar copies.
- **Construction (c): spread clustered lines by one of four rules chosen by context, never by eye.**
  - Source: Andrey & Galli (volute fillets), Levien (offset cusps), Markowsky and Dresser (subtle ratios), Vogel and golden-angle sources, Wikipedia low-discrepancy sequence
  - Apply: (1) Near a spiral eye, use phase-rotated copies of the dominant spiral: line_j = O + e^{-(b+i)*j*delta}(S - O). Gaps then stay a constant fraction of radius and converge into the eye with no cusps. Pick delta = -ln(1 - g/R)/b for gap g at radius R. (2) Along ribbons and straight-ish sweeps, use true constant offsets (engraved hatching look). Stop each inside offset d where local radius of curvature reaches d. (3) For lines converging to an edge, use geometric gaps g_j = g0*q^j with q = phi^(-1/n), n in {1,2,3}. Total width is g0/(1-q), which is phi^2*g0 for q = 1/phi. Truncate when a gap would fall below the minimum printable gap. (4) For many-element organic clusters (stipple, rosettes), use Vogel r = c*sqrt(n), theta = n*137.50776 deg, or the 1D sequence frac(t0 + 0.618034n) along arc length. Use Fibonacci counts (3, 5, 8) for the number of lines per cluster.
- **Exact repetition under one transform plus curvature continuity is what reads as 'printed'. Phi exactness does not.**
  - Source: Hübner 2024; Markowsky 1992; Dresser 1873
  - Apply: Treat G2 junctions and shared growth factors as hard engine constraints. Treat the specific value phi as a default parameter checked within +/-2%. Ship true log spirals and Euler or log-aesthetic segments, approximated by cubic Beziers of 45 deg or less (30 deg or less for print); Fibonacci or compass arc chains are guides only.
- **Every element is a child of a dominant curve and joins it tangentially.**
  - Source: Owen Jones, Grammar of Ornament, Props 11-12; Spiro constraint points (Levien/FontForge)
  - Apply: Scene graph: each node stores (parent curve id, attachment arc-length or t, local frame from the parent's tangent and normal, continuity requirement). Validation fails for orphans or G0-only joins. Moving a dominant curve re-evaluates all dependents, which is how the frame adapts to page size.
- **'Golden' is a family of growth rates. Pick the tightness, keep the derivation.**
  - Source: Sharp 2002 (rectangle, LLS, SSL and pentagon golden spirals)
  - Apply: Growth parameter 'phi per Theta' with Theta in {54, 90, 108, 144, 180, 360} degrees: 24.7x, 6.85x, 4.97x, 3.33x, 2.62x and 1.62x per turn. Use 90 deg for open sweeps such as the flame envelope, and 144-180 deg for multi-turn curls and volutes. A classical volute's 9x over 3 turns averages about phi per 236 deg, which is my derived figure.
- **Author flat, wrap conformally.**
  - Source: de Smit & Lenstra 2003; Thompson Ch. XVII (coordinate transformations)
  - Apply: Let the designer draw a straight repeating strip of leaves in a unit grid, then map it with z = O + exp(w) along direction (b+i) to get a golden scroll. Conformality preserves the drawn angles and tangent junctions, and every repeat becomes an exact similar copy.
- **Use phi as a coordinating palette with logged deviations, not as a mandate.**
  - Source: Tim Brown modular scale; Modulor; Cook's deviation thesis
  - Apply: Expose design tokens on a phi-scale (base*phi^(k/n)). Allow off-scale values only with a recorded reason, and generate a deviation report per artwork (element, target, actual, percent, px).
- **Give the curve a 'character' parameter rather than many handles.**
  - Source: Log-aesthetic curves (Harada; Miura; Yoshida & Saito; Nagy et al. 2021)
  - Apply: A segment primitive (P0, T0, P1, T1, alpha): alpha = 1 for golden curls (with b locked), around -1 for easements and sweeps, and tuned for leaf blades and flame tongues. Join segments with G2 by matching endpoint curvature.

## Cautions

- Nautilus shells are log spirals but not golden ones. Sharp measured about 2.94x per turn against 6.85x for the golden spiral. Don't justify the engine with nature claims; justify it with self-similarity and consistency.
- Classical Ionic volutes (Serlio, Salviati, Goldmann) are compass-built, piecewise-Archimedean arc chains with acknowledged curvature jumps, not golden spirals (Andrey & Galli). 'The volute is golden' is a myth. Victorian engravers used compass and machine constructions, not phi.
- Phi precision is perceptually invisible within a few percent. Markowsky: people can't tell rectangles between 1.6 and 1.7 apart. McManus et al. 2010 (from secondary summaries): group preference for the golden rectangle is weak, while individual preferences are strong and highly variable. Don't promise viewers will 'feel' phi.
- The strict quarter-turn golden spiral is very open (6.85x per turn). Getting 9x radius change takes only about 1.14 turns, so forcing it onto a multi-turn curl gives a tiny eye or a huge outer whorl. Use a slower phi-derived growth (phi per 144-180 deg) or accept a non-golden b.
- Quarter-circle 'golden spiral' templates, including Illustrator overlays, are Fibonacci spirals. Their curvature jumps by a factor of phi at every joint, and Hübner found them less preferred (about 21% vs 79%). Never let them leak into final geometry.
- Thompson: log spirals belong to accretive growth. Forcing whole leaf outlines or blade margins onto spirals will look mechanical in the wrong way. Constrain tips, stems and curls, not every contour.
- Inner offsets of a spiral cusp where the offset distance equals the local radius of curvature (on a golden spiral, once local r is below about 0.96 times the offset). Bundles must switch to phase-rotated spirals or terminate before the eye.
- Phi-geometric spacing decays fast. With q = 1/phi the 6th gap is 9% of the first, which collides with hairline widths and causes moire or aliasing on screen. Use phi^(-1/2) or phi^(-1/3) steps, cap line counts, and enforce a minimum device-pixel gap that is recomputed on resize.
- Golden-angle and Vogel placement is very sensitive to the angle (one degree off breaks the pattern), and it looks irregular with small counts (three-gap theorem). It suits stipple and rosettes, not a symmetric banknote-style frame that needs mirror symmetry.
- Over-constraining kills designability. Spiro solvers can blow up into 'erratic spirals' when points move far, and log-aesthetic Hermite problems have no solution for some boundary conditions and need numerical integration. The engine needs graceful fallbacks, clamping and undo, plus explicit override slots (Cook, Brown).
- Conformal exp wrapping has a singular pole and scales motifs non-uniformly across their extent. Keep motifs small relative to local radius and stop before the eye.
- The Harriss branching spiral uses the plastic ratio (about 1.3247), not phi. If the owner insists on 'everything golden', a branching scroll construction will need a different rule.
- Some sources were only partially verified: Vogel's original paper is paywalled; Owen Jones' propositions come from a secondary summary; log-aesthetic special-case slope conventions differ between papers; and a 2025 Scientific Reports follow-up on spiral preference could not be opened.
