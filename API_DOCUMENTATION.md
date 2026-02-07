# En Pensent API Documentation v1.0

## Base URL
```
https://api.enpensent.com/v1
```

## Authentication
All API requests require an API key in the header:
```
X-API-Key: your_api_key_here
```

## Rate Limits
| Tier | Requests/Min | Burst |
|------|--------------|-------|
| Starter | 100 | 10 |
| Professional | 1,000 | 50 |
| Enterprise | 10,000 | 200 |

## Endpoints

### 1. Analyze Position
Analyze a chess position with predictive capabilities.

```http
POST /analyze
Content-Type: application/json
X-API-Key: your_key
```

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 25,
  "includeAlternatives": true
}
```

**Response:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "currentEval": 15,
  "bestMove": "e2e4",
  "bestMoveReadable": "e4",
  "principalVariation": {
    "moves": ["e4", "e5", "Nf3", "Nc6"],
    "evaluation": 35,
    "winProbability": 52.5
  },
  "alternativeLines": [...],
  "tacticalThemes": ["center_control", "development"],
  "positionType": "opening"
}
```

### 2. Run Benchmark
Start an async chess benchmark job.

```http
POST /benchmark
Content-Type: application/json
X-API-Key: your_key
```

**Request Body:**
```json
{
  "gameCount": 50,
  "useRealGames": true,
  "webhookUrl": "https://your-webhook.com/callback"
}
```

**Response:**
```json
{
  "jobId": "job_abc123",
  "status": "queued",
  "estimatedDuration": "45 minutes"
}
```

### 3. Get Job Status
Check benchmark progress.

```http
GET /benchmark/job/:jobId
X-API-Key: your_key
```

**Response:**
```json
{
  "jobId": "job_abc123",
  "status": "running",
  "progress": 45,
  "results": null
}
```

### 4. Get Account Info
```http
GET /account
X-API-Key: your_key
```

**Response:**
```json
{
  "tier": "professional",
  "requestsUsed": 450,
  "requestsLimit": 1000,
  "validUntil": "2026-12-31"
}
```

## Webhook Events

### Benchmark Progress
```json
{
  "event": "benchmark.progress",
  "jobId": "job_abc123",
  "progress": 45,
  "status": "analyzing game 23/50"
}
```

### Benchmark Complete
```json
{
  "event": "benchmark.complete",
  "jobId": "job_abc123",
  "results": {
    "accuracy": 72.5,
    "gamesAnalyzed": 50,
    "positions": 2847
  }
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request |
| 401 | Unauthorized (invalid API key) |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## SDK Examples

### JavaScript
```javascript
const client = new EnPensentClient('your_api_key');

const analysis = await client.analyze({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  depth: 25
});
```

### Python
```python
from enpensent import Client

client = Client('your_api_key')
analysis = client.analyze(
    fen='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    depth=25
)
```

## Support
- Docs: https://docs.enpensent.com
- Status: https://status.enpensent.com
- Support: support@enpensent.com
