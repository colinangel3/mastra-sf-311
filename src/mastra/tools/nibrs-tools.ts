// src/mastra/tools/nibrs-tools.ts
// NIBRS Crime Data Tools using Google BigQuery

import { createTool } from "@mastra/core/tools";
import { BigQuery } from "@google-cloud/bigquery";
import { z } from "zod";
import { configDotenv } from "dotenv";

configDotenv();

const PROJECT_ID = "daemo-daemon-testing";
const DATASET = "nibrs_data";

// UCR Offense code descriptions for friendly output
const UCR_OFFENSE_DESCRIPTIONS: Record<string, string> = {
  "09A": "Murder and Nonnegligent Manslaughter",
  "09B": "Negligent Manslaughter",
  "09C": "Justifiable Homicide",
  "100": "Kidnapping/Abduction",
  "11A": "Rape",
  "11B": "Sodomy",
  "11C": "Sexual Assault With An Object",
  "11D": "Fondling",
  "120": "Robbery",
  "13A": "Aggravated Assault",
  "13B": "Simple Assault",
  "13C": "Intimidation",
  "200": "Arson",
  "210": "Extortion/Blackmail",
  "220": "Burglary/Breaking & Entering",
  "23A": "Pocket-picking",
  "23B": "Purse-snatching",
  "23C": "Shoplifting",
  "23D": "Theft From Building",
  "23E": "Theft From Coin-Operated Machine",
  "23F": "Theft From Motor Vehicle",
  "23G": "Theft of Motor Vehicle Parts",
  "23H": "All Other Larceny",
  "240": "Motor Vehicle Theft",
  "250": "Counterfeiting/Forgery",
  "26A": "False Pretenses/Swindle/Confidence Game",
  "26B": "Credit Card/ATM Fraud",
  "26C": "Impersonation",
  "26D": "Welfare Fraud",
  "26E": "Wire Fraud",
  "26F": "Identity Theft",
  "26G": "Hacking/Computer Invasion",
  "26H": "Money Laundering",
  "270": "Embezzlement",
  "280": "Stolen Property Offenses",
  "290": "Destruction/Damage/Vandalism",
  "35A": "Drug/Narcotic Violations",
  "35B": "Drug Equipment Violations",
  "36A": "Incest",
  "36B": "Statutory Rape",
  "370": "Pornography/Obscene Material",
  "39A": "Betting/Wagering",
  "39B": "Operating/Promoting Gambling",
  "39C": "Gambling Equipment Violations",
  "39D": "Sports Tampering",
  "40A": "Prostitution",
  "40B": "Assisting/Promoting Prostitution",
  "40C": "Purchasing Prostitution",
  "510": "Bribery",
  "520": "Weapon Law Violations",
  "521": "Firearm Act Violation",
  "522": "Explosives",
  "526": "Weapon Offense - Use/Possession",
  "58A": "Animal Cruelty - Intentional",
  "58B": "Animal Cruelty - Neglect",
  "61A": "Human Trafficking - Commercial Sex",
  "61B": "Human Trafficking - Involuntary Servitude",
  "64A": "Human Trafficking - Commercial Sex Acts",
  "64B": "Human Trafficking - Involuntary Servitude",
  "720": "Animal Cruelty",
  "90A": "Bad Checks",
  "90B": "Curfew/Loitering/Vagrancy",
  "90C": "Disorderly Conduct",
  "90D": "Driving Under the Influence",
  "90E": "Drunkenness",
  "90F": "Family Offenses - Nonviolent",
  "90G": "Liquor Law Violations",
  "90H": "Peeping Tom",
  "90I": "Runaway",
  "90J": "Trespass of Real Property",
  "90Z": "All Other Offenses",
};

const LOCATION_TYPE_DESCRIPTIONS: Record<string, string> = {
  "01": "Air/Bus/Train Terminal",
  "02": "Bank/Savings and Loan",
  "03": "Bar/Nightclub",
  "04": "Church/Synagogue/Temple/Mosque",
  "05": "Commercial/Office Building",
  "06": "Construction Site",
  "07": "Convenience Store",
  "08": "Department/Discount Store",
  "09": "Drug Store/Doctor Office/Hospital",
  "10": "Field/Woods",
  "11": "Government/Public Building",
  "12": "Grocery/Supermarket",
  "13": "Highway/Road/Alley/Street/Sidewalk",
  "14": "Hotel/Motel/Etc.",
  "15": "Jail/Prison/Penitentiary",
  "16": "Lake/Waterway/Beach",
  "17": "Liquor Store",
  "18": "Parking/Drop Lot/Garage",
  "19": "Rental Storage Facility",
  "20": "Residence/Home",
  "21": "Restaurant",
  "22": "School/College",
  "23": "Service/Gas Station",
  "24": "Specialty Store",
  "25": "Other/Unknown",
  "37": "Abandoned/Condemned Structure",
  "38": "Amusement Park",
  "39": "Arena/Stadium/Fairgrounds",
  "40": "ATM Separate from Bank",
  "41": "Auto Dealership",
  "42": "Camp/Campground",
  "44": "Daycare Facility",
  "45": "Dock/Wharf/Freight Terminal",
  "46": "Farm Facility",
  "47": "Gambling Facility/Casino",
  "48": "Industrial Site",
  "49": "Military Installation",
  "50": "Park/Playground",
  "51": "Rest Area",
  "52": "School - College/University",
  "53": "School - Elementary/Secondary",
  "54": "Shelter - Mission/Homeless",
  "55": "Shopping Mall",
  "56": "Tribal Lands",
  "57": "Community Center",
  "58": "Cyberspace",
};

