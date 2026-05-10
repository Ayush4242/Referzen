import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Referrers() {
  const navigate = useNavigate();
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  useEffect(() => {
    fetchReferrers();
  }, []);

  const fetchReferrers = async () => {
    try {
      const res = await API.get("/auth/users");
      const filtered = res.data.filter((u) => u.role === "referrer");
      setReferrers(filtered);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique companies for filter
  const companies = [...new Set(referrers.map(r => r.company).filter(Boolean))];

  // Filter referrers based on search and company
  const filteredReferrers = referrers.filter(referrer => {
    const matchesSearch = referrer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          referrer.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          referrer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          referrer.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCompany = !selectedCompany || referrer.company === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const handleRequestReferral = (referrer) => {
    navigate("/create-referral", { state: { selectedReferrer: referrer } });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900">
      {/* Dynamic Header Section */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tighter text-gray-900">
              Refer
            </span>
            <span className="text-2xl font-light text-blue-500 tracking-tighter">
              Zen
            </span>
          </div>
          <nav className="hidden md:flex gap-8">
            {['Dashboard', 'My Referrals', 'Network', 'Resources'].map((item) => (
              <span key={item} className="text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-blue-600 transition-colors cursor-pointer">
                {item}
              </span>
            ))}
          </nav>
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">
            S
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12 relative overflow-hidden rounded-3xl bg-white border border-gray-200 text-gray-900 p-10 md:p-14 shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gray-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 absolute"></span>
              <span className="text-xs font-medium tracking-wide text-blue-700 uppercase">Live Network</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Champion</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl leading-relaxed">
              Connect with top-tier industry professionals from leading tech companies. Their referral is your golden ticket to your next big career leap.
            </p>
          </div>
        </div>

        {/* Search and Filter Bar - Glassmorphism */}
        <div className="mb-10 flex flex-col md:flex-row gap-4 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm sticky top-24 z-10">
          <div className="flex-1 relative group">
            <input
              type="text"
              placeholder="Search experts by name, role, company, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/80 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner pl-12"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="relative">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full md:w-64 px-5 py-4 rounded-xl bg-white/80 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner appearance-none cursor-pointer"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-gray-900 border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-sm font-medium text-gray-500 uppercase tracking-widest">Discovering experts...</p>
          </div>
        ) : filteredReferrers.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No referrers match your criteria</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search terms or clearing the company filter to explore more experts.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCompany(''); }}
              className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 font-semibold rounded-full hover:bg-blue-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReferrers.map((referrer, index) => (
              <div
                key={referrer._id}
                className="group bg-white rounded-3xl border border-gray-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col relative"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                {/* Status Indicator */}
                <div className="absolute top-5 right-5 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full border border-gray-100 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${referrer.availability ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    {referrer.availability ? 'Accepting' : 'Busy'}
                  </span>
                </div>

                {/* Cover Image/Gradient Pattern */}
                <div className="h-28 bg-gradient-to-br from-blue-50 via-white to-gray-50 relative overflow-hidden border-b border-gray-100">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_#9ca3af_1px,_transparent_1px)] bg-[length:16px_16px]"></div>
                </div>
                
                <div className="p-6 md:p-8 pt-0 flex-1 flex flex-col">
                  {/* Avatar - overlapping cover */}
                  <div className="relative -mt-12 mb-4 w-fit">
                    <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-md transform group-hover:scale-105 transition-transform duration-500 rotate-3 group-hover:rotate-0">
                      <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center text-3xl font-extrabold text-white">
                        {referrer.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Identity */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                      {referrer.name}
                    </h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                      {referrer.designation || "Senior Professional"}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {referrer.company || "Independent"}
                      </div>
                      
                      {/* Score Badge */}
                      {(referrer.profileScore > 0 || referrer.points > 0) && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-700 border border-gray-200">
                          <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {referrer.points || referrer.profileScore || 100} Points
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTIVE SLOTS / OPENINGS */}
                  {referrer.activeSlots && referrer.activeSlots.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                       {referrer.activeSlots.map((slot, i) => (
                         <div key={i} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 transform hover:scale-105 transition-transform">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            ACTIVE ROLE: {slot}
                         </div>
                       ))}
                    </div>
                  )}

                  {/* Highlights Row */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-2xl font-black text-gray-900">{referrer.yearsOfExperience || "0"}+</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Years Exp.</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-2xl font-black text-gray-900">{referrer.skills?.length || 0}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top Skills</p>
                    </div>
                  </div>

                  {/* Skills Cloud */}
                  {referrer.skills && referrer.skills.length > 0 && (
                    <div className="mb-6 flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {referrer.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                        {referrer.skills.length > 5 && (
                          <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-gray-500 border border-gray-200 shadow-sm">
                            +{referrer.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {referrer.bio && (
                    <div className="mb-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative">
                      <svg className="absolute top-3 left-3 w-6 h-6 text-gray-100" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <p className="text-sm text-gray-600 leading-relaxed italic pl-8 line-clamp-3">
                        {referrer.bio}
                      </p>
                    </div>
                  )}

                  {/* Social & Action Footer */}
                  <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex gap-3">
                        {referrer.linkedin && (
                          <a
                            href={referrer.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors border border-blue-100"
                            title="LinkedIn Profile"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                          </a>
                        )}
                        {referrer.github && (
                          <a
                            href={referrer.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-gray-50 text-gray-700 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors border border-gray-200"
                            title="GitHub Profile"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                          </a>
                        )}
                        {(!referrer.linkedin && !referrer.github) && (
                          <span className="text-[11px] text-gray-400 italic py-2">No social links provided</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRequestReferral(referrer)}
                        disabled={!referrer.availability}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-300 ${
                          referrer.availability 
                            ? 'bg-gray-900 hover:bg-gray-800 text-white hover:shadow-md hover:-translate-y-0.5' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                      >
                        {referrer.availability ? (
                          <>
                            Request Referral
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        ) : (
                          'Currently Unavailable'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {!loading && filteredReferrers.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Showing {filteredReferrers.length} of {referrers.length} top industry experts
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Referrers;