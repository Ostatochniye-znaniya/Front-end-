"use client";
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

interface LinkOption {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface NavbarProps {
  title: string;
  linkOptions?: LinkOption[];
  avatarUrl?: string;
  name: string;
  surname: string;
  lastname: string;
  role?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title, linkOptions, avatarUrl, name, surname, lastname, role }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className="navbar-container">

      <img
        className="theme-aware-logo"
        src="/csh/mpu_logo.png"
        alt="Logo"
        width={210}
        height={55}
        style={{ marginBottom: '12px' }}
      />
      
      <div className="navbar-title-text-block">
        <p>{title}</p>
      </div>
      
      <div className="navbar-divider"></div>

      <div className="navbar-avatar">
        <img
          src={avatarUrl || "/csh/default_avatar.png"}
          alt="Avatar"
          width={80}
          height={80}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      </div>

      <div className="navbar-text-container">
        <p className="navbar-user-name">{surname} {name} {lastname}</p>
        {role && <p className="navbar-user-role">{role}</p>}
      </div>

      <div className="navbar-divider"></div>

      <div className="navbar-link-container">
        {linkOptions && linkOptions.map((option, index) => {
          const isActive = pathname === option.href;
          const Icon = option.icon;
          return (
            <a
              key={index}
              href={option.href}
              className={`navbar-inner-container ${isActive ? 'navbar-inner-active' : ''}`}
            >
              {Icon && (
                <span className="navbar-icon-wrap">
                  <Icon size={18} />
                </span>
              )}
              <span className={isActive ? 'navbar-path navbar-active-path' : 'navbar-path navbar-deactive-path'}>
                {option.label}
              </span>
            </a>
          );
        })}
      </div>

    </div>
  );
};

export default Navbar;