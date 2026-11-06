type SearchFormProps = {
  idPrefix: string;
};

const fields = [
  { name: "merk", label: "Merk", placeholder: "Volkswagen" },
  { name: "model", label: "Model", placeholder: "Golf" },
  { name: "prijs", label: "Prijs tot (€)", placeholder: "15.000" },
] as const;

export function SearchForm({ idPrefix }: SearchFormProps) {
  return (
    <form
      action="/zoeken"
      method="get"
      role="search"
      aria-label="Zoek een auto op merk, model en prijs"
      className="border border-line border-t-4 border-t-gold bg-surface p-5 text-ink md:p-6"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        {fields.map((field) => {
          const id = `${idPrefix}-${field.name}`;
          return (
            <div key={field.name}>
              <label htmlFor={id} className="block text-sm font-semibold">
                {field.label}
              </label>
              <input
                id={id}
                name={field.name}
                type="text"
                inputMode={field.name === "prijs" ? "decimal" : "text"}
                autoComplete="off"
                placeholder={field.placeholder}
                className="mt-2 w-full border border-line bg-paper px-3 py-3 text-base text-ink placeholder:text-muted"
              />
            </div>
          );
        })}
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-gold hover:text-ink md:w-auto"
        >
          Zoeken
        </button>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">
        Er is nog geen zoekmotor en geen advertentiebestand. De balk opent de
        zoekpagina, maar verwerkt je invoer nog niet.
      </p>
    </form>
  );
}
