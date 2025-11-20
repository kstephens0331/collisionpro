"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";

export type VehicleType = "sedan" | "suv" | "truck" | "coupe";

interface ImprovedVehicleProps {
  vehicleType?: VehicleType;
  color?: string;
}

/**
 * Much improved procedural vehicle with realistic proportions
 * Uses rounded geometries and proper automotive shapes
 */
const ImprovedVehicle = forwardRef<THREE.Group, ImprovedVehicleProps>(
  ({ vehicleType = "sedan", color = "#2563eb" }, ref) => {
    const config = useMemo(() => getVehicleConfig(vehicleType), [vehicleType]);

    // Premium automotive materials
    const paintMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: "#1a3a5c",
      metalness: 0.0,
      roughness: 0.05,
      transmission: 0.95,
      transparent: true,
      opacity: 0.4,
      ior: 1.52,
      thickness: 0.5,
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: "#c0c0c0",
      metalness: 1.0,
      roughness: 0.1,
    });

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: "#0a0a0a",
      metalness: 0.0,
      roughness: 0.95,
    });

    const lightMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffe5b4",
      emissiveIntensity: 0.6,
    });

    const taillightMaterial = new THREE.MeshStandardMaterial({
      color: "#ff0000",
      emissive: "#ff0000",
      emissiveIntensity: 0.5,
    });

    return (
      <group ref={ref}>
        {/* MAIN BODY - Rounded for realistic look */}
        <mesh position={[0, config.bodyHeight, 0]} castShadow receiveShadow name="body">
          <boxGeometry args={[config.width, config.bodyH, config.length, 16, 4, 16]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* HOOD - Sloped front */}
        <mesh
          position={[0, config.hoodY, config.hoodZ]}
          rotation={[config.hoodAngle, 0, 0]}
          castShadow
          receiveShadow
          name="hood"
        >
          <boxGeometry args={[config.width * 0.95, 0.08, config.hoodLength, 12, 2, 12]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* ROOF - Curved */}
        <mesh
          position={[0, config.roofY, config.roofZ]}
          castShadow
          receiveShadow
          name="roof"
        >
          <boxGeometry args={[config.roofWidth, 0.06, config.roofLength, 12, 2, 12]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* TRUNK/DECK - Sloped rear */}
        <mesh
          position={[0, config.trunkY, config.trunkZ]}
          rotation={[config.trunkAngle, 0, 0]}
          castShadow
          receiveShadow
          name={vehicleType === "truck" ? "bed" : "trunk"}
        >
          <boxGeometry args={[config.width * 0.95, 0.08, config.trunkLength, 12, 2, 12]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* WINDSHIELD - Curved glass */}
        <mesh
          position={[0, config.windshieldY, config.windshieldZ]}
          rotation={[config.windshieldAngle, 0, 0]}
          castShadow
          name="windshield_front"
        >
          <planeGeometry args={[config.roofWidth - 0.1, 0.9, 12, 12]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* REAR WINDSHIELD */}
        <mesh
          position={[0, config.rearWindowY, config.rearWindowZ]}
          rotation={[config.rearWindowAngle, 0, 0]}
          castShadow
          name="windshield_rear"
        >
          <planeGeometry args={[config.roofWidth - 0.1, 0.7, 12, 12]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* SIDE WINDOWS - Left */}
        <mesh
          position={[-config.width / 2 + 0.02, config.windowY, config.roofZ]}
          rotation={[0, 0, config.windowTilt]}
          name="window_left"
        >
          <planeGeometry args={[0.02, 0.5, 1, 8]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* SIDE WINDOWS - Right */}
        <mesh
          position={[config.width / 2 - 0.02, config.windowY, config.roofZ]}
          rotation={[0, 0, -config.windowTilt]}
          name="window_right"
        >
          <planeGeometry args={[0.02, 0.5, 1, 8]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* DOORS - Rounded edges */}
        {/* Front Left Door */}
        <mesh
          position={[-config.width / 2, config.doorY, config.frontDoorZ]}
          castShadow
          receiveShadow
          name="door_left_front"
        >
          <boxGeometry args={[0.08, config.doorH, config.doorLength, 4, 8, 8]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Front Right Door */}
        <mesh
          position={[config.width / 2, config.doorY, config.frontDoorZ]}
          castShadow
          receiveShadow
          name="door_right_front"
        >
          <boxGeometry args={[0.08, config.doorH, config.doorLength, 4, 8, 8]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Rear Doors - if not coupe */}
        {vehicleType !== "coupe" && (
          <>
            <mesh
              position={[-config.width / 2, config.doorY, config.rearDoorZ]}
              castShadow
              receiveShadow
              name="door_left_rear"
            >
              <boxGeometry args={[0.08, config.doorH, config.doorLength * 0.9, 4, 8, 8]} />
              <primitive object={paintMaterial} />
            </mesh>
            <mesh
              position={[config.width / 2, config.doorY, config.rearDoorZ]}
              castShadow
              receiveShadow
              name="door_right_rear"
            >
              <boxGeometry args={[0.08, config.doorH, config.doorLength * 0.9, 4, 8, 8]} />
              <primitive object={paintMaterial} />
            </mesh>
          </>
        )}

        {/* FENDERS - Wheel arches */}
        {/* Front Left Fender */}
        <mesh
          position={[-config.width / 2 + 0.05, config.fenderY, config.frontWheelZ]}
          castShadow
          receiveShadow
          name="fender_left_front"
        >
          <boxGeometry args={[0.2, config.fenderH, 1.2, 6, 6, 8]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Front Right Fender */}
        <mesh
          position={[config.width / 2 - 0.05, config.fenderY, config.frontWheelZ]}
          castShadow
          receiveShadow
          name="fender_right_front"
        >
          <boxGeometry args={[0.2, config.fenderH, 1.2, 6, 6, 8]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Rear Left Fender */}
        <mesh
          position={[-config.width / 2 + 0.05, config.fenderY, config.rearWheelZ]}
          castShadow
          receiveShadow
          name="fender_left_rear"
        >
          <boxGeometry args={[0.2, config.fenderH, 1.2, 6, 6, 8]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Rear Right Fender */}
        <mesh
          position={[config.width / 2 - 0.05, config.fenderY, config.rearWheelZ]}
          castShadow
          receiveShadow
          name="fender_right_rear"
        >
          <boxGeometry args={[0.2, config.fenderH, 1.2, 6, 6, 8]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* BUMPERS - Rounded */}
        {/* Front Bumper */}
        <mesh
          position={[0, config.bumperY, config.frontBumperZ]}
          castShadow
          receiveShadow
          name="front_bumper"
        >
          <boxGeometry args={[config.width, 0.25, 0.4, 12, 4, 6]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Rear Bumper */}
        <mesh
          position={[0, config.bumperY, config.rearBumperZ]}
          castShadow
          receiveShadow
          name="rear_bumper"
        >
          <boxGeometry args={[config.width, 0.25, 0.4, 12, 4, 6]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* HEADLIGHTS - Realistic shapes */}
        <group>
          <mesh position={[-config.width * 0.35, config.bumperY + 0.15, config.frontBumperZ + 0.15]} name="headlight_left">
            <boxGeometry args={[0.3, 0.18, 0.08]} />
            <primitive object={lightMaterial} />
          </mesh>
          <mesh position={[config.width * 0.35, config.bumperY + 0.15, config.frontBumperZ + 0.15]} name="headlight_right">
            <boxGeometry args={[0.3, 0.18, 0.08]} />
            <primitive object={lightMaterial} />
          </mesh>
        </group>

        {/* TAILLIGHTS */}
        <group>
          <mesh position={[-config.width * 0.35, config.bumperY + 0.15, config.rearBumperZ - 0.15]} name="taillight_left">
            <boxGeometry args={[0.25, 0.15, 0.08]} />
            <primitive object={taillightMaterial} />
          </mesh>
          <mesh position={[config.width * 0.35, config.bumperY + 0.15, config.rearBumperZ - 0.15]} name="taillight_right">
            <boxGeometry args={[0.25, 0.15, 0.08]} />
            <primitive object={taillightMaterial} />
          </mesh>
        </group>

        {/* GRILLE */}
        <mesh position={[0, config.bumperY + 0.1, config.frontBumperZ + 0.2]} name="grille">
          <boxGeometry args={[config.width * 0.6, 0.2, 0.05]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* WHEELS - Realistic with spokes */}
        <Wheel position={[-config.wheelTrack, config.wheelRadius, config.frontWheelZ]} tireMaterial={tireMaterial} chromeMaterial={chromeMaterial} radius={config.wheelRadius} />
        <Wheel position={[config.wheelTrack, config.wheelRadius, config.frontWheelZ]} tireMaterial={tireMaterial} chromeMaterial={chromeMaterial} radius={config.wheelRadius} />
        <Wheel position={[-config.wheelTrack, config.wheelRadius, config.rearWheelZ]} tireMaterial={tireMaterial} chromeMaterial={chromeMaterial} radius={config.wheelRadius} />
        <Wheel position={[config.wheelTrack, config.wheelRadius, config.rearWheelZ]} tireMaterial={tireMaterial} chromeMaterial={chromeMaterial} radius={config.wheelRadius} />

        {/* GROUND SHADOW */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
      </group>
    );
  }
);

