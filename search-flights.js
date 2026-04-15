#!/usr/bin/env node
/**
 * Google Flights Scraper via Apify
 * Actor: scrapier/google-flights-scraper
 *
 * Usage:
 *   APIFY_TOKEN=<your_token> node search-flights.js
 *
 * Or set APIFY_TOKEN in a .env file.
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
  departureIATA: "LAX",   // Origin airport IATA code
  arrivalIATA: "JFK",     // Destination airport IATA code
  departureDate: "2026-07-28", // Outbound date (YYYY-MM-DD)
  departureDateRng: "",   // Optional end of outbound date range
  arrivalDate: "",        // Return date for round trips (leave empty for one-way)
  arrivalDateRng: "",
  multi_city_json: "",    // Multi-city itinerary (JSON string, leave empty)
  adults: 1,
  children: 0,
  infants: 0,
  seatclass: "1",         // 1=Economy, 2=Premium Economy, 3=Business, 4=First
  stops: "0",             // "0"=Any, "1"=Nonstop only, "2"=1 stop max
  alliances: "ALL",       // "ALL", "STAR_ALLIANCE", "ONEWORLD", "SKYTEAM"
  airlines: "ALL",        // "ALL" or comma-separated IATA codes e.g. "AA,UA"
  maxPrice: 0,            // 0 = no price limit
  currency: "USD",
  hl: "en",               // Interface language
  gl: "us",               // Country for results
  max_pages: 1,
  maximum: 20,            // Max results per run
  proxyConfiguration: {
    useApifyProxy: false,
  },
};
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `\nSearching flights: ${input.departureIATA} → ${input.arrivalIATA}` +
      ` on ${input.departureDate} (${input.adults} adult(s))\n`
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
