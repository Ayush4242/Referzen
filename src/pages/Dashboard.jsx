import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: 'Total Referrals',
      value: '0',
      change: '+0%',
      trend: 'up',
    },
    {
      title: 'Interview Calls',
      value: '0',
      change: '+0%',
      trend: 'up',
    },
    {
      title: 'Successful Matches',
      value: '0',
      change: '+0%',
      trend: 'up',
    },
    {
      title: 'Profile Score',
      value: '89%',
      change: 'Top 5%',
      trend: 'neutral',
    },
  ]);

  // Status styles mapping
  const statusStyles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    "Under Review": 'bg-blue-50 text-blue-700 border-blue-200',
    Shortlisted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Interview: 'bg-blue-50 text-blue-700 border-blue-200',
    Selected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    "under review": 'bg-blue-50 text-blue-700 border-blue-200',
    shortlisted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    interview: 'bg-blue-50 text-blue-700 border-blue-200',
    selected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
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

      const res = await API.get(`/referrals/student/${user._id}`);
      setReferrals(res.data);
      
      // Update stats based on fetched data
      updateStats(res.data);
    } catch (err) {
      console.log("Error fetching referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic stats from referrals data
  const updateStats = (referralsData) => {
    const total = referralsData.length;
    const interviewCalls = referralsData.filter(r => 
      r.status?.toLowerCase() === 'interview' || 
      r.status === 'Interview'
    ).length;
    const successfulMatches = referralsData.filter(r => 
      r.status?.toLowerCase() === 'selected' || 
      r.status === 'Selected'
    ).length;
    
    // Calculate Profile Score dynamically based on completeness
    let pScore = 0;
    if (currentUser.name) pScore += 15;
    if (currentUser.email) pScore += 15;
    if (currentUser.bio) pScore += 20;
    if (currentUser.skills?.length > 0) pScore += 20;
    if (currentUser.linkedin) pScore += 10;
    if (currentUser.github) pScore += 10;
    if (currentUser.resume) pScore += 10;

    setStats([
      {
        title: 'Total Referrals',
        value: total.toString(),
        change: total > 0 ? `+${Math.round((total / 10) * 100)}%` : '+0%',
        trend: 'up',
      },
      {
        title: 'Interview Calls',
        value: interviewCalls.toString(),
        change: interviewCalls > 0 ? `+${Math.round((interviewCalls / 5) * 100)}%` : '+0%',
        trend: 'up',
      },
      {
        title: 'Successful Matches',
        value: successfulMatches.toString(),
        change: successfulMatches > 0 ? `+${Math.round((successfulMatches / 3) * 100)}%` : '+0%',
        trend: 'up',
      },
      {
        title: 'Profile Score',
        value: `${pScore}%`,
        change: pScore >= 80 ? 'Excellent' : pScore >= 50 ? 'Good Progress' : 'Needs Setup',
        trend: 'neutral',
      },
    ]);
  };

  // Navigate to create referral page
  const handleNewReferral = () => {
    navigate('/create-referral');
  };

  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  // Helper function to get status message
  const getStatusMessage = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'Waiting for referrer response';
      case 'under review':
        return 'Referrer is reviewing your profile & evidence';
      case 'shortlisted':
        return 'You are shortlisted by the referrer! ⭐';
      case 'accepted':
        return 'Referrer accepted! They will help you';
      case 'interview':
        return 'Interview scheduled! Good luck!';
      case 'selected':
        return 'Congratulations! You got selected! 🎉';
      case 'rejected':
        return 'Not selected this time. Keep trying!';
      default:
        return 'Status pending';
    }
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
              'Find Referrers',
              'My Referrals',
              'Leaderboard',
              'Analytics',
              'Messages',
              'AI Assistant',
              'Settings',
            ].map((item) => {
              const paths = {
                Dashboard: '/dashboard',
                'Find Referrers': '/referrers',
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

        {/* Bottom widget — minimal dark card */}
        <div className="m-4 p-4 bg-gray-900 rounded-xl">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            AI Match
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Smart recommendations based on your profile
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-50/30">
        {/* Top bar — clean, border only */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          {/* left: breadcrumb / welcome minimal */}
          <div>
            <h1 className="text-sm font-medium text-gray-900">Student Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Track your referral requests</p>
          </div>

          {/* right: search + avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search companies..."
                className="w-64 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold">
              {currentUser.name?.[0]?.toUpperCase() || 'S'}
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
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                animation: 'slideMarquee 22s linear infinite',
              }}
              onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
              onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
            >
              {/* First set */}
              <div className="flex items-center gap-8 pr-8">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Google</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Meta</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Microsoft</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Apple</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Amazon</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Netflix</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Referral</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Success</span>
                <span className="text-gray-300">/</span>
                <span className="text-[11px] font-medium text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full">
                  TOP MATCHED
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

          {/* Referral Table - Student View (Read Only) */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] mb-12 overflow-hidden shadow-sm">
            <div className="px-8 py-7 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-black text-[#0f172a] tracking-tight">My Referral Requests</h2>
                <p className="text-xs text-gray-400 mt-1">Track the status of your applications in real-time</p>
              </div>
              <button 
                onClick={handleNewReferral}
                className="text-[10px] font-black bg-[#0f172a] text-white px-6 py-3 rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-900/20"
              >
                + New Referral
              </button>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-sm text-gray-500">Loading referrals...</p>
              </div>
            ) : referrals.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500 mb-4">No referrals yet</p>
                <button 
                  onClick={handleNewReferral}
                  className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
                >
                  Create your first referral
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/20">
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Company</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Referrer</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Match</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr 
                        key={referral._id} 
                        className="border-b border-gray-50 hover:bg-gray-50/30 transition"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {referral.company}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {referral.jobRole}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {referral.referrer?.name || 'Waiting for assignment'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20 bg-gray-100 rounded-full h-1 overflow-hidden">
                              <div 
                                className="bg-gray-700 h-full rounded-full"
                                style={{ width: `${referral.matchScore || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {referral.matchScore || 0}%
                            </span>
                          </div>
                         </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                              statusStyles[referral.status] || statusStyles.Pending
                            }`}>
                              {referral.status || 'Pending'}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {getStatusMessage(referral.status)}
                            </p>
                          </div>
                         </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-500 max-w-xs truncate" title={referral.message}>
                            {referral.message?.substring(0, 60)}...
                          </p>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FULL-WIDTH RECTANGULAR MARKET INSIGHTS */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Market Insights</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Live Technical Trends & Hiring Data</p>
               </div>
               <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
            </div>

            {/* Vertical Scrolling Container - Rectangular Frame */}
            <div className="flex-1 relative overflow-hidden bg-gray-50/10 rounded-[2rem] border border-gray-50 p-6">
              <style>{`
                @keyframes verticalScroll {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(-50%); }
                }
              `}</style>
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                style={{
                  animation: 'verticalScroll 18s linear infinite',
                }}
              >
                {[
                  { tag: 'HIRING', text: 'Google Cloud is expanding its AI engineering teams in Bangalore and Hyderabad.', color: 'text-blue-600 bg-blue-50' },
                  { tag: 'TREND', text: 'Full-stack developers with Next.js expertise seeing 40% higher referral acceptance.', color: 'text-emerald-600 bg-emerald-50' },
                  { tag: 'MARKET', text: 'Tech sector stabilizing: Q3 referral volume up by 25% across Tier-1 companies.', color: 'text-purple-600 bg-purple-50' },
                  { tag: 'ADVICE', text: 'Referrers prioritize candidates with updated GitHub contributions in the last 30 days.', color: 'text-amber-600 bg-amber-50' },
                  { tag: 'NEWS', text: 'Microsoft announces new "Referral First" policy for senior engineering roles.', color: 'text-indigo-600 bg-indigo-50' },
                  { tag: 'DATA', text: 'Java and Spring Boot remain the most requested skills for backend referrals.', color: 'text-red-600 bg-red-50' },
                ].concat([
                  { tag: 'HIRING', text: 'Google Cloud is expanding its AI engineering teams in Bangalore and Hyderabad.', color: 'text-blue-600 bg-blue-50' },
                  { tag: 'TREND', text: 'Full-stack developers with Next.js expertise seeing 40% higher referral acceptance.', color: 'text-emerald-600 bg-emerald-50' },
                  { tag: 'MARKET', text: 'Tech sector stabilizing: Q3 referral volume up by 25% across Tier-1 companies.', color: 'text-purple-600 bg-purple-50' },
                  { tag: 'ADVICE', text: 'Referrers prioritize candidates with updated GitHub contributions in the last 30 days.', color: 'text-amber-600 bg-amber-50' },
                  { tag: 'NEWS', text: 'Microsoft announces new "Referral First" policy for senior engineering roles.', color: 'text-indigo-600 bg-indigo-50' },
                  { tag: 'DATA', text: 'Java and Spring Boot remain the most requested skills for backend referrals.', color: 'text-red-600 bg-red-50' },
                ]).map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-50 bg-white shadow-sm flex gap-4 items-center group hover:border-blue-100 transition-colors">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md shrink-0 ${item.color}`}>
                      {item.tag}
                    </span>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Fade Overlays */}
              <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-gray-50/80 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-gray-50/80 to-transparent z-10 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}