'use client';

import Link from 'next/link';
import { ShieldCheck, Gavel } from 'lucide-react';

export default function StartPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

        :root {
          --deep:     #4C2F5E;
          --light:    #9F63C4;
          --mid:      #7A4A9A;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lh-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.5rem;
          position: relative;
          overflow: hidden;
          font-family: 'Cormorant Garamond', serif;
        }

        /* ── Background image ── */
        .lh-bg {
          position: absolute;
          inset: 0;
          background: url("/bg.jpg") center/cover no-repeat;
          z-index: 0;
        }

        /* ── Purple gradient overlay ── */
        .lh-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(159, 99, 196, 0.88) 0%,
            rgba(100, 50, 140, 0.90) 35%,
            rgba(76, 47, 94, 0.94) 65%,
            rgba(50, 25, 70, 0.96) 100%
          );
          z-index: 1;
        }

        /* subtle radial highlight top-center */
        .lh-overlay::after {
          content: '';
          position: absolute;
          top: -10%;
          left: 50%;
          transform: translateX(-50%);
          width: 70%;
          height: 55%;
          background: radial-gradient(ellipse, rgba(180,130,220,0.30) 0%, transparent 70%);
        }

        .lh-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 860px;
          text-align: center;
          animation: rise 0.9s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Outer border frame ── */
        .lh-frame {
          border: 1.5px solid rgba(255,255,255,0.18);
          border-radius: 32px;
          padding: 1.5rem 1.5rem 1.5rem;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        /* ── Title block ── */
        .lh-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(1.5rem, 4.5vw, 2.4rem);
          font-weight: 400;
          color: #ffffff;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        /* ── Divider ── */
        .lh-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 1rem auto 1.1rem;
        }
        .lh-div-line {
          height: 1px;
          width: 64px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.45));
        }
        .lh-div-line:last-child {
          background: linear-gradient(to left, transparent, rgba(255,255,255,0.45));
        }
        .lh-div-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.75);
        }

        .lh-subtitle {
          font-size: 1.5rem;
          font-weight: 300;
          
          color: rgba(255,255,255,0.72);
          letter-spacing: 0.04em;
          margin-bottom: 3rem;
        }

        /* ── Cards ── */
        .lh-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.4rem;
          margin-bottom: 2.8rem;
        }

        .lh-card {
          position: relative;
          background: rgba(255,255,255,0.08);
          border: 2px solid rgba(255,255,255,0.20);
          border-radius: 24px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 2.8rem 1.8rem 2.2rem;
          text-decoration: none;
          display: block;
          overflow: hidden;
          cursor: pointer;
          transition:
            transform 0.4s cubic-bezier(0.23,1,0.32,1),
            border-color 0.3s,
            box-shadow 0.4s,
            background 0.3s;
        }

        /* top shimmer line */
        .lh-card::before {
          content: '';
          position: absolute;
          top: 0; left: 8%; right: 8%;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--light), transparent);
          opacity: 0;
          transition: opacity 0.35s;
        }
        /* inner top glow */
        .lh-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: radial-gradient(ellipse at 50% 0%, rgba(159,99,196,0.12) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.35s;
        }

        .lh-card:hover {
          transform: translateY(-8px);
          border-color: var(--light);
          background: rgba(255,255,255,0.14);
          box-shadow:
            0 20px 50px rgba(76,47,94,0.25),
            0 0 0 4px rgba(159,99,196,0.12);
        }
        .lh-card:hover::before,
        .lh-card:hover::after { opacity: 1; }

        /* card number */
        .lh-card-no {
          position: absolute;
          top: 1rem; right: 1.3rem;
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          color: rgba(159,99,196,0.35);
        }

        /* icon wrapper */
        .lh-icon {
          width: 80px; height: 80px;
          border-radius: 20px;
          background: rgba(159,99,196,0.10);
          border: 1.5px solid rgba(159,99,196,0.30);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          position: relative; z-index: 1;
          transition: all 0.35s ease;
        }
        .lh-card:hover .lh-icon {
          background: linear-gradient(135deg, rgba(159,99,196,0.20), rgba(76,47,94,0.12));
          border-color: var(--light);
          box-shadow: 0 0 18px rgba(159,99,196,0.22);
          transform: scale(1.06) rotate(-3deg);
        }
        .lh-icon svg { color: rgba(255,255,255,0.90); }
        .lh-card:hover .lh-icon svg { color: var(--light); }

        .lh-card-title {
          position: relative; z-index: 1;
          font-family: 'Cinzel', serif;
          font-size: 1.5rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }
        .lh-card-desc {
          position: relative; z-index: 1;
          font-size: 1.2rem;
          font-weight: 300;
          
          color: rgba(255,255,255,0.65);
          line-height: 1.55;
        }

        /* cta arrow */
        .lh-cta {
          position: relative; z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 1.4rem;
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffffff;
          transition: color 0.3s, gap 0.3s;
        }
        .lh-card:hover .lh-cta { color: var(--light); gap: 12px; }
        .lh-cta-line {
          height: 1px; width: 20px;
          background: currentColor;
          transition: width 0.3s;
        }
        .lh-card:hover .lh-cta-line { width: 30px; }

        /* ── Footer ── */
        .lh-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .lh-foot-line {
          height: 1px; width: 40px;
          background: rgba(255,255,255,0.25);
        }
        .lh-foot-text {
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.40);
        }

        @media (max-width: 580px) {
          .lh-grid { grid-template-columns: 1fr; }
          .lh-frame { padding: 2.2rem 1.2rem 2rem; }
          .lh-title { font-size: 1.9rem; }
        }
      `}</style>

      <div className="lh-page">
        {/* Layered background */}
        <div className="lh-bg" />
        <div className="lh-overlay" />

        <div className="lh-content">
          <div className="lh-frame">

            {/* Title */}
            <h1 className="lh-title">Welcome to Legal Hub</h1>

            {/* Ornament */}
            <div className="lh-divider">
              <div className="lh-div-line" />
              <div className="lh-div-dot" />
              <div className="lh-div-line" />
            </div>

            <p className="lh-subtitle">Select your access point to continue</p>

            {/* Cards */}
            <div className="lh-grid">
              <Link href="/adminlogin" className="lh-card">
                <span className="lh-card-no">01</span>
                <div className="lh-icon">
                  <ShieldCheck size={38} strokeWidth={1.5} />
                </div>
                <h2 className="lh-card-title">Admin</h2>
                <p className="lh-card-desc">System control and user management</p>
                <div className="lh-cta">
                  Enter Portal <div className="lh-cta-line" />
                </div>
              </Link>

              <Link href="/lawyerlogin" className="lh-card">
                <span className="lh-card-no">02</span>
                <div className="lh-icon">
                  <Gavel size={38} strokeWidth={1.5} />
                </div>
                <h2 className="lh-card-title">Lawyer</h2>
                <p className="lh-card-desc">Discussion forum and expert panel</p>
                <div className="lh-cta">
                  Enter Portal <div className="lh-cta-line" />
                </div>
              </Link>
            </div>

            {/* Footer */}
            <div className="lh-footer">
              <div className="lh-foot-line" />
              <span className="lh-foot-text">Secure Legal Access AI</span>
              <div className="lh-foot-line" />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
