import type React from "react";

export type ShinyButtonVariant = "default" | "light-blue" | "white" | "on-dark";

type BaseProps = {
  children: React.ReactNode;
  variant?: ShinyButtonVariant;
  className?: string;
};

type ShinyButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ShinyButtonAsLink = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
  };

export type ShinyButtonProps = ShinyButtonAsButton | ShinyButtonAsLink;

function buildClassName(variant?: ShinyButtonVariant, className?: string) {
  const classes = ["shiny-cta"];
  if (variant === "light-blue") classes.push("variant-light-blue");
  if (variant === "white") classes.push("variant-white");
  if (variant === "on-dark") classes.push("variant-on-dark");
  if (className) classes.push(className);
  return classes.join(" ");
}

export function ShinyButton(props: ShinyButtonProps) {
  const { children, variant = "light-blue", className } = props;
  const classes = buildClassName(variant, className);

  if ("href" in props && props.href !== undefined) {
    const { href, onClick, ...anchorRest } = props;
    const content = <span>{children}</span>;
    // All href links rendered as plain <a> — SmoothScroll handles hash navigation
    return (
      <a href={href} className={classes} onClick={onClick} {...anchorRest}>
        {content}
      </a>
    );
  }

  const { type, disabled, onClick, ...buttonRest } = props;
  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...buttonRest}
    >
      <span>{children}</span>
    </button>
  );
}
