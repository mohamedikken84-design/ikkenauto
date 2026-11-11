"use client";
import {useEffect,useState} from "react";
type Company={source_row:number;name:string;city:string|null;address:string|null;website:string|null};
export function CompanyLookup({title,onSelect}:{title:string;onSelect?:(c:Company)=>void}){
 const [query,setQuery]=useState(""),[result,setResult]=useState<Company[]>([]),[busy,setBusy]=useState(false),[selected,setSelected]=useState<number|null>(null),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
  if(query.trim().length<2){setResult([]);setLoaded(false);return;}
  let cancelled=false;const ctrl=new AbortController();
  const t=setTimeout(async()=>{
   setBusy(true);try{const response=await fetch("/portal/api/directory?q="+encodeURIComponent(query.trim()),{signal:ctrl.signal});
    const data=await response.json();if(!cancelled){setResult(data.companies||[]);setLoaded(true);}
   }catch{if(!cancelled){setResult([]);setLoaded(true);}}finally{if(!cancelled)setBusy(false);}
  },250);
  return()=>{cancelled=true;ctrl.abort();clearTimeout(t);};
 },[query]);
 return <div className="portal-lookup"><label>{title}<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);}} placeholder="Zoek je bedrijfsnaam…" autoComplete="off"/></label>
 {busy&&<small>Zoeken…</small>}
 {loaded&&!busy&&result.length===0&&<small>Geen match gevonden in de geïmporteerde bedrijvengids.</small>}
 {result.length>0&&<div className="portal-lookup-results">{result.map(c=><button type="button" key={c.source_row} className={selected===c.source_row?"chosen":""} onClick={()=>{setSelected(c.source_row);onSelect?.(c);}}>
   <strong>{c.name}</strong><span>{c.city||"België"}{c.address?", "+c.address:""}</span>
   {selected===c.source_row&&<b>Geselecteerd</b>}
 </button>)}</div>}
 </div>;
}