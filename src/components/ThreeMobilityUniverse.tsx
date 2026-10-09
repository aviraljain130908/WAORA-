import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TRANSIT_NODES, TRANSIT_LINES } from '../data/transitNetwork';
import { AuraState, WeatherCondition } from '../types/wayora';
import { Camera, Eye, Compass } from 'lucide-react';

interface ThreeMobilityUniverseProps {
  auraState: AuraState;
  selectedRouteId?: string;
  weather: WeatherCondition;
  onSelectNode?: (nodeId: string) => void;
  interactive?: boolean;
}

export type CameraViewMode = 'orbit' | 'cockpit' | 'top_down';

export const ThreeMobilityUniverse: React.FC<ThreeMobilityUniverseProps> = ({
  auraState,
  weather,
  onSelectNode,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CameraViewMode>('orbit');
  const viewModeRef = useRef<CameraViewMode>('orbit');

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050b14, 0.0032);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1200);
    camera.position.set(0, 160, 280);
    camera.lookAt(0, 15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // 2. Lighting (Warm Key + Electric Teal Rim)
    const ambientLight = new THREE.AmbientLight(0x0e2a47, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    dirLight.position.set(120, 220, 90);
    scene.add(dirLight);

    const indiaAmberLight = new THREE.DirectionalLight(0xf59e0b, 1.2);
    indiaAmberLight.position.set(-100, 150, -80);
    scene.add(indiaAmberLight);

    const auraLight = new THREE.PointLight(0x06b6d4, 3, 200);
    auraLight.position.set(0, 45, 0);
    scene.add(auraLight);

    // 3. Ground Grid
    const gridHelper = new THREE.GridHelper(360, 36, 0x0284c7, 0x0f2744);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // 4. Procedural Cityscape with Indian landmark monuments
    const buildingsGroup = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x091e36,
      roughness: 0.25,
      metalness: 0.75,
      transparent: true,
      opacity: 0.75,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.45 });

    for (let i = -6; i <= 6; i++) {
      for (let j = -6; j <= 6; j++) {
        if (Math.abs(i) < 2 && Math.abs(j) < 2) continue;
        const bHeight = 10 + ((Math.sin(i * 12.3 + j * 45.7) + 1) / 2) * 44;
        const building = new THREE.Mesh(boxGeo, buildingMat);
        building.scale.set(15, bHeight, 15);
        building.position.set(i * 24, bHeight / 2, j * 24);
        buildingsGroup.add(building);

        const edges = new THREE.EdgesGeometry(boxGeo);
        const line = new THREE.LineSegments(edges, edgeMat);
        line.scale.set(15, bHeight, 15);
        line.position.copy(building.position);
        buildingsGroup.add(line);
      }
    }

    // Iconic Lotus Temple geometric dome in 3D
    const lotusGeo = new THREE.ConeGeometry(18, 22, 12);
    const lotusMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.2,
      metalness: 0.5,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });
    const lotusMesh = new THREE.Mesh(lotusGeo, lotusMat);
    lotusMesh.position.set(110, 11, -90);
    buildingsGroup.add(lotusMesh);

    scene.add(buildingsGroup);

    // 5. 3D Transit Nodes (Delhi & Indian Hubs)
    const nodeMeshes: { id: string; mesh: THREE.Mesh; pos: THREE.Vector3 }[] = [];
    const nodeGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(4, 24, 24);

    TRANSIT_NODES.forEach((n) => {
      const x3d = ((n.x - 500) / 500) * 140;
      const z3d = ((n.y - 450) / 450) * 120;
      const y3d = 8;

      const nMat = new THREE.MeshStandardMaterial({
        color: n.id === 'DEL-01' ? 0x0284c7 : n.id === 'DEL-06' ? 0xf59e0b : (n.lines.includes('DMRC-YELLOW') ? 0xeab308 : 0x06b6d4),
        emissive: n.id === 'DEL-01' ? 0x0284c7 : 0x06b6d4,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9,
      });

      const mesh = new THREE.Mesh(nodeGeo, nMat);
      mesh.position.set(x3d, y3d, z3d);
      mesh.userData = { id: n.id, name: n.name, hindiName: n.hindiName };
      nodeGroup.add(mesh);
      nodeMeshes.push({ id: n.id, mesh, pos: new THREE.Vector3(x3d, y3d, z3d) });

      // Pulsing concentric beacon rings
      const ringGeo = new THREE.RingGeometry(5, 7.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x3d, 1.5, z3d);
      nodeGroup.add(ring);
    });
    scene.add(nodeGroup);

    // 6. 3D Transit Route Splines & Specialized Vehicles (Metro, E-Auto, Vande Bharat)
    const routeCurves: {
      curve: THREE.CatmullRomCurve3;
      color: string;
      vehicles: { mesh: THREE.Group; t: number; type: string }[];
    }[] = [];

    TRANSIT_LINES.forEach((line) => {
      const linePoints: THREE.Vector3[] = [];
      line.stops.forEach((stopId) => {
        const found = nodeMeshes.find((m) => m.id === stopId);
        if (found) {
          linePoints.push(new THREE.Vector3(found.pos.x, found.pos.y + 1, found.pos.z));
        }
      });

      if (linePoints.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(linePoints);
        const tubeGeo = new THREE.TubeGeometry(curve, 54, 1.1, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(line.color),
          emissive: new THREE.Color(line.color),
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.85,
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tube);

        // Assemble 3D vehicle groups
        const vehicles: { mesh: THREE.Group; t: number; type: string }[] = [];
        const vCount = Math.min(2, line.stops.length);

        for (let v = 0; v < vCount; v++) {
          const vGroup = new THREE.Group();

          if (line.id === 'E-AUTO-FEEDER') {
            // 3D E-Auto model (aerodynamic pod with illuminated headlight)
            const autoBody = new THREE.Mesh(
              new THREE.BoxGeometry(2.8, 2.2, 3.8),
              new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x06b6d4, emissiveIntensity: 0.5 })
            );
            const headlight = new THREE.Mesh(
              new THREE.SphereGeometry(0.5, 8, 8),
              new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            headlight.position.set(0, 0, 1.9);
            vGroup.add(autoBody);
            vGroup.add(headlight);
          } else if (line.id === 'VANDE-BHARAT') {
            // 3D Vande Bharat aerodynamic nose & coach
            const trainBody = new THREE.Mesh(
              new THREE.BoxGeometry(2.4, 2.4, 8),
              new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf97316, emissiveIntensity: 0.4 })
            );
            vGroup.add(trainBody);
          } else {
            // 3D Metro Train Coach
            const metroBody = new THREE.Mesh(
              new THREE.BoxGeometry(2.2, 2.2, 6),
              new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 0.6 })
            );
            vGroup.add(metroBody);
          }

          scene.add(vGroup);
          vehicles.push({ mesh: vGroup, t: (v / vCount), type: line.id });
        }

        routeCurves.push({ curve, color: line.color, vehicles });
      }
    });

    // 7. 3D Aura Intelligence Core
    const auraGroup = new THREE.Group();
    auraGroup.position.set(0, 38, 0);

    const auraCoreGeo = new THREE.IcosahedronGeometry(7.5, 2);
    const auraCoreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.95,
      wireframe: true,
    });
    const auraCore = new THREE.Mesh(auraCoreGeo, auraCoreMat);
    auraGroup.add(auraCore);

    const orbitGeo = new THREE.TorusGeometry(13, 0.4, 12, 64);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const orbitRing1 = new THREE.Mesh(orbitGeo, orbitMat);
    const orbitRing2 = new THREE.Mesh(orbitGeo, orbitMat);
    orbitRing2.rotation.x = Math.PI / 3;
    auraGroup.add(orbitRing1);
    auraGroup.add(orbitRing2);
    scene.add(auraGroup);

    // 8. Monsoon Rain / Ambient Star Particles
    const particleCount = weather.condition.includes('rain') ? 700 : 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);

    for (let p = 0; p < particleCount; p++) {
      positions[p * 3] = (Math.random() - 0.5) * 360;
      positions[p * 3 + 1] = Math.random() * 180;
      positions[p * 3 + 2] = (Math.random() - 0.5) * 360;
      velocities[p] = weather.condition.includes('rain') ? 2.2 + Math.random() * 2.5 : 0.18;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: weather.condition.includes('rain') ? 0x7dd3fc : 0x38bdf8,
      size: weather.condition.includes('rain') ? 1.5 : 1.2,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 9. Pointer Parallax & Interaction
    let targetX = 0;
    let targetY = 160;
    let targetZ = 280;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isDragging && interactive) {
        const deltaX = e.clientX - prevMouseX;
        rotY += deltaX * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        targetX = mouseX * 50;
        targetY = 160 + mouseY * 25;
      }

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((m) => m.mesh));
      if (intersects.length > 0) {
        setHoveredNode(intersects[0].object.userData.name);
        container.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        container.style.cursor = 'default';
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = (e: MouseEvent) => {
      isDragging = false;
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((m) => m.mesh));
      if (intersects.length > 0 && onSelectNode) {
        onSelectNode(intersects[0].object.userData.id);
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // 10. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Camera transitions based on viewModeRef
      if (viewModeRef.current === 'top_down') {
        targetX = 0;
        targetY = 260;
        targetZ = 20;
      } else if (viewModeRef.current === 'cockpit') {
        targetX = Math.sin(elapsed * 0.4) * 60;
        targetY = 40;
        targetZ = Math.cos(elapsed * 0.4) * 60;
      } else {
        // Orbit mode default
        targetY = 160;
        targetZ = 280;
      }

      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
      camera.position.z += (targetZ - camera.position.z) * 0.04;
      if (rotY !== 0) {
        scene.rotation.y += (rotY - scene.rotation.y) * 0.08;
      }
      camera.lookAt(0, 15, 0);

      // Aura core rotation
      auraGroup.rotation.y += 0.015;
      auraGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.2;
      orbitRing1.rotation.z += 0.02;
      orbitRing2.rotation.y += 0.025;

      if (auraState === 'listening') {
        auraCoreMat.color.setHex(0x10b981);
        auraLight.color.setHex(0x10b981);
      } else if (auraState === 'processing') {
        auraCoreMat.color.setHex(0xa855f7);
        auraLight.color.setHex(0xa855f7);
      } else {
        auraCoreMat.color.setHex(0x06b6d4);
        auraLight.color.setHex(0x06b6d4);
      }

      // Vehicles traversing transit splines
      routeCurves.forEach((rc) => {
        rc.vehicles.forEach((v) => {
          v.t = (v.t + delta * 0.065) % 1.0;
          const pos = rc.curve.getPointAt(v.t);
          v.mesh.position.copy(pos);
          const tangent = rc.curve.getTangentAt(v.t);
          v.mesh.lookAt(pos.clone().add(tangent));
        });
      });

      // Weather particles
      const posArray = particleGeo.attributes.position.array as Float32Array;
      for (let p = 0; p < particleCount; p++) {
        posArray[p * 3 + 1] -= velocities[p];
        if (posArray[p * 3 + 1] < 0) {
          posArray[p * 3 + 1] = 180;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [auraState, weather, interactive, onSelectNode]);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full min-h-[440px] flex items-center justify-center bg-gradient-to-b from-[#091528] to-[#050B14] border border-cyan-950/40 rounded-xl p-8 text-center">
        <div>
          <div className="w-12 h-12 mx-auto rounded-full bg-cyan-900/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3">
            3D
          </div>
          <h3 className="text-sm font-semibold text-slate-200">WAYORA Spatial India Transit Core</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            High-performance 2D cartographic fallback active for your device environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[460px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#061122]/90 via-[#050B14] to-[#03070E] border border-cyan-900/30">
      <div ref={containerRef} className="w-full h-full min-h-[460px]" />

      {/* 3D Scene Controls HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-cyan-400 font-bold">3D Spatial Universe</span>
          <span aria-hidden="true">·</span>
          <span>India Metro & E-Auto Network</span>
        </div>

        {/* 3D Camera Perspective Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('orbit')}
            className={`px-2 py-1 rounded transition-colors ${viewMode === 'orbit' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
            title="3D Orbit View"
          >
            Orbit
          </button>
          <button
            onClick={() => setViewMode('cockpit')}
            className={`px-2 py-1 rounded transition-colors ${viewMode === 'cockpit' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
            title="3D Cockpit Flyby"
          >
            Cockpit
          </button>
          <button
            onClick={() => setViewMode('top_down')}
            className={`px-2 py-1 rounded transition-colors ${viewMode === 'top_down' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
            title="3D Top-Down View"
          >
            Top-Down
          </button>
        </div>
      </div>

      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-xs text-cyan-200 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-cyan-500/50 shadow-xl shadow-cyan-950/60">
          <span className="text-slate-400 mr-1.5">Station:</span>
          <span className="font-bold text-white">{hoveredNode}</span>
        </div>
      )}
    </div>
  );
};
