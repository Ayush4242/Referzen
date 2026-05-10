import { useContext, useEffect, useState } from "react";
import API from "../services/api.js";
import { AuthContext } from "../context/AuthContext.jsx";

// ─── SHARED UI COMPONENTS ──────────────────────────────────────────────────────
function SectionTitle({ title, subtitle, icon }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function InputField({ label, icon, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-11' : 'px-4'} py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none placeholder:text-gray-300`}
        />
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, updateUser } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "student",
    skills: "",
    company: "",
    designation: "",
    yearsOfExperience: "",
    bio: "",
    linkedin: "",
    github: "",
    activeSlots: "",
    availability: true,
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "student",
      skills: Array.isArray(user.skills) ? user.skills.join(", ") : user.skills || "",
      company: user.company || "",
      designation: user.designation || "",
      yearsOfExperience: user.yearsOfExperience?.toString() || "",
      bio: user.bio || "",
      linkedin: user.linkedin || "",
      github: user.github || "",
      activeSlots: Array.isArray(user.activeSlots) ? user.activeSlots.join(", ") : user.activeSlots || "",
      availability: user.availability !== undefined ? user.availability : true,
    });
  }, [user]);

  const isStudent = form.role === "student";

  // Calculate Profile Strength
  const calculateStrength = () => {
    let score = 0;
    if (form.name) score += 15;
    if (form.bio) score += 20;
    if (form.skills) score += 20;
    if (form.linkedin) score += 15;
    if (form.github) score += 15;
    if (isStudent && (user?.resume || resumeFile)) score += 15;
    if (!isStudent && form.company) score += 15;
    return Math.min(100, score);
  };

  const strength = calculateStrength();

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("skills", form.skills);
      formData.append("company", form.company || "");
      formData.append("designation", form.designation || "");
      formData.append("yearsOfExperience", form.yearsOfExperience || "0");
      formData.append("bio", form.bio);
      formData.append("linkedin", form.linkedin);
      formData.append("github", form.github);
      formData.append("activeSlots", form.activeSlots);
      formData.append("availability", String(form.availability));

      if (resumeFile && isStudent) {
        formData.append("resume", resumeFile);
      }

      const res = await API.put("/auth/profile", formData);
      updateUser(res.data);
      setStatusMessage("✨ Profile updated successfully!");
      setResumeFile(null);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage(err.response?.data?.message || "❌ Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) setResumeFile(file);
  };

  const getResumeUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = API.defaults.baseURL.replace("/api", "");
    return `${baseUrl}${path}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* PREMIUM HEADER */}
      <div className="bg-[#0f172a] pt-16 pb-28 px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-800 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-indigo-600 rounded-full mix-blend-overlay filter blur-[100px] opacity-20"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_0_4px_rgba(96,165,250,0.15)]" />
              <p className="text-blue-300 text-xs font-black uppercase tracking-[0.25em]">Personal Settings</p>
            </div>
            <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight mb-3">Manage Profile</h1>
            <p className="text-blue-100/60 text-sm md:text-base max-w-xl">
              Keep your information up to date to ensure the best matches and accurate point tracking.
            </p>
          </div>

          {/* Profile Strength Meter */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl w-full md:w-64 text-center">
             <div className="relative inline-block mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="226.2" strokeDashoffset={226.2 - (226.2 * strength) / 100} className="text-blue-400 transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-white font-black text-sm">
                  {strength}%
                </div>
             </div>
             <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">Profile Strength</p>
             <p className="text-blue-200/50 text-[10px] uppercase font-bold">{strength >= 80 ? "Perfect Status" : "Keep improving"}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: MAIN FORM */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-gray-100">
              
              <SectionTitle 
                title="Account Information" 
                subtitle="Your basic identity on the platform"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <InputField 
                  label="Full Name" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your name"
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <InputField 
                  label="Email Address" 
                  value={form.email}
                  disabled
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                />
              </div>

              <SectionTitle 
                title="Professional Presence" 
                subtitle="Links and experience details"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <InputField 
                  label="LinkedIn" 
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="Profile URL"
                />
                <InputField 
                  label="GitHub" 
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                  placeholder="Username/URL"
                />
                <InputField 
                  label="Skills" 
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="Comma separated"
                />
              </div>

              {!isStudent && (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <InputField 
                        label="Company" 
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Current company"
                      />
                      <InputField 
                        label="Designation" 
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        placeholder="Job title"
                      />
                      <InputField 
                        label="Experience (Yrs)" 
                        value={form.yearsOfExperience}
                        onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                        placeholder="e.g. 5"
                      />
                   </div>

                   <SectionTitle 
                     title="Active Referral Opportunities" 
                     subtitle="List the specific roles you can refer students for"
                     icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
                   />
                   <div className="space-y-1.5 mb-8">
                     <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Openings (Comma Separated)</label>
                     <textarea
                       value={form.activeSlots}
                       onChange={(e) => setForm({ ...form, activeSlots: e.target.value })}
                       rows={2}
                       placeholder="e.g. SDE-1, Product Manager, Frontend Intern..."
                       className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none"
                     />
                   </div>
                 </>
              )}

              <div className="space-y-1.5 mb-8">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Professional Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  placeholder="Share a short summary of your professional background..."
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none"
                />
              </div>

              {isStudent && (
                <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100">
                   <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-blue-900 tracking-tight">Resume / CV Management</h4>
                        <p className="text-xs text-blue-700/60">Upload your latest professional document</p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-blue-900 text-white px-2.5 py-1 rounded-lg">Student Profile</span>
                   </div>
                   <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          id="resume-upload"
                          className="hidden"
                        />
                        <label htmlFor="resume-upload" className="flex items-center justify-center gap-2 w-full bg-white border-2 border-dashed border-blue-200 rounded-2xl py-4 cursor-pointer hover:bg-blue-50 transition-colors group">
                           <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                           <span className="text-sm font-bold text-blue-800">{resumeFile ? resumeFile.name : "Select Document"}</span>
                        </label>
                      </div>
                      {user?.resume && !resumeFile && (
                        <a
                          href={getResumeUrl(user.resume)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-4 bg-blue-950 text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                        >
                          View Current CV
                        </a>
                      )}
                   </div>
                </div>
              )}
            </div>

            {/* SAVE ACTION BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md rounded-3xl p-4 border border-white">
              <p className={`text-sm font-bold transition-all ${statusMessage.includes('✨') ? 'text-emerald-600' : 'text-gray-500'}`}>
                {statusMessage}
              </p>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-[#0f172a] text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-blue-900/10"
              >
                {saving ? "Processing..." : "Save All Changes"}
              </button>
            </div>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-gray-100 text-center">
               <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0f172a] to-blue-800 flex items-center justify-center text-white text-5xl font-black shadow-2xl">
                    {user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
               </div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{user?.name}</h2>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{user?.role}</p>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Points</p>
                    <p className="text-2xl font-black text-gray-900">{user?.points ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Score</p>
                    <p className="text-2xl font-black text-blue-600">{strength}%</p>
                  </div>
               </div>
            </div>

            {!isStudent && (
              <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${form.availability ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center justify-between mb-6">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${form.availability ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                     {form.availability ? "⚡" : "🌙"}
                   </div>
                   <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, availability: !prev.availability }))}
                    className="w-12 h-6 bg-white/50 rounded-full relative p-1 group"
                   >
                     <div className={`w-4 h-4 rounded-full transition-all duration-300 ${form.availability ? 'translate-x-6 bg-emerald-600' : 'translate-x-0 bg-red-600'}`} />
                   </button>
                </div>
                <h4 className={`text-lg font-black tracking-tight mb-1 ${form.availability ? 'text-emerald-900' : 'text-red-900'}`}>
                  {form.availability ? "Available" : "On a break"}
                </h4>
                <p className={`text-xs font-medium leading-relaxed ${form.availability ? 'text-emerald-700/60' : 'text-red-700/60'}`}>
                  {form.availability 
                    ? "Students can see your profile and request new referrals." 
                    : "Your profile is hidden from the search results temporarily."}
                </p>
              </div>
            )}

            <div className="bg-[#0f172a] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <h3 className="text-lg font-black tracking-tight mb-2 relative z-10">Data Integrity</h3>
               <p className="text-xs text-white/50 leading-relaxed mb-6 relative z-10">
                 Accurate information leads to higher quality matches. Keeping your GitHub and skills updated helps AI find the best referrers for you.
               </p>
               <div className="h-1 bg-white/10 rounded-full relative z-10">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${strength}%` }} />
               </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        form { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
