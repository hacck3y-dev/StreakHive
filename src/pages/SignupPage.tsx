import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignupPage = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [signupName, setSignupName] = useState('');
    const [signupUsername, setSignupUsername] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignupSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);
        try {
            await signup(signupEmail, signupName, signupUsername, signupPassword);
            navigate('/dashboard');
        } catch (error: any) {
            setErrorMessage(error.message || 'Signup failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="relative bg-bg-primary min-h-screen overflow-x-hidden flex items-center justify-center px-6 py-16">
            <div className="w-full max-w-[520px] card-surface p-8 md:p-10">
                <h1 className="text-[clamp(28px,3.5vw,40px)] font-space font-bold text-text-primary mb-2">
                    Create your board
                </h1>
                <p className="text-text-secondary mb-6">
                    Start tracking habits with your circle in minutes.
                </p>

                <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Full Name</label>
                        <input
                            type="text"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Email</label>
                        <input
                            type="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Username</label>
                        <input
                            type="text"
                            value={signupUsername}
                            onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                            placeholder="johndoe123"
                            required
                        />
                        <p className="text-[10px] text-text-secondary mt-1">This is how friends will find you.</p>
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Password</label>
                        <input
                            type="password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="w-full bg-surface-highlight border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                            placeholder="********"
                            required
                        />
                    </div>

                    {errorMessage && (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full btn-primary py-3 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating your board...' : 'Create your board'}
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm text-text-secondary">
                    <button
                        type="button"
                        className="hover:text-text-primary transition-colors"
                        onClick={() => navigate('/')}
                    >
                        Back to home
                    </button>
                    <span>
                        Already have an account?{' '}
                        <button
                            type="button"
                            className="text-accent-yellow hover:underline"
                            onClick={() => navigate('/')}
                        >
                            Log in
                        </button>
                    </span>
                </div>
            </div>
        </main>
    );
};

export default SignupPage;
