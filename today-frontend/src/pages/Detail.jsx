import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function Detail() {

  const { code } = useParams();

  const [country, setCountry] = useState(null);
  const [weather, setWeather] = useState(null);
  const [sun, setSun] = useState(null);
  const [moon, setMoon] = useState(null);
  const [history, setHistory] = useState([]);
  const [news, setNews] = useState([]);
  const [holiday, setHoliday] = useState(null);

  const [aiData, setAiData] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);

  // 🌍 COUNTRY
  useEffect(() => {
    if (!code) return;

    fetch(`https://restcountries.com/v3.1/alpha/${code}`)
      .then(res => res.json())
      .then(data => setCountry(data[0]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  // 🔄 STATIC DATA
  useEffect(() => {
    if (!country) return;

    const lat = country.latlng?.[0];
    const lon = country.latlng?.[1];

    axios.get('http://localhost:5000/api/weather', { params: { lat, lon } })
      .then(res => setWeather(res.data))
      .catch(() => setWeather(null));

    axios.get('http://localhost:5000/api/sun', { params: { lat, lon } })
      .then(res => setSun(res.data))
      .catch(() => setSun(null));

    axios.get('http://localhost:5000/api/moon')
      .then(res => setMoon(res.data))
      .catch(() => setMoon(null));

    axios.get('http://localhost:5000/api/history', {
      params: { country: country.name.common }
    })
      .then(res => setHistory(res.data))
      .catch(() => setHistory([]));

    const today = new Date();

    axios.get('http://localhost:5000/api/holidays', {
      params: {
        country: country.cca2,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      }
    })
      .then(res => {
        const h = res.data?.response?.holidays || [];
        setHoliday(h.length > 0 ? h[0] : null);
      })
      .catch(() => setHoliday(null));

  }, [country]);

  // 📰 NEWS AUTO REFRESH
  useEffect(() => {
    if (!country) return;

    const fetchNews = () => {
      setNewsLoading(true);

      axios.get('http://localhost:5000/api/news', {
        params: { country: country.cca2.toLowerCase() }
      })
        .then(res => {
          if (res.data && res.data.length > 0) {
            setNews([...res.data]);
          }
        })
        .catch(() => setNews([]))
        .finally(() => setNewsLoading(false));
    };

    fetchNews();
    const interval = setInterval(fetchNews, 20000);

    return () => clearInterval(interval);

  }, [country]);

  // 🤖 PARSE AI
  const parseAI = (text) => {
    if (!text) return {};

    const sections = {};
    const parts = text.split("###");

    parts.forEach(part => {
      if (!part.trim()) return;

      const [title, ...content] = part.split("\n");

      sections[title.trim()] = content
        .filter(line => line.trim().startsWith("-"))
        .map(line => line.replace("-", "").trim());
    });

    return sections;
  };

  const aiSections = parseAI(aiData);

  // 🤖 AI CALL
  const fetchAI = async () => {
    if (!country) return;

    setLoadingAI(true);

    try {
      const res = await axios.get('http://localhost:5000/api/ai', {
        params: {
          country: country.name.common,
          date: new Date().toDateString()
        }
      });

      setAiData(res.data);

    } catch {
      setAiData("AI unavailable");
    }

    setLoadingAI(false);
  };

  if (loading) return <p className="text-white p-10 text-center">Loading...</p>;
  if (!country) return <p className="text-red-400 text-center">Failed</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <img src={country.flags?.svg} alt="" className="w-14 h-10 rounded" />
          <div>
            <h1 className="text-2xl font-bold">{country.name.common}</h1>
            {holiday ? (
              <p className="text-yellow-400 text-sm mt-1">🎉 {holiday.name}</p>
            ) : (
              <p className="text-gray-400 text-sm mt-1">No holiday today</p>
            )}
          </div>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          {weather && (
            <div className="bg-gray-900 p-4 rounded-xl">
              <h3 className="text-gray-400 text-sm">Weather</h3>
              <p className="text-xl text-green-400 font-bold">{weather.temperature}°C</p>
            </div>
          )}

          {sun && (
            <div className="bg-gray-900 p-4 rounded-xl">
              <h3 className="text-gray-400 text-sm">Sun Cycle</h3>
              <p>🌅 {new Date(sun.sunrise).toLocaleTimeString()}</p>
              <p>🌇 {new Date(sun.sunset).toLocaleTimeString()}</p>
            </div>
          )}

          {moon && (
            <div className="bg-gray-900 p-4 rounded-xl">
              <h3 className="text-gray-400 text-sm">Moon</h3>
              <p>🌙 {moon?.moon_phase || "N/A"}</p>
            </div>
          )}

        </div>

        {/* HISTORY */}
        {history.length > 0 && (
          <div className="bg-gray-900 p-4 rounded-xl">
            <h3 className="text-gray-400 text-sm mb-2">📜 On This Day</h3>
            {history.map((h, i) => (
              <p key={i} className="text-sm mb-1">• {h.text}</p>
            ))}
          </div>
        )}

        {/* NEWS */}
        <div className="bg-gray-900 p-5 rounded-xl">
          <h3 className="text-lg mb-3">📰 Top News</h3>

          {newsLoading ? (
            <p className="text-gray-400 animate-pulse">Fetching latest news...</p>
          ) : news.length === 0 ? (
            <p className="text-gray-400">Waiting for news...</p>
          ) : (
            <div className="space-y-3">
              {news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noreferrer"
                  className="block bg-gray-800 p-3 rounded-lg hover:bg-gray-700">
                  {n.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* AI BUTTON */}
        <button
          onClick={fetchAI}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600"
        >
          🤖 Tell Me More
        </button>

        {loadingAI && <p className="text-center">Thinking...</p>}

        {/* 🧠 PREMIUM AI UI */}
        {aiData && (
          <div className="space-y-5">

            <h2 className="text-xl font-bold">🧠 AI Insights</h2>

            {Object.entries(aiSections).map(([title, points], index) => {
              const colors = [
                "from-blue-500 to-cyan-500",
                "from-green-500 to-emerald-500",
                "from-purple-500 to-pink-500"
              ];

              return (
                <div key={index}
                  className="bg-gray-900/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-gray-800">

                  <h3 className={`text-lg font-semibold mb-3 bg-gradient-to-r ${colors[index % 3]} bg-clip-text text-transparent`}>
                    {title}
                  </h3>

                  <ul className="space-y-2 text-sm text-gray-300">
                    {points.map((point, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-green-400">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

export default Detail;