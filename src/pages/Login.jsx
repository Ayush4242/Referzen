import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import API from "../services/api.js";
import { AuthContext } from "../context/AuthContext.jsx";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      login(res.data);
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      // Redirect based on user role
      const redirectPath = res.data.user.role === "referrer" ? "/referrer-dashboard" : "/dashboard";
      navigate(redirectPath);
    } catch (err) {
      console.log(err);
      alert(err.response?.data || "Invalid Credentials");
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setForm(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Google OAuth Handler
  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = `${API.defaults.baseURL}/auth/google`;
  };

  // GitHub OAuth Handler
  const handleGithubLogin = () => {
    // Redirect to GitHub OAuth endpoint
    window.location.href = `${API.defaults.baseURL}/auth/github`;
  };

  // Demo login for testing
  const handleDemoLogin = () => {
    setForm({
      email: "demo@referzen.com",
      password: "demo123",
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
      {/* Main container - matches dashboard styling */}
      <div className="w-full max-w-md px-4">
        {/* Brand header - identical to dashboard sidebar */}
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

        {/* Form Card - matches dashboard card styling */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-lg shadow-sm p-8"
        >
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-gray-400">
              Sign in to continue to your account
            </p>
          </div>

          {/* Email input */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
              placeholder="hello@referzen.com"
              required
            />
          </div>

          {/* Password input */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me and Forgot password */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Remember me
              </span>
            </label>
            
            <button
              type="button"
              className="text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wide"
              onClick={() => alert("Password reset link will be sent to your email")}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit button - matches dashboard button styling */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 py-2.5 rounded-lg text-white text-sm font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Demo Account Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full mt-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Try Demo Account
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 text-[11px] uppercase tracking-wide">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social login buttons - with working OAuth */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 text-sm hover:bg-gray-100 transition-colors group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={handleGithubLogin}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 text-sm hover:bg-gray-100 transition-colors group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:scale-105" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.296 2.75-1.026 2.75-1.026.544 1.378.201 2.397.098 2.65.64.7 1.029 1.595 1.029 2.688 0 3.846-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Sign up link - Now navigates to register page */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-gray-900 font-medium hover:text-gray-600 transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Additional Links */}
          <div className="mt-4 text-center flex items-center justify-center gap-3">
            <Link
              to="/terms"
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Terms
            </Link>
            <span className="text-[10px] text-gray-300">•</span>
            <Link
              to="/privacy"
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Privacy
            </Link>
            <span className="text-[10px] text-gray-300">•</span>
            <Link
              to="/help"
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Help
            </Link>
          </div>
        </form>

        {/* Weather widget matching your image */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-xs text-gray-400">29°C</span>
          <span className="text-xs text-gray-300">•</span>
          <span className="text-xs text-gray-400 uppercase tracking-wide">Clear</span>
        </div>

        {/* Security Note */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-400">
            🔒 Secure login with 256-bit encryption
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;