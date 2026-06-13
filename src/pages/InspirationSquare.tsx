import { useState, useMemo, useRef } from 'react';
import { Search, Plus, SlidersHorizontal, TrendingUp, Clock, Heart, Filter, X, Link as LinkIcon, Image, Database, RotateCcw, Trash2, Upload, Undo2, Trash } from 'lucide-react';
import { useAppStore } from '@/store';
import { InspirationCard } from '@/components/features/InspirationCard';
import { cn, generateId, getDaysRemaining, getRelativeTime } from '@/utils/helpers';
import type { MaterialImageItem } from '@/types';

const festivals = ['618年中大促', '双11', '双12', '端午节', '七夕节', '春节', '无'];
const audiences = ['25-35岁都市白领女性', '注重健康品质的家庭用户', '0-3岁宝宝新手妈妈', '18-25岁二次元爱好者', '理性消费的品质追求者', '追求性价比的羊毛党'];
const popularTags = ['互动玩法', '促销策略', '美妆类目', '内容创新', '产地溯源', '生鲜类目', '专家连麦', '虚拟主播', '真实测评', '全品类', '限时玩法'];

type TabKey = 'square' | 'recycle';

export function InspirationSquare() {
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('square');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    festival: '',
    targetAudience: '',
    estimatedCost: 0,
    tags: [] as string[],
    tagInput: '',
    referenceLinks: [] as string[],
    materialImages: [] as MaterialImageItem[],
    linkInput: '',
    imageInput: '',
  });

  const {
    inspirations,
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
    sortBy,
    setSortBy,
    addInspiration,
    resetToMockData,
    clearAllData,
    restoreInspiration,
    permanentlyDeleteInspiration,
  } = useAppStore();

  const filteredInspirations = useMemo(() => {
    let result = [...inspirations];

    if (activeTab === 'recycle') {
      result = result.filter((ins) => ins.isDeleted);
    } else {
      result = result.filter((ins) => !ins.isDeleted);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ins) =>
          ins.title.toLowerCase().includes(q) ||
          ins.description.toLowerCase().includes(q) ||
          ins.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((ins) => selectedTags.some((tag) => ins.tags.includes(tag)));
    }

    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'favorites':
        result.sort((a, b) => b.favorites - a.favorites);
        break;
      case 'score':
        result.sort((a, b) => (b.feasibilityScore || 0) - (a.feasibilityScore || 0));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [inspirations, searchQuery, selectedTags, sortBy, activeTab]);

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, formData.tagInput.trim()], tagInput: '' });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleAddLink = () => {
    if (formData.linkInput.trim() && !formData.referenceLinks.includes(formData.linkInput.trim())) {
      setFormData({ ...formData, referenceLinks: [...formData.referenceLinks, formData.linkInput.trim()], linkInput: '' });
    }
  };

  const handleRemoveLink = (link: string) => {
    setFormData({ ...formData, referenceLinks: formData.referenceLinks.filter((l) => l !== link) });
  };

  const handleAddImage = () => {
    if (formData.imageInput.trim() && !formData.materialImages.find((m) => m.url === formData.imageInput.trim())) {
      const newItem: MaterialImageItem = {
        id: `img-${generateId()}`,
        url: formData.imageInput.trim(),
        caption: '',
      };
      setFormData({ ...formData, materialImages: [...formData.materialImages, newItem], imageInput: '' });
    }
  };

  const handleRemoveImage = (imgId: string) => {
    setFormData({ ...formData, materialImages: formData.materialImages.filter((i) => i.id !== imgId) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataURL = reader.result as string;
        const newItem: MaterialImageItem = {
          id: `img-${generateId()}`,
          url: dataURL,
          caption: '',
        };
        setFormData((prev) => ({
          ...prev,
          materialImages: [...prev.materialImages, newItem],
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    addInspiration({
      title: formData.title,
      description: formData.description,
      festival: formData.festival,
      targetAudience: formData.targetAudience,
      estimatedCost: formData.estimatedCost,
      tags: formData.tags,
      referenceLinks: formData.referenceLinks,
      materialImages: formData.materialImages,
    });
    setFormData({ title: '', description: '', festival: '', targetAudience: '', estimatedCost: 0, tags: [], tagInput: '', referenceLinks: [], materialImages: [], linkInput: '', imageInput: '' });
    setShowCreateModal(false);
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可撤销。')) {
      clearAllData();
    }
  };

  const handleRestore = (id: string) => {
    restoreInspiration(id);
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm('确定要彻底删除该灵感吗？此操作无法撤销。')) {
      permanentlyDeleteInspiration(id);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern bg-grid">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between gap-6 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                <span className="gradient-text">灵感广场</span>
              </h1>
              <p className="text-sm text-slate-500">探索团队智慧，让每一个好点子都闪闪发光</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'btn-ghost gap-2',
                  showFilters && 'bg-indigo-50 text-brand-primary border-indigo-200'
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                筛选
              </button>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary gap-2">
                <Plus className="w-4 h-4" />
                提交新灵感
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索灵感标题、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all duration-200 text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              {[
                { key: 'latest', label: '最新', icon: Clock },
                { key: 'popular', label: '最火', icon: TrendingUp },
                { key: 'favorites', label: '收藏', icon: Heart },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                    sortBy === key
                      ? 'bg-brand-primary text-white shadow-glow-indigo'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="px-8 pb-5 border-t border-slate-100 pt-5 animate-slide-up">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">热门标签</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                        selectedTags.includes(tag)
                          ? 'bg-gradient-to-r from-brand-primary to-indigo-600 text-white shadow-glow-indigo'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">已选：</span>
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium hover:bg-indigo-200 transition-colors"
                    >
                      {tag}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-8 pb-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('square')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                activeTab === 'square'
                  ? 'bg-brand-primary text-white shadow-glow-indigo'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              广场灵感
            </button>
            <button
              onClick={() => setActiveTab('recycle')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                activeTab === 'recycle'
                  ? 'bg-brand-primary text-white shadow-glow-indigo'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <Trash2 className="w-4 h-4" />
              回收站
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            共找到 <span className="font-bold text-brand-primary">{filteredInspirations.length}</span> 个{activeTab === 'recycle' ? '已删除的' : ''}灵感
          </p>
        </div>

        {filteredInspirations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
              <Search className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {activeTab === 'recycle' ? '回收站是空的' : '暂无匹配的灵感'}
            </h3>
            <p className="text-sm text-slate-500">
              {activeTab === 'recycle' ? '删除的灵感会在这里保留30天' : '试试换个关键词或清除筛选条件'}
            </p>
          </div>
        ) : activeTab === 'recycle' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredInspirations.map((ins, index) => {
              const daysRemaining = ins.deletedAt ? getDaysRemaining(ins.deletedAt) : 0;
              const deletedAgo = ins.deletedAt ? getRelativeTime(ins.deletedAt) : '';
              return (
                <div
                  key={ins.id}
                  className="card overflow-hidden group animate-slide-up opacity-90"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    {ins.coverImage ? (
                      <img
                        src={ins.coverImage}
                        alt={ins.title}
                        className="w-full h-full object-cover grayscale opacity-70"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                        <span className="text-4xl">💡</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {ins.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag tag-indigo backdrop-blur-sm bg-white/80">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="tag tag-red backdrop-blur-sm bg-white/80">
                        已删除
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-slate-600 text-base mb-2 line-clamp-2">
                      {ins.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{ins.description}</p>

                    <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-red-50 border border-red-100">
                      <Trash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs text-red-600 font-medium">
                          删除于 {deletedAgo}
                        </span>
                        <span className="text-xs text-red-500">
                          剩余 <span className="font-bold">{daysRemaining}</span> 天后自动清除
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          daysRemaining > 15 ? 'bg-green-500' : daysRemaining > 5 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${(daysRemaining / 30) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <img
                          src={ins.creatorAvatar}
                          alt={ins.creatorName}
                          className="w-7 h-7 rounded-full bg-indigo-100 grayscale"
                        />
                        <div>
                          <p className="text-xs font-medium text-slate-500">{ins.creatorName}</p>
                          <p className="text-xs text-slate-400">{getRelativeTime(ins.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore(ins.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all duration-200"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          还原
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(ins.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          彻底删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredInspirations.map((ins, index) => (
              <InspirationCard key={ins.id} inspiration={ins} delay={index * 50} />
            ))}
          </div>
        )}
      </div>

      <div className="px-8 pb-8">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">数据管理</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={resetToMockData} className="btn-ghost gap-2 text-sm">
              <RotateCcw className="w-3.5 h-3.5" />
              补回示例灵感
            </button>
            <button onClick={handleClearAll} className="btn-ghost gap-2 text-sm text-red-600 hover:bg-red-50 hover:border-red-200">
              <Trash2 className="w-3.5 h-3.5" />
              清空所有数据
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">提交新灵感</h2>
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">灵感标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="给你的灵感起个响亮的名字"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">详细描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细描述你的创意玩法、活动形式或商品组合思路..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">适用节日</label>
                  <select
                    value={formData.festival}
                    onChange={(e) => setFormData({ ...formData, festival: e.target.value })}
                    className="input-field"
                  >
                    <option value="">选择节日</option>
                    {festivals.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">预估成本 (元)</label>
                  <input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">目标人群</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="input-field"
                >
                  <option value="">选择目标人群</option>
                  {audiences.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">标签</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.tagInput}
                    onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="输入标签后按回车添加"
                    className="input-field flex-1"
                  />
                  <button onClick={handleAddTag} className="btn-ghost">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-indigo-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <LinkIcon className="w-3.5 h-3.5 inline mr-1" />
                  参考链接
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.linkInput}
                    onChange={(e) => setFormData({ ...formData, linkInput: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                    placeholder="输入链接后按回车添加"
                    className="input-field flex-1"
                  />
                  <button onClick={handleAddLink} className="btn-ghost">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.referenceLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.referenceLinks.map((link) => (
                      <span key={link} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium max-w-full">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{link}</span>
                        <button onClick={() => handleRemoveLink(link)} className="hover:text-blue-900 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <Image className="w-3.5 h-3.5 inline mr-1" />
                  素材图片
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.imageInput}
                    onChange={(e) => setFormData({ ...formData, imageInput: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                    placeholder="输入图片URL后按回车添加"
                    className="input-field flex-1"
                  />
                  <button onClick={handleAddImage} className="btn-ghost">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    上传本地图片
                  </button>
                </div>
                {formData.materialImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.materialImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.url}
                          alt="素材"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%23cbd5e1"><rect width="64" height="64"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%2394a3b8">✕</text></svg>'; }}
                        />
                        <button
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost">取消</button>
              <button onClick={handleSubmit} className="btn-primary">提交灵感</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
