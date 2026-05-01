(function () {
  "use strict";

  let decks = [];
  let selectedDecks = new Set([0]);
  let currentCards = [];
  let currentCardIndex = 0;
  let isFlipped = false;
  let isAnimating = false;
  let isShuffled = false;
  let openCategory = null;

  // Category definitions — deck indices assigned after data loads
  var categories = [
    { name: "Noun Charts", deckIndices: [] },
    { name: "Verb Charts", deckIndices: [] },
    { name: "Vocab", deckIndices: [] }
  ];

  var nounNames = ["Muslim Chart", "Detached Pronouns", "Attached Pronouns"];
  var vocabNames = ["Vocab List 1"];

  const categorySelector = document.getElementById("categorySelector");
  const deckDrawer = document.getElementById("deckDrawer");
  const deckSelector = document.getElementById("deckSelector");
  const cardCounter = document.getElementById("cardCounter");
  const flashcard = document.getElementById("flashcard");
  const arabicText = document.getElementById("arabicText");
  const mainText = document.getElementById("mainText");
  const subText = document.getElementById("subText");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const flipBtn = document.getElementById("flipBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");

  // Load flashcard data
  fetch("flashcards.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      decks = data.decks;
      assignCategories();
      selectedDecks = new Set([0]);
      renderCategoryButtons();
      buildCards();
    });

  function assignCategories() {
    categories[0].deckIndices = [];
    categories[1].deckIndices = [];
    categories[2].deckIndices = [];
    decks.forEach(function (deck, i) {
      if (nounNames.indexOf(deck.name) !== -1) {
        categories[0].deckIndices.push(i);
      } else if (vocabNames.indexOf(deck.name) !== -1) {
        categories[2].deckIndices.push(i);
      } else {
        categories[1].deckIndices.push(i);
      }
    });
  }

  function renderCategoryButtons() {
    categorySelector.innerHTML = "";
    categories.forEach(function (cat, ci) {
      var btn = document.createElement("button");
      btn.className = "category-btn";
      btn.addEventListener("click", function () { handleCategoryClick(ci); });

      var label = document.createTextNode(cat.name);
      btn.appendChild(label);

      // Add dot if any decks in this category are selected
      var hasSelected = cat.deckIndices.some(function (di) { return selectedDecks.has(di); });
      if (hasSelected) {
        var dot = document.createElement("span");
        dot.className = "cat-dot";
        btn.appendChild(dot);
      }

      if (openCategory === ci) {
        btn.classList.add("open");
      }

      categorySelector.appendChild(btn);
    });
  }

  function handleCategoryClick(ci) {
    var cat = categories[ci];

    // Single-deck category: toggle the deck directly
    if (cat.deckIndices.length === 1) {
      var di = cat.deckIndices[0];
      if (selectedDecks.has(di)) {
        if (selectedDecks.size <= 1) return;
        selectedDecks.delete(di);
        buildCards();
      } else {
        selectedDecks.add(di);
        buildCards(di);
      }
      // Close drawer if open
      openCategory = null;
      deckDrawer.classList.remove("open");
      deckSelector.innerHTML = "";
      renderCategoryButtons();
      buildCards();
      return;
    }

    // Multi-deck category: toggle drawer
    if (openCategory === ci) {
      openCategory = null;
      deckDrawer.classList.remove("open");
      deckSelector.innerHTML = "";
      renderCategoryButtons();
      return;
    }

    openCategory = ci;
    renderCategoryButtons();
    renderDeckButtons(cat.deckIndices);
    deckDrawer.classList.add("open");
  }

  function renderDeckButtons(indices) {
    deckSelector.innerHTML = "";
    indices.forEach(function (di) {
      var btn = document.createElement("button");
      btn.className = "deck-btn" + (selectedDecks.has(di) ? " active" : "");
      btn.textContent = decks[di].name;
      btn.addEventListener("click", function () { toggleDeck(di); });
      deckSelector.appendChild(btn);
    });
  }

  function toggleDeck(index) {
    if (selectedDecks.has(index)) {
      if (selectedDecks.size <= 1) return;
      selectedDecks.delete(index);
      updateDeckButtons();
      renderCategoryButtons();
      buildCards();
    } else {
      selectedDecks.add(index);
      updateDeckButtons();
      renderCategoryButtons();
      buildCards(index);
    }
  }

  function updateDeckButtons() {
    var btns = deckSelector.querySelectorAll(".deck-btn");
    // Map visible buttons to their deck indices from the open category
    if (openCategory === null) return;
    var indices = categories[openCategory].deckIndices;
    btns.forEach(function (b, i) {
      if (i < indices.length) {
        b.classList.toggle("active", selectedDecks.has(indices[i]));
      }
    });
  }

  function buildCards(lastAddedDeck) {
    var newDeckCards = [];
    var otherCards = [];
    decks.forEach(function (deck, i) {
      if (selectedDecks.has(i)) {
        var target = (lastAddedDeck !== undefined && i === lastAddedDeck) ? newDeckCards : otherCards;
        deck.cards.forEach(function (c) {
          target.push({ arabic: c.arabic, main: c.main, sub: c.sub });
        });
      }
    });
    // New deck cards come first
    currentCards = newDeckCards.concat(otherCards);
    if (isShuffled) {
      // Shuffle everything after the first card (keep first card from new deck)
      var start = newDeckCards.length > 0 ? 1 : 0;
      for (var i = currentCards.length - 1; i > start; i--) {
        var j = start + Math.floor(Math.random() * (i - start + 1));
        var temp = currentCards[i];
        currentCards[i] = currentCards[j];
        currentCards[j] = temp;
      }
    }
    currentCardIndex = 0;
    isFlipped = false;
    showCard();
  }

  function showCard() {
    if (currentCards.length === 0) {
      arabicText.textContent = "No cards";
      mainText.textContent = "";
      subText.textContent = "";
      cardCounter.textContent = "";
      return;
    }

    var card = currentCards[currentCardIndex];
    arabicText.textContent = card.arabic;
    mainText.textContent = card.main;
    subText.textContent = card.sub;
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
      mainText.textContent = card.main;
      subText.textContent = card.sub;
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
    isShuffled = true;
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