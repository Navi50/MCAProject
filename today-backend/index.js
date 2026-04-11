const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.get('/', (req, res) => {
  res.json({ message: 'Backend running 🚀' });
});


// 🌤 WEATHER
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) return res.json(null);

    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: { latitude: lat, longitude: lon, current_weather: true },
    });

    res.json(response.data.current_weather || null);
  } catch (err) {
    console.error("Weather error:", err.message);
    res.json(null); // ✅ NEVER 500
  }
});


// 🌅 SUN
app.get('/api/sun', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) return res.json(null);

    const response = await axios.get('https://api.sunrise-sunset.org/json', {
      params: { lat, lng: lon, formatted: 0 },
    });

    res.json(response.data.results || null);
  } catch (err) {
    console.error("Sun error:", err.message);
    res.json(null);
  }
});


// 🌙 MOON (SAFE)
app.get('/api/moon', async (req, res) => {
  try {
    if (!process.env.IPGEO_API_KEY) {
      console.log("Moon skipped (no API key)");
      return res.json(null); // ✅ FIX
    }

    const response = await axios.get('https://api.ipgeolocation.io/astronomy', {
      params: { apiKey: process.env.IPGEO_API_KEY },
    });

    res.json(response.data || null);
  } catch (err) {
    console.error("Moon error:", err.message);
    res.json(null);
  }
});


// 📜 HISTORY (SAFE)
app.get('/api/history', async (req, res) => {
  try {
    const today = new Date();

    const month = today.getMonth() + 1; // ✅ number (safe)
    const day = today.getDate();

    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
      {
        headers: {
          "User-Agent": "Today-App/1.0"
        }
      }
    );

    const events = response.data?.events || [];

    res.json(events.slice(0, 5));

  } catch (err) {
    console.error("History error:", err.response?.data || err.message);

    // ✅ ALWAYS SAFE
    res.json([]);
  }
});


// 📰 NEWS (SAFE + RATE LIMIT PROTECTION)
let lastNewsCall = 0;

app.get('/api/news', async (req, res) => {
  try {
    const now = Date.now();

    if (now - lastNewsCall < 2000) {
      return res.json([]); // prevent spam
    }

    lastNewsCall = now;

    const { country } = req.query;

    const response = await axios.get('https://gnews.io/api/v4/top-headlines', {
      params: {
        country,
        lang: 'en',
        max: 5,
        apikey: process.env.NEWS_API_KEY,
      },
    });

    res.json(response.data.articles || []);
  } catch (err) {
    console.error("News error:", err.response?.data || err.message);
    res.json([]); // ✅ FIX
  }
});


// 🎉 HOLIDAYS
app.get('/api/holidays', async (req, res) => {
  try {
    const { country, year, month, day } = req.query;

    const response = await axios.get('https://calendarific.com/api/v2/holidays', {
      params: {
        api_key: process.env.CALENDARIFIC_API_KEY,
        country,
        year,
        month,
        day,
      },
    });

    res.json(response.data || {});
  } catch (err) {
    console.error("Holiday error:", err.message);
    res.json({});
  }
});

// 🌍 TIMEZONE FROM LAT/LNG (🔥 IMPORTANT ADD)
app.get('/api/timezone', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) return res.json(null);

    const response = await axios.get(
      'https://timeapi.io/api/v1/timezone/coordinate',
      {
        params: {
          latitude: lat,
          longitude: lon
        }
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error("Timezone error:", err.message);
    res.json(null);
  }
});


// 🌍 TIME (FIXED - CORRECT ENDPOINT)
app.get('/api/time', async (req, res) => {
  try {
    const { timezone } = req.query;

    if (!timezone) return res.json(null);

    const response = await axios.get(
      'https://timeapi.io/api/v1/time/current/zone', // ✅ FIXED
      {
        params: { timeZone: timezone }
      }
    );

    res.json({
      time: response.data.dateTime, // ✅ FIXED FIELD
      day: response.data.dayOfWeek
    });

  } catch (err) {
    console.error("Time API error:", err.response?.data || err.message);
    res.json(null);
  }
});


// 🤖 AI
app.get('/api/ai', async (req, res) => {
  try {
    const { country, date } = req.query;

    const prompt = `
Return strictly in this format:

### Historical Events
- point 1
- point 2
- point n

### Cultural Significance
- point 1
- point 2
- point n

### Interesting Facts
- point 1
- point 2
- point n

Rules:
- Each point must be 1 line only
- Keep total response under 250 words
- No paragraphs, only bullet points
- Simple and clear language
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    res.json(text);
  } catch (err) {
    console.error("AI error:", err.message);
    res.json("AI unavailable");
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});