import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Set OPENAI_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { years, metrics, projection, fallback } = body;

  // Build a structured context for the AI — NOT the summary itself.
  // The AI should reflect and position, not regurgitate numbers.
  const pillars = [];
  if (metrics.latestInstruction || metrics.instructionsReceived > 0) pillars.push("guru");
  if (metrics.dailyStudyHours >= 0.5) pillars.push("śāstra");
  if (metrics.devoteeContactCount >= 1) pillars.push("sādhu");

  const context = {
    horizon: `${years} years`,
    ashrama: metrics.ashrama || "grhastha",
    sattvaScore: projection.sattvaScore,
    rajasLevel: metrics.rajas,
    tamasLevel: metrics.tamas,
    studyHoursPerDay: metrics.dailyStudyHours,
    sixteenRoundsPct: metrics.sixteenRoundsPct,
    regulativeAdherence: metrics.regulativeAdherence,
    booksCompleted: projection.booksCompleted,
    versesKnown: projection.versesKnown,
    vocabKnown: projection.vocabKnown,
    sevaDays: metrics.sevaDays,
    homePoojaDays: metrics.homePoojaDays,
    devoteeContacts: metrics.devoteeContactCount,
    pillarsActive: pillars,
    latestInstruction: metrics.latestInstruction || "",
    openQuestion: metrics.openQuestion || "",
    tutorTopic: metrics.tutorTopic || "",
    warnings: projection.warnings || [],
  };

  const systemPrompt = `You are a wise Vaishnava elder — not a data analyst. You have been given structured metrics about a devotee's spiritual trajectory projected ${years} years forward.

Your job is NOT to list the numbers back. The devotee already sees those in the UI. Instead:

1. REFLECT on what the numbers mean for their inner life — their relationship with Kṛṣṇa, their character development, their readiness to face death.
2. POSITION them honestly — where they are relative to the standard of a mature devotee. Be kind but unflinching.
3. CHALLENGE with one pointed question or exhortation that comes from the tradition (cite śāstra naturally, not academically).
4. Ground everything in guru-śāstra-sādhu. If a pillar is missing, name it. If all three are active, celebrate that.

Tone: Like a loving senior god-brother writing a personal letter. Not clinical. Not cheerful. Not flattering. Warm but direct.

Length: 3-5 sentences max. Quality over quantity.

Do NOT:
- List metrics or numbers
- Say "based on your data" or "according to your metrics"
- Use bullet points or headers
- Be generic or motivational-poster style
- Repeat what the fallback summary already says`;

  const userPrompt = `Here is the devotee's projected state at ${years} years:
${JSON.stringify(context, null, 2)}

Write a brief, personal, reflective summary for this devotee. Speak to them directly.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", err);
      return NextResponse.json({ summary: fallback }, { status: 200 });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || fallback;
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("OpenAI fetch error:", err);
    return NextResponse.json({ summary: fallback }, { status: 200 });
  }
}
