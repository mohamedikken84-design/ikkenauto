"use client";
import {useActionState,useState} from "react";
import {updateGarageProfile} from "./actions";
type Garage={name:string;city:string;phone:string|null;postal_code:string|null;website:string|null;status:string};
export function GarageProfile({garage}:{garage:Garage}){
 const [state,action,pending]=useActionState(updateGarageProfile,{error:""});
 const [data,setData]=useState({name:garage.name,city:garage.city,phone:garage.phone||"",postal_code:garage.postal_code||"",website:garage.website||""});
 const field=(key:keyof typeof data,value:string)=>setData(s=>({...s,[key]:value}));
 return <section className="portal-card portal-setup"><span className="portal-overline">BEDRIJFSPROFIEL</span><h1 style={{fontSize:28,fontWeight:800}}>Garagegegevens</h1>
 <p>Status: <strong>{garage.status==="verified"?"Geverifieerd":garage.status==="suspended"?"Geblokkeerd":"In beoordeling"}</strong>. Verificatie kan alleen door IKKENAUTO worden gewijzigd.</p>
 <form action={action} className="portal-form portal-fields">
  <label>Bedrijfsnaam *<input name="name" required value={data.name} onChange={e=>field("name",e.target.value)}/></label>
  <label>Gemeente *<input name="city" required value={data.city} onChange={e=>field("city",e.target.value)}/></label>
  <label>Postcode<input name="postal_code" value={data.postal_code} onChange={e=>field("postal_code",e.target.value)}/></label>
  <label>Telefoon<input name="phone" type="tel" value={data.phone} onChange={e=>field("phone",e.target.value)}/></label>
  <label className="portal-full">Website<input name="website" type="url" value={data.website} onChange={e=>field("website",e.target.value)} placeholder="https://"/></label>
  {state.error&&<p role="alert" className="portal-form-error portal-full">{state.error}</p>}
  {state.message&&<p role="status" className="portal-form-ok portal-full">{state.message}</p>}
  <button disabled={pending} className="portal-button portal-full">{pending?"Opslaan…":"Gegevens opslaan"}</button>
 </form></section>;
}