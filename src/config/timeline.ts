/**
 * TIMING  (single place to edit scroll pacing)
 * ---------------------------------------------
 * The voyage spans the whole document: top of page = harbour, bottom of page = arrival.
 * Ports of call are the elements marked `data-stop` (chapters + the contact section).
 *
 * `dwellVh` – how much scrolling (in viewport heights) around each port the boat only drifts.
 * `drift`   – chart units the boat keeps creeping while it "rests", so it never freezes.
 * `scrub`   – smoothing (seconds) between scroll position and the scene.
 */
export const TIMELINE = {
  dwellVh: 0.22,
  drift: 28,
  scrub: 0.7,
} as const
