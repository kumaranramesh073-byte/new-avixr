import { ShinyButton } from "./ShinyButton";

export default function Footer() {
  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-request-pilot-modal"));
  };

  return (
    <section className="footer">
      {/* Footer Top */}
      <div className="footer-top-wrap">
        <div className="footer-top-inner">
          <h1 motion="title" className="h1-display">
            Strategic Decisions.
            <br />
            Simulated.
          </h1>
          <ShinyButton href="#" onClick={handleContactClick} variant="light-blue">
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
          <div
            className="footer-link-wrap"
            style={{ gridColumn: "span 4" }}
          >
            <a href="/#product" className="footer-link w-inline-block">
              <h6 className="h6-display">Product</h6>
            </a>
            <a href="/#about" className="footer-link w-inline-block">
              <h6 className="h6-display">About</h6>
            </a>
            <a href="#" onClick={handleContactClick} className="footer-link w-inline-block">
              <h6 className="h6-display">Contact</h6>
            </a>
          </div>

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

          <div
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
              <a href="#" onClick={handleContactClick} className="header-link w-inline-block">
                <div className="button-text-wrap">
                  <div className="body-b button-text signal-blue">Contact Us</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="grid-container row-16">
          <div className="footer-social-link-wrap">
            <a href="https://www.linkedin.com/company/avixr-private-limited/" target="_blank" rel="noopener noreferrer" className="social-link w-inline-block">
              <img src="/resource/img1/linkedin.svg" loading="lazy" alt="LinkedIn" className="icon-24" />
            </a>
            <a href="https://www.instagram.com/avixr_tech" target="_blank" rel="noopener noreferrer" className="social-link w-inline-block">
              <img src="/resource/img1/instagram.svg" loading="lazy" alt="Instagram" className="icon-24" />
            </a>
            <a href="https://www.avixr.in/" target="_blank" rel="noopener noreferrer" className="social-link w-inline-block">
              <img src="/resource/img1/globe.svg" loading="lazy" alt="Website" className="icon-24" />
            </a>
          </div>

          <div className="footer-info-wrap">
            <a href="#" className="footer-info-link w-inline-block">
              <div className="label">©2026 Avixr All Rights Reserved</div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
