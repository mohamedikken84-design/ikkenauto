import {PageIntro} from "@/components/page-intro";
import {pageMetadata} from "@/lib/metadata";
export const metadata=pageMetadata({title:"Gebruiksregels dealerportaal",description:"Informatie over het IKKENAUTO-dealerportaal tijdens de voorbereidingsfase.",path:"/voorwaarden",index:false});
export default function VoorwaardenPage(){
 return <PageIntro eyebrow="IKKENAUTO / VOORBEREIDINGSFASE" title="Gebruiksregels dealerportaal" lede="Het dealerportaal is bedoeld om garagegegevens en autovoorraad voor te bereiden, niet om nu al publiek te adverteren.">
  <div className="mx-auto max-w-3xl space-y-8 text-sm leading-7">
   <section><h2 className="text-xl font-bold">Huidige werking</h2><p>Professionele autohandelaars kunnen een account aanvragen, hun bedrijfsgegevens aanvullen en voertuigen en foto&apos;s beheren. De publieke automarktplaats is nog niet gelanceerd. Een ingestelde voorraadstatus is geen bevestiging van publicatie.</p></section>
   <section><h2 className="text-xl font-bold">Registratie en controle</h2><p>Registratie in de voorbereidende fase is gratis. Het claimen van een bestaande bedrijfsvermelding vereist een controle; een gevonden vermeldingsnaam bewijst niet dat de aanvrager eigenaar of gevolmachtigde is. IKKENAUTO kan een onjuiste of onbewezen claim weigeren.</p></section>
   <section><h2 className="text-xl font-bold">Gegevens en afbeeldingen</h2><p>De handelaar moet juiste gegevens verstrekken en bevoegd zijn om foto&apos;s, merknamen en andere geüploade inhoud te gebruiken. Informatie die van externe platforms afkomstig is, mag alleen worden ingevoerd als de handelaar daarvoor de nodige rechten heeft. Een externe advertentielink maakt nog geen automatische import aan.</p></section>
   <section><h2 className="text-xl font-bold">Geen automatische kosten of publicatie</h2><p>Bij het aanmaken van een voorbereidend account ontstaat geen betaalverplichting. Eventuele latere prijzen, pakketten of wijzigingen moeten afzonderlijk en vooraf worden gecommuniceerd en mogen niet zonder de nodige instemming worden opgelegd. Voertuigen worden niet automatisch publiek gemaakt.</p></section>
   <section><h2 className="text-xl font-bold">Accountbeheer en vragen</h2><p>Bewaar je toegang veilig en zorg dat alleen bevoegde medewerkers van je garage de account gebruiken. Voor fouten, correcties, vragen of verzoeken om je gegevens te verwijderen kun je contact opnemen via <a className="underline" href="mailto:info@ikkenauto.be">info@ikkenauto.be</a>.</p></section>
   <p className="border-t border-gray-200 pt-5 text-xs text-gray-500">Versie: 12 november 2026. Definitieve juridische voorwaarden en volledige bedrijfsidentificatie moeten vóór commerciële lancering worden gevalideerd.</p>
  </div>
 </PageIntro>;
}
