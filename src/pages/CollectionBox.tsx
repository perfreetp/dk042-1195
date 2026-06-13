import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Plus, FileText, Sparkles, X, ExternalLink, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store';
import { InspirationCard } from '@/components/features/InspirationCard';
import { cn } from '@/utils/helpers';

type TabKey = 'formal' | 'draft';

export function CollectionBox() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('formal');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');

  const inspirations = useAppStore((s) => s.inspirations);
  const addInspiration = useAppStore((s) => s.addInspiration);
  const convertDraftToFormal = useAppStore((s) => s.convertDraftToFormal);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const formalInspirations = useMemo(
    () => inspirations.filter((ins) => ins.isFavorited && !ins.isDraft),
    [inspirations]
  );
  const draftInspirations = useMemo(
    () => inspirations.filter((ins) => ins.isDraft),
    [inspirations]
  );
  const activeList = activeTab === 'formal' ? formalInspirations : draftInspirations;

  const handleQuickCollect = () => {
    if (!title.trim()) return;
    addInspiration({
      title: title.trim(),
      sourceUrl: sourceUrl.trim(),
      description: notes.trim(),
      isDraft: true,
      status: 'incomplete',
      tags: ['快速采集'],
    });
    setTitle('');
    setSourceUrl('');
    setNotes('');
    setShowModal(false);
    setActiveTab('draft');
  };

  const tabs: { key: TabKey; label: string; icon: typeof Sparkles; count: number }[] = [
    { key: 'formal', label: '正式灵感', icon: Sparkles, count: formalInspirations.length },
    { key: 'draft', label: '采集草稿', icon: FileText, count: draftInspirations.length },
  ];

  return (
    <div className="min-h-screen bg-grid-pattern bg-grid">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                <span className="gradient-text">团队素材池</span>
              </h1>
              <p className="text-sm text-slate-500">采集灵感碎片，汇聚团队创意资产</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100">
                <Bookmark className="w-4 h-4 text-brand-secondary" />
                <span className="text-sm font-semibold text-brand-secondary">{formalInspirations.length} 收藏</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-600">{draftInspirations.length} 草稿</span>
              </div>
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />快速采集
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tabs.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                  activeTab === key
                    ? 'bg-gradient-to-r from-brand-secondary to-orange-500 text-white shadow-glow-orange'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className={cn('px-1.5 py-0.5 rounded-full text-xs', activeTab === key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600')}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8">
        {activeList.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 flex items-center justify-center">
              {activeTab === 'formal' ? <Bookmark className="w-12 h-12 text-orange-300" /> : <FileText className="w-12 h-12 text-orange-300" />}
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {activeTab === 'formal' ? '暂无正式灵感' : '暂无采集草稿'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {activeTab === 'formal' ? '去灵感广场逛逛，收藏喜欢的灵感吧~' : '点击快速采集按钮，从外部链接捕获灵感碎片'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeList.map((ins, index) =>
              activeTab === 'draft' ? (
                <div key={ins.id} className="card overflow-hidden relative group animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <span className="tag-amber absolute top-3 left-3 z-10 text-xs">待补全</span>
                  <div className="p-5 cursor-pointer" onClick={() => navigate(`/inspiration/${ins.id}`)}>
                    <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{ins.title}</h3>
                    {ins.description && <p className="text-sm text-slate-500 mb-3 line-clamp-3">{ins.description}</p>}
                    {ins.sourceUrl && (
                      <a href={ins.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mb-3">
                        <ExternalLink className="w-3 h-3" />来源链接
                      </a>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => { convertDraftToFormal(ins.id); setActiveTab('formal'); }} className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3">
                        <ArrowRight className="w-3 h-3" />一键转正式
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={ins.id} className="relative group">
                  <InspirationCard inspiration={ins} delay={index * 50} />
                  <button
                    onClick={() => toggleFavorite(ins.id)}
                    className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">快速采集</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标题 *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="灵感标题" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">来源链接</label>
                <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="简要描述这个灵感..." rows={3} className="input-field w-full resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost">取消</button>
              <button onClick={handleQuickCollect} disabled={!title.trim()} className="btn-primary disabled:opacity-50">采集</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
