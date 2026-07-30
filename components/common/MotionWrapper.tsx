"use client";

import { useState, useEffect } from "react";
import { motion, MotionProps } from "framer-motion";

interface MotionWrapperProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: "div" | "section" | "span" | "h1" | "p" | "ul" | "li";
}

export default function MotionWrapper({
  children,
  className = "",
  id,
  as = "div",
  initial = { opacity: 0, y: 20 },
  animate,
  whileInView = { opacity: 1, y: 0 },
  viewport = { once: true, margin: "0px" },
  transition = { duration: 0.5 },
  ...props
}: MotionWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMounted(true);
  }, []);


  // SSR Fallback: Render static standard HTML tag with full visibility
  if (!mounted) {
    if (as === "section") {
      return (
        <section id={id} className={className}>
          {children}
        </section>
      );
    }
    if (as === "span") {
      return <span className={className}>{children}</span>;
    }
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  // Client Hydrated: Render smooth Framer Motion element
  if (as === "section") {
    return (
      <motion.section
        id={id}
        initial={initial}
        animate={animate}
        whileInView={whileInView}
        viewport={viewport}
        transition={transition}
        className={className}
        {...props}
      >
        {children}
      </motion.section>
    );
  }

  if (as === "span") {
    return (
      <motion.span
        initial={initial}
        animate={animate}
        whileInView={whileInView}
        viewport={viewport}
        transition={transition}
        className={className}
        {...props}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <motion.div
      id={id}
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      viewport={viewport}
      transition={transition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
