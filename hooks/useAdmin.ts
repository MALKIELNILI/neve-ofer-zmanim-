'use client';

import { useState, useEffect } from 'react';

const LS_KEY      = 'neve-ofer-admin';
const LS_GABBAI   = 'neve-ofer-gabbai';
const DEVICE_KEY  = 'neve-ofer-device';

function getMasterPin() {
  return process.env.NEXT_PUBLIC_ADMIN_PIN ?? '1234';
}

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
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [gabbaiOf, setGabbaiOf] = useState<number | null>(null);

  useEffect(() => {
    try {
      const deviceId = getDeviceId();
      const stored   = localStorage.getItem(LS_KEY);
      if (stored && deviceId && stored === deviceId) {
        setIsAdmin(true);
        return;
      }
      const gabbaiId = localStorage.getItem(LS_GABBAI);
      if (gabbaiId) setGabbaiOf(Number(gabbaiId));
    } catch { /* ignore */ }
  }, []);

  // כניסת מנהל ראשי
  const loginAsMaster = (pin: string): boolean => {
    if (pin !== getMasterPin()) return false;
    try {
      const deviceId = getDeviceId();
      localStorage.setItem(LS_KEY, deviceId);
      localStorage.removeItem(LS_GABBAI);
    } catch { /* ignore */ }
    setIsAdmin(true);
    setGabbaiOf(null);
    return true;
  };

  // כניסת גבאי — נקרא אחרי שהקוד אומת מול synagogue.editPin
  const loginAsGabbai = (synId: number) => {
    try { localStorage.setItem(LS_GABBAI, String(synId)); } catch { /* ignore */ }
    setGabbaiOf(synId);
  };

  const logout = () => {
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_GABBAI);
    } catch { /* ignore */ }
    setIsAdmin(false);
    setGabbaiOf(null);
  };

  return { isAdmin, gabbaiOf, loginAsMaster, loginAsGabbai, logout };
}
