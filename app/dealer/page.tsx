import Link from "next/link";
import type {Metadata} from "next";
import "./dealer.css";

export const metadata:Metadata={
 title:"Voor autohandelaars | IKKENAUTO",
 description:"Registreer je garage en beheer je voertuigen in voorbereiding op de lancering van IKKENAUTO.",
 robots:{index:false,follow:true},
};
export default function DealerLanding(){
 return <div className="dealer-landing">
   <header className="dl-header"><div className="dl-wrap dl-bar">
    <Link className="dl-logo" href="/dealer" aria-label="IKKENAUTO home">IK<span>K</span>ENAUTO<small>.BE</small></Link>
    <nav aria-label="Account"><Link className="dl-signin" href="/portal?mode=login">Inloggen</Link><Link className="dl-nav-primary" href="/portal?mode=register">Garage registreren</Link></nav>
   </div></header>
   <main id="inhoud">
    <section className="dl-wrap dl-hero"><p className="dl-kicker">DEALERPORTAAL · PRE-LANCERING</p>
     <h1>IKKENAUTO voor autohandelaars</h1>
     <p className="dl-subtitle">IKKENAUTO bereidt een nieuwe Belgische automarktplaats voor. Registreer je garage en beheer je voertuigen alvast via ons dealerportaal.</p>
     <div className="dl-hero-actions"><Link className="dl-primary" href="/portal?mode=register">Garage registreren</Link><Link className="dl-secondary" href="/portal?mode=login">Inloggen</Link></div>
     <p className="dl-caption">Registreren is gratis · Voor professionele autohandelaars</p>
    </section>
    <section className="dl-process"><div className="dl-wrap">
     <h2>Bereid je garage voor op de lancering</h2>
     <div className="dl-steps">
      <article><span className="dl-step">01</span><h3>Registreer je garage</h3><p>Maak een account aan en vul je bedrijfsgegevens in. Een bestaande vermelding kan je helpen sneller te starten.</p></article>
      <article><span className="dl-step">02</span><h3>Beheer je voertuigen</h3><p>Voeg auto's handmatig toe of gebruik een CSV-bestand voor je bestaande voorraad.</p></article>
      <article><span className="dl-step">03</span><h3>Bereid je aanbod voor</h3><p>Je garage en voertuigen blijven voorlopig in het dealerportaal. Publicatie volgt pas bij de officiële lancering, volgens vooraf gecommuniceerde voorwaarden.</p></article>
     </div>
    </div></section>
    <section className="dl-wrap dl-existing"><div><h2>Heb je al een bedrijfsvermelding?</h2><p>Je kunt tijdens de registratie je garage opzoeken en bekende bedrijfsgegevens overnemen. Een vermelding is niet hetzelfde als een geverifieerd dealeraccount.</p></div><Link className="dl-textlink" href="/portal?mode=register&find=1">Zoek je garage tijdens registratie</Link></section>
   </main>
   <footer className="dl-footer"><div className="dl-wrap dl-footer-inner"><span>© IKKENAUTO</span><nav aria-label="Juridische en contactinformatie"><a href="mailto:info@ikkenauto.be">Contact</a><Link href="/privacy">Privacybeleid</Link><Link href="/voorwaarden">Gebruiksvoorwaarden</Link></nav></div></footer>
 </div>;
}