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
        <div className="dealer-hero-layout">
          <div className="dealer-hero-copy">
            <p className="dealer-eyebrow">IKKENAUTO · VOOR PROFESSIONELE AUTOBEDRIJVEN</p>
            <h1 id="dealer-hero-title">Jouw garage.<br/>Jouw voorraad.<br/><span>Alles op één plek.</span></h1>
            <p className="dealer-hero-lead">Een eenvoudige werkruimte om je garageprofiel en voertuigen voor te bereiden op de lancering van IKKENAUTO. Zonder onnodige stappen of ingewikkelde software.</p>
            <div className="dealer-hero-actions">
              <button type="button" className="portal-button dealer-primary" onClick={() => choose("register")}>Garage registreren <span aria-hidden="true">→</span></button>
              <button type="button" className="dealer-link-button" onClick={() => choose("login")}>Ik heb al een account</button>
            </div>
            <p className="dealer-hero-note">Registratie is gratis. De marktplaats is nog in voorbereiding.</p>
          </div>
          <aside className="dealer-hero-product" aria-label="Wat je kunt beheren">
            <div className="dealer-product-top"><span>DEALERWERKRUIMTE</span><span>IKKENAUTO</span></div>
            <h2>Eerst je garage.<br/>Dan je voertuigen.</h2>
            <p>Alles wat je nodig hebt om voorbereid te zijn op de publieke lancering.</p>
            <div className="dealer-product-features">
              <div><span>01</span><div><strong>Garageprofiel</strong><small>Bedrijfsgegevens, logo en contact</small></div></div>
              <div><span>02</span><div><strong>Voertuigen beheren</strong><small>Gegevens, prijzen en foto&apos;s</small></div></div>
              <div><span>03</span><div><strong>Voorraad importeren</strong><small>CSV-bestanden met controle vooraf</small></div></div>
            </div>
            <div className="dealer-product-footer"><span>Je gegevens blijven voorlopig privé</span><span className="dealer-product-dot"/></div>
          </aside>
        </div>
      </section>
      <section className="dealer-steps" aria-labelledby="dealer-steps-title">
        <div className="dealer-section-heading"><span className="dealer-eyebrow">IN DRIE STAPPEN</span><h2 id="dealer-steps-title">Van registratie tot je eerste auto</h2></div>
        <div className="dealer-steps-grid">
          <div><span className="dealer-step-number">01</span><h3>Maak je account</h3><p>Registreer met je zakelijke e-mailadres en bevestig je e-mail.</p></div>
          <div><span className="dealer-step-number">02</span><h3>Voeg je garage toe</h3><p>Zoek je bestaande bedrijfsvermelding of vul je garagegegevens zelf in.</p></div>
          <div><span className="dealer-step-number">03</span><h3>Beheer je voorraad</h3><p>Voeg voertuigen en foto&apos;s toe of importeer bestaande stock via CSV.</p></div>
        </div>
      </section>
      <section className="dealer-directory-intro">
        <div><h2>Staat je garage al in onze bedrijvengids?</h2><p>Je kunt bekende bedrijfsgegevens gebruiken tijdens de registratie. Een bedrijfsvermelding is nog geen actief account.</p></div>
        <button type="button" className="dealer-link-button" onClick={() => choose("register")}>Zoek je garage tijdens registratie →</button>
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
