import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

// ─── SHARED SPINNER ────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-800 rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Compiling Analytics…</p>
    </div>
  );
}

// ─── STUDENT ANALYTICS ─────────────────────────────────────────────────────────
function StudentAnalytics({ referrals }) {
  const navigate = useNavigate();
  const total = referrals.length;
  
  const selected = referrals.filter(r => r.status === "Selected");
  const rejected = referrals.filter(r => r.status === "Rejected");
  const pending = referrals.filter(r => r.status === "Pending");
  
  const successRate = total === 0 ? 0 : Math.round(((selected.length + referrals.filter(r => r.status === "Accepted").length) / total) * 100);

  const companyCounts = referrals.reduce((acc, r) => {
    const c = r.company || "Unknown";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 relative z-20">
      {/* STATS OVERLAY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -mt-12 mb-10">
        {[
          { label: "Total Applied", value: total, icon: "📝", color: "text-blue-950", bg: "bg-white", border: "border-gray-200" },
          { label: "Pending", value: pending.length, icon: "⏳", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Success Rate", value: `${successRate}%`, icon: "📈", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Selected", value: selected.length, icon: "🎉", color: "text-blue-800", bg: "bg-blue-50", border: "border-blue-200" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform hover:-translate-y-1 transition-transform`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
              <span className="text-2xl opacity-80">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        {/* REJECTIONS / MOTIVATIONAL CORNER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Application Journey</h2>
          </div>
          
          {rejected.length > 0 && (
            <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 md:p-8">
              <h3 className="text-red-800 font-bold text-lg mb-4 flex items-center gap-2">
                <span>⚠️</span> Setbacks are setups for comebacks
              </h3>
              <div className="space-y-4">
                {rejected.slice(0, 3).map(r => (
                  <div key={r._id} className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900 mb-1">Rejected for {r.jobRole} at {r.company}</p>
                    <p className="text-xs text-gray-500 mb-3 border-l-2 border-red-200 pl-3">"{r.message || "No specific feedback provided."}"</p>
                    <div className="bg-red-50 rounded-xl p-3 inline-block">
                      <p className="text-xs font-bold text-red-700">💡 Do not stop here! Try to reach out to another referrer!</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button onClick={() => navigate('/referrers')} className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-sm">
                  Find New Referrers
                </button>
              </div>
            </div>
          )}

          {/* SUCCESSES */}
          {selected.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-6 md:p-8">
              <h3 className="text-emerald-800 font-bold text-lg mb-4 flex items-center gap-2">
                <span>🌟</span> Incredible Success!
              </h3>
              <div className="space-y-4">
                {selected.map(r => (
                  <div key={r._id} className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl">🎉</div>
                    <div>
                      <p className="font-bold text-gray-900">Selected for {r.jobRole} at {r.company}</p>
                      <p className="text-xs text-emerald-600 font-medium">Congratulations! Your hard work paid off.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {rejected.length === 0 && selected.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-lg font-bold text-gray-900">Your journey begins</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">Keep applying! Your analytics and insights will appear here as your referral requests are processed.</p>
            </div>
          )}
        </div>

        {/* TARGET COMPANIES */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Top Targets</h2>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            {Object.keys(companyCounts).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No applications yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(companyCounts).sort((a,b) => b[1] - a[1]).map(([company, count]) => {
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={company}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-gray-700">{company}</span>
                        <span className="text-gray-500 font-medium">{count} Request{count !== 1 && 's'}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REFERRER ANALYTICS ────────────────────────────────────────────────────────
function ReferrerAnalytics({ referrals, currentUser }) {
  const navigate = useNavigate();
  const total = referrals.length;
  const accepted = referrals.filter(r => r.status === "Accepted");
  const selected = referrals.filter(r => r.status === "Selected");
  const pending = referrals.filter(r => r.status === "Pending");
  
  const studentsHelped = accepted.length + selected.length;

  return (
    <div className="max-w-6xl mx-auto px-6 relative z-20">
      {/* STATS OVERLAY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -mt-12 mb-10">
        {[
          { label: "Total Requests", value: total, icon: "📥", color: "text-blue-950", bg: "bg-white", border: "border-gray-200" },
          { label: "Pending", value: pending.length, icon: "⌛", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Students Helped", value: studentsHelped, icon: "🤝", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Leaderboard Pts", value: currentUser.points || 0, icon: "⭐", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform hover:-translate-y-1 transition-transform`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
              <span className="text-2xl opacity-80">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
        {/* IMPACT SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Impact</h2>
          </div>
          
          {selected.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 shadow-sm mb-6">
              <h3 className="text-indigo-900 font-black text-lg mb-4 flex items-center gap-2">
                <span>🏅</span> Hall of Fame Referrals
              </h3>
              <div className="space-y-3">
                {selected.slice(0, 5).map(r => (
                  <div key={r._id} className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">🎓</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Congratulations on helping {r.student?.name || "a student"} get selected!</p>
                      <p className="text-xs text-indigo-600 font-medium">You earned +50 Points for {r.company}.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {accepted.length > 0 && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-emerald-800 font-bold text-lg mb-4 flex items-center gap-2">
                <span>🌱</span> Seeds Planted
              </h3>
              <div className="space-y-3">
                {accepted.slice(0, 5).map(r => (
                  <div key={r._id} className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">✨</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">You accepted a referral for {r.student?.name || "a student"}</p>
                      <p className="text-xs text-emerald-600 font-medium">Role: {r.jobRole} at {r.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studentsHelped === 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-lg font-bold text-gray-900">Be a hero today</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">Start reviewing your pending requests to make a real impact on someone's career.</p>
              <button onClick={() => navigate('/my-referrals')} className="mt-6 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors">
                View Requests
              </button>
            </div>
          )}
        </div>

        {/* PIPELINE & EFFICIENCY */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pipeline Health</h2>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Request Funnel</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-gray-600">Total Received</span>
                  <span className="text-gray-900 font-black">{total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gray-400 h-3 rounded-full w-full" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-gray-600">Actioned (Accepted/Rejected)</span>
                  <span className="text-gray-900 font-black">{total - pending.length}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${total > 0 ? ((total-pending.length)/total)*100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-gray-600">Successfully Selected</span>
                  <span className="text-gray-900 font-black">{selected.length}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${total > 0 ? (selected.length/total)*100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ────────────────────────────────────────────────────────────
export default function Analytics() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const isReferrer = currentUser.role === "referrer";

  useEffect(() => {
    if (!currentUser?._id) {
      setLoading(false);
      return;
    }
    const url = isReferrer
      ? `/referrals/referrer/${currentUser._id}`
      : `/referrals/student/${currentUser._id}`;
      
    API.get(url)
      .then(res => setReferrals(res.data || []))
      .catch(err => console.error("Analytics fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900">
      {/* PREMIUM DARK BLUE HEADER */}
      <div className="bg-[#0f172a] pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-800 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-indigo-600 rounded-full mix-blend-overlay filter blur-[100px] opacity-30"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_0_3px_rgba(96,165,250,0.2)]" />
            <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em]">
              {isReferrer ? "Referrer Insights" : "Student Insights"}
            </p>
          </div>
          <h1 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Analytics Dashboard</h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-xl">
            {isReferrer 
              ? "Track your impact, monitor your pipeline, and see how you're helping students." 
              : "Analyze your application journey, learn from rejections, and celebrate your successes."}
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : isReferrer ? (
        <ReferrerAnalytics referrals={referrals} currentUser={currentUser} />
      ) : (
        <StudentAnalytics referrals={referrals} />
      )}
    </div>
  );
}
