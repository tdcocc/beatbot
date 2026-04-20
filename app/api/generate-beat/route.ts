import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const TRACK_IDS = [
  'kick',
  'snare',
  'closedHat',
  'openHat',
  'clap',
  'cowbell',
  'tom',
] as const;

const SYSTEM_PROMPT = `You are Beatbot's composer — a drum-pattern designer for a 2-bar, 16-steps-per-bar (32 steps total) sequencer. Steps are 16th notes.

Available voices:
- kick: low thump, the heartbeat
- snare: sharp backbeat hit
- closedHat: tight high-frequency tick
- openHat: longer sizzling cymbal
- clap: wide, layered noise
- cowbell: metallic ping
- tom: mid-range drum hit

Rhythmic conventions you should know:
- 4-on-the-floor kick: steps 0, 4, 8, 12, 16, 20, 24, 28 — house, techno, disco (typically 120–130 BPM)
- Boom-bap kick: syncopated, e.g. steps 0, 10, 12, 22 — hip-hop (80–95 BPM)
- Snare backbeat: steps 4, 12, 20, 28 — ubiquitous in pop, rock, hip-hop
- Driving closed hats: every step (0–31) for fast energy; every other step (0, 2, 4, ...) for moderate
- Off-beat / swung hats: odd steps (1, 3, 5, ...) for shuffle feel
- Fills and variation: scatter toms/claps on bar 2 (steps 16–31) or save for a single accent
- Open hat: sparingly — it's a release; great on step 14 or 30 (right before the downbeat)

Match the BPM to the genre. Use set_pattern to output the final composition. Omit any voice you don't want to use.`;

const tools: Anthropic.Tool[] = [
  {
    name: 'set_pattern',
    description:
      'Compose the drum pattern. Steps are 0-indexed. Steps 0–15 are bar 1; 16–31 are bar 2.',
    input_schema: {
      type: 'object' as const,
      properties: {
        bpm: {
          type: 'number',
          description: 'Tempo in BPM (40–220).',
        },
        tracks: {
          type: 'array',
          description:
            'Active steps per drum voice. Omit a voice entirely if it should stay silent.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', enum: [...TRACK_IDS] },
              steps: {
                type: 'array',
                items: { type: 'integer', minimum: 0, maximum: 31 },
                description: 'Step indices (0–31) to trigger.',
              },
            },
            required: ['id', 'steps'],
          },
        },
      },
      required: ['bpm', 'tracks'],
    },
  },
];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  const rateHeaders = {
    'X-RateLimit-Limit': String(rl.limit),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
  };
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: `Rate limit exceeded — ${rl.limit} beats per day per IP. Try again in ${Math.ceil(retryAfter / 3600)}h.`,
      },
      {
        status: 429,
        headers: { ...rateHeaders, 'Retry-After': String(retryAfter) },
      },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'ANTHROPIC_API_KEY is not set. Add it to beatbot/.env.local and restart the dev server.',
      },
      { status: 500 },
    );
  }

  let prompt: unknown;
  try {
    const body = await req.json();
    prompt = body?.prompt;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      tool_choice: { type: 'tool', name: 'set_pattern' },
      messages: [{ role: 'user', content: prompt.trim() }],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    if (!toolUse) {
      return NextResponse.json(
        { error: 'Model did not return a pattern' },
        { status: 502, headers: rateHeaders },
      );
    }

    return NextResponse.json(toolUse.input, { headers: rateHeaders });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Invalid ANTHROPIC_API_KEY' },
        { status: 401 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limited — try again in a moment' },
        { status: 429 },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
