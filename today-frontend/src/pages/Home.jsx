import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useLiveClock, { getTimeFromUTCOffset } from '../hooks/useLiveClock';

const getDayType = (date, isHoliday = false) => {
  const day = date.getDay();
  if (isHoliday) return { label: 'Public Holiday', color: 'bg-red-600' };
  if (day === 0 || day === 6) return { label: 'Weekend', color: 'bg-blue-600' };
  return { label: 'Working Day', color: 'bg-gray-600' };
};

const formatFullDate = (date) => {
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix} ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}, ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
};

function CountryCard({ country, onClick }) {
  const cardTime = useLiveClock(country.timezones?.[0]);
  const type = getDayType(cardTime);
  return (
    <div onClick={onClick} className="bg-gray-800 p-4 rounded-xl cursor-pointer hover:bg-gray-700 transition-all">
      <div className="flex items-center gap-3">
        <img src={country.flags.svg} alt={country.name.common} className="w-8 h-5 rounded-sm object-cover" />
        <h4 className="font-semibold text-sm">{country.name.common}</h4>
      </div>
      <p className="text-xs text-gray-400 mt-2">{formatFullDate(cardTime)}</p>
      <p className="text-lg text-green-400 font-bold">{cardTime.toLocaleTimeString()}</p>
      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${type.color}`}>{type.label}</span>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();

  const [homeCountry, setHomeCountry] = useState(null);
  const [preferred, setPreferred] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [holiday, setHoliday] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [news, setNews] = useState([]);

  const homeTime = useLiveClock(homeCountry?.timezones?.[0]);
  const dayType = getDayType(homeTime, !!holiday);

  useEffect(() => {
    setHomeCountry(JSON.parse(localStorage.getItem('homeCountry')));
    setPreferred(JSON.parse(localStorage.getItem('preferredCountries')) || []);

    fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,timezones')
      .then(res => res.json())
      .then(data => setAllCountries(data.sort((a, b) => a.name.common.localeCompare(b.name.common))));
  }, []);

  useEffect(() => {
    if (!homeCountry) return;
    axios.get('http://localhost:5000/api/news', {
      params: { country: homeCountry.cca2.toLowerCase() },
    })
    .then(res => setNews(res.data))
    .catch(console.error);
  }, [homeCountry]);

  useEffect(() => {
    if (!homeCountry) return;
    const today = new Date();
    axios.get('http://localhost:5000/api/holidays', {
      params: {
        country: homeCountry.cca2,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      },
    })
    .then(res => {
      const holidays = res.data?.response?.holidays;
      setHoliday(holidays && holidays.length > 0 ? holidays[0] : null);
    })
    .catch(console.error);
  }, [homeCountry]);

  if (!homeCountry) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">

        {/* LEFT — Home Country */}
        <div className="bg-gray-900 p-6 rounded-3xl shadow-xl flex flex-col gap-6">

          <div>
            <div className="flex items-center gap-3">
              <img src={homeCountry.flags.svg} alt={homeCountry.name.common} className="w-10 h-6 rounded-sm object-cover" />
              <h1 className="text-2xl font-bold">{homeCountry.name.common}</h1>
              <span className="ml-auto text-xs text-blue-400 bg-blue-900 px-2 py-1 rounded-full">Home</span>
            </div>

            <p className="text-gray-400 mt-4 text-base">{formatFullDate(homeTime)}</p>
            <p className="text-5xl font-bold mt-2 text-green-400">{homeTime.toLocaleTimeString()}</p>

            <div className={`mt-4 inline-block px-4 py-1 rounded-full text-sm font-semibold ${dayType.color}`}>
              {dayType.label}
            </div>

            {holiday ? (
              <div className="mt-3 bg-yellow-900 border border-yellow-600 rounded-xl p-3">
                <p className="text-yellow-300 font-semibold">🎉 {holiday.name}</p>
                {holiday.description && <p className="text-yellow-400 text-sm mt-1">{holiday.description}</p>}
              </div>
            ) : (
              <p className="mt-3 text-gray-500 text-sm">No public holiday today</p>
            )}
          </div>

          {/* NEWS */}
          <div className="bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-3">Top News</h3>
            {news.length === 0 ? (
              <p className="text-gray-400 text-sm">Loading news...</p>
            ) : (
              news.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noreferrer" className="block mb-2 text-sm text-gray-300 hover:text-blue-400 border-b border-gray-700 pb-2">
                  • {item.title}
                </a>
              ))
            )}
          </div>

        </div>

        {/* RIGHT — Preferred Countries */}
        <div className="bg-gray-900 p-5 rounded-2xl flex flex-col gap-4">

          <h3 className="text-lg font-semibold">Your Preferred Countries</h3>

          <div className="grid gap-3 flex-1">
            {preferred.length === 0 ? (
              <p className="text-gray-500 text-sm">No preferred countries selected.</p>
            ) : (
              preferred.map(country => {
                if (!country.cca2) return null;
                return (
                  <CountryCard
                    key={country.cca2}
                    country={country}
                    onClick={() => navigate(`/detail/${country.cca2}`)}
                  />
                );
              })
            )}
          </div>

          <button onClick={() => setExpanded(true)} className="mt-2 w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold transition-all">
            🌍 Explore All Countries
          </button>

        </div>

      </div>

      {/* FULL SCREEN SLIDER */}
      <div className={`fixed bottom-0 left-0 w-full h-full bg-gray-950 transition-transform duration-500 z-50 ${expanded ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-6xl mx-auto p-6 h-full flex flex-col">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All Countries</h2>
            <button onClick={() => setExpanded(false)} className="text-blue-400 hover:underline text-sm">
              Close ↓
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 overflow-y-auto flex-1">
            {allCountries.map(c => (
              <div
                key={c.cca2}
                onClick={() => { if (c.cca2) { setExpanded(false); navigate(`/detail/${c.cca2}`); } }}
                className="bg-gray-800 p-3 rounded-xl text-center cursor-pointer hover:bg-gray-700 transition-all"
              >
                <img src={c.flags.svg} alt={c.name.common} className="w-8 h-5 mx-auto mb-2 rounded-sm object-cover" />
                <p className="text-xs text-gray-300">{c.name.common}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}

export default Home;