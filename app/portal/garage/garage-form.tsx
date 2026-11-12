"use client";
import {useActionState,useState} from "react";
import {saveGarage} from "./actions";
export type GarageRecord={name:string;city:string;postal_code:string|null;street:string|null;phone:string|null;website:string|null;description:string|null;kbo_number:string|null};
export function GarageProfileForm({garage}:{garage:GarageRecord}){
 const [state,action,pending]=useActionState(saveGarage,{error:""});
 const [data,setData]=useState<Record<string,string>>({name:garage.name,city:garage.city,postal_code:garage.postal_code||"",street:garage.street||"",phone:garage.phone||"",website:garage.website||"",description:garage.description||"",kbo_number:garage.kbo_number||""});
 const field=(k:string,label:string,type="text",required=false)=><label>{label}<input name={k} type={type} required={required} value={data[k]||""} onChange={e=>setData(s=>({...s,[k]:e.target.value}))}/></label>;
 return <form action={action} className="portal-form portal-fields">
  {field("name","Bedrijfsnaam *","text",true)}{field("kbo_number","Ondernemingsnummer")}
  {field("city","Gemeente *","text",true)}{field("postal_code","Postcode")}
  {field("street","Straat en huisnummer")}{field("phone","Telefoon","tel")}
  <div className="portal-full">{field("website","Website","url")}</div>
  <label className="portal-full">Beschrijving<textarea name="description" rows={4} value={data.description} onChange={e=>setData(s=>({...s,description:e.target.value}))}/></label>
  {state.error&&<p className="portal-form-error portal-full" role="alert">{state.error} De gegevens blijven ingevuld.</p>}
  <button disabled={pending} className="portal-button portal-full">Garagegegevens bewaren</button>
 </form>;
}
