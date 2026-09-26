import test from 'node:test';
import assert from 'node:assert/strict';
import {io} from 'socket.io-client';

test('HTTP admin protection and socket authorization', {skip:!process.env.TEST_API_URL}, async()=>{
 const base=process.env.TEST_API_URL;
 const protectedResponse=await fetch(`${base}/api/admin/snapshot`);assert.equal(protectedResponse.status,401);
 const bad=await fetch(`${base}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'wrong'})});assert.equal(bad.status,401);
 const good=await fetch(`${base}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:process.env.TEST_ADMIN_PASSWORD})});assert.equal(good.status,200);const cookie=good.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
 const snapshot=await fetch(`${base}/api/admin/snapshot`,{headers:{Cookie:cookie}});assert.equal(snapshot.status,200);assert.equal((await snapshot.json()).activity,'NONE');
 const connect=extraHeaders=>new Promise(resolve=>{const socket=io(base,{transports:['websocket'],auth:{role:'admin'},extraHeaders,timeout:3000,reconnection:false});socket.on('connect',()=>{socket.disconnect();resolve(true)});socket.on('connect_error',()=>{socket.disconnect();resolve(false)});});
 assert.equal(await connect({}),false);assert.equal(await connect({Cookie:cookie}),true);
});
