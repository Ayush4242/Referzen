import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Inter',_system-ui,_-apple-system,_sans-serif] selection:bg-blue-100">
      {/* ─── PROFESSIONAL NAVIGATION ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 md:px-10 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">🚀</div>
            <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-tight text-slate-900">Refer</span>
                <span className="text-lg font-light text-slate-400 tracking-tight">Zen</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/login")}
              className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate("/register")}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-800 transition-all"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 md:px-10 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Trusted by 2,000+ professionals</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-slate-900">
            Direct access to <br/>
            <span className="text-blue-600">big tech referrals.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-lg leading-relaxed mb-10">
            Skip the application void. Connect directly with engineers at your dream companies and get referred by the best in the industry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate("/register")}
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-xl text-sm font-medium shadow-md hover:bg-slate-800 transition-all"
            >
              Start free
            </button>
            <button className="w-full sm:w-auto border border-slate-200 bg-white text-slate-700 px-8 py-3.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Watch demo
            </button>
          </div>
        </div>
      </section>

      {/* ─── ROLE FOCUS SECTION ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-3">
              Built for both sides of the table
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Whether you're looking for your next role or want to help others grow, ReferZen gives you the tools you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Students */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
               <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-6">🎓</div>
               <h3 className="text-2xl font-bold tracking-tight mb-3 text-slate-900">For students</h3>
               <p className="text-slate-500 mb-6">Get direct access to referrers at top companies and stand out from the crowd.</p>
               <ul className="space-y-3 mb-8">
                  {["Browse referrers by company", "AI-powered message assistant", "Real-time application tracking", "Direct collaboration tools"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-slate-600 text-sm">
                       <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                       {item}
                    </li>
                  ))}
               </ul>
               <button 
                 onClick={() => navigate("/register")}
                 className="w-full py-3 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-all"
               >
                 Sign up as student
               </button>
            </div>

            {/* For Referrers */}
            <div className="bg-slate-900 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all">
               <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl mb-6">💼</div>
               <h3 className="text-2xl font-bold tracking-tight mb-3 text-white">For referrers</h3>
               <p className="text-slate-300 mb-6">Monetize your network, earn rewards, and help shape the next generation of talent.</p>
               <ul className="space-y-3 mb-8">
                  {["Earn cash rewards per referral", "Build your mentorship profile", "Leaderboards & recognition", "Streamlined request management"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                       <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                       {item}
                    </li>
                  ))}
               </ul>
               <button 
                 onClick={() => navigate("/register")}
                 className="w-full py-3 rounded-lg bg-white text-slate-900 font-medium text-sm hover:bg-slate-100 transition-all"
               >
                 Sign up as referrer
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-xs uppercase tracking-wider mb-3">Platform advantage</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Why professionals choose us</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: "AI-powered concierge", desc: "Smart message drafting that gets responses. Our AI helps you craft the perfect pitch.", icon: "🤖" },
              { title: "Verified network only", desc: "Every referrer is verified as an active employee at their company. No noise, no spam.", icon: "✅" },
              { title: "Transparent success rates", desc: "Real-time analytics on referral success rates by company, role, and seniority.", icon: "📊" }
            ].map(feature => (
              <div key={feature.title} className="text-left">
                 <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl mb-5">{feature.icon}</div>
                 <h4 className="text-lg font-bold mb-2 text-slate-900">{feature.title}</h4>
                 <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS SECTION ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 md:px-10 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-slate-900">2,000+</div>
            <div className="text-sm text-slate-500 mt-1">Active students</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">500+</div>
            <div className="text-sm text-slate-500 mt-1">Verified referrers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">45+</div>
            <div className="text-sm text-slate-500 mt-1">Partner companies</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">92%</div>
            <div className="text-sm text-slate-500 mt-1">Referral success rate</div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Ready to accelerate your career?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream roles through ReferZen.
          </p>
          <button 
            onClick={() => navigate("/register")}
            className="bg-white text-slate-900 px-8 py-3.5 rounded-xl text-sm font-medium shadow-md hover:bg-slate-100 transition-all"
          >
            Create free account
          </button>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────────── */}
      <footer className="bg-white py-12 px-6 md:px-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white text-xs">🚀</div>
            <span className="text-sm font-bold tracking-tight text-slate-900">REFERZEN</span>
          </div>
          <div className="flex gap-8 text-xs font-medium text-slate-400">
             <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
             <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
             <a href="#" className="hover:text-slate-600 transition-colors">Contact</a>
             <a href="#" className="hover:text-slate-600 transition-colors">Support</a>
          </div>
          <p className="text-xs font-medium text-slate-400">© 2026 ReferZen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}