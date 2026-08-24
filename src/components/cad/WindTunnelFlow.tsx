'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';

export function WindTunnelFlow() {
  const flowSimulationActive = useUIStore((state) => state.flowSimulationActive);
  const flowColormapMode = useUIStore((state) => state.flowColormapMode);
  const showFlowParticles = useUIStore((state) => state.showFlowParticles);
  const showFlowStreamlines = useUIStore((state) => state.showFlowStreamlines);
  const flowVelocity = useUIStore((state) => state.flowVelocity);
  const model = useAircraftStore((state) => state.model);

  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const numParticles = 240;

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < numParticles; i++) {
      const y0 = (Math.random() - 0.5) * 6.0;
      const z0 = (Math.random() - 0.5) * 16.0;
      const xOffset = Math.random() * 40.0 - 20.0;
      const speed = 8.0 + Math.random() * 4.0;
      arr.push({ y0, z0, x: xOffset, speed });
    }
    return arr;
  }, [numParticles]);

  const glowTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(0, 195, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  const evaluateFlow = (x: number, y0: number, z0: number) => {
    let y = y0;
    let z = z0;
    let velocityMultiplier = 1.0;

    // 1. Fuselage Deflection (extending from x = 0 (nose) to x = flen (tail))
    const flen = model.fuselage.length;
    const fRadius = model.fuselage.radius || 1.2;
    
    // deflections start smoothly upstream at x = -fRadius * 1.5 and down to tail
    const fStart = -fRadius * 1.5;
    const fEnd = flen + fRadius;
    if (x >= fStart && x <= fEnd) {
      let localRadius = 0;
      if (x < 0) {
        // Upstream pre-deflection zone
        const tUp = (x - fStart) / (0 - fStart);
        localRadius = tUp * fRadius * 0.45;
      } else if (x <= flen) {
        // Along the fuselage body
        const t = x / flen;
        localRadius = Math.sin(t * Math.PI) * fRadius;
      } else {
        // Downstream wake closure
        const tDown = 1.0 - (x - flen) / fRadius;
        localRadius = Math.max(0, tDown) * fRadius * 0.45;
      }

      const r0 = Math.sqrt(y0 * y0 + z0 * z0);
      if (r0 > 0.01) {
        // High-fidelity snug deflection using circle intersection math
        const dFactor = Math.sqrt(r0 * r0 + localRadius * localRadius) / r0;
        y = y0 * dFactor;
        z = z0 * dFactor;
        
        // Velocity updates (speedup on mid-fuselage, slowdown at stagnation points)
        if (x >= 0 && x <= flen) {
          const t = x / flen;
          velocityMultiplier = 1.0 - (localRadius * 0.1) * Math.cos(t * Math.PI * 2);
        }
      }
    }

    // 2. Wing Deflection
    model.wings.forEach((wing) => {
      if (wing.visible === false) return;
      const [wx, wy, wz] = wing.rootPos;
      const wspan = wing.span;
      const wchord = wing.rootChord;
      const wsweep = wing.sweep || 0;
      const wdihedral = wing.dihedral || 0;

      const dz = z - wz;
      if (Math.abs(dz) <= wspan / 2) {
        const sweepOffset = Math.abs(dz) * Math.tan((wsweep * Math.PI) / 180);
        const localWingX = wx + sweepOffset;
        
        const dihedralOffset = Math.abs(dz) * Math.sin((wdihedral * Math.PI) / 180);
        const localWingY = wy + dihedralOffset;

        const chordDistance = x - localWingX;
        // Deflect flow surrounding wing chord area
        if (chordDistance >= -wchord * 0.25 && chordDistance <= wchord * 1.15) {
          const wingDistY = y - localWingY;
          // Tighter vertical decay (0.45 instead of 1.5) to wrap snug around airfoil contour
          const factor = Math.exp(-Math.abs(wingDistY) / 0.45) * Math.sin(((chordDistance + wchord * 0.25) / (wchord * 1.4)) * Math.PI);
          
          if (wingDistY >= 0) {
            y += 0.38 * Math.max(0, factor);
            velocityMultiplier *= 1.0 + 0.26 * Math.max(0, factor);
          } else {
            y -= 0.22 * Math.max(0, factor);
            velocityMultiplier *= 1.0 - 0.14 * Math.max(0, factor);
          }
        }
      }
    });

    // 3. Engine Nacelle Deflection
    model.engines.forEach((eng) => {
      if (eng.visible === false) return;
      const [ex, ey, ez] = eng.position;
      const elen = eng.length || 2.0;
      const edia = eng.diameter || 0.8;

      const engineDistX = x - ex;
      if (Math.abs(engineDistX) <= elen / 2) {
        const dyEng = y - ey;
        const dzEng = z - ez;
        const dist2D = Math.sqrt(dyEng * dyEng + dzEng * dzEng);
        if (dist2D > 0.05 && dist2D < edia * 2.0) {
          // Snug deflection around engine cylinder
          const factor = Math.sqrt(dist2D * dist2D + (edia * edia * 0.25)) / dist2D;
          y = ey + dyEng * factor;
          z = ez + dzEng * factor;
          velocityMultiplier *= 0.95;
        }
      }
    });

    return { pos: [x, y, z], vel: velocityMultiplier };
  };

  const staticLinesGeom = useMemo(() => {
    const vertices: number[] = [];
    const colors: number[] = [];

    if (!flowSimulationActive) return null;

    // Seeds placed closer to fuselage skin (r=1.2) and wing plane
    const seedsY = [-1.8, -0.8, -0.15, 0.15, 0.8, 1.8];
    const seedsZ = [-10.0, -6.5, -3.5, -1.2, 1.2, 3.5, 6.5, 10.0];

    seedsY.forEach((y0) => {
      seedsZ.forEach((z0) => {
        let prevPos: number[] | null = null;
        let prevVel = 1.0;

        for (let x = -20; x <= 20; x += 1.0) {
          const { pos, vel } = evaluateFlow(x, y0, z0);
          if (prevPos) {
            vertices.push(prevPos[0], prevPos[1], prevPos[2]);
            vertices.push(pos[0], pos[1], pos[2]);

            const avgVel = (prevVel + vel) / 2;
            let r = 0.05, g = 0.1, b = 0.2; // High-contrast dark base

            if (flowColormapMode === 'velocity') {
              const t = Math.max(0, Math.min(1, (avgVel - 0.8) / 0.5));
              r = 0.1 + 0.6 * t;
              g = 0.15 * (1.0 - t) + 0.1 * t;
              b = 0.3 * (1.0 - t);
            } else if (flowColormapMode === 'pressure') {
              const Cp = 1.0 - avgVel * avgVel;
              const t = Math.max(0, Math.min(1, (Cp + 0.6) / 1.0));
              r = 0.1 + 0.5 * t;
              g = 0.1 * (1.0 - t);
              b = 0.4 * (1.0 - t);
            }

            colors.push(r, g, b, 0.7); // Higher opacity for sharp visibility
            colors.push(r, g, b, 0.7);
          }
          prevPos = pos;
          prevVel = vel;
        }
      });
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    return geom;
  }, [flowSimulationActive, flowColormapMode, model]);

  useFrame((state, delta) => {
    if (!flowSimulationActive || !pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;

    const speedFactor = flowVelocity / 120.0;

    for (let i = 0; i < numParticles; i++) {
      const p = particles[i];
      p.x += delta * p.speed * speedFactor;
      if (p.x > 20.0) {
        p.x = -20.0;
      }

      const { pos, vel } = evaluateFlow(p.x, p.y0, p.z0);

      positions[i * 3] = pos[0];
      positions[i * 3 + 1] = pos[1];
      positions[i * 3 + 2] = pos[2];

      let r = 0, g = 0.9, b = 1.0;
      if (flowColormapMode === 'velocity') {
        const t = Math.max(0, Math.min(1, (vel - 0.8) / 0.5));
        r = t;
        g = 0.9 * (1.0 - t) + 0.2 * t;
        b = 1.0 - t;
      } else if (flowColormapMode === 'pressure') {
        const Cp = 1.0 - vel * vel;
        const t = Math.max(0, Math.min(1, (Cp + 0.6) / 1.0));
        r = t;
        g = 0.9 * (1.0 - t);
        b = 1.0 - t;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  const pointsGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(numParticles * 3);
    const col = new Float32Array(numParticles * 3);
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geom;
  }, [numParticles]);

  if (!flowSimulationActive) return null;

  return (
    <group>
      {showFlowStreamlines && staticLinesGeom && (
        <lineSegments ref={linesRef} geometry={staticLinesGeom}>
          <lineBasicMaterial vertexColors transparent opacity={0.8} depthWrite={false} />
        </lineSegments>
      )}

      {showFlowParticles && (
        <points ref={pointsRef} geometry={pointsGeom}>
          <pointsMaterial
            size={0.65}
            map={glowTexture || undefined}
            vertexColors
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
