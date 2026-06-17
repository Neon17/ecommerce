import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

// Minimal self-service profile: change your email and password.
function ProfilePage() {
    const { user, fetchUserData } = useAuth();

    const [email, setEmail] = useState(user?.email ?? '');
    const [emailMsg, setEmailMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [emailSaving, setEmailSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [pwSaving, setPwSaving] = useState(false);

    const authHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    };

    const errorText = (data: unknown, fallback: string) => {
        const err = (data as { error?: unknown })?.error;
        if (Array.isArray(err)) return err.join(' ');
        if (typeof err === 'string') return err;
        return fallback;
    };

    const submitEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailSaving(true);
        setEmailMsg(null);
        try {
            const res = await fetch(`${BASEURL}/api/profile/email`, {
                method: 'PATCH',
                headers: authHeaders(),
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(errorText(data, 'Failed to update email'));
            const token = localStorage.getItem('token');
            if (token) await fetchUserData(token);
            setEmailMsg({ type: 'ok', text: 'Email updated.' });
        } catch (err) {
            setEmailMsg({ type: 'err', text: err instanceof Error ? err.message : 'Something went wrong' });
        } finally {
            setEmailSaving(false);
        }
    };

    const submitPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwSaving(true);
        setPwMsg(null);
        try {
            const res = await fetch(`${BASEURL}/api/profile/password`, {
                method: 'POST',
                headers: authHeaders(),
                credentials: 'include',
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(errorText(data, 'Failed to update password'));
            setCurrentPassword('');
            setNewPassword('');
            setPwMsg({ type: 'ok', text: 'Password updated.' });
        } catch (err) {
            setPwMsg({ type: 'err', text: err instanceof Error ? err.message : 'Something went wrong' });
        } finally {
            setPwSaving(false);
        }
    };

    const msgClass = (type: 'ok' | 'err') =>
        type === 'ok' ? 'text-green-600 text-sm mt-2' : 'text-red-600 text-sm mt-2';

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-lg mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <p className="text-gray-500">Signed in as {user?.username}</p>
                </div>

                <form onSubmit={submitEmail} className="bg-white rounded-xl shadow p-5">
                    <h2 className="font-semibold mb-3">Email</h2>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="you@example.com"
                        required
                    />
                    <button
                        type="submit"
                        disabled={emailSaving}
                        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                        {emailSaving ? 'Saving...' : 'Update email'}
                    </button>
                    {emailMsg && <p className={msgClass(emailMsg.type)}>{emailMsg.text}</p>}
                </form>

                <form onSubmit={submitPassword} className="bg-white rounded-xl shadow p-5">
                    <h2 className="font-semibold mb-3">Change password</h2>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Current password"
                        autoComplete="current-password"
                        required
                    />
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="New password"
                        autoComplete="new-password"
                        required
                    />
                    <button
                        type="submit"
                        disabled={pwSaving}
                        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                        {pwSaving ? 'Saving...' : 'Update password'}
                    </button>
                    {pwMsg && <p className={msgClass(pwMsg.type)}>{pwMsg.text}</p>}
                </form>
            </div>
        </div>
    );
}

export default ProfilePage;
