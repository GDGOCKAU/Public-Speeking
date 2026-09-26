import { io } from 'socket.io-client';
export const API_BASE_URL=import.meta.env.VITE_API_URL||'';
export async function api(path,options={}){const res=await fetch(`${API_BASE_URL}/api${path}`,{credentials:'include',headers:{'Content-Type':'application/json'},...options,body:options.body?JSON.stringify(options.body):undefined});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'Request failed.');return data;}
export function subscribe(onChange,role='public',attendeeId){const socket=io(API_BASE_URL||window.location.origin,{withCredentials:true,auth:{role,attendeeId}});const sync=()=>onChange();socket.on('connect',sync);socket.on('event:changed',sync);socket.on('connect_error',sync);return()=>socket.disconnect();}
