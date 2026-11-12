"use client";
import {useActionState,useState} from "react";
import Link from "next/link";
import {loginChecked,registerChecked,resendConfirmation} from "./improvements";
import {CompanyLookup} from "./directory-search";
export function AuthPanel({initialMode="login",findInitially=false}:{initialMode?:"login"|"register";findInitially?:boolean}){
 const [mode,setMode]=useState<"login"|"register">(initialMode),[find,setFind]=useState(findInitially),[picked,setPicked]=useState("");
 const [show,setShow]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [loginState,loginAction,loginPending]=useActionState(loginChecked,{error:""});
 const [registerState,registerAction,registerPending]=useActionState(registerChecked,{error:""});
 const [resendState,resendAction,resendPending]=useActionState(resendConfirmation,{error:""});
 const state=mode==="login"?loginState:registerState;
 return <section className="portal-auth-layout portal-onboard">
  <div className="portal-auth-intro"><span className="portal-overline">DEALERPORTAAL</span><h1>IKKENAUTO voor autohandelaars</h1>
   <p>Registreer je garage en beheer je voertuigen in voorbereiding op de publieke lancering van IKKENAUTO.</p>
   <p className="portal-note">Registreren is gratis. Voertuigen worden nog niet publiek gepubliceerd.</p>
   <Link className="portal-link-back" href="/dealer">Over het dealerportaal</Link>
  </div>
  <div className="portal-auth-card">
   <div className="portal-auth-tabs"><button type="button" className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Garage registreren</button><button type="button" className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Inloggen</button></div>
   <h2>{mode==="register"?"Account aanmaken":"Inloggen"}</h2>
   <p>{mode==="register"?"Maak je account aan. Je garagegegevens voeg je daarna toe.":"Meld je aan om je garage en voertuigen te beheren."}</p>
   <form action={mode==="register"?registerAction:loginAction} className="portal-form">
    <label>E-mailadres<input type="email" name="email" required autoComplete="email" placeholder="naam@garage.be" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Wachtwoord<span className="portal-password-wrap"><input type={show?"text":"password"} name="password" required minLength={mode==="register"?10:undefined} autoComplete={mode==="register"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Wachtwoord verbergen":"Wachtwoord tonen"}>{show?"Verbergen":"Tonen"}</button></span></label>
    {state.error&&<p className="portal-form-error" role="alert">{state.error}</p>}
    {state.message&&<p className="portal-form-ok" role="status">{state.message}</p>}
    <button className="portal-button" disabled={loginPending||registerPending}>{loginPending||registerPending?"Bezig…":mode==="register"?"Account aanmaken":"Inloggen"}</button>
   </form>
   {mode==="register"?<div className="portal-find-compact"><button type="button" aria-expanded={find} onClick={()=>setFind(!find)}>{find?"Zoekfunctie sluiten":"Staat je garage al bij IKKENAUTO? Zoek je bedrijf"}</button>
    {find&&<div><CompanyLookup title="Zoek bedrijfsnaam" onSelect={c=>{setPicked(c.name);try{sessionStorage.setItem("ikkenauto_selected_company",JSON.stringify(c));}catch{}}}/>{picked&&<p className="portal-form-ok">Geselecteerd: {picked}. Deze gegevens gebruiken we bij de volgende stap.</p>}</div>}
   </div>:<><Link className="portal-forgot" href="/portal/wachtwoord">Wachtwoord vergeten?</Link><form className="portal-resend" action={resendAction}><input type="hidden" name="email" value={email}/><button disabled={resendPending||!email} type="submit">Bevestigingsmail opnieuw versturen</button>{resendState.error&&<p className="portal-form-error">{resendState.error}</p>}{resendState.message&&<p className="portal-form-ok">{resendState.message}</p>}</form></>}
  </div>
 </section>;
}