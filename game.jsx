import React, { useEffect, useRef, useState } from 'react';

const Game = () => {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 600;

        let player = { x: 180, y: 550, width: 40, height: 40 };
        let rocks = [];
        let animationFrameId;
        let gameRunning = true;

        // Function to create a new rock
        const createRock = () => {
            const x = Math.random() * (canvas.width - 30);
            rocks.push({ x, y: 0, width: 30, height: 30 });
        };

        // Function to detect collision
        const isCollision = (rock, player) => {
            return (
                rock.x < player.x + player.width &&
                rock.x + rock.width > player.x &&
                rock.y < player.y + player.height &&
                rock.y + rock.height > player.y
            );
        };

        // Game loop
        const gameLoop = () => {
            if (!gameRunning) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw player
            ctx.fillStyle = 'blue';
            ctx.fillRect(player.x, player.y, player.width, player.height);

            // Draw rocks
            ctx.fillStyle = 'red';
            rocks.forEach((rock, index) => {
                rock.y += 4; // Move rock down
                ctx.fillRect(rock.x, rock.y, rock.width, rock.height);

                // Check for collision
                if (isCollision(rock, player)) {
                    gameRunning = false;
                    setGameOver(true);
                }

                // Remove rocks that go off screen
                if (rock.y > canvas.height) {
                    rocks.splice(index, 1);
                    setScore((prev) => prev + 1); // Increment score
                }
            });

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        // Event listener for player movement
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft' && player.x > 0) {
                player.x -= 20;
            } else if (e.key === 'ArrowRight' && player.x < canvas.width - player.width) {
                player.x += 20;
            }
        };

        // Start the game
        const startGame = () => {
            setScore(0);
            setGameOver(false);
            rocks = [];
            player.x = 180;
            gameRunning = true;
            gameLoop();
        };

        // Add event listeners and start the game
        window.addEventListener('keydown', handleKeyDown);
        const rockInterval = setInterval(createRock, 1000);
        startGame();

        // Cleanup on component unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(rockInterval);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div>
            <style>
                {`
                    body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #111;
                        color: #fff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }

                    #game-container {
                        position: relative;
                    }

                    canvas {
                        background: linear-gradient(#222, #000);
                        border: 3px solid #fff;
                        display: block;
                    }

                    #score {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        font-size: 18px;
                        font-weight: bold;
                    }

                    #game-over {
                        position: absolute;
                        inset: 0;
                        background: rgba(0,0,0,0.8);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        flex-direction: column;
                    }
                `}
            </style>
            <div id="game-container">
                <canvas ref={canvasRef}></canvas>
                <div id="score">Score: {score}</div>
                {gameOver && (
                    <div id="game-over">
                        <h1>Game Over</h1>
                        <button onClick={() => window.location.reload()}>Restart</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Game;