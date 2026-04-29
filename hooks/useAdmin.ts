'use client';

import { useState, useEffect } from 'react';

const LS_KEY     = 'neve-ofer-admin';
const LS_GABBAI  = 'neve-ofer-gabbai';
const DEVICE_KEY = 'neve-ofer-device';
const EVT        = 'admin-state-changed';

function getMasterPin() { return process.env.NEXT_PUBLIC_ADMIN_PIN ?? '1234'; }

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(DEVICE_KEY, id); }
    return id;
  } catch { return ''; }
}

function readState() {
  try {
    const deviceId = getDeviceId();
    const stored   = localStorage.getItem(LS_KEY);
    if (stored && deviceId && stored === deviceId) return { isAdmin: true, gabbaiOf: null };
    const gabbaiId = localStorage.getItem(LS_GABBAI);
    if (gabbaiId) return { isAdmin: false, gabbaiOf: Number(gabbaiId) };
  } catch { /* ignore */ }
  return { isAdmin: false, gabbaiOf: null };
}

export function useAdmin() {
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [gabbaiOf, setGabbaiOf] = useState<number | null>(null);

  const apply = () => {
    const s = readState();
    setIsAdmin(s.isAdmin);
    setGabbaiOf(s.gabbaiOf);
  };

  useEffect(() => {
    apply();
    window.addEventListener(EVT, apply);
    return () => window.removeEventListener(EVT, apply);
  }, []);

  const loginAsMaster = (pin: string): boolean => {
    if (pin !== getMasterPin()) return false;
    try { localStorage.setItem(LS_KEY, getDeviceId()); localStorage.removeItem(LS_GABBAI); } catch { /* ignore */ }
    setIsAdmin(true); setGabbaiOf(null);
    window.dispatchEvent(new Event(EVT));
    return true;
  };

  const loginAsGabbai = (synId: number) => {
    try { localStorage.setItem(LS_GABBAI, String(synId)); } catch { /* ignore */ }
    setGabbaiOf(synId);
    window.dispatchEvent(new Event(EVT));
  };

  const logout = () => {
    try { localStorage.removeItem(LS_KEY); localStorage.removeItem(LS_GABBAI); } catch { /* ignore */ }
    setIsAdmin(false); setGabbaiOf(null);
    window.dispatchEvent(new Event(EVT));
  };

  return { isAdmin, gabbaiOf, loginAsMaster, loginAsGabbai, logout };
}
