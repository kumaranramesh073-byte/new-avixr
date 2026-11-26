"use client";

import Link from "next/link";
import { ShinyButton } from "@/components/ShinyButton";

export default function Footer() {
  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-request-pilot-modal"));
  };

  return (
    <section className="footer">
      {/* Footer Top — Full-viewport height image background */}
      <div className="footer-top-wrap">
        <div className="footer-top-inner">
          <h1 motion="title" className="h1-display">
            Strategic Decisions.
            <br />
            Simulated.
          </h1>
          <ShinyButton href="/contact" onClick={handleContactClick} variant="light-blue">
            Contact
          </ShinyButton>
        </div>
        <div className="footer-top-inner">
          <h6 className="h6-body max-300">
            Simulate markets, competitors, financial performance, customer behavior, and business risks before executing critical decisions.
          </h6>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom-wrap">
        <div className="grid-container">
          {/* Navigation Links */}
          <div
            id="w-node-_2daf2490-9653-3b55-af18-b4d055cafa07-55caf9f4"
            className="footer-link-wrap"
            style={{ gridColumn: "span 4" }}
          >
            <Link href="/#product" className="footer-link w-inline-block">
              <h6 className="h6-display">Product</h6>
            </Link>
            <Link href="/#about" className="footer-link w-inline-block">
              <h6 className="h6-display">About</h6>
            </Link>
            <Link href="/contact" onClick={handleContactClick} className="footer-link w-inline-block">
              <h6 className="h6-display">Contact</h6>
            </Link>
            <Link href="/pricing" className="footer-link w-inline-block">
              <h6 className="h6-display">Pricing</h6>
            </Link>
          </div>

          {/* Centered CTA Block */}
          <div
            className="footer-cta-center-wrap"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "14px",
              padding: "0 10px",
            }}
          >
            <h4 style={{ fontSize: "20px", fontWeight: 600, color: "var(--_synex---color--primary--core-blue)", margin: 0, lineHeight: "1.3" }}>
              Ready to simulate your next business decision?
            </h4>
            <p style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--_synex---color--grey--500)", margin: 0 }}>
              See how Q-Simutron helps organizations forecast outcomes, identify risks, and evaluate strategic moves before execution.
            </p>
            <ShinyButton
              href="#"
              onClick={handleContactClick}
              variant="light-blue"
              style={{ marginTop: "12px" }}
            >
              Request Pilot
            </ShinyButton>
          </div>

          {/* Office Addresses */}
          <div
            id="w-node-_2daf2490-9653-3b55-af18-b4d055cafa1a-55caf9f4"
            className="footer-address-wrap"
            style={{ gridColumn: "span 4" }}
          >
            <div className="footer-address">
              <p className="body-r">
                Tamil Nadu Technology Hub (iTNT)- Head Office
                <br />
                Anna University Campus, Kotturpuram, Chennai, Tamil Nadu 600025, India.
                <br />
                +82 123456789
              </p>
              <Link href="/contact" onClick={handleContactClick} className="header-link w-inline-block">
                <div className="button-text-wrap">
                  <div className="body-b button-text signal-blue">Contact Us</div>
                </div>
              </Link>
            </div>
            {/* <div className="footer-address">
              <p className="body-r">
                Korea seoul - Head Office
                <br />
                21st Floor, 10 Hudson Yards, New York, NY 10001
                <br />
                +1 (212) 555-4829
              </p>
              <Link href="/contact" className="header-link w-inline-block">
                <div className="button-text-wrap">
                  <div className="body-b button-text signal-blue">Contact Us</div>
                </div>
              </Link>
            </div> */}
          </div>

          {/* Synex Symbol removed because file was missing */}
        </div>

        {/* Footer Sub Row */}
        <div className="grid-container row-16">
          {/* 
          <div
            id="w-node-_2daf2490-9653-3b55-af18-b4d055cafa31-55caf9f4"
            className="footer-title-wrap"
          >
            <h5 className="h5-display">
              Strategic Decisions.
              <br />
              Simulated.
            </h5>
            <div className="footer-sub-link-wrap">
              <Link href="/privacy-policy" className="footer-sub-link w-inline-block">
                <p className="body-r">Privacy Policy</p>
              </Link>
              <Link href="/style" className="footer-sub-link w-inline-block">
                <p className="body-r">Style guide</p>
              </Link>
              <Link href="/licenses" className="footer-sub-link w-inline-block">
                <p className="body-r">Licenses</p>
              </Link>
              <Link href="/changelog" className="footer-sub-link w-inline-block">
                <p className="body-r">Changelog</p>
              </Link>
              <Link href="/instructions" className="footer-sub-link w-inline-block">
                <p className="body-r">Instructions</p>
              </Link>
              <Link href="/404" className="footer-sub-link w-inline-block">
                <p className="body-r">404</p>
              </Link>
              <Link href="/401" className="footer-sub-link w-inline-block">
                <p className="body-r">Password</p>
              </Link>
            </div>
          </div>
          */}

          {/* Social Links */}
          <div
            id="w-node-_2daf2490-9653-3b55-af18-b4d055cafa49-55caf9f4"
            className="footer-social-link-wrap"
          >
            <a
              href="https://www.linkedin.com/company/avixr-private-limited/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link w-inline-block"
            >
              <img
                src="/resource/img1/linkedin.svg"
                loading="lazy"
                alt="LinkedIn"
                className="icon-24"
              />
            </a>
            <a
              href="https://www.instagram.com/avixr_tech"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link w-inline-block"
            >
              <img
                src="/resource/img1/instagram.svg"
                loading="lazy"
                alt="Instagram"
                className="icon-24"
              />
            </a>
            <a
              href="https://www.avixr.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link w-inline-block"
            >
              <img
                src="/resource/img1/globe.svg"
                loading="lazy"
                alt="Website"
                className="icon-24"
              />
            </a>
          </div>

          {/* Copyright Info */}
          <div
            id="w-node-_2daf2490-9653-3b55-af18-b4d055cafa50-55caf9f4"
            className="footer-info-wrap"
          >
            <a href="#" className="footer-info-link w-inline-block">
              <div className="label">©2026 Avixr All Rights Reserved</div>
            </a>
            {/* <a href="#" className="footer-info-link w-inline-block">
              <div className="label">Site by STUDIO</div>
            </a> */}
          </div>
        </div>
      </div>
    </section>
  );
}