const BIAS_DESCRIPTIONS: Record<string, string> = {
  "11": "Anti-White",
  "12": "Anti-Black or African American",
  "13": "Anti-American Indian or Alaska Native",
  "14": "Anti-Asian",
  "15": "Anti-Multiple Races, Group",
  "16": "Anti-Native Hawaiian or Other Pacific Islander",
  "21": "Anti-Jewish",
  "22": "Anti-Catholic",
  "23": "Anti-Protestant",
  "24": "Anti-Islamic (Muslim)",
  "25": "Anti-Other Religion",
  "26": "Anti-Multiple Religions, Group",
  "27": "Anti-Atheism/Agnosticism",
  "28": "Anti-Mormon",
  "29": "Anti-Jehovah's Witness",
  "31": "Anti-Arab",
  "32": "Anti-Hispanic or Latino",
  "33": "Anti-Other Race/Ethnicity/Ancestry",
  "41": "Anti-Gay (Male)",
  "42": "Anti-Lesbian",
  "43": "Anti-Lesbian, Gay, Bisexual, or Transgender",
  "44": "Anti-Heterosexual",
  "45": "Anti-Bisexual",
  "51": "Anti-Physical Disability",
  "52": "Anti-Mental Disability",
  "61": "Anti-Male",
  "62": "Anti-Female",
  "71": "Anti-Transgender",
  "72": "Anti-Gender Non-Conforming",
  "81": "Anti-Eastern Orthodox",
  "82": "Anti-Other Christian",
  "83": "Anti-Buddhist",
  "84": "Anti-Hindu",
  "85": "Anti-Sikh",
  "88": "None (no bias)",
  "99": "Unknown",
};

const WEAPON_DESCRIPTIONS: Record<string, string> = {
  "11": "Firearm (type not stated)",
  "12": "Handgun",
  "13": "Rifle",
  "14": "Shotgun",
  "15": "Other Firearm",
  "20": "Knife/Cutting Instrument",
  "30": "Blunt Object",
  "35": "Motor Vehicle",
  "40": "Personal Weapons (hands, fists, feet)",
  "50": "Poison",
  "60": "Explosives",
  "65": "Fire/Incendiary Device",
  "70": "Drugs/Narcotics/Sleeping Pills",
  "85": "Asphyxiation",
  "90": "Other",
  "95": "Unknown",
  "99": "None",
};

const INJURY_DESCRIPTIONS: Record<string, string> = {
  B: "Apparent Broken Bones",
  I: "Possible Internal Injury",
  L: "Severe Laceration",
  M: "Apparent Minor Injury",
  N: "None",
  O: "Other Major Injury",
  T: "Loss of Teeth",
  U: "Unconsciousness",
};

const RELATIONSHIP_DESCRIPTIONS: Record<string, string> = {
  AQ: "Acquaintance",
  BG: "Boyfriend/Girlfriend",
  CF: "Child of Boyfriend/Girlfriend",
  CH: "Child",
  EE: "Employee",
  ER: "Employer",
  ES: "Ex-Spouse",
  FR: "Friend",
  HR: "Homosexual Relationship",
  NE: "Neighbor",
  OF: "Otherwise Known",
  OK: "Other Known",
  PA: "Parent",
  RU: "Relationship Unknown",
  SB: "Sibling",
  SE: "Stepchild",
  SP: "Spouse",
  SS: "Stepsibling",
  ST: "Stepparent",
  UN: "Unknown",
  VO: "Victim Was Offender",
  XS: "Ex-Boyfriend/Ex-Girlfriend",
};

// State abbreviations enum
const StateAbbrEnum = z.enum([
  "AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL",
  "GA", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA",
  "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE",
  "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VA", "VI", "VT", "WA", "WI",
  "WV", "WY",
]);

// UCR Offense codes enum
const UCROffenseCodeEnum = z.enum([
  "09A", "09B", "09C", "100", "11A", "11B", "11C", "11D", "120",
  "13A", "13B", "13C", "200", "210", "220", "23A", "23B", "23C",
  "23D", "23E", "23F", "23G", "23H", "240", "250", "26A", "26B",
  "26C", "26D", "26E", "26F", "26G", "26H", "270", "280", "290",
  "35A", "35B", "36A", "36B", "370", "39A", "39B", "39C", "39D",
  "40A", "40B", "40C", "510", "520", "521", "522", "526", "58A",
  "58B", "61A", "61B", "64A", "64B", "720", "90A", "90B", "90C",
  "90D", "90E", "90F", "90G", "90H", "90I", "90J", "90Z",
]);

// BigQuery client singleton
let bigqueryClient: BigQuery | null = null;

