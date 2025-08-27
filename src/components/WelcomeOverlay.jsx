import React, { useState, useEffect } from 'react';
import { X, Mouse, Hand, Radio, Tv, Search, Globe } from 'lucide-react';
import { Button } from 'react-aria-components'; // Placeholder for Button

const WelcomeOverlay = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      icon: <Globe className="w-8 h-8 text-blue-400" />,
      title: "Welcome to Globe Media Streamer",
      description: "Discover live radio and TV stations from around the world on an interactive 3D globe.",
      action: "Get Started"
    },
    {
      icon: <Mouse className="w-8 h-8 text-green-400" />,
      title: "Navigate the Globe",
      description: "Click and drag to rotate the globe. Scroll to zoom in and out. Explore different regions of the world.",
      action: "Next"
    },
    {
      icon: <div className="flex space-x-2">
        <Radio className="w-6 h-6 text-cyan-400" />
        <Tv className="w-6 h-6 text-orange-400" />
      </div>,
      title: "Find Media Stations",
      description: "Look for colored dots on the globe. Cyan dots represent radio stations, orange dots represent TV channels.",
      action: "Next"
    },
    {
      icon: <Hand className="w-8 h-8 text-purple-400" />,
      title: "Play Media",
      description: "Click any dot to open a floating media player. Use the lock feature to keep playing while exploring.",
      action: "Next"
    },
    {
      icon: <Search className="w-8 h-8 text-yellow-400" />,
      title: "Search & Navigate",
      description: "Use the search bar to find specific stations or countries. Try the quick navigation buttons for popular regions.",
      action: "Start Exploring"
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-400' : 
                  index < currentStep ? 'bg-green-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/5 rounded-full">
              {currentStepData.icon}
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-3">
            {currentStepData.title}
          </h2>
          
          <p className="text-gray-300 text-sm leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          {currentStep > 0 && (
            <Button
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="outline"
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/5"
            >
              Back
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {currentStepData.action}
          </Button>
          
          {currentStep < steps.length - 1 && (
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-white/5"
            >
              Skip
            </Button>
          )}
        </div>

        {/* Fun fact */}
        <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-xs text-blue-200 text-center">
            💡 Tip: Try searching for your country or favorite music genre!
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
