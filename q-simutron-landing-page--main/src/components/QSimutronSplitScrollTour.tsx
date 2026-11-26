"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./QSimutronSplitScrollTour.module.css";

/* ------------------------------------------------------------------
   CONTENT — one entry per stacked band. Edit freely.
   `theme` maps to the colour classes in the CSS module.
   ------------------------------------------------------------------ */

type Band = {
  id: string;
  index: string;
  title: [string, string];
  tagline: string;
  image: string;
  alt: string;
  theme: string;
};

const BANDS: Band[] = [
  {
    id: "oct",
    index: "01 — Simulation",
    title: ["OCT", "Simulation"],
    tagline: "Run market, pricing and competitor decisions before you commit a single resource.",
    image: "/resource/img2/tour-oct-simulation.png",
    alt: "Q-Simutron OCT Simulation card",
    theme: styles.theme1,
  },
  {
    id: "market",
    index: "02 — Intelligence",
    title: ["Market", "Intelligence"],
    tagline: "Track competitors, demand shifts and economic signals as the market moves in real time.",
    image: "/resource/img2/tour-market-intelligence.png",
    alt: "Q-Simutron Market Intelligence dashboard",
    theme: styles.theme2,
  },
  {
    id: "twin",
    index: "03 — Digital Twin",
    title: ["Digital", "Twin"],
    tagline: "See the ripple before you decide — model how one decision moves your entire business.",
    image: "/resource/img2/tour-digital-twin.png",
    alt: "Q-Simutron Digital Twin ripple network",
    theme: styles.theme3,
  },
  {
    id: "forecast",
    index: "04 — Forecasting",
    title: ["Predictive", "Forecasting"],
    tagline: "Forecast outcomes and choose the best path with AI-powered confidence scoring.",
    image: "/resource/img2/tour-predictive-forecasting.png",
    alt: "Q-Simutron Predictive Forecasting card",
    theme: styles.theme4,
  },
];

export default function QSimutronSplitScrollTour() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Desktop + motion: bands stack via CSS sticky; GSAP adds the
      // entrance parallax/scale on each band as it rises into view.
      mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
        const section = sectionRef.current;
        if (!section) return;

        const bands = gsap.utils.toArray<HTMLElement>(`.${styles.band}`, section);

        bands.forEach((band, idx) => {
          const panel = band.querySelector<HTMLElement>(`.${styles.panel}`);
          const img = band.querySelector<HTMLElement>("[data-img]");
          const text = band.querySelector<HTMLElement>("[data-text]");

          if (img) {
            gsap.fromTo(
              img,
              { yPercent: 8, scale: 1.06 },
              {
                yPercent: 0,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: band,
                  start: "top bottom",
                  end: "top top",
                  scrub: 1,
                  invalidateOnRefresh: true,
                },
              }
            );
          }

          if (text) {
            gsap.fromTo(
              text,
              { autoAlpha: 0, y: 56 },
              {
                autoAlpha: 1,
                y: 0,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: band,
                  start: "top bottom",
                  end: "top 55%",
                  scrub: 1,
                  invalidateOnRefresh: true,
                },
              }
            );
          }

          // Stacking card animation: scale down and fade out when the next band enters
          if (idx < bands.length - 1 && panel) {
            const nextBand = bands[idx + 1];
            gsap.to(panel, {
              scale: 0.94,
              opacity: 0.6,
              ease: "none",
              scrollTrigger: {
                trigger: nextBand,
                start: "top bottom",
                end: "top top",
                scrub: 1,
                invalidateOnRefresh: true,
              },
            });
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} aria-label="Q-Simutron product tour">
      {BANDS.map((b) => {
        const isOct = b.id === "oct";
        const Tag = isOct ? "section" : "div";
        return (
          <Tag
            key={b.id}
            id={isOct ? "oct-simulation" : undefined}
            className={styles.band}
          >
            <div className={`${styles.panel} ${b.theme}`}>
              <div className={styles.inner}>
                <div className={styles.text} data-text>
                  <span className={styles.index}>{b.index}</span>
                  <h2 className={styles.title}>
                    {b.title[0]}
                    <br />
                    {b.title[1]}
                  </h2>
                  <p className={styles.tagline}>{b.tagline}</p>
                </div>

                <div className={styles.visual}>
                  <img
                    src={b.image}
                    alt={b.alt}
                    loading="lazy"
                    className={styles.image}
                    data-img
                  />
                </div>

                <span className={styles.brand}>
                  <span className={styles.brandDot} />
                  Q-Simutron
                </span>
              </div>
            </div>
          </Tag>
        );
      })}
    </section>
  );
}
