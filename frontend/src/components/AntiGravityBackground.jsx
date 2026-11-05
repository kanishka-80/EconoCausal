import React, { useEffect, useRef } from 'react';

const AntiGravityBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Floating particles config
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speedY: -(Math.random() * 0.5 + 0.2), // Anti-gravity upward float
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0 || p.x > canvas.width) p.x = Math.random() * canvas.width;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
        background: '#070b14'
      }}
    />
  );
};

export default AntiGravityBackground;