"use client";
import Link from "next/link";
import {useActionState,useState} from "react";
import {updateOwnVehicle} from "./actions";
type Vehicle={id:string;make:string;model:string;version:string|null;price_eur:number;mileage_km:number|null;year:number|null;description:string|null;status:string};
export function EditVehicleForm({vehicle}:{vehicle:Vehicle}){
 const [state,action,pending]=useActionState(updateOwnVehicle,{error:""});
 const [values,setValues]=useState({make:vehicle.make,model:vehicle.model,version:vehicle.version||"",price_eur:String(vehicle.price_eur),mileage_km:vehicle.mileage_km===null?"":String(vehicle.mileage_km),year:vehicle.year===null?"":String(vehicle.year),description:vehicle.description||"",status:vehicle.status});
 function edit(k:keyof typeof values,v:string){setValues(s=>({...s,[k]:v}));}
 return <main className="portal-container">
  <Link href="/portal" className="portal-stock-edit">← Terug naar mijn voorraad</Link>
  <section className="portal-card portal-setup" style={{marginTop:24}}>
   <span className="portal-overline">MIJN VOORRAAD</span><h1 style={{fontSize:28,fontWeight:800,marginTop:8}}>Voertuig bewerken</h1>
   <p>Wijzig je voertuiggegevens. Opslaan publiceert geen advertentie.</p>
   <form action={action} className="portal-form portal-fields">
    <input type="hidden" name="id" value={vehicle.id}/>
    <label>Merk *<input name="make" value={values.make} required onChange={e=>edit("make",e.target.value)}/></label>
    <label>Model *<input name="model" value={values.model} required onChange={e=>edit("model",e.target.value)}/></label>
    <label>Uitvoering<input name="version" value={values.version} onChange={e=>edit("version",e.target.value)}/></label>
    <label>Vraagprijs (€) *<input type="number" name="price_eur" step=".01" min="0" required value={values.price_eur} onChange={e=>edit("price_eur",e.target.value)}/></label>
    <label>Kilometerstand<input type="number" name="mileage_km" min="0" value={values.mileage_km} onChange={e=>edit("mileage_km",e.target.value)}/></label>
    <label>Bouwjaar<input type="number" name="year" min="1900" max="2100" value={values.year} onChange={e=>edit("year",e.target.value)}/></label>
    <label>Status<select name="status" value={values.status} onChange={e=>edit("status",e.target.value)}><option value="draft">Concept</option><option value="ready">Klaar voor lancering</option><option value="sold">Verkocht</option></select></label>
    <label className="portal-full">Omschrijving<textarea name="description" rows={5} value={values.description} onChange={e=>edit("description",e.target.value)}/></label>
    {state.error&&<p className="portal-form-error portal-full" role="alert">{state.error}</p>}
    {state.message&&<p className="portal-form-ok portal-full" role="status">{state.message}</p>}
    <button className="portal-button portal-full" disabled={pending}>{pending?"Opslaan…":"Wijzigingen opslaan"}</button>
   </form>
  </section>
 </main>;
}