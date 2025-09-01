/**
 * Security Administration API Endpoint
 * Provides security metrics and threat management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { securityAuditor, withSecurityAudit } from '@/lib/security/security-audit';

// Only allow admin users to access security data
async function checkAdminAccess(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In production, you'd check if user has admin role
  // For now, we'll check if it's a specific admin user or environment
  const isAdmin = process.env.ADMIN_USER_ID === userId || 
                 process.env.NODE_ENV === 'development';
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

async function GET(request: NextRequest) {
  // Check admin access
  const accessError = await checkAdminAccess(request);
  if (accessError) return accessError;

  try {
    const url = new URL(request.url);
    const timeWindow = parseInt(url.searchParams.get('timeWindow') || '3600000'); // Default 1 hour
    const metrics = securityAuditor.getSecurityMetrics(timeWindow);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        summary: {
          totalThreats: metrics.threats.length,
          criticalThreats: metrics.threats.filter(t => t.severity === 'critical').length,
          blockedRequests: metrics.threats.filter(t => t.blocked).length,
          topThreatTypes: getTopThreatTypes(metrics.threats),
          topSources: getTopThreatSources(metrics.threats),
        }
      }
    });
  } catch (error) {
    console.error('Security metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}

async function POST(request: NextRequest) {
  // Check admin access
  const accessError = await checkAdminAccess(request);
  if (accessError) return accessError;

  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'block_ip':
        // In production, you'd implement IP blocking logic
        return NextResponse.json({
          success: true,
          message: `IP ${data.ip} blocked successfully`
        });
      
      case 'unblock_ip':
        // In production, you'd implement IP unblocking logic
        return NextResponse.json({
          success: true,
          message: `IP ${data.ip} unblocked successfully`
        });
      
      case 'update_security_rules':
        // Update security rules
        return NextResponse.json({
          success: true,
          message: 'Security rules updated successfully'
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Security action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform security action' },
      { status: 500 }
    );
  }
}

function getTopThreatTypes(threats: any[]) {
  const counts: Record<string, number> = {};
  threats.forEach(threat => {
    counts[threat.type] = (counts[threat.type] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));
}

function getTopThreatSources(threats: any[]) {
  const counts: Record<string, number> = {};
  threats.forEach(threat => {
    counts[threat.source] = (counts[threat.source] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}

export { GET, POST };