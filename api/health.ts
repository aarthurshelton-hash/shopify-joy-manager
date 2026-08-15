/**
 * En Pensent API — Health check (Vercel serverless)
 * GET /api/health
 */

export default async function handler(req: Request): Promise<Response> {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'en-pensent-prediction-api',
    version: 'ep-v8.07',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/predict', '/api/health'],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
