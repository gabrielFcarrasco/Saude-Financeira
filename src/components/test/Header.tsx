
import { Link } from 'react-router-dom';
import './Header.css'

export const Header = () => {
  return (
    <header className="app-header" style={{ justifyContent: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="7" width="20" height="10" rx="5" stroke="var(--accent)" strokeWidth="2.5"/>
          <line x1="12" y1="7" x2="12" y2="17" stroke="var(--accent)" strokeWidth="2.5"/>
        </svg>
        <h2 className="logo-text" style={{ margin: 0, fontSize: '1.5rem' }}>
          GC &lt;/page developer&gt;
        </h2>
      </Link>
    </header>
  );
};