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

  // Return 404 for /admin to anyone except the owner
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    try {
      const OWNER_EMAIL = 'nirxv03@gmail.com';
      const JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? '';
      // Get Supabase auth token from cookie
      const cookieHeader = req.headers.get('cookie') ?? '';
      const match = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
      if (!match) return new NextResponse(null, { status: 404 });
      const rawCookie = decodeURIComponent(match[1]);
      const parsed = JSON.parse(rawCookie);
      const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
      if (!accessToken) return new NextResponse(null, { status: 404 });
      // Decode JWT payload (Edge runtime — no verify, just decode)
      const parts = accessToken.split('.');
      if (parts.length !== 3) return new NextResponse(null, { status: 404 });
      const payload = JSON.parse(atob(parts[1]));
      if (payload?.email !== OWNER_EMAIL) return new NextResponse(null, { status: 404 });
      if (payload?.exp && Date.now() / 1000 > payload.exp) return new NextResponse(null, { status: 404 });
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }

  // Add anti-scraping headers to all note pages
  if (pathname.startsWith('/notes') || pathname.startsWith('/api/admin/note-content')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.headers.set('X-Content-Type-Options', 'nosniff');
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
