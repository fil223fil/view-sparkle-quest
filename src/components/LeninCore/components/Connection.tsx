import React, { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { QuadraticBezierLine, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ConnectionData, WidgetData, CONNECTION_STYLES, ConnectionType } from '../types';
import { useTheme } from 'next-themes';

interface ConnectionProps {
  connection: ConnectionData;
  widgets: WidgetData[];
  isHighlighted: boolean;
  isFocusActive: boolean;
}

const TYPE_LABELS: Record<ConnectionType, string> = {
  dataFlow: 'Поток данных',
  dependency: 'Зависимость',
  contextLink: 'Контекст',
  logicChain: 'Логика',
  causal: 'Причинность',
  temporal: 'Время',
  semantic: 'Семантика',
  metacognitive: 'Метакогниция',
};

// Minimal elegant particle
const SoftTravelingDot: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  color: string;
  speed: number;
  delay: number;
}> = ({ start, end, control, color, speed, delay }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const raw = clock.elapsedTime * speed - delay;
    if (raw < 0) { meshRef.current.visible = false; return; }
    meshRef.current.visible = true;
    const t = (raw % 3) / 3;
    const mt = 1 - t;
    meshRef.current.position.set(
      mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
      mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
      mt * mt * start.z + 2 * mt * t * control.z + t * t * end.z,
    );
    const fade = Math.sin(t * Math.PI);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = fade * 0.7;
    meshRef.current.scale.setScalar(0.6 + fade * 0.4);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

// Direction chevron
const DirectionChevron: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  color: string;
  opacity: number;
}> = ({ start, end, control, color, opacity }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const t = 0.55;
    const mt = 1 - t;
    meshRef.current.position.set(
      mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
      mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
      mt * mt * start.z + 2 * mt * t * control.z + t * t * end.z,
    );
    const dx = 2 * mt * (control.x - start.x) + 2 * t * (end.x - control.x);
    const dy = 2 * mt * (control.y - start.y) + 2 * t * (end.y - control.y);
    const dz = 2 * mt * (control.z - start.z) + 2 * t * (end.z - control.z);
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    meshRef.current.quaternion.copy(q);
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.04, 0.1, 6]} />
      <meshBasicMaterial color={color} transparent opacity={opacity * 0.6} />
    </mesh>
  );
};

// Invisible thick tube for hover detection
const HitArea: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  onHover: (hovered: boolean) => void;
}> = ({ start, end, control, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = React.useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);
    return tubeGeo;
  }, [start, end, control]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(false); }}
    >
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
};

