import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  speed: number;
}

interface WindParticlesProps {
  windData: Array<{ lat: number; lon: number; speed: number; direction: number }>;
  bounds: { north: number; south: number; east: number; west: number };
  zoom: number;
  opacity: number;
  viewMode?: '2d' | '3d';
}

export const WindParticles = ({ windData, bounds, zoom, opacity, viewMode = '2d' }: WindParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || windData.length === 0) {
      console.log('WindParticles: canvas or windData not ready', { canvas: !!canvas, windDataLength: windData.length });
      return;
    }
    
    console.log('WindParticles: Starting animation with', windData.length, 'wind points');

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Convert lat/lon to canvas coordinates
    const latLonToXY = (lat: number, lon: number) => {
      const x = ((lon - bounds.west) / (bounds.east - bounds.west)) * canvas.width;
      const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * canvas.height;
      return { x, y };
    };

    // Get wind vector at position with bilinear interpolation for smooth curves
    const getWindAtPosition = (x: number, y: number) => {
      // Convert x,y back to lat/lon
      const lon = bounds.west + (x / canvas.width) * (bounds.east - bounds.west);
      const lat = bounds.north - (y / canvas.height) * (bounds.north - bounds.south);

      // Find 4 nearest points for bilinear interpolation
      const distances = windData.map(point => ({
        point,
        dist: Math.sqrt(Math.pow(point.lat - lat, 2) + Math.pow(point.lon - lon, 2))
      })).sort((a, b) => a.dist - b.dist);

      // Use inverse distance weighting for smooth interpolation
      const nearestPoints = distances.slice(0, 4);
      let totalWeight = 0;
      let weightedVx = 0;
      let weightedVy = 0;
      let weightedSpeed = 0;

      for (const { point, dist } of nearestPoints) {
        // Avoid division by zero
        const weight = dist === 0 ? 1 : 1 / (dist + 0.001);
        totalWeight += weight;

        // Convert wind direction to vector components
        const angleRad = ((point.direction + 180) % 360) * Math.PI / 180;
        const speedFactor = Math.min(point.speed, 20) / 20;
        
        weightedVx += Math.cos(angleRad) * speedFactor * weight;
        weightedVy += Math.sin(angleRad) * speedFactor * weight;
        weightedSpeed += point.speed * weight;
      }

      // Normalize by total weight
      return {
        vx: weightedVx / totalWeight,
        vy: weightedVy / totalWeight,
        speed: weightedSpeed / totalWeight
      };
    };

    // Initialize particles - more visible at all zoom levels
    const initializeParticles = () => {
      const baseCount = Math.floor((canvas.width * canvas.height) / 15000);
      const particleCount = Math.max(300, baseCount * Math.pow(1.5, zoom - 1));
      console.log('Creating', particleCount, 'particles for zoom level', zoom);
      particlesRef.current = [];
      
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const wind = getWindAtPosition(x, y);
        
        particlesRef.current.push({
          x,
          y,
          vx: wind.vx,
          vy: wind.vy,
          age: Math.random() * 150,
          maxAge: 150 + Math.random() * 150, // Much longer life (150-300 frames)
          speed: wind.speed
        });
      }
    };
    
    // Initialize on mount
    initializeParticles();

    // Animation loop
    const animate = () => {
      // Clear canvas (fully transparent)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply circular clipping only for 3D globe at low zoom (full globe view)
      const shouldClip = viewMode === '3d' && zoom < 4;
      if (shouldClip) {
        ctx.save();
        ctx.beginPath();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 2.2; // Slightly smaller than globe
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
      }

      particlesRef.current.forEach((particle) => {
        // Update wind vector at particle position
        const wind = getWindAtPosition(particle.x, particle.y);
        particle.vx = wind.vx;
        particle.vy = wind.vy;
        particle.speed = wind.speed;

        // Move particle (slower, more realistic)
        const speedMultiplier = 0.5; // Reduced from 2 to 0.5 for gentler movement
        particle.x += particle.vx * speedMultiplier;
        particle.y += particle.vy * speedMultiplier;
        particle.age++;

        // Wrap around edges or reset if too old
        if (particle.x < 0 || particle.x > canvas.width || 
            particle.y < 0 || particle.y > canvas.height || 
            particle.age > particle.maxAge) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
          particle.age = 0;
        }

        // Draw particle with smooth fade in/out
        const lifeRatio = particle.age / particle.maxAge;
        // Fade in during first 10% of life, fade out during last 20%
        let fadeMultiplier = 1;
        if (particle.age < particle.maxAge * 0.1) {
          fadeMultiplier = particle.age / (particle.maxAge * 0.1); // Fade in
        } else if (particle.age > particle.maxAge * 0.8) {
          fadeMultiplier = (particle.maxAge - particle.age) / (particle.maxAge * 0.2); // Fade out
        }
        
        const alpha = fadeMultiplier * opacity;
        const trailLength = 25 + particle.speed * 3; // Much longer trails like reference image
        
        // Draw fading tail (gradient from head to tail)
        const gradient = ctx.createLinearGradient(
          particle.x, 
          particle.y,
          particle.x - particle.vx * trailLength,
          particle.y - particle.vy * trailLength
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`); // Bright head
        gradient.addColorStop(0.3, `rgba(255, 255, 255, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`); // Fade to transparent
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * trailLength, particle.y - particle.vy * trailLength);
        ctx.stroke();
        
        // Bright head point
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Restore canvas state if clipped
      if (shouldClip) {
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [windData, bounds, zoom, opacity, viewMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ 
        width: '100%', 
        height: '100%',
        opacity: 1
      }}
    />
  );
};
