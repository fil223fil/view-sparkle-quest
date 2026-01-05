// Force-directed layout physics simulation
import { useCallback, useRef } from 'react';
import { WidgetData, ConnectionData, PHYSICS_CONFIG } from '../types';

interface PhysicsState {
  widgets: WidgetData[];
  connections: ConnectionData[];
}

export const usePhysicsSimulation = () => {
  const frameRef = useRef<number>(0);

  const calculateForces = useCallback((state: PhysicsState): WidgetData[] => {
    const { widgets, connections } = state;
    const { damping, repulsion, attraction, springStrength, maxVelocity } = PHYSICS_CONFIG;

    return widgets.map((widget) => {
      let fx = 0;
      let fy = 0;
      let fz = 0;

      // Repulsion from other widgets
      widgets.forEach((other) => {
        if (other.id === widget.id) return;

        const dx = widget.position.x - other.position.x;
        const dy = widget.position.y - other.position.y;
        const dz = widget.position.z - other.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

        if (distance < repulsion * 2) {
          const force = (repulsion * repulsion) / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
          fz += (dz / distance) * force * 0.3; // Reduced Z force
        }
      });

      // Attraction to connected widgets (spring force)
      connections.forEach((conn) => {
        const isConnected = conn.from === widget.id || conn.to === widget.id;
        if (!isConnected) return;

        const otherId = conn.from === widget.id ? conn.to : conn.from;
        const other = widgets.find((w) => w.id === otherId);
        if (!other) return;

        const dx = other.position.x - widget.position.x;
        const dy = other.position.y - widget.position.y;
        const dz = other.position.z - widget.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

        const idealDistance = 200;
        const displacement = distance - idealDistance;
        const force = displacement * springStrength;

        fx += (dx / distance) * force;
        fy += (dy / distance) * force;
        fz += (dz / distance) * force * 0.2;
      });

      // Center attraction (weak)
      fx -= widget.position.x * attraction;
      fy -= widget.position.y * attraction;
      fz -= widget.position.z * attraction * 0.5;

      // Update velocity with damping
      const vx = ((widget.velocity?.x || 0) + fx) * damping;
      const vy = ((widget.velocity?.y || 0) + fy) * damping;
      const vz = ((widget.velocity?.z || 0) + fz) * damping;

      // Clamp velocity
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const clampedVelocity = speed > maxVelocity
        ? { x: (vx / speed) * maxVelocity, y: (vy / speed) * maxVelocity, z: (vz / speed) * maxVelocity }
        : { x: vx, y: vy, z: vz };

      return {
        ...widget,
        velocity: clampedVelocity,
        position: {
          x: widget.position.x + clampedVelocity.x,
          y: widget.position.y + clampedVelocity.y,
          z: Math.max(0, Math.min(50, widget.position.z + clampedVelocity.z)),
        },
      };
    });
  }, []);

  const magneticSnap = useCallback((widget: WidgetData): WidgetData => {
    const { magneticSnapDistance } = PHYSICS_CONFIG;
    const gridSize = 40;

    const snapX = Math.round(widget.position.x / gridSize) * gridSize;
    const snapY = Math.round(widget.position.y / gridSize) * gridSize;

    const distToSnapX = Math.abs(widget.position.x - snapX);
    const distToSnapY = Math.abs(widget.position.y - snapY);

    return {
      ...widget,
      position: {
        x: distToSnapX < magneticSnapDistance ? snapX : widget.position.x,
        y: distToSnapY < magneticSnapDistance ? snapY : widget.position.y,
        z: widget.position.z,
      },
    };
  }, []);

  return {
    calculateForces,
    magneticSnap,
    frameRef,
  };
};
