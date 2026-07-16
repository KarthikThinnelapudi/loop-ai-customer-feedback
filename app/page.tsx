export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden">
      <div className="absolute top-24 left-16 w-96 h-96 bg-violet-500/10 blur-[180px] rounded-full"></div>

<div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-blue-500/10 blur-[220px] rounded-full"></div>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 backdrop-blur-xl bg-slate-950/70 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="text-xl font-bold">↻</span>
          </div>

          <span className="text-2xl font-bold">LOOP</span>
        </div>

        <div className="hidden md:flex gap-8 text-gray-300 font-medium">
          <a href="#" className="transition-all duration-300 hover:text-violet-400 hover:-translate-y-1">
  Features
</a>

<a href="#" className="transition-all duration-300 hover:text-violet-400 hover:-translate-y-1">
  How It Works
</a>

<a href="#" className="transition-all duration-300 hover:text-violet-400 hover:-translate-y-1">
  Pricing
</a>

<a href="#" className="transition-all duration-300 hover:text-violet-400 hover:-translate-y-1">
  Contact
</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-gray-300 hover:text-white">
            Sign In
          </button>

          <button className="bg-violet-600 hover:bg-violet-700 px-5 py-2 rounded-lg font-semibold">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative text-center mt-28 px-6 z-10">
        <span className="px-4 py-2 rounded-full bg-violet-900/40 border border-violet-500 text-violet-300">
          Powered by Advanced AI
        </span>

        <h1 className="mt-8 text-7xl font-extrabold leading-none tracking-tight">
          Close the Loop on
          <br />
          <span className="text-violet-400">
            Customer Feedback
          </span>
        </h1>

        <p className="mt-8 text-xl leading-8 text-gray-300 max-w-3xl mx-auto">
          Turn customer feedback into AI-powered insights,
          trends, reports, and smarter business decisions.
        </p>

        <div className="mt-12 flex justify-center gap-6">
          <button className="bg-violet-600 px-7 py-3 rounded-xl font-semibold hover:bg-violet-700">
            Get Started Free
          </button>

          <button className="border border-gray-600 px-7 py-3 rounded-xl hover:bg-gray-800">
            Watch Demo
          </button>
        </div>
        <div className="mt-32 flex justify-center gap-20 text-center">
  <div>
    <h2 className="text-4xl font-extrabold">10K+</h2>
    <p className="mt-2 text-gray-400">Feedback</p>
  </div>

  <div>
    <h2 className="text-4xl font-extrabold">98%</h2>
    <p className="mt-2 text-gray-400">Accuracy</p>
  </div>

  <div>
    <h2 className="text-4xl font-extrabold">500+</h2>
    <p className="mt-2 text-gray-400">Companies</p>
  </div>
</div>
<div className="mt-20 max-w-6xl mx-auto rounded-3xl border border-gray-700 bg-slate-900/70 backdrop-blur-xl p-6 shadow-2xl">

  {/* Top Cards */}
  <div className="grid grid-cols-3 gap-5 mb-6">

    <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 to-violet-500/10 border border-violet-500/30 p-5">
      <p className="text-gray-400 text-sm">😊 Sentiment Score</p>
      <h3 className="text-3xl font-bold mt-2 text-violet-300">82%</h3>
      <p className="text-green-400 text-sm mt-2">Positive Feedback</p>
    </div>

    <div className="rounded-2xl bg-gradient-to-r from-blue-600/20 to-cyan-500/10 border border-blue-500/30 p-5">
      <p className="text-gray-400 text-sm">⭐ Average Rating</p>
      <h3 className="text-3xl font-bold mt-2 text-blue-300">4.8/5</h3>
      <p className="text-gray-300 text-sm mt-2">10,432 Reviews</p>
    </div>

    <div className="rounded-2xl bg-gradient-to-r from-indigo-600/20 to-purple-500/10 border border-indigo-500/30 p-5">
      <p className="text-gray-400 text-sm">🚨 Alerts</p>
      <h3 className="text-3xl font-bold mt-2 text-red-400">12</h3>
      <p className="text-gray-300 text-sm mt-2">Need Attention</p>
    </div>

  </div>

  {/* Bottom Section */}
  <div className="grid md:grid-cols-2 gap-6">

    {/* Chart */}
    <div className="rounded-2xl border border-gray-700 bg-slate-800 p-6">
      <h3 className="text-xl font-semibold mb-4">📈 Feedback Trend</h3>

      <div className="flex items-end justify-between h-48">

        <div className="w-8 bg-violet-500 rounded-t-lg h-20"></div>
        <div className="w-8 bg-violet-500 rounded-t-lg h-28"></div>
        <div className="w-8 bg-violet-500 rounded-t-lg h-36"></div>
        <div className="w-8 bg-violet-500 rounded-t-lg h-24"></div>
        <div className="w-8 bg-violet-500 rounded-t-lg h-44"></div>
        <div className="w-8 bg-violet-500 rounded-t-lg h-40"></div>

      </div>

    </div>

    {/* Reviews */}
    <div className="rounded-2xl border border-gray-700 bg-slate-800 p-6">

      <h3 className="text-xl font-semibold mb-4">
        📝 Recent Reviews
      </h3>

      <div className="space-y-4">

        <div className="border-b border-gray-700 pb-3">
          <p className="text-green-400">★★★★★</p>
          <p className="text-gray-300">
            Amazing customer support.
          </p>
        </div>

        <div className="border-b border-gray-700 pb-3">
          <p className="text-yellow-400">★★★★☆</p>
          <p className="text-gray-300">
            Dashboard is very useful.
          </p>
        </div>

        <div>
          <p className="text-red-400">★★☆☆☆</p>
          <p className="text-gray-300">
            Response time can improve.
          </p>
        </div>

      </div>

    </div>

  </div>

</div>
      </section>
      {/* Footer */}
<footer className="mt-24 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">

  <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">

    {/* Logo */}
    <div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
        LOOP AI
      </h2>

      <p className="mt-4 text-gray-400 leading-7">
        Transform customer feedback into AI-powered insights with real-time analytics and sentiment analysis.
      </p>
    </div>

    {/* Product */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-white">Product</h3>

      <ul className="space-y-3">
        <li className="text-gray-400 hover:text-violet-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Features
        </li>

        <li className="text-gray-400 hover:text-violet-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Dashboard
        </li>

        <li className="text-gray-400 hover:text-violet-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Analytics
        </li>

        <li className="text-gray-400 hover:text-violet-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Pricing
        </li>
      </ul>
    </div>

    {/* Company */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>

      <ul className="space-y-3">
        <li className="text-gray-400 hover:text-blue-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          About
        </li>

        <li className="text-gray-400 hover:text-blue-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Contact
        </li>

        <li className="text-gray-400 hover:text-blue-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Careers
        </li>

        <li className="text-gray-400 hover:text-blue-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Blog
        </li>
      </ul>
    </div>

    {/* Resources */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-white">Resources</h3>

      <ul className="space-y-3">
        <li className="text-gray-400 hover:text-cyan-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Documentation
        </li>

        <li className="text-gray-400 hover:text-cyan-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Privacy Policy
        </li>

        <li className="text-gray-400 hover:text-cyan-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Terms of Service
        </li>

        <li className="text-gray-400 hover:text-cyan-400 hover:translate-x-2 transition-all duration-300 cursor-pointer">
          Support
        </li>
      </ul>
    </div>

  </div>

  <div className="border-t border-white/10 py-6 text-center text-gray-500">
    © 2026 <span className="text-violet-400 font-semibold">LOOP AI</span>. All Rights Reserved.
  </div>

</footer>
    </main>
  );
}