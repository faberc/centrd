import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { getFirebase } from '../firebase';
import { Flame, Mail, Lock } from 'lucide-react';

export default function Auth() {
  const { auth } = getFirebase();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth) {
      setError("Firebase is not initialized properly.");
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      let friendlyMessage = err.message;
      if (err.code === 'auth/wrong-password') friendlyMessage = 'Incorrect password.';
      else if (err.code === 'auth/user-not-found') friendlyMessage = 'No account found with this email.';
      else if (err.code === 'auth/email-already-in-use') friendlyMessage = 'This email is already in use.';
      else if (err.code === 'auth/weak-password') friendlyMessage = 'Password should be at least 6 characters.';
      else if (err.code === 'auth/invalid-email') friendlyMessage = 'Invalid email address.';
      else if (err.code === 'auth/invalid-credential') friendlyMessage = 'Invalid login credentials.';
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError("Firebase is not initialized properly.");
      return;
    }
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen animate-fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '1rem'
    }}>
      <div className="glass animate-pop-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        borderRadius: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--terracotta-light)',
          color: 'var(--terracotta)',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          marginBottom: '1.5rem'
        }}>
          <Flame size={32} strokeWidth={2.5} />
        </div>

        <h1 className="serif-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
          Centrd
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Find your center. Challenge your limits. Log your growth.
        </p>

        {error && (
          <div style={{
            background: 'rgba(184, 76, 54, 0.1)',
            border: '1px dashed var(--collapse)',
            color: 'var(--collapse)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
          <div>
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                id="email"
                type="email"
                required
                placeholder="you@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>
            {loading ? 'Working the Clay...' : isSignUp ? 'Create Challenge Profile' : 'Enter Studio'}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '2rem 0',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 1rem' }}>or connect with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading} 
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '0.85rem', marginBottom: '1.5rem', gap: '0.6rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isSignUp ? 'Already throwing?' : 'New to the challenge?'} {' '}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--terracotta)',
              padding: 0,
              fontSize: 'inherit',
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'inline',
              fontWeight: 600
            }}
          >
            {isSignUp ? 'Sign In' : 'Create an Account'}
          </button>
        </p>
      </div>
    </div>
  );
}
