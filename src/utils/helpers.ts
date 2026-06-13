import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { MaterialImageItem } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString('zh-CN');
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(dateStr);
}

export function getDaysRemaining(deletedAtStr: string): number {
  const deleted = new Date(deletedAtStr);
  const now = new Date();
  const msPerDay = 86400000;
  const diff = 30 - Math.floor((now.getTime() - deleted.getTime()) / msPerDay);
  return Math.max(0, diff);
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    reviewing: '评审中',
    approved: '已通过',
    experimenting: '实验中',
    completed: '已完成',
    archived: '已归档',
    incomplete: '待补全',
    scheduled: '待执行',
    ongoing: '进行中',
    cancelled: '已取消',
    bundle: '灵感包',
  };
  return statusMap[status] || status;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'tag-amber',
    reviewing: 'tag-indigo',
    approved: 'tag-green',
    experimenting: 'tag-orange',
    completed: 'tag-green',
    archived: 'tag-red',
    incomplete: 'tag-amber',
    scheduled: 'tag-indigo',
    ongoing: 'tag-orange',
    cancelled: 'tag-red',
    bundle: 'tag-indigo',
  };
  return colorMap[status] || 'tag-indigo';
}

export function getVerdictText(verdict: string): string {
  const map: Record<string, string> = {
    confirmed: '已验证',
    refuted: '已推翻',
    inconclusive: '不确定',
    pending: '待验证',
  };
  return map[verdict] || verdict;
}

export function getVerdictColor(verdict: string): string {
  const map: Record<string, string> = {
    confirmed: 'tag-green',
    refuted: 'tag-red',
    inconclusive: 'tag-amber',
    pending: 'tag-indigo',
  };
  return map[verdict] || 'tag-indigo';
}

export function getSeverityColor(severity: string): string {
  const colorMap: Record<string, string> = {
    low: 'tag-green',
    medium: 'tag-amber',
    high: 'tag-red',
  };
  return colorMap[severity] || 'tag-indigo';
}

export function getSeverityText(severity: string): string {
  const textMap: Record<string, string> = {
    low: '轻微',
    medium: '中等',
    high: '严重',
  };
  return textMap[severity] || severity;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function toMaterialImage(url: string | MaterialImageItem, idx = 0): MaterialImageItem {
  if (typeof url === 'string') {
    return { id: `img-${generateId()}`, url, caption: '' };
  }
  return url;
}

export function normalizeMaterialImages(arr: Array<string | MaterialImageItem>): MaterialImageItem[] {
  return arr.map((item) => (typeof item === 'string' ? toMaterialImage(item) : item));
}
