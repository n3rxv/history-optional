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

  // Always allow HEAD requests — Googlebot uses HEAD to check pages before full crawl
  if (req.method === 'HEAD') {
    return NextResponse.next();
  }

  // Always allow real search engine crawlers
  const isSearchBot = ua.includes('googlebot') || ua.includes('bingbot') || ua.includes('slurp') || ua.includes('duckduckbot') || ua.includes('baiduspider');
  if (isSearchBot) {
    return NextResponse.next();
  }

  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  // Block known AI bots from ALL pages
  if (AI_BOTS.some(bot => ua.includes(bot))) {
    return new NextResponse('Access denied', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
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

  // Return 404 for every admin surface unless a valid cookie or secret key is
  // present, so the panel is not even discoverable.
  //
  // The list is explicit because a prefix test is easy to get wrong: an earlier
  // version tested pathname.startsWith('/admin/'), which silently stopped
  // covering /admin-legacy the moment the previous panel was renamed to it.
  //
  // The key only ever appears on the first request. Payload's own client
  // navigations and its /cms-api fetches carry no query string, so gating on
  // ?key= alone 404'd the CMS's internal traffic and it could never log in.
  // Passing the gate therefore drops a short-lived cookie that later requests
  // present instead. Payload's own auth is what actually protects the data;
  // this gate only keeps the panel from being discoverable.
  const GATE_COOKIE = 'admin_gate';
  // '/admin' is gone: everything it did now lives in /cms, either as a Payload
  // collection or as a custom view. '/admin-legacy' stays until note content
  // is migrated into Payload, because it is still the only working editor.
  const GATED = ['/admin-legacy', '/cms', '/cms-api', '/api/cms'];
  const isGated = GATED.some(p => pathname === p || pathname.startsWith(`${p}/`));
  if (isGated) {
    const adminToken = req.cookies.get('admin_token')?.value;
    const gateCookie = req.cookies.get(GATE_COOKIE)?.value;
    const secretKey = req.nextUrl.searchParams.get('key');
    const keyIsValid = Boolean(process.env.ADMIN_SECRET_KEY)
      && secretKey === process.env.ADMIN_SECRET_KEY;

    if (!adminToken && !gateCookie && !keyIsValid) {
      return new NextResponse(null, { status: 404 });
    }
    if (keyIsValid && !gateCookie) {
      const res = NextResponse.next();
      res.cookies.set(GATE_COOKIE, '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 8,   // matches the admin token's own window
      });
      return res;
    }
  }

  // Protect API but allow notes to be indexed
  if (pathname === '/api/admin/cuttings') {
    return NextResponse.next();
  }

  if (pathname === '/resources') {
    return NextResponse.next();
  }

  if (pathname === '/resources') {
    return NextResponse.next();
  }

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
    '/((?!_next/static|_next/image|__/|favicon.ico).*)',
  ],
};
