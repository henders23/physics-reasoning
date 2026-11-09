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
- **03 · ²³⁵U — Splitting the heavyweight:** fission Q-value from binding energy per nucleon, and the rest-mass fraction released.
- **04 · p + p — Too cold to burn:** the Coulomb barrier against kT in the solar core, and why fusion needs tunnelling.
- **05 · Moderator — Slowing the messenger:** elastic-collision kinematics and the number of collisions to thermalise in H, C and Pb.

## What's in this repository

| Folder | What it is |
| --- | --- |
| `prototype/` | The working prototype as a single HTML page (React and Tailwind from CDNs, compiled in the browser): an intro screen, all five problems with the gated stages, answer checking, diagrams (¹³⁷Cs Stages I and V, and Stage I of every other problem) and the live coach. |
| `api/` | `coach.js`, the Vercel function that calls Claude for the coach. |
| `design/` | The redesign, as Claude Design canvas source: an intro screen, all five ¹³⁷Cs stages, ⁹⁹ᵐTc Stage I, and the shared header and coach panel. `canvas.json` holds the layout and the notes, including the ⁹⁹ᵐTc text for Stages II–V. These files open in Claude Design; they need its runtime (`support.js`) and won't render on their own. |

The prototype follows the design in `design/`. Two parts of the design aren't drawn as screens yet: ⁹⁹ᵐTc Stages II–V and the completion messages, whose text is in the canvas notes. The prototype already implements both from the problem configuration.

## The coach and deployment

The site deploys to Vercel from `main`. `vercel.json` serves `prototype/index.html` at the site root, and `api/coach.js` is a serverless function that runs the coach.

- **On Vercel:** the page posts the problem id, the student's reasoning trace and the chat to `/api/coach`. The function holds the Anthropic API key, builds the coach's system prompt from `prototype/coach-data.js` and calls Claude (`claude-opus-5-5` at low effort). Students need no account and never see the key; the endpoint only ever runs the coach.
- **As a published Claude artifact:** the page detects the artifact runtime and uses the viewer's own Claude sign-in instead. Publish `prototype/coach-data.js` alongside the page.

### Switching the coach on

1. In the Vercel project, open **Settings → Environment Variables** and add `ANTHROPIC_API_KEY` with a key from the Claude Console (platform.claude.com). Tick Production, and Preview if you want it on preview deployments too.
2. Redeploy (Deployments → ⋯ → Redeploy), since environment variables apply only to new deployments.
3. Optional: `COACH_MODEL` overrides the model, for example `claude-sonnet-5-5` or `claude-haiku-5-5` for a cheaper coach.

Until the key is set, the coach panel tells students it isn't switched on yet. Function errors appear under the deployment's **Logs** in Vercel. Set a monthly spend limit for the key in the Claude Console before sharing the link with a cohort.

## Adding a problem

Each problem is one configuration object in the `PROBLEMS` array in `prototype/index.html`: hypotheses, estimates, expressions, numeric answers with tolerances, reconcile rows, and closing text. The coach's hidden knowledge for it goes in `prototype/coach-data.js` under the same id. Adding another problem means writing those two entries, not changing the engine.
