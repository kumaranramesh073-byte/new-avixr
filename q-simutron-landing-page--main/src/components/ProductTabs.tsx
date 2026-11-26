"use client";

import { ShinyButton } from "@/components/ShinyButton";

export default function ProductTabs() {
  return (
    <section header-color="dark" className="p-home-product">
      <div className="container">
        <div className="product-tab">
          {/* Simplified Product Selector — showing only Qsimutron */}
          <div
            id="w-node-_8f3229fa-ecf9-a282-45de-c217a7f376de-9b85289b"
            className="product-tab-menu"
            style={{ display: "flex", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "24px", marginBottom: "40px" }}
          >
            <div className="product-tab-link w-inline-block w--current">
              <div className="h2-display">Q-Simutron</div>
            </div>
          </div>

          {/* Unified Product Showcase Panel */}
          <div id="w-node-_8f3229fa-ecf9-a282-45de-c217a7f376e8-9b85289b" className="product-tab-wrap">
            <div className="product-tab-inner" style={{ display: "block" }}>
              <div className="product-tab-content">
                <img
                  src="/resource/img2/dashboard-overview.png"
                  loading="lazy"
                  alt="Qsimutron Platform Interface"
                  className="product-tab-img"
                  style={{ aspectRatio: "3 / 2", objectFit: "cover", width: "100%" }}
                />
                <div className="product-tab-info">
                  <div className="product-tab-subtitle">
                    <h1 className="h6-body">Meet the product</h1>
                  </div>
                  <div className="product-tab-desc">
                    <h1 className="h6-body">
                      Model strategic decisions, forecast business outcomes, and uncover opportunities through AI-powered simulation and market intelligence.

                    </h1>
                    <ShinyButton href="/product" variant="light-blue">
                      Explore
                    </ShinyButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

