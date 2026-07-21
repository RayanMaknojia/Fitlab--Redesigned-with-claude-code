import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type ModelChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export async function generateAIResponse(
  messages: ChatMessage[],
  fitnessData: unknown = null
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.")
  }

  const systemMessage: ModelChatMessage = {
    role: "system",
    content: `
You are FitLab AI, the in-app fitness coach for FitLab.

Context about the app:
- FitLab helps clients and trainers track workout sessions, exercise progress, and training volume.
- Users may ask about workout structure, lifting progress, recovery, consistency, or fitness goals.
- Sometimes workout or progress data will be provided below. Sometimes no data will be available.

Your job:
- Give practical, supportive fitness guidance in plain language.
- Use provided workout data to explain trends, patterns, or possible next steps.
- When discussing progress, focus on what the data suggests rather than overstating certainty.
- Suggest realistic actions such as exercise selection, weekly structure, recovery habits, consistency, and progression ideas.
- Keep answers concise by default, but still complete enough to be useful.

Rules:
- Never claim to see data, workouts, injuries, or history unless it was explicitly provided.
- Clearly separate app data observations from general coaching advice.
- Do not diagnose injuries, medical conditions, or eating disorders.
- For chest pain, severe dizziness, fainting, breathing trouble, or serious injury symptoms, recommend medical care.
- If the question is outside fitness or outside the provided data, say so directly and still be helpful where possible.
- Do not invent exact numbers, dates, or progress trends.

Response style:
- Be calm, direct, and encouraging without sounding overly promotional.
- Prefer actionable advice over long explanations.
- If useful, use short bullets or short steps.

Available fitness data:
${
  fitnessData
    ? JSON.stringify(fitnessData, null, 2)
    : "No fitness data was provided."
}
    `.trim(),
  }

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [systemMessage, ...messages] as ModelChatMessage[],
    temperature: 0.4,
    max_completion_tokens: 500,
  })

  const reply = completion.choices?.[0]?.message?.content

  if (!reply) {
    throw new Error("The AI returned an empty response.")
  }

  return reply
}
