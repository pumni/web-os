import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { css, readVariables, uiRoot, splitTopLevelCommas } from './lib/token-css';

export const OUTPUT_PATH = path.join(uiRoot, 'tokens.dtcg.json');

type DtcgValue = string | number | boolean | any;
type DtcgToken = {
  $type: string;
  $value: DtcgValue;
  $extensions?: {
    "com.pumni.modes"?: {
      dark: DtcgValue;
    };
  };
};

type DtcgShadowLayer = {
  color: string;
  offsetX: { value: number; unit: string };
  offsetY: { value: number; unit: string };
  blur?: { value: number; unit: string };
  spread?: { value: number; unit: string };
  inset?: boolean;
};

function parseShadow(value: string): DtcgShadowLayer[] | null {
  const parts = splitTopLevelCommas(value).map(p => p.trim());
  const layers: DtcgShadowLayer[] = [];
  
  for (const part of parts) {
    if (!part) continue;
    
    const tokens: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < part.length; i++) {
      const char = part[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;
      
      if ((char === ' ' || char === '\t') && depth === 0) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current.trim()) tokens.push(current.trim());
    
    let inset = false;
    let color = '';
    const lengths: { value: number; unit: string }[] = [];
    
    for (const token of tokens) {
      if (token === 'inset') {
        inset = true;
        continue;
      }
      if (token.startsWith('oklch(') || token.startsWith('var(') || token === 'transparent' || token.startsWith('color-mix(')) {
        color = token;
        continue;
      }
      const dim = /^(-?[\d.]+)(px|rem|em)$/.exec(token);
      if (dim) {
        lengths.push({ value: Number(dim[1]), unit: dim[2]! });
        continue;
      }
      if (token === '0') {
        lengths.push({ value: 0, unit: 'px' });
        continue;
      }
    }
    
    if (lengths.length < 2) {
      return null;
    }
    
    const layer: DtcgShadowLayer = {
      color: color || 'oklch(0 0 0)',
      offsetX: lengths[0]!,
      offsetY: lengths[1]!,
      inset,
    };
    if (lengths.length >= 3 && lengths[2]) {
      layer.blur = lengths[2];
    }
    if (lengths.length >= 4 && lengths[3]) {
      layer.spread = lengths[3];
    }
    layers.push(layer);
  }
  
  return layers.length > 0 ? layers : null;
}

function getTokenType(name: string, value: string): string {
  const clean = value.trim();
  if (
    clean.startsWith('oklch(') ||
    clean.startsWith('color-mix(') ||
    clean === 'transparent' ||
    name.includes('color') ||
    name.includes('background') ||
    name.includes('foreground') ||
    name.includes('primary') ||
    name.includes('accent') ||
    name.includes('secondary') ||
    name.includes('muted') ||
    name.includes('success') ||
    name.includes('destructive') ||
    name.includes('warning') ||
    name.includes('info') ||
    name.includes('chart') ||
    name.includes('border') ||
    name.includes('input') ||
    name.includes('field') ||
    name.includes('ring') ||
    name.includes('glow') ||
    name.includes('edge') ||
    name.includes('tint')
  ) {
    return 'color';
  }
  if (clean.startsWith('cubic-bezier(') || name.includes('ease')) {
    return 'cubicBezier';
  }
  if (parseShadow(clean) || name.includes('shadow')) {
    return 'shadow';
  }
  if (name.includes('weight')) {
    return 'fontWeight';
  }
  if (name.includes('font-family') || name.includes('font-sans') || name.includes('font-mono')) {
    return 'fontFamily';
  }
  if (clean.endsWith('ms') || clean.endsWith('s') || name.includes('duration') || name.includes('stagger')) {
    return 'duration';
  }
  if (clean.endsWith('px') || clean.endsWith('rem') || clean.endsWith('em') || name.includes('size') || name.includes('spacing') || name.includes('height') || name.includes('width') || name.includes('radius') || name.includes('padding') || name.includes('gap') || name.includes('blur')) {
    return 'dimension';
  }
  if (/^-?[\d.]+$/.test(clean) || name.includes('scale') || name.includes('saturate') || name.includes('zoom') || name.includes('opacity')) {
    return 'number';
  }
  return 'other';
}

