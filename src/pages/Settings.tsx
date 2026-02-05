import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';
import { api } from '../services/api';
import { SettingsIcon, LockIcon, EyeIcon, CheckIcon, FlameIcon, ChatIcon, UserIcon, SendIcon } from '../components/icons';

export const Settings = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast, showToast, hideToast } = useToast();

    // Personal Info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Privacy settings (independent)
    const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('public');
    const [showStreak, setShowStreak] = useState(true);
    const [showActivity, setShowActivity] = useState(true);

    useEffect(() => {
        if (!token || !user) {
            navigate('/');
            return;
        }

        const loadSettings = async () => {
            try {
                // Return value is directly the object { user: {...}, settings: {...} }
                const data = await api.getSettings(token) as any;

                if (data && data.user) {
                    setName(data.user.name || user.name);
                    setEmail(data.user.email || user.email);
                }

                if (data && data.settings) {
                    setProfileVisibility(data.settings.profileVisibility || 'public');
                    setShowStreak(data.settings.showStreak ?? true);
                    setShowActivity(data.settings.showActivity ?? true);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                setName(user.name);
                setEmail(user.email);
            }
        };

        loadSettings();
    }, [token, user, navigate]);


    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.updateProfileSettings(token!, { name, email });
            showToast('Profile updated successfully!', 'success');
            setIsEditingProfile(false);
        } catch (error: any) {
            showToast(error.message || 'Failed to update profile', 'error');
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showToast('New password must be at least 8 characters long', 'error');
            return;
        }

        try {
            await api.updatePasswordSettings(token!, { currentPassword, newPassword });
            showToast('Password updated successfully!', 'success');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showToast(error.message || 'Failed to update password', 'error');
        }
    };

    const handleSavePrivacy = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.updatePrivacySettings(token!, {
                profileVisibility,
                showStreak,
                showActivity
            });
            showToast('Privacy settings updated!', 'success');
        } catch (error) {
            showToast('Failed to update privacy settings', 'error');
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you ABSOLUTELY SURE you want to delete your account? This action cannot be undone and will delete all your data permanently.')) {
            return;
        }

        try {
            await api.deleteAccount(token!);
            logout();
            navigate('/');
            showToast('Your account has been deleted.', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to delete account', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary relative overflow-hidden">
            <div className="grain-overlay" />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />

            <div className="relative z-10 max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 mobile-safe-bottom pb-24 md:pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-10 h-10 rounded-full bg-accent-yellow/20 text-accent-yellow flex items-center justify-center overflow-hidden border border-accent-yellow/30"
                            aria-label="View profile"
                        >
                            <span className="font-bold text-sm">{user?.name?.[0] || 'U'}</span>
                        </button>
                        <h1 className="text-3xl font-space font-bold text-text-primary flex items-center gap-3">
                            <SettingsIcon size={32} className="text-accent-yellow" />
                            Settings
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-secondary hidden sm:inline-flex"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Personal Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-surface p-6"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <SettingsIcon size={20} className="text-accent-yellow" />
                                Personal Information
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    className="text-sm font-semibold text-accent-yellow hover:text-accent-yellow/80 transition-colors"
                                >
                                    {isEditingProfile ? 'Cancel' : 'Edit'}
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!isEditingProfile}
                                        className={`w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors ${!isEditingProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        required
                                        minLength={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={!isEditingProfile}
                                        className={`w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors ${!isEditingProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        required
                                    />
                                </div>
                            </div>

                            {isEditingProfile && (
                                <div className="flex justify-end pt-2">
                                    <button type="submit" className="btn-primary w-full sm:w-auto">
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </form>
                    </motion.div>

                    {/* Security Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card-surface p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <LockIcon size={20} className="text-accent-yellow" />
                                Security
                            </h2>
                            <button
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                className="text-sm font-semibold text-accent-yellow hover:text-accent-yellow/80 transition-colors"
                            >
                                {isChangingPassword ? 'Cancel' : 'Change Password'}
                            </button>
                        </div>

                        {!isChangingPassword ? (
                            <p className="text-text-secondary">Password is secure. Click "Change Password" to update it.</p>
                        ) : (
                            <form onSubmit={handleSavePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                                            placeholder="Min 8 characters"
                                            minLength={8}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                                            placeholder="Confirm new password"
                                            minLength={8}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button type="submit" className="btn-primary w-full sm:w-auto">
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>

                    {/* Privacy Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card-surface p-6"
                    >
                        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                            <EyeIcon size={20} className="text-accent-yellow" />
                            Privacy Settings
                        </h2>

                        <form onSubmit={handleSavePrivacy} className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">
                                    Profile Visibility
                                </label>
                                <select
                                    value={profileVisibility}
                                    onChange={(e) => setProfileVisibility(e.target.value as any)}
                                    className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                                >
                                    <option value="public">Public</option>
                                    <option value="friends">Friends Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div>
                                    <p className="text-text-primary">Show Streak</p>
                                    <p className="text-sm text-text-secondary">Display your habit streaks on your profile</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showStreak}
                                        onChange={(e) => setShowStreak(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-surface-highlight rounded-full peer peer-checked:bg-accent-yellow peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-text-primary">Show Activity</p>
                                    <p className="text-sm text-text-secondary">Display your daily activity feed</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showActivity}
                                        onChange={(e) => setShowActivity(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-surface-highlight rounded-full peer peer-checked:bg-accent-yellow peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>

                            <button type="submit" className="btn-primary w-full sm:w-auto">
                                Save Privacy Settings
                            </button>
                        </form>
                    </motion.div>

                    {/* Danger Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card-surface p-6 border-2 border-red-500/20"
                    >
                        <h2 className="text-xl font-bold text-red-500 mb-4">
                            Danger Zone
                        </h2>
                        <p className="text-text-secondary mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors w-full sm:w-auto"
                        >
                            Delete Account
                        </button>
                    </motion.div>

                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
                <div className="mx-3 mb-3 rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-2xl pointer-events-auto">
                    <div className="grid grid-cols-5 gap-2 p-2">
                        <button
                            onClick={() => navigate('/dashboard?view=habits')}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors bg-surface-highlight/60 text-text-secondary"
                        >
                            <CheckIcon size={18} />
                            Habits
                        </button>

                        <button
                            onClick={() => navigate('/dashboard?view=streak')}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors bg-surface-highlight/60 text-text-secondary"
                        >
                            <FlameIcon size={18} />
                            Streaks
                        </button>

                        <button
                            onClick={() => navigate('/dashboard?view=feed&compose=1')}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors bg-surface-highlight/60 text-text-secondary"
                        >
                            <SendIcon size={18} />
                            Post
                        </button>

                        <button
                            onClick={() => navigate('/chat')}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors bg-surface-highlight/60 text-text-secondary"
                        >
                            <ChatIcon size={18} />
                            Messages
                        </button>

                        <button
                            onClick={() => navigate('/settings')}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors ${location.pathname === '/settings' ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-surface-highlight/60 text-text-secondary'}`}
                        >
                            <SettingsIcon size={18} />
                            Settings
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Settings;
