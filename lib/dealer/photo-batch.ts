"use client";

import type {SupabaseClient} from "@supabase/supabase-js";

export type PhotoBatchResult={saved:number;failed:string[]};

/**
 * Bounded concurrency: no more than 3 network uploads at once.
 * RLS still authorizes the private storage path and photo record on the server.
 */
export async function uploadDealerPhotos(
 db:SupabaseClient,
 files:readonly File[],
 dealerId:string,
 vehicleId:string,
 onProgress?:(completed:number,total:number)=>void,
):Promise<PhotoBatchResult>{
 let next=0,completed=0,saved=0;
 const failed:string[]=[];
 const worker=async()=>{
  while(next<files.length){
   const i=next++;
   const file=files[i];
   let ok=false;
   let path="";
   try{
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size<=0||file.size>3_500_000)throw Error("Bad photo");
    const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
    path=dealerId+"/"+vehicleId+"/"+crypto.randomUUID()+"."+ext;
    const up=await db.storage.from("portal-vehicles").upload(path,file,{contentType:file.type,upsert:false});
    if(up.error)throw up.error;
    const {error}=await db.from("portal_vehicle_photos").insert({dealer_id:dealerId,vehicle_id:vehicleId,storage_path:path});
    if(error){
     await db.storage.from("portal-vehicles").remove([path]).catch(()=>{});
     throw error;
    }
    saved++;ok=true;
   }catch{/* no IDs or names are leaked in error responses */}
   if(!ok)failed.push(file.name);
   completed++;onProgress?.(completed,files.length);
  }
 };
 await Promise.all(Array.from({length:Math.min(files.length,3)},()=>worker()));
 return {saved,failed};
}
