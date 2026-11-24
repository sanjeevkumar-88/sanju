const welcomeScreen = document.querySelector("#welcome-screen");
const siteContent = document.querySelector("#site-content");
const openSurpriseButton = document.querySelector("#open-surprise");
const musicToggle = document.querySelector("#music-toggle");
const musicLabel = document.querySelector("#music-label");
const noButton = document.querySelector("#no-button");
const proposalActions = document.querySelector("#proposal-actions");
const finaleScreen = document.querySelector("#finale-screen");
const closeFinaleButton = document.querySelector("#close-finale");
const confettiCanvas = document.querySelector("#confetti-canvas");
const confettiContext = confettiCanvas.getContext("2d");

let confettiFrame;
let musicContext;
let musicTimer = null;
let trackIndex = 0;
let isMusicPlaying = false;

const birthdayTracks = [
  {
    name: "Happy Birthday",
    notes: [
      ["G4", 0.25], ["G4", 0.25], ["A4", 0.5], ["G4", 0.5], ["C5", 0.5], ["B4", 1],
      ["G4", 0.25], ["G4", 0.25], ["A4", 0.5], ["G4", 0.5], ["D5", 0.5], ["C5", 1],
      ["G4", 0.25], ["G4", 0.25], ["G5", 0.5], ["E5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 1],
      ["F5", 0.25], ["F5", 0.25], ["E5", 0.5], ["C5", 0.5], ["D5", 0.5], ["C5", 1]
    ],
    tempo: 0.34
  }
];

const noteFrequencies = {
  G4: 392, A4: 440, B4: 494, C5: 523.25, D5: 587.33, E5: 659.25,
  F5: 698.46, G5: 783.99
};

// Reveal the birthday page only after the visitor opens the surprise.
openSurpriseButton.addEventListener("click", () => {
  welcomeScreen.hidden = true;
  siteContent.hidden = false;
  document.querySelector("#birthday-title").focus({ preventScroll: true });
  celebrate({ amount: 100 });
  startMusic();
});

// Move the playful NO button while keeping it inside its own button area.
function moveNoButton() {
  const area = proposalActions.getBoundingClientRect();
  const button = noButton.getBoundingClientRect();
  const padding = 4;
  const maxLeft = Math.max(padding, area.width - button.width - padding);
  const maxTop = Math.max(padding, area.height - button.height - padding);
  noButton.style.left = `${padding + Math.random() * (maxLeft - padding)}px`;
  noButton.style.top = `${padding + Math.random() * (maxTop - padding)}px`;
}

noButton.addEventListener("pointerenter", moveNoButton);
noButton.addEventListener("click", (event) => {
  event.preventDefault();
  moveNoButton();
});

document.querySelector("#yes-button").addEventListener("click", () => {
  finaleScreen.hidden = false;
  closeFinaleButton.focus();
  celebrate({ amount: 180, hearts: true });
});

closeFinaleButton.addEventListener("click", () => {
  finaleScreen.hidden = true;
  document.querySelector("#yes-button").focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !finaleScreen.hidden) {
    finaleScreen.hidden = true;
    document.querySelector("#yes-button").focus();
  }
});

// Play the Happy Birthday melody on repeat until the visitor pauses it.
async function startMusic() {
  try {
    if (!musicContext) {
      musicContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (musicContext.state === "suspended") {
      await musicContext.resume();
    }
    if (isMusicPlaying) return true;
    isMusicPlaying = true;
    playTrack();
    updateMusicButton(true);
    return true;
  } catch (error) {
    musicLabel.textContent = "Music could not be played";
    console.error("Unable to play birthday audio:", error);
    return false;
  }
}

function stopMusic() {
  if (musicTimer) {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
  isMusicPlaying = false;
  updateMusicButton(false);
}

function playNote(frequency, duration, startTime) {
  const oscillator = musicContext.createOscillator();
  const gain = musicContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(musicContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playTrack() {
  if (!isMusicPlaying || !musicContext) return;

  const track = birthdayTracks[trackIndex];
  const now = musicContext.currentTime + 0.08;
  let elapsed = 0;

  track.notes.forEach(([note, beats]) => {
    const duration = beats * track.tempo;
    playNote(noteFrequencies[note], duration, now + elapsed);
    elapsed += duration + 0.04;
  });

  musicLabel.textContent = `${track.name} • playing`;
  musicTimer = window.setTimeout(() => {
    playTrack();
  }, (elapsed + 1.2) * 1000);
}

function updateMusicButton(playing) {
  musicToggle.setAttribute("aria-pressed", String(playing));
  musicToggle.setAttribute("aria-label", playing ? "Turn background music off" : "Turn background music on");
  musicLabel.textContent = playing ? birthdayTracks[trackIndex].name : "Play a little music";
}

musicToggle.addEventListener("click", async () => {
  const isPlaying = musicToggle.getAttribute("aria-pressed") === "true";
  if (isPlaying) {
    stopMusic();
    return;
  }
  await startMusic();
});

// Draw a short burst of confetti or tiny hearts over the current screen.
function celebrate({ amount = 120, hearts = false } = {}) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  confettiCanvas.width = width * pixelRatio;
  confettiCanvas.height = height * pixelRatio;
  confettiContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const colors = ["#f27b9b", "#ffc0cf", "#bca3e8", "#ffdc91", "#fff4f3"];
  const pieces = Array.from({ length: amount }, () => ({
    x: Math.random() * width,
    y: -Math.random() * height * 0.7,
    size: hearts ? 7 + Math.random() * 8 : 4 + Math.random() * 7,
    speed: 2 + Math.random() * 3.6,
    drift: (Math.random() - 0.5) * 2.4,
    angle: Math.random() * Math.PI,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  window.cancelAnimationFrame(confettiFrame);
  function draw() {
    confettiContext.clearRect(0, 0, width, height);
    pieces.forEach((piece) => {
      piece.y += piece.speed;
      piece.x += piece.drift;
      piece.angle += 0.045;
      confettiContext.save();
      confettiContext.translate(piece.x, piece.y);
      confettiContext.rotate(piece.angle);
      confettiContext.fillStyle = piece.color;
      if (hearts) {
        confettiContext.font = `${piece.size}px sans-serif`;
        confettiContext.fillText("♥", 0, 0);
      } else {
        confettiContext.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * 0.65);
      }
      confettiContext.restore();
    });

    for (let index = pieces.length - 1; index >= 0; index -= 1) {
      if (pieces[index].y > height + 24) pieces.splice(index, 1);
    }
    if (pieces.length) confettiFrame = window.requestAnimationFrame(draw);
    else confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
  draw();
}