"use client";

import React, { ReactNode } from 'react';
import AdminNavbar from './AdminNavbar';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  return (
    <div className="bg-container" style={{ minHeight: "100vh" }}>
      <div className="bg-gradient"></div>
      <AdminNavbar />
      <div
        className="main-container"
        style={{
          flex: 1,
          minWidth: 0,
          margin: "40px 40px 60px 40px",
          padding: "36px 40px",
          maxWidth: "calc(100% - 460px)",
          boxSizing: "border-box"
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div>
            <h1 className="title text-bold" style={{ fontSize: "28px", margin: 0, color: "var(--secondary-font-c)" }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                margin: "6px 0 0 0",
                fontSize: "14px",
                color: "var(--secondary-lock-font-c)",
                maxWidth: "800px",
                lineHeight: "1.4"
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
