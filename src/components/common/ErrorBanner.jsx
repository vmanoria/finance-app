import './ErrorBanner.css';

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon">⚠</span>
      <span className="error-banner__message">{message}</span>
    </div>
  );
}
