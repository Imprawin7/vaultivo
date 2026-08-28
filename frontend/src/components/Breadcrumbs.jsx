import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm font-mono text-ink/60 mb-4 flex-wrap">
      <Link to="/drive" className="hover:text-ink transition-colors">
        My Drive
      </Link>
      {items.map((item) => (
        <span key={item.id} className="flex items-center gap-1.5">
          <span className="text-ink/30">/</span>
          <Link to={`/drive/${item.id}`} className="hover:text-ink transition-colors">
            {item.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}
