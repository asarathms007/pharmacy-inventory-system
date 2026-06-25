import { useState, useEffect } from 'react';

const Navbar = ({ title, subtitle }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatted = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">{title}</h1>
        {subtitle && <p className="navbar-subtitle">{subtitle}</p>}
      </div>
      <div className="navbar-right">
        <span className="navbar-time">🕐 {dateStr} · {formatted}</span>
        <div className="alert-badge" title="Alerts">
          🔔
          <span className="badge-dot" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
