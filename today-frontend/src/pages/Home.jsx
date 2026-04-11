import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useLiveClock from '../hooks/useLiveClock';

const getDayType = (date, isHoliday = false) => {
  const day = date.getDay();
  if (isHoliday) return { label: 'Public Holiday', color: 'bg-red-600' };
  if (day === 0 || day === 6) return { label: 'Weekend', color: 'bg-blue-600' };
  return { label: 'Working Day', color: 'bg-gray-600' };
};

const formatFullDate = (date) => {
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  return `${day}${suffix} ${date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })}, ${date.toLocaleDateString('en-US', {
    weekday: 'long'
  })}`;
};

function CountryCard({ country, holiday, onClick }) {
  const cardTime = useLiveClock(country.timezones?.[0]);
  const type = getDayType(cardTime, !!holiday);

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 p-4 rounded-xl cursor-pointer hover:bg-gray-700 hover:scale-[1.03] transition"
    >
      <div className="flex items-center gap-3">
        <img src={country.flags.svg} alt="" className="w-8 h-5 rounded-sm" />
        <h4 className="font-semibold text-sm">{country.name.common}</h4>
      </div>

      <p className="text-xs text-gray-400 mt-2">{formatFullDate(cardTime)}</p>

      <p className="text-lg text-green-400 font-bold">
        {cardTime.toLocaleTimeString()}
      </p>

      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${type.color}`}>
        {type.label}
      </span>

      {holiday ? (
        <p className="text-yellow-400 text-xs mt-1">🎉 {holiday.name}</p>
      ) : (
        <p className="text-gray-500 text-xs mt-1">No holiday</p>
      )}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();

  const [homeCountry, setHomeCountry] = useState(null);
  const [preferred, setPreferred] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [holiday, setHoliday] = useState(null);
  const [holidayMap, setHolidayMap] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState("");

  const homeTime = useLiveClock(homeCountry?.timezones?.[0]);
  const dayType = getDayType(homeTime, !!holiday);

  // LOAD DATA
  useEffect(() => {
    setHomeCountry(JSON.parse(localStorage.getItem('homeCountry')));
    setPreferred(JSON.parse(localStorage.getItem('preferredCountries')) || []);

    fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,timezones')
      .then(res => res.json())
      .then(data =>
        setAllCountries(
          data.sort((a, b) => a.name.common.localeCompare(b.name.common))
        )
      );
  }, []);

  // NEWS
  useEffect(() => {
    if (!homeCountry) return;

    axios.get('http://localhost:5000/api/news', {
      params: { country: homeCountry.cca2.toLowerCase() }
    })
      .then(res => setNews(res.data))
      .catch(() => setNews([]));
  }, [homeCountry]);

  // HOME HOLIDAY
  useEffect(() => {
    if (!homeCountry) return;

    const today = new Date();

    axios.get('http://localhost:5000/api/holidays', {
      params: {
        country: homeCountry.cca2,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      }
    })
      .then(res => {
        const holidays = res.data?.response?.holidays;
        setHoliday(holidays && holidays.length > 0 ? holidays[0] : null);
      })
      .catch(() => setHoliday(null));
  }, [homeCountry]);

  // PREFERRED HOLIDAYS
  useEffect(() => {
    if (!preferred.length) return;

    const today = new Date();

    preferred.forEach(country => {
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

          setHolidayMap(prev => ({
            ...prev,
            [country.cca2]: holidays && holidays.length > 0 ? holidays[0] : null
          }));
        })
        .catch(() => {
          setHolidayMap(prev => ({
            ...prev,
            [country.cca2]: null
          }));
        });
    });

  }, [preferred]);

  if (!homeCountry) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white px-6 py-6">

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">

        {/* HOME CARD */}
        <div
          onClick={() => navigate(`/detail/${homeCountry.cca2}`)}
          className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-2xl cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center gap-3">
            <img src={homeCountry.flags.svg} alt="" className="w-12 h-7 rounded-md" />
            <h1 className="text-3xl font-bold">{homeCountry.name.common}</h1>
          </div>

          <p className="text-gray-400 mt-4 text-sm">{formatFullDate(homeTime)}</p>

          <p className="text-6xl font-extrabold mt-2 text-green-400">
            {homeTime.toLocaleTimeString()}
          </p>

          <div className={`mt-4 px-4 py-1 rounded-full inline-block text-sm ${dayType.color}`}>
            {dayType.label}
          </div>

          {holiday ? (
            <div className="mt-4 px-4 py-2 bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 rounded-xl text-sm">
              🎉 Today: {holiday.name}
            </div>
          ) : (
            <div className="mt-4 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded-xl text-sm">
              📅 Today is not a public holiday
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/compare');
            }}
            className="mt-5 w-full bg-gradient-to-r from-purple-600 to-pink-500 py-3 rounded-xl font-semibold"
          >
            🔍 Compare Countries
          </button>
        </div>

        {/* PREFERRED */}
        <div className="bg-gray-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4">🌍 Preferred Countries</h3>

          <div className="grid gap-3">
            {preferred.map(c => (
              <CountryCard
                key={c.cca2}
                country={c}
                holiday={holidayMap[c.cca2]}
                onClick={() => navigate(`/detail/${c.cca2}`)}
              />
            ))}
          </div>

          <button
            onClick={() => setExpanded(true)}
            className="mt-5 w-full bg-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-500"
          >
            🌐 Explore All Countries
          </button>
        </div>

      </div>

      {/* 🌍 MODAL */}
      {expanded && (
        <div className="fixed inset-0 bg-black/90 z-50 p-6 overflow-y-auto animate-fadeIn">

          <div className="max-w-7xl mx-auto">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🌍 All Countries</h2>

              <button
                onClick={() => setExpanded(false)}
                className="bg-gray-800 px-4 py-2 rounded-xl"
              >
                Close ✖
              </button>
            </div>

            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-6 p-3 rounded-xl bg-gray-800"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allCountries
                .filter(c =>
                  c.name.common.toLowerCase().includes(search.toLowerCase())
                )
                .map(c => (
                  <div
                    key={c.cca2}
                    onClick={() => {
                      navigate(`/detail/${c.cca2}`);
                      setExpanded(false);
                    }}
                    className="bg-gray-800 p-4 rounded-xl cursor-pointer hover:bg-gray-700 hover:scale-[1.05] transition text-center"
                  >
                    <img src={c.flags.svg} className="w-10 h-6 mx-auto mb-2" />
                    <p className="text-sm">{c.name.common}</p>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Home;