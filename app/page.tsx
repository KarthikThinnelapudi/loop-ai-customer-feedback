import BackgroundAnimation from "./components/animations/BackgroundAnimation";
import LoopLogo from "./components/logo/LoopLogo";
import Navbar from "./components/navbar/Navbar";
import Hero from "./components/hero/Hero";
import TrustedBrands from "./components/trusted-brands/TrustedBrands";
import DashboardPreview from "./components/dashboard-preview/DashboardPreview";
import Features from "./components/features/Features";
import UseCases from "./components/use-cases/UseCases";
import Pricing from "./components/pricing/Pricing";
import FAQ from "./components/faq/FAQ";
import Footer from "./components/footer/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background Ambient Glow & Grid */}
      <BackgroundAnimation />

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <LoopLogo />
          <Navbar />
        </div>
      </header>

      {/* Main Landing Sections */}
      <Hero />
      <TrustedBrands />
      <DashboardPreview />
      <Features />
      <UseCases />
      <Pricing />
      <FAQ />

      {/* Footer */}
      <Footer />
    </main>
  );
}