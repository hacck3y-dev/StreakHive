import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { api } from '../services/api';
import {
    FlameIcon,
    CheckIcon,
    ArrowRightIcon,
    ChartIcon,
    ZapIcon,
    CalendarIcon,
    HeartIcon,
    ChatIcon,
    SendIcon,
    SettingsIcon,
    BellIcon,
    UsersIcon,
    UserIcon,
    SearchIcon,
    MoreVerticalIcon,
    ArrowLeftIcon,
    LockIcon,
    TrophyIcon
} from '../components/icons';

interface Habit {
    id: string;
    name: string;
    category: string;
    time?: string | null;
    streak: number;
    completedToday: boolean;
    isPrivate: boolean;
    lastCompletedDate?: string; // YYYY-MM-DD
    isChallengeHabit?: boolean;
    challengeId?: string;
}

interface Post {
    id: string;
    userId: string;
    author: string;
    content: string;
    likes: number;
    likedBy: string[];
    liked?: boolean;
    createdAt: string;
    user: {
        name: string;
        username: string;
        avatarUrl?: string;
    };
    comments: Comment[];
}

interface Comment {
    id: string;
    postId: string;
    userId: string;
    author: string;
    content: string;
    createdAt: string;
    parentCommentId: string | null;
    user: {
        name: string;
        avatarUrl?: string;
    };
}

interface Challenge {
    id: string;
    name: string;
    description: string;
    participants: number;
    duration: string;
    joined: boolean;
    habitId?: string;
    roomId?: string;
}





