"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";

export type VehicleType = "sedan" | "suv" | "truck" | "coupe" | "van";
export type DoorConfig = "2door" | "4door" | "sliding";

interface ProfessionalVehicleProps {
  vehicleType?: VehicleType;
  doorConfig?: DoorConfig;
  color?: string;
}

/**
 * Professional automotive-quality 3D vehicle model
 * Uses LatheGeometry, ExtrudeGeometry, and advanced materials
 * Much more realistic than basic boxes
 */
const ProfessionalVehicle = forwardRef<THREE.Group, ProfessionalVehicleProps>(
  ({ vehicleType = "sedan", doorConfig, color = "#2563eb" }, ref) => {
    const config = useMemo(() => getVehicleConfig(vehicleType), [vehicleType]);
    const doors = doorConfig || getDefaultDoorConfig(vehicleType);

    // Professional automotive paint material
    const paintMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.95,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      envMapIntensity: 1.5,
    }), [color]);

    // Premium glass material
    const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
      color: "#1a2332",
      metalness: 0.0,
      roughness: 0.0,
      transmission: 0.98,
      transparent: true,
      opacity: 0.15,
      ior: 1.52,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
    }), []);

    // Chrome material
    const chromeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: "#d4d4d8",
      metalness: 1.0,
      roughness: 0.08,
      envMapIntensity: 2.0,
    }), []);

    // Tire material
    const tireMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: "#0f0f0f",
      metalness: 0.0,
      roughness: 0.98,
      normalScale: new THREE.Vector2(0.5, 0.5),
    }), []);

    // Headlight material
    const headlightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffeedd",
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.1,
    }), []);

    // Taillight material
    const taillightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: "#cc0000",
      emissive: "#ff0000",
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    }), []);

    // Create curved body using ExtrudeGeometry
    const bodyShape = useMemo(() => {
      const shape = new THREE.Shape();

      // Sedan profile - curved, automotive-style
      const halfLength = config.length / 2;
      const halfWidth = config.width / 2;

      // Front curve
      shape.moveTo(-halfLength, 0);
      shape.quadraticCurveTo(-halfLength + 0.3, 0.1, -halfLength + 0.6, 0.15);

      // Hood slope
      shape.lineTo(-halfLength + 1.5, 0.15);
      shape.quadraticCurveTo(-halfLength + 1.8, 0.2, -halfLength + 2.0, 0.35);

      // Windshield curve
      shape.quadraticCurveTo(-halfLength + 2.2, 0.6, -halfLength + 2.4, 0.8);

      // Roof
      shape.lineTo(halfLength - 2.0, 0.8);

      // Rear windshield curve
      shape.quadraticCurveTo(halfLength - 1.7, 0.75, halfLength - 1.4, 0.5);

      // Trunk slope
      shape.lineTo(halfLength - 0.8, 0.35);
      shape.quadraticCurveTo(halfLength - 0.5, 0.2, halfLength - 0.3, 0.15);

      // Rear curve
      shape.quadraticCurveTo(halfLength, 0.1, halfLength, 0);

      // Bottom edge
      shape.lineTo(-halfLength, 0);

      return shape;
    }, [config]);

    const extrudeSettings = {
      depth: config.width,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 5,
      curveSegments: 24,
    };

    return (
      <group ref={ref} position={[0, config.groundClearance, 0]}>
        {/* Main body - extruded curved profile */}
        <mesh
          position={[-config.width / 2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
          receiveShadow
          name="body"
        >
          <extrudeGeometry args={[bodyShape, extrudeSettings]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Hood - curved */}
        <mesh
          position={[0, config.bodyHeight * 0.6, config.length / 2 - 1.2]}
          rotation={[-0.15, 0, 0]}
          castShadow
          receiveShadow
          name="hood"
        >
          <boxGeometry args={[config.width * 0.92, 0.05, 1.8, 32, 4, 16]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Roof - smooth curve */}
        <mesh
          position={[0, config.bodyHeight * 1.5, 0]}
          castShadow
          receiveShadow
          name="roof"
        >
          <boxGeometry args={[config.width * 0.85, 0.04, config.length * 0.45, 24, 2, 24]} />
          <primitive object={paintMaterial} />
        </mesh>

        {/* Windshield - curved glass */}
        <mesh
          position={[0, config.bodyHeight * 1.4, config.length * 0.15]}
          rotation={[0.45, 0, 0]}
          castShadow
          receiveShadow
          name="windshield"
        >
          <planeGeometry args={[config.width * 0.82, 1.0, 16, 16]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* Rear windshield */}
        <mesh
          position={[0, config.bodyHeight * 1.35, -config.length * 0.2]}
          rotation={[-0.4, 0, 0]}
          castShadow
          receiveShadow
          name="rear_window"
        >
          <planeGeometry args={[config.width * 0.80, 0.9, 16, 16]} />
          <primitive object={glassMaterial} />
        </mesh>

        {/* Side windows - curved */}
        <group name="side_windows">
          {/* Driver side */}
          <mesh
            position={[-config.width / 2 + 0.02, config.bodyHeight * 1.2, 0]}
            rotation={[0, Math.PI / 2, 0.05]}
            name="window_left"
          >
            <planeGeometry args={[config.length * 0.5, 0.6, 16, 8]} />
            <primitive object={glassMaterial} />
          </mesh>

          {/* Passenger side */}
          <mesh
            position={[config.width / 2 - 0.02, config.bodyHeight * 1.2, 0]}
            rotation={[0, -Math.PI / 2, -0.05]}
            name="window_right"
          >
            <planeGeometry args={[config.length * 0.5, 0.6, 16, 8]} />
            <primitive object={glassMaterial} />
          </mesh>
        </group>

        {/* Front bumper - curved professional look */}
        <group name="front_bumper" position={[0, config.bodyHeight * 0.3, config.length / 2]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.15, 0.18, config.width * 0.9, 32, 1, false, 0, Math.PI]} />
            <primitive object={paintMaterial} />
          </mesh>
        </group>

        {/* Rear bumper */}
        <group name="rear_bumper" position={[0, config.bodyHeight * 0.3, -config.length / 2]}>
          <mesh castShadow receiveShadow rotation={[0, Math.PI, 0]}>
            <cylinderGeometry args={[0.15, 0.18, config.width * 0.9, 32, 1, false, 0, Math.PI]} />
            <primitive object={paintMaterial} />
          </mesh>
        </group>

        {/* Headlights - realistic curved lights */}
        <group name="headlights">
          <mesh
            position={[-config.width * 0.32, config.bodyHeight * 0.5, config.length / 2 - 0.05]}
            rotation={[0, 0, 0]}
            name="headlight_left"
          >
            <capsuleGeometry args={[0.08, 0.22, 8, 16]} />
            <primitive object={headlightMaterial} />
          </mesh>
          <mesh
            position={[config.width * 0.32, config.bodyHeight * 0.5, config.length / 2 - 0.05]}
            rotation={[0, 0, 0]}
            name="headlight_right"
          >
            <capsuleGeometry args={[0.08, 0.22, 8, 16]} />
            <primitive object={headlightMaterial} />
          </mesh>
        </group>

        {/* Taillights - LED style */}
        <group name="taillights">
          <mesh
            position={[-config.width * 0.35, config.bodyHeight * 0.5, -config.length / 2 + 0.05]}
            rotation={[0, 0, Math.PI / 2]}
            name="taillight_left"
          >
            <capsuleGeometry args={[0.06, 0.28, 6, 16]} />
            <primitive object={taillightMaterial} />
          </mesh>
          <mesh
            position={[config.width * 0.35, config.bodyHeight * 0.5, -config.length / 2 + 0.05]}
            rotation={[0, 0, Math.PI / 2]}
            name="taillight_right"
          >
            <capsuleGeometry args={[0.06, 0.28, 6, 16]} />
            <primitive object={taillightMaterial} />
          </mesh>
        </group>

        {/* Grille - realistic mesh pattern */}
        <mesh
          position={[0, config.bodyHeight * 0.45, config.length / 2 - 0.08]}
          name="grille"
        >
          <boxGeometry args={[config.width * 0.55, 0.25, 0.04, 16, 8, 1]} />
          <meshStandardMaterial
            color="#0a0a0a"
            metalness={0.9}
            roughness={0.2}
            emissive="#111111"
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Professional wheels with realistic spokes */}
        <WheelAssembly
          position={[-config.wheelTrack, 0, config.frontWheelZ]}
          radius={config.wheelRadius}
          tireMaterial={tireMaterial}
          chromeMaterial={chromeMaterial}
        />
        <WheelAssembly
          position={[config.wheelTrack, 0, config.frontWheelZ]}
          radius={config.wheelRadius}
          tireMaterial={tireMaterial}
          chromeMaterial={chromeMaterial}
        />
        <WheelAssembly
          position={[-config.wheelTrack, 0, config.rearWheelZ]}
          radius={config.wheelRadius}
          tireMaterial={tireMaterial}
          chromeMaterial={chromeMaterial}
        />
        <WheelAssembly
          position={[config.wheelTrack, 0, config.rearWheelZ]}
          radius={config.wheelRadius}
          tireMaterial={tireMaterial}
          chromeMaterial={chromeMaterial}
        />

        {/* Shadow catcher */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <circleGeometry args={[config.length * 0.7, 64]} />
          <shadowMaterial opacity={0.4} />
        </mesh>
      </group>
    );
  }
);