ImprovedVehicle.displayName = "ImprovedVehicle";

/**
 * Realistic wheel with tire and rim
 */
function Wheel({
  position,
  tireMaterial,
  chromeMaterial,
  radius,
}: {
  position: [number, number, number];
  tireMaterial: THREE.Material;
  chromeMaterial: THREE.Material;
  radius: number;
}) {
  return (
    <group position={position} name="wheel">
      {/* Tire - Torus for rounded profile */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[radius, radius * 0.25, 16, 32]} />
        <primitive object={tireMaterial} />
      </mesh>

      {/* Rim - Multiple layers for depth */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.7, radius * 0.7, 0.3, 32]} />
        <primitive object={chromeMaterial} />
      </mesh>

      {/* Rim spokes */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          rotation={[0, (i * Math.PI * 2) / 5, Math.PI / 2]}
          position={[0, 0, 0]}
        >
          <boxGeometry args={[radius * 0.6, 0.05, 0.15]} />
          <primitive object={chromeMaterial} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Get realistic vehicle configuration based on type
 */
function getVehicleConfig(type: VehicleType) {
  const configs = {
    sedan: {
      width: 1.8,
      length: 4.5,
      wheelbase: 2.7,
      wheelRadius: 0.35,
      wheelTrack: 0.78,
      groundClearance: 0.16,
      bodyH: 0.7,
      bodyHeight: 0.5,
      roofWidth: 1.65,
      roofLength: 2.2,
      roofY: 1.45,
      roofZ: -0.1,
      hoodLength: 1.4,
      hoodY: 0.9,
      hoodZ: 1.6,
      hoodAngle: -0.15,
      trunkLength: 1.2,
      trunkY: 0.9,
      trunkZ: -1.8,
      trunkAngle: 0.1,
      windshieldY: 1.35,
      windshieldZ: 0.9,
      windshieldAngle: 0.4,
      rearWindowY: 1.35,
      rearWindowZ: -1.0,
      rearWindowAngle: -0.35,
      windowY: 1.25,
      windowTilt: 0.05,
      doorY: 0.65,
      doorH: 0.9,
      doorLength: 1.3,
      frontDoorZ: 0.7,
      rearDoorZ: -0.9,
      fenderY: 0.45,
      fenderH: 0.6,
      frontWheelZ: 1.35,
      rearWheelZ: -1.35,
      bumperY: 0.3,
      frontBumperZ: 2.25,
      rearBumperZ: -2.25,
    },
    suv: {
      width: 2.0,
      length: 4.8,
      wheelbase: 2.8,
      wheelRadius: 0.4,
      wheelTrack: 0.85,
      groundClearance: 0.25,
      bodyH: 0.85,
      bodyHeight: 0.65,
      roofWidth: 1.85,
      roofLength: 2.5,
      roofY: 1.75,
      roofZ: -0.05,
      hoodLength: 1.5,
      hoodY: 1.1,
      hoodZ: 1.65,
      hoodAngle: -0.1,
      trunkLength: 1.3,
      trunkY: 1.45,
      trunkZ: -1.75,
      trunkAngle: -0.15,
      windshieldY: 1.65,
      windshieldZ: 0.95,
      windshieldAngle: 0.35,
      rearWindowY: 1.6,
      rearWindowZ: -1.05,
      rearWindowAngle: -0.4,
      windowY: 1.5,
      windowTilt: 0.08,
      doorY: 0.85,
      doorH: 1.1,
      doorLength: 1.4,
      frontDoorZ: 0.75,
      rearDoorZ: -0.95,
      fenderY: 0.6,
      fenderH: 0.75,
      frontWheelZ: 1.4,
      rearWheelZ: -1.4,
      bumperY: 0.4,
      frontBumperZ: 2.4,
      rearBumperZ: -2.4,
    },
    truck: {
      width: 2.1,
      length: 5.8,
      wheelbase: 3.3,
      wheelRadius: 0.45,
      wheelTrack: 0.9,
      groundClearance: 0.32,
      bodyH: 0.8,
      bodyHeight: 0.7,
      roofWidth: 1.95,
      roofLength: 1.8,
      roofY: 1.7,
      roofZ: 0.8,
      hoodLength: 1.6,
      hoodY: 1.15,
      hoodZ: 2.0,
      hoodAngle: -0.08,
      trunkLength: 2.5,
      trunkY: 0.95,
      trunkZ: -2.0,
      trunkAngle: 0,
      windshieldY: 1.6,
      windshieldZ: 1.45,
      windshieldAngle: 0.3,
      rearWindowY: 1.55,
      rearWindowZ: 0.15,
      rearWindowAngle: -0.25,
      windowY: 1.45,
      windowTilt: 0.06,
      doorY: 0.9,
      doorH: 1.0,
      doorLength: 1.5,
      frontDoorZ: 1.2,
      rearDoorZ: -0.3,
      fenderY: 0.65,
      fenderH: 0.8,
      frontWheelZ: 1.65,
      rearWheelZ: -1.65,
      bumperY: 0.45,
      frontBumperZ: 2.9,
      rearBumperZ: -2.9,
    },
    coupe: {
      width: 1.75,
      length: 4.3,
      wheelbase: 2.6,
      wheelRadius: 0.36,
      wheelTrack: 0.75,
      groundClearance: 0.12,
      bodyH: 0.6,
      bodyHeight: 0.42,
      roofWidth: 1.6,
      roofLength: 1.7,
      roofY: 1.25,
      roofZ: -0.2,
      hoodLength: 1.5,
      hoodY: 0.75,
      hoodZ: 1.5,
      hoodAngle: -0.12,
      trunkLength: 1.1,
      trunkY: 0.78,
      trunkZ: -1.7,
      trunkAngle: 0.15,
      windshieldY: 1.15,
      windshieldZ: 0.75,
      windshieldAngle: 0.5,
      rearWindowY: 1.1,
      rearWindowZ: -0.95,
      rearWindowAngle: -0.45,
      windowY: 1.05,
      windowTilt: 0.1,
      doorY: 0.55,
      doorH: 0.75,
      doorLength: 1.7,
      frontDoorZ: 0.5,
      rearDoorZ: -1.2,
      fenderY: 0.35,
      fenderH: 0.5,
      frontWheelZ: 1.3,
      rearWheelZ: -1.3,
      bumperY: 0.25,
      frontBumperZ: 2.15,
      rearBumperZ: -2.15,
    },
  };

  return configs[type];
}

export default ImprovedVehicle;
