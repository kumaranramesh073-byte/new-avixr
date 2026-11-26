"use client";

export default function Features() {
  return (
    <section id="features-overview" header-color="light" className="p-home-feature">
      <div className="home-feature-wrap">
        <div className="grid-container">
          {/* Left: Title Area */}
          <div
            id="w-node-_183742d1-4387-f937-5b2f-56e131327350-9b85289b"
            className="home-feature-title-wrap"
            motion="fade-in"
          >
            <h6 className="h6-display g500">Decision Intelligence Platform</h6>
            <h3 className="h3-display max-400">Strategic Decisions. Simulated.</h3>
          </div>

          {/* Right: Feature List */}
          <div
            id="w-node-d6259302-777e-2a61-f9d1-126a693b7548-9b85289b"
            className="home-feature-list-wrap"
          >
            <div className="home-feature-list" motion="fade-in">
              <div className="home-feature-list-icon">
                <img
                  src="/resource/img1/AddScreen.svg"
                  loading="lazy"
                  alt="Icon Add"
                  className="icon-40"
                />
              </div>
              <div className="home-feature-list-inner">
                <p className="body-b">Business Simulation</p>
                <p className="body-r g500">Model business scenarios before they happen.</p>
              </div>
            </div>

            <div className="home-feature-list" motion="fade-in">
              <div className="home-feature-list-icon">
                <img
                  src="/resource/img1/GridFocus.svg"
                  loading="lazy"
                  alt="Icon Focus"
                  className="icon-40"
                />
              </div>
              <div className="home-feature-list-inner">
                <p className="body-b">Market Intelligence</p>
                <p className="body-r g500">Track the forces shaping your industry.</p>
              </div>
            </div>

            <div className="home-feature-list" motion="fade-in">
              <div className="home-feature-list-icon">
                <img
                  src="/resource/img1/SignalNode.svg"
                  loading="lazy"
                  alt="Icon Signal"
                  className="icon-40"
                />
              </div>
              <div className="home-feature-list-inner">
                <p className="body-b">Predictive Insights</p>
                <p className="body-r g500">Forecast outcomes with confidence.</p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}
