// Dynamic Sitemap Generation - Phase 7 SEO Enhancement
import { generateSitemapData } from '@/lib/seo/meta-generator';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sitemapData = generateSitemapData();
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapData.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <priority>${page.priority}</priority>
    <changefreq>${page.changeFreq}</changefreq>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200' // 24h cache, 12h stale
      }
    });
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}