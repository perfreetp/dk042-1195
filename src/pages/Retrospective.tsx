import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, Heart, ShoppingCart, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Clock, User, Plus, X, Check,
  FileText, Lightbulb, FlaskConical, LayoutDashboard, BarChart3,
  Tag, MapPin, Package
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Severity, HypothesisVerdict } from '@/types';
import {
  formatNumber, formatCurrency, formatDateTime, getStatusText, getStatusColor,
  getSeverityColor, getSeverityText, getVerdictText, getVerdictColor, cn
} from '@/utils/helpers';

const generateId = () => Math.random().toString(36).substring(2, 11);

interface HypothesisVerdictEntry {
  hypothesisId: string;
  hypothesisText: string;
  verdict: HypothesisVerdict;
  note: string;
}

export function Retrospective() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();
  const { experiments, inspirations, retrospectives, products, addRetrospective, updateRetrospective, updateExperiment, toggleActionItem } = useAppStore();

  const experiment = useMemo(
    () => experiments.find((e) => e.id === experimentId),
    [experiments, experimentId]
  );

  const existingRetrospective = useMemo(
    () => retrospectives.find((r) => r.experimentId === experimentId),
    [retrospectives, experimentId]
  );

  const inspiration = useMemo(
    () => experiment ? inspirations.find((i) => i.id === experiment.inspirationId) : null,
    [experiment, inspirations]
  );

  const [actualMetrics, setActualMetrics] = useState({
    views: experiment?.actualMetrics?.views ?? 0,
    engagement: experiment?.actualMetrics?.engagement ?? 0,
    conversion: experiment?.actualMetrics?.conversion ?? 0,
    gmv: experiment?.actualMetrics?.gmv ?? 0,
  });

  const [hypothesisVerdicts, setHypothesisVerdicts] = useState<HypothesisVerdictEntry[]>(() => {
    if (existingRetrospective?.hypothesisVerdicts?.length) {
      return existingRetrospective.hypothesisVerdicts;
    }
    if (!experiment || !inspiration) return [];
    return experiment.hypothesisIds
      .map((hId) => {
        const item = inspiration.hypothesisItems.find((hi) => hi.id === hId);
        if (!item) return null;
        return {
          hypothesisId: item.id,
          hypothesisText: item.text,
          verdict: 'pending' as HypothesisVerdict,
          note: '',
        };
      })
      .filter(Boolean) as HypothesisVerdictEntry[];
  });

  const [issues, setIssues] = useState(existingRetrospective?.issues ?? []);
  const [actionItems, setActionItems] = useState(existingRetrospective?.actionItems ?? []);
  const [summary, setSummary] = useState(existingRetrospective?.summary ?? '');

  const [newIssue, setNewIssue] = useState<{ description: string; severity: Severity }>({ description: '', severity: 'medium' });
  const [showIssueForm, setShowIssueForm] = useState(false);

  const [newActionItem, setNewActionItem] = useState({ task: '', assignee: '', dueDate: '' });
  const [showActionForm, setShowActionForm] = useState(false);

  const [dashboardTab, setDashboardTab] = useState<'anchor' | 'festival' | 'category'>('anchor');

  const [saved, setSaved] = useState(false);

  const dashboardData = useMemo(() => {
    const completedExperiments = experiments.filter((e) => e.status === 'completed');
    const experimentRetrosMap = new Map(retrospectives.map((r) => [r.experimentId, r]));

    const buildGroups = (getKey: (exp: typeof completedExperiments[0], insp: typeof inspirations[0] | undefined) => string) => {
      const groups: Record<string, { experiments: typeof completedExperiments; retrospectives: typeof retrospectives }> = {};
      for (const exp of completedExperiments) {
        const insp = inspirations.find((i) => i.id === exp.inspirationId);
        const key = getKey(exp, insp);
        if (!key) continue;
        if (!groups[key]) groups[key] = { experiments: [], retrospectives: [] };
        groups[key].experiments.push(exp);
        const retro = experimentRetrosMap.get(exp.id);
        if (retro) groups[key].retrospectives.push(retro);
      }
      return Object.entries(groups).map(([key, data]) => {
        const totalGmv = data.experiments.reduce((sum, e) => sum + (e.actualMetrics?.gmv ?? 0), 0);
        const avgConversion = data.experiments.length > 0
          ? data.experiments.reduce((sum, e) => sum + (e.actualMetrics?.conversion ?? 0), 0) / data.experiments.length
          : 0;
        const allActionItems = data.retrospectives.flatMap((r) => r.actionItems);
        const completedActions = allActionItems.filter((a) => a.completed).length;
        const actionCompletionRate = allActionItems.length > 0
          ? Math.round((completedActions / allActionItems.length) * 100)
          : 0;
        return {
          key,
          experimentCount: data.experiments.length,
          totalGmv,
          avgConversion,
          actionCompletionRate,
          totalActionItems: allActionItems.length,
          completedActionItems: completedActions,
        };
      });
    };

    return {
      byAnchor: buildGroups((exp) => exp.anchorName),
      byFestival: buildGroups((_exp, insp) => insp?.festival || '未分类'),
      byCategory: buildGroups((_exp, insp) => {
        if (!insp) return '未分类';
        const cats = insp.relatedProducts
          .map((pid) => products.find((p) => p.id === pid)?.category)
          .filter(Boolean);
        return cats.length > 0 ? [...new Set(cats)].join('、') : '未分类';
      }),
    };
  }, [experiments, inspirations, retrospectives, products]);

  if (!experiment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-2">实验不存在</h2>
          <button onClick={() => navigate('/experiments')} className="btn-secondary">返回实验计划</button>
        </div>
      </div>
    );
  }

  const calculateDelta = (actual: number, expected: number) => {
    if (expected === 0) return 0;
    return ((actual - expected) / expected) * 100;
  };

  const handleAddIssue = () => {
    if (!newIssue.description.trim()) return;
    setIssues([...issues, { id: generateId(), description: newIssue.description, severity: newIssue.severity }]);
    setNewIssue({ description: '', severity: 'medium' });
    setShowIssueForm(false);
  };

  const handleRemoveIssue = (id: string) => {
    setIssues(issues.filter((i) => i.id !== id));
  };

  const handleAddActionItem = () => {
    if (!newActionItem.task.trim() || !newActionItem.assignee.trim()) return;
    setActionItems([
      ...actionItems,
      { id: generateId(), ...newActionItem, completed: false },
    ]);
    setNewActionItem({ task: '', assignee: '', dueDate: '' });
    setShowActionForm(false);
  };

  const handleRemoveActionItem = (id: string) => {
    setActionItems(actionItems.filter((a) => a.id !== id));
  };

  const handleToggleActionItem = (id: string) => {
    setActionItems(actionItems.map((a) => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const handleVerdictChange = (hypothesisId: string, verdict: HypothesisVerdict) => {
    setHypothesisVerdicts((prev) =>
      prev.map((hv) => hv.hypothesisId === hypothesisId ? { ...hv, verdict } : hv)
    );
  };

  const handleVerdictNoteChange = (hypothesisId: string, note: string) => {
    setHypothesisVerdicts((prev) =>
      prev.map((hv) => hv.hypothesisId === hypothesisId ? { ...hv, note } : hv)
    );
  };

  const handleSave = () => {
    updateExperiment(experiment.id, {
      status: 'completed',
      actualMetrics,
    });

    if (existingRetrospective) {
      updateRetrospective(existingRetrospective.id, {
        issues,
        actionItems,
        hypothesisVerdicts,
        summary,
      });
    } else {
      addRetrospective(experiment.id, {
        issues,
        actionItems,
        hypothesisVerdicts,
        summary,
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const metricsData = [
    {
      key: 'views',
      label: '观看人数',
      icon: Eye,
      color: 'indigo',
      actual: actualMetrics.views,
      expected: experiment.expectedMetrics.views,
      format: (v: number) => formatNumber(v),
    },
    {
      key: 'engagement',
      label: '互动率',
      icon: Heart,
      color: 'rose',
      actual: actualMetrics.engagement,
      expected: experiment.expectedMetrics.engagement,
      format: (v: number) => `${v}%`,
      suffix: '%',
    },
    {
      key: 'conversion',
      label: '转化率',
      icon: ShoppingCart,
      color: 'emerald',
      actual: actualMetrics.conversion,
      expected: experiment.expectedMetrics.conversion,
      format: (v: number) => `${v}%`,
      suffix: '%',
    },
    {
      key: 'gmv',
      label: 'GMV',
      icon: DollarSign,
      color: 'amber',
      actual: actualMetrics.gmv,
      expected: experiment.expectedMetrics.gmv,
      format: (v: number) => formatCurrency(v),
    },
  ];

  const verdictOptions: HypothesisVerdict[] = ['confirmed', 'refuted', 'inconclusive', 'pending'];

  const currentDashboardData = dashboardTab === 'anchor'
    ? dashboardData.byAnchor
    : dashboardTab === 'festival'
      ? dashboardData.byFestival
      : dashboardData.byCategory;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">实验复盘</h1>
                <span className={getStatusColor(experiment.status)}>{getStatusText(experiment.status)}</span>
              </div>
              <p className="text-xs text-slate-500">{experiment.title}</p>
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary gap-2">
            <Check className="w-4 h-4" />
            {saved ? '已保存 ✓' : '保存复盘'}
          </button>
        </div>
      </div>

      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        {inspiration && (
          <div className="card p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-glow-orange shrink-0">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-1">验证灵感</p>
              <p className="font-bold text-slate-800 truncate">{inspiration.title}</p>
            </div>
            <button
              onClick={() => navigate(`/inspiration/${inspiration.id}`)}
              className="btn-ghost text-sm py-2"
            >
              查看详情
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-5 md:col-span-2">
            <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-5">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              数据对比：预期 vs 实际
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {metricsData.map(({ key, label, icon: Icon, color, actual, expected, format }) => {
                const delta = calculateDelta(actual, expected);
                const isPositive = delta >= 0;
                return (
                  <div
                    key={key}
                    className={cn(
                      'p-5 rounded-2xl border transition-all',
                      isPositive
                        ? `bg-${color}-50/50 border-${color}-100`
                        : 'bg-rose-50/50 border-rose-100'
                    )}
                    style={isPositive ? {
                      backgroundColor: color === 'indigo' ? 'rgba(99,102,241,0.05)' :
                        color === 'rose' ? 'rgba(244,63,94,0.05)' :
                        color === 'emerald' ? 'rgba(16,185,129,0.05)' :
                        'rgba(245,158,11,0.05)',
                      borderColor: color === 'indigo' ? 'rgba(99,102,241,0.1)' :
                        color === 'rose' ? 'rgba(244,63,94,0.1)' :
                        color === 'emerald' ? 'rgba(16,185,129,0.1)' :
                        'rgba(245,158,11,0.1)'
                    } : {}}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center',
                          color === 'indigo' && 'bg-indigo-100 text-indigo-600',
                          color === 'rose' && 'bg-rose-100 text-rose-600',
                          color === 'emerald' && 'bg-emerald-100 text-emerald-600',
                          color === 'amber' && 'bg-amber-100 text-amber-600'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{label}</span>
                    </div>

                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-xs text-slate-500">实际</p>
                        <input
                          type="number"
                          step={key === 'views' || key === 'gmv' ? 100 : 0.1}
                          value={actual}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setActualMetrics({ ...actualMetrics, [key]: val });
                          }}
                          className={cn(
                            'text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-32',
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          )}
                        />
                      </div>
                      <div className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1',
                        isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      )}>
                        {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>预期: {format(expected)}</span>
                      <div className="flex-1 mx-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isPositive
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                              : 'bg-gradient-to-r from-rose-400 to-pink-500'
                          )}
                          style={{ width: `${Math.min(100, (actual / Math.max(expected, 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                实验信息
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">主播：<span className="font-medium text-slate-800">{experiment.anchorName}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">试播时间：<span className="font-medium text-slate-800">{formatDateTime(experiment.scheduledTime)}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hypothesisVerdicts.length > 0 && (
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-5">
              <FlaskConical className="w-5 h-5 text-violet-500" />
              假设验证结论
            </h2>
            <div className="space-y-4">
              {hypothesisVerdicts.map((hv) => (
                <div key={hv.hypothesisId} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 mb-3">{hv.hypothesisText}</p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {verdictOptions.map((v) => (
                          <button
                            key={v}
                            onClick={() => handleVerdictChange(hv.hypothesisId, v)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                              hv.verdict === v
                                ? getVerdictColor(v)
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                          >
                            {getVerdictText(v)}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={hv.note}
                        onChange={(e) => handleVerdictNoteChange(hv.hypothesisId, e.target.value)}
                        placeholder="添加验证备注（如具体数据、观察结论）..."
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                问题清单 ({issues.length})
              </h2>
              <button
                onClick={() => setShowIssueForm(!showIssueForm)}
                className="btn-ghost text-sm py-1.5 gap-1"
              >
                <Plus className="w-4 h-4" />
                添加问题
              </button>
            </div>

            {showIssueForm && (
              <div className="p-4 rounded-2xl bg-slate-50 mb-4 animate-slide-up space-y-3">
                <textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  placeholder="描述遇到的问题..."
                  rows={2}
                  className="input-field resize-none text-sm"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setNewIssue({ ...newIssue, severity: sev })}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          newIssue.severity === sev
                            ? getSeverityColor(sev)
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        )}
                      >
                        {getSeverityText(sev)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowIssueForm(false)} className="btn-ghost text-sm py-1.5">取消</button>
                    <button onClick={handleAddIssue} className="btn-secondary text-sm py-1.5">添加</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {issues.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">暂无问题记录</p>
              ) : (
                issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 group animate-slide-up"
                  >
                    <span className={`${getSeverityColor(issue.severity)} shrink-0 mt-0.5`}>
                      {getSeverityText(issue.severity)}
                    </span>
                    <p className="text-sm text-slate-700 flex-1">{issue.description}</p>
                    <button
                      onClick={() => handleRemoveIssue(issue.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                后续动作 ({actionItems.filter((a) => a.completed).length}/{actionItems.length})
              </h2>
              <button
                onClick={() => setShowActionForm(!showActionForm)}
                className="btn-ghost text-sm py-1.5 gap-1"
              >
                <Plus className="w-4 h-4" />
                添加任务
              </button>
            </div>

            {showActionForm && (
              <div className="p-4 rounded-2xl bg-slate-50 mb-4 animate-slide-up space-y-3">
                <input
                  type="text"
                  value={newActionItem.task}
                  onChange={(e) => setNewActionItem({ ...newActionItem, task: e.target.value })}
                  placeholder="任务内容"
                  className="input-field text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newActionItem.assignee}
                    onChange={(e) => setNewActionItem({ ...newActionItem, assignee: e.target.value })}
                    placeholder="负责人"
                    className="input-field text-sm"
                  />
                  <input
                    type="date"
                    value={newActionItem.dueDate}
                    onChange={(e) => setNewActionItem({ ...newActionItem, dueDate: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowActionForm(false)} className="btn-ghost text-sm py-1.5">取消</button>
                  <button onClick={handleAddActionItem} className="btn-secondary text-sm py-1.5">添加</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {actionItems.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">暂无待办任务</p>
              ) : (
                actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl group transition-all',
                      item.completed ? 'bg-emerald-50/50' : 'bg-slate-50'
                    )}
                  >
                    <button
                      onClick={() => handleToggleActionItem(item.id)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                        item.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 hover:border-emerald-400'
                      )}
                    >
                      {item.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        item.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                      )}>
                        {item.task}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.assignee}
                        </span>
                        {item.dueDate && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveActionItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-4">
            <FileText className="w-5 h-5 text-indigo-500" />
            复盘总结与经验沉淀
          </h2>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="总结本次实验的成功经验、不足之处，以及可复用的方法论和注意事项..."
            rows={6}
            className="input-field resize-none"
          />
          <p className="text-xs text-slate-400 mt-2">
            💡 好的复盘应该包含：数据结论、关键成功因素、失败教训、可复用SOP、后续优化建议
          </p>
        </div>

        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-5">
            <LayoutDashboard className="w-5 h-5 text-cyan-500" />
            团队复盘看板
          </h2>
          <p className="text-xs text-slate-400 mb-4">汇总所有已完成实验的复盘数据，按维度聚合分析</p>

          <div className="flex gap-2 mb-5">
            {([
              { key: 'anchor' as const, label: '按主播', icon: User },
              { key: 'festival' as const, label: '按节日', icon: MapPin },
              { key: 'category' as const, label: '按品类', icon: Package },
            ]).map(({ key, label, icon: TabIcon }) => (
              <button
                key={key}
                onClick={() => setDashboardTab(key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  dashboardTab === key
                    ? 'bg-cyan-100 text-cyan-700 shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                <TabIcon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {currentDashboardData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">暂无已完成的实验数据</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentDashboardData.map((group) => (
                <div
                  key={group.key}
                  className="p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-4">
                    {dashboardTab === 'anchor' && <User className="w-4 h-4 text-cyan-500" />}
                    {dashboardTab === 'festival' && <MapPin className="w-4 h-4 text-rose-400" />}
                    {dashboardTab === 'category' && <Tag className="w-4 h-4 text-amber-500" />}
                    <h3 className="font-bold text-slate-800 text-sm truncate">{group.key}</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">实验数</span>
                      <span className="text-sm font-bold text-slate-800">{group.experimentCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">总 GMV</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(group.totalGmv)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">平均转化率</span>
                      <span className="text-sm font-bold text-indigo-600">{group.avgConversion.toFixed(1)}%</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">动作完成率</span>
                        <span className="text-xs font-bold text-slate-700">
                          {group.completedActionItems}/{group.totalActionItems} ({group.actionCompletionRate}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            group.actionCompletionRate >= 80
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                              : group.actionCompletionRate >= 50
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                                : 'bg-gradient-to-r from-rose-400 to-pink-500'
                          )}
                          style={{ width: `${group.actionCompletionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
