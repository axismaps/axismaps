'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useDebounce } from '../hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  summary?: string;
  score: number;
  snippet: string;
  highlightedTitle: string;
}

export default function GuideSearchClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('q', query.trim());
      params.append('limit', '10');

      const response = await fetch(`/api/guide/search?${params}`);
      const data = await response.json();

      setSearchResults(data.results || []);
      setIsOpen((data.results || []).length > 0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          window.location.href = `/guide/${searchResults[selectedIndex].slug}`;
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative max-w-2xl mx-auto" ref={searchRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchResults.length > 0 && setIsOpen(true)}
          placeholder="Search guide articles..."
          className="w-full px-3 py-2 pl-9 pr-8 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-96 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-neutral-500">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">No results found</div>
          ) : (
            <ul className="py-1">
              {searchResults.map((result, index) => (
                <li key={result.id}>
                  <Link
                    href={`/guide/${result.slug}`}
                    className={`block px-3 py-1.5 hover:bg-neutral-50 ${
                      index === selectedIndex ? 'bg-neutral-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium text-neutral-900 truncate"
                          dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
                        />
                        {result.snippet && (
                          <div
                            className="text-xs text-neutral-500 truncate mt-0.5"
                            dangerouslySetInnerHTML={{
                              __html: result.snippet.replace(/<mark>/g, '<mark class="bg-yellow-200">')
                            }}
                          />
                        )}
                      </div>
                      <span className="ml-2 text-xs text-neutral-400 whitespace-nowrap">
                        {result.category}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}