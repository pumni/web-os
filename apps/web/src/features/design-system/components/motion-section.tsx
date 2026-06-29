'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion, useReducedMotion, MotionConfig } from '@pumni/ui/lib/motion-primitives';
import { Button, Slider, SegmentedPicker, Switch, Checkbox } from '@pumni/ui/form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardWell,
} from '@pumni/ui/layout';
import { Window } from '@pumni/ui/os';
import { Skeleton } from '@pumni/ui/feedback';
import {
  easing,
  entranceYLarge,
  motionTokens,
  parallaxRate,
  recipes,
  springs,
  staggerFast,
  staggerSlow,
  transition,
} from '@pumni/ui/lib/motion';
import { withViewTransition } from '@pumni/ui/lib/view-transition';
import { ShowcaseSection } from './showcase-section';
import { cn } from '@pumni/ui/lib/cn';
import {
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Code,
  Move,
  Sparkles,
  MousePointer,
  HelpCircle,
  Menu,
  ArrowLeft,
  BookOpen,
  Search,
  Activity,
  Layers,
  Settings,
  X,
} from 'lucide-react';

// ─── View Transitions Mock Dataset ─────────────────────────────────────────
const VT_ARTICLES = [
  {
    id: 'art-1',
    title: 'Designing Fluid Motion Systems',
    category: 'Design',
    readTime: '3 min read',
    color: 'bg-indigo-500 text-indigo-50',
    avatarChar: 'M',
    snippet: 'Exploring stiffness and damping to craft natural interface physics.',
    body: 'Spring-based physical motion bridges the gap between mechanical computers and human intuition. By choosing k=320 and b=30, Pumni OS creates a snappy, tactile response that feels organic and responsive on high refresh rate displays. Micro-feedback animations should prioritize pure CSS paths while complex layout shifts rely on Framer Motion orchestration.',
  },
  {
    id: 'art-2',
    title: 'Hardening Supabase Row Level Security',
    category: 'Security',
    readTime: '5 min read',
    color: 'bg-emerald-500 text-emerald-50',
    avatarChar: 'S',
    snippet: 'Securing database boundaries with owner-checked policy structures.',
    body: 'In modern serverless architecture, Row Level Security (RLS) acts as the final perimeter. Relying on UI masks for privacy is a severe anti-pattern. We enforce strict owner policies, authenticate using Supabase JWT tokens, and completely isolate server service-role keys from client-side bundles. Unit tests verify RLS queries prevent data leaks across workspaces.',
  },
  {
    id: 'art-3',
    title: 'Next.js 16 App Router Paradigms',
    category: 'Engineering',
    readTime: '4 min read',
    color: 'bg-cyan-500 text-cyan-50',
    avatarChar: 'N',
    snippet: 'Leveraging "use cache" and Server Action mutations in Bun monorepos.',
    body: 'Next.js 16 introduces refined compiler features and progressive caching mechanisms. App router architectures separate dynamic data boundaries from static render structures. By wiring withViewTransition to page mutations, we obtain GPU-driven layout morphing with zero main-thread blocking. Ensure client stores are scoped to UI state only.',
  },
];

// ─── Scroll-Driven Simulator Mock Dataset (15 items) ────────────────────────
const SCROLL_ITEMS = [
  { id: 1, title: 'Linear workflow alignment', desc: 'Syncing tickets to git commits.', tone: 'info', icon: Sparkles },
  { id: 2, title: 'TanStack Query integration', desc: 'Optimistic client cache updates.', tone: 'success', icon: BookOpen },
  { id: 3, title: 'Supabase RLS deployment', desc: 'Hardened database security lines.', tone: 'warning', icon: Move },
  { id: 4, title: 'OKLCH color conversion', desc: 'Perceptually uniform design scales.', tone: 'default', icon: MousePointer },
  { id: 5, title: 'Next.js 16 compiler features', desc: 'React compiler bundle savings.', tone: 'info', icon: Sparkles },
  { id: 6, title: 'View Transition freeze coordinating', desc: 'Ensuring blur-free morph layers.', tone: 'success', icon: BookOpen },
  { id: 7, title: 'Draggable momentum coefficients', desc: 'Calibrating cursor kinetic friction.', tone: 'warning', icon: Move },
  { id: 8, title: 'APCA contrast validations', desc: 'Verifying Lc 60 legibility margins.', tone: 'default', icon: MousePointer },
  { id: 9, title: 'Turborepo caching configurations', desc: 'Improving monorepo build pipelines.', tone: 'info', icon: Sparkles },
  { id: 10, title: 'Zustand UI client stores', desc: 'Local draft states without server mirror.', tone: 'success', icon: BookOpen },
  { id: 11, title: 'ESLint raw color rules', desc: 'Blocking inline color definitions.', tone: 'warning', icon: Move },
  { id: 12, title: 'Radix Dialog portaling', desc: 'Focus traps and screen reader layers.', tone: 'default', icon: MousePointer },
  { id: 13, title: 'Tailwind v4 upgrade path', desc: 'Migrating legacy build utilities.', tone: 'info', icon: Sparkles },
  { id: 14, title: 'Skeleton shimmer loaders', desc: 'CSS animates relative width cards.', tone: 'success', icon: BookOpen },
  { id: 15, title: 'Bento layout grid reflows', desc: 'Responsive item spacing alignments.', tone: 'warning', icon: Move },
];

