"use client";
import { useState } from "react";
import { deleteVehicle } from "./actions";
export function ConfirmDelete({vehicleId}:{vehicleId:string}){
 const [confirm,setConfirm]=useState(false);
 return confirm?<form action={deleteVehicle} className="dealer-confirm-delete">
  <input type="hidden" name="vehicle_id" value={vehicleId}/>
  <span>Definitief verwijderen?</span>
  <button className="portal-delete" type="submit">Ja, verwijderen</button>
  <button type="button" className="dealer-cancel" onClick={()=>setConfirm(false)}>Annuleren</button>
 </form>:<button type="button" className="portal-delete" onClick={()=>setConfirm(true)}>Verwijderen</button>;
}
