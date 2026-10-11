# Curve catalog: the right curve for the job

> Background for [the frame engine design](../frame-engine.md), section 2.

CURVE CATALOG: "the right curve for the job". This is grounded in docs/research/01-07 and the curve-math gap research. Items marked (derived) are my own algebra, checked numerically in scratchpad/catalog_check.mjs. Items marked (uncertain) need testing in the Lab.

SEVEN RULES BEHIND EVERY ENTRY
1. Define every curve intrinsically: length L, tangent angle theta(s) and curvature kappa(s) over its own arc length.
   - Arc length then comes free, so stations, ticks, beads and motion all use s or u = s/L.
   - A G1/G2 join becomes a comparison of (x, y, theta, kappa) at both ends.
   - Closed forms cover the line, arc and log spiral. Clothoids and log-aesthetic curves (LAC) use composite 16-point Gauss-Legendre (GL); no Fresnel functions are needed (curve-math research).
2. Choose the family by curvature profile, not by look-alike shape.
   - 01-curve-systems.md principles: curvature should be monotone between knots, peak at the knots, and stay G2 across joins.
   - 03-golden-growth.md #5 (Hubner): people prefer the true golden spiral over the quarter-circle Fibonacci spiral, mainly because its curvature is continuous.
   - So curvature jumps are the main thing that separates "printed" from "hand-assembled".
3. Use the measured drawing (07-drawing-analysis.md) to pick each family.
   - Medallion S-limbs are clothoids (R2 0.98; kappa grows as s^1.10, lower limb as s^1.58).
   - The ring is a circle (r 85.76, RMS 0.54).
   - Flame tips lie on a log spiral (free b 0.488; golden b forced gives RMS 0.39).
   - The volute #103 is a tight log or Archimedean spiral (b 0.14-0.16, 2.5-2.8x growth per turn).
   - Leaves, crest hearts and ring loops are exact similarity copies. The crest and side leaf are mirrors.
   - Fans converge on circle anchors with roughly even spacing.
