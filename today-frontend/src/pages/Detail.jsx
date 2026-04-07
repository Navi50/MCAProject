import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useLiveClock from '../hooks/useLiveClock';

const getDayType = (date, isHoliday = false) => {
  const day = date.getDay();
  if (isHoliday) return { label: 'Public Holiday', color: 'bg-red-600' };
  if (day === 0 || day === 6) return { label: 'Weekend', color: 'bg-blue-600' };
  return { label: 'Working Day', color: 'bg-gray-600' };
};

const formatFullDate = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

function Detail() {
  const { countryCode } = useParams();
  const navigate = useNavigate();

  const [country, setCountry] = useState(null);
  const [news, setNews] = useState([]);
  const [holiday, setHoliday] = useState(null);
  const [loading, setLoading] = useState(true);

  const localTime = useLiveClock(country?.timezones?.[0]);
  const dayType = getDayType(localTime, !!holiday);

  useEffect(() => {
    if (!countryCode) return;
    setLoading(true);
    fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`)
      .then(res => res.json())
      .then(data => {
        setCountry(data[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [countryCode]);

  useEffect(() => {
    if (!country) return;
    axios.get('http://localhost:5000/api/news', {
      params: { country: country.cca2.toLowerCase() }
    })
    .then(res => setNews(res.data))
    .catch(console.error);
  }, [country]);

  useEffect(() => {
    if (!country) return;
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
      const holidays = res.data?.response?.holidays;
      setHoliday(holidays && holidays.length > 0 ? holidays[0] : null);
    })
    .catch(console.error);
  }, [country]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400 text-lg animate-pulse">Loading country details...</p>
    </div>
  );

  if (!country) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-red-400 text-lg">Country not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Button */}
        <button onClick={() => navigate('/home')} className="text-blue-400 text-sm hover:underline">
          ← Back to Home
        </button>

        {/* Country Header */}
        <div className="bg-gray-900 p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <img src={country.flags.svg} alt={country.name.common} className="w-14 h-9 rounded-md object-cover" />
            <div>
              <h1 className="text-3xl font-bold">{country.name.common}</h1>
              <p className="text-gray-400 text-sm">{country.region} · {country.subregion}</p>
            </div>
          </div>

          <p className="text-gray-400 mt-4">{formatFullDate(localTime)}</p>
          <p className="text-5xl font-bold text-green-400 mt-1">{localTime.toLocaleTimeString()}</p>

          <div className={`mt-4 inline-block px-4 py-1 rounded-full text-sm font-semibold ${dayType.color}`}>
            {dayType.label}
          </div>

          {holiday ? (
            <div className="mt-3 bg-yellow-900 border border-yellow-600 rounded-xl p-3">
              <p className="text-yellow-300 font-semibold">🎉 {holiday.name}</p>
              {holiday.description && <p className="text-yellow-400 text-sm mt-1">{holiday.description}</p>}
            </div>
          ) : (
            <p className="mt-3 text-gray-500 text-sm">No public holiday today in {country.name.common}</p>
          )}
        </div>

        {/* Country Info */}
        <div className="bg-gray-900 p-5 rounded-2xl grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Capital</p>
            <p className="font-semibold">{country.capital?.[0] || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Population</p>
            <p className="font-semibold">{country.population?.toLocaleString() || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Currency</p>
            <p className="font-semibold">{country.currencies ? Object.values(country.currencies).map(c => `${c.name} (${c.symbol})`).join(', ') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Languages</p>
            <p className="font-semibold">{country.languages ? Object.values(country.languages).join(', ') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Timezone</p>
            <p className="font-semibold">{country.timezones?.[0] || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Region</p>
            <p className="font-semibold">{country.region || 'N/A'}</p>
          </div>
        </div>

        {/* Top News */}
        <div className="bg-gray-900 p-5 rounded-2xl">
          <h3 className="text-lg font-semibold mb-3">Top News</h3>
          {news.length === 0 ? (
            <p className="text-gray-500 text-sm">No news available for this country.</p>
          ) : (
            news.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noreferrer" className="block text-sm mb-3 text-gray-300 hover:text-blue-400 border-b border-gray-800 pb-2">
                • {item.title}
              </a>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default Detail;