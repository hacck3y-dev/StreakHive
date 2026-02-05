import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';
import { api } from '../services/api';
import { AvatarUpload } from '../components/AvatarUpload';
import { UserIcon, FlameIcon, CheckIcon, SettingsIcon, ChatIcon, SendIcon } from '../components/icons';

export const Profile = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast, showToast, hideToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');

    useEffect(() => {
        if (!token || !user) {
            navigate('/');
            return;
        }

        const loadProfile = async () => {
            setLoading(true);
            try {
                // Determine if we are viewing our own profile or someone else's
                const urlParams = new URLSearchParams(location.search);
                const targetId = urlParams.get('id');

                let data: any;
                if (!targetId || targetId === user.id) {
                    try {
                        data = await api.getProfile(token);
                    } catch (error) {
                        try {
                            data = await api.getUserProfile(token, user.id);
                        } catch (fallbackError) {
                            const me: any = await api.getMe(token);
                            data = {
                                ...me,
                                bio: me.bio || '',
                                streak: me.streak ?? 0,
                                postCount: me.postCount ?? 0,
                                friendCount: me.friendCount ?? 0,
                                isRestricted: false
                            };
                        }
                    }
                } else {
                    data = await api.getUserProfile(token, targetId);
                }
                setProfile(data);
                if (!targetId || targetId === user.id) {
                    setEditName(data.name);
                    setEditBio(data.bio || '');
                }
            } catch (error: any) {
                if (error.message.includes('private')) {
                    showToast('This profile is private', 'info');
                } else {
                    showToast('Failed to load profile', 'error');
                }
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [token, user, navigate, location.search]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            const updated: any = await api.updateProfile(token, {
                name: editName,
                bio: editBio
            });
            setProfile(updated);
            setEditing(false);
            showToast('Profile updated!', 'success');
        } catch (error) {
            showToast('Failed to update profile', 'error');
        }
    };

    const handleAvatarUpload = (newAvatarUrl: string) => {
        setProfile({ ...profile, avatarUrl: newAvatarUrl });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <p className="text-text-secondary">Loading profile...</p>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-space font-bold text-text-primary">
                        Profile
                    </h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-secondary hidden sm:inline-flex"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-surface p-6 sm:p-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            {profile?.id === user?.id ? (
                                <AvatarUpload
                                    currentAvatarUrl={profile?.avatarUrl}
                                    onUploadSuccess={handleAvatarUpload}
                                />
                            ) : (
                                <div className="relative">
                                    {profile?.avatarUrl ? (
                                        <img
                                            src={api.getImageUrl(profile.avatarUrl) || ''}
                                            alt="Profile avatar"
                                            className="w-32 h-32 rounded-full object-cover border-4 border-accent-yellow"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-surface-highlight border-4 border-border flex items-center justify-center">
                                            <UserIcon size={48} className="text-text-secondary" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="md:col-span-2">
                            {profile?.isRestricted ? (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold text-text-primary">
                                        {profile?.name}
                                    </h2>
                                    <p className="text-text-secondary">@{profile?.username}</p>
                                    <div className="p-6 bg-surface-highlight border border-border rounded-2xl flex flex-col items-center justify-center text-center">
                                        <UserIcon size={48} className="text-text-tertiary opacity-30 mb-4" />
                                        <p className="text-text-secondary font-medium">This profile is restricted to friends only.</p>
                                        <p className="text-text-tertiary text-sm mt-2">Send a friend request to see their full profile and activity.</p>
                                    </div>
                                </div>
                            ) : editing ? (
                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    {/* ... existing edit form ... */}
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            value={editBio}
                                            onChange={(e) => setEditBio(e.target.value)}
                                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors resize-none"
                                            rows={4}
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button type="submit" className="btn-primary w-full sm:w-auto">
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditing(false);
                                                setEditName(profile.name);
                                                setEditBio(profile.bio || '');
                                            }}
                                            className="btn-secondary w-full sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-text-primary">
                                                {profile?.name}
                                            </h2>
                                            <p className="text-text-secondary">@{profile?.username}</p>
                                            {profile?.id === user?.id && (
                                                <p className="text-xs text-text-tertiary mt-1">{profile?.email}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            {profile?.id !== user?.id && !profile?.isRestricted && (
                                                <button
                                                    onClick={async () => {
                                                        if (!token) return;
                                                        try {
                                                            const room: any = await api.createChatRoom(token, profile.id);
                                                            navigate(`/chat?room=${room.id}`);
                                                        } catch (error) {
                                                            showToast('Failed to start chat', 'error');
                                                        }
                                                    }}
                                                    className="btn-primary w-full sm:w-auto"
                                                >
                                                    Message
                                                </button>
                                            )}
                                            {profile?.id === user?.id && (
                                                <button
                                                    onClick={() => setEditing(true)}
                                                    className="btn-secondary w-full sm:w-auto"
                                                >
                                                    Edit Profile
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {profile?.bio ? (
                                        <p className="text-text-secondary mb-4">{profile.bio}</p>
                                    ) : (
                                        <p className="text-text-tertiary italic mb-4">No bio yet</p>
                                    )}

                                    <div className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">
                                        Member since {new Date(profile?.signupDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6"
                >
                    <div className="card-surface p-6 text-center border-accent-yellow/30 bg-accent-yellow/5">
                        <FlameIcon size={32} className="text-accent-yellow mx-auto mb-2" />
                        <p className="text-2xl font-bold text-text-primary">{profile?.streak || 0}</p>
                        <p className="text-sm text-text-secondary">Day Streak</p>
                    </div>
                    <div className="card-surface p-6 text-center border-accent-yellow/30 bg-accent-yellow/5">
                        <CheckIcon size={32} className="text-accent-yellow mx-auto mb-2" />
                        <p className="text-2xl font-bold text-text-primary">{profile?.postCount || 0}</p>
                        <p className="text-sm text-text-secondary">Posts</p>
                    </div>
                    <div className="card-surface p-6 text-center border-accent-yellow/30 bg-accent-yellow/5">
                        <UserIcon size={32} className="text-accent-yellow mx-auto mb-2" />
                        <p className="text-2xl font-bold text-text-primary">{profile?.friendCount || 0}</p>
                        <p className="text-sm text-text-secondary">Friends</p>
                    </div>
                </motion.div>
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
                            onClick={() => navigate('/utility')}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors ${location.pathname === '/utility' ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-surface-highlight/60 text-text-secondary'}`}
                        >
                            <SettingsIcon size={18} />
                            Utility
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Profile;
