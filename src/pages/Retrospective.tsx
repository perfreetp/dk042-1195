import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, Heart, ShoppingCart, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle, Clock, User, Plus, X, Check,
  FileText, Lightbulb
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Severity } from '@/types';
import {
  formatNumber, formatCurrency, formatDateTime, getStatusText, getStatusColor,
  getSeverityColor, getSeverityText, cn
} from '@/utils/helpers';

const generateId = () => Math.random().toString(36).substring(2, 11);

export function Retrospective() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();
  const { experiments, inspirations, retrospectives, addRetrospective, updateRetrospective, updateExperiment, toggleActionItem } = useAppStore();

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

  const [issues, setIssues] = useState(existingRetrospective?.issues ?? []);
  const [actionItems, setActionItems] = useState(existingRetrospective?.actionItems ?? []);
  const [summary, setSummary] = useState(existingRetrospective?.summary ?? '');

  const [newIssue, setNewIssue] = useState<{ description: string; severity: Severity }>({ description: '', severity: 'medium' });
  const [showIssueForm, setShowIssueForm] = useState(false);

  const [newActionItem, setNewActionItem] = useState({ task: '', assignee: '', dueDate: '' });
  const [showActionForm, setShowActionForm] = useState(false);

  const [saved, setSaved] = useState(false);

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

  const handleSave = () => {
    updateExperiment(experiment.id, {
      status: 'completed',
      actualMetrics,
    });

    if (existingRetrospective) {
      updateRetrospective(existingRetrospective.id, {
        issues,
        actionItems,
        summary,
      });
    } else {
      addRetrospective(experiment.id, {
        issues,
        actionItems,
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
      </div>
    </div>
  );
}
