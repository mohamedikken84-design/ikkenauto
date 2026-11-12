/** Limit this Vercel project to the dealer experience, not the public marketplace. */
export function isDealerOnlyHost(hostname:string,portalOnlyFlag?:string){
 return portalOnlyFlag==="true"||hostname.toLowerCase()==="portal.ikkenauto.be";
}

export function dealerRouteKind(pathname:string):"home"|"allow"|"private-api"|"redirect"{
 if(pathname==="/")return "home";
 const allowedPrefixes=["/portal","/_next/","/_vercel/"];
 if(allowedPrefixes.some(p=>pathname===p||pathname.startsWith(p.endsWith("/")?p:p+"/")))return "allow";
 const exact=["/registreer","/registreren","/inloggen","/auth/confirm","/auth/callback","/privacy","/voorwaarden","/robots.txt","/sitemap.xml","/favicon.ico","/icon.svg","/ikkenauto-wordmark.svg","/api/cron/keep-alive"];
 if(exact.includes(pathname)||exact.some(p=>pathname===p+"/"))return "allow";
 if(pathname.startsWith("/api/"))return "private-api";
 return "redirect";
}

export function hasDealerShell(pathname:string,dealerOnly:boolean){
 return pathname==="/portal"||pathname.startsWith("/portal/")||
   (dealerOnly&&["/privacy","/voorwaarden"].includes(pathname));
}
