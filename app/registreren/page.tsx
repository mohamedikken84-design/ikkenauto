"use client";

import { useState, type FormEvent } from "react";
import "./registration.css";

type Registration = {
  businessName: string;
  enterpriseNumber: string;
  contactName: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

const initial: Registration = {
  businessName: "",
  enterpriseNumber: "",
  contactName: "",
  email: "",
  password: "",
  passwordConfirm: "",
};

function validBelgianEnterpriseNumber(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 10) return false;
  const base = Number(digits.slice(0, 8));
  const check = Number(digits.slice(8));
  return check === 97 - (base % 97);
}

export default function DealerRegistrationPreview() {
  const [values, setValues] = useState<Registration>(initial);
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  function setField(name: keyof Registration, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setError("");
    setResult("");
  }

  function checkForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.businessName.trim() || !values.contactName.trim()) {
      setError("Vul je bedrijfsnaam en contactpersoon in.");
      return;
    }
    if (!validBelgianEnterpriseNumber(values.enterpriseNumber)) {
      setError("Controleer je Belgische ondernemingsnummer (10 cijfers met geldige controlecijfers).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setError("Vul een geldig zakelijk e-mailadres in.");
      return;
    }
    if (values.password.length < 12) {
      setError("Kies een wachtwoord van minstens 12 tekens.");
      return;
    }
    if (values.password !== values.passwordConfirm) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }
    setResult("Het ontwerpformulier is correct ingevuld. Dit is nog geen echte registratie: er is geen account aangemaakt en er zijn geen gegevens verstuurd.");
  }

  return (
    <main className="dealer-register-page">
      <header className="dealer-register-topbar">
        <a className="dealer-register-logo" href="/portal" aria-label="IKKENAUTO dealerportaal">
          I<span>K</span>KENAUTO<span className="register-dot">.</span>
        </a>
        <a className="dealer-register-toplink" href="/portal">Bekijk het dealerportaal <span aria-hidden="true">↗</span></a>
      </header>

      <div className="dealer-register-preview-note" role="note">
        <span className="dealer-register-note-dot" />
        Ontwerpvoorbeeld — geen echte registratie, geen verzending van gegevens
      </div>

      <div className="dealer-register-layout">
        <section className="dealer-register-intro" aria-labelledby="dealer-register-headline">
          <span className="dealer-register-eyebrow">IKKENAUTO VOOR PROFESSIONALS</span>
          <h1 id="dealer-register-headline">Jouw voorraad.<br />Jouw overzicht.<br /><em>Helemaal gratis.</em></h1>
          <p>Een rustige, professionele werkplek voor autohandelaars. Beheer je voertuigen op één plek en bereid je voorraad voor op de lancering van IKKENAUTO.</p>
          <div className="dealer-register-value-list">
            <div><span className="dealer-register-value-icon" aria-hidden="true">01</span><span><strong>Je volledige voorraad op één plek.</strong><small>Voertuigen toevoegen, bewerken en organiseren.</small></span></div>
            <div><span className="dealer-register-value-icon" aria-hidden="true">02</span><span><strong>Gebouwd voor Belgische handelaars.</strong><small>Met bedrijfsprofiel en btw-/ondernemingsnummer.</small></span></div>
            <div><span className="dealer-register-value-icon" aria-hidden="true">03</span><span><strong>Eenvoudig, van de eerste klik.</strong><small>Geen onnodige stappen of ingewikkelde menu's.</small></span></div>
          </div>
          <p className="dealer-register-footer-copy">Dit is een visuele proefversie. De definitieve registratie wordt pas geactiveerd na het testen van de account- en databasekoppeling.</p>
        </section>

        <section className="dealer-register-form-card" aria-labelledby="dealer-register-form-title">
          <div className="dealer-register-card-head">
            <span className="dealer-register-card-step">DEALERACCOUNT</span>
            <h2 id="dealer-register-form-title">Maak je account aan.</h2>
            <p>Alleen wat nodig is om te starten. Je kunt je bedrijfsprofiel later verder aanvullen.</p>
          </div>
          <form onSubmit={checkForm} noValidate>
            <div className="dealer-register-inputs">
              <label htmlFor="company">Bedrijfsnaam <span>*</span></label>
              <input id="company" name="company" autoComplete="organization" value={values.businessName} onChange={(e) => setField("businessName", e.target.value)} placeholder="Naam van je garage" required />

              <label htmlFor="vat">Belgisch ondernemingsnummer <span>*</span></label>
              <input id="vat" name="vat" inputMode="numeric" autoComplete="off" value={values.enterpriseNumber} onChange={(e) => setField("enterpriseNumber", e.target.value)} placeholder="BE 0123.456.789" required aria-describedby="vat-hint" />
              <small id="vat-hint">10 cijfers. Het nummer wordt in deze preview lokaal gecontroleerd.</small>

              <label htmlFor="contact">Naam contactpersoon <span>*</span></label>
              <input id="contact" name="contact" autoComplete="name" value={values.contactName} onChange={(e) => setField("contactName", e.target.value)} placeholder="Voornaam en achternaam" required />

              <label htmlFor="email">Zakelijk e-mailadres <span>*</span></label>
              <input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => setField("email", e.target.value)} placeholder="naam@garage.be" required />

              <div className="dealer-register-password-heading"><label htmlFor="password">Wachtwoord <span>*</span></label><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "Verberg" : "Toon"}</button></div>
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={values.password} onChange={(e) => setField("password", e.target.value)} placeholder="Minstens 12 tekens" minLength={12} required />

              <label htmlFor="password-confirm">Bevestig wachtwoord <span>*</span></label>
              <input id="password-confirm" name="password-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" value={values.passwordConfirm} onChange={(e) => setField("passwordConfirm", e.target.value)} placeholder="Herhaal je wachtwoord" required />
            </div>
            {error && <div role="alert" className="dealer-register-message dealer-register-error">{error}</div>}
            {result && <div role="status" className="dealer-register-message dealer-register-success">{result}</div>}
            <button className="dealer-register-submit" type="submit">Controleer het voorbeeldformulier <span aria-hidden="true">→</span></button>
            <p className="dealer-register-security">Je gegevens verlaten je browser niet. Er wordt nog geen account aangemaakt.</p>
            <a className="dealer-register-bottomlink" href="/portal">Terug naar het dealerportaal <span aria-hidden="true">→</span></a>
          </form>
        </section>
      </div>
    </main>
  );
}
