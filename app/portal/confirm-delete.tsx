"use client";
import {useState} from "react";
import {deleteVehicle} from "./actions";
export function ConfirmDelete({vehicleId}:{vehicleId:string}){
 const [open,setOpen]=useState(false);
 return <div className="portal-delete-confirm">
 {open?<form action={deleteVehicle} className="portal-delete-confirm-form"><input type="hidden" name="vehicle_id" value={vehicleId}/><span>Definitief verwijderen?</span><button type="submit" className="portal-delete">Ja, verwijderen</button><button type="button" onClick={()=>setOpen(false)}>Annuleren</button></form>:
 <button type="button" className="portal-delete" onClick={()=>setOpen(true)}>Verwijderen</button>}
 </div>;
}