"use client";

import React from 'react';
import Image from 'next/image';

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
            {linkOptions && linkOptions.map((option, index) => (
                <a key={index} href={option.href}>{option.label}</a>
            ))}
        </div>
    </div>
  );
}

export default Navbar;