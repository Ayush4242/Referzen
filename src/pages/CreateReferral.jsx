import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

function CreateReferral() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedReferrer, setSelectedReferrer] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    company: "",
    jobRole: "",
    message: "",
    referrer: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/auth/users");
      // Filter only users with role 'referrer'
      const referrers = res.data.filter((u) => u.role === "referrer");
      setUsers(referrers);
      console.log("Fetched referrers:", referrers); // Debug log
    } catch (err) {
      console.log("Error fetching referrers:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.referrer) {
      alert("Please select a referrer");
      return;
    }
    
    setIsLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!user || !user._id) {
        alert("User not found. Please login again.");
        navigate("/login");
        return;
      }

      const payload = {
        company: form.company,
        jobRole: form.jobRole,
        message: form.message,
        referrer: form.referrer,
        student: user._id,
        resume: user.resume || "resume_not_found.pdf",
        status: "pending",
        matchScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
      };

      const res = await API.post("/referrals/create", payload);
      console.log("Referral created:", res.data);
      
      alert("Referral Request Sent Successfully!");
      
      // Reset form
      setForm({
        company: "",
        jobRole: "",
        message: "",
        referrer: "",
      });
      setSelectedReferrer("");
      
      // Navigate back to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.log("Error creating referral:", err);
      alert(err.response?.data?.message || "Failed to create referral. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter referrers based on search term
  const filteredReferrers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex items-baseline gap-0.5 mb-2">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">
              Refer
            </span>
            <span className="text-2xl font-light text-blue-500 tracking-tight">
              Zen
            </span>
          </div>
          <div className="flex gap-6">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              Referrals
            </span>
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              Mentorship
            </span>
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              Careers
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-50">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Create New Referral
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Fill in the details to request a referral from a referrer
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Company Name */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={form.company}
                placeholder="e.g., Google, Amazon, Microsoft"
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                onChange={(e) =>
                  setForm({
                    ...form,
                    company: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* Job Role */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                Job Role *
              </label>
              <input
                type="text"
                value={form.jobRole}
                placeholder="e.g., Frontend Developer, SDE Intern"
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                onChange={(e) =>
                  setForm({
                    ...form,
                    jobRole: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* Select Referrer - Enhanced */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                Select Referrer *
              </label>
              
              {/* Search input for referrers */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search referrers by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors pl-9"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Referrer Cards */}
              {isFetching ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading referrers...</p>
                </div>
              ) : filteredReferrers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">
                    {users.length === 0 
                      ? "No referrers available at the moment." 
                      : "No referrers match your search."}
                  </p>
                  {users.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Check back later or contact support.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-2">
                  {filteredReferrers.map((user) => (
                    <label
                      key={user._id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        form.referrer === user._id
                          ? "bg-gray-100 border-2 border-gray-300"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="referrer"
                        value={user._id}
                        checked={form.referrer === user._id}
                        onChange={(e) => {
                          setForm({ ...form, referrer: e.target.value });
                          setSelectedReferrer(user.name);
                        }}
                        className="mt-1 w-4 h-4 text-gray-900 focus:ring-gray-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {user.name}
                          </p>
                          {user.company && (
                            <span className="text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded">
                              {user.company}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.department && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {user.department}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              {form.referrer && selectedReferrer && (
                <p className="mt-2 text-xs text-green-600">
                  ✓ You've selected {selectedReferrer} as your referrer
                </p>
              )}
            </div>

            {/* Referral Message */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                Referral Message *
              </label>
              <textarea
                value={form.message}
                placeholder="Dear [Referrer Name], I'm reaching out because I'm very interested in the [Job Role] position at [Company]..."
                rows="5"
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors resize-none"
                onChange={(e) =>
                  setForm({
                    ...form,
                    message: e.target.value,
                  })
                }
                required
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Tip: Personalize your message, mention your skills, and explain why you're interested in this role.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || users.length === 0 || !form.referrer}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 py-2.5 rounded-lg text-white text-sm font-medium mt-6"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Referral Request...
                </div>
              ) : (
                "Send Referral Request"
              )}
            </button>
          </form>
        </div>

        {/* Info Card - How it works */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
                How Referrals Work
              </h3>
              <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Browse and select a referrer from the list above</li>
                <li>Fill in the company and job role you're applying for</li>
                <li>Write a personalized message to the referrer</li>
                <li>Send the request - the referrer will review and respond</li>
                <li>Once accepted, they'll help refer you to the position</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateReferral;