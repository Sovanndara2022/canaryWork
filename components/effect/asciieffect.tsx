"use client";

import { useEffect, useRef } from "react";

export function AsciiAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;

    const riel = "៛";
    const slash = "/";

    const characters: {
      x: number;
      y: number;
      char: string;
      opacity: number;
      speed: number;
    }[] = [];

    function resize() {
      // Ensure canvas exists in this scope just in case
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.scale(dpr, dpr);

      createCharacters();
    }

    function createCharacters() {
      characters.length = 0;

      const spacingX = 28;
      const spacingY = 18;

      // Use Math.floor to get complete columns that fit on screen
      const columns = Math.floor(window.innerWidth / spacingX);
      const rows = Math.ceil(window.innerHeight / spacingY);

      // Calculate the leftover space to perfectly center the grid horizontally
      const gridWidth = columns * spacingX;
      const offsetX = (window.innerWidth - gridWidth) / 2 + (spacingX / 2);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const char = Math.random() > 0.7 ? riel : slash;

          characters.push({
            // Apply the centering offset to the X coordinate
            x: x * spacingX + offsetX + Math.random() * 8,
            y: y * spacingY + Math.random() * 8,
            char,
            opacity: Math.random() * 0.25 + 0.08,
            // Drastically increased speed (was 0.25 + 0.05)
            speed: Math.random() * 2.5 + 1.5,
          });
        }
      }
    }

    function draw() {
      // Use the canvas dimensions for clearing, not window
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      ctx!.font = "14px monospace";
      ctx!.textBaseline = "top";
      ctx!.textAlign = "center"; // Ensures the text itself centers on its X coordinate

      for (const item of characters) {
        item.y += item.speed;

        if (item.y > window.innerHeight) {
          item.y = -20;
        }

        ctx!.fillStyle = `rgba(255, 255, 255, ${item.opacity})`;
        ctx!.fillText(item.char, item.x, item.y);
      }

      animationFrame = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
