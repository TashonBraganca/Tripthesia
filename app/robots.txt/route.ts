// Dynamic Robots.txt Generation - Phase 7 SEO Enhancement  
import { generateRobotsTxt } from '@/lib/seo/meta-generator';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const robotsTxt = generateRobotsTxt();
    
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400' // 24h cache
      }
    });
    
  } catch (error) {
    console.error('Robots.txt generation error:', error);
    return new NextResponse('User-agent: *\nAllow: /', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}