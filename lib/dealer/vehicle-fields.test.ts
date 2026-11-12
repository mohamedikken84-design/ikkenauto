import {test} from "node:test";
import assert from "node:assert/strict";
import {parseBelgianEnterpriseNumber} from "./kbo";
import {vehicleMakes,suggestedModels} from "./vehicle-catalog";
import {vehicleSpecificationFields,isApplicable,normalizeSpecifications} from "./vehicle-fields";

test("Belgisch KBO-nummer: aanvaard normale notaties en normaliseer identiek",()=>{
 for(const candidate of ["BE 0123.456.749","0123456749","0123 456 749","123456749","BE0123456749"]){
  const result=parseBelgianEnterpriseNumber(candidate);
  assert.equal(result.valid,true,candidate);
  if(result.valid){assert.equal(result.normalized,"0123456749");assert.equal(result.formatted,"BE 0123.456.749");}
 }
});
test("KBO weigert foutieve checksum, verkeerd prefix en ongeldige tekens",()=>{
 for(const candidate of ["BE 0123.456.748","BE 2223.456.749","NL 0123.456.749","BE1234"]){
  assert.equal(parseBelgianEnterpriseNumber(candidate).valid,false,candidate);
 }
});
test("Gegevensuitvoer heeft een ruime bestaande merklijst met 8 acceptatiescenario's",()=>{
 const examples=[
  ["Volkswagen","Golf"],
  ["BMW","X5"],
  ["Mercedes-Benz","E-Klasse"],
  ["Porsche","911"],
  ["Tesla","Model 3"],
  ["Tesla","Model Y"],
  ["Volkswagen","Golf"],
  ["Ford","Transit"],
 ];
 for(const [make,model] of examples){
  assert.ok(vehicleMakes.includes(make as typeof vehicleMakes[number]),make);
  assert.ok(suggestedModels(make).includes(model),make+" "+model);
 }
});
test("Een ontbrekende uitvoering vereist nooit verzonnen uitrustingsopties",()=>{
 assert.ok(suggestedModels("BMW").includes("X5"));
 assert.deepEqual(suggestedModels("ONBEKEND MERK"),[]);
});
test("Elektrische technische velden gelden voor EV en PHEV, niet voor diesel",()=>{
 const battery=vehicleSpecificationFields.find(x=>x.key==="battery_soh_percent");
 const charging=vehicleSpecificationFields.find(x=>x.key==="dc_charge_kw");
 const payload=vehicleSpecificationFields.find(x=>x.key==="payload_kg");
 assert.ok(battery&&charging&&payload);
 assert.equal(isApplicable(battery,"Elektrisch","car"),true);
 assert.equal(isApplicable(battery,"Plug-in hybride","car"),true);
 assert.equal(isApplicable(battery,"Diesel","car"),false);
 assert.equal(isApplicable(charging,"Diesel","car"),false);
 assert.equal(isApplicable(payload,"Diesel","commercial"),true);
 assert.equal(isApplicable(payload,"Diesel","car"),false);
});
test("Technische opslag normaliseert, verwerpt ongeldige waarden en onbekende data",()=>{
 assert.deepEqual(normalizeSpecifications({battery_soh_percent:91.4,dc_charge_kw:250,carpass_available:true,unknown_injected:"yes"}),{
  battery_soh_percent:91.4,dc_charge_kw:250,carpass_available:true,
 });
 assert.deepEqual(normalizeSpecifications({battery_soh_percent:150,dc_charge_kw:-100,carpass_available:false,price_negotiable:"true"}),{});
 assert.deepEqual(normalizeSpecifications("not an object"),{});
});
test("BTW/techniek koppelbaar aan object zonder impliciete werkelijke voertuigopties",()=>{
 const result=normalizeSpecifications({wltp_range_km:560,ac_charge_kw:11,battery_usable_kwh:74.5});
 assert.equal(result.wltp_range_km,560);
 assert.equal(result.ac_charge_kw,11);
 assert.equal(result.battery_usable_kwh,74.5);
 assert.ok(!Object.hasOwn(result,"rear_axle_steering"));
});
