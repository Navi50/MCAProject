const express = require('express');
const cors = require('cors');
const axios = require('axios'); // ✅ IMPORTANT (you missed this)
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* ✅ ROOT */
app.get('/', (req, res) => {
  res.json({ message: 'TODAY Backend is running' });
});


// ✅ NEWS API
app.get('/api/news', async (req, res) => {
  try {
    const { country } = req.query;

    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        country,
        apiKey: process.env.NEWS_API_KEY,
        pageSize: 5,
      },
    });

    res.json(response.data.articles);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'News fetch failed' });
  }
});


// ✅ TIMEZONE API
app.get('/api/time', async (req, res) => {
  try {
    const { timezone } = req.query;

    if (!timezone) {
      return res.status(400).json({ error: 'Timezone is required' });
    }

    const response = await axios.get(
      `http://worldtimeapi.org/api/timezone/${timezone}`
    );
    console.log(response);
    res.json(response.data);

  } catch (err) {
    console.error("Time API error:", err.message);
    res.status(500).json({ error: 'Time fetch failed' });
  }
});


// ✅ HOLIDAY API (if not already added)
app.get('/api/holidays', async (req, res) => {
  try {
    const { country, year, month, day } = req.query;

    const response = await axios.get(
      'https://calendarific.com/api/v2/holidays',
      {
        params: {
          api_key: process.env.CALENDARIFIC_API_KEY,
          country,
          year,
          month,
          day,
        },
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Holiday fetch failed' });
  }
});


// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

