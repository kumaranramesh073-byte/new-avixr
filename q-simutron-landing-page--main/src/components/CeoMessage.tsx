"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./CeoMessage.module.css";

const CEO_QUOTE =
  "Strategic decisions should not rely on assumptions. Q-Simutron gives our organization a simulation-first approach to planning, allowing us to forecast outcomes, understand ripple effects, and move forward with confidence.";

export default function CeoMessage() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const card = cardRef.current;
    if (!card) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(card, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    gsap.set(card, {
      opacity: 0,
      y: 56,
      scale: 0.92,
      boxShadow: "0 0 0 rgba(10, 100, 238, 0), 0 0 0 rgba(2, 18, 41, 0)",
    });

    const tween = gsap.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      boxShadow:
        "0 0 0 1px rgba(10, 100, 238, 0.12), 0 28px 60px rgba(2, 18, 41, 0.14)",
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 82%",
        toggleActions: "play none none reverse",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section className={styles.section} aria-label="CEO message">
      <div className={styles.container}>
        <div ref={cardRef} className={styles.card}>
            <div className={styles.cardGlow} aria-hidden="true" />
            <div className={styles.inner}>
              <div className={styles.photoWrap}>
                <img
                  src="/resource/img2/ceo-kv-avinash-sarma.png"
                  alt="KV Avinash Sarma, Founder and CEO"
                  className={styles.photo}
                  loading="lazy"
                />
              </div>
              <div className={styles.content}>
                <div className={styles.quoteBox}>
                  <h5 className={`h5-display ${styles.quote}`}>{CEO_QUOTE}</h5>
                </div>
                <div className={styles.info}>
                  <div className="body-r core-blue">KV Avinash Sarma</div>
                  <span className={styles.infoDivider} aria-hidden="true" />
                  <div className="body-r g500">Founder & Chief Executive Officer</div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
}
