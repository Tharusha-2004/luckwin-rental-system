import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('https://luckwin-rental-system.onrender.com/api/auth/login', {
                username,
                password
            });

            if (response.data.success) {
                // Token ekayi User Details tikayi browser eke save karagannawa
                localStorage.setItem('luckwin_token', response.data.token);
                localStorage.setItem('luckwin_user', JSON.stringify(response.data.user));

                // Login unata passe kelinma Dashboard ekata yanawa
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">

                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-600 p-3 rounded-full">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">LUCKWIN STORES</h2>
                    <p className="text-gray-400">Equipment Rental Management System</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your username"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <div className="relative">
                            {/* Wam paththe thiyena Lock icon eka */}
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500" />
                            </div>

                            <input
                                /* Meke type eka thamai maaru wenne */
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                /* Dakunu paththe icon ekata ida thiyanna pr-10 kiyala damma */
                                className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your password"
                            />

                            {/* Dakunu paththe thiyena Eye Button eka */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default Login;