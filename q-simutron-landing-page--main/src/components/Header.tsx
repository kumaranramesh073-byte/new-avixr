"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

const AnimatedText = ({ text, className = "body-b button-text white", wrapperClass = "button-text-wrap" }: { text: string; className?: string; wrapperClass?: string }) => (
  <div className={`${wrapperClass} animated-text-wrap`}>
    <div className="animated-text-inner">
      <span className={className}>{text}</span>
      <span className={className}>{text}</span>
    </div>
  </div>
);

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const menuRef = useRef<HTMLDivElement>(null);
  const menuTextRef = useRef<HTMLDivElement>(null);
  const topLineRef = useRef<HTMLDivElement>(null);
  const bottomLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on path change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    if (isMenuOpen) {
      // Open animation
      gsap.killTweensOf(menu);
      gsap.set(menu, { display: "flex", visibility: "visible", opacity: 0, y: -20 });
      gsap.to(menu, { opacity: 1, y: 0, duration: 0.6, ease: "power4.out" });

      const staggerItems = menu.querySelectorAll("[mega-menu-in]");
      if (staggerItems.length > 0) {
        gsap.killTweensOf(staggerItems);
        gsap.fromTo(
          staggerItems,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power4.out", stagger: 0.05, delay: 0.1 }
        );
      }

      if (topLineRef.current && bottomLineRef.current) {
        gsap.to(topLineRef.current, { y: 4.5, rotate: 45, duration: 0.4, ease: "power2.out" });
        gsap.to(bottomLineRef.current, { y: -4.5, rotate: -45, duration: 0.4, ease: "power2.out" });
      }

      if (menuTextRef.current) {
        gsap.to(menuTextRef.current, { width: 0, opacity: 0, x: -10, duration: 0.4, ease: "power2.out" });
      }
    } else {
      // Close animation
      gsap.killTweensOf(menu);
      gsap.to(menu, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(menu, { display: "none", visibility: "hidden" });
        },
      });

      if (topLineRef.current && bottomLineRef.current) {
        gsap.to(topLineRef.current, { y: 0, rotate: 0, duration: 0.4, ease: "power2.out" });
        gsap.to(bottomLineRef.current, { y: 0, rotate: 0, duration: 0.4, ease: "power2.out" });
      }

      if (menuTextRef.current) {
        gsap.to(menuTextRef.current, { width: "auto", opacity: 1, x: 0, duration: 0.4, ease: "power2.out" });
      }
    }
  }, [isMenuOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    window.dispatchEvent(new CustomEvent("open-request-pilot-modal"));
  };

  return (
    <div
      data-wf--header--variant="light"
      className={`premium-header ${isScrolled ? "scrolled" : ""}`}
    >
      <div className="premium-header-wrap">
        <div className="premium-header-inner">
          <div className="header-left">
            <Link href="/#home" className="premium-logo">
              <img
                src="/resource/img2/qsimutron-logo-white.png"
                loading="lazy"
                alt="Q-Simutron Logo"
                className="premium-logo-icon"
              />
              <span className="premium-logo-text">Q-Simutron</span>
            </Link>
            <div className="premium-nav">
              <Link href="/#product" className="premium-nav-link group" motion-hover="button-text">
                <AnimatedText text="Product" />
              </Link>
              <Link href="/#oct-simulation" className="premium-nav-link group" motion-hover="button-text">
                <AnimatedText text="Features" />
              </Link>
              <Link href="/#about" className="premium-nav-link group" motion-hover="button-text">
                <AnimatedText text="About" />
              </Link>
            </div>
          </div>
          <div className="header-right">
            <Link
              href="/contact"
              onClick={handleContactClick}
              className="premium-btn-contact"
            >
              Contact
            </Link>
            <a
              href="#"
              onClick={toggleMenu}
              className={`premium-btn-menu group ${isMenuOpen ? "active" : ""}`}
            >
              <div ref={menuTextRef} className="overflow-hidden whitespace-nowrap flex">
                <AnimatedText text="Menu" wrapperClass="button-text-wrap menu" />
              </div>
              <div className="menu-icon">
                <div ref={topLineRef} className="menu-line top"></div>
                <div ref={bottomLineRef} className="menu-line bottom"></div>
              </div>
            </a>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <div
          ref={menuRef}
          className="mega-menu"
          style={{
            display: "none",
            visibility: "hidden",
          }}
        >
          <div className="mega-menu-inner">
            {/* Left Image Link */}
            {/* Left Image Link */}
            <Link href="/#about" className="mega-image-link w-inline-block group" mega-menu-in="">
              <div className="mega-image-link-wrap">
                <div className="label logic-blue">Q-Simutron</div>
                <h6 className="h6-display">Simulate Business Outcomes Before Execution</h6>
              </div>
              <img
                src="/resource/img1/synex-01-3x.webp"
                loading="lazy"
                alt="Q-Simutron Banner"
                className="mega-image-zoom"
              />
            </Link>

            {/* Product Column */}
            <div className="mega-link-wrap" mega-menu-in="">
              <div className="label grey-500-megamenu">Product</div>
              <Link href="/#product" className="mega-card-link w-inline-block">
                <img
                  src="/resource/img2/dashboard-overview.png"
                  loading="lazy"
                  alt="Q-Simutron Thumbnail"
                  className="mega-card-image"
                  style={{ objectFit: "cover" }}
                />
                <div className="mega-card-info">
                  <div className="body-b">Q-Simutron</div>
                  <div className="body-r grey-500-megamenu">AI-Powered Business Simulation Engine</div>
                </div>
              </Link>
            </div>

            {/* Company Column */}
            <div className="mega-link-wrap" mega-menu-in="">
              <div className="label grey-500-megamenu">Company</div>
              <div className="mega-link-inner">
                <Link href="/#about" className="button-text mega-link w-inline-block group">
                  <AnimatedText text="About" className="body-b" wrapperClass="overflow-hidden relative flex" />
                </Link>
              </div>
            </div>

            {/* Support Column */}
            <div className="mega-link-wrap" mega-menu-in="">
              <div className="label grey-500-megamenu">Support</div>
              <div className="mega-link-inner">
                <Link href="/contact" onClick={handleContactClick} className="button-text mega-link w-inline-block group">
                  <AnimatedText text="Contact" className="body-b" wrapperClass="overflow-hidden relative flex" />
                </Link>
                <Link href="/pricing" className="button-text mega-link w-inline-block group">
                  <AnimatedText text="Pricing" className="body-b" wrapperClass="overflow-hidden relative flex" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mega-menu-close" onClick={() => setIsMenuOpen(false)}></div>
        </div>
      </div>
    </div>
  );
}
