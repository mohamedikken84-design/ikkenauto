"use client";
import {useEffect,useState} from "react";

type Company={source_row:number;name:string;city:string|null;address:string|null;website:string|null};

export function CompanyLookup({title,onSelect,onClear}:{title:string;onSelect?:(c:Company)=>void;onClear?:()=>void}){
 const [query,setQuery]=useState("");
 const [result,setResult]=useState<Company[]>([]);
 const [busy,setBusy]=useState(false);
 const [selected,setSelected]=useState<number|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [failed,setFailed]=useState(false);

 useEffect(()=>{
  const trimmed=query.trim();
  if(trimmed.length<2)return;
  let cancelled=false;
  const controller=new AbortController();
  const timeout=setTimeout(async()=>{
   setBusy(true);
   try{
    const response=await fetch("/portal/api/directory?q="+encodeURIComponent(trimmed),{signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw new Error("Directory lookup unavailable");
    const data=await response.json() as {companies?:Company[]};
    if(!cancelled){
     setResult(Array.isArray(data.companies)?data.companies:[]);
     setLoaded(true);
     setFailed(false);
    }
   }catch{
    if(!cancelled&&!controller.signal.aborted){
     setResult([]);
     setLoaded(true);
     setFailed(true);
    }
   }finally{if(!cancelled)setBusy(false);}
  },250);
  return ()=>{cancelled=true;controller.abort();clearTimeout(timeout);};
 },[query]);

 return <div className="portal-lookup">
  <label>{title}
   <input type="search" value={query} onChange={event=>{
    const next=event.target.value;
    setQuery(next);
    setSelected(null);
    setResult([]);
    setLoaded(false);
    setFailed(false);
    setBusy(next.trim().length>=2);
    onClear?.();
   }} placeholder="Zoek een garage of gemeente…" autoComplete="off"/>
  </label>
  {busy&&<small role="status">Zoeken…</small>}
  {failed&&!busy&&<small role="alert">Zoeken lukt momenteel niet. Probeer het opnieuw.</small>}
  {loaded&&!busy&&!failed&&result.length===0&&<small>Geen vermelding gevonden. Je kunt je garage zelf toevoegen.</small>}
  {result.length>0&&!failed&&<div className="portal-lookup-results">{result.map(company=><button type="button" key={company.source_row} className={selected===company.source_row?"chosen":""} onClick={()=>{setSelected(company.source_row);onSelect?.(company);}}>
    <strong>{company.name}</strong>
    <span>{company.city||"België"}{company.address?", "+company.address:""}</span>
    {selected===company.source_row&&<b>Geselecteerd</b>}
   </button>)}</div>}
 </div>;
}