function getBigQueryClient(): BigQuery {
  if (!bigqueryClient) {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (credentialsJson) {
      try {
        const cleanedJson = credentialsJson.replace(/^['"]|['"]$/g, "");
        const credentials = JSON.parse(cleanedJson);
        bigqueryClient = new BigQuery({
          projectId: PROJECT_ID,
          credentials: credentials,
        });
        console.log("[BigQuery] Initialized with service account credentials");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[BigQuery] Failed to parse credentials JSON:", errorMessage);
        console.log("[BigQuery] Falling back to Application Default Credentials");
        bigqueryClient = new BigQuery({ projectId: PROJECT_ID });
      }
    } else {
      console.log("[BigQuery] No credentials JSON found, using Application Default Credentials");
      bigqueryClient = new BigQuery({ projectId: PROJECT_ID });
    }
  }
  return bigqueryClient;
}

async function runQuery(sql: string): Promise<Record<string, unknown>[]> {
  const bigquery = getBigQueryClient();
  console.log(`[BigQuery] Executing: ${sql.substring(0, 200)}...`);
  try {
    const [rows] = await bigquery.query({
      query: sql,
      location: "US",
    });
    return rows;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[BigQuery] Error:", errorMessage);
    throw new Error(`BigQuery query failed: ${errorMessage}`);
  }
}

function buildWhereClause(conditions: string[]): string {
  const validConditions = conditions.filter((c) => c.length > 0);
  return validConditions.length > 0
    ? `WHERE ${validConditions.join(" AND ")}`
    : "";
}

// Normalize code values that may be stored as floats (11.0) or strings ('11')
function normalizeCode(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // If it looks like a float (e.g., "11.0"), convert to integer string
  if (str.includes(".")) {
    return String(Math.floor(Number(value)));
  }
  return str;
}

// =========================================================================
// AGENCY SEARCH TOOL
// =========================================================================

export const searchAgenciesTool = createTool({
  id: "search-agencies",
  description:
    "Search for law enforcement agency metadata (names, ORIs, locations). Use this ONLY to find agency ORI identifiers for a specific city/county - NOT for counting agencies or aggregating by state.",
  inputSchema: z.object({
    stateAbbr: StateAbbrEnum.nullish().describe("Filter by state abbreviation"),
    county: z.string().nullish().describe("Filter by county name (partial match)"),
    agencyName: z.string().nullish().describe("Filter by agency name (partial match)"),
    agencyType: z.string().nullish().describe("Filter by agency type"),
    nibrsOnly: z.boolean().nullish().default(false).describe("Only return NIBRS-participating agencies"),
    limit: z.number().nullish().default(100).describe("Maximum results to return (max 10000)"),
  }),
  outputSchema: z.object({
    agencies: z.array(z.record(z.string(), z.unknown())),
    total_count: z.number(),
  }),
  execute: async (input) => {
    const conditions: string[] = [];

    if (input.stateAbbr) {
      conditions.push(`state_abbr = '${input.stateAbbr}'`);
    }
    if (input.county) {
      conditions.push(`LOWER(counties) LIKE '%${input.county.toLowerCase()}%'`);
    }
    if (input.agencyName) {
      conditions.push(`LOWER(agency_name) LIKE '%${input.agencyName.toLowerCase()}%'`);
    }
    if (input.agencyType) {
      conditions.push(`LOWER(agency_type_name) LIKE '%${input.agencyType.toLowerCase()}%'`);
    }
    if (input.nibrsOnly) {
      conditions.push(`is_nibrs = TRUE`);
    }

    const whereClause = buildWhereClause(conditions);
    const limit = Math.min(input.limit || 100, 10000);

    const sql = `
      SELECT
        ori,
        agency_name,
        agency_type_name,
        state_abbr,
        state_name,
        counties,
        latitude,
        longitude,
        is_nibrs,
        CAST(nibrs_start_date AS STRING) as nibrs_start_date
      FROM \`${PROJECT_ID}.${DATASET}.agencies\`
      ${whereClause}
      ORDER BY state_abbr, agency_name
      LIMIT ${limit}
    `;

    const rows = await runQuery(sql);
    return {
      agencies: rows,
      total_count: rows.length,
    };
  },
});

// =========================================================================
// INCIDENT COUNTS TOOL
// =========================================================================

export const getIncidentCountsTool = createTool({
  id: "get-incident-counts",
  description:
    "Get crime incident counts, rates, and comparisons from NIBRS data. Use for comparing crime across agencies/cities, getting homicide counts by agency, comparing crime rates between states, and ranking agencies by crime type.",
  inputSchema: z.object({
    stateAbbr: StateAbbrEnum.nullish().describe("Filter by state"),
    ori: z.string().nullish().describe("Filter by specific agency ORI"),
    fromYear: z.number().int().nullish().describe("Start year (inclusive)"),
    toYear: z.number().int().nullish().describe("End year (inclusive)"),
    offenseCode: UCROffenseCodeEnum.nullish().describe("Filter by specific offense code"),
    groupBy: z.enum(["state", "year", "agency", "offense", "state_year", "offense_year", "agency_year"]).default("year").describe("How to group the results"),
    limit: z.number().nullish().default(1000).describe("Maximum results (max 10000)"),
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())),
    total_rows: z.number(),
    query_info: z.string().optional(),
  }),
  execute: async (input) => {
    const conditions: string[] = [];

    if (input.stateAbbr) {
      conditions.push(`ag.state_abbr = '${input.stateAbbr}'`);
    }
    if (input.ori) {
      conditions.push(`a.ori = '${input.ori}'`);
    }
    if (input.fromYear) {
      conditions.push(`a.data_year >= ${input.fromYear}`);
    }
    if (input.toYear) {
      conditions.push(`a.data_year <= ${input.toYear}`);
    }
    if (input.offenseCode) {
      conditions.push(`o.ucr_offense_code = '${input.offenseCode}'`);
    }

    const whereClause = buildWhereClause(conditions);
    const limit = Math.min(input.limit || 1000, 10000);

    let groupByClause: string;
    let selectClause: string;
    let orderByClause: string;

    switch (input.groupBy) {
      case "state":
        selectClause = "ag.state_abbr as state, COUNT(DISTINCT CONCAT(a.ori, '-', a.incident_number)) as incident_count";
        groupByClause = "GROUP BY ag.state_abbr";
        orderByClause = "ORDER BY incident_count DESC";
        break;
      case "agency":
        selectClause = "a.ori, ag.agency_name, COUNT(DISTINCT CONCAT(a.ori, '-', a.incident_number)) as incident_count";
        groupByClause = "GROUP BY a.ori, ag.agency_name";
        orderByClause = "ORDER BY incident_count DESC";
        break;
      case "offense":
        selectClause = "o.ucr_offense_code as offense_code, COUNT(*) as offense_count";
        groupByClause = "GROUP BY o.ucr_offense_code";
        orderByClause = "ORDER BY offense_count DESC";
        break;
      case "state_year":
        selectClause = "ag.state_abbr as state, a.data_year as year, COUNT(DISTINCT CONCAT(a.ori, '-', a.incident_number)) as incident_count";
        groupByClause = "GROUP BY ag.state_abbr, a.data_year";
        orderByClause = "ORDER BY ag.state_abbr, a.data_year";
        break;
      case "offense_year":
        selectClause = "o.ucr_offense_code as offense_code, a.data_year as year, COUNT(*) as offense_count";
        groupByClause = "GROUP BY o.ucr_offense_code, a.data_year";
        orderByClause = "ORDER BY o.ucr_offense_code, a.data_year";
        break;
      case "agency_year":
        selectClause = "a.ori, ag.agency_name, a.data_year as year, COUNT(DISTINCT CONCAT(a.ori, '-', a.incident_number)) as incident_count";
        groupByClause = "GROUP BY a.ori, ag.agency_name, a.data_year";
        orderByClause = "ORDER BY ag.agency_name, a.data_year";
        break;
      case "year":
      default:
        selectClause = "a.data_year as year, COUNT(DISTINCT CONCAT(a.ori, '-', a.incident_number)) as incident_count";
        groupByClause = "GROUP BY a.data_year";
        orderByClause = "ORDER BY a.data_year";
        break;
    }

    const sql = `
      SELECT ${selectClause}
      FROM \`${PROJECT_ID}.${DATASET}.administrative_segment\` a
      JOIN \`${PROJECT_ID}.${DATASET}.offense_segment\` o
        ON a.ori = o.ori AND a.incident_number = o.incident_number AND a.data_year = o.data_year
      JOIN \`${PROJECT_ID}.${DATASET}.agencies\` ag ON a.ori = ag.ori
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      LIMIT ${limit}
    `;

    const rows = await runQuery(sql);

    // Add offense descriptions if grouping by offense
    if (input.groupBy === "offense" || input.groupBy === "offense_year") {
      rows.forEach((row) => {
        if (row.offense_code) {
          row.offense_description = UCR_OFFENSE_DESCRIPTIONS[row.offense_code as string] || "Unknown";
        }
      });
    }

    return {
      results: rows,
      total_rows: rows.length,
      query_info: `Grouped by: ${input.groupBy}`,
    };
  },
});

