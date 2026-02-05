import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';
import { api } from '../services/api';
import { Modal } from '../components/ui/Modal';
import {
    ChatIcon,
    SendIcon,
    ArrowLeftIcon,
    SearchIcon,
    MoreVerticalIcon,
    UsersIcon
} from '../components/icons';

interface Message {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    replyTo?: {
        id: string;
        content: string;
        sender: {
            id: string;
            name: string;
            username: string;
            avatarUrl?: string;
        };
    };
    createdAt: string;
    sender: {
        id: string;
        name: string;
        username: string;
        avatarUrl?: string;
    };
}

interface ChatRoom {
    id: string;
    isGroup: boolean;
    name?: string;
    participants: {
        userId: string;
        user: {
            id: string;
            name: string;
            username: string;
            avatarUrl?: string;
        };
    }[];
    messages: Message[];
    updatedAt: string;
}

interface Friend {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
}

export const Chat = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Friend Search State
    const [showFriendSearch, setShowFriendSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
    const [showRoomMenu, setShowRoomMenu] = useState(false);

    const activeRoom = rooms.find(r => r.id === activeRoomId);
    const otherParticipant = activeRoom?.participants.find(p => p.userId !== user?.id)?.user;
    const isBlocked = !!otherParticipant && blockedUsers.some(b => b.id === otherParticipant.id);

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const loadData = async () => {
            try {
                // Load rooms first
                const roomsData: any = await api.getChatRooms(token);
                setRooms(roomsData);
            } catch (error) {
                showToast('Failed to load conversations', 'error');
            }

            try {
                // Load friends separately
                const friendsData: any = await api.getFriends(token);
                setFriends(friendsData);
            } catch (error) {
                console.error('Failed to load friends:', error);
                // We don't necessarily want to toast here if it's just friends list failure
            }

            try {
                const blockedData: any = await api.getBlockedUsers(token);
                setBlockedUsers(blockedData);
            } finally {
                setLoading(false);
            }
        };

        const handleUrlParams = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('room');
            const targetUserId = urlParams.get('userId');

            if (roomId === 'new' && targetUserId) {
                try {
                    const room: any = await api.createChatRoom(token, targetUserId);
                    // Refresh rooms list
                    const roomsData: any = await api.getChatRooms(token);
                    setRooms(roomsData);
                    setActiveRoomId(room.id);
                    // Clean up URL
                    navigate('/chat', { replace: true });
                } catch (error) {
                    showToast('Failed to start chat', 'error');
                }
            } else if (roomId) {
                setActiveRoomId(roomId);
            }
        };

        loadData().then(handleUrlParams);
    }, [token, navigate]);

    useEffect(() => {
        if (!token || !activeRoomId) return;

        const loadMessages = async () => {
            try {
                const data: any = await api.getChatMessages(token, activeRoomId);
                setMessages(data);
                scrollToBottom();
            } catch (error: any) {
                // Only show toast if it's not a 404 on initial load (which can happen if room is in URL but invalid)
                showToast(error.message || 'Failed to load messages', 'error');
            }
        };

        loadMessages();

        // Simulating real-time with polling for now
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [token, activeRoomId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !token || !activeRoomId || sending) return;

        setSending(true);
        try {
            const created: any = await api.sendChatMessageWithReply(token, activeRoomId, newMessage, replyTo?.id || null);
            setMessages(prev => [...prev, created]);
            setNewMessage('');
            setReplyTo(null);
            scrollToBottom();

            // Update rooms list to show latest message/sort
            setRooms(prev => {
                const existing = prev.find(r => r.id === activeRoomId);
                if (existing) {
                    return prev.map(r =>
                        r.id === activeRoomId ? { ...r, messages: [created], updatedAt: new Date().toISOString() } : r
                    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                }
                // If it's a new room that wasn't in list yet, reload all
                api.getChatRooms(token!).then(data => setRooms(data as ChatRoom[]));
                return prev;
            });
        } catch (error: any) {
            showToast(error.message || 'Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleStartChat = async (friendId: string) => {
        if (!token) return;
        try {
            const room: any = await api.createChatRoom(token, friendId);
            if (!rooms.find(r => r.id === room.id)) {
                setRooms(prev => [room, ...prev]);
            }
            setActiveRoomId(room.id);
        } catch (error) {
            showToast('Failed to start chat', 'error');
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

    const handleSendFriendRequest = async (username: string) => {
        if (!token) return;
        try {
            await api.sendFriendRequest(token, username);
            showToast(`Request sent to ${username}!`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Request failed', 'error');
        }
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper to get friends who don't have a chat room yet
    const friendsWithoutChat = friends.filter(friend =>
        !rooms.some(room => !room.isGroup && room.participants.some(p => p.userId === friend.id))
    );

    const filteredRooms = rooms.filter(room => {
        if (!sidebarSearch.trim()) return true;
        const search = sidebarSearch.toLowerCase();
        if (room.isGroup) {
            return room.name?.toLowerCase().includes(search);
        }
        const other = room.participants.find(p => p.userId !== user?.id)?.user;
        return other?.name.toLowerCase().includes(search) || other?.username.toLowerCase().includes(search);
    });

    const filteredFriends = friendsWithoutChat.filter(friend => {
        if (!sidebarSearch.trim()) return true;
        const search = sidebarSearch.toLowerCase();
        return friend.name.toLowerCase().includes(search) || friend.username.toLowerCase().includes(search);
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-bg-primary text-text-primary flex overflow-hidden">
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
            <div className="grain-overlay opacity-30" />

            {/* Sidebar */}
            <aside className={`w-full md:w-80 border-r border-border bg-surface/50 backdrop-blur-xl flex flex-col z-20 ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-surface-highlight rounded-xl transition-colors">
                        <ArrowLeftIcon size={20} />
                    </button>
                    <h2 className="text-xl font-space font-bold">Messages</h2>
                    <button
                        onClick={() => setShowFriendSearch(true)}
                        className="p-2 hover:bg-surface-highlight rounded-xl transition-colors text-accent-yellow"
                        title="Add Friend"
                    >
                        <UsersIcon size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search friends or chats..."
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            className="w-full bg-surface-highlight border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent-yellow"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Active Conversations Section */}
                    {filteredRooms.length > 0 && (
                        <div className="mb-4">
                            <h3 className="px-6 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Active Chats</h3>
                            {filteredRooms.map(room => {
                                const other = room.participants.find(p => p.userId !== user?.id)?.user;
                                const lastMsg = room.messages[0];
                                return (
                                    <button
                                        key={room.id}
                                        onClick={() => setActiveRoomId(room.id)}
                                        className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-surface-highlight border-b border-border/50 ${activeRoomId === room.id ? 'bg-accent-yellow/10 border-r-2 border-r-accent-yellow' : ''}`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border ${room.isGroup ? 'bg-accent-yellow text-bg-primary' : 'bg-accent-yellow/20 text-accent-yellow'} border-accent-yellow/30`}>
                                            {room.isGroup ? (
                                                <UsersIcon size={24} />
                                            ) : other?.avatarUrl ? (
                                                <img src={api.getImageUrl(other.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold">{other?.name?.[0] || '?'}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left overflow-hidden">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-bold truncate">{room.isGroup ? room.name : other?.name}</span>
                                                <span className="text-[10px] text-text-tertiary">{formatTime(room.updatedAt)}</span>
                                            </div>
                                            <p className="text-xs text-text-secondary truncate">
                                                {lastMsg?.senderId === user?.id ? 'You: ' : ''}{lastMsg?.content || 'Empty conversation'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Friends Section (Quick Start) */}
                    {filteredFriends.length > 0 && (
                        <div>
                            <h3 className="px-6 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Your Friends</h3>
                            {filteredFriends.map(friend => (
                                <button
                                    key={friend.id}
                                    onClick={() => handleStartChat(friend.id)}
                                    className="w-full p-4 flex items-center gap-4 transition-all hover:bg-surface-highlight border-b border-border/50"
                                >
                                    <div className="w-12 h-12 rounded-full bg-surface-highlight flex items-center justify-center overflow-hidden border border-border">
                                        {friend.avatarUrl ? (
                                            <img src={api.getImageUrl(friend.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold">{friend.name[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <span className="font-bold text-sm block">{friend.name}</span>
                                        <span className="text-[10px] text-text-tertiary">Start a conversation</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {rooms.length === 0 && friendsWithoutChat.length === 0 && (
                        <div className="p-8 text-center">
                            <ChatIcon size={48} className="mx-auto text-text-tertiary opacity-20 mb-4" />
                            <p className="text-sm text-text-secondary mb-4">No friends found yet.</p>
                            <button onClick={() => setShowFriendSearch(true)} className="btn-primary text-xs w-full">Find Friends</button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Chat Area */}
            <main className={`flex-1 flex flex-col relative z-10 ${!activeRoomId ? 'hidden md:flex' : 'flex'}`}>
                {activeRoomId ? (
                    <>
                        {/* Chat Header */}
                        <header className="h-[73px] border-b border-border bg-surface/30 backdrop-blur-md px-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveRoomId(null)} className="md:hidden p-2 hover:bg-surface-highlight rounded-xl">
                                    <ArrowLeftIcon size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (!activeRoom?.isGroup && otherParticipant?.id) {
                                            navigate(`/profile?id=${otherParticipant.id}`);
                                        }
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${activeRoom?.isGroup ? 'bg-accent-yellow text-bg-primary' : 'bg-accent-yellow/20 text-accent-yellow'}`}
                                >
                                    {activeRoom?.isGroup ? (
                                        <UsersIcon size={20} />
                                    ) : otherParticipant?.avatarUrl ? (
                                        <img src={api.getImageUrl(otherParticipant.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold">{otherParticipant?.name?.[0] || '?'}</span>
                                    )}
                                </button>
                                <div className="text-left">
                                    <button
                                        onClick={() => {
                                            if (!activeRoom?.isGroup && otherParticipant?.id) {
                                                navigate(`/profile?id=${otherParticipant.id}`);
                                            }
                                        }}
                                        className="font-bold text-text-primary text-sm text-left"
                                    >
                                        {activeRoom?.isGroup ? activeRoom.name : otherParticipant?.name}
                                    </button>
                                    <p className="text-[10px] text-text-secondary">
                                        {activeRoom?.isGroup ? `${activeRoom.participants.length} members` : `@${otherParticipant?.username}`}
                                    </p>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowRoomMenu(prev => !prev)}
                                    className="p-2 hover:bg-surface-highlight rounded-full"
                                >
                                    <MoreVerticalIcon size={20} />
                                </button>
                                {showRoomMenu && activeRoom && !activeRoom.isGroup && otherParticipant && (
                                    <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-surface shadow-xl z-30">
                                        <button
                                            onClick={() => {
                                                navigate(`/profile?id=${otherParticipant.id}`);
                                                setShowRoomMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-surface-highlight"
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    if (isBlocked) {
                                                        await api.unblockUser(token!, otherParticipant.id);
                                                        setBlockedUsers(prev => prev.filter(b => b.id !== otherParticipant.id));
                                                    } else {
                                                        await api.blockUser(token!, otherParticipant.id);
                                                        setBlockedUsers(prev => [...prev, otherParticipant]);
                                                    }
                                                    setShowRoomMenu(false);
                                                } catch (error: any) {
                                                    showToast(error.message || 'Action failed', 'error');
                                                }
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-surface-highlight"
                                        >
                                            {isBlocked ? 'Unblock' : 'Block'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </header>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user?.id;
                                const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
                                    >
                                        {!isMe && showAvatar && (
                                            <button
                                                onClick={() => navigate(`/profile?id=${msg.sender.id}`)}
                                                className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center overflow-hidden mb-1 flex-shrink-0"
                                            >
                                                {msg.sender.avatarUrl ? (
                                                    <img src={api.getImageUrl(msg.sender.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-xs">{msg.sender.name[0]}</span>
                                                )}
                                            </button>
                                        )}
                                        {!isMe && !showAvatar && <div className="w-8" />}

                                        <div
                                            className={`max-w-[70%] p-4 rounded-2xl text-sm ${isMe
                                                ? 'bg-accent-yellow text-bg-primary rounded-br-none'
                                                : 'bg-surface-highlight text-text-primary rounded-bl-none border border-border'
                                                }`}
                                        >
                                            {msg.replyTo && (
                                                <div className={`mb-2 p-2 rounded-lg text-[10px] ${isMe ? 'bg-bg-primary/20' : 'bg-bg-primary/10'} border border-border/50`}>
                                                    <div className="font-semibold">
                                                        {msg.replyTo.sender.name}
                                                    </div>
                                                    <div className="truncate">{msg.replyTo.content}</div>
                                                </div>
                                            )}
                                            <p className="leading-relaxed">{msg.content}</p>
                                            <div className={`text-[9px] mt-1 ${isMe ? 'text-bg-primary/60' : 'text-text-tertiary'} flex items-center justify-between`}>
                                                <button
                                                    onClick={() => setReplyTo(msg)}
                                                    className={`${isMe ? 'text-bg-primary/70' : 'text-text-tertiary'} hover:underline`}
                                                >
                                                    Reply
                                                </button>
                                                {formatTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-border bg-surface/30">
                            {isBlocked && (
                                <div className="mb-3 rounded-xl border border-border bg-surface-highlight px-4 py-2 text-xs text-text-secondary">
                                    Messaging is disabled because this user is blocked.
                                </div>
                            )}
                            {replyTo && (
                                <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface-highlight px-4 py-2 text-xs">
                                    <div className="truncate">
                                        Replying to <span className="font-semibold">{replyTo.sender.name}</span>: {replyTo.content}
                                    </div>
                                    <button onClick={() => setReplyTo(null)} className="text-text-tertiary hover:text-text-primary">✕</button>
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex gap-4">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-surface-highlight border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-yellow transition-all"
                                    disabled={isBlocked}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending || isBlocked}
                                    className="btn-primary flex items-center justify-center p-3 aspect-square rounded-xl"
                                >
                                    <SendIcon size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center p-12 text-center">
                        <div className="max-w-md">
                            <div className="w-24 h-24 rounded-3xl bg-surface-highlight flex items-center justify-center mx-auto mb-6 border border-border">
                                <ChatIcon size={40} className="text-accent-yellow" />
                            </div>
                            <h2 className="text-2xl font-space font-bold mb-3 text-text-primary">Your Private Messenger</h2>
                            <p className="text-text-secondary leading-relaxed">
                                Connect with your friends, share your progress, and support each other's habits in private conversations.
                            </p>
                            <div className="mt-8 p-4 bg-accent-yellow/5 border border-accent-yellow/20 rounded-2xl inline-block">
                                <p className="text-xs text-accent-yellow font-bold uppercase tracking-widest">Select a chat to start messaging</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Friend Search Modal */}
            <Modal isOpen={showFriendSearch} onClose={() => { setShowFriendSearch(false); setSearchResults([]); setSearchQuery(''); }} title="Find Friends">
                <div className="space-y-6">
                    <form onSubmit={handleSearchFriends} className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-surface-highlight border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                            placeholder="Enter username..."
                        />
                        <button type="submit" className="btn-primary px-6 py-2 text-xs" disabled={isSearching}>
                            {isSearching ? '...' : 'Search'}
                        </button>
                    </form>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {/* Current Friends Quick List (only if not searching) */}
                        {!searchQuery && friends.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">Your Friends</h4>
                                <div className="space-y-2">
                                    {friends.map(friend => (
                                        <div key={friend.id} className="flex items-center justify-between p-3 bg-surface rounded-xl hover:bg-surface-highlight transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow overflow-hidden">
                                                    {friend.avatarUrl ? (
                                                        <img src={api.getImageUrl(friend.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-xs">{friend.name[0]}</span>
                                                    )}
                                                </div>
                                                <p className="font-semibold text-text-primary text-sm">{friend.name}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    handleStartChat(friend.id);
                                                    setShowFriendSearch(false);
                                                }}
                                                className="px-3 py-1 bg-accent-yellow text-bg-primary rounded-lg text-xs font-bold"
                                            >
                                                Chat
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchResults.map(resultUser => {
                            const isAlreadyFriend = friends.some(f => f.id === resultUser.id);
                            return (
                                <div key={resultUser.id} className="flex items-center justify-between p-4 bg-surface-highlight border border-border rounded-xl hover:border-accent-yellow/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent-yellow/20 flex items-center justify-center text-accent-yellow overflow-hidden">
                                            {resultUser.avatarUrl ? (
                                                <img src={api.getImageUrl(resultUser.avatarUrl) || ''} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold">{resultUser.name[0]}</span>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-text-primary text-sm truncate">{resultUser.name}</p>
                                            <p className="text-xs text-text-secondary truncate">@{resultUser.username}</p>
                                        </div>
                                    </div>
                                    {isAlreadyFriend ? (
                                        <button
                                            onClick={() => {
                                                handleStartChat(resultUser.id);
                                                setShowFriendSearch(false);
                                            }}
                                            className="px-4 py-2 bg-accent-yellow text-bg-primary rounded-xl text-xs font-bold"
                                        >
                                            Chat
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSendFriendRequest(resultUser.username)}
                                            className="btn-primary text-xs px-4 py-2"
                                        >
                                            Add Friend
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {searchResults.length === 0 && searchQuery && !isSearching && (
                            <p className="text-center text-text-secondary py-8 text-sm">No users found.</p>
                        )}
                        {!searchQuery && (
                            <div className="text-center py-8">
                                <UsersIcon size={40} className="mx-auto text-text-secondary opacity-20 mb-3" />
                                <p className="text-xs text-text-secondary">Search for friends by their username to connect.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Chat;