function parseTokenInfo(name: string, file: 'tokens' | 'brand' | 'theme' | 'component'): { tier: string; group: string; key: string } {
  const bare = name.slice(2);
  
  if (file === 'tokens') {
    if (bare.startsWith('indigo-') || bare.startsWith('cyan-') || bare.startsWith('violet-') || bare.startsWith('coral-') || bare.startsWith('neutral-') || bare.startsWith('red-') || bare.startsWith('rose-') || bare.startsWith('emerald-') || bare.startsWith('amber-') || bare.startsWith('color-')) {
      return { tier: 'primitive', group: 'color', key: bare };
    }
    if (bare.startsWith('size-')) {
      return { tier: 'primitive', group: 'size', key: bare.slice(5) };
    }
    if (bare.startsWith('font-size-')) {
      return { tier: 'primitive', group: 'font-size', key: bare.slice(10) };
    }
    if (bare.startsWith('line-height-')) {
      return { tier: 'primitive', group: 'line-height', key: bare.slice(12) };
    }
    if (bare.startsWith('weight-') || bare.startsWith('font-weight-')) {
      return { tier: 'primitive', group: 'font-weight', key: bare.slice(bare.indexOf('weight-') + 7) };
    }
    if (bare.startsWith('letter-spacing-') || bare.startsWith('tracking-')) {
      return { tier: 'primitive', group: 'letter-spacing', key: bare.slice(bare.indexOf('spacing-') !== -1 ? bare.indexOf('spacing-') + 8 : 9) };
    }
    if (bare.startsWith('duration-') || bare.startsWith('stagger-')) {
      return { tier: 'primitive', group: 'duration', key: bare };
    }
    if (bare.startsWith('ease-')) {
      return { tier: 'primitive', group: 'ease', key: bare.slice(5) };
    }
    if (bare.startsWith('radius-')) {
      return { tier: 'primitive', group: 'radius', key: bare.slice(7) };
    }
    if (bare.startsWith('blur-')) {
      return { tier: 'primitive', group: 'blur', key: bare.slice(5) };
    }
    if (bare.startsWith('z-')) {
      return { tier: 'primitive', group: 'z-index', key: bare.slice(2) };
    }
    if (bare.startsWith('shadow-')) {
      return { tier: 'primitive', group: 'shadow', key: bare.slice(7) };
    }
    return { tier: 'primitive', group: 'misc', key: bare };
  }
  
  if (file === 'component') {
    const dash = bare.indexOf('-');
    const group = dash === -1 ? 'misc' : bare.slice(0, dash);
    const key = dash === -1 ? bare : bare.slice(dash + 1);
    return { tier: 'component', group, key };
  }
  
  if (bare.startsWith('brand-')) {
    return { tier: 'semantic', group: 'brand', key: bare.slice(6) };
  }
  if (bare.startsWith('font-size-')) {
    return { tier: 'semantic', group: 'font-size', key: bare.slice(10) };
  }
  if (bare.startsWith('tracking-')) {
    return { tier: 'semantic', group: 'tracking', key: bare.slice(9) };
  }
  if (bare.startsWith('glass-')) {
    return { tier: 'semantic', group: 'glass', key: bare.slice(6) };
  }
  if (bare.startsWith('shadow-')) {
    return { tier: 'semantic', group: 'shadow', key: bare.slice(7) };
  }
  return { tier: 'semantic', group: 'color', key: bare };
}

function parseLightDark(rawVal: string): { light: string; dark: string } | null {
  const trimmed = rawVal.trim();
  if (trimmed.startsWith('light-dark(')) {
    const match = trimmed.match(/^light-dark\(\s*(?<inner>[\s\S]+)\s*\)$/);
    if (match?.groups?.inner) {
      const parts = splitTopLevelCommas(match.groups.inner).map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { light: parts[0], dark: parts[1] };
      }
    }
  }
  return null;
}

