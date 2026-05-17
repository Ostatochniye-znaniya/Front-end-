"use client";
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LucideIcon, Maximize2 } from 'lucide-react';
import { getUserData, clearUserDataCache } from '@/services/getUserData';
import { UserMeResponse } from '@/api/types';
import { getUserStatus, UserStatusResponse } from '@/services/getUserStatus';

interface LinkOption {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface NavbarProps {
  title: string;
  linkOptions?: LinkOption[];
  avatarUrl?: string;
  name?: string;
  surname?: string;
  lastname?: string;
  role?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  title, 
  linkOptions, 
  avatarUrl, 
  name: propName, 
  surname: propSurname, 
  lastname: propLastname, 
  role: propRole 
}) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userData, setUserData] = useState<UserMeResponse | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserData({ ttl: 60 });
        setUserData(data);
        const status = await getUserStatus();
        setUserStatus(status);
        console.log('✅ Navbar: User data loaded', data);
      } catch (error) {
        console.error('❌ Navbar: Failed to load user data', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Тема + collapsed
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);

    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setIsCollapsed(collapsed);
    if (collapsed) document.documentElement.classList.add('sidebar-collapsed');

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

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
    if (next) {
      document.documentElement.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
  };

  const displayName = userData?.name || '';
  const displaySurname = userData?.surname || '';
  const displayLastname = userData?.patronymic || '';
  const displayRole = userStatus?.verbose || '';
  const displayAvatarUrl = avatarUrl ||'/csh/default_avatar.png';
  const refreshUserData = async () => {
    try {
      setLoading(true);
      clearUserDataCache();
      const freshData = await getUserData({ forceRefresh: true });
      setUserData(freshData);
      console.log('🔄 Navbar: User data refreshed', freshData);
    } catch (error) {
      console.error('❌ Navbar: Failed to refresh user data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="navbar-container">
      <a href="https://mospolytech.ru/" target="_blank" rel="noopener noreferrer" className="navbar-logo-link">
        <img className="theme-aware-logo" alt="МПУ Логотип" />
      </a>

      <div className="navbar-divider"></div>
      <a href="https://e.mospolytech.ru/" target="_blank" rel="noopener noreferrer" className="navbar-logo-link navbar-logo-link--left">
        <img className="navbar-title-logo" alt="Проверка остаточных знаний" />
      </a>
      <div className="navbar-divider"></div>

      <div className="navbar-avatar">
        <img
          src={displayAvatarUrl}
          alt="Avatar"
          width={80}
          height={80}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      </div>

      <div className="navbar-text-container">
        {loading ? (
          <>
            <p className="navbar-user-name">Загрузка...</p>
            {displayRole && <p className="navbar-user-role">{displayRole}</p>}
          </>
        ) : (
          <>
            <p className="navbar-user-name">
              {displaySurname} {displayName} {displayLastname}
            </p>
            {displayRole && <p className="navbar-user-role">{displayRole}</p>}
          </>
        )}
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

      <div className="navbar-theme-toggle" style={{ marginTop: 'auto' }} onClick={toggleTheme}>
        {!isCollapsed && (
          <span className="navbar-path navbar-deactive-path">
            Тёмная тема
          </span>
        )}
        {mounted && (
          <div className={`navbar-theme-switch ${isDark ? 'navbar-theme-switch-on' : ''}`}>
            <div className="navbar-theme-switch-thumb"></div>
          </div>
        )}
      </div>

      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={refreshUserData}
          style={{ 
            marginTop: '10px', 
            padding: '5px', 
            fontSize: '10px',
            background: 'transparent',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⟳ Обновить данные
        </button>
      )}
    </div>

    {mounted && (
      <button
        className="sidebar-collapse-fab"
        onClick={toggleCollapse}
        title={isCollapsed ? 'Развернуть' : 'Свернуть'}
      >
        <Maximize2 size={20} />
      </button>
    )}
    </>
  );
};

export default Navbar;