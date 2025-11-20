"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";

export type VehicleType = "sedan" | "suv" | "truck" | "coupe";

interface RealisticVehicleProps {
  vehicleType?: VehicleType;
  color?: string;
}

/**
 * Realistic vehicle model with proper body panels
 * Each part is a separate mesh for damage marking
 */
const RealisticVehicle = forwardRef<THREE.Group, RealisticVehicleProps>(
  ({ vehicleType = "sedan", color = "#2563eb" }, ref) => {
    const dimensions = useMemo(() => getDimensions(vehicleType), [vehicleType]);

    // Materials
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: "#1e3a8a",
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      transparent: true,
      opacity: 0.3,
      ior: 1.5,
    });

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: "#1a1a1a",
      metalness: 0.1,
      roughness: 0.9,
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: "#d4d4d4",
      metalness: 1.0,
      roughness: 0.1,
    });

    const lightMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffebb3",
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    return (
      <group ref={ref}>
        {/* HOOD */}
        <mesh
          position={[0, dimensions.hoodHeight, dimensions.hoodZ]}
          castShadow
          receiveShadow
          name="hood"
        >
          <boxGeometry args={[dimensions.width - 0.1, 0.05, dimensions.hoodLength]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* ROOF */}
        <mesh
          position={[0, dimensions.roofHeight, dimensions.roofZ]}
          castShadow
          receiveShadow
          name="roof"
        >
          <boxGeometry args={[dimensions.roofWidth, 0.05, dimensions.roofLength]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* TRUNK/BED */}
        <mesh
          position={[0, dimensions.trunkHeight, dimensions.trunkZ]}
          castShadow
          receiveShadow
          name={vehicleType === "truck" ? "bed" : "trunk"}
        >
          <boxGeometry args={[dimensions.width - 0.1, 0.05, dimensions.trunkLength]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* FRONT BUMPER */}
        <mesh
          position={[0, dimensions.bumperHeight, dimensions.frontBumperZ]}
          castShadow
          receiveShadow
          name="front_bumper"
        >
          <boxGeometry args={[dimensions.width, 0.2, 0.3]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* REAR BUMPER */}
        <mesh
          position={[0, dimensions.bumperHeight, dimensions.rearBumperZ]}
          castShadow
          receiveShadow
          name="rear_bumper"
        >
          <boxGeometry args={[dimensions.width, 0.2, 0.3]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* LEFT FRONT DOOR */}
        <mesh
          position={[-dimensions.width / 2, dimensions.doorHeight, dimensions.frontDoorZ]}
          castShadow
          receiveShadow
          name="door_left_front"
        >
          <boxGeometry args={[0.05, dimensions.doorH, dimensions.doorLength]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* RIGHT FRONT DOOR */}
        <mesh
          position={[dimensions.width / 2, dimensions.doorHeight, dimensions.frontDoorZ]}
          castShadow
          receiveShadow
          name="door_right_front"
        >
          <boxGeometry args={[0.05, dimensions.doorH, dimensions.doorLength]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* LEFT REAR DOOR (not for coupes) */}
        {vehicleType !== "coupe" && (
          <mesh
            position={[-dimensions.width / 2, dimensions.doorHeight, dimensions.rearDoorZ]}
            castShadow
            receiveShadow
            name="door_left_rear"
          >
            <boxGeometry args={[0.05, dimensions.doorH, dimensions.doorLength]} />
            <primitive object={bodyMaterial} />
          </mesh>
        )}

        {/* RIGHT REAR DOOR (not for coupes) */}
        {vehicleType !== "coupe" && (
          <mesh
            position={[dimensions.width / 2, dimensions.doorHeight, dimensions.rearDoorZ]}
            castShadow
            receiveShadow
            name="door_right_rear"
          >
            <boxGeometry args={[0.05, dimensions.doorH, dimensions.doorLength]} />
            <primitive object={bodyMaterial} />
          </mesh>
        )}

        {/* LEFT FRONT FENDER */}
        <mesh
          position={[-dimensions.width / 2, dimensions.fenderHeight, dimensions.frontFenderZ]}
          castShadow
          receiveShadow
          name="fender_left_front"
        >
          <boxGeometry args={[0.15, dimensions.fenderH, 1.0]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* RIGHT FRONT FENDER */}
        <mesh
          position={[dimensions.width / 2, dimensions.fenderHeight, dimensions.frontFenderZ]}
          castShadow
          receiveShadow
          name="fender_right_front"
        >
          <boxGeometry args={[0.15, dimensions.fenderH, 1.0]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* LEFT REAR FENDER */}
        <mesh
          position={[-dimensions.width / 2, dimensions.fenderHeight, dimensions.rearFenderZ]}
          castShadow
          receiveShadow
          name="fender_left_rear"
        >
          <boxGeometry args={[0.15, dimensions.fenderH, 1.0]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* RIGHT REAR FENDER */}
        <mesh
          position={[dimensions.width / 2, dimensions.fenderHeight, dimensions.rearFenderZ]}
          castShadow
          receiveShadow
          name="fender_right_rear"
        >
          <boxGeometry args={[0.15, dimensions.fenderH, 1.0]} />
          <primitive object={bodyMaterial} />
        </mesh>

        {/* FRONT WINDSHIELD */}
        <mesh
          position={[0, dimensions.windshieldHeight, dimensions.windshieldZ]}
          rotation={[Math.PI / 6, 0, 0]}
          castShadow
          name="windshield_front"
        >
          <boxGeometry args={[dimensions.roofWidth - 0.1, 0.02, 1.0]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* REAR WINDSHIELD */}
        <mesh
          position={[0, dimensions.windshieldHeight, dimensions.rearWindshieldZ]}
          rotation={[-Math.PI / 6, 0, 0]}
          castShadow
          name="windshield_rear"
        >
          <boxGeometry args={[dimensions.roofWidth - 0.1, 0.02, 0.8]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* LEFT WINDOWS */}
        <mesh
          position={[-dimensions.width / 2 + 0.02, dimensions.windowHeight, dimensions.roofZ]}
          name="window_left"
        >
          <boxGeometry args={[0.02, 0.4, dimensions.roofLength - 0.3]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* RIGHT WINDOWS */}
        <mesh
          position={[dimensions.width / 2 - 0.02, dimensions.windowHeight, dimensions.roofZ]}
          name="window_right"
        >
          <boxGeometry args={[0.02, 0.4, dimensions.roofLength - 0.3]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* HEADLIGHTS */}
        <mesh
          position={[-dimensions.width / 2 + 0.3, dimensions.bumperHeight + 0.1, dimensions.frontBumperZ + 0.15]}
          name="headlight_left"
        >
          <boxGeometry args={[0.25, 0.15, 0.05]} />
          <primitive object={lightMaterial} />
        </mesh>
        <mesh
          position={[dimensions.width / 2 - 0.3, dimensions.bumperHeight + 0.1, dimensions.frontBumperZ + 0.15]}
          name="headlight_right"
        >
          <boxGeometry args={[0.25, 0.15, 0.05]} />
          <primitive object={lightMaterial} />
        </mesh>

        {/* TAIL LIGHTS */}
        <mesh
          position={[-dimensions.width / 2 + 0.3, dimensions.bumperHeight + 0.1, dimensions.rearBumperZ - 0.15]}
          name="taillight_left"
        >
          <boxGeometry args={[0.2, 0.15, 0.05]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
        </mesh>
        <mesh
          position={[dimensions.width / 2 - 0.3, dimensions.bumperHeight + 0.1, dimensions.rearBumperZ - 0.15]}
          name="taillight_right"
        >
          <boxGeometry args={[0.2, 0.15, 0.05]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
        </mesh>

        {/* WHEELS */}
        <Wheel position={[-dimensions.wheelTrack, dimensions.wheelRadius, dimensions.frontWheelZ]} material={tireMaterial} chromeMaterial={chromeMaterial} />
        <Wheel position={[dimensions.wheelTrack, dimensions.wheelRadius, dimensions.frontWheelZ]} material={tireMaterial} chromeMaterial={chromeMaterial} />
        <Wheel position={[-dimensions.wheelTrack, dimensions.wheelRadius, dimensions.rearWheelZ]} material={tireMaterial} chromeMaterial={chromeMaterial} />
        <Wheel position={[dimensions.wheelTrack, dimensions.wheelRadius, dimensions.rearWheelZ]} material={tireMaterial} chromeMaterial={chromeMaterial} />

        {/* GROUND SHADOW */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      </group>
    );
  }
);

RealisticVehicle.displayName = "RealisticVehicle";

/**
 * Wheel component
 */
function Wheel({
  position,
  material,
  chromeMaterial,
}: {
  position: [number, number, number];
  material: THREE.Material;
  chromeMaterial: THREE.Material;
}) {
  return (
    <group position={position} name="wheel">
      {/* Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.25, 32]} />
        <primitive object={material} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.27, 32]} />
        <primitive object={chromeMaterial} />
      </mesh>
    </group>
  );
}

/**
 * Get dimensions based on vehicle type
 */
function getDimensions(vehicleType: VehicleType) {
  const base = {
    sedan: {
      width: 1.8,
      length: 4.5,
      height: 1.5,
      wheelbase: 2.7,
      wheelRadius: 0.35,
      wheelTrack: 0.75,
      groundClearance: 0.15,
    },
    suv: {
      width: 2.0,
      length: 4.8,
      height: 1.9,
      wheelbase: 2.8,
      wheelRadius: 0.4,
      wheelTrack: 0.85,
      groundClearance: 0.25,
    },
    truck: {
      width: 2.1,
      length: 5.5,
      height: 1.8,
      wheelbase: 3.2,
      wheelRadius: 0.45,
      wheelTrack: 0.9,
      groundClearance: 0.3,
    },
    coupe: {
      width: 1.75,
      length: 4.3,
      height: 1.35,
      wheelbase: 2.6,
      wheelRadius: 0.35,
      wheelTrack: 0.72,
      groundClearance: 0.12,
    },
  };

  const dim = base[vehicleType];

  return {
    width: dim.width,
    length: dim.length,
    height: dim.height,

    // Hood
    hoodHeight: dim.groundClearance + 0.5,
    hoodZ: dim.length / 2 - 1.0,
    hoodLength: 1.5,

    // Roof
    roofHeight: dim.height,
    roofZ: -0.2,
    roofWidth: dim.width - 0.2,
    roofLength: vehicleType === "coupe" ? 1.5 : 2.0,

    // Trunk
    trunkHeight: dim.groundClearance + 0.5,
    trunkZ: vehicleType === "truck" ? -dim.length / 2 + 1.5 : -dim.length / 2 + 0.8,
    trunkLength: vehicleType === "truck" ? 2.0 : 1.2,

    // Doors
    doorHeight: dim.groundClearance + 0.5,
    doorH: 0.8,
    doorLength: vehicleType === "coupe" ? 1.5 : 1.2,
    frontDoorZ: 0.5,
    rearDoorZ: vehicleType === "coupe" ? -1.0 : -0.8,

    // Fenders
    fenderHeight: dim.groundClearance + 0.35,
    fenderH: 0.5,
    frontFenderZ: dim.length / 2 - 0.8,
    rearFenderZ: -dim.length / 2 + 0.8,

    // Bumpers
    bumperHeight: dim.groundClearance + 0.25,
    frontBumperZ: dim.length / 2,
    rearBumperZ: -dim.length / 2,

    // Glass
    windshieldHeight: dim.height - 0.3,
    windshieldZ: dim.length / 2 - 1.5,
    rearWindshieldZ: -dim.length / 2 + 1.2,
    windowHeight: dim.height - 0.3,

    // Wheels
    wheelRadius: dim.wheelRadius,
    wheelTrack: dim.wheelTrack,
    frontWheelZ: dim.wheelbase / 2,
    rearWheelZ: -dim.wheelbase / 2,
  };
}

export default RealisticVehicle;
