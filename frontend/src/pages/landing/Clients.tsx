

const logos = [
  { src: "/resource/img1/logo-01.svg", alt: "Partner Logo 1" },
  { src: "/resource/img1/logo-02.svg", alt: "Partner Logo 2" },
  { src: "/resource/img1/logo-03.svg", alt: "Partner Logo 3" },
  { src: "/resource/img1/logo-04.svg", alt: "Partner Logo 4" },
  { src: "/resource/img1/logo-05.svg", alt: "Partner Logo 5" },
];

export default function Clients() {
  return (
    <section header-color="light" className="p-home-client">
      {/* Title Row */}
      <div className="home-client-title-wrap">
        <div className="home-client-sub-title">
          <h1 className="h6-body">Trusted by teams who ship fast</h1>
        </div>
        <h3 className="h3-display">Built for impact</h3>
      </div>

      {/* Marquee Wrapper */}
      <div className="home-client-wrap">
        {/* Left fade dim */}
        <div className="logo-dim" />
        {/* Right fade dim */}
        <div className="logo-dim right" />

        {/* First strip — moves left */}
        <div className="home-client-move">
          <div className="home-client-cms w-dyn-list">
            <div role="list" className="home-client-cms-list w-dyn-items">
              {logos.map((logo, idx) => (
                <div key={`a-${idx}`} role="listitem" className="home-client-cms-item w-dyn-item">
                  <img loading="lazy" src={logo.src} alt={logo.alt} className="home-client-logo" />
                </div>
              ))}
            </div>
          </div>
          {/* Duplicate for seamless loop */}
          <div className="home-client-cms w-dyn-list">
            <div role="list" className="home-client-cms-list w-dyn-items">
              {logos.map((logo, idx) => (
                <div key={`b-${idx}`} role="listitem" className="home-client-cms-item w-dyn-item">
                  <img loading="lazy" src={logo.src} alt={logo.alt} className="home-client-logo" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
