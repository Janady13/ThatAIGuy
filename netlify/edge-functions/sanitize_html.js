export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let body = await response.text();

  // Trim anything appended after </html>
  const endIdx = body.indexOf('</html>');
  if (endIdx !== -1) {
    body = body.slice(0, endIdx + 7);
  }

  // Remove known debug/code dump signatures if present
  body = body
    .replace(/#\s*~\/Desktop\/expansion\/AI_Brain[\s\S]*/g, '')
    .replace(/netlify\/functions\/marketing_worker[\s\S]*/g, '')
    .replace(/netlify\/functions\/scraper_worker[\s\S]*/g, '')
    .replace(/node-fetch|reddit\.com|coindesk|jobs_queue\.txt/gi, '');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

