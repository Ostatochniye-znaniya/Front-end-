"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface LinkOption {
  label: string;
  href: string;
}

interface NavbarProps {
    title: string;
    linkOptions?: LinkOption[];
    avatarUrl?: string;
    name: string;
    surname: string;
    lastname: string;
}

const Navbar: React.FC<NavbarProps> = ({ title, linkOptions, avatarUrl, name, surname, lastname }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const pathname = usePathname(); // получаем текущий путь

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setTheme(mediaQuery.matches ? 'dark' : 'light');

        const handler = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const logoSrc = theme === 'dark' ? '/mpu_logo_d.png' : '/mpu_logo_l.png';
    return (
        <div className="navbar-container">
            <Image className="theme-aware-logo" src="/mpu_logo.png" alt="Logo" width={250} height={66.21} style={{
                marginBottom: "14px",
            }}/>
            <div className='line'></div>
            <div className='navbar-title-text-block'>
                <p>{title}</p>
            </div>
            <div className='navbar-avatar'>
                <Image src={avatarUrl || "/default_avatar.png"} alt="Avatar" width={100} height={100} />
            </div>
            <div className='navbar-text-container'>
                <p>{surname}</p>
                <p>{name} {lastname}</p>
            </div>
            <div className='navbar-link-container'>
                {linkOptions && linkOptions.map((option, index) => {
                    const isActive = pathname === option.href;
                    
                    return (
                        <div key={index} className='navbar-inner-container'>
                            <div className={isActive ? 'navbar-active' : 'navbar-deactive'}></div>
                            <a 
                                href={option.href}
                                className={isActive ? 'navbar-path navbar-active-path' : 'navbar-path navbar-deactive-path'}
                            >
                                {option.label}
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    }

export default Navbar;