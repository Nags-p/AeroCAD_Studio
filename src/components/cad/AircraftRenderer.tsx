'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useUIStore, AnalysisModeType } from '@/store/useUIStore';
import { generateFuselageGeometry, resolveStationPositions } from '@/engine/generators/fuselageGenerator';
import { generateWingGeometry } from '@/engine/generators/wingGenerator';
import { generateTailGeometry } from '@/engine/generators/tailGenerator';
import { generateEngineGeometry } from '@/engine/generators/engineGenerator';
import { calculateAeroMetrics } from '@/engine/math/aeroMetrics';
import { MATERIALS_LIBRARY } from '@/engine/data/materials';

/**
 * Generates vertex colors on a cloned geometry representing pressure, lift loading, or mass density.
 */
function getAnalyzedGeometry(
  originalGeo: THREE.BufferGeometry | null,
  partType: 'fuselage' | 'wing' | 'tail' | 'engine',
  analysisMode: AnalysisModeType,
  partLengthOrSpan?: number
): THREE.BufferGeometry | null {
  if (!originalGeo) return null;
  if (analysisMode === 'none') return originalGeo;

  const geo = originalGeo.clone();
  const position = geo.attributes.position;
  const normal = geo.attributes.normal;
  if (!position) return geo;

  const vertexCount = position.count;
  const colors = new Float32Array(vertexCount * 3);
  const tempPos = new THREE.Vector3();
  const tempNormal = new THREE.Vector3();

  for (let i = 0; i < vertexCount; i++) {
    tempPos.fromBufferAttribute(position, i);
    if (normal) {
      tempNormal.fromBufferAttribute(normal, i);
    } else {
      tempNormal.set(0, 1, 0);
    }

    let r = 1, g = 1, b = 1;

    if (analysisMode === 'mass') {
      if (partType === 'engine') {
        r = 0.95; g = 0.15; b = 0.15; // Crimson heavy engine
      } else if (partType === 'fuselage') {
        r = 0.95; g = 0.55; b = 0.1; // Amber fuselage
      } else if (partType === 'wing') {
        r = 0.15; g = 0.75; b = 0.25; // Green wing
      } else {
        r = 0.15; g = 0.6; b = 0.95; // Sky blue tail
      }
    } else if (analysisMode === 'pressure') {
      if (partType === 'wing' || partType === 'tail') {
        const ny = tempNormal.y;
        const cp = -ny * 0.8;
        const t = (cp + 1.0) / 2.0;
        if (t < 0.5) {
          const k = t * 2;
          r = 0.05 * k;
          g = 0.1 + 0.7 * k;
          b = 0.9 - 0.7 * k;
        } else {
          const k = (t - 0.5) * 2;
          r = 0.05 + 0.9 * k;
          g = 0.8 - 0.75 * k;
          b = 0.2 - 0.15 * k;
        }
      } else if (partType === 'fuselage') {
        const L = partLengthOrSpan || 10;
        const xRatio = Math.max(0, Math.min(1.0, tempPos.x / L));
        let cp = 0;
        if (xRatio < 0.1) {
          cp = 1.0 - (xRatio / 0.1) * 1.5;
        } else if (xRatio < 0.85) {
          cp = -0.5;
        } else {
          cp = -0.5 + ((xRatio - 0.85) / 0.15) * 0.7;
        }

        const t = (cp + 1.0) / 2.0;
        if (t < 0.5) {
          const k = t * 2;
          r = 0.05 * k;
          g = 0.1 + 0.7 * k;
          b = 0.9 - 0.7 * k;
        } else {
          const k = (t - 0.5) * 2;
          r = 0.05 + 0.9 * k;
          g = 0.8 - 0.75 * k;
          b = 0.2 - 0.15 * k;
        }
      } else if (partType === 'engine') {
        const nx = tempNormal.x;
        const cp = -nx * 0.65;
        const t = (cp + 1.0) / 2.0;
        if (t < 0.5) {
          const k = t * 2;
          r = 0.05 * k;
          g = 0.1 + 0.7 * k;
          b = 0.9 - 0.7 * k;
        } else {
          const k = (t - 0.5) * 2;
          r = 0.05 + 0.9 * k;
          g = 0.8 - 0.75 * k;
          b = 0.2 - 0.15 * k;
        }
      }
    } else if (analysisMode === 'loading') {
      if (partType === 'wing' || partType === 'tail') {
        const maxSpan = (partLengthOrSpan || 10) / 2;
        const spanT = Math.max(0, Math.min(1.0, Math.abs(tempPos.z) / maxSpan));
        const load = Math.sqrt(Math.max(0, 1.0 - spanT * spanT));
        if (load < 0.5) {
          const k = load * 2;
          r = 0.1;
          g = 0.2 + 0.65 * k;
          b = 0.95 - 0.75 * k;
        } else {
          const k = (load - 0.5) * 2;
          r = 0.1 + 0.85 * k;
          g = 0.85 - 0.7 * k;
          b = 0.2 - 0.1 * k;
        }
      } else {
        r = 0.35; g = 0.4; b = 0.45;
      }
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

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
  onContextMenu,
}: {
  xLoc: number;
  width: number;
  height: number;
  isSelected: boolean;
  offsetZ?: number;
  offsetY?: number;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
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
    <group position={[xLoc, offsetZ, offsetY]} onClick={onClick} onContextMenu={onContextMenu}>
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

/**
 * Creates 3D Section Apex Point Marker (for Nose Tip at X=0 and Tail Tip at X=len)
 */
function ApexPointMarker({
  xLoc,
  offsetZ = 0,
  offsetY = 0,
  label,
  isSelected,
  onClick,
  onContextMenu,
}: {
  xLoc: number;
  offsetZ?: number;
  offsetY?: number;
  label: string;
  isSelected: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const colorHex = isSelected ? 0xffea00 : 0x0284c7;

  return (
    <group position={[xLoc, offsetZ, offsetY]} onClick={onClick} onContextMenu={onContextMenu}>
      {/* Outer Glow Ring */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.08, 0.16, 32]} />
        <meshBasicMaterial
          color={colorHex}
          transparent
          opacity={isSelected ? 0.95 : 0.75}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>

      {/* Central Solid Apex Point */}
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial
          color={isSelected ? 0xffea00 : 0x38bdf8}
          depthTest={false}
        />
      </mesh>

      {/* Crosshair reticle axes */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={4}
            array={new Float32Array([
              0, -0.22, 0,  0, 0.22, 0,
              0, 0, -0.22,  0, 0, 0.22
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={colorHex} depthTest={false} transparent opacity={0.85} />
      </lineSegments>
    </group>
  );
}

export function AircraftRenderer() {
  const groupRef = useRef<THREE.Group>(null);
  const model = useAircraftStore((state) => state.model);
  const selectedId = useAircraftStore((state) => state.selectedId);
  const selectedType = useAircraftStore((state) => state.selectedType);
  const setSelected = useAircraftStore((state) => state.setSelected);

  const showContextMenu = useUIStore((state) => state.showContextMenu);
  const shadingMode = useUIStore((state) => state.shadingMode);
  const analysisMode = useUIStore((state) => state.analysisMode);
  const explodedOffset = useUIStore((state) => state.explodedOffset);
  const showCG = useUIStore((state) => state.showCG);
  const showSections = useUIStore((state) => state.showSections);
  const tessellation = useUIStore((state) => state.tessellationQuality);

  useEffect(() => {
    if (groupRef.current && typeof window !== 'undefined') {
      (window as Record<string, any>).__THREE_SCENE__ = groupRef.current;
    }
  }, []);

  const aeroMetrics = useMemo(() => calculateAeroMetrics(model), [model]);

  // Materials based on shading mode
  const getMaterial = (baseColor: string, isSelected: boolean, materialType?: string): THREE.Material => {
    const color = isSelected ? '#00E5FF' : baseColor;

    if (analysisMode !== 'none') {
      return new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.25,
        metalness: 0.15,
        side: THREE.DoubleSide,
        emissive: isSelected ? new THREE.Color('#00E5FF') : new THREE.Color('#000000'),
        emissiveIntensity: isSelected ? 0.35 : 0,
      });
    }

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

    // Resolve finish style from material database
    const matData = materialType ? MATERIALS_LIBRARY[materialType] : null;
    const finish = matData ? matData.finish : materialType;

    switch (finish) {
      case 'metal_polished': // Polished Aluminum
        return new THREE.MeshStandardMaterial({
          color,
          roughness: 0.12,
          metalness: 0.95,
          side: THREE.DoubleSide,
        });
      case 'metal_brushed': // Brushed Titanium / Steel
        return new THREE.MeshStandardMaterial({
          color,
          roughness: 0.38,
          metalness: 0.85,
          side: THREE.DoubleSide,
        });
      case 'paint_matte': // Stealth Composite / Matte Paint
        return new THREE.MeshStandardMaterial({
          color,
          roughness: 0.85,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });
      case 'carbon_fiber': // High-tech Glossy Carbon Fiber
        return new THREE.MeshPhysicalMaterial({
          color: isSelected ? '#00E5FF' : '#1E293B',
          roughness: 0.4,
          metalness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide,
        });
      case 'glass': // Transparent cockpit canopy glass
        return new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.05,
          metalness: 0.9,
          transparent: true,
          opacity: 0.3,
          transmission: 0.9,
          ior: 1.5,
          side: THREE.DoubleSide,
        });
      case 'gold_foil': // Satellite / engine thermal gold wrap
        return new THREE.MeshStandardMaterial({
          color: isSelected ? '#00E5FF' : '#D97706',
          roughness: 0.2,
          metalness: 0.95,
          side: THREE.DoubleSide,
        });
      case 'paint_glossy': // Default glossy paint
      default:
        return new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.18,
          metalness: 0.1,
          clearcoat: 0.85,
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide,
        });
    }
  };

  // Geometries
  const fuselageGeo = useMemo(() => {
    return model.fuselage && model.fuselage.visible ? generateFuselageGeometry(model.fuselage, tessellation) : null;
  }, [model.fuselage, tessellation]);

  const wingGeos = useMemo(() => {
    return model.wings
      .filter((w) => w.visible)
      .map((w) => ({ id: w.id, color: w.color, material: w.material, geo: generateWingGeometry(w, false, tessellation) }));
  }, [model.wings, tessellation]);

  const tailGeos = useMemo(() => {
    return model.tails
      .filter((t) => t.visible)
      .map((t) => ({ id: t.id, color: t.color, material: t.material, geo: generateTailGeometry(t, tessellation) }));
  }, [model.tails, tessellation]);

  const engineGeos = useMemo(() => {
    return model.engines
      .filter((e) => e.visible)
      .map((e) => ({ id: e.id, color: e.color, material: e.material, geo: generateEngineGeometry(e, model.wings, tessellation) }));
  }, [model.engines, model.wings, tessellation]);

  // Analyzed Geometries under overlay modes
  const analyzedFuselageGeo = useMemo(() => {
    return getAnalyzedGeometry(fuselageGeo, 'fuselage', analysisMode, model.fuselage?.length);
  }, [fuselageGeo, analysisMode, model.fuselage?.length]);

  const analyzedWingGeos = useMemo(() => {
    return wingGeos.map(({ id, color, material, geo }) => {
      const wingComponent = model.wings.find((w) => w.id === id);
      const span = wingComponent ? wingComponent.span : 10;
      const aGeo = getAnalyzedGeometry(geo, 'wing', analysisMode, span);
      return { id, color, material, geo: aGeo };
    });
  }, [wingGeos, analysisMode, model.wings]);

  const analyzedTailGeos = useMemo(() => {
    return tailGeos.map(({ id, color, material, geo }) => {
      const tailComponent = model.tails.find((t) => t.id === id);
      const span = tailComponent ? tailComponent.horizontalSpan : 5;
      const aGeo = getAnalyzedGeometry(geo, 'tail', analysisMode, span);
      return { id, color, material, geo: aGeo };
    });
  }, [tailGeos, analysisMode, model.tails]);

  const analyzedEngineGeos = useMemo(() => {
    return engineGeos.map(({ id, color, material, geo }) => {
      const aGeo = getAnalyzedGeometry(geo, 'engine', analysisMode);
      return { id, color, material, geo: aGeo };
    });
  }, [engineGeos, analysisMode]);

  const expFactor = explodedOffset * 4.0;

  // Section highlight calculations using unified resolveStationPositions
  const f = model.fuselage;
  const len = f.length;
  const halfLen = len / 2;

  const resolvedStations = useMemo(() => resolveStationPositions(f.sections), [f.sections]);

  return (
    <group ref={groupRef}>
      {/* Fuselage */}
      {analyzedFuselageGeo ? (
        <group position={[0, 0, 0]}>
          <mesh
            geometry={analyzedFuselageGeo}
            material={getMaterial(model.fuselage.color, selectedType === 'fuselage' && selectedId === model.fuselage.id, model.fuselage.material)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              setSelected(model.fuselage.id, 'fuselage');
            }}
            onContextMenu={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              showContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY, model.fuselage.id, 'fuselage');
            }}
          />

          {/* Dynamic Section Ring Highlights using Unified Resolved Station Positions */}
          {f.visible && showSections && (
            <>
              {/* Nose Tip Section Apex Representation (X = 0) */}
              <ApexPointMarker
                xLoc={0}
                offsetZ={f.noseZ || 0}
                offsetY={f.noseY || 0}
                label="Nose Tip (X = 0.0m)"
                isSelected={selectedType === 'fuselage'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(f.id, 'fuselage');
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  showContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY, f.id, 'fuselage');
                }}
              />

              {/* Intermediate Station Cross-Section Rings */}
              {resolvedStations.map((sec) => {
                const xLoc = sec.xPos * len;
                const isSel = selectedType === 'section' && selectedId === sec.id;

                return (
                  <SectionHighlightRing
                    key={sec.id}
                    xLoc={xLoc}
                    width={sec.width}
                    height={sec.height}
                    offsetZ={sec.zOffset || 0}
                    offsetY={sec.yOffset || 0}
                    isSelected={isSel}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(sec.id, 'section');
                    }}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      showContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY, sec.id, 'section');
                    }}
                  />
                );
              })}

              {/* Tail Tip Section Apex Representation (X = length) */}
              <ApexPointMarker
                xLoc={len}
                offsetZ={f.tailZ || 0}
                offsetY={f.tailY || 0}
                label={`Tail Tip (X = ${len.toFixed(1)}m)`}
                isSelected={selectedType === 'fuselage'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(f.id, 'fuselage');
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  showContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY, f.id, 'fuselage');
                }}
              />
            </>
          )}
        </group>
      ) : null}

      {/* Main Wings */}
      {analyzedWingGeos.map(({ id, color, material, geo }) => (
        <group key={id} position={[0, 0, 0]}>
          <mesh
            geometry={geo}
            material={getMaterial(color, selectedType === 'wing' && selectedId === id, material)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              setSelected(id, 'wing');
            }}
            onContextMenu={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              showContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY, id, 'wing');
            }}
          />
        </group>
      ))}

      {/* Tails */}
      {analyzedTailGeos.map(({ id, color, material, geo }) => (
        <group key={id} position={[expFactor * 0.8, 0, expFactor * 0.5]}>
          <mesh
            geometry={geo}
            material={getMaterial(color, selectedType === 'tail' && selectedId === id, material)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              setSelected(id, 'tail');
            }}
            onContextMenu={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              showContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY, id, 'tail');
            }}
          />
        </group>
      ))}

      {/* Engines */}
      {analyzedEngineGeos.map(({ id, color, material, geo }) => (
        <group key={id} position={[0, 0, -expFactor * 0.6]}>
          <mesh
            geometry={geo}
            material={getMaterial(color, selectedType === 'engine' && selectedId === id, material)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              setSelected(id, 'engine');
            }}
            onContextMenu={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              showContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY, id, 'engine');
            }}
          />
        </group>
      ))}



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
