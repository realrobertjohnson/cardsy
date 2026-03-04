# Cardsy

A Miro app that converts selected board objects into Cards in one click.

## What it does

Select any combination of shapes, text, sticky notes, mind map nodes, cards, or stencils on your Miro board, click the Cardsy icon, and the app generates a corresponding Card for each selected object — preserving colors and tags.

## Supported object types

- Shapes
- Text
- Sticky notes
- Mind map nodes
- Cards
- Stencils

## Development

**Requirements**

- Node.js 20.9.0+

**Install dependencies**

```bash
npm install
```

**Run locally**

```bash
npm start
```

The app runs at `http://localhost:4173`.

**Build for production**

```bash
npm run build
```

**Preview production build**

```bash
npm serve
```

## Deployment

This app is configured for deployment to Azure Static Web Apps. MIME types for `.json` and `.svg` are set in `staticwebapp.config.json`.

## Project structure

```
├── index.html
├── src/
│   ├── index.js          # Entry point, registers icon click handler
│   ├── generateCards.js  # Core logic for creating cards from selected objects
│   └── constants.js      # Color map for translating fill colors to card themes
├── staticwebapp.config.json
└── vite.config.js
```