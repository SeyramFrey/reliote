// The 54 sovereign African states (UN member roster), with ISO-3166-1 alpha-2 codes.
// All countries are active (pan-African rollout). The `available` flag is kept so a
// single country can be disabled case-by-case ("Bientôt") if ever needed.
//
// `currency` is the local accepted currency for architect fees in that country, used
// by the fee step to seed the EUR/XOF toggle once the platform expands.

export type AfricanCountry = {
  iso2: string;
  name: string;
  emoji: string;
  currency: "XOF" | "XAF" | "EUR" | "USD";
  /** IANA time zone of the capital — used to show meeting times locally. */
  tz: string;
  available: boolean;
};

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { iso2: "DZ", name: "Algérie",                      emoji: "🇩🇿", currency: "USD", tz: "Africa/Algiers", available: true },
  { iso2: "AO", name: "Angola",                       emoji: "🇦🇴", currency: "USD", tz: "Africa/Luanda", available: true },
  { iso2: "BJ", name: "Bénin",                        emoji: "🇧🇯", currency: "XOF", tz: "Africa/Porto-Novo", available: true },
  { iso2: "BW", name: "Botswana",                     emoji: "🇧🇼", currency: "USD", tz: "Africa/Gaborone", available: true },
  { iso2: "BF", name: "Burkina Faso",                 emoji: "🇧🇫", currency: "XOF", tz: "Africa/Ouagadougou", available: true },
  { iso2: "BI", name: "Burundi",                      emoji: "🇧🇮", currency: "USD", tz: "Africa/Bujumbura", available: true },
  { iso2: "CV", name: "Cap-Vert",                     emoji: "🇨🇻", currency: "USD", tz: "Atlantic/Cape_Verde", available: true },
  { iso2: "CM", name: "Cameroun",                     emoji: "🇨🇲", currency: "XAF", tz: "Africa/Douala", available: true },
  { iso2: "CF", name: "Centrafrique",                 emoji: "🇨🇫", currency: "XAF", tz: "Africa/Bangui", available: true },
  { iso2: "KM", name: "Comores",                      emoji: "🇰🇲", currency: "USD", tz: "Indian/Comoro", available: true },
  { iso2: "CG", name: "Congo",                        emoji: "🇨🇬", currency: "XAF", tz: "Africa/Brazzaville", available: true },
  { iso2: "CD", name: "Congo (RDC)",                  emoji: "🇨🇩", currency: "USD", tz: "Africa/Kinshasa", available: true },
  { iso2: "CI", name: "Côte d'Ivoire",                emoji: "🇨🇮", currency: "XOF", tz: "Africa/Abidjan", available: true  },
  { iso2: "DJ", name: "Djibouti",                     emoji: "🇩🇯", currency: "USD", tz: "Africa/Djibouti", available: true },
  { iso2: "EG", name: "Égypte",                       emoji: "🇪🇬", currency: "USD", tz: "Africa/Cairo", available: true },
  { iso2: "ER", name: "Érythrée",                     emoji: "🇪🇷", currency: "USD", tz: "Africa/Asmara", available: true },
  { iso2: "SZ", name: "Eswatini",                     emoji: "🇸🇿", currency: "USD", tz: "Africa/Mbabane", available: true },
  { iso2: "ET", name: "Éthiopie",                     emoji: "🇪🇹", currency: "USD", tz: "Africa/Addis_Ababa", available: true },
  { iso2: "GA", name: "Gabon",                        emoji: "🇬🇦", currency: "XAF", tz: "Africa/Libreville", available: true },
  { iso2: "GM", name: "Gambie",                       emoji: "🇬🇲", currency: "USD", tz: "Africa/Banjul", available: true },
  { iso2: "GH", name: "Ghana",                        emoji: "🇬🇭", currency: "USD", tz: "Africa/Accra", available: true },
  { iso2: "GN", name: "Guinée",                       emoji: "🇬🇳", currency: "USD", tz: "Africa/Conakry", available: true },
  { iso2: "GQ", name: "Guinée équatoriale",           emoji: "🇬🇶", currency: "XAF", tz: "Africa/Malabo", available: true },
  { iso2: "GW", name: "Guinée-Bissau",                emoji: "🇬🇼", currency: "XOF", tz: "Africa/Bissau", available: true },
  { iso2: "KE", name: "Kenya",                        emoji: "🇰🇪", currency: "USD", tz: "Africa/Nairobi", available: true },
  { iso2: "LS", name: "Lesotho",                      emoji: "🇱🇸", currency: "USD", tz: "Africa/Maseru", available: true },
  { iso2: "LR", name: "Libéria",                      emoji: "🇱🇷", currency: "USD", tz: "Africa/Monrovia", available: true },
  { iso2: "LY", name: "Libye",                        emoji: "🇱🇾", currency: "USD", tz: "Africa/Tripoli", available: true },
  { iso2: "MG", name: "Madagascar",                   emoji: "🇲🇬", currency: "USD", tz: "Indian/Antananarivo", available: true },
  { iso2: "MW", name: "Malawi",                       emoji: "🇲🇼", currency: "USD", tz: "Africa/Blantyre", available: true },
  { iso2: "ML", name: "Mali",                         emoji: "🇲🇱", currency: "XOF", tz: "Africa/Bamako", available: true },
  { iso2: "MA", name: "Maroc",                        emoji: "🇲🇦", currency: "EUR", tz: "Africa/Casablanca", available: true },
  { iso2: "MU", name: "Maurice",                      emoji: "🇲🇺", currency: "EUR", tz: "Indian/Mauritius", available: true },
  { iso2: "MR", name: "Mauritanie",                   emoji: "🇲🇷", currency: "USD", tz: "Africa/Nouakchott", available: true },
  { iso2: "MZ", name: "Mozambique",                   emoji: "🇲🇿", currency: "USD", tz: "Africa/Maputo", available: true },
  { iso2: "NA", name: "Namibie",                      emoji: "🇳🇦", currency: "USD", tz: "Africa/Windhoek", available: true },
  { iso2: "NE", name: "Niger",                        emoji: "🇳🇪", currency: "XOF", tz: "Africa/Niamey", available: true },
  { iso2: "NG", name: "Nigéria",                      emoji: "🇳🇬", currency: "USD", tz: "Africa/Lagos", available: true },
  { iso2: "UG", name: "Ouganda",                      emoji: "🇺🇬", currency: "USD", tz: "Africa/Kampala", available: true },
  { iso2: "RW", name: "Rwanda",                       emoji: "🇷🇼", currency: "USD", tz: "Africa/Kigali", available: true },
  { iso2: "ST", name: "Sao Tomé-et-Principe",         emoji: "🇸🇹", currency: "USD", tz: "Africa/Sao_Tome", available: true },
  { iso2: "SN", name: "Sénégal",                      emoji: "🇸🇳", currency: "XOF", tz: "Africa/Dakar", available: true },
  { iso2: "SC", name: "Seychelles",                   emoji: "🇸🇨", currency: "EUR", tz: "Indian/Mahe", available: true },
  { iso2: "SL", name: "Sierra Leone",                 emoji: "🇸🇱", currency: "USD", tz: "Africa/Freetown", available: true },
  { iso2: "SO", name: "Somalie",                      emoji: "🇸🇴", currency: "USD", tz: "Africa/Mogadishu", available: true },
  { iso2: "SD", name: "Soudan",                       emoji: "🇸🇩", currency: "USD", tz: "Africa/Khartoum", available: true },
  { iso2: "SS", name: "Soudan du Sud",                emoji: "🇸🇸", currency: "USD", tz: "Africa/Juba", available: true },
  { iso2: "TZ", name: "Tanzanie",                     emoji: "🇹🇿", currency: "USD", tz: "Africa/Dar_es_Salaam", available: true },
  { iso2: "TD", name: "Tchad",                        emoji: "🇹🇩", currency: "XAF", tz: "Africa/Ndjamena", available: true },
  { iso2: "TG", name: "Togo",                         emoji: "🇹🇬", currency: "XOF", tz: "Africa/Lome", available: true },
  { iso2: "TN", name: "Tunisie",                      emoji: "🇹🇳", currency: "EUR", tz: "Africa/Tunis", available: true },
  { iso2: "ZA", name: "Afrique du Sud",               emoji: "🇿🇦", currency: "USD", tz: "Africa/Johannesburg", available: true },
  { iso2: "ZM", name: "Zambie",                       emoji: "🇿🇲", currency: "USD", tz: "Africa/Lusaka", available: true },
  { iso2: "ZW", name: "Zimbabwe",                     emoji: "🇿🇼", currency: "USD", tz: "Africa/Harare", available: true },
];

// Sorted A→Z, but pinning available countries to the top.
export const AFRICAN_COUNTRIES_SORTED = [...AFRICAN_COUNTRIES].sort((a, b) => {
  if (a.available !== b.available) return a.available ? -1 : 1;
  return a.name.localeCompare(b.name, "fr");
});

export const ACTIVE_COUNTRIES = AFRICAN_COUNTRIES.filter((c) => c.available);