// =========================================================================
// OFFENSE SUMMARY TOOL
// =========================================================================

export const getOffenseSummaryTool = createTool({
  id: "get-offense-summary",
  description:
    "Get detailed offense statistics from NIBRS data. Can analyze offenses by type, location, weapon used, or bias motivation.",
  inputSchema: z.object({
    stateAbbr: StateAbbrEnum.nullish().describe("Filter by state"),
    ori: z.string().nullish().describe("Filter by agency ORI"),
    fromYear: z.number().int().nullish().describe("Start year"),
    toYear: z.number().int().nullish().describe("End year"),
    offenseCode: UCROffenseCodeEnum.nullish().describe("Filter by offense code"),
    locationType: z.string().nullish().describe("Filter by location type"),
    biasMotivation: z.string().nullish().describe("Filter by bias motivation (hate crimes)"),
    groupBy: z.enum(["offense", "location", "weapon", "bias", "offense_year"]).default("offense").describe("How to group results"),
    limit: z.number().nullish().default(100).describe("Maximum results (max 10000)"),
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())),
    total_rows: z.number(),
    query_info: z.string().optional(),
  }),
  execute: async (input) => {
    const conditions: string[] = [];

    if (input.stateAbbr) {
      conditions.push(`ag.state_abbr = '${input.stateAbbr}'`);
    }
    if (input.ori) {
      conditions.push(`o.ori = '${input.ori}'`);
    }
    if (input.fromYear) {
      conditions.push(`o.data_year >= ${input.fromYear}`);
    }
    if (input.toYear) {
      conditions.push(`o.data_year <= ${input.toYear}`);
    }
    if (input.offenseCode) {
      conditions.push(`o.ucr_offense_code = '${input.offenseCode}'`);
    }
    if (input.locationType) {
      conditions.push(`o.location_type = '${input.locationType}'`);
    }
    if (input.biasMotivation) {
      conditions.push(`o.bias_motivation = '${input.biasMotivation}'`);
    }

    const whereClause = buildWhereClause(conditions);
    const limit = Math.min(input.limit || 100, 10000);

    let selectClause: string;
    let groupByClause: string;
    let orderByClause: string;
    let descriptionMap: Record<string, string> = {};
    let descriptionField: string = "";

    switch (input.groupBy) {
      case "location":
        selectClause = "o.location_type, COUNT(*) as count";
        groupByClause = "GROUP BY o.location_type";
        orderByClause = "ORDER BY count DESC";
        descriptionMap = LOCATION_TYPE_DESCRIPTIONS;
        descriptionField = "location_type";
        break;
      case "weapon":
        selectClause = "o.type_weapon_force_involved1 as weapon_code, COUNT(*) as count";
        groupByClause = "GROUP BY o.type_weapon_force_involved1";
        orderByClause = "ORDER BY count DESC";
        descriptionMap = WEAPON_DESCRIPTIONS;
        descriptionField = "weapon_code";
        break;
      case "bias":
        selectClause = "o.bias_motivation, COUNT(*) as count";
        groupByClause = "GROUP BY o.bias_motivation";
        orderByClause = "ORDER BY count DESC";
        descriptionMap = BIAS_DESCRIPTIONS;
        descriptionField = "bias_motivation";
        break;
      case "offense_year":
        selectClause = "o.ucr_offense_code as offense_code, o.data_year as year, COUNT(*) as count";
        groupByClause = "GROUP BY o.ucr_offense_code, o.data_year";
        orderByClause = "ORDER BY o.ucr_offense_code, o.data_year";
        descriptionMap = UCR_OFFENSE_DESCRIPTIONS;
        descriptionField = "offense_code";
        break;
      case "offense":
      default:
        selectClause = "o.ucr_offense_code as offense_code, COUNT(*) as count";
        groupByClause = "GROUP BY o.ucr_offense_code";
        orderByClause = "ORDER BY count DESC";
        descriptionMap = UCR_OFFENSE_DESCRIPTIONS;
        descriptionField = "offense_code";
        break;
    }

    const sql = `
      SELECT ${selectClause}
      FROM \`${PROJECT_ID}.${DATASET}.offense_segment\` o
      JOIN \`${PROJECT_ID}.${DATASET}.agencies\` ag ON o.ori = ag.ori
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      LIMIT ${limit}
    `;

    const rows = await runQuery(sql);

    // Add descriptions
    if (Object.keys(descriptionMap).length > 0) {
      rows.forEach((row) => {
        const code = row[descriptionField];
        if (code !== null && code !== undefined) {
          // Normalize code (handles floats like 11.0 -> "11")
          const codeKey = normalizeCode(code);
          if (descriptionMap[codeKey]) {
            row.description = descriptionMap[codeKey];
          }
        }
      });
    }

    return {
      results: rows,
      total_rows: rows.length,
      query_info: `Grouped by: ${input.groupBy}`,
    };
  },
});

// =========================================================================
// VICTIM DEMOGRAPHICS TOOL
// =========================================================================

