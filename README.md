# DSA Vault ⚡

A modern, responsive web application for tracking Data Structures & Algorithms (DSA) questions and revision frequency ("encounters").

## 📁 Directory Structure

```
dsa-vault/
├── index.html                  # HTML entry page
├── package.json                # Dev dependencies & npm scripts
├── README.md                   # Documentation & sitemap
└── src/
    ├── css/                    # Modular CSS design system
    │   ├── main.css            # Central imports file
    │   ├── variables.css       # Design tokens (Dark/Light HSL colors & fonts)
    │   ├── base.css            # Base resets & layout shells
    │   ├── components.css      # Header, Toolbar, Cards Grid & Toasts
    │   └── drawer.css          # Settings Drawer, Form Controls & Stepper
    └── js/                     # ES Modules JavaScript
        ├── main.js             # Application bootstrap & lifecycle
        ├── config/
        │   └── constants.js    # LocalStorage keys & DSA category list
        ├── services/
        │   ├── storage.js      # Safe LocalStorage persistence driver
        │   └── state.js        # Reactive central state manager
        ├── utils/
        │   ├── dom.js          # Escaping, Toast alerts & Theme handlers
        │   └── helpers.js      # Title normalization & search/sort helpers
        └── components/
            ├── grid.js         # Cards rendering & grid action handlers
            ├── toolbar.js      # Filter & search event management
            └── drawer.js       # Drawer stepper & settings form controller
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Dev Server (Vite)
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

## ✨ Key Features
- **Smart Duplicate Prevention**: Adding a question title that already exists automatically increments its encounter count.
- **Search & Multi-level Filter**: Live title search, category filter (10 topics), and 4 sorting methods.
- **Dark & Light Themes**: Accessible theme switcher powered by CSS Custom Properties.
- **Count Control Toggle**: Optional decrease (`−`) counter button toggle.
- **LocalStorage Sync**: Persistent state stored locally in your browser.
