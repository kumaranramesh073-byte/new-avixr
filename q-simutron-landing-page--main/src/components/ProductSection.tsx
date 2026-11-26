"use client";

import { useState } from "react";
import QSimutronSplitScrollTour from "@/components/QSimutronSplitScrollTour";
import { ShinyButton } from "@/components/ShinyButton";
import CeoMessage from "@/components/CeoMessage";

interface FAQItem {
  number: string;
  question: string;
  answer: string;
}

export default function ProductSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      number: "01",
      question: "How is Q-Simutron different from traditional analytics tools?",
      answer:
        "Q-Simutron goes beyond dashboards and reports by simulating future business scenarios. Instead of only showing what happened, it predicts what could happen before strategic decisions are executed."
    },
    {
      number: "02",
      question: "Do I need to provide confidential company data?",
      answer:
        "No. Q-Simutron can generate valuable insights using market intelligence, public signals, industry trends, and external business data, minimizing onboarding complexity and privacy concerns."
    },
    {
      number: "03",
      question: "What decisions can Q-Simutron simulate?",
      answer:
        "Organizations use Q-Simutron to evaluate market expansion, pricing strategies, product launches, investment opportunities, competitor responses, operational changes, and growth initiatives before execution."
    },
    {
      number: "04",
      question: "How does the Digital Twin work?",
      answer:
        "The Digital Twin creates a virtual representation of your business environment and models how decisions impact revenue, customers, competitors, operations, risks, and market position before they happen."
    },
    {
      number: "05",
      question: "Can Q-Simutron monitor competitors and market changes in real time?",
      answer:
        "Yes. Q-Simutron continuously analyzes competitor movements, market signals, industry trends, emerging opportunities, and risk indicators to deliver proactive strategic intelligence."
    },
    {
      number: "06",
      question: "Who is Q-Simutron built for?",
      answer:
        "Q-Simutron is designed for startups, MSMEs, enterprises, investors, consultants, innovation teams, and government organizations seeking data-driven decision making and predictive business intelligence."
    }
  ];

  return (
    <>
      {/* Product Intro */}
      <section className="p-product-intro" motion="page-load">
        <div className="grid-container">
          <h1 id="w-node-_565edf74-8c03-448f-3400-55434da6fccf-68262bed" className="h1-display max-600" motion="title">
            Decision Intelligence For Modern Business
          </h1>
          <div id="w-node-_5a9b6c14-e4ec-cfa6-7df1-9054d648104b-68262bed" className="product-intro-button-wrap">
            <ShinyButton href="#Explore" variant="light-blue">
              Explore
            </ShinyButton>
          </div>
          <h6 id="w-node-_88e7ad16-d3d3-5755-316c-c118b5b53f1f-68262bed" className="h6-body max-300" motion="fade-in">
            Simulate strategic decisions, analyze market dynamics, and predict business outcomes before execution.
          </h6>
        </div>

        <div className="product-intro-cover-wrap">
          <div className="product-intro-cover">
            <img
              src="/resource/img2/dashboard-overview.png"
              loading="lazy"
              alt="Intelligent Infrastructure Cover"
              className="product-intro-cover-img"
            />
            <div className="feature-list-wrap">
              <div
                className="home-feature-block dark"
                style={{
                  padding: "30px",
                  height: "180px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="block-inner-top dark"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div
                    className="label block-dark"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      opacity: 0.65,
                      color: "#fff",
                    }}
                  >
                    BUSINESS SIMULATION
                  </div>
                  <img
                    loading="lazy"
                    src="/resource/img1/block-img-blur.svg"
                    alt="Logo Blur"
                    className="block-img"
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    flexGrow: 1,
                    marginTop: "8px",
                  }}
                >
                  <h2
                    className="h3-display light"
                    style={{
                      fontSize: "64px",
                      fontWeight: 500,
                      lineHeight: 1,
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    OCT
                  </h2>
                  <p
                    style={{
                      fontSize: "15px",
                      opacity: 0.7,
                      color: "#fff",
                      margin: "4px 0 0 0",
                    }}
                  >
                    One-Click Tool
                  </p>
                </div>
              </div>

              <div
                className="home-feature-block dark"
                style={{
                  padding: "30px",
                  height: "180px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="block-inner-top dark"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div
                    className="label block-dark"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      opacity: 0.65,
                      color: "#fff",
                    }}
                  >
                    MARKET INTELLIGENCE
                  </div>
                  <img
                    loading="lazy"
                    src="/resource/img1/block-img-blur.svg"
                    alt="Logo Blur"
                    className="block-img"
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    flexGrow: 1,
                    marginTop: "8px",
                  }}
                >
                  <h2
                    className="h3-display light"
                    style={{
                      fontSize: "64px",
                      fontWeight: 500,
                      lineHeight: 1,
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    24/7
                  </h2>
                  <p
                    style={{
                      fontSize: "15px",
                      opacity: 0.7,
                      color: "#fff",
                      margin: "4px 0 0 0",
                    }}
                  >
                    Continuous Monitoring
                  </p>
                </div>
              </div>

              <div
                className="home-feature-block dark"
                style={{
                  padding: "30px",
                  height: "180px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="block-inner-top dark"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div
                    className="label block-dark"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      opacity: 0.65,
                      color: "#fff",
                    }}
                  >
                    OUTCOME FORECASTING
                  </div>
                  <img
                    loading="lazy"
                    src="/resource/img1/block-img-blur.svg"
                    alt="Logo Blur"
                    className="block-img"
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    flexGrow: 1,
                    marginTop: "8px",
                  }}
                >
                  <h2
                    className="h3-display light"
                    style={{
                      fontSize: "64px",
                      fontWeight: 500,
                      lineHeight: 1,
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    AI
                  </h2>
                  <p
                    style={{
                      fontSize: "15px",
                      opacity: 0.7,
                      color: "#fff",
                      margin: "4px 0 0 0",
                    }}
                  >
                    Predictive Analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section id="Explore" className="p-product-overview" style={{ position: "relative" }}>
        <div className="grid-container">
          <div id="w-node-_0bb97d05-2544-b758-9340-e8af61fbfa10-68262bed" className="product-overview-cover-wrap">
            <img
              src="/resource/img2/img22.png"
              loading="lazy"
              alt="Synex Dashboard Overview"
              className="product-overvew-cover"
              motion="parallax"
              data-parallax="6"
              style={{ aspectRatio: "3 / 2", objectFit: "contain", width: "100%" }}
            />
          </div>
          <div id="w-node-f3e84045-2ffd-d4ca-9027-5893e517cb91-68262bed" className="product-overview-wrap">
            <div className="product-overview-inner">
              <h6 className="h6-display g500" motion="fade-in">Q-Simutron</h6>
              <h2 className="h2-display" motion="title">Simulate Before.
                <br />
                You Execute.
              </h2>
            </div>
            <div className="home-feature-list-wrap">
              <div className="home-feature-list" motion="stagger">
                <div className="home-feature-list-icon">
                  <img
                    src="/resource/img1/NeuralLink.svg"
                    loading="lazy"
                    alt="Neural Link icon"
                    className="icon-40"
                  />
                </div>
                <div className="home-feature-list-inner">
                  <p className="body-b">Business Simulation</p>
                  <p className="body-r g500">Test strategic decisions before commitment.</p>
                </div>
              </div>
              <div className="home-feature-list" motion="stagger">
                <div className="home-feature-list-icon">
                  <img
                    src="/resource/img1/Spark.svg"
                    loading="lazy"
                    alt="Spark Icon"
                    className="icon-40"
                  />
                </div>
                <div className="home-feature-list-inner">
                  <p className="body-b">Market Intelligence</p>
                  <p className="body-r g500">Understand where markets are moving.</p>
                </div>
              </div>
              <div className="home-feature-list" motion="Connect datastagger">
                <div className="home-feature-list-icon">
                  <img
                    src="/resource/img1/AddScreen.svg"
                    loading="lazy"
                    alt="Add Screen Icon"
                    className="icon-40"
                  />
                </div>
                <div className="home-feature-list-inner">
                  <p className="body-b">Outcome Forecasting</p>
                  <p className="body-r g500">Predict business impact with confidence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Tour — scroll-driven split-screen showcase */}
      <QSimutronSplitScrollTour />

      <CeoMessage />

      {/* FAQ Accordion */}
      <section className="p-product-faq">
        <div className="grid-container">
          <div id="w-node-bcc11b10-f2f0-a062-6146-5fbdd5ebfbe9-68262bed" className="home-feature-title-wrap">
            <h6 className="h6-display g500" motion="fade-in">We clear the confusion</h6>
            <h3 className="h3-display max-600" motion="title">Start building with confidence</h3>
          </div>
        </div>
        <div className="grid-container">
          <div id="w-node-dd678d8f-ec41-1564-b931-d72c679488cb-68262bed" className="product-faq-wrap">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="product-faq-inner"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="product-faq-content">
                    <div className="product-faq-title">
                      <div className="product-faq-title-inner">
                        <h5 className="h5-body">{faq.number}</h5>
                      </div>
                      <h5 className="h5-body">{faq.question}</h5>
                    </div>
                    <div
                      className="faq-answer"
                      style={{
                        display: "grid",
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        opacity: isOpen ? 1 : 0,
                        transition:
                          "grid-template-rows 0.5s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.4s ease",
                      }}
                    >
                      <div style={{ overflow: "hidden" }}>
                        <h6 className="h6-body g500 dropdown-magin" style={{ paddingTop: "16px" }}>
                          {faq.answer}
                        </h6>
                      </div>
                    </div>
                  </div>
                  <div
                    className="product-faq-icon"
                    style={{
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    <img
                      loading="lazy"
                      src="/resource/img1/Plus.svg"
                      alt="Toggle FAQ"
                      className="icon-40"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
