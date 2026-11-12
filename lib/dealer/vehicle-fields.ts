/**
 * IKKENAUTO field dictionary; authored for our own data model.
 * Marketplaces are used only as functional references. Nothing is inferred from make/model.
 * Store optional values under portal_vehicles.specifications JSONB unless a dedicated column exists.
 */
export type SpecType = "text" | "number" | "select" | "checkbox";
export type SpecField = {
 key: string; label: string; type: SpecType; unit?: string; max?: number;
 options?: readonly string[]; for?: readonly string[]; hint?: string;
};
export const vehicleSpecificationFields: readonly SpecField[] = [
 {key:"displacement_cc",label:"Cilinderinhoud",type:"number",unit:"cm³",max:20000},
 {key:"cylinders",label:"Aantal cilinders",type:"number",max:24},
 {key:"power_kw",label:"Vermogen",type:"number",unit:"kW",max:2000},
 {key:"torque_nm",label:"Koppel",type:"number",unit:"Nm",max:10000},
 {key:"gears",label:"Aantal versnellingen",type:"number",max:20},
 {key:"top_speed_kmh",label:"Topsnelheid",type:"number",unit:"km/u",max:500},
 {key:"acceleration_0_100_s",label:"0–100 km/u",type:"number",unit:"s",max:300},
 {key:"co2_g_km",label:"CO₂-uitstoot",type:"number",unit:"g/km",max:2500},
 {key:"consumption_l_100km",label:"Verbruik",type:"number",unit:"l/100 km",max:100},
 {key:"emission_test",label:"Meetcyclus",type:"select",options:["WLTP","NEDC","Overig"]},
 {key:"weight_kg",label:"Leeggewicht",type:"number",unit:"kg",max:100000},
 {key:"gross_weight_kg",label:"Toegestane maximummassa",type:"number",unit:"kg",max:100000},
 {key:"towing_braked_kg",label:"Geremd trekgewicht",type:"number",unit:"kg",max:50000},
 {key:"towing_unbraked_kg",label:"Ongeremd trekgewicht",type:"number",unit:"kg",max:50000},
 {key:"wheelbase_mm",label:"Wielbasis",type:"number",unit:"mm",max:15000},
 {key:"length_mm",label:"Lengte",type:"number",unit:"mm",max:25000},
 {key:"width_mm",label:"Breedte",type:"number",unit:"mm",max:5000},
 {key:"height_mm",label:"Hoogte",type:"number",unit:"mm",max:8000},
 {key:"engine_emission_standard",label:"Uitstootnorm detail",type:"text"},
 {key:"four_wheel_steering",label:"Achterasbesturing aanwezig",type:"checkbox"},
 {key:"wheel_size_inch",label:"Velgdiameter",type:"number",unit:"inch",max:40},
 {key:"tyre_condition",label:"Bandenconditie",type:"select",options:["Nieuw","Goed","Gebruikt","Aan vervanging toe"]},
 {key:"paint_finish",label:"Lakafwerking",type:"select",options:["Uni","Metaallak","Parelmoer","Mat","Overig"]},
 {key:"original_paint",label:"Originele lak",type:"checkbox"},
 {key:"interior_material",label:"Interieurmateriaal",type:"select",options:["Stof","Halfleder","Leder","Kunstleder","Alcantara","Velours","Andere"]},
 {key:"seat_count_rows",label:"Aantal zitrijen",type:"number",max:6},
 {key:"steering_position",label:"Stuurpositie",type:"select",options:["Links","Rechts"]},
 {key:"previous_owners",label:"Vorige eigenaars",type:"number",max:100},
 {key:"carpass_available",label:"Car-Pass beschikbaar",type:"checkbox"},
 {key:"accident_free",label:"Ongevalvrij verklaard",type:"checkbox"},
 {key:"service_book_available",label:"Onderhoudsboekje",type:"checkbox"},
 {key:"full_service_history",label:"Volledige onderhoudshistoriek",type:"checkbox"},
 {key:"technical_inspection_until",label:"Keuring geldig tot",type:"text",hint:"Bijv. 05/2027"},
 {key:"origin_country",label:"Land van herkomst",type:"text"},
 {key:"non_smoking",label:"Rookvrij voertuig",type:"checkbox"},
 {key:"number_of_keys",label:"Aantal sleutels",type:"number",max:10},
 {key:"last_service_mileage_km",label:"Kilometerstand laatste onderhoud",type:"number",unit:"km",max:5000000},
 {key:"battery_capacity_kwh",label:"Batterijcapaciteit totaal",type:"number",unit:"kWh",max:1000,for:["Elektrisch","Plug-in hybride"]},
 {key:"battery_usable_kwh",label:"Batterijcapaciteit bruikbaar",type:"number",unit:"kWh",max:1000,for:["Elektrisch","Plug-in hybride"]},
 {key:"battery_soh_percent",label:"Batterijgezondheid (SoH)",type:"number",unit:"%",max:100,for:["Elektrisch","Plug-in hybride"],hint:"Alleen invullen bij een betrouwbare meting."},
 {key:"wltp_range_km",label:"WLTP-actieradius",type:"number",unit:"km",max:2500,for:["Elektrisch","Plug-in hybride"]},
 {key:"real_world_range_km",label:"Gemeten bereik",type:"number",unit:"km",max:2500,for:["Elektrisch","Plug-in hybride"]},
 {key:"ac_charge_kw",label:"Maximaal AC-laadvermogen",type:"number",unit:"kW",max:100,for:["Elektrisch","Plug-in hybride"]},
 {key:"dc_charge_kw",label:"Maximaal DC-laadvermogen",type:"number",unit:"kW",max:800,for:["Elektrisch","Plug-in hybride"]},
 {key:"charge_10_80_minutes",label:"DC laden 10–80%",type:"number",unit:"min",max:1500,for:["Elektrisch","Plug-in hybride"]},
 {key:"electric_consumption_kwh_100km",label:"Elektrisch verbruik",type:"number",unit:"kWh/100 km",max:200,for:["Elektrisch","Plug-in hybride"]},
 {key:"charging_socket",label:"Laadconnector",type:"select",options:["Type 2","CCS","CHAdeMO","Type 1","Overig"],for:["Elektrisch","Plug-in hybride"]},
 {key:"battery_owned",label:"Batterijstatus",type:"select",options:["Eigendom","Batterijhuur","Niet bekend"],for:["Elektrisch","Plug-in hybride"]},
 {key:"battery_health_test_date",label:"Datum batterijtest",type:"text",for:["Elektrisch","Plug-in hybride"]},
 {key:"payload_kg",label:"Laadvermogen",type:"number",unit:"kg",max:100000,for:["commercial"]},
 {key:"cargo_length_mm",label:"Laadruimtelengte",type:"number",unit:"mm",max:20000,for:["commercial"]},
 {key:"cargo_width_mm",label:"Laadruimtebreedte",type:"number",unit:"mm",max:5000,for:["commercial"]},
 {key:"cargo_height_mm",label:"Laadruimtehoogte",type:"number",unit:"mm",max:6000,for:["commercial"]},
 {key:"pallet_capacity",label:"Aantal europallets",type:"number",max:40,for:["commercial"]},
 {key:"operating_hours",label:"Bedrijfsuren",type:"number",unit:"uur",max:500000,for:["commercial"]},
 {key:"axle_count",label:"Aantal assen",type:"number",max:12,for:["commercial"]},
 {key:"seatbelt_count",label:"Gordelplaatsen",type:"number",max:30,for:["motorhome"]},
 {key:"sleeping_capacity",label:"Slaapplaatsen",type:"number",max:20,for:["motorhome"]},
 {key:"water_tank_l",label:"Watertank",type:"number",unit:"L",max:5000,for:["motorhome"]},
 {key:"length_category",label:"Lengtecategorie",type:"select",options:["Compact","Middel","Lang","Extra lang"],for:["commercial","motorhome"]},
 {key:"price_negotiable",label:"Prijs bespreekbaar",type:"checkbox"},
 {key:"price_includes_vat",label:"Prijs inclusief BTW",type:"checkbox"},
 {key:"leasing_possible",label:"Leasing mogelijk",type:"checkbox"},
 {key:"delivery_period_days",label:"Beschikbaar binnen",type:"number",unit:"dagen",max:1000},
] as const;

export const specFieldByKey = new Map(vehicleSpecificationFields.map(field=>[field.key,field]));
export function isApplicable(field:SpecField, fuel:string, vehicleClass:string):boolean {
 if(!field.for?.length)return true;
 return field.for.includes(fuel)||field.for.includes(vehicleClass);
}
export function normalizeSpecifications(value:unknown):Record<string,string|number|boolean>{
 if(!value || typeof value!=="object" || Array.isArray(value))return {};
 const input=value as Record<string,unknown>;
 const result:Record<string,string|number|boolean>={};
 for(const field of vehicleSpecificationFields){
  const raw=input[field.key];
  if(raw===null||raw===undefined||raw==="")continue;
  if(field.type==="checkbox"){if(raw===true)result[field.key]=true;continue;}
  if(field.type==="number"){
    const amount=Number(raw);
    if(Number.isFinite(amount)&&amount>=0&&amount<=(field.max||1000000))result[field.key]=amount;
    continue;
  }
  if(typeof raw!=="string")continue;
  const clean=raw.trim().slice(0,120);
  if(!clean)continue;
  if(field.type==="select"&&!field.options?.includes(clean))continue;
  result[field.key]=clean;
 }
 return result;
}
