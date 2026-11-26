import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

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

      lenis.on("scroll", ScrollTrigger.update);

      gsapTicker = (time: number) => {
        lenis!.raf(time * 1000);
      };
      gsap.ticker.add(gsapTicker);
      gsap.ticker.lagSmoothing(0);
    }

    document.documentElement.classList.add("w-mod-ix3");

    const cleanups: (() => void)[] = [];

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

    const splitTitles = () => {
      const titles = document.querySelectorAll('[motion="title"]');
      titles.forEach((el, idx) => {
        const htmlElement = el as HTMLElement;
        let originalHTML = htmlElement.getAttribute("data-original-html");
        if (!originalHTML) {
          originalHTML = htmlElement.innerHTML;
          htmlElement.setAttribute("data-original-html", originalHTML);
        }

        ScrollTrigger.getById(`title-trigger-${idx}`)?.kill();

        const logicalLines = originalHTML
          .split(/<br\s*\/?>/i)
          .map((s) => s.replace(/<[^>]+>/g, "").trim())
          .filter(Boolean);

        htmlElement.innerHTML = logicalLines
          .map((line) => {
            const words = line.split(/\s+/).filter(Boolean);
            const inner = words
              .map((w) => `<span class="word" style="display:inline-block;">${w}</span>`)
              .join(" ");
            return `<span class="logical-line" style="display:block;">${inner}</span>`;
          })
          .join("");

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

    const init = () => {
      const pageLoads = document.querySelectorAll('[motion="page-load"]');
      pageLoads.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
      });

      splitTitles();

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

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        splitTitles();
      }, 250);
    };
    window.addEventListener("resize", handleResize);

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
