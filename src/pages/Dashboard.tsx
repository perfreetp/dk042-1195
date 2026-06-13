import { useMemo, useState } from 'react';
import { LayoutDashboard, User, Calendar, Package, TrendingUp, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency, formatNumber, cn } from '@/utils/helpers';

type DashboardTab = 'anchor' | 'festival' | 'category';

export function Dashboard() {
  const { experiments, inspirations, retrospectives, products, anchors } = useAppStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('anchor');

  const completedExperiments = useMemo(
    () => experiments.filter((e) => e.status === 'completed' && e.actualMetrics),
    [experiments]
  );

  const overallStats = useMemo(() => {
    const totalGmv = completedExperiments.reduce((s, e) => s + (e.actualMetrics?.gmv ?? 0), 0);
    const avgConversion = completedExperiments.length
      ? completedExperiments.reduce((s, e) => s + (e.actualMetrics?.conversion ?? 0), 0) / completedExperiments.length
      : 0;
    const avgEngagement = completedExperiments.length
      ? completedExperiments.reduce((s, e) => s + (e.actualMetrics?.engagement ?? 0), 0) / completedExperiments.length
      : 0;
    const allActionItems = retrospectives.flatMap((r) => r.actionItems);
    const completedActions = allActionItems.filter((a) => a.completed).length;
    const totalActions = allActionItems.length;
    return { totalGmv, avgConversion, avgEngagement, completedActions, totalActions, expCount: completedExperiments.length };
  }, [completedExperiments, retrospectives]);

  const anchorData = useMemo(() => {
    const map = new Map<string, { name: string; exps: typeof completedExperiments; gmv: number; conversion: number; actions: number; completedActions: number }>();
    completedExperiments.forEach((exp) => {
      const key = exp.anchorName;
      if (!map.has(key)) map.set(key, { name: key, exps: [], gmv: 0, conversion: 0, actions: 0, completedActions: 0 });
      const entry = map.get(key)!;
      entry.exps.push(exp);
      entry.gmv += exp.actualMetrics?.gmv ?? 0;
      entry.conversion += exp.actualMetrics?.conversion ?? 0;
      const retro = retrospectives.find((r) => r.experimentId === exp.id);
      if (retro) {
        entry.actions += retro.actionItems.length;
        entry.completedActions += retro.actionItems.filter((a) => a.completed).length;
      }
    });
    return Array.from(map.values()).map((d) => ({ ...d, avgConversion: d.exps.length ? d.conversion / d.exps.length : 0 }));
  }, [completedExperiments, retrospectives]);

  const festivalData = useMemo(() => {
    const map = new Map<string, { festival: string; exps: typeof completedExperiments; gmv: number; conversion: number; actions: number; completedActions: number }>();
    completedExperiments.forEach((exp) => {
      const ins = inspirations.find((i) => i.id === exp.inspirationId);
      const key = ins?.festival || '无节日';
      if (!map.has(key)) map.set(key, { festival: key, exps: [], gmv: 0, conversion: 0, actions: 0, completedActions: 0 });
      const entry = map.get(key)!;
      entry.exps.push(exp);
      entry.gmv += exp.actualMetrics?.gmv ?? 0;
      entry.conversion += exp.actualMetrics?.conversion ?? 0;
      const retro = retrospectives.find((r) => r.experimentId === exp.id);
      if (retro) {
        entry.actions += retro.actionItems.length;
        entry.completedActions += retro.actionItems.filter((a) => a.completed).length;
      }
    });
    return Array.from(map.values()).map((d) => ({ ...d, avgConversion: d.exps.length ? d.conversion / d.exps.length : 0 }));
  }, [completedExperiments, inspirations, retrospectives]);

  const categoryData = useMemo(() => {
    const map = new Map<string, { category: string; exps: typeof completedExperiments; gmv: number; conversion: number; actions: number; completedActions: number }>();
    completedExperiments.forEach((exp) => {
      const ins = inspirations.find((i) => i.id === exp.inspirationId);
      const cats = new Set<string>();
      ins?.relatedProducts.forEach((pid) => {
        const p = products.find((pr) => pr.id === pid);
        if (p) cats.add(p.category);
      });
      if (cats.size === 0) cats.add('未分类');
      cats.forEach((cat) => {
        if (!map.has(cat)) map.set(cat, { category: cat, exps: [], gmv: 0, conversion: 0, actions: 0, completedActions: 0 });
        const entry = map.get(cat)!;
        entry.exps.push(exp);
        entry.gmv += exp.actualMetrics?.gmv ?? 0;
        entry.conversion += exp.actualMetrics?.conversion ?? 0;
        const retro = retrospectives.find((r) => r.experimentId === exp.id);
        if (retro) {
          entry.actions += retro.actionItems.length;
          entry.completedActions += retro.actionItems.filter((a) => a.completed).length;
        }
      });
    });
    return Array.from(map.values()).map((d) => ({ ...d, avgConversion: d.exps.length ? d.conversion / d.exps.length : 0 }));
  }, [completedExperiments, inspirations, products, retrospectives]);

  const currentData = activeTab === 'anchor' ? anchorData : activeTab === 'festival' ? festivalData : categoryData;
  const tabs: { key: DashboardTab; label: string; icon: typeof User }[] = [
    { key: 'anchor', label: '按主播', icon: User },
    { key: 'festival', label: '按节日', icon: Calendar },
    { key: 'category', label: '按品类', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-grid-pattern bg-grid">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                <span className="gradient-text">复盘看板</span>
              </h1>
              <p className="text-sm text-slate-500">汇总团队实验数据，发现值得复用的好玩法</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-indigo-600" /></div>
              <span className="text-sm text-slate-500">已完成实验</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{overallStats.expCount}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
              <span className="text-sm text-slate-500">总GMV</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(overallStats.totalGmv)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
              <span className="text-sm text-slate-500">平均转化率</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{overallStats.avgConversion.toFixed(1)}%</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center"><Clock className="w-5 h-5 text-rose-600" /></div>
              <span className="text-sm text-slate-500">动作完成率</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {overallStats.totalActions ? ((overallStats.completedActions / overallStats.totalActions) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg">
              <LayoutDashboard className="w-5 h-5 text-indigo-500" />
              分维度汇总
            </h2>
            <div className="flex gap-2">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all',
                    activeTab === key
                      ? 'bg-gradient-to-r from-brand-primary to-indigo-600 text-white shadow-glow-indigo'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {currentData.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无复盘数据</h3>
              <p className="text-sm text-slate-500">完成实验并填写复盘后，这里将展示汇总看板</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentData.map((item) => {
                const name = activeTab === 'anchor' ? (item as typeof anchorData[0]).name : activeTab === 'festival' ? (item as typeof festivalData[0]).festival : (item as typeof categoryData[0]).category;
                const completionRate = item.actions ? (item.completedActions / item.actions) * 100 : 0;
                return (
                  <div key={name} className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100 hover:border-indigo-200 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">{name}</h3>
                      <span className="tag-indigo">{item.exps.length} 次实验</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-white">
                        <p className="text-xs text-slate-500 mb-1">总GMV</p>
                        <p className="font-bold text-slate-700">{formatCurrency(item.gmv)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white">
                        <p className="text-xs text-slate-500 mb-1">平均转化</p>
                        <p className="font-bold text-slate-700">{item.avgConversion.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">后续动作完成</span>
                        <span className="text-xs font-medium text-slate-700">{item.completedActions}/{item.actions}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            completionRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                            completionRate >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                            'bg-gradient-to-r from-rose-400 to-pink-500'
                          )}
                          style={{ width: `${Math.min(100, completionRate)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
