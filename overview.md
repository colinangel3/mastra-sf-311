# NIBRS Crime Data Agent - Codebase Overview

## What Is This?

This is an **AI-powered crime data analyst** that can answer questions about crime statistics across the United States. It's built with the [Mastra](https://mastra.ai) framework and has access to the FBI's NIBRS (National Incident-Based Reporting System) database containing over 65 million crime incident records from 2020-2025.

**In simple terms**: You ask questions like "What are the most common crimes in California?" or "Compare homicide rates between New York and Texas", and the AI agent queries a massive crime database to give you detailed, accurate answers with statistics and insights.

**Built with**:

- **Mastra Framework**: TypeScript framework for building AI agents
- **Google BigQuery**: Cloud data warehouse hosting the NIBRS dataset
- **Cerebras AI**: Fast LLM for processing queries and generating responses

**Project Status**: Recently migrated from Daemo (Rust-based system) to Mastra (TypeScript framework) on the `mastra-migration` branch.

---

## Key Concepts

### NIBRS Database

The **National Incident-Based Reporting System** is the FBI's crime reporting system. It contains detailed information about:

- **~10 million crime incidents per year** (2020-2025)
- **~19,500 law enforcement agencies** across all 50 states
- Offense details, victim demographics, weapons used, locations, and more

### Mastra Framework

An open-source TypeScript framework for building AI agents that can use "tools" (functions) to perform tasks. Think of it like giving an AI assistant a toolbox of specialized functions it can use to answer your questions.

### The Agent

The NIBRS Crime Data Agent is an AI system configured with:

- A detailed understanding of the NIBRS database schema
- 9 specialized tools for querying crime data
- Instructions on how to analyze and present crime statistics
- Cerebras Llama 3.3 70B as the language model

### The Tools

9 specialized functions that the agent can use:

1. **search-agencies** - Find law enforcement agencies
2. **get-incident-counts** - Count crimes by location/type/year
3. **get-offense-summary** - Analyze offenses by various dimensions
4. **get-victim-demographics** - Victim age/sex/race breakdowns
5. **get-crime-trends** - Time-series data (monthly/yearly)
6. **get-weapon-analysis** - Analyze weapon usage patterns
7. **get-bias-analysis** - Hate crime statistics
8. **get-location-analysis** - Where crimes occur
9. **execute-custom-query** - Run custom SQL queries

---

## Architecture Overview

```
┌──────────────┐
│  User Query  │ "What are the most common crimes in California?"
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│   Mastra Agent (Cerebras AI)            │
│   - Understands the question            │
│   - Decides which tools to use          │
│   - Formats the response                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│   9 Specialized Tools                   │
│   - search-agencies                     │
│   - get-incident-counts                 │
│   - get-offense-summary                 │
│   - ... and 6 more                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│   Google BigQuery                       │
│   FBI NIBRS Database                    │
│   - 65M+ crime incident records         │
│   - 2020-2025 data                      │
│   - 5 main tables                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│   Response to User                      │
│   - Markdown tables                     │
│   - Statistics & insights               │
│   - Caveats & notes                     │
└─────────────────────────────────────────┘
```

### Project Structure

```
mastra-sf-311/
├── src/mastra/                 # Source code (TypeScript)
│   ├── agents/
│   │   └── nibrs-agent.ts      # Agent configuration & system prompt (173 lines)
│   ├── tools/
│   │   └── nibrs-tools.ts      # 9 BigQuery tools (1,319 lines)
│   └── index.ts                # Mastra instance initialization
│
├── .mastra/                    # Build output (generated)
│   └── output/
│       ├── index.mjs           # Main server entry point (~52K lines)
│       ├── studio/             # Mastra Studio web UI (596 files)
│       └── tools/              # Compiled tool bundles
│
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript configuration
├── .env                        # API keys & credentials (you create this)
│
├── ask.sh                      # CLI client script
├── add-gcp-key.sh              # GCP credential setup helper
├── dump_code.sh                # Code aggregation utility
│
└── README.md                   # Setup & usage guide
```

---

## The 9 Crime Data Tools

Each tool is a specialized function that queries the NIBRS database in BigQuery:

