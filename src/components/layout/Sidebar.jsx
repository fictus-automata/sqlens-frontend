import { NavLink } from 'react-router-dom';
import { Database, FileCode2, Network } from 'lucide-react';
import '../../styles/layout.css';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Network className="text-source" size={24} style={{ color: 'var(--color-source)' }} />
        <h1 className="sidebar-title">SQLens</h1>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink 
          to="/lineage" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Network size={18} />
          <span>Global Lineage</span>
        </NavLink>
        
        <NavLink 
          to="/queries" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileCode2 size={18} />
          <span>Queries</span>
        </NavLink>
        
        <NavLink 
          to="/schemas" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Database size={18} />
          <span>Schema Registry</span>
        </NavLink>
      </nav>
    </aside>
  );
}
