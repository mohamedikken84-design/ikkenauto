"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {loadInitialCatalog,type EquipmentItem} from "@/lib/dealer/catalog-client";

const fuelOptions=["Benzine","Diesel","Elektrisch","Hybride","Plug-in hybride","LPG","CNG","Waterstof"];
export function DealerInventoryFilters({q,status,fuel,equipment}:{q:string;status:string;fuel:string;equipment:string}){
 const [features,setFeatures]=useState<EquipmentItem[]>([]);
 useEffect(()=>{
  let active=true;
  loadInitialCatalog().then(v=>{if(active)setFeatures(v.equipment)}).catch(()=>{});
  return ()=>{active=false};
 },[]);
 const active=Boolean(q||status||fuel||equipment);
 return <form className="dealer-stock-filters" action="/portal" method="get" role="search">
  <input type="hidden" name="tab" value="voertuigen"/>
  <label className="dealer-search-field" htmlFor="dealer-search-stock">
   <span>Merk, model of stocknummer</span>
   <input id="dealer-search-stock" name="q" type="search" maxLength={60} defaultValue={q}
    placeholder="Bijv. BMW X5" autoComplete="off"/>
  </label>
  <label className="dealer-search-status" htmlFor="dealer-stock-status">
   <span>Voorraadstatus</span>
   <select id="dealer-stock-status" name="status" defaultValue={status}>
    <option value="">Alle statussen</option>
    <option value="draft">Concept</option><option value="ready">Klaar voor lancering</option><option value="sold">Verkocht</option>
   </select>
  </label>
  <label className="dealer-search-status" htmlFor="dealer-stock-fuel">
   <span>Brandstof</span>
   <select id="dealer-stock-fuel" name="fuel" defaultValue={fuel}>
    <option value="">Alle brandstoffen</option>
    {fuelOptions.map(x=><option value={x} key={x}>{x}</option>)}
   </select>
  </label>
  <label className="dealer-search-field" htmlFor="dealer-stock-feature">
   <span>Uitrustingskenmerk</span>
   <select id="dealer-stock-feature" name="equipment" defaultValue={equipment} key={equipment+"-"+features.length}>
    <option value="">Alle uitrusting</option>
    {equipment&&!features.some(x=>x.code===equipment)&&<option value={equipment}>Geselecteerde optie</option>}
    {features.map(item=><option key={item.code} value={item.code}>{item.label_nl}</option>)}
   </select>
  </label>
  <button className="dealer-filter-button" type="submit">Zoeken</button>
  {active&&<Link className="dealer-clear-filters" href="/portal?tab=voertuigen">Filters wissen</Link>}
 </form>;
}
