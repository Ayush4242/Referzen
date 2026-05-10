import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function ReferrerDashboard() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [referrerPoints, setReferrerPoints] = useState(currentUser.points || 0);
  const [stats, setStats] = useState([
    {
      title: 'Requests Received',
      value: '0',
      change: '+0%',
      trend: 'up',
    },
    {
      title: 'Accepted',
      value: '0',
      change: '+0%',
      trend: 'up',
    },
    {
      title: 'Referral Points',
      value: (currentUser.points || 0).toString(),
      change: '+0pts',
      trend: 'up',
    },
    {
      title: 'Success Rate',
      value: '0%',
      change: 'Good',
      trend: 'neutral',
    },
    {
      title: 'Projected Bonus',
      value: '$0',
      change: 'Internal',
      trend: 'up',
    },
  ]);

  // Status styles mapping
  const statusStyles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Interview: 'bg-blue-50 text-blue-700 border-blue-200',
    Selected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    interview: 'bg-blue-50 text-blue-700 border-blue-200',
    selected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  // Inline style for animation
  const marqueeStyle = `
    @keyframes slideMarquee {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }
  `;

  // Fetch referrals on component mount
  useEffect(() => {
    if (!currentUser?._id) {
      navigate("/");
      return;
    }

    if (currentUser.role !== "referrer") {
      navigate("/my-referrals");
      return;
    }

    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!user || !user._id) {
        console.log("No user found");
        setLoading(false);
        return;
      }

      const res = await API.get(`/referrals/referrer/${user._id}`);
      setReferrals(res.data);
      
      // Update stats based on fetched data
      updateStats(res.data);
    } catch (err) {
      console.log("Error fetching referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (referralId, status) => {
    setUpdatingId(referralId);

    try {
      const res = await API.put(`/referrals/${referralId}/status`, { status });
      let updatedPoints = referrerPoints;

      if (res.data.referrer && res.data.referrer._id === currentUser._id) {
        updatedPoints = res.data.referrer.points || referrerPoints;
        setReferrerPoints(updatedPoints);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...currentUser, points: updatedPoints })
        );
      }

      setReferrals((current) => {
        const newData = current.map((referral) =>
          referral._id === referralId ? res.data : referral
        );
        updateStats(newData, updatedPoints);
        return newData;
      });
    } catch (err) {
      console.log("Error updating referral status:", err);
      alert(err.response?.data?.message || err.response?.data || err.message || "Could not update referral status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStudent(null);
  };

  const getResumeUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = API.defaults.baseURL.replace("/api", "");
    return `${baseUrl}${path}`;
  };

  // Calculate dynamic stats from referrals data
  const updateStats = (referralsData, points = referrerPoints) => {
    const total = referralsData.length;
    const accepted = referralsData.filter(r => r.status?.toLowerCase() === 'accepted').length;
    const rejected = referralsData.filter(r => r.status?.toLowerCase() === 'rejected').length;
    
    const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    
    setStats([
      {
        title: 'Requests Received',
        value: total.toString(),
        change: total > 0 ? `+${Math.round((total / 10) * 100)}%` : '+0%',
        trend: 'up',
      },
      {
        title: 'Accepted',
        value: accepted.toString(),
        change: accepted > 0 ? `+${Math.round((accepted / 5) * 100)}%` : '+0%',
        trend: 'up',
      },
      {
        title: 'Referral Points',
        value: points.toString(),
        change: points > 0 ? `+${points}pts` : '+0pts',
        trend: 'up',
      },
      {
        title: 'Success Rate',
        value: `${successRate}%`,
        change: successRate >= 70 ? 'Excellent' : successRate >= 50 ? 'Good' : 'Needs Improvement',
        trend: 'neutral',
      },
      {
        title: 'Projected Bonus',
        value: `$${(accepted * 1500).toLocaleString()}`,
        change: 'Est. Internal',
        trend: 'up',
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex font-['Inter',_system-ui,_-apple-system,_BlinkMacSystemFont,_'Segoe_UI',_Roboto,_sans-serif] antialiased">
      {/* Add style tag for keyframes */}
      <style>{marqueeStyle}</style>
      
      {/* SIDEBAR — refined, minimal, structural */}
      <aside className="w-[280px] bg-white border-r border-gray-100 flex flex-col justify-between sticky top-0 h-screen">
        <div>
          {/* Brand — restrained */}
          <div className="px-6 pt-8 pb-10 border-b border-gray-50">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-semibold tracking-tight text-gray-900">Refer</span>
              <span className="text-xl font-light text-gray-300 tracking-tight">Zen</span>
            </div>
            <div className="flex gap-4 mt-2">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Press-on</span>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Accessories</span>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Help</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-1">
            {[
              'Dashboard',
              'My Referrals',
              'Leaderboard',
              'Analytics',
              'Messages',
              'AI Assistant',
              'Settings',
            ].map((item) => {
              const paths = {
                Dashboard: '/referrer-dashboard',
                'My Referrals': '/my-referrals',
                Leaderboard: '/leaderboard',
                Analytics: '/analytics',
                Messages: '/messages',
                'AI Assistant': '/ai-assistant',
                Settings: '/settings',
              };

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => navigate(paths[item])}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                >
                  {item}
                </button>
              );
            })}
          </nav>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-50/30">
        {/* Top bar — clean, border only */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          {/* left: breadcrumb / welcome minimal */}
          <div>
            <h1 className="text-sm font-medium text-gray-900">Referrer Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage your referral requests</p>
          </div>

          {/* right: search + avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search requests..."
                className="w-64 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-semibold">
              {currentUser.name?.[0]?.toUpperCase() || 'R'}
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Stats row — clean cards with no excess */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat) => (
              <div key={stat.title} className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.title}</p>
                   <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                   </div>
                </div>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-black text-[#0f172a] tracking-tighter">{stat.value}</p>
                   <p className="text-xs font-bold text-emerald-500">{stat.change}</p>
                </div>
              </div>
            ))}
          </div>

          {/* MOVING EDITORIAL STRIP — animated version */}
          <div className="border-y border-gray-100 py-4 mb-10 bg-white relative overflow-hidden">
            <div 
              className="flex items-center"
              style={{
                width: 'max-content',
                animation: 'slideMarquee 28s linear infinite',
              }}
              onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
              onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
            >
              {/* First set */}
              <div className="flex items-center gap-8 pr-8">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Top Talent</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Verified Profiles</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Engineering</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Design</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Product</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Mentorship</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Impact</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full">
                  HIGH VELOCITY
                </span>
              </div>
              
              {/* Duplicate for seamless loop */}
              <div className="flex items-center gap-8 pr-8">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Spring</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">New Collection</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Button Mode</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">ELLE</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">PLAZA</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">FEMININE</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">DAISY</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">VOGUE</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
            </div>
          </div>

          {/* Referral Requests Table */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] mb-12 overflow-hidden shadow-sm">
            <div className="px-8 py-7 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-black text-[#0f172a] tracking-tight">Incoming Referral Requests</h2>
                <p className="text-xs text-gray-400 mt-1">Review and manage your pending student applications</p>
              </div>
              <div className="flex gap-3">
                <button className="text-[10px] font-black bg-[#0f172a] text-white px-6 py-3 rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-900/20">
                  Bulk Actions
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-sm text-gray-500">Loading requests...</p>
              </div>
            ) : referrals.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500 mb-4">No referral requests yet</p>
                <p className="text-xs text-gray-400">Requests will appear here when students ask for your referral</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/20">
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Company</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Message</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr 
                      key={referral._id} 
                      className="border-b border-gray-50 hover:bg-gray-50/30 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-semibold">
                            {referral.student?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {referral.student?.name || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {referral.student?.email || ''}
                            </p>
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {referral.company}
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {referral.jobRole}
                       </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                          {referral.message}
                        </p>
                       </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                          statusStyles[referral.status] || statusStyles.Pending
                        }`}>
                          {referral.status || 'Pending'}
                        </span>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewProfile(referral.student)}
                            className="text-xs font-medium rounded-lg px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(referral._id, 'Accepted')}
                            disabled={updatingId === referral._id || referral.status === 'Accepted'}
                            className="text-xs font-medium rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {updatingId === referral._id ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(referral._id, 'Interview')}
                            disabled={updatingId === referral._id || referral.status === 'Interview'}
                            className="text-xs font-medium rounded-lg px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {updatingId === referral._id && referral.status !== 'Interview' ? '...' : 'Interview'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(referral._id, 'Selected')}
                            disabled={updatingId === referral._id || referral.status === 'Selected'}
                            className="text-xs font-medium rounded-lg px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {updatingId === referral._id && referral.status !== 'Selected' ? '...' : 'Selected'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(referral._id, 'Rejected')}
                            disabled={updatingId === referral._id || referral.status === 'Rejected'}
                            className="text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {updatingId === referral._id && referral.status !== 'Rejected' ? '...' : 'Reject'}
                          </button>
                        </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PROJECTED REWARDS & CORPORATE ROI HUB */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-12 relative overflow-hidden shadow-2xl shadow-blue-900/20">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-indigo-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-10"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-16">
                
                {/* Left Side: Summary & Ticker */}
                <div className="flex-1 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Financial & Professional ROI</span>
                  </div>
                  <h2 className="text-white text-4xl font-black tracking-tight mb-6 leading-tight">
                    Projected <span className="text-blue-400">Corporate Rewards</span>
                  </h2>
                  <p className="text-blue-100/40 text-sm leading-relaxed mb-10 max-w-md">
                    ReferZen optimizes your time. By referring pre-vetted students with high profile scores, you maximize your internal corporate bonuses while spending 80% less time on manual vetting.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                       <p className="text-[10px] font-bold text-blue-300/50 uppercase tracking-widest mb-2">Est. Bonus Revenue</p>
                       <p className="text-4xl font-black text-white tracking-tighter mb-1">
                          ${(referrals.filter(r => r.status?.toLowerCase() === 'accepted').length * 1500).toLocaleString()}
                       </p>
                       <p className="text-[10px] text-blue-300/30 font-medium">Based on $1,500/hire company avg.</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                       <p className="text-[10px] font-bold text-blue-300/50 uppercase tracking-widest mb-2">Time Optimization</p>
                       <p className="text-4xl font-black text-emerald-400 tracking-tighter mb-1">
                          +{referrals.length * 15}m
                       </p>
                       <p className="text-[10px] text-blue-300/30 font-medium">Saved vs manual LinkedIn vetting</p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Tier & Progression */}
                <div className="w-full lg:w-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">
                      {referrals.filter(r => r.status?.toLowerCase() === 'accepted').length > 5 ? '🥇' : '🥈'}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg tracking-tight">
                        {referrals.filter(r => r.status?.toLowerCase() === 'accepted').length > 5 ? 'Elite Talent Scout' : 'Professional Referrer'}
                      </h3>
                      <p className="text-blue-300/40 text-[10px] font-bold uppercase tracking-widest">Referrer Tier 02</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-end mb-3">
                         <p className="text-[10px] font-bold text-white uppercase tracking-widest">Network Authority</p>
                         <p className="text-xs font-black text-blue-400">88%</p>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-[88%] shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Platform Advantage</h4>
                      <p className="text-xs text-blue-100/40 leading-relaxed">
                        Your candidates have an average Profile Score of 92%. This places your referrals in the **Top 5%** of the company's applicant pool.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/analytics')}
                    className="w-full mt-8 py-4 bg-white text-[#0f172a] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-50 transition-colors shadow-xl"
                  >
                    View Talent ROI Report
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Student Profile Modal - Beautified Version */}
      {showProfileModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
            {/* Modal Header with Gradient Accent */}
            <div className="relative">
              <div className="h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900"></div>
              <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-xl">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Student Profile</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Detailed information about the student</p>
                  </div>
                </div>
                <button
                  onClick={closeProfileModal}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:rotate-90 transform"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Profile Header with Avatar */}
              <div className="flex items-center gap-5 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {selectedStudent.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{selectedStudent.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Student
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">Member since {new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>

              {/* Skills Section with Icons */}
              {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                <div className="group">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-amber-50 rounded-lg">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Skills & Expertise</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {selectedStudent.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 hover:shadow-sm transition-all duration-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Info Card */}
              {(selectedStudent.company || selectedStudent.designation || selectedStudent.yearsOfExperience) && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <h4 className="text-sm font-semibold text-gray-900">Professional Information</h4>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedStudent.company && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">Company</span>
                        <span className="text-sm font-medium text-gray-900">{selectedStudent.company}</span>
                      </div>
                    )}
                    {selectedStudent.designation && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">Designation</span>
                        <span className="text-sm font-medium text-gray-900">{selectedStudent.designation}</span>
                      </div>
                    )}
                    {selectedStudent.yearsOfExperience && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-500">Experience</span>
                        <span className="text-sm font-medium text-gray-900">
                          <span className="text-lg font-bold">{selectedStudent.yearsOfExperience}</span> years
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bio Section */}
              {selectedStudent.bio && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-50 rounded-lg">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">About</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed ml-7 p-3 bg-gray-50 rounded-lg italic">
                    "{selectedStudent.bio}"
                  </p>
                </div>
              )}

              {/* Links Section: LinkedIn, GitHub, Resume */}
              {(selectedStudent.linkedin || selectedStudent.github || selectedStudent.resume) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Links & Documents</h4>
                  </div>
                  <div className="ml-7 flex flex-col gap-3">
                    {selectedStudent.linkedin && (
                      <a
                        href={selectedStudent.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline transition-colors"
                      >
                        <span className="text-sm">LinkedIn Profile</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    {selectedStudent.github && (
                      <a
                        href={selectedStudent.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 underline-offset-2 hover:underline transition-colors"
                      >
                        <span className="text-sm">GitHub Profile</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    {selectedStudent.resume && (
                      <a
                        href={getResumeUrl(selectedStudent.resume)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline transition-colors"
                      >
                        <span className="text-sm">View Uploaded CV</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Strength Score */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Profile Strength</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {(() => {
                      let score = 0;
                      if (selectedStudent.name) score += 15;
                      if (selectedStudent.email) score += 15;
                      if (selectedStudent.skills?.length > 0) score += 20;
                      if (selectedStudent.bio) score += 20;
                      if (selectedStudent.linkedin) score += 10;
                      if (selectedStudent.github) score += 10;
                      if (selectedStudent.resume) score += 10;
                      return selectedStudent.profileScore || score;
                    })()}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(() => {
                      let score = 0;
                      if (selectedStudent.name) score += 15;
                      if (selectedStudent.email) score += 15;
                      if (selectedStudent.skills?.length > 0) score += 20;
                      if (selectedStudent.bio) score += 20;
                      if (selectedStudent.linkedin) score += 10;
                      if (selectedStudent.github) score += 10;
                      if (selectedStudent.resume) score += 10;
                      return selectedStudent.profileScore || score;
                    })()}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {(() => {
                    let score = 0;
                    if (selectedStudent.name) score += 15;
                    if (selectedStudent.email) score += 15;
                    if (selectedStudent.skills?.length > 0) score += 20;
                    if (selectedStudent.bio) score += 20;
                    if (selectedStudent.linkedin) score += 10;
                    if (selectedStudent.github) score += 10;
                    if (selectedStudent.resume) score += 10;
                    const finalScore = selectedStudent.profileScore || score;
                    if (finalScore >= 80) return 'Excellent profile! 🎯';
                    if (finalScore >= 60) return 'Good profile, keep improving! 📈';
                    return 'Complete your profile for better opportunities 🚀';
                  })()}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={closeProfileModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeProfileModal();
                  // You can add additional action here like sending a message
                }}
                className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}