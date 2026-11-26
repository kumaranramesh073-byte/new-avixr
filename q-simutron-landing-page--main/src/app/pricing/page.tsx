"use client";

import { useState } from "react";
import Link from "next/link";
import Clients from "@/components/Clients";
import { ShinyButton } from "@/components/ShinyButton";

interface BenefitItem {
  icon: string;
  text: string;
}

interface PlanItem {
  name: string;
  desc: string;
  annualPrice: string;
  monthlyPrice: string;
  isDark?: boolean;
  benefits: BenefitItem[];
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("annual");

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-request-pilot-modal"));
  };

  const plans: PlanItem[] = [
    {
      name: "Basic",
      desc: "Core features for structured system automation",
      annualPrice: "$49",
      monthlyPrice: "$59",
      benefits: [
        { icon: "/resource/img1/b-Check.svg", text: "Modular Flows" },
        { icon: "/resource/img1/b-Check.svg", text: "Adaptive Logic" },
        { icon: "/resource/img1/b-Check.svg", text: "Signal Processing" },
        { icon: "/resource/img1/b-Check.svg", text: "Scalable Architecture" },
        { icon: "/resource/img1/b-Check.svg", text: "Standard Integrations" },
      ],
    },
    {
      name: "Professional",
      desc: "Expanded tools for adaptive intelligence modeling",
      annualPrice: "$99",
      monthlyPrice: "$119",
      isDark: true,
      benefits: [
        { icon: "/resource/img1/w-Check.svg", text: "Modular Flows" },
        { icon: "/resource/img1/w-Check.svg", text: "Adaptive Logic" },
        { icon: "/resource/img1/w-Check.svg", text: "Advanced Signals" },
        { icon: "/resource/img1/w-Check.svg", text: "Model Controls" },
        { icon: "/resource/img1/w-Check.svg", text: "Extended Integrations" },
      ],
    },
    {
      name: "Organization",
      desc: "Full capability for complex enterprise systems",
      annualPrice: "$149",
      monthlyPrice: "$169",
      benefits: [
        { icon: "/resource/img1/b-Check.svg", text: "Modular Flows" },
        { icon: "/resource/img1/b-Check.svg", text: "Adaptive Intelligence" },
        { icon: "/resource/img1/b-Check.svg", text: "Advanced Signal Routing" },
        { icon: "/resource/img1/b-Check.svg", text: "Governance Layers" },
        { icon: "/resource/img1/b-Check.svg", text: "Priority Integrations" },
      ],
    },
  ];

  return (
    <>
      <section className="p-pricing-intro" motion="page-load">
        <div className="grid-container">
          <h1 id="w-node-_29a8439e-0386-2f06-20a6-89fc880731a1-2d8eeda5" className="h1-display max-600" motion="title">
            Engineered for every scale
          </h1>
          <div id="w-node-_29a8439e-0386-2f06-20a6-89fc880731a5-2d8eeda5" className="product-intro-button-wrap">
            <ShinyButton href="#Explore" variant="light-blue">
              Explore
            </ShinyButton>
          </div>
          <h6 id="w-node-_29a8439e-0386-2f06-20a6-89fc880731a8-2d8eeda5" className="h6-body max-300" motion="fade-in">
            Modular by design. Connected by intelligence.
          </h6>
        </div>

        <div id="Explore" className="grid-container">
          <div id="w-node-_19c8d05c-60d6-a537-9826-8a5c281ad6ed-2d8eeda5" className="pricing-tab w-tabs">
            <div className="pricing-tab-menu w-tab-menu">
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`radio-link w-inline-block ${billingPeriod === "annual" ? "w-tab-link w--current" : "w-tab-link"}`}
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div className="body-r">Annual</div>
              </button>
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`radio-link w-inline-block ${billingPeriod === "monthly" ? "w-tab-link w--current" : "w-tab-link"}`}
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div className="body-r">Monthly</div>
              </button>
            </div>

            <div className="pricing-tab-content w-tab-content">
              <div className="tab-inner w-tab-pane w--tab-active">
                <div className="tab-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", width: "100%" }}>
                  {plans.map((plan, idx) => {
                    const price = billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;
                    const cardClass = plan.isDark
                      ? "pricing-card w-variant-78b06ec1-afa8-33a2-86ef-72a14f785166"
                      : "pricing-card";
                    const textClass = plan.isDark ? "w-variant-78b06ec1-afa8-33a2-86ef-72a14f785166" : "";

                    return (
                      <div
                        key={idx}
                        id="w-node-c9d85e38-8de9-8fd3-62fd-c1486fbeecd6-6fbeecd6"
                        className={cardClass}
                        motion="stagger"
                        style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                      >
                        <div>
                          <div className="prcing-card-title">
                            <h5 className={`h5-display ${textClass}`}>{plan.name}</h5>
                            <h6 className="h6-body g500">{plan.desc}</h6>
                          </div>
                          <div className="prcing-card-price">
                            <h3 className={`h3-display ${textClass}`}>{price}</h3>
                            <div className={`pricing-card-btn ${textClass}`}>
                              <ShinyButton
                                href="/contact"
                                onClick={handleContactClick}
                                variant={plan.isDark ? "light-blue" : "default"}
                              >
                                Request Pilot
                              </ShinyButton>
                            </div>
                          </div>
                        </div>

                        <div className="prcing-card-benefit" style={{ marginTop: "24px" }}>
                          {plan.benefits.map((benefit, bIdx) => (
                            <div key={bIdx} className={`prcing-benefit-inner ${textClass}`}>
                              <img src={benefit.icon} loading="lazy" alt="CheckIcon" className="icon-20" />
                              <div className="body-r">{benefit.text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Rolling Logos Slider */}
      <Clients />
    </>
  );
}
