#!/usr/bin/env node
/**
 * Google Flights Scraper via Apify
 * Actor: scrapier/google-flights-scraper
 *
 * Búsqueda: Buenos Aires (EZE) ↔ Roma (FCO)
 * Ida: sáb 8 ago 2026 | Vuelta: vie 28 ago 2026
 *
 * Usage:
 *   APIFY_TOKEN=<your_token> node search-flights.js
 */

import { ApifyClient } from "apify-client";

// Load token from env
const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  console.error(
    "Error: APIFY_TOKEN environment variable is required.\n" +
      "Get your token at https://console.apify.com/account/integrations\n" +
      "Then run:  APIFY_TOKEN=your_token node search-flights.js"
  );
  process.exit(1);
}

const client = new ApifyClient({ token: APIFY_TOKEN });

// ---------------------------------------------------------------------------
// FLIGHT SEARCH CONFIGURATION — edit this object to change the search
// ---------------------------------------------------------------------------
const input = {
  departureIATA: "EZE",   // Buenos Aires - Ezeiza
  arrivalIATA: "FCO",     // Roma - Fiumicino
  departureDate: "2026-08-08", // Ida: sábado 8 de agosto
  departureDateRng: "",
  arrivalDate: "2026-08-28",   // Vuelta: viernes 28 de agosto
  arrivalDateRng: "",
  multi_city_json: "",
  adults: 1,
  children: 0,
  infants: 0,
  seatclass: "1",         // 1=Economy (Turista)
  stops: "0",             // "0"=Cualquiera, "1"=Sin escalas, "2"=Máx 1 escala
  alliances: "ALL",
  airlines: "ALL",
  maxPrice: 0,            // 0 = sin límite de precio
  currency: "ARS",
  hl: "es",               // Idioma español
  gl: "ar",               // País: Argentina
  max_pages: 1,
  maximum: 20,
  proxyConfiguration: {
    useApifyProxy: false,
  },
};
// ---------------------------------------------------------------------------

async function main() {
  const tripType = input.arrivalDate ? "ida y vuelta" : "solo ida";
  console.log(
    `\nBuscando vuelos [${tripType}]: ${input.departureIATA} ↔ ${input.arrivalIATA}\n` +
      `  Ida    : ${input.departureDate}\n` +
      `  Vuelta : ${input.arrivalDate || "—"}\n` +
      `  Adultos: ${input.adults} | Clase: Turista | Moneda: ${input.currency}\n`
  );

  const run = await client.actor("scrapier/google-flights-scraper").call(input);

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit: input.maximum });

  if (!items.length) {
    console.log("No results found. Try adjusting the search parameters.");
    return;
  }

  console.log(`Found ${items.length} flight(s):\n`);

  items.forEach((flight, i) => {
    const price = flight.price ?? flight.Price ?? "N/A";
    const airline =
      flight.airline ?? flight.Airline ?? flight.carrier ?? "N/A";
    const duration =
      flight.duration ?? flight.Duration ?? flight.travelTime ?? "N/A";
    const stops =
      flight.stops ?? flight.Stops ?? flight.numStops ?? "N/A";
    const departure =
      flight.departureTime ??
      flight.DepartureTime ??
      flight.departure_time ??
      "N/A";
    const arrival =
      flight.arrivalTime ??
      flight.ArrivalTime ??
      flight.arrival_time ??
      "N/A";

    console.log(`[${i + 1}] ${airline}`);
    console.log(`    Price    : ${price} ${input.currency}`);
    console.log(`    Departs  : ${departure}`);
    console.log(`    Arrives  : ${arrival}`);
    console.log(`    Duration : ${duration}`);
    console.log(`    Stops    : ${stops}`);
    console.log();
  });

  console.log("Raw dataset ID:", run.defaultDatasetId);
  console.log(
    "Full results at:",
    `https://console.apify.com/storage/datasets/${run.defaultDatasetId}`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
