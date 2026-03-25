import React from 'react';
import { GameSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost, Zap, Shield, Play, Settings2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface MenuProps {
  onStart: (settings: GameSettings) => void;
}

const BackgroundAnimation = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
      <motion.div
        animate={{ x: ['-20vw', '120vw'] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 8, ease: 'linear' }}
        className="absolute top-[20%] flex items-center gap-8"
      >
        <div className="w-12 h-12 bg-yellow-400 rounded-full" style={{ clipPath: 'polygon(100% 74%, 44% 48%, 100% 21%, 100% 0, 0 0, 0 100%, 100% 100%)' }} />
        <Ghost className="w-12 h-12 text-red-500 fill-red-500" />
        <Ghost className="w-12 h-12 text-pink-500 fill-pink-500" />
        <Ghost className="w-12 h-12 text-cyan-500 fill-cyan-500" />
      </motion.div>

      <motion.div
        animate={{ x: ['120vw', '-20vw'] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 8, ease: 'linear', delay: 8 }}
        className="absolute top-[60%] flex items-center gap-8"
      >
        <Ghost className="w-12 h-12 text-blue-500 fill-blue-500" />
        <Ghost className="w-12 h-12 text-blue-500 fill-blue-500" />
        <Ghost className="w-12 h-12 text-blue-500 fill-blue-500" />
        <div className="w-12 h-12 bg-yellow-400 rounded-full scale-x-[-1]" style={{ clipPath: 'polygon(100% 74%, 44% 48%, 100% 21%, 100% 0, 0 0, 0 100%, 100% 100%)' }} />
      </motion.div>
    </div>
  );
};

export const Menu: React.FC<MenuProps> = ({ onStart }) => {
  const [step, setStep] = React.useState<'initial' | 'settings'>('initial');
  const [ghostCount, setGhostCount] = React.useState(4);
  const [difficulty, setDifficulty] = React.useState<GameSettings['difficulty']>('medium');
  const [mapType, setMapType] = React.useState<GameSettings['mapType']>('procedural');

  const handleStart = () => {
    const ghostSpeed = difficulty === 'easy' ? 0.06 : difficulty === 'medium' ? 0.1 : 0.14;
    onStart({ ghostCount, ghostSpeed, difficulty, mapType });
  };

  return (
    <div className="min-h-screen w-full bg-[#020205] text-white flex flex-col items-center justify-center p-4 font-mono overflow-y-auto relative">
      <BackgroundAnimation />
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#00f2ff]/5 blur-[180px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#7000ff]/5 blur-[180px] rounded-full"></div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'initial' ? (
          <motion.div 
            key="initial"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="text-center mb-16">
              <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase leading-none pr-8 pb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00f2ff] drop-shadow-[0_0_30px_rgba(0,242,255,0.5)] pr-4">NEON</span>
                <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#00f2ff] to-[#7000ff] drop-shadow-[0_0_30px_rgba(112,0,255,0.5)] pr-4">PAC-MAN</span>
              </h1>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0,242,255,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('settings')}
              className="px-16 py-8 bg-white text-black font-black uppercase tracking-[0.5em] rounded-full text-2xl shadow-2xl relative group overflow-hidden"
            >
              <span className="relative z-10">Play Game</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f2ff] to-[#7000ff] opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="relative z-10 w-full max-w-lg bg-[#0a0a15]/90 backdrop-blur-3xl p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl"
          >
            <button 
              onClick={() => setStep('initial')}
              className="absolute top-6 left-8 text-white/40 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
            >
              ← Back
            </button>

            <h2 className="text-3xl font-black uppercase tracking-tighter mb-12 text-center italic">Game Settings</h2>
            
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white/60 text-[10px] uppercase tracking-widest font-bold">
                    <Info className="w-4 h-4 text-[#00f2ff]" />
                    <span>Map Type</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['procedural', 'classic'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMapType(m)}
                      className={cn(
                        "relative py-4 rounded-2xl border transition-all uppercase text-[10px] font-black tracking-[0.2em] overflow-hidden",
                        mapType === m 
                          ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                          : "border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white/60 text-[10px] uppercase tracking-widest font-bold">
                    <Settings2 className="w-4 h-4 text-[#00f2ff]" />
                    <span>Difficulty</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "relative py-4 rounded-2xl border transition-all uppercase text-[10px] font-black tracking-[0.2em] overflow-hidden",
                        difficulty === d 
                          ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                          : "border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 text-white/60 text-[10px] uppercase tracking-widest font-bold">
                    <Ghost className="w-4 h-4 text-[#7000ff]" />
                    <span>Ghost Entity Count</span>
                  </div>
                  <span className="text-2xl font-black text-white">{ghostCount}</span>
                </div>
                <div className="relative h-2 flex items-center">
                  <div className="absolute inset-0 bg-white/5 rounded-full"></div>
                  <motion.div 
                    className="absolute left-0 h-full bg-gradient-to-r from-[#00f2ff] to-[#7000ff] rounded-full"
                    style={{ width: `${(ghostCount / 6) * 100}%` }}
                  />
                  <input 
                    type="range" 
                    min="1" 
                    max="6" 
                    value={ghostCount}
                    onChange={(e) => setGhostCount(parseInt(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.4em] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center justify-center gap-4 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00f2ff] to-[#7000ff] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <Play className="w-6 h-6 fill-black" />
                <span>Start Game</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 flex gap-8 opacity-20">
        <Zap className="w-4 h-4" />
        <Shield className="w-4 h-4" />
        <Info className="w-4 h-4" />
      </div>
    </div>
  );
};
