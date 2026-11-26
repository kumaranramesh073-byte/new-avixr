"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./RequestPilotModal.module.css";
import { ShinyButton } from "@/components/ShinyButton";

type FormData = {
  fullName: string;
  companyName: string;
  workEmail: string;
  roleTitle: string;
  industry: string;
  companySize: string;
  strategicChallenge: string;
};

const INITIAL_STATE: FormData = {
  fullName: "",
  companyName: "",
  workEmail: "",
  roleTitle: "",
  industry: "",
  companySize: "",
  strategicChallenge: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CustomSelectProps {
  name: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
  icon: React.ReactNode;
  error?: string;
}

function CustomSelect({
  name,
  value,
  placeholder,
  options,
  onChange,
  disabled,
  icon,
  error
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option: string) => {
    onChange(name, option);
    setIsOpen(false);
  };

  const hasError = Boolean(error);

  return (
    <div 
      ref={dropdownRef} 
      className={`${styles.customSelectContainer} ${hasError ? styles.hasError : ""} ${isOpen ? styles.isOpen : ""}`}
    >
      <button
        type="button"
        className={styles.customSelectTrigger}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.inputIconWrap}>
          {icon}
        </span>
        <span className={value ? styles.triggerTextActive : styles.triggerPlaceholder}>
          {value || placeholder}
        </span>
        <span className={styles.chevronWrap}>
          <svg 
            viewBox="0 0 24 24" 
            width="16" 
            height="16" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul className={styles.customSelectOptions} role="listbox">
          {options.map((option) => (
            <li
              key={option}
              className={`${styles.customSelectOption} ${value === option ? styles.isSelected : ""}`}
              onClick={() => handleSelect(option)}
              role="option"
              aria-selected={value === option}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}

export default function RequestPilotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    // Add brief delay for animations to finish before resetting state
    setTimeout(() => {
      setFormData(INITIAL_STATE);
      setErrors({});
      setIsSuccess(false);
      setIsSubmitting(false);
    }, 350);
  };

  // Listen for global custom event to open the modal
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-request-pilot-modal", handleOpen);
    return () => {
      window.removeEventListener("open-request-pilot-modal", handleOpen);
    };
  }, []);

  // Keyboard accessibility: ESC key close and trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Scroll lock on body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!formData.companyName.trim()) nextErrors.companyName = "Company name is required.";
    if (!formData.roleTitle.trim()) nextErrors.roleTitle = "Role or title is required.";
    if (!formData.industry) nextErrors.industry = "Please select an industry.";
    if (!formData.companySize) nextErrors.companySize = "Please select a company size.";

    if (!formData.workEmail.trim()) {
      nextErrors.workEmail = "Work email is required.";
    } else if (!EMAIL_REGEX.test(formData.workEmail.trim())) {
      nextErrors.workEmail = "Please enter a valid work email.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // TODO: connect this form to support@avixr.com or CRM endpoint.
    console.log("[RequestPilotModal] submit payload:", formData);

    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="modal-headline">
      <div ref={modalRef} className={styles.card}>
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close modal">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {isSuccess ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#0A84FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Pilot Request Received.</h2>
            <p className={styles.successText}>
              Thank you. Our team will review your request and contact you shortly to discuss how Q-Simutron can support your strategic decision-making.
            </p>
            <button className={styles.successCloseBtn} onClick={handleClose}>
              Close
            </button>
          </div>
        ) : (
          <div className={styles.modalContent}>
            {/* Top Grid / Info Section */}
            <div className={styles.topSection}>
              <div className={styles.logoWrap}>
                <img src="/resource/img2/qsimutron-logo-black.png" alt="Q-Simutron Logo" className={styles.logoImage} />
                <span className={styles.logoText}>Q-Simutron</span>
              </div>
              <h2 id="modal-headline" className={styles.headline}>
                Schedule Your <span className={styles.blueText}>Q-Simutron Pilot</span>
              </h2>
              <p className={styles.description}>
                Simulate strategic decisions and forecast outcomes before execution.
              </p>
            </div>

            {/* Form Fields Grid */}
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.formGrid}>
                {/* Full Name */}
                <div className={`${styles.fieldGroup} ${errors.fullName ? styles.hasError : ""}`}>
                  <div className={styles.inputIconWrap}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    className={styles.input}
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
                </div>

                {/* Company Name */}
                <div className={`${styles.fieldGroup} ${errors.companyName ? styles.hasError : ""}`}>
                  <div className={styles.inputIconWrap}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="9" y1="22" x2="9" y2="16" />
                      <line x1="15" y1="22" x2="15" y2="16" />
                      <line x1="9" y1="16" x2="15" y2="16" />
                      <path d="M8 6h.01" />
                      <path d="M16 6h.01" />
                      <path d="M8 10h.01" />
                      <path d="M16 10h.01" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Company Name"
                    className={styles.input}
                    value={formData.companyName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.companyName && <span className={styles.errorText}>{errors.companyName}</span>}
                </div>

                {/* Work Email */}
                <div className={`${styles.fieldGroup} ${errors.workEmail ? styles.hasError : ""}`}>
                  <div className={styles.inputIconWrap}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="workEmail"
                    placeholder="Work Email"
                    className={styles.input}
                    value={formData.workEmail}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.workEmail && <span className={styles.errorText}>{errors.workEmail}</span>}
                </div>

                {/* Role / Title */}
                <div className={`${styles.fieldGroup} ${errors.roleTitle ? styles.hasError : ""}`}>
                  <div className={styles.inputIconWrap}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="roleTitle"
                    placeholder="Role / Title"
                    className={styles.input}
                    value={formData.roleTitle}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.roleTitle && <span className={styles.errorText}>{errors.roleTitle}</span>}
                </div>

                {/* Industry */}
                <CustomSelect
                  name="industry"
                  value={formData.industry}
                  placeholder="Industry"
                  options={[
                    "Technology",
                    "Manufacturing",
                    "Healthcare",
                    "Retail",
                    "Finance",
                    "Education",
                    "Logistics",
                    "Government",
                    "Other"
                  ]}
                  onChange={handleSelectChange}
                  disabled={isSubmitting}
                  icon={
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 21H2V3l7 4v5l7-4v5l6-4v16z" />
                    </svg>
                  }
                  error={errors.industry}
                />

                {/* Company Size */}
                <CustomSelect
                  name="companySize"
                  value={formData.companySize}
                  placeholder="Company Size"
                  options={[
                    "1-10",
                    "11-50",
                    "51-200",
                    "201-1000",
                    "1000+"
                  ]}
                  onChange={handleSelectChange}
                  disabled={isSubmitting}
                  icon={
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                  error={errors.companySize}
                />

                {/* Strategic Challenge */}
                <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                  <div className={`${styles.inputIconWrap} ${styles.textareaIcon}`}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span className={styles.textareaLabel}>What business decision would you like to simulate?</span>
                  <textarea
                    name="strategicChallenge"
                    placeholder="Market expansion, product launch, pricing strategy, competitor response, revenue forecasting, operational expansion, investment planning, or risk analysis."
                    className={styles.textarea}
                    value={formData.strategicChallenge}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Area */}
              <div className={styles.submitArea}>
                <ShinyButton
                  type="submit"
                  variant="light-blue"
                  className="size-full size-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Request Pilot"}
                </ShinyButton>

                <p className={styles.securityNote}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", verticalAlign: "middle" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Your information is secure and never shared.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
