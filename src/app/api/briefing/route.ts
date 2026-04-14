import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BriefingType } from '@/types/briefing';

/** Determine briefing type by hour-of-day (server UTC; rely on client timezone header if provided). */
function getBriefingType(hourOfDay: number): BriefingType {
  if (hourOfDay >= 5 && hourOfDay < 12) return 'morning';
  if (hourOfDay >= 18 || hourOfDay < 5) return 'evening';
  return 'adhoc';
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Respect client-supplied timezone for briefing type detection
    const tzHeader = request.headers.get('x-timezone');
    let hourOfDay: number;

    if (tzHeader) {
      const now = new Date().toLocaleString('en-US', {
        timeZone: tzHeader,
        hour: 'numeric',
        hour12: false,
      });
      hourOfDay = parseInt(now, 10);
    } else {
      hourOfDay = new Date().getUTCHours();
    }

    const type = getBriefingType(hourOfDay);

    // Return the most recent briefing of the relevant type within the last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: briefing, error } = await supabase
      .from('briefings')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .gte('generated_at', sixHoursAgo)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch briefing:', error);
      return NextResponse.json({ error: 'Failed to fetch briefing' }, { status: 500 });
    }

    if (!briefing) {
      return NextResponse.json(
        { briefing: null, type, needsGeneration: true },
        { status: 200 }
      );
    }

    return NextResponse.json({ briefing, type, needsGeneration: false });
  } catch (error) {
    console.error('GET /api/briefing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
