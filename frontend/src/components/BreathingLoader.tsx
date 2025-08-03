import { useState, useEffect } from 'react';

export default function BreathingLoader() {
  const [phase, setPhase] = useState('inhale');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState(0);

  useEffect(() => {
    const phases = [
      { name: 'inhale', duration: 4000, text: 'Breathe in...' },
      { name: 'hold', duration: 1000, text: 'Hold...' },
      { name: 'exhale', duration: 6000, text: 'Breathe out...' },
      { name: 'rest', duration: 1000, text: 'Rest...' }
    ];

    let currentPhaseIndex = 0;
    let startTime = Date.now();

    const animate = () => {
      const currentPhase = phases[currentPhaseIndex];
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / currentPhase.duration, 1);

      setPhase(currentPhase.name);
      setPhaseProgress(progress);

      if (progress >= 1) {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        startTime = Date.now();
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // 🔁 Add animation for loadingIndex
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingIndex(prev => (prev + 1) % 5);
    }, 400); // Change this speed as needed

    return () => clearInterval(interval);
  }, []);

  const getScale = () => {
    switch (phase) {
      case 'inhale':
        return 0.6 + (phaseProgress * 0.7);
      case 'hold':
        return 1.3;
      case 'exhale':
        return 1.3 - (phaseProgress * 0.7);
      case 'rest':
        return 0.6;
      default:
        return 0.6;
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe in...';
      case 'hold':
        return 'Hold...';
      case 'exhale':
        return 'Breathe out...';
      case 'rest':
        return 'Rest...';
      default:
        return 'Breathe...';
    }
  };

  const getBrightness = () => {
    switch (phase) {
      case 'inhale':
        return 0.4 + (phaseProgress * 0.6);
      case 'hold':
        return 1;
      case 'exhale':
        return 1 - (phaseProgress * 0.6);
      case 'rest':
        return 0.4;
      default:
        return 0.4;
    }
  };

  const scale = getScale();
  const brightness = getBrightness();

  const getParticleOpacity = (index) => {
    if (index === loadingIndex) {
      return 1;
    } else if ((index + 1) % 5 === loadingIndex) {
      return 0.7;
    } else {
      return 0.2;
    }
  };

  return (
    <div className="min-h-screen from-slate-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center space-y-12">

        {/* Breathing Orb */}
        <div className="relative flex items-center justify-center">

          {/* Glow effect */}
          <div 
            className="absolute rounded-full blur-xl transition-all duration-1000 ease-in-out"
            style={{
              width: `${24 * scale}rem`,
              height: `${24 * scale}rem`,
              background: `radial-gradient(circle, rgba(59, 130, 246, ${brightness * 0.3}) 0%, transparent 70%)`,
            }}
          />

          {/* Outer ring */}
          <div 
            className="absolute rounded-full transition-all duration-1000 ease-in-out"
            style={{
              width: `${18 * scale}rem`,
              height: `${18 * scale}rem`,
              background: `conic-gradient(from 0deg, rgba(59, 130, 246, ${brightness * 0.2}), rgba(147, 51, 234, ${brightness * 0.2}), rgba(59, 130, 246, ${brightness * 0.2}))`,
              borderRadius: '50%',
            }}
          />

          {/* Main orb */}
          <div 
            className="relative rounded-full transition-all duration-1000 ease-in-out backdrop-blur-sm"
            style={{
              width: `${14 * scale}rem`,
              height: `${14 * scale}rem`,
              background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, ${brightness * 0.8}), rgba(59, 130, 246, ${brightness * 0.6}), rgba(147, 51, 234, ${brightness * 0.4}))`,
              boxShadow: `0 0 ${4 * scale}rem rgba(59, 130, 246, ${brightness * 0.5})`,
            }}
          >
            {/* Inner highlight */}
            <div 
              className="absolute top-4 left-4 rounded-full transition-all duration-1000 ease-in-out"
              style={{
                width: `${3 * scale}rem`,
                height: `${3 * scale}rem`,
                background: `radial-gradient(circle, rgba(255, 255, 255, ${brightness * 0.9}), transparent 70%)`,
                filter: 'blur(1px)',
              }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-6">
          <p 
            className="mt-8 mb-5 text-4xl duration-500"
            style={{
              color: `rgba(59, 130, 246)`,
              textShadow: `0 0 ${2 * brightness}rem rgba(59, 130, 246, 0.5)`,
            }}
          >
            {getPhaseText()}
          </p>
          <p 
            className="text-1xl"
            style={{ color: `rgba(59, 130, 246)` }}>Analyzing text, please wait</p>
        </div>

        {/* Sequential Loading Particles */}
        <div className="relative w-96 h-16 flex items-center justify-center">
          <div className="flex space-x-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-blue-400 transition-all duration-1000 ease-in-out"
                style={{
                  opacity: getParticleOpacity(i),
                  transform: i === loadingIndex ? 'scale(1.5)' : 'scale(1)',
                  boxShadow: i === loadingIndex ? '0 0 1rem rgba(59, 130, 246, 0.8)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
