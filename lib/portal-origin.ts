import {headers} from "next/headers";

/** Use only known deployment hosts for links embedded in authentication emails. */
export async function portalOrigin(){
 const h=await headers();
 const host=(h.get("x-forwarded-host")||h.get("host")||"").trim().toLowerCase();
 const allowed=host==="portal.ikkenauto.be"||
   host==="ikkenauto-cursor-keep-alive-6ada.vercel.app"||
   /^ikkenauto-cursor-keep-alive-6ada-[a-z0-9]+-ikkenauto\.vercel\.app$/.test(host);
 if(allowed)return "https://"+host;
 return (process.env.PORTAL_ORIGIN||"https://ikkenauto-cursor-keep-alive-6ada.vercel.app").replace(/\/$/,"");
}
