import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const { name, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await register({ name, email, password });

      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      const message =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#131B2E] flex items-center justify-center p-6 selection:bg-[#4F46E5] selection:text-white relative overflow-hidden">
      {/* Background Atmosphere Elements */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] opacity-10 blur-[120px] rounded-full bg-[#4F46E5] pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] opacity-5 blur-[100px] rounded-full bg-[#6063EE] pointer-events-none" />

      <main className="w-full max-w-[480px]">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1 text-center">
            <Link to="/" className="inline-block mx-auto mb-2">
              <div className="w-12 h-12 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-[#4F46E5]/20">
                U
              </div>
            </Link>
            <h1 className="text-2xl font-extrabold text-[#131B2E]">Join Unify today</h1>
            <p className="text-sm text-[#464555]">Start your journey with professional messaging.</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#131B2E]" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#131B2E] placeholder-[#777587] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#131B2E]" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#131B2E] placeholder-[#777587] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#131B2E]" htmlFor="password">Password</label>
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

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#131B2E]" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
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
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-xs text-[#464555]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#4F46E5] font-bold hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Register;
