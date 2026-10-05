import { useState } from 'react';
import { Provider } from 'react-redux';
import store from './store/store';
import ViewTabs from './components/dashboard/ViewTabs';
import DayView from './components/dashboard/DayView';
import WeekView from './components/dashboard/WeekView';
import QuarterView from './components/dashboard/QuarterView';
import { isMarketOpen } from './utils/dateHelpers';
import './App.css';

const MARKET_OPEN   = isMarketOpen();
const LOAD_TIME_STR = new Date().toLocaleTimeString('en-US', {
  hour: 'numeric', minute: '2-digit', hour12: true,
});

function AppShell() {
  const [activeTab, setActiveTab] = useState('day');

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <h1 className="app-title">Market Dashboard</h1>
          <span className="app-subtitle">IBM &amp; Competitors</span>
        </div>
        <div className="app-header__meta">
          <span className={`app-mkt-badge ${MARKET_OPEN ? 'app-mkt-badge--open' : 'app-mkt-badge--closed'}`}>
            {MARKET_OPEN ? '● NYSE Open' : '● NYSE Closed'}
          </span>
          <span className="app-last-updated">
            Updated {LOAD_TIME_STR}
          </span>
        </div>
      </header>

      <main className="app-main">
        <ViewTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'day'     && <DayView />}
        {activeTab === 'week'    && <WeekView />}
        {activeTab === 'quarter' && <QuarterView />}
      </main>

      <footer className="app-footer">
        Data provided by Yahoo Finance ·{' '}
        Set <code>VITE_USE_MOCK=true</code> for offline demo mode
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}
