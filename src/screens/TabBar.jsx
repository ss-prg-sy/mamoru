export default function TabBar({ current, onChange }) {
  const tabs = [
    ["tasks", "✓", "タスク"],
    ["members", "👥", "メンバー"],
    ["settings", "⚙", "設定"],
  ];

  return (
    <div className="tabbar">
      {tabs.map(([key, icon, label]) => (
        <button
          key={key}
          className={`tab ${current === key ? "active" : ""}`}
          onClick={() => onChange(key)}
        >
          <span className="tab-icon">{icon}</span>
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
