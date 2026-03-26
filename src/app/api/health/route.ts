export async function GET() {
  return Response.json({
    ok: true,
    service: 'uzafo-portfolio-site',
    timestamp: new Date().toISOString()
  });
}
