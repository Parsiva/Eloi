# Measuring the hand-drawn pieces against golden geometry

> Read-only numerical analysis of `src/ornaments/hand-drawn.svg` (pieces cut from `websiteVectorOutline.svg`). Scripts are in [`analysis/`](analysis/). Part of the [frame engine research](README.md).

## Method

I wrote read-only Node scripts in the scratchpad; no project files were changed. geom.mjs parses each <symbol> in hand-drawn.svg. It handles M/c/s/l/h/V/Z with Illustrator-packed numbers, plus line and polyline, converts everything to absolute cubics and lines, and samples each segment at 300-600 points with arc length and analytic signed curvature. Each piece was rendered with element indices through headless Chrome (png_*.png) so features could be identified by eye. The methods:
(a) Circle fit: geometric least squares, multi-start Nelder-Mead.
(b) Log-spiral fit r=a*e^(b*theta) with a free centre: for each candidate pole, unwrap theta along the ordered points, regress ln r on theta, and minimise the RMS of the approximate normal distance dr/sqrt(1+b^2) over the pole. Also run with b fixed at +-0.30635, as a profile of RMS against b, and as a 'rule' model with tips at equal angular steps on one spiral.
(c) Curvature models on runs between inflections: circle (coefficient of variation of k), clothoid (k linear in s), log spiral (Cesaro form: radius of curvature linear in s, slope = b), and a power law k~s^p.
(d) Procrustes similarity fits (scale, rotation, optional reflection) on control points, to detect copy, scale and mirror relations.
(e) Nested-line gaps: intersect each fan family with normals to its middle line at 10-90% of its length; report successive gaps, their ratios, and geometric and linear trend fits, plus spacing between endpoints.
(f) Anchor test: whether each open stroke end lies on another stroke (within 0.15u) or on the medallion ellipse.
Units are drawing units of websiteVectorOutline.svg; strokes are 0.5-1u wide. Caveat for all ratio comparisons: every number lies within +-12% of some half-power of phi, and the expected error is about 6%. A 'phi match' at 3-8% error is therefore not evidence; only matches under about 2% are meaningful.

## Findings

### corner-flame — Q1a: curve through the six leaf tips (closed leaves #9-#14, which are also the outer vertices of serrated outline #15). Circle fit vs free-centre log spiral.

*Confidence: high*

Tips: (103.29,971.53) (121.69,991.01) (127.88,1009.23) (127.33,1027.31) (120.49,1039.08) (111.20,1046.78).

Circle: centre (83.33,1012.60), r=45.08, RMS 0.88, max 1.31.

Free log spiral: pole (93.82,1032.75), |b|=0.488, growth per quarter turn e^(b*pi/2)=2.15 (phi=1.618), sweep 120 deg, RMS 0.21, max 0.35. About this pole the tip angular steps are 24.9/21.6/25.4/22.6/25.6 deg (fairly even, ~24 deg) and the radius ratio per step is 1.21-1.24.

Golden b forced (free centre): pole (88.83,1026.73), RMS 0.39, max 0.69.

RMS profile against |b|: 0.05:0.80, 0.15:0.64, 0.25:0.48, 0.306:0.39, 0.40:0.26, 0.50:0.21, 0.60:0.30, 0.80:0.64. The minimum is broad and centred at 0.45-0.55.

Rule model (tips at equal angular steps on one spiral): best b=0.48, step 23.9 deg, RMS 0.58. With golden b: step 25.0 deg, RMS 1.61, per-tip displacement 2.36/1.64/1.25/1.43/0.57/1.82.

Pole fixed at the vein origin (68.91,1084.41): RMS 6.1, so the tips are NOT a spiral about the vein origin.

Other point sets: notches/vein ends: free b=0.95 RMS 0.10, golden RMS 0.24, circle RMS 0.33. Leaf bases: free b=0.73 RMS 0.14, golden RMS 0.24.

Left flame tongue tips (24.05,899.44) (33.97,916.97) (44.37,949.94) (47.77,977.96) (62.48,1004.27) lie on a near-straight line (circle r=12155, RMS 2.4), not a spiral.

**Against φ:** The best-fit b of 0.49 is 1.6x golden: the curve tightens faster than a golden spiral (2.15 per quarter turn vs 1.618). Golden b is still acceptable as a free fit (tips move 0.39 RMS, max 0.69u, under 1.5 stroke widths). The arc covers only 120 deg, so circle, golden spiral and b=0.5 spiral all fit to within about 1.3u; the data cannot tell them apart strongly.

