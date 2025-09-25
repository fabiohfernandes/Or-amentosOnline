// ============================================================================
// Health Check API Route
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/config';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: appConfig.appVersion,
          environment: process.env.NODE_ENV,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}