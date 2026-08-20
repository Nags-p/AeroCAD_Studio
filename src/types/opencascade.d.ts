declare module 'opencascade.js/dist/opencascade.wasm.js' {
  const initOpenCascade: (options?: {
    locateFile?: (path: string, scriptDirectory?: string) => string;
    wasmBinary?: ArrayBuffer | Uint8Array;
  }) => Promise<any>;
  export default initOpenCascade;
}

declare module 'opencascade.js' {
  const initOpenCascade: (options?: {
    locateFile?: (path: string, scriptDirectory?: string) => string;
    wasmBinary?: ArrayBuffer | Uint8Array;
  }) => Promise<any>;
  export default initOpenCascade;
}
