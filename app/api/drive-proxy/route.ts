export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return new Response('File ID missing', { status: 400 });
  }

  // Validate fileId — only alphanumeric + dashes/underscores allowed
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return new Response('Invalid file ID', { status: 400 });
  }

  try {
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const res = await fetch(driveUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return new Response('Failed to fetch file from Drive', { status: 502 });
    }

    const contentType = res.headers.get('content-type') || 'application/pdf';

    return new Response(res.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch {
    return new Response('Error fetching file', { status: 500 });
  }
}
