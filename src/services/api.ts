const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

class ApiService {
    private getHeaders(token?: string) {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    getImageUrl(path: string | null) {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Strip /api from the end of API_URL to get the base server URL
        const baseUrl = API_URL.replace(/\/api$/, '');
        return `${baseUrl}${path}`;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || error.message || 'Request failed');
        }
        return response.json();
    }

    // Auth endpoints
    async signup(email: string, name: string, username: string, password: string) {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ email, name, username, password }),
        });
        return this.handleResponse(response);
    }

    async login(email: string, password: string) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ email, password }),
        });
        return this.handleResponse(response);
    }

    async getMe(token: string) {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Habits endpoints
    async getHabits(token: string) {
        const response = await fetch(`${API_URL}/habits`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async createHabit(token: string, habit: any) {
        const response = await fetch(`${API_URL}/habits`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(habit),
        });
        return this.handleResponse(response);
    }

    async updateHabit(token: string, id: string, habit: any) {
        const response = await fetch(`${API_URL}/habits/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(habit),
        });
        return this.handleResponse(response);
    }

    async deleteHabit(token: string, id: string) {
        const response = await fetch(`${API_URL}/habits/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Daily Activity endpoints
    async saveDailyActivity(token: string, activity: {
        date: string;
        completedHabits: string[];
        totalHabits: number;
        completionRate: number;
    }) {
        const response = await fetch(`${API_URL}/habits/activity`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(activity),
        });
        return this.handleResponse(response);
    }

    async getDailyActivity(token: string, date: string) {
        const response = await fetch(`${API_URL}/habits/activity/${date}`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Analytics endpoint
    async getAnalyticsSummary(token: string) {
        const response = await fetch(`${API_URL}/analytics/summary`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Profile endpoints
    async getUserProfile(token: string, userId: string) {
        const response = await fetch(`${API_URL}/friends/${userId}`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async getProfile(token: string, userId?: string) {
        const endpoint = userId ? `${API_URL}/profile/${userId}` : `${API_URL}/profile`;
        const response = await fetch(endpoint, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async updateProfile(token: string, data: { name?: string; bio?: string }) {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    async uploadAvatar(token: string, file: File) {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`${API_URL}/profile/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        return this.handleResponse(response);
    }

    async deleteAvatar(token: string) {
        const response = await fetch(`${API_URL}/profile/avatar`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Settings endpoints
    async getSettings(token: string) {
        const response = await fetch(`${API_URL}/settings`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async updateProfileSettings(token: string, data: { name?: string; email?: string }) {
        const response = await fetch(`${API_URL}/settings/profile`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    async updatePasswordSettings(token: string, data: { currentPassword: string; newPassword: string }) {
        const response = await fetch(`${API_URL}/settings/password`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    async updatePrivacySettings(token: string, data: any) {
        const response = await fetch(`${API_URL}/settings/privacy`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    async deleteAccount(token: string) {
        const response = await fetch(`${API_URL}/settings/account`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Social Feed & Posts
    async getFeed(token: string) {
        const response = await fetch(`${API_URL}/posts/feed`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async createPost(token: string, content: string) {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ content }),
        });
        return this.handleResponse(response);
    }

    async likePost(token: string, postId: string) {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async addComment(token: string, postId: string, content: string) {
        const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ content }),
        });
        return this.handleResponse(response);
    }

    // Friendships
    async searchUsers(token: string, username: string) {
        const response = await fetch(`${API_URL}/friends/search?username=${encodeURIComponent(username)}`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async sendFriendRequest(token: string, username: string) {
        const response = await fetch(`${API_URL}/friends/request`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ username }),
        });
        return this.handleResponse(response);
    }

    async getFriendRequests(token: string) {
        const response = await fetch(`${API_URL}/friends/requests`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async respondToFriendRequest(token: string, requestId: string, action: 'ACCEPT' | 'REJECT') {
        const response = await fetch(`${API_URL}/friends/respond`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify({ requestId, action }),
        });
        return this.handleResponse(response);
    }

    async getFriends(token: string) {
        const response = await fetch(`${API_URL}/friends/list`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Chat
    async getChatRooms(token: string) {
        const response = await fetch(`${API_URL}/chat/rooms`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async createChatRoom(token: string, targetUserId: string) {
        const response = await fetch(`${API_URL}/chat/rooms`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ targetUserId }),
        });
        return this.handleResponse(response);
    }

    async getChatMessages(token: string, roomId: string) {
        const response = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async sendChatMessage(token: string, roomId: string, content: string) {
        const response = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ content }),
        });
        return this.handleResponse(response);
    }

    async sendChatMessageWithReply(token: string, roomId: string, content: string, replyToId?: string | null) {
        const response = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ content, replyToId }),
        });
        return this.handleResponse(response);
    }

    // Challenges
    async getChallenges(token: string) {
        const response = await fetch(`${API_URL}/challenges`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async joinChallenge(token: string, challengeId: string) {
        const response = await fetch(`${API_URL}/challenges/${challengeId}/join`, {
            method: 'POST',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async leaveChallenge(token: string, challengeId: string) {
        const response = await fetch(`${API_URL}/challenges/${challengeId}/leave`, {
            method: 'POST',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Notifications
    async getNotifications(token: string) {
        const response = await fetch(`${API_URL}/notifications`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async markNotificationRead(token: string, notificationId: string) {
        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async markAllNotificationsRead(token: string) {
        const response = await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Reminders
    async getReminders(token: string) {
        const response = await fetch(`${API_URL}/reminders`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async createReminder(token: string, data: { title: string; note?: string; remindAt?: string | null }) {
        const response = await fetch(`${API_URL}/reminders`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    async updateReminder(token: string, id: string, data: { title?: string; note?: string; remindAt?: string | null; isDone?: boolean }) {
        const response = await fetch(`${API_URL}/reminders/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    async deleteReminder(token: string, id: string) {
        const response = await fetch(`${API_URL}/reminders/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    // Pomodoro
    async getPomodoroSettings(token: string) {
        const response = await fetch(`${API_URL}/pomodoro/settings`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }

    async updatePomodoroSettings(token: string, data: {
        focusMinutes?: number;
        shortBreakMinutes?: number;
        longBreakMinutes?: number;
        cyclesBeforeLong?: number;
        autoStartBreaks?: boolean;
        autoStartFocus?: boolean;
    }) {
        const response = await fetch(`${API_URL}/pomodoro/settings`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    async createPomodoroSession(token: string, data: {
        type: string;
        plannedMinutes: number;
        startedAt?: string;
        endedAt?: string | null;
        completed?: boolean;
    }) {
        const response = await fetch(`${API_URL}/pomodoro/sessions`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    // Blocks
    async blockUser(token: string, userId: string) {
        const response = await fetch(`${API_URL}/friends/block`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ userId }),
        });
        return this.handleResponse(response);
    }

    async unblockUser(token: string, userId: string) {
        const response = await fetch(`${API_URL}/friends/unblock`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ userId }),
        });
        return this.handleResponse(response);
    }

    async getBlockedUsers(token: string) {
        const response = await fetch(`${API_URL}/friends/blocked`, {
            headers: this.getHeaders(token),
        });
        return this.handleResponse(response);
    }



    // Health check
    async healthCheck() {
        const response = await fetch(`${API_URL}/health`);
        return this.handleResponse(response);
    }
}

export const api = new ApiService();
