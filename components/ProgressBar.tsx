import React, { useState, useEffect, useRef } from 'react';

const messages = [
  "Briefing our AI copywriter...",
  "Designing product mockups...",
  "Analyzing market trends...",
  "Assembling your product listing...",
  "Final touches...",
];

export const ProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(messages[0]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Simulate a realistic but fake progress timeline
    const totalDuration = 12000; // 12 seconds
    const intervalTime = 100; // update every 100ms
    const increment = (100 / (totalDuration / intervalTime));

    intervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        
        // Stop the interval when it reaches 100
        if (newProgress >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setMessage("Done!");
          return 100;
        }
        
        // Update message based on progress milestones
        if (newProgress < 20) setMessage(messages[0]);
        else if (newProgress < 50) setMessage(messages[1]);
        else if (newProgress < 80) setMessage(messages[2]);
        else if (newProgress < 95) setMessage(messages[3]);
        else setMessage(messages[4]);

        return newProgress;
      });
    }, intervalTime);

    // Cleanup function to clear the interval
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-700">
      <h3 className="text-xl font-semibold text-gray-300 mb-4">{message}</h3>
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border border-gray-600">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        ></div>
      </div>
      <p className="text-2xl font-bold text-white mt-4">{`${Math.floor(progress)}%`}</p>
      <p className="text-gray-500 mt-1">Your AI-generated product page is almost ready.</p>
    </div>
  );
};
