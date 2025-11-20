"use client";

import { forwardRef, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type VehicleType = "sedan" | "suv" | "truck" | "coupe";

interface GLTFVehicleProps {
  vehicleType?: VehicleType;
}

/**
 * Load GLTF vehicle models
 * Falls back to placeholder if model not found
 */
const GLTFVehicle = forwardRef<THREE.Group, GLTFVehicleProps>(
  ({ vehicleType = "sedan" }, ref) => {
    const modelPath = `/models/${vehicleType}.glb`;

    try {
      // Try to load the GLTF model
      const { scene } = useGLTF(modelPath);

      // Clone the scene so we can use it multiple times
      const clonedScene = scene.clone();

      // Scale and position the model
      clonedScene.scale.set(1, 1, 1);
      clonedScene.position.set(0, 0, 0);

      // Enable shadows on all meshes
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      return (
        <group ref={ref}>
          <primitive object={clonedScene} />

          {/* Ground shadow */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </group>
      );
    } catch (error) {
      // Fallback to simple placeholder if model not found
      console.warn(`Could not load model: ${modelPath}. Using fallback.`);
      return <FallbackVehicle ref={ref} vehicleType={vehicleType} />;
    }
  }
);

GLTFVehicle.displayName = "GLTFVehicle";

/**
 * Fallback vehicle if GLTF model not available
 */
const FallbackVehicle = forwardRef<THREE.Group, GLTFVehicleProps>(
  ({ vehicleType = "sedan" }, ref) => {
    const getDimensions = () => {
      switch (vehicleType) {
        case "suv":
          return { width: 2.0, height: 1.9, length: 4.8 };
        case "truck":
          return { width: 2.1, height: 1.8, length: 5.5 };
        case "coupe":
          return { width: 1.75, height: 1.35, length: 4.3 };
        default:
          return { width: 1.8, height: 1.5, length: 4.5 };
      }
    };

    const dim = getDimensions();

    return (
      <group ref={ref}>
        {/* Simple car body */}
        <mesh position={[0, dim.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[dim.width, dim.height, dim.length]} />
          <meshPhysicalMaterial
            color="#2563eb"
            metalness={0.8}
            roughness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Cabin */}
        <mesh position={[0, dim.height, dim.length * 0.1]} castShadow>
          <boxGeometry args={[dim.width * 0.9, dim.height * 0.4, dim.length * 0.4]} />
          <meshPhysicalMaterial
            color="#1e40af"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>

        {/* Wheels */}
        {[-1, 1].map((x) =>
          [dim.length / 4, -dim.length / 4].map((z, i) => (
            <mesh
              key={`${x}-${i}`}
              position={[x * (dim.width / 2 - 0.1), 0.35, z]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
          ))
        )}

        {/* Ground shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.3} />
        </mesh>

        {/* Instructions overlay */}
        <mesh position={[0, dim.height * 2, 0]}>
          <planeGeometry args={[4, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    );
  }
);

FallbackVehicle.displayName = "FallbackVehicle";

// Preload models (optional, for better performance)
export function preloadVehicleModels() {
  ["sedan", "suv", "truck", "coupe"].forEach((type) => {
    try {
      useGLTF.preload(`/models/${type}.glb`);
    } catch (e) {
      // Silently fail if model doesn't exist
    }
  });
}

export default GLTFVehicle;
