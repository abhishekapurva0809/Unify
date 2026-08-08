import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await login({ email, password });

      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#131B2E] flex items-center justify-center p-6 selection:bg-[#4F46E5] selection:text-white relative overflow-hidden">
      {/* Subtle Parallax Background Atmosphere Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4F46E5]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6063EE]/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="w-full max-w-[440px] z-10">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
          {/* Brand Logo & Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <Link to="/" className="inline-block">
              <div className="w-12 h-12 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-[#4F46E5]/20 hover:scale-105 transition-transform">
                U
              </div>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#131B2E]">Unify</h1>
              <p className="text-sm text-[#464555] mt-1 font-medium">Welcome back</p>
            </div>
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#131B2E] hover:bg-[#F2F3FF] transition-colors"
              >
                <span>🌐</span> Google
              </button>
              <button 
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#131B2E] hover:bg-[#F2F3FF] transition-colors"
              >
                <span>💻</span> GitHub
              </button>
            </div>

            <div className="flex items-center gap-3 py-2">
              <div className="h-[1px] bg-[#E2E8F0] flex-1" />
              <span className="text-[11px] font-semibold text-[#777587] uppercase tracking-wider">or continue with email</span>
              <div className="h-[1px] bg-[#E2E8F0] flex-1" />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#131B2E]" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#131B2E] placeholder-[#777587] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#131B2E]" htmlFor="password">Password</label>
                <a href="#" className="text-xs font-semibold text-[#4F46E5] hover:underline">Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#131B2E] placeholder-[#777587] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-[#4F46E5] hover:bg-[#3525CD] text-white font-bold rounded-xl shadow-md shadow-[#4F46E5]/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-xs text-[#464555]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#4F46E5] font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
