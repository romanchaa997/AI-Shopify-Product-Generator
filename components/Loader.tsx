import React, { useState, useEffect } from 'react';

const messages = [
  "Briefing our AI copywriter...",
  "Designing product mockups...",
  "Analyzing market trends...",
  "Brewing fresh marketing ideas...",
  "Assembling your product listing...",
  "This can take a moment...",
];

export const Loader: React.FC = () => {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
      <p className="mt-6 text-xl font-semibold text-gray-300">{message}</p>
      <p className="text-gray-500 mt-2">Your AI-generated product page is almost ready.</p>
    </div>
  );
};