### corner-flame — Q1b: individual leaf curvature and per-leaf log-spiral b; how the leaves relate to each other.

*Confidence: high*

The six leaves are exact similarity copies of leaf #9: control-point RMS 0.003-0.005u after scale and rotation.
- Scales: 1, 0.897, 0.7395, 0.594, 0.4229, 0.2661.
- Rotations: 0, 21.0, 40.9, 63.3, 78.3, 90.0 deg.
- The scales follow an arithmetic sequence (linear fit, step -0.150, R2 0.996), not a geometric one (R2 0.946, ratio 1.30). Successive scale ratios are 1.11, 1.21, 1.24, 1.40, 1.59.
- Leaf size relative to tip distance from the spiral pole is not constant (1.19 to 1.79 per 100u), so the leaves are not self-similar along the spiral. The last leaf is about 30% too small for that.
- Leaf rotation steps (21, 20, 22, 15, 12 deg) do not match the polar steps of the tips (25, 22, 25, 23, 26 deg).

Shape of one leaf (#9, length 37.3u): two cubics.
- Front side: an S with an inflection at s=15. Runs turn 45 deg and 49 deg; geometric spiral fits give b=0.38 (RMS 0.02) and b=0.59 (RMS 0.03).
- Back side: a single C run turning 67 deg. Curvature rises from 0.002 to a peak of 0.069 (rho min 14.5u) and falls again. That is a bell-shaped profile, not monotone: Cesaro R2 0.11, clothoid R2 0.00. Geometric spiral fit b=0.21, RMS 0.22 (0.6% of length).

Because the leaves are copies, b is identical across leaves (0.207-0.211; 0.381-0.384; 0.583-0.592). Over all 17 runs: |b| mean 0.394, median 0.383, sd 0.159, range 0.207-0.592. Serrated outline #15 cubics: geometric b 0.46-3.3 with no consistency.

**Against φ:** The spread of b sits around golden 0.306: front-top 0.38, front-bottom 0.59, back 0.21. No single side is a log spiral, because a single cubic's curvature peaks mid-segment instead of growing monotonically. Making leaves 'perfectly golden' therefore means redrawing them as true spiral arcs, not snapping the existing cubics.

### corner-flame — Q1c: vein fan (#19-#24) and other structure

*Confidence: high*

All six veins start exactly at (68.91,1084.41). Their end directions are -78.2, -66.5, -58.8, -53.3, -48.8, -47.4 deg; steps 11.7, 7.7, 5.5, 4.6, 1.4 deg (step ratios 1.52, 1.40, 1.20, 3.24, so not geometric). Chord lengths fall 95.4, 88.8, 81.2, 73.5, 65.1, 56.9 (about 7.7u per step, arithmetic). Vein ends coincide with the serrated-outline notches. 53% of the flame's open stroke ends lie on another stroke.

**Against φ:** No phi. Spacing is roughly arithmetic, and the angular steps shrink irregularly.

### corner-medallion — Q2a: main S-sweep #113 (stem at 72.85,321.82 -> around medallion -> 171.9,187.8) and parallel sweep #114: curvature model

*Confidence: high*

#113 (length 765u) has inflections at s=34, 132.6 (109.6,234.7), 610.7 and 670.1.
- Upper limb (inflection at s=133 to peak |k| at s=265, 135u, 51 deg turn): curvature grows from 0 to 0.0139. Clothoid R2 0.980; power law k~s^1.10 R2 0.988; exponential R2 0.81; log spiral (Cesaro) R2 0.03. Golden-b spiral forced: RMS 1.31, max 3.16.
- Lower limb (back toward the stem, 76u): k~s^1.58 R2 0.93; clothoid R2 0.80; log spiral R2 0.05.
- #114 upper limb: clothoid R2 0.97, p=1.16. #114 lower limb: p=1.48, R2 0.95.
- Medallion arc segments 2-3 (s 290-560, 268u, 170 deg turn): near-circular, curvature 0.0066-0.0136, coefficient of variation 0.18. Circle fit r=85.76 centred at (129.89,134.14), RMS 0.54, max 2.19. That centre is 3.5u below the ellipse centre (129.82,130.63); distance from the ellipse centre ranges 82.4-88.0. Ratio r / mean ellipse radius (71.42) = 1.20.
- Bottom stem x positions: 32.94, 44.45, 61.34, 72.85. Gaps 11.51 / 16.89 / 11.51 (two 2-line ribbons); middle/outer gap = 1.467.

**Against φ:** The S-limbs are clothoids (Euler spirals): curvature is close to linear in arc length (p about 1.1). The ring part is a circular arc. Neither is a log spiral. The 1.20 ring/ellipse ratio is not phi. The stem gap ratio of 1.467 is 9% under phi; if made golden, the middle gap would be 18.62 instead of 16.89 (+1.7u).

### corner-medallion — Q2b: right-hand scroll curl #103 (and the top scroll end of #0): log-spiral fit

*Confidence: medium*

#103 inner curl (segments 4-10, 88u long, about 640 deg wound):
- Free log spiral: pole (241.91,111.34), |b|=0.16, growth 1.29 per quarter turn and 2.76 per full turn. RMS 1.43, max 10.2 (poor).
- Local b in a sliding +-90 deg window wanders 0.52 -> 0.13 -> 0.21 -> 0.01 -> 0.43, so the curl is not one spiral.
- Radius ratios between successive turns along rays from the pole: 1.95-5.0.
- Innermost 1.5 turns (segments 5-10): log spiral b=0.144 (2.47 per turn) RMS 0.41, versus Archimedean pitch 4.73u/turn RMS 0.39. The two fit equally well.
- Golden b forced: RMS 2.83, max 4.42.
- Including the outer loop (segments 3-10): free b=0.27, RMS 4.65 (fit fails).

#0 top-right scroll (last 3 segments, 115u): free b=0.36 (1.76 per quarter turn), RMS 3.53, max 6.8, local b 0.25-0.83. Golden forced: RMS 3.94 (no real difference, both poor).

The end loops of #0 and #61 are teardrop loops, not spirals (RMS 6-8).

**Against φ:** The #103 curl is much tighter than golden: about 2.5-2.8 growth per turn against phi^4 = 6.85. Its b of 0.14-0.16 is about half of golden. Rebuilding it as golden at the same outer size would leave about half as many visible turns, or need a far smaller eye; this is a visible change. The #0 scroll averages b 0.36, near golden, but the fit is too poor to support the claim.

### corner-medallion — Q2c: clustered nested lines: spacing and ratios of successive gaps

*Confidence: high*

Family A, tendrils #28-#34 (7 lines):
- All end exactly at (57.04,130.62), the leftmost point of the medallion ellipse.
- Lines cross: the order goes 1,0,2,...
- Gaps at mid-length: 2.56/2.78/2.99/3.39/2.90/2.29 (coefficient of variation 0.12, successive ratios 0.79-1.14). At 40%: 1.43-5.05 (ratios 0.9-1.93). At 75%: 1.74 -> 0.69, decreasing (geometric 0.81).

Family B, #55-#60 (6 lines):
- All end exactly at (173.57,186.62), which lies on the ellipse.
- Open-end start spacing 2.37/2.65/2.38/2.58/2.55 (even, coefficient of variation about 5%).
- Mid gaps 0.69/1.00/0.68/0.92/0.68 (ratios 0.68-1.44, alternating jitter).

Family C, feather #87-#96 (10 lines, with outer #86):
- Near the narrow end, gaps about 0.92 (coefficient of variation 0.11, ratios 0.79-1.22). At 90%: gaps 2.93/2.76/2.82/3.92/4.47/5.32, growing outward (geometric 1.145/step, R2 0.85).
- At 50-60% there is a jump between lines 5 and 6 (1.17 -> 2.68), so two sub-groups.
- Free-end spacing 9.75/8.71/7.99/7.96/7.07/7.02/6.05/6.56/6.12, decreasing roughly linearly (about 0.93x per step).

Family D, curl fan #105-#110: gaps 3.8/4.4/3.3/2.3 at mid; endpoint spacing 8.7/6.3/6.8/5.8.

**Against φ:** No family shows a phi progression. Spacing is roughly even with hand jitter of 10-40%, and successive gap ratios scatter from 0.7 to 1.5 around 1.0. Where there is a trend (feather C outer end, 1.14 per step; tendril tail, 0.81 per step), it is far from 1.618 and comes from lines fanning out from a shared convergence point.

### corner-medallion — Q4: other structural relations in the medallion

*Confidence: high*

- 62% of the 214 open stroke ends lie on another stroke. The anchors on the ellipse (cx 129.82, cy 130.63, rx 72.78, ry 70.06; rx/ry 1.039, an intended circle): tendrils #28-34 at its leftmost point; fan #55-60 at (173.6,186.6); #114 ends at the rightmost point (202.6,130.6); ring loops #40-#48 all end on the ellipse.
- Ring loops #40-#49 are near-copies of #43 (scale 0.85-1.06, RMS 0.004-1.4). They sit at radius 76-81 from the ellipse centre, with angular steps 24.0, 24.8, 31.0, 28.0, 31.6, 30.4, 25.8, 28.3, 27.9 deg (mean 28.0, coefficient of variation about 10%). #50-52 leave the ring and run down the stem; stem loops #99-102 are copies scaled 1.02-1.12.
- Scallops #12-#22 have an exact 9.00 pitch (copy-repeat); the last three, done by hand, are 7.74, 8.10, 8.63.
- Curls #1-#4 have lengths 57.07, 43.15, 31.72, 22.27 (ratios 1.32, 1.36, 1.42, not constant).
- #62-#65 are exact diagonal mirrors of #1-#4 (reflection plus 90 deg, RMS 0.00-0.03), so the corner has 45-deg mirror symmetry in places.
- Hatch lines #70-73 have lengths 8.27/5.66/3.99/2.26 (ratios 1.46/1.42/1.76).
- Piece w/h = 1.181.

**Against φ:** Curl length ratios of about 1.37 fall between sqrt(phi)=1.272 and phi, and are not constant. Nothing else is close to phi. The strong, exact relations are copy/scale/mirror and snapping ends onto the circle; these are relational constraints, not phi constraints.

### crest — Q3: crest proportions

*Confidence: high*

- Exactly mirror-symmetric about x=854.91 (max control-point deviation 0.01).
- Overall bbox 87.57 x 47.77 (w/h 1.833).
- Axis features as a fraction of height from the top tip: inner tip 0.132, heart cusp 0.448, wing root 0.375, upper-heart bottom 0.630, wing tips 0.932, bottom 1.
- Inner upper heart #10 is an exact copy of outer heart #1 scaled by 0.7025 about the cusp (fixed point near (854.91,21.2)), RMS 0.003.
- Outer heart 37.22 x 30.08 (w/h 1.237); lower heart #0 26.95 x 26.36 (w/h 1.023), not a copy of either (RMS 2.7).
- Ratios: outer/lower heart width 1.381, height 1.141. Cusp depth ratio (top->cusp)/(cusp->bottom) = 0.812. Wing span / upper-heart width = 2.353.
- Wing hooks #7, #8, #9 are approximate scale copies (1.29, 1.22; RMS 2-3); their end offsets from the axis are 27.14, 30.88, 35.47.

**Against φ:** The inner/outer heart scale of 0.7025 is 1/sqrt(2) (0.7071, 0.65% off), not 1/phi (12% off). Crest w/h 1.833 = phi^1.26 (11% from phi^1.5). The cusp ratio 0.812 vs phi^-0.5=0.786 (3.3%) and upper heart w/h 1.237 vs sqrt(phi) (2.7%) are within chance level. No convincing phi in the crest.

### side-leaf — Q3: side-leaf proportions

*Confidence: medium*

- The bottom half is an exact mirror of the top half about y=631.7 (RMS 0.18-0.23).
- bbox 62.17 x 243.74 (h/w 3.92); half-height 121.87.
- Leaf and lobe tip heights above the axis: 11.97 (#8), 26.88 (#13), 31.13 (#5), 52.92 (#6), 70.89 (#0 lobe). As fractions of half-height: 0.098, 0.221, 0.255, 0.434, 0.582.
- Successive ratios: 2.25, 1.16, 1.70, 1.34, 1.72 (to the half-height).
- All fan strokes converge at the socket (74.83,631.7).

**Against φ:** h/w 3.92 = phi^2.84 (7% from phi^3). Tip fractions against phi^-n: 0.098 vs 0.090 (+9%), 0.255 vs 0.236 (+8%), 0.434 vs 0.382 (+14%), 0.582 vs 0.618 (-6%). Ratios jump between 1.16 and 2.25. No phi structure beyond chance.

## Implications for the engine

- The drawings are not phi-governed now. Of all the measured ratios, only the flame tip curve comes near golden, and even there the best b is 0.49, not 0.306. The exact relations that do exist are Illustrator operations: similarity copies (flame leaves, crest hearts at 1/sqrt(2), ring loops), mirrors (crest, side-leaf, the diagonal in the medallion), exact repeats (scallop pitch 9.00) and snapping ends onto a circle. An engine should formalise these four operations (copy-along, scale-about, mirror, attach-to-curve) first and add phi as a parameter choice on top. The designer already works this way, which makes it realistic to design in.
- Flame: rebuild it as one log-spiral 'spine' through the tips, with N leaves placed at equal angular steps. The leaf prototype gets scale proportional to spine radius and rotation equal to the spiral tangent angle plus a constant. With b=0.306 instead of the drawn 0.49, each tip moves about 1.6u RMS (max 2.4u) on a 119x209 piece, roughly 1-2% of the width and 3-5 stroke widths. That is visible on close comparison but keeps the same character; a free-pole golden fit moves the tips only 0.39 RMS (max 0.69u). The bigger visual change is the leaf sizes. They currently shrink linearly (1 -> 0.27); a self-similar rule would make them shrink geometrically, about 0.875 per 25-deg step at golden b, or 0.82 at b=0.49, so the smallest leaves would get noticeably larger.
- Leaf shapes: each leaf side is one cubic with a mid-segment curvature peak, so no side is a log spiral. To get leaves that are 'perfectly golden', the engine has to generate each side as a log-spiral or clothoid arc (or a G2 spline with a prescribed curvature profile) and then fit cubics for SVG output. Snapping the existing control points will not do it. Measured local b of 0.21 (back) and 0.38/0.59 (front S) sit on either side of 0.306, so a golden leaf template is a plausible stylisation.
- Medallion sweep: the S-curves are clothoids (curvature about linear in arc length, R2 0.98), and the ring part is a circle of radius about 1.2x the medallion radius. The natural 'dominant function' is therefore a circle-plus-Euler-spiral spline (as in Raph Levien's Spiro/Euler-spiral splines), not a golden spiral. Forcing a golden log spiral onto the limbs costs 1.3 RMS and 3.2u max with the wrong look. Phi can still set radii, for example ring radius = phi^k x medallion radius (it is 1.20 now; phi^0.5=1.27 would grow the ring about 5u), and the stem spacing (middle/outer gap 1.467 -> phi adds 1.7u).
- Curls: the right scroll (#103) is a tight volute (b 0.14-0.16, about 2.5x growth per turn), and its inner part fits Archimedean equally well. A golden curl (6.85x per turn) is clearly more open; at the same outer size it shows about half as many turns. Expose 'turns' and 'b' as separate parameters, and let the designer choose golden b or a volute.
- Nested line fans: the spacing is near-even with 10-40% jitter, and lines converge exactly on anchor points on the medallion circle. An engine can generate them as offsets or interpolations between two guide curves (Illustrator-blend-like), with a spacing law that is either uniform or geometric with ratio r. The drawn data supports uniform spacing (or r of about 1.1-1.15 at the open end), not r=phi; phi spacing (1.618 per step) would collapse the inner lines and look very different. The uniform/geometric choice should be a dial, not a hard-coded phi rule.
- Because 62% of medallion stroke ends sit on other strokes (and fans sit on ellipse extremes and specific angles), the engine's core data model should be an attachment graph: each element is parameterised by the curve it hangs from (parameter t or angle on its parent) plus a local transform. Re-flowing to any page size then means moving the dominant curves, and the dependents follow.
- Design workflow: the designer can keep drawing in Illustrator, with the engine fitting parameters back out, which is what these scripts do. Spiral pole and b, copy scale and rotation, mirror axis and attachment are all recoverable automatically, with residuals reported (copies at 0.003u, ring at 0.5u RMS). A 'fit then snap with a tolerance report' loop (for example 'snapping to golden moves tips 0.4-2.4u') is realistic. Note the look-elsewhere caveat: any ratio is within 12% of some half-power of phi, so the engine should impose phi by construction and not hunt for it in drawings.
