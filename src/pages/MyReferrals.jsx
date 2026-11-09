import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

// ─── STATUS CONFIG (PHASE 6: APPLICATION LIFECYCLE) ──────────────────────────
const STATUS_STEPS = ["Pending", "Under Review", "Shortlisted", "Accepted", "Selected"];

const statusStyle = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "Under Review": "bg-blue-50 text-blue-800 border-blue-200",
  Shortlisted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Referred: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Interview: "bg-blue-50 text-blue-700 border-blue-200",
  Selected: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const stepIndex = (status) => {
  const norm = status?.toLowerCase();
  if (norm === "pending") return 0;
  if (norm === "under review") return 1;
  if (norm === "shortlisted") return 2;
  if (norm === "accepted" || norm === "referred") return 3;
  if (norm === "interview" || norm === "selected") return 4;
  return 0;
};

// ─── STUDENT VIEW ─────────────────────────────────────────────────────────────
function StudentView({ referrals, loading, navigate }) {
  const total = referrals.length;
  const pending = referrals.filter((r) => r.status === "Pending").length;
  const inReview = referrals.filter((r) => ["Under Review", "Shortlisted"].includes(r.status)).length;
  const accepted = referrals.filter((r) => ["Accepted", "Selected", "Interview"].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* HEADER */}
      <div className="bg-[#0f172a] pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl opacity-50"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em] mb-2">
            Student · Application Tracking
          </p>
          <h1 className="text-white text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
            My Referral Applications
          </h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-xl">
            Real-time status updates across all 5 evaluation stages. Watch your journey unfold from submission to selection.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-20">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -mt-12 mb-10">
          {[
            { label: "Total Sent", value: total, icon: "📤", color: "text-blue-900" },
            { label: "Pending", value: pending, icon: "⏳", color: "text-amber-600" },
            { label: "In Review / Shortlist", value: inReview, icon: "⭐", color: "text-indigo-700" },
            { label: "Accepted / Selected", value: accepted, icon: "🏆", color: "text-emerald-700" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transform hover:-translate-y-1 transition-transform"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {s.label}
                  </p>
                  <p className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.value}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* APPLICATIONS LIST */}
        {loading ? (
          <Spinner />
        ) : referrals.length === 0 ? (
          <EmptyState
            icon="🚀"
            title="No referral applications submitted yet"
            desc="Explore the smart referrer directory or open referral opportunities to request your first referral."
            action={
              <button
                onClick={() => navigate("/referrers")}
                className="bg-blue-900 hover:bg-blue-950 text-white rounded-xl px-6 py-3 font-semibold text-sm transition shadow-sm cursor-pointer"
              >
                Find Referrers & Opportunities →
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-5">
            {referrals.map((r, i) => {
              const step = stepIndex(r.status);
              const rejected = r.status === "Rejected";
              const ss = statusStyle[r.status] || statusStyle.Pending;
              const matchScore = r.evaluation?.overallScore || r.matchScore || 0;

              return (
                <div
                  key={r._id || i}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                >
                  {/* Top row */}
                  <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                    <div className="min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {r.company || "Company"}
                        </span>
                        {r.opportunity && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                            Open Role
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 tracking-tight">
                        {r.jobRole || "Role"}
                      </h2>
                      <p className="text-xs font-medium text-gray-500">
                        Referrer: <span className="text-blue-800 font-semibold">{r.referrer?.name || "Professional"}</span>
                        {r.referrer?.designation && ` (${r.referrer.designation})`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {matchScore > 0 && (
                        <div className="text-center bg-blue-50 rounded-xl px-3 py-1.5 border border-blue-100/50">
                          <p className="text-lg font-black text-blue-900 leading-tight">{matchScore}%</p>
                          <p className="text-[8px] text-blue-800 font-bold uppercase tracking-widest">AI Match</p>
                        </div>
                      )}
                      <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${ss}`}>
                        {r.status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  {r.message && (
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 border-l-4 border-blue-200">
                      <p className="text-xs text-gray-600 italic">"{r.message}"</p>
                    </div>
                  )}

                  {/* Lifecycle Tracker Bar (Phase 6) */}
                  {!rejected ? (
                    <div className="flex items-start w-full mt-4">
                      {STATUS_STEPS.map((st, idx) => {
                        const done = idx <= step;
                        const active = idx === step;
                        return (
                          <div key={st} className="flex-1 flex flex-col items-center relative group px-1">
                            {idx < STATUS_STEPS.length - 1 && (
                              <div
                                className={`absolute left-[50%] top-[11px] w-full h-[3px] z-0 transition-colors duration-500 ${
                                  done && idx < step ? "bg-blue-800" : "bg-gray-100"
                                }`}
                              />
                            )}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${
                                done ? "bg-blue-800" : "bg-white border-2 border-gray-200"
                              } ${active ? "ring-4 ring-blue-100 scale-110" : ""}`}
                            >
                              {done ? (
                                <span className="text-white text-[10px] font-bold">✓</span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 block" />
                              )}
                            </div>
                            <p
                              className={`text-[10px] md:text-xs mt-3 text-center transition-colors duration-300 leading-tight ${
                                active
                                  ? "font-bold text-blue-800"
                                  : done
                                  ? "font-semibold text-gray-600"
                                  : "font-medium text-gray-400"
                              }`}
                            >
                              {st}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-rose-50 rounded-xl p-3.5 text-xs text-rose-700 border border-rose-100 flex items-center gap-2 font-medium mt-4">
                      <span>✕</span>
                      <span>This request was closed by the referrer. Explore other open opportunities in the directory.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REFERRER VIEW ─────────────────────────────────────────────────────────────
function ReferrerView({ referrals, setReferrals, loading, navigate }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("All");

  const handleStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await API.put(`/referrals/${id}/status`, { status });
      setReferrals((prev) => prev.map((r) => (r._id === id ? res.data : r)));
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filters = ["All", "Pending", "Under Review", "Shortlisted", "Accepted", "Selected", "Rejected"];
  const filtered = filter === "All" ? referrals : referrals.filter((r) => r.status === filter);

  const total = referrals.length;
  const pending = referrals.filter((r) => r.status === "Pending").length;
  const accepted = referrals.filter((r) => ["Accepted", "Selected"].includes(r.status)).length;
  const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* HEADER */}
      <div className="bg-[#0f172a] pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-800 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em]">Referrer · Full Applications Log</p>
            </div>
            <h1 className="text-white text-3xl md:text-5xl font-extrabold tracking-tight mb-2">Applications Registry</h1>
            <p className="text-blue-100/80 text-sm md:text-base max-w-xl">
              Inspect application histories and update statuses across the lifecycle.
            </p>
          </div>
          <button
            onClick={() => navigate("/referrer-dashboard")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            ← Open Evaluation Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-20">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -mt-12 mb-10">
          {[
            { label: "Total Requests", value: total, color: "text-blue-950", bg: "bg-white", border: "border-gray-200" },
            { label: "Pending", value: pending, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
            { label: "Accepted", value: accepted, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
            { label: "Success Rate", value: `${rate}%`, color: "text-blue-800", bg: "bg-blue-50", border: "border-blue-200" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-4 md:p-6 shadow-sm`}>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-2 flex-wrap mb-8 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
          {filters.map((f) => {
            const count = f === "All" ? referrals.length : referrals.filter((r) => r.status === f).length;
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive ? "bg-blue-950 text-white shadow-md" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {f} {count > 0 && <span className="opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* LIST */}
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="📭" title={filter === "All" ? "No applications yet" : `No ${filter} applications`} desc="Applications from candidates will appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((r, i) => {
              const ss = statusStyle[r.status] || statusStyle.Pending;
              const busy = updatingId === r._id;

              return (
                <div key={r._id || i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white font-black text-lg flex items-center justify-center">
                        {r.student?.name?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{r.student?.name}</h3>
                        <p className="text-xs text-gray-500">{r.jobRole} · {r.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${ss}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {r.message && <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl mb-4 italic">"{r.message}"</p>}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Applied on: {new Date(r.createdAt).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleStatus(r._id, "Under Review")}
                        disabled={busy || r.status === "Under Review"}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40"
                      >
                        Under Review
                      </button>
                      <button
                        onClick={() => handleStatus(r._id, "Shortlisted")}
                        disabled={busy || r.status === "Shortlisted"}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleStatus(r._id, "Accepted")}
                        disabled={busy || r.status === "Accepted"}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatus(r._id, "Rejected")}
                        disabled={busy || r.status === "Rejected"}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function MyReferrals() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?._id) {
      navigate("/login");
      return;
    }
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const endpoint =
        currentUser.role === "referrer"
          ? `/referrals/referrer/${currentUser._id}`
          : `/referrals/student/${currentUser._id}`;
      const res = await API.get(endpoint);
      setReferrals(res.data || []);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser.role === "referrer") {
    return (
      <ReferrerView
        referrals={referrals}
        setReferrals={setReferrals}
        loading={loading}
        navigate={navigate}
      />
    );
  }

  return (
    <StudentView
      referrals={referrals}
      loading={loading}
      navigate={navigate}
    />
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-800 rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Applications…</p>
    </div>
  );
}

function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">{desc}</p>
      {action}
    </div>
  );
}