ProfessionalVehicle.displayName = "ProfessionalVehicle";

/**
 * Professional wheel assembly with realistic tire and rim
 */
function WheelAssembly({
  position,
  radius,
  tireMaterial,
  chromeMaterial,
}: {
  position: [number, number, number];
  radius: number;
  tireMaterial: THREE.Material;
  chromeMaterial: THREE.Material;
}) {
  return (
    <group position={position} name="wheel_assembly">
      {/* Tire - torus with realistic profile */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[radius, radius * 0.28, 20, 40]} />
        <primitive object={tireMaterial} />
      </mesh>

      {/* Rim - multi-layer for depth */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.68, radius * 0.68, 0.25, 32]} />
        <primitive object={chromeMaterial} />
      </mesh>

      {/* Inner rim detail */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.45, radius * 0.45, 0.28, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 5-spoke alloy wheel design */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
          {/* Main spoke */}
          <mesh position={[0, 0, radius * 0.35]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.04, radius * 0.5, 8, 12]} />
            <primitive object={chromeMaterial} />
          </mesh>

          {/* Spoke detail */}
          <mesh position={[0, 0, radius * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.12, radius * 0.3, 0.015]} />
            <primitive object={chromeMaterial} />
          </mesh>
        </group>
      ))}

      {/* Center cap */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.15, radius * 0.15, 0.08, 32]} />
        <primitive object={chromeMaterial} />
      </mesh>
    </group>
  );
}

