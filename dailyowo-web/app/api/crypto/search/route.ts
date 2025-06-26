import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ coins: [] });
    }

    const response = await fetch(`${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DailyOwo-Web-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Add cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Crypto search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search crypto data' },
      { status: 500 }
    );
  }
}