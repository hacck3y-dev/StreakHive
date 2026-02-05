import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';
import { api } from '../services/api';
import { SettingsIcon, CheckIcon, FlameIcon, ChatIcon, SendIcon } from '../components/icons';
import { useUtility } from '../contexts/UtilityContext';

export const Utility = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast, showToast, hideToast } = useToast();
    const [activeUtility, setActiveUtility] = useState<'reminder' | 'pomodoro' | 'lofi'>('reminder');
    const [reminders, setReminders] = useState<any[]>([]);
    const [newReminderTitle, setNewReminderTitle] = useState('');
    const [newReminderNote, setNewReminderNote] = useState('');
    const [newReminderTime, setNewReminderTime] = useState('');
    const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
    const { settings, state, start, pause, reset, skip, updateSettings, lofiUrl, setLofiUrl, isLofiPlaying, toggleLofi } = useUtility();

    useEffect(() => {
        if (!token || !user) {
            navigate('/');
            return;
        }
        api.getReminders(token)
            .then((data: any) => setReminders(data))
            .catch(() => showToast('Failed to load reminders', 'error'));
    }, [token, user, navigate]);

    const handleCreateReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !newReminderTitle.trim()) return;
        try {
            const reminder: any = await api.createReminder(token, {
                title: newReminderTitle,
                note: newReminderNote || undefined,
                remindAt: newReminderTime ? new Date(newReminderTime).toISOString() : null,
            });
            setReminders(prev => [reminder, ...prev]);
            setNewReminderTitle('');
            setNewReminderNote('');
            setNewReminderTime('');
        } catch (error) {
            showToast('Failed to create reminder', 'error');
        }
    };

    const handleUpdateReminder = async (id: string, data: any) => {
        if (!token) return;
        try {
            const updated: any = await api.updateReminder(token, id, data);
            setReminders(prev => prev.map(r => r.id === id ? updated : r));
        } catch (error) {
            showToast('Failed to update reminder', 'error');
        }
    };

    const handleDeleteReminder = async (id: string) => {
        if (!token) return;
        try {
            await api.deleteReminder(token, id);
            setReminders(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            showToast('Failed to delete reminder', 'error');
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

            <div className="relative z-10 max-w-4xl mx-auto py-6 sm:py-12 px-3 sm:px-6 mobile-safe-bottom pb-24 md:pb-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-space font-bold text-text-primary flex items-center gap-3">
                        Utility
                    </h1>
                    <button
                        onClick={() => navigate('/settings')}
                        className="btn-secondary hidden sm:inline-flex"
                    >
                        Back to Settings
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-surface p-4 sm:p-6"
                >
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-text-tertiary">Workspace</p>
                            <h2 className="text-lg font-semibold text-text-primary">Utilities</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row bg-surface-highlight/80 border border-border rounded-2xl sm:rounded-full p-1 gap-1 sm:gap-0 w-32 sm:w-auto">
                            <button
                                onClick={() => setActiveUtility('reminder')}
                                className={`px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-colors ${activeUtility === 'reminder' ? 'bg-accent-yellow text-bg-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Reminder
                            </button>
                            <button
                                onClick={() => setActiveUtility('pomodoro')}
                                className={`px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-colors ${activeUtility === 'pomodoro' ? 'bg-accent-yellow text-bg-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Pomodoro
                            </button>
                            <button
                                onClick={() => setActiveUtility('lofi')}
                                className={`px-3 py-1.5 rounded-xl sm:rounded-full text-xs font-semibold transition-colors ${activeUtility === 'lofi' ? 'bg-accent-yellow text-bg-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Lofi
                            </button>
                        </div>
                    </div>

                    {activeUtility === 'reminder' && (
                        <div className="space-y-3">
                            <form onSubmit={handleCreateReminder} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    value={newReminderTitle}
                                    onChange={(e) => setNewReminderTitle(e.target.value)}
                                    placeholder="Reminder title"
                                    className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                                    required
                                />
                                <input
                                    type="datetime-local"
                                    value={newReminderTime}
                                    onChange={(e) => setNewReminderTime(e.target.value)}
                                    className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                                />
                                <button type="submit" className="btn-primary text-sm w-full">
                                    Add
                                </button>
                                <textarea
                                    value={newReminderNote}
                                    onChange={(e) => setNewReminderNote(e.target.value)}
                                    placeholder="Notes (optional)"
                                    className="md:col-span-3 bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-yellow resize-none"
                                    rows={2}
                                />
                            </form>

                            <div className="space-y-3">
                                {reminders.length === 0 && (
                                    <p className="text-sm text-text-secondary">No reminders yet.</p>
                                )}
                                {reminders.map((r) => (
                                    <div key={r.id} className="p-3 rounded-lg border border-border bg-surface-highlight flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!!r.isDone}
                                                    onChange={() => handleUpdateReminder(r.id, { isDone: !r.isDone })}
                                                />
                                                <span className={`font-semibold ${r.isDone ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{r.title}</span>
                                            </div>
                                            {r.note && <p className="text-xs text-text-secondary mt-1">{r.note}</p>}
                                            {r.remindAt && (
                                                <p className="text-[10px] text-text-tertiary mt-1">
                                                    {new Date(r.remindAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingReminderId(r.id);
                                                    setNewReminderTitle(r.title);
                                                    setNewReminderNote(r.note || '');
                                                    setNewReminderTime(r.remindAt ? new Date(r.remindAt).toISOString().slice(0, 16) : '');
                                                }}
                                                className="px-3 py-1.5 text-xs rounded-md bg-surface text-text-secondary"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteReminder(r.id)}
                                                className="px-3 py-1.5 text-xs rounded-md bg-red-500 text-white"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {editingReminderId && (
                                <div className="p-4 border border-border rounded-lg bg-surface">
                                    <div className="text-sm font-semibold mb-2">Edit Reminder</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            value={newReminderTitle}
                                            onChange={(e) => setNewReminderTitle(e.target.value)}
                                            className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm"
                                        />
                                        <input
                                            type="datetime-local"
                                            value={newReminderTime}
                                            onChange={(e) => setNewReminderTime(e.target.value)}
                                            className="bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                handleUpdateReminder(editingReminderId, {
                                                    title: newReminderTitle,
                                                    note: newReminderNote || null,
                                                    remindAt: newReminderTime ? new Date(newReminderTime).toISOString() : null,
                                                });
                                                setEditingReminderId(null);
                                                setNewReminderTitle('');
                                                setNewReminderNote('');
                                                setNewReminderTime('');
                                            }}
                                            className="btn-primary text-sm"
                                        >
                                            Save
                                        </button>
                                        <textarea
                                            value={newReminderNote}
                                            onChange={(e) => setNewReminderNote(e.target.value)}
                                            className="md:col-span-3 bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm resize-none"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeUtility === 'pomodoro' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-text-tertiary uppercase tracking-wider">Mode</p>
                                    <p className="text-lg font-semibold">{state.mode.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-tertiary uppercase tracking-wider">Cycle</p>
                                    <p className="text-lg font-semibold">{state.cycleCount}</p>
                                </div>
                            </div>
                            <div className="text-3xl sm:text-4xl font-bold text-text-primary">
                                {String(Math.floor(state.remainingMs / 60000)).padStart(2, '0')}:
                                {String(Math.floor((state.remainingMs % 60000) / 1000)).padStart(2, '0')}
                            </div>
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                                <button onClick={start} className="btn-primary">Start</button>
                                <button onClick={pause} className="btn-secondary">Pause</button>
                                <button onClick={reset} className="btn-secondary">Reset</button>
                                <button onClick={skip} className="btn-secondary">Skip</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-border">
                                <div>
                                    <label className="text-xs text-text-tertiary">Focus Minutes</label>
                                    <input
                                        type="number"
                                        min={5}
                                        value={settings.focusMinutes}
                                        onChange={(e) => updateSettings({ focusMinutes: Number(e.target.value) })}
                                        className="w-full mt-1 bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-tertiary">Short Break</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={settings.shortBreakMinutes}
                                        onChange={(e) => updateSettings({ shortBreakMinutes: Number(e.target.value) })}
                                        className="w-full mt-1 bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-tertiary">Long Break</label>
                                    <input
                                        type="number"
                                        min={5}
                                        value={settings.longBreakMinutes}
                                        onChange={(e) => updateSettings({ longBreakMinutes: Number(e.target.value) })}
                                        className="w-full mt-1 bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-tertiary">Cycles Before Long</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={settings.cyclesBeforeLong}
                                        onChange={(e) => updateSettings({ cyclesBeforeLong: Number(e.target.value) })}
                                        className="w-full mt-1 bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <label className="flex items-center gap-2 text-sm text-text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoStartBreaks}
                                        onChange={(e) => updateSettings({ autoStartBreaks: e.target.checked })}
                                    />
                                    Auto‑start breaks
                                </label>
                                <label className="flex items-center gap-2 text-sm text-text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoStartFocus}
                                        onChange={(e) => updateSettings({ autoStartFocus: e.target.checked })}
                                    />
                                    Auto‑start focus
                                </label>
                            </div>
                        </div>
                    )}

                    {activeUtility === 'lofi' && (
                        <div className="space-y-3">
                            <p className="text-sm text-text-secondary">
                                For continuous playback across pages, use a direct stream URL (mp3/ogg). Embedded players usually stop when you navigate.
                            </p>
                            <input
                                type="text"
                                value={lofiUrl}
                                onChange={(e) => setLofiUrl(e.target.value)}
                                placeholder="https://your-stream-url.mp3"
                                className="w-full bg-surface-highlight border border-border rounded-lg px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                                <button onClick={toggleLofi} className="btn-primary">
                                    {isLofiPlaying ? 'Pause' : 'Play'}
                                </button>
                            </div>
                        </div>
                    )}
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

export default Utility;
