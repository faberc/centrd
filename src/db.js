// --- Local Auth Operations (Active Session in Browser) ---
export function subscribeToAuth(callback) {
  const getActiveUser = () => {
    try {
      const mockUserJson = localStorage.getItem("throwing_log_mock_user");
      return mockUserJson ? JSON.parse(mockUserJson) : null;
    } catch (e) {
      return null;
    }
  };
  
  // Initial check
  setTimeout(() => callback(getActiveUser()), 50);
  
  const handleAuthChange = () => {
    callback(getActiveUser());
  };
  
  window.addEventListener("local-auth-changed", handleAuthChange);
  return () => {
    window.removeEventListener("local-auth-changed", handleAuthChange);
  };
}

export async function signOutUser() {
  localStorage.removeItem("throwing_log_mock_user");
  window.dispatchEvent(new CustomEvent("local-auth-changed"));
}

export function signInProfile(profile) {
  localStorage.setItem("throwing_log_mock_user", JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("local-auth-changed"));
}

// --- Potter Profile Operations (Server-Backed) ---
export async function getProfiles() {
  const res = await fetch('/centrd/api/profiles');
  if (!res.ok) throw new Error('Failed to load profiles');
  return res.json();
}

export async function createProfile(name, studio = "", avatar = "🍯") {
  const res = await fetch('/centrd/api/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, studio, avatar })
  });
  if (!res.ok) throw new Error('Failed to create profile');
  return res.json();
}

export async function deleteProfile(profileId) {
  const res = await fetch(`/centrd/api/profiles/${profileId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete profile');
  return res.json();
}

// --- Challenge Settings Operations (Server-Backed) ---
export async function loadSettings(userId) {
  const res = await fetch(`/centrd/api/settings/${userId}`);
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export async function saveSettings(userId, settings) {
  const res = await fetch('/centrd/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...settings, userId })
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

// --- Cylinder Throw Logs Operations (Server-Backed) ---
export async function addThrowLog(userId, throwData) {
  const res = await fetch('/centrd/api/throws', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...throwData, userId })
  });
  if (!res.ok) throw new Error('Failed to add throw log');
  const data = await res.json();
  return data.id;
}

export async function updateThrowLog(throwId, updates) {
  const res = await fetch(`/centrd/api/throws/${throwId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update throw log');
  return res.json();
}

export async function deleteThrowLog(throwId) {
  const res = await fetch(`/centrd/api/throws/${throwId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete throw log');
  return res.json();
}

// Real-Time Event Sync using Server-Sent Events (SSE)
export function subscribeToThrows(userId, callback, errorCallback) {
  // Fetch initial logs list
  fetch(`/centrd/api/throws/${userId}`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to load initial throws list');
      return res.json();
    })
    .then(callback)
    .catch(err => {
      console.error("Initial logs fetch failed:", err);
      if (errorCallback) errorCallback(err);
    });

  // Open EventSource SSE stream
  const eventSource = new EventSource(`/centrd/api/throws/stream/${userId}`);
  
  eventSource.onmessage = (event) => {
    try {
      const list = JSON.parse(event.data);
      callback(list);
    } catch (e) {
      console.error("Failed to parse SSE data stream:", e);
    }
  };

  eventSource.onerror = (err) => {
    console.warn("EventSource connection encountered error", err);
  };

  return () => {
    eventSource.close();
  };
}

// --- Local Multipart Image Upload Operation ---
export async function uploadThrowPhoto(userId, throwId, file, stageLabel = "Thrown") {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('userId', userId);
  formData.append('throwId', throwId);
  formData.append('stageLabel', stageLabel);

  const res = await fetch('/centrd/api/photos/upload', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload image file');
  return res.json();
}
