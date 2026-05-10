import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_STEPS = ["Pending", "Viewed", "Accepted", "Interview", "Selected"];

const statusStyle = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Viewed: "bg-blue-50 text-blue-800 border-blue-200",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Referred: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Interview: "bg-blue-50 text-blue-700 border-blue-200",
  Selected: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

const stepIndex = (status) => {
  const i = STATUS_STEPS.findIndex(s => s.toLowerCase() === status?.toLowerCase());
  return i === -1 ? 0 : i;
};

// ─── STUDENT VIEW ──────────────────────────────────────────────────────────────
function StudentView({ referrals, loading, navigate }) {
  const total = referrals.length;
  const pending = referrals.filter(r => r.status === "Pending").length;
  const interviews = referrals.filter(r => r.status === "Interview").length;
  const selected = referrals.filter(r => r.status === "Selected").length;

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* HEADER */}
      <div className="bg-[#0f172a] pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl opacity-50"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em] mb-2">Student · My Journey</p>
          <h1 className="text-white text-3xl md:text-5xl font-extrabold tracking-tight mb-2">My Referral Requests</h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-xl">Track every request you've sent and watch your journey unfold. <strong className="text-white">You can only view status here.</strong></p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-20">
        {/* STATS — floated up over header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -mt-12 mb-10">
          {[
            { label: "Total Sent",  value: total,      icon: "📤", color: "text-blue-900" },
            { label: "Pending",     value: pending,    icon: "⏳", color: "text-amber-600" },
            { label: "Interviews",  value: interviews, icon: "🎯", color: "text-blue-700" },
            { label: "Selected",    value: selected,   icon: "🏆", color: "text-emerald-700" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transform hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{s.label}</p>
                  <p className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.value}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CARDS */}
        {loading ? (
          <Spinner />
        ) : referrals.length === 0 ? (
          <EmptyState
            icon="🚀"
            title="No referrals sent yet"
            desc="Browse referrers and send your first referral request."
            action={<button onClick={() => navigate("/referrers")} className="bg-blue-900 hover:bg-blue-950 text-white border-none rounded-xl px-6 py-3 font-semibold text-sm transition-colors shadow-sm">Find Referrers →</button>}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {referrals.map((r, i) => {
              const step = stepIndex(r.status);
              const rejected = r.status === "Rejected";
              const ss = statusStyle[r.status] || statusStyle.Pending;
              return (
                <div key={r._id || i}
                  className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                  style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
                >
                  {/* Top row */}
                  <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                    <div className="min-w-[200px]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{r.company || "Company"}</p>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 tracking-tight">{r.jobRole || "Role"}</h2>
                      <p className="text-xs font-medium text-gray-500">via <span className="text-blue-800 font-semibold">{r.referrer?.name || "Referrer"}</span></p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {r.matchScore > 0 && (
                        <div className="text-center bg-blue-50 rounded-xl px-3 py-1.5 border border-blue-100/50">
                          <p className="text-lg font-black text-blue-900 leading-tight">{r.matchScore}%</p>
                          <p className="text-[8px] text-blue-800 font-bold uppercase tracking-widest">Match</p>
                        </div>
                      )}
                      <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${ss}`}>
                        {r.status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  {r.message && (
                    <div className="bg-gray-50 rounded-2xl p-4 md:p-5 mb-6 border-l-4 border-blue-200">
                      <p className="text-sm text-gray-600 italic">
                        "{r.message}"
                      </p>
                    </div>
                  )}

                  {/* Progress tracker */}
                  {!rejected ? (
                    <div className="flex items-start w-full mt-4">
                      {STATUS_STEPS.map((st, idx) => {
                        const done = idx <= step;
                        const active = idx === step;
                        return (
                          <div key={st} className="flex-1 flex flex-col items-center relative group px-1">
                            {idx < STATUS_STEPS.length - 1 && (
                              <div className={`absolute left-[50%] top-[11px] w-full h-[3px] z-0 transition-colors duration-500 ${done && idx < step ? "bg-blue-800" : "bg-gray-100"}`} />
                            )}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${done ? "bg-blue-800" : "bg-white border-2 border-gray-200"} ${active ? "ring-4 ring-blue-100 scale-110" : ""}`}>
                              {done ? <span className="text-white text-[10px] font-bold">✓</span> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 block" />}
                            </div>
                            <p className={`text-[10px] md:text-xs mt-3 text-center transition-colors duration-300 leading-tight ${active ? "font-bold text-blue-800" : done ? "font-semibold text-gray-600" : "font-medium text-gray-400"}`}>{st}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700 border border-red-100 flex items-center gap-2 font-medium mt-4">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>This request was rejected. Consider reaching out to another referrer.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── REFERRER VIEW ─────────────────────────────────────────────────────────────
function ReferrerView({ referrals, setReferrals, loading }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("All");

  const handleStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await API.put(`/referrals/${id}/status`, { status });
      setReferrals(prev => prev.map(r => r._id === id ? res.data : r));
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filters = ["All", "Pending", "Accepted", "Interview", "Selected", "Rejected"];
  const filtered = filter === "All" ? referrals : referrals.filter(r => r.status === filter);

  const total    = referrals.length;
  const pending  = referrals.filter(r => r.status === "Pending").length;
  const accepted = referrals.filter(r => ["Accepted","Selected"].includes(r.status)).length;
  const rate     = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* HEADER */}
      <div className="bg-[#0f172a] pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-800 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]" />
            <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em]">Referrer · Command Center</p>
          </div>
          <h1 className="text-white text-3xl md:text-5xl font-extrabold tracking-tight mb-2">Incoming Requests</h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-xl">Review, action and manage referral requests from students. <strong className="text-white">You have full control.</strong></p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-20">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -mt-12 mb-10">
          {[
            { label: "Total Requests", value: total,    color: "text-blue-950", bg: "bg-white",    border: "border-gray-200" },
            { label: "Pending Review", value: pending,  color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
            { label: "Accepted",       value: accepted, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
            { label: "Success Rate",   value: `${rate}%`, color: "text-blue-800", bg: "bg-blue-50", border: "border-blue-200" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-4 md:p-6 shadow-sm transform hover:-translate-y-1 transition-transform`}>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-2 flex-wrap mb-8 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
          {filters.map(f => {
            const count = f === "All" ? referrals.length : referrals.filter(r => r.status === f).length;
            const isActive = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${isActive ? 'bg-blue-950 text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                {f}{count > 0 && f !== "All" ? <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-white/20' : 'bg-gray-200'}`}>{count}</span> : ""}
              </button>
            );
          })}
        </div>

        {/* CARDS */}
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="📭" title={filter === "All" ? "No requests yet" : `No ${filter} requests`} desc="Requests from students will appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filtered.map((r, i) => {
              const ss = statusStyle[r.status] || statusStyle.Pending;
              const busy = updatingId === r._id;
              
              // Helper to map status to border color for the accent bar
              const getBorderColor = (status) => {
                if(status === 'Accepted') return 'bg-emerald-500';
                if(status === 'Rejected') return 'bg-red-500';
                if(status === 'Interview') return 'bg-blue-500';
                return 'bg-amber-400';
              };

              return (
                <div key={r._id || i}
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-lg transition-all duration-300 relative group"
                  style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
                >
                  {/* Accent bar */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 opacity-60 group-hover:opacity-100 transition-opacity ${getBorderColor(r.status)}`} />
                  
                  <div className="p-5 md:p-8">
                    {/* Student + status */}
                    <div className="flex justify-between items-start flex-wrap gap-4 mb-6 mt-1">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
                          {r.student?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-0.5 tracking-tight break-all">{r.student?.name || "Unknown Student"}</h2>
                          <p className="text-xs font-medium text-gray-500 break-all">{r.student?.email || ""}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${ss}`}>
                        {r.status || "Pending"}
                      </span>
                    </div>

                    {/* Company / Role / Match */}
                    <div className="flex gap-4 md:gap-10 pt-5 mt-2 border-t border-gray-50 flex-wrap mb-6">
                      {[["Target Company", r.company], ["Desired Role", r.jobRole]].map(([label, val]) => (
                        <div key={label} className="flex-1 min-w-[120px]">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                          <p className="text-sm font-bold text-gray-900 break-words">{val || "—"}</p>
                        </div>
                      ))}
                      {r.matchScore > 0 && (
                        <div className="flex-1 min-w-[120px]">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Match Score</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-[100px]">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.matchScore}%` }} />
                            </div>
                            <span className="text-xs font-black text-blue-800">{r.matchScore}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    {r.message && (
                      <div className="bg-gray-50/80 rounded-2xl p-4 text-sm text-gray-600 border border-gray-100 italic mb-6">
                        "{r.message}"
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2.5 flex-wrap">
                      {[
                        { label: "Accept Request", status: "Accepted", bg: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200", icon: "✓" },
                        { label: "Schedule Interview", status: "Interview", bg: "bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200", icon: "💬" },
                        { label: "Mark as Selected", status: "Selected", bg: "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200", icon: "🎉" },
                        { label: "Decline", status: "Rejected", bg: "bg-red-50 hover:bg-red-100 text-red-800 border-red-200", icon: "✕" },
                      ].map(action => {
                        const isCurrent = r.status === action.status;
                        return (
                          <button key={action.status}
                            onClick={() => handleStatus(r._id, action.status)}
                            disabled={busy || isCurrent}
                            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex-grow sm:flex-grow-0 ${action.bg} ${isCurrent ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${busy ? 'cursor-wait opacity-70' : 'hover:-translate-y-0.5 shadow-sm'}`}
                          >
                            <span>{action.icon}</span>
                            {busy && updatingId === r._id ? "Processing…" : action.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── SHARED HELPERS ────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-800 rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading tracking data…</p>
    </div>
  );
}

function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="text-center py-24 px-6 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
      <div className="text-6xl mb-6 transform hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">{desc}</p>
      {action}
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function MyReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const isReferrer = currentUser.role === "referrer";

  useEffect(() => {
    if (!currentUser?._id) { setLoading(false); return; }
    const url = isReferrer
      ? `/referrals/referrer/${currentUser._id}`
      : `/referrals/student/${currentUser._id}`;
    API.get(url)
      .then(res => setReferrals(res.data || []))
      .catch(() => setReferrals([]))
      .finally(() => setLoading(false));
  }, []);

  return isReferrer
    ? <ReferrerView referrals={referrals} setReferrals={setReferrals} loading={loading} />
    : <StudentView  referrals={referrals} loading={loading} navigate={navigate} />;
}
