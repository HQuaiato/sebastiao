import type { ReactNode } from 'react';
import { getP, rich, setP } from '../lib/calc';
import { update, useSheet } from '../lib/store';

export function Card({ title, right, children, className = '', fold, open }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; fold?: boolean; open?: boolean }) {
  if (fold) {
    return (
      <details className={'card sec ' + className} open={open}>
        <summary>{title}{right && <small onClick={(e) => e.preventDefault()}>{right}</small>}</summary>
        <div className="sec-body">{children}</div>
      </details>
    );
  }
  return (
    <div className={'card ' + className}>
      {title && <h2>{title}{right && <small>{right}</small>}</h2>}
      {children}
    </div>
  );
}

export const Rich = ({ text, runes }: { text: string; runes?: boolean }) => (
  <div className="rich" dangerouslySetInnerHTML={{ __html: rich(text, runes) }} />
);

type FieldProps = {
  path: string;
  label?: string;
  kind?: 'text' | 'number' | 'area' | 'check';
  options?: [string, string][];
  rows?: number;
  placeholder?: string;
};

/** Campo ligado direto a um pedaço da ficha (ex.: path="info.name"). */
export function Field({ path, label, kind = 'text', options, rows, placeholder }: FieldProps) {
  const D = useSheet();
  const v = getP(D, path);
  const set = (x: unknown) => update((d) => setP(d, path, x));
  if (kind === 'check') {
    return (
      <label className="chk">
        <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} /> {label}
      </label>
    );
  }
  let input: ReactNode;
  if (options) {
    input = (
      <select value={String(v ?? '')} onChange={(e) => set(kind === 'number' ? +e.target.value : e.target.value)}>
        {options.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
      </select>
    );
  } else if (kind === 'area') {
    input = <textarea value={String(v ?? '')} rows={rows} placeholder={placeholder} onChange={(e) => set(e.target.value)} />;
  } else if (kind === 'number') {
    input = <input type="number" inputMode="numeric" value={v === undefined || v === null ? '' : String(v)} onChange={(e) => set(e.target.value === '' ? 0 : +e.target.value)} />;
  } else {
    input = <input value={String(v ?? '')} placeholder={placeholder} onChange={(e) => set(e.target.value)} />;
  }
  return label ? <div className="field"><label>{label}</label>{input}</div> : input;
}

export function Mugs({ value, onChange, size }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <span className="mugs" style={size ? { fontSize: size } : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={'mug' + (n <= value ? ' on' : '')} disabled={!onChange}
          onClick={() => onChange?.(n === value ? 0 : n)} aria-label={n + ' canecas'}>🍺</button>
      ))}
    </span>
  );
}