| Tool                        | What It Does                                              | Example Use Case                                    |
| --------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| **search-agencies**         | Find law enforcement agencies by state, county, or name   | "Find all police departments in Los Angeles County" |
| **get-incident-counts**     | Count crime incidents, group by state/year/agency/offense | "How many murders in Texas in 2024?"                |
| **get-offense-summary**     | Analyze offenses by type, location, weapon, or bias       | "What types of weapons are used in robberies?"      |
| **get-victim-demographics** | Breakdown victims by age, sex, race, ethnicity            | "What percentage of assault victims are male?"      |
| **get-crime-trends**        | Time-series crime data by year or month                   | "Show motor vehicle theft trends from 2020-2025"    |
| **get-weapon-analysis**     | Analyze weapon usage in crimes                            | "What weapons are most common in violent crimes?"   |
| **get-bias-analysis**       | Hate crime statistics by bias motivation                  | "Show hate crimes by bias type in California"       |
| **get-location-analysis**   | Crime distribution by location type                       | "Where do most burglaries occur?"                   |
| **execute-custom-query**    | Run custom SQL queries (SELECT only)                      | Complex custom analysis                             |

**Note**: The agent automatically chooses which tools to use based on your question. You don't need to know which tool does what.

---

## Data Coverage

### Time Range

**2020-2025** (6 years of crime data)

### Geographic Scope

- **~19,500 law enforcement agencies** across the United States
- All 50 states + DC + territories
- City police, county sheriffs, state police, university police, tribal police

### Data Volume

- **~10 million incidents per year**
- **~65 million+ total incidents** across all years
- **~12 million offenses per year** (one incident can have multiple offenses)
- **~12 million victims per year**
- **~3.3 million arrestees per year**

### Database Tables

| Table                      | Records    | Description                                                |
| -------------------------- | ---------- | ---------------------------------------------------------- |
| **agencies**               | ~19,500    | Law enforcement agency metadata (names, locations, ORIs)   |
| **administrative_segment** | ~10M/year  | One row per incident (incident-level data)                 |
| **offense_segment**        | ~12M/year  | One row per offense (crime details, weapons, locations)    |
| **victim_segment**         | ~12M/year  | One row per victim (demographics, injuries, relationships) |
| **arrestee_segment**       | ~3.3M/year | One row per arrestee (arrest details, demographics)        |

---

## How It Works

Let's walk through what happens when you ask a question:

### Example: "What are the most common crimes in California?"

**Step 1: User asks the question**

- Via Mastra Studio web UI, REST API, or CLI script

**Step 2: Cerebras AI processes the query**

- The agent reads your question
- Understands you want offense counts for California
- Decides to use the `get-incident-counts` tool

**Step 3: Tool executes SQL query**

```sql
SELECT
  offense_code,
  COUNT(*) as offense_count
FROM offense_segment o
JOIN agencies ag ON o.ori = ag.ori
WHERE ag.state_abbr = 'CA'
  AND o.data_year = 2025
GROUP BY offense_code
ORDER BY offense_count DESC
LIMIT 100
```

**Step 4: BigQuery returns results**

```json
{
  "results": [
    {"offense_code": "13B", "offense_count": 245000, "offense_description": "Simple Assault"},
    {"offense_code": "23H", "offense_count": 198000, "offense_description": "All Other Larceny"},
    ...
  ]
}
```

**Step 5: Agent formats the response**

- Converts offense codes to human-readable descriptions
- Creates markdown tables
- Adds insights and caveats
- Returns to the user

**Step 6: User receives the answer**

```markdown
## Most Common Crimes in California (2025)

| Rank | Offense                      | Count   |
| ---- | ---------------------------- | ------- |
| 1    | Simple Assault               | 245,000 |
| 2    | All Other Larceny            | 198,000 |
| 3    | Destruction/Damage/Vandalism | 175,000 |

...

_Note: Data reflects NIBRS-participating agencies for 2025_
```

---

## How to Use It

### Three Ways to Interact

#### 1. **Mastra Studio** (Web UI) - Easiest

```bash
npm run dev
```

Then open `http://localhost:4111/` in your browser. You'll see a chat interface where you can:

- Select the "nibrs-crime-agent"
- Type your questions in plain English
- Get formatted responses with tables and insights

#### 2. **REST API** - For Integration

```bash
# Start the server
npm run dev

# Stream a response
curl -X POST http://localhost:4111/api/agents/nibrs-crime-agent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What are the most common crimes in California?"}],
    "maxSteps": 10
  }'

# Generate a complete response
curl -X POST http://localhost:4111/api/agents/nibrs-crime-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Compare homicide rates in Texas vs New York"}]
  }'
```

