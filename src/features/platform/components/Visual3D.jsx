import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, Torus, Float } from "@react-three/drei";

export default function Visual3D() {
  const [lowPowerMode, setLowPowerMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px), (prefers-reduced-motion: reduce)");
    const updateMode = () => setLowPowerMode(mediaQuery.matches);

    updateMode();
    mediaQuery.addEventListener?.("change", updateMode);

    return () => {
      mediaQuery.removeEventListener?.("change", updateMode);
    };
  }, []);

  return (
    <div className="w-full h-full relative group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 35 }}
        dpr={lowPowerMode ? [1, 1] : [1, 1.25]}
        gl={{ antialias: !lowPowerMode, alpha: true, powerPreference: "low-power" }}
        performance={{ min: 0.6 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={lowPowerMode ? 0.34 : 0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={lowPowerMode ? 1.35 : 2} />
        <Float speed={lowPowerMode ? 1 : 1.5} rotationIntensity={lowPowerMode ? 0.3 : 0.5} floatIntensity={lowPowerMode ? 0.25 : 0.5}>
          <Torus args={lowPowerMode ? [1, 0.4, 64, 96] : [1, 0.4, 96, 128]} rotation={[0.3, 0.4, 0.1]}>
            <meshPhysicalMaterial
              clearcoat={1}
              color="#0055FF"
              emissive="#001133"
              emissiveIntensity={lowPowerMode ? 0.28 : 0.4}
              metalness={0.9}
              roughness={0.07}
            />
          </Torus>
        </Float>
        <ContactShadows
          blur={lowPowerMode ? 2 : 3}
          color="#000000"
          far={8}
          opacity={lowPowerMode ? 0.22 : 0.3}
          position={[0, -2.4, 0]}
          scale={lowPowerMode ? 10 : 12}
        />
        <Environment preset="city" resolution={lowPowerMode ? 128 : 256} />
      </Canvas>
    </div>
  );
}
