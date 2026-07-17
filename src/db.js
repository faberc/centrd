// --- IndexedDB Setup for Offline/Local-First Mode ---
let localDbPromise = null;
function getLocalDb() {
  if (localDbPromise) return localDbPromise;
  
  localDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open("throwing_log_local_db", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("throws")) {
        db.createObjectStore("throws", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "userId" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
  return localDbPromise;
}

async function readLocal(storeName, key) {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeLocal(storeName, value) {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteLocal(storeName, key) {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function listLocal(storeName) {
  const db = await getLocalDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Local Potter Profile Operations ---
export function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem("throwing_log_profiles") || "[]");
  } catch (e) {
    console.error("Failed to load local profiles", e);
    return [];
  }
}

export function createProfile(name, studio = "", avatar = "🍯") {
  const profiles = getProfiles();
  const id = "profile_" + Math.random().toString(36).substr(2, 9);
  const newProfile = { id, name, studio, avatar };
  profiles.push(newProfile);
  localStorage.setItem("throwing_log_profiles", JSON.stringify(profiles));
  return newProfile;
}

export async function deleteProfile(profileId) {
  // Delete profile record
  const profiles = getProfiles();
  const updated = profiles.filter(p => p.id !== profileId);
  localStorage.setItem("throwing_log_profiles", JSON.stringify(updated));

  // If this was the active user, sign out
  const activeUserJson = localStorage.getItem("throwing_log_mock_user");
  if (activeUserJson) {
    const activeUser = JSON.parse(activeUserJson);
    if (activeUser.id === profileId) {
      localStorage.removeItem("throwing_log_mock_user");
      window.dispatchEvent(new CustomEvent("local-auth-changed"));
    }
  }

  // Clear that profile's settings & throws in IndexedDB
  try {
    await deleteLocal("settings", profileId);
    
    const throws = await listLocal("throws");
    for (const t of throws) {
      if (t.userId === profileId) {
        await deleteLocal("throws", t.id);
      }
    }
    window.dispatchEvent(new CustomEvent("local-throws-updated"));
  } catch (e) {
    console.error("Error clearing deleted profile data:", e);
  }
}

export function signInProfile(profile) {
  localStorage.setItem("throwing_log_mock_user", JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("local-auth-changed"));
}

// --- Local Auth Operations ---
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

// --- Challenge Settings Operations ---
export async function loadSettings(userId) {
  const settings = await readLocal("settings", userId);
  if (settings) return settings;
  
  // Return default profile settings template
  return {
    userId,
    targetCylinders: 200,
    hasTimeLimit: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    scheduleType: "none",
    cadenceFrequency: 3,
    cadencePeriod: "week",
    globalUnit: "lb",
    weightCategories: [
      { id: "1lb", name: "1 lb Cylinder", weight: 1, unit: "lb", targetCount: 100 },
      { id: "2lb", name: "2 lb Cylinder", weight: 2, unit: "lb", targetCount: 50 },
      { id: "3lb", name: "3 lb Cylinder", weight: 3, unit: "lb", targetCount: 30 },
      { id: "5lb", name: "5 lb Cylinder", weight: 5, unit: "lb", targetCount: 20 }
    ]
  };
}

export async function saveSettings(userId, settings) {
  await writeLocal("settings", { ...settings, userId });
}

// --- Cylinder Throw Logs Operations ---
export async function addThrowLog(userId, throwData) {
  const id = "throw_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
  const data = {
    id,
    userId,
    createdAt: new Date().toISOString(),
    photos: [],
    ...throwData
  };

  await writeLocal("throws", data);
  window.dispatchEvent(new CustomEvent("local-throws-updated"));
  return id;
}

export async function updateThrowLog(throwId, updates) {
  const existing = await readLocal("throws", throwId);
  if (existing) {
    const updated = { ...existing, ...updates };
    await writeLocal("throws", updated);
    window.dispatchEvent(new CustomEvent("local-throws-updated"));
  }
}

export async function deleteThrowLog(throwId) {
  await deleteLocal("throws", throwId);
  window.dispatchEvent(new CustomEvent("local-throws-updated"));
}

export function subscribeToThrows(userId, callback, errorCallback) {
  const fetchAndCallback = async () => {
    try {
      const all = await listLocal("throws");
      const filtered = all
        .filter(t => t.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback(filtered);
    } catch (err) {
      console.error("Local load throws failed:", err);
      if (errorCallback) errorCallback(err);
    }
  };

  fetchAndCallback();
  
  window.addEventListener("local-throws-updated", fetchAndCallback);
  return () => {
    window.removeEventListener("local-throws-updated", fetchAndCallback);
  };
}

// --- Local Base64 Image Upload Operation ---
export async function uploadThrowPhoto(userId, throwId, file, stageLabel = "Thrown") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        id: "photo_" + Math.random().toString(36).substr(2, 9),
        url: reader.result,
        stage: stageLabel,
        timestamp: new Date().toISOString()
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
