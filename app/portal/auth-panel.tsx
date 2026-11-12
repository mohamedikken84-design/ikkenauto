"use client";
import {useActionState,useState} from "react";
import Link from "next/link";
import {loginChecked,registerChecked,resendConfirmation} from "./improvements";
import {CompanyLookup} from "./directory-search";

type View="intro"|"login"|"register";
export function AuthPanel({initialView="intro"}:{initialView?:View}){
 const [mode,setMode]=useState<View>(initialView);
 const [showPassword,setShowPassword]=useState(false);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [loginState,loginAction,loginPending]=useActionState(loginChecked,{error:""});
 const [registrationState,registerAction,registerPending]=useActionState(registerChecked,{error:""});
 const [resendState,resendAction,resendPending]=useActionState(resendConfirmation,{error:""});
 const state=mode==="login"?loginState:registrationState;
 function choose(next:View){setMode(next);if(next!=="intro")setTimeout(()=>document.getElementById("portal-account")?.scrollIntoView({behavior:"smooth",block:"start"}),0);}
 return <div className="portal-onboarding">
  <section className="portal-onboard-hero" aria-labelledby="portal-hero-title">
   <div className="portal-onboard-copy">
    <p className="portal-eyebrow">VOOR PROFESSIONELE AUTOHANDELAARS</p>
    <h1 id="portal-hero-title">IKKENAUTO voor autohandelaars</h1>
    <p className="portal-lead-copy">IKKENAUTO bereidt een nieuwe Belgische automarktplaats voor. Registreer je garage en beheer je voertuigen alvast via ons dealerportaal.</p>
    <div className="portal-onboard-actions">
      <button type="button" onClick={()=>choose("register")} className="portal-primary">Garage registreren</button>
      <button type="button" onClick={()=>choose("login")} className="portal-secondary">Inloggen</button>
    </div>
    <p className="portal-small-note">Registreren is gratis · Voor professionele autohandelaars</p>
   </div>
   <aside id="portal-account" className="portal-onboard-account" aria-label="Account">
    {mode==="intro"?<div className="portal-onboard-intro-card"><span className="portal-eyebrow">DEALERPORTAAL</span><h2>Uw garage, één overzicht.</h2><p>Maak een bedrijfsprofiel aan. Voeg vervolgens uw voorraad toe en beheer die op één plek. Voertuigen worden pas bij de publieke lancering zichtbaar, na de aangekondigde voorwaarden.</p><button className="portal-primary portal-full-button" onClick={()=>choose("register")}>Garage registreren</button><button className="portal-text-button" onClick={()=>choose("login")}>Al een account? Inloggen</button></div>:
     <div className="portal-login-box">
       <button type="button" className="portal-back" onClick={()=>setMode("intro")}>← Terug naar overzicht</button>
       <h2>{mode==="register"?"Account aanmaken":"Inloggen"}</h2>
       <p>{mode==="register"?"Maak een account aan met uw zakelijke e-mailadres. Na e-mailbevestiging vult u uw garagegegevens in.":"Log in om uw bedrijfsprofiel en voertuigen te beheren."}</p>
       <form action={mode==="login"?loginAction:registerAction} className="portal-form">
        <label>E-mailadres<input name="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="naam@garage.be" required/></label>
        <label>Wachtwoord<span className="portal-password-wrap"><input name="password" type={showPassword?"text":"password"} autoComplete={mode==="register"?"new-password":"current-password"} minLength={mode==="register"?10:undefined} value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" onClick={()=>setShowPassword(s=>!s)} aria-label={showPassword?"Wachtwoord verbergen":"Wachtwoord tonen"}>{showPassword?"Verbergen":"Tonen"}</button></span></label>
        {mode==="register"&&<p className="portal-small-note">Minimaal 10 tekens. Gebruik een uniek wachtwoord.</p>}
        {state.error&&<p className="portal-form-error" role="alert">{state.error}</p>}
        {state.message&&<p className="portal-form-ok" role="status">{state.message}</p>}
        <button className="portal-primary portal-full-button" disabled={loginPending||registerPending}>{loginPending||registerPending?"Even verwerken…":mode==="register"?"Account aanmaken":"Inloggen"}</button>
       </form>
       <div className="portal-account-links">
        {mode==="login"?<><button type="button" className="portal-text-button" onClick={()=>choose("register")}>Nog geen account? Registreren</button><Link href="/portal/wachtwoord">Wachtwoord vergeten?</Link></>:
         <button type="button" className="portal-text-button" onClick={()=>choose("login")}>Heeft u al een account? Inloggen</button>}
       </div>
       {mode==="login"&&<form action={resendAction} className="portal-resend"><input type="hidden" name="email" value={email}/><button type="submit" disabled={!email||resendPending}>Bevestigingsmail opnieuw versturen</button>{resendState.error&&<p className="portal-form-error">{resendState.error}</p>}{resendState.message&&<p className="portal-form-ok">{resendState.message}</p>}</form>}
     </div>}
   </aside>
  </section>
  <section className="portal-onboard-steps" aria-labelledby="portal-steps-title">
   <h2 id="portal-steps-title">Bereid uw garage voor op de lancering</h2>
   <div className="portal-onboard-stepgrid">
    <article><span className="portal-step-num">01</span><h3>Registreer uw garage</h3><p>Maak een account aan en vul de noodzakelijke bedrijfsgegevens in.</p></article>
    <article><span className="portal-step-num">02</span><h3>Voeg uw voorraad toe</h3><p>Beheer uw voertuigen in het dealerportaal. Importeren via CSV is mogelijk.</p></article>
    <article><span className="portal-step-num">03</span><h3>Bereid de lancering voor</h3><p>Uw gegevens staan klaar. Over publicatie en voorwaarden informeren we vooraf.</p></article>
   </div>
  </section>
  <section className="portal-onboard-directory" aria-labelledby="portal-directory-title">
    <div><h2 id="portal-directory-title">Staat uw garage al in onze bedrijvengids?</h2><p>Zoek een bestaande vermelding om uw registratie te vereenvoudigen. Een vermelding betekent niet dat een garage al is aangesloten.</p></div>
    <details><summary>Garage opzoeken</summary><CompanyLookup title="Bedrijfsnaam"/></details>
  </section>
  <footer className="portal-onboard-footer">
    <span>© {new Date().getFullYear()} IKKENAUTO · Voorbereiding publieke lancering</span>
    <nav aria-label="Footer"><a href="mailto:info@ikkenauto.be">Contact</a><Link href="/privacy">Privacybeleid</Link><Link href="/voorwaarden">Gebruiksvoorwaarden</Link></nav>
  </footer>
 </div>;
}