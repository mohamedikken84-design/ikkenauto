"use client";

export type CatalogMake = { id:number; name:string; verified:boolean };
export type CatalogChild = { id:number; name?:string; code?:string; year_from?:number|null; year_to?:number|null; fuel?:string|null; power_kw?:number|null; verified?:boolean };
export type EquipmentItem = { code:string; label_nl:string; category:string; compatible_fuels:string[] };
export type InitialCatalog = { makes:CatalogMake[]; equipment:EquipmentItem[] };
type ChildLevel = "models" | "generations" | "powertrains" | "trims";
let initialPromise: Promise<InitialCatalog> | null = null;
const levelCache = new Map<string, Promise<CatalogChild[]>>();

async function getJson<T>(url:string):Promise<T> {
 const response = await fetch(url,{cache:"force-cache"});
 if(!response.ok)throw Error("Catalogus tijdelijk niet bereikbaar");
 return response.json() as Promise<T>;
}
export function loadInitialCatalog():Promise<InitialCatalog> {
 if(!initialPromise)initialPromise=getJson<InitialCatalog>("/portal/api/catalog?type=initial").catch(error=>{initialPromise=null;throw error;});
 return initialPromise;
}
export function loadCatalogChildren(level:ChildLevel,parent:number):Promise<CatalogChild[]> {
 if(!Number.isSafeInteger(parent)||parent<=0)return Promise.resolve([]);
 const key=level+":"+parent;
 let cached=levelCache.get(key);
 if(!cached){
   cached=getJson<{items:CatalogChild[]}>("/portal/api/catalog?type="+level+"&parent="+parent).then(v=>v.items)
     .catch(error=>{levelCache.delete(key);throw error;});
   levelCache.set(key,cached);
 }
 return cached;
}
