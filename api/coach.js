/* POST /api/coach — the Socratic coach, server-side.

   Holds the Anthropic API key (env var ANTHROPIC_API_KEY, set in the
   Vercel project) and builds the coach's system prompt from
   prototype/coach-data.js. The browser sends only:
     { problemId, trace, stageLabel, thread: [{ role: "coach"|"student", text }] }
   so the endpoint can't be repurposed as a general Claude proxy.
   Replies: 200 { text } or an error status with { error, code }. */

const Anthropic = require("@anthropic-ai/sdk");
const COACH = require("../prototype/coach-data.js");

const MODEL = process.env.COACH_MODEL || "claude-opus-5-5";
const LIMITS = { thread: 40, text: 4000, trace: 8000, stageLabel: 200 };

let client = null;

function fail(res, status, code, error) {
  res.status(status).json({ code, error });
}

function str(v, max) {
  return typeof v === "string" && v.length <= max ? v : null;
}

/* Same message shape the artifact route uses: the student's trace and
   the current stage open the conversation, then the chat alternates. */
function buildMessages({ trace, stageLabel, thread }) {
  const opening =
    `STUDENT REASONING TRACE SO FAR:\n${trace}\n\nCURRENT STAGE: ${stageLabel}\n\n` +
    "The conversation below is between you (coach) and the student, within this stage." +
    (thread.length === 0
      ? "\n\n(The student has just opened the coach panel. Greet them in one short sentence and ask one opening question suited to this stage.)"
      : "");
  const messages = [{ role: "user", content: opening }];
  for (const m of thread) {
    const role = m.role === "coach" ? "assistant" : "user";
    const last = messages[messages.length - 1];
    if (last.role === role) last.content += "\n\n" + m.text;
    else messages.push({ role, content: m.text });
  }
  return messages;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(res, 405, "method", "Use POST.");
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(res, 503, "not_configured", "ANTHROPIC_API_KEY is not set for this deployment.");
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const problemId = str(body.problemId, 40);
  const trace = str(body.trace ?? "", LIMITS.trace);
  const stageLabel = str(body.stageLabel ?? "", LIMITS.stageLabel);
  const thread = Array.isArray(body.thread) ? body.thread : null;
  if (!problemId || !COACH.PROBLEMS[problemId]) return fail(res, 400, "bad_request", "Unknown problem.");
  if (trace === null || stageLabel === null || !thread || thread.length > LIMITS.thread) {
    return fail(res, 400, "bad_request", "Malformed request.");
  }
  for (const m of thread) {
    if (!m || (m.role !== "coach" && m.role !== "student") || !str(m.text, LIMITS.text)) {
      return fail(res, 400, "bad_request", "Malformed message.");
    }
  }
  if (thread.length && thread[thread.length - 1].role !== "student") {
    return fail(res, 400, "bad_request", "The last message must be the student's.");
  }

  client = client || new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "low" },
      // If a safety classifier declines, the API retries on its recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: COACH.buildSystem(problemId),
      messages: buildMessages({ trace, stageLabel, thread }),
    });

    if (response.stop_reason === "refusal") {
      return res.status(200).json({ text: "Let’s keep to the physics — which part of your reasoning shall we look at next?" });
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) return fail(res, 502, "empty", "The coach returned no text.");
    return res.status(200).json({ text });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return fail(res, 429, "rate_limited", "Rate limited.");
    if (e instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic auth failed — check ANTHROPIC_API_KEY");
      return fail(res, 503, "not_configured", "The API key was rejected.");
    }
    if (e instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${e.status}:`, e.message);
      return fail(res, 502, "upstream", "The coach service returned an error.");
    }
    console.error("Coach request failed:", e);
    return fail(res, 502, "upstream", "The coach service could not be reached.");
  }
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
