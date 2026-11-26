"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Intro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    const title = titleRef.current;
    const imagesContainer = imagesRef.current;
    if (!container || !title || !imagesContainer) return;

    const images = imagesContainer.querySelectorAll(".home-intro-image");
    if (images.length === 0) return;

    // Create ScrollTriggered timeline matching Webflow's config exactly
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom center",
        scrub: 0.8,
      },
    });

    // Match exact timeline parameters from the original page
    tl.to(title, {
      scale: 0.5,
      ease: "none",
      duration: 0.22,
    }, 0.02);

    // Tweens for images l1 to l6
    const l1 = imagesContainer.querySelector(".home-intro-image.l1");
    const l2 = imagesContainer.querySelector(".home-intro-image.l2");
    const l3 = imagesContainer.querySelector(".home-intro-image.l3");
    const l4 = imagesContainer.querySelector(".home-intro-image.l4");
    const l5 = imagesContainer.querySelector(".home-intro-image.l5");
    const l6 = imagesContainer.querySelector(".home-intro-image.l6");

    if (l1) tl.to(l1, { y: "-50%", scale: 0.8, ease: "none", duration: 0.07 }, 0.09);
    if (l2) tl.to(l2, { x: "-50%", y: "-50%", scale: 0.8, ease: "none", duration: 0.07 }, 0.09);
    if (l3) tl.to(l3, { x: "-50%", y: "-50%", scale: 0.8, ease: "none", duration: 0.07 }, 0.09);
    if (l4) tl.to(l4, { y: "-50%", scale: 0.8, ease: "none", duration: 0.07 }, 0.09);
    if (l5) tl.to(l5, { x: "-50%", y: "-50%", scale: 0.8, ease: "none", duration: 0.07 }, 0.09);
    if (l6) tl.to(l6, { x: "-50%", y: "-50%", scale: 0.8, ease: "none", duration: 0.07 }, 0.09);

    // Expand l6 to fit the screen overlay at the end
    if (l6) tl.to(l6, { width: "35vw", height: "45vw", ease: "none", duration: 0.06 }, 0.16);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section ref={containerRef} header-color="dark" className="p-home-intro">
      <div className="home-intro-sticky">
        <div className="home-intro-title-wrap">
          <h1 ref={titleRef} className="home-inro-title">
            Predict.
            <br />
            Simulate.
            <br />
            Execute.
          </h1>
        </div>
        <div ref={imagesRef} className="home-intro-image-wrap">
          <img
            src="/resource/img2/img1.png"
            loading="lazy"
            alt="Q-Simutron Dashboard UI"
            className="home-intro-image l1"
          />
          <img
            src="/resource/img2/qsimutron-banner.png"
            loading="lazy"
            alt="AI Node Concept"
            className="home-intro-image l2"
          />
          <img
            src="/resource/img2/dashboard-overview.png"
            loading="lazy"
            alt="AI Flow Chart"
            className="home-intro-image l3"
            style={{ aspectRatio: "3 / 2", objectFit: "cover", width: "360px" }}
          />
          <img
            src="/resource/img2/ai.png"
            loading="lazy"
            alt="AI Flow Controls"
            className="home-intro-image l4"
          />
          <img
            src="/resource/img2/img2.png"
            loading="lazy"
            alt="Q-Simutron Modular System Editor"
            className="home-intro-image l5"
          />
          <img
            src="/resource/img2/qsimutron-cube.png"
            loading="lazy"
            alt="AI Flow Visualized"
            className="home-intro-image l6"
          />
        </div>
      </div>
    </section>
  );
}
