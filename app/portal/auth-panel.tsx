"use client";
import {useActionState,useState} from "react";
import {loginChecked,registerChecked} from "./improvements";
import {CompanyLookup} from "./directory-search";
export function AuthPanel({directoryCount}:{directoryCount:number}){
 const [mode,setMode]=useState<"login"|"register">("login");
 const [show,setShow]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [loginState,loginAction,loginPending]=useActionState(loginChecked,{error:""});
 const [registrationState,registerAction,registerPending]=useActionState(registerChecked,{error:""});
 const state=mode==="login"?loginState:registrationState;
 return <section className="portal-auth-layout portal-auth-simple"><div className="portal-auth-intro">
  <span className="portal-overline">IKKENAUTO VOOR PROFESSIONALS</span>
  <h1>Alles voor je<br/><em>autovoorraad.</em></h1>
  <p>Beheer je stock, voeg auto's toe en bereid je garage voor op IKKENAUTO. Een account aanmaken is eenvoudig.</p>
  <strong className="portal-directory-number">{new Intl.NumberFormat("nl-BE").format(directoryCount)} bedrijfsvermeldingen in onze gids</strong><CompanyLookup title="Staat jouw garage al in onze bedrijvengids?" />
  <p className="portal-note">Bedrijfsvermeldingen zijn nog geen actieve dealeraccounts. Alleen na registratie en controle kun je je vermelding claimen.</p>
 </div><div className="portal-auth-card">
  <div className="portal-auth-tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Inloggen</button><button type="button" className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Registreren</button></div>
  <h2>{mode==="login"?"Welkom terug":"Gratis dealeraccount"}</h2><p>{mode==="login"?"Meld je aan bij je beveiligde dashboard.":"Maak een account en bevestig je e-mailadres."}</p>
  <form action={mode==="login"?loginAction:registerAction} className="portal-form">
   <label>E-mailadres<input name="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="naam@garage.be"/></label>
   <label>Wachtwoord<span className="portal-password-wrap"><input name="password" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==="register"?10:undefined} required autoComplete={mode==="login"?"current-password":"new-password"}/><button type="button" aria-label={show?"Wachtwoord verbergen":"Wachtwoord tonen"} onClick={()=>setShow(!show)}>{show?"Verberg":"Toon"}</button></span></label>
   {mode==="register"&&<p className="portal-note">Gebruik minstens 10 tekens. Je ontvangt vervolgens een bevestigingsmail.</p>}
   {state.error&&<p className="portal-form-error" role="alert">{state.error}</p>}
   {state.message&&<p className="portal-form-ok" role="status">{state.message}</p>}
   <button disabled={loginPending||registerPending} className="portal-button">{loginPending||registerPending?"Bezig…":mode==="login"?"Inloggen":"Account aanmaken"}</button>
  </form>
  <a className="portal-forgot" href="/portal/wachtwoord">Wachtwoord vergeten?</a>
 </div></section>;
}