import { useEffect, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Sections
import HeroSection from '../sections/HeroSection';
import HowItWorksSection from '../sections/HowItWorksSection';
import SocialFeedSection from '../sections/SocialFeedSection';
import StreakTrackerSection from '../sections/StreakTrackerSection';
import ChallengesSection from '../sections/ChallengesSection';
import AnalyticsSection from '../sections/AnalyticsSection';
import PrivacySection from '../sections/PrivacySection';
import TestimonialsSection from '../sections/TestimonialsSection';
import OpenSourceSection from '../sections/OpenSourceSection';
import CTAFooterSection from '../sections/CTAFooterSection';

// UI Components
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
    const { toast, showToast, hideToast } = useToast();
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    // TODO: replace with your GitHub repository URL
    const githubRepoUrl = 'https://github.com/hacck3y-dev/StreakHive';

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, loading, navigate]);

    // Cleanup all ScrollTriggers on unmount
    useEffect(() => {
        return () => {
            ScrollTrigger.getAll().forEach(st => st.kill());
        };
    }, []);

    const handleLoginSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await login(loginEmail, loginPassword);
            setIsLoginOpen(false);
            showToast('Welcome back!', 'success');
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (error: any) {
            showToast(error.message || 'Login failed. Please check your credentials.', 'error');
        }
    };

    return (
        <main className="relative bg-bg-primary min-h-screen overflow-x-hidden">
            {/* Grain Overlay */}
            <div className="grain-overlay" />

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />

            {/* Sections with z-index stacking */}
            <HeroSection
                onLoginClick={() => setIsLoginOpen(true)}
                onSignupClick={() => navigate('/signup')}
                githubRepoUrl={githubRepoUrl}
            />
            <OpenSourceSection repoUrl={githubRepoUrl} />
            <HowItWorksSection />
            <SocialFeedSection />
            <StreakTrackerSection />
            <ChallengesSection />
            <AnalyticsSection />
            <TestimonialsSection />
            <PrivacySection />
            <CTAFooterSection />

            {/* Global Modals */}
            <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Welcome back">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Email</label>
                        <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Password</label>
                        <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                            placeholder="********"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full btn-primary py-3 mt-2">
                        Log in
                    </button>
                    <p className="text-center text-sm text-text-secondary">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            className="text-accent-yellow hover:underline"
                            onClick={() => navigate('/signup')}
                        >
                            Sign up
                        </button>
                    </p>
                </form>
            </Modal>
        </main>
    );
};

export default LandingPage;
