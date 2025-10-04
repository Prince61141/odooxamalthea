import React from 'react';
import '../auth.css';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, sideContent, heading, subheading, altLink }) => {
  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-header-row">
            {altLink}
          </div>
          <div className="auth-heading-block">
            <h1 className="auth-title">{heading}</h1>
            {subheading && <p className="auth-subtitle">{subheading}</p>}
          </div>
          {children}
          <div className="auth-footer-locale">ENG ▾</div>
        </div>
        <div className="auth-right">
          {sideContent}
        </div>
      </div>
    </div>
  );
};

export const PasswordRule = ({ ok, children }) => (
  <li className={ok ? 'rule-ok' : 'rule-pending'}>{children}</li>
);

export const HeroPanel = () => (
  <div className="hero-wrapper">
    <div className="hero-floating top">
      <div className="mini-card">
        <div className="mini-stat-number">176,18</div>
        <div className="mini-stat-label">Inbox</div>
        <div className="mini-stat-badge">45</div>
      </div>
    </div>
    <div className="hero-floating mid">
      <div className="mini-card two">
        <div className="mini-lines">
          <span />
          <span />
          <span />
        </div>
        <div className="mini-key-block">
          <div className="mini-key-icon">🔐</div>
          <div>
            <h4>Your data, your rules</h4>
            <p>Your data belongs to you, and our encryption ensures that</p>
          </div>
        </div>
      </div>
    </div>
    <div className="hero-logos">
      <div className="social-circle ig">IG</div>
      <div className="social-circle tt">TT</div>
    </div>
  </div>
);

export default AuthLayout;