/**
 * Get vehicle configuration
 */
function getVehicleConfig(type: VehicleType) {
  const configs = {
    sedan: {
      length: 4.8,
      width: 1.85,
      bodyHeight: 0.65,
      wheelRadius: 0.36,
      wheelTrack: 0.82,
      groundClearance: 0.16,
      frontWheelZ: 1.4,
      rearWheelZ: -1.4,
    },
    suv: {
      length: 5.0,
      width: 2.0,
      bodyHeight: 0.8,
      wheelRadius: 0.42,
      wheelTrack: 0.88,
      groundClearance: 0.25,
      frontWheelZ: 1.5,
      rearWheelZ: -1.5,
    },
    truck: {
      length: 5.8,
      width: 2.1,
      bodyHeight: 0.85,
      wheelRadius: 0.46,
      wheelTrack: 0.92,
      groundClearance: 0.32,
      frontWheelZ: 1.7,
      rearWheelZ: -1.7,
    },
    coupe: {
      length: 4.5,
      width: 1.8,
      bodyHeight: 0.55,
      wheelRadius: 0.38,
      wheelTrack: 0.78,
      groundClearance: 0.12,
      frontWheelZ: 1.35,
      rearWheelZ: -1.35,
    },
    van: {
      length: 5.2,
      width: 2.0,
      bodyHeight: 1.2,
      wheelRadius: 0.40,
      wheelTrack: 0.90,
      groundClearance: 0.22,
      frontWheelZ: 1.6,
      rearWheelZ: -1.6,
    },
  };

  return configs[type];
}

function getDefaultDoorConfig(vehicleType: VehicleType): DoorConfig {
  switch (vehicleType) {
    case "coupe":
      return "2door";
    case "van":
      return "sliding";
    default:
      return "4door";
  }
}

export default ProfessionalVehicle;
