import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api.js";

export default function CreateReferral() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  const [referrers, setReferrers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [selectedReferrerId, setSelectedReferrerId] = useState(
    location.state?.selectedReferrer?._id || ""
  );
  const [selectedOppId, setSelectedOppId] = useState("");
  const [form, setForm] = useState({
    company: location.state?.selectedReferrer?.company || "",
    jobRole: "",
    message: "",
    portfolioUrl: "",
    githubUrl: currentUser.github || "",
    linkedinUrl: currentUser.linkedin || "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dirRes, oppRes] = await Promise.all([
        API.get("/auth/directory"),
        API.get("/opportunities?status=Active"),
      ]);
      setReferrers(dirRes.data || []);
      setOpportunities(oppRes.data || []);

      // If a referrer was pre-selected from navigation
      if (location.state?.selectedReferrer) {
        const pre = location.state.selectedReferrer;
        setSelectedReferrerId(pre._id);
        setForm((prev) => ({
          ...prev,
          company: pre.company || prev.company,
        }));
      }
    } catch (err) {
      console.error("Error fetching referrers:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const selectedReferrer = referrers.find((r) => r._id === selectedReferrerId);

  // Relevant opportunities for this referrer
  const referrerOpportunities = opportunities.filter(
    (o) => (o.referrer?._id || o.referrer) === selectedReferrerId
  );

  const handleOppSelect = (oppId) => {
    setSelectedOppId(oppId);
    if (!oppId) return;
    const opp = opportunities.find((o) => o._id === oppId);
    if (opp) {
      setForm((prev) => ({
        ...prev,
        company: opp.company,
        jobRole: opp.title,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedReferrerId) {
      setErrorMsg("Please select a referrer.");
      return;
    }

    if (!form.company || !form.jobRole || !form.message) {
      setErrorMsg("Company, job role, and application message are required.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        student: currentUser._id,
        referrer: selectedReferrerId,
        opportunity: selectedOppId || undefined,
        company: form.company,
        jobRole: form.jobRole,
        message: form.message,
        resume: currentUser.resume || "profile_resume.pdf",
        portfolioUrl: form.portfolioUrl,
        githubUrl: form.githubUrl,
        linkedinUrl: form.linkedinUrl,
      };

      await API.post("/referrals/create", payload);
      navigate("/my-referrals");
    } catch (err) {
      console.error("Error creating referral request:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to submit referral application. Please check your inputs and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 font-['Inter',_sans-serif]">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/referrers")}
          className="mb-6 text-xs font-bold text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5 cursor-pointer"
        >
          ← Back to Referrer Directory
        </button>

        <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden p-8">
          <div className="mb-6 border-b border-gray-100 pb-5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              Referral Request Application
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-2">
              Request a Professional Referral
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Your profile, projects, and resume will be analyzed by Gemini to generate an explainable match evaluation for the referrer.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Referrer Selection */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Select Referrer *
              </label>
              <select
                required
                value={selectedReferrerId}
                onChange={(e) => {
                  setSelectedReferrerId(e.target.value);
                  setSelectedOppId("");
                  const ref = referrers.find((r) => r._id === e.target.value);
                  if (ref?.company) {
                    setForm((prev) => ({ ...prev, company: ref.company }));
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="">-- Choose a Champion from Directory --</option>
                {referrers.map((r) => {
                  const remaining = r.remainingCapacity !== undefined ? r.remainingCapacity : 5;
                  const isAvailable = r.availability && remaining > 0;
                  return (
                    <option key={r._id} value={r._id} disabled={!isAvailable}>
                      {r.name} · {r.company || "Independent"} ({r.designation || "Engineer"})
                      {!isAvailable ? " [Capacity Full / Unavailable]" : ` [${remaining} slots open]`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* If Referrer has open opportunities */}
            {referrerOpportunities.length > 0 && (
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                <label className="block text-[11px] font-bold text-blue-900 uppercase tracking-widest mb-1.5">
                  Link to an Open Opportunity (Recommended)
                </label>
                <select
                  value={selectedOppId}
                  onChange={(e) => handleOppSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-blue-200 text-xs text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- General Referral (No specific posted role) --</option>
                  {referrerOpportunities.map((opp) => (
                    <option key={opp._id} value={opp._id}>
                      {opp.title} ({opp.role}) - {opp.currentApplicationsCount || 0}/{opp.maxApplications || 10} applied
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Company & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Target Company *
                </label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Google, Stripe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Target Role / Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.jobRole}
                  onChange={(e) => setForm({ ...form, jobRole: e.target.value })}
                  placeholder="e.g. Frontend Engineer, Full Stack"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Statement / Pitch */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Statement of Fit & Practical Experience *
              </label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Highlight your key technical contributions, projects built, and how your skills fulfill the company's expectations..."
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  value={form.githubUrl}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Portfolio Website
                </label>
                <input
                  type="url"
                  value={form.portfolioUrl}
                  onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                  placeholder="https://mywork.dev"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Resume Notice */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600">
                📄 Resume Attached: <strong>{currentUser.resume ? "Profile Resume" : "Standard Resume"}</strong>
              </span>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Change in Settings
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Evaluating & Sending Application..." : "Submit Referral Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
