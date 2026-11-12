"use client";

import { memo, useDeferredValue, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { EquipmentItem } from "@/lib/dealer/catalog-client";

type Props = {
  equipment: EquipmentItem[];
  selectedCodes: string[];
  setSelectedCodes: Dispatch<SetStateAction<string[]>>;
  fuel: string;
  vehicleClass: string;
  error: string;
};

/** Equipment stays responsive while the dealer types elsewhere in the single-page form. */
export const EquipmentSelection = memo(function EquipmentSelection({
  equipment, selectedCodes, setSelectedCodes, fuel, vehicleClass, error,
}: Props) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("nl-BE"));
  const fuelKey = fuel === "Elektrisch" ? "electric" : fuel === "Plug-in hybride" ? "plug_in_hybrid" : "other";
  const groups = useMemo(() => {
    const grouped = new Map<string, EquipmentItem[]>();
    for (const item of equipment) {
      if (item.compatible_fuels.length && !item.compatible_fuels.includes(fuelKey) &&
          !item.compatible_fuels.includes(vehicleClass)) continue;
      if (deferredSearch && !(item.label_nl.toLocaleLowerCase("nl-BE").includes(deferredSearch) ||
          item.category.toLocaleLowerCase("nl-BE").includes(deferredSearch))) continue;
      const list = grouped.get(item.category) || [];
      list.push(item);
      grouped.set(item.category, list);
    }
    return Array.from(grouped.entries());
  }, [equipment, fuelKey, vehicleClass, deferredSearch]);
  const chosen = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  return <div className="dealer-equipment-editor">
    <div className="dealer-equipment-toolbar">
      <label className="dealer-form-field">
        <span>Zoek een specifieke optie</span>
        <input type="search" value={search} onChange={event => setSearch(event.target.value)}
          placeholder="Bijv. stoelmassage, luchtvering, matrix-led, warmtepomp" autoComplete="off"/>
      </label>
      <span className="dealer-equipment-counter">{selectedCodes.length} geselecteerd · {equipment.length} opties</span>
    </div>
    {error && <p role="alert" className="portal-form-error">{error}</p>}
    {!error && equipment.length === 0 && <p role="status">Uitrustingscatalogus laden…</p>}
    {groups.map(([category, items]) => <div className="dealer-equipment-category" key={category}>
      <h3>{category} <small>{items.filter(item => chosen.has(item.code)).length} geselecteerd</small></h3>
      <div className="dealer-equipment-grid">
        {items.map(item => <label className="dealer-equipment-option" key={item.code}>
          <input type="checkbox" checked={chosen.has(item.code)}
            onChange={event => setSelectedCodes(previous => event.target.checked ?
              [...new Set([...previous, item.code])] : previous.filter(code => code !== item.code))}/>
          <span>{item.label_nl}</span>
        </label>)}
      </div>
    </div>)}
    {equipment.length > 0 && groups.length === 0 && <p>Geen opties gevonden. Probeer een andere zoekterm.</p>}
    <p className="dealer-wizard-footnote">
      Vink uitsluitend uitrusting aan die daadwerkelijk aanwezig is. De catalogus vult niets automatisch in.
    </p>
  </div>;
});
