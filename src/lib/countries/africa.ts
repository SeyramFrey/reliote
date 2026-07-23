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
  available: boolean;
};

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { iso2: "DZ", name: "Algérie",                      emoji: "🇩🇿", currency: "USD", available: true },
  { iso2: "AO", name: "Angola",                       emoji: "🇦🇴", currency: "USD", available: true },
  { iso2: "BJ", name: "Bénin",                        emoji: "🇧🇯", currency: "XOF", available: true },
  { iso2: "BW", name: "Botswana",                     emoji: "🇧🇼", currency: "USD", available: true },
  { iso2: "BF", name: "Burkina Faso",                 emoji: "🇧🇫", currency: "XOF", available: true },
  { iso2: "BI", name: "Burundi",                      emoji: "🇧🇮", currency: "USD", available: true },
  { iso2: "CV", name: "Cap-Vert",                     emoji: "🇨🇻", currency: "USD", available: true },
  { iso2: "CM", name: "Cameroun",                     emoji: "🇨🇲", currency: "XAF", available: true },
  { iso2: "CF", name: "Centrafrique",                 emoji: "🇨🇫", currency: "XAF", available: true },
  { iso2: "KM", name: "Comores",                      emoji: "🇰🇲", currency: "USD", available: true },
  { iso2: "CG", name: "Congo",                        emoji: "🇨🇬", currency: "XAF", available: true },
  { iso2: "CD", name: "Congo (RDC)",                  emoji: "🇨🇩", currency: "USD", available: true },
  { iso2: "CI", name: "Côte d'Ivoire",                emoji: "🇨🇮", currency: "XOF", available: true  },
  { iso2: "DJ", name: "Djibouti",                     emoji: "🇩🇯", currency: "USD", available: true },
  { iso2: "EG", name: "Égypte",                       emoji: "🇪🇬", currency: "USD", available: true },
  { iso2: "ER", name: "Érythrée",                     emoji: "🇪🇷", currency: "USD", available: true },
  { iso2: "SZ", name: "Eswatini",                     emoji: "🇸🇿", currency: "USD", available: true },
  { iso2: "ET", name: "Éthiopie",                     emoji: "🇪🇹", currency: "USD", available: true },
  { iso2: "GA", name: "Gabon",                        emoji: "🇬🇦", currency: "XAF", available: true },
  { iso2: "GM", name: "Gambie",                       emoji: "🇬🇲", currency: "USD", available: true },
  { iso2: "GH", name: "Ghana",                        emoji: "🇬🇭", currency: "USD", available: true },
  { iso2: "GN", name: "Guinée",                       emoji: "🇬🇳", currency: "USD", available: true },
  { iso2: "GQ", name: "Guinée équatoriale",           emoji: "🇬🇶", currency: "XAF", available: true },
  { iso2: "GW", name: "Guinée-Bissau",                emoji: "🇬🇼", currency: "XOF", available: true },
  { iso2: "KE", name: "Kenya",                        emoji: "🇰🇪", currency: "USD", available: true },
  { iso2: "LS", name: "Lesotho",                      emoji: "🇱🇸", currency: "USD", available: true },
  { iso2: "LR", name: "Libéria",                      emoji: "🇱🇷", currency: "USD", available: true },
  { iso2: "LY", name: "Libye",                        emoji: "🇱🇾", currency: "USD", available: true },
  { iso2: "MG", name: "Madagascar",                   emoji: "🇲🇬", currency: "USD", available: true },
  { iso2: "MW", name: "Malawi",                       emoji: "🇲🇼", currency: "USD", available: true },
  { iso2: "ML", name: "Mali",                         emoji: "🇲🇱", currency: "XOF", available: true },
  { iso2: "MA", name: "Maroc",                        emoji: "🇲🇦", currency: "EUR", available: true },
  { iso2: "MU", name: "Maurice",                      emoji: "🇲🇺", currency: "EUR", available: true },
  { iso2: "MR", name: "Mauritanie",                   emoji: "🇲🇷", currency: "USD", available: true },
  { iso2: "MZ", name: "Mozambique",                   emoji: "🇲🇿", currency: "USD", available: true },
  { iso2: "NA", name: "Namibie",                      emoji: "🇳🇦", currency: "USD", available: true },
  { iso2: "NE", name: "Niger",                        emoji: "🇳🇪", currency: "XOF", available: true },
  { iso2: "NG", name: "Nigéria",                      emoji: "🇳🇬", currency: "USD", available: true },
  { iso2: "UG", name: "Ouganda",                      emoji: "🇺🇬", currency: "USD", available: true },
  { iso2: "RW", name: "Rwanda",                       emoji: "🇷🇼", currency: "USD", available: true },
  { iso2: "ST", name: "Sao Tomé-et-Principe",         emoji: "🇸🇹", currency: "USD", available: true },
  { iso2: "SN", name: "Sénégal",                      emoji: "🇸🇳", currency: "XOF", available: true },
  { iso2: "SC", name: "Seychelles",                   emoji: "🇸🇨", currency: "EUR", available: true },
  { iso2: "SL", name: "Sierra Leone",                 emoji: "🇸🇱", currency: "USD", available: true },
  { iso2: "SO", name: "Somalie",                      emoji: "🇸🇴", currency: "USD", available: true },
  { iso2: "SD", name: "Soudan",                       emoji: "🇸🇩", currency: "USD", available: true },
  { iso2: "SS", name: "Soudan du Sud",                emoji: "🇸🇸", currency: "USD", available: true },
  { iso2: "TZ", name: "Tanzanie",                     emoji: "🇹🇿", currency: "USD", available: true },
  { iso2: "TD", name: "Tchad",                        emoji: "🇹🇩", currency: "XAF", available: true },
  { iso2: "TG", name: "Togo",                         emoji: "🇹🇬", currency: "XOF", available: true },
  { iso2: "TN", name: "Tunisie",                      emoji: "🇹🇳", currency: "EUR", available: true },
  { iso2: "ZA", name: "Afrique du Sud",               emoji: "🇿🇦", currency: "USD", available: true },
  { iso2: "ZM", name: "Zambie",                       emoji: "🇿🇲", currency: "USD", available: true },
  { iso2: "ZW", name: "Zimbabwe",                     emoji: "🇿🇼", currency: "USD", available: true },
];

// Sorted A→Z, but pinning available countries to the top.
export const AFRICAN_COUNTRIES_SORTED = [...AFRICAN_COUNTRIES].sort((a, b) => {
  if (a.available !== b.available) return a.available ? -1 : 1;
  return a.name.localeCompare(b.name, "fr");
});

export const ACTIVE_COUNTRIES = AFRICAN_COUNTRIES.filter((c) => c.available);
