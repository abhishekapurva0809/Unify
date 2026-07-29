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
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      {/* Decorative Atmosphere Glow Effects */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] opacity-15 blur-[140px] rounded-full bg-indigo-600 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] opacity-10 blur-[120px] rounded-full bg-purple-600 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-950/50">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform">
              U
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm mt-2">Sign in to your Unify account</p>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="alex@unify.com"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-300">Password</label>
            </div>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
