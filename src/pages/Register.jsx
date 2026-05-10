import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    skills: "",
    company: "",
    designation: "",
    yearsOfExperience: "",
    bio: "",
    linkedin: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map(skill => skill.trim()),
      };

      // Remove empty fields for referrer if not provided
      if (form.role === "student") {
        delete payload.company;
        delete payload.designation;
        delete payload.yearsOfExperience;
        delete payload.bio;
        delete payload.linkedin;
      }

      const res = await API.post("/auth/register", payload);
      console.log("Registration success:", res.data);
      
      alert("User Registered Successfully!");
      
      // Use navigate with replace to prevent back button issues
      navigate("/login", { replace: true });
      
    } catch (err) {
      console.log("Registration error:", err);
      setError(err.response?.data?.message || "Registration Failed");
      alert(err.response?.data?.message || "Registration Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline gap-0.5 mb-3">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">
              Refer
            </span>
            <span className="text-2xl font-light text-gray-300 tracking-tight">
              Zen
            </span>
          </div>
          <div className="flex gap-6 justify-center">
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

        {/* Registration Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-lg shadow-sm p-8"
        >
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-gray-400">
              Join the ReferZen community
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="hello@referzen.com"
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Password *
            </label>
            <input
              type="password"
              placeholder="Create a strong password"
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          </div>

          {/* Skills */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Skills *
            </label>
            <input
              type="text"
              placeholder="React, Node.js, MongoDB, Python"
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
              onChange={(e) =>
                setForm({ ...form, skills: e.target.value })
              }
              required
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Separate skills with commas
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              I want to *
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-colors cursor-pointer appearance-none"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              >
                <option value="student">Get Referrals (Student)</option>
                <option value="referrer">Give Referrals (Referrer)</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Referrer Specific Fields */}
          {form.role === "referrer" && (
            <div className="space-y-4 border-t border-gray-100 pt-4 mt-2">
              <div className="text-xs font-medium text-gray-500 mb-2">
                Referrer Information
              </div>
              
              {/* Company */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Google, Amazon, Microsoft"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  required={form.role === "referrer"}
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Designation *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Senior Software Engineer, Tech Lead"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                  value={form.designation}
                  onChange={(e) =>
                    setForm({ ...form, designation: e.target.value })
                  }
                  required={form.role === "referrer"}
                />
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 5"
                  min="0"
                  max="50"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                  value={form.yearsOfExperience}
                  onChange={(e) =>
                    setForm({ ...form, yearsOfExperience: e.target.value })
                  }
                  required={form.role === "referrer"}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Short Bio *
                </label>
                <textarea
                  placeholder="Tell students about yourself, your expertise, and what kind of roles you can refer for..."
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors resize-none"
                  value={form.bio}
                  onChange={(e) =>
                    setForm({ ...form, bio: e.target.value })
                  }
                  required={form.role === "referrer"}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  This will help students understand your background
                </p>
              </div>

              {/* LinkedIn URL */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                  value={form.linkedin}
                  onChange={(e) =>
                    setForm({ ...form, linkedin: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 py-2.5 rounded-lg text-white text-sm font-medium mt-6"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-gray-900 font-medium hover:text-gray-600 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>

        {/* Info Note */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-gray-400">
            By creating an account, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;