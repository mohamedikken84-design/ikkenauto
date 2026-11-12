import assert from "node:assert/strict";
import {test} from "node:test";
import {dealerRouteKind,hasDealerShell,isDealerOnlyHost} from "./portal-visibility";

test("dealer hostname is isolated even without environment flag",()=>{
 assert.equal(isDealerOnlyHost("portal.ikkenauto.be"),true);
 assert.equal(isDealerOnlyHost("ikkenauto.be"),false);
 assert.equal(isDealerOnlyHost("ikkenauto.vercel.app","true"),true);
});
test("dealer URLs and legal routes stay available",()=>{
 for(const path of ["/portal","/portal/garage","/portal/auth/callback","/portal/api/directory","/registreer","/registreren","/inloggen","/auth/confirm","/auth/callback","/privacy","/voorwaarden","/_next/static/a.js"]){
  assert.equal(dealerRouteKind(path),"allow",path);
 }
 assert.equal(dealerRouteKind("/"),"home");
});
test("public marketplace pages and its APIs are never exposed on the portal host",()=>{
 for(const path of ["/nl","/nl/autos","/fr","/autos","/account","/plaats-advertentie"])assert.equal(dealerRouteKind(path),"redirect",path);
 for(const path of ["/api/dealer/stock","/api/preview","/api/auth/exchange"])assert.equal(dealerRouteKind(path),"private-api",path);
});
test("the dealer layout is separate, not the marketplace layout",()=>{
 assert.equal(hasDealerShell("/portal",false),true);
 assert.equal(hasDealerShell("/portal/voorraad/1/bewerken",true),true);
 assert.equal(hasDealerShell("/privacy",true),true);
 assert.equal(hasDealerShell("/nl/autos",false),false);
});
