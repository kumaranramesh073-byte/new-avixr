"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShinyButton } from "@/components/ShinyButton";

export default function AboutSection() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Desktop layout: cards stick at top: 120px
      mm.add("(min-width: 992px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".p-about-card-inner");
        cards.forEach((card, idx) => {
          if (idx < cards.length - 1) {
            const nextCard = cards[idx + 1];
            gsap.to(card, {
              scale: 0.94,
              opacity: 0.6,
              ease: "none",
              scrollTrigger: {
                trigger: nextCard,
                start: "top bottom",
                end: "top 120px",
                scrub: 1,
                invalidateOnRefresh: true,
              }
            });
          }
        });
      });

      // Mobile/Tablet layout: cards stick at top: 100px
      mm.add("(max-width: 991px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".p-about-card-inner");
        cards.forEach((card, idx) => {
          if (idx < cards.length - 1) {
            const nextCard = cards[idx + 1];
            gsap.to(card, {
              scale: 0.94,
              opacity: 0.6,
              ease: "none",
              scrollTrigger: {
                trigger: nextCard,
                start: "top bottom",
                end: "top 100px",
                scrub: 1,
                invalidateOnRefresh: true,
              }
            });
          }
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* About Hero */}
      <section
        className="p-about-hero"
        motion="page-load"
        style={{
          backgroundImage: 'linear-gradient(to bottom, var(--_synex---color--shading-black--20), var(--_synex---color--shading-black--20)), url("/resource/img2/qsimutron-banner.png")'
        }}
      >
        <div className="home-hero-wrap">
          <div className="home-hero-inner">
            <div className="grid-container bottom-align">
              <h1 id="w-node-_65a0b175-871b-e011-e619-cc1ebf02614e-52b16674" className="h1-display max-600" motion="title">
                Simulated Intelligence.
              </h1>
              <h6 id="w-node-_65a0b175-871b-e011-e619-cc1ebf026152-52b16674" className="h6-body max-300" motion="fade-in">
                Predictive by design.
                <br />
                Strategic by intelligence.
              </h6>
            </div>
            <div className="container">
              <ShinyButton href="#Explore" variant="light-blue">
                Explore
              </ShinyButton>
            </div>
          </div>
        </div>
      </section>

      {/* Explore / Features Count */}
      <div id="Explore" className="about-feature-wrap">
        <div className="grid-container">
          <div id="w-node-_4c55aadf-f49b-1f5d-0fb4-cc1ee818a3d8-52b16674" className="about-feature-title-wrap">
            <h6 className="h6-display g500" motion="fade-in">Decision Intelligence Platform</h6>
          </div>
          <div id="w-node-d4429ace-be4c-f8e9-8daf-eba042081821-52b16674" className="about-feature-content">
            <h3 className="h3-display max-600" motion="title">Q-Simutron predicts outcomes before decisions are made</h3>
            <h6 className="h6-body g500 max-550" motion="fade-in">
              Q-Simutron combines business simulation,
              market intelligence, competitor analysis,
              forecasting, and digital twin technology into a
              single platform that helps organizations evaluate
              strategic decisions before execution.
            </h6>
          </div>
        </div>
      </div>

      {/* About Cards */}
      <div className="p-about-card">
        <div className="grid-container">
          <div id="w-node-fc34912d-d992-0e7b-851f-72b6ece96826-52b16674" className="p-about-card-wrap">

            <div className="p-about-card-inner" motion="stagger">
              <div className="about-card-content">
                <h2 className="h2-display">
                  Decision
                  <br />
                  Intelligence
                </h2>
                <div className="about-card-info">
                  <h6 className="h6-display">Strategic Foundation</h6>
                </div>
              </div>
              <img
                src="/resource/img2/decision intelligence.png"
                loading="lazy"
                alt="Q-Simutron OCT Simulation"
                className="about-card-cover"
              />
            </div>

            <div className="p-about-card-inner _2" motion="stagger">
              <div className="about-card-content">
                <h2 className="h2-display">
                  Market
                  <br />
                  Intelligence
                </h2>
                <div className="about-card-info">
                  <h6 className="h6-display">Live Market Signals</h6>
                </div>
              </div>
              <img
                src="/resource/img2/market intelligence dashboard.png"
                loading="lazy"
                alt="Q-Simutron Market Intelligence"
                className="about-card-cover"
              />
            </div>

            <div className="p-about-card-inner _3" motion="stagger">
              <div className="about-card-content dark">
                <h2 className="h2-display">
                  Predictive
                  <br />
                  Forecasting
                </h2>
                <div className="about-card-info dark">
                  <h6 className="h6-display">Outcome Confidence</h6>
                </div>
              </div>
              <img
                src="/resource/img2/predictive  forecasting.png"
                loading="lazy"
                alt="Q-Simutron Predictive Forecasting"
                className="about-card-cover"
              />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
