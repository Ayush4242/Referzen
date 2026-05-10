import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-800 rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Leaderboard…</p>
    </div>
  );
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/auth/leaderboard")
      .then((res) => setLeaders(res.data || []))
      .catch((err) => console.log("Failed to load leaderboard", err))
      .finally(() => setLoading(false));
  }, []);

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const getRankStyle = (index) => {
    if (index === 0) return { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", icon: "🏆", badge: "bg-amber-500 text-white" };
    if (index === 1) return { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-600", icon: "🥈", badge: "bg-gray-400 text-white" };
    if (index === 2) return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "🥉", badge: "bg-orange-400 text-white" };
    return { bg: "bg-white", border: "border-gray-100", text: "text-gray-900", icon: "", badge: "bg-gray-100 text-gray-500" };
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* HEADER */}
      <div className="bg-[#0f172a] pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
            <span className="text-xl">🌟</span>
            <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em]">Wall of Fame</p>
          </div>
          <h1 className="text-white text-4xl md:text-6xl font-extrabold tracking-tight mb-4">Top Referrers</h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-2xl mx-auto">
            Celebrating the engineers and professionals who consistently help students break into tech. <strong className="text-white">Earn points by accepting requests and scheduling interviews!</strong>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-20 -mt-12">
        {loading ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10"><Spinner /></div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-24 px-6 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
            <div className="text-6xl mb-6">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No referrers yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">The leaderboard will populate once referrers start earning points.</p>
          </div>
        ) : (
          <>
            {/* TOP 3 PODIUM */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="order-2 md:order-1 transform hover:-translate-y-2 transition-transform">
                    <PodiumCard user={topThree[1]} rank={2} style={getRankStyle(1)} />
                  </div>
                )}
                {/* 1st Place */}
                {topThree[0] && (
                  <div className="order-1 md:order-2 transform hover:-translate-y-3 transition-transform md:-mt-8 relative z-10">
                    <PodiumCard user={topThree[0]} rank={1} style={getRankStyle(0)} isFirst={true} />
                  </div>
                )}
                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="order-3 md:order-3 transform hover:-translate-y-2 transition-transform">
                    <PodiumCard user={topThree[2]} rank={3} style={getRankStyle(2)} />
                  </div>
                )}
              </div>
            )}

            {/* REST OF THE LIST */}
            {rest.length > 0 && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Runners Up</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {rest.map((user, idx) => {
                    const actualRank = idx + 4;
                    return (
                      <div key={user._id} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-6">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 font-black flex items-center justify-center text-sm shadow-inner">
                            #{actualRank}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                              {user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-gray-900">{user.name}</h4>
                              <p className="text-xs text-gray-500">{user.designation || "Professional"} at <span className="font-semibold text-gray-700">{user.company || "Company"}</span></p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-blue-900">{user.points || 0}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Sub-component for Top 3 Cards
function PodiumCard({ user, rank, style, isFirst }) {
  return (
    <div className={`rounded-3xl p-6 md:p-8 border-2 shadow-lg relative ${style.bg} ${style.border}`}>
      {isFirst && (
        <div className="absolute -top-4 inset-x-0 flex justify-center">
          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-sm border border-yellow-300">
            Current Leader
          </span>
        </div>
      )}
      <div className="flex flex-col items-center text-center mt-2">
        <div className="relative mb-5">
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center text-3xl md:text-4xl shadow-md border-4 ${style.border}`}>
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className={`absolute -bottom-3 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ${style.badge}`}>
            #{rank}
          </div>
        </div>
        
        <h3 className={`text-xl md:text-2xl font-bold mb-1 ${style.text}`}>{user.name}</h3>
        <p className="text-xs font-medium text-gray-600 mb-6 px-4">
          {user.designation || "Professional"} at <br/><span className="font-bold text-gray-800">{user.company || "Company"}</span>
        </p>

        <div className="bg-white/60 rounded-2xl p-4 w-full border border-white/50 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <p className="text-3xl font-black text-gray-900 leading-none mb-1">{user.points || 0}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Points</p>
        </div>
      </div>
    </div>
  );
}
