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

  if (pathname === '/resources') {
    return NextResponse.next();
  }

  if (pathname === '/resources') {
    return NextResponse.next();
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
