export class AppError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const fail = (status, message) => { throw new AppError(status, message); };
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const score = ratings => ratings.length ? Math.round((50 + ratings.reduce((a,b)=>a+b,0)/ratings.length*.5)*100)/100 : 50;
export const normalizeName = value => String(value || '').trim().replace(/\s+/g, ' ');
export function selectRandom(items, count = 1) { if (items.length < count) fail(409, 'Not enough eligible attendees.'); const pool = [...items]; for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; } return pool.slice(0,count); }
export function requireStatus(value, expected) { if (!expected.includes(value)) fail(409, `Action unavailable while status is ${value}.`); }
export function validText(value, max, label) { const v=String(value||'').trim(); if (!v || v.length>max) fail(400, `${label} must be 1–${max} characters.`); return v; }
