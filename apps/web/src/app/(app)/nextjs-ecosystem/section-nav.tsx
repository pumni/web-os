'use client';

import { BookOpen, Layers, Zap, ShieldAlert, FlaskConical, Database } from 'lucide-react';

import { SectionNav } from '@/shared/components/section-nav';


const ECOSYSTEM_SECTIONS = [
  { id: 'overview', label: 'Tổng Quan', icon: BookOpen },
  { id: 'architecture', label: 'Kiến Trúc Cốt Lõi', icon: Layers },
  { id: 'caching', label: 'Bộ Nhớ Đệm', icon: Database },
  { id: 'performance', label: 'Hiệu Năng', icon: Zap },
  { id: 'security', label: 'Bảo Mật & Vận Hành', icon: ShieldAlert },
  { id: 'ai-strategy', label: 'AI & Tooling', icon: FlaskConical },
] as const;

export function EcosystemSectionNav() {
  return (
    <SectionNav
      sections={ECOSYSTEM_SECTIONS}
      viewTransition={false}
      className="-mx-4 px-4 sm:-mx-6 sm:px-6"
      labelClassName="hidden sm:inline"
    />
  );
}
