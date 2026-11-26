"use client";

import ParticleBackground from "@/components/ParticleBackground";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Features from "@/components/Features";
import ProductSection from "@/components/ProductSection";
import AboutSection from "@/components/AboutSection";
import Clients from "@/components/Clients";

export default function Home() {
  return (
    <>
      {/* Dynamic Perlin Noise Particle background flowing across the screen */}
      <ParticleBackground />

      <section id="home">
        {/* Hero Intro */}
        <Hero />

        {/* Intro Reveal Parallax Images */}
        <Intro />
      </section>

      <section id="features">
        {/* Features Grid & Interactive Stats Counter */}
        <Features />
      </section>

      <section id="product">
        {/* Product Section contents */}
        <ProductSection />
      </section>

      <section id="about">
        {/* About Section contents */}
        <AboutSection />
      </section>

      {/* Shared Infinite Rolling Logos Slider */}
      <Clients />
    </>
  );
}
