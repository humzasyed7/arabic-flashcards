# Arabic Flashcards

A minimal static flashcard site for studying Arabic vocabulary. Designed for ease of use.

## How to Use

1. Select a deck from the top buttons
2. Click the card or press **Space** to flip between Arabic and English
3. Use **← →** arrows (or the Prev/Next buttons) to navigate
4. Press **S** or click **Shuffle** to randomize the order

## Adding / Editing Flashcards

All content lives in **`flashcards.json`**. The structure is:

```json
{
  "decks": [
    {
      "name": "Deck Name",
      "cards": [
        { "arabic": "عَرَبِيّ", "english": "Arabic" }
      ]
    }
  ]
}
```

Add new decks or cards by editing that file. No build step required.

## Hosting on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to the branch (e.g. `main`) and folder (`/ (root)`)
4. The site will be live at `https://<username>.github.io/<repo-name>/`