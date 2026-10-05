import './LoadingSpinner.css';

export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap" role="status" aria-label={label}>
      <div className="spinner" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
