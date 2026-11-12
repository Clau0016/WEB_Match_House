export type MapPoint = [number, number];

const cities: Record<string, [MapPoint, string]> = {
  milano: [[45.4642, 9.19], "Lombardia"], brescia: [[45.5416, 10.2118], "Lombardia"],
  bergamo: [[45.6983, 9.6773], "Lombardia"], pavia: [[45.1847, 9.1582], "Lombardia"],
  torino: [[45.0703, 7.6869], "Piemonte"], aosta: [[45.737, 7.3201], "Valle d’Aosta"],
  genova: [[44.4056, 8.9463], "Liguria"], bologna: [[44.4949, 11.3426], "Emilia-Romagna"],
  modena: [[44.6471, 10.9252], "Emilia-Romagna"], parma: [[44.8015, 10.3279], "Emilia-Romagna"],
  ferrara: [[44.8381, 11.6198], "Emilia-Romagna"], rimini: [[44.0678, 12.5695], "Emilia-Romagna"],
  venezia: [[45.4408, 12.3155], "Veneto"], padova: [[45.4064, 11.8768], "Veneto"],
  verona: [[45.4384, 10.9916], "Veneto"], trento: [[46.0748, 11.1217], "Trentino-Alto Adige"],
  bolzano: [[46.4983, 11.3548], "Trentino-Alto Adige"], trieste: [[45.6495, 13.7768], "Friuli-Venezia Giulia"],
  udine: [[46.0711, 13.2346], "Friuli-Venezia Giulia"], firenze: [[43.7696, 11.2558], "Toscana"],
  pisa: [[43.7228, 10.4017], "Toscana"], siena: [[43.3188, 11.3308], "Toscana"],
  perugia: [[43.1107, 12.3908], "Umbria"], ancona: [[43.6158, 13.5189], "Marche"],
  urbino: [[43.7262, 12.6363], "Marche"], roma: [[41.9028, 12.4964], "Lazio"],
  latina: [[41.4676, 12.9037], "Lazio"], pescara: [[42.4618, 14.2161], "Abruzzo"],
  "l aquila": [[42.3498, 13.3995], "Abruzzo"], campobasso: [[41.5603, 14.6627], "Molise"],
  napoli: [[40.8518, 14.2681], "Campania"], salerno: [[40.6824, 14.7681], "Campania"],
  bari: [[41.1171, 16.8719], "Puglia"], lecce: [[40.3515, 18.175], "Puglia"],
  potenza: [[40.6404, 15.8056], "Basilicata"], catanzaro: [[38.9098, 16.5877], "Calabria"],
  cosenza: [[39.298, 16.2537], "Calabria"], palermo: [[38.1157, 13.3615], "Sicilia"],
  catania: [[37.5079, 15.083], "Sicilia"], messina: [[38.1938, 15.554], "Sicilia"],
  cagliari: [[39.2238, 9.1217], "Sardegna"], sassari: [[40.7259, 8.5557], "Sardegna"],
};

const zones: Record<string, MapPoint> = {
  "milano/citta studi": [45.4795, 9.2284],
  "bologna/bolognina": [44.5181, 11.347],
  "torino/san salvario": [45.0513, 7.6818],
  "roma/pigneto": [41.8893, 12.5324],
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[’']/g, " ").trim().replace(/\s+/g, " ");
}

export function locationFor(city: string, area: string) {
  const key = normalize(city);
  const center = cities[key];
  const neighborhood = zones[key + "/" + normalize(area)];
  return { point: neighborhood ?? center?.[0], region: center?.[1] ?? "", neighborhood: Boolean(neighborhood) };
}

export function coordinates(latitude?: string, longitude?: string): MapPoint | undefined {
  if (!latitude?.trim() || !longitude?.trim()) return undefined;
  const lat = Number(latitude.replace(",", "."));
  const lng = Number(longitude.replace(",", "."));
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= 35 && lat <= 48 && lng >= 6 && lng <= 19) return [lat, lng];
  return undefined;
}
