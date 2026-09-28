import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { pool } from './db/index.js';
import { AppError } from './services/logic.js';
const cookieName='gdg_admin';
const hash=x=>createHash('sha256').update(x).digest('hex');
export function assertAdminPassword(password){const expected=process.env.ADMIN_PASSWORD||'',supplied=String(password||'');const a=Buffer.from(hash(expected),'hex'),b=Buffer.from(hash(supplied),'hex');if(!expected||!timingSafeEqual(a,b))throw new AppError(401,'Incorrect password.');}
export async function session(req){const token=req.signedCookies?.[cookieName];if(!token||!/^[0-9a-f]{64}$/.test(token))return false;const r=await pool.query('SELECT 1 FROM admin_sessions WHERE token_hash=$1 AND expires_at>now()',[hash(token)]);return !!r.rowCount;}
export async function requireAdmin(req,res,next){try{if(!await session(req))throw new AppError(401,'Admin session required.');next();}catch(e){next(e);}}
export async function login(req,res){assertAdminPassword(req.body?.password);const token=randomBytes(32).toString('hex');await pool.query("INSERT INTO admin_sessions(token_hash,expires_at) VALUES($1,now()+interval '12 hours')",[hash(token)]);res.cookie(cookieName,token,{signed:true,httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:12*60*60*1000});res.json({ok:true});}
export async function logout(req,res){const token=req.signedCookies?.[cookieName];if(token)await pool.query('DELETE FROM admin_sessions WHERE token_hash=$1',[hash(token)]);res.clearCookie(cookieName,{path:'/'});res.json({ok:true});}
