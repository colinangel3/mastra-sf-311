# NIBRS Crime Data Agent (Mastra)

An AI-powered crime data analyst with access to the FBI NIBRS (National Incident-Based Reporting System) database via Google BigQuery. Built with [Mastra](https://mastra.ai).

## 🚀 Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- Google Cloud service account with BigQuery access
- Cerebras API key

### 2. Installation

Install dependencies:

```bash
npm install
```

### 3. Configuration

Create a `.env` file with your credentials:

```bash
# Google BigQuery Credentials (JSON string)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project",...}

# Cerebras API Key (https://cloud.cerebras.ai/)
CEREBRAS_API_KEY=your_cerebras_api_key

# Optional: Server port (default 4111)
PORT=4111
```

### 4. Running the Agent

Start the Mastra development server:

```bash
npm run dev
```

This starts:
- **Mastra Studio** at `http://localhost:4111/` - Interactive UI for testing
- **Custom Frontend** at `http://localhost:4111/public/` - Simple query interface
- **REST API** at `http://localhost:4111/api/` - Programmatic access
- **Swagger UI** at `http://localhost:4111/swagger-ui` - API documentation

## 📡 Usage

### Using Mastra Studio

Navigate to `http://localhost:4111/` to access Mastra Studio. Select the **nibrs-crime-agent** from the agents list and start chatting.

### Using the Custom Frontend

Navigate to `http://localhost:4111/public/` for a streamlined chat interface designed for crime data queries.

### Using the REST API

```bash
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

## 📂 Project Structure

```
src/
├── mastra/
│   ├── agents/
│   │   └── nibrs-agent.ts      # Agent definition with system prompt
│   ├── tools/
│   │   └── nibrs-tools.ts      # BigQuery tools for crime data
│   ├── public/
│   │   └── index.html          # Simple chat frontend
│   └── index.ts                # Mastra instance configuration
├── package.json
└── tsconfig.json
```

## 🛠 Available Tools

The agent has access to these NIBRS data tools:

| Tool | Description |
|------|-------------|
| `search-agencies` | Find law enforcement agencies by state, county, or name |
| `get-incident-counts` | Get crime incident counts grouped by state, year, agency, or offense |
| `get-offense-summary` | Analyze offenses by type, location, weapon, or bias |
| `get-victim-demographics` | Breakdown of victim demographics (age, sex, race) |
| `get-crime-trends` | Time-series crime data by year or month |
| `get-weapon-analysis` | Analyze weapon usage in crimes |
| `get-bias-analysis` | Hate crime statistics by bias motivation |
| `get-location-analysis` | Crime distribution by location type |
| `execute-custom-query` | Run custom SQL queries (SELECT only) |

## 📊 Data Coverage

- **Time Range**: 2020-2025
- **Records**: 65+ million incidents
- **Agencies**: ~23,000+ law enforcement agencies
- **Tables**: agencies, administrative_segment, offense_segment, victim_segment, arrestee_segment

## Example Queries

- "What are the most common crimes in California?"
- "Compare homicide rates between New York and Texas"
- "What types of weapons are most commonly used in robberies?"
- "Show me hate crime statistics by bias motivation"
- "What's the trend in motor vehicle theft from 2020-2025?"
- "Where do most burglaries occur (by location type)?"

## 🤖 Model Configuration

The agent uses **Cerebras Llama 3.3 70B** (`cerebras/llama-3.3-70b`).

To change the model, edit `src/mastra/agents/nibrs-agent.ts`:

```typescript
export const nibrsAgent = new Agent({
  // ...
  model: "openai/gpt-4o",  // Or any supported model
});
```

Mastra supports 600+ models from OpenAI, Anthropic, Google, and more.

---

Built with [Mastra](https://mastra.ai) • Crime data from FBI NIBRS
