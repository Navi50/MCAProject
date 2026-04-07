import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Onboarding() {
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState('');
  const [homeCountry, setHomeCountry] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,timezones')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = countries.filter(c =>
    c.name.common.toLowerCase().includes(search.toLowerCase())
  );

  // Select preferred countries (max 5)
  const toggleCountry = (country) => {
    const exists = selectedCountries.find(c => c.cca2 === country.cca2);

    if (exists) {
      setSelectedCountries(prev =>
        prev.filter(c => c.cca2 !== country.cca2)
      );
    } else {
      if (selectedCountries.length >= 5) return;
      if (homeCountry?.cca2 === country.cca2) return;
      setSelectedCountries(prev => [...prev, country]);
    }
  };

  const handleContinue = () => {
    localStorage.setItem('homeCountry', JSON.stringify(homeCountry));
    localStorage.setItem('preferredCountries', JSON.stringify(selectedCountries));
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-10">

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-blue-400 tracking-widest">TODAY</h1>
        <p className="text-gray-400 mt-2 text-sm">Your Daily World Awareness Platform</p>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">

        {/* Step Title */}
        <h2 className="text-lg font-semibold mb-1">
          {step === 1 ? 'Select Your Home Country' : 'Select Preferred Countries'}
        </h2>

        <p className="text-gray-500 text-sm mb-4">
          {step === 1
            ? 'This will be your main dashboard country'
            : 'Choose up to 5 countries you follow'}
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 rounded-xl px-4 py-3 mb-4 text-sm outline-none"
        />

        {/* List */}
        <div className="h-64 overflow-y-auto space-y-2">

          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            filtered.map(country => {
              const isHome = homeCountry?.cca2 === country.cca2;
              const isSelected = selectedCountries.find(c => c.cca2 === country.cca2);

              return (
                <div
                  key={country.cca2}
                  onClick={() => {
                    if (step === 1) {
                      setHomeCountry(country);
                    } else {
                      toggleCountry(country);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer
                  ${isHome ? 'bg-blue-600' :
                    isSelected ? 'bg-green-600' :
                    'bg-gray-800 hover:bg-gray-700'}`}
                >
                  <img src={country.flags.svg} alt="" className="w-6 h-4" />
                  <span className="text-sm">{country.name.common}</span>

                  {isHome && <span className="ml-auto text-xs">Home</span>}
                  {isSelected && <span className="ml-auto text-xs">✓</span>}
                </div>
              );
            })
          )}

        </div>

        {/* Footer Buttons */}
        <div className="mt-4 flex gap-2">

          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="w-1/2 bg-gray-700 py-2 rounded-xl"
            >
              Back
            </button>
          )}

          {step === 1 ? (
            <button
              disabled={!homeCountry}
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 py-2 rounded-xl disabled:bg-gray-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className="w-full bg-blue-600 py-2 rounded-xl"
            >
              Continue →
            </button>
          )}

        </div>

      </div>

    </div>
  );
}

export default Onboarding;