/** Torresmin desenhado em SVG: porquinho malhado de cachecol vermelho. */
export type PigMood = 'happy' | 'ok' | 'sad' | 'hungry' | 'worried' | 'sleep';

export function Pig({ mood = 'happy', size = 180 }: { mood?: PigMood; size?: number }) {
  const eyes =
    mood === 'sleep' ? (
      <g stroke="#3a2418" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M70 92q8 6 16 0" /><path d="M114 92q8 6 16 0" />
      </g>
    ) : mood === 'happy' ? (
      <g stroke="#3a2418" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M70 94q8-10 16 0" /><path d="M114 94q8-10 16 0" />
      </g>
    ) : (
      <g fill="#3a2418">
        <circle cx="78" cy="92" r="6.5" /><circle cx="122" cy="92" r="6.5" />
        <circle cx="80" cy="89.5" r="2" fill="#fff" /><circle cx="124" cy="89.5" r="2" fill="#fff" />
        {(mood === 'sad' || mood === 'worried') && (
          <g stroke="#3a2418" strokeWidth="3" strokeLinecap="round"><path d="M66 78l16 5" /><path d="M134 78l-16 5" /></g>
        )}
      </g>
    );
  const mouth =
    mood === 'happy' ? <path d="M88 140q12 12 24 0" stroke="#7a3b3b" strokeWidth="3.5" fill="#c9566a" strokeLinecap="round" />
    : mood === 'hungry' ? <ellipse cx="100" cy="142" rx="8" ry="7" fill="#7a3b3b" />
    : mood === 'sleep' ? <path d="M92 141h16" stroke="#7a3b3b" strokeWidth="3" strokeLinecap="round" />
    : <path d="M88 146q12-9 24 0" stroke="#7a3b3b" strokeWidth="3.5" fill="none" strokeLinecap="round" />;

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={'pig pig-' + mood} aria-label={'Torresmin ' + mood}>
      <ellipse cx="100" cy="186" rx="62" ry="8" fill="rgba(0,0,0,.35)" />
      {/* orelhas */}
      <path d="M48 58 L38 18 L80 44 Z" fill="#f2a7b5" stroke="#d98a9a" strokeWidth="3" strokeLinejoin="round" className="ear-l" />
      <path d="M152 58 L162 18 L120 44 Z" fill="#f2a7b5" stroke="#d98a9a" strokeWidth="3" strokeLinejoin="round" className="ear-r" />
      {/* corpo/cabeça */}
      <ellipse cx="100" cy="108" rx="70" ry="66" fill="#f6b9c4" stroke="#d98a9a" strokeWidth="3" />
      {/* manchas */}
      <path d="M44 84q10-22 30-18q-4 18-30 18z" fill="#3a2a2a" opacity=".75" />
      <ellipse cx="142" cy="140" rx="14" ry="10" fill="#3a2a2a" opacity=".7" />
      <circle cx="60" cy="140" r="6" fill="#3a2a2a" opacity=".6" />
      {/* bochechas */}
      <ellipse cx="62" cy="116" rx="11" ry="7" fill="#ef8ea0" opacity=".7" />
      <ellipse cx="138" cy="116" rx="11" ry="7" fill="#ef8ea0" opacity=".7" />
      {eyes}
      {/* focinho */}
      <ellipse cx="100" cy="118" rx="24" ry="17" fill="#f08fa2" stroke="#d07085" strokeWidth="3" />
      <ellipse cx="91" cy="118" rx="4.5" ry="6.5" fill="#8a4050" />
      <ellipse cx="109" cy="118" rx="4.5" ry="6.5" fill="#8a4050" />
      {mouth}
      {/* cachecol */}
      <path d="M40 158q60 26 120 0l4 14q-64 26-128 0z" fill="#b8323a" stroke="#8d2229" strokeWidth="3" strokeLinejoin="round" />
      <path d="M136 166l10 30l14-4l-8-30z" fill="#b8323a" stroke="#8d2229" strokeWidth="3" strokeLinejoin="round" />
      <g stroke="#e8c79a" strokeWidth="2.5" opacity=".7"><path d="M60 170l4-10M80 175l3-11M100 177l1-11M120 175l-1-11M140 169l-3-10" /></g>
    </svg>
  );
}