4. One family covers almost everything (derived). When curvature grows as a power of distance from an inflection, kappa ∝ sigma^p, the curve is a log-aesthetic curve with alpha = -1/p.
   - The upper limb (p 1.10) is alpha -0.91, effectively a clothoid (alpha -1). The lower limb (p 1.58) is alpha -0.63.
   - The log spiral is alpha +1.
   - So a single "curve character" dial covers sweeps, stems, curls and leaves, with clothoid and golden-spiral presets (01 #4, 03 #8).
5. "Golden" means phi applied by construction where a curve is self-similar, never hunted for in drawings (07 caution: any ratio is within 12% of some half-power of phi).
   - Sharp's menu (03 #4) gives phi per Theta: b = ln(phi)/Theta.
     - Theta = 54 deg: b 0.5106, pitch 27.05 deg, 24.7x per turn.
     - 90 deg: b 0.3063, 17.03 deg, 6.854x.
     - 108 deg: b 0.2553, 4.97x.
     - 144 deg: b 0.1915, 3.33x.
     - 180 deg: b 0.1532, 8.71 deg, 2.618x.
   - Two useful matches (derived; a 6-item menu, so treat them as design options, not discoveries):
     - phi per 54 deg (pentagon) sits in the flame-tip RMS minimum (b 0.50 gives RMS 0.21). It keeps the drawn character and is still phi-derived.
     - phi per 180 deg (b 0.153, 2.618 per turn) falls inside the measured #103 volute range (b 0.144-0.16, 2.47-2.76 per turn).
   - phi also sets radii and ratios (ring/medallion = phi^k, stem gaps, crossing pitch). It never sets fan spacing: 07 shows uniform spacing, and phi spacing collapses the inner lines.
6. Copies, not re-solves. Use similarity copies (gnomon, 03 #1), mirrors and rotations for repeats. This gives exact self-similarity, and the Bezier output is fitted once and stamped with transforms.
7. Re-solve at every size; never stretch non-uniformly (01 §2.7: an affinely scaled circle is an ellipse). Responsive change works through parameters:
   - Continuous parameters interpolate.
   - Discrete ones (counts, topology, family choice) switch at room thresholds with hysteresis, and the switch cross-fades (thresholds research).

OUTPUT
All geometry goes through one fitter at a tolerance in device px.
- Exact circles are emitted as SVG A.
- Fitted cubics use arc-corrected arms, chord/(3cos^2(dtheta/4)), on equal-turn pieces. Measured counts:
  - 2-3 cubics for the 54-degree limb or the 170-degree ring.
  - 6-8 per golden turn.
  - 10-13 for a 2.5-turn volute, at 0.05-0.01u.
- Never use L/3 arms on bends over about 0.25 rad: they are 50-9000x worse.

OTHER STYLES
They mostly need straight segments, arcs and offsets, so the same kernel serves them.
- Three-centred and circular arches keep exact concentric offsets, so archivolt profiles stay exact. Elliptical arches do not.
- A G2 corner (clothoid easement or superellipse with n > 2) is the modern-card and moulding counterpart of the ribbon easement.
- Ticks, beads, rays and chevrons are punctuation placed at fitted stations.

UNCERTAIN, TEST BEFORE RELYING ON IT
- The lower-limb alpha (R2 0.93).
- The guilloche "touch" waveform formula (mine).
- The squircle-to-circle size calibration.
- CSS corner-shape support.
- Live offset-path:url() updates.
- All cubic counts (crude optimiser, order of magnitude).

## Medallion S-sweeps and stems (dominant curves of the corner)

**Family.** Clothoid (Euler-spiral) pieces chained in a Cesaro turtle: straight stem -> clothoid limb (kappa 0 -> 1/R_ring) -> circular ring arc -> clothoid limb. A limb can be generalised to a log-aesthetic limb with a 'character' exponent p (alpha = -1/p). Knot-drawn variants use a Spiro (Euler-spiral spline) through on-curve knots.

**Why.** Measured in 07-drawing-analysis.md Q2a.
- Upper limb of #113: 135u long, turning 51-54 deg, curvature growing from 0 to 0.0139. Clothoid R2 0.980; power law k~s^1.10 R2 0.988; log spiral R2 0.03. Forcing a golden spiral costs RMS 1.31 and max 3.16u and looks wrong.
- Lower limb: k~s^1.58 (R2 0.93) against clothoid 0.80. Parallel #114 behaves the same (p 1.16 and 1.48).
A clothoid's curvature ramps linearly from the inflection, the 'one clean ramp' that 01-curve-systems.md calls fair: monotone between knots and G2 at joins. That is why the sweep reads as engraved rather than drawn. Derived: kappa ∝ sigma^p measured from an inflection is exactly an LAC with alpha = -1/p (-0.91 upper, -0.63 lower), so one dial reproduces both limbs. Levien's Spiro (01 #3) is the knot-based authoring form of the same family. Stems are straight (07: stem x positions 32.94/44.45/61.34/72.85).

**Math.** Clothoid piece: kappa(s) = kappa0 + kappa1·s, theta(s) = theta0 + kappa0·s + kappa1·s^2/2. Points are x(s) = x0 + ∫cos theta, y(s) = y0 + ∫sin theta, by composite 16-point Gauss-Legendre on sub-pieces turning ≤ pi/2 (measured 1.4e-9·L for a pi turn on one piece, 7.5e-14 on two). A limb from the inflection (kappa 0) to the ring (1/R) turns kappa_end·L/2, which checks against the drawing: 0.0139·135/2 = 53.8 deg.
Power-law limb (LAC alpha = -1/p): kappa(sigma) = kappa_end·(sigma/L)^p and theta(sigma) = theta_i + kappa_end·L/(p+1)·(sigma/L)^(p+1). It turns kappa_end·L/(p+1), with p = 1 being the clothoid. The inflection is a sign change of kappa through 0 inside one curvature program (02 #3, Xu and Mould), never two arcs butted together.
Closing: the far end must land on an anchor (a ring station, or the exit at the ring's E point where #114 ends). Solve by Newton/LM over 1-3 free piece lengths, with the status and residual returned.
Golden by construction, applied to radii only: R_ring = R_medallion·phi^k. Drawn 1.20; k = 0.5 gives 1.272 (+5u). Stem middle/outer gap = phi (drawn 1.467, +1.7u).

**Designer parameters.** - sweepTurn: total turning of each limb, 30-120 deg (drawn about 54).
- character p: 1.0-1.8. 1 is clothoid; the drawn upper limb is 1.1, the lower 1.6.
- ringStep k: R_ring = R_med·phi^k, k 0-1, preset 0.5, or free 'as drawn 1.20'.
- exitAnchor: named station on the ring, e.g. E = 0 deg, or an angle.
- stemLength: not a slider. It comes from the layout and stretches.
- stemGapRatio: middle/outer gap, 1.3-1.8, preset phi.

**Joins.** - Stem line to limb: G2 for free, since the limb starts at kappa = 0.
- Limb to ring: G2, with the limb's end kappa set to 1/R_ring.
- Ring to second limb: G2.
- The sweep is a ROOT of the attachment graph. It inherits only from the corner box and the medallion circle; everything else (fans, loops, leaves, weave sockets) inherits its tangent and curvature at stations on it.
- Spiro knot types: corner, g2, left/right for line-to-curve.

**Implementation.** Arc length is native (s is the parameter), and the ring is closed form.
- Bezier, phase 1: equal-turn split to ≤ 30-45 deg, symmetric arms = chord/(3cos^2(dtheta/4)), sampled max-distance check by projection (16-20 samples), recursive halving. Measured 2-3 cubics per limb at 0.05-0.01u.
- Bezier, phase 2: kurbo fit.rs port (area/moment quartic, O(n^6)).
- Parallel sweeps such as #114 and double engraved lines are true offsets of the analytic spine: p + d·n, kappa_d = kappa/(1 + d·kappa), L_d = L + d·dtheta (closed form, so stations on the offset are free). Guard |d| < R_min on the concave side.
- Swelling lines are filled outlines p ± w(s)·n with w·kappa < 1, filled nonzero.

**Pitfalls.** - spiro-js returns no convergence status (10 Newton iterations, silent). Wrap every solve: NaN, bend > pi or end-tangent residual triggers the fallback chain Hobby -> last good solution.
- Do not use spiro's default Bezier output (1 rad pieces, L/3 arms): about 0.2u error on the ring.
- No Fresnel completing-the-square near kappa1 ≈ 0 (near-lines and near-circles lose precision; Bertolazzi-Frego).
- Never stretch the medallion. When its slot shrinks below the room threshold, swap the variant (medallion -> simple block) rather than squash it.
- The lower-limb alpha comes from an R2 0.93 fit: medium confidence.
- Spiro blows up when knots move far (06 caution), so drag handles should edit 1-2 parameters, not raw knots.

## Medallion ring (circle, its bands, loops and anchor stations)

**Family.** Exact circle, concentric offsets for bands, and rotation copies for ring loops. Not an ellipse: the drawn ellipse is rx/ry 1.039, an intended circle.

**Why.** 07 Q2a/Q4 measurements:
- The ring arc (170 deg) has curvature CV of only 0.18 and fits a circle at r 85.76, RMS 0.54.
- The medallion ellipse is 72.78 x 70.06.
- Anchors sit at named points: tendrils at the leftmost point, fan B at about 52 deg below E, #114 at the rightmost point, and loops #40-48 ending on the circle.
- Ring loops are near-copies at a mean 28 deg step (CV about 10%).
Circles are the only curve SVG draws exactly (the A command). Their offsets are circles and their arc length is R·phi, so every band, bead and station is exact.

**Math.** p(phi) = c + R(cos phi, sin phi); s = R·phi; kappa = 1/R; tangent angle phi + 90 deg.
- Bands: radii R ± d_k from a profile.
- Loops: N = round(arcSpan/step0), with step0 about 28 deg drawn; step = arcSpan/N; loop_j = rot(c, phi0 + j·step)(loop_0).
- Anchors: named angles (E 0, S 90, W 180, N 270 in screen degrees) or free.
- Golden by construction: R_ring = R_med·phi^k. A guilloche inside uses the rose formula (see the guilloche entry).

**Designer parameters.** - R_medallion: derived from the corner box, e.g. cornerSize/phi^m; the designer picks m, 1-2.
- ringStep k: 0-1.
- loopCount: discrete, 9-15 over the drawn span.
- anchors: a list of named stations with angles.
- bands: a profile of concentric lines and gaps.

**Joins.** - G2 to the clothoid limbs (they end at kappa 1/R).
- A child attached at angle phi inherits point, tangent phi + 90 deg and kappa 1/R. Tendrils and fans end on it with G0 (point), or G1 for tangential arrival.

**Implementation.** - Emit as SVG <circle>, or A arcs split at ≤ 180 deg.
- Inside a fitted outline, use arms (4/3)tan(dtheta/4)·R with dtheta ≤ 60-90 deg (2.7e-4·R error at 90 deg, 1.8e-5·R at 57 deg).
- Loops are fitted once and stamped by rotation.

**Pitfalls.** - Large-arc and sweep flags in A are easy to get wrong; test with mirrored corners.
- Non-uniform scaling turns the ring into an ellipse, and ellipse offsets are not ellipses.
- Loop count is discrete: Schmitt-trigger it and cross-fade at the switch.
- Don't claim 13 loops is 'Fibonacci'; it is a count dial.

## Weaving ribbons along the page sides (2-ribbon twist or 3-strand plait)

**Family.** Sinusoidal offset strands about a G2 side track (the spine). Each ribbon is a constant-width pair of offsets of its strand centreline. An amplitude-easing envelope makes a G2 hand-off from the straight medallion stems. Over/under comes from crossing parity.

**Why.** - framing/generators/weave.ts already uses the cosine offset w = A·cos(2·pi·s/lambda + psi) with fitted whole or half repeats, which is right.
- 02-ornament-generation.md #7: over/under must be derived from crossing parity (Gross-Tucker), never stored per crossing, and loop count follows gcd rules.
- 04-engraving-print.md #5: every strand must share one parameter, the spine's arc length. Mixed parametrisation causes Cameron's distortion bug at corners.
- A sinusoid has continuous curvature everywhere, peaking at the crests, and its crossing angle is set by one number.
- Curve-math research gives the validity bounds.
- The drawn stems give the starting geometry: two 2-line ribbons 11.51 wide, with centres ±14.2 from the spine axis.

**Math.** Spine p(s), frame (T, n), signed curvature kappa_sp. Strand i: c_i(s) = p(s) + w_i(s)·n(s), with w_i = A·e(s)·cos(2·pi·s/lambda + psi_i).
- Phases: psi = {0, pi} for 2 ribbons; {pi/6 + 2·pi·j/3} for a 3-strand plait (spike).
- c' = (1 - kappa_sp·w)·T + w'·n.
- lambda = L/n with n from fitRepeats (whole, or half when 'arrive mirrored' is allowed), passed through hysteresis.
- Crossing angle (2 strands in antiphase): chi = 2·atan(2·pi·A/lambda), so A = tan(chi/2)·lambda/(2·pi).
- Validity (derived): A + h < R_min(spine) on the concave side; ribbon half-width h < lambda^2/(4·pi^2·A), the strand's minimum radius on a straight spine. Example: lambda 60, chi 60 deg -> A 5.51, h_max 16.5.
- G2 end easing (derived): w(s) = A + (A·cos(ks) - A)·m(s/l), with m the smootherstep 6x^5 - 15x^4 + 10x^3 over a lead-in l of 1/4-1/2 period. This gives w(0) = A and w'(0) = w''(0) = 0, so the strand leaves a straight stem at G2.
- Over/under: alternate along each strand by crossing index.
- Golden by construction (optional): lambda/(2A) = phi^k, or ribbon width / gap = phi.

**Designer parameters.** - strands: 2 | 3 (discrete; a pending owner decision).
- crossingAngle chi: 40-90 deg.
- period: lambda target in ribbon widths, 3-8 (refitted to whole repeats).
- ribbonWidth and haloGap: the paper margin at crossings.
- endEasing l: 0.25-1 period.
- lockMode: crossing at corner | crest at corner | free (decides how counts are fitted per side).

**Joins.** - Start at the medallion stem socket: the position, tangent and kappa = 0 of the stem (G2 through easing).
- The spine is G2 because it is built from lines, clothoids and arcs (corner entry).
- Pieces are cut midway between crossings (spike rule). Each gets a stable id and its s-range on the strand, which motion uses later.
- Ribbon edges inherit stations from the strand.

**Implementation.** - Make each strand an analytic Fittable with exact c' and c'' from the spine's (T, n, kappa) and w', w''. Replace the spike's ±0.5u finite-difference normals and polylines with the shared fitter.
- Edges = offsets ±h of the strand (exact derivative (1 ± h·kappa_c)·T_c), filled as outlines.
- Halo = offset ±(h + gap), painted paper-coloured under over-pieces.
- Strand arc length needs a cumulative GL lookup table (32-64 nodes per piece, inverse by bisection plus Newton).

**Pitfalls.** - On the inside of a curve the wave compresses by (1 - kappa·w); if A + h ≥ R_min the strand folds. The Lab shows both margins.
- The repeat count is discrete: never animate through it; cross-fade.
- All strands must use the spine's s, never their own.
- With 3 strands, check that every piece holds at most one crossing.
- Drawn stem gaps (11.51/16.89/11.51) put ribbons nearly touching at the start, so the easing must not let the halos overlap the medallion art.
- Keep crossings away from Bezier piece boundaries for clean fits.

## Easements where a ribbon (or any track) turns a page corner

**Family.** G2 transition corner: line -> clothoid (kappa 0 -> 1/R) -> circular arc -> clothoid (1/R -> 0) -> line. This is the railway easement; the CSS-like analogue is 'corner smoothing'. A pure clothoid pair is the limiting case.

**Why.** The spike's Turtle (framing/math/turtle.ts) chains lines and arcs, which is G1 with a curvature jump at every tangent point. That jump is the defect Hubner measured (03 #5). It also makes anything travelling the track jerk, because angular velocity = v·kappa, so a kappa step is a step in rotation rate (derived). Spiro's '[' and ']' line-to-curve knots (01 #3) and Levien's G2 join rules give the same construction. The weave rides the corner unchanged if the spine is G2 and A + h < R.

**Math.** For a turn Delta, minimum radius R and easement fraction xi ∈ [0, 1]:
- Each clothoid turns xi·Delta/2 and has length L_c = xi·Delta·R (from turn = L_c/(2R)).
- The arc turns (1 - xi)·Delta, with length (1 - xi)·Delta·R.
- The corner's setback from the vertex grows with xi. Compute it once by GL (no closed form without Fresnel).
- Constraint: R ≥ A + h + margin (weave) and R ≥ profile depth (mouldings).
- Golden by construction: R = (A + h)·phi^k (the spike's cornerStep).

**Designer parameters.** - cornerRadius: as a phi step over the ribbon envelope, k 0-2.
- easement xi: 0 is a plain arc (G1), 1 is a pure clothoid pair; default 0.5.
- lockAtCorner: crossing | crest | free.
- per-side count fitting: on/off.

**Joins.** G2 at all four internal joins. The incoming and outgoing straights are tangent-continuous and curvature-continuous at 0.

**Implementation.** - Cesaro turtle calls: .line(L), .clothoid(L, k0, k1), .arc(R, dTheta), .spiral(b, dPhi), .lac(alpha, Lambda, L).
- Native arc length; piece boundaries become track stations.
- Weave phase is computed on the global s, so it flows through the corner.

**Pitfalls.** - Larger xi needs a larger corner footprint; check that it fits the slot.
- Locking a crossing or crest at each corner forces per-side counts. With whole repeats per side, the phase is continuous only if the lock is consistent on both ends of each side, so use half-integer fitting where allowed.
- A tiny R with large A folds the strand.

## Flame corner: curve through the leaf tips (tip envelope)

**Family.** Logarithmic spiral used as an (often invisible) construction spine. Leaves are generated by repeated spiral similarity (gnomon), so the tips land on it by construction. Golden presets come from Sharp's phi per Theta menu.

**Why.** 07 Q1a:
- Free log spiral through the 6 tips: b 0.488, RMS 0.21.
- Golden b forced (free pole): RMS 0.39, max 0.69u.
- Circle: RMS 0.88.
- RMS profile is broad and minimal at b 0.45-0.55.
- The tips are not on a spiral about the vein origin.
03 #1 (D'Arcy Thompson): parts that are similar and similarly placed put their corresponding points on log spirals, so leaf_{i+1} = S(leaf_i) guarantees the tips lie on the spiral. 03 #4 (Sharp): phi per 54/90/108/144/180 deg are all phi-derived.
Derived options:
- phi per 54 deg (pentagon): b = 0.5106, inside the measured minimum. Keeps the drawn character.
- phi per 90 deg: b = 0.3063, the classic golden spiral. Tips move ≤ 0.69u with a free pole.
The 120-deg span cannot separate circle from spiral (07), so this is a design choice.

**Math.** r(phi) = a·e^(b·phi) about pole P, b = ln(phi)/Theta.
- Pitch = atan(b).
- Arc length from the pole s = r·sqrt(1 + b^2)/b.
- Radius of curvature rho = b·s; theta(s) = theta0 + ln(s/s0)/b.
- L(r1 -> r2) = (sqrt(1 + b^2)/b)·(r2 - r1).
Stations at equal dPhi (drawn about 24 deg): r_i = r_0·e^(-b·i·dPhi). Leaf i = S^i(leaf_0), with S = scale e^(-b·dPhi) composed with a rotation of -dPhi about P. Scale per step:
- 0.875 per 25 deg at b 0.306.
- 0.807 per 24 deg at b 0.511.
- The drawing instead shrinks linearly from 1 to 0.27.
Check: one golden turn ending at r = 45 has chord 45(1 - phi^-4) = 38.4346 (unit test).

**Designer parameters.** - growth: phi per Theta, Theta ∈ {54, 90, 108, 144}, or free b 0.15-0.6.
- leafCount N: discrete, 4-8.
- angularStep dPhi: 15-35 deg.
- sizeLaw: self-similar | linear (as drawn).
- leafTilt: rotation of each leaf against the spiral tangent, -30 to 30 deg. The drawn leaf rotation steps (21, 20, 22, 15, 12) do not equal the polar steps.
- pole/outer radius: a handle.

**Joins.** - The spiral is the parent. Each leaf base attaches at its station with tangent = spiral tangent + tilt.
- If the envelope is drawn as a visible stroke, its inner end closes G2 into an eye circle of radius b·s_eye at the centre of curvature.
- The flame's tongue tips lie on a near-straight line (07, circle r 12155), so they belong to a separate line or clothoid track, not to this spiral.

**Implementation.** - All closed form; no quadrature.
- Bezier: split into equal-angle sectors ≤ 45 deg (Hubner check: 0.076% of r at 45 deg, 0.015% at 30 deg). Fit the first sector once, then stamp the rest by spiral similarity for exact self-similarity: 6-8 cubics per turn.
- Validator: fit the slope of rho against s on any curve and report the pitch, e.g. '27.0 deg = phi per 54'.

**Pitfalls.** - Never evaluate down to the pole.
- Switching from linear to self-similar sizes makes the smallest leaves visibly larger (07); show both in the Lab.
- An offset of a log spiral is not a log spiral.
- Don't call a b matched from the menu 'discovered'. The look-elsewhere caveat applies, so present it as a chosen preset.

## Individual leaf blades and leaf curls

**Family.** Midrib spine as a log-spiral or LAC arc (golden b preset), expanded by an analytic width profile into two edge curves. The tip is either a corner (pointed leaf) or a G2 continuation into a log-spiral curl. For asymmetric or S-shaped fronts, the midrib carries an inflection, or each side gets its own width function. Alternative for drawn-in prototypes: two Euler-spline sides with a corner knot at the tip.

**Why.** 07 Q1b:
- The six flame leaves are exact similarity copies (RMS 0.003u).
- Each side is ONE cubic whose curvature peaks mid-segment, so no side is a log spiral. Snapping control points cannot make them golden; they must be regenerated as true spiral or clothoid arcs.
- Local b values (back 0.21, front 0.38/0.59) straddle golden 0.306, so a golden template is a plausible stylisation.
01-curve-systems.md: skeleton plus envelope, every stroke a centreline plus width (Knuth, Prototypo, Nupuram). A bell-shaped side curvature comes naturally from a curved midrib plus a beta-shaped width.

**Math.** Midrib m(s), s ∈ [0, L], with theta(s) from the log spiral (b) or LAC (alpha, Lambda); u = s/L.
- Width: w(u) = W·u^p·(1 - u)^q / max, with the peak at u* = p/(p + q). Golden-placement option: u* = 1/phi^2 = 0.382 from the base.
- Edges: e±(s) = m(s) ± w±(s)·n(s), with kappa_edge = kappa/(1 ± w·kappa).
- Guard: w·kappa < 1 on the concave side.
- Pointed tip: q > 1 tapers w -> 0.
- Curled tip: continue the midrib as a log spiral for 'curlTurns', then the eye circle (radius b·s_eye).
- Serrated outlines: notch and tip stations on the edge curves.

**Designer parameters.** - length L: or derived from the parent's similarity scale.
- curl: b preset 0.306 golden, or free 0.15-0.6, or total turning 20-120 deg.
- maxWidth W/L: 0.15-0.45.
- widthPeak u*: 0.25-0.6, golden preset 0.382.
- tipSharpness q: 1-3.
- asymmetry: -0.5 to 0.5 (front vs back width).

**Joins.** - Base: attaches at a parent station with position and tangent (+ tilt), which is G1. Use G2 when the leaf should 'grow out of the sweep': the midrib starts with the parent's kappa there (01 principle: inherit tangent and curvature).
- Tip: G0 corner for pointed leaves; G2 into a curl.
- Copies of the prototype are similarity transforms, so they inherit everything exactly.

**Implementation.** - The edges are Fittables (exact derivatives from the midrib frame and w') and go through the shared fitter, filled nonzero.
- The prototype is fitted once at unit size. Copies are transforms: <use> for static art, <g transform> for anything animated (Chromium will not composite <use x y>).
- The 'Unfurl' motion scales copies along the spine in growth order.

**Pitfalls.** - The normal offset is not the true moving-circle envelope where w' is large (fat, short leaves).
- w·kappa ≥ 1 makes inner loops.
- Do not snap the traced cubics to 'golden'; regenerate them.
- perfect-freehand self-crosses and moves the input path, so it is not for printed output.
- Keep 3-6 parameters per leaf (01: 60 parameters is too many).

## Scroll terminals and volutes (tight, multi-turn curls), plus teardrop loop ends

**Family.** Log spiral with growth phi per Theta, entered from its stem by a clothoid/LAC easement and closed by a G2 eye circle. Archimedean spiral as an alternative for very even multi-turn curls. The Renaissance compass volute is a guide layer only. Teardrop end loops are a separate family: a symmetric clothoid-pair loop or a Spiro loop, not a spiral.

**Why.** 07 Q2b:
- Curl #103: free log spiral b 0.144-0.16, about 2.5-2.8x per turn.
- Its inner 1.5 turns fit log (b 0.144) and Archimedean equally (RMS 0.41 vs 0.39).
- Golden-90 forced: RMS 2.83, since phi^4 = 6.85 per turn is far more open.
- The end loops of #0 and #61 are teardrops, not spirals (RMS 6-8).
Derived: phi per 180 deg gives b = 0.1532 and 2.618x per turn, inside the measured range, so a tight volute can be phi-derived and match the drawing. 03 #4: Sharp's table. 03 #6: compass volutes are piecewise Archimedean arcs with curvature jumps (guides only). 03 #5: G2 preference.

**Math.** r = a·e^(b·theta), b = ln(phi)/Theta.
- Theta 90: b 0.306, 6.85x per turn.
- Theta 144: b 0.1915, 3.33x.
- Theta 180: b 0.1532, 2.618x.
Eye ratio after N turns = e^(2·pi·b·N). For N = 2.5 this is 123 (Theta 90, eye nearly invisible), 20.2 (144) and 11.1 (180).
- Stop at s_eye and close with a circle of radius rho = b·s_eye, centred at the centre of curvature (G2).
- Entry: a clothoid from the stem ending at kappa = 1/(b·s_j) (G2). Optionally match kappa' = -1/(b·s_j^2) with kappa1 (G3).
- Archimedean: r = r0 + c·theta (use GL for arc length).
- Listel (double line): a COPY rotated by delta about the pole, radial factor e^(-b·delta). It never crosses, unlike a parallel offset (03 #6, curve-math).
- Teardrop: a symmetric pair of clothoids meeting at the loop apex, with a corner or tangent crossing at the neck.

**Designer parameters.** - growth: Theta ∈ {90, 144, 180} or free b 0.08-0.4; or Archimedean.
- turns N: 0.75-3.
- outerRadius: inherited from the parent sweep's local scale.
- eyeStyle: circle | filled dot | open.
- listels: count 0-3, rotation delta 10-40 deg.
- hand: cw | ccw.

**Joins.** - G2 from the stem through the clothoid entry.
- G2 into the eye circle.
- Listels share the pole, so they register exactly with the main line.
- Fans that curl into the scroll (07 family D) attach at stations on the spiral.

**Implementation.** - Closed-form evaluation.
- Sector-stamped Bezier: equal-angle sectors ≤ 45 deg, ≤ 30 deg near the eye for zoom. Measured 10-13 cubics for 2.5 turns at 0.05-0.01u (arc-rule arms, equal-turn pieces).
- The eye is an SVG circle.

**Pitfalls.** - Curvature blows up at the pole: never evaluate to s = 0.
- At Theta = 90, multi-turn volutes need microscopic eyes, so pick 144 or 180 for 2+ turns.
- True offsets near the eye need d < b·s_min; otherwise use rotated copies.
- Quarter-circle 'golden spirals' are never shipped as final geometry.
- Log and Archimedean only diverge visibly beyond about 1.5 turns, so don't over-sell the choice.

## Crest lobes and hearts

**Family.** Mirror-symmetric lobes. Each half is an Euler-spiral (clothoid–arc–clothoid) run between a corner knot at the cusp and a corner knot at the point, with a g2 knot at the lobe's tightest turn. Nested hearts are similarity copies about the cusp, not offsets. Wing hooks end in volutes.

**Why.** 07 Q3:
- The crest is exactly mirror-symmetric (0.01 deviation).
- The inner heart is the outer heart scaled by 0.7025 about the cusp: 1/sqrt(2) within 0.65%, not 1/phi (12% off).
- No convincing phi in its proportions.
01: knots at curvature extrema with G2 between them reads as fair. 03 #1: similarity copies keep nested parts registered. Offsets would not shrink the cusp-to-point geometry proportionally.

**Math.** Half-lobe = Spiro knots [corner C (cusp, tangent theta_C), g2 T (top extreme), g2 S (shoulder, optional), corner B (point, tangent theta_B)]. The analytic equivalent is a Cesaro chain clothoid(kappa: k_C -> k_peak) + arc + clothoid(k_peak -> k_B) closed by Newton onto B.
- Mirror about the axis x = x_axis (derived): if the half meets the axis with its tangent perpendicular to it, the join is G2 automatically by symmetry (not G3).
- Nested copy k = scale(sigma^k) about C, with sigma = 1/sqrt(2) (as drawn), 1/phi, or free.
- Proportions are dials: cusp depth (drawn 0.812), heart w/h (drawn 1.237), wing span / heart width (drawn 2.353).

**Designer parameters.** - widthToHeight: 0.9-1.5.
- cuspDepth: 0.3-0.6 of height.
- fullness: where the peak curvature sits along the half, 0.3-0.7.
- nestCount: 0-3, with ratio sigma {1/sqrt2, 1/phi, free}.
- wingHook: volute growth and turns.

**Joins.** - G0 corners at the cusp and the point (intentional).
- G2 within each half and across the mirror seam where the tangent is perpendicular to the axis.
- Wings attach at stations on the lobe (G1/G2) and end in volutes.

**Implementation.** - Fit one half; mirror by transform for exact symmetry.
- Nests by similarity transform about C.
- Centred punctuation on the top band, fixed scale per room level.

**Pitfalls.** - Spiro knots dragged far from their solution can flip or loop: drag handles change named parameters, not knots.
- If the half meets the axis obliquely you get a visible point (G0), which is fine only for the cusp and the tip.
- Don't present 1/sqrt(2) as golden; it is the A-paper similarity and a valid dial preset.

## Side leaf (clasp across the ribbons)

**Family.** A fan of leaf blades (see the leaf entry) springing from one socket. The lower half is a mirror of the upper half about a horizontal axis. Tip positions are stations from a spacing law, or on an optional envelope curve (clothoid or log spiral with its pole at the socket).

**Why.** 07 side-leaf:
- The bottom half mirrors the top half (RMS 0.18-0.23).
- All fan strokes converge at the socket (74.83, 631.7).
- Tip heights 0.098/0.221/0.255/0.434/0.582 of the half-height show no phi.
- h/w 3.92.
That is an attachment fan plus a mirror, the two exact operations 07 says to formalise first.

**Math.** Blade j = leaf(len_j, curl_j, width_j), with its base at socket S and start heading theta_j = theta_0 + j·dTheta (or a spacing law).
- Lengths and heights follow a law: uniform, geometric r, or a phi ladder (rung(base, j·step)).
- Mirror about y = y_axis.
- As a whole it is one centred punctuation piece on the side track, scaled by the rail's room level.

**Designer parameters.** - bladesPerHalf: 2-5 (discrete).
- spread: 30-80 deg.
- lengthLaw: uniform | geometric r 0.7-0.95.
- heightToWidth: 3-4.5 (drawn 3.92).
- curl b: golden preset.

**Joins.** - Each blade base meets S with its fan tangent (G1). The mirror seam is G2 where blades cross the axis perpendicularly.
- The clasp sits on the side track at a station (centre or a phi fraction), oriented to the track normal.

**Implementation.** - Blades are prototype copies with per-blade similarity.
- Mirror by transform.
- Hide under the over-ribbon halo order if it clasps the weave (z-order rule).

**Pitfalls.** - Blades must not cross: use a noCrossing validator.
- At the socket, converging strokes drop below the device-pixel gap: taper or merge (Jobard-Lefer rule).
- At small room levels, reduce the blade count (typify) rather than shrinking the strokes below the hairline floor.

## Clustered line fans converging on an anchor (tendrils, feathers, flame veins)

**Family.** Interpolation family ('blend') between two guide curves that share the anchor endpoint, with a spacing law. A radial variant for vein fans: G1 clothoids from one origin with fanned start headings, solved two-point by Bertolazzi-Frego.

**Why.** 07 Q2c/Q1c:
- Families end EXACTLY on anchors on the medallion circle (leftmost point; (173.6, 186.6)).
- Spacing is near-even (CV 0.05-0.12, successive ratios 0.7-1.5), with a mild trend at the open end (1.145 per step) and a 0.81 tail.
- No phi; phi spacing would collapse the inner lines.
- Flame veins share one origin, and their chord lengths fall arithmetically (about 7.7u per step).
01 principle: families are offsets or interpolations between bounding spines, never independent curves. 04 #7: Jobard-Lefer taper where lines converge.

**Math.** Guides g0(u), g1(u), u ∈ [0, 1] (normalised arc length), with g0(1) = g1(1) = A.
- Line k: c_k(u) = (1 - f_k)·g0(u) + f_k·g1(u).
- Spacing law: uniform f_k = k/(n-1); geometric f_k = (r^k - 1)/(r^(n-1) - 1).
- All lines reach A. Their arrival tangents are lerps of the guides' tangents: a fan, or a feather if the guides arrive tangent to each other.
Radial variant: line k starts at A with heading theta_A + k·dTheta and ends at E_k with a given heading. Solve with Bertolazzi-Frego buildClothoid (Newton, guess (20b), ≤ 5 iterations), or Levien's fit_euler (secant, ≤ 10, throws).
Taper near A: thickness factor (d - dtest)/(dsep - dtest), with dtest = 0.5·dsep, dsep in device px.

**Designer parameters.** - lineCount n: discrete, 3-12, room-dependent.
- spacingLaw: uniform | geometric r 0.8-1.25.
- anchor: a ring station.
- guide shapes: each guide's free end and bulge (2 handles).
- convergence: point | tangential.
- taper: 0-0.4 of length.

**Joins.** - G0 at the anchor (meets the ring), or G1 tangential arrival to the ring (tangent = ring tangent at the station).
- Lines are children of the guides; the guides are children of the ring station. Move the ring and the fan follows.

**Implementation.** Trick: fit both guides with the SAME number of cubic segments at the same u-breaks. Each blended line is then exactly the lerp of their control points, with no per-line fitting. Otherwise, the lerp of two Fittables is a Fittable (derivative = lerp of derivatives).
- Arc length for ticks or motion on a blended line needs a lookup table.
- Batch all lines of one fan into one path d.

**Pitfalls.** - The drawn tendrils cross (order 1, 0, 2). The engine should validate monotone order along the normals unless a 'braid' flag is set.
- Line count is discrete: use a 'grow' transition (new lines born at zero width) or cross-fade.
- Near the anchor, gaps go below device px: merge or drop by priority.
- Very different guide shapes give odd middle lines; keep the guides of the same character.

## Parallel line clusters and engraved hatching

**Family.** True offsets of the analytic spine (circles stay circles; clothoid and spiral offsets go through the fitter) with a spacing law and swell profile. Rotated copies about the pole near spiral eyes. Evenly spaced streamlines (Jobard-Lefer) for irregular regions. Straight hatch at a constant screen pitch for rectilinear bands.

**Why.** - 04-engraving-print.md: printed line work is families generated from guide curves with continuous weight. DigiDurer's three properties: never cross, roughly parallel, smooth.
- 04 #4 guilloche: constant width within a family.
- Curve-math (Levien): the offset of a Bezier is a degree-10 curve, and cusps appear at d = R.
- Thresholds research (tippecanoe): keep the texture, meaning a constant physical pitch with counts that change.
- 04 #7: streamlines give non-crossing, evenly spaced, tapered hatching in leaf blades or the flame body.

**Math.** Offset d_k: d_0 plus a uniform step, a geometric step r, or a ladder.
- kappa_d = kappa/(1 + d·kappa); L_d = L + d·dtheta; the offset point at s shares the parent's tangent angle, so stations register.
- Guard |d| < R_min on the concave side. Closed form: circle R, clothoid at its high-kappa end, log spiral b·s_min. Otherwise trim (d_stop).
- Swell w(s): from a tone or sawtooth threshold (Ostromoukhov copperplate) or a simple taper.
- Regions: streamlines with dsep and dtest = 0.5·dsep, using a spatial hash with cell dsep.
- Straight hatch: angle alpha, pitch p in CSS px snapped to device px, clipped to the region.

**Designer parameters.** - count n: discrete; or fill-to-depth.
- pitch: CSS px with hairline floor 0.5-0.75 px (04).
- spacingLaw: uniform | geometric r.
- weightLaw: constant | swell | taper.
- hatchAngle: 0-90 deg.
- trimMode: stop | merge | drop.

**Joins.** Lines inherit the parent's stations: a tick or bead at parent s sits at the same s on every offset. Hatch lines end G0 on the region boundary, with burin-style tapered ends.

**Implementation.** - Offset of an analytic piece = Fittable with exact derivative (1 + d·kappa)·T, then the fitter.
- The existing frameEngine.ts SVG <pattern> hatch is fine only for straight bands; patterns do not follow curves.
- Batch a family into one path; keep elements in the low hundreds.

**Pitfalls.** - Never offset the Bezier output; offset the spine.
- Cusps when d ≥ R.
- Moiré at fractional devicePixelRatio: snap the pitch to device px and re-read DPR via matchMedia.
- Animating hatch is expensive; keep it static.
- Don't scale the pitch with the frame, or the texture changes.

## Bead, lattice, scallop and zigzag bands (repeated punctuation)

**Family.** Rigid motifs at fitted stations along a track: beads are exact circles or ellipses, scallops are circular arcs. Lattice and zigzag are straight segments defined in band coordinates (s, n), mapped through the track frame; they stay exact lines on straight runs and become fitted curves on curved runs.

**Why.** - 07 Q4: scallops repeat at an exact 9.00 pitch (copy-repeat); the hand-placed last three drift (7.74-8.63). So the engine fits whole counts.
- 06 #3 Inkscape Pattern Along Path: whole tile counts, motifs never stretched.
- 01: Knuth border modules; n = round(L/period).
- Thresholds research: a size-vs-count split (radical law) and constant texture.

**Math.** n = round(L/p0) through a Schmitt trigger (switch up at t·phi^h, down at t·phi^-h), p = L/n, s_i = (i + 1/2)·p (or i·p to land on the ends).
- Bead centre: p(s_i) + n_c·n(s_i), radius beta·H. The bead is kept round on curves.
- On a curved track, the pitch on an offset line at d is p·(1 + d·kappa).
- Lattice and zigzag vertices: (s_j, ±H/2) with period p, mapped by P(s, n) = p(s) + n·N(s).
- Scallop: an arc through two adjacent stations with sagitta sigma·H.
- Size-vs-count split (thresholds research): when room shrinks by k, count ∝ k^alpha and size ∝ k^(1-alpha), with alpha = 0.5 as the radical-law preset.

**Designer parameters.** - motif: bead | lozenge | scallop | lattice | zigzag | custom glyph.
- pitch p0: 0.8-2 band heights.
- beadSize beta: 0.3-0.45.
- fitMode: whole | half | centred.
- phaseAnchor: start | centre | corners.
- sizeCountSplit alpha: 0-1.

**Joins.** - Motifs are oriented by the track tangent at their station.
- Zigzag and lattice vertices are mitred corners (G0).
- At corners, bands either end against corner blocks or flow through an eased corner (continuous s).

**Implementation.** - Static repeats as <use>/<symbol>, or one batched path d.
- Animated travellers as <g transform> or an HTML wrapper.
- On straight runs, exact line and circle primitives; on curved runs the lattice segments go through the fitter.

**Pitfalls.** - Count jumps are discrete: cross-fade, never animate through them.
- Beads overlap on the inside of tight curves, so place stations on the bead centreline, not the band edge.
- Never scale motifs non-uniformly to fill leftover length.
- Keep total element counts well under the roughly 8,000-element redraw limit.

## Guilloche fills (rosettes, guilloche bands)

**Family.** Rose-engine polar curves: N-lobe waveform copies with a deterministic phase sequence. Envelope bands, where a waveform fills between an inner and an outer envelope. Straight-line-engine bands along a track, parametrised by the spine's s.

**Why.** 04 #4 (Poirier): one waveform, N copies, a fixed step and a phase sequence. Constant phase is concentric, half-pitch is barleycorn, a linear ramp is pinwheel, ±1 deg for 5 cuts is zigzag, and Fibonacci phase gives the sinewave/moiré.
04 #5 (Cameron): r = inner + (outer - inner)(0.5 + s(t)). Envelopes must share one parameter (angle for rosettes), with an integer wave count per loop.
framing/generators/guilloche.ts already does Fibonacci lobes and copies as 360-sample polylines.

**Math.** Copy j: r_j(theta) = R_j + A_j·W(N·(theta + phi_j)), with phi_j from phaseFn(j) ∈ {0, alternating ±pi/N, j·delta, zigzag(n), Fibonacci}.
- Envelope band: r(t) = in(t) + (out(t) - in(t))·(1/2 + W(N·t + phi_j)/2).
- Straight band: n(s) = H·(1/2 + W(2·pi·N·s/L + phi_j)/2).
- Waveform W is sine at touch tau = 1/2; tau < 1/2 gives concave scallops and tau > 1/2 convex scallops (Poirier's touch rule). The exact W_tau formula is a proposed parametrisation (uncertain).
- N is an integer per closed loop.
- Anti-mud: where the line spacing 2·pi·r/(N·M) falls below the device floor, switch to plain circles.

**Designer parameters.** - lobes N: Fibonacci presets 5/8/13/21 or free integer.
- copies M: 3-34.
- amplitude: fraction of the band, 0.05-0.5.
- phaseFn: concentric | barleycorn | pinwheel | zigzag | fibonacci.
- touch tau: 0.3-0.7.
- band radii: or nest onto the previous rosette's outer envelope.

**Joins.** - Periodic: closed when N is an integer.
- Nesting: rosette k's outer envelope is rosette k+1's inner envelope, so the rings stay registered.
- Band versions follow the track's s through eased corners.

**Implementation.** - Fit ONE lobe (one period, 2·pi/N) with the fitter (2-4 cubics), then stamp it N times by rotation, and copies by rotation phi_j: exact repeats and tiny path data.
- The 'Rose-engine Turn' motion rotates a group by a multiple of 2·pi/N, which is composited.

**Pitfalls.** - Element count and moiré at small sizes: drop copies by threshold, halving M with nested counts so survivors don't move.
- 'Mud' near the centre.
- Arc-length vs angle mismatch on non-circular envelopes (Cameron's bug).
- Don't animate filters over guilloche.

## Motion tracks for animation (arrows/chevrons running along their ribbons or bands)

**Family.** The same G2 track pieces the frame is built from (line, clothoid, arc, log spiral, strand), exposed as a Track with native arc length, or a lookup table for derived pieces. Sampled into Web Animations API transform keyframes. No CSS offset-path, no SMIL, no GSAP.

**Why.** Animation research:
- Only transform and opacity are composited in Chromium.
- offset-path:path() is px-only and runs on the main thread.
- <use x y> is never composited.
- WAAPI keyframes with offset = s/L give constant-speed motion that survives a re-solve by keeping u.
Derived: a traveller oriented to the tangent rotates at omega = v·kappa(s). G2 tracks therefore give a continuous rotation rate, while a G1 line+arc join makes the arrow 'twitch' at the tangent point. This is the strongest functional argument for the clothoid easements.

**Math.** - Keyframes at s_m = m·L/M (M 64-128), or adaptive so that each step turns ≤ 3 deg. Each keyframe is {transform: translate(p(s_m)) rotate(theta(s_m) + theta_glyph), offset: s_m/L}.
- Speed profile through the effect easing (a linear() string designed in the Lab).
- Optional rotation-rate cap (derived suggestion): v(s) ≤ omega_max/|kappa(s)|, so time t(s) = ∫ds/v.
- A strand track occludes the traveller under crossings with a mask built from the over-pieces' halos.
- State is stored as u ∈ [0, 1] or as socket ids, never px.

**Designer parameters.** - track: a reference to a spine, strand or band centre.
- from/to: u or socket ids.
- duration: ≤ 5 s; phi token scale 0.38/0.62/1/1.62 s.
- easing: linear() stops.
- orient: tangent | fixed.
- lane offset n: ride the ribbon centre or one edge.

**Joins.** - The track must be G2 at every piece join. The Lab flags G1 joins with the rotation-rate jump v·delta-kappa.
- Docking ends match the socket's position and orientation, so the glyph lands exactly on its static twin.

**Implementation.** - Sample from the engine's analytic evaluators, never getPointAtLength.
- Strands use the cumulative GL lookup table.
- On resize: finish or seek, re-solve, rebuild keyframes and restore currentTime.
- The moving glyph lives in its own <g transform> or an HTML wrapper.
- Dash windows use pathLength=1 on spines; filled ribbons use a mask reveal per RibbonPiece.

**Pitfalls.** - Integer refits during a motion: finish the motion first.
- Not verified: whether offset-path:url() follows live 'd' changes.
- Safari compositing of SVG children is unconfirmed, so prefer the HTML wrapper.
- prefers-reduced-motion swaps to an opacity blink.
- No ambient loops (WCAG 2.2.2).

## Arches spanning a width (Beaux-Arts frames)

**Family.** Circular arcs (semicircular and segmental), three-centred basket-handle arches (chains of concentric-capable arcs), elliptical arches (only when needed), an optional clothoid-eased three-centred arch, and a flat lintel at the low threshold.

**Why.** Derived: offsets of circular arcs are concentric arcs. Archivolt mouldings (a profile swept around the arch) therefore stay EXACT SVG arcs for semicircular, segmental and three-centred arches, because a three-centred arch offset by d keeps its centres with radii r ± d and R ± d. Elliptical offsets are not ellipses (Levien), so low arches should prefer three-centred. A semicircle's rise is w/2, which on a wide desktop is enormous. The arch therefore needs a rise rule that follows the width with a cap, which is the reason segmental and three-centred types exist. 01: re-solve, never stretch a semicircle into an ellipse.

**Math.** - Semicircle: R = w/2.
- Segmental, span w and rise h: R = (w^2/4 + h^2)/(2h), half-angle = asin(w/(2R)). Example: w 2, h 0.5 gives R 1.25.
- Three-centred with the equal 60/30-deg split (derived, checked numerically). With a = w/2: r = (h - a(2 - sqrt3))/(sqrt3 - 1) and R = 2a - r. Valid for 0.268a < h ≤ a. Small centres at (±(a - r), 0), large centre at (0, (r - R)·sqrt3/2). Example: a 1, h 0.6 gives r 0.454, R 1.546. Joins are G1 (kappa jumps 1/r -> 1/R); insert clothoids for a G2 'eased' option.
- Elliptical: (a·cos t, h·sin t). Arc length needs a lookup table. Minimum radius at the springing is h^2/a, so any profile needs depth < h^2/a.
- Rise rule: h = clamp(w/2, h_min, h_max), or h = (w/2)/phi^k.

**Designer parameters.** - archType: semicircular | segmental | three-centred | elliptical | flat.
- riseRule: ratio h/w 0-0.5, plus a cap in CSS px.
- eased: on | off.
- keystoneWidth.
- voussoirCount: discrete, odd.
- lintelThreshold: room z.

**Joins.** - Springing to the pilaster capital: the semicircle meets the vertical shaft tangentially (G1, classic). A segmental arch meets at an angle and needs an impost block, the 'fixed capital' of the order.
- The keystone is centred punctuation at the crown.
- Voussoir joints are radial to their own centre.

**Implementation.** - SVG A commands: exact, including all profile stripes.
- The arch rides the architectural order: shaft stretches, capital and base fixed, arch re-solved from the span.
- Content slot geometry (a window or bay) is computed from the intrados.

**Pitfalls.** - Changing archType is a topology switch: cross-fade at the threshold.
- Ellipse offsets need the fitter and the depth guard.
- An SVG non-uniform scale silently turns arcs into ellipses.
- Very shallow segmental arches (h → 0) have a huge R: switch to a lintel below a rise threshold to avoid numeric blow-up.

## Rounded card corners (minimal modern card)

**Family.** Circular quarter arcs (CSS border-radius, G1) for small radii. For large radii on flat cards with shadows, a G2 'continuous' corner: a clothoid–arc–clothoid smoothed corner (smoothing xi), or a superellipse quadrant with n > 2.

**Why.** Circular corners have a curvature jump where they meet the straight sides, visible on large flat-colour cards with soft shadows (the Hubner effect, 03 #5). Superellipse with n > 2: curvature is 0 at the vertices, so straight sides inserted there join G2 (curve-math research, derived). At small radii (under about 8-12 CSS px) the difference is invisible, which is a threshold rule. Knuth's superness s = 2^(-1/n): 0.7071 for a circle, 0.8409 for n = 4.

**Math.** - Smoothed corner: the easement entry formulas with Delta = 90 deg, radius R and fraction xi.
- Superellipse quadrant of size c: x = c·cos^(2/n)t, y = c·sin^(2/n)t (t is not the polar angle). Use Knuth's 8-knot construction or sample and fit (needs a lookup table).
- The diagonal point sits at superness s·c from the corner centre along the diagonal.

**Designer parameters.** - cornerSize c: CSS px.
- smoothing xi (0-1) or exponent n (2-6).
- per-corner overrides.
- circularBelow: px threshold below which plain CSS border-radius is used.

**Joins.** G2 to the straight sides (xi > 0 or n > 2); G1 for plain border-radius.

**Implementation.** - Draw the card outline in the frame SVG and clip the content with clip-path: path() (px, recomputed on ResizeObserver) or CSS shape() (Baseline Feb 2026).
- CSS corner-shape: superellipse() exists in Chromium (uncertain: verify cross-browser) and could replace the SVG outline where it is supported.
- Shadow: filter: drop-shadow on the clipped element, or an SVG blurred copy, kept static.
- The paper texture is a static style layer.

**Pitfalls.** - A superellipse corner of the same nominal size reads smaller than border-radius; calibrate c by eye in the Lab. A factor of roughly 1.2-1.6 is my rough guess (uncertain).
- path() is px-only.
- Don't animate the shadow filter.
- 'Elements breaking the frame' (the plant sprig) is a layering rule: the sprig sits above the outline with no clip. It is not curve maths.

## Art deco stepped corners, nested stepped rectangles and sunburst rays

**Family.** Rectilinear polylines in band (s, n) coordinates with a step-size law. Concentric quarter circles and corner discs. Sunburst rays as wedge polygons or parallel-sided bars on angular stations.

**Why.** Deco geometry is straight lines plus circles: exact SVG with no fitting. The design content is in the ratio laws, the modular-scale/Utopia token approach (05 #12) applied to step sizes, and in hierarchies (long/short rays). The thresholds research says reductions should 'typify': keep the pattern and lower the count.

**Math.** - Step k size u_k = u_0·r^k, with r = 1/phi, 1/2 or 1 (uniform).
- Stepped corner = staircase of K steps; nested rectangle j is inset by Σ_{k≤j} u_k.
- Sunburst: centre C, rays at theta_j = theta_0 + j·Delta, with n = round(span/Delta_0).
  - Wedge j: angular half-width delta_j between r_in and r_out.
  - Bar ray: edges offset ±t from the ray line.
  - Alternate lengths for hierarchy.
  - Clip analytically against the panel (ray-rectangle intersection).
- Nested counts (derived rule): choose n = n_0·2^k so that dropping a level removes every other ray and the survivors don't move.

**Designer parameters.** - steps K: discrete, 1-5.
- stepLaw: uniform | geometric r.
- rayCount: fitted, nested powers of 2.
- rayDuty: angular fill 0.3-0.6.
- rayHierarchy: alternate long/short ratio, e.g. 1/phi.
- centre: anchor point, e.g. bottom-centre of a panel.

**Joins.** - Mitred corners (G0).
- Ray tips butt or pointed.
- Spine-band sequences (different stacked motifs) are an ordered list of punctuation pieces with fixed sizes and stretchable spacers between them.

**Implementation.** - Polygons and A arcs, exact, crisp; snap edges to device px for flat fills.
- Thresholds drop K and halve the ray count.

**Pitfalls.** - Hairline floor for thin step lines.
- Antialias seams between abutting flat fills: paint underlaps.
- A ray count that isn't nested reshuffles all rays at a threshold.

## Chevrons, mitre/round joins of straight profiles, and profiles swept around corners (mid-century moulding, notched inset brackets)

**Family.** Offset bands of a track: each profile stripe is the region between offsets d_a and d_b. Corner treatments:
- mitre: stripes meet on the bisector.
- block: stripes butt into a square corner block of nested bevelled squares.
- round: concentric arcs.
- eased: clothoid track with fitted offsets.
- notched: an inverse corner, a polyline with extra mitres.
Chevrons are rigid two-arm glyphs oriented by the tangent.

**Why.** The mid-century moulding is a profile of about 12 flat colour stripes (about 68u deep) with corner blocks instead of mitres. Offsets of straight segments and arcs are exact, so the whole moulding is exact geometry. The only curve risk is an inner stripe on a rounded corner: radius R - d must stay positive, which is the same offset-cusp rule as everywhere else (Levien).

**Math.** Vertex V with turning angle Delta and a stripe at offset d:
- Mitre point = V + d·(n_in + n_out)/(1 + cos Delta), i.e. distance |d|/cos(Delta/2) along the bisector; d·sqrt2 at 90 deg.
- Mitre limit: when 1/cos(Delta/2) > limit, bevel instead.
- Round corner of track radius R: the stripe arc radius is R - d (inside) or R + d (outside). Requires R > d_max (the profile depth D).
- Block corner: block side = D (or D·phi^k); stripes end on the block edge. Nested squares inset by stud steps; facet colour = shade(facet normal · light direction), a style-layer rule.
- Notch of size c: the track gets 2 convex and 1 concave 90-deg turns, each mitred.
- Chevron at station s: apex at p(s), arms at ±(180 - gamma)/2 from -T(s), arm length l, thickness t.

**Designer parameters.** - profile: a list of stripes {depth, token} in CSS px with clamp.
- cornerStyle: mitre | block | round | eased | notch.
- mitreLimit: 2-6.
- blockSize: D x (1-phi).
- notchSize: 0.5-2 D.
- chevron: apexAngle 60-120 deg, arm l, t, spacing (fitted).

**Joins.** - G0 at mitres (intentional).
- G2 for eased tracks.
- Stripes are continuous through mitres.
- Travelling chevrons dock at block sockets.

**Implementation.** - Each stripe is one filled polygon or path per side, plus a corner piece.
- To avoid conflation seams between abutting fills, paint each stripe as the union of itself and everything inward, from outermost to innermost (painter's underlap), instead of edge-to-edge quads.
- Snap straight stripe boundaries to device px.
- Chevrons are rigid motifs: <g transform> for motion (WAAPI).

**Pitfalls.** - Inner stripes invert when d > R on round or eased corners.
- Mitre spikes at acute angles: use the mitre limit.
- Hairline antialias seams between flat colours.
- The image-traced source wobbles, so measure stripe depths as tokens; don't trace geometry.

## Ruler ticks with a major/minor hierarchy (blueprint borders)

**Family.** Graduated punctuation: stations on a track with hierarchical levels. Each tick is a straight segment along the track normal, with length and weight set by its level.

**Why.** The blueprint style's ruler borders are a repeat with a hierarchy. The thresholds research (tippecanoe texture, ScaleMaster, Roth's operators) says to keep a constant screen pitch and drop the finest level first as room shrinks: eliminate or typify, not shrink.

**Math.** Base pitch p: n = round(L/p0) rounded to a multiple of M = Π m_l, so majors land on both ends or on the centre.
- Subdivisions m_l, e.g. [2, 5] gives 10 per major with a mid tick.
- Level of tick i: l(i) = number of leading products dividing i.
- Length L_l = L_0·rho^(l_max - l), with rho = 1/phi or 1/2; weight w_l likewise.
- On curved tracks: segment from p(s_i) + d_0·n to p(s_i) + (d_0 + L_l)·n. The pitch on the inside shrinks by (1 - d·kappa).
- Level visibility: show level l only if its pitch ≥ the floor in CSS px (thresholds 'grow' transition for new levels).

**Designer parameters.** - subdivisions: e.g. [2, 5], [4], [2, 2, 2].
- basePitch: 4-12 CSS px.
- lengthRatio rho: 1/phi | 1/2.
- anchor: start | centre | both ends.
- side: in | out.
- labels: on | off; real text when meaningful, aria-hidden otherwise.

**Joins.** - Ticks are G0 normals.
- At corners, ticks either stop at the corner block or fan through an eased corner (normals rotate continuously).

**Implementation.** - One path per level (a batched d), so there are only a few elements.
- Stations from the same fitRepeats plus hysteresis.
- Snap to device px on straight runs.

**Pitfalls.** - If n is not a multiple of M, the majors miss the ends.
- Ticks converge on the inside of tight curves.
- Changing the base pitch per page reshuffles everything, so keep p fixed and vary the count.

## Shared toolkit

SHARED CURVE TOOLKIT
Plain TypeScript, no framework. It lives in frame-core (shipped) and is used unchanged by frame-lab.

1. Interfaces
- Intrinsic (analytic pieces)
  - { kind: 'line'|'arc'|'clothoid'|'logSpiral'|'lac'; L; theta(s); kappa(s); point(s); frame(s) -> {p, T, N, kappa}; endState() -> {x, y, theta, kappa}; params }.
  - Line, arc and log spiral are closed form.
  - Clothoid and LAC use composite 16-point Gauss-Legendre (GL) on sub-pieces turning ≤ pi/2, with cached cumulative nodes.
  - No Fresnel functions.
- Fittable (derived curves)
  - { sample(t) -> {p, d}; cuspIn?(t0, t1) }.
  - Implemented by: Offset(spine, d), Strand(spine, w(s)), WidthEdge(spine, w±(s)), Lerp(g0, g1, f), Mapped(spine, (s, n) polyline), EllipseArc, Superellipse, ImportedBezier.
- Track
  - An ordered list of Intrinsic or Fittable pieces with stable ids.
  - totalLength, locate(s) -> {piece, localS}, at(u), and stations (named s or u).
  - A continuity report per join: G0/G1/G2 with the delta-theta and delta-kappa values.
  - An arc-length lookup table for non-native pieces: 32-64 GL nodes per piece, inverted by bisection plus 1-2 Newton steps.
- CesaroTurtle (replaces framing/math/turtle.ts)
  - .line(L), .arc(R, dTheta), .clothoid(L, k0, k1), .easeTo(kappa, L), .spiral(b, dPhi), .lac(alpha, Lambda, L).
  - .closeTo(anchor, {free: [pieceParam...]}): Newton/LM, capped iterations, returning {value, status, residual}.
  - G2 by construction.
- Profile sweep
  - Stripes [{d0, d1, token|ink}] along a Track.
  - Corner treatments: mitre, block, round, eased, notch.
  - Painter's underlap fill order.
- Punctuation
  - fitRepeats (keep from framing/math/phi.ts), wrapped in a Schmitt trigger: up at t·phi^h, down at t·phi^-h; canonical choice on load.
  - hierarchicalTicks(subdivisions).
  - nestedCounts (powers of 2 for rays and copies).
  - Placement of a rigid motif at a station with a tangent frame.
- Copies
  - similarity(pole, scale, rot), spiralSimilarity(pole, b, dPhi), mirror(axis), rotate(centre, angle).
  - The geometry is fitted once and stamped with transforms.
- Fitter
  - Phase 1: equal-turn split ≤ 30-45 deg; symmetric arms chord/(3cos^2(dtheta/4)); sampled max-distance check (16-20 projections); recursive halving.
  - Tolerance in device px at the current scale: 0.1 device px suggested (Levien-Uguray used 0.25).
  - Phase 2: port kurbo fit.rs + common.rs (Apache-2.0/MIT): area/moment quartic, ITP, GL tables, cusp break, line fallback.
- SVG emitter
  - <circle> or A for arcs; C for fitted pieces.
  - Coordinates rounded to 2-3 decimals.
  - Filled outlines, nonzero fill.
  - Static art can use <use>. Anything that moves gets <g transform> or an HTML wrapper (Chromium will not composite <use x y> or <symbol>).
- Validators (run in the Lab and in CI)
  - Curvature comb, and a G2 join check with delta-kappa.
  - Margins d·kappa < 1 and w·kappa < 1.
  - Weave bounds A + h < R_min and h < lambda^2/(4·pi^2·A).
  - Fit error.
  - Golden pitch readout: slope of rho against s, reported as 'phi per Theta'.
  - noCrossing / monotone order for families.
  - Hairline and gap floors in device px.
  - Unit tests against closed forms, e.g. one golden turn ending at r = 45 has chord 45(1 - phi^-4) = 38.4346; three-centred arch with a = 1, h = 0.6 gives r 0.4536, R 1.5464.

2. Libraries
- Runtime dependency budget: npm 'spiro' 3.0.1 (Apache-2.0 OR MIT, TypeScript, used by Iosevka), optional, and only for knot-drawn dominant curves.
  - Consume spiroToArcsOnContext and fit the result with the engine's fitter, or call spiroToBezier with delta ≈ 0.25 rad.
  - Wrap every solve with NaN, bend > pi and end-tangent residual checks, falling back to Hobby, then to the last good solution.
- Port (small, permissive):
  - hobby.js (ISC, about 200 lines): drag preview and Spiro fallback.
  - Levien spline-research integ_spiro and fit_euler (Apache-2.0/MIT): fast clothoid path and G1 Euler segment. Never port from GPL libspiro.
  - Bertolazzi-Frego buildClothoid (BSD-2): G1 two-point clothoid, Newton with guess (20b), ≤ 5 iterations. Use it for radial fans and connectors. Use 3-clothoid G2 Hermite only when needed, and later.
  - kurbo fit.rs (phase 2).
- Tests only: @stdlib/math-base-special-fresnel (Apache-2.0) as an oracle.
- Lab only: paper.js or bezier-js for Illustrator SVG import and inspection; polygon-clipping for hit areas.
- Do not use: perfect-freehand for printed output, GSAP, CSS offset-path:path() for page-sized tracks, SMIL.

3. Spike migration (framing/)
- phi.ts: keep rung/rungOf/fitRepeats; add hysteresis.
- turtle.ts: becomes the CesaroTurtle (clothoid easements; line+arc only gives G1).
- weave.ts: keep the cosine model, phases and parity. Replace the finite-difference normals and polylines with an analytic Strand Fittable through the fitter. Add G2 end easing, the validity bounds, and stable piece ids with s-ranges.
- guilloche.ts: replace 360-sample polylines with one fitted lobe stamped by rotation, plus a phaseFn library.
- render/svg.ts: move animated parts out of <use x y> into <g transform>.

4. Determinism
- JS Math precision is implementation-dependent: round on output, compare snapshots with a tolerance in one engine (Node CI), use fixed iteration counts, and polish closed-form roots with one Newton step.
- Pin the algorithm version per node (node.algo) so committed art never shifts when the kernel improves.

5. Build order
1. Intrinsic pieces, GL evaluator, CesaroTurtle with G2 checks.
2. Phase-1 fitter and SVG emitter, offsets, profile sweep, punctuation with hysteresis.
3. Weave Strand with guards; spiral similarity copies; leaf width outlines.
4. Spiro wrapper with Hobby fallback; Bertolazzi-Frego connector; arc-length lookup tables (this enables motion).
5. LAC character dial, superellipse, kurbo fit port.
