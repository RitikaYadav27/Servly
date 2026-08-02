'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function Orb({ position, color, scale }: { position: [number, number, number], color: string, scale: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => { if (ref.current) { ref.current.rotation.x = state.clock.elapsedTime / 2; ref.current.rotation.y = state.clock.elapsedTime / 3; } });
  return <Float speed={1.8} rotationIntensity={1.5} floatIntensity={1.7}><mesh ref={ref} position={position} scale={scale}><icosahedronGeometry args={[1, 2]}/><meshStandardMaterial color={color} metalness={.7} roughness={.15}/></mesh></Float>
}
export default function HeroScene() { return <div className="three-scene" aria-hidden="true"><Canvas camera={{ position:[0,0,6], fov:45 }} dpr={[1,1.5]}><ambientLight intensity={2}/><pointLight position={[2,3,4]} color="#ff6b00" intensity={20}/><pointLight position={[-3,-2,3]} color="#2563eb" intensity={18}/><Orb position={[-2,1,0]} color="#ff6b00" scale={.17}/><Orb position={[2,-1.4,0]} color="#2563eb" scale={.13}/><Orb position={[-1.8,-1.5,0]} color="#ffd1aa" scale={.09}/><Sparkles count={34} scale={7} size={2} speed={.3} color="#ff8d46"/></Canvas></div> }
