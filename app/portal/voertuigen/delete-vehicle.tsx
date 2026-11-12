"use client";
import {useState} from "react";
import {deleteVehicle} from "../actions";
export function DeleteVehicle({id,name}:{id:string;name:string}){
 const [armed,setArmed]=useState(false);
 return <div className="portal-confirm-delete">{armed?<form action={deleteVehicle} className="portal-inline">
   <input type="hidden" name="vehicle_id" value={id}/>
   <span role="status" className="portal-danger-question">Deze {name} verwijderen?</span>
   <button className="portal-delete" type="submit">Ja, verwijderen</button>
   <button type="button" className="portal-cancel" onClick={()=>setArmed(false)}>Annuleren</button>
  </form>:<button className="portal-delete" type="button" onClick={()=>setArmed(true)}>Verwijderen</button>}</div>;
}