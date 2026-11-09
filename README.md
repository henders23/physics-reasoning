# Physics reasoning — a reasoning-first problem environment

An interactive problem set for PHYSM0047 (Nuclear Science, University of Bristol), built as a BILT project. Students commit to their reasoning before any calculation unlocks, then reconcile their result against their own earlier predictions. A Socratic AI coach is available at every stage; it reads the student's committed work and replies only with questions.

## The five stages

1. **Frame the physics.** Commit to a hypothesis, with a written justification.
2. **Estimate first.** Commit to orders of magnitude and qualitative predictions.
3. **Formulate.** Assemble the governing expressions. The wrong options are the classic errors.
4. **Solve.** Only now, the numbers.
5. **Reconcile.** Hold the calculation up against your own commitments and deliver a verdict.

## Problems

- **01 · ¹³⁷Cs — The stubborn nucleus:** decay identification and Q-values from atomic mass excesses.
- **02 · ⁹⁹ᵐTc — Milking the cow:** coupled decay and transient equilibrium in a ⁹⁹Mo generator.

## What's in this repository

| Folder | What it is |
| --- | --- |
| `prototype/` | The working prototype as a single HTML page (React and Tailwind from CDNs, compiled in the browser): an intro screen, both problems with the gated stages, answer checking, animated diagrams (¹³⁷Cs Stages I and V, ⁹⁹ᵐTc Stage I) and the live coach. |
| `design/` | The redesign, as Claude Design canvas source: an intro screen, all five ¹³⁷Cs stages, ⁹⁹ᵐTc Stage I, and the shared header and coach panel. `canvas.json` holds the layout and the notes, including the ⁹⁹ᵐTc text for Stages II–V. These files open in Claude Design; they need its runtime (`support.js`) and won't render on their own. |

The prototype follows the design in `design/`. Two parts of the design aren't drawn as screens yet: ⁹⁹ᵐTc Stages II–V and the completion messages, whose text is in the canvas notes. The prototype already implements both from the problem configuration.

## The coach and deployment

The AI call lives in one function, `askCoach()`, in `prototype/index.html`.

- **As a published Claude artifact (now):** the coach runs on the viewer's own Claude sign-in, so anyone using it needs a Claude account.
- **For the cohort (planned):** replace the body of `askCoach()` with a `fetch` to a serverless proxy (for example on Vercel). The proxy holds the Anthropic API key and the coach's system prompt server-side, so students need no account and never see either.

## Adding a problem

Each problem is one configuration object in the `PROBLEMS` array in `prototype/index.html`: hypotheses, estimates, expressions, numeric answers with tolerances, reconcile rows, closing text and the coach's hidden knowledge. Adding a third problem means writing one more object, not changing the engine.
