import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, calculateTeamProgress, calculateTeamScore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Award, Target, Sparkles, Check, Lock } from 'lucide-react';

const MILESTONES = [
  { percent: 25, title: 'Bronze Foundation', desc: 'Base construction successfully locked in (25%)', emoji: '🥉', color: '#b45309', glowColor: 'rgba(180, 83, 9, 0.4)' },
  { percent: 50, title: 'Structural Silver', desc: 'Rises robustly to the halfway progress mark (50%)', emoji: '🥈', color: '#64748b', glowColor: 'rgba(100, 116, 139, 0.4)' },
  { percent: 75, title: 'Golden Apex Peak', desc: 'Structure reaches three-quarters height (75%)', emoji: '🥇', color: '#d97706', glowColor: 'rgba(217, 119, 6, 0.4)' },
  { percent: 100, title: 'Architectural Master', desc: '100% full masterwork completed and crowned!', emoji: '👑', color: '#6366f1', glowColor: 'rgba(99, 102, 241, 0.4)' },
];

function MilestoneGem3D({ position, color, progress, targetProgress, label, emoji }: { position: [number, number, number], color: string, progress: number, targetProgress: number, label: string, emoji: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isUnlocked = progress >= targetProgress;

  useFrame((state) => {
    if (meshRef.current) {
      if (isUnlocked) {
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 1.5;
        meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 1.0) * 0.4;
        meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2 + targetProgress) * 0.12;
      } else {
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
        meshRef.current.rotation.x = 0;
        meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.5 + targetProgress) * 0.04;
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial 
          color={isUnlocked ? color : '#1e293b'} 
          roughness={isUnlocked ? 0.15 : 0.8}
          metalness={isUnlocked ? 0.85 : 0.1}
          emissive={isUnlocked ? color : '#000000'}
          emissiveIntensity={isUnlocked ? 1.2 : 0}
          transparent
          opacity={isUnlocked ? 0.95 : 0.25}
        />
      </mesh>
      
      {isUnlocked && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <ringGeometry args={[0.35, 0.45, 16]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

interface BlockData {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  color: string;
}

function generateArkPoints(): BlockData[] {
  const blocks: BlockData[] = [];
  const brownColors = ['#854d0e', '#a16207', '#ca8a04', '#b45309', '#78350f'];
  
  // 1. Keel (bottom centerline)
  for (let x = -3.5; x <= 3.5; x += 0.5) {
    blocks.push({
      pos: [x, 0.1, 0],
      rot: [0, 0, 0],
      scale: [0.6, 0.25, 0.6],
      color: '#451a03',
    });
  }

  // 2. Hull Ribs and Side Planks (Curving upwards and outwards)
  for (let level = 0; level < 4; level++) {
    const y = 0.3 + level * 0.35;
    const widthFactor = 0.5 + level * 0.25;
    
    for (let x = -3.5; x <= 3.5; x += 0.5) {
      const distFromCenter = Math.abs(x) / 4.0;
      const taper = Math.max(0.1, 1.0 - distFromCenter * distFromCenter);
      const zOffset = 1.4 * widthFactor * taper;
      const heightBonus = Math.pow(Math.abs(x) / 3.5, 2) * 0.55;
      
      blocks.push({
        pos: [x, y + heightBonus, zOffset],
        rot: [0, Math.atan2((x === 3.5 ? 0 : zOffset), 0.5), 0.1 * (x / 3.5)],
        scale: [0.55, 0.3, 0.2],
        color: brownColors[Math.abs(Math.floor(x * 2 + level)) % brownColors.length],
      });
      
      blocks.push({
        pos: [x, y + heightBonus, -zOffset],
        rot: [0, -Math.atan2((x === 3.5 ? 0 : zOffset), 0.5), -0.1 * (x / 3.5)],
        scale: [0.55, 0.3, 0.2],
        color: brownColors[Math.abs(Math.floor(x * 2 + level + 3)) % brownColors.length],
      });
    }
  }

  // 3. Deck floor
  for (let x = -3.0; x <= 3.0; x += 0.6) {
    const distFromCenter = Math.abs(x) / 3.5;
    const taper = Math.max(0.1, 1.0 - distFromCenter * distFromCenter);
    const maxZ = 1.1 * taper;
    
    for (let z = -maxZ + 0.25; z <= maxZ - 0.25; z += 0.5) {
      blocks.push({
        pos: [x, 1.4, z],
        rot: [0, 0, 0],
        scale: [0.65, 0.15, 0.45],
        color: '#ca8a04',
      });
    }
  }

  // 4. Cabin on the deck
  for (let level = 0; level < 2; level++) {
    const y = 1.55 + level * 0.4;
    for (let x = -1.5; x <= 1.5; x += 0.6) {
      blocks.push({
        pos: [x, y, 0.5],
        rot: [0, 0, 0],
        scale: [0.5, 0.38, 0.15],
        color: '#78350f',
      });
      blocks.push({
        pos: [x, y, -0.5],
        rot: [0, 0, 0],
        scale: [0.5, 0.38, 0.15],
        color: '#78350f',
      });
    }
  }

  // Cabin roof
  for (let x = -1.8; x <= 1.8; x += 0.5) {
    blocks.push({
      pos: [x, 2.3, 0],
      rot: [0.2 * (x > 0 ? -1 : 1), 0, 0],
      scale: [0.55, 0.15, 1.2],
      color: '#451a03',
    });
  }

  return blocks;
}

function generateWallPoints(): BlockData[] {
  const blocks: BlockData[] = [];
  const stoneColors = ['#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'];
  const size = 3.0;
  const heightLevels = 5;
  const blockLength = 0.8;
  const getStoneColor = (val: number) => stoneColors[Math.abs(Math.floor(val * 13)) % stoneColors.length];

  // 1. Standard Wall Blocks on 4 sides
  for (let level = 0; level < heightLevels; level++) {
    const y = 0.2 + level * 0.4;
    const isTopCrenellation = level === heightLevels - 1;
    
    // Front (South) Wall: z = size
    for (let x = -size + 0.6; x <= size - 0.6; x += blockLength) {
      if (Math.abs(x) < 0.6 && level < 2) continue;
      if (isTopCrenellation && Math.round(x / blockLength) % 2 === 0) continue;
      blocks.push({
        pos: [x, y, size],
        rot: [0, 0, 0],
        scale: [blockLength - 0.05, 0.38, 0.4],
        color: getStoneColor(x + y + 1),
      });
    }

    // Back (North) Wall: z = -size
    for (let x = -size + 0.6; x <= size - 0.6; x += blockLength) {
      if (isTopCrenellation && Math.round(x / blockLength) % 2 === 0) continue;
      blocks.push({
        pos: [x, y, -size],
        rot: [0, 0, 0],
        scale: [blockLength - 0.05, 0.38, 0.4],
        color: getStoneColor(x + y + 2),
      });
    }

    // Left (West) Wall: x = -size
    for (let z = -size + 0.6; z <= size - 0.6; z += blockLength) {
      if (isTopCrenellation && Math.round(z / blockLength) % 2 === 0) continue;
      blocks.push({
        pos: [-size, y, z],
        rot: [0, Math.PI / 2, 0],
        scale: [blockLength - 0.05, 0.38, 0.4],
        color: getStoneColor(z + y + 3),
      });
    }

    // Right (East) Wall: x = size
    for (let z = -size + 0.6; z <= size - 0.6; z += blockLength) {
      if (isTopCrenellation && Math.round(z / blockLength) % 2 === 0) continue;
      blocks.push({
        pos: [size, y, z],
        rot: [0, Math.PI / 2, 0],
        scale: [blockLength - 0.05, 0.38, 0.4],
        color: getStoneColor(z + y + 4),
      });
    }
  }

  // 2. Corner Watchtowers
  const corners = [
    [-size, -size],
    [size, -size],
    [-size, size],
    [size, size]
  ];

  for (const [cx, cz] of corners) {
    for (let level = 0; level < 7; level++) {
      const y = 0.2 + level * 0.4;
      const isTop = level === 6;
      blocks.push({
        pos: [cx, y, cz],
        rot: [0, 0, 0],
        scale: [0.8, 0.38, 0.8],
        color: isTop ? '#475569' : getStoneColor(cx * cz + y),
      });
      if (isTop) {
        blocks.push({
          pos: [cx, y + 0.3, cz],
          rot: [0, 0, 0],
          scale: [0.6, 0.2, 0.6],
          color: '#e2e8f0',
        });
      }
    }
  }

  // 3. Gate Lintel and Door
  blocks.push({
    pos: [0, 1.0, size],
    rot: [0, 0, 0],
    scale: [1.3, 0.35, 0.6],
    color: '#1e293b',
  });
  blocks.push({
    pos: [-0.35, 0.4, size - 0.1],
    rot: [0, 0.6, 0],
    scale: [0.5, 0.8, 0.08],
    color: '#78350f',
  });
  blocks.push({
    pos: [0.35, 0.4, size - 0.1],
    rot: [0, -0.6, 0],
    scale: [0.5, 0.8, 0.08],
    color: '#78350f',
  });

  return blocks;
}

function ProgressiveStructure({ progress, teamId }: { progress: number, teamId: string }) {
  const isShipping = teamId === 'shipping';
  
  const blocks = isShipping ? generateArkPoints() : generateWallPoints();
  const totalBlocks = blocks.length;
  const visibleBlocksCount = Math.floor((progress / 100) * totalBlocks);
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Base Foundation */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 4.2, 0.2, 32]} />
        <meshStandardMaterial color={isShipping ? "#4b5563" : "#334155"} opacity={0.8} transparent />
      </mesh>

      {/* Render construction piece by piece */}
      {blocks.map((block, i) => {
        const isVisible = i < visibleBlocksCount;
        return (
          <mesh
            key={i}
            position={block.pos}
            rotation={block.rot}
            visible={isVisible}
            castShadow
            receiveShadow
          >
            <boxGeometry args={block.scale} />
            <meshStandardMaterial
              color={block.color}
              roughness={isShipping ? 0.3 : 0.6}
              metalness={isShipping ? 0.2 : 0.1}
            />
          </mesh>
        );
      })}

      {progress >= 100 && (
         <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
           <mesh position={[0, isShipping ? 2.8 : 3.5, 0]}>
             <sphereGeometry args={[0.5, 32, 32]} />
             <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
           </mesh>
         </Float>
      )}
    </group>
  );
}

interface ThreeDViewPageProps {
  teamId: string;
  onBack: () => void;
}

export function ThreeDViewPage({ teamId, onBack }: ThreeDViewPageProps) {
  const games = useStore((state) => state.games);
  const eventTargetScore = useStore((state) => state.eventTargetScore);
  const team = useStore((state) => state.teams[teamId]);
  const days = useStore((state) => state.days);
  const progress = calculateTeamProgress(team, games, eventTargetScore);
  const currentScore = calculateTeamScore(team, games);
  
  const [isMounting, setIsMounting] = useState(true);
  const [activeTab, setActiveTab] = useState<'3d' | 'scores'>('3d');
  const [activeScoreDayId, setActiveScoreDayId] = useState<string>('default-day');
  const [expandedScoresGames, setExpandedScoresGames] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (days && !days[activeScoreDayId]) {
      const firstId = Object.keys(days)[0];
      if (firstId) {
        setActiveScoreDayId(firstId);
      }
    }
  }, [days, activeScoreDayId]);
  
  useEffect(() => {
    const t = setTimeout(() => setIsMounting(false), 50);
    return () => clearTimeout(t);
  }, []);

  if (!team) return null;

  const unlockedMilestones = MILESTONES.filter(m => progress >= m.percent);

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-900 flex flex-col pt-[max(env(safe-area-inset-top),_1rem)] select-none">
      {/* Top Bar Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col">
        <div className="h-[80px] w-full bg-[#0F172A]/95 backdrop-blur-[8px] flex items-center justify-between px-6 sm:px-[40px] border-b border-white/10 shadow-lg">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="bg-white text-black px-4 sm:px-6 py-2.5 rounded-[12px] font-semibold text-xs sm:text-[0.875rem] transition hover:bg-gray-100 shadow-sm cursor-pointer"
            >
              ← Back
            </button>
            
            <div className="bg-[#2D3748] px-4 sm:px-6 py-2.5 rounded-[12px] text-white font-semibold flex items-center shadow-inner">
              <span className="font-sansArabic text-xs sm:text-base">{team.nameAr}</span>
            </div>
          </div>
          
          {/* Custom Selection Tab Menu */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/5 shadow-inner">
            <button
              onClick={() => setActiveTab('3d')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                activeTab === '3d' 
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>🏗️</span> <span>3D Sandbox</span>
            </button>
            <button
              onClick={() => setActiveTab('scores')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                activeTab === 'scores' 
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>📊</span> <span>Scores & Badges</span>
            </button>
          </div>

          <div className="text-white/50 text-[0.875rem] hidden xl:block">
            Portal Hub • Live Feed Active
          </div>
        </div>
        
        {/* Helper Banner for 3D View */}
        {activeTab === '3d' && (
          <div className="w-full h-[32px] bg-[#0F172A]/70 text-white flex items-center justify-center text-[0.70rem] sm:text-[0.75rem] tracking-[0.05em] uppercase shadow-md">
             Drag with mouse or finger to rotate & explore
          </div>
        )}
      </div>

      {/* View switching logic */}
      <div className="flex-1 w-full h-full relative overflow-y-auto pt-[80px]">
        {activeTab === '3d' ? (
          /* 3D MAP VIEW SCREEN */
          <div className="w-full h-full relative cursor-move">
            {/* Simple Floating progress overlay in bottom center */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-[80%] max-w-sm pointer-events-none mb-[env(safe-area-inset-bottom)]">
               <div className="bg-black/55 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
                  <div className="flex justify-between text-white/95 text-xs font-bold mb-2 tracking-widest uppercase">
                     <span>SandBox Build Progress</span>
                     <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                     <div 
                       className="h-full rounded-full transition-all duration-1000 ease-out"
                       style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: team.color }}
                     />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/40 mt-1.5 font-mono">
                     <span>{currentScore} PTS</span>
                     <span>Target: {eventTargetScore} PTS</span>
                  </div>
               </div>
            </div>

            {!isMounting && (
               <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [8, 5, 8], fov: 45 }}>
                 <color attach="background" args={['#0f172a']} />
                 <fog attach="fog" args={['#0f172a', 10, 30]} />
                 
                 <Environment preset="city" />
                 <ambientLight intensity={0.5} />
                 <directionalLight 
                   position={[10, 10, 5]} 
                   intensity={1.5} 
                   castShadow 
                   shadow-mapSize={[2048, 2048]} 
                 />
                 
                 <Suspense fallback={null}>
                   <ProgressiveStructure progress={progress} teamId={teamId} />
                   
                   {/* 3D Visual Milestone Gems */}
                   <MilestoneGem3D position={[-3, 1, 3]} color="#b45309" progress={progress} targetProgress={25} label="25%" emoji="🥉" />
                   <MilestoneGem3D position={[3, 2.5, -3]} color="#64748b" progress={progress} targetProgress={50} label="50%" emoji="🥈" />
                   <MilestoneGem3D position={[-3.5, 4, -2]} color="#d97706" progress={progress} targetProgress={75} label="75%" emoji="🥇" />
                 </Suspense>

                 {/* Floor Island */}
                 <mesh receiveShadow position={[0, -1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                   <circleGeometry args={[8, 64]} />
                   <meshStandardMaterial color="#1e293b" roughness={0.8} />
                 </mesh>
                 
                 <gridHelper args={[16, 16, '#334155', '#1e293b']} position={[0, -1, 0]} />

                 <ContactShadows position={[0, -1, 0]} opacity={0.6} scale={20} blur={2} far={10} />
                 
                 <OrbitControls 
                   enablePan={false} 
                   minPolarAngle={Math.PI / 6} 
                   maxPolarAngle={Math.PI / 2 - 0.05} 
                   minDistance={5}
                   maxDistance={15}
                   dampingFactor={0.05}
                   makeDefault
                 />
               </Canvas>
            )}
          </div>
        ) : (
          /* COMPLETELY STANDALONE DETAILED SCORES & BADGES HUB */
          <div className="max-w-6xl mx-auto px-6 py-8 text-white">
            {/* Header Area */}
            <div className="mb-8 bg-slate-950/40 border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold font-sansArabic">
                  {team.emojis} {team.nameAr}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Scores & Milestones Portal</h2>
                <p className="text-sm text-slate-400">Detailed overview of challenges, points and unlock statuses.</p>
              </div>

              {/* Progress Panel */}
              <div className="bg-slate-900/90 border border-white/10 px-6 py-5 rounded-2xl w-full md:max-w-xs shadow-inner">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
                  <span>Progress</span>
                  <span className="text-amber-400 font-mono text-sm">{Math.round(progress)}% Completed</span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: team.color }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                  <span>Score: <b className="text-white text-sm">{currentScore}</b> PTS</span>
                  <span>Target: {eventTargetScore} PTS</span>
                </div>
              </div>
            </div>

            {/* Main Double Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
              
              {/* Left Column: Scores Breakdown (7 cols) */}
              <div className="lg:col-span-7 bg-slate-950/60 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Award className="text-amber-400" size={20} />
                    <h3 className="text-lg font-black tracking-tight">Scores Breakdown</h3>
                  </div>
                  <span className="text-xs text-slate-400">Select Day to view details</span>
                </div>

                {/* Day Selection Tabs */}
                <div className="flex gap-2 pb-2 overflow-x-auto border-b border-white/5">
                  {Object.values(days).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setActiveScoreDayId(d.id)}
                      className={`text-xs px-4 py-2 rounded-xl whitespace-nowrap cursor-pointer transition font-bold ${
                        activeScoreDayId === d.id 
                          ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/15' 
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>

                {/* Challenges & Points List */}
                {(() => {
                  const filtered = games.filter(g => g.dayId === activeScoreDayId && g.isTeamScoring !== false);
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center text-slate-500 text-sm py-16">
                        No challenges registered for this day yet.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.map((game) => {
                        const isScoreExpanded = !!expandedScoresGames[game.id];
                        const hasSub = game.subGames && game.subGames.length > 0;
                        
                        // Calculate score
                        let score = 0;
                        let maxVal = 0;
                        if (hasSub) {
                          game.subGames.forEach(s => {
                            score += (team.scores[s.id] || 0);
                            maxVal += s.maxPoints;
                          });
                        } else {
                          score = team.scores[game.id] || 0;
                          maxVal = game.maxPoints;
                        }

                        const pPercent = maxVal > 0 ? (score / maxVal) * 100 : 0;

                        return (
                          <div key={game.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-sm hover:border-white/10 transition-colors">
                            <button
                              onClick={() => setExpandedScoresGames(prev => ({ ...prev, [game.id]: !prev[game.id] }))}
                              className="w-full text-left p-4 hover:bg-white/5 transition flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-sm sm:text-base text-white/95">{game.name}</div>
                                <div className="text-xs text-amber-300 font-semibold mt-1 font-mono">{score} / {maxVal} PTS</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="bg-slate-900 px-3 py-1 rounded-full text-[10px] font-bold font-mono text-slate-400">
                                  {Math.round(pPercent)}%
                                </span>
                                <div className="text-white/40 text-xs">
                                  {isScoreExpanded ? '▲' : '▼'}
                                </div>
                              </div>
                            </button>

                            {isScoreExpanded && (
                              <div className="p-4 bg-black/40 border-t border-white/5 space-y-4">
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                    <span>Challenge Progress</span>
                                    <span>{Math.round(pPercent)}%</span>
                                  </div>
                                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${pPercent}%`, backgroundColor: team.color }}
                                    />
                                  </div>
                                </div>

                                {hasSub && (
                                  <div className="space-y-3 pt-2 border-t border-white/5">
                                    <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Games breakdown</div>
                                    <div className="space-y-2">
                                      {game.subGames.map(sg => {
                                        const sgVal = team.scores[sg.id] || 0;
                                        return (
                                          <div key={sg.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl text-xs border border-white/5">
                                            <span className="text-slate-300 font-semibold">{sg.name}</span>
                                            <span className="font-mono text-amber-300 font-extrabold">{sgVal} / {sg.maxPoints} pts</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Milestones Achievements (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950/60 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-amber-400" size={20} />
                    <h3 className="text-lg font-black tracking-tight">Milestone Badges</h3>
                  </div>
                  <span className="bg-white/15 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {unlockedMilestones.length} / 4
                  </span>
                </div>

                {/* Milestone unlocked banner alert */}
                {unlockedMilestones.length > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-3">
                    <Sparkles size={18} className="shrink-0 animate-pulse" />
                    <div>
                      <div className="font-bold text-sm">Amazing work!</div>
                      <div className="opacity-80">You've unlocked milestones in your construction journey!</div>
                    </div>
                  </div>
                )}

                {/* Milestone cards list */}
                <div className="space-y-3">
                  {MILESTONES.map((m) => {
                    const isUnlocked = progress >= m.percent;
                    return (
                      <div 
                        key={m.percent}
                        className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                          isUnlocked 
                            ? 'bg-white/5 border-white/10 shadow-lg' 
                            : 'bg-black/30 border-slate-900 opacity-40'
                        }`}
                      >
                        {/* Emoji visual badge */}
                        <div 
                          className="flex items-center justify-center w-12 h-12 text-2xl rounded-2xl shrink-0"
                          style={{ 
                            backgroundColor: isUnlocked ? `${m.color}20` : 'rgba(255,255,255,0.02)',
                            boxShadow: isUnlocked ? `0 0 15px ${m.glowColor}` : 'none'
                          }}
                        >
                          {isUnlocked ? m.emoji : <Lock size={16} className="text-slate-600" />}
                        </div>

                        {/* Title and descriptions */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-sm font-black truncate ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                              {m.title}
                            </h4>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                              isUnlocked 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                : 'bg-white/5 text-slate-500'
                            }`}>
                              {isUnlocked ? 'Unlocked' : 'Locked'}
                            </span>
                          </div>
                          
                          <p className={`text-xs mt-1 font-semibold ${isUnlocked ? 'text-slate-400 font-mono' : 'text-slate-600'}`}>
                            Goal: {m.percent}% Progress
                          </p>

                          <p className={`text-[11px] mt-1.5 leading-relaxed ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                            {m.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
