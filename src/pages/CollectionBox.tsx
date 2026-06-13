import { useMemo, useState } from 'react';
import { Bookmark, Calendar, Users, Sparkles, ShoppingBag, Gamepad2, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { InspirationCard } from '@/components/features/InspirationCard';
import { cn } from '@/utils/helpers';

const categories = [
  { key: 'all', label: '全部', icon: Sparkles },
  { key: 'festival', label: '节日专题', icon: Calendar },
  { key: 'audience', label: '人群定向', icon: Users },
  { key: 'products', label: '商品组合', icon: ShoppingBag },
  { key: 'gameplay', label: '玩法类型', icon: Gamepad2 },
];

export function CollectionBox() {
  const [activeCategory, setActiveCategory] = useState('all');
  const inspirations = useAppStore((state) => state.inspirations);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const favoritedInspirations = useMemo(
    () => inspirations.filter((ins) => ins.isFavorited),
    [inspirations]
  );

  const filteredInspirations = useMemo(() => {
    let result = favoritedInspirations;
    switch (activeCategory) {
      case 'festival':
        result = result.filter((ins) => ins.festival && ins.festival !== '无');
        break;
      case 'audience':
        result = result.filter((ins) => ins.targetAudience);
        break;
      case 'products':
        result = result.filter((ins) => ins.relatedProducts.length > 0);
        break;
      case 'gameplay':
        result = result.filter((ins) => ins.tags.some((t) => t.includes('玩法') || t.includes('策略')));
        break;
    }
    return result;
  }, [favoritedInspirations, activeCategory]);

  return (
    <div className="min-h-screen bg-grid-pattern bg-grid">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                <span className="gradient-text">我的采集箱</span>
              </h1>
              <p className="text-sm text-slate-500">收藏的灵感都在这里，随时翻阅获取创意启发</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100">
              <Bookmark className="w-5 h-5 text-brand-secondary" />
              <div>
                <p className="text-xs text-slate-500">已收藏灵感</p>
                <p className="text-xl font-bold text-brand-secondary">{favoritedInspirations.length}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                  activeCategory === key
                    ? 'bg-gradient-to-r from-brand-secondary to-orange-500 text-white shadow-glow-orange'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    activeCategory === key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {key === 'all'
                    ? favoritedInspirations.length
                    : filteredInspirations.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8">
        {filteredInspirations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 flex items-center justify-center">
              <Bookmark className="w-12 h-12 text-orange-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">采集箱空空如也</h3>
            <p className="text-sm text-slate-500 mb-4">去灵感广场逛逛，看到喜欢的灵感点击收藏按钮吧~</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInspirations.map((ins, index) => (
              <div key={ins.id} className="relative group">
                <InspirationCard inspiration={ins} delay={index * 50} />
                <button
                  onClick={() => toggleFavorite(ins.id)}
                  className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
