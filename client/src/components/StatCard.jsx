const StatCard = ({ icon, label, value, accent = 'teal', trend }) => {
  const accentMap = {
    teal: { color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)', css: '--accent-teal' },
    purple: { color: '#a78bfa', bg: 'var(--accent-purple-dim)', css: '#a78bfa' },
    orange: { color: 'var(--accent-orange)', bg: 'var(--accent-orange-dim)', css: '--accent-orange' },
    rose: { color: 'var(--accent-rose)', bg: 'var(--accent-rose-dim)', css: '--accent-rose' },
    blue: { color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)', css: '--accent-blue' },
  };

  const a = accentMap[accent] || accentMap.teal;

  return (
    <div className="stat-card" style={{ '--card-accent': a.color }}>
      <div className="stat-icon" style={{ background: a.bg }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && <div className="stat-trend">{trend}</div>}
      </div>
    </div>
  );
};

export default StatCard;
