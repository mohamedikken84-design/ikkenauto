import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {test} from "node:test";

/** Structural regression test; not a substitute for logged-in browser E2E. */
test("Auto toevoegen blijft één doorlopende pagina met alle secties",()=>{
 const form=readFileSync(join(process.cwd(),"app/portal/vehicle-editor.tsx"),"utf8");
 const sections=[...form.matchAll(/<section className="dealer-long-section" id="vehicle-section-([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(sections,["voertuig","techniek","uitrusting","uiterlijk","historiek","prijs","media","overzicht"]);
 assert.doesNotMatch(form,/step===|setStep\(|Volgende stap/);
 assert.match(form,/<CatalogVehicleSelector/);
 assert.match(form,/<EquipmentSelection/);
 assert.match(form,/name="specifications"/);
 assert.match(form,/name="equipment_codes"/);
 assert.match(form,/validateBeforeSubmit/);
 assert.match(form,/form="dealer-wizard-submit"/);
 assert.match(form,/uploadDealerPhotos/);
});

test("Uitrusting en geavanceerde velden zijn direct zichtbaar, niet achter wizard-dropdowns",()=>{
 const form=readFileSync(join(process.cwd(),"app/portal/vehicle-editor.tsx"),"utf8");
 const equipment=readFileSync(join(process.cwd(),"app/portal/equipment-selection.tsx"),"utf8");
 assert.match(form,/dealer-spec-expanded/);
 assert.doesNotMatch(form,/<details className="dealer-spec-disclosure"/);
 assert.match(equipment,/dealer-equipment-category/);
 assert.doesNotMatch(equipment,/<details/);
});