export const getVictimDemographicsTool = createTool({
  id: "get-victim-demographics",
  description:
    "Get victim demographic breakdowns (sex, race, age) from NIBRS data. Use this to analyze WHO the victims are.",
  inputSchema: z.object({
    stateAbbr: StateAbbrEnum.nullish().describe("Filter by state"),
    ori: z.string().nullish().describe("Filter by agency ORI"),
    fromYear: z.number().int().nullish().describe("Start year"),
    toYear: z.number().int().nullish().describe("End year"),
    offenseCode: UCROffenseCodeEnum.nullish().describe("Filter by offense code"),
    victimType: z.enum(["B", "F", "G", "I", "L", "O", "R", "S", "U"]).nullish().describe("Filter by victim type"),
    groupBy: z.enum(["sex", "race", "ethnicity", "age_group", "victim_type", "sex_race"]).default("sex").describe("How to group demographic results"),
    limit: z.number().nullish().default(100).describe("Maximum results"),
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())),
    total_count: z.number(),
  }),
  execute: async (input) => {
    const conditions: string[] = [];

    if (input.stateAbbr) {
      conditions.push(`ag.state_abbr = '${input.stateAbbr}'`);
    }
    if (input.ori) {
      conditions.push(`v.ori = '${input.ori}'`);
    }
    if (input.fromYear) {
      conditions.push(`v.data_year >= ${input.fromYear}`);
    }
    if (input.toYear) {
      conditions.push(`v.data_year <= ${input.toYear}`);
    }
    if (input.offenseCode) {
      conditions.push(`v.ucr_offense_code1 = '${input.offenseCode}'`);
    }
    if (input.victimType) {
      conditions.push(`v.type_of_victim = '${input.victimType}'`);
    }

    const whereClause = buildWhereClause(conditions);
    const limit = Math.min(input.limit || 100, 1000);

    let selectClause: string;
    let groupByClause: string;

    switch (input.groupBy) {
      case "race":
        selectClause = `
          v.race_of_victim as race,
          CASE v.race_of_victim
            WHEN 'A' THEN 'Asian'
            WHEN 'B' THEN 'Black'
            WHEN 'I' THEN 'American Indian/Alaska Native'
            WHEN 'P' THEN 'Native Hawaiian/Pacific Islander'
            WHEN 'W' THEN 'White'
            ELSE 'Unknown'
          END as race_description,
          COUNT(*) as count
        `;
        groupByClause = "GROUP BY v.race_of_victim";
        break;
      case "ethnicity":
        selectClause = `
          v.ethnicity_of_victim as ethnicity,
          CASE v.ethnicity_of_victim
            WHEN 'H' THEN 'Hispanic or Latino'
            WHEN 'N' THEN 'Not Hispanic or Latino'
            ELSE 'Unknown'
          END as ethnicity_description,
          COUNT(*) as count
        `;
        groupByClause = "GROUP BY v.ethnicity_of_victim";
        break;
      case "age_group":
        selectClause = `
          CASE
            WHEN SAFE_CAST(v.age_of_victim AS INT64) < 18 THEN 'Under 18'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 18 AND 24 THEN '18-24'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 25 AND 34 THEN '25-34'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 35 AND 44 THEN '35-44'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 45 AND 54 THEN '45-54'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 55 AND 64 THEN '55-64'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) >= 65 THEN '65+'
            ELSE 'Unknown'
          END as age_group,
          COUNT(*) as count
        `;
        groupByClause = `GROUP BY
          CASE
            WHEN SAFE_CAST(v.age_of_victim AS INT64) < 18 THEN 'Under 18'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 18 AND 24 THEN '18-24'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 25 AND 34 THEN '25-34'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 35 AND 44 THEN '35-44'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 45 AND 54 THEN '45-54'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) BETWEEN 55 AND 64 THEN '55-64'
            WHEN SAFE_CAST(v.age_of_victim AS INT64) >= 65 THEN '65+'
            ELSE 'Unknown'
          END`;
        break;
      case "victim_type":
        selectClause = `
          v.type_of_victim,
          CASE v.type_of_victim
            WHEN 'B' THEN 'Business'
            WHEN 'F' THEN 'Financial Institution'
            WHEN 'G' THEN 'Government'
            WHEN 'I' THEN 'Individual'
            WHEN 'L' THEN 'Law Enforcement Officer'
            WHEN 'O' THEN 'Other'
            WHEN 'R' THEN 'Religious Organization'
            WHEN 'S' THEN 'Society/Public'
            ELSE 'Unknown'
          END as victim_type_description,
          COUNT(*) as count
        `;
        groupByClause = "GROUP BY v.type_of_victim";
        break;
      case "sex_race":
        selectClause = `
          v.sex_of_victim as sex,
          v.race_of_victim as race,
          COUNT(*) as count
        `;
        groupByClause = "GROUP BY v.sex_of_victim, v.race_of_victim";
        break;
      case "sex":
      default:
        selectClause = `
          v.sex_of_victim as sex,
          CASE v.sex_of_victim
            WHEN 'M' THEN 'Male'
            WHEN 'F' THEN 'Female'
            WHEN 'X' THEN 'Nonbinary'
            ELSE 'Unknown'
          END as sex_description,
          COUNT(*) as count
        `;
        groupByClause = "GROUP BY v.sex_of_victim";
        break;
    }

    const sql = `
      SELECT ${selectClause}
      FROM \`${PROJECT_ID}.${DATASET}.victim_segment\` v
      JOIN \`${PROJECT_ID}.${DATASET}.agencies\` ag ON v.ori = ag.ori
      ${whereClause}
      ${groupByClause}
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    const rows = await runQuery(sql);
    const totalCount = rows.reduce((sum, row) => sum + (Number(row.count) || 0), 0);

    return {
      results: rows,
      total_count: totalCount,
    };
  },
});

// =========================================================================
// CRIME TRENDS TOOL
// =========================================================================

export const getCrimeTrendsTool = createTool({
  id: "get-crime-trends",
  description:
    "Get crime trend data over time. Returns time-series data showing incident counts by year or month.",
  inputSchema: z.object({
    stateAbbr: StateAbbrEnum.nullish().describe("Filter by state"),
    ori: z.string().nullish().describe("Filter by agency ORI"),
    offenseCode: UCROffenseCodeEnum.nullish().describe("Filter by offense code"),
    fromYear: z.number().int().describe("Start year"),
    toYear: z.number().int().describe("End year"),
    granularity: z.enum(["year", "month"]).default("year").describe("Time granularity for trend data"),
  }),
  outputSchema: z.object({
    title: z.string(),
    data: z.array(z.object({
      period: z.string(),
      count: z.number(),
      rate: z.number().nullable().optional(),
    })),
    total_count: z.number(),
  }),
  execute: async (input) => {
    const conditions: string[] = [];

    if (input.stateAbbr) {
      conditions.push(`ag.state_abbr = '${input.stateAbbr}'`);
    }
    if (input.ori) {
      conditions.push(`a.ori = '${input.ori}'`);
    }
    conditions.push(`a.data_year >= ${input.fromYear}`);
    conditions.push(`a.data_year <= ${input.toYear}`);

    if (input.offenseCode) {
      conditions.push(`o.ucr_offense_code = '${input.offenseCode}'`);
    }

    const whereClause = buildWhereClause(conditions);

    let selectClause: string;
    let groupByClause: string;
    let orderByClause: string;

    if (input.granularity === "month") {
      selectClause = `
        FORMAT_DATE('%Y-%m', a.incident_date) as period,
        COUNT(DISTINCT CONCAT(a.ori, '-', a.incident_number)) as count
      `;
      groupByClause = "GROUP BY period";
      orderByClause = "ORDER BY period";
    } else {
      selectClause = `
        CAST(a.data_year AS STRING) as period,
        COUNT(DISTINCT CONCAT(a.ori, '-', a.incident_number)) as count
      `;
      groupByClause = "GROUP BY a.data_year";
      orderByClause = "ORDER BY a.data_year";
    }

    const sql = `
      SELECT ${selectClause}
      FROM \`${PROJECT_ID}.${DATASET}.administrative_segment\` a
      JOIN \`${PROJECT_ID}.${DATASET}.offense_segment\` o
        ON a.ori = o.ori AND a.incident_number = o.incident_number AND a.data_year = o.data_year
      JOIN \`${PROJECT_ID}.${DATASET}.agencies\` ag ON a.ori = ag.ori
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
    `;

    const rows = await runQuery(sql);
    const totalCount = rows.reduce((sum, row) => sum + (Number(row.count) || 0), 0);

    const title = input.offenseCode
      ? `${UCR_OFFENSE_DESCRIPTIONS[input.offenseCode] || input.offenseCode} Trends`
      : "Crime Trends";

    return {
      title,
      data: rows.map((row) => ({
        period: String(row.period),
        count: Number(row.count),
        rate: null,
      })),
      total_count: totalCount,
    };
  },
});

