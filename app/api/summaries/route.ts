import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import type { Summary } from '../summarize/route';

const summariesFile = path.join(process.cwd(), 'data', 'summaries.json');

async function loadSummaries(): Promise<Summary[]> {
  try {
    const data = await readFile(summariesFile, 'utf-8');
    return JSON.parse(data) as Summary[];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase();
  let summaries = await loadSummaries();
  if (q) {
    summaries = summaries.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return NextResponse.json(summaries);
}
