import React,{useCallback,useEffect,useState} from 'react';
import {api,subscribe} from './api.js';
import {Brand,Busy,Button,Card,DecorativePattern,ErrorBanner,Input,palette,Pill,Select,Shell,ThemeToggle} from './components/UI.jsx';

const COLORS=['#4285F4','#EA4335','#FBBC04','#34A853'];

export default function Attendee({darkMode,setDarkMode}){
  const [id,setId]=useState(localStorage.getItem('gdg_attendee_id'));
  const [data,setData]=useState(null);
  const [name,setName]=useState('');
  const [team,setTeam]=useState(1);
  const [rating,setRating]=useState(75);
  const [answer,setAnswer]=useState('');
  const [choice,setChoice]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [offline,setOffline]=useState(false);
  const t=palette(darkMode);

  const refresh=useCallback(async()=>{
    try{
      const d=await api(`/state${id?`?attendeeId=${encodeURIComponent(id)}`:''}`);
      if(id&&!d.viewer){localStorage.removeItem('gdg_attendee_id');setId(null)}
      setData(d);setOffline(false);if(d.viewer)setDarkMode(!!d.viewer.dark_mode);
    }catch(e){setOffline(true);setError(e.message)}
  },[id,setDarkMode]);

  useEffect(()=>{refresh();const unsubscribe=subscribe(refresh,'public',id);const onVisible=()=>{if(document.visibilityState==='visible')refresh()};document.addEventListener('visibilitychange',onVisible);const poll=setInterval(onVisible,15000);return()=>{unsubscribe();document.removeEventListener('visibilitychange',onVisible);clearInterval(poll)}},[refresh,id]);
  useEffect(()=>{if(data?.scenario?.id)setAnswer(localStorage.getItem(`gdg_answer_${data.scenario.id}`)||'')},[data?.scenario?.id]);
  useEffect(()=>{const r=data?.scenario;if(r?.status!=='COLLECTING'||!r.endsAt)return;const timer=setTimeout(refresh,Math.max(0,new Date(r.endsAt).getTime()-Date.now())+150);return()=>clearTimeout(timer)},[data?.scenario?.status,data?.scenario?.endsAt,refresh]);
  useEffect(()=>{setChoice('')},[data?.scenario?.id]);
  useEffect(()=>{const token=new URLSearchParams(location.search).get('confirm');if(!token||!id)return;action('/speaker/confirm',{token,attendeeId:id},true).then(()=>history.replaceState({},'',location.pathname)).catch(()=>{})},[id]);

  async function action(path,body,quiet=false){setBusy(true);setError('');try{await api(path,{method:'POST',body});await refresh();if(path==='/scenario/answers'&&data?.scenario?.id)localStorage.removeItem(`gdg_answer_${data.scenario.id}`)}catch(e){setError(e.message);if(!quiet)throw e}finally{setBusy(false)}}
  async function register(e){e.preventDefault();setBusy(true);setError('');try{const a=await api('/attendees',{method:'POST',body:{name,teamId:Number(team)}});localStorage.setItem('gdg_attendee_id',a.id);setId(a.id)}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function toggleTheme(){const next=!darkMode;setDarkMode(next);if(id)try{await api(`/attendees/${id}/theme`,{method:'PATCH',body:{darkMode:next}})}catch{setDarkMode(!next)}}

  if(!data)return <Shell darkMode={darkMode}><div className="min-h-[calc(100vh-4px)] flex items-center justify-center"><Busy darkMode={darkMode}/></div></Shell>;
  if(!data.viewer)return <JoinPage data={data} darkMode={darkMode} toggleTheme={toggleTheme} name={name} setName={setName} team={team} setTeam={setTeam} register={register} busy={busy} error={error}/>;

  const s=data.speaker,r=data.scenario,me=data.viewer;
  let heading='You’re all set';let detail='The next activity will appear here automatically.';let content=null;
  if(data.activity==='SPEAKER'&&s){
    if(s.status==='SELECTED'){heading=s.isSpeaker?'You’re up next!':'Speaker selected';detail=s.isSpeaker?'Go to the control desk and scan the private QR on the dashboard.':`${s.name} is getting ready.`}
    if(s.status==='CONFIRMED'){heading=s.isSpeaker?'The stage is yours':`${s.name} is speaking`;detail=s.isSpeaker?'Here is your randomly selected speaking prompt.':'Voting opens after the speech.';if(s.isSpeaker&&s.prompt)content=<SpeakerPrompt prompt={s.prompt} darkMode={darkMode}/>}
    if(s.status==='OPEN'){
      if(s.isSpeaker){heading='Your team is voting';detail='Sit tight while your teammates submit their ratings.';if(s.prompt)content=<SpeakerPrompt prompt={s.prompt} darkMode={darkMode}/>}
      else if(!s.canVote){heading='Team voting is in progress';detail=`Only ${s.teamName} members can rate this speaker.`;content=<VoteRestriction darkMode={darkMode} teamName={s.teamName}/>}
      else{heading='Rate this speaker';detail=`How did ${s.name} do?`;content=s.hasVoted?<Success darkMode={darkMode} text="Rating submitted"/>:<div className="space-y-5"><div className="text-center font-['DM_Sans'] text-[64px] font-bold tracking-[-2px]" style={{color:'#3A7CF5'}}>{rating}<span className="text-[22px] tracking-normal">/100</span></div><div className="pt-2"><input aria-label="Speaker rating from 0 to 100" className="speaker-rating w-full" style={{'--rating':`${rating}%`,'--track':t.alt}} type="range" min="0" max="100" step="1" value={rating} onChange={e=>setRating(Number(e.target.value))}/><div className="flex justify-between font-['Roboto'] text-[12px] mt-3" style={{color:t.muted}}><span>0</span><span>50</span><span>100</span></div></div><Button disabled={busy} className="w-full" onClick={()=>action('/speaker/votes',{attendeeId:id,rating}).catch(()=>{})}>Submit rating</Button></div>}
    }
    if(s.status==='CLOSED'){heading='Voting is closed';detail='The result is coming soon.'}
    if(s.status==='REVEALED'){heading=`${s.name} scored`;detail=s.teamName;content=<div className="score-reveal text-center font-['DM_Sans'] text-[76px] font-bold" style={{color:s.teamColor}}>{Math.round(s.score)}%</div>}
  }
  if(data.activity==='SCENARIO'&&r){
    if(r.status==='COLLECTING'){
      heading='The scenario is live';detail=r.text;
      content=<div className="space-y-4"><Countdown endsAt={r.endsAt} darkMode={darkMode}/>{!r.canSubmit?<div className="rounded-[12px] p-5 text-center font-['Roboto'] text-[14px]" style={{background:t.alt,color:t.muted}}>This round had already started when you joined. You can vote when answer time ends.</div>:r.submitted?<Success darkMode={darkMode} text="Answer submitted before the deadline"/>:<><Input textarea darkMode={darkMode} label="Your response" value={answer} maxLength={2000} onChange={e=>{setAnswer(e.target.value);localStorage.setItem(`gdg_answer_${r.id}`,e.target.value)}}/><Button disabled={busy||!answer.trim()} className="w-full" onClick={()=>action('/scenario/answers',{attendeeId:id,text:answer}).catch(()=>{})}>Submit answer</Button></>}</div>
    }
    if(r.status==='OPEN'){
      heading='Choose the best response';detail='Every answer is anonymous. You can vote for any answer except your own.';
      content=<div className="space-y-3">{r.voted&&<Success darkMode={darkMode} text="Vote submitted"/>}{r.answers.length?r.answers.map((a,i)=><button key={a.id} disabled={a.is_own||r.voted} onClick={()=>setChoice(a.id)} className="block w-full rounded-[12px] p-4 text-left border-2 transition-all disabled:cursor-not-allowed" style={{borderColor:choice===a.id?'#3A7CF5':t.border,background:a.is_own?t.alt:choice===a.id?(darkMode?'#1A2E4B':'#E8F0FE'):t.card,opacity:a.is_own ? .68 : 1}}><span className="flex items-center justify-between gap-3 font-['DM_Sans'] font-bold text-[12px] mb-1 uppercase tracking-wide" style={{color:a.is_own?t.muted:'#3A7CF5'}}><span>Answer {String.fromCharCode(65+i)}</span>{a.is_own&&<span className="normal-case font-['Roboto']">Your answer · voting disabled</span>}</span><span className="font-['Roboto'] text-[15px]">{a.answer_text}</span></button>):<div className="rounded-[12px] p-5 text-center font-['Roboto'] text-[14px]" style={{background:t.alt,color:t.muted}}>No answers were submitted in time.</div>}{!r.voted&&r.answers.some(a=>!a.is_own)&&<Button disabled={busy||!choice} className="w-full" onClick={()=>action('/scenario/votes',{attendeeId:id,answerId:choice}).catch(()=>{})}>Submit vote</Button>}</div>
    }
    if(r.status==='CLOSED'){heading='Voting is closed';detail='Results are coming soon.'}
    if(r.status==='REVEALED'){heading='Scenario results';detail=r.title;content=<div className="space-y-1">{r.answers.map((a,i)=><div key={a.id} className="flex items-start justify-between gap-4 py-3.5 border-b" style={{borderColor:t.border}}><div className="flex gap-3"><Rank number={i+1}/><div><b className="font-['DM_Sans'] text-[14px]">{a.author}</b><p className="font-['Roboto'] text-[13px] mt-1" style={{color:t.muted}}>{a.answer_text}</p></div></div><b className="font-['DM_Sans'] whitespace-nowrap" style={{color:'#3A7CF5'}}>{a.votes} pts</b></div>)}</div>}
  }

  const teamData=data.teams.find(x=>x.id===me.team_id);
  return <Shell darkMode={darkMode} className="h-screen overflow-hidden">
    <header className="h-16 px-5 sm:px-8 flex items-center border-b flex-shrink-0" style={{background:t.card,borderColor:t.border}}>
      <Brand darkMode={darkMode}/>
      <div className="hidden sm:flex ml-10 px-4 py-2 rounded-[8px] font-['DM_Sans'] text-[14px] font-semibold" style={{background:darkMode?'#1A2E4B':'#E8F0FE',color:'#3A7CF5'}}>Live Event</div>
      <div className="ml-auto flex items-center gap-3"><div className="hidden sm:flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold font-['DM_Sans']" style={{background:teamData?.color}}>{initials(me.name)}</div><span className="font-['DM_Sans'] text-[13px] font-semibold">{me.name}</span></div><div className="w-px h-5 hidden sm:block" style={{background:t.border}}/><ThemeToggle darkMode={darkMode} onClick={toggleTheme}/></div>
    </header>
    <main className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-7">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6"><h1 className="font-['DM_Sans'] text-[26px] font-bold tracking-[-.4px]">Welcome back, {me.name.split(' ')[0]}</h1><p className="font-['Roboto'] text-[14px] mt-1" style={{color:t.muted}}>You are in <span className="font-['DM_Sans'] font-semibold" style={{color:teamData?.color}}>{teamData?.name}</span>.</p></div>
        {offline&&<div className="mb-4"><Pill kind="warning" darkMode={darkMode}>Reconnecting…</Pill></div>}
        <Card darkMode={darkMode} className="min-h-[470px] flex flex-col">
            <div className="flex items-center justify-between gap-4 pb-5 border-b" style={{borderColor:t.border}}><div><div className="font-['Roboto'] text-[11px] font-bold tracking-[.16em] uppercase" style={{color:t.muted}}>Current activity</div><div className="font-['DM_Sans'] text-[18px] font-bold mt-1">{data.eventName}</div></div><Pill darkMode={darkMode} kind={data.activity==='NONE'?'neutral':'info'}>{data.activity==='NONE'?'WAITING':data.activity==='SPEAKER'?'SPEAKER COMPETITION':'SCENARIO CHALLENGE'}</Pill></div>
            <div className="flex-1 flex flex-col justify-center py-8 max-w-2xl mx-auto w-full"><h2 className="font-['DM_Sans'] text-[34px] font-bold tracking-[-.5px] leading-tight">{heading}</h2><p className="font-['Roboto'] text-[15px] mt-2 mb-7 leading-relaxed" style={{color:t.muted}}>{detail}</p>{content||<BrandDots/>}<div className="mt-5"><ErrorBanner message={error} darkMode={darkMode}/></div></div>
        </Card>
      </div>
    </main>
  </Shell>
}

function JoinPage({data,darkMode,toggleTheme,name,setName,team,setTeam,register,busy,error}){const t=palette(darkMode);return <Shell darkMode={darkMode}><main className="min-h-[calc(100vh-4px)] grid lg:grid-cols-2">
  <section className="relative overflow-hidden flex items-center justify-center p-6 sm:p-12 lg:p-16"><DecorativePattern darkMode={darkMode}/><div className="relative w-full max-w-[460px] rounded-[24px] p-8 sm:p-10 border" style={{background:t.card,borderColor:t.border,boxShadow:'0 1px 2px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06)'}}><Brand darkMode={darkMode}/><div className="h-px my-7" style={{background:t.border}}/><h1 className="font-['DM_Sans'] text-[42px] font-bold leading-[1.1] tracking-[-.5px]">Take the stage.<br/><span style={{color:'#3A7CF5'}}>Own the moment.</span></h1><p className="font-['Roboto'] text-[16px] leading-relaxed mt-5" style={{color:t.muted}}>Join the live public-speaking experience, support your team, and make every voice count.</p><div className="mt-8 space-y-3">{[['#EA4335','Live speaking rounds'],['#FBBC04','Audience-powered scoring'],['#34A853','Creative scenario challenges']].map(([color,text])=><div key={text} className="flex items-center gap-3 text-[14px] font-['Roboto']" style={{color:t.secondary}}><span className="w-2 h-2 rounded-full" style={{background:color}}/>{text}</div>)}</div><div className="mt-8 pt-5 border-t" style={{borderColor:t.border}}><span className="inline-flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-full font-['Roboto']" style={{background:t.bg,color:t.muted}}><span style={{color:'#FBBC04'}}>★</span> Powered by GDG KAU</span></div></div></section>
  <section className="relative flex items-center justify-center p-6 sm:p-12 lg:p-16" style={{background:t.card}}><div className="absolute top-8 right-8 flex items-center gap-3"><BrandDots small/><ThemeToggle darkMode={darkMode} onClick={toggleTheme}/></div><div className="w-full max-w-[390px]"><Pill darkMode={darkMode}>LIVE EVENT ACCESS</Pill><h2 className="font-['DM_Sans'] text-[30px] font-bold tracking-[-.4px] mt-5">Join the event</h2><p className="font-['Roboto'] text-[14px] mt-1 mb-7" style={{color:t.muted}}>Enter your details to join the live activities.</p><form className="space-y-5" onSubmit={register}><Input darkMode={darkMode} label="Your name" value={name} maxLength={80} autoComplete="name" onChange={e=>setName(e.target.value)} placeholder="First and last name" required/><Select darkMode={darkMode} label="Your team" value={team} onChange={e=>setTeam(e.target.value)}>{data.teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</Select><ErrorBanner message={error} darkMode={darkMode}/>{busy?<Busy darkMode={darkMode}/>:<Button type="submit" className="w-full rounded-full py-3.5">Join event</Button>}</form></div></section>
</main></Shell>}

function BrandDots({small=false}){return <div className="flex justify-center gap-2 py-3">{COLORS.map(c=><span key={c} className={`${small?'w-2 h-2':'w-3 h-3'} rounded-full`} style={{background:c}}/>)}</div>}
function Rank({number}){return <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold font-['DM_Sans']" style={{background:number===1?'#FFF8E1':'#F1F3F4',color:number===1?'#E65100':'#5F6368'}}>{number}</span>}
function initials(name){return name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function Success({text,darkMode}){return <div className="rounded-[12px] p-5 font-['DM_Sans'] font-semibold text-center" style={{background:darkMode?'rgba(52,168,83,.15)':'#E8F5E9',color:darkMode?'#4ADE80':'#2E7D32'}}>✓ {text}</div>}
function VoteRestriction({teamName,darkMode}){return <div className="rounded-[12px] p-5 border flex items-center gap-3 font-['Roboto'] text-[14px]" style={{background:darkMode?'rgba(66,133,244,.15)':'#E8F0FE',borderColor:darkMode?'rgba(66,133,244,.35)':'#C6DAFC',color:darkMode?'#60A5FA':'#1967D2'}}><span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:'#4285F4'}}/><span>This vote is limited to <strong className="font-['DM_Sans']">{teamName}</strong>.</span></div>}
function SpeakerPrompt({prompt,darkMode}){return <div className="rounded-[16px] border p-6" style={{background:darkMode?'rgba(251,188,4,.15)':'#FFF8E1',borderColor:darkMode?'rgba(251,188,4,.35)':'#FFE082'}}><div className="font-['Roboto'] text-[11px] font-bold uppercase tracking-[.16em] mb-2" style={{color:darkMode?'#FBBF24':'#E65100'}}>Your speaking prompt</div><p className="font-['DM_Sans'] text-[22px] font-semibold leading-relaxed">{prompt}</p></div>}
function Countdown({endsAt,darkMode}){const [remaining,setRemaining]=useState(()=>Math.max(0,new Date(endsAt).getTime()-Date.now()));useEffect(()=>{const update=()=>setRemaining(Math.max(0,new Date(endsAt).getTime()-Date.now()));update();const timer=setInterval(update,250);return()=>clearInterval(timer)},[endsAt]);const seconds=Math.ceil(remaining/1000),minutes=Math.floor(seconds/60),rest=seconds%60,ending=seconds<=10;return <div className="flex items-center justify-between gap-4 rounded-[12px] border px-4 py-3" style={{background:ending?(darkMode?'#3A1414':'#FFEBEE'):(darkMode?'#2A1B0E':'#FFF3E0'),borderColor:ending?'#EA4335':'#FFB74D'}}><span className="font-['Roboto'] text-[13px]" style={{color:ending?(darkMode?'#FCA5A5':'#C62828'):(darkMode?'#FBBF24':'#E65100')}}>Time left to submit</span><strong className="font-['JetBrains_Mono'] text-[20px] tabular-nums" style={{color:ending?(darkMode?'#FCA5A5':'#C62828'):(darkMode?'#FBBF24':'#E65100')}}>{minutes}:{String(rest).padStart(2,'0')}</strong></div>}