// =========================================================================
// WEAPON ANALYSIS TOOL
// =========================================================================

export const getWeaponAnalysisTool = createTool({
  id: "get-weapon-analysis",
  description:
    "Analyze weapon usage in crimes from NIBRS data. Shows what types of weapons are used in offenses.",
  inputSchema: z.object({
    stateAbbr: StateAbbrEnum.nullish().describe("Filter by state"),
    ori: z.string().nullish().describe("Filter by agency ORI"),
    fromYear: z.number().int().nullish().describe("Start year"),
    toYear: z.number().int().nullish().describe("End year"),
    offenseCode: UCROffenseCodeEnum.nullish().describe("Filter by offense code"),
    groupBy: z.enum(["weapon", "weapon_offense", "weapon_year"]).default("weapon").describe("How to group results"),
    limit: z.number().nullish().default(50).describe("Maximum results"),
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())),
    total_rows: z.number(),
    query_info: z.string().optional(),
  }),
  execute: async (input) => {
    const conditions: string[] = ["o.type_weapon_force_involved1 IS NOT NULL"];

    if (input.stateAbbr) {
      conditions.push(`ag.state_abbr = '${input.stateAbbr}'`);
    }
    if (input.ori) {
      conditions.push(`o.ori = '${input.ori}'`);
    }
    if (input.fromYear) {
      conditions.push(`o.data_year >= ${input.fromYear}`);
    }
    if (input.toYear) {
      conditions.push(`o.data_year <= ${input.toYear}`);
    }
    if (input.offenseCode) {
      conditions.push(`o.ucr_offense_code = '${input.offenseCode}'`);
    }

    const whereClause = buildWhereClause(conditions);
    const limit = Math.min(input.limit || 50, 10000);

    let selectClause: string;
    let groupByClause: string;
    let orderByClause: string;

    switch (input.groupBy) {
      case "weapon_offense":
        selectClause = "o.type_weapon_force_involved1 as weapon_code, o.ucr_offense_code as offense_code, COUNT(*) as count";
        groupByClause = "GROUP BY o.type_weapon_force_involved1, o.ucr_offense_code";
        orderByClause = "ORDER BY count DESC";
        break;
      case "weapon_year":
        selectClause = "o.type_weapon_force_involved1 as weapon_code, o.data_year as year, COUNT(*) as count";
        groupByClause = "GROUP BY o.type_weapon_force_involved1, o.data_year";
        orderByClause = "ORDER BY o.data_year, count DESC";
        break;
      case "weapon":
      default:
        selectClause = "o.type_weapon_force_involved1 as weapon_code, COUNT(*) as count";
        groupByClause = "GROUP BY o.type_weapon_force_involved1";
        orderByClause = "ORDER BY count DESC";
        break;
    }

    const sql = `
      SELECT ${selectClause}
      FROM \`${PROJECT_ID}.${DATASET}.offense_segment\` o
      JOIN \`${PROJECT_ID}.${DATASET}.agencies\` ag ON o.ori = ag.ori
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      LIMIT ${limit}
    `;

    const rows = await runQuery(sql);

    // Add descriptions - weapon codes may be stored as floats (11.0) or strings ('11')
    rows.forEach((row) => {
      if (row.weapon_code !== null && row.weapon_code !== undefined) {
        // Normalize weapon code: handle both float (11.0) and string ('11') formats
        const weaponKey = normalizeCode(row.weapon_code);
        row.weapon_description = WEAPON_DESCRIPTIONS[weaponKey] || "Unknown";
      }
      if (row.offense_code) {
        row.offense_description = UCR_OFFENSE_DESCRIPTIONS[row.offense_code as string] || "Unknown";
      }
    });

    return {
      results: rows,
      total_rows: rows.length,
      query_info: `Grouped by: ${input.groupBy}`,
    };
  },
});

// =========================================================================
// BIAS ANALYSIS (HATE CRIMES) TOOL
// =========================================================================

