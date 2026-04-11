import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Compare() {

  const [countries, setCountries] = useState([]);
  const [c1, setC1] = useState(null);
  const [c2, setC2] = useState(null);

  const [data1, setData1] = useState({});
  const [data2, setData2] = useState({});

  // 🌍 LOAD COUNTRIES
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2,timezones,latlng,flags')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  // ⏱ TIME
  const getTime = (timezone) => {
    try {
      const sign = timezone.includes('+') ? 1 : -1;
      const parts = timezone.replace('UTC', '').split(sign === 1 ? '+' : '-')[1].split(':');

      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1] || 0);

      const totalMinutes = sign * (hours * 60 + minutes);

      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);

      return new Date(utc + totalMinutes * 60000);
    } catch {
      return new Date();
    }
  };

  // 📊 FETCH DATA
  const fetchData = useCallback(async (country, setData) => {
    if (!country) return;

    const lat = country.latlng?.[0];
    const lon = country.latlng?.[1];

    const today = new Date();

    try {
      const [weatherRes, holidayRes] = await Promise.all([
        axios.get('http://localhost:5000/api/weather', {
          params: { lat, lon }
        }),
        axios.get('http://localhost:5000/api/holidays', {
          params: {
            country: country.cca2,
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate()
          }
        })
      ]);

      setData({
        time: getTime(country.timezones[0]),
        weather: weatherRes.data?.temperature ?? "--",
        holiday: holidayRes.data?.response?.holidays?.length > 0 ? "Yes" : "No"
      });

    } catch {
      setData({});
    }
  }, []);

  useEffect(() => { fetchData(c1, setData1); }, [c1, fetchData]);
  useEffect(() => { fetchData(c2, setData2); }, [c2, fetchData]);

  const getTempColor = (t1, t2, current) => {
    if (t1 === "--" || t2 === "--") return "";
    return current === Math.max(t1, t2) ? "text-green-400" : "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold text-center mb-8">
        🌍 Compare Countries
      </h1>

      {/* SELECTORS */}
      <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">

        <select
          onChange={(e) =>
            setC1(countries.find(c => c.cca2 === e.target.value))
          }
          className="bg-gray-800 p-3 rounded-xl"
        >
          <option>Select Country 1</option>
          {countries.map(c => (
            <option key={c.cca2} value={c.cca2}>
              {c.name.common}
            </option>
          ))}
        </select>

        <select
          onChange={(e) =>
            setC2(countries.find(c => c.cca2 === e.target.value))
          }
          className="bg-gray-800 p-3 rounded-xl"
        >
          <option>Select Country 2</option>
          {countries.map(c => (
            <option key={c.cca2} value={c.cca2}>
              {c.name.common}
            </option>
          ))}
        </select>

      </div>

      {/* COMPARISON */}
      {c1 && c2 && (
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">

          {[{ c: c1, d: data1 }, { c: c2, d: data2 }].map((item, index) => {

            const tempHighlight = getTempColor(
              data1.weather,
              data2.weather,
              item.d.weather
            );

            return (
              <div
                key={index}
                className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl shadow-xl hover:scale-[1.02] transition"
              >

                {/* HEADER */}
                <div className="flex items-center gap-3 mb-4">
                  <img src={item.c.flags.svg} alt="" className="w-10 h-6 rounded" />
                  <h2 className="text-xl font-bold">{item.c.name.common}</h2>
                </div>

                {/* TIME */}
                <div className="mb-3">
                  <p className="text-gray-400 text-sm">Time</p>
                  <p className="text-2xl text-green-400 font-bold">
                    {item.d.time?.toLocaleTimeString() || "--"}
                  </p>
                </div>

                {/* WEATHER */}
                <div className="mb-3">
                  <p className="text-gray-400 text-sm">Weather</p>
                  <p className={`text-xl font-bold ${tempHighlight}`}>
                    {item.d.weather}°C
                  </p>
                </div>

                {/* HOLIDAY */}
                <div>
                  <p className="text-gray-400 text-sm">Holiday</p>
                  <p className={`text-lg ${item.d.holiday === "Yes" ? "text-yellow-400" : "text-gray-400"}`}>
                    {item.d.holiday === "Yes" ? "🎉 Holiday" : "No Holiday"}
                  </p>
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default Compare;