# NamNamScore 🤤

> An AI meal companion that scores your food by **vibe**, not calories.

**Live demo → [namnamscore.vercel.app](https://namnamscore.vercel.app)**

---

## What is this?

Every calorie-tracking app turns eating into cold math and a guilt spiral. You snap a photo, get a number, feel bad, and delete the app.

NamNamScore takes a different angle: **food is emotion, not math.**

Snap a photo of your meal, and an AI character named **Nam** reacts like a witty friend — celebrating healthy choices with playful hype, and softly roasting indulgent ones with dark humor. Instead of a calorie count, you get a **Vibe Score** (0–100).

## How it works

1. 📸 Snap or upload a meal photo
2. 🤖 Gemini Vision analyzes it
3. ✨ Get your Vibe Score + a one-liner from Nam

## The Vibe Score tiers

| Score | Label | Vibe |
|-------|-------|------|
| 90–100 | ✨ Main Character Energy | Intentional, colorful, you're thriving |
| 70–89 | 🌿 Cozy Mode | Warm, home-cooked, has effort |
| 50–69 | 🤷 It Is What It Is | Functional fuel |
| 30–49 | 🍔 Comfort Crew | Indulgent, emotional support food |
| 0–29 | 😵‍💫 Survival Mode | 3am energy, chaotic, gave up |

A salad might get *"Vegetables in formation. Therapy is working."* ✨
A pizza might get *"This pizza saw your gym membership and laughed."* 🍔

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI:** Gemini Vision API (`@google/generative-ai`)
- **Deployment:** Vercel

The real product lives in the prompt — a 5-tier scoring system with score-dependent tone shifts (celebrate the healthy, roast the indulgent), anti-inflation rules, and few-shot humor examples.

## Run locally

```bash
git clone https://github.com/yuezhang87/namnamscore.git
cd namnamscore
npm install
# Add your GEMINI_API_KEY to .env.local
npm run dev
```

## Why I built it

I was tired of health apps that made me feel worse, not better. NamNamScore is the app I wished existed — one that makes you laugh instead of feeling judged. Built in a few days as a fun experiment in prompt engineering and building in public.

---

*Built by [Yue](https://github.com/yuezhang87) · Powered by Gemini Vision*