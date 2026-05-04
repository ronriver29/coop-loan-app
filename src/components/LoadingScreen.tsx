import React from 'react';
import { motion } from 'motion/react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background Particles/Bokeh Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -100 - 50],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
            className="absolute h-2 w-2 rounded-full bg-cyan-400 blur-sm"
          />
        ))}
      </div>

      <div className="relative">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -m-16 h-32 w-32 rounded-full border-t-2 border-b-2 border-cyan-500/30 blur-[1px]"
        />
        
        {/* Middle Ring (Reverse) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -m-12 h-24 w-24 rounded-full border-l-2 border-r-2 border-cyan-400/50"
        />

        {/* Inner Arcs */}
        <div className="relative h-16 w-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-b-2 border-cyan-200 opacity-60"
          />
        </div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center -bottom-24"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-400 italic shadow-cyan-500/50">
            Scanning...
          </span>
        </motion.div>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-black text-cyan-100 uppercase tracking-widest opacity-80">
                LOADING
            </span>
        </div>
      </div>

      {/* Flare/Glow background */}
      <div className="absolute h-[300px] w-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
    </div>
  );
};

export default LoadingScreen;
