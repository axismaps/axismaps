import { NextRequest, NextResponse } from 'next/server';
import MiniSearch from 'minisearch';
import fs from 'fs/promises';
import path from 'path';

let searchIndex: MiniSearch | null = null;
let searchData: any = null;

async function loadSearchIndex() {
  if (searchIndex && searchData) {
    return { index: searchIndex, data: searchData };
  }

  try {
    const indexPath = path.join(process.cwd(), 'public', 'search', 'guide-index.json');
    const indexContent = await fs.readFile(indexPath, 'utf8');
    searchData = JSON.parse(indexContent);

    searchIndex = MiniSearch.loadJSON(JSON.stringify(searchData.index), {
      fields: ['title', 'content', 'category', 'headings', 'summary'],
      storeFields: ['title', 'slug', 'category', 'categorySlug', 'summary', 'order', 'publishedAt'],
      searchOptions: {
        boost: { title: 3, headings: 2, category: 1.5 },
        fuzzy: 0.2,
        prefix: true
      }
    });

    return { index: searchIndex, data: searchData };
  } catch (error) {
    console.error('Error loading search index:', error);
    throw new Error('Search index not available');
  }
}

function extractSnippet(text: string, query: string, maxLength: number = 150): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/);

  let bestPosition = -1;
  let bestScore = 0;

  for (const word of queryWords) {
    const position = lowerText.indexOf(word);
    if (position !== -1) {
      const score = word.length;
      if (score > bestScore) {
        bestScore = score;
        bestPosition = position;
      }
    }
  }

  if (bestPosition === -1) {
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  const start = Math.max(0, bestPosition - 50);
  const end = Math.min(text.length, bestPosition + maxLength);

  let snippet = text.slice(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

function highlightText(text: string, query: string): string {
  if (!query) return text;

  const words = query.split(/\s+/).filter(Boolean);
  let highlightedText = text;

  words.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });

  return highlightedText;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: query || ''
      });
    }

    const { index, data } = await loadSearchIndex();

    let searchResults = index.search(query, {
      boost: { title: 3, headings: 2, category: 1.5 },
      fuzzy: 0.2,
      prefix: true
    });

    if (category) {
      searchResults = searchResults.filter(result => {
        const doc = data.documents.find((d: any) => d.id === result.id);
        return doc && doc.categorySlug === category;
      });
    }

    searchResults = searchResults.slice(0, limit);

    const enhancedResults = searchResults.map(result => {
      const document = data.documents.find((d: any) => d.id === result.id);

      return {
        ...document,
        score: result.score,
        match: result.match,
        snippet: extractSnippet(document.contentPreview || document.summary || '', query),
        highlightedTitle: highlightText(document.title, query)
      };
    });

    return NextResponse.json({
      results: enhancedResults,
      total: enhancedResults.length,
      query
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search service unavailable' },
      { status: 500 }
    );
  }
}