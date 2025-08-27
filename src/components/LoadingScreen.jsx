import React from 'react';
import { Radio, Tv, Globe } from 'lucide-react';

const LoadingScreen = ({ progress = 0, message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo and title */}
        <div className="mb-8">
          <div className="relative inline-block">
            <Globe className="w-16 h-16 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1">
                <Radio className="w-4 h-4 text-cyan-400 animate-bounce" style={{ animationDelay: '0s' }} />
                <Tv className="w-4 h-4 text-orange-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mt-4 mb-2">
            Globe Media Streamer
          </h1>
          <p className="text-blue-200 text-sm">
            Discover live radio & TV stations worldwide
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-blue-200 mt-2">
            <span>{message}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-4 text-xs text-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span>Radio Stations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span>TV Channels</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>3D Globe</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span>Live Streaming</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

