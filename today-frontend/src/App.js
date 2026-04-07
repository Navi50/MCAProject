import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';

function App() {  
  return (
    <Router>
      <div className="bg-gray-950 min-h-screen text-white">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/home" element={<Home />} />
          <Route path="/detail/:countryCode" element={<Detail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;