// ─── Reflow Simulator Mock Dataset ─────────────────────────────────────────
const REFLOW_ITEMS = [
  { id: 'ref-1', title: 'Sky Player Module', category: 'Audio Player', price: '$49', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' },
  { id: 'ref-2', title: 'Supabase Sync Engine', category: 'Database', price: '$89', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' },
  { id: 'ref-3', title: 'Glassmorphism Theme Pack', category: 'UI Assets', price: '$29', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500' },
  { id: 'ref-4', title: 'TanStack Cache Adapter', category: 'Caching', price: '$39', color: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
];

// ─── Custom Stagger Mock Dataset ───────────────────────────────────────────
const STAGGER_NOTIFS = [
  { id: 1, title: 'Database Backup Complete', desc: 'Uploaded 2.4MB workspace assets.', time: 'Just now' },
  { id: 2, title: 'Security Alert Raised', desc: 'Unregistered JWT token blocked.', time: '2m ago' },
  { id: 3, title: 'Package Cache Re-indexed', desc: '14 workspace dependencies updated.', time: '5m ago' },
  { id: 4, title: 'Compiler Optimisations Compiled', desc: 'Saved 14% bundle size.', time: '12m ago' },
];

// ─── Mathematical Spring Curve Calculator ──────────────────────────────────
function getSpringCurvePoints(k: number, c: number, m: number = 1): { t: number; val: number }[] {
  const points: { t: number; val: number }[] = [];
  const steps = 120;
  const tMax = 1.0;

  const w0 = Math.sqrt(k / m);
  const dampingTerm = 2 * Math.sqrt(k * m);
  const zeta = dampingTerm === 0 ? 0 : c / dampingTerm;

  const eps = 1e-4;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax;
    let val = 1;

    if (Math.abs(zeta - 1) < eps) {
      val = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    } else if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      if (wd > eps) {
        const envelope = Math.exp(-zeta * w0 * t);
        val = 1 - envelope * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
      } else {
        val = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
      }
    } else {
      const wd = w0 * Math.sqrt(zeta * zeta - 1);
      if (wd > eps) {
        const envelope = Math.exp(-zeta * w0 * t);
        val = 1 - envelope * (Math.cosh(wd * t) + ((zeta * w0) / wd) * Math.sinh(wd * t));
      } else {
        val = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
      }
    }

    points.push({ t, val });
  }
  return points;
}

export function MotionSection() {
  // Navigation states
  const [activeTab, setActiveTab] = React.useState<'touch-overlays' | 'js-orchestration' | 'nav-scroll'>('touch-overlays');

  // Accessibility simulator
  const systemReducedMotion = useReducedMotion();
  const [localReducedMotion, setLocalReducedMotion] = React.useState(false);
  const isReduced = systemReducedMotion || localReducedMotion;

  // Sandbox slider states
  const [stiffness, setStiffness] = React.useState(320);
  const [damping, setDamping] = React.useState(30);
  const [mass, setMass] = React.useState(1.0);
  const [sandboxBounceKey, setSandboxBounceKey] = React.useState(0);
  const [sandboxBounceTarget, setSandboxBounceTarget] = React.useState(0);

  // Tab 1 Touch & Overlays sub-states
  const [tactileCheckbox, setTactileCheckbox] = React.useState(false);
  const [tactileSwitch, setTactileSwitch] = React.useState(false);
  const [tactileSliderVal, setTactileSliderVal] = React.useState(40);
  const [cardState, setCardState] = React.useState<'idle' | 'loading' | 'error' | 'success'>('idle');

  const [overlaySim, setOverlaySim] = React.useState<'none' | 'dialog' | 'sheet' | 'dropdown' | 'context'>('none');
  const [contextPos, setContextPos] = React.useState({ x: 0, y: 0 });

  // Tab 2 JS Orchestration sub-states
  const [staggerKey, setStaggerKey] = React.useState(0);
  const [staggerDelay, setStaggerDelay] = React.useState(0.05); // defaults to 50ms
  const [layoutMode, setLayoutMode] = React.useState<'grid' | 'list'>('grid');
  
  // Draggable sub-states
  const [dragKey, setDragKey] = React.useState(0);
  const [dragCoords, setDragCoords] = React.useState({ x: 0, y: 0 });
  const [dragStatus, setDragStatus] = React.useState<'idle' | 'dragging' | 'coasting'>('idle');
  const [dragMomentum, setDragMomentum] = React.useState(true);
  const [dragElastic, setDragElastic] = React.useState(0.12);
  
  const [motionWindowOpen, setMotionWindowOpen] = React.useState(true);

  // Tab 3 View Transitions state
  const [vtView, setVtView] = React.useState<'list' | 'detail'>('list');
  const [vtSelectedId, setVtSelectedId] = React.useState<string>('art-1');

  const activeArticle = VT_ARTICLES.find((a) => a.id === vtSelectedId) ?? VT_ARTICLES[0]!;

  // Mouse parallax tracker
  const [parallaxPos, setParallaxPos] = React.useState({ x: 0, y: 0 });
  const handleParallaxMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isReduced) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setParallaxPos({ x: nx, y: ny });
    },
    [isReduced],
  );
  const handleParallaxLeave = React.useCallback(() => {
    setParallaxPos({ x: 0, y: 0 });
  }, []);

  // Preset dispatcher
  const applyPreset = (presetName: 'fluid' | 'snappy' | 'bouncy') => {
    const preset = springs[presetName];
    setStiffness(preset.stiffness);
    setDamping(preset.damping);
    setMass(preset.mass || 1.0);
    setSandboxBounceTarget((p) => (p === 0 ? 1 : 0));
    setSandboxBounceKey((k) => k + 1);
    toast.info(`Applied spring preset: springs.${presetName}`);
  };

  // Dynamic code snippet for spring
  const springConfigCode = `transition={{
  type: 'spring',
  stiffness: ${stiffness},
  damping: ${damping},
  mass: ${mass}
}}`;

  // Plot spring curve for SVG
  const springPoints = React.useMemo(() => {
    return getSpringCurvePoints(stiffness, damping, mass);
  }, [stiffness, damping, mass]);

  const svgPathD = React.useMemo(() => {
    return springPoints
      .map((p, idx) => {
        const x = (p.t / 1.0) * 280 + 10;
        const y = 90 - p.val * 50;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [springPoints]);

  // Gated recipes based on reduced motion state
  const recipesGated = React.useMemo(() => {
    if (isReduced) {
      return {
        hoverLift: {},
        pressScale: {},
        staggerContainer: {},
        staggerItem: { variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } } },
        fadeRise: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
        collapse: { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 } },
        window: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
      };
    }
    return recipes;
  }, [isReduced]);

  const dragProps = isReduced
    ? {}
    : {
        drag: true,
        dragMomentum,
        dragElastic,
        dragTransition: recipes.draggableSurface.dragTransition,
        dragConstraints: { left: -80, right: 80, top: -50, bottom: 50 },
      };

  // ─── Tab 1 Touch Actions ──────────────────────────────────────────────────
  const handleContextClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setContextPos({ x, y });
    setOverlaySim('context');
  };

  const getActiveOverlayClasses = () => {
    switch (overlaySim) {
      case 'dialog':
        return 'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 bg-background/80 backdrop-blur-md shadow-raised';
      case 'sheet':
        return 'data-[state=open]:animate-in data-[state=open]:slide-in-from-right duration-(--duration-slow) bg-card border-l';
      case 'dropdown':
        return 'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 origin-top-right staggerContainerFast';
      case 'context':
        return 'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 absolute shadow-lg rounded-lg border';
      default:
        return 'data-[state=closed] (No active overlay)';
    }
  };

  return (
    <ShowcaseSection
      id="motion"
      title="Motion"
      description="The Pumni OS motion architecture comprises 5 surfaces, from GPU-bound CSS micro-feedback and native View Transitions to Framer Motion physics-based JS orchestration."
    >
      {/* Accessibility Audit Panel & Controls */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                isReduced ? "bg-amber-400" : "bg-emerald-400"
              )} />
              <span className={cn(
                "relative inline-flex rounded-full size-2",
                isReduced ? "bg-amber-500" : "bg-emerald-500"
              )} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Motion Diagnostic Engine
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            OS Prefs: <strong>{systemReducedMotion ? 'Reduced Motion' : 'Motion Allowed'}</strong> · Current Status: <strong>{isReduced ? 'Animations Blocked (Reduced Mode)' : 'All Animations Active'}</strong>
          </p>
        </div>
        <Button
          variant={localReducedMotion ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setLocalReducedMotion((r) => !r)}
          className="w-full font-medium sm:w-auto"
        >
          {localReducedMotion ? (
            <>
              <EyeOff className="size-4 mr-2" /> Stop Simulation
            </>
          ) : (
            <>
              <Eye className="size-4 mr-2" /> Simulate Reduced Motion
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════
            CINEMATIC SPRING PLAYGROUND / PHYSICS ENGINE
            ═══════════════════════════════════════════════════════════════════ */}
        <Card className="border border-border/80 shadow-raised bg-card/65 backdrop-blur-md">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-5 text-primary" /> Interactive Motion Sandbox
                </CardTitle>
                <CardDescription>
                  Tune physics-based spring variables and inspect the resulting curve plotted in real time.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <Button variant="outline" size="xs" onClick={() => applyPreset('fluid')}>
                  fluid
                </Button>
                <Button variant="outline" size="xs" onClick={() => applyPreset('snappy')}>
                  snappy
                </Button>
                <Button variant="outline" size="xs" onClick={() => applyPreset('bouncy')}>
                  bouncy
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6 lg:grid-cols-5">
            {/* Sliders Block */}
            <div className="space-y-5 lg:col-span-2">
              {/* Stiffness Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">Stiffness (k)</span>
                  <span className="text-primary font-bold">{stiffness}</span>
                </div>
                <Slider
                  min={100}
                  max={800}
                  step={10}
                  value={[stiffness]}
                  onValueChange={(val) => {
                    if (val[0] !== undefined) setStiffness(val[0]);
                  }}
                  aria-label="Spring stiffness coefficient"
                />
                <p className="text-xs text-muted-foreground">Controls transition velocity. High value = snaps faster.</p>
              </div>

              {/* Damping Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">Damping (b)</span>
                  <span className="text-primary font-bold">{damping}</span>
                </div>
                <Slider
                  min={5}
                  max={80}
                  step={1}
                  value={[damping]}
                  onValueChange={(val) => {
                    if (val[0] !== undefined) setDamping(val[0]);
                  }}
                  aria-label="Spring damping friction coefficient"
                />
                <p className="text-xs text-muted-foreground">Controls oscillation resistance. Low value = bouncy recoil.</p>
              </div>

              {/* Mass Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">Mass (m)</span>
                  <span className="text-primary font-bold">{mass.toFixed(1)}</span>
                </div>
                <Slider
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  value={[mass]}
                  onValueChange={(val) => {
                    if (val[0] !== undefined) setMass(val[0]);
                  }}
                  aria-label="Spring payload mass coefficient"
                />
                <p className="text-xs text-muted-foreground">Alters inertia momentum. High mass = slower, heavier settle.</p>
              </div>
            </div>

            {/* SVG Visualizer Block */}
            <div className="flex flex-col justify-between gap-3 rounded-xl bg-muted/30 border border-border/40 p-4 lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Oscillation Decay Graph
              </span>
              <div className="relative flex-1 min-h-24">
                <svg className="w-full h-full min-h-[96px]" viewBox="0 0 300 120" preserveAspectRatio="none">
                  {/* Base line */}
                  <line x1="0" y1="90" x2="300" y2="90" stroke="currentColor" className="text-border" strokeWidth="1" />
                  {/* Target line */}
                  <line
                    x1="0"
                    y1="40"
                    x2="300"
                    y2="40"
                    stroke="currentColor"
                    className="text-primary opacity-45"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* Dynamic Curve */}
                  <motion.path
                    d={svgPathD}
                    fill="none"
                    stroke="currentColor"
                    className="text-primary"
                    strokeWidth="2"
                    initial={false}
                    animate={{ d: svgPathD }}
                    transition={{ duration: 0.12, ease: 'linear' }}
                  />
                  {/* Graph Annotations */}
                  <text x="8" y="84" className="text-xs font-mono fill-muted-foreground">Start (0.0)</text>
                  <text x="8" y="34" className="text-xs font-mono fill-primary font-semibold">Target (1.0)</text>
                  <text x="250" y="112" className="text-xs font-mono fill-muted-foreground">Time (1.0s)</text>
                </svg>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Plotted using exact equations for under/overdamping. Real-time path updates.
              </p>
            </div>

            {/* Test Action Canvas Block */}
            <div className="flex flex-col justify-between rounded-xl bg-muted/40 p-4 border border-border/40 text-center lg:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Real-time Sandbox
              </span>
              <div className="my-3 flex flex-1 items-center justify-center min-h-20 overflow-hidden">
                <motion.div
                  key={`${sandboxBounceKey}-${isReduced}`}
                  animate={{
                    x: sandboxBounceTarget === 0 ? -40 : 40,
                    rotate: sandboxBounceTarget === 0 ? 0 : 90,
                  }}
                  transition={
                    isReduced
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness,
                          damping,
                          mass,
                        }
                  }
                  className="flex size-12 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md select-none"
                  onClick={() => setSandboxBounceTarget((p) => (p === 0 ? 1 : 0))}
                >
                  <Move className="size-4" />
                </motion.div>
              </div>
              <div className="space-y-1.5">
                <Button
                  size="xs"
                  className="w-full"
                  onClick={() => setSandboxBounceTarget((p) => (p === 0 ? 1 : 0))}
                >
                  <Play className="size-3 mr-1" /> Trigger Bounce
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full text-xs font-mono"
                  onClick={() => {
                    navigator.clipboard.writeText(springConfigCode);
                    toast.success('Spring config copied to clipboard.');
                  }}
                >
                  <Code className="size-3 mr-1" /> Copy Config
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB SECTION SELECTOR (Segmented Picker)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-center">
          <SegmentedPicker
            options={[
              { value: 'touch-overlays', label: 'Touch & Overlays' },
              { value: 'js-orchestration', label: 'JS Orchestration' },
              { value: 'nav-scroll', label: 'Navigation & Scroll' },
            ]}
            value={activeTab}
            onChange={(next) => setActiveTab(next as typeof activeTab)}
            aria-label="Motion surfaces directory"
            className="w-full max-w-md"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: TOUCH & OVERLAYS (Surfaces 1 & 2)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'touch-overlays' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tactile Micro-Feedback Library Components */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tactile Micro-Feedback Library</CardTitle>
                <CardDescription>
                  <span className="font-mono text-xs font-semibold text-primary/80">Surface 1 · CSS &amp; Spring Gesture</span>
                  {' — '}Demo of the actual, reusable Pumni UI components and active state transitions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Cards side-by-side: CSS Interactive vs JS hoverLift */}
                <div className="grid grid-cols-2 gap-3">
                  {/* CSS Interactive Card */}
                  <Card interactive variant="solid" className="py-4 justify-center items-center text-center">
                    <p className="text-xs font-bold text-foreground leading-tight">CSS Interactive</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-normal">Hover lift + tap press via variables</p>
                  </Card>

                  {/* JS Interactive Card */}
                  <motion.div
                    {...recipesGated.hoverLift}
                    className="flex flex-col justify-center items-center text-center rounded-xl border border-border bg-card p-4 cursor-pointer select-none"
                  >
                    <p className="text-xs font-bold text-foreground leading-tight">JS hoverLift</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-normal">Physics spring lift + tap compress</p>
                  </motion.div>
                </div>

                {/* Form Controls Row (Checkbox, Switch, Slider) */}
                <div className="space-y-3.5 rounded-xl border border-border/40 bg-muted/20 p-3.5">
                  {/* Checkbox */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">Tactile Checkbox</span>
                      <span className="text-xs text-muted-foreground block">Radix Checkbox with check indicator spring</span>
                    </div>
                    <Checkbox
                      checked={tactileCheckbox}
                      onCheckedChange={(checked) => setTactileCheckbox(!!checked)}
                      id="tactile-checkbox"
                    />
                  </div>

                  {/* Switch */}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-border/20">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">Tactile Switch</span>
                      <span className="text-xs text-muted-foreground block">Radix Switch with sliding thumb spring</span>
                    </div>
                    <Switch
                      checked={tactileSwitch}
                      onCheckedChange={setTactileSwitch}
                    />
                  </div>

                  {/* Slider */}
                  <div className="space-y-2 pt-3 border-t border-border/20">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Tactile Slider</span>
                      <span className="text-primary font-bold">{tactileSliderVal}</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      value={[tactileSliderVal]}
                      onValueChange={(val) => {
                        if (val[0] !== undefined) setTactileSliderVal(val[0]);
                      }}
                      aria-label="Tactile demo slider"
                    />
                  </div>
                </div>

                {/* Card States Playground */}
                <div className="space-y-3 pt-1">
                  <span className="text-xs font-bold text-foreground block uppercase tracking-wider">Card States Playground</span>
                  
                  {/* Test State Card */}
                  <Card state={cardState} className="py-4 items-center justify-center text-center min-h-16">
                    <p className="text-xs font-bold text-foreground capitalize">State: {cardState}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                      {cardState === 'idle' && 'Standard state. Hairline border + card shadow.'}
                      {cardState === 'loading' && 'Opacity breathing pulse animation infinite.'}
                      {cardState === 'error' && 'Plays shake animation once + destructive border.'}
                      {cardState === 'success' && 'Plays spring confirmation border fade.'}
                    </p>
                  </Card>

                  {/* Controls */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    <Button variant={cardState === 'idle' ? 'default' : 'outline'} size="xs" onClick={() => setCardState('idle')}>
                      Idle
                    </Button>
                    <Button variant={cardState === 'loading' ? 'default' : 'outline'} size="xs" onClick={() => setCardState('loading')}>
                      Loading
                    </Button>
                    <Button variant={cardState === 'error' ? 'default' : 'outline'} size="xs" onClick={() => setCardState('error')}>
                      Error
                    </Button>
                    <Button variant={cardState === 'success' ? 'default' : 'outline'} size="xs" onClick={() => setCardState('success')}>
                      Success
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overlay Lifecycles Inspector Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overlay State-Inspector</CardTitle>
                <CardDescription>
                  <span className="font-mono text-xs font-semibold text-primary/80">Surface 2 · tw-animate-css &amp; pause coordinator</span>
                  {' — '}Trigger mock overlays below. Observe active classes change dynamically in the HUD.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trigger Buttons */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button variant={overlaySim === 'dialog' ? 'default' : 'outline'} size="sm" onClick={() => setOverlaySim('dialog')}>
                    Dialog Modal
                  </Button>
                  <Button variant={overlaySim === 'sheet' ? 'default' : 'outline'} size="sm" onClick={() => setOverlaySim('sheet')}>
                    Side Sheet
                  </Button>
                  <Button variant={overlaySim === 'dropdown' ? 'default' : 'outline'} size="sm" onClick={() => setOverlaySim('dropdown')}>
                    Stagger Menu
                  </Button>
                  <Button variant={overlaySim === 'context' ? 'default' : 'outline'} size="sm" onClick={() => setOverlaySim('none')}>
                    Dismiss Overlay
                  </Button>
                </div>

                {/* Dashboard Arena viewport */}
                <div className="relative h-[180px] bg-background border border-border rounded-xl overflow-hidden shadow-inner p-3 flex flex-col justify-between">
                  <div
                    onContextMenu={handleContextClick}
                    className="flex-1 flex flex-col justify-between select-none relative"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Console dashboard</span>
                        <span className="text-xs font-mono text-muted-foreground">sys: connected</span>
                      </div>
                      <div className="h-2 border border-dashed border-border/80 rounded flex items-center justify-center p-4 bg-muted/10 cursor-context-menu" onClick={handleContextClick}>
                        <span className="text-xs text-muted-foreground font-mono">Right-click / click here to Context Menu</span>
                      </div>
                    </div>

                    {/* ──── OVERLAY SIMULATOR RENDERS ──── */}
                    <AnimatePresence>
                      {/* Frosted Dialog Modal overlay */}
                      {overlaySim === 'dialog' && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-20 animate-in fade-in-0 duration-150">
                          <motion.div
                            initial={isReduced ? {} : { scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={isReduced ? {} : { scale: 0.94, opacity: 0 }}
                            transition={transition.snappy}
                            className="w-48 bg-card border border-border rounded-xl p-3 shadow-raised space-y-2 relative"
                          >
                            <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => setOverlaySim('none')}>
                              <X className="size-3" />
                            </button>
                            <span className="text-xs font-bold text-foreground block">Modal dialog</span>
                            <div className="h-1 bg-muted rounded w-5/6" />
                            <div className="h-1 bg-muted rounded w-2/3" />
                            <Button size="xs" className="w-full mt-1" onClick={() => setOverlaySim('none')}>Confirm</Button>
                          </motion.div>
                        </div>
                      )}

                      {/* Side Sheet overlay */}
                      {overlaySim === 'sheet' && (
                        <motion.div
                          initial={isReduced ? {} : { x: '100%' }}
                          animate={{ x: 0 }}
                          exit={isReduced ? {} : { x: '100%' }}
                          transition={transition.snappy}
                          className="absolute top-0 bottom-0 right-0 w-32 bg-card border-l border-border p-2.5 z-20 shadow-lg flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-foreground">Sheet panel</span>
                              <button onClick={() => setOverlaySim('none')} className="text-muted-foreground hover:text-foreground">
                                <X className="size-2.5" />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <div className="h-1 bg-muted rounded w-full" />
                              <div className="h-1 bg-muted rounded w-4/5" />
                            </div>
                          </div>
                          <Button size="xs" className="w-full" onClick={() => setOverlaySim('none')}>Close</Button>
                        </motion.div>
                      )}

                      {/* Staggered Dropdown Menu overlay */}
                      {overlaySim === 'dropdown' && (
                        <div className="absolute top-8 right-2 w-32 bg-card border border-border rounded-lg shadow-md p-1 z-20 animate-in fade-in-0 zoom-in-95 origin-top-right select-none duration-100">
                          <motion.ul
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: {},
                              visible: { transition: { staggerChildren: 0.03 } }
                            }}
                            className="space-y-0.5"
                          >
                            {['Open doc', 'Share link', 'Export pdf', 'Delete log'].map((text, i) => (
                              <motion.li
                                key={text}
                                variants={{
                                  hidden: { opacity: 0, y: 3 },
                                  visible: { opacity: 1, y: 0 }
                                }}
                                onClick={() => {
                                  toast.info(`Dropdown select: ${text}`);
                                  setOverlaySim('none');
                                }}
                                className={cn(
                                  "rounded px-1.5 py-1 text-xs hover:bg-muted cursor-pointer font-medium truncate flex items-center justify-between",
                                  i === 3 ? "text-red-500 hover:bg-red-500/10" : "text-foreground"
                                )}
                              >
                                {text}
                              </motion.li>
                            ))}
                          </motion.ul>
                        </div>
                      )}

                      {/* Right-click Context Menu overlay */}
                      {overlaySim === 'context' && (
                        <div
                          style={{ top: `${contextPos.y}px`, left: `${contextPos.x}px` }}
                          className="absolute w-24 bg-card border border-border rounded shadow-md p-0.75 z-20 animate-in fade-in-0 zoom-in-95 select-none duration-100 text-xs space-y-0.5"
                        >
                          {['Inspect', 'Refresh', 'Reload'].map((text) => (
                            <div
                              key={text}
                              onClick={() => {
                                toast.info(`Context select: ${text}`);
                                setOverlaySim('none');
                              }}
                              className="rounded px-1.5 py-0.75 hover:bg-muted cursor-pointer font-medium text-foreground truncate"
                            >
                              {text}
                            </div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Class Inspector HUD */}
                <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-xs font-mono leading-relaxed border border-border/40 text-foreground">
                  <div>
                    <span className="text-muted-foreground uppercase text-xs font-bold block mb-1">Active Overlay Type</span>
                    <span className="text-primary font-bold uppercase">{overlaySim === 'none' ? 'None' : `${overlaySim} Simulator`}</span>
                  </div>
                  <div className="border-t border-border/20 pt-2">
                    <span className="text-muted-foreground uppercase text-xs font-bold block mb-1">Active CSS transition classnames</span>
                    <code className="text-foreground leading-normal break-all block">{getActiveOverlayClasses()}</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: JS ORCHESTRATION (Surface 3)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'js-orchestration' && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Custom Stagger Sequence Playground */}
            <Card className="md:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Visual Stagger Cadence</CardTitle>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setStaggerKey((k) => k + 1)}
                  >
                    <RotateCcw className="size-3.5 mr-1" /> Replay
                  </Button>
                </div>
                <CardDescription>
                  Adjust stagger intervals. Displays notification cards staggered sequentially.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delay Slider */}
                <div className="space-y-2 pb-3 border-b border-border/20">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Stagger Interval</span>
                    <span className="text-primary font-bold">{Math.round(staggerDelay * 1000)}ms</span>
                  </div>
                  <Slider
                    min={0.01}
                    max={0.20}
                    step={0.01}
                    value={[staggerDelay]}
                    onValueChange={(val) => {
                      if (val[0] !== undefined) setStaggerDelay(val[0]);
                    }}
                    aria-label="Stagger delay duration"
                  />
                </div>

                {/* Stagger List Output */}
                <motion.ul
                  key={`${staggerKey}-${staggerDelay}`}
                  {...(isReduced
                    ? {}
                    : {
                        initial: 'hidden',
                        animate: 'visible',
                        variants: {
                          hidden: {},
                          visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.01 } },
                        },
                      })}
                  className="grid gap-2"
                >
                  {STAGGER_NOTIFS.map((item) => (
                    <motion.li
                      key={item.id}
                      {...recipesGated.staggerItem}
                      className="rounded-lg border border-border/40 bg-card p-2.5 shadow-sm flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.desc}</p>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">{item.time}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                {/* Delay Pulse Timeline Indicator */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase text-center block">Stagger Cascade Pulse Timeline</span>
                  <div className="flex gap-2 justify-center py-1">
                    {STAGGER_NOTIFS.map((_, i) => (
                      <motion.div
                        key={`${staggerKey}-${i}-${staggerDelay}`}
                        initial={{ scale: 0.8, opacity: 0.2 }}
                        animate={isReduced ? { scale: 1, opacity: 0.5 } : { scale: [0.8, 1.25, 1], opacity: [0.2, 1, 0.4] }}
                        transition={{
                          delay: i * staggerDelay,
                          duration: 0.35,
                          ease: 'easeOut',
                        }}
                        className="size-2 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Draggable Surface with Physics Telemetry */}
            <Card className="md:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Kinetic OS Window</CardTitle>
                  <Button variant="outline" size="xs" onClick={() => setDragKey((k) => k + 1)}>
                    Reset
                  </Button>
                </div>
                <CardDescription>
                  Drag the window mockup. Check the HUD coordinates and state updates live.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag Options */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/20 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Momentum</span>
                    <input
                      type="checkbox"
                      checked={dragMomentum}
                      onChange={(e) => setDragMomentum(e.target.checked)}
                      className="accent-primary cursor-pointer size-3.5"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Elastic Bounds</span>
                    <input
                      type="range"
                      min="0"
                      max="0.4"
                      step="0.05"
                      value={dragElastic}
                      onChange={(e) => setDragElastic(parseFloat(e.target.value))}
                      className="w-16 accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* Drag Arena */}
                <div className="relative h-44 overflow-hidden rounded-xl border border-border bg-muted/20 flex items-center justify-center">
                  <motion.div
                    key={dragKey}
                    {...dragProps}
                    className="absolute cursor-grab rounded-xl bg-card border border-border/80 w-40 shadow-lg active:cursor-grabbing flex flex-col z-10 select-none"
                    whileDrag={isReduced ? undefined : { scale: 1.02, boxShadow: 'var(--shadow-raised)' }}
                    onDragStart={() => setDragStatus('dragging')}
                    onDrag={(e, info) => setDragCoords({ x: Math.round(info.offset.x), y: Math.round(info.offset.y) })}
                    onDragEnd={() => {
                      setDragStatus('coasting');
                      setTimeout(() => setDragStatus('idle'), 600);
                    }}
                  >
                    {/* Window Controls */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/30 bg-muted/20">
                      <div className="size-1.5 rounded-full bg-red-500/80" />
                      <div className="size-1.5 rounded-full bg-amber-500/80" />
                      <div className="size-1.5 rounded-full bg-emerald-500/80" />
                      <span className="text-xs font-mono text-muted-foreground ml-2 truncate">terminal</span>
                    </div>
                    {/* Text block mockup */}
                    <div className="p-3 space-y-1.5">
                      <div className="h-1 bg-muted rounded w-4/5" />
                      <div className="h-1 bg-muted rounded w-11/12" />
                      <div className="h-1 bg-muted rounded w-3/5" />
                    </div>
                  </motion.div>

                  {/* Telemetry HUD */}
                  <div className="absolute top-2 right-2 rounded-md bg-background/80 border border-border/30 px-2 py-1.5 text-xs font-mono text-muted-foreground select-none z-0 space-y-0.5">
                    <p>offset_x: <span className="text-foreground font-bold">{dragCoords.x}px</span></p>
                    <p>offset_y: <span className="text-foreground font-bold">{dragCoords.y}px</span></p>
                    <p>physics_state: <span className={cn(
                      "font-bold uppercase",
                      dragStatus === 'dragging' && "text-primary",
                      dragStatus === 'coasting' && "text-amber-500",
                      dragStatus === 'idle' && "text-muted-foreground"
                    )}>{dragStatus}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Layout reflow (grid-to-list catalog morph) */}
            <Card className="md:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Reflowing Layouts</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={layoutMode === 'grid' ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => setLayoutMode('grid')}
                    >
                      Grid
                    </Button>
                    <Button
                      variant={layoutMode === 'list' ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => setLayoutMode('list')}
                    >
                      List
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Smooth grid-to-list morphing. Spans animate their position fluidly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/10 p-2.5 border border-border/40 min-h-60 flex flex-col justify-center">
                  <motion.div
                    layout
                    transition={isReduced ? undefined : transition.snappy}
                    className={cn(
                      "grid gap-2.5",
                      layoutMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'
                    )}
                  >
                    {REFLOW_ITEMS.map((item) => (
                      <motion.div
                        key={item.id}
                        layout={isReduced ? false : true}
                        transition={isReduced ? undefined : transition.snappy}
                        className={cn(
                          "rounded-lg border border-border/50 bg-card p-2.5 flex justify-between shadow-xs select-none",
                          layoutMode === 'list' ? 'flex-row items-center gap-4 h-14' : 'flex-col gap-1.5 h-24'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0 border border-border/30", item.color)}>
                            <Activity className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <motion.span layout="position" className="text-xs font-bold text-foreground block truncate leading-tight">
                              {item.title}
                            </motion.span>
                            <motion.span layout="position" className="text-xs text-muted-foreground block truncate leading-tight mt-0.5">
                              {item.category}
                            </motion.span>
                          </div>
                        </div>
                        <motion.span layout="position" className="text-xs font-mono font-bold text-foreground shrink-0">
                          {item.price}
                        </motion.span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/20 text-xs">
                  <span className="text-muted-foreground">AnimatePresence Window</span>
                  <Button size="xs" variant="outline" onClick={() => setMotionWindowOpen((o) => !o)}>
                    {motionWindowOpen ? 'Unmount' : 'Mount'}
                  </Button>
                </div>

                <div className="relative h-20 overflow-hidden flex items-center justify-center rounded-lg bg-muted/20 border border-dashed border-border/60">
                  <AnimatePresence>
                    {motionWindowOpen && (
                      <motion.div
                        key="window-anim"
                        {...recipesGated.window}
                        className="rounded-lg bg-card border border-border p-2 shadow-sm text-xs text-center w-40"
                      >
                        Mount Spring: <code>recipes.window</code>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: NAVIGATION & SCROLL (Surfaces 4 & 5)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'nav-scroll' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Left Column: VT Explainers (2 cols) */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Page View Transitions</CardTitle>
                  <CardDescription>
                    <span className="font-mono text-xs font-semibold text-primary/80">Surface 4 · Native VT API</span>
                    {' — '}Wraps callbacks in <code>document.startViewTransition()</code> to trigger GPU transitions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() =>
                      withViewTransition(() => toast.info('Default Crossfade transition triggered.'))
                    }
                  >
                    Default Crossfade (No Type)
                  </Button>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    View Transitions capture screen snapshots and crossfade them off-main-thread. Custom named types let CSS dictate distinct keyframes for slides or zooms.
                  </p>

                  <div className="rounded-lg bg-muted/40 p-3 text-xs font-mono leading-relaxed border border-border/40 text-foreground space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">State Freeze Coordinator</span>
                    <code>html[data-vt-freeze] *</code>
                    <p className="font-sans text-xs text-muted-foreground leading-normal mt-1">
                      Pauses infinite loaders or shimmers during captures to prevent pixelated screenshots.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Interactive VT Dashboard Mockup (3 cols) */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">List-to-Detail Shared Element Morph</CardTitle>
                  <CardDescription>
                    Click an article below. The avatar circle morphs size/coordinates while the viewport slides directional-wise.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border bg-muted/15 p-3.5">
                    {/* Viewport Frame */}
                    <div className="relative min-h-[240px] bg-background border border-border rounded-xl overflow-hidden shadow-inner p-4 flex flex-col justify-between">
                      {vtView === 'list' ? (
                        /* List view */
                        <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="relative mb-3">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                              <div className="w-full bg-muted/50 border border-border rounded-md pl-8 pr-3 py-1 text-xs text-muted-foreground select-none">
                                Search platform docs...
                              </div>
                            </div>
                            <div className="space-y-2">
                              {VT_ARTICLES.map((art) => (
                                <div
                                  key={art.id}
                                  onClick={() => {
                                    withViewTransition(
                                      () => {
                                        setVtSelectedId(art.id);
                                        setVtView('detail');
                                      },
                                      { type: 'slide-forward' },
                                    );
                                  }}
                                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-card p-2.5 cursor-pointer hover:border-primary/40 transition-colors select-none group"
                                >
                                  <div
                                    style={{
                                      // Active item receives viewTransitionName on click to trigger shared element morph
                                      viewTransitionName: vtSelectedId === art.id ? 'vt-article-avatar' : undefined,
                                    } as React.CSSProperties}
                                    className={cn(
                                      "size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm transition-transform group-hover:scale-105",
                                      art.color
                                    )}
                                  >
                                    {art.avatarChar}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center gap-1.5">
                                      <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                        {art.title}
                                      </span>
                                      <span className="text-xs text-muted-foreground shrink-0">{art.readTime}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{art.snippet}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-center text-muted-foreground italic leading-normal">
                            Triggers <code>slide-forward</code> root animation + <code>vt-article-avatar</code> morph.
                          </p>
                        </div>
                      ) : (
                        /* Detail view */
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="space-y-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                withViewTransition(
                                  () => {
                                    setVtView('list');
                                  },
                                  { type: 'slide-back' },
                                );
                              }}
                              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline select-none"
                            >
                              <ArrowLeft className="size-3" /> Return to directory
                            </button>

                            <div className="flex items-center gap-3">
                              <div
                                style={{
                                  // Detail view avatar matches name, initiating morph interpolation
                                  viewTransitionName: 'vt-article-avatar',
                                } as React.CSSProperties}
                                className={cn(
                                  "size-12 rounded-full flex items-center justify-center font-bold text-base shadow-md shrink-0",
                                  activeArticle.color
                                )}
                              >
                                {activeArticle.avatarChar}
                              </div>
                              <div>
                                <span className="text-xs text-primary font-bold uppercase tracking-widest">
                                  {activeArticle.category}
                                </span>
                                <h3 className="text-xs font-black text-foreground leading-snug">
                                  {activeArticle.title}
                                </h3>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {activeArticle.body}
                            </p>
                          </div>

                          <p className="text-xs text-center text-muted-foreground italic pt-2 border-t border-border/20">
                            Back navigations leverage <code>slide-back</code> keyframes.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scroll-Driven Animations Card (3 Mock Phone Viewports) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scroll-Driven Viewport Mockups</CardTitle>
                <CardDescription>
                  <span className="font-mono text-xs font-semibold text-primary/80">Surface 5 · CSS animation-timeline</span>
                  {' — '}Scroll inside each smartphone viewport. Foreground cards trigger entrance animations, while phone 3 displays background grid drift.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Phone 1: scroll-fade-in */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">scroll-fade-in</span>
                    <div className="relative h-[320px] w-[180px] rounded-[24px] border-[6px] border-border bg-background shadow-md overflow-hidden flex flex-col">
                      {/* Speaker / Notch */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-border/80 z-20" />
                      {/* Screen Content Scrollport */}
                      <div className="flex-1 overflow-y-auto p-2 pt-6 space-y-2 select-none">
                        <p className="text-xs text-center text-muted-foreground pb-2">↓ Scroll viewport</p>
                        {SCROLL_ITEMS.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              !isReduced && 'scroll-fade-in',
                              'rounded-lg border border-border bg-card p-2.5 shadow-sm space-y-1'
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <item.icon className="size-3 text-primary shrink-0" />
                              <span className="text-xs font-bold text-foreground truncate leading-none">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-tight truncate">{item.desc}</p>
                          </div>
                        ))}
                        <div className="h-12" /> {/* Bottom gap to allow scrolling final card */}
                      </div>
                    </div>
                  </div>

                  {/* Phone 2: scroll-slide-up */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">scroll-slide-up</span>
                    <div className="relative h-[320px] w-[180px] rounded-[24px] border-[6px] border-border bg-background shadow-md overflow-hidden flex flex-col">
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-border/80 z-20" />
                      {/* Screen Content Scrollport */}
                      <div className="flex-1 overflow-y-auto p-2 pt-6 space-y-2 select-none">
                        <p className="text-xs text-center text-muted-foreground pb-2">↓ Scroll viewport</p>
                        {SCROLL_ITEMS.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              !isReduced && 'scroll-slide-up',
                              'rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-1'
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <item.icon className="size-3 text-primary shrink-0" />
                              <span className="text-xs font-bold text-primary truncate leading-none">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-xs text-primary/80 leading-tight truncate">{item.desc}</p>
                          </div>
                        ))}
                        <div className="h-12" />
                      </div>
                    </div>
                  </div>

                  {/* Phone 3: scroll-parallax */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">scroll-parallax</span>
                    <div className="relative h-[320px] w-[180px] rounded-[24px] border-[6px] border-border bg-background shadow-md overflow-hidden flex flex-col" style={{ isolation: 'isolate' }}>
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-border/80 z-20" />
                      
                      {/* Dotted Grid Background - offset translateY via scroll-parallax */}
                      <div
                        className={cn(
                          !isReduced && 'scroll-parallax',
                          'absolute -inset-y-16 left-0 right-0 opacity-40 z-0 bg-[radial-gradient(color-mix(in_oklch,var(--primary)_22%,transparent)_1.5px,transparent_1.5px)] [background-size:14px_14px]'
                        )}
                        aria-hidden
                      />

                      {/* Screen Content Scrollport */}
                      <div className="flex-1 overflow-y-auto p-2 pt-6 space-y-2 select-none z-10">
                        <p className="text-xs text-center text-muted-foreground pb-2">↓ Scroll viewport</p>
                        {SCROLL_ITEMS.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border/80 bg-card/85 p-2.5 shadow-sm space-y-1 backdrop-blur-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <item.icon className="size-3 text-foreground/80 shrink-0" />
                              <span className="text-xs font-bold text-foreground truncate leading-none">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-tight truncate">{item.desc}</p>
                          </div>
                        ))}
                        <div className="h-12" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t pt-3 text-xs text-muted-foreground leading-normal">
                  Phone 3 layers drift relative to the container scroll direction (Backtrack speed coefficient: <code>{parallaxRate}×</code>).
                  All timeline animations utilize GPU-bound hardware acceleration.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MOTION TOKENS SYSTEM TABLE
            ═══════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motion Token Bridge Registers</CardTitle>
            <CardDescription>
              Live read-out of compiled design system tokens. Sync verified at compile-time by <code>motion-tokens.test.ts</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Duration register */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase">duration (s) · --duration-*</span>
                {Object.entries(motionTokens.duration).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs font-mono">
                    <span className="text-foreground">{key}</span>
                    <span className="text-muted-foreground">{val}s</span>
                  </div>
                ))}
              </div>

              {/* Curve register */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase">easing · --ease-*</span>
                {Object.entries(motionTokens.easing).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs font-mono">
                    <span className="text-foreground">{key}</span>
                    <span className="text-muted-foreground truncate max-w-[120px]">[{(val as number[]).join(',')}]</span>
                  </div>
                ))}
              </div>

              {/* Geometry metrics */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase">geometry · --entrance-*</span>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground">entranceY</span>
                  <span className="text-muted-foreground">{motionTokens.entranceY}px</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground">entranceYLarge</span>
                  <span className="text-muted-foreground">{motionTokens.entranceYLarge}px</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground">pressScale</span>
                  <span className="text-muted-foreground">{motionTokens.pressScale}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground">hoverLiftScale</span>
                  <span className="text-muted-foreground">{motionTokens.hoverLiftScale}</span>
                </div>
              </div>

              {/* Stagger intervals */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase">stagger (s) · --stagger-*</span>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground">staggerFast</span>
                  <span className="text-muted-foreground">{motionTokens.staggerFast}s</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground">staggerBase</span>
                  <span className="text-muted-foreground">{motionTokens.staggerBase}s</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground">staggerSlow</span>
                  <span className="text-muted-foreground">{motionTokens.staggerSlow}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
