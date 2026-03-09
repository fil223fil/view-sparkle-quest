// Force-directed layout physics simulation with query grouping
import { useCallback, useRef } from 'react';
import { WidgetData, ConnectionData, PHYSICS_CONFIG } from '../types';
import type { QueryGroup } from '@/store/useChatStore';

interface PhysicsState {
  widgets: WidgetData[];
  connections: ConnectionData[];
  activeGroups?: QueryGroup[];
}

export const usePhysicsSimulation = () => {
  const frameRef = useRef<number>(0);

  const calculateForces = useCallback((state: PhysicsState): WidgetData[] => {
    const { widgets, connections, activeGroups = [] } = state;
    const { damping, repulsion, attraction, springStrength, maxVelocity } = PHYSICS_CONFIG;

    // Build a set of grouped widget IDs and their group centers
    const groupAttraction = new Map<string, { cx: number; cy: number; cz: number; count: number }>();
    
    for (const group of activeGroups) {
      // Calculate group center
      let cx = 0, cy = 0, cz = 0, count = 0;
      for (const wid of group.widgetIds) {
        const w = widgets.find(ww => ww.id === wid);
        if (w) { cx += w.position.x; cy += w.position.y; cz += w.position.z; count++; }
      }
      if (count > 0) {
        cx /= count; cy /= count; cz /= count;
        for (const wid of group.widgetIds) {
          const existing = groupAttraction.get(wid);
          if (!existing || count > existing.count) {
            groupAttraction.set(wid, { cx, cy, cz, count });
          }
        }
      }
    }

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
          fz += (dz / distance) * force * 0.3;
        }
      });

      // Spring attraction to connected widgets
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

      // *** Query group attraction: pull grouped widgets toward group center ***
      const groupData = groupAttraction.get(widget.id);
      if (groupData) {
        const dx = groupData.cx - widget.position.x;
        const dy = groupData.cy - widget.position.y;
        const dz = groupData.cz - widget.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        
        // Strong attraction to group center (5x normal spring)
        const groupForce = 0.4;
        const idealGroupDist = 120; // tighter grouping
        const displacement = distance - idealGroupDist;
        
        fx += (dx / distance) * displacement * groupForce;
        fy += (dy / distance) * displacement * groupForce;
        fz += (dz / distance) * displacement * groupForce * 0.2;
      }

      // Center attraction (weak)
      fx -= widget.position.x * attraction;
      fy -= widget.position.y * attraction;
      fz -= widget.position.z * attraction * 0.5;

      // Update velocity with damping
      const vx = ((widget.velocity?.x || 0) + fx) * damping;
      const vy = ((widget.velocity?.y || 0) + fy) * damping;
      const vz = ((widget.velocity?.z || 0) + fz) * damping;

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
