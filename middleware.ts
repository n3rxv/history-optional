import { NextRequest, NextResponse } from 'next/server';

// Known AI crawler / scraper User-Agent strings
const AI_BOTS = [
  'gptbot',           // OpenAI
  'chatgpt-user',     // ChatGPT browsing
  'oai-searchbot',    // OpenAI search
  'claudebot',        // Anthropic
  'anthropic-ai',     // Anthropic
  'cohere-ai',        // Cohere
  'google-extended',  // Google Bard/Gemini training
  'gemini',           // Google Gemini
  'notebooklm',       // Google NotebookLM
  'perplexitybot',    // Perplexity
  'youbot',           // You.com
  'diffbot',          // Diffbot
  'bytespider',       // ByteDance/TikTok
  'petalbot',         // Huawei
  'scrapy',           // Generic scraper framework
  'python-requests',  // Common scraper lib
  'httpx',            // Common scraper lib
  'curl',             // CLI scraping
  'wget',             // CLI scraping
  'go-http-client',   // Go scrapers
  'node-fetch',       // Node.js scrapers
  'axios',            // JS scraper lib
];

export function middleware(req: NextRequest) {
  const ua = (req.headers.get('user-agent') ?? '').toLowerCase();
  const pathname = req.nextUrl.pathname; 
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  // Block known AI bots from ALL pages
  if (AI_BOTS.some(bot => ua.includes(bot))) {
    return new NextResponse('Access denied', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
      },
    });
  }

  // Block headless browsers commonly used for scraping
  const isHeadless =
    ua.includes('headlesschrome') ||
    ua.includes('phantomjs') ||
    ua.includes('selenium') ||
    ua.includes('puppeteer') ||
    ua.includes('playwright') ||
    (ua.includes('chrome') && !ua.includes('mobile') && !ua.includes('safari') && ua.includes('headless'));

  if (isHeadless && pathname.startsWith('/notes')) {
    return new NextResponse('Access denied', { status: 403 });
  }

  // Return 404 for /admin unless valid cookie or secret key present
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminToken = req.cookies.get('admin_token')?.value;
    const secretKey = req.nextUrl.searchParams.get('key');
    if (!adminToken && secretKey !== 'h1km4tgh4l16') {
      return new NextResponse(null, { status: 404 });
    }
  }

  // Protect API but allow notes to be indexed
  if (pathname.startsWith('/api/admin/note-content')) {
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/notes/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
