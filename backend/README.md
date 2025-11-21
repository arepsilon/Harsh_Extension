# Tableau Extension Backend

Backend service for Tableau Extension using VizQL Data Service API.

## Architecture

This backend replaces client-side data fetching with a server-side approach that:

1. Downloads Tableau workbooks from Tableau Server
2. Extracts and parses workbook XML
3. Builds VizQL Data Service queries based on frontend configuration
4. Executes multiple queries (main data + row/column totals + subtotals)
5. Aggregates and returns data to frontend

## Tech Stack

- **Node.js** + **TypeScript**
- **Express** - Web framework
- **Axios** - HTTP client for Tableau APIs
- **fast-xml-parser** - XML parsing
- **JSZip** - Workbook extraction

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure PAT Authentication

Create `pat_config.json` in the backend root directory:

```json
{
  "serverUrl": "https://your-tableau-server.com",
  "tokenName": "your-pat-token-name",
  "tokenValue": "your-pat-secret-value",
  "siteId": "your-site-id"
}
```

**How to create a PAT:**
1. Log into Tableau Server
2. Go to Settings > Personal Access Tokens
3. Create new token
4. Copy token name and secret (save the secret - it's only shown once!)

### 3. Environment Variables

Create `.env` file (optional):

```
PORT=3001
TABLEAU_SERVER_URL=https://your-tableau-server.com
NODE_ENV=development
```

### 4. Run the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /
GET /api/health
```

### Get Workbook Metadata
Downloads workbook, extracts XML, and returns worksheet configurations.

```
POST /api/workbook/metadata
Content-Type: application/json

{
  "workbookId": "workbook-luid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "datasourceLuid": "datasource-123",
    "worksheets": {
      "Sheet1": {
        "name": "Sheet1",
        "rows": ["Region", "Category"],
        "columns": ["Year"],
        "values": [
          { "field": "Sales", "aggregation": "SUM" }
        ],
        "calculatedFields": [],
        "filters": []
      }
    }
  }
}
```

### Get Datasource Metadata
Returns field information (names, types, aggregations).

```
POST /api/datasource/metadata
Content-Type: application/json

{
  "datasourceLuid": "datasource-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "fieldName": "Sales",
        "fieldCaption": "Sales",
        "dataType": "REAL",
        "defaultAggregation": "SUM"
      }
    ]
  }
}
```

### Query Pivot Data
Main endpoint - executes queries and returns aggregated data.

```
POST /api/query/pivot
Content-Type: application/json

{
  "workbookId": "workbook-123",
  "worksheetName": "Sales Dashboard",
  "datasourceLuid": "datasource-123",
  "rows": ["Region", "Category"],
  "columns": ["Year"],
  "values": [
    { "field": "Sales", "aggregation": "SUM" },
    { "field": "Profit", "aggregation": "SUM" }
  ],
  "filters": [],
  "showRowGrandTotals": true,
  "showColumnGrandTotals": true,
  "showSubtotals": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      { "Region": "East", "Category": "Furniture", "Year": 2024, "Sales": 1500.50, "Profit": 300.10 }
    ],
    "totals": {
      "rowGrandTotals": [...],
      "columnGrandTotals": [...],
      "subtotals": []
    },
    "metadata": {
      "rowCount": 150,
      "columnCount": 5,
      "fields": [...]
    }
  }
}
```

### Execute Custom Query
For advanced use cases.

```
POST /api/query/custom
Content-Type: application/json

{
  "datasourceLuid": "datasource-123",
  "query": {
    "fields": [
      { "fieldCaption": "Category" },
      { "fieldCaption": "Sales", "function": "SUM" }
    ],
    "filters": []
  },
  "options": {
    "returnFormat": "OBJECTS"
  }
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── tableau.config.ts       # PAT configuration loader
│   ├── services/
│   │   ├── auth.service.ts         # Tableau Server authentication
│   │   ├── workbook.service.ts     # Workbook download & extraction
│   │   ├── xml.parser.service.ts   # XML parsing
│   │   ├── vizql.service.ts        # VizQL query builder & executor
│   │   └── data.aggregator.service.ts  # Data aggregation
│   ├── routes/
│   │   └── data.routes.ts          # API routes
│   ├── types/
│   │   └── vizql.types.ts          # TypeScript type definitions
│   └── server.ts                   # Express server
├── pat_config.json                 # PAT credentials (gitignored)
├── package.json
└── tsconfig.json
```

## VizQL Data Service

This backend uses Tableau's VizQL Data Service API, which provides:

- **Metadata queries** - Field information
- **Data queries** - Execute queries with aggregations, filters, calculations
- **Flexible querying** - Build complex queries programmatically

Key advantages over Extensions API:
- Server-side processing (no browser memory limits)
- Parallel query execution
- Better performance for large datasets
- Support for complex totals and subtotals

## Development

### Adding New Endpoints

1. Add route in `src/routes/data.routes.ts`
2. Implement service logic in appropriate service file
3. Add TypeScript types in `src/types/vizql.types.ts`

### Debugging

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

Check console output for:
- Authentication status
- Query execution logs
- Error details

### Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error message",
  "stack": "Stack trace (development only)"
}
```

## Security

- **PAT credentials** stored in `pat_config.json` (gitignored)
- **CORS** enabled for frontend origin only
- **Token refresh** on expiration
- **Graceful shutdown** signs out from Tableau Server

## Performance

- **Parallel queries** - Main data + totals fetched concurrently
- **Streaming** - Large workbooks extracted in chunks
- **Connection reuse** - Axios instances with keep-alive

## Troubleshooting

### Authentication Fails
- Verify `pat_config.json` has correct credentials
- Check PAT hasn't expired on Tableau Server
- Ensure `serverUrl` doesn't have trailing slash

### Workbook Download Fails
- Verify workbook ID is correct
- Check PAT has permissions to access workbook
- Ensure `siteId` matches workbook's site

### Query Errors
- Use `/api/datasource/metadata` to verify field names
- Check field captions match exactly (case-sensitive)
- Review VizQL Data Service documentation for query syntax

## License

MIT
