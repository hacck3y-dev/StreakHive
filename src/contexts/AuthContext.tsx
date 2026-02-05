import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    signupDate?: string;
    profileVisibility?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, name: string, username: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load token and fetch user on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('habitsync_token');
        if (storedToken) {
            setToken(storedToken);
            // Verify token and fetch user
            api.getMe(storedToken)
                .then((userData: any) => {
                    setUser(userData);
                    setIsAuthenticated(true);
                })
                .catch(() => {
                    // Token invalid, clear it
                    localStorage.removeItem('habitsync_token');
                    setToken(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response: any = await api.login(email, password);
            setUser(response.user);
            setToken(response.token);
            setIsAuthenticated(true);
            localStorage.setItem('habitsync_token', response.token);
        } catch (error) {
            throw error;
        }
    };

    const signup = async (email: string, name: string, username: string, password: string) => {
        try {
            const response: any = await api.signup(email, name, username, password);
            setUser(response.user);
            setToken(response.token);
            setIsAuthenticated(true);
            localStorage.setItem('habitsync_token', response.token);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('habitsync_token');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
