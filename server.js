const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/reading", async (req, res) => {
  const { name, date, time, city, mood, moodHint } = req.body;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const prompt = `You are a precise western astrologer with deep ephemeris knowledge.
Person: ${name || "the user"}
Birth date: ${date}, Birth time: ${time || "unknown"}, Birth city: ${city}
Today: ${today}
Current mood: ${mood} — ${moodHint}

Calculate natal Sun, Moon, Rising, Mercury, Venus, Mars. Identify today's key transits and how they explain the ${mood} mood.

Reply ONLY with this JSON, no extra text:
{"placements":[{"planet":"Sun","sign":"Scorpio"},{"planet":"Moon","sign":"Pisces"},{"planet":"Rising","sign":"Capricorn"},{"planet":"Mercury","sign":"Scorpio"},{"planet":"Venus","sign":"Libra"},{"planet":"Mars","sign":"Virgo"}],"key_transit":"Transiting Moon square natal Saturn","transit_explanation":"Two sentences about this transit today.","mood_connection":"Two sentences connecting transits to the mood.","advice":"Two sentences of gentle advice."}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        })
      }
    );
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON returned");
    res.json(JSON.parse(match[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
