import './ViewTabs.css';

const TABS = [
  { id: 'day',     label: 'Current Day' },
  { id: 'week',    label: 'Last 7 Days' },
  { id: 'quarter', label: 'Last Quarter' },
  { id: 'custom',  label: 'Custom Ticker' },
];

export default function ViewTabs({ activeTab, onTabChange }) {
  return (
    <nav className="view-tabs" role="tablist" aria-label="Dashboard time range">
      {TABS.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`view-tabs__tab ${activeTab === tab.id ? 'view-tabs__tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