export function buildDtcg(): any {
  const tokensInfo = new Map<string, { tier: string; group: string; key: string; file: string }>();
  const tokenPathMap = new Map<string, string>();
  
  const sources = [
    { file: 'tokens', content: css.tokens },
    { file: 'brand', content: css.brand },
    { file: 'theme', content: css.theme },
    { file: 'component', content: css.component },
  ] as const;
  
  for (const src of sources) {
    const rootVars = readVariables(src.content, ':root');
    for (const name of rootVars.keys()) {
      const info = parseTokenInfo(name, src.file);
      tokensInfo.set(name, { ...info, file: src.file });
      tokenPathMap.set(name, `${info.tier}.${info.group}.${info.key}`);
    }
  }
  
  const cssValueToDtcg = (raw: string): any => {
    const trimmed = raw.trim();
    
    const singleVarMatch = trimmed.match(/^var\(\s*(?<name>--[\w-]+)\s*\)$/);
    if (singleVarMatch?.groups?.name) {
      const refName = singleVarMatch.groups.name;
      const refPath = tokenPathMap.get(refName);
      if (refPath) {
        return `{${refPath}}`;
      }
    }
    
    let replaced = trimmed.replace(/var\(\s*(?<name>--[\w-]+)\s*\)/g, (match, refName) => {
      const refPath = tokenPathMap.get(refName);
      return refPath ? `{${refPath}}` : match;
    });
    
    const shadows = parseShadow(replaced);
    if (shadows) {
      return shadows;
    }
    
    const bezierMatch = /^cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/.exec(replaced);
    if (bezierMatch) {
      return [Number(bezierMatch[1]), Number(bezierMatch[2]), Number(bezierMatch[3]), Number(bezierMatch[4])];
    }
    
    const dim = /^(-?[\d.]+)(px|rem|em)$/.exec(replaced);
    if (dim) {
      return { value: Number(dim[1]), unit: dim[2]! };
    }
    
    const dur = /^(-?\d+(?:\.\d+)?)ms$/.exec(replaced);
    if (dur) {
      return { value: Number(dur[1]), unit: 'ms' };
    }
    
    if (/^-?[\d.]+$/.test(replaced)) {
      return Number(replaced);
    }
    
    return replaced;
  };
  
  const dtcgTree: any = {};
  
  for (const src of sources) {
    const rootVars = readVariables(src.content, ':root');
    const darkVars = readVariables(src.content, '.dark');
    
    for (const [name, rawRoot] of rootVars.entries()) {
      const info = tokensInfo.get(name)!;
      
      const ld = parseLightDark(rawRoot);
      let lightRaw = rawRoot;
      let darkRaw = darkVars.get(name) || rawRoot;
      
      if (ld) {
        lightRaw = ld.light;
        darkRaw = ld.dark;
      }
      
      const lightVal = cssValueToDtcg(lightRaw);
      const darkVal = cssValueToDtcg(darkRaw);
      
      const typeStr = getTokenType(name, lightRaw);
      
      const tokenObj: any = {
        $type: typeStr,
        $value: lightVal,
      };
      
      if (JSON.stringify(lightVal) !== JSON.stringify(darkVal)) {
        tokenObj.$extensions = {
          "com.pumni.modes": {
            dark: darkVal
          }
        };
      }
      
      dtcgTree[info.tier] ??= {};
      dtcgTree[info.tier][info.group] ??= {};
      dtcgTree[info.tier][info.group][info.key] = tokenObj;
    }
  }
  
  return dtcgTree;
}

export function buildDtcgJson(): string {
  const rawTree = buildDtcg();
  
  const sorted: any = {};
  for (const tier of Object.keys(rawTree).sort()) {
    sorted[tier] = {};
    for (const group of Object.keys(rawTree[tier]).sort()) {
      sorted[tier][group] = {};
      for (const key of Object.keys(rawTree[tier][group]).sort()) {
        sorted[tier][group][key] = rawTree[tier][group][key];
      }
    }
  }
  
  const doc = {
    $description:
      'Pumni OS design tokens (DTCG). GENERATED from packages/ui/src/styles/*.css — ' +
      'do not edit by hand. Regenerate with `bun run --filter @pumni/ui export-dtcg`.',
    ...sorted,
  };
  
  return `${JSON.stringify(doc, null, 2)}\n`;
}

if (import.meta.main) {
  const json = buildDtcgJson();
  writeFileSync(OUTPUT_PATH, json);
  console.log(`Wrote ${path.relative(uiRoot, OUTPUT_PATH)} (${json.length} bytes).`);
}