export const getBiasAnalysisTool = createTool({
  id: "get-bias-analysis",
  description:
    "Analyze hate crime bias motivations from NIBRS data. Shows the distribution of bias motivations (racial, religious, sexual orientation, etc.) in crimes.",
  inputSchema: z.object({
    stateAbbr: StateAbbrEnum.nullish().describe("Filter by state"),
    ori: z.string().nullish().describe("Filter by agency ORI"),
    fromYear: z.number().int().nullish().describe("Start year"),
    toYear: z.number().int().nullish().describe("End year"),
    biasMotivation: z.string().nullish().describe("Filter by specific bias motivation"),
    groupBy: z.enum(["bias", "bias_offense", "bias_year", "bias_state"]).default("bias").describe("How to group results"),
    limit: z.number().nullish().default(50).describe("Maximum results"),
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())),
    total_rows: z.number(),
    query_info: z.string().optional(),
  }),
  execute: async (input) => {
    const conditions: string[] = [
      "o.bias_motivation IS NOT NULL",
      "o.bias_motivation != '88'", // Exclude "None (no bias)"
    ];

    if (input.stateAbbr) {
      conditions.push(`ag.state_abbr = '${input.stateAbbr}'`);
    }
    if (input.ori) {
      conditions.push(`o.ori = '${input.ori}'`);
    }
    if (input.fromYear) {
      conditions.push(`o.data_year >= ${input.fromYear}`);
    }
    if (input.toYear) {
      conditions.push(`o.data_year <= ${input.toYear}`);
    }
    if (input.biasMotivation) {
      conditions.push(`o.bias_motivation = '${input.biasMotivation}'`);
    }

    const whereClause = buildWhereClause(conditions);
    const limit = Math.min(input.limit || 50, 10000);

    let selectClause: string;
    let groupByClause: string;
    let orderByClause: string;

    switch (input.groupBy) {
      case "bias_offense":
        selectClause = "o.bias_motivation, o.ucr_offense_code as offense_code, COUNT(*) as count";
        groupByClause = "GROUP BY o.bias_motivation, o.ucr_offense_code";
        orderByClause = "ORDER BY count DESC";
        break;
      case "bias_year":
        selectClause = "o.bias_motivation, o.data_year as year, COUNT(*) as count";
        groupByClause = "GROUP BY o.bias_motivation, o.data_year";
        orderByClause = "ORDER BY o.data_year, count DESC";
        break;
      case "bias_state":
        selectClause = "o.bias_motivation, ag.state_abbr as state, COUNT(*) as count";
        groupByClause = "GROUP BY o.bias_motivation, ag.state_abbr";
        orderByClause = "ORDER BY count DESC";
        break;
      case "bias":
      default:
        selectClause = "o.bias_motivation, COUNT(*) as count";
        groupByClause = "GROUP BY o.bias_motivation";
        orderByClause = "ORDER BY count DESC";
        break;
    }

    const sql = `
      SELECT ${selectClause}
      FROM \`${PROJECT_ID}.${DATASET}.offense_segment\` o
      JOIN \`${PROJECT_ID}.${DATASET}.agencies\` ag ON o.ori = ag.ori
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      LIMIT ${limit}
    `;

    const rows = await runQuery(sql);

    // Add descriptions
    rows.forEach((row) => {
      if (row.bias_motivation) {
        row.bias_description = BIAS_DESCRIPTIONS[row.bias_motivation as string] || "Unknown";
      }
      if (row.offense_code) {
        row.offense_description = UCR_OFFENSE_DESCRIPTIONS[row.offense_code as string] || "Unknown";
      }
    });

    return {
      results: rows,
      total_rows: rows.length,
      query_info: `Grouped by: ${input.groupBy}`,
    };
  },
});

// =========================================================================
// LOCATION ANALYSIS TOOL
// =========================================================================

export const getLocationAnalysisTool = createTool({
  id: "get-location-analysis",
  description:
    "Analyze where crimes occur by location type from NIBRS data. Shows distribution of offenses across different location types (residence, street, bar, etc.).",
  inputSchema: z.object({
    stateAbbr: StateAbbrEnum.nullish().describe("Filter by state"),
    ori: z.string().nullish().describe("Filter by agency ORI"),
    fromYear: z.number().int().nullish().describe("Start year"),
    toYear: z.number().int().nullish().describe("End year"),
    offenseCode: UCROffenseCodeEnum.nullish().describe("Filter by offense code"),
    groupBy: z.enum(["location", "location_offense", "location_year"]).default("location").describe("How to group results"),
    limit: z.number().nullish().default(50).describe("Maximum results"),
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())),
    total_rows: z.number(),
    query_info: z.string().optional(),
  }),
  execute: async (input) => {
    const conditions: string[] = ["o.location_type IS NOT NULL"];

    if (input.stateAbbr) {
      conditions.push(`ag.state_abbr = '${input.stateAbbr}'`);
    }
    if (input.ori) {
      conditions.push(`o.ori = '${input.ori}'`);
    }
    if (input.fromYear) {
      conditions.push(`o.data_year >= ${input.fromYear}`);
    }
    if (input.toYear) {
      conditions.push(`o.data_year <= ${input.toYear}`);
    }
    if (input.offenseCode) {
      conditions.push(`o.ucr_offense_code = '${input.offenseCode}'`);
    }

    const whereClause = buildWhereClause(conditions);
    const limit = Math.min(input.limit || 50, 10000);

    let selectClause: string;
    let groupByClause: string;
    let orderByClause: string;

    switch (input.groupBy) {
      case "location_offense":
        selectClause = "o.location_type, o.ucr_offense_code as offense_code, COUNT(*) as count";
        groupByClause = "GROUP BY o.location_type, o.ucr_offense_code";
        orderByClause = "ORDER BY count DESC";
        break;
      case "location_year":
        selectClause = "o.location_type, o.data_year as year, COUNT(*) as count";
        groupByClause = "GROUP BY o.location_type, o.data_year";
        orderByClause = "ORDER BY o.data_year, count DESC";
        break;
      case "location":
      default:
        selectClause = "o.location_type, COUNT(*) as count";
        groupByClause = "GROUP BY o.location_type";
        orderByClause = "ORDER BY count DESC";
        break;
    }

    const sql = `
      SELECT ${selectClause}
      FROM \`${PROJECT_ID}.${DATASET}.offense_segment\` o
      JOIN \`${PROJECT_ID}.${DATASET}.agencies\` ag ON o.ori = ag.ori
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      LIMIT ${limit}
    `;

    const rows = await runQuery(sql);

    // Add descriptions
    rows.forEach((row) => {
      if (row.location_type) {
        row.location_description = LOCATION_TYPE_DESCRIPTIONS[row.location_type as string] || "Unknown";
      }
      if (row.offense_code) {
        row.offense_description = UCR_OFFENSE_DESCRIPTIONS[row.offense_code as string] || "Unknown";
      }
    });

    return {
      results: rows,
      total_rows: rows.length,
      query_info: `Grouped by: ${input.groupBy}`,
    };
  },
});

