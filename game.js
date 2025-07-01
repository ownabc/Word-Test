let startTime = null;
let elapsedTime = 0;
let words = [];
let currentWords = [];
let incorrectWords = [];
let currentIndex = 0;
let y = 0;
let speed = 0.5;
let message = "";
let showExplanation = false;
let correctCount = 0;
let input;
let lastAnswerCorrect = false;
let isReviewMode = false;
let adjustmentMade = false;

function startGame() {
  const inputFile = document.getElementById("fileInput");
  const dayInput = document.getElementById("dayInput").value.trim();
  const displayMode = document.getElementById("displayMode").value;

  if (!inputFile.files.length || !dayInput) {
    alert("엑셀 파일과 일차를 입력해주세요.");
    return;
  }

  const days = dayInput.split(",").map(d => parseInt(d.trim())).filter(n => !isNaN(n));
  if (days.length === 0) {
    alert("올바른 일차를 입력해주세요. 예: 1,2,3");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    words = json
      .filter(row => days.includes(parseInt(row["일차"])))
      .map(row => ({
        word: row["히라가나"] || "",
        kanji: row["한자"] || "",
        meaning: row["뜻"] || "",
        example: row["예문"] || ""
      }));

    if (words.length === 0) {
      alert("선택한 일차에 단어가 없습니다.");
      return;
    }

    startNewRound(words, displayMode);
  };
  reader.readAsArrayBuffer(inputFile.files[0]);
}

function setup() {
  const canvas = createCanvas(500, 450);
  canvas.parent("gameArea");

  input = createInput();
  input.id("answerInput");
  input.parent("gameArea");
  input.position(0, 460);  // 회색 배경 바로 아래 위치
  input.size(480);
  input.attribute("placeholder", "정답을 입력하고 Enter");

  input.elt.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
     if (!showExplanation) {
      handleSubmit();
     } else {
       nextWord();
     } 
      event.preventDefault();
    }
  });

  noLoop();
}

function draw() {
  background(220);
  textSize(32);
  textAlign(CENTER);
  fill(0);

  if (currentWords.length === 0) {
    noLoop();
    input.attribute("disabled", "");

    // 점수 계산 (100점 만점)
    let total = words.length;
    let score = 0;
    if (total > 0) {
      score = Math.round((correctCount / total) * 100);
    }

    textSize(32);
    textAlign(CENTER, CENTER);
    fill(0);
    text(`🎉 모든 단어 완료!`, width / 2, height / 2 - 30);
    text(`점수: ${score} 점`, width / 2, height / 2 + 30);
  
    return;
  }

  if (!showExplanation) {
    let currentWord = currentWords[currentIndex];
    const displayMode = document.getElementById("displayMode").value;
    let textToShow = displayMode === "hiragana" ? currentWord.word : currentWord.kanji;
    if (!textToShow) textToShow = displayMode === "hiragana" ? currentWord.kanji : currentWord.word;
    text(textToShow, width / 2, y);
    y += speed;
    if (y > height) {
      message = "⌛ 시간 초과!";
      addToIncorrect(currentWord);
      showExplanation = true;
      updateExampleBox(currentWord);
    }
  }

  textSize(16);
  textAlign(LEFT);
  fill(0);
  text("정답 수: " + correctCount, 10, 20);
  text("오답 수: " + incorrectWords.length, 10, 40);
  text("전체 단어 수: " + words.length, 10, 60);
  fill(200, 0, 0);
  text(message, 10, 80);

  if (showExplanation) {
    let currentWord = currentWords[currentIndex];
    const displayMode = document.getElementById("displayMode").value;
    fill(0);
    textSize(18);
    if (displayMode === "hiragana") {
     text("한자: " + (currentWord.kanji || "(없음)"), 10, 110);
    } else {
     text("히라가나: " + (currentWord.word || "(없음)"), 10, 110);
    }
    text("뜻: " + currentWord.meaning, 10, 140);
  }

  // ⏱️ 타이머 박스
  if (startTime !== null && currentWords.length > 0) {
    elapsedTime = int((millis() - startTime) / 1000); // 초 단위
    const minutes = String(int(elapsedTime / 60)).padStart(2, "0");
    const seconds = String(elapsedTime % 60).padStart(2, "0");
    const timeText = `${minutes}:${seconds}`;

    fill(255);
    stroke(0);
    strokeWeight(1);
    rect(width - 100, 10, 80, 30, 5);
    noStroke();
    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(timeText, width - 60, 25);
  }
}

function handleSubmit() {
  if (showExplanation) return;

  let userInput = input.value().trim();
  if (userInput.length === 0) return;

  let currentWord = currentWords[currentIndex];

  let userInputs = userInput.split(/[,、，]/).map(s => s.trim());
  let isCorrect = userInputs.some(answer => currentWord.meaning.includes(answer));

  if (isCorrect) {
    message = "🎉 정답!";
    if (!isReviewMode) correctCount++;
    lastAnswerCorrect = true;
  } else {
    message = "❌ 오답!";
    addToIncorrect(currentWord);
    lastAnswerCorrect = false;
  }

  showExplanation = true;
  updateExampleBox(currentWord);
  input.value("");
}

function addToIncorrect(word) {
  if (!incorrectWords.some(w => w.kanji === word.kanji)) {
    incorrectWords.push(word);
  }
}

function nextWord() {
  showExplanation = false;
  message = "";
  y = 0;
  currentIndex++;
  adjustmentMade = false;
  if (currentIndex >= currentWords.length) {
    if (incorrectWords.length > 0) {
      currentWords = shuffleArray(incorrectWords);
      incorrectWords = [];
      currentIndex = 0;
      isReviewMode = true;
    } else {
      currentWords = [];
    }
  }
  input.value("");
  lastAnswerCorrect = false;
}

function keyPressed() {
  if (showExplanation && !adjustmentMade) {  // ✅ 추가된 조건
    let currentWord = currentWords[currentIndex];

    if (key === "2") {
      addToIncorrect(currentWord);
      if (!isReviewMode && lastAnswerCorrect) {
        correctCount--;
      }
      adjustmentMade = true;
    }

    if (key === "3") {
      if (!isReviewMode && !lastAnswerCorrect) {
        correctCount++;
      }
      incorrectWords = incorrectWords.filter(w => w.kanji !== currentWord.kanji);
      adjustmentMade = true;
    }
  }
}

function startNewRound(wordList, displayMode) {
  currentWords = shuffleArray(wordList.slice());
  incorrectWords = [];
  currentIndex = 0;
  y = 0;
  message = "";
  showExplanation = false;
  correctCount = 0;
  isReviewMode = false;
  adjustmentMade = false; 
  loop();
  input.value("");
  input.removeAttribute("disabled");
  updateExampleBox({ example: "← 정답을 맞히면 여기 예문이 표시됩니다." });
  startTime = millis(); // <-- 시작 시간 기록
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateExampleBox(word) {
  const exampleBox = document.getElementById("exampleBox");
  exampleBox.textContent = word.example || "";
}

// p5.js 필수 함수 연결
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
