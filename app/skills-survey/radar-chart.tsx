type RadarItem = {
  id: string;
  label: string;
  value: number;
  percent: number;
  color: string;
  ink: string;
  answered: number;
  total: number;
};

type Props = {
  items: RadarItem[];
  overallPercent: number;
  overallLabel: string;
  emptyLabel: string;
  hasData: boolean;
};

const SIZE = 640;
const CX = 320;
const CY = 320;
const RADIUS = 232;
const LEVELS = 5;

function angle(index: number, total: number) {
  return -Math.PI / 2 + (index * 2 * Math.PI) / total;
}

function point(index: number, total: number, ratio: number) {
  const a = angle(index, total);
  return {
    x: CX + RADIUS * ratio * Math.cos(a),
    y: CY + RADIUS * ratio * Math.sin(a),
  };
}

function ringPath(total: number, ratio: number) {
  return Array.from({ length: total }, (_, index) => {
    const { x, y } = point(index, total, ratio);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

function labelAnchor(index: number, total: number) {
  const { x, y } = point(index, total, 1.16);
  const dx = x - CX;
  const dy = y - CY;
  return {
    x,
    y,
    anchor: dx < -12 ? "end" : dx > 12 ? "start" : "middle",
    dy: dy < -8 ? -2 : dy > 8 ? 14 : 4,
  };
}

export function SkillRadar({ items, overallPercent, overallLabel, emptyLabel, hasData }: Props) {
  const total = items.length;
  const polygon = items
    .map((item, index) => {
      const { x, y } = point(index, total, Math.max(0, Math.min(item.value, 5)) / 5);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="skill-radar" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={overallLabel}>
      <title>{overallLabel}</title>
      {Array.from({ length: LEVELS }, (_, level) => {
        const n = LEVELS - level;
        return (
          <path
            key={n}
            d={ringPath(total, n / LEVELS)}
            className={n % 2 === 0 ? "skill-radar-ring is-alt" : "skill-radar-ring"}
          />
        );
      })}
      {items.map((item, index) => {
        const end = point(index, total, 1);
        return (
          <line
            key={item.id}
            x1={CX}
            y1={CY}
            x2={end.x}
            y2={end.y}
            className="skill-radar-axis"
          />
        );
      })}
      {Array.from({ length: LEVELS }, (_, index) => {
        const n = index + 1;
        const tick = point(0, total, n / LEVELS);
        return (
          <text key={n} x={CX + 6} y={tick.y + 3} className="skill-radar-tick">
            {n}
          </text>
        );
      })}
      {hasData ? (
        <polygon points={polygon} className="skill-radar-shape" />
      ) : null}
      <circle cx={CX} cy={CY} r="46" className="skill-radar-hub" />
      {hasData
        ? items.map((item, index) => {
            const { x, y } = point(index, total, Math.max(0, Math.min(item.value, 5)) / 5);
            return <circle key={item.id} cx={x} cy={y} r="5.5" fill={item.ink} stroke="#fff" strokeWidth="1.5" />;
          })
        : null}
      {items.map((item, index) => {
        const pos = labelAnchor(index, total);
        return (
          <text
            key={item.id}
            x={pos.x}
            y={pos.y + pos.dy}
            textAnchor={pos.anchor}
            className="skill-radar-label"
            fill={item.ink}
          >
            {item.label}
          </text>
        );
      })}
      <text x={CX} y={CY - 6} textAnchor="middle" className="skill-radar-center">
        {hasData ? `${overallPercent}%` : "—"}
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" className="skill-radar-center-sub">
        {hasData ? overallLabel : emptyLabel}
      </text>
    </svg>
  );
}
