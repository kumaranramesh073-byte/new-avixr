"use client";

const logos = [
  { src: "/resource/img1/microsoft-logo.png", alt: "Microsoft" },
  { src: "/resource/img1/itnt-logo.png", alt: "iTNT" },
  { src: "/resource/img1/amazon-logo.png", alt: "Amazon" },
  { src: "/resource/img1/iitm-rp-logo.png", alt: "IITM Research Park" },
  { src: "/resource/img1/gqi-logo.png", alt: "Global Quantum Intelligence (GQI)" },
  { src: "/resource/img1/brumbella-logo.png", alt: "BrumBella" },
  { src: "/resource/img1/img2.png", alt: "AstroSolstice" },
  { src: "/resource/img1/img5.png", alt: "Introto.in" },
  { src: "/resource/img1/zeroi-logo.png", alt: "Zeroi" },
  { src: "/resource/img1/img6.png", alt: "ATRIBS Global" },
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
