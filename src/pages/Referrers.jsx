import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Referrers() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  const [activeTab, setActiveTab] = useState("directory"); // 'directory' | 'opportunities'
  const [referrers, setReferrers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // 'all' | 'available' | 'opportunities'

  // Application Modal state
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    message: "",
    portfolioUrl: "",
    githubUrl: currentUser.github || "",
    linkedinUrl: currentUser.linkedin || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  const fetchDirectoryData = async () => {
    setLoading(true);
    try {
      // 1. Fetch enriched directory
      const dirRes = await API.get("/auth/directory");
      setReferrers(dirRes.data || []);

      // 2. Fetch all active opportunities
      const oppsRes = await API.get("/opportunities?status=Active");
      setOpportunities(oppsRes.data || []);
    } catch (err) {
      console.error("Error loading directory:", err);
      // Fallback to legacy endpoint if needed
      try {
        const fallbackRes = await API.get("/auth/users");
        setReferrers(fallbackRes.data.filter((u) => u.role === "referrer"));
      } catch (fbErr) {
        console.error("Fallback error:", fbErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Distinct Filter Options
  const companies = useMemo(() => {
    const set = new Set();
    referrers.forEach((r) => r.company && set.add(r.company));
    opportunities.forEach((o) => o.company && set.add(o.company));
    return Array.from(set).sort();
  }, [referrers, opportunities]);

  const allSkills = useMemo(() => {
    const set = new Set();
    referrers.forEach((r) => (r.skills || []).forEach((s) => set.add(s)));
    opportunities.forEach((o) => (o.requiredSkills || []).forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [referrers, opportunities]);

  // Filtered Referrers
  const filteredReferrers = useMemo(() => {
    return referrers.filter((referrer) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        referrer.name?.toLowerCase().includes(q) ||
        referrer.designation?.toLowerCase().includes(q) ||
        referrer.company?.toLowerCase().includes(q) ||
        referrer.skills?.some((s) => s.toLowerCase().includes(q)) ||
        referrer.bio?.toLowerCase().includes(q);

      const matchesCompany = !selectedCompany || referrer.company === selectedCompany;

      const matchesRole =
        !selectedRole ||
        referrer.designation?.toLowerCase().includes(selectedRole.toLowerCase());

      const matchesSkill =
        !selectedSkill ||
        referrer.skills?.some((s) => s.toLowerCase() === selectedSkill.toLowerCase());

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && referrer.availability && !referrer.isAtCapacity) ||
        (availabilityFilter === "opportunities" && (referrer.activeOpportunities?.length || 0) > 0);

      return matchesSearch && matchesCompany && matchesRole && matchesSkill && matchesAvailability;
    });
  }, [referrers, searchTerm, selectedCompany, selectedRole, selectedSkill, availabilityFilter]);

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        opp.title?.toLowerCase().includes(q) ||
        opp.company?.toLowerCase().includes(q) ||
        opp.role?.toLowerCase().includes(q) ||
        opp.description?.toLowerCase().includes(q) ||
        opp.requiredSkills?.some((s) => s.toLowerCase().includes(q));

      const matchesCompany = !selectedCompany || opp.company === selectedCompany;

      const matchesSkill =
        !selectedSkill ||
        opp.requiredSkills?.some((s) => s.toLowerCase() === selectedSkill.toLowerCase());

      const isCapacityOpen = (opp.currentApplicationsCount || 0) < (opp.maxApplications || 10);
      const matchesAvailability =
        availabilityFilter !== "available" || isCapacityOpen;

      return matchesSearch && matchesCompany && matchesSkill && matchesAvailability;
    });
  }, [opportunities, searchTerm, selectedCompany, selectedSkill, availabilityFilter]);

  const handleOpenApplyModal = (opp) => {
    setSelectedOpportunity(opp);
    setApplicationForm({
      message: `Hi, I am excited about the ${opp.title} opportunity at ${opp.company}. My technical background and projects align closely with your requirements, and I would appreciate your referral.`,
      portfolioUrl: "",
      githubUrl: currentUser.github || "",
      linkedinUrl: currentUser.linkedin || "",
    });
    setSubmitError("");
    setSubmitSuccess(false);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedOpportunity) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        student: currentUser._id,
        referrer: selectedOpportunity.referrer?._id || selectedOpportunity.referrer,
        opportunity: selectedOpportunity._id,
        company: selectedOpportunity.company,
        jobRole: selectedOpportunity.title,
        message: applicationForm.message,
        resume: currentUser.resume || "profile_resume.pdf",
        portfolioUrl: applicationForm.portfolioUrl,
        githubUrl: applicationForm.githubUrl,
        linkedinUrl: applicationForm.linkedinUrl,
      };

      await API.post("/referrals/create", payload);
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        navigate("/my-referrals");
      }, 1400);
    } catch (err) {
      console.error("Error submitting application:", err);
      setSubmitError(
        err.response?.data?.message ||
          "Failed to submit application. Please check your network and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCompany("");
    setSelectedRole("");
    setSelectedSkill("");
    setAvailabilityFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Top Navbar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-1 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <span className="text-2xl font-bold tracking-tighter text-gray-900">Refer</span>
            <span className="text-2xl font-light text-blue-600 tracking-tighter">Zen</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-blue-600 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/my-referrals")}
              className="text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-blue-600 transition"
            >
              My Referrals
            </button>
            <button
              onClick={() => navigate("/leaderboard")}
              className="text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-amber-600 transition flex items-center gap-1.5"
            >
              <span>🏆</span> Wall of Fame
            </button>
            <button
              onClick={() => navigate("/ai-assistant")}
              className="text-xs font-semibold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition"
            >
              AI Concierge
            </button>
          </nav>

          <div
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
          >
            {currentUser.name?.[0]?.toUpperCase() || "S"}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        {/* Hero Section */}
        <div className="mb-8 relative overflow-hidden rounded-3xl bg-[#0f172a] text-white p-8 md:p-12 shadow-xl shadow-blue-900/10">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-25"></div>
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-20"></div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-4 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-200">
                Smart Referrer Discovery
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 leading-tight">
              Direct Referral Access. <span className="text-blue-400">Balanced Capacity.</span>
            </h1>
            <p className="text-sm md:text-base text-blue-100/70 mb-6 leading-relaxed">
              Explore available industry experts filtered by company, role, technical skills, and available request capacity. No more bottlenecking the top three referrers.
            </p>

            {/* Sub-navigation Tabs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab("directory")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "directory"
                    ? "bg-white text-gray-900 shadow-md scale-105"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <span>👥</span> Referrer Directory ({referrers.length})
              </button>
              <button
                onClick={() => setActiveTab("opportunities")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "opportunities"
                    ? "bg-white text-gray-900 shadow-md scale-105"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <span>💼</span> Open Opportunities ({opportunities.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search & Multi-Facet Filters Bar */}
        <div className="mb-8 p-5 bg-white rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder={
                  activeTab === "directory"
                    ? "Search experts by name, role, company, or skills..."
                    : "Search opportunities by job title, company, or tech stack..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition"
              />
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Company Dropdown */}
            <div className="w-full lg:w-56">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
              >
                <option value="">All Companies ({companies.length})</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability / Capacity Dropdown */}
            <div className="w-full lg:w-56">
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
              >
                <option value="all">Availability: All</option>
                <option value="available">Accepting Requests (Capacity Open)</option>
                <option value="opportunities">Has Active Job Roles</option>
              </select>
            </div>
          </div>

          {/* Quick Skill Tags Filter */}
          {allSkills.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">
                Filter by Skill:
              </span>
              <button
                onClick={() => setSelectedSkill("")}
                className={`text-xs px-2.5 py-1 rounded-lg transition ${
                  !selectedSkill
                    ? "bg-gray-900 text-white font-semibold"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {allSkills.slice(0, 10).map((skill) => (
                <button
                  key={skill}
                  onClick={() => setSelectedSkill(selectedSkill === skill ? "" : skill)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition ${
                    selectedSkill === skill
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {skill}
                </button>
              ))}
              {(searchTerm || selectedCompany || selectedRole || selectedSkill || availabilityFilter !== "all") && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Scanning discovery directory...
            </p>
          </div>
        ) : activeTab === "directory" ? (
          /* =========================================================================
             TAB 1: REFERRER DIRECTORY
             ========================================================================= */
          filteredReferrers.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No referrers match your criteria</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Try loosening your filters or resetting the company and skill tags to discover more champions.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-blue-50 text-blue-600 font-semibold text-xs rounded-xl hover:bg-blue-100 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReferrers.map((referrer) => {
                const capacity = referrer.maxCapacity || 10;
                const activeRequests = referrer.activeRequestsCount || 0;
                const remaining = Math.max(0, capacity - activeRequests);
                const percentFull = Math.min(100, Math.round((activeRequests / capacity) * 100));
                const isAccepting = referrer.availability && remaining > 0;

                return (
                  <div
                    key={referrer._id}
                    className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                  >
                    {/* Header Strip */}
                    <div className="p-6 pb-4 border-b border-gray-100 bg-gradient-to-br from-gray-50/80 to-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white font-black text-xl flex items-center justify-center shadow-md">
                            {referrer.name?.[0]?.toUpperCase() || "R"}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition">
                              {referrer.name}
                            </h3>
                            <p className="text-xs font-medium text-gray-500">
                              {referrer.designation || "Engineering Professional"}
                            </p>
                            <span className="inline-block mt-1 text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                              🏢 {referrer.company || "Independent"}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isAccepting
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAccepting ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                              }`}
                            ></span>
                            {isAccepting ? "Accepting" : "Capacity Full"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Capacity Meter */}
                      <div className="mb-5 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                        <div className="flex justify-between items-center text-[11px] font-semibold mb-1.5">
                          <span className="text-gray-500">Request Capacity:</span>
                          <span className={remaining > 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                            {remaining > 0 ? `${remaining} of ${capacity} slots open` : "No slots open"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentFull >= 100
                                ? "bg-rose-500"
                                : percentFull >= 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${percentFull}%` }}
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      {referrer.bio && (
                        <p className="text-xs text-gray-600 italic line-clamp-2 mb-4">
                          "{referrer.bio}"
                        </p>
                      )}

                      {/* Key Skills */}
                      {referrer.skills && referrer.skills.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Technical Domain
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {referrer.skills.slice(0, 4).map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700"
                              >
                                {s}
                              </span>
                            ))}
                            {referrer.skills.length > 4 && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400">
                                +{referrer.skills.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Active Opportunities Posted by Referrer */}
                      {referrer.activeOpportunities && referrer.activeOpportunities.length > 0 && (
                        <div className="mb-4 p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-widest flex items-center gap-1">
                              <span>💼</span> Open Opportunities ({referrer.activeOpportunities.length})
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {referrer.activeOpportunities.slice(0, 2).map((opp) => (
                              <div
                                key={opp._id}
                                onClick={() => handleOpenApplyModal(opp)}
                                className="text-xs font-semibold text-blue-800 bg-white px-2.5 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition cursor-pointer flex items-center justify-between"
                              >
                                <span className="truncate">{opp.title}</span>
                                <span className="text-[10px] opacity-75">Apply →</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
                        {referrer.linkedin && (
                          <a
                            href={referrer.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition border border-gray-200"
                            title="LinkedIn"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          </a>
                        )}
                        {referrer.github && (
                          <a
                            href={referrer.github}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-900 text-gray-600 hover:text-white transition border border-gray-200"
                            title="GitHub"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                          </a>
                        )}

                        <button
                          onClick={() =>
                            navigate("/create-referral", {
                              state: { selectedReferrer: referrer },
                            })
                          }
                          disabled={!isAccepting}
                          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                            isAccepting
                              ? "bg-gray-900 text-white hover:bg-blue-600 shadow-sm"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                          }`}
                        >
                          {isAccepting ? "Request Direct Referral" : "Capacity Reached"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* =========================================================================
             TAB 2: OPEN REFERRAL OPPORTUNITIES (PHASE 2)
             ========================================================================= */
          filteredOpportunities.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No open referral opportunities found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Try clearing your search terms or company filters to view all active openings posted by referrers.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-blue-50 text-blue-600 font-semibold text-xs rounded-xl hover:bg-blue-100 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.map((opp) => {
                const max = opp.maxApplications || 10;
                const current = opp.currentApplicationsCount || 0;
                const remaining = Math.max(0, max - current);
                const isFull = remaining === 0;

                return (
                  <div
                    key={opp._id}
                    className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    <div className="p-6 pb-4 border-b border-gray-100 bg-gradient-to-br from-blue-50/40 via-white to-gray-50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
                          🏢 {opp.company}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            !isFull
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {!isFull ? `${remaining} Slots Left` : "Cap Reached"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{opp.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Role: {opp.role}</p>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      {/* Referrer Info */}
                      <div className="flex items-center gap-2.5 mb-4 p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                          {opp.referrer?.name?.[0]?.toUpperCase() || "R"}
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-gray-900 leading-tight">
                            {opp.referrer?.name || "Verified Referrer"}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {opp.referrer?.designation || "Engineering"} at {opp.company}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                        {opp.description}
                      </p>

                      {/* Requirements Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">Min Experience</p>
                          <p className="font-semibold text-gray-800">{opp.minExperience ? `${opp.minExperience}+ Years` : "Open to All"}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">Capacity</p>
                          <p className="font-semibold text-gray-800">{current} / {max} applied</p>
                        </div>
                      </div>

                      {/* Required Skills */}
                      {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                        <div className="mb-6">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                            Required Tech Stack
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {opp.requiredSkills.map((sk, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Apply Button */}
                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleOpenApplyModal(opp)}
                          disabled={isFull}
                          className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                            !isFull
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                          }`}
                        >
                          {!isFull ? "Apply for Referral →" : "Opportunity Full"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* =========================================================================
          APPLICATION SUBMISSION MODAL (PHASE 2 & PHASE 3)
          ========================================================================= */}
      {showApplyModal && selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 text-xl font-bold rounded-full"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Referral Application
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">
                {selectedOpportunity.title}
              </h2>
              <p className="text-xs text-gray-500">
                {selectedOpportunity.company} · Referrer: {selectedOpportunity.referrer?.name || "Champion"}
              </p>
            </div>

            {submitSuccess ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
                <p className="text-xs text-gray-500">
                  Your profile and resume are being processed by the AI evaluation engine and sent to the referrer.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Your Pitch / Referral Statement
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={applicationForm.message}
                    onChange={(e) =>
                      setApplicationForm({ ...applicationForm, message: e.target.value })
                    }
                    placeholder="Highlight your strongest practical experience, project highlights, and why you are a strong fit..."
                    className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={applicationForm.githubUrl}
                      onChange={(e) =>
                        setApplicationForm({ ...applicationForm, githubUrl: e.target.value })
                      }
                      placeholder="https://github.com/yourhandle"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={applicationForm.linkedinUrl}
                      onChange={(e) =>
                        setApplicationForm({ ...applicationForm, linkedinUrl: e.target.value })
                      }
                      placeholder="https://linkedin.com/in/yourhandle"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Portfolio / Project Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={applicationForm.portfolioUrl}
                    onChange={(e) =>
                      setApplicationForm({ ...applicationForm, portfolioUrl: e.target.value })
                    }
                    placeholder="https://yourportfolio.dev"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Resume Status Notice */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>📄</span>
                    <span className="font-semibold text-blue-900">
                      {currentUser.resume ? "Profile Resume attached" : "Default resume attached"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    className="text-[11px] text-blue-600 hover:underline font-bold"
                  >
                    Update in Settings
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    {submitting ? "Analyzing & Submitting..." : "Submit Application for AI Evaluation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
