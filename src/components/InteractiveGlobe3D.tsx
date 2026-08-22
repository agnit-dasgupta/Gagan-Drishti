import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SatelliteState, ObserverLocation, SatellitePreset } from '../types';
import { calculateSatelliteState, generateGroundTrack, SATELLITE_PRESETS, DEFAULT_OBSERVER } from '../utils/satelliteCalc';
import {
  Rotate3d,
  Layers,
  Eye,
  Maximize2,
  Minimize2,
  Compass,
  Radio,
  Sparkles,
  Zap,
  Globe as GlobeIcon
} from 'lucide-react';

interface InteractiveGlobe3DProps {
  currentPreset?: SatellitePreset;
  activeTle1?: string;
  activeTle2?: string;
  satName?: string;
  observer?: ObserverLocation;
  simulationTime?: Date;
  onSelectSatellite?: (preset: SatellitePreset) => void;
  onLaunchDashboard?: () => void;
  compact?: boolean;
}

export default function InteractiveGlobe3D({
  currentPreset,
  activeTle1,
  activeTle2,
  satName = 'AstroSat',
  observer,
  simulationTime,
  onSelectSatellite,
  onLaunchDashboard,
  compact = false
}: InteractiveGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const satelliteMeshRef = useRef<THREE.Group | null>(null);
  const orbitLineRef = useRef<THREE.Line | null>(null);
  const groundStationMeshRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const beamMeshRef = useRef<THREE.Mesh | null>(null);

  // Active satellite TLE strings
  const currentTle1 = activeTle1 || currentPreset?.line1 || SATELLITE_PRESETS[0].line1;
  const currentTle2 = activeTle2 || currentPreset?.line2 || SATELLITE_PRESETS[0].line2;
  const activeObserver = observer || DEFAULT_OBSERVER;

  // Interaction & View state
  const [cameraMode, setCameraMode] = useState<'orbit' | 'satellite' | 'station'>('orbit');
  const [showOrbit, setShowOrbit] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showSensorCone, setShowSensorCone] = useState<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Synchronous telemetry for HUD display without setState loops
  const simTimeMs = simulationTime ? simulationTime.getTime() : null;
  const currentSatState = useMemo<SatelliteState | null>(() => {
    try {
      const timeToUse = simulationTime || new Date();
      return calculateSatelliteState(currentTle1, currentTle2, timeToUse, activeObserver);
    } catch {
      return null;
    }
  }, [currentTle1, currentTle2, simTimeMs, activeObserver.lat, activeObserver.lon, activeObserver.alt]);

  // Mouse interaction state for manual orbital camera rotation
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 220 });

  // Convert Geodetic (Lat, Lon, Alt in km) to 3D Cartesian coordinates (Earth Radius = 100 units)
  const latLonAltToVector3 = (lat: number, lon: number, altKm: number = 0, earthRadiusUnits = 100) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const r = earthRadiusUnits + (altKm / 6378.137) * 25; // Scale altitude for visual aesthetic

    const x = -r * Math.sin(phi) * Math.cos(theta);
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  };

  // Build Procedural Earth Textures (Continent canvas + Bump + Night lights)
  const createProceduralEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep Ocean Background
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#041324');
    oceanGrad.addColorStop(0.5, '#020b18');
    oceanGrad.addColorStop(1, '#041324');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Latitude / Longitude Subtle Cyber Grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 1;
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Equator Line Highlight
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Continent Polygons in high-tech cyber style
    const continents = [
      // North America
      [[-168, 65], [-120, 70], [-80, 75], [-60, 60], [-50, 45], [-75, 25], [-80, 9], [-99, 16], [-115, 30], [-125, 48], [-168, 65]],
      // South America
      [[-80, 9], [-35, -5], [-40, -20], [-70, -55], [-75, -45], [-80, -20], [-80, 9]],
      // Africa
      [[-17, 32], [30, 31], [33, 27], [50, 12], [40, -20], [20, -34], [10, -10], [-10, 5], [-17, 15], [-17, 32]],
      // Eurasia
      [[30, 31], [35, 40], [25, 40], [-10, 36], [-10, 50], [10, 60], [20, 70], [40, 75], [100, 78], [170, 70], [180, 65], [180, 35], [130, 35], [120, 20], [110, 10], [95, 10], [75, 10], [60, 25], [45, 15], [30, 31]],
      // India Highlight
      [[70, 24], [78, 8], [88, 22], [88, 28], [75, 35], [70, 24]],
      // Australia
      [[113, -25], [113, -35], [140, -37], [150, -33], [143, -15], [130, -12], [113, -25]],
      // Antarctica
      [[-180, -75], [180, -75], [180, -85], [-180, -85], [-180, -75]]
    ];

    continents.forEach((poly, index) => {
      ctx.beginPath();
      poly.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * canvas.width;
        const y = ((90 - lat) / 180) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      // India gets special glowing emerald/cyan accent
      if (index === 4) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
      } else {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 1.5;
      }
      ctx.fill();
      ctx.stroke();

      // Add high-tech city lights dots on continents
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let j = 0; j < 15; j++) {
        const p1 = poly[j % poly.length];
        const p2 = poly[(j + 1) % poly.length];
        const dotLon = (p1[0] + p2[0]) / 2 + (Math.sin(j * 99) * 4);
        const dotLat = (p1[1] + p2[1]) / 2 + (Math.cos(j * 99) * 4);
        const dotX = ((dotLon + 180) / 360) * canvas.width;
        const dotY = ((90 - dotLat) / 180) * canvas.height;
        ctx.fillRect(dotX, dotY, 2, 2);
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Build a 3D Satellite Model (Bus, dual solar panels, antenna dish, optics payload)
  const createSatelliteModel = () => {
    const group = new THREE.Group();

    // Main Bus (Cube/Hexagon body in metallic gold/carbon fiber)
    const busGeo = new THREE.BoxGeometry(3, 4, 3);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Gold foil thermal blanket
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x422006,
      emissiveIntensity: 0.2
    });
    const bus = new THREE.Mesh(busGeo, busMat);
    group.add(bus);

    // Optical Lens / Sensor Payload (Front cylinder)
    const lensGeo = new THREE.CylinderGeometry(0.8, 0.9, 1.5, 16);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, -2.2, 0);
    group.add(lens);

    // Parabolic High-Gain Antenna Dish
    const dishGeo = new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 2.5, 0);
    dish.rotation.x = Math.PI;
    group.add(dish);

    // Antenna Feed Horn
    const feedGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const feedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const feed = new THREE.Mesh(feedGeo, feedMat);
    feed.position.set(0, 3, 0);
    group.add(feed);

    // Solar Panel Arrays (Left & Right Wings with Blue Cells and Gold Trusses)
    const panelGeo = new THREE.BoxGeometry(6, 0.1, 2.5);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Dark blue solar cell
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x1e40af,
      emissiveIntensity: 0.3
    });

    // Left Wing
    const leftPanel = new THREE.Mesh(panelGeo, panelMat);
    leftPanel.position.set(-4.8, 0, 0);
    group.add(leftPanel);

    // Right Wing
    const rightPanel = new THREE.Mesh(panelGeo, panelMat);
    rightPanel.position.set(4.8, 0, 0);
    group.add(rightPanel);

    // Solar Panel Boom Connections
    const boomGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    const boomMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const leftBoom = new THREE.Mesh(boomGeo, boomMat);
    leftBoom.rotation.z = Math.PI / 2;
    leftBoom.position.set(-2.5, 0, 0);
    group.add(leftBoom);

    const rightBoom = new THREE.Mesh(boomGeo, boomMat);
    rightBoom.rotation.z = Math.PI / 2;
    rightBoom.position.set(2.5, 0, 0);
    group.add(rightBoom);

    // Thruster Nozzle at Back
    const thrusterGeo = new THREE.ConeGeometry(0.5, 1, 12);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
    const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    thruster.position.set(0, 0, -1.8);
    thruster.rotation.x = -Math.PI / 2;
    group.add(thruster);

    // Thruster Plasma Glow Beacon
    const glowGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, 0, -2.4);
    group.add(glow);

    // Scale group to appropriate size relative to 100-radius Earth
    group.scale.set(0.9, 0.9, 0.9);
    return group;
  };

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    cameraRef.current = camera;
    camera.position.set(160, 100, 160);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0x0c213b, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(300, 150, 200);
    scene.add(sunLight);

    const cyanFill = new THREE.PointLight(0x06b6d4, 1.8, 500);
    cyanFill.position.set(-200, -100, -150);
    scene.add(cyanFill);

    // Starfield Particle Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 600 + Math.random() * 400;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const sinPhi = Math.sin(phi);

      starPos[i] = radius * sinPhi * Math.cos(theta);
      starPos[i + 1] = radius * sinPhi * Math.sin(theta);
      starPos[i + 2] = radius * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice > 0.8) {
        // Cyan star
        starColors[i] = 0.2; starColors[i + 1] = 0.8; starColors[i + 2] = 1.0;
      } else if (colorChoice > 0.6) {
        // Emerald star
        starColors[i] = 0.2; starColors[i + 1] = 0.9; starColors[i + 2] = 0.6;
      } else {
        // White/Blue star
        starColors[i] = 0.9; starColors[i + 1] = 0.95; starColors[i + 2] = 1.0;
      }
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starsGeo, starMat);
    scene.add(starField);

    // 3D Earth Globe Sphere
    const earthRadius = 100;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTexture = createProceduralEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.2,
      bumpScale: 1.5
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMeshRef.current = earthMesh;
    scene.add(earthMesh);

    // Atmosphere Glowing Rim Halo
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.035, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.75 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.02, 0.75, 0.95, 1.0) * intensity * 1.8;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // Clouds / Upper Ionosphere Layer
    const cloudsGeo = new THREE.SphereGeometry(earthRadius * 1.015, 48, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.12,
      wireframe: true
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMeshRef.current = cloudsMesh;
    scene.add(cloudsMesh);

    // Ground Stations Mesh Group (ISRO Stations)
    const stationsGroup = new THREE.Group();
    groundStationMeshRef.current = stationsGroup;
    scene.add(stationsGroup);

    const isroStations = [
      { name: 'ISTRAC Bengaluru', lat: 13.03, lon: 77.51 },
      { name: 'SDSC Sriharikota', lat: 13.72, lon: 80.23 },
      { name: 'SAC Ahmedabad', lat: 23.03, lon: 72.51 },
      { name: 'Bharati Antarctica', lat: -69.41, lon: 76.19 },
      { name: 'VSSC Trivandrum', lat: 8.53, lon: 76.87 }
    ];

    isroStations.forEach((st) => {
      const pos = latLonAltToVector3(st.lat, st.lon, 0, earthRadius);
      // Pin Pole
      const pinGeo = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      stationsGroup.add(pin);

      // Glowing Ground Radar Dish Dot
      const dotGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos.clone().add(pos.clone().normalize().multiplyScalar(2)));
      stationsGroup.add(dot);
    });

    // 3D Satellite Model
    const satModel = createSatelliteModel();
    satelliteMeshRef.current = satModel;
    scene.add(satModel);

    // Sensor Cone Beam (Cone projecting from satellite down to Earth)
    const coneGeo = new THREE.ConeGeometry(12, 40, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
      side: THREE.DoubleSide
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, -20, 0);
    satModel.add(coneMesh);
    beamMeshRef.current = coneMesh;

    // Mouse Listeners for Orbit Camera Rotation
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraRotationRef.current.theta -= deltaX * 0.005;
      cameraRotationRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotationRef.current.phi - deltaY * 0.005));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRotationRef.current.radius = Math.max(130, Math.min(450, cameraRotationRef.current.radius + e.deltaY * 0.2));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Window Resize handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Earth slow spin if enabled
      if (earthMeshRef.current && isRotating && cameraMode === 'orbit') {
        earthMeshRef.current.rotation.y += delta * 0.03;
      }
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += delta * 0.04;
      }

      // Update Camera based on Orbit controls
      if (cameraRef.current) {
        if (cameraMode === 'orbit') {
          const { theta, phi, radius } = cameraRotationRef.current;
          cameraRef.current.position.x = radius * Math.sin(phi) * Math.cos(theta);
          cameraRef.current.position.y = radius * Math.cos(phi);
          cameraRef.current.position.z = radius * Math.sin(phi) * Math.sin(theta);
          cameraRef.current.lookAt(0, 0, 0);
        } else if (cameraMode === 'satellite' && satelliteMeshRef.current) {
          const satPos = satelliteMeshRef.current.position;
          const satNormal = satPos.clone().normalize();
          cameraRef.current.position.copy(satPos.clone().add(satNormal.multiplyScalar(35)).add(new THREE.Vector3(10, 10, 10)));
          cameraRef.current.lookAt(satPos);
        } else if (cameraMode === 'station') {
          // Look up from Bengaluru ISTRAC
          const stationPos = latLonAltToVector3(13.03, 77.51, 0, earthRadius);
          cameraRef.current.position.copy(stationPos.clone().multiplyScalar(1.05));
          if (satelliteMeshRef.current) {
            cameraRef.current.lookAt(satelliteMeshRef.current.position);
          } else {
            cameraRef.current.lookAt(stationPos.clone().multiplyScalar(2));
          }
        }
      }

      // Beam pulsing animation
      if (beamMeshRef.current) {
        beamMeshRef.current.rotation.y = elapsedTime * 2;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update Dynamic Orbit Trajectory Line and Satellite Mesh in Three.js
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    try {
      const effTime = simulationTime || new Date();

      // 1. Calculate Real Satellite Position in 3D
      const state = calculateSatelliteState(currentTle1, currentTle2, effTime, activeObserver);
      if (state && satelliteMeshRef.current) {
        const satPos = latLonAltToVector3(state.lat, state.lon, state.alt, 100);
        satelliteMeshRef.current.position.copy(satPos);

        // Align satellite attitude towards Earth center (Nadir)
        satelliteMeshRef.current.lookAt(0, 0, 0);
        satelliteMeshRef.current.rotateX(Math.PI / 2);
      }

      // 2. Build 3D Elliptical Orbit Path Spline
      if (orbitLineRef.current) {
        scene.remove(orbitLineRef.current);
        orbitLineRef.current.geometry.dispose();
      }

      if (showOrbit) {
        const orbitPoints: THREE.Vector3[] = [];
        const orbitSamples = 120;
        const orbitPeriodMinutes = 95; // Approximate LEO period
        const stepMs = (orbitPeriodMinutes * 60 * 1000) / orbitSamples;

        for (let i = 0; i <= orbitSamples; i++) {
          const sampleTime = new Date(effTime.getTime() + (i - orbitSamples / 2) * stepMs);
          const sampleState = calculateSatelliteState(currentTle1, currentTle2, sampleTime, activeObserver);
          if (sampleState) {
            orbitPoints.push(latLonAltToVector3(sampleState.lat, sampleState.lon, sampleState.alt, 100));
          }
        }

        if (orbitPoints.length > 5) {
          const orbitCurve = new THREE.CatmullRomCurve3(orbitPoints);
          const points = orbitCurve.getPoints(200);
          const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
          const orbitMat = new THREE.LineBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.65,
            linewidth: 2
          });
          const line = new THREE.Line(orbitGeo, orbitMat);
          orbitLineRef.current = line;
          scene.add(line);
        }
      }
    } catch (err) {
      console.error('Error updating 3D orbit trajectory', err);
    }
  }, [currentTle1, currentTle2, simTimeMs, activeObserver.lat, activeObserver.lon, activeObserver.alt, showOrbit]);

  // Handle visibility toggles
  useEffect(() => {
    if (groundStationMeshRef.current) {
      groundStationMeshRef.current.visible = showStations;
    }
    if (beamMeshRef.current) {
      beamMeshRef.current.visible = showSensorCone;
    }
  }, [showStations, showSensorCone]);

  return (
    <div
      className={`relative w-full ${
        compact ? 'h-[360px] md:h-[420px]' : 'h-[500px] lg:h-[620px]'
      } rounded-2xl overflow-hidden bg-gradient-to-b from-[#060813] via-[#02040a] to-[#050914] border border-cyan-900/40 shadow-[0_0_50px_rgba(6,182,212,0.12)] group`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left HUD Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-[#0a0f1d]/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-cyan-500/30 text-cyan-300 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-white">
            {satName || currentPreset?.name || 'AstroSat'}
          </span>
          <span className="text-[10px] bg-cyan-950/80 px-2 py-0.5 rounded text-cyan-400 font-mono border border-cyan-800/60">
            3D ORBIT TRACKER
          </span>
        </div>

        {currentSatState && (
          <div className="bg-[#050814]/80 backdrop-blur-md px-3 py-2 rounded-lg border border-cyan-950/60 text-xs font-mono space-y-1 text-slate-300">
            <div className="flex justify-between gap-4 text-[11px]">
              <span className="text-cyan-600 font-bold">ALTITUDE</span>
              <span className="text-emerald-400 font-bold">{Math.round(currentSatState.alt)} km</span>
            </div>
            <div className="flex justify-between gap-4 text-[11px]">
              <span className="text-cyan-600 font-bold">VELOCITY</span>
              <span className="text-cyan-300 font-bold">{currentSatState.speed.toFixed(2)} km/s</span>
            </div>
            <div className="flex justify-between gap-4 text-[11px]">
              <span className="text-cyan-600 font-bold">SUBPOINT</span>
              <span className="text-slate-200">
                {currentSatState.lat.toFixed(1)}°, {currentSatState.lon.toFixed(1)}°
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="bg-[#080d1e]/90 backdrop-blur-md p-1 rounded-lg border border-cyan-900/50 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setCameraMode('orbit')}
            title="Global Orbit Camera"
            className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition-all ${
              cameraMode === 'orbit'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-cyan-400 hover:bg-cyan-950/60'
            }`}
          >
            GLOBAL
          </button>
          <button
            onClick={() => setCameraMode('satellite')}
            title="Focus Satellite POV"
            className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition-all ${
              cameraMode === 'satellite'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-cyan-400 hover:bg-cyan-950/60'
            }`}
          >
            SPACECRAFT
          </button>
          <button
            onClick={() => setCameraMode('station')}
            title="Ground Station Point of View (Bengaluru)"
            className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition-all ${
              cameraMode === 'station'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-cyan-400 hover:bg-cyan-950/60'
            }`}
          >
            GROUND STA
          </button>
        </div>

        <button
          onClick={() => setIsRotating(!isRotating)}
          title={isRotating ? 'Pause Earth Auto-spin' : 'Resume Earth Auto-spin'}
          className={`p-2 rounded-lg border backdrop-blur-md text-xs font-mono transition-all ${
            isRotating
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/70 border-slate-700 text-slate-400'
          }`}
        >
          <Rotate3d className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
        </button>
      </div>

      {/* Bottom Floating Navigation Toolbar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 bg-[#060917]/90 backdrop-blur-md p-1.5 rounded-xl border border-cyan-900/50 shadow-xl">
          <button
            onClick={() => setShowOrbit(!showOrbit)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all ${
              showOrbit ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            ORBIT PATH
          </button>
          <button
            onClick={() => setShowStations(!showStations)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all ${
              showStations ? 'bg-cyan-950 text-emerald-300 border border-emerald-600/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            ISRO STATIONS
          </button>
          <button
            onClick={() => setShowSensorCone(!showSensorCone)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all ${
              showSensorCone ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            SENSOR CONE
          </button>
        </div>

        {/* Action Button: Jump to Live Mission Command */}
        {onLaunchDashboard && (
          <button
            onClick={onLaunchDashboard}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold font-mono text-xs px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            LAUNCH FULL COMMAND CONSOLE
          </button>
        )}
      </div>

      {/* Subtle Bottom Instruction Tip */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] font-mono text-cyan-600/70 tracking-widest uppercase bg-[#050814]/60 px-3 py-1 rounded-full border border-cyan-950/40 backdrop-blur-xs">
        DRAG TO ROTATE 3D GLOBE // SCROLL TO ZOOM
      </div>
    </div>
  );
}