// Tooltip displayed at midpoint of connection
const ConnectionTooltip: React.FC<{
  position: THREE.Vector3;
  type: ConnectionType;
  strength: number;
  fromLabel: string;
  toLabel: string;
  color: string;
}> = ({ position, type, strength, fromLabel, toLabel, color }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const strengthPercent = Math.round(strength * 100);
  const strengthLabel = strengthPercent >= 70 ? 'Сильная' : strengthPercent >= 40 ? 'Средняя' : 'Слабая';

  return (
    <Html position={position} center zIndexRange={[999, 900]}>
      <div
        style={{
          pointerEvents: 'none',
          fontFamily: '-apple-system, SF Pro Text, SF Pro Display, system-ui, sans-serif',
          background: isDark
            ? 'rgba(28, 28, 30, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: isDark
            ? '0.5px solid rgba(255, 255, 255, 0.12)'
            : '0.5px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 14,
          padding: '10px 14px',
          minWidth: 160,
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.12)',
          animation: 'tooltipFadeIn 0.2s ease-out',
        }}
      >
        {/* Type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: color,
            boxShadow: `0 0 8px ${color}40`,
          }} />
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
            letterSpacing: '-0.01em',
          }}>
            {TYPE_LABELS[type]}
          </span>
        </div>

        {/* From → To */}
        <div style={{
          fontSize: 11,
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}>
          {fromLabel} → {toLabel}
        </div>

        {/* Strength bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flex: 1,
            height: 3,
            borderRadius: 1.5,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${strengthPercent}%`,
              height: '100%',
              borderRadius: 1.5,
              background: color,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
            minWidth: 52,
            textAlign: 'right',
          }}>
            {strengthLabel} {strengthPercent}%
          </span>
        </div>
      </div>

      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(4px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </Html>
  );
};

export const Connection: React.FC<ConnectionProps> = ({
  connection,
  widgets,
  isHighlighted,
  isFocusActive,
}) => {
  const [hovered, setHovered] = useState(false);
  const fadeRef = useRef(0); // animated opacity multiplier 0→1
  const prevHighlighted = useRef(isHighlighted);
  const { from, to, type, strength = 0.5 } = connection;
  const style = CONNECTION_STYLES[type];

  const startWidget = widgets.find((w) => w.id === from);
  const endWidget = widgets.find((w) => w.id === to);
  if (!startWidget || !endWidget) return null;

  // Detect highlight change to retrigger fade
  if (isHighlighted && !prevHighlighted.current) {
    fadeRef.current = Math.min(fadeRef.current, 0.3); // soft re-entrance
  }
  prevHighlighted.current = isHighlighted;

  const startPos = new THREE.Vector3(
    startWidget.position.x / 100,
    -startWidget.position.y / 100,
    startWidget.position.z / 50
  );
  const endPos = new THREE.Vector3(
    endWidget.position.x / 100,
    -endWidget.position.y / 100,
    endWidget.position.z / 50
  );

  const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const distance = startPos.distanceTo(endPos);
  const controlOffset = distance * 0.15;
  const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
  const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0.05);
  const controlPoint = midPoint.clone().add(perpendicular.multiplyScalar(controlOffset));

  const isActive = isHighlighted || hovered;

  const targetOpacity = isFocusActive
    ? isActive ? style.opacity : 0.08
    : hovered ? style.opacity * 0.9 : style.opacity * 0.5;

  const targetLineWidth = isActive
    ? 1.8 + strength * 0.5
    : 0.8;

  const color = style.color;

  let dashSize, gapSize;
  if (style.dashArray) {
    const parts = style.dashArray.split(',');
    dashSize = parseFloat(parts[0]) * 0.04;
    gapSize = parseFloat(parts[1]) * 0.04;
  }

  const showAnimation = style.animated && (isActive || !isFocusActive);

  // Tooltip position — slightly above midpoint of curve
  const tooltipPos = new THREE.Vector3(
    0.75 * midPoint.x + 0.25 * controlPoint.x,
    0.75 * midPoint.y + 0.25 * controlPoint.y + 0.15,
    0.75 * midPoint.z + 0.25 * controlPoint.z + 0.1,
  );

  return (
    <group>
      {/* Invisible hit area for hover detection */}
      <HitArea
        start={startPos}
        end={endPos}
        control={controlPoint}
        onHover={setHovered}
      />

      {/* Primary line */}
      <QuadraticBezierLine
        start={startPos}
        end={endPos}
        mid={controlPoint}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={baseOpacity}
        dashed={!!style.dashArray}
        dashScale={1}
        dashSize={dashSize}
        gapSize={gapSize}
      />

      {/* Soft ambient glow — highlighted or hovered */}
      {isActive && (
        <QuadraticBezierLine
          start={startPos}
          end={endPos}
          mid={controlPoint}
          color={style.secondaryColor || color}
          lineWidth={lineWidth + 6}
          transparent
          opacity={baseOpacity * 0.15}
          blending={THREE.AdditiveBlending}
        />
      )}

      {/* Traveling dots */}
      {showAnimation && (
        <>
          <SoftTravelingDot
            start={startPos}
            end={endPos}
            control={controlPoint}
            color={style.particleColor || style.secondaryColor || color}
            speed={0.35}
            delay={0}
          />
          {isActive && (
            <SoftTravelingDot
              start={startPos}
              end={endPos}
              control={controlPoint}
              color={style.particleColor || style.secondaryColor || color}
              speed={0.35}
              delay={1.5}
            />
          )}
        </>
      )}

      {/* Direction chevron */}
      {(type === 'logicChain' || type === 'causal') && (
        <DirectionChevron
          start={startPos}
          end={endPos}
          control={controlPoint}
          color={color}
          opacity={baseOpacity}
        />
      )}

      {/* Endpoint dots on hover/highlight */}
      {isActive && (
        <>
          <mesh position={startPos}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={baseOpacity * 0.9} />
          </mesh>
          <mesh position={endPos}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={baseOpacity * 0.9} />
          </mesh>
        </>
      )}

      {/* Tooltip on hover */}
      {hovered && (
        <ConnectionTooltip
          position={tooltipPos}
          type={type}
          strength={strength}
          fromLabel={startWidget.title}
          toLabel={endWidget.title}
          color={color}
        />
      )}
    </group>
  );
};