#### 3. **CLI Script** - For Quick Queries

```bash
./ask.sh "What are the most common crimes in California?"
./ask.sh "Compare crime in New York and Texas" 8000 admin true false
```

**Parameters**:

- Param 1: Your question (required)
- Param 2: Max tokens (optional, default: 65536)
- Param 3: Role (optional)
- Param 4: Analysis mode (optional, default: true)
- Param 5: Direct mode (optional, default: false)

---

## Setup Requirements

### Prerequisites

- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **Google Cloud service account** with BigQuery access
- **Cerebras API key** ([get one here](https://cloud.cerebras.ai/))

### Installation Steps

1. **Install dependencies**:

```bash
npm install
```

2. **Configure credentials**:
   Create a `.env` file (copy from `env.example`):

```bash
# Google BigQuery credentials (JSON string)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project",...}

# Cerebras API key
CEREBRAS_API_KEY=your_cerebras_api_key

# Server port (optional, default: 4111)
PORT=4111
```

**Tip**: Use the helper script to add your GCP credentials:

```bash
./add-gcp-key.sh /path/to/your-service-account-key.json
```

3. **Run the agent**:

```bash
# Development mode (with auto-reload)
npm run dev

# Production build
npm run build
npm start
```

---

## Project Files Explained

### Configuration Files

- **`package.json`**: Dependencies (Mastra, BigQuery client, Zod for validation)
- **`tsconfig.json`**: TypeScript compiler settings (ES2022, bundler module resolution)
- **`.env`**: API keys and credentials (you create this from `env.example`)

### Shell Scripts

- **`ask.sh`**: CLI client for querying the agent via HTTP
- **`add-gcp-key.sh`**: Helper script to add Google Cloud credentials to `.env`
- **`dump_code.sh`**: Utility to aggregate source code into a single file for documentation

### Documentation Files

- **`README.md`**: Main setup and usage guide (171 lines)
- **`dodge_garden_comparison.md`**: Example query logs comparing Dodge City vs Garden City, Kansas
- **`query_benchmarking.txt`**: Performance benchmarks and test queries (460 lines)
- **`bogus_responses.txt`**: Known issues and edge case test results

### Source Code

- **`src/mastra/agents/nibrs-agent.ts`**:
  - Agent configuration
  - 164-line system prompt with database schema, offense codes, bias codes, location codes
  - Behavioral instructions (default to 2025 data, be proactive, format responses)
- **`src/mastra/tools/nibrs-tools.ts`**:
  - 9 tool implementations (1,319 lines)
  - BigQuery client setup
  - SQL query builders
  - Response formatters with human-readable descriptions

- **`src/mastra/index.ts`**:
  - Mastra instance initialization
  - LibSQL storage configuration
  - Agent registration

### Build Output

- **`.mastra/output/`**: Compiled JavaScript (generated by `mastra build`)
  - `index.mjs`: Main server entry point (~52K lines, bundled)
  - `studio/`: Mastra Studio web UI (596 files)
  - `tools/`: Compiled tool bundles

---

## Migration Context

### Previous System: Daemo

This project was originally built with **Daemo**, a Rust-based agent engine with:

- Separate Rust engine process (`daemo-engine`)
- Gateway service on `localhost:50052`
- JavaScript runtime executing code calling `daemo.nibrs_crime_service.*` functions
- Client-server architecture

### Current System: Mastra

Now rebuilt with **Mastra**, a TypeScript framework providing:

- Integrated agent framework (no separate engine)
- All-TypeScript codebase (easier to maintain)
- Built-in Mastra Studio UI
- Better developer experience with hot reload

### Migration Status

✅ **Core functionality complete**:

- All 9 tools implemented and working
- Agent configuration migrated
- BigQuery integration functional
- REST API operational

⚠️ **Cleanup pending**:

- `env.example` still references `DAEMO_AGENT_API_KEY` and `DAEMO_GATEWAY_URL`
- Benchmark files contain old Daemo engine logs
- BigQuery project ID still uses `"daemo-daemon-testing"`

**Git Branch**: `mastra-migration` (1 untracked file: `overview.md`)

---

## Example Queries

Here are real questions you can ask the agent:

### Geographic Comparisons

- "What are the most common crimes in California?"
- "Compare crime rates between New York and Texas"
- "Compare the most common crimes in Dodge City vs Garden City, Kansas"

### Crime Type Analysis

- "How many murders occurred in Texas in 2024?"
- "What are the most common types of theft?"
- "Show me drug violation statistics by state"

### Trends Over Time

- "What's the trend in motor vehicle theft from 2020-2025?"
- "Has violent crime increased or decreased nationally?"
- "Show monthly crime patterns for robbery in Chicago"

### Demographic Analysis

- "What percentage of assault victims are male?"
- "Show me victim demographics for hate crimes"
- "What's the age distribution of robbery victims?"

### Weapon & Location Analysis

- "What types of weapons are most commonly used in robberies?"
- "Where do most burglaries occur (by location type)?"
- "What percentage of assaults involve firearms?"

### Hate Crimes

- "Show me hate crime statistics by bias motivation"
- "What are the most common bias types for hate crimes in California?"
- "Compare anti-religious vs anti-racial hate crimes"

### Agency-Specific

- "Find police departments in Los Angeles County"
- "What are the most common crimes reported by LAPD?"
- "List all NIBRS-participating agencies in Kansas"

---

## Technical Details

### Database Schema Highlights

#### Key Offense Codes (ucr_offense_code)

| Code | Description                          |
| ---- | ------------------------------------ |
| 09A  | Murder and Nonnegligent Manslaughter |
| 11A  | Rape                                 |
| 120  | Robbery                              |
| 13A  | Aggravated Assault                   |
| 13B  | Simple Assault                       |
| 220  | Burglary/Breaking & Entering         |
| 23H  | All Other Larceny                    |
| 240  | Motor Vehicle Theft                  |
| 290  | Destruction/Damage/Vandalism         |
| 35A  | Drug/Narcotic Violations             |
| 520  | Weapon Law Violations                |

#### Bias Motivation Codes (hate crimes)

| Code | Description                                         |
| ---- | --------------------------------------------------- |
| 88   | None (no bias) - **exclude for hate crime queries** |
| 12   | Anti-Black or African American                      |
| 21   | Anti-Jewish                                         |
| 14   | Anti-Asian                                          |
| 32   | Anti-Hispanic or Latino                             |
| 41   | Anti-Gay (Male)                                     |
| 43   | Anti-LGBTQ                                          |

#### Location Type Codes

| Code | Description         |
| ---- | ------------------- |
| 20   | Residence/Home      |
| 13   | Highway/Road/Street |
| 18   | Parking Lot/Garage  |
| 07   | Convenience Store   |
| 22   | School/College      |
| 03   | Bar/Nightclub       |

#### Weapon Codes (type_weapon_force_involved1)

| Code | Description                           |
| ---- | ------------------------------------- |
| 11   | Firearm (type unknown)                |
| 12   | Handgun                               |
| 20   | Knife/Cutting Instrument              |
| 30   | Blunt Object                          |
| 40   | Personal Weapons (hands, fists, feet) |
| 99   | None                                  |

### AI Configuration

**Language Model**:

- **Model**: Cerebras Llama 3.3 70B (`cerebras/llama-3.3-70b`)
- **Provider**: Cerebras Cloud
- **Speed**: Extremely fast inference (Cerebras WSE-3 chip)

**System Prompt**: 164 lines defining:

- Complete database schema with field descriptions
- All offense/bias/location/weapon codes
- **Default time period**: 2025 (most recent complete year)
- Behavioral guidelines: Be proactive, fetch all needed data, present complete answers
- Response format: Markdown tables, plain language (no code blocks for end users)

**Response Guidelines**:

- Always use 2025 data unless user specifies otherwise
- Present data in markdown tables
- Include caveats about NIBRS voluntary reporting
- Suggest related queries user might want
- Never show technical implementation details to end users

### BigQuery Project

- **Project ID**: `daemo-daemon-testing`
- **Dataset**: `nibrs_data`
- **Tables**: `agencies`, `administrative_segment`, `offense_segment`, `victim_segment`, `arrestee_segment`
- **Region**: US (multi-region)

---

## Build & Deployment

### Development Mode

```bash
npm run dev
```

- Starts Mastra dev server with hot reload
- Watches source files for changes
- Rebuilds automatically
- **Mastra Studio**: `http://localhost:4111/`
- **API**: `http://localhost:4111/api/`

### Production Build

```bash
# Build the application
npm run build

# Run the built application
npm start
```

- Compiles TypeScript to JavaScript
- Bundles dependencies
- Generates `.mastra/output/` directory
- Runs `node .mastra/output/index.mjs`

### Storage

- **Database**: LibSQL (embedded SQLite)
- **Location**: `./mastra.db`
- **Purpose**: Stores conversation history, agent state, tool executions

### Build Process

1. `mastra build` reads `src/mastra/` (TypeScript source)
2. Compiles to ES modules (`.mjs` files)
3. Bundles Mastra dependencies (`@mastra/core`, `@mastra/libsql`)
4. Code-splits into chunks for optimization
5. Bundles tools separately (`tools/29da423f-*.mjs`)
6. Includes Mastra Studio UI assets (596 files)
7. Outputs to `.mastra/output/index.mjs` (main entry point)

---

## Data Caveats

### NIBRS Reporting

- **Voluntary**: Not all agencies participate in NIBRS
- **Coverage varies**: Some states have better participation than others
- **Recent adoption**: Some agencies only started reporting recently
- **Incomplete**: Does not represent 100% of US crime

### Statistical Reliability

- **Small numbers**: Counts <30 may not be statistically reliable
- **Population differences**: Raw counts don't account for population size
- **Reporting differences**: Agencies may categorize crimes differently
- **Time lag**: Most recent year may not be complete

### Per-Capita Rates

The database does not include population data. To calculate per-capita rates:

- You need to obtain population data separately
- Divide incident counts by population × 100,000
- Example: 500 incidents in a city of 100,000 = 500 per 100K rate

---

## Common Issues & Solutions

### Issue: BigQuery Query Failed

**Error**: `BigQuery query failed: Access Denied`
**Solution**:

- Verify your GCP service account has BigQuery Data Viewer role
- Check that credentials JSON is correctly formatted in `.env`
- Use `./add-gcp-key.sh` to ensure proper formatting

### Issue: No Data Returned

**Error**: Tool returns empty results
**Solution**:

- Verify the agency/state/year exists in the database
- Check that agency participates in NIBRS (`nibrs_only: true`)
- Try a broader query (e.g., state-level instead of agency-level)

### Issue: Model Response Timeout

**Error**: Request takes too long
**Solution**:

- Reduce the time range (query 1 year instead of 5)
- Use `maxSteps` parameter to limit tool executions
- Try a more specific query to reduce data processing

### Issue: Environment Variables Not Loaded

**Error**: `CEREBRAS_API_KEY is not defined`
**Solution**:

- Ensure `.env` file exists in project root
- Check `.env` file is properly formatted (no spaces around `=`)
- Restart the server after modifying `.env`

---

## What's Next?

### Potential Enhancements

- Add population data for per-capita rate calculations
- Support for custom date ranges (not just years)
- Export results to CSV/Excel
- Visualization charts and graphs
- Email/Slack notifications for specific crime patterns
- Comparison with historical averages
- Geographic heat maps

### Known Limitations

- Cannot query non-NIBRS agencies
- No real-time data (data updated periodically)
- Limited to 2020-2025 timeframe
- No access to offender demographics (privacy restrictions)
- Custom queries limited to SELECT statements only

---

## Getting Help

### Documentation

- **Mastra Docs**: https://mastra.ai/docs
- **NIBRS Documentation**: FBI NIBRS User Manual
- **BigQuery Docs**: https://cloud.google.com/bigquery/docs

### Support

- Check `README.md` for setup instructions
- Review `query_benchmarking.txt` for example queries
- Look at `dodge_garden_comparison.md` for real query examples
- Read logs in terminal for debugging information

### Contributing

This is an active migration project. Areas that need attention:

- Complete migration cleanup (remove Daemo references)
- Add unit tests for tools
- Improve error handling
- Add more comprehensive documentation
- Optimize BigQuery queries for performance

---

## Summary

This is a powerful AI system for analyzing FBI crime data. It combines:

- **65M+ crime records** from NIBRS database
- **9 specialized tools** for different types of analysis
- **Fast AI model** (Cerebras) for natural language interaction
- **Easy interfaces** (Web UI, API, CLI)

You can ask questions in plain English and get detailed crime statistics, trends, and insights backed by official FBI data. The system handles the complexity of SQL queries, data joins, and formatting automatically.

**Project Status**: Functionally complete and operational, with minor migration cleanup pending.

---

_Last Updated: 2026-02-02_
_Branch: mastra-migration_
_Version: 1.0.0_
