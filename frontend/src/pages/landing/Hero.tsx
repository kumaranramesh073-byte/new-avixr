import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

export default function Hero() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const navItems = document.querySelectorAll(
      ".premium-logo, .premium-nav-link, .header-right > *"
    );

    gsap.set(videoRef.current, {
      scale: 0.85,
      opacity: 0,
      transformOrigin: "center bottom",
    });
    gsap.set(headlineRef.current, { opacity: 0, y: 20 });
    gsap.set(cardRef.current, { opacity: 0, y: 30 });
    gsap.set(navItems, { opacity: 0, y: -10 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(videoRef.current, {
      scale: 1.0,
      opacity: 1,
      duration: 1.8,
      ease: "power3.out",
    })
    .to(headlineRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.0,
    }, 1.1)
    .to(navItems, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power2.out",
    }, 1.4)
    .to(cardRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
    }, 1.6);
  }, []);

  const handleStartSimulation = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/auth");
  };

  return (
    <div motion="video" className="p-home-hero w-background-video w-background-video-atom" style={{ position: "relative", minHeight: "100vh" }}>
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          objectFit: "cover",
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          zIndex: 1,
        }}
      >
        <source src="/resource/img1/synex-hero_mp4.mp4" type="video/mp4" />
        <source src="/resource/img1/synex-hero_webm.webm" type="video/webm" />
      </video>

      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.15)", zIndex: 2 }} />

      {/* Content wrapper */}
      <div className="home-hero-wrap" style={{ zIndex: 3, width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div className="home-hero-inner" style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "40px",
          position: "relative"
        }}>
          <div className="grid-container home-hero hero-grid-split" style={{ alignItems: "end", width: "100%" }}>
            <div id="w-node-ed6763de-8a4f-f93c-64dc-b9b78573b3f5-9b85289b" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: "960px", gridColumn: "span 12" }}>
              <h1 ref={headlineRef} className="h1-display" style={{
                maxWidth: "100%",
                opacity: 0,
                fontSize: "clamp(42px, 3.5vw + 16px, 64px)",
                lineHeight: "120%",
                letterSpacing: "-0.02em",
                color: "#fff",
                margin: 0
              }}>
                The world&apos;s first AI-powered Business Simulation Engine
              </h1>
            </div>
          </div>

          {/* CTA Button — navigates to auth (onboarding follows signup) */}
          <div ref={cardRef} className="hero-card-container" style={{ opacity: 0 }}>
            <a
              href="#"
              onClick={handleStartSimulation}
              className="premium-cta-btn w-inline-block"
            >
              <span>⚡ Start Free Simulation</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
