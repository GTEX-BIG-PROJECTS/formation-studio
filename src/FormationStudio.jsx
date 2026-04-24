import React, { useState, useEffect, useRef, useCallback } from 'react';
import { track } from '@vercel/analytics';

/* ============================================================
   FORMATION STUDIO — a lineup builder for team sports
   ============================================================ */

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;800&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&display=swap');
`;

/* ------------------------------------------------------------
   UTILITIES
   ------------------------------------------------------------ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rid = () => Math.random().toString(36).slice(2, 9);

const SAMPLE_NAMES = [
  'RODRIGUEZ','KIMURA','OKAFOR','SILVA','JANSSEN','PETROV','MBAPPE','HARADA',
  'NOVAK','FERREIRA','ARNOLD','CHEN','KOWALSKI','DIOP','VARGAS','ANDERSEN',
  'YILMAZ','NAKAMURA','CARTER','LINDQVIST','GONZALEZ','MORI','SINGH','TANAKA'
];

/* ------------------------------------------------------------
   SPORT CONFIGS — formations are % coords of the field.
   Vertical orientation: y=0 is opponent end, y=100 is own end.
   ------------------------------------------------------------ */
const SPORTS = {
  soccer: {
    id: 'soccer', name: 'Football', sub: 'Soccer', glyph: '⚽',
    count: 11, aspect: 0.66, field: 'soccer', orient: 'v',
    formations: {
      '4-4-2': [
        ['GK', 50, 92], ['LB', 12, 72], ['CB', 36, 76], ['CB', 64, 76], ['RB', 88, 72],
        ['LM', 14, 48], ['CM', 38, 52], ['CM', 62, 52], ['RM', 86, 48],
        ['ST', 38, 20], ['ST', 62, 20],
      ],
      '4-3-3': [
        ['GK', 50, 92], ['LB', 12, 72], ['CB', 36, 76], ['CB', 64, 76], ['RB', 88, 72],
        ['CM', 30, 52], ['CM', 50, 58], ['CM', 70, 52],
        ['LW', 16, 24], ['ST', 50, 18], ['RW', 84, 24],
      ],
      '3-5-2': [
        ['GK', 50, 92], ['CB', 28, 76], ['CB', 50, 78], ['CB', 72, 76],
        ['LWB', 10, 54], ['CM', 32, 54], ['CM', 50, 58], ['CM', 68, 54], ['RWB', 90, 54],
        ['ST', 38, 20], ['ST', 62, 20],
      ],
      '4-2-3-1': [
        ['GK', 50, 92], ['LB', 12, 72], ['CB', 36, 76], ['CB', 64, 76], ['RB', 88, 72],
        ['CDM', 38, 58], ['CDM', 62, 58],
        ['LW', 16, 34], ['CAM', 50, 36], ['RW', 84, 34],
        ['ST', 50, 14],
      ],
      '5-3-2': [
        ['GK', 50, 92], ['LWB', 8, 70], ['CB', 28, 76], ['CB', 50, 78], ['CB', 72, 76], ['RWB', 92, 70],
        ['CM', 30, 50], ['CM', 50, 54], ['CM', 70, 50],
        ['ST', 38, 20], ['ST', 62, 20],
      ],
    }
  },

  basketball: {
    id: 'basketball', name: 'Basketball', sub: '5 v 5', glyph: '🏀',
    count: 5, aspect: 0.94, field: 'basketball', orient: 'v',
    formations: {
      'Starting 5': [
        ['PG', 50, 78], ['SG', 20, 62], ['SF', 80, 62], ['PF', 30, 40], ['C', 50, 24],
      ],
      'Small Ball': [
        ['PG', 38, 72], ['SG', 68, 72], ['SF', 22, 44], ['PF', 78, 44], ['C', 50, 26],
      ],
      'Twin Towers': [
        ['PG', 50, 80], ['SG', 24, 70], ['SF', 76, 70], ['PF', 30, 32], ['C', 62, 26],
      ],
    }
  },

  football: {
    id: 'football', name: 'Football', sub: 'American', glyph: '🏈',
    count: 11, aspect: 0.75, field: 'football', orient: 'v',
    formations: {
      'I-Formation': [
        ['WR', 8, 50], ['LT', 34, 58], ['LG', 42, 58], ['C', 50, 58], ['RG', 58, 58], ['RT', 66, 58],
        ['TE', 74, 58], ['QB', 50, 66], ['FB', 50, 74], ['RB', 50, 82], ['WR', 92, 50],
      ],
      'Shotgun': [
        ['WR', 6, 50], ['WR', 20, 52], ['LT', 34, 58], ['LG', 42, 58], ['C', 50, 58], ['RG', 58, 58], ['RT', 66, 58],
        ['WR', 80, 52], ['QB', 50, 74], ['RB', 38, 74], ['WR', 94, 50],
      ],
      'Singleback': [
        ['WR', 8, 50], ['LT', 34, 58], ['LG', 42, 58], ['C', 50, 58], ['RG', 58, 58], ['RT', 66, 58],
        ['TE', 74, 58], ['WR', 20, 54], ['QB', 50, 66], ['RB', 50, 78], ['WR', 92, 50],
      ],
      '4-3 Defense': [
        ['DE', 24, 44], ['DT', 40, 42], ['DT', 60, 42], ['DE', 76, 44],
        ['OLB', 26, 32], ['MLB', 50, 30], ['OLB', 74, 32],
        ['CB', 8, 22], ['FS', 38, 12], ['SS', 62, 12], ['CB', 92, 22],
      ],
    }
  },

  volleyball: {
    id: 'volleyball', name: 'Volleyball', sub: '6 v 6', glyph: '🏐',
    count: 6, aspect: 1.0, field: 'volleyball', orient: 'v',
    formations: {
      'Rotation 1': [
        ['OH', 20, 30], ['MB', 50, 26], ['OPP', 80, 30],
        ['OH', 78, 72], ['S', 50, 76], ['L', 22, 72],
      ],
      '5-1 System': [
        ['S', 78, 30], ['MB', 50, 24], ['OH', 20, 30],
        ['OPP', 78, 72], ['MB', 50, 76], ['OH', 22, 72],
      ],
      '4-2 System': [
        ['S', 80, 28], ['MB', 50, 24], ['OH', 20, 28],
        ['OH', 20, 74], ['MB', 50, 78], ['S', 80, 74],
      ],
    }
  },

  hockey: {
    id: 'hockey', name: 'Ice Hockey', sub: '6 v 6', glyph: '🏒',
    count: 6, aspect: 2.1, field: 'hockey', orient: 'h',
    formations: {
      '1-2-2': [
        ['LW', 28, 22], ['RW', 28, 78], ['C', 48, 50], ['LD', 66, 28], ['RD', 66, 72], ['G', 90, 50],
      ],
      '2-1-2': [
        ['LW', 26, 30], ['RW', 26, 70], ['C', 40, 50], ['LD', 62, 32], ['RD', 62, 68], ['G', 90, 50],
      ],
      'Neutral Trap': [
        ['LW', 22, 30], ['RW', 22, 70], ['C', 38, 50], ['LD', 60, 34], ['RD', 60, 66], ['G', 90, 50],
      ],
    }
  },

  rugby: {
    id: 'rugby', name: 'Rugby Union', sub: '15 v 15', glyph: '🏉',
    count: 15, aspect: 0.7, field: 'rugby', orient: 'v',
    formations: {
      'Standard': [
        ['LP', 38, 86], ['HK', 50, 88], ['TP', 62, 86],
        ['L4', 42, 78], ['L5', 58, 78],
        ['BF', 32, 70], ['N8', 50, 68], ['OF', 68, 70],
        ['SH', 50, 58], ['FH', 40, 48],
        ['LW', 10, 32], ['IC', 35, 40], ['OC', 55, 40], ['RW', 90, 32],
        ['FB', 50, 18],
      ],
      'Attack': [
        ['LP', 38, 82], ['HK', 50, 84], ['TP', 62, 82],
        ['L4', 44, 74], ['L5', 56, 74],
        ['BF', 30, 66], ['N8', 50, 64], ['OF', 70, 66],
        ['SH', 50, 52], ['FH', 38, 40],
        ['LW', 8, 22], ['IC', 32, 30], ['OC', 58, 30], ['RW', 92, 22],
        ['FB', 50, 10],
      ],
    }
  },

  baseball: {
    id: 'baseball', name: 'Baseball', sub: '9 positions', glyph: '⚾',
    count: 9, aspect: 1.0, field: 'baseball', orient: 'v',
    formations: {
      'Standard': [
        ['P', 50, 62], ['C', 50, 88], ['1B', 74, 58], ['2B', 62, 44], ['3B', 26, 58], ['SS', 38, 44],
        ['LF', 18, 18], ['CF', 50, 12], ['RF', 82, 18],
      ],
      'Infield Shift': [
        ['P', 50, 62], ['C', 50, 88], ['1B', 70, 56], ['2B', 58, 48], ['3B', 42, 48], ['SS', 28, 54],
        ['LF', 22, 22], ['CF', 46, 14], ['RF', 78, 20],
      ],
    }
  },

  handball: {
    id: 'handball', name: 'Handball', sub: '7 v 7', glyph: '🤾',
    count: 7, aspect: 2.0, field: 'handball', orient: 'h',
    formations: {
      '6-0 Defense': [
        ['G', 88, 50],
        ['LB', 56, 18], ['LM', 58, 36], ['PV', 60, 50], ['RM', 58, 64], ['RB', 56, 82],
        ['CB', 40, 50],
      ],
      '5-1 Defense': [
        ['G', 88, 50],
        ['LW', 62, 14], ['LB', 54, 32], ['PV', 56, 50], ['RB', 54, 68], ['RW', 62, 86],
        ['CB', 36, 50],
      ],
      '3-2-1': [
        ['G', 88, 50],
        ['LB', 64, 24], ['PV', 64, 50], ['RB', 64, 76],
        ['LM', 48, 36], ['RM', 48, 64],
        ['CB', 32, 50],
      ],
    }
  },

  cricket: {
    id: 'cricket', name: 'Cricket', sub: '11 fielders', glyph: '🏏',
    count: 11, aspect: 1.0, field: 'cricket', orient: 'v',
    formations: {
      'Attacking': [
        ['BWL', 50, 42], ['WK', 50, 64], ['SLIP', 60, 62], ['SLIP', 66, 60], ['GLY', 72, 56],
        ['PNT', 80, 48], ['COV', 76, 32], ['MID', 60, 20], ['MDW', 40, 20], ['SQL', 24, 32], ['FL', 20, 48],
      ],
      'Defensive': [
        ['BWL', 50, 42], ['WK', 50, 64], ['SLIP', 58, 60], ['PNT', 86, 52],
        ['COV', 76, 28], ['MID', 56, 10], ['MOF', 44, 10], ['MDW', 30, 18], ['DMW', 14, 36],
        ['SQL', 14, 56], ['FL', 22, 72],
      ],
    }
  },

  futsal: {
    id: 'futsal', name: 'Futsal', sub: '5 v 5', glyph: '⚽',
    count: 5, aspect: 1.7, field: 'futsal', orient: 'h',
    formations: {
      'Diamond': [
        ['GK', 90, 50], ['DEF', 68, 50], ['LW', 50, 24], ['RW', 50, 76], ['PIV', 30, 50],
      ],
      'Square': [
        ['GK', 90, 50], ['DEF', 66, 32], ['DEF', 66, 68], ['FWD', 40, 32], ['FWD', 40, 68],
      ],
      '3-1': [
        ['GK', 90, 50], ['DEF', 70, 32], ['DEF', 70, 68], ['CEN', 50, 50], ['PIV', 28, 50],
      ],
    }
  },
};

const SPORT_ORDER = ['soccer','basketball','football','volleyball','hockey','rugby','baseball','handball','cricket','futsal'];

/* Positions that wear a different-coloured kit from the rest of the team.
   Covers goalkeepers (soccer/futsal GK, hockey/handball G) and
   volleyball's libero (L) who is required to wear a contrasting shirt. */
const KEEPER_POSITIONS = new Set(['GK', 'G', 'L']);
const isKeeper = (pos) => KEEPER_POSITIONS.has(pos);

/* ------------------------------------------------------------
   FIELD RENDERERS — each returns SVG markings for the sport.
   viewBox coords: 0..100 on BOTH axes (field scales to aspect).
   ------------------------------------------------------------ */
const Field = ({ sport }) => {
  const common = { fill: 'none', strokeWidth: 0.4, vectorEffect: 'non-scaling-stroke' };
  const line = '#ffffff';
  const s = sport.field;

  if (s === 'soccer') {
    return (
      <g stroke={line} {...common}>
        {/* stripes */}
        {[0,1,2,3,4,5,6,7].map(i => (
          <rect key={i} x="0" y={i*12.5} width="100" height="12.5"
            fill={i%2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.08)'} stroke="none"/>
        ))}
        <rect x="2" y="2" width="96" height="96"/>
        <line x1="2" y1="50" x2="98" y2="50"/>
        <circle cx="50" cy="50" r="9"/>
        <circle cx="50" cy="50" r="0.5" fill={line}/>
        {/* penalty boxes */}
        <rect x="22" y="2" width="56" height="14"/>
        <rect x="22" y="84" width="56" height="14"/>
        <rect x="36" y="2" width="28" height="5"/>
        <rect x="36" y="93" width="28" height="5"/>
        <circle cx="50" cy="11" r="0.5" fill={line}/>
        <circle cx="50" cy="89" r="0.5" fill={line}/>
        <path d="M 40 16 A 10 10 0 0 0 60 16"/>
        <path d="M 40 84 A 10 10 0 0 1 60 84"/>
        {/* goals */}
        <rect x="44" y="0.5" width="12" height="1.5" fill={line}/>
        <rect x="44" y="98" width="12" height="1.5" fill={line}/>
        {/* corners */}
        <path d="M 2 4 A 2 2 0 0 0 4 2"/>
        <path d="M 96 2 A 2 2 0 0 0 98 4"/>
        <path d="M 2 96 A 2 2 0 0 1 4 98"/>
        <path d="M 98 96 A 2 2 0 0 1 96 98"/>
      </g>
    );
  }

  if (s === 'basketball') {
    return (
      <g stroke={line} {...common}>
        <rect x="2" y="2" width="96" height="96" fill="rgba(0,0,0,0.15)" />
        {/* backboard/hoop top */}
        <line x1="42" y1="2" x2="58" y2="2" strokeWidth="1.4"/>
        <circle cx="50" cy="4" r="1.4"/>
        {/* key / lane */}
        <rect x="34" y="2" width="32" height="24"/>
        <line x1="34" y1="26" x2="66" y2="26" strokeWidth="0.6"/>
        {/* free throw circle */}
        <path d="M 38 26 A 12 12 0 0 0 62 26"/>
        <path d="M 38 26 A 12 12 0 0 1 62 26" strokeDasharray="1.5,1.5"/>
        {/* three-point arc */}
        <path d="M 14 2 L 14 10 A 36 36 0 0 0 86 10 L 86 2"/>
        {/* half court */}
        <line x1="2" y1="98" x2="98" y2="98"/>
        <path d="M 40 98 A 10 10 0 0 0 60 98"/>
        <circle cx="50" cy="98" r="0.5" fill={line}/>
      </g>
    );
  }

  if (s === 'football') {
    return (
      <g stroke={line} {...common}>
        {/* endzone top */}
        <rect x="0" y="0" width="100" height="12" fill="rgba(0,0,0,0.35)" stroke="none"/>
        <line x1="0" y1="12" x2="100" y2="12" strokeWidth="0.8"/>
        <rect x="2" y="2" width="96" height="96" fill="none"/>
        {/* yard lines — we render 10-yard intervals below the goal line */}
        {[20,30,40,50,60,70,80,90].map(y => (
          <g key={y}>
            <line x1="2" y1={y} x2="98" y2={y} strokeWidth={y===50?0.7:0.35}/>
            <text x="6" y={y-0.4} fill={line} fontSize="2.4" fontFamily="Archivo Black" opacity="0.55">
              {y===50?50:y<50?(y-10):(100-y-10)}
            </text>
            <text x="94" y={y-0.4} fill={line} fontSize="2.4" fontFamily="Archivo Black" opacity="0.55">
              {y===50?50:y<50?(y-10):(100-y-10)}
            </text>
          </g>
        ))}
        {/* hash marks every 2 yards */}
        {Array.from({length: 42}, (_,i) => 14+i*2).filter(y=>y<96).map(y=>(
          <g key={`h${y}`} stroke={line} strokeWidth="0.2" opacity="0.5">
            <line x1="38" y1={y} x2="39.5" y2={y}/>
            <line x1="60.5" y1={y} x2="62" y2={y}/>
          </g>
        ))}
        <text x="50" y="8" fill={line} fontSize="5" textAnchor="middle" fontFamily="Archivo Black" opacity="0.7" letterSpacing="0.2em">END ZONE</text>
      </g>
    );
  }

  if (s === 'volleyball') {
    return (
      <g stroke={line} {...common}>
        <rect x="4" y="4" width="92" height="92" fill="rgba(255,255,255,0.03)"/>
        {/* net line at top — opponent side is hidden */}
        <line x1="4" y1="50" x2="96" y2="50" strokeWidth="1.2"/>
        {/* net pattern */}
        {Array.from({length: 16},(_,i)=>4+i*5.75).map(x=>(
          <line key={x} x1={x} y1="48" x2={x} y2="52" strokeWidth="0.3"/>
        ))}
        {/* attack lines (3m from net) each side */}
        <line x1="4" y1="35" x2="96" y2="35" strokeDasharray="1.5,1"/>
        <line x1="4" y1="65" x2="96" y2="65"/>
        {/* service zone at bottom */}
        <line x1="4" y1="96" x2="96" y2="96" strokeWidth="0.8"/>
      </g>
    );
  }

  if (s === 'hockey') {
    return (
      <g stroke={line} {...common}>
        {/* rink rounded */}
        <rect x="2" y="6" width="96" height="88" rx="10" fill="rgba(255,255,255,0.04)"/>
        {/* center red line */}
        <line x1="50" y1="6" x2="50" y2="94" stroke="#e94b4b" strokeWidth="0.8"/>
        {/* blue lines */}
        <line x1="34" y1="6" x2="34" y2="94" stroke="#4b7de9" strokeWidth="0.7"/>
        <line x1="66" y1="6" x2="66" y2="94" stroke="#4b7de9" strokeWidth="0.7"/>
        {/* center circle */}
        <circle cx="50" cy="50" r="7" stroke="#4b7de9"/>
        <circle cx="50" cy="50" r="0.6" fill="#4b7de9" stroke="none"/>
        {/* faceoff circles */}
        {[[20,30],[20,70],[80,30],[80,70]].map(([x,y],i)=>(
          <g key={i}>
            <circle cx={x} cy={y} r="6" stroke="#e94b4b"/>
            <circle cx={x} cy={y} r="0.5" fill="#e94b4b" stroke="none"/>
          </g>
        ))}
        {/* creases near goals */}
        <path d="M 8 44 L 8 56" stroke="#e94b4b"/>
        <path d="M 92 44 L 92 56" stroke="#e94b4b"/>
        <path d="M 8 46 A 4 4 0 0 1 8 54" stroke="#4ba8e9" fill="rgba(75,168,233,0.2)"/>
        <path d="M 92 46 A 4 4 0 0 0 92 54" stroke="#4ba8e9" fill="rgba(75,168,233,0.2)"/>
        {/* goals */}
        <rect x="5" y="47" width="3" height="6" fill="rgba(233,75,75,0.35)" stroke="#e94b4b"/>
        <rect x="92" y="47" width="3" height="6" fill="rgba(233,75,75,0.35)" stroke="#e94b4b"/>
      </g>
    );
  }

  if (s === 'rugby') {
    return (
      <g stroke={line} {...common}>
        <rect x="2" y="2" width="96" height="96"/>
        {/* try lines (solid) and dead-ball lines */}
        <line x1="2" y1="8" x2="98" y2="8" strokeWidth="0.7"/>
        <line x1="2" y1="92" x2="98" y2="92" strokeWidth="0.7"/>
        {/* 22m lines */}
        <line x1="2" y1="30" x2="98" y2="30"/>
        <line x1="2" y1="70" x2="98" y2="70"/>
        {/* 10m dashed */}
        <line x1="2" y1="42" x2="98" y2="42" strokeDasharray="1.5,1"/>
        <line x1="2" y1="58" x2="98" y2="58" strokeDasharray="1.5,1"/>
        {/* halfway */}
        <line x1="2" y1="50" x2="98" y2="50" strokeWidth="0.7"/>
        {/* posts */}
        <line x1="46" y1="8" x2="54" y2="8" strokeWidth="1.2"/>
        <line x1="46" y1="92" x2="54" y2="92" strokeWidth="1.2"/>
        <line x1="46" y1="4" x2="46" y2="8"/>
        <line x1="54" y1="4" x2="54" y2="8"/>
        <line x1="46" y1="92" x2="46" y2="96"/>
        <line x1="54" y1="92" x2="54" y2="96"/>
        {/* 5m and 15m lines (short dashes near sides) */}
        {[5,15].map(x=>(
          <g key={x}>
            <line x1={x} y1="8" x2={x} y2="92" strokeDasharray="0.8,2.5" opacity="0.5"/>
            <line x1={100-x} y1="8" x2={100-x} y2="92" strokeDasharray="0.8,2.5" opacity="0.5"/>
          </g>
        ))}
      </g>
    );
  }

  if (s === 'baseball') {
    return (
      <g stroke={line} {...common}>
        {/* outfield arc */}
        <path d="M 50 94 L 4 50 A 64 64 0 0 1 96 50 L 50 94 Z" fill="rgba(60,120,60,0.25)"/>
        {/* infield diamond */}
        <path d="M 50 92 L 74 62 L 50 32 L 26 62 Z" fill="rgba(160,110,70,0.45)" stroke={line}/>
        {/* base paths */}
        <path d="M 50 92 L 74 62 L 50 32 L 26 62 Z" strokeWidth="0.4"/>
        {/* bases */}
        {[[50,92],[74,62],[50,32],[26,62]].map(([x,y],i)=>(
          <rect key={i} x={x-1.4} y={y-1.4} width="2.8" height="2.8" fill={line} transform={`rotate(45 ${x} ${y})`}/>
        ))}
        {/* pitcher's mound */}
        <circle cx="50" cy="62" r="3" fill="rgba(160,110,70,0.7)" stroke={line}/>
        <rect x="48.5" y="61.4" width="3" height="1.2" fill={line}/>
        {/* home plate */}
        <path d="M 48 92 L 52 92 L 52 94 L 50 95.5 L 48 94 Z" fill={line}/>
        {/* foul lines */}
        <line x1="50" y1="92" x2="12" y2="54" opacity="0.6"/>
        <line x1="50" y1="92" x2="88" y2="54" opacity="0.6"/>
      </g>
    );
  }

  if (s === 'handball') {
    return (
      <g stroke={line} {...common}>
        <rect x="2" y="2" width="96" height="96" fill="rgba(30,60,120,0.25)"/>
        <line x1="50" y1="2" x2="50" y2="98"/>
        {/* 6m goal areas (semicircles from each goal) */}
        <path d="M 94 30 A 20 20 0 0 1 94 70" fill="rgba(255,255,255,0.1)"/>
        <path d="M 6 30 A 20 20 0 0 0 6 70" fill="rgba(255,255,255,0.1)"/>
        {/* 9m dashed */}
        <path d="M 91 22 A 28 28 0 0 1 91 78" strokeDasharray="1,1"/>
        <path d="M 9 22 A 28 28 0 0 0 9 78" strokeDasharray="1,1"/>
        {/* goals */}
        <rect x="96" y="46" width="2" height="8" fill={line}/>
        <rect x="2" y="46" width="2" height="8" fill={line}/>
        {/* 7m line */}
        <line x1="84" y1="48" x2="84" y2="52" strokeWidth="0.7"/>
        <line x1="16" y1="48" x2="16" y2="52" strokeWidth="0.7"/>
      </g>
    );
  }

  if (s === 'cricket') {
    return (
      <g stroke={line} {...common}>
        {/* boundary oval */}
        <ellipse cx="50" cy="50" rx="48" ry="48" fill="rgba(60,120,60,0.25)"/>
        {/* 30-yard inner circle (dashed) */}
        <ellipse cx="50" cy="50" rx="28" ry="28" strokeDasharray="1.5,1.5"/>
        {/* pitch strip */}
        <rect x="48" y="38" width="4" height="24" fill="rgba(220,180,140,0.7)" stroke={line}/>
        {/* creases */}
        <line x1="46" y1="42" x2="54" y2="42"/>
        <line x1="46" y1="58" x2="54" y2="58"/>
        {/* stumps */}
        <line x1="48" y1="42" x2="52" y2="42" strokeWidth="1.2"/>
        <line x1="48" y1="58" x2="52" y2="58" strokeWidth="1.2"/>
      </g>
    );
  }

  if (s === 'futsal') {
    return (
      <g stroke={line} {...common}>
        <rect x="2" y="2" width="96" height="96" fill="rgba(30,30,80,0.2)"/>
        <line x1="50" y1="2" x2="50" y2="98"/>
        <circle cx="50" cy="50" r="6"/>
        <circle cx="50" cy="50" r="0.5" fill={line}/>
        {/* penalty area (quarter circles from posts) */}
        <path d="M 96 36 A 10 10 0 0 1 96 64" />
        <path d="M 4 36 A 10 10 0 0 0 4 64" />
        {/* 10m penalty spot */}
        <circle cx="86" cy="50" r="0.5" fill={line}/>
        <circle cx="14" cy="50" r="0.5" fill={line}/>
        {/* goals */}
        <rect x="98" y="46" width="1.5" height="8" fill={line}/>
        <rect x="0.5" y="46" width="1.5" height="8" fill={line}/>
      </g>
    );
  }
  return null;
};

/* surface colors per sport */
const SURFACE = {
  soccer:     'linear-gradient(180deg,#1f5a2f 0%,#1a4d28 100%)',
  basketball: 'linear-gradient(180deg,#b67840 0%,#8c5429 100%)',
  football:   'linear-gradient(180deg,#1f5a2f 0%,#17411f 100%)',
  volleyball: 'linear-gradient(180deg,#c96e2a 0%,#8a3f16 100%)',
  hockey:     'linear-gradient(180deg,#e6eef5 0%,#bcc9d6 100%)',
  rugby:      'linear-gradient(180deg,#236b35 0%,#1a4f26 100%)',
  baseball:   'linear-gradient(180deg,#2d5c2a 0%,#1d3d1b 100%)',
  handball:   'linear-gradient(180deg,#365aa5 0%,#213e78 100%)',
  cricket:    'linear-gradient(180deg,#2d5c2a 0%,#1d3d1b 100%)',
  futsal:     'linear-gradient(180deg,#2a2f6e 0%,#1a1d4a 100%)',
};

/* same colors as SVG gradient stops — used by the export scene */
const SURFACE_STOPS = {
  soccer:     ['#1f5a2f', '#1a4d28'],
  basketball: ['#b67840', '#8c5429'],
  football:   ['#1f5a2f', '#17411f'],
  volleyball: ['#c96e2a', '#8a3f16'],
  hockey:     ['#e6eef5', '#bcc9d6'],
  rugby:      ['#236b35', '#1a4f26'],
  baseball:   ['#2d5c2a', '#1d3d1b'],
  handball:   ['#365aa5', '#213e78'],
  cricket:    ['#2d5c2a', '#1d3d1b'],
  futsal:     ['#2a2f6e', '#1a1d4a'],
};

/* ------------------------------------------------------------
   JERSEY — HTML + inner SVG so it never distorts when the
   parent field has a non-square aspect ratio.
   If `photo` is provided, renders a circular avatar instead
   of the jersey shape (with kit colour as the ring).
   ------------------------------------------------------------ */
const Jersey = ({ primary, secondary, text, number, name, pos, selected, size = 1, photo }) => {
  const W = 56 * size;

  /* ---------- PHOTO MODE ---------- */
  if (photo) {
    const D = W * 1.15; // avatar diameter
    return (
      <div style={{
        width: D, position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {selected && (
          <div style={{
            position: 'absolute', top: -4, left: -4, right: -4, bottom: -18,
            border: '2px dashed #d4ff3d', borderRadius: '50%',
            animation: 'pulse 1.2s infinite',
          }}/>
        )}
        <div style={{
          width: D, height: D, borderRadius: '50%',
          border: `3px solid ${primary}`,
          outline: `2px solid ${secondary}`,
          overflow: 'hidden', position: 'relative',
          boxShadow: '0 6px 16px rgba(0,0,0,0.55)',
          background: '#222',
        }}>
          <img src={photo} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          }}/>
          {/* number badge */}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            minWidth: 20 * size, height: 20 * size, padding: `0 ${5*size}px`,
            borderRadius: 10 * size,
            background: primary, color: text,
            border: `2px solid ${secondary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Archivo Black', fontSize: 11 * size,
            lineHeight: 1, letterSpacing: '-0.02em',
          }}>{number}</div>
        </div>
        {/* position tag */}
        <div style={{
          fontFamily: 'Archivo Black', fontSize: 9 * size, color: '#fff',
          background: '#0a0a0a', border: `1.5px solid ${primary}`,
          padding: `${2*size}px ${6*size}px`, letterSpacing: '0.1em',
          marginTop: -2, lineHeight: 1, whiteSpace: 'nowrap',
        }}>{pos}</div>
        {/* name */}
        {name && (
          <div style={{
            fontFamily: 'Bebas Neue', fontSize: 14 * size, color: '#fff',
            letterSpacing: '0.06em', marginTop: 4, lineHeight: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.7)',
            whiteSpace: 'nowrap',
          }}>{name}</div>
        )}
      </div>
    );
  }

  /* ---------- DEFAULT JERSEY MODE ---------- */
  return (
    <div style={{
      width: W, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {selected && (
        <div style={{
          position: 'absolute',
          top: -4, left: -6, right: -6, bottom: -18,
          border: '2px dashed #d4ff3d',
          borderRadius: 4,
          animation: 'pulse 1.2s infinite',
        }}/>
      )}
      <svg width={W} height={W * 0.92} viewBox="0 0 100 90" style={{ display: 'block', overflow: 'visible' }}>
        {/* shadow */}
        <ellipse cx="50" cy="86" rx="30" ry="3" fill="rgba(0,0,0,0.35)"/>
        {/* jersey body */}
        <path
          d="M 10 18 L 30 4 L 42 12 L 58 12 L 70 4 L 90 18 L 98 30 L 86 34 L 84 82 L 16 82 L 14 34 L 2 30 Z"
          fill={primary} stroke={secondary} strokeWidth="2" strokeLinejoin="round"
        />
        {/* collar V */}
        <path d="M 42 12 L 50 22 L 58 12 L 50 16 Z" fill={secondary}/>
        {/* sleeve trim */}
        <path d="M 10 18 L 14 34 L 2 30 Z" fill={secondary} opacity="0.5"/>
        <path d="M 90 18 L 86 34 L 98 30 Z" fill={secondary} opacity="0.5"/>
        {/* number */}
        <text x="50" y="62" textAnchor="middle" fill={text} fontFamily="Archivo Black"
          fontSize="38" letterSpacing="-0.04em">{number}</text>
      </svg>
      {/* position tag */}
      <div style={{
        fontFamily: 'Archivo Black', fontSize: 9 * size, color: '#fff',
        background: '#0a0a0a', border: `1.5px solid ${primary}`,
        padding: `${2*size}px ${6*size}px`, letterSpacing: '0.1em',
        marginTop: -6 * size, lineHeight: 1, whiteSpace: 'nowrap',
      }}>{pos}</div>
      {/* name */}
      {name && (
        <div style={{
          fontFamily: 'Bebas Neue', fontSize: 14 * size, color: '#fff',
          letterSpacing: '0.06em', marginTop: 4, lineHeight: 1,
          textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.7)',
          whiteSpace: 'nowrap',
        }}>{name}</div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------
   JERSEY (SVG) — pure SVG version used by the PNG export.
   Uses system fonts that survive canvas serialization.
   ------------------------------------------------------------ */
const JerseySVG = ({ cx, cy, primary, secondary, text, number, name, pos, showName, size = 1, photo, uid }) => {
  const s = size;
  if (photo) {
    const r = 28 * s;
    const clipId = `clip-${uid}`;
    return (
      <g transform={`translate(${cx} ${cy})`}>
        <defs>
          <clipPath id={clipId}>
            <circle cx="0" cy="0" r={r - 3}/>
          </clipPath>
        </defs>
        <ellipse cx="0" cy={r + 4} rx={r * 0.9} ry={r * 0.14} fill="rgba(0,0,0,0.45)"/>
        <circle cx="0" cy="0" r={r} fill={secondary}/>
        <image href={photo} x={-(r-3)} y={-(r-3)} width={(r-3)*2} height={(r-3)*2}
          clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice"/>
        <circle cx="0" cy="0" r={r-3} fill="none" stroke={primary} strokeWidth={3}/>
        <circle cx={r*0.72} cy={r*0.72} r={10*s} fill={primary} stroke={secondary} strokeWidth={2}/>
        <text x={r*0.72} y={r*0.72 + 4*s} textAnchor="middle"
          fill={text} fontFamily="Impact, 'Arial Black', sans-serif"
          fontSize={13*s} fontWeight="900">{number}</text>
        {/* position tag — rendered BEFORE name so name draws on top if they ever overlap */}
        <rect x={-18*s} y={r + 8*s} width={36*s} height={14*s}
          fill="#0a0a0a" stroke={primary} strokeWidth={1.5}/>
        <text x="0" y={r + 18*s} textAnchor="middle"
          fill="#fff" fontFamily="Impact, 'Arial Black', sans-serif"
          fontSize={9*s} letterSpacing={0.8}>{pos}</text>
        {showName && name && (
          <text x="0" y={r + 44*s} textAnchor="middle"
            fill="#fff" fontFamily="'Arial Narrow', Arial, sans-serif"
            fontSize={14*s} fontWeight="700" letterSpacing={0.5}
            stroke="rgba(0,0,0,0.9)" strokeWidth={0.6} paintOrder="stroke">
            {name.toUpperCase()}</text>
        )}
      </g>
    );
  }
  // jersey mode
  const W = 50 * s;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <ellipse cx="0" cy={W*0.4} rx={W*0.33} ry={W*0.04} fill="rgba(0,0,0,0.4)"/>
      <g transform={`translate(${-W/2} ${-W*0.46})`}>
        <path
          d={`M ${W*0.10} ${W*0.18} L ${W*0.30} ${W*0.04} L ${W*0.42} ${W*0.12} L ${W*0.58} ${W*0.12} L ${W*0.70} ${W*0.04} L ${W*0.90} ${W*0.18} L ${W*0.98} ${W*0.30} L ${W*0.86} ${W*0.34} L ${W*0.84} ${W*0.82} L ${W*0.16} ${W*0.82} L ${W*0.14} ${W*0.34} L ${W*0.02} ${W*0.30} Z`}
          fill={primary} stroke={secondary} strokeWidth={2} strokeLinejoin="round"/>
        <path d={`M ${W*0.42} ${W*0.12} L ${W*0.50} ${W*0.22} L ${W*0.58} ${W*0.12} L ${W*0.50} ${W*0.16} Z`} fill={secondary}/>
        <path d={`M ${W*0.10} ${W*0.18} L ${W*0.14} ${W*0.34} L ${W*0.02} ${W*0.30} Z`} fill={secondary} opacity={0.5}/>
        <path d={`M ${W*0.90} ${W*0.18} L ${W*0.86} ${W*0.34} L ${W*0.98} ${W*0.30} Z`} fill={secondary} opacity={0.5}/>
        <text x={W*0.50} y={W*0.64} textAnchor="middle"
          fill={text} fontFamily="Impact, 'Arial Black', sans-serif"
          fontSize={W*0.38} fontWeight="900" letterSpacing={-0.5}>{number}</text>
      </g>
      {/* position tag — rendered BEFORE name so name draws on top if they ever overlap */}
      <rect x={-16*s} y={W*0.38} width={32*s} height={12*s}
        fill="#0a0a0a" stroke={primary} strokeWidth={1.3}/>
      <text x="0" y={W*0.38 + 8.5*s} textAnchor="middle"
        fill="#fff" fontFamily="Impact, 'Arial Black', sans-serif"
        fontSize={8.5*s} letterSpacing={0.7}>{pos}</text>
      {showName && name && (
        <text x="0" y={W*0.38 + 34*s} textAnchor="middle"
          fill="#fff" fontFamily="'Arial Narrow', Arial, sans-serif"
          fontSize={13*s} fontWeight="700" letterSpacing={0.5}
          stroke="rgba(0,0,0,0.9)" strokeWidth={0.5} paintOrder="stroke">
          {name.toUpperCase()}</text>
      )}
    </g>
  );
};

/* ------------------------------------------------------------
   EXPORT SCENE — the hidden full-resolution SVG that gets
   serialized and rasterised into a PNG for social sharing.
   ------------------------------------------------------------ */
const ExportScene = React.forwardRef(({
  width, height, sport, formation, players, teamName, coach,
  primary, secondary, textColor, gkPrimary, gkSecondary, gkText, showNames,
}, ref) => {
  const PAD = Math.round(width * 0.04);
  const headerH = Math.round(height * 0.10);
  const footerH = Math.round(height * 0.07);
  const availW = width - PAD * 2;
  const availH = height - headerH - footerH - PAD * 2;
  const fieldAR = sport.aspect;
  let fieldW, fieldH;
  if (availW / availH > fieldAR) {
    fieldH = availH;
    fieldW = availH * fieldAR;
  } else {
    fieldW = availW;
    fieldH = availW / fieldAR;
  }
  const fieldX = (width - fieldW) / 2;
  const fieldY = headerH + PAD + (availH - fieldH) / 2;
  const [surfTop, surfBot] = SURFACE_STOPS[sport.field];

  // Jersey size: each player gets (fieldArea / count) of space.
  // Jersey takes ~0.38× the sqrt of that area, which gives a comfortable
  // fit without overlap on any formation. W=50 at size=1.
  const areaPerPlayer = (fieldW * fieldH) / sport.count;
  const spacePerPlayer = Math.sqrt(areaPerPlayer);
  const targetJerseyWidth = spacePerPlayer * 0.38;
  // Also cap jersey width to a fraction of field width so sparse sports
  // don't end up with huge jerseys swamping the pitch.
  const widthCap = fieldW * 0.16;
  const finalWidth = Math.min(targetJerseyWidth, widthCap);
  const jSize = Math.max(0.7, finalWidth / 50);

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg"
      width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#161616"/>
          <stop offset="100%" stopColor="#0a0a0a"/>
        </linearGradient>
        <linearGradient id="surf-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={surfTop}/>
          <stop offset="100%" stopColor={surfBot}/>
        </linearGradient>
      </defs>

      {/* background */}
      <rect width={width} height={height} fill="url(#bg-grad)"/>
      {/* accent bar */}
      <rect x="0" y="0" width={width} height="6" fill="#d4ff3d"/>

      {/* header */}
      <text x={PAD} y={PAD + headerH * 0.55}
        fill="#fff" fontFamily="Impact, 'Arial Black', sans-serif"
        fontSize={headerH * 0.5} fontWeight="900" letterSpacing={-1}>
        {teamName || 'FORMATION XI'}
      </text>
      <text x={PAD} y={PAD + headerH * 0.85}
        fill="#d4ff3d" fontFamily="Consolas, monospace"
        fontSize={headerH * 0.18} letterSpacing={3}>
        {sport.name.toUpperCase()} · {formation}
      </text>
      <text x={width - PAD} y={PAD + headerH * 0.55} textAnchor="end"
        fill="#888" fontFamily="Consolas, monospace"
        fontSize={headerH * 0.2} letterSpacing={2}>
        {sport.sub.toUpperCase()}
      </text>
      <text x={width - PAD} y={PAD + headerH * 0.85} textAnchor="end"
        fill="#555" fontFamily="Consolas, monospace"
        fontSize={headerH * 0.16} letterSpacing={2}>
        FORMATION · STUDIO
      </text>

      {/* field panel */}
      <rect x={fieldX - 2} y={fieldY - 2} width={fieldW + 4} height={fieldH + 4}
        fill="#2a2a2a"/>
      <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH}
        fill="url(#surf-grad)"/>

      {/* field markings — nested SVG with 0–100 viewBox */}
      <svg x={fieldX} y={fieldY} width={fieldW} height={fieldH}
        viewBox="0 0 100 100" preserveAspectRatio="none" overflow="hidden">
        <Field sport={sport}/>
      </svg>

      {/* players */}
      {players.map((p, i) => {
        const keeper = isKeeper(p.pos);
        return (
          <JerseySVG key={p.id} uid={`${i}-${p.id.slice(0,4)}`}
            cx={fieldX + (p.x / 100) * fieldW}
            cy={fieldY + (p.y / 100) * fieldH}
            primary={keeper ? gkPrimary : primary}
            secondary={keeper ? gkSecondary : secondary}
            text={keeper ? gkText : textColor}
            number={p.number} name={p.name} pos={p.pos}
            showName={showNames} size={jSize} photo={p.photo}
          />
        );
      })}

      {/* footer */}
      <text x={PAD} y={height - PAD - footerH * 0.25}
        fill="#888" fontFamily="Consolas, monospace"
        fontSize={footerH * 0.32} letterSpacing={2}>
        COACH · {coach || '—'}
      </text>
      <text x={width - PAD} y={height - PAD - footerH * 0.25} textAnchor="end"
        fill="#555" fontFamily="Consolas, monospace"
        fontSize={footerH * 0.28} letterSpacing={2}>
        {players.length}/{sport.count} SLOTS
      </text>
    </svg>
  );
});

/* ------------------------------------------------------------
   STORAGE — window.storage wraps with graceful fallback.
   ------------------------------------------------------------ */
const SAVE_PREFIX = 'lineup:';
const hasStorage = () => typeof window !== 'undefined' && !!window.storage;

async function storageSave(id, data) {
  if (!hasStorage()) throw new Error('Storage unavailable');
  return window.storage.set(SAVE_PREFIX + id, JSON.stringify(data));
}
async function storageList() {
  if (!hasStorage()) return [];
  try {
    const res = await window.storage.list(SAVE_PREFIX);
    const keys = res?.keys || [];
    const items = await Promise.all(keys.map(async (k) => {
      try {
        const r = await window.storage.get(k);
        return { key: k, ...JSON.parse(r.value) };
      } catch { return null; }
    }));
    return items.filter(Boolean).sort((a,b) => (b.savedAt||0) - (a.savedAt||0));
  } catch { return []; }
}
async function storageDelete(key) {
  if (!hasStorage()) return;
  try { await window.storage.delete(key); } catch {}
}

/* ------------------------------------------------------------
   SHARE — URL-hash encoding for shareable links.
   Uses a compact JSON schema + native gzip compression +
   base64url. Photos are optional (big payloads).
   ------------------------------------------------------------ */
const SHARE_PARAM = 's';
const SHARE_VERSION = 1;

function toB64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function gzipCompress(str) {
  const input = new TextEncoder().encode(str);
  if (typeof CompressionStream === 'undefined') return input;
  const stream = new Blob([input]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function gzipDecompress(bytes) {
  // If it's already valid JSON (no compression fallback), return as text.
  if (typeof DecompressionStream === 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  } catch {
    // Not gzipped — fall back to raw UTF-8 (handles older links).
    return new TextDecoder().decode(bytes);
  }
}

function toShareState(s, includePhotos) {
  return {
    v: SHARE_VERSION,
    g: s.sportId,
    f: s.formation,
    t: s.teamName,
    c: s.coach,
    k: [s.primary, s.secondary, s.textColor, s.gkPrimary, s.gkSecondary, s.gkText],
    n: s.showNames ? 1 : 0,
    p: s.players.map(p => {
      const a = [p.pos, Math.round(p.x*10)/10, Math.round(p.y*10)/10, p.number, p.name || ''];
      if (includePhotos && p.photo) a.push(p.photo);
      return a;
    }),
  };
}
function fromShareState(d) {
  if (!d || d.v !== SHARE_VERSION) throw new Error('unsupported share version');
  return {
    sportId: d.g,
    formation: d.f,
    teamName: d.t,
    coach: d.c,
    primary: d.k[0], secondary: d.k[1], textColor: d.k[2],
    gkPrimary: d.k[3], gkSecondary: d.k[4], gkText: d.k[5],
    showNames: !!d.n,
    players: d.p.map(a => ({
      id: rid(),
      pos: a[0], x: a[1], y: a[2],
      number: a[3], name: a[4] || '',
      photo: a[5] || null,
    })),
  };
}

async function encodeShareUrl(state, includePhotos) {
  const compact = toShareState(state, includePhotos);
  const json = JSON.stringify(compact);
  const bytes = await gzipCompress(json);
  return toB64Url(bytes);
}
async function decodeShareUrl(encoded) {
  const bytes = fromB64Url(encoded);
  const json = await gzipDecompress(bytes);
  return fromShareState(JSON.parse(json));
}

function readShareHash() {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(new RegExp(`[#&]${SHARE_PARAM}=([^&]+)`));
  return m ? m[1] : null;
}

/* ------------------------------------------------------------
   MAIN APP
   ------------------------------------------------------------ */
export default function FormationStudio() {
  const [sportId, setSportId] = useState('soccer');
  const sport = SPORTS[sportId];
  const formationNames = Object.keys(sport.formations);

  const [formation, setFormation] = useState(formationNames[0]);
  const [players, setPlayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sheetOpenId, setSheetOpenId] = useState(null);
  const pointerStartRef = useRef({ x: 0, y: 0, moved: false });
  const [teamName, setTeamName] = useState('FORMATION XI');
  const [coach, setCoach] = useState('C. KLOPPFORD');
  const [primary, setPrimary] = useState('#e63946');
  const [secondary, setSecondary] = useState('#1d1d1d');
  const [textColor, setTextColor] = useState('#ffffff');
  /* keeper kit — used for GK / G / L (libero) */
  const [gkPrimary, setGkPrimary] = useState('#f4ce14');
  const [gkSecondary, setGkSecondary] = useState('#1d1d1d');
  const [gkText, setGkText] = useState('#1d1d1d');
  const [showGrid, setShowGrid] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [draggingId, setDraggingId] = useState(null);

  const fieldRef = useRef(null);
  const loadingRef = useRef(false);

  /* reset players when sport or formation changes.
     If the new layout has the same player count (e.g. swapping formation
     within a sport), we preserve names/numbers/photos and only move bodies.
     Skipped when loading a saved lineup — that sets everything explicitly. */
  useEffect(() => {
    if (loadingRef.current) return;
    const fList = SPORTS[sportId].formations[formation] ?? Object.values(SPORTS[sportId].formations)[0];
    setPlayers(prev => {
      if (prev.length === fList.length) {
        return fList.map(([pos, x, y], i) => ({ ...prev[i], pos, x, y }));
      }
      return fList.map(([pos, x, y], i) => ({
        id: rid(), pos, x, y, number: i+1, name: '', photo: null,
      }));
    });
    setSelectedId(null);
  }, [sportId, formation]);

  /* when sport changes, set first formation */
  useEffect(() => {
    if (loadingRef.current) return;
    setFormation(Object.keys(SPORTS[sportId].formations)[0]);
  }, [sportId]);

  /* drag handlers */
  const onPointerDown = (id) => (e) => {
    e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    pointerStartRef.current = { x: cx, y: cy, moved: false };
    setDraggingId(id);
    setSelectedId(id);
  };

  useEffect(() => {
    if (draggingId === null) return;
    const move = (e) => {
      if (!fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      // Threshold: distinguish a tap from a drag.
      const st = pointerStartRef.current;
      if (!st.moved && Math.hypot(cx - st.x, cy - st.y) > 5) {
        st.moved = true;
      }
      if (!st.moved) return; // don't reposition on micro-movements
      const x = clamp(((cx - rect.left) / rect.width) * 100, 3, 97);
      const y = clamp(((cy - rect.top) / rect.height) * 100, 3, 97);
      setPlayers(ps => ps.map(p => p.id === draggingId ? { ...p, x, y } : p));
    };
    const up = () => {
      // If pointer didn't move past the drag threshold, treat as a tap
      // and open the bottom sheet for the tapped jersey.
      if (!pointerStartRef.current.moved) {
        setSheetOpenId(draggingId);
      }
      setDraggingId(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [draggingId]);

  const selectedPlayer = players.find(p => p.id === selectedId);
  const updateSelected = (patch) => {
    setPlayers(ps => ps.map(p => p.id === selectedId ? { ...p, ...patch } : p));
  };

  /* bottom sheet: close on Esc */
  useEffect(() => {
    if (sheetOpenId === null) return;
    const onKey = (e) => { if (e.key === 'Escape') setSheetOpenId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpenId]);

  const sheetPlayer = players.find(p => p.id === sheetOpenId);
  const updateSheetPlayer = (patch) => {
    setPlayers(ps => ps.map(p => p.id === sheetOpenId ? { ...p, ...patch } : p));
  };

  const randomizeNames = () => {
    const pool = [...SAMPLE_NAMES].sort(() => Math.random() - 0.5);
    setPlayers(ps => ps.map((p,i) => ({ ...p, name: pool[i % pool.length] })));
  };
  const clearNames = () => setPlayers(ps => ps.map(p => ({ ...p, name: '' })));
  const clearPhotos = () => setPlayers(ps => ps.map(p => ({ ...p, photo: null })));
  const resetPositions = () => {
    const fList = SPORTS[sportId].formations[formation];
    setPlayers(ps => ps.map((p,i) => ({ ...p, x: fList[i][1], y: fList[i][2], pos: fList[i][0] })));
  };

  /* photo upload — client-side downscale to keep state tidy */
  const uploadPhotoFor = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 240;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        // square crop from centre
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        canvas.width = side * scale;
        canvas.height = side * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPlayers(ps => ps.map(p => p.id === id ? { ...p, photo: dataUrl } : p));
        track('photo_uploaded', { sport: sportId });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  /* ---------- LIBRARY (save/load) ---------- */
  const [savedList, setSavedList] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [storageReady, setStorageReady] = useState(true);
  const [storageMsg, setStorageMsg] = useState('');

  const refreshLibrary = useCallback(async () => {
    const items = await storageList();
    setSavedList(items);
  }, []);

  useEffect(() => {
    if (!hasStorage()) {
      setStorageReady(false);
      return;
    }
    refreshLibrary();
  }, [refreshLibrary]);

  const handleSaveLineup = async () => {
    const name = (saveName.trim() || teamName || 'Untitled').toUpperCase();
    const data = {
      name, sportId, formation, players,
      teamName, coach,
      primary, secondary, textColor,
      gkPrimary, gkSecondary, gkText,
      showNames,
      savedAt: Date.now(),
    };
    try {
      await storageSave(rid(), data);
      setStorageMsg(`✓ SAVED "${name}"`);
      setSaveName('');
      refreshLibrary();
      track('lineup_saved', { sport: sportId, formation });
      setTimeout(() => setStorageMsg(''), 2500);
    } catch (e) {
      setStorageMsg('✕ SAVE FAILED');
      setTimeout(() => setStorageMsg(''), 2500);
    }
  };

  const handleLoadLineup = (item) => {
    loadingRef.current = true;
    setSportId(item.sportId);
    setFormation(item.formation);
    setPlayers(item.players);
    setTeamName(item.teamName);
    setCoach(item.coach);
    setPrimary(item.primary);
    setSecondary(item.secondary);
    setTextColor(item.textColor);
    setGkPrimary(item.gkPrimary);
    setGkSecondary(item.gkSecondary);
    setGkText(item.gkText);
    if (typeof item.showNames === 'boolean') setShowNames(item.showNames);
    setSelectedId(null);
    setStorageMsg(`✓ LOADED "${item.name}"`);
    // release the lock after React has flushed the state updates
    setTimeout(() => { loadingRef.current = false; }, 80);
    setTimeout(() => setStorageMsg(''), 2500);
  };

  const handleDeleteLineup = async (key) => {
    await storageDelete(key);
    refreshLibrary();
  };

  /* ---------- EXPORT (PNG) ---------- */
  const [exportFormat, setExportFormat] = useState('square'); // square | story | wide
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  const EXPORT_DIMS = {
    square: { w: 1080, h: 1080, label: '1:1 POST',   sub: '1080 × 1080' },
    story:  { w: 1080, h: 1920, label: '9:16 STORY', sub: '1080 × 1920' },
    wide:   { w: 1600, h:  900, label: '16:9 WIDE',  sub: '1600 × 900'  },
  };

  const handleExport = async () => {
    const svgEl = exportRef.current;
    if (!svgEl) return;
    setExporting(true);
    try {
      // 1. Wait for web fonts to finish loading — critical for correct text metrics.
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      // Small extra tick so the hidden export SVG has time to re-layout
      // with the now-loaded fonts before we serialize it.
      await new Promise(r => setTimeout(r, 100));
      const { w, h } = EXPORT_DIMS[exportFormat];
      // 2. Serialize the SVG. Inline XML namespace if missing.
      const serializer = new XMLSerializer();
      let svgStr = serializer.serializeToString(svgEl);
      if (!svgStr.match(/^<svg[^>]+xmlns=/)) {
        svgStr = svgStr.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if (!svgStr.match(/xmlns:xlink=/)) {
        svgStr = svgStr.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }
      // 3. Use a data URL rather than a blob URL — this avoids a class of
      //    production-only issues where <defs> inside nested <svg> don't
      //    resolve, and survives stricter canvas tainting rules.
      const encoded = encodeURIComponent(svgStr)
        .replace(/'/g, '%27').replace(/"/g, '%22');
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error('SVG-to-image failed'));
        img.src = dataUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const pngBlob = await new Promise((res) => canvas.toBlob(res, 'image/png', 0.95));
      const dlUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `lineup-${(teamName || 'team').toLowerCase().replace(/\s+/g,'-')}-${exportFormat}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(dlUrl), 2000);
      track('lineup_exported', { sport: sportId, format: exportFormat });
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed — check the console for details.');
    } finally {
      setExporting(false);
    }
  };

  /* ---------- SHARE (URL hash) ---------- */
  const [shareUrl, setShareUrl] = useState('');
  const [shareIncludePhotos, setShareIncludePhotos] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [shareGenerating, setShareGenerating] = useState(false);
  const shareInputRef = useRef(null);
  const mountedRef = useRef(false);

  const buildStatePayload = () => ({
    sportId, formation, players, teamName, coach,
    primary, secondary, textColor,
    gkPrimary, gkSecondary, gkText,
    showNames,
  });

  const generateShareUrl = async () => {
    setShareGenerating(true);
    try {
      const encoded = await encodeShareUrl(buildStatePayload(), shareIncludePhotos);
      const url = `${window.location.origin}${window.location.pathname}#${SHARE_PARAM}=${encoded}`;
      setShareUrl(url);
      setShareStatus('');
      track('lineup_shared', { sport: sportId, includePhotos: shareIncludePhotos });
    } catch (e) {
      console.error(e);
      setShareStatus('✕ GENERATION FAILED');
    } finally {
      setShareGenerating(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('✓ COPIED TO CLIPBOARD');
      setTimeout(() => setShareStatus(''), 2500);
    } catch {
      // Fallback — select the input so the user can copy manually.
      if (shareInputRef.current) {
        shareInputRef.current.select();
        try { document.execCommand('copy'); setShareStatus('✓ COPIED'); }
        catch { setShareStatus('✕ COPY BLOCKED — SELECT MANUALLY'); }
        setTimeout(() => setShareStatus(''), 2500);
      }
    }
  };

  const nativeShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: teamName || 'My Lineup',
          text: `${teamName || 'Lineup'} — ${sport.name} ${formation}`,
          url: shareUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      copyShareUrl();
    }
  };

  /* Regenerate URL whenever anything shareable changes (but only if one
     already exists — don't spring it on users unsolicited). Debounced so
     dragging doesn't spam the encoder. */
  useEffect(() => {
    if (!shareUrl) return;
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const encoded = await encodeShareUrl(buildStatePayload(), shareIncludePhotos);
        if (!alive) return;
        setShareUrl(`${window.location.origin}${window.location.pathname}#${SHARE_PARAM}=${encoded}`);
      } catch {}
    }, 400);
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportId, formation, players, teamName, coach,
      primary, secondary, textColor, gkPrimary, gkSecondary, gkText,
      showNames, shareIncludePhotos]);

  /* ---------- LOAD FROM URL ON MOUNT ---------- */
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const encoded = readShareHash();
    if (!encoded) return;
    loadingRef.current = true;
    decodeShareUrl(encoded).then(st => {
      setSportId(st.sportId);
      setFormation(st.formation);
      setPlayers(st.players);
      setTeamName(st.teamName);
      setCoach(st.coach);
      setPrimary(st.primary);
      setSecondary(st.secondary);
      setTextColor(st.textColor);
      setGkPrimary(st.gkPrimary);
      setGkSecondary(st.gkSecondary);
      setGkText(st.gkText);
      if (typeof st.showNames === 'boolean') setShowNames(st.showNames);
      // scrub the hash so editing doesn't keep a stale URL visible
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setShareStatus('✓ LOADED SHARED LINEUP');
      setTimeout(() => setShareStatus(''), 3000);
    }).catch(err => {
      console.error('Share decode failed:', err);
      setShareStatus('✕ INVALID SHARE LINK');
      setTimeout(() => setShareStatus(''), 3000);
    }).finally(() => {
      setTimeout(() => { loadingRef.current = false; }, 80);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* preset kits — outfield + keeper */
  const KITS = [
    { label: 'CLASSIC RED', p:'#e63946', s:'#1d1d1d', t:'#ffffff', gp:'#f4ce14', gs:'#1d1d1d', gt:'#1d1d1d' },
    { label: 'MIDNIGHT',    p:'#1d3557', s:'#fcbf49', t:'#ffffff', gp:'#2a9d8f', gs:'#1d1d1d', gt:'#ffffff' },
    { label: 'NEON',        p:'#d4ff3d', s:'#0a0a0a', t:'#0a0a0a', gp:'#ff006e', gs:'#0a0a0a', gt:'#ffffff' },
    { label: 'COBALT',      p:'#0353a4', s:'#ffffff', t:'#ffffff', gp:'#ffbe0b', gs:'#0a0a0a', gt:'#0a0a0a' },
    { label: 'MAGENTA',     p:'#d62a8d', s:'#0a0a0a', t:'#ffffff', gp:'#06d6a0', gs:'#0a0a0a', gt:'#0a0a0a' },
    { label: 'FOREST',      p:'#2a6041', s:'#f4ce14', t:'#ffffff', gp:'#e76f51', gs:'#0a0a0a', gt:'#ffffff' },
    { label: 'MONOCHROME',  p:'#ffffff', s:'#0a0a0a', t:'#0a0a0a', gp:'#8d99ae', gs:'#0a0a0a', gt:'#ffffff' },
    { label: 'SUNSET',      p:'#ff6b35', s:'#004e89', t:'#ffffff', gp:'#8338ec', gs:'#ffffff', gt:'#ffffff' },
  ];

  /* sizing for jerseys varies by sport (crowded vs sparse) */
  const jerseySize = sport.count >= 15 ? 0.95 : sport.count >= 11 ? 1.1 : sport.count >= 7 ? 1.25 : 1.4;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(1200px 600px at 20% -10%, #1a1a1a 0%, #0a0a0a 60%)',
      color: '#ededed', fontFamily: 'Archivo, sans-serif',
    }}>
      <style>{FONTS}</style>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .display { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; }
        .bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
        .scroll-x { scrollbar-width: none; }
        .scroll-x::-webkit-scrollbar { display: none; }
        input[type="text"], input[type="number"] {
          background: #141414; border: 1px solid #2a2a2a; color: #ededed;
          padding: 10px 12px; font-family: 'JetBrains Mono', monospace;
          font-size: 12px; outline: none; width: 100%; letter-spacing: 0.02em;
        }
        input[type="text"]:focus, input[type="number"]:focus { border-color: #d4ff3d; }
        button { font-family: 'Archivo', sans-serif; cursor: pointer; border: none; }
        .btn {
          background: #141414; border: 1px solid #2a2a2a; color: #ededed;
          padding: 10px 14px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase; transition: all .15s;
        }
        .btn:hover { border-color: #d4ff3d; color: #d4ff3d; }
        .btn-primary {
          background: #d4ff3d; color: #0a0a0a; border: 1px solid #d4ff3d;
          padding: 10px 14px; font-size: 11px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .btn-primary:hover { background: #b8e032; }
        .chip {
          padding: 6px 10px; border: 1px solid #2a2a2a; background: #141414;
          color: #ffffff;
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer; white-space: nowrap;
          font-family: 'JetBrains Mono', monospace;
        }
        .chip:hover { border-color: #666; }
        .chip.active { background: #d4ff3d; color: #0a0a0a; border-color: #d4ff3d; }
        .grid-noise {
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        @media (max-width: 900px) {
          .studio-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ===== TOP BAR ===== */}
      <header style={{
        borderBottom: '1px solid #1f1f1f',
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', gap: 24,
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>
            FORMATION<span style={{ color: '#d4ff3d' }}>/</span>STUDIO
          </div>
          <div className="mono" style={{ fontSize: 10, color: '#666', letterSpacing: '0.2em' }}>
            v1.0 — TEN SPORTS
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div className="mono" style={{ fontSize: 10, color: '#888' }}>
          {players.length} / {sport.count} SLOTS · {formation.toUpperCase()}
        </div>
        {storageReady && (
          <button className="btn" onClick={handleSaveLineup} style={{ marginLeft: 8 }}>
            ★ SAVE
          </button>
        )}
        <button className="btn" onClick={generateShareUrl} disabled={shareGenerating}>
          {shareGenerating ? '⏳ …' : '🔗 SHARE'}
        </button>
        <button className="btn-primary" onClick={handleExport} disabled={exporting}>
          {exporting ? '⏳ …' : '↓ EXPORT PNG'}
        </button>
      </header>

      {/* ===== SPORT SWITCHER ===== */}
      <div className="scroll-x" style={{
        display: 'flex', gap: 8, padding: '16px 24px',
        overflowX: 'auto', borderBottom: '1px solid #1f1f1f',
      }}>
        {SPORT_ORDER.map(id => {
          const sp = SPORTS[id];
          const active = id === sportId;
          return (
            <button key={id} onClick={() => setSportId(id)} style={{
              padding: '14px 18px',
              background: active ? '#d4ff3d' : '#141414',
              color: active ? '#0a0a0a' : '#ededed',
              border: `1px solid ${active ? '#d4ff3d' : '#2a2a2a'}`,
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', transition: 'all .15s',
              minWidth: 150,
            }}>
              <span style={{ fontSize: 22 }}>{sp.glyph}</span>
              <div style={{ textAlign: 'left' }}>
                <div className="display" style={{ fontSize: 13, lineHeight: 1 }}>
                  {sp.name.toUpperCase()}
                </div>
                <div className="mono" style={{
                  fontSize: 9, marginTop: 3, opacity: 0.7, letterSpacing: '0.12em',
                }}>
                  {sp.sub.toUpperCase()}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ===== MAIN GRID ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 320px',
        gap: 24, padding: 24, maxWidth: 1600, margin: '0 auto',
      }} className="studio-grid">
        {/* ---------- LEFT: field + formation picker ---------- */}
        <div>
          {/* formation chips + kit presets */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            marginBottom: 16, alignItems: 'center',
          }}>
            <span className="mono" style={{ fontSize: 10, color: '#666', letterSpacing: '0.2em' }}>
              FORMATION
            </span>
            {formationNames.map(f => (
              <button key={f} onClick={() => setFormation(f)}
                className={`chip chip-formation ${f === formation ? 'active' : ''}`}>{f}</button>
            ))}
            <div style={{ flex: 1 }}/>
            <button onClick={resetPositions} className="chip">⟲ RESET POS</button>
            <button onClick={randomizeNames} className="chip">🎲 NAMES</button>
            <button onClick={clearNames} className="chip">CLEAR NAMES</button>
            <button onClick={clearPhotos} className="chip">CLEAR PHOTOS</button>
          </div>

          {/* the field */}
          <div style={{
            position: 'relative',
            background: SURFACE[sport.field] || '#222',
            border: '2px solid #2a2a2a',
            overflow: 'hidden',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.3)',
            aspectRatio: sport.aspect,
            width: '100%',
            maxWidth: `calc(75vh * ${sport.aspect})`,
            margin: '0 auto',
          }}>
            {/* team header strip */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
              padding: '10px 14px',
              background: 'linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0) 100%)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <div className="display" style={{
                fontSize: 18, color: '#fff', letterSpacing: '0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}>{teamName}</div>
              <div className="mono" style={{
                fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.2em',
              }}>
                {sport.name.toUpperCase()} · {formation}
              </div>
            </div>

            {/* bottom strip — coach + watermark */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
              padding: '10px 14px',
              background: 'linear-gradient(0deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0) 100%)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <div className="mono" style={{
                fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.2em',
              }}>COACH · {coach}</div>
              <div className="bebas" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                FORMATION/STUDIO
              </div>
            </div>

            {/* SVG field markings only — players are HTML overlays below */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
            >
              <Field sport={sport}/>
              {showGrid && (
                <g stroke="rgba(255,255,255,0.08)" strokeWidth="0.15" vectorEffect="non-scaling-stroke">
                  {Array.from({length: 9}, (_,i)=>(i+1)*10).map(v => (
                    <g key={v}>
                      <line x1={v} y1="0" x2={v} y2="100"/>
                      <line x1="0" y1={v} x2="100" y2={v}/>
                    </g>
                  ))}
                </g>
              )}
            </svg>

            {/* HTML player overlay — immune to aspect-ratio distortion */}
            <div
              ref={fieldRef}
              style={{
                position: 'absolute', inset: 0,
                cursor: draggingId ? 'grabbing' : 'default',
              }}
            >
              {players.map(p => {
                const keeper = isKeeper(p.pos);
                return (
                  <div
                    key={p.id}
                    onMouseDown={onPointerDown(p.id)}
                    onTouchStart={onPointerDown(p.id)}
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      position: 'absolute',
                      left: `${p.x}%`, top: `${p.y}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: draggingId === p.id ? 'grabbing' : 'grab',
                      userSelect: 'none', touchAction: 'none',
                      zIndex: selectedId === p.id ? 20 : 10,
                    }}
                  >
                    <Jersey
                      primary={keeper ? gkPrimary : primary}
                      secondary={keeper ? gkSecondary : secondary}
                      text={keeper ? gkText : textColor}
                      number={p.number}
                      name={showNames ? p.name : ''}
                      pos={p.pos}
                      selected={selectedId === p.id}
                      size={jerseySize}
                      photo={p.photo}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* display toggles */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className={`chip ${showGrid ? 'active' : ''}`} onClick={() => setShowGrid(!showGrid)}>
              GRID
            </button>
            <button className={`chip ${showNames ? 'active' : ''}`} onClick={() => setShowNames(!showNames)}>
              NAMES
            </button>
            <div style={{ flex: 1 }}/>
            <div className="mono" style={{ fontSize: 10, color: '#555', alignSelf: 'center', letterSpacing: '0.15em' }}>
              TIP · DRAG JERSEYS · TAP TO EDIT
            </div>
          </div>
        </div>

        {/* ---------- RIGHT: editor column ---------- */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* team block */}
          <section style={{ border: '1px solid #1f1f1f', padding: 18, background: '#0f0f0f' }}>
            <div className="mono" style={{
              fontSize: 9, color: '#666', letterSpacing: '0.2em', marginBottom: 12,
            }}>01 · TEAM</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="mono" style={{ fontSize: 9, color: '#888', letterSpacing: '0.15em' }}>NAME</label>
                <input value={teamName} onChange={e => setTeamName(e.target.value.toUpperCase())} maxLength={32}/>
              </div>
              <div>
                <label className="mono" style={{ fontSize: 9, color: '#888', letterSpacing: '0.15em' }}>COACH</label>
                <input value={coach} onChange={e => setCoach(e.target.value.toUpperCase())} maxLength={24}/>
              </div>
            </div>
          </section>

          {/* kit block */}
          <section style={{ border: '1px solid #1f1f1f', padding: 18, background: '#0f0f0f' }}>
            <div className="mono" style={{
              fontSize: 9, color: '#666', letterSpacing: '0.2em', marginBottom: 12,
            }}>02 · KIT</div>

            {/* preset pairs — left half = outfield, right half = keeper */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
              {KITS.map(k => {
                const isActive = primary === k.p && secondary === k.s && gkPrimary === k.gp;
                return (
                  <button key={k.label} onClick={() => {
                    setPrimary(k.p); setSecondary(k.s); setTextColor(k.t);
                    setGkPrimary(k.gp); setGkSecondary(k.gs); setGkText(k.gt);
                  }}
                    title={k.label}
                    style={{
                      height: 42, position: 'relative',
                      border: `2px solid ${isActive ? '#d4ff3d' : 'transparent'}`,
                      cursor: 'pointer', overflow: 'hidden', padding: 0,
                      background: '#0a0a0a',
                    }}>
                    {/* outfield half */}
                    <div style={{ position: 'absolute', inset: 0, width: '60%', background: k.p }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: k.s }}/>
                    </div>
                    {/* keeper half */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60%', right: 0, background: k.gp }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: k.gs }}/>
                    </div>
                    {/* tiny GK tag */}
                    <div style={{
                      position: 'absolute', top: 2, right: 2,
                      fontFamily: 'Archivo Black', fontSize: 7, color: k.gt,
                      background: 'rgba(0,0,0,0.35)', padding: '1px 3px',
                      letterSpacing: '0.08em',
                    }}>GK</div>
                  </button>
                );
              })}
            </div>

            {/* OUTFIELD colors */}
            <div className="mono" style={{
              fontSize: 8, color: '#666', letterSpacing: '0.2em', marginBottom: 6,
            }}>OUTFIELD</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>PRIMARY</span>
                <input type="color" value={primary} onChange={e => setPrimary(e.target.value)}
                  style={{ width: '100%', height: 32, padding: 0, border: '1px solid #2a2a2a', background: 'none' }}/>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>TRIM</span>
                <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)}
                  style={{ width: '100%', height: 32, padding: 0, border: '1px solid #2a2a2a', background: 'none' }}/>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>NUMBER</span>
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                  style={{ width: '100%', height: 32, padding: 0, border: '1px solid #2a2a2a', background: 'none' }}/>
              </label>
            </div>

            {/* KEEPER colors */}
            <div className="mono" style={{
              fontSize: 8, color: '#666', letterSpacing: '0.2em', marginBottom: 6,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>GOALKEEPER</span>
              <span style={{ color: '#444' }}>GK · G · L</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>PRIMARY</span>
                <input type="color" value={gkPrimary} onChange={e => setGkPrimary(e.target.value)}
                  style={{ width: '100%', height: 32, padding: 0, border: '1px solid #2a2a2a', background: 'none' }}/>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>TRIM</span>
                <input type="color" value={gkSecondary} onChange={e => setGkSecondary(e.target.value)}
                  style={{ width: '100%', height: 32, padding: 0, border: '1px solid #2a2a2a', background: 'none' }}/>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>NUMBER</span>
                <input type="color" value={gkText} onChange={e => setGkText(e.target.value)}
                  style={{ width: '100%', height: 32, padding: 0, border: '1px solid #2a2a2a', background: 'none' }}/>
              </label>
            </div>
          </section>

          {/* player editor */}
          <section style={{ border: '1px solid #1f1f1f', padding: 18, background: '#0f0f0f', minHeight: 180 }}>
            <div className="mono" style={{
              fontSize: 9, color: '#666', letterSpacing: '0.2em', marginBottom: 12,
            }}>03 · PLAYER</div>
            {selectedPlayer ? (() => {
              const sel = selectedPlayer;
              const keeper = isKeeper(sel.pos);
              const selColor = keeper ? gkPrimary : primary;
              return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* photo or number */}
                  {sel.photo ? (
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      border: `3px solid ${selColor}`, overflow: 'hidden',
                      flexShrink: 0, position: 'relative',
                    }}>
                      <img src={sel.photo} alt="" style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      }}/>
                    </div>
                  ) : (
                    <div className="display" style={{
                      fontSize: 40, color: selColor, lineHeight: 1,
                    }}>#{sel.number}</div>
                  )}
                  <div>
                    <div className="mono" style={{ fontSize: 9, color: '#888', letterSpacing: '0.15em' }}>
                      POSITION {keeper && <span style={{ color: '#d4ff3d' }}>· KEEPER KIT</span>}
                    </div>
                    <div className="display" style={{ fontSize: 18, color: '#d4ff3d' }}>{sel.pos}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 6 }}>
                  <div>
                    <label className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>NUM</label>
                    <input type="number" value={sel.number} min={0} max={99}
                      onChange={e => updateSelected({ number: parseInt(e.target.value) || 0 })}/>
                  </div>
                  <div>
                    <label className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>SURNAME</label>
                    <input type="text" value={sel.name} maxLength={14}
                      placeholder="e.g. MBAPPE"
                      onChange={e => updateSelected({ name: e.target.value.toUpperCase() })}/>
                  </div>
                </div>
                <div>
                  <label className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>POSITION TAG</label>
                  <input type="text" value={sel.pos} maxLength={5}
                    onChange={e => updateSelected({ pos: e.target.value.toUpperCase() })}/>
                </div>

                {/* photo controls */}
                <div style={{ marginTop: 4 }}>
                  <label className="mono" style={{
                    fontSize: 8, color: '#888', letterSpacing: '0.15em', marginBottom: 4, display: 'block',
                  }}>PHOTO</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label className="btn" style={{
                      flex: 1, textAlign: 'center', display: 'inline-block',
                    }}>
                      {sel.photo ? '↻ REPLACE' : '↑ UPLOAD'}
                      <input type="file" accept="image/*"
                        onChange={e => uploadPhotoFor(sel.id, e.target.files[0])}
                        style={{ display: 'none' }}/>
                    </label>
                    {sel.photo && (
                      <button className="btn" onClick={() => updateSelected({ photo: null })}
                        style={{ color: '#ff6b8a' }}>
                        ✕ REMOVE
                      </button>
                    )}
                  </div>
                </div>

                <div className="mono" style={{ fontSize: 9, color: '#555', marginTop: 4, letterSpacing: '0.1em' }}>
                  X {sel.x.toFixed(0)} · Y {sel.y.toFixed(0)}
                </div>
              </div>
              );
            })() : (
              <div className="mono" style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
                TAP ANY JERSEY TO EDIT<br/>
                <span style={{ color: '#333' }}>OR DRAG TO REPOSITION</span>
              </div>
            )}
          </section>

          {/* roster */}
          <section style={{ border: '1px solid #1f1f1f', padding: 18, background: '#0f0f0f' }}>
            <div className="mono" style={{
              fontSize: 9, color: '#666', letterSpacing: '0.2em', marginBottom: 12,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>04 · ROSTER</span>
              <span style={{ color: '#444' }}>
                {players.filter(p=>p.name).length}/{players.length} NAMED
                {' · '}
                {players.filter(p=>p.photo).length}/{players.length} 📷
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
              {players.map(p => {
                const keeper = isKeeper(p.pos);
                const rowColor = keeper ? gkPrimary : primary;
                return (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 28px 40px 1fr',
                    padding: '6px 8px', textAlign: 'left', alignItems: 'center',
                    background: selectedId === p.id ? '#1a1a1a' : 'transparent',
                    border: `1px solid ${selectedId === p.id ? '#d4ff3d' : '#1a1a1a'}`,
                    color: '#ededed', gap: 8,
                  }}>
                  {p.photo ? (
                    <img src={p.photo} alt="" style={{
                      width: 22, height: 22, borderRadius: '50%', objectFit: 'cover',
                      border: `1.5px solid ${rowColor}`,
                    }}/>
                  ) : (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      border: `1px dashed ${keeper ? rowColor : '#333'}`,
                    }}/>
                  )}
                  <span className="display" style={{ fontSize: 14, color: rowColor }}>{p.number}</span>
                  <span className="mono" style={{
                    fontSize: 9, color: keeper ? '#d4ff3d' : '#888', letterSpacing: '0.1em',
                  }}>{p.pos}</span>
                  <span className="bebas" style={{ fontSize: 14, color: p.name ? '#fff' : '#444' }}>
                    {p.name || '— EMPTY —'}
                  </span>
                </button>
                );
              })}
            </div>
          </section>

          {/* 05 · LIBRARY — save / load */}
          <section style={{ border: '1px solid #1f1f1f', padding: 18, background: '#0f0f0f' }}>
            <div className="mono" style={{
              fontSize: 9, color: '#666', letterSpacing: '0.2em', marginBottom: 12,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>05 · LIBRARY</span>
              <span style={{ color: '#444' }}>{savedList.length} SAVED</span>
            </div>

            {storageReady ? (
              <>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input type="text" value={saveName}
                    placeholder="LINEUP NAME (OPTIONAL)"
                    onChange={e => setSaveName(e.target.value.toUpperCase())}
                    maxLength={32}/>
                  <button className="btn-primary" onClick={handleSaveLineup}
                    style={{ whiteSpace: 'nowrap' }}>★ SAVE</button>
                </div>

                {storageMsg && (
                  <div className="mono" style={{
                    fontSize: 10, color: storageMsg.startsWith('✓') ? '#d4ff3d' : '#ff6b8a',
                    letterSpacing: '0.15em', marginBottom: 8,
                  }}>{storageMsg}</div>
                )}

                {savedList.length === 0 ? (
                  <div className="mono" style={{
                    fontSize: 10, color: '#444', letterSpacing: '0.15em',
                    padding: '16px 0', textAlign: 'center',
                  }}>NO SAVED LINEUPS YET</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                    {savedList.map(item => (
                      <div key={item.key} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: 6, alignItems: 'center',
                        border: '1px solid #1a1a1a', padding: 8,
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="bebas" style={{
                            fontSize: 13, color: '#fff', letterSpacing: '0.05em',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{item.name}</div>
                          <div className="mono" style={{
                            fontSize: 8, color: '#666', letterSpacing: '0.15em', marginTop: 2,
                          }}>
                            {(SPORTS[item.sportId]?.name || item.sportId).toUpperCase()} · {item.formation} · {item.players?.length || 0}
                          </div>
                        </div>
                        <button className="chip" onClick={() => handleLoadLineup(item)}
                          style={{ padding: '4px 8px', fontSize: 9 }}>↑ LOAD</button>
                        <button className="chip" onClick={() => handleDeleteLineup(item.key)}
                          style={{ padding: '4px 8px', fontSize: 9, color: '#ff6b8a' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="mono" style={{
                fontSize: 10, color: '#555', letterSpacing: '0.12em', lineHeight: 1.6,
              }}>
                PERSISTENT STORAGE UNAVAILABLE<br/>
                <span style={{ color: '#333' }}>LINEUPS WON'T PERSIST BETWEEN SESSIONS</span>
              </div>
            )}
          </section>

          {/* 06 · SHARE — URL-hash share links */}
          <section style={{ border: '1px solid #1f1f1f', padding: 18, background: '#0f0f0f' }}>
            <div className="mono" style={{
              fontSize: 9, color: '#666', letterSpacing: '0.2em', marginBottom: 12,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>06 · SHARE LINK</span>
              {shareUrl && (
                <span style={{ color: shareUrl.length > 10000 ? '#fcbf49' : '#444' }}>
                  {(shareUrl.length / 1024).toFixed(1)} KB
                </span>
              )}
            </div>

            {/* photos toggle */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              padding: '8px 10px', background: '#141414',
              border: '1px solid #2a2a2a', cursor: 'pointer',
            }}>
              <input type="checkbox" checked={shareIncludePhotos}
                onChange={e => setShareIncludePhotos(e.target.checked)}
                style={{ accentColor: '#d4ff3d' }}/>
              <div style={{ flex: 1 }}>
                <div className="mono" style={{ fontSize: 10, color: '#ededed', letterSpacing: '0.1em' }}>
                  INCLUDE PLAYER PHOTOS
                </div>
                <div className="mono" style={{ fontSize: 8, color: '#666', letterSpacing: '0.12em', marginTop: 2 }}>
                  BIGGER URL · NOT RECOMMENDED FOR SMS / X
                </div>
              </div>
            </label>

            {!shareUrl ? (
              <button className="btn-primary" onClick={generateShareUrl}
                disabled={shareGenerating}
                style={{ width: '100%', padding: '12px' }}>
                {shareGenerating ? '⏳ GENERATING…' : '🔗 GENERATE LINK'}
              </button>
            ) : (
              <>
                <input ref={shareInputRef} type="text" readOnly value={shareUrl}
                  onFocus={e => e.target.select()}
                  style={{ fontSize: 10, marginBottom: 6 }}/>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-primary" onClick={copyShareUrl}
                    style={{ flex: 1, padding: '10px' }}>
                    ⎘ COPY
                  </button>
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button className="btn" onClick={nativeShare}
                      style={{ flex: 1, padding: '10px' }}>
                      ↗ SHARE…
                    </button>
                  )}
                  <button className="btn" onClick={() => setShareUrl('')}
                    style={{ padding: '10px 14px' }} title="clear">
                    ✕
                  </button>
                </div>
              </>
            )}

            {shareStatus && (
              <div className="mono" style={{
                fontSize: 10, letterSpacing: '0.15em', marginTop: 8,
                color: shareStatus.startsWith('✓') ? '#d4ff3d' : '#ff6b8a',
              }}>{shareStatus}</div>
            )}

            {shareUrl && shareUrl.length > 10000 && (
              <div className="mono" style={{
                fontSize: 9, color: '#fcbf49', letterSpacing: '0.12em',
                marginTop: 8, lineHeight: 1.5,
              }}>
                ⚠ LARGE URL — SOME PLATFORMS TRUNCATE. CONSIDER DISABLING PHOTOS.
              </div>
            )}

            <div className="mono" style={{
              fontSize: 9, color: '#555', letterSpacing: '0.12em',
              marginTop: 10, lineHeight: 1.5,
            }}>
              OPENING THE LINK RESTORES THE FULL LINEUP.
            </div>
          </section>

          {/* 07 · EXPORT — download as PNG */}
          <section style={{ border: '1px solid #1f1f1f', padding: 18, background: '#0f0f0f' }}>
            <div className="mono" style={{
              fontSize: 9, color: '#666', letterSpacing: '0.2em', marginBottom: 12,
            }}>07 · EXPORT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
              {Object.entries(EXPORT_DIMS).map(([key, dims]) => {
                const active = exportFormat === key;
                const ar = dims.w / dims.h;
                // preview box with matching aspect ratio
                const maxPreviewH = 28;
                const pw = Math.min(52, maxPreviewH * ar);
                const ph = pw / ar;
                return (
                  <button key={key} onClick={() => setExportFormat(key)}
                    className={`chip ${active ? 'active' : ''}`}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6, padding: '10px 4px',
                    }}>
                    <div style={{
                      width: pw, height: ph,
                      border: `1.5px solid ${active ? '#0a0a0a' : '#666'}`,
                      background: active ? 'rgba(0,0,0,0.1)' : 'transparent',
                    }}/>
                    <div>{dims.label}</div>
                    <span style={{ fontSize: 8, opacity: 0.7, letterSpacing: '0.1em' }}>{dims.sub}</span>
                  </button>
                );
              })}
            </div>
            <button className="btn-primary" onClick={handleExport} disabled={exporting}
              style={{ width: '100%', padding: '12px' }}>
              {exporting ? '⏳ RENDERING…' : '↓ DOWNLOAD PNG'}
            </button>
            <div className="mono" style={{
              fontSize: 9, color: '#555', letterSpacing: '0.12em',
              marginTop: 8, lineHeight: 1.5,
            }}>
              POST-READY GRAPHIC WITH TEAM NAME, COACH & FORMATION BAKED IN.
            </div>
          </section>
        </aside>
      </div>

      {/* ===== HIDDEN EXPORT SCENE ===== */}
      <div style={{
        position: 'absolute', left: -99999, top: -99999,
        pointerEvents: 'none', opacity: 0,
      }} aria-hidden="true">
        <ExportScene
          ref={exportRef}
          width={EXPORT_DIMS[exportFormat].w}
          height={EXPORT_DIMS[exportFormat].h}
          sport={sport} formation={formation} players={players}
          teamName={teamName} coach={coach}
          primary={primary} secondary={secondary} textColor={textColor}
          gkPrimary={gkPrimary} gkSecondary={gkSecondary} gkText={gkText}
          showNames={showNames}
        />
      </div>

      {/* ===== BOTTOM SHEET (jersey editor) ===== */}
      {(() => {
        const open = sheetPlayer != null;
        const sel = sheetPlayer;
        const keeper = sel ? isKeeper(sel.pos) : false;
        const selColor = sel ? (keeper ? gkPrimary : primary) : '#fff';
        return (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSheetOpenId(null)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none',
                transition: 'opacity 200ms ease',
                zIndex: 80,
              }}
            />
            {/* Sheet */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Player editor"
              style={{
                position: 'fixed', left: 0, right: 0, bottom: 0,
                maxWidth: 420, marginLeft: 'auto', marginRight: 'auto',
                background: '#0f0f0f',
                borderTop: '1px solid #1f1f1f',
                borderLeft: '1px solid #1f1f1f',
                borderRight: '1px solid #1f1f1f',
                boxShadow: '0 -16px 40px rgba(0,0,0,0.6)',
                transform: open ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 200ms ease',
                zIndex: 90,
                maxHeight: '50vh',
                overflowY: 'auto',
                padding: '16px 18px 22px',
              }}
            >
              {sel && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* header row with close */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 2,
                  }}>
                    <div className="mono" style={{
                      fontSize: 9, color: '#666', letterSpacing: '0.2em',
                    }}>EDIT PLAYER</div>
                    <button
                      onClick={() => setSheetOpenId(null)}
                      aria-label="Close"
                      style={{
                        background: 'transparent', border: '1px solid #1f1f1f',
                        color: '#888', width: 28, height: 28, cursor: 'pointer',
                        fontSize: 14, lineHeight: 1, padding: 0,
                      }}
                    >✕</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {sel.photo ? (
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        border: `3px solid ${selColor}`, overflow: 'hidden',
                        flexShrink: 0,
                      }}>
                        <img src={sel.photo} alt="" style={{
                          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        }}/>
                      </div>
                    ) : (
                      <div className="display" style={{
                        fontSize: 40, color: selColor, lineHeight: 1,
                      }}>#{sel.number}</div>
                    )}
                    <div>
                      <div className="mono" style={{ fontSize: 9, color: '#888', letterSpacing: '0.15em' }}>
                        POSITION {keeper && <span style={{ color: '#d4ff3d' }}>· KEEPER KIT</span>}
                      </div>
                      <div className="display" style={{ fontSize: 18, color: '#d4ff3d' }}>{sel.pos}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 6 }}>
                    <div>
                      <label className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>NUM</label>
                      <input type="number" value={sel.number} min={0} max={99}
                        onChange={e => updateSheetPlayer({ number: parseInt(e.target.value) || 0 })}/>
                    </div>
                    <div>
                      <label className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>SURNAME</label>
                      <input type="text" value={sel.name} maxLength={14}
                        placeholder="e.g. MBAPPE"
                        onChange={e => updateSheetPlayer({ name: e.target.value.toUpperCase() })}/>
                    </div>
                  </div>

                  <div>
                    <label className="mono" style={{ fontSize: 8, color: '#888', letterSpacing: '0.15em' }}>POSITION TAG</label>
                    <input type="text" value={sel.pos} maxLength={5}
                      onChange={e => updateSheetPlayer({ pos: e.target.value.toUpperCase() })}/>
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <label className="mono" style={{
                      fontSize: 8, color: '#888', letterSpacing: '0.15em', marginBottom: 4, display: 'block',
                    }}>PHOTO</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <label className="btn" style={{
                        flex: 1, textAlign: 'center', display: 'inline-block',
                      }}>
                        {sel.photo ? '↻ REPLACE' : '↑ UPLOAD'}
                        <input type="file" accept="image/*"
                          onChange={e => uploadPhotoFor(sel.id, e.target.files[0])}
                          style={{ display: 'none' }}/>
                      </label>
                      {sel.photo && (
                        <button className="btn" onClick={() => updateSheetPlayer({ photo: null })}
                          style={{ color: '#ff6b8a' }}>
                          ✕ REMOVE
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mono" style={{ fontSize: 9, color: '#555', marginTop: 4, letterSpacing: '0.1em' }}>
                    X {sel.x.toFixed(0)} · Y {sel.y.toFixed(0)}
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ===== FOOTER ===== */}
      <footer style={{
        borderTop: '1px solid #1f1f1f', padding: '18px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: '#555', fontSize: 10, letterSpacing: '0.15em',
      }} className="mono">
        <span>FORMATION · STUDIO — TEN SPORTS, ONE BOARD</span>
        <span>BUILT WITH ▲ REACT · SVG</span>
      </footer>
    </div>
  );
}
