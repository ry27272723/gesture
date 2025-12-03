import React, { useState } from 'react';
import GestureCanvas from './components/GestureCanvas';
import { Theme, GestureType } from './types';

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(Theme.NightSky);
  const [activeGesture, setActiveGesture] = useState<GestureType>(GestureType.None);

  // Helper to format gesture name for UI
  const getGestureColor = (g: GestureType) => {
    switch (g) {
      case GestureType.OpenPalm: return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]';
      case GestureType.ClosedFist: return 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]';
      case GestureType.OneFinger: return 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]';
      default: return 'text-gray-500';
    }
  };

  const getThemeIcon = (t: Theme) => {
    switch(t) {
      case Theme.NightSky: return '✨';
      case Theme.Garden: return '🌸';
      case Theme.Magic: return '🔮';
      default: return '•';
    }
  };

  return (
    <div className="w-screen h-screen relative bg-black font-sans overflow-hidden select-none">
      
      {/* 
        Key prop forces a full unmount/remount when theme changes.
        This restarts the camera stream and resets the canvas context completely.
      */}
      <GestureCanvas 
        key={currentTheme}
        theme={currentTheme} 
        onGestureChange={setActiveGesture} 
      />

      {/* --- HUD OVERLAY --- */}

      {/* Top Left: Branding */}
      <div className="absolute top-8 left-8 pointer-events-none z-10">
         <h1 className="text-4xl font-black italic tracking-tighter text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
           GESTURE<span className="text-blue-500">FX</span>
         </h1>
         <div className="flex items-center space-x-2 mt-1 opacity-70">
           <div className="w-1 h-1 bg-white rounded-full"></div>
           <p className="text-xs text-white/80 font-mono tracking-widest uppercase">
             Interactive Particle Engine
           </p>
         </div>
      </div>

      {/* Top Right: Status Monitor */}
      <div className="absolute top-8 right-8 pointer-events-none z-10 flex flex-col items-end space-y-2">
         <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-lg p-4 w-64 shadow-2xl">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
               <span className="text-[10px] uppercase tracking-widest text-gray-400">System Status</span>
               <div className="flex space-x-1">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] uppercase text-gray-500">Detected Action</span>
              <span className={`text-lg font-bold font-mono uppercase transition-all duration-200 ${getGestureColor(activeGesture)}`}>
                 {activeGesture === GestureType.None ? 'SCANNING...' : activeGesture}
              </span>
            </div>
         </div>
         
         {/* Instructions Mini-panel */}
         <div className="backdrop-blur-md bg-black/20 border border-white/5 rounded-lg p-3 w-64 shadow-lg text-right">
             <div className="space-y-1 text-[10px] text-gray-400 font-mono uppercase">
               <div className={activeGesture === GestureType.OneFinger ? 'text-white' : ''}>[☝️] One Finger</div>
               <div className={activeGesture === GestureType.ClosedFist ? 'text-white' : ''}>[✊] Closed Fist</div>
               <div className={activeGesture === GestureType.OpenPalm ? 'text-white' : ''}>[✋] Open Palm</div>
             </div>
         </div>
      </div>

      {/* Bottom Center: Theme Dock */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center z-20 pointer-events-none">
        <div className="flex space-x-4 p-2 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] pointer-events-auto">
          {Object.values(Theme).map((theme) => (
            <button
              key={theme}
              onClick={() => setCurrentTheme(theme)}
              className={`
                relative group flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300
                ${currentTheme === theme 
                  ? 'bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }
                border
              `}
            >
              <span className="text-xl">{getThemeIcon(theme)}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{theme}</span>
              
              {/* Active Indicator Line */}
              {currentTheme === theme && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Background Grid/Vignette Overlay (Static aesthetic element) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] opacity-60 z-0"></div>
    </div>
  );
};

export default App;