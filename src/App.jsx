import React,{useEffect,useState} from 'react';
import {BrowserRouter,useLocation} from 'react-router-dom';
import Attendee from './Attendee.jsx';
import Screen from './Screen.jsx';
import Admin from './AdminPortal.jsx';
function Routes(){const location=useLocation();const [darkMode,setDarkMode]=useState(false);useEffect(()=>{document.documentElement.classList.toggle('dark',darkMode)},[darkMode]);const teamScreen=location.pathname.match(/^\/screen\/team\/(1|2)$/);if(location.pathname==='/screen'||teamScreen)return <Screen darkMode={darkMode} teamId={teamScreen?Number(teamScreen[1]):null}/>;if(location.pathname==='/admin')return <Admin darkMode={darkMode} setDarkMode={setDarkMode}/>;return <Attendee darkMode={darkMode} setDarkMode={setDarkMode}/>}
export default function App(){return <BrowserRouter><Routes/></BrowserRouter>}
