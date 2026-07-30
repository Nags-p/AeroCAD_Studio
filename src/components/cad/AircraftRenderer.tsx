'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useUIStore } from '@/store/useUIStore';
import { generateFuselageGeometry, resolveStationPositions } from '@/engine/generators/fuselageGenerator';
import { generateWingGeometry } from '@/engine/generators/wingGenerator';
import { generateTailGeometry } from '@/engine/generators/tailGenerator';
import { generateEngineGeometry } from '@/engine/generators/engineGenerator';
import { generateGearGeometry } from '@/engine/generators/gearGenerator';
import { calculateAeroMetrics } from '@/engine/math/aeroMetrics';

/**
 * Creates 3D Section Highlight Ring & Disc for CAD Station Visualization.
 */
function SectionHighlightRing({
  xLoc,
  width,
  height,
  isSelected,
  offsetZ = 0,
  offsetY = 0,
  onClick,
}: {
  xLoc: number;
  width: number;
  height: number;
  isSelected: boolean;
  offsetZ?: number;
  offsetY?: number;
  onClick?: (e?: THREE.Event) => void;
}) {
  const rx = Math.max(0.05, (width / 2) * 1.025);
  const ry = Math.max(0.05, (height / 2) * 1.025);

  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
    return curve.getPoints(64);
  }, [rx, ry]);

  const lineGeo = useMemo(() => {
    const pos: number[] = [];
    for (const p of points) {
      pos.push(0, p.y, p.x);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [points]);

  const fillGeo = useMemo(() => {
    const shape = new THREE.Shape(points);
    return new THREE.ShapeGeometry(shape);
  }, [points]);

  const colorHex = isSelected ? 0xffea00 : 0x00f3ff;

  return (
    <group position={[xLoc, offsetZ, offsetY]} onClick={onClick}>
      {/* Ring Line */}
      <lineLoop geometry={lineGeo}>
        <lineBasicMaterial
          color={colorHex}
          linewidth={isSelected ? 4 : 2}
          depthTest={false}
          transparent
          opacity={isSelected ? 1.0 : 0.85}
        />
      </lineLoop>

      {/* Semi-transparent Fill Disc */}
      <mesh geometry={fillGeo} rotation={[0, Math.PI / 2, 0]}>
        <meshBasicMaterial
          color={colorHex}
          transparent
          opacity={isSelected ? 0.35 : 0.15}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

export function AircraftRenderer() {
  const groupRef = useRef<THREE.Group>(null);
  const model = useAircraftStore((state) => state.model);
  const selectedId = useAircraftStore((state) => state.selectedId);
  const selectedType = useAircraftStore((state) => state.selectedType);
  const setSelected = useAircraftStore((state) => state.setSelected);

  const shadingMode = useUIStore((state) => state.shadingMode);
  const explodedOffset = useUIStore((state) => state.explodedOffset);
  const showCG = useUIStore((state) => state.showCG);

  useEffect(() => {
    if (groupRef.current && typeof window !== 'undefined') {
      (window as Record<string, any>).__THREE_SCENE__ = groupRef.current;
    }
  }, []);

  const aeroMetrics = useMemo(() => calculateAeroMetrics(model), [model]);

  // Materials based on shading mode
  const getMaterial = (baseColor: string, isSelected: boolean): THREE.Material => {
    const color = isSelected ? '#00E5FF' : baseColor;

    if (shadingMode === 'wireframe') {
      return new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
      });
    }

    if (shadingMode === 'xray') {
      return new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        roughness: 0.1,
        metalness: 0.8,
        clearcoat: 1.0,
      });
    }

    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.45,
      side: THREE.DoubleSide,
    });
  };

  // Geometries
  const fuselageGeo = useMemo(() => {
    return model.fuselage && model.fuselage.visible ? generateFuselageGeometry(model.fuselage) : null;
  }, [model.fuselage]);

  const wingGeos = useMemo(() => {
    return model.wings
      .filter((w) => w.visible)
      .map((w) => ({ id: w.id, color: w.color, geo: generateWingGeometry(w, false) }));
  }, [model.wings]);

  const tailGeos = useMemo(() => {
    return model.tails
      .filter((t) => t.visible)
      .map((t) => ({ id: t.id, color: t.color, geo: generateTailGeometry(t) }));
  }, [model.tails]);

  const engineGeos = useMemo(() => {
    return model.engines
      .filter((e) => e.visible)
      .map((e) => ({ id: e.id, color: e.color, geo: generateEngineGeometry(e) }));
  }, [model.engines]);

  const gearGeo = useMemo(() => {
    return model.gear && model.gear.visible ? generateGearGeometry(model.gear) : null;
  }, [model.gear]);

  const expFactor = explodedOffset * 4.0;

  // Section highlight calculations using unified resolveStationPositions
  const f = model.fuselage;
  const len = f.length;
  const halfLen = len / 2;

  const resolvedStations = useMemo(() => resolveStationPositions(f.sections), [f.sections]);

  return (
    <group ref={groupRef}>
      {/* Fuselage */}
      {fuselageGeo ? (
        <group position={[0, 0, 0]}>
          <mesh
            geometry={fuselageGeo}
            material={getMaterial(model.fuselage.color, selectedType === 'fuselage' && selectedId === model.fuselage.id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(model.fuselage.id, 'fuselage');
            }}
          />

          {/* Dynamic Section Ring Highlights using Unified Resolved Station Positions */}
          {f.visible &&
            resolvedStations.map((sec) => {
              const xLoc = sec.xPos * len - halfLen;
              const isSel = selectedType === 'section' && selectedId === sec.id;

              return (
                <SectionHighlightRing
                  key={sec.id}
                  xLoc={xLoc}
                  width={sec.width}
                  height={sec.height}
                  isSelected={isSel}
                  onClick={(e) => {
                    if (e) e.stopPropagation();
                    setSelected(sec.id, 'section');
                  }}
                />
              );
            })}
        </group>
      ) : null}

      {/* Main Wings */}
      {wingGeos.map(({ id, color, geo }) => (
        <group key={id} position={[0, 0, 0]}>
          <mesh
            geometry={geo}
            material={getMaterial(color, selectedType === 'wing' && selectedId === id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(id, 'wing');
            }}
          />
        </group>
      ))}

      {/* Tails */}
      {tailGeos.map(({ id, color, geo }) => (
        <group key={id} position={[expFactor * 0.8, 0, expFactor * 0.5]}>
          <mesh
            geometry={geo}
            material={getMaterial(color, selectedType === 'tail' && selectedId === id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(id, 'tail');
            }}
          />
        </group>
      ))}

      {/* Engines */}
      {engineGeos.map(({ id, color, geo }) => (
        <group key={id} position={[0, 0, -expFactor * 0.6]}>
          <mesh
            geometry={geo}
            material={getMaterial(color, selectedType === 'engine' && selectedId === id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(id, 'engine');
            }}
          />
        </group>
      ))}

      {/* Landing Gear */}
      {gearGeo ? (
        <group position={[0, 0, -expFactor * 1.2]}>
          <mesh
            geometry={gearGeo}
            material={getMaterial(model.gear.color, selectedType === 'gear' && selectedId === model.gear.id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(model.gear.id, 'gear');
            }}
          />
        </group>
      ) : null}

      {/* Center of Gravity (CG) Marker Sphere */}
      {showCG && aeroMetrics.centerOfGravity ? (
        <group
          position={[
            aeroMetrics.centerOfGravity[0],
            aeroMetrics.centerOfGravity[2],
            aeroMetrics.centerOfGravity[1],
          ]}
        >
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#F59E0B" wireframe />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
