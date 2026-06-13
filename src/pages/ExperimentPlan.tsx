import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, X, Calendar, User, Eye, Heart, ShoppingCart, DollarSign,
  Clock, ChevronLeft, ChevronRight, CheckCircle, Play, FileText, Lightbulb, FlaskConical
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, formatDateTime, formatCurrency, formatNumber, getStatusText, getStatusColor, cn } from '@/utils/helpers';

interface LocationState {
  inspirationId?: string;
  hypothesisText?: string;
  hypothesisId?: string;
}

export function ExperimentPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { experiments, inspirations, anchors, addExperiment } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    inspirationId: '',
    title: '',
    scheduledDate: '',
    scheduledTime: '20:00',
    anchorId: '',
    anchorName: '',
    views: 10000,
    engagement: 5,
    conversion: 3,
    gmv: 50000,
    hypothesisIds: [] as string[],
    hypothesisText: '',
  });

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.inspirationId) {
      const ins = inspirations.find((i) => i.id === state.inspirationId);
      setFormData((prev) => ({
        ...prev,
        inspirationId: state.inspirationId!,
        title: ins ? `${ins.title} - 试播实验` : prev.title,
        hypothesisText: state.hypothesisText || '',
        hypothesisIds: state.hypothesisId ? [state.hypothesisId] : [],
      }));
      setShowCreateModal(true);
      window.history.replaceState({}, '');
    }
  }, [location.state, inspirations]);

  const weekDays = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + currentWeekOffset * 7);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentWeekOffset]);

  const filteredExperiments = useMemo(() => {
    if (activeFilter === 'all') return experiments;
    return experiments.filter((e) => e.status === activeFilter);
  }, [experiments, activeFilter]);

  const selectedInspiration = inspirations.find((i) => i.id === formData.inspirationId);

  const handleAnchorSelect = (anchorId: string, anchorName: string) => {
    setFormData({ ...formData, anchorId, anchorName });
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.inspirationId || !formData.scheduledDate || !formData.anchorId) return;
    const scheduledTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`).toISOString();
    addExperiment({
      inspirationId: formData.inspirationId,
      title: formData.title,
      scheduledTime,
      anchorId: formData.anchorId,
      anchorName: formData.anchorName,
      hypothesisIds: formData.hypothesisIds,
      expectedMetrics: {
        views: formData.views,
        engagement: formData.engagement,
        conversion: formData.conversion,
        gmv: formData.gmv,
      },
    });
    setFormData({
      inspirationId: '', title: '', scheduledDate: '', scheduledTime: '20:00',
      anchorId: '', anchorName: '', views: 10000, engagement: 5, conversion: 3, gmv: 50000,
      hypothesisIds: [], hypothesisText: '',
    });
    setShowCreateModal(false);
  };

  const getExperimentsForDay = (date: Date) => {
    return filteredExperiments.filter((exp) => {
      const expDate = new Date(exp.scheduledTime);
      return expDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <div className="min-h-screen bg-grid-pattern bg-grid">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                <span className="gradient-text">实验计划</span>
              </h1>
              <p className="text-sm text-slate-500">安排试播计划，让创意在实战中验证价值</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary gap-2">
              <Plus className="w-4 h-4" />
              新建实验计划
            </button>
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'scheduled', label: '待执行' },
              { key: 'ongoing', label: '进行中' },
              { key: 'completed', label: '已完成' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  'px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200',
                  activeFilter === key
                    ? 'bg-gradient-to-r from-brand-primary to-indigo-600 text-white shadow-glow-indigo'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              试播排期日历
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-slate-700 px-2">
                {formatDate(weekDays[0].toISOString())} - {formatDate(weekDays[6].toISOString())}
              </span>
              <button
                onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentWeekOffset(0)}
                className="btn-ghost text-sm py-1.5 ml-2"
              >
                本周
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-2xl border p-3 min-h-[140px] transition-all',
                  isToday(day)
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
                    : 'bg-white border-slate-100'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500">{dayNames[idx]}</p>
                    <p className={cn(
                      'text-lg font-bold',
                      isToday(day) ? 'text-brand-primary' : 'text-slate-700'
                    )}>
                      {day.getDate()}
                    </p>
                  </div>
                  {isToday(day) && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary text-white">今天</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {getExperimentsForDay(day).slice(0, 3).map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() =>
                        exp.status === 'completed'
                          ? navigate(`/retrospective/${exp.id}`)
                          : null
                      }
                      className={cn(
                        'w-full text-left p-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]',
                        exp.status === 'scheduled' && 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
                        exp.status === 'ongoing' && 'bg-orange-100 text-orange-700 hover:bg-orange-200 animate-pulse-soft',
                        exp.status === 'completed' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      )}
                    >
                      <p className="truncate">{exp.title}</p>
                      <p className="text-[10px] opacity-70">{exp.anchorName}</p>
                    </button>
                  ))}
                  {getExperimentsForDay(day).length > 3 && (
                    <p className="text-[10px] text-slate-400 text-center">+{getExperimentsForDay(day).length - 3} 更多</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiments.map((exp, index) => {
            const inspiration = inspirations.find((i) => i.id === exp.inspirationId);
            const matchedHypotheses = inspiration?.hypothesisItems.filter((h) =>
              exp.hypothesisIds.includes(h.id)
            ) || [];
            return (
              <div
                key={exp.id}
                className="card overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  'h-2',
                  exp.status === 'scheduled' && 'bg-gradient-to-r from-indigo-400 to-purple-500',
                  exp.status === 'ongoing' && 'bg-gradient-to-r from-orange-400 to-amber-500',
                  exp.status === 'completed' && 'bg-gradient-to-r from-emerald-400 to-teal-500',
                  exp.status === 'cancelled' && 'bg-gradient-to-r from-slate-300 to-slate-400'
                )} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-slate-800 flex-1">{exp.title}</h3>
                    <span className={getStatusColor(exp.status)}>{getStatusText(exp.status)}</span>
                  </div>

                  {inspiration && (
                    <button
                      onClick={() => navigate(`/inspiration/${inspiration.id}`)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100 mb-4 w-full hover:border-orange-200 transition-colors text-left"
                    >
                      <Lightbulb className="w-4 h-4 text-brand-secondary shrink-0" />
                      <p className="text-sm font-medium text-slate-700 truncate flex-1">关联灵感：{inspiration.title}</p>
                    </button>
                  )}

                  {matchedHypotheses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {matchedHypotheses.map((h) => (
                        <span
                          key={h.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-medium text-purple-700"
                        >
                          <FlaskConical className="w-3 h-3" />
                          {h.text}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{formatDateTime(exp.scheduledTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>主播：{exp.anchorName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                      <Eye className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">预期观看</p>
                      <p className="font-bold text-slate-700">{formatNumber(exp.expectedMetrics.views)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                      <Heart className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">互动率</p>
                      <p className="font-bold text-slate-700">{exp.expectedMetrics.engagement}%</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                      <ShoppingCart className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">转化率</p>
                      <p className="font-bold text-slate-700">{exp.expectedMetrics.conversion}%</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                      <DollarSign className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">预期GMV</p>
                      <p className="font-bold text-slate-700">{formatNumber(exp.expectedMetrics.gmv)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {exp.status === 'completed' ? (
                      <button
                        onClick={() => navigate(`/retrospective/${exp.id}`)}
                        className="btn-secondary flex-1 text-sm gap-2 py-2"
                      >
                        <FileText className="w-4 h-4" />
                        查看复盘
                      </button>
                    ) : (
                      <>
                        <button className="btn-ghost flex-1 text-sm gap-2 py-2">
                          <Play className="w-4 h-4" />
                          开始试播
                        </button>
                        {exp.status === 'scheduled' && (
                          <button
                            onClick={() => navigate(`/retrospective/${exp.id}`)}
                            className="btn-secondary text-sm gap-2 py-2 px-3"
                          >
                            <FileText className="w-4 h-4" />
                            复盘
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">新建实验计划</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">关联灵感 *</label>
                <select
                  value={formData.inspirationId}
                  onChange={(e) => {
                    const ins = inspirations.find((i) => i.id === e.target.value);
                    setFormData({
                      ...formData,
                      inspirationId: e.target.value,
                      title: ins ? `${ins.title} - 试播实验` : formData.title,
                      hypothesisIds: [],
                      hypothesisText: '',
                    });
                  }}
                  className="input-field"
                >
                  <option value="">选择要验证的灵感</option>
                  {inspirations.filter((i) => i.status === 'approved' || i.status === 'experimenting').map((ins) => (
                    <option key={ins.id} value={ins.id}>{ins.title}</option>
                  ))}
                </select>
              </div>

              {formData.hypothesisText && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-purple-500" />
                    验证假设
                  </label>
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                    <p className="text-sm text-purple-800">{formData.hypothesisText}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">实验标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="给这次实验起个名字"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">试播日期 *</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">开始时间</label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">选择主播 *</label>
                <div className="grid grid-cols-2 gap-3">
                  {anchors.map((anchor) => (
                    <button
                      key={anchor.id}
                      onClick={() => handleAnchorSelect(anchor.id, anchor.name)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                        formData.anchorId === anchor.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      )}
                    >
                      <img src={anchor.avatar} alt={anchor.name} className="w-10 h-10 rounded-full bg-slate-100" />
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">{anchor.name}</p>
                        <p className="text-xs text-slate-500">{anchor.specialty}</p>
                      </div>
                      {formData.anchorId === anchor.id && (
                        <CheckCircle className="w-5 h-5 text-indigo-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  预期指标设定
                </label>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">预期观看人数</label>
                    <input
                      type="number"
                      value={formData.views}
                      onChange={(e) => setFormData({ ...formData, views: Number(e.target.value) })}
                      className="input-field text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">预期互动率 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.engagement}
                      onChange={(e) => setFormData({ ...formData, engagement: Number(e.target.value) })}
                      className="input-field text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">预期转化率 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.conversion}
                      onChange={(e) => setFormData({ ...formData, conversion: Number(e.target.value) })}
                      className="input-field text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">预期GMV (元)</label>
                    <input
                      type="number"
                      value={formData.gmv}
                      onChange={(e) => setFormData({ ...formData, gmv: Number(e.target.value) })}
                      className="input-field text-sm py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost">取消</button>
              <button onClick={handleSubmit} className="btn-primary">创建计划</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