// =========================================================================
// CUSTOM QUERY TOOL
// =========================================================================

export const executeCustomQueryTool = createTool({
  id: "execute-custom-query",
  description: `Execute a custom SQL query against the NIBRS BigQuery tables. Use for complex queries not covered by other tools. MUST be SELECT only.

**TABLES & KEY COLUMNS:**

**agencies** (~19,500 rows)
- ori (STRING PK) - 9-char agency ID like 'CA0010100'
- agency_name, agency_type_name, state_abbr, state_name, counties
- is_nibrs (BOOL), nibrs_start_date (DATE)

**administrative_segment** (~10M/year) - One row per incident
- ori, incident_number (unique combo = incident ID)
- incident_date (DATE), incident_date_hour (INT64 0-23), data_year (INT64)
- total_offense_segments, total_victim_segments, total_offender_segments, total_arrestee_segments (INT64)
- cleared_exceptionally: 'A'=Death of Offender, 'B'=Prosecution Declined, 'N'=Not Applicable

**offense_segment** (~12M/year) - One row per offense
- ori, incident_number, incident_date, data_year
- ucr_offense_code (STRING): '09A'=Murder, '11A'=Rape, '120'=Robbery, '13A'=Aggravated Assault, '13B'=Simple Assault, '220'=Burglary, '23H'=Larceny, '240'=Motor Vehicle Theft, '290'=Vandalism, '35A'=Drugs, '520'=Weapons
- offense_attempted_or_completed: 'A'=Attempted, 'C'=Completed
- location_type (STRING): '20'=Residence, '13'=Street, '07'=Convenience Store, '18'=Parking, '22'=School
- bias_motivation (STRING): '88'=None, '12'=Anti-Black, '21'=Anti-Jewish, '14'=Anti-Asian, '32'=Anti-Hispanic, '41'=Anti-Gay Male, '43'=Anti-LGBTQ
- type_weapon_force_involved1: '11'=Firearm, '12'=Handgun, '13'=Rifle, '20'=Knife, '40'=Personal Weapons, '99'=None

**victim_segment** (~12M/year) - One row per victim
- ori, incident_number, incident_date, data_year, victim_sequence_number
- type_of_victim: 'I'=Individual, 'B'=Business, 'L'=Law Enforcement, 'G'=Government
- age_of_victim (STRING '01'-'99', 'NB'=Newborn), sex_of_victim ('M','F','U'), race_of_victim ('W','B','A','I','P')
- ethnicity_of_victim: 'H'=Hispanic, 'N'=Not Hispanic
- ucr_offense_code1 through ucr_offense_code10 (STRING)

**arrestee_segment** (~3.3M/year)
- ori, incident_number, incident_date, data_year, arrest_date
- ucr_arrest_offense_code, type_of_arrest: 'O'=On-View, 'S'=Summoned, 'T'=Taken Into Custody
- age_of_arrestee, sex_of_arrestee, race_of_arrestee, ethnicity_of_arrestee

**JOIN PATTERN:**
FROM administrative_segment a
JOIN offense_segment o ON a.ori = o.ori AND a.incident_number = o.incident_number
JOIN agencies ag ON a.ori = ag.ori
WHERE a.data_year = 2024

**COUNT DISTINCT INCIDENTS:** COUNT(DISTINCT CONCAT(ori, '-', incident_number))

**HATE CRIMES:** WHERE bias_motivation != '88' (exclude 'None')`,
  inputSchema: z.object({
    sql: z.string().describe("Custom SQL query to execute. Must be SELECT only. Do NOT wrap table names in backticks."),
    limit: z.number().nullish().default(1000).describe("Maximum rows to return (capped at 10000)"),
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.string(), z.unknown())),
    row_count: z.number(),
    columns: z.array(z.string()),
    truncated: z.boolean(),
  }),
  execute: async (input) => {
    // Security: Only allow SELECT queries
    const sqlTrimmed = input.sql.trim().toUpperCase();
    if (!sqlTrimmed.startsWith("SELECT")) {
      throw new Error("Only SELECT queries are allowed. Query must start with SELECT.");
    }

    // Check for dangerous keywords
    const dangerousKeywords = [
      "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "GRANT", "REVOKE",
    ];
    for (const keyword of dangerousKeywords) {
      if (sqlTrimmed.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}. Only SELECT queries are allowed.`);
      }
    }

    // Replace table references with fully qualified names if not already qualified
    let sql = input.sql;
    const tables = ["agencies", "administrative_segment", "offense_segment", "victim_segment", "arrestee_segment"];
    for (const table of tables) {
      // First, remove any existing backticks around the table name to normalize
      const backtickRegex = new RegExp(`\`${table}\``, "gi");
      sql = sql.replace(backtickRegex, table);
      
      // Then replace unqualified table names with fully qualified names
      // Match table name that is NOT preceded by a dot or already qualified
      const regex = new RegExp(`(?<![.\`])\\b${table}\\b(?!\`)`, "gi");
      sql = sql.replace(regex, `\`${PROJECT_ID}.${DATASET}.${table}\``);
    }

    // Enforce limit
    const maxLimit = Math.min(input.limit || 1000, 10000);
    if (!sql.toUpperCase().includes("LIMIT")) {
      sql = `${sql} LIMIT ${maxLimit}`;
    }

    const rows = await runQuery(sql);

    // Get column names from first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      results: rows,
      row_count: rows.length,
      columns,
      truncated: rows.length >= maxLimit,
    };
  },
});

// Export all tools
export const nibrsTools = {
  searchAgenciesTool,
  getIncidentCountsTool,
  getOffenseSummaryTool,
  getVictimDemographicsTool,
  getCrimeTrendsTool,
  getWeaponAnalysisTool,
  getBiasAnalysisTool,
  getLocationAnalysisTool,
  executeCustomQueryTool,
};
