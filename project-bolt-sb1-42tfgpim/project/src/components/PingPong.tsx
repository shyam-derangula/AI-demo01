import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

type GameMode = 'single' | 'multi';
type Difficulty = 'easy' | 'medium' | 'hard';
type ColorOption = 'neon-green' | 'neon-blue' | 'neon-pink' | 'neon-yellow';

const COLORS = {
  'neon-green': '#39FF14',
  'neon-blue': '#4DEEEA',
  'neon-pink': '#FF44CC',
  'neon-yellow': '#FFE744'
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 90;
const BALL_SIZE = 15;
const INITIAL_BALL_SPEED = 5;

const PingPong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [paddleColor, setPaddleColor] = useState<ColorOption>('neon-green');
  const [ballColor, setBallColor] = useState<ColorOption>('neon-pink');
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Game state
  const gameState = useRef({
    paddle1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    paddle2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballSpeedX: INITIAL_BALL_SPEED,
    ballSpeedY: INITIAL_BALL_SPEED,
    keys: new Set<string>()
  });

  // Sound effects
  const hitSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  const scoreSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

  const playSound = (sound: HTMLAudioElement) => {
    if (!isMuted) {
      sound.currentTime = 0;
      sound.play();
    }
  };

  const resetBall = () => {
    gameState.current.ballX = CANVAS_WIDTH / 2;
    gameState.current.ballY = CANVAS_HEIGHT / 2;
    gameState.current.ballSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    gameState.current.ballSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    gameState.current.keys.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === 'p') {
      setIsPaused(prev => !prev);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    gameState.current.keys.delete(e.key.toLowerCase());
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isGameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationId: number;

    const updateGame = () => {
      if (isPaused) return;

      const state = gameState.current;

      // Update paddle positions
      if (gameState.current.keys.has('w')) {
        state.paddle1Y = Math.max(0, state.paddle1Y - 8);
      }
      if (gameState.current.keys.has('s')) {
        state.paddle1Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.paddle1Y + 8);
      }

      if (gameMode === 'multi') {
        if (gameState.current.keys.has('arrowup')) {
          state.paddle2Y = Math.max(0, state.paddle2Y - 8);
        }
        if (gameState.current.keys.has('arrowdown')) {
          state.paddle2Y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.paddle2Y + 8);
        }
      } else {
        // AI movement
        const difficultySpeed = { easy: 3, medium: 5, hard: 7 }[difficulty];
        const targetY = state.ballY - PADDLE_HEIGHT / 2;
        if (Math.abs(targetY - state.paddle2Y) > difficultySpeed) {
          state.paddle2Y += targetY > state.paddle2Y ? difficultySpeed : -difficultySpeed;
        }
      }

      // Update ball position
      state.ballX += state.ballSpeedX;
      state.ballY += state.ballSpeedY;

      // Ball collision with paddles
      if (
        (state.ballX <= PADDLE_WIDTH && state.ballY >= state.paddle1Y && state.ballY <= state.paddle1Y + PADDLE_HEIGHT) ||
        (state.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE && state.ballY >= state.paddle2Y && state.ballY <= state.paddle2Y + PADDLE_HEIGHT)
      ) {
        state.ballSpeedX = -state.ballSpeedX * 1.1;
        playSound(hitSound);
      }

      // Ball collision with walls
      if (state.ballY <= 0 || state.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
        state.ballSpeedY = -state.ballSpeedY;
        playSound(hitSound);
      }

      // Scoring
      if (state.ballX <= 0) {
        setScore2(prev => prev + 1);
        playSound(scoreSound);
        resetBall();
      } else if (state.ballX >= CANVAS_WIDTH) {
        setScore1(prev => prev + 1);
        playSound(scoreSound);
        resetBall();
      }

      // Draw game
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw paddles
      ctx.fillStyle = COLORS[paddleColor];
      ctx.fillRect(0, state.paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, state.paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw ball
      ctx.fillStyle = COLORS[ballColor];
      ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE);

      // Draw center line
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      animationId = requestAnimationFrame(updateGame);
    };

    animationId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animationId);
  }, [isGameStarted, isPaused, gameMode, difficulty, paddleColor, ballColor, isMuted]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex gap-4">
        {!isGameStarted ? (
          <>
            <select
              className="bg-gray-800 text-white px-4 py-2 rounded"
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value as GameMode)}
            >
              <option value="single">Single Player</option>
              <option value="multi">Two Players</option>
            </select>
            {gameMode === 'single' && (
              <select
                className="bg-gray-800 text-white px-4 py-2 rounded"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            )}
            <select
              className="bg-gray-800 text-white px-4 py-2 rounded"
              value={paddleColor}
              onChange={(e) => setPaddleColor(e.target.value as ColorOption)}
            >
              <option value="neon-green">Neon Green</option>
              <option value="neon-blue">Neon Blue</option>
              <option value="neon-pink">Neon Pink</option>
              <option value="neon-yellow">Neon Yellow</option>
            </select>
            <select
              className="bg-gray-800 text-white px-4 py-2 rounded"
              value={ballColor}
              onChange={(e) => setBallColor(e.target.value as ColorOption)}
            >
              <option value="neon-green">Neon Green</option>
              <option value="neon-blue">Neon Blue</option>
              <option value="neon-pink">Neon Pink</option>
              <option value="neon-yellow">Neon Yellow</option>
            </select>
          </>
        ) : (
          <div className="text-white text-2xl font-bold">
            {score1} - {score2}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gray-700 rounded-lg"
      />

      <div className="mt-4 flex gap-4">
        {!isGameStarted ? (
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
            onClick={() => setIsGameStarted(true)}
          >
            Start Game
          </button>
        ) : (
          <>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
              onClick={() => setIsPaused(prev => !prev)}
            >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
              onClick={() => setIsMuted(prev => !prev)}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </>
        )}
      </div>

      <div className="mt-4 text-gray-400 text-sm">
        {gameMode === 'multi' ? (
          <p>Player 1: W/S keys | Player 2: ↑/↓ keys</p>
        ) : (
          <p>Controls: W/S keys | Press P to pause</p>
        )}
      </div>
    </div>
  );
};

export default PingPong;