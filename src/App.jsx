import React,{useEffect,useState} from 'react';
import {BrowserRouter,useLocation} from 'react-router-dom';
import Attendee from './Attendee.jsx';
import Screen from './Screen.jsx';
import Admin from './AdminPortal.jsx';
import {LANGUAGE_STORAGE_KEY} from './i18n.js';
function Routes(){const location=useLocation();const [darkMode,setDarkMode]=useState(false),[language,setLanguage]=useState(()=>localStorage.getItem(LANGUAGE_STORAGE_KEY)==='ar'?'ar':'en');const teamScreen=location.pathname.match(/^\/screen\/team\/(1|2)$/),isAttendee=location.pathname!=='/admin'&&location.pathname!=='/screen'&&!teamScreen;useEffect(()=>{document.documentElement.classList.toggle('dark',darkMode)},[darkMode]);useEffect(()=>{document.documentElement.lang=isAttendee?language:'en';document.documentElement.dir=isAttendee&&language==='ar'?'rtl':'ltr';localStorage.setItem(LANGUAGE_STORAGE_KEY,language)},[isAttendee,language]);if(location.pathname==='/screen'||teamScreen)return <Screen darkMode={darkMode} teamId={teamScreen?Number(teamScreen[1]):null}/>;if(location.pathname==='/admin')return <Admin darkMode={darkMode} setDarkMode={setDarkMode}/>;return <Attendee darkMode={darkMode} setDarkMode={setDarkMode} language={language} setLanguage={setLanguage}/>}
export default function App(){return <BrowserRouter><Routes/></BrowserRouter>}
