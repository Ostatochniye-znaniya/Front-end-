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
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

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
          const isActive = pathname === option.href ||
            pathname === option.href.replace('/csh', '');
          const Icon = option.icon;
          return (
            <a
              key={index}
              href={option.href}
              className={`navbar-inner-container ${isActive ? 'navbar-inner-active' : ''}`}
            >
              {isActive && <span className="navbar-active-dot"></span>}
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

      <div className="navbar-theme-toggle" onClick={toggleTheme}>
        <span className="navbar-path navbar-deactive-path">
          Тёмная тема
        </span>
        {mounted && (
          <div className={`navbar-theme-switch ${isDark ? 'navbar-theme-switch-on' : ''}`}>
            <div className="navbar-theme-switch-thumb"></div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Navbar;