const Dashboard = () => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast, showToast, hideToast } = useToast();
    const [activeView, setActiveView] = useState<'habits' | 'streak' | 'feed' | 'analytics' | 'challenges' | 'social' | 'settings'>('habits');
    const [loading, setLoading] = useState(true);
    const [streakView, setStreakView] = useState<'week' | 'month' | 'year'>('week');


    // State - now loaded from backend
    const [habits, setHabits] = useState<Habit[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitCategory, setNewHabitCategory] = useState('');
    const [newHabitTime, setNewHabitTime] = useState('');
    const [showAddHabit, setShowAddHabit] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [newPost, setNewPost] = useState('');
    const [showCommentsForPost, setShowCommentsForPost] = useState<string | null>(null);
    const [showPostModal, setShowPostModal] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [activityUpdateTrigger, setActivityUpdateTrigger] = useState(0);
    const [feedUpdateTrigger, setFeedUpdateTrigger] = useState(0);
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showFriendSearch, setShowFriendSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const view = params.get('view');
        if (!view) return;

        if (view === 'streak') {
            setActiveView('streak');
            setStreakView('year');
            return;
        }

        if (view === 'analytics') {
            setActiveView('analytics');
            return;
        }

        if (view === 'feed') {
            setActiveView('feed');
            return;
        }

        if (view === 'challenges') {
            setActiveView('challenges');
            return;
        }

        if (view === 'social') {
            setActiveView('social');
            return;
        }

        if (view === 'habits') {
            setActiveView('habits');
        }
    }, [location.search]);


    // Load habits and social data from backend
    useEffect(() => {
        if (!token) return;

        const loadInitialData = async () => {
            try {
                const [habitsData, requestsData, challengesData, friendsData, notificationsData] = await Promise.all([
                    api.getHabits(token),
                    api.getFriendRequests(token),
                    api.getChallenges(token),
                    api.getFriends(token),
                    api.getNotifications(token)
                ]);
                setHabits(habitsData as any);
                setFriendRequests(requestsData as any);
                setChallenges(challengesData as any);
                setFriends(friendsData as any);
                setNotifications(notificationsData as any);

            } catch (error) {
                console.error('Failed to load initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [token]);


    // Fetch feed when active view is feed or trigger changes
    useEffect(() => {
        if (!token || activeView !== 'feed') return;

        const loadFeed = async () => {
            try {
                const data: any = await api.getFeed(token);
                setPosts(data);
            } catch (error) {
                console.error('Failed to load feed:', error);
            }
        };

        loadFeed();
    }, [token, activeView, feedUpdateTrigger]);

    const handleLogout = () => {
        logout();
        showToast('Logged out successfully', 'success');
        setTimeout(() => navigate('/'), 500);
    };

    const handleMarkNotificationRead = async (id: string) => {
        if (!token) return;
        try {
            await api.markNotificationRead(token, id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllRead = async () => {
        if (!token) return;
        try {
            await api.markAllNotificationsRead(token);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read');
        }
    };

    const handleToggleHabit = async (habitId: string) => {
        const today = new Date().toISOString().split('T')[0];

        // Find the habit
        const habit = habits.find(h => h.id === habitId);
        if (!habit || !token) return;

        const isCompleting = !habit.completedToday;
        const alreadyCompletedToday = habit.lastCompletedDate === today;

        // Calculate new values
        const updatedHabit = {
            ...habit,
            completedToday: isCompleting,
            streak: isCompleting && !alreadyCompletedToday ? habit.streak + 1 : habit.streak,
            lastCompletedDate: isCompleting ? today : habit.lastCompletedDate
        };

        // Optimistic update
        setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));

        // Save to backend
        try {
            await api.updateHabit(token, habitId, updatedHabit);

            // Save daily activity
            const completedHabits = habits
                .map(h => h.id === habitId ? updatedHabit : h)
                .filter(h => h.completedToday)
                .map(h => h.id);

            const activity = {
                date: today,
                completedHabits,
                totalHabits: habits.length,
                completionRate: Math.round((completedHabits.length / habits.length) * 100)
            };

            await api.saveDailyActivity(token, activity);
            setActivityUpdateTrigger(prev => prev + 1);

            if (isCompleting) {
                showToast('Habit completed!', 'success');
            }
        } catch (error) {
            // Revert on error
            setHabits(prev => prev.map(h => h.id === habitId ? habit : h));
            showToast('Failed to update habit', 'error');
        }
    };

    const handleAddHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setIsSubmitting(true);
        try {
            if (editingHabit) {
                // Update existing habit
                const updatedHabit = {
                    ...editingHabit,
                    name: newHabitName,
                    category: newHabitCategory,
                    time: newHabitTime || null,
                    isPrivate: isPrivate
                };

                await api.updateHabit(token, editingHabit.id, updatedHabit);
                setHabits(prev => prev.map(h =>
                    h.id === editingHabit.id ? updatedHabit : h
                ));
                showToast(`Habit "${newHabitName}" updated!`, 'success');
                setEditingHabit(null);
            } else {
                // Create new habit
                const newHabit = {
                    name: newHabitName,
                    category: newHabitCategory,
                    time: newHabitTime || null,
                    streak: 0,
                    completedToday: false,
                    isPrivate: isPrivate,
                };

                const created: any = await api.createHabit(token, newHabit);
                setHabits(prev => [...prev, created]);
                showToast(`Habit "${newHabitName}" added!`, 'success');
            }

            setNewHabitName('');
            setNewHabitCategory('');
            setNewHabitTime('');
            setIsPrivate(false);
            setShowAddHabit(false);
        } catch (error) {
            showToast('Failed to save habit', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setNewHabitName(habit.name);
        setNewHabitCategory(habit.category);
        setNewHabitTime(habit.time || '');
        setIsPrivate(habit.isPrivate);
        setShowAddHabit(true);
    };



    const handleLikePost = async (postId: string) => {
        if (!token) return;
        try {
            const result: any = await api.likePost(token, postId);
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, liked: result.liked, likes: result.likes } : p
            ));
        } catch (error) {
            showToast('Failed to like post', 'error');
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() || !token) return;

        try {
            const created: any = await api.createPost(token, newPost);
            setPosts(prev => [created, ...prev]);
            setNewPost('');
            setShowPostModal(false);
            showToast('Post shared!', 'success');
        } catch (error) {
            showToast('Failed to share post', 'error');
        }
    };

    const handleAddComment = async (e: React.FormEvent, postId: string) => {
        e.preventDefault();
        if (!newComment.trim() || !token) return;

        try {
            const created: any = await api.addComment(token, postId, newComment);
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments: [...(p.comments || []), created] } : p
            ));
            setNewComment('');
            showToast('Comment added!', 'success');
        } catch (error) {
            showToast('Failed to add comment', 'error');
        }
    };

    const handleSearchFriends = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !token) return;

        setIsSearching(true);
        try {
            const results: any = await api.searchUsers(token, searchQuery);
            setSearchResults(results);
        } catch (error) {
            showToast('Search failed', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async (username: string) => {
        if (!token) return;
        try {
            await api.sendFriendRequest(token, username);
            showToast(`Request sent to ${username}!`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Request failed', 'error');
        }
    };

    const handleRespondToRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
        if (!token) return;
        try {
            await api.respondToFriendRequest(token, requestId, action);
            setFriendRequests(prev => prev.filter(r => r.id !== requestId));
            showToast(action === 'ACCEPT' ? 'Friend request accepted!' : 'Request rejected', 'success');
            if (action === 'ACCEPT') {
                setFeedUpdateTrigger(prev => prev + 1);
                // Refresh list
                const friendsData = await api.getFriends(token);
                setFriends(friendsData as any);
            }
        } catch (error) {
            showToast('Failed to respond to request', 'error');
        }
    };




    const handleToggleChallenge = async (challengeId: string) => {
        if (!token) return;
        const challenge = challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        try {
            if (challenge.joined) {
                // Leaving
                await api.leaveChallenge(token, challengeId);
                if (challenge.habitId) {
                    setHabits(prev => prev.filter(h => h.id !== challenge.habitId));
                }
                setChallenges(prev => prev.map(c =>
                    c.id === challengeId
                        ? { ...c, joined: false, habitId: undefined, participants: Math.max(0, c.participants - 1) }
                        : c
                ));
                showToast(`Left "${challenge.name}"`, 'info');
            } else {
                // Joining
                const result: any = await api.joinChallenge(token, challengeId);
                setHabits(prev => [...prev, result.habit]);
                setChallenges(prev => prev.map(c =>
                    c.id === challengeId
                        ? { ...c, joined: true, habitId: result.habitId, participants: c.participants + 1 }
                        : c
                ));
                showToast(`Joined "${challenge.name}"!`, 'success');
            }
        } catch (error) {
            showToast('Failed to update challenge status', 'error');
        }
    };








    // Global Streak: count days with >= 50% completion (using stored activity data)
    const totalStreak = useMemo(() => {
        if (!user?.id) return 0;

        let streak = 0;
        const today = new Date();

        for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - dayOffset);

            const dateKey = checkDate.toISOString().split('T')[0];
            const stored = localStorage.getItem(`activity_${user.id}_${dateKey}`);

            if (stored) {
                const activity = JSON.parse(stored);
                if (activity.completionRate >= 50) {
                    streak++;
                } else if (dayOffset > 0) {
                    // Break streak only if not today (give today a chance)
                    break;
                }
            } else if (dayOffset > 0) {
                // No activity recorded and not today = streak broken
                break;
            }
        }

        return streak;
    }, [user?.id, habits, activityUpdateTrigger]);
    const completionRate = habits.length > 0
        ? Math.round((habits.filter(h => h.completedToday).length / habits.length) * 100)
        : 0;



    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [showDayModal, setShowDayModal] = useState(false);

    // Store daily activity data
    interface DailyActivity {
        date: string; // YYYY-MM-DD format
        completedHabits: string[]; // habit IDs
        totalHabits: number;
        completionRate: number;
    }

    const getDailyActivity = (date: Date): DailyActivity | null => {
        if (!user?.id) return null;
        const dateKey = date.toISOString().split('T')[0];
        const stored = localStorage.getItem(`activity_${user.id}_${dateKey}`);
        return stored ? JSON.parse(stored) : null;
    };

    const saveDailyActivity = (date: Date, completedHabits: string[]) => {
        if (!user?.id) return;
        const dateKey = date.toISOString().split('T')[0];
        const activity: DailyActivity = {
            date: dateKey,
            completedHabits,
            totalHabits: habits.length, // Note: This uses current total habits, which might not match past total. 
            // For accurate history, we should arguably store totalHabits at that time, 
            // but for this simple toggle, using current length or preserving existing is fine.
            // Let's try to preserve existing totalHabits if just toggling.
            completionRate: habits.length > 0 ? Math.round((completedHabits.length / habits.length) * 100) : 0,
        };
        localStorage.setItem(`activity_${user.id}_${dateKey}`, JSON.stringify(activity));
    };

    const handleTogglePastHabit = (date: Date, habitId: string) => {
        const activity = getDailyActivity(date);
        let completedHabits: string[] = [];

        if (activity) {
            completedHabits = [...activity.completedHabits];
            if (completedHabits.includes(habitId)) {
                completedHabits = completedHabits.filter(id => id !== habitId);
            } else {
                completedHabits.push(habitId);
            }
        } else {
            // No activity record for this day yet, creating one
            completedHabits = [habitId];
        }

        saveDailyActivity(date, completedHabits);
        setActivityUpdateTrigger(prev => prev + 1); // Refresh UI
        showToast('Past activity updated', 'success');
    };

    // Save today's activity whenever habits change
    useEffect(() => {
        if (habits.length > 0) {
            const completedToday = habits.filter(h => h.completedToday).map(h => h.id);
            saveDailyActivity(new Date(), completedToday);
        }
    }, [habits, user?.id]);

    // Generate heatmap data based on selected view
    const generateHeatmapData = () => {
        const data = [];
        const today = new Date();
        let startDate: Date;
        let days: number;

        if (streakView === 'year') {
            // Show last 365 days (52 weeks)
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 364);
            days = 365;
        } else if (streakView === 'month') {
            // Show selected month
            startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0);
            days = endDate.getDate();
        } else { // week view
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6); // Last 7 days
            days = 7;
        }


        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const activity = getDailyActivity(date);
            const completionRate = activity ? activity.completionRate : 0;

            data.push({
                date,
                dayOfWeek: date.getDay(),
                completionRate,
                activity,
            });
        }

        return data;
    };

    const heatmapData = generateHeatmapData();

    // Get color intensity based on completion rate
    const getHeatmapColor = (completionRate: number) => {
        if (completionRate === 0) return 'bg-surface-highlight';
        if (completionRate < 25) return 'bg-accent-yellow/20';
        if (completionRate < 50) return 'bg-accent-yellow/40';
        if (completionRate < 75) return 'bg-accent-yellow/60';
        if (completionRate < 100) return 'bg-accent-yellow/80';
        return 'bg-accent-yellow';
    };

    // Calculate total contributions
    const totalContributions = heatmapData.filter(d => d.completionRate > 0).length;


    // Render nested comments recursively
    const renderComments = (post: Post, parentId: string | null = null, depth: number = 0) => {
        const postComments = (post.comments || []).filter(c => c.parentCommentId === parentId);
        if (postComments.length === 0) return null;

        const maxDepth = 2;

        return postComments.map(comment => (
            <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-4'} border-l-2 border-border pl-4`}>
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow overflow-hidden">
                        {comment.user.avatarUrl ? (
                            <img src={api.getImageUrl(comment.user.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-sm">{comment.author[0]}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-text-primary text-sm">{comment.author}</span>
                            <span className="text-xs text-text-secondary">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-text-primary text-sm">{comment.content}</p>

                        {/* Nested replies (limited depth) */}
                        {depth < maxDepth && renderComments(post, comment.id, depth + 1)}
                    </div>
                </div>
            </div>
        ));
    };

    const analyticsContent = (
        <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card-surface p-5 text-center">
                    <div className="text-3xl font-bold text-accent-yellow mb-1">{totalStreak}</div>
                    <div className="text-sm text-text-secondary">Day Streak</div>
                </div>
                <div className="card-surface p-5 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">{habits.length}</div>
                    <div className="text-sm text-text-secondary">Active Habits</div>
                </div>
                <div className="card-surface p-5 text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{completionRate}%</div>
                    <div className="text-sm text-text-secondary">Today's Progress</div>
                </div>
                <div className="card-surface p-5 text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                        {habits.filter(h => h.completedToday).length}
                    </div>
                    <div className="text-sm text-text-secondary">Done Today</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Weekly Completion Chart */}
                <div className="card-surface p-6">
                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <ChartIcon size={18} className="text-accent-yellow" />
                        Last 7 Days Performance
                    </h3>
                    <div className="h-48 flex items-end justify-between gap-2">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (6 - i));
                            const dateKey = date.toISOString().split('T')[0];
                            const stored = localStorage.getItem(`activity_${user?.id}_${dateKey}`);
                            const rate = stored ? JSON.parse(stored).completionRate : 0;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-gradient-to-t from-accent-yellow to-yellow-300 rounded-t-lg transition-all hover:opacity-80"
                                        style={{ height: `${Math.max(rate, 5)}%` }}
                                        title={`${rate}%`}
                                    />
                                    <span className="text-xs text-text-secondary">
                                        {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="card-surface p-6">
                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <CheckIcon size={18} className="text-green-400" />
                        Habits by Category
                    </h3>
                    <div className="space-y-3">
                        {Array.from(new Set(habits.map(h => h.category))).slice(0, 5).map((category, i) => {
                            const categoryHabits = habits.filter(h => h.category === category);
                            const completed = categoryHabits.filter(h => h.completedToday).length;
                            const percentage = categoryHabits.length > 0 ? Math.round((completed / categoryHabits.length) * 100) : 0;
                            const colors = ['bg-accent-yellow', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400'];
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-text-primary">{category}</span>
                                        <span className="text-text-secondary">{completed}/{categoryHabits.length}</span>
                                    </div>
                                    <div className="h-2 bg-surface-highlight rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${colors[i % colors.length]} transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {habits.length === 0 && (
                            <p className="text-text-secondary text-sm text-center py-4">Add habits to see category breakdown</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Habit Leaderboard */}
            <div className="card-surface p-6 mb-6">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <FlameIcon size={18} className="text-accent-yellow" />
                    Habit Leaderboard (by Streak)
                </h3>
                <div className="space-y-3">
                    {[...habits].sort((a, b) => b.streak - a.streak).slice(0, 5).map((habit, i) => (
                        <div key={habit.id} className="flex items-center gap-4 p-3 bg-surface-highlight rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-400 text-yellow-900' :
                                i === 1 ? 'bg-gray-300 text-gray-700' :
                                    i === 2 ? 'bg-amber-600 text-amber-100' :
                                        'bg-surface text-text-secondary'
                                }`}>
                                {i + 1}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-text-primary">{habit.name}</p>
                                <p className="text-xs text-text-secondary">{habit.category}</p>
                            </div>
                            <div className="flex items-center gap-1 text-accent-yellow">
                                <FlameIcon size={16} />
                                <span className="font-bold">{habit.streak}</span>
                            </div>
                        </div>
                    ))}
                    {habits.length === 0 && (
                        <p className="text-text-secondary text-sm text-center py-8">No habits yet. Create some to see your leaderboard!</p>
                    )}
                </div>
            </div>

            {/* Monthly Overview */}
            <div className="card-surface p-6">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-blue-400" />
                    This Month Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                        const now = new Date();
                        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                        const daysPassed = now.getDate();
                        let daysCompleted = 0;
                        let totalCompletion = 0;

                        if (user?.id) {
                            for (let d = 1; d <= daysPassed; d++) {
                                const checkDate = new Date(now.getFullYear(), now.getMonth(), d);
                                const dateKey = checkDate.toISOString().split('T')[0];
                                const stored = localStorage.getItem(`activity_${user.id}_${dateKey}`);
                                if (stored) {
                                    const activity = JSON.parse(stored);
                                    totalCompletion += activity.completionRate;
                                    if (activity.completionRate >= 50) daysCompleted++;
                                }
                            }
                        }

                        const avgCompletion = daysPassed > 0 ? Math.round(totalCompletion / daysPassed) : 0;

                        return (
                            <>
                                <div className="text-center p-4 bg-surface-highlight rounded-lg">
                                    <div className="text-2xl font-bold text-text-primary">{daysPassed}</div>
                                    <div className="text-xs text-text-secondary">Days Passed</div>
                                </div>
                                <div className="text-center p-4 bg-surface-highlight rounded-lg">
                                    <div className="text-2xl font-bold text-green-400">{daysCompleted}</div>
                                    <div className="text-xs text-text-secondary">Days ≥50%</div>
                                </div>
                                <div className="text-center p-4 bg-surface-highlight rounded-lg">
                                    <div className="text-2xl font-bold text-accent-yellow">{avgCompletion}%</div>
                                    <div className="text-xs text-text-secondary">Avg Completion</div>
                                </div>
                                <div className="text-center p-4 bg-surface-highlight rounded-lg">
                                    <div className="text-2xl font-bold text-purple-400">{daysInMonth - daysPassed}</div>
                                    <div className="text-xs text-text-secondary">Days Left</div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-bg-primary overflow-x-hidden">
            {loading && (
                <div className="fixed inset-0 z-[100] bg-bg-primary/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            {/* Grain Overlay */}
            <div className="grain-overlay" />

            {/* Toast */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />

            {/* Top Navigation */}
            <nav className="sticky top-0 z-[70] bg-surface/80 backdrop-blur-md border-b border-border md:static">
                <div className="relative max-w-[1400px] mx-auto px-3 sm:px-6 py-2 sm:py-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className="font-space text-lg sm:text-xl font-bold text-text-primary">HabitHive</div>
                        <div className="hidden sm:block h-6 w-px bg-border" />
                        <span className="hidden sm:inline text-text-secondary text-sm truncate">Welcome back, {user?.name}!</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <motion.button
                            className="relative p-2 text-text-secondary hover:text-accent-yellow transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <BellIcon size={22} />
                            {notifications.filter(n => !n.isRead).length > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-accent-yellow text-bg-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {notifications.filter(n => !n.isRead).length}
                                </span>
                            )}
                        </motion.button>

                        <motion.button
                            className="btn-secondary hidden sm:flex items-center gap-2 px-3 sm:px-4"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                        >
                            <span>Log out</span>
                        </motion.button>
                        <motion.button
                            className="btn-secondary sm:hidden flex items-center gap-2 px-3"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/settings')}
                        >
                            <SettingsIcon size={18} />
                            <span>Settings</span>
                        </motion.button>
                    </div>
                    {/* Notifications Dropdown */}
                    <AnimatePresence>
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-[92vw] sm:w-80 max-w-[360px] bg-surface border border-border rounded-2xl shadow-2xl z-[80] overflow-hidden"
                                >
                                    <div className="p-4 border-b border-border flex items-center justify-between">
                                        <h3 className="font-space font-bold text-text-primary">Notifications</h3>
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-accent-yellow hover:underline"
                                        >
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-text-secondary text-sm">
                                                No notifications yet
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`p-4 border-b border-border last:border-0 hover:bg-surface-highlight transition-colors cursor-pointer ${!n.isRead ? 'bg-accent-yellow/5' : ''}`}
                                                    onClick={() => handleMarkNotificationRead(n.id)}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow shrink-0 overflow-hidden">
                                                            {n.sender?.avatarUrl ? (
                                                                <img src={api.getImageUrl(n.sender.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold">{n.sender?.name?.[0] || 'H'}</span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-text-primary">
                                                                <span className="font-bold">{n.sender?.name || 'HabitHive'}</span> {n.content}
                                                            </p>
                                                            <p className="text-[10px] text-text-tertiary">
                                                                {new Date(n.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 mobile-safe-bottom">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <div className="card-surface p-4 space-y-2 lg:sticky lg:top-24">
                            <button
                                onClick={() => setActiveView('habits')}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeView === 'habits'
                                    ? 'bg-accent-yellow/20 text-accent-yellow'
                                    : 'text-text-secondary hover:bg-surface-highlight'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <CheckIcon size={20} />
                                    <span className="font-medium">My Habits</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setActiveView('streak');
                                    setStreakView('year');
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeView === 'streak'
                                    ? 'bg-accent-yellow/20 text-accent-yellow'
                                    : 'text-text-secondary hover:bg-surface-highlight'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FlameIcon size={20} />
                                    <span className="font-medium">Streak Tracker</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveView('feed')}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all relative ${activeView === 'feed'
                                    ? 'bg-accent-yellow/20 text-accent-yellow'
                                    : 'text-text-secondary hover:bg-surface-highlight'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <UsersIcon size={20} />
                                    <span className="font-medium">Activity Feed</span>
                                </div>
                                {friendRequests.length > 0 && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-accent-yellow text-bg-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {friendRequests.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveView('analytics')}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeView === 'analytics'
                                    ? 'bg-accent-yellow/20 text-accent-yellow'
                                    : 'text-text-secondary hover:bg-surface-highlight'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <ChartIcon size={20} />
                                    <span className="font-medium">Analytics</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveView('challenges')}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeView === 'challenges'
                                    ? 'bg-accent-yellow/20 text-accent-yellow'
                                    : 'text-text-secondary hover:bg-surface-highlight'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <ZapIcon size={20} />
                                    <span className="font-medium">Challenges</span>
                                </div>
                            </button>



                            <button
                                onClick={() => setActiveView('social')}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all relative ${activeView === 'social'
                                    ? 'bg-accent-yellow/20 text-accent-yellow'
                                    : 'text-text-secondary hover:bg-surface-highlight'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <UsersIcon size={20} />
                                    <span className="font-medium">Social</span>
                                </div>
                                {friendRequests.length > 0 && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-accent-yellow text-bg-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {friendRequests.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => navigate('/chat')}
                                className="w-full text-left px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-highlight transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <ChatIcon size={20} />
                                    <span className="font-medium">Messages</span>
                                </div>
                            </button>

                            <div className="h-px bg-border my-2" />

                            <button
                                onClick={() => navigate('/profile')}
                                className="w-full text-left px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-highlight transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <UserIcon size={20} />
                                    <span className="font-medium">Profile</span>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/settings')}
                                className="w-full text-left px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-highlight transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <SettingsIcon size={20} />
                                    <span className="font-medium">Settings</span>
                                </div>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-9">
                        {/* Stats Overview */}
                        {activeView === 'habits' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                                <motion.div
                                    className="card-surface p-4"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                                            <FlameIcon size={20} className="text-accent-yellow" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase tracking-wider">Total Streak</p>
                                            <p className="text-2xl font-space font-bold text-text-primary">{totalStreak}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="card-surface p-4"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                                            <CheckIcon size={20} className="text-accent-yellow" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase tracking-wider">Active Habits</p>
                                            <p className="text-2xl font-space font-bold text-text-primary">{habits.length}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="card-surface p-4"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                                            <ChartIcon size={20} className="text-accent-yellow" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase tracking-wider">Today's Progress</p>
                                            <div className="flex items-end gap-2">
                                                <p className="text-2xl font-space font-bold text-text-primary">{completionRate}%</p>
                                                <div className="w-20 h-2 bg-surface-highlight rounded-full mb-2">
                                                    <div
                                                        className="h-full bg-accent-yellow rounded-full transition-all duration-500"
                                                        style={{ width: `${completionRate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Content Area */}
                        <AnimatePresence mode="wait">
                            {/* HABITS VIEW */}
                            {activeView === 'habits' && (
                                <motion.div
                                    key="habits"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <h2 className="text-2xl font-space font-bold text-text-primary">My Habits</h2>
                                        <motion.button
                                            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowAddHabit(!showAddHabit)}
                                        >
                                            Add Habit
                                            <ArrowRightIcon size={16} />
                                        </motion.button>
                                    </div>

                                    {/* Add Habit Form */}
                                    <AnimatePresence>
                                        {showAddHabit && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="card-surface p-6 mb-6"
                                            >
                                                <form onSubmit={handleAddHabit} className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm text-text-secondary mb-2">Habit Name</label>
                                                        <input
                                                            type="text"
                                                            value={newHabitName}
                                                            onChange={(e) => setNewHabitName(e.target.value)}
                                                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                                                            placeholder="e.g., Morning Run"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-text-secondary mb-2">Category</label>
                                                        <input
                                                            type="text"
                                                            value={newHabitCategory}
                                                            onChange={(e) => setNewHabitCategory(e.target.value)}
                                                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                                                            placeholder="e.g., Fitness, Learning"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-text-secondary mb-2">Time (optional)</label>
                                                        <input
                                                            type="time"
                                                            value={newHabitTime}
                                                            onChange={(e) => setNewHabitTime(e.target.value)}
                                                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl border border-border hover:border-accent-yellow/30 transition-all cursor-pointer" onClick={() => setIsPrivate(!isPrivate)}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${isPrivate ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-surface text-text-tertiary'}`}>
                                                                <LockIcon size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-text-primary">Private Habit</p>
                                                                <p className="text-[10px] text-text-secondary">Only you can see this in your profile</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-10 h-5 rounded-full transition-colors relative ${isPrivate ? 'bg-accent-yellow' : 'bg-surface-highlight border border-border'}`}>
                                                            <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-bg-primary transition-all ${isPrivate ? 'right-1' : 'left-1'}`} />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                        <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
                                                            {editingHabit ? 'Update Habit' : 'Create Habit'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowAddHabit(false);
                                                                setEditingHabit(null);
                                                                setNewHabitName('');
                                                                setNewHabitCategory('');
                                                                setNewHabitTime('');
                                                                setIsPrivate(false);
                                                            }}
                                                            className="btn-secondary flex-1"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Category Filter Tabs */}
                                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                                        {['All', ...Array.from(new Set(habits.map(h => h.category)))].map(category => (
                                            <button
                                                key={category}
                                                onClick={() => setSelectedCategory(category)}
                                                className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${selectedCategory === category
                                                    ? 'bg-accent-yellow text-bg-primary'
                                                    : 'bg-surface-highlight text-text-secondary hover:bg-surface'
                                                    }`}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Habits List */}
                                    <div className="space-y-4">
                                        {habits
                                            .filter(h => selectedCategory === 'All' || h.category === selectedCategory)
                                            .sort((a, b) => {
                                                const toMinutes = (t?: string | null) => {
                                                    if (!t) return Number.POSITIVE_INFINITY;
                                                    const [hh, mm] = t.split(':').map(Number);
                                                    if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.POSITIVE_INFINITY;
                                                    return hh * 60 + mm;
                                                };
                                                return toMinutes(a.time) - toMinutes(b.time);
                                            })
                                            .map((habit) => (
                                            <motion.div
                                                key={habit.id}
                                                className="card-surface p-6"
                                                whileHover={{ scale: 1.01 }}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <motion.button
                                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${habit.completedToday
                                                                ? 'bg-accent-yellow text-bg-primary'
                                                                : 'border-2 border-border text-text-secondary'
                                                                }`}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleToggleHabit(habit.id)}
                                                        >
                                                            {habit.completedToday && <CheckIcon size={24} />}
                                                        </motion.button>

                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-text-primary text-lg">{habit.name}</h3>
                                                                {habit.isChallengeHabit && (
                                                                    <span className="px-2 py-1 bg-accent-yellow/20 text-accent-yellow text-xs font-semibold rounded-full">
                                                                        Challenge
                                                                    </span>
                                                                )}
                                                                {habit.isPrivate && (
                                                                    <span className="px-2 py-1 bg-surface-highlight text-text-secondary text-xs font-semibold rounded-full flex items-center gap-1">
                                                                        <LockIcon size={12} /> Private
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                                                                <span className="text-sm text-text-secondary">{habit.category}</span>
                                                                {habit.time && (
                                                                    <span className="text-sm text-text-secondary">
                                                                        {habit.time}
                                                                    </span>
                                                                )}
                                                                <div className="flex items-center gap-1 text-accent-yellow">
                                                                    <FlameIcon size={16} />
                                                                    <span className="text-sm font-semibold">{habit.streak} days</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <motion.button
                                                            className="text-text-secondary hover:text-accent-yellow transition-colors px-4 py-2"
                                                            whileHover={{ scale: 1.05 }}
                                                            onClick={() => handleEditHabit(habit)}
                                                        >
                                                            Edit
                                                        </motion.button>
                                                        <motion.button
                                                            className="text-text-secondary hover:text-red-400 transition-colors px-4 py-2"
                                                            whileHover={{ scale: 1.05 }}
                                                            onClick={() => setDeletingHabit(habit)}
                                                            disabled={habit.isChallengeHabit}
                                                        >
                                                            Delete
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {habits.length === 0 && (
                                            <div className="card-surface p-12 text-center">
                                                <p className="text-text-secondary text-lg">No habits yet. Create one to get started!</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* STREAK TRACKER VIEW */}
                            {activeView === 'streak' && (
                                <motion.div
                                    key="streak"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <h2 className="text-2xl font-space font-bold text-text-primary">Streak Tracker</h2>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={() => setStreakView('week')}
                                                className={`px-4 py-2 rounded-lg transition-all ${streakView === 'week'
                                                    ? 'bg-accent-yellow text-bg-primary font-semibold'
                                                    : 'bg-surface-highlight text-text-secondary'
                                                    }`}
                                            >
                                                Week
                                            </button>
                                            <button
                                                onClick={() => setStreakView('month')}
                                                className={`px-4 py-2 rounded-lg transition-all ${streakView === 'month'
                                                    ? 'bg-accent-yellow text-bg-primary font-semibold'
                                                    : 'bg-surface-highlight text-text-secondary'
                                                    }`}
                                            >
                                                Month
                                            </button>
                                            <button
                                                onClick={() => setStreakView('year')}
                                                className={`px-4 py-2 rounded-lg transition-all ${streakView === 'year'
                                                    ? 'bg-accent-yellow text-bg-primary font-semibold'
                                                    : 'bg-surface-highlight text-text-secondary'
                                                    }`}
                                            >
                                                Year
                                            </button>
                                        </div>
                                    </div>

                                    {streakView === 'month' && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                                className="bg-surface-highlight border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-yellow"
                                            >
                                                {(() => {
                                                    const currentYear = new Date().getFullYear();
                                                    const signupYear = user?.signupDate ? new Date(user.signupDate).getFullYear() : currentYear;
                                                    const years = [];
                                                    for (let y = currentYear; y >= signupYear; y--) {
                                                        years.push(<option key={y} value={y}>{y}</option>);
                                                    }
                                                    return years;
                                                })()}
                                            </select>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                                className="bg-surface-highlight border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-yellow"
                                            >
                                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
                                                    <option key={i} value={i}>{month}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="card-surface p-6 sm:p-8">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                            <p className="text-text-secondary">
                                                <span className="text-accent-yellow font-semibold">{totalContributions}</span> active days in the last {streakView === 'year' ? '365 days' : 'month'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <span>Less</span>
                                                <div className="w-3 h-3 rounded-sm bg-surface-highlight" />
                                                <div className="w-3 h-3 rounded-sm bg-accent-yellow/20" />
                                                <div className="w-3 h-3 rounded-sm bg-accent-yellow/40" />
                                                <div className="w-3 h-3 rounded-sm bg-accent-yellow/60" />
                                                <div className="w-3 h-3 rounded-sm bg-accent-yellow/80" />
                                                <div className="w-3 h-3 rounded-sm bg-accent-yellow" />
                                                <span>More</span>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto md:overflow-visible pb-2">
                                            {/* Heatmap Grid */}
                                            <div className={`grid ${streakView === 'year' ? 'grid-cols-53' : 'grid-cols-7'} gap-1.5 ${streakView === 'year' ? 'min-w-[680px]' : 'min-w-[320px]'} md:min-w-0`}>
                                                {heatmapData.map((day, index) => (
                                                    <motion.div
                                                        key={index}
                                                        className={`${streakView === 'year' ? 'w-3 h-3' : 'w-10 h-10'} rounded-sm cursor-pointer relative group ${getHeatmapColor(day.completionRate)}`}
                                                        whileHover={{ scale: 1.5, zIndex: 10 }}
                                                        onClick={() => {
                                                            setSelectedDay(day.date);
                                                            setShowDayModal(true);
                                                        }}
                                                        title={`${day.date.toDateString()}: ${day.completionRate}% completed`}
                                                    >
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-border rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ zIndex: 9999 }}>
                                                            <p className="text-sm font-semibold text-text-primary mb-1">
                                                                {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                            {day.activity ? (
                                                                <div className="text-xs text-text-secondary">
                                                                    <p>{day.activity.completedHabits.length} of {day.activity.totalHabits} habits completed</p>
                                                                    <p className="text-accent-yellow font-semibold">{day.completionRate}% completion</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-text-secondary">No activity</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Week labels for year view */}
                                            {streakView === 'year' && (
                                                <div className="mt-4 grid grid-cols-53 gap-1.5 text-xs text-text-secondary min-w-[680px] md:min-w-0">
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                        <span key={i} className="text-center w-3">{day}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Analytics (merged into Streaks) */}
                                    <div className="mt-8 md:hidden">
                                        <h3 className="text-xl font-space font-bold text-text-primary mb-4">Analytics</h3>
                                        {analyticsContent}
                                    </div>
                                </motion.div>
                            )}

                            {/* FEED VIEW */}
                            {activeView === 'feed' && (
                                <motion.div
                                    key="feed"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <h2 className="text-2xl font-space font-bold text-text-primary">Activity Feed</h2>
                                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => setActiveView('challenges')}
                                                className="btn-secondary flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                                            >
                                                <ZapIcon size={16} />
                                                Challenges
                                            </button>
                                            <button
                                                onClick={() => setActiveView('social')}
                                                className="btn-secondary flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                                            >
                                                <UsersIcon size={16} />
                                                Friends
                                            </button>
                                            <button
                                                onClick={() => setShowPostModal(true)}
                                                className="btn-primary flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                                            >
                                                <SendIcon size={16} />
                                                New Post
                                            </button>
                                        </div>
                                    </div>

                                    {/* Friend Requests Panel */}
                                    {friendRequests.length > 0 && (
                                        <div className="card-surface p-4 mb-6 border-accent-yellow/30 bg-accent-yellow/5">
                                            <h3 className="text-sm font-bold text-accent-yellow mb-3 uppercase tracking-wider flex items-center gap-2">
                                                <UsersIcon size={16} />
                                                Pending Friend Requests
                                            </h3>
                                            <div className="space-y-3">
                                                {friendRequests.map(req => (
                                                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-surface rounded-xl border border-border">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow overflow-hidden">
                                                                {req.sender.avatarUrl ? (
                                                                    <img src={api.getImageUrl(req.sender.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="font-bold">{req.sender.name[0]}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-text-primary">{req.sender.name}</p>
                                                                <p className="text-xs text-text-secondary">@{req.sender.username}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleRespondToRequest(req.id, 'ACCEPT')}
                                                                className="px-3 py-1 bg-accent-yellow text-bg-primary rounded-lg text-xs font-bold"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleRespondToRequest(req.id, 'REJECT')}
                                                                className="px-3 py-1 bg-surface-highlight text-text-secondary rounded-lg text-xs"
                                                            >
                                                                Ignore
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Posts Feed */}
                                    <div className="space-y-4">
                                        {posts.map((post) => (
                                            <div key={post.id} className="card-surface p-4">
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        onClick={() => navigate(`/profile?id=${post.userId}`)}
                                                        className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow overflow-hidden hover:opacity-80 transition-opacity"
                                                    >
                                                        {post.user?.avatarUrl ? (
                                                            <img src={api.getImageUrl(post.user.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="font-bold text-sm">{post.author[0]}</span>
                                                        )}
                                                    </button>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <button
                                                                    onClick={() => navigate(`/profile?id=${post.userId}`)}
                                                                    className="font-bold text-text-primary hover:text-accent-yellow transition-colors text-left text-sm"
                                                                >
                                                                    {post.author}
                                                                    <span className="ml-2 text-[10px] font-normal text-text-secondary">@{post.user?.username}</span>
                                                                </button>
                                                                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                                                                    <CalendarIcon size={10} />
                                                                    {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-text-primary text-base leading-relaxed mb-3">{post.content}</p>

                                                        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                                                            <motion.button
                                                                className={`flex items-center gap-2 transition-colors ${post.liked ? 'text-accent-yellow' : 'text-text-secondary hover:text-accent-yellow'}`}
                                                                whileHover={{ scale: 1.05 }}
                                                                onClick={() => handleLikePost(post.id)}
                                                            >
                                                                <HeartIcon size={18} className={post.liked ? 'fill-current' : ''} />
                                                                <span className="text-sm font-semibold">{post.likes}</span>
                                                            </motion.button>
                                                            <button
                                                                className={`flex items-center gap-2 transition-colors ${showCommentsForPost === post.id ? 'text-accent-yellow' : 'text-text-secondary hover:text-accent-yellow'}`}
                                                                onClick={() => setShowCommentsForPost(showCommentsForPost === post.id ? null : post.id)}
                                                            >
                                                                <ChatIcon size={18} />
                                                                <span className="text-sm font-semibold">{post.comments?.length || 0}</span>
                                                            </button>
                                                        </div>

                                                        {/* Comments Section */}
                                                        {showCommentsForPost === post.id && (
                                                            <div className="mt-4 border-t border-border pt-4">
                                                                <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={newComment}
                                                                        onChange={(e) => setNewComment(e.target.value)}
                                                                        className="flex-1 bg-surface-highlight border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-yellow"
                                                                        placeholder="Write a comment..."
                                                                    />
                                                                    <button type="submit" className="btn-primary text-xs px-3 py-2" disabled={!newComment.trim()}>
                                                                        Post
                                                                    </button>
                                                                </form>

                                                                {/* Comments List */}
                                                                {renderComments(post)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {posts.length === 0 && (
                                            <div className="card-surface p-12 text-center">
                                                <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <UsersIcon size={32} className="text-text-secondary opacity-50" />
                                                </div>
                                                <p className="text-text-secondary text-lg">No posts in your feed yet.</p>
                                                <p className="text-sm text-text-secondary mt-1">Connect with friends or share your first update!</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ANALYTICS VIEW */}
                            {activeView === 'analytics' && (
                                <motion.div
                                    key="analytics"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="text-2xl font-space font-bold text-text-primary mb-6">Analytics</h2>
                                    {analyticsContent}
                                </motion.div>
                            )}

                            {/* CHALLENGES VIEW */}
                            {activeView === 'challenges' && (
                                <motion.div
                                    key="challenges"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="text-2xl font-space font-bold text-text-primary mb-6">Challenges</h2>
                                    <div className="space-y-4">
                                        {[...challenges].sort((a, b) => (Number(b.joined) - Number(a.joined))).map((challenge) => (
                                            <div key={challenge.id} className="card-surface p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-text-primary text-lg mb-2">{challenge.name}</h3>
                                                        <p className="text-text-secondary mb-4">{challenge.description}</p>
                                                        <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                                                            <span>{challenge.participants} participants</span>
                                                            <span>•</span>
                                                            <span>{challenge.duration}</span>
                                                        </div>

                                                        {/* Link to Forum for joined challenges */}
                                                        {challenge.joined && challenge.roomId && (
                                                            <button
                                                                className="text-sm text-accent-yellow hover:underline flex items-center gap-1 mt-2"
                                                                onClick={() => navigate(`/chat?room=${challenge.roomId}`)}
                                                            >
                                                                <ChatIcon size={14} />
                                                                Go to Forum
                                                            </button>
                                                        )}
                                                    </div>
                                                    <motion.button
                                                        className={`px-6 py-2 rounded-full font-semibold ${challenge.joined
                                                            ? 'bg-surface-highlight text-text-secondary'
                                                            : 'btn-primary'
                                                            }`}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleToggleChallenge(challenge.id)}
                                                    >
                                                        {challenge.joined ? 'Leave' : 'Join'}
                                                    </motion.button>
                                                </div>


                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* SOCIAL VIEW */}
                            {activeView === 'social' && (
                                <motion.div
                                    key="social"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex flex-col gap-3 mb-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-space font-bold text-text-primary">Social</h2>
                                            <div className="flex items-center gap-2 sm:hidden">
                                                <button
                                                    onClick={() => setActiveView('challenges')}
                                                    className="px-5 py-2.5 rounded-xl bg-surface-highlight text-text-secondary text-sm font-semibold shadow-sm"
                                                >
                                                    Challenges
                                                </button>
                                                <button
                                                    onClick={() => setActiveView('feed')}
                                                    className="px-5 py-2.5 rounded-xl bg-accent-yellow text-bg-primary text-sm font-semibold shadow-sm"
                                                >
                                                    Post
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowFriendSearch(true)}
                                            className="btn-primary flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                                        >
                                            <UsersIcon size={16} />
                                            Find Friends
                                        </button>
                                    </div>

                                    {/* Friend Requests Section */}
                                    {friendRequests.length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Pending Requests</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {friendRequests.map(req => (
                                                    <div key={req.id} className="card-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow overflow-hidden">
                                                                {req.sender.avatarUrl ? (
                                                                    <img src={api.getImageUrl(req.sender.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="font-bold">{req.sender.name[0]}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-text-primary text-sm">{req.sender.name}</p>
                                                                <p className="text-xs text-text-secondary">@{req.sender.username}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleRespondToRequest(req.id, 'ACCEPT')}
                                                                className="px-3 py-1 bg-accent-yellow text-bg-primary rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleRespondToRequest(req.id, 'REJECT')}
                                                                className="px-3 py-1 bg-surface-highlight text-text-secondary rounded-lg text-[10px] uppercase tracking-wider"
                                                            >
                                                                Ignore
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Friends List Section */}
                                    <div>
                                        <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Your Friends ({friends.length})</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {friends.map(friend => (
                                                <div key={friend.id} className="card-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group hover:border-accent-yellow/30 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow overflow-hidden group-hover:scale-105 transition-transform">
                                                            {friend.avatarUrl ? (
                                                                <img src={api.getImageUrl(friend.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="font-bold text-lg">{friend.name[0]}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-text-primary text-sm">{friend.name}</p>
                                                            <p className="text-xs text-text-secondary">@{friend.username}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/chat?room=new&userId=${friend.id}`)}
                                                        className="p-2 bg-accent-yellow/10 text-accent-yellow hover:bg-accent-yellow hover:text-bg-primary rounded-xl transition-all"
                                                        title="Send Message"
                                                    >
                                                        <ChatIcon size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            {friends.length === 0 && (
                                                <div className="col-span-full card-surface p-12 text-center opacity-70">
                                                    <p className="text-text-secondary mb-4">You haven't added any friends yet.</p>
                                                    <button
                                                        onClick={() => setShowFriendSearch(true)}
                                                        className="btn-secondary text-sm"
                                                    >
                                                        Find People to Follow
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
                <div className="mx-3 mb-3 rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-2xl pointer-events-auto">
                    <div className="grid grid-cols-5 gap-2 p-2">
                        <button
                            onClick={() => setActiveView('habits')}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors ${activeView === 'habits'
                                ? 'bg-accent-yellow/20 text-accent-yellow'
                                : 'bg-surface-highlight/60 text-text-secondary'
                                }`}
                        >
                            <CheckIcon size={18} />
                            Habits
                        </button>

                        <button
                            onClick={() => {
                                setActiveView('streak');
                                setStreakView('year');
                            }}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors ${activeView === 'streak' || activeView === 'analytics'
                                ? 'bg-accent-yellow/20 text-accent-yellow'
                                : 'bg-surface-highlight/60 text-text-secondary'
                                }`}
                        >
                            <FlameIcon size={18} />
                            Streaks
                        </button>

                        <button
                            onClick={() => {
                                setActiveView('feed');
                                setShowPostModal(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors ${activeView === 'feed'
                                ? 'bg-accent-yellow/20 text-accent-yellow'
                                : 'bg-surface-highlight/60 text-text-secondary'
                                }`}
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
                            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-colors bg-surface-highlight/60 text-text-secondary"
                        >
                            <SettingsIcon size={18} />
                            Settings
                        </button>
                    </div>
                </div>
            </nav>

            {/* Daily Task Details Modal */}
            <AnimatePresence>
                {showDayModal && selectedDay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowDayModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-surface rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-border"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-border sticky top-0 bg-surface z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-space font-bold text-text-primary text-xl">
                                            {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                        </h3>
                                        <p className="text-sm text-text-secondary mt-1">
                                            {getDailyActivity(selectedDay)
                                                ? `${getDailyActivity(selectedDay)!.completionRate}% completion`
                                                : 'No activity recorded'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowDayModal(false)}
                                        className="w-8 h-8 rounded-full hover:bg-surface-highlight flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-3">
                                    {habits.map(habit => {
                                        const isToday = selectedDay.toDateString() === new Date().toDateString();
                                        const activity = getDailyActivity(selectedDay);
                                        const isCompleted = isToday
                                            ? habit.completedToday
                                            : activity?.completedHabits.includes(habit.id);

                                        return (
                                            <motion.div
                                                key={habit.id}
                                                className={`flex items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${isCompleted
                                                    ? 'bg-surface-highlight border-accent-yellow/30'
                                                    : 'bg-surface border-border hover:border-text-secondary'
                                                    }`}
                                                onClick={() => {
                                                    if (isToday) {
                                                        handleToggleHabit(habit.id);
                                                    } else {
                                                        handleTogglePastHabit(selectedDay, habit.id);
                                                    }
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted
                                                    ? 'bg-accent-yellow border-accent-yellow text-bg-primary'
                                                    : 'border-text-secondary text-transparent'
                                                    }`}>
                                                    <CheckIcon size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-semibold transition-colors ${isCompleted ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                        {habit.name}
                                                    </p>
                                                    <p className="text-xs text-text-secondary">{habit.category}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {habits.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-text-secondary">No habits created yet</p>
                                    </div>
                                )}

                                {getDailyActivity(selectedDay) && (
                                    <div className="mt-6 p-4 bg-surface-highlight rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-text-secondary">Progress</span>
                                            <span className="text-sm font-semibold text-accent-yellow">
                                                {getDailyActivity(selectedDay)?.completedHabits.length || 0} / {Math.max(getDailyActivity(selectedDay)?.totalHabits || 1, 1)}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent-yellow transition-all duration-300"
                                                style={{ width: `${getDailyActivity(selectedDay)?.completionRate || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingHabit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setDeletingHabit(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-surface rounded-2xl w-full max-w-md p-6 border border-border"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="font-space font-bold text-text-primary text-xl mb-4">Delete Habit?</h3>
                            <p className="text-text-secondary mb-6">
                                Are you sure you want to delete <span className="text-text-primary font-semibold">"{deletingHabit.name}"</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={async () => {
                                        if (deletingHabit && token) {
                                            try {
                                                await api.deleteHabit(token, deletingHabit.id);
                                                setHabits(prev => prev.filter(h => h.id !== deletingHabit.id));
                                                showToast(`Habit "${deletingHabit.name}" deleted`, 'success');
                                                setDeletingHabit(null);
                                            } catch (e) {
                                                showToast('Failed to delete habit', 'error');
                                            }
                                        }
                                    }}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setDeletingHabit(null)}
                                    className="flex-1 bg-surface-highlight hover:bg-surface text-text-primary font-semibold px-4 py-3 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Post Modal */}
            <Modal
                isOpen={showPostModal}
                onClose={() => {
                    setShowPostModal(false);
                    setNewPost('');
                }}
                title="Create Post"
            >
                <form onSubmit={handleCreatePost} className="space-y-4">
                    <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors resize-none h-28"
                        placeholder="Share your progress..."
                    />
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => {
                                setShowPostModal(false);
                                setNewPost('');
                            }}
                            className="text-sm text-text-secondary hover:text-text-primary"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary px-5" disabled={!newPost.trim()}>
                            Post
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Friend Search Modal */}
            <Modal isOpen={showFriendSearch} onClose={() => { setShowFriendSearch(false); setSearchResults([]); setSearchQuery(''); }} title="Add Friends" >
                <div className="space-y-6">
                    <form onSubmit={handleSearchFriends} className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow"
                            placeholder="Enter username..."
                        />
                        <button type="submit" className="btn-primary px-6" disabled={isSearching}>
                            {isSearching ? '...' : 'Search'}
                        </button>
                    </form>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {searchResults.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-surface-highlight border border-border rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img src={api.getImageUrl(user.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-lg">{user.name[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">{user.name}</p>
                                        <p className="text-sm text-text-secondary">@{user.username}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSendRequest(user.username)}
                                    className="btn-primary text-xs px-4 py-2"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                        {searchResults.length === 0 && searchQuery && !isSearching && (
                            <p className="text-center text-text-secondary py-8">No users found.</p>
                        )}
                        {!searchQuery && (
                            <div className="text-center py-8">
                                <UsersIcon size={48} className="mx-auto text-text-secondary opacity-20 mb-3" />
                                <p className="text-text-secondary">Search for friends by their username to connect and share progress.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Utility Floating Button */}
            <button
                onClick={() => navigate('/utility')}
                className="fixed bottom-24 right-4 z-40 md:bottom-6 md:right-6 bg-accent-yellow text-bg-primary px-4 py-3 rounded-full shadow-xl font-semibold"
            >
                Utility
            </button>

            {/* Chat Modal (if needed for full-screen chat) */}
        </div>
    );
};

export default Dashboard;
