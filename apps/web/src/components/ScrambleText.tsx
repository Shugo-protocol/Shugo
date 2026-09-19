"use client";
import { useEffect, useState } from "react";

// Added Devanagari characters to the scramble matrix for an authentic glitch effect
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ守護0123456789@#$%&*कखगघचछजझटठडढतथदधनपफबभमयरलवशषसह";

export default function ScrambleText({ text, japanese, hindi }: { text: string, japanese: string, hindi: string }) {
  const [displayText, setDisplayText] = useState(text);
  
  // 0 = English (text), 1 = Japanese, 2 = Hindi
  const [langIndex, setLangIndex] = useState(0);

  // Cycle through the 3 states every 5 seconds
  useEffect(() => {
    const toggleInterval = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(toggleInterval);
  }, []);

  // Run the subtle scramble animation whenever the target text changes
  useEffect(() => {
    let iteration = 0;
    let scrambleInterval: NodeJS.Timeout;
    
    const targetText = langIndex === 0 ? text : langIndex === 1 ? japanese : hindi;

    clearInterval(scrambleInterval!);
    
    scrambleInterval = setInterval(() => {
      setDisplayText(() =>
        targetText
          .split("")
          .map((letter, index) => {
            if (index < iteration) return letter;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iteration >= targetText.length) {
        clearInterval(scrambleInterval);
        setDisplayText(targetText); // Ensure final string is perfect
      }
      
      iteration += 1 / 5; 
    }, 50);

    return () => clearInterval(scrambleInterval);
  }, [langIndex, text, japanese, hindi]);

  return (
    <span className="inline-block font-sans font-bold">
      {displayText}
    </span>
  );
}