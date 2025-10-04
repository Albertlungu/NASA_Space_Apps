import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

interface Map3DProps {
  opacity: number;
  showSatellite: boolean;
}

// Mock location data for 3D visualization
const locations = [
  { name: "San Francisco", lat: 37.7749, lng: -122.4194, aqi: 45, color: '#22c55e' },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, aqi: 125, color: '#f97316' },
  { name: "New York", lat: 40.7128, lng: -74.0060, aqi: 68, color: '#eab308' },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, aqi: 52, color: '#eab308' },
  { name: "Houston", lat: 29.7604, lng: -95.3698, aqi: 78, color: '#eab308' },
];

// Convert lat/lng to 3D coordinates on a sphere
const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

const AQIMarker = ({ position, aqi, name, color }: { position: THREE.Vector3; aqi: number; name: string; color: string }) => {
  return (
    <group position={position}>
      <Sphere args={[0.05, 16, 16]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </Sphere>
      <Html distanceFactor={10}>
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap text-xs pointer-events-none">
          <div className="font-semibold">{name}</div>
          <div className="text-muted-foreground">AQI: {aqi}</div>
        </div>
      </Html>
    </group>
  );
};

const Globe = ({ showSatellite, opacity }: { showSatellite: boolean; opacity: number }) => {
  const globeRef = useRef<THREE.Mesh>(null);

  return (
    <>
      {/* Earth Globe */}
      <Sphere ref={globeRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.7}
          metalness={0.2}
        />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere args={[2.1, 64, 64]}>
        <meshBasicMaterial
          color="#4a90e2"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Satellite overlay */}
      {showSatellite && (
        <Sphere args={[2.05, 64, 64]}>
          <meshBasicMaterial
            transparent
            opacity={opacity / 100}
            side={THREE.FrontSide}
          >
            <primitive
              attach="map"
              object={(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 1024;
                canvas.height = 512;
                const ctx = canvas.getContext('2d')!;
                
                // Create gradient overlay simulating pollution data
                const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
                gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
                gradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.3)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1024, 512);
                
                const texture = new THREE.CanvasTexture(canvas);
                return texture;
              })()}
            />
          </meshBasicMaterial>
        </Sphere>
      )}

      {/* AQI markers */}
      {locations.map((loc, idx) => {
        const position = latLngToVector3(loc.lat, loc.lng, 2.15);
        return (
          <AQIMarker
            key={idx}
            position={position}
            aqi={loc.aqi}
            name={loc.name}
            color={loc.color}
          />
        );
      })}
    </>
  );
};

const Map3D = ({ opacity, showSatellite }: Map3DProps) => {
  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />
        
        <Globe showSatellite={showSatellite} opacity={opacity} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={10}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default Map3D;