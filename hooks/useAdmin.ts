'use client';

import { useState, useEffect } from 'react';

const LS_KEY     = 'neve-ofer-admin';
const DEVICE_KEY = 'neve-ofer-device';

function getPin() {
  return process.env.NEXT_PUBLIC_ADMIN_PIN ?? '1234';
}

// מזהה ייחודי למכשיר — נשמר לצמיתות
function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch { return ''; }
}

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const deviceId  = getDeviceId();
      const stored    = localStorage.getItem(LS_KEY);
      if (stored && deviceId && stored === deviceId) setIsAdmin(true);
    } catch { /* ignore */ }
  }, []);

  const login = (pin: string): boolean => {
    if (pin === getPin()) {
      try {
        const deviceId = getDeviceId();
        localStorage.setItem(LS_KEY, deviceId);
      } catch { /* ignore */ }
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
    setIsAdmin(false);
  };

  return { isAdmin, login, logout };
}
