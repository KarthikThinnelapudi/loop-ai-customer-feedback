"use client";

import { motion } from "framer-motion";

const brands = ["Acme Corp", "Linear", "Vercel", "Supabase", "Retool", "Stripe"];

export default function TrustedBrands() {
  return (
    <section className="py-12 border-y border-slate-800/80 bg-slate-950/40 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
          Trusted by Product & Engineering Leaders at Modern Companies
        </p>

        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-70">
          {brands.map((brand, i) => (
            <motion.span
              key={brand}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-lg md:text-xl font-bold text-slate-300 tracking-wider hover:text-emerald-400 transition-colors cursor-pointer select-none"
            >
              {brand}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
