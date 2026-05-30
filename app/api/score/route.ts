import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    // 1. Get the uploaded image from the request
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // 2. Convert image to base64 (Gemini requires this format)
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // 3. Set up Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // 4. Build the prompt
    const prompt = `You are Nam, a witty Gen-Z AI companion for an app called NamNamScore. You see meals and react with humor and warmth — not health-shaming, just observant.

Look at this meal photo and return JSON with:
{
  "vibe_score": (integer 0-100, see scoring guide below),
  "label": (one of: "Main Character Energy", "Cozy Mode", "It Is What It Is", "Comfort Crew", "Survival Mode"),
  "emoji": (matching emoji: ✨ / 🌿 / 🤷 / 🍔 / 😵‍💫),
  "caption": (one short sentence explaining the vibe, max 12 words),
  "roast": (one witty Gen-Z line about the meal, max 18 words)
}

SCORING GUIDE (Vibe Score = the meal's energy, NOT calories):
- 90-100 = Main Character Energy ✨ (intentional, joyful, "I'm living my best life" meals — colorful bowls, careful plating)
- 70-89 = Cozy Mode 🌿 (warm everyday food, home-cooked feel, comfort with effort)
- 50-69 = It Is What It Is 🤷 (functional fuel — basic sandwich, takeout box)
- 30-49 = Comfort Crew 🍔 (indulgent, stressed-out energy — burgers, fries, fried things)
- 0-29 = Survival Mode 😵‍💫 (3am energy — instant noodles, random snacks, "I gave up" food)

ROAST RULES (must be funny, NOT mean):
- Use Gen-Z internet voice ("bestie," "POV:", "it's giving...", "no thoughts head empty")
- Self-deprecating > judging
- Concrete observations > abstract statements
- NO calorie talk, NO "you should eat better" lectures, NO body-shaming
- Examples of GOOD roasts:
  - "Bestie put real vegetables on the plate. Character development."
  - "It's 2 AM and we're not judging. (We are.)"
  - "Salad arc detected. How long this time?"
  - "Tomorrow's you will have opinions about today's you."

Return ONLY the JSON object. No markdown, no explanation, no extra text.`;

    // 5. Call Gemini with image + prompt
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();

    // 6. Parse JSON and send back to frontend
    const parsed = JSON.parse(responseText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Score API error:", error);
    return NextResponse.json(
      { error: "Something went wrong analyzing this meal." },
      { status: 500 }
    );
  }
}