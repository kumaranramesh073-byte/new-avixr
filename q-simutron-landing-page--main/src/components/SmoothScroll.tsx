"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Respect the user's motion preference: when reduced motion is requested we
    // skip Lenis entirely and fall back to the browser's native scroll, so no
    // momentum/smoothing is applied. ScrollTrigger still drives reveals (each
    // animation block guards itself against reduced motion where it matters).
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Initialize Lenis Smooth Scroll (only when motion is allowed)
    let lenis: Lenis | null = null;
    let gsapTicker: ((time: number) => void) | null = null;

    if (!prefersReducedMotion) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
      });

      // Sync Lenis scroll events with GSAP ScrollTrigger
      lenis.on("scroll", ScrollTrigger.update);

      // Feed Lenis frame updates into GSAP ticker
      gsapTicker = (time: number) => {
        lenis!.raf(time * 1000);
      };
      gsap.ticker.add(gsapTicker);
      gsap.ticker.lagSmoothing(0);
    }

    // Add w-mod-ix3 class to html to reveal elements that are marked with motion
    document.documentElement.classList.add("w-mod-ix3");

    // Track active event cleanups
    const cleanups: (() => void)[] = [];

    // Click interceptor for internal hash links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && (href.startsWith("#") || href.startsWith("/#"))) {
          const hashIndex = href.indexOf("#");
          const hash = href.substring(hashIndex);

          if (pathname === "/" || pathname === "") {
            e.preventDefault();

            // Handle home scrolling to top
            if (hash === "#home") {
              if (lenis) {
                lenis.scrollTo(0, { duration: 1.2 });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              window.history.pushState(null, "", "/");
              return;
            }

            if (!hash || hash === "#") {
              return;
            }

            try {
              const targetEl = document.querySelector(hash) as HTMLElement | null;
              if (targetEl) {
                if (lenis) {
                  lenis.scrollTo(targetEl, { duration: 1.2 });
                } else {
                  targetEl.scrollIntoView({ behavior: "smooth" });
                }
                window.history.pushState(null, "", hash);
              }
            } catch {
              // ignore invalid selectors
            }
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    cleanups.push(() => document.removeEventListener("click", handleAnchorClick));

    // Define text splitting to support window resize re-calculation
    const splitTitles = () => {
      const titles = document.querySelectorAll('[motion="title"]');
      titles.forEach((el, idx) => {
        const htmlElement = el as HTMLElement;
        // Cache the original HTML (preserves <br>) so re-runs are idempotent.
        let originalHTML = htmlElement.getAttribute("data-original-html");
        if (!originalHTML) {
          originalHTML = htmlElement.innerHTML;
          htmlElement.setAttribute("data-original-html", originalHTML);
        }

        // Kill previous ScrollTrigger instance for this specific title
        ScrollTrigger.getById(`title-trigger-${idx}`)?.kill();

        // Split the source HTML on <br> first so authored line breaks survive.
        const logicalLines = originalHTML
          .split(/<br\s*\/?>/i)
          .map((s) => s.replace(/<[^>]+>/g, "").trim())
          .filter(Boolean);

        // Restore as word spans, one block-level wrapper per logical line so
        // visual layout matches the authored intent before we measure.
        htmlElement.innerHTML = logicalLines
          .map((line) => {
            const words = line.split(/\s+/).filter(Boolean);
            const inner = words
              .map((w) => `<span class="word" style="display:inline-block;">${w}</span>`)
              .join(" ");
            return `<span class="logical-line" style="display:block;">${inner}</span>`;
          })
          .join("");

        // Now group by actual offsetTop so soft-wrapped words within a logical
        // line still get their own animated line-wrap.
        const spans = Array.from(htmlElement.querySelectorAll(".word")) as HTMLElement[];
        const linesMap: { [key: number]: HTMLElement[] } = {};

        spans.forEach((span) => {
          const top = span.offsetTop;
          if (!linesMap[top]) linesMap[top] = [];
          linesMap[top].push(span);
        });

        htmlElement.innerHTML = "";
        const isAlreadyAnimated = htmlElement.getAttribute("data-animated") === "true";

        Object.keys(linesMap)
          .map(Number)
          .sort((a, b) => a - b)
          .map((k) => linesMap[k])
          .forEach((lineSpans) => {
          const lineDiv = document.createElement("span");
          lineDiv.className = "line-wrap";
          lineDiv.style.display = "block";
          lineDiv.style.overflow = "hidden";

          const lineInner = document.createElement("span");
          lineInner.className = "line-inner";
          lineInner.style.display = "inline-block";

          if (isAlreadyAnimated) {
            lineInner.style.transform = "translate3d(0, 0%, 0)";
            lineInner.style.opacity = "1";
          } else {
            lineInner.style.transform = "translate3d(0, 100%, 0)";
            lineInner.style.opacity = "0";
          }

          lineSpans.forEach((span, i) => {
            lineInner.appendChild(span);
            if (i < lineSpans.length - 1) {
              lineInner.appendChild(document.createTextNode(" "));
            }
          });

          lineDiv.appendChild(lineInner);
          htmlElement.appendChild(lineDiv);
        });

        if (!isAlreadyAnimated) {
          const lineInners = htmlElement.querySelectorAll(".line-inner");
          gsap.fromTo(
            lineInners,
            { y: "100%", opacity: 0 },
            {
              y: "0%",
              opacity: 1,
              duration: 1.2,
              ease: "power4.out",
              stagger: 0.1,
              scrollTrigger: {
                id: `title-trigger-${idx}`,
                trigger: htmlElement,
                start: "top 85%",
                toggleActions: "play none none none",
                onEnter: () => {
                  htmlElement.setAttribute("data-animated", "true");
                },
              },
            }
          );
        }
      });
    };

    // Run animation init once [motion="title"] elements exist in the DOM
    const init = () => {
      // 0. Page Load transitions for [motion="page-load"]
      const pageLoads = document.querySelectorAll('[motion="page-load"]');
      pageLoads.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
      });

      // 1. Run Text Splitting
      splitTitles();

      // 2. Fade In animations for [motion="fade-in"]
      const fadeElements = document.querySelectorAll('[motion="fade-in"]');
      fadeElements.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 3. Stagger animations for [motion="stagger"] (grouped by parent)
      const parentMap = new Map<Element, Element[]>();
      document.querySelectorAll('[motion="stagger"]').forEach((el) => {
        const parent = el.parentElement;
        if (parent) {
          if (!parentMap.has(parent)) parentMap.set(parent, []);
          parentMap.get(parent)!.push(el);
        }
      });
      parentMap.forEach((elements, parent) => {
        gsap.fromTo(
          elements,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.15,
            scrollTrigger: {
              trigger: parent,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 4. Numeric Count Up animations for [motion="count"]
      const countElements = document.querySelectorAll('[motion="count"]');
      countElements.forEach((el) => {
        const rawText = el.textContent || "";
        const match = rawText.match(/(\d+)/);
        if (match) {
          const targetVal = parseInt(match[1], 10);
          const suffix = rawText.replace(match[1], "");
          const obj = { val: 0 };
          gsap.to(obj, {
            val: targetVal,
            duration: 1.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
            onUpdate: () => {
              el.textContent = Math.floor(obj.val) + suffix;
            },
            onComplete: () => {
              el.textContent = targetVal + suffix;
            },
          });
        }
      });

      // 5. Infinite horizontal client logo marquee loops
      const marquees = document.querySelectorAll(".home-client-move");
      marquees.forEach((el) => {
        const tween = gsap.to(el, {
          x: "-50%",
          duration: 30,
          ease: "none",
          repeat: -1,
        });

        const onEnter = () => tween.pause();
        const onLeave = () => tween.play();

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);

        cleanups.push(() => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
          tween.kill();
        });
      });

      // 6. Large button hover Cover scale/shift
      const buttons = document.querySelectorAll(".button-l");
      buttons.forEach((btn) => {
        const icon = btn.querySelector(".button-cover-icon");
        if (icon) {
          const onEnter = () => {
            gsap.to(icon, { width: 36, height: 36, x: -4, y: 4, duration: 0.4, ease: "power2.out" });
          };
          const onLeave = () => {
            gsap.to(icon, { width: "", height: "", x: "", y: "", duration: 0.4, ease: "power2.out" });
          };
          btn.addEventListener("mouseenter", onEnter);
          btn.addEventListener("mouseleave", onLeave);

          cleanups.push(() => {
            btn.removeEventListener("mouseenter", onEnter);
            btn.removeEventListener("mouseleave", onLeave);
          });
        }
      });

      // 7. Text-shadow nav hover slide-up
      const hoverTexts = document.querySelectorAll('[motion-hover="button-text"]');
      hoverTexts.forEach((trigger) => {
        const text = trigger.querySelector(".body-b.button-text");
        if (text) {
          const onEnter = () => {
            gsap.to(text, { y: "-100%", duration: 0.4, ease: "power2.out" });
          };
          const onLeave = () => {
            gsap.to(text, { y: "0%", duration: 0.4, ease: "power2.out" });
          };
          trigger.addEventListener("mouseenter", onEnter);
          trigger.addEventListener("mouseleave", onLeave);

          cleanups.push(() => {
            trigger.removeEventListener("mouseenter", onEnter);
            trigger.removeEventListener("mouseleave", onLeave);
          });
        }
      });

      // 8. Arrow background hover scale
      const arrows = document.querySelectorAll('[motion="arrow"]');
      arrows.forEach((trigger) => {
        const bg = trigger.querySelector(".arrow-bg");
        if (bg) {
          gsap.set(bg, { scale: 0 });
          const onEnter = () => {
            gsap.to(bg, { scale: 1, duration: 0.4, ease: "power2.out" });
          };
          const onLeave = () => {
            gsap.to(bg, { scale: 0, duration: 0.4, ease: "power2.out" });
          };
          trigger.addEventListener("mouseenter", onEnter);
          trigger.addEventListener("mouseleave", onLeave);

          cleanups.push(() => {
            trigger.removeEventListener("mouseenter", onEnter);
            trigger.removeEventListener("mouseleave", onLeave);
          });
        }
      });

      // 9. Mega Image link scale zoom
      const megaLinks = document.querySelectorAll(".mega-image-link");
      megaLinks.forEach((trigger) => {
        const img = trigger.querySelector(".mega-image-zoom");
        if (img) {
          const onEnter = () => {
            gsap.to(img, { scale: 1.15, duration: 0.4, ease: "power2.out" });
          };
          const onLeave = () => {
            gsap.to(img, { scale: 1, duration: 0.4, ease: "power2.out" });
          };
          trigger.addEventListener("mouseenter", onEnter);
          trigger.addEventListener("mouseleave", onLeave);

          cleanups.push(() => {
            trigger.removeEventListener("mouseenter", onEnter);
            trigger.removeEventListener("mouseleave", onLeave);
          });
        }
      });

      // 11. Subtle parallax for [motion="parallax"] — GPU transform (yPercent) only.
      //     Skipped under reduced motion and on small screens to avoid jank/overflow.
      //     Each target is pre-scaled so the translate never exposes container edges
      //     (no gaps, no layout shift). Intensity via data-parallax (% travel).
      const allowParallax =
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        window.innerWidth > 768;
      if (allowParallax) {
        document.querySelectorAll('[motion="parallax"]').forEach((el) => {
          const htmlEl = el as HTMLElement;
          const shift = parseFloat(htmlEl.getAttribute("data-parallax") || "6");
          gsap.set(htmlEl, {
            scale: 1.14,
            transformOrigin: "center center",
            willChange: "transform",
          });
          gsap.fromTo(
            htmlEl,
            { yPercent: shift },
            {
              yPercent: -shift,
              ease: "none",
              scrollTrigger: {
                trigger: htmlEl,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );
        });
      }

      // 10. Background video control on scroll for [motion="video"]
      const videoElements = document.querySelectorAll('[motion="video"]');
      videoElements.forEach((el) => {
        const video = el.querySelector("video");
        if (video) {
          ScrollTrigger.create({
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => video.play().catch(() => {}),
            onEnterBack: () => video.play().catch(() => {}),
            onLeave: () => video.pause(),
            onLeaveBack: () => video.pause(),
          });
        }
      });
    };

    // Schedule init either immediately (titles already in DOM) or as soon as one appears.
    // A 500ms safety net forces init on pages with no titles so other animations still run.
    let initialized = false;
    let rafHandle: number | null = null;
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null;
    let initObserver: MutationObserver | null = null;

    const runInit = () => {
      if (initialized) return;
      initialized = true;
      if (initObserver) {
        initObserver.disconnect();
        initObserver = null;
      }
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
      rafHandle = requestAnimationFrame(() => {
        rafHandle = null;
        init();
      });
    };

    if (document.querySelector('[motion="title"]')) {
      runInit();
    } else {
      initObserver = new MutationObserver(() => {
        if (document.querySelector('[motion="title"]')) {
          runInit();
        }
      });
      initObserver.observe(document.body, { childList: true, subtree: true });
      safetyTimeout = setTimeout(runInit, 500);
    }

    // Register debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        splitTitles();
      }, 250);
    };
    window.addEventListener("resize", handleResize);

    // Deep-linking scroll on page load
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash && hash !== "#") {
        setTimeout(() => {
          try {
            const targetEl = document.querySelector(hash) as HTMLElement | null;
            if (targetEl) {
              if (lenis) {
                lenis.scrollTo(targetEl, { duration: 1.5 });
              } else {
                targetEl.scrollIntoView({ behavior: "smooth" });
              }
            }
          } catch {
            // ignore invalid selectors
          }
        }, 600);
      }
    }

    return () => {
      if (initObserver) initObserver.disconnect();
      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (rafHandle !== null) cancelAnimationFrame(rafHandle);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      lenis?.destroy();
      if (gsapTicker) gsap.ticker.remove(gsapTicker);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [pathname]);

  return <>{children}</>;
}
