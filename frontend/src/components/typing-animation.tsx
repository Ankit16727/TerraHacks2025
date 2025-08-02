"use client";

import { useState, useEffect } from "react";

const phrases = [
  "Safe Walks.",
  "Live Support.",
  "Smart Alerts.",
  "Trusted Circles.",
  "Real Protection.",
];

export function TypingAnimation() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];

    const timeout = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false);
          setIsDeleting(true);
          return;
        }

        if (isDeleting) {
          if (currentText.length > 0) {
            setCurrentText(currentText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentPhraseIndex(prev => (prev + 1) % phrases.length);
          }
        } else {
          if (currentText.length < currentPhrase.length) {
            setCurrentText(currentPhrase.slice(0, currentText.length + 1));
          } else {
            setIsPaused(true);
          }
        }
      },
      isDeleting ? 100 : isPaused ? 2000 : 150
    );

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, isPaused, currentPhraseIndex]);

  return (
    <>
      <style jsx>{`
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        .typing-cursor {
          animation: blink 1s infinite;
        }
      `}</style>

      <div className="flex h-12 items-center justify-center">
        <h1 className="text-3xl font-bold text-black">
          {currentText}
          <span className="typing-cursor text-black">|</span>
        </h1>
      </div>
    </>
  );
}
