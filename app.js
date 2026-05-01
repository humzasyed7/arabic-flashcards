(function () {
  "use strict";

  let decks = [];
  let selectedDecks = new Set([0]);
  let currentCards = [];
  let currentCardIndex = 0;
  let isFlipped = false;
  let isAnimating = false;

  const deckSelector = document.getElementById("deckSelector");
  const cardCounter = document.getElementById("cardCounter");
  const flashcard = document.getElementById("flashcard");
  const arabicText = document.getElementById("arabicText");
  const englishText = document.getElementById("englishText");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const flipBtn = document.getElementById("flipBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");

  // Load flashcard data
  fetch("flashcards.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      decks = data.decks;
      selectedDecks = new Set([0]);
      renderDeckButtons();
      buildCards();
    });

  function renderDeckButtons() {
    deckSelector.innerHTML = "";
    decks.forEach(function (deck, i) {
      var btn = document.createElement("button");
      btn.className = "deck-btn" + (selectedDecks.has(i) ? " active" : "");
      btn.textContent = deck.name;
      btn.addEventListener("click", function () { toggleDeck(i); });
      deckSelector.appendChild(btn);
    });
  }

  function toggleDeck(index) {
    if (selectedDecks.has(index)) {
      // Don't allow deselecting the last deck
      if (selectedDecks.size <= 1) return;
      selectedDecks.delete(index);
    } else {
      selectedDecks.add(index);
    }
    updateDeckButtons();
    buildCards();
  }

  function updateDeckButtons() {
    var btns = deckSelector.querySelectorAll(".deck-btn");
    btns.forEach(function (b, i) {
      b.classList.toggle("active", selectedDecks.has(i));
    });
  }

  function buildCards() {
    currentCards = [];
    decks.forEach(function (deck, i) {
      if (selectedDecks.has(i)) {
        deck.cards.forEach(function (c) {
          currentCards.push({ arabic: c.arabic, english: c.english });
        });
      }
    });
    currentCardIndex = 0;
    isFlipped = false;
    showCard();
  }

  function showCard() {
    if (currentCards.length === 0) {
      arabicText.textContent = "No cards";
      englishText.textContent = "";
      cardCounter.textContent = "";
      return;
    }

    var card = currentCards[currentCardIndex];
    arabicText.textContent = card.arabic;
    englishText.textContent = card.english;
    cardCounter.textContent = (currentCardIndex + 1) + " / " + currentCards.length;

    // Reset flip
    isFlipped = false;
    flashcard.classList.remove("flipped");
  }

  // Navigate to a new card, unflipping first if needed
  function navigateTo(newIndex) {
    if (isAnimating) return;
    if (!isFlipped) {
      currentCardIndex = newIndex;
      showCard();
      return;
    }
    // Card is flipped — animate back to front, then swap content
    isAnimating = true;
    isFlipped = false;
    flashcard.classList.remove("flipped");
    flashcard.addEventListener("transitionend", function handler() {
      flashcard.removeEventListener("transitionend", handler);
      currentCardIndex = newIndex;
      var card = currentCards[currentCardIndex];
      arabicText.textContent = card.arabic;
      englishText.textContent = card.english;
      cardCounter.textContent = (currentCardIndex + 1) + " / " + currentCards.length;
      isAnimating = false;
    });
  }

  function flipCard() {
    if (isAnimating) return;
    isFlipped = !isFlipped;
    flashcard.classList.toggle("flipped", isFlipped);
  }

  function prevCard() {
    if (currentCards.length === 0) return;
    var newIndex = (currentCardIndex - 1 + currentCards.length) % currentCards.length;
    navigateTo(newIndex);
  }

  function nextCard() {
    if (currentCards.length === 0) return;
    var newIndex = (currentCardIndex + 1) % currentCards.length;
    navigateTo(newIndex);
  }

  function shuffleCards() {
    // Fisher-Yates shuffle
    for (var i = currentCards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = currentCards[i];
      currentCards[i] = currentCards[j];
      currentCards[j] = temp;
    }
    currentCardIndex = 0;
    showCard();
  }

  // Button listeners
  flipBtn.addEventListener("click", flipCard);
  prevBtn.addEventListener("click", prevCard);
  nextBtn.addEventListener("click", nextCard);
  shuffleBtn.addEventListener("click", shuffleCards);
  flashcard.addEventListener("click", flipCard);

  // Swipe gestures for mobile
  (function () {
    var touchStartX = 0;
    var touchStartY = 0;
    var touchEndX = 0;
    var touchEndY = 0;
    var minSwipe = 50;

    flashcard.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    flashcard.addEventListener("touchend", function (e) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      var dx = touchEndX - touchStartX;
      var dy = touchEndY - touchStartY;
      // Only swipe if horizontal movement exceeds vertical
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        e.preventDefault();
        if (dx < 0) {
          nextCard();
        } else {
          prevCard();
        }
      }
    });
  })();

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Ignore if user is typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        flipCard();
        break;
      case "ArrowLeft":
        e.preventDefault();
        prevCard();
        break;
      case "ArrowRight":
        e.preventDefault();
        nextCard();
        break;
      case "s":
      case "S":
        e.preventDefault();
        shuffleCards();
        break;
    }
  });
})();
