import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function ReferrerDashboard() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  // Primary State
  const [activeTab, setActiveTab] = useState("evaluation"); // 'evaluation' | 'opportunities'
  const [referrals, setReferrals] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referrerPoints, setReferrerPoints] = useState(currentUser.points || 0);
  const [availability, setAvailability] = useState(currentUser.availability !== false);

  // Filters for Candidate Evaluation
  const [selectedOpportunityFilter, setSelectedOpportunityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score"); // 'score' | 'date' | 'exp'
  const [candidateSearch, setCandidateSearch] = useState("");

  // Modals & Drawers
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Side-by-side comparison
  const [comparisonIds, setComparisonIds] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Create Opportunity Modal
  const [showCreateOppModal, setShowCreateOppModal] = useState(false);
  const [oppForm, setOppForm] = useState({
    title: "",
    company: currentUser.company || "",
    role: "Software Engineering",
    description: "",
    requiredSkills: "",
    minExperience: "0",
    maxExperience: "5",
    educationRequirements: "Bachelor's in CS, Engineering or practical equivalent",
    maxApplications: "10",
    mandatoryRequirements: "",
    weights: {
      skillAlignment: 35,
      practicalExperience: 25,
      workExperience: 20,
      education: 10,
      certifications: 10,
    },
  });
  const [creatingOpp, setCreatingOpp] = useState(false);
  const [createOppError, setCreateOppError] = useState("");

  // Status mapping
  const statusBadgeStyles = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    "Under Review": "bg-blue-50 text-blue-700 border-blue-200",
    Shortlisted: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Interview: "bg-blue-50 text-blue-700 border-blue-200",
    Selected: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  useEffect(() => {
    if (!currentUser?._id) {
      navigate("/login");
      return;
    }
    if (currentUser.role !== "referrer") {
      navigate("/my-referrals");
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch applications for this referrer
      const resRefs = await API.get(`/referrals/referrer/${currentUser._id}`);
      setReferrals(resRefs.data || []);

      // 2. Fetch opportunities created by this referrer
      const resOpps = await API.get("/opportunities/mine");
      setOpportunities(resOpps.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Referrer Availability
  const handleToggleAvailability = async () => {
    const nextVal = !availability;
    setAvailability(nextVal);
    try {
      await API.put("/auth/profile", { availability: nextVal });
      const updatedUser = { ...currentUser, availability: nextVal };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to update availability:", err);
      setAvailability(!nextVal);
    }
  };

  // Update Application Status (Phase 6)
  const handleUpdateStatus = async (applicationId, newStatus) => {
    setUpdatingStatusId(applicationId);
    try {
      const res = await API.put(`/referrals/${applicationId}/status`, { status: newStatus });
      const updatedRef = res.data;

      // Update state
      setReferrals((prev) =>
        prev.map((r) => (r._id === applicationId ? updatedRef : r))
      );

      if (selectedApplication?._id === applicationId) {
        setSelectedApplication(updatedRef);
      }

      if (updatedRef.referrer?.points) {
        setReferrerPoints(updatedRef.referrer.points);
        const updatedUser = { ...currentUser, points: updatedRef.referrer.points };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Trigger / Re-run AI Evaluation
  const handleTriggerEvaluation = async (applicationId) => {
    setEvaluatingId(applicationId);
    try {
      const res = await API.post(`/referrals/${applicationId}/evaluate`);
      const updatedRef = res.data;
      setReferrals((prev) =>
        prev.map((r) => (r._id === applicationId ? updatedRef : r))
      );
      if (selectedApplication?._id === applicationId) {
        setSelectedApplication(updatedRef);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      alert(err.response?.data?.message || "AI Evaluation failed. Please try again.");
    } finally {
      setEvaluatingId(null);
    }
  };

  // Create Opportunity
  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    setCreatingOpp(true);
    setCreateOppError("");

    try {
      const res = await API.post("/opportunities/create", {
        ...oppForm,
        minExperience: Number(oppForm.minExperience) || 0,
        maxExperience: Number(oppForm.maxExperience) || 5,
        maxApplications: Number(oppForm.maxApplications) || 10,
      });

      setOpportunities([res.data, ...opportunities]);
      setShowCreateOppModal(false);
      setOppForm({
        title: "",
        company: currentUser.company || "",
        role: "Software Engineering",
        description: "",
        requiredSkills: "",
        minExperience: "0",
        maxExperience: "5",
        educationRequirements: "Bachelor's in CS, Engineering or practical equivalent",
        maxApplications: "10",
        mandatoryRequirements: "",
        weights: {
          skillAlignment: 35,
          practicalExperience: 25,
          workExperience: 20,
          education: 10,
          certifications: 10,
        },
      });
    } catch (err) {
      console.error("Error creating opportunity:", err);
      setCreateOppError(err.response?.data?.message || "Failed to create opportunity.");
    } finally {
      setCreatingOpp(false);
    }
  };

  // Toggle Opportunity Status (Active, Paused, Closed)
  const handleToggleOpportunityStatus = async (oppId, newStatus) => {
    try {
      const res = await API.put(`/opportunities/${oppId}/status`, { status: newStatus });
      setOpportunities((prev) =>
        prev.map((o) => (o._id === oppId ? { ...o, status: res.data.status } : o))
      );
    } catch (err) {
      console.error("Error updating opportunity status:", err);
      alert("Failed to update opportunity status.");
    }
  };

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return referrals
      .filter((ref) => {
        // Opportunity filter
        if (selectedOpportunityFilter === "direct") {
          if (ref.opportunity) return false;
        } else if (selectedOpportunityFilter !== "all") {
          if (ref.opportunity?._id !== selectedOpportunityFilter && ref.opportunity !== selectedOpportunityFilter) {
            return false;
          }
        }

        // Status filter
        if (statusFilter !== "all" && ref.status?.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }

        // Search term (student name, skills, jobRole)
        if (candidateSearch) {
          const q = candidateSearch.toLowerCase();
          const name = ref.student?.name?.toLowerCase() || "";
          const role = ref.jobRole?.toLowerCase() || "";
          const skills = (ref.student?.skills || []).map((s) => s.toLowerCase());
          const hasSkill = skills.some((s) => s.includes(q));
          if (!name.includes(q) && !role.includes(q) && !hasSkill) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          const scoreA = a.evaluation?.overallScore || a.matchScore || 0;
          const scoreB = b.evaluation?.overallScore || b.matchScore || 0;
          return scoreB - scoreA;
        }
        if (sortBy === "exp") {
          const expA = a.student?.yearsOfExperience || 0;
          const expB = b.student?.yearsOfExperience || 0;
          return expB - expA;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [referrals, selectedOpportunityFilter, statusFilter, sortBy, candidateSearch]);

  // Comparison Handlers
  const toggleComparison = (id) => {
    if (comparisonIds.includes(id)) {
      setComparisonIds(comparisonIds.filter((cid) => cid !== id));
    } else {
      if (comparisonIds.length >= 3) {
        alert("You can compare up to 3 candidates at a time.");
        return;
      }
      setComparisonIds([...comparisonIds, id]);
    }
  };

  const candidatesForComparison = useMemo(() => {
    return referrals.filter((r) => comparisonIds.includes(r._id));
  }, [referrals, comparisonIds]);

  // Overall Stats
  const statsData = useMemo(() => {
    const total = referrals.length;
    const shortlisted = referrals.filter((r) => r.status === "Shortlisted").length;
    const accepted = referrals.filter((r) => ["Accepted", "Selected"].includes(r.status)).length;
    const underReview = referrals.filter((r) => r.status === "Under Review").length;
    const activeOpps = opportunities.filter((o) => o.status === "Active").length;

    return [
      { title: "Total Applications", value: total.toString(), icon: "📥", badge: `${underReview} in review` },
      { title: "Shortlisted Candidates", value: shortlisted.toString(), icon: "⭐", badge: "High priority" },
      { title: "Referrals Accepted", value: accepted.toString(), icon: "🏆", badge: `${accepted * 5} pts earned` },
      { title: "Active Opportunities", value: activeOpps.toString(), icon: "💼", badge: `${opportunities.length} total posted` },
    ];
  }, [referrals, opportunities]);

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Top Navbar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-1 cursor-pointer" onClick={() => navigate("/referrer-dashboard")}>
            <span className="text-2xl font-bold tracking-tighter text-gray-900">Refer</span>
            <span className="text-2xl font-light text-blue-600 tracking-tighter">Zen</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate("/referrer-dashboard")}
                className="text-xs font-semibold text-blue-600 uppercase tracking-widest transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/my-referrals")}
                className="text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-blue-600 transition"
              >
                Applications Log
              </button>
              <button
                onClick={() => navigate("/leaderboard")}
                className="text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-amber-600 transition flex items-center gap-1.5"
              >
                <span>🏆</span> Wall of Fame
              </button>
              <button
                onClick={() => navigate("/ai-assistant")}
                className="text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-blue-600 transition"
              >
                AI Concierge
              </button>
            </nav>

            {/* Availability Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  availability ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span className="text-[11px] font-bold text-gray-700">
                {availability ? "Accepting" : "Paused"}
              </span>
              <button
                onClick={handleToggleAvailability}
                className="text-[10px] uppercase font-bold text-blue-600 hover:underline pl-1 cursor-pointer"
              >
                {availability ? "Pause" : "Resume"}
              </button>
            </div>

            <div
              onClick={() => navigate("/settings")}
              className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition"
            >
              {currentUser.name?.[0]?.toUpperCase() || "R"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        {/* Header Hero Banner */}
        <div className="mb-8 rounded-3xl bg-[#0f172a] text-white p-8 md:p-10 shadow-xl shadow-blue-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-25"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-3 backdrop-blur-md">
                <span className="text-[10px] font-bold tracking-widest uppercase text-blue-200">
                  Referrer Command Center · {currentUser.company || "Company"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                Candidate Evaluation & <span className="text-blue-400">Opportunity Management</span>
              </h1>
              <p className="text-xs md:text-sm text-blue-100/70 max-w-xl">
                AI-assisted candidate evidence evaluation, objective requirement matching, and full decision authority over student applications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCreateOppModal(true)}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span>➕</span> Post Referral Opportunity
              </button>

              <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                <p className="text-xl font-black text-amber-400 leading-tight">{referrerPoints}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200">Referral Points</p>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="relative z-10 flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setActiveTab("evaluation")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "evaluation"
                  ? "bg-white text-gray-900 shadow-md scale-105"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span>📊</span> Candidate Evaluation Dashboard ({referrals.length})
            </button>
            <button
              onClick={() => setActiveTab("opportunities")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "opportunities"
                  ? "bg-white text-gray-900 shadow-md scale-105"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span>💼</span> My Opportunities ({opportunities.length})
            </button>

            {comparisonIds.length > 0 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="ml-auto px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-md animate-bounce cursor-pointer"
              >
                Compare ({comparisonIds.length}) Side-by-Side →
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((s) => (
            <div
              key={s.title}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.title}</span>
                <span className="text-xl">{s.icon}</span>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 leading-none mb-1">{s.value}</p>
                <p className="text-[10px] font-semibold text-blue-600">{s.badge}</p>
              </div>
            </div>
          ))}
        </div>

        {/* =========================================================================
            TAB 1: CANDIDATE EVALUATION DASHBOARD (PHASE 3, 4, 5)
            ========================================================================= */}
        {activeTab === "evaluation" && (
          <div className="space-y-6">
            {/* Filter and Control Bar */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Filter candidate by name, skill, or role..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition w-full md:w-56"
                />

                {/* Opportunity Filter */}
                <select
                  value={selectedOpportunityFilter}
                  onChange={(e) => setSelectedOpportunityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Opportunities ({referrals.length})</option>
                  <option value="direct">Direct Requests Only</option>
                  {opportunities.map((opp) => (
                    <option key={opp._id} value={opp._id}>
                      {opp.title} ({opp.currentApplicationsCount || 0})
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Status: All</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sort:</span>
                <button
                  onClick={() => setSortBy("score")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    sortBy === "score" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  AI Match Score
                </button>
                <button
                  onClick={() => setSortBy("exp")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    sortBy === "exp" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Experience
                </button>
                <button
                  onClick={() => setSortBy("date")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    sortBy === "date" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Newest
                </button>
              </div>
            </div>

            {/* Candidates Table / Cards */}
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-3"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Loading applicant roster...
                </p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
                <div className="text-4xl mb-3">📥</div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No applications match these criteria</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Check back as students discover your opportunities, or adjust your status and opportunity filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedOpportunityFilter("all");
                    setStatusFilter("all");
                    setCandidateSearch("");
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <th className="px-5 py-4 w-12 text-center">Compare</th>
                        <th className="px-5 py-4">Candidate</th>
                        <th className="px-5 py-4">Role / Opportunity</th>
                        <th className="px-5 py-4 text-center">AI Match Score</th>
                        <th className="px-5 py-4">Evidence Breakdown</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredCandidates.map((ref) => {
                        const score = ref.evaluation?.overallScore || ref.matchScore || 0;
                        const bd = ref.evaluation?.breakdown || {
                          skillAlignment: 0,
                          practicalExperience: 0,
                          workExperience: 0,
                          education: 0,
                          certifications: 0,
                        };
                        const isCompared = comparisonIds.includes(ref._id);

                        return (
                          <tr key={ref._id} className="hover:bg-blue-50/30 transition">
                            {/* Checkbox for side-by-side comparison */}
                            <td className="px-5 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={isCompared}
                                onChange={() => toggleComparison(ref._id)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>

                            {/* Candidate Info */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                                  {ref.student?.name?.[0]?.toUpperCase() || "S"}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 leading-tight">
                                    {ref.student?.name || "Student Applicant"}
                                  </p>
                                  <p className="text-[11px] text-gray-500">{ref.student?.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                      {ref.student?.yearsOfExperience || 0} yrs exp
                                    </span>
                                    {ref.student?.github && (
                                      <a
                                        href={ref.student.github}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-blue-600 hover:underline font-semibold"
                                      >
                                        GitHub ↗
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role / Opportunity */}
                            <td className="px-5 py-4">
                              <p className="font-bold text-gray-800">{ref.jobRole || "Software Engineer"}</p>
                              <p className="text-[11px] text-gray-500">{ref.company}</p>
                              {ref.opportunity ? (
                                <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                  Role Posting
                                </span>
                              ) : (
                                <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  Direct Request
                                </span>
                              )}
                            </td>

                            {/* AI Match Score (Phase 3 & 4) */}
                            <td className="px-5 py-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <div
                                  className={`px-3 py-1.5 rounded-xl font-black text-sm border ${
                                    score >= 80
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : score >= 60
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {score}%
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                  {ref.evaluation?.isAiEvaluated ? "Gemini Verified" : "Evaluated"}
                                </span>
                              </div>
                            </td>

                            {/* Evidence Breakdown Bars */}
                            <td className="px-5 py-4 min-w-[200px]">
                              <div className="space-y-1 text-[10px]">
                                <div className="flex justify-between font-semibold text-gray-600">
                                  <span>Tech Skills: {bd.skillAlignment}/35</span>
                                  <span>Projects: {bd.practicalExperience}/25</span>
                                </div>
                                <div className="flex justify-between font-semibold text-gray-500">
                                  <span>Work/Intern: {bd.workExperience}/20</span>
                                  <span>Edu & Certs: {(bd.education || 0) + (bd.certifications || 0)}/20</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden flex">
                                  <div className="bg-blue-500 h-full" style={{ width: `${(bd.skillAlignment / 35) * 35}%` }} title="Skills" />
                                  <div className="bg-indigo-500 h-full" style={{ width: `${(bd.practicalExperience / 25) * 25}%` }} title="Projects" />
                                  <div className="bg-emerald-500 h-full" style={{ width: `${(bd.workExperience / 20) * 20}%` }} title="Work" />
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                                  statusBadgeStyles[ref.status] || "bg-gray-50 text-gray-600 border-gray-200"
                                }`}
                              >
                                {ref.status || "Pending"}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedApplication(ref);
                                    setShowEvaluationModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition cursor-pointer"
                                >
                                  Inspect AI Report
                                </button>

                                {/* Quick Status Select */}
                                <select
                                  value={ref.status}
                                  disabled={updatingStatusId === ref._id}
                                  onChange={(e) => handleUpdateStatus(ref._id, e.target.value)}
                                  className="px-2 py-1.5 rounded-xl bg-gray-100 text-gray-800 text-[11px] font-bold border border-gray-200 focus:outline-none cursor-pointer"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Under Review">Under Review</option>
                                  <option value="Shortlisted">Shortlist</option>
                                  <option value="Accepted">Accept / Refer</option>
                                  <option value="Interview">Interview</option>
                                  <option value="Selected">Selected</option>
                                  <option value="Rejected">Reject</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: OPPORTUNITY MANAGEMENT (PHASE 2)
            ========================================================================= */}
        {activeTab === "opportunities" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Your Posted Referral Opportunities
                </h2>
                <p className="text-xs text-gray-500">
                  Control capacity, pause requests when overwhelmed, and define custom evaluation requirements.
                </p>
              </div>
              <button
                onClick={() => setShowCreateOppModal(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition shadow-sm cursor-pointer"
              >
                + New Opportunity
              </button>
            </div>

            {opportunities.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
                <div className="text-4xl mb-3">💼</div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No referral opportunities posted yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  Post open roles from your company. Students will be evaluated by Gemini against your exact requirements.
                </p>
                <button
                  onClick={() => setShowCreateOppModal(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 transition cursor-pointer"
                >
                  Create Your First Opportunity
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opp) => {
                  const max = opp.maxApplications || 10;
                  const count = opp.currentApplicationsCount || 0;
                  const remaining = Math.max(0, max - count);
                  const isPaused = opp.status === "Paused";
                  const isClosed = opp.status === "Closed";

                  return (
                    <div
                      key={opp._id}
                      className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                            🏢 {opp.company}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              opp.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : opp.status === "Paused"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {opp.status}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{opp.title}</h3>
                        <p className="text-xs text-gray-500 mb-4">{opp.role}</p>

                        <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                          {opp.description}
                        </p>

                        {/* Capacity Meter */}
                        <div className="mb-4 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                          <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                            <span className="text-gray-500 uppercase tracking-widest">Applications Cap:</span>
                            <span className="text-gray-800">
                              {count} / {max} received ({remaining} slots left)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (count / max) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Skills */}
                        {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-1">
                            {opp.requiredSkills.slice(0, 4).map((sk, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Controls Footer */}
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedOpportunityFilter(opp._id);
                            setActiveTab("evaluation");
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Review Applicants ({count}) →
                        </button>

                        <div className="flex gap-1">
                          {opp.status === "Active" ? (
                            <button
                              onClick={() => handleToggleOpportunityStatus(opp._id, "Paused")}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                            >
                              Pause
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleOpportunityStatus(opp._id, "Active")}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                          {!isClosed && (
                            <button
                              onClick={() => handleToggleOpportunityStatus(opp._id, "Closed")}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: AI CANDIDATE EVALUATION REPORT (PHASE 3, 4, 5)
          ========================================================================= */}
      {showEvaluationModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEvaluationModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 text-xl font-bold rounded-full cursor-pointer"
            >
              ✕
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  AI-Assisted Candidate Report
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    statusBadgeStyles[selectedApplication.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {selectedApplication.status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-900">
                {selectedApplication.student?.name || "Candidate Evaluation"}
              </h2>
              <p className="text-xs text-gray-500">
                Applied for {selectedApplication.jobRole} at {selectedApplication.company}
              </p>
            </div>

            {/* Match Score Display */}
            <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-[#0f172a] to-blue-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">
                  Explainable Requirement-Match Score
                </p>
                <div className="flex items-baseline gap-2 justify-center md:justify-start">
                  <span className="text-5xl font-black text-white">
                    {selectedApplication.evaluation?.overallScore || selectedApplication.matchScore || 0}%
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">Evidence-Based</span>
                </div>
                <p className="text-[11px] text-blue-200/70 mt-1 max-w-xs">
                  Evaluated against job requirements using weighted evidence scoring.
                </p>
              </div>

              <button
                onClick={() => handleTriggerEvaluation(selectedApplication._id)}
                disabled={evaluatingId === selectedApplication._id}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer disabled:opacity-50"
              >
                {evaluatingId === selectedApplication._id ? "Re-Evaluating..." : "🔄 Re-Evaluate with Gemini"}
              </button>
            </div>

            {/* Weighted Criteria Breakdown (Phase 4) */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                Evidence Scoring Contribution (Weighted Model)
              </h4>
              <div className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {[
                  {
                    name: "Technical Skill Alignment",
                    score: selectedApplication.evaluation?.breakdown?.skillAlignment || 0,
                    max: 35,
                    color: "bg-blue-600",
                    desc: "Skills backed by practical projects & internships vs merely listed",
                  },
                  {
                    name: "Relevant Projects & Practical Experience",
                    score: selectedApplication.evaluation?.breakdown?.practicalExperience || 0,
                    max: 25,
                    color: "bg-indigo-600",
                    desc: "Relevance of technical stack and stated contributions",
                  },
                  {
                    name: "Internship & Work Experience",
                    score: selectedApplication.evaluation?.breakdown?.workExperience || 0,
                    max: 20,
                    color: "bg-emerald-600",
                    desc: "Hands-on professional or academic project tenure",
                  },
                  {
                    name: "Educational Eligibility",
                    score: selectedApplication.evaluation?.breakdown?.education || 0,
                    max: 10,
                    color: "bg-cyan-600",
                    desc: "Academic degree alignment & graduation requirements",
                  },
                  {
                    name: "Relevant Certifications & Profile Evidence",
                    score: selectedApplication.evaluation?.breakdown?.certifications || 0,
                    max: 10,
                    color: "bg-amber-600",
                    desc: "Public GitHub repos, verified credentials & portfolio",
                  },
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-800">{item.name}</span>
                      <span className="text-gray-900">
                        {item.score} / {item.max} pts
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${Math.min(100, (item.score / item.max) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <h5 className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>✓</span> Evidence-Based Strengths
                </h5>
                <ul className="text-xs text-emerald-900 space-y-1.5 list-disc pl-4">
                  {(selectedApplication.evaluation?.strengths || ["Demonstrated core technical competencies"]).map(
                    (s, i) => (
                      <li key={i}>{s}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                <h5 className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>ℹ️</span> Verification & Discussion Points
                </h5>
                <ul className="text-xs text-amber-900 space-y-1.5 list-disc pl-4">
                  {(selectedApplication.evaluation?.gaps || ["Verify depth during technical screening"]).map(
                    (g, i) => (
                      <li key={i}>{g}</li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* AI Summary */}
            {selectedApplication.evaluation?.summary && (
              <div className="mb-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <h5 className="text-[11px] font-bold text-blue-900 uppercase tracking-widest mb-1">
                  Evaluation Narrative Summary
                </h5>
                <p className="text-xs text-blue-950 leading-relaxed italic">
                  "{selectedApplication.evaluation.summary}"
                </p>
              </div>
            )}

            {/* Student Pitch Message */}
            {selectedApplication.message && (
              <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Candidate Application Statement
                </h5>
                <p className="text-xs text-gray-700 leading-relaxed">
                  "{selectedApplication.message}"
                </p>
              </div>
            )}

            {/* Supporting Links & Resume */}
            <div className="mb-6 flex flex-wrap gap-2 text-xs">
              {selectedApplication.resume && (
                <a
                  href={`http://localhost:5000${selectedApplication.resume}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-gray-900 text-white font-semibold flex items-center gap-1.5 hover:bg-gray-800 transition"
                >
                  <span>📄</span> Download Resume
                </a>
              )}
              {selectedApplication.githubUrl && (
                <a
                  href={selectedApplication.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition"
                >
                  GitHub Profile ↗
                </a>
              )}
              {selectedApplication.linkedinUrl && (
                <a
                  href={selectedApplication.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
                >
                  LinkedIn Profile ↗
                </a>
              )}
              {selectedApplication.portfolioUrl && (
                <a
                  href={selectedApplication.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition"
                >
                  Portfolio Website ↗
                </a>
              )}
            </div>

            {/* Ethical AI Guardrail Disclaimer */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-[10px] text-gray-500 mb-6 leading-relaxed">
              <strong>Notice:</strong> This AI match score assists the referrer by evaluating alignment with stated opportunity requirements. It does not measure intrinsic technical ability or guarantee hiring probability. As the referrer, you retain 100% final authority over candidate decisions.
            </div>

            {/* Referrer Decision Action Controls (Phase 5 & 6) */}
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 justify-end">
              <button
                onClick={() => handleUpdateStatus(selectedApplication._id, "Under Review")}
                className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
              >
                Mark Under Review
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedApplication._id, "Shortlisted")}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
              >
                ⭐ Shortlist Candidate
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedApplication._id, "Accepted")}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm cursor-pointer"
              >
                ✓ Accept & Provide Referral
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedApplication._id, "Rejected")}
                className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SIDE-BY-SIDE CANDIDATE COMPARISON (PHASE 5)
          ========================================================================= */}
      {showComparisonModal && candidatesForComparison.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowComparisonModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 text-xl font-bold rounded-full cursor-pointer"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Side-by-Side Comparison Matrix
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                Comparing {candidatesForComparison.length} Candidates
              </h2>
              <p className="text-xs text-gray-500">
                Compare technical skills, evidence match scores, and stated practical contributions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {candidatesForComparison.map((cand) => {
                const score = cand.evaluation?.overallScore || cand.matchScore || 0;
                const bd = cand.evaluation?.breakdown || {};

                return (
                  <div
                    key={cand._id}
                    className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center">
                          {cand.student?.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm leading-tight">
                            {cand.student?.name}
                          </p>
                          <p className="text-[11px] text-gray-500">{cand.jobRole}</p>
                        </div>
                      </div>

                      {/* Score Card */}
                      <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200 text-center">
                        <p className="text-3xl font-black text-blue-600">{score}%</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Match Score</p>
                      </div>

                      {/* Breakdown Bars */}
                      <div className="space-y-2 mb-4 text-[11px]">
                        <div>
                          <div className="flex justify-between font-semibold">
                            <span>Skills Alignment:</span>
                            <span>{bd.skillAlignment || 0}/35</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full"
                              style={{ width: `${((bd.skillAlignment || 0) / 35) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-semibold">
                            <span>Projects & Practical:</span>
                            <span>{bd.practicalExperience || 0}/25</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full"
                              style={{ width: `${((bd.practicalExperience || 0) / 25) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-semibold">
                            <span>Work/Internship:</span>
                            <span>{bd.workExperience || 0}/20</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full"
                              style={{ width: `${((bd.workExperience || 0) / 20) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Experience and Skills */}
                      <div className="mb-4 text-xs">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                        <p className="font-semibold text-gray-800">{cand.student?.yearsOfExperience || 0} years</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {(cand.student?.skills || []).map((sk, idx) => (
                            <span key={idx} className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Decision Button */}
                    <div className="pt-4 border-t border-gray-200 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(cand._id, "Shortlisted")}
                        className="w-full py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition cursor-pointer"
                      >
                        Shortlist Candidate
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(cand._id, "Accepted")}
                        className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                      >
                        Accept & Refer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CREATE REFERRAL OPPORTUNITY (PHASE 2)
          ========================================================================= */}
      {showCreateOppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateOppModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 text-xl font-bold rounded-full cursor-pointer"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Referrer Opportunity Creator
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                Post a Referral Opportunity
              </h2>
              <p className="text-xs text-gray-500">
                Specify job requirements and application capacity. Gemini will evaluate applicants against these criteria.
              </p>
            </div>

            {createOppError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {createOppError}
              </div>
            )}

            <form onSubmit={handleCreateOpportunity} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={oppForm.company}
                    onChange={(e) => setOppForm({ ...oppForm, company: e.target.value })}
                    placeholder="e.g. Google, Microsoft, Stripe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Job Title & Role
                  </label>
                  <input
                    type="text"
                    required
                    value={oppForm.title}
                    onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Job Description & Scope
                </label>
                <textarea
                  rows={3}
                  required
                  value={oppForm.description}
                  onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })}
                  placeholder="Summarize the core technical responsibilities, engineering expectations, and day-to-day work..."
                  className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Required Technical Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={oppForm.requiredSkills}
                  onChange={(e) => setOppForm({ ...oppForm, requiredSkills: e.target.value })}
                  placeholder="React, TypeScript, Node.js, GraphQL, PostgreSQL"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Min Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={oppForm.minExperience}
                    onChange={(e) => setOppForm({ ...oppForm, minExperience: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Max Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={oppForm.maxExperience}
                    onChange={(e) => setOppForm({ ...oppForm, maxExperience: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Max Applications Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={oppForm.maxApplications}
                    onChange={(e) => setOppForm({ ...oppForm, maxApplications: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Educational Eligibility
                </label>
                <input
                  type="text"
                  value={oppForm.educationRequirements}
                  onChange={(e) => setOppForm({ ...oppForm, educationRequirements: e.target.value })}
                  placeholder="e.g. B.Tech / B.S. in Computer Science or equivalent practical background"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Mandatory Requirements (Semicolon-separated, optional)
                </label>
                <input
                  type="text"
                  value={oppForm.mandatoryRequirements}
                  onChange={(e) => setOppForm({ ...oppForm, mandatoryRequirements: e.target.value })}
                  placeholder="e.g. Must have production React experience; Available for full-time role"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={creatingOpp}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {creatingOpp ? "Posting Opportunity..." : "Publish Referral Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
