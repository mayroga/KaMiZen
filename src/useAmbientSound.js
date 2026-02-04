import { useRef } from "react";

export default function useAmbientSound() {
  const audioRef = useRef(null);

  const startSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/ambient.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  return { startSound, stopSound };
}
