"use client";
import { useActionState, useState } from "react";
import { loginChecked, registerChecked, resendConfirmation } from "./improvements";
import { CompanyLookup } from "./directory-search";

type View = "welcome" | "login" | "register";
type Company = { source_row:number; name:string; city:string|null; address:string|null; website:string|null };

export function AuthPanel({initialView="welcome"}:{initialView?:View}) {
  const [view,setView]=useState<View>(initialView);
  const [showPassword,setShowPassword]=useState(false);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [company,setCompany]=useState<Company|null>(null);
  const [loginState,loginAction,loginPending]=useActionState(loginChecked,{error:""});
  const [registerState,registerAction,registerPending]=useActionState(registerChecked,{error:""});
  const [resendState,resendAction,resendPending]=useActionState(resendConfirmation,{error:""});
  const state=view==="register"?registerState:loginState;
  function choose(next:View){setView(next);setShowPassword(false);}
  return <>
    {view==="welcome" ? <>
      <section className="dealer-hero" aria-labelledby="dealer-hero-title">
        <div className="dealer-hero-copy">
          <p className="dealer-eyebrow">Voor professionele autohandelaars</p>
          <h1 id="dealer-hero-title">IKKENAUTO voor autohandelaars</h1>
          <p className="dealer-hero-lead">IKKENAUTO bereidt een nieuwe Belgische automarktplaats voor. Registreer je garage en beheer je voertuigen alvast via ons dealerportaal.</p>
          <div className="dealer-hero-actions">
            <button type="button" className="portal-button dealer-primary" onClick={()=>choose("register")}>Garage registreren</button>
            <button type="button" className="dealer-link-button" onClick={()=>choose("login")}>Inloggen</button>
          </div>
          <p className="dealer-hero-note">Registreren is gratis · Voor professionele autohandelaars</p>
        </div>
      </section>
      <section className="dealer-steps" aria-labelledby="dealer-steps-title">
        <h2 id="dealer-steps-title">Bereid je garage voor op de lancering</h2>
        <div className="dealer-steps-grid">
          <div><span className="dealer-step-number">01</span><h3>Registreer je garage</h3><p>Maak een account aan en vul je bedrijfsgegevens aan.</p></div>
          <div><span className="dealer-step-number">02</span><h3>Voeg voertuigen toe</h3><p>Beheer je voorraad en foto&apos;s in een afgeschermd dashboard.</p></div>
          <div><span className="dealer-step-number">03</span><h3>Bereid je voor</h3><p>Je gegevens blijven bewaard voor de publieke lancering. Publicatie gebeurt niet automatisch.</p></div>
        </div>
      </section>
      <section className="dealer-directory-intro">
        <div><h2>Heb je al een bedrijfsvermelding?</h2><p>Je kunt je garage tijdens de registratie opzoeken en bekende gegevens gebruiken.</p></div>
        <button type="button" className="dealer-link-button" onClick={()=>choose("register")}>Garage opzoeken</button>
      </section>
    </> : <section className="dealer-auth-screen" id="account" aria-labelledby="account-title">
      <button type="button" className="dealer-back" onClick={()=>choose("welcome")}>← Terug naar overzicht</button>
      <div className="portal-auth-card dealer-auth-card">
        <div className="dealer-auth-switch" role="group" aria-label="Account">
          <button type="button" className={view==="register"?"selected":""} onClick={()=>choose("register")}>Registreren</button>
          <button type="button" className={view==="login"?"selected":""} onClick={()=>choose("login")}>Inloggen</button>
        </div>
        {view==="register"&&<div className="dealer-register-stage"><span className="dealer-eyebrow">REGISTREREN · STAP 1 VAN 3</span><p>1. Account <span aria-hidden="true">→</span> 2. Garagegegevens <span aria-hidden="true">→</span> 3. Voertuigen</p></div>}
        <h1 id="account-title">{view==="register"?"Maak een account aan":"Welkom terug"}</h1>
        <p>{view==="register"?"Registreer met je zakelijke e-mailadres. Daarna bevestig je je e-mail en maak je je garageprofiel aan.":"Meld je aan om je garage en voorraad te beheren."}</p>
        <form action={view==="register"?registerAction:loginAction} className="portal-form">
          <label>E-mailadres
            <input type="email" name="email" required autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="naam@garage.be"/>
          </label>
          <label>Wachtwoord
            <span className="portal-password-wrap">
              <input name="password" type={showPassword?"text":"password"} required minLength={view==="register"?10:undefined} autoComplete={view==="register"?"new-password":"current-password"} value={password} onChange={event=>setPassword(event.target.value)}/>
              <button type="button" aria-label={showPassword?"Wachtwoord verbergen":"Wachtwoord tonen"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Verberg":"Toon"}</button>
            </span>
          </label>
          {view==="register"&&<>
            <p className="portal-note">Minstens 10 tekens. Na registratie bevestig je je e-mailadres.</p>
            <div className="dealer-company-details dealer-register-company">
              <div className="dealer-register-company-heading"><strong>Staat je garage al in onze bedrijvengids?</strong><span>Optioneel · we helpen je de juiste bedrijfsnaam te vinden.</span></div>
              <p className="portal-note">De vermelding is nog niet geclaimd. Je kunt deze na e-mailbevestiging laten controleren.</p>
              <CompanyLookup title="Bedrijfsnaam" onSelect={setCompany} onClear={()=>setCompany(null)}/>
              {company&&<p className="dealer-company-selected">Geselecteerd: <strong>{company.name}</strong> {company.city&&"· "+company.city}</p>}
            </div>
            <input type="hidden" name="directory_row" value={company?.source_row??""}/>
          </>}
          {state.error&&<p role="alert" className="portal-form-error">{state.error}</p>}
          {state.message&&<p role="status" className="portal-form-ok">{state.message}</p>}
          <button className="portal-button" disabled={registerPending||loginPending}>
            {registerPending||loginPending?"Bezig…":view==="register"?"Account aanmaken":"Inloggen"}
          </button>
        </form>
        {view==="login"&&<a className="portal-forgot" href="/portal/wachtwoord">Wachtwoord vergeten?</a>}
        {(view==="login" || (view==="register" && Boolean(registerState.message)))&&<>
          <form className="portal-resend" action={resendAction}>
            <input type="hidden" name="email" value={email}/>
            <button type="submit" disabled={resendPending||!email}>{resendPending?"Verzenden…":"Bevestigingsmail opnieuw sturen"}</button>
            {resendState.error&&<p role="alert" className="portal-form-error">{resendState.error}</p>}
            {resendState.message&&<p role="status" className="portal-form-ok">{resendState.message}</p>}
          </form>
        </>}
        <p className="dealer-auth-privacy">We gebruiken je gegevens voor je account en dealerbeheer. <a href="/privacy">Privacyinformatie</a>.</p>
      </div>
    </section>}
  </>;
}
