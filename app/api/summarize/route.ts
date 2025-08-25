import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type Summary = {
  id: string;
  title: string;
  url?: string;
  summary: string;
  tags: string[];
  createdAt: string;
};

const summariesFile = path.join(process.cwd(), 'data', 'summaries.json');

async function loadSummaries(): Promise<Summary[]> {
  try {
    const data = await readFile(summariesFile, 'utf-8');
    return JSON.parse(data) as Summary[];
  } catch {
    return [];
  }
}

async function saveSummaries(summaries: Summary[]) {
  await writeFile(summariesFile, JSON.stringify(summaries, null, 2), 'utf-8');
}

async function extractArticle(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim();
  const content = $('#js_content').text().trim();
  return { title, content };
}

export async function POST(req: NextRequest) {
  const { url, content: inputContent } = await req.json();
  let articleTitle = '';
  let articleContent = inputContent as string | undefined;

  if (url) {
    const article = await extractArticle(url);
    articleTitle = article.title;
    articleContent = article.content;
  }

  if (!articleContent) {
    return NextResponse.json({ error: 'No content to summarize' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `请阅读以下公众号文章内容，生成不超过200字的中文总结，并给出1-3个中文标签，用逗号分隔。输出格式为：\n总结: ...\n标签: ...\n\n文章内容如下：\n${articleContent}`;
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });
  const text = completion.choices[0].message?.content ?? '';
  const summaryMatch = text.match(/总结:\s*([\s\S]*?)\n标签:/);
  const tagsMatch = text.match(/标签:\s*(.*)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : text.trim();
  const tags = tagsMatch ? tagsMatch[1].split(/,\s*/).filter(Boolean) : [];

  const entry: Summary = {
    id: uuidv4(),
    title: articleTitle,
    url,
    summary,
    tags,
    createdAt: new Date().toISOString(),
  };
  const summaries = await loadSummaries();
  summaries.unshift(entry);
  await saveSummaries(summaries);

  return NextResponse.json(entry);
}
