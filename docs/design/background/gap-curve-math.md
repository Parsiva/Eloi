# Gap study: curve-math

> Background for [the frame engine design](../frame-engine.md).

## Summary

Practical TypeScript curve kernel for the frame engine. I read primary sources: Levien's blog posts, the kurbo source, libspiro, spiro-js, Levien's own JS research code, Bertolazzi and Frego, the Cephes Fresnel code via stdlib, the log-aesthetic curve (LAC) paper, Wikipedia geometry pages, npm metadata and Iosevka's source. I also ran scratch measurements on the curve sizes from 07-drawing-analysis.md.

1. Define every curve family intrinsically, as tangent angle theta(s) and curvature kappa(s) over its own arc length. Arc length then comes for free, G2 at a join is a simple comparison of (x, y, theta, kappa), and one evaluator covers line, arc, clothoid, log spiral and LAC.
2. Clothoids do not need Fresnel integrals. Composite 16-point Gauss-Legendre is accurate to about 1e-9 of the length on a single piece that turns pi radians, and about 1e-13 with two pieces. It needs no special case when kappa1 = 0, at inflections or near circles, which is exactly where the Fresnel completing-the-square form loses precision. Log spirals have closed forms and need no quadrature.
3. For knot-drawn dominant sweeps, the npm package `spiro` (be5invis/spiro-js) is the realistic choice. It is Apache-2.0 or MIT, written in TypeScript, and the Iosevka typeface depends on it. It has two traps. It returns no convergence status. Its default Bezier output (subdivide to 1 rad of bend, arms = L/3) is off by about 0.26% of the radius, roughly 0.2u on the medallion ring.
4. Converting to Bezier is cheap if handles are chosen well. Arms = L/3 is 50 to 9000 times worse than the arc-correct rule. With equal-turn subdivision and arms = chord/(3cos^2(dtheta/4)), I measured 2-3 cubics for the 54-degree clothoid limb, 2-3 for the 170-degree ring, 6-8 per golden-spiral turn and 10-13 for a 2.5-turn volute, at 0.05u to 0.01u. The gold standard is kurbo's area-and-moment quartic fit (O(n^6)), which has no npm or WASM build. Port fit.rs and its solvers (Apache-2.0 or MIT) later.
5. Avoid cusps by construction: an offset d needs |d| < R_min on the concave side. Offset arc length is L + d*dtheta. Weave strands need A < R_min of the spine and a ribbon half-width h < lambda^2/(4 pi^2 A). Nested lines around spiral eyes should be rotated copies of the spiral about its pole, which never cross and space geometrically, not parallel offsets. Variable-width outlines are p ± w(s)n with w*kappa < 1. Fill them nonzero, as Levien and Uguray do. Do not use perfect-freehand for exact work.
6. Hobby is a preview and fallback only. Superellipses (Knuth's 8-knot construction, superness s = 2^(-1/n)) suit cartouche and jewel outlines and join straight sides with G2. Two-point G1 clothoids come from Bertolazzi and Frego's Newton method (at most 5 iterations). G2 two-point data needs 3 clothoids.

## Findings

### 1. Euler-spiral/clothoid evaluation: Levien's polynomial integrator (JS, Apache-2.0/MIT) and libspiro's version

<https://github.com/raphlinus/spline-research/blob/master/spiro.js>

**Facts.** Levien's spline-research/spiro.js (header: Copyright 2018 Raph Levien, Apache-2.0 or MIT) has integ_spiro(k0,k1,k2,k3), commented 'tuned to give an accuracy within 1e-9'. It uses a single order-12 Taylor expansion when 0.2*k0^2 + |k1| < 1, otherwise the same expansion over 4 sub-intervals. The curve is normalised to arc length 1 over [-0.5, 0.5], with k0 = total turning and k1 = curvature slope. libspiro (FontForge fork, GPL-3.0-or-later) uses ORDER 12 and N_IS 4 in integrate_spiro. spiro-js's integrate_spiro is the same order-12, N=4 code. All three avoid Fresnel functions entirely.

**Use for the engine.** Optional fast path for clothoid points: port integ_spiro (about 100 lines, permissive licence) from Levien's repo, not from GPL libspiro. Use it in a chord-normalised frame, with subdivision when the turning is large.

### 2. Fresnel integrals (Cephes via @stdlib) and why completing the square is fragile

<https://github.com/stdlib-js/math-base-special-fresnel>

**Facts.** @stdlib/math-base-special-fresnel 0.3.1 (Apache-2.0, published 2026-02-08) is a port of Cephes fresnl. It uses rational power series for x^2 < 2.5625, auxiliary f/g asymptotic rational functions above that, and returns 0.5 for |x| > 36974. The stated relative error on [0,10] over 10,000 trials is peak 2.0e-15 for S and 1.8e-15 for C (rms 3.2e-16 and 3.3e-16). Bertolazzi and Frego (arXiv 1305.6644) say the generalised Fresnel integrals X_k(a,b), Y_k(a,b) are 'inaccurate when |a| is small' because z appears in denominators. They switch to series below a threshold: for |a| < 1e-4 with p=2 the error is below 6.26e-18, and with p=3 below 1.6e-26. The (a,b) form used in their paper is the clothoid's own quadratic angle function, so a small a is the near-straight or near-circle case.

**Use for the engine.** Do not make standard Fresnel C/S the main clothoid evaluator: the medallion limbs pass through kappa1 ≈ 0 regions and inflections. If closed-form Fresnel is ever wanted, use the Cephes rational approximations with a small-|a| series fallback.

### 3. Measured: composite Gauss-Legendre quadrature as the universal intrinsic-curve evaluator (my scratch test)

**Facts.** Integrating (cos theta(s), sin theta(s)) against a 20,000-piece reference, on unit length. Clothoid turning pi rad (kappa 0 to 2pi): 16-point GL on 1 piece gives error 1.4e-9; 2 pieces 7.5e-14; the 8-point rule needs 4 pieces for 1.2e-8. S-clothoid with kappa -6..6: 16-point gives 1.5e-8 on 1 piece and 1.3e-12 on 2. Golden log spiral over 2 turns with uniform pieces converges slowly because of the pole-side growth: 16-point with 8 pieces gives 1.6e-6. Script: (local scratch file)

**Use for the engine.** One evaluator for clothoids and LACs: composite 16-point Gauss-Legendre on sub-pieces each turning at most pi/2, with cumulative positions cached per piece. It needs no branch for kappa1 = 0, kappa = 0 or inflections. Log spirals use closed forms instead.

### 4. G1 clothoid between two posed points: Bertolazzi and Frego (arXiv 1305.6644; Clothoids C++ library, BSD-2-Clause)

<https://arxiv.org/abs/1305.6644>

**Facts.** The method reduces the 3-equation system to the zero of one function g(A) = Y(2A, delta - A, phi0). The paper proves an interval where the zero exists and is unique. The simple guess is A ≈ 3(phi0 + phi1); better least-squares guesses (20a/20b) are tabulated. Table I buildClothoid is about 8 lines. On a 1024x1024 grid of angles with tolerance 1e-10, guess (19) took at most 5 Newton iterations (63% took 4), and guess (20b) took 3 iterations in 96.6% of cases. The reference implementation is github.com/ebertolazzi/Clothoids (C++, BSD 2-clause licence text, pushed 2026-10-01), which also offers G2 clothoid splines, biarcs, point-clothoid distance and intersections. Their JCAM 2018 paper proves that G2 Hermite data cannot always be met by one clothoid, nor by two. The general scheme uses three arcs (8 equations in 10 unknowns, reduced to 2), and in their tests it always converged within 5 Newton iterations.

**Use for the engine.** Port buildClothoid (Newton plus guess (20b)) for one-clothoid G1 connectors, such as stem to anchor with fixed tangents, evaluating X and Y with the Gauss-Legendre integrator instead of Fresnel moments. Use 3-clothoid G2 Hermite (https://iris.unitn.it/handle/11572/210452) only when an exact curvature hand-off at both ends is required.

### 5. Levien's JS fit_euler / EulerSegment (G1 Euler spiral from end angles)

<https://raphlinus.github.io/curves/2019/05/10/spline-licensing-update.html>

**Facts.** In spline-research/spiro.js, fit_euler(th0, th1) finds k0 and k1 of an Euler spiral whose chord is (0,0)-(1,0) with the given end tangent angles. It runs a secant iteration for at most 10 steps to |error| < 1e-9 and throws 'fit_euler diverges' otherwise. EulerSegment exposes th(t), xy(t) and kEndpoints() (end curvatures scaled by the chord). The repo was relicensed from GPL to Apache-2.0 and MIT in May 2019 (Levien, 'An update on spline licensing'). It is research code, last pushed in 2020.

**Use for the engine.** A permissively licensed, compact alternative to Bertolazzi-Frego for G1 clothoid segments in a chord-normalised frame. Catch the throw and fall back to an arc or Hobby piece.

### 6. Spiro (Euler-spiral G2 splines through on-curve knots) in TS: npm `spiro` (be5invis/spiro-js)

<https://github.com/be5invis/spiro-js>

**Facts.** Version 3.0.1, published 2024-04-02, Apache-2.0 OR MIT, written in TypeScript, 43 KB unpacked, depends only on tslib. Point types are 'corner' | 'open' | 'open_end' | 'left' | 'right' | 'g2' | 'g4'. The API includes spiroToBezier, spiroToBezierOnContext and spiroToArcsOnContext, the last returning SpiroArc objects with eval/derivative. Iosevka's @iosevka/geometry depends on 'spiro': '^3.0.1'. Source details that matter: solve_spiro loops at most 10 Newton iterations, breaks at norm < 1e-12, and always returns 0, so no convergence flag reaches the caller. Bezier output uniformly subdivides each arc until every part has bend ≤ delta (default 1 rad, up to 32 parts), then uses arms = derivative/3. By comparison, libspiro (GPL-3.0) iterates up to 60 times, reports convergence and uses the same arm rule. Levien lists Spiro's real failure modes ('A new spline', 2018): non-unique solutions, failure to converge with 'wild patterns', loop reversal at cusps, and confusing one-way constraints.

**Use for the engine.** Use for knot-drawn dominant curves: medallion S-sweeps, ribbon centrelines. Prefer spiroToArcsOnContext and feed the arcs to the engine's own fitter, or pass delta ≈ 0.25 rad. Wrap every solve with a residual or sanity check (NaN, bend > pi, end-tangent mismatch) and fall back to Hobby or the last good solution while dragging.

### 7. Iosevka's spiro-based stroke expansion (a shipped precedent)

<https://github.com/be5invis/Iosevka/blob/main/packages/geometry/src/spiro-expand.mjs>

**Facts.** @iosevka/geometry/src/spiro-expand.mjs builds a BiKnot per centreline knot with left and right widths d1 and d2. expand() places lhs = knot + d1·normal and rhs = knot - d2·normal using the knot's tangent normal (with a contrast factor). iterateNormals() re-solves Spiro through the midpoints of the lhs and rhs points to refine the normals. 'Unimportant' knots are interpolated. The package also exports spiro-pen-expand. Iosevka is a whole typeface generated this way in JS.

**Use for the engine.** A cheap way to turn a spine into variable-width outlines: offset the knots, not the curve, and re-solve. Good for ribbons and leaf blades with smooth widths. It is approximate and has no cusp handling, so keep width < radius of curvature.

### 8. Measured: cubic handle rule for arcs; why arms = L/3 (Spiro's default) is a trap

<https://spencermortensen.com/articles/bezier-circle/>

**Facts.** Maximum radial error per unit radius, arms = L/3 versus arms = (4/3)tan(theta/4): 90° 1.52e-2 vs 2.73e-4; 57.3° (1 rad) 2.56e-3 vs 1.81e-5; 28.6° 1.62e-4 vs 2.83e-7; 14.3° 1.02e-5 vs 4.42e-9. Arms = L/3 converges as O(theta^4); the tangent rule as O(theta^6). At Spiro's default 1 rad bend on the medallion ring (R ≈ 86u) the L/3 rule errs by about 0.22u, comparable to the 0.5-1u stroke width. Mortensen reports that a minimax-optimised quarter circle is 'five times better' than the standard constant; the page's constants could not be extracted as text. The general form of the tangent rule is arm = chord/(3cos^2(dtheta/4)), which is exact for circles. Script: .../scratchpad/exp/arcerr.mjs

**Use for the engine.** Emit exact circles with the SVG A command. Inside fitted outlines, use 4/3·tan(dtheta/4)·R with dtheta ≤ 60-90°. Never use derivative/3 handles on bends larger than about 0.25 rad.

### 9. Measured: how many cubics each ornament family needs (sizes from 07-drawing-analysis)

**Facts.** Counts at tolerances 0.05u / 0.01u. Ring arc (170°, R 85.8): L/3 arms 5/7; best G1 arms 2/3; arc-rule with equal-turn pieces 2/3. Clothoid limb (135u, kappa 0 to 0.0139, 54°): 3/4; 2/3; 2/3. Golden spiral (1 turn, r ≤ 45, 131.2u long): L/3 with equal-length pieces 13/20 and with equal-turn pieces 8/11; best arms (equal length) 5/8; arc-rule (equal turn) 6/8. Volute (b = 0.15, 2.5 turns, r ≤ 20): L/3 32/50 or 16/24; best 15/20; arc-rule 10/13. Single-segment error on the clothoid limb, whole limb: L/3 0.584u vs best arms 0.0745u. Verified separately that 1 golden turn ending at r = 45 gives chord 38.4346 = 45(1 - phi^-4), with growth per turn 6.8541 = phi^4 and pitch 17.0324°. These come from a crude grid optimiser and sampled maximum distance, so treat them as order-of-magnitude. Scripts: .../scratchpad/exp/fitexp.mjs, fitexp2.mjs, chk.mjs

**Use for the engine.** SVG output stays tiny: tens of cubics per stroke. Equal-turn subdivision matters for spirals, and the handle rule matters more than the count. A phase-1 fitter (equal-turn split, arc-corrected arms, sampled error check) is good enough before porting kurbo.

### 10. Cubic Bezier fitting with error bounds: Levien 2021 + kurbo fit.rs (Apache-2.0 OR MIT)

<https://github.com/linebender/kurbo/blob/main/kurbo/src/fit.rs>

**Facts.** Method: G1 fit with fixed endpoints and end tangents. The two arm lengths are chosen so the signed area, (3/20)(2d0 sin th0 + 2d1 sin th1 - d0 d1 sin(th0+th1)), and the x-moment match the source. This reduces to a quartic. The error is O(n^6): halving cuts error 64x. C-shaped sources usually give 3 similar candidates, and the 4th root is a looping 'nemesis' to exclude. kurbo's ParamCurveFit trait has three methods: sample_pt_tangent(t, sign), sample_pt_deriv(t), and break_cusp(range). Moments come from 16-point Gauss-Legendre with Green's theorem. Error is estimated from N_SAMPLE = 20 samples as an approximation to the Fréchet distance, with an arc-length mode for 'spicy' curves; the docs say this is not a rigorous guarantee. fit_to_bezpath halves adaptively, giving about 1.5x the optimal count. fit_to_bezpath_opt is near-optimal and about 50x slower. A long-arm 'bump' penalty applies (elbow 0.65, slope 2.0), and try_fit_line handles tiny chords and cusps. kurbo 0.13.1, repo pushed 2026-10-08. I found no official npm or WASM build. Simplification example (Levien 2023): tolerance 0.15 gives 44 segments, 0.05 gives 60 and 0.01 gives 90.

**Use for the engine.** Phase 2: port fit.rs plus common.rs (solve_quartic per Orellana-De Michele, solve_cubic, solve_quadratic, ITP, Gauss-Legendre tables) to TS behind a Fittable {sample(t) → point and derivative; cusp?(range)} interface. Use it for all analytic families, offsets, weaves and outlines, and to simplify imported Illustrator paths. Blog: https://raphlinus.github.io/curves/2021/03/11/bezier-fitting.html

### 11. Parallel curves (offsets) and cusps: Levien 2022, Wikipedia Parallel curve

<https://raphlinus.github.io/curves/2022/09/09/parallel-beziers.html>

**Facts.** The exact offset of a cubic Bezier is an algebraic curve of degree 10, and offsets of a degree-n Bezier have degree 4n-2. Offset curvature is k_d = k/(1 + dk), so R_d = R + d, and cusps appear where the distance equals the radius of curvature. Levien's offset fit uses area/moment plus a quartic and is O(n^6). The O(n^6) area/moment fit runs in about 12 µs per segment in JS (M1 Max, Chrome). Tiller-Hanson is only O(n^2), an earlier Euler-spiral method O(n^4) and shape control O(n^5). One cubic can have four cusps. He notes JS lacks fma, which makes the quartic solver less accurate than in Rust, and that missing a cusp is a risk. Derived from R_d = R + d with a shared tangent angle: the offset arc length is L_d = L + d·dtheta wherever 1 + d·kappa > 0.

**Use for the engine.** Offset analytic spines, never Bezier output. Validate |d| < R_min (concave side) per piece, using closed-form R_min: circle R, clothoid at its high-curvature end, log spiral b·s_min. Trim or stop lines where this fails, the d_stop idea. Offset arc length is closed form, so stations on offset lines are free. Wikipedia: https://en.wikipedia.org/wiki/Parallel_curve

### 12. Euler-spiral parallels and GPU stroke expansion: Levien 2021, Levien and Uguray 2024

<https://arxiv.org/html/2405.00127>

**Facts.** The parallel curve of an Euler spiral has curvature kappa(s) = c/sqrt(s - s0) + 1/l, with c = a/sqrt(2 l^3) and s0 = -a^2/(2l) (Wieleitner 1906), and at most one cusp per segment. The Euler-to-cubic 'parabola rule' has 5th-power error scaling. A polynomial Hermite approximation takes about 7 ns versus 240 ns for the secant method. In the 2024 paper (arXiv 2405.00127), cubics become Euler spirals with empirically fitted error estimates (mean estimate/true ratio 1.656), and halving reduces the fit error 32x. Output is an unordered line soup, not a simple polygon; evolute segments are emitted twice so nonzero winding renders correctly. Experiments use a 0.25 device-pixel tolerance. Several constants are empirical, and no code licence is stated in the text.

**Use for the engine.** Two lessons transfer to SVG. (1) Clothoid spines make offsets and curvature combs cheap and cusp-predictable. (2) Strokes can be filled nonzero without boolean unions, if inner loops are avoided by the width < R rule or handled. The GPU line-soup pipeline itself is not needed. Blog: https://raphlinus.github.io/curves/2021/02/19/parallel-curves.html

### 13. Logarithmic spiral: exact formulas and the golden case

<https://en.wikipedia.org/wiki/Logarithmic_spiral>

**Facts.** From Wikipedia: r = a·e^(k·phi), tan(alpha) = k (alpha is the pitch), curvature = 1/(r·sqrt(1+k^2)), arc length L(phi1, phi2) = (sqrt(k^2+1)/k)(r2 - r1), and from the pole r/sin(alpha). A scaled spiral is congruent by rotation, and the spiral is congruent to its own involute, evolute and pedal. Derived and checked numerically: radius of curvature rho = k·s (s from the pole), intrinsic theta(s) = theta0 + ln(s/s0)/k, golden k = ln(phi)/(pi/2) = 0.30635, pitch 17.0324°, growth per turn phi^4 = 6.8541. Two copies rotated about the same pole never intersect: along any ray their radii differ by a fixed factor e^(-k·delta).

**Use for the engine.** Closed-form evaluation; stations by angle or by arc length, both invertible. For Bezier output, fit one equal-angle sector once and stamp the rest by spiral similarity (scale e^(k·dphi), rotate dphi about the pole), which gives exact self-similarity. Use rotated copies about the pole for nested engraved lines around a scroll eye. Stop short of the pole and end in a G2 'eye' circle of radius k·s_eye centred at the centre of curvature.

### 14. Log-aesthetic curves (LAC): closed-form angle functions, numeric positions

<https://arxiv.org/abs/2105.09762>

**Facts.** Per Nagy, Yoshida and Hoffmann (arXiv 2105.09762), summarising Yoshida and Saito. Standard form: the reference point is at the origin with radius of curvature 1 and tangent along +x. Radius of curvature: rho(theta) = e^(Lambda·theta) if alpha = 1, else ((alpha-1)·Lambda·theta + 1)^(1/(alpha-1)). Tangent angle versus arc length: theta(s) = (1 - e^(-Lambda s))/Lambda if alpha = 0; log(Lambda s + 1)/Lambda if alpha = 1; otherwise ((Lambda alpha s + 1)^(1 - 1/alpha) - 1)/(Lambda(alpha - 1)). Lambda = 0 gives a circle. All alpha = 1 curves are similar. Points need numerical integration. The G1 Hermite fit uses bisection. The 'drawable region' shrinks sharply for alpha < 0 or alpha > 1, which the extended LAC enlarges. G2 between segments comes from matching the first tangent length. Ziatdinov, Yoshida and Kim 2012 (CAGD 29(2)) give incomplete-gamma closed forms; I did not open that paper.

**Use for the engine.** Implement LAC as one more intrinsic theta(s) family on the shared Gauss-Legendre evaluator. Expose alpha as a 'curve character' dial with presets: clothoid alpha = -1, golden spiral alpha = 1 with Lambda = 0.306. Special-case |alpha - 1| and |alpha| near 0. Leave LAC Hermite solving to a later phase.

### 15. Hobby splines in JS/TS

<https://www.jakelow.com/blog/hobby-curves/hobby.js>

**Facts.** jakelow hobby.js is ISC (Copyright 2020 Jake Low) and based on Jackowski's TUGboat paper. npm hobby-curve 0.2.1 (ISC, published 2022-11-04, 6.9 KB, TypeScript, no dependencies) offers createHobbyCurve(points, {tension, cyclic}) returning an SVG path, and createHobbyBezier; it credits vlad-x and Schindler ports. @thi.ng/geom-splines 2.3.95 (Apache-2.0, 'STABLE - used in production', 2026-08-25) offers cubicHobby2(points, closed, omega), cubicFromArc (an elliptic arc as 1-4 cubics) and closest-point/split helpers, but pulls in several @thi.ng packages. The earlier research (01) documents Hobby's limits: it is only approximately G2, non-local, and unstable near collinear knots.

**Use for the engine.** A preview spline while dragging knots, and the fallback when Spiro fails. Port hobby.js (about 200 lines, ISC) rather than adding a dependency. npm: https://registry.npmjs.org/hobby-curve

### 16. Superellipse (cartouche, jewel, rounded-panel outlines) and Knuth's construction

<https://en.wikipedia.org/wiki/Superellipse>

**Facts.** From Wikipedia: |x/a|^n + |y/b|^n = 1, parametric x = ±a·cos^(2/n)(t), y = ±b·sin^(2/n)(t) (t is not the polar angle). For n > 2 the curvature is zero at (±a, 0) and (0, ±b). For 1 < n < 2 it grows without bound at those points. Piet Hein's Sergels Torg used n = 2.5 with a/b = 6/5. Area is 4ab·Gamma(1+1/n)^2/Gamma(1+2/n). Knuth's plain.mf macro superellipse(r,t,l,b,s) joins the 4 extreme points through 4 diagonal points s[...] with directions {t-r} and so on, using bounded '...' Hobby joins. It works for 0.5 ≤ s ≤ 1. Derived: a true superellipse has superness s = 2^(-1/n) (0.7071 for a circle, 0.758 for n = 2.5). Also derived: because kappa = 0 at the vertices when n > 2, a superellipse quadrant joins a straight side with G2.

**Use for the engine.** A 'cartouche' primitive with exponent n and aspect ratio. Build it from Knuth's 8 knots, or sample and fit with the generic fitter (it needs an arc-length table). Split it at the vertices to insert straight runs with G2 joins. Source of the macro: https://mirror.ircam.fr/pub/CTAN/systems/knuth/dist/lib/plain.mf

### 17. Arc-length parameterisation and lookup tables

<https://raphlinus.github.io/curves/2018/12/28/bezier-arclength.html>

**Facts.** kurbo's cubic arclen chooses adaptively between 8, 16 and 24-point Gauss-Legendre rules using error estimates, subdividing up to depth 20. inv_arclen solves s(t) = target with the ITP method (as robust as bisection, usually faster), integrating only the increment between successive guesses. Levien's 2018 post: 9th-order Gauss-Legendre is a good compromise. Random cubics at 1e-4 needed a mean of about 3.4 subdivisions, timed at 231 ns at 1e-4 (Rust). A 24-point rule (bezier.js) undershoots on sharp kinks. Polyline flattening converges only as O(sqrt N). For the intrinsic families arc length is the parameter itself (line, arc, clothoid, LAC) or closed form (log spiral), and offsets have L + d·dtheta.

**Use for the engine.** Only imported Beziers, superellipses, weave strands and variable-width edges need tables. Store cumulative Gauss-Legendre lengths at 32-64 nodes per piece; invert by binary search plus 1-2 Newton steps (or ITP). Animated arrows running along a track then move at constant speed with tangent alignment from the same table. Code: https://github.com/linebender/kurbo/blob/main/kurbo/src/param_curve.rs

### 18. Sinusoidal weave strands along a curved spine: validity conditions (derived) and the current spike

**Facts.** Derivation with Frenet frame (T, n) and signed spine curvature kappa: strand centre c(s) = p(s) + w(s)·n(s) with w = A·cos(2·pi·s/lambda + psi). Then c'(s) = (1 - kappa·w)·T + w'·n, so the strand stays regular and does not fold if A < R_min of the spine on the concave side. On the inner side the wave is compressed by (1 - kappa·w). Ribbon edges are offsets of c at ±h, so they need h < the strand's radius of curvature. On a straight spine its peak curvature is A·k^2 with k = 2·pi/lambda, which gives h < lambda^2/(4·pi^2·A). With two strands in antiphase the crossing angle is 2·atan(A·k), so A = tan(crossing/2)/k. The current spike, framing/generators/weave.ts, uses exactly this cosine offset, but takes normals by finite differences (±0.5u) on sampled polylines and emits polylines.

**Use for the engine.** Make the strand an analytic Fittable with exact c' and c'', sent through the shared fitter. Expose crossing angle, period and ribbon width as the designer's parameters, derive the amplitude, and show the A < R_min and h < lambda^2/(4·pi^2·A) checks in the lab.

### 19. Variable-width stroke expansion: perfect-freehand and the analytic alternative

<https://github.com/steveruizok/perfect-freehand>

**Facts.** perfect-freehand 1.2.3 (MIT, 2026-02-01, 5.7k stars). getStroke(points, {size, thinning, smoothing, streamline, simulatePressure, easing, start/end {cap, taper, easing}}) returns outline polygon points. The README's getSvgPathFromStroke turns them into a quadratic-midpoint path. By default the outline 'include[s] self-crossings', and the README suggests polygon-clipping to flatten them. streamline and smoothing deliberately move the input path. Analytic alternative (derived): left and right edges p(s) ± w(s)·n(s), each regular while w·kappa < 1, fitted with the shared fitter and filled nonzero. Caps are an SVG arc or a taper to w = 0. Note that the normal offset differs from the true moving-circle envelope where w' ≠ 0.

**Use for the engine.** Use the analytic edge outline for ribbons, swelling engraved lines and leaf blades: exact and deterministic. perfect-freehand at most for a 'pencil sketch' mode in the lab, never for printed output.

### 20. G2 joins between different families: rules (Spiro and Bertolazzi-Frego sourced; the rest derived)

<https://github.com/ebertolazzi/Clothoids>

**Facts.** Every piece carries (theta, kappa) at both ends. G1 means theta is continuous; G2 means kappa is continuous too. Rules: (1) line ↔ arc: insert a clothoid ramping kappa 0 → 1/R (railway transition; Spiro's '[' ']' knot types do line-to-curve). (2) clothoid ↔ log spiral at station s_j: set the clothoid's end kappa to 1/(b·s_j). A clothoid can also match the spiral's kappa' = -1/(b·s_j^2), a G3 contact, because kappa1 is free. (3) log spiral ↔ circle (volute eye): circle radius = b·s_j, centred at the spiral's centre of curvature there. (4) A child sprouting tangentially from a parent at station s starts with the parent's (point, theta(s), kappa(s)), which makes it G2 at the split. (5) Fixed endpoints with G1 data need 1 clothoid (Bertolazzi-Frego); with G2 data, 3 clothoids. The existing spike framing/math/turtle.ts chains lines and arcs only, so its joins are G1 with curvature jumps.

**Use for the engine.** Upgrade the turtle to a 'Cesàro turtle' (line, arc, clothoid, log spiral, LAC pieces), so G2 holds by construction. Close the end conditions (land on an anchor) by Newton or Levenberg-Marquardt over 1-3 free piece parameters. The lab shows a G2 check and a curvature comb at every join.

### 21. Library landscape (npm metadata as of 2026-10-10)

<https://registry.npmjs.org/spiro>

**Facts.** spiro 3.0.1: Apache-2.0/MIT, 2024-04. bezier-js 6.1.4: MIT, last published 2023-07-16, repo pushed 2024-08, 77 open issues, no bundled types. paper 0.12.18: npm 'MIT', 2024-07-17, 12.3 MB unpacked. paperjs-offset 2.2.1: MIT, 2026-07. @flatten-js/core 1.6.14: MIT, 2026-08. polygon-clipping 0.15.7: MIT, 2023-12. polyclip-ts 0.16.8: MIT, 2024-12. clipper2-js 1.2.4: BSL, 2024-01. @stdlib/math-base-special-fresnel 0.3.1: Apache-2.0, 2026-02. @thi.ng/geom-splines 2.3.95: Apache-2.0, 2026-08. hobby-curve 0.2.1: ISC, 2022-11. svg-arc-to-cubic-bezier 3.2.0: ISC, 2019. cornu-spline 0.6.0: MIT OR Apache-2.0, created 2026-06-16, 0 GitHub stars, 487 KB, depends on opentype.js, unvetted. kurbo: Rust only, no official npm or WASM package found. libspiro: GPL-3.0, do not port from it.

**Use for the engine.** Runtime dependency budget: `spiro` only, and even that is optional. Port the small algorithms with permissive licences: hobby.js, Levien's integ_spiro and fit_euler, Bertolazzi-Frego buildClothoid, and later kurbo fit.rs. Lab-only and optional: bezier-js or paper.js for SVG import and inspection, polygon-clipping for unioned hit areas.

### 22. Numerical determinism across browsers

<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math>

**Facts.** From MDN: 'Many Math functions have a precision that's implementation-dependent', and results can differ between browsers, and even for one engine on a different OS or architecture. Levien also notes that JS lacks fma, which hurts quartic-solver accuracy.

**Use for the engine.** Do not rely on bit-identical geometry. Round SVG coordinates (2-3 decimals at local units), test against closed forms with tolerances, keep iteration counts fixed, and add root polishing (one Newton step) after closed-form polynomial solves.

### 23. Animation along a track (later phase)

<https://developer.mozilla.org/en-US/docs/Web/CSS/offset-path>

**Facts.** MDN marks CSS offset-path as Baseline 'Widely available' since March 2022, with path(), url(#svg-shape), ray() and basic shapes; examples animate offset-distance with offset-rotate: auto. I did not verify from the spec how offset-distance percentages are measured (presumably path length).

**Use for the engine.** For the 'arrows run along their track on tab change' effect, either give the browser the fitted track path (offset-path: path(...)) or drive the position from the engine's own arc-length table in requestAnimationFrame. The JS route keeps G2-smooth tangents and exact station semantics.

## Recommendation

CURVE TOOLKIT PLAN for the frame engine. Plain TypeScript, no framework, about one module per family, all behind two interfaces.

(A) `Intrinsic` describes a piece by length L and theta(s), kappa(s), and provides point(s), tangent(s), normal(s), plus endState() = {x, y, theta, kappa}. Stations are always arc length s, or u = s/L.

(B) `Fittable` provides sample(t) → {point, derivative} and cuspIn(range)?. Derived curves implement it: offsets, weave strands, width edges.

Output to SVG goes through one fitter, with tolerance in device px at the current zoom (for example 0.1 px). All geometry is solved in local units, never stretched non-uniformly.

PER FAMILY
1. Line: kappa = 0. Exact; SVG L.

2. Circular arc: kappa = 1/R, theta = theta0 + s/R, points in closed form.
   - Output an SVG A command (exact). Inside fitted outlines, use cubic arms (4/3)·tan(dtheta/4)·R with dtheta ≤ 60-90°. Measured error 2.7e-4·R at 90° and 1.8e-5·R at 57°.
   - Pitfall: arms = L/3 is 50-9000x worse.

3. Clothoid / Euler spiral: kappa = kappa0 + kappa1·s, theta = theta0 + kappa0·s + kappa1·s²/2.
   - Evaluate points by composite 16-point Gauss-Legendre over sub-pieces each turning ≤ pi/2. Measured ≤ 1.5e-8·L on one pi-turn piece and about 1e-13 on two. Cache cumulative nodes.
   - Optional fast path: port Levien's integ_spiro (order-12 Taylor, 1e-9, Apache-2.0/MIT).
   - Do not use standard Fresnel with completing the square near kappa1 ≈ 0: cancellation (Bertolazzi-Frego).
   - Builders: (a) Cesàro-turtle append, G2 by construction. (b) Two-point G1: port Bertolazzi-Frego buildClothoid (Newton with guess 20b, 3-5 iterations, BSD-2), or Levien's fit_euler (secant, ≤ 10 iterations, throws). (c) Two-point G2: 3 clothoids, later only.

4. Euler-spiral spline through designer knots (the dominant sweeps):
   - Use npm `spiro` 3.0.1 (Apache-2.0/MIT, used by Iosevka) with point types corner, g2, g4, left, right.
   - Consume spiroToArcsOnContext output and fit it yourself, or call spiroToBezier with delta ≈ 0.25 rad. The default of 1 rad leaves about 0.26% of R error.
   - Wrap every solve: check for NaN, bend > pi and end-tangent residual, because the solver returns no status after 10 iterations. Fall back to Hobby, and to the last good solution during drags.

5. Logarithmic / golden spiral: b = ln(phi)/(pi/2) = 0.30635, pitch 17.03°, phi^4 = 6.854 growth per turn.
   - Formulas: r = a·e^(b·phi); s from the pole = r·sqrt(1+b²)/b; rho = b·s; theta(s) = theta0 + ln(s/s0)/b. All closed form, no quadrature.
   - Bezier: split into equal-angle sectors (≤ 45-60°), fit the first sector once, then generate the others by spiral similarity (scale e^(b·dphi), rotate dphi about the pole). This gives exact self-similar copies and a measured 6-8 cubics per turn at 0.05-0.01u.
   - Pitfalls:
     - Stop before the pole and close with a G2 eye circle (radius b·s_eye, centred at the centre of curvature).
     - Use a circle branch when b < 1e-6.
     - An offset of a log spiral is not a log spiral. Nested lines around an eye should be rotated copies about the pole, which never cross and have geometric spacing. Use true offsets only where d < b·s_min.
   - Flame: place the tip curve's stations at equal dphi. Leaves are the same prototype scaled by r_i/r_0 and rotated with the spiral tangent. Each leaf side is a log-spiral or clothoid piece.

6. Log-aesthetic curve (LAC; generalises 3 and 5): theta(s) has a closed form per alpha branch (0, 1, otherwise), and rho(theta) is closed form.
   - Points come from the same Gauss-Legendre integrator.
   - Expose alpha as a 'curve character' dial with presets: clothoid alpha = -1, golden alpha = 1 with Lambda = 0.306.
   - Hermite solving (Yoshida/Nagy bisection; limited drawable region for alpha < 0 or alpha > 1) is phase 3.
   - Special-case alpha near 0 and near 1.

7. Hobby: port hobby.js (ISC, about 200 lines). Use it only as the live-drag preview and the Spiro fallback; it is approximately G2.

8. Superellipse (cartouche, jewel, panels): |x/a|^n + |y/b|^n = 1.
   - Build it like Knuth's plain.mf: 8 knots, with the diagonal points at superness s = 2^(-1/n) and tangents parallel to the vertex chords. Alternatively sample it and fit with the generic fitter (it needs an arc-length table).
   - For n > 2 the curvature is 0 at the vertices, so straight runs inserted there join with G2.

9. Derived curves, all `Fittable`:
   - Offset p + d·n. Curvature kappa/(1 + d·kappa); arc length L + d·dtheta. Guard |d| < R_min on the concave side, else trim or stop.
   - Weave strand p + A·cos(2·pi·s/lambda + psi)·n. Guards: A < R_min of the spine and half-width h < lambda²/(4·pi²·A). The designer sets crossing angle, period and ribbon width; the engine derives A = tan(crossing/2)·lambda/(2·pi).
   - Variable-width edges p ± w(s)·n with w·kappa < 1 and smooth w. Caps are an arc or a taper to w = 0. Fill nonzero.
   - Mirror, similarity and spiral-similarity copies, and Illustrator imports (cubic Beziers).

10. Arc length: native for families 1-6. Only imports, superellipses, strands and edges need tables: cumulative Gauss-Legendre lengths at 32-64 nodes per piece, inverted by bisection plus Newton (or ITP). The future arrow animation reads the same table.

11. Fitter.
   - Phase 1: equal-turn subdivision (≤ 30-45°), symmetric arms = chord/(3cos²(dtheta/4)), sampled maximum-distance check by projection (16-20 samples), recursive halving. Measured: 2-3 cubics for the 54° clothoid limb, 2-3 for the 170° ring, 10-13 for a 2.5-turn volute.
   - Phase 2: port kurbo fit.rs plus common.rs (area/moment quartic with Orellana-De Michele, ITP, Gauss-Legendre tables; Apache-2.0/MIT; about 1k Rust lines) for asymmetric O(n^6) fits, cusp breaks, the line fallback and the long-arm penalty. The same port simplifies imported Illustrator paths.

12. Robustness:
   - Solve in a chord-normalised frame and track unwrapped theta.
   - Cap iterations and return {value, status, residual}.
   - Fallback chain: Spiro → Hobby → last good solution, with hysteresis while dragging.
   - Lab validators: curvature comb, kappa jump at joins, d·kappa and w·kappa margins, fit error, and a golden readout (slope of rho/s).
   - Round SVG output to 2-3 decimals. Write unit tests against closed forms; for example, one golden turn ending at r = 45 must have chord 45(1 - phi^-4) = 38.4346.

SUGGESTED ORDER
1. Intrinsic pieces (line, arc, clothoid, log spiral) with the Gauss-Legendre evaluator, and the Cesàro turtle with G2 checks.
2. Phase-1 fitter and SVG emitter, then offsets and the weave strand with guards.
3. Spiro wrapper plus Hobby fallback for knot-drawn sweeps.
4. Width outlines and arc-length tables (this also enables the animation).
5. kurbo fit port, the Bertolazzi-Frego G1 connector, LAC, superellipse.

Runtime dependencies: `spiro` only, and optional. Keep the existing spike's fitRepeats; replace its polyline outputs with the fitted path.

## Cautions

- My measured numbers (Gauss-Legendre accuracy, arc handle errors, cubic counts) come from scratch scripts in (local scratch file) (glacc.mjs, arcerr.mjs, fitexp.mjs, fitexp2.mjs, chk.mjs), not from a source. 'Best arms' used a crude grid optimiser with equal-length pieces and a sampled maximum distance. Treat the counts as order-of-magnitude, and copy the scripts into docs/research/analysis if they should be kept.
- Several formulas are my own derivations, not quotes: rho = b·s for log spirals, offset arc length L + d·dtheta, the weave validity bounds A < R_min and h < lambda^2/(4·pi^2·A), the crossing-angle relation, superness s = 2^(-1/n), the G2/G3 join rules, the non-crossing of rotated log spirals, and the arm rule chord/(3cos^2(dtheta/4)). They are standard differential geometry or quick algebra, but should be unit-tested.
- spiro-js returns no convergence status (10 Newton iterations, then it silently returns). Its default Bezier output (bend ≤ 1 rad, arms = derivative/3) is visibly inaccurate at this drawing's scale, about 0.2u on the ring. Levien himself documents Spiro's non-unique solutions, wild loops and loop reversal at cusps.
- Licences: libspiro is GPL-3.0, so do not port from it. Port from raphlinus/spiro or spline-research (Apache-2.0/MIT since the 2019 relicensing) or use spiro-js. The Clothoids library is BSD-2-Clause. The Levien-Uguray paper text states no code licence. Cephes code in stdlib is Apache-2.0 with Moshier's notice.
- Standard Fresnel evaluation of clothoids via completing the square loses precision as kappa1 → 0 (near-circles and near-lines), which is common in the medallion limbs. Use Gauss-Legendre quadrature or the Taylor integrator, or small-parameter series as in Bertolazzi-Frego.
- Log spirals blow up in curvature at the pole. Never evaluate down to s = 0; end in an eye circle. Uniform Gauss-Legendre pieces converge slowly near the pole, so use the closed form.
- Offsets of log spirals and clothoids are not the same family. Offsets of Beziers are degree-10 curves. Any offset or width larger than the local radius of curvature makes cusps and loops: guard it, do not hope.
- kurbo's fit error is an approximation to the Fréchet distance, and its docs say it is 'not a rigorous guarantee'. Levien-Uguray's error constants are empirical. Fitting is still 'work in progress' by the author's own account. There is no official npm or WASM kurbo, so a TS port is real work (about 1k lines of Rust including the quartic solver). JS lacks fma, so expect slightly less accurate quartic roots than in Rust and add Newton polishing.
- G2 Hermite data (fixed points, tangents and curvatures at both ends) cannot always be met by one or two clothoids; three are needed (Bertolazzi-Frego 2018). Don't promise a single-piece G2 connector.
- LAC Hermite solving has limited 'drawable regions' for alpha < 0 or alpha > 1 and needs branch handling near alpha = 0 and alpha = 1. Keep it out of the first phases. I did not open Ziatdinov et al. 2012 (incomplete-gamma forms); the speed-up claims for it from secondary sources disagree (10x vs 13x).
- MDN says JS Math function precision is implementation-dependent, so geometry will not be bit-identical across browsers. Round output and test with tolerances.
- perfect-freehand outlines self-cross and its streamline/smoothing options move the input path, so it is unsuitable for exact printed linework. cornu-spline (npm, created June 2026, 0 stars) is unvetted. bezier-js was last published in July 2023, and its offsets are reliable only on 'simple' segments.
- Not verified: the minimax circle constants on Mortensen's page (the numbers were not extractable as text), and how CSS offset-distance percentages are measured (MDN page excerpt did not say). Iosevka's final outline step (solving Spiro through the offset knots) was inferred from spiro-expand.mjs and not traced into spiro-to-outline.mjs.
