import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Chani</h3> {/* Placeholder for logo/app name */}
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Tableau de bord
            </NavLink>
          </li>
          <li>
            <NavLink to="/calls" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Appels
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
