import { useState, useEffect } from 'react';

function getTimeFromUTCOffset(offset) {
  if (!offset || offset === 'UTC') return new Date();
  try {
    const sign = offset.includes('+') ? 1 : -1;
    const clean = offset.replace('UTC', '').replace('+', '').replace('-', '');
    const parts = clean.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const totalMinutes = sign * (hours * 60 + minutes);
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + totalMinutes * 60000);
  } catch {
    return new Date();
  }
}

function useLiveClock(timezone) {
  const [time, setTime] = useState(() => getTimeFromUTCOffset(timezone));

  useEffect(() => {
    if (!timezone) return;

    const interval = setInterval(() => {
      setTime(getTimeFromUTCOffset(timezone));
    }, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  return time;
}

export default useLiveClock;