import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Calendar, FileText, ChevronRight, X } from 'lucide-react';
import { useAppStore } from '@/store';
import { getStatusText, getStatusColor, cn } from '@/utils/helpers';
import type { Inspiration, Experiment, RetrospectiveData } from '@/types';

interface InspirationResult {
  type: 'inspiration';
  data: Inspiration;
  snippet: string;
}

interface ExperimentResult {
  type: 'experiment';
  data: Experiment;
  snippet: string;
}

interface RetrospectiveResult {
  type: 'retrospective';
  data: RetrospectiveData;
  snippet: string;
  experimentTitle: string;
}

type SearchResult = InspirationResult | ExperimentResult | RetrospectiveResult;

function truncate(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

function findSnippet(text: string, query: string, maxLen = 80): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return truncate(text, maxLen);
  const half = Math.floor(maxLen / 2);
  const start = Math.max(0, idx - half);
  const end = Math.min(text.length, start + maxLen);
  return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { inspirations, experiments, retrospectives } = useAppStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const inspResults: InspirationResult[] = inspirations
      .filter((i) => !i.isDeleted)
      .filter((i) => {
        return (
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .map((i) => {
        let snippet = '';
        if (i.title.toLowerCase().includes(q)) snippet = findSnippet(i.description || '', query);
        else if (i.description.toLowerCase().includes(q)) snippet = findSnippet(i.description, query);
        else {
          const matchedTag = i.tags.find((t) => t.toLowerCase().includes(q));
          snippet = matchedTag ? `标签: ${matchedTag}` : truncate(i.description);
        }
        return { type: 'inspiration', data: i, snippet };
      });

    const expResults: ExperimentResult[] = experiments
      .filter((e) => e.title.toLowerCase().includes(q) || e.anchorName.toLowerCase().includes(q))
      .map((e) => {
        const snippet = e.anchorName.toLowerCase().includes(q)
          ? `主播: ${e.anchorName}`
          : truncate(e.title + ' · ' + e.anchorName);
        return { type: 'experiment', data: e, snippet };
      });

    const retroResults: RetrospectiveResult[] = retrospectives
      .filter((r) => {
        if (r.summary.toLowerCase().includes(q)) return true;
        if (r.issues.some((iss) => iss.description.toLowerCase().includes(q))) return true;
        if (r.actionItems.some((ai) => ai.task.toLowerCase().includes(q))) return true;
        if (
          r.hypothesisVerdicts.some(
            (hv) =>
              hv.note.toLowerCase().includes(q) ||
              hv.hypothesisText.toLowerCase().includes(q)
          )
        )
          return true;
        return false;
      })
      .map((r) => {
        let snippet = '';
        if (r.summary.toLowerCase().includes(q)) snippet = findSnippet(r.summary, query);
        else {
          const matchedIssue = r.issues.find((iss) => iss.description.toLowerCase().includes(q));
          if (matchedIssue) snippet = '[问题] ' + findSnippet(matchedIssue.description, query);
          else {
            const matchedAI = r.actionItems.find((ai) => ai.task.toLowerCase().includes(q));
            if (matchedAI) snippet = '[行动项] ' + findSnippet(matchedAI.task, query);
            else {
              const matchedHV = r.hypothesisVerdicts.find(
                (hv) =>
                  hv.note.toLowerCase().includes(q) ||
                  hv.hypothesisText.toLowerCase().includes(q)
              );
              if (matchedHV) {
                snippet = matchedHV.note.toLowerCase().includes(q)
                  ? '[假设结论] ' + findSnippet(matchedHV.note, query)
                  : '[假设] ' + findSnippet(matchedHV.hypothesisText, query);
              }
            }
          }
        }
        const exp = experiments.find((e) => e.id === r.experimentId);
        return {
          type: 'retrospective',
          data: r,
          snippet,
          experimentTitle: exp?.title || '已删除实验',
        };
      });

    return [...inspResults, ...expResults, ...retroResults];
  }, [query, inspirations, experiments, retrospectives]);

  const grouped = useMemo(() => {
    return {
      inspirations: results.filter((r): r is InspirationResult => r.type === 'inspiration'),
      experiments: results.filter((r): r is ExperimentResult => r.type === 'experiment'),
      retrospectives: results.filter((r): r is RetrospectiveResult => r.type === 'retrospective'),
    };
  }, [results]);

  const totalCount = results.length;
  const showPanel = isOpen && query.trim().length > 0;

  const handleSelect = (r: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (r.type === 'inspiration') {
      navigate(`/inspiration/${r.data.id}`);
    } else if (r.type === 'experiment') {
      if (r.data.status === 'completed') {
        navigate(`/retrospective/${r.data.id}`);
      } else {
        navigate('/experiments');
      }
    } else {
      navigate(`/retrospective/${r.data.experimentId}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="搜索灵感、实验、复盘..."
          className="input-field pl-10 pr-10 py-2.5 text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 card overflow-hidden z-50 animate-slide-up">
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
            {totalCount === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">未找到匹配的结果</p>
                <p className="text-xs text-slate-400 mt-1">尝试更换关键词</p>
              </div>
            ) : (
              <>
                {grouped.inspirations.length > 0 && (
                  <div>
                    <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
                      <span className="text-xs font-bold text-slate-600">灵感</span>
                      <span className="text-[10px] text-slate-400">({grouped.inspirations.length})</span>
                    </div>
                    <div>
                      {grouped.inspirations.map((r) => (
                        <button
                          key={r.data.id}
                          onClick={() => handleSelect(r)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors border-b border-slate-50 last:border-b-0 flex items-start gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-brand-secondary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-primary transition-colors">
                                {r.data.title}
                              </p>
                              {r.data.isDraft && <span className="tag-amber text-[10px] px-1.5 py-0.5">草稿</span>}
                            </div>
                            {r.snippet && (
                              <p className="text-xs text-slate-500 line-clamp-2">{r.snippet}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-primary shrink-0 mt-1 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {grouped.experiments.length > 0 && (
                  <div>
                    <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600">实验</span>
                      <span className="text-[10px] text-slate-400">({grouped.experiments.length})</span>
                    </div>
                    <div>
                      {grouped.experiments.map((r) => (
                        <button
                          key={r.data.id}
                          onClick={() => handleSelect(r)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors border-b border-slate-50 last:border-b-0 flex items-start gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-primary transition-colors">
                                {r.data.title}
                              </p>
                              <span className={cn(getStatusColor(r.data.status), 'text-[10px] px-1.5 py-0.5')}>
                                {getStatusText(r.data.status)}
                              </span>
                            </div>
                            {r.snippet && (
                              <p className="text-xs text-slate-500 truncate">{r.snippet}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-primary shrink-0 mt-1 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {grouped.retrospectives.length > 0 && (
                  <div>
                    <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-600">复盘</span>
                      <span className="text-[10px] text-slate-400">({grouped.retrospectives.length})</span>
                    </div>
                    <div>
                      {grouped.retrospectives.map((r) => (
                        <button
                          key={r.data.id}
                          onClick={() => handleSelect(r)}
                          className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 transition-colors border-b border-slate-50 last:border-b-0 flex items-start gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-emerald-600 transition-colors mb-1">
                              {r.experimentTitle}
                            </p>
                            {r.snippet && (
                              <p className="text-xs text-slate-500 line-clamp-2">{r.snippet}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-1 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {totalCount > 0 && (
            <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">共找到 {totalCount} 条结果</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
