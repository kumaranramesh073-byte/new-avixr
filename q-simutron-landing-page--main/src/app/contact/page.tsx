"use client";

import { useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setStatus("submitting");

    // Simulate standard submission delay
    setTimeout(() => {
      setStatus("success");
      // Reset form fields
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
    }, 1000);
  };

  return (
    <section className="p-contact-intro" motion="page-load">
      <div className="grid-container">
        <h1 id="w-node-_0309d055-9a0d-0fa4-5cf8-41966cd47d33-6bff2b0a" className="h1-display max-600" motion="title">
          Let’s build together
        </h1>
      </div>
      <div className="grid-container">
        <div id="w-node-_51f80efb-ed5c-3777-f8c2-51830f06b746-6bff2b0a" className="contact-intro-info">
          <div className="contact-intro-card" motion="stagger">
            <div className="body-b">General</div>
            <a href="mailto:synex@synex.io" className="contact-link w-inline-block">
              <div className="body-r">ceo@avixr.in</div>
            </a>
          </div>
          {/* <div className="contact-intro-card" motion="stagger">
            <div className="body-b">Sales</div>
            <a href="mailto:sales@synex.io" className="contact-link w-inline-block">
              <div className="body-r">sales@synex.io</div>
            </a>
          </div> */}
          <div className="contact-intro-card" motion="stagger">
            <div className="body-b">Office</div>
            <a href="tel:+15185550147" className="contact-link w-inline-block">
              <div className="body-r">+91 XXXXX XXXXX</div>
            </a>
          </div>
        </div>
        <div id="w-node-_6b1df064-05b1-c325-ac49-50cfaafb4fee-6bff2b0a" className="contact-intro-form" motion="fade-in">
          <div className="form w-form">
            {status !== "success" ? (
              <form id="email-form" name="email-form" className="form-wrap" onSubmit={handleSubmit}>
                <div className="input-inner">
                  <label htmlFor="name" className="label grey-600">
                    FULL NAME *
                  </label>
                  <input
                    className="input w-input"
                    maxLength={256}
                    name="name"
                    placeholder="John Smith"
                    type="text"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={status === "submitting"}
                  />
                </div>

                <div className="input-inner">
                  <label htmlFor="Email" className="label grey-600">
                    WORK EMAIL *
                  </label>
                  <input
                    className="input w-input"
                    maxLength={256}
                    name="Email"
                    placeholder="john@company.com"
                    type="email"
                    id="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "submitting"}
                  />
                </div>

                <div className="input-inner">
                  <label htmlFor="Company" className="label grey-600">
                    COMPANY NAME *
                  </label>
                  <input
                    className="input w-input"
                    maxLength={256}
                    name="Company"
                    placeholder="Acme Technologies"
                    type="text"
                    id="Company"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={status === "submitting"}
                  />
                </div>

                <div className="input-inner">
                  <label htmlFor="Message" className="label grey-600">
                    BUSINESS REQUIREMENT *
                  </label>
                  <textarea
                    placeholder="Describe your business, industry, current challenges, and what you'd like Q-Simutron to simulate or optimize."
                    maxLength={5000}
                    id="Message"
                    name="Message"
                    className="textarea w-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={status === "submitting"}
                    required
                  />
                </div>
                <input
                  type="submit"
                  className="submit w-button"
                  value={status === "submitting" ? "Please wait..." : "Submit"}
                  disabled={status === "submitting"}
                />
              </form>
            ) : (
              <div className="body-b form-message w-form-done" style={{ display: "block" }}>
                <div>Thank you! Your submission has been received!</div>
              </div>
            )}
            {status === "error" && (
              <div className="body-b form-message w-form-fail" style={{ display: "block" }}>
                <div>Oops! Something went wrong while submitting the form.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
