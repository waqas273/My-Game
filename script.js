const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dashboard = document.getElementById("dashboard");
const levelButtons = document.querySelectorAll(".level-btn");
const returnButton = document.getElementById("returnButton");
const difficultySelect = document.getElementById("difficultySelect");

// Adjust the canvas size based on the screen width and height (auto-resizing for mobile)
function setCanvasSize() {
  const deviceWidth = window.innerWidth;
  const deviceHeight = window.innerHeight;

  // Set canvas size to 90% of the screen width and height, keeping the aspect ratio
  const aspectRatio = 800 / 600;
  if (deviceWidth / deviceHeight > aspectRatio) {
    canvas.width = deviceHeight * aspectRatio;
    canvas.height = deviceHeight;
  } else {
    canvas.width = deviceWidth;
    canvas.height = deviceWidth / aspectRatio;
  }
}

// Initialize the canvas size on page load and when the window is resized
window.addEventListener('resize', setCanvasSize);
setCanvasSize();

let ballX, ballY, ballDX, ballDY, ballRadius;
const paddleHeight = 10;
const paddleWidth = 100;
let paddleX, paddleSpeed;
let bricks = [];
let brickRowCount, brickColumnCount, brickWidth, brickHeight, brickPadding, brickOffsetTop, brickOffsetLeft;
let score, running, level, difficulty, colors;

// Sensitivity settings for different controls
let paddleSensitivityKeyboard = 7; // Keyboard paddle speed
let paddleSensitivityTouch = 10;  // Touch paddle sensitivity (can be adjusted)

// Initialize game variables
function initializeGame(selectedLevel) {
  dashboard.style.display = "none";
  canvas.style.display = "block";
  returnButton.style.display = "block";

  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  setBallSpeed(difficulty);
  ballRadius = 10;

  paddleX = (canvas.width - paddleWidth) / 2;
  paddleSpeed = 7 + selectedLevel;

  score = 0;

  // Configure levels
  brickRowCount = 3 + selectedLevel; // More rows for higher levels
  brickColumnCount = 5 + Math.floor(selectedLevel / 2); // More columns for higher levels

  brickWidth = 75;
  brickHeight = 20;
  brickPadding = 10;
  brickOffsetTop = 30;
  brickOffsetLeft = 35;

  colors = Array.from({ length: brickRowCount }, () => randomColor());

  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }

  running = true;
}

// Set ball speed based on difficulty
function setBallSpeed(difficulty) {
  if (difficulty === 'easy') {
    ballDX = 2;
    ballDY = -2;
  } else if (difficulty === 'medium') {
    ballDX = 3;
    ballDY = -3;
  } else if (difficulty === 'hard') {
    ballDX = 4;
    ballDY = -4;
  }
}

// Generate a random color
function randomColor() {
  return `hsl(${Math.random() * 360}, 80%, 60%)`;
}

// Event listeners for dashboard
levelButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    level = parseInt(e.target.dataset.level);
    initializeGame(level);
    draw();
  });
});

// Event listener for "Return to Dashboard" button
returnButton.addEventListener("click", () => {
  running = false; // Stop the game loop
  dashboard.style.display = "block";
  canvas.style.display = "none";
  returnButton.style.display = "none";
});

// Event listener for difficulty selection
difficultySelect.addEventListener("change", (e) => {
  difficulty = e.target.value;
  if (level) {
    initializeGame(level); // Reinitialize game with updated difficulty
    draw();
  }
});

// Prevent arrow keys from affecting difficulty select when it's focused
let difficultySelectFocused = false;

// Event listener for difficulty selection (to track focus)
difficultySelect.addEventListener('focus', () => {
  difficultySelectFocused = true;
});

difficultySelect.addEventListener('blur', () => {
  difficultySelectFocused = false;
});

// Prevent default behavior when difficulty select is focused
document.addEventListener("keydown", (e) => {
  if (difficultySelectFocused) {
    return; // Don't process arrow keys when difficulty select is focused
  }

  // Check for arrow keys to control the paddle
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  }
  if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  }
  if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
});

// Variables for keyboard controls
let rightPressed = false;
let leftPressed = false;
let mouseX = 0;

// Keyboard event for paddle movement
document.addEventListener("keydown", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

// Touch or Mouse event for paddle movement
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX - canvas.offsetLeft;
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault(); // Prevent default touch behavior (scrolling, etc.)
  mouseX = e.touches[0].clientX - canvas.offsetLeft;
});

// Drawing functions
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight);
  ctx.fillStyle = "lime";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = colors[r];
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// Collision detection for bricks
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (
          ballX > b.x &&
          ballX < b.x + brickWidth &&
          ballY > b.y &&
          ballY < b.y + brickHeight
        ) {
          ballDY = -ballDY;
          b.status = 0; // Mark the brick as "hit"
          score++;
          if (score === brickRowCount * brickColumnCount) {
            alert("You win!");
            initializeGame(level);
          }
        }
      }
    }
  }
}

// Main game loop
function draw() {
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  drawPaddle();
  drawBricks();
  collisionDetection();

  // Ball boundary collisions
  if (ballX + ballDX > canvas.width - ballRadius || ballX + ballDX < ballRadius) {
    ballDX = -ballDX;
  }
  if (ballY + ballDY < ballRadius) {
    ballDY = -ballDY;
  } else if (ballY + ballDY > canvas.height - ballRadius) {
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      const hitPoint = ballX - (paddleX + paddleWidth / 2);
      ballDX = hitPoint * 0.05;
      ballDY = -Math.abs(ballDY);
    } else {
      alert("Game Over!");
      initializeGame(level);
    }
  }

  ballX += ballDX;
  ballY += ballDY;

  // Paddle movement (keyboard control or mouse control)
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += paddleSensitivityKeyboard;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= paddleSensitivityKeyboard;
  }

  // Mouse or touch movement control for paddle
  if (mouseX > 0 && mouseX < canvas.width) {
    paddleX = mouseX - paddleWidth / 2; // Keep the paddle centered on mouse/touch position
  }

  requestAnimationFrame(draw);
}
