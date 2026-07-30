import '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      sphereGeometry: any;
      boxGeometry: any;
      cylinderGeometry: any;
      torusGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
      ambientLight: any;
      directionalLight: any;
      gridHelper: any;
      primitive: any;
      color: any;
    }
  }
}
