import React, { useState } from 'react';
import { isValidConfig, saveFirebaseConfig } from '../firebase';
import { Database, HelpCircle, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const [configText, setConfigText] = useState('');
  const [error, setError] = useState('');
  
  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let parsed = null;
      let cleanedText = configText.trim();
      
      if (cleanedText.includes('{')) {
        const start = cleanedText.indexOf('{');
        const end = cleanedText.lastIndexOf('}') + 1;
        cleanedText = cleanedText.slice(start, end);
        
        try {
          parsed = JSON.parse(cleanedText);
        } catch (jsonErr) {
          try {
            // Safely evaluate local input code to parse JS object format
            parsed = new Function(`return ${cleanedText}`)();
          } catch (funcErr) {
            throw new Error("Could not parse configuration. Please check the formatting or supply standard JSON.");
          }
        }
      } else {
        throw new Error("Please paste the configuration object (including the curly braces {}).");
      }

      if (!isValidConfig(parsed)) {
        throw new Error("The configuration is missing key Firebase SDK parameters (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).");
      }

      saveFirebaseConfig(parsed);
      localStorage.removeItem("throwing_log_use_mock_db"); // Clear mock flag if actual config is saved
      window.location.reload();
    } catch (err) {
      setError(err.message || "Failed to parse configuration.");
    }
  };

  const handleDemoMode = () => {
    const mockConfig = {
      apiKey: "MOCK_API_KEY_FOR_LOCAL_DEMO",
      authDomain: "mock-throwing-log.firebaseapp.com",
      projectId: "mock-throwing-log",
      storageBucket: "mock-throwing-log.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abcdef123456"
    };
    saveFirebaseConfig(mockConfig);
    localStorage.setItem("throwing_log_use_mock_db", "true");
    window.location.reload();
  };

  return (
    <div className="onboarding-screen animate-fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem 1.5rem',
      background: 'var(--bg-secondary)'
    }}>
      <div className="glass animate-pop-in" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '2.5rem',
        borderRadius: '24px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--terracotta-light)',
          color: 'var(--terracotta)',
          width: '60px',
          height: '60px',
          borderRadius: '18px',
          marginBottom: '1.5rem'
        }}>
          <Database size={30} />
        </div>

        <h1 className="serif-title" style={{ fontSize: '2rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          Set Up Your Studio Cloud
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5', fontSize: '0.95rem' }}>
          To sync your cylinder logs, success stats, and throw photos securely across your phone and computer, connect the app to your Firebase project.
        </p>

        {/* Step List */}
        <div className="glass" style={{
          padding: '1.25rem',
          borderRadius: '16px',
          background: 'var(--bg-primary)',
          textAlign: 'left',
          marginBottom: '2rem',
          fontSize: '0.9rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={16} style={{ color: 'var(--terracotta)' }} />
            Quick Setup Steps:
          </h3>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Firebase Console</a> and create a project.</li>
            <li>Enable <strong>Authentication</strong> (Email/Password or Google), <strong>Cloud Firestore</strong>, and <strong>Cloud Storage</strong>.</li>
            <li>Add a <strong>Web App</strong> to your project and copy the <code>firebaseConfig</code> object.</li>
            <li>Paste it below to launch your throwing database.</li>
          </ol>
        </div>

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

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
          <div>
            <label htmlFor="firebaseConfigText">Paste Firebase Config JSON / Object</label>
            <textarea
              id="firebaseConfigText"
              required
              rows={6}
              placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "my-studio.firebaseapp.com",
  projectId: "my-studio",
  storageBucket: "my-studio.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};`}
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                resize: 'vertical',
                background: 'var(--bg-primary)'
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
            Initialize Database
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '1.5rem 0',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 1rem' }}>Or run offline</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <button 
          onClick={handleDemoMode} 
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '0.85rem' }}
        >
          Try Offline Demo Mode (Saves locally)
        </button>
      </div>
    </div>
  );
}
