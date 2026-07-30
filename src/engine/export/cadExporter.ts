import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';
import { OBJExporter } from 'three-stdlib';
import { GLTFExporter } from 'three-stdlib';
import { AircraftModel } from '@/types/aircraft';

/**
 * Robust file downloader supporting strings, ArrayBuffer, DataView, Uint8Array.
 */
export function downloadFile(content: any, filename: string, mimeType: string) {
  try {
    let blob: Blob;

    if (typeof content === 'string') {
      blob = new Blob([content], { type: mimeType });
    } else if (content instanceof ArrayBuffer) {
      blob = new Blob([content], { type: mimeType });
    } else if (ArrayBuffer.isView(content)) {
      blob = new Blob([content.buffer], { type: mimeType });
    } else {
      blob = new Blob([JSON.stringify(content, null, 2)], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error('Download file error:', err);
  }
}

/**
 * Export full parametric aircraft model as JSON.
 */
export function exportAircraftJSON(model: AircraftModel) {
  const jsonStr = JSON.stringify(model, null, 2);
  downloadFile(jsonStr, `${(model.name || 'aircraft').toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}.json`, 'application/json');
}

/**
 * Export 3D Mesh Scene as STL file.
 */
export function exportAircraftSTL(scene: THREE.Object3D, filename: string = 'aircraft.stl') {
  if (!scene) {
    alert('Scene not initialized for STL export.');
    return;
  }
  try {
    const exporter = new STLExporter();
    const result = exporter.parse(scene, { binary: true });
    downloadFile(result, filename, 'application/octet-stream');
  } catch (e) {
    console.error('STL Export Error:', e);
  }
}

/**
 * Export 3D Mesh Scene as Wavefront OBJ file.
 */
export function exportAircraftOBJ(scene: THREE.Object3D, filename: string = 'aircraft.obj') {
  if (!scene) {
    alert('Scene not initialized for OBJ export.');
    return;
  }
  try {
    const exporter = new OBJExporter();
    const result = exporter.parse(scene);
    downloadFile(result, filename, 'text/plain');
  } catch (e) {
    console.error('OBJ Export Error:', e);
  }
}

/**
 * Export 3D Mesh Scene as glTF binary (.glb).
 */
export function exportAircraftGLTF(scene: THREE.Object3D, filename: string = 'aircraft.glb') {
  if (!scene) {
    alert('Scene not initialized for glTF export.');
    return;
  }
  try {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          downloadFile(gltf, filename, 'model/gltf-binary');
        } else {
          const output = JSON.stringify(gltf, null, 2);
          downloadFile(output, filename.replace('.glb', '.gltf'), 'application/json');
        }
      },
      (error) => {
        console.error('An error occurred exporting glTF:', error);
      },
      { binary: true }
    );
  } catch (e) {
    console.error('glTF Export Error:', e);
  }
}
