import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Torus, Float } from "@react-three/drei";

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
        <ambientLight intensity={lowPowerMode ? 0.44 : 0.52} />
        <hemisphereLight args={["#9ec5ff", "#05070c", lowPowerMode ? 0.85 : 1.05]} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={lowPowerMode ? 1.1 : 1.7} />
        <pointLight color="#2563eb" intensity={lowPowerMode ? 5 : 7} position={[-3, 2, 4]} />
        <pointLight color="#60a5fa" intensity={lowPowerMode ? 2.5 : 3.5} position={[3, -1, 3]} />
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
      </Canvas>
    </div>
  );
}
