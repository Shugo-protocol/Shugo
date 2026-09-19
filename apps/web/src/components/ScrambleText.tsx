"use client";
import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ守護0123456789@#$%&*";

export default function ScrambleText({ text, japanese }: { text: string, japanese: string }) {
  const [displayText, setDisplayText] = useState(text);
  const [showJapanese, setShowJapanese] = useState(false);

  // Toggle the target text every 5 seconds
  useEffect(() => {
    const toggleInterval = setInterval(() => {
      setShowJapanese((prev) => !prev);
    }, 5000);

    return () => clearInterval(toggleInterval);
  }, []);

  // Run the subtle scramble animation whenever the target text changes
  useEffect(() => {
    let iteration = 0;
    let scrambleInterval: NodeJS.Timeout;
    const targetText = showJapanese ? japanese : text;

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
      
      // Changed from 1/3 to 1/5 to make the letter reveal slower and more deliberate
      iteration += 1 / 5; 
    }, 50); // Increased from 30ms to 50ms to calm down the flicker speed

    return () => clearInterval(scrambleInterval);
  }, [showJapanese, text, japanese]);

  return (
    <span className="inline-block font-sans font-bold">
      {displayText}
    </span>
  );
}