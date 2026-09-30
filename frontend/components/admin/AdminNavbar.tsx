"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export interface AdminNavbarProps {
  avatarUrl?: string;
  name?: string;
  surname?: string;
  lastname?: string;
}

const adminNavLinks = [
  { label: "Технические логи", href: "/csh/admin/tech-logs" },
  { label: "Логи пользователей", href: "/csh/admin/audit-logs" },
  { label: "Бизнес-процессы", href: "/csh/admin/processes" },
  { label: "Пользователи и роли", href: "/csh/admin/users" },
  { label: "Настройки системы", href: "/csh/admin/settings" }
];

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  avatarUrl = "/csh/default_avatar.png",
  name = "Алексей",
  surname = "Смирнов",
  lastname = "Васильевич"
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const logoSrc = theme === 'dark' ? '/csh/mpu_logo_d.png' : '/csh/mpu_logo_l.png';

  const checkIsActive = (href: string) => {
    if (!pathname) return false;
    const cleanPath = pathname.replace(/^\/csh/, '');
    const cleanHref = href.replace(/^\/csh/, '');
    return cleanPath === cleanHref || pathname === href || cleanPath.startsWith(cleanHref);
  };

  return (
    <div className="navbar-container">
      <img
        className="theme-aware-logo"
        src={logoSrc}
        alt="Московский Политех"
        width={250}
        height={66.21}
        style={{ marginBottom: "14px" }}
      />
      <div className="line"></div>
      <div className="navbar-title-text-block">
        <p>Панель администратора</p>
      </div>
      <div className="navbar-avatar">
        <img
          src={avatarUrl}
          alt="Avatar"
          width={100}
          height={100}
          style={{ borderRadius: "50%", objectFit: "cover" }}
        />
      </div>
      <div className="navbar-text-container">
        <p>{surname}</p>
        <p>{name} {lastname}</p>
      </div>
      <div style={{
        marginTop: "6px",
        marginBottom: "16px",
        padding: "4px 12px",
        borderRadius: "12px",
        backgroundColor: "var(--accent-blue-bg-c, rgba(95, 109, 236, 0.15))",
        color: "var(--accent-blue-c, #5f6dec)",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        Администратор системы
      </div>

      <div className="navbar-link-container">
        {adminNavLinks.map((option, index) => {
          const isActive = checkIsActive(option.href);
          return (
            <div key={index} className="navbar-inner-container">
              <div className={isActive ? 'navbar-active' : 'navbar-deactive'}></div>
              <a
                href={option.href}
                className={isActive ? 'navbar-path navbar-active-path' : 'navbar-path navbar-deactive-path'}
                style={{ fontSize: "18px", transition: "color 0.2s" }}
              >
                {option.label}
              </a>
            </div>
          );
        })}
        <div style={{ marginTop: '30px', paddingTop: '16px', borderTop: '1px solid var(--secondary-border-c)' }}>
          <a
            href="/csh"
            style={{
              fontSize: '14px',
              color: 'var(--secondary-lock-font-c)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Вернуться на главную
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
