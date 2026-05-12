
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>StackDify — Redesigned Graph UI Prototype</title>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  :root {
    --canvas-bg: #1c1c1e;
    --canvas-grid: rgba(255,255,255,0.03);
    --card-bg: #27272a;
    --card-bg-hover: #2e2e32;
    --card-border: #3f3f46;
    --card-stripe-opacity: 1;
    --slot-bg: rgba(249,115,22,0.06);
    --slot-border: #fb923c;
    --slot-border-dash: 3 3;
    --text-primary: #fafafa;
    --text-secondary: #a1a1aa;
    --text-tertiary: #71717a;
    --accent: #00ffa3;
    --accent-dim: rgba(0,255,163,0.12);
    --accent-text: #000;
    --correct: #00ffa3;
    --incorrect: #f87171;
    --sidebar-bg: #141414;
    --sidebar-border: #2a2a2a;
    --overlay-bg: rgba(0,0,0,0.7);
    --node-radius: 12px;
    --node-border: 2px;
    --edge-stroke: 2.5px;
    --font-display: Inter, -apple-system, system-ui, sans-serif;
    --font-body: Inter, -apple-system, system-ui, sans-serif;
    --font-mono: 'SF Mono', 'SFMono-Regular', Consolas, monospace;
    --node-shadow: 0 4px 16px rgba(0,0,0,0.3);
    --node-glow: 0 0 24px rgba(0,255,163,0.15);
    --badge-radius: 6px;
    --panel-radius: 14px;
    --navbar-bg: rgba(20,20,20,0.85);
    --navbar-border: var(--sidebar-border);
  }

  [data-tone="warm"] {
    --canvas-bg: #f7f4ef;
    --canvas-grid: rgba(0,0,0,0.04);
    --card-bg: #ffffff;
    --card-bg-hover: #faf8f5;
    --card-border: #e7e0d5;
    --card-stripe-opacity: 0.9;
    --slot-bg: rgba(249,115,22,0.06);
    --slot-border: #d97706;
    --slot-border-dash: 3 3;
    --text-primary: #1c1917;
    --text-secondary: #78716c;
    --text-tertiary: #a8a29e;
    --accent: #d97706;
    --accent-dim: rgba(217,119,6,0.1);
    --accent-text: #fff;
    --correct: #16a34a;
    --incorrect: #dc2626;
    --sidebar-bg: #f0ebe3;
    --sidebar-border: #d6cfc4;
    --overlay-bg: rgba(255,255,255,0.8);
    --node-radius: 14px;
    --node-border: 2px;
    --edge-stroke: 2.5px;
    --font-display: 'Iowan Old Style', Georgia, serif;
    --font-body: Inter, -apple-system, system-ui, sans-serif;
    --node-shadow: 0 2px 12px rgba(0,0,0,0.08);
    --node-glow: 0 0 20px rgba(217,119,6,0.1);
    --badge-radius: 8px;
    --panel-radius: 16px;
    --navbar-bg: rgba(240,235,227,0.9);
    --navbar-border: var(--sidebar-border);
  }

  [data-tone="blueprint"] {
    --canvas-bg: #0a1628;
    --canvas-grid: rgba(34,211,238,0.06);
    --card-bg: #0f1f38;
    --card-bg-hover: #142744;
    --card-border: #1e3a5f;
    --card-stripe-opacity: 1;
    --slot-bg: rgba(34,211,238,0.05);
    --slot-border: #22d3ee;
    --slot-border-dash: 8 4;
    --text-primary: #e2e8f0;
    --text-secondary: #64748b;
    --text-tertiary: #475569;
    --accent: #22d3ee;
    --accent-dim: rgba(34,211,238,0.1);
    --accent-text: #0a1628;
    --correct: #22d3ee;
    --incorrect: #f87171;
    --sidebar-bg: #070f1d;
    --sidebar-border: #1e3a5f;
    --overlay-bg: rgba(10,22,40,0.85);
    --node-radius: 4px;
    --node-border: 1.5px;
    --edge-stroke: 2px;
    --font-display: 'SF Mono', 'SFMono-Regular', Consolas, monospace;
    --font-body: 'SF Mono', 'SFMono-Regular', Consolas, monospace;
    --node-shadow: 0 0 0 1px rgba(34,211,238,0.15);
    --node-glow: 0 0 30px rgba(34,211,238,0.1);
    --badge-radius: 2px;
    --panel-radius: 2px;
    --navbar-bg: rgba(7,15,29,0.92);
    --navbar-border: var(--sidebar-border);
  }

  body {
    font-family: var(--font-body);
    background: var(--canvas-bg);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    height: 100vh;
  }

  #root { height: 100vh; display: flex; flex-direction: column; }

  .navbar {
    height: 52px; display: flex; align-items: center; gap: 0;
    padding: 0 20px; border-bottom: 1px solid var(--navbar-border);
    background: var(--navbar-bg); backdrop-filter: blur(12px);
    flex-shrink: 0; z-index: 50; position: sticky; top: 0;
  }
  .nav-brand {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; margin-right: 32px;
  }
  .nav-brand svg { width: 28px; height: 28px; flex-shrink: 0; }
  .nav-brand-text {
    font-family: var(--font-display); font-weight: 800; font-size: 16px;
    color: var(--text-primary); letter-spacing: -0.02em;
  }
  .nav-links { display: flex; gap: 4px; flex: 1; }
  .nav-link {
    padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    color: var(--text-secondary); text-decoration: none;
    transition: all 150ms; cursor: pointer;
    background: transparent; border: none;
  }
  .nav-link:hover { color: var(--text-primary); background: var(--accent-dim); }
  .nav-link.active { color: var(--accent); background: var(--accent-dim); font-weight: 600; }
  .nav-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
  .nav-streak {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 99px;
    background: var(--accent-dim); font-size: 12px; font-weight: 700;
    color: var(--accent);
  }
  .nav-streak svg { width: 14px; height: 14px; }
  .nav-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--card-bg); border: 2px solid var(--card-border);
    display: grid; place-items: center; font-size: 13px; font-weight: 700;
    color: var(--text-secondary); cursor: pointer; transition: border-color 150ms;
  }
  .nav-avatar:hover { border-color: var(--accent); }

  .game-header {
    height: 46px; display: flex; align-items: center; gap: 12px;
    padding: 0 16px; border-bottom: 1px solid var(--sidebar-border);
    background: var(--sidebar-bg); flex-shrink: 0; z-index: 10;
  }
  .breadcrumbs {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--text-tertiary);
  }
  .breadcrumb-sep { font-size: 10px; opacity: 0.5; }
  .breadcrumb-link {
    color: var(--text-secondary); text-decoration: none;
    cursor: pointer; transition: color 100ms;
  }
  .breadcrumb-link:hover { color: var(--text-primary); }
  .breadcrumb-current { color: var(--text-primary); font-weight: 600; }

  .progress-dots {
    display: flex; align-items: center; gap: 6px;
    margin-left: 20px;
  }
  .progress-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--card-border); transition: all 300ms;
  }
  .progress-dot.done { background: var(--correct); }
  .progress-dot.active { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }

  .game-header-spacer { flex: 1; }

  .header-stat {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 600; color: var(--text-secondary);
    padding: 4px 10px; border-radius: 6px;
    background: var(--card-bg);
  }
  .header-stat svg { width: 14px; height: 14px; color: var(--text-tertiary); }
  .header-stat.accent svg { color: var(--accent); }

  .header-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 8px; border: 1px solid var(--card-border);
    background: var(--card-bg); color: var(--text-secondary);
    font-family: var(--font-body); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 150ms;
  }
  .header-btn:hover { border-color: var(--text-tertiary); color: var(--text-primary); }
  .header-btn svg { width: 14px; height: 14px; }
  .header-btn-primary {
    background: var(--accent); color: var(--accent-text);
    border-color: transparent;
  }
  .header-btn-primary:hover { opacity: 0.9; }
  .header-btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }

  .main-layout { display: flex; flex: 1; min-height: 0; }

  .sidebar {
    width: 320px; flex-shrink: 0; background: var(--sidebar-bg);
    border-right: 1px solid var(--sidebar-border); display: flex; flex-direction: column;
    overflow: hidden;
  }
  .sidebar-top-tabs {
    display: flex; border-bottom: 1px solid var(--sidebar-border);
  }
  .sidebar-top-tab {
    flex: 1; padding: 10px 0; text-align: center;
    font-size: 12px; font-weight: 600; cursor: pointer;
    color: var(--text-tertiary); background: transparent;
    border: none; border-bottom: 2px solid transparent;
    transition: all 150ms;
  }
  .sidebar-top-tab:hover { color: var(--text-secondary); }
  .sidebar-top-tab.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent);
  }

  .sidebar-section { padding: 16px; border-bottom: 1px solid var(--sidebar-border); }
  .sidebar-section-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-tertiary); margin-bottom: 10px;
  }

  .sidebar-sub-tabs {
    display: flex; gap: 2px; padding: 12px 16px 0;
    background: var(--sidebar-bg);
  }
  .sidebar-sub-tab {
    padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;
    border: none; cursor: pointer; transition: all 150ms;
    color: var(--text-tertiary); background: transparent;
  }
  .sidebar-sub-tab:hover { color: var(--text-secondary); }
  .sidebar-sub-tab.active { background: var(--accent-dim); color: var(--accent); }

  .comp-search-wrap { padding: 0 16px 12px; }
  .comp-search {
    width: 100%; padding: 7px 10px 7px 32px; border-radius: 8px;
    border: 1px solid var(--card-border); background: var(--card-bg);
    color: var(--text-primary); font-family: var(--font-body);
    font-size: 12px; outline: none; transition: border-color 150ms;
  }
  .comp-search::placeholder { color: var(--text-tertiary); }
  .comp-search:focus { border-color: var(--accent); }
  .comp-search-icon {
    position: absolute; left: 26px; top: 50%; transform: translateY(-50%);
    width: 14px; height: 14px; color: var(--text-tertiary); pointer-events: none;
  }

  .req-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 8px 10px; border-radius: 8px; cursor: pointer;
    transition: background 150ms; margin-bottom: 4px;
  }
  .req-item:hover { background: var(--card-bg); }
  .req-item.active { background: var(--accent-dim); }
  .req-badge {
    width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
    font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
    background: var(--card-bg); color: var(--text-secondary);
  }
  .req-item.active .req-badge { background: var(--accent); color: var(--accent-text); }
  .req-item.completed .req-badge { background: var(--correct); color: var(--accent-text); }
  .req-title { font-size: 13px; font-weight: 600; line-height: 1.3; }
  .req-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin-top: 2px; }

  .progress-bar {
    height: 4px; border-radius: 2px; background: var(--card-border); overflow: hidden; margin-top: 8px;
  }
  .progress-fill { height: 100%; border-radius: 2px; background: var(--accent); transition: width 500ms ease; }

  .comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .comp-item {
    display: flex; align-items: center; gap: 8px; padding: 7px 10px;
    border-radius: 8px; background: var(--card-bg); cursor: pointer;
    transition: all 150ms; border: 1px solid transparent; font-size: 12px;
    font-weight: 500;
  }
  .comp-item:hover { border-color: var(--card-border); background: var(--card-bg-hover); }
  .comp-item.placed { opacity: 0.4; pointer-events: none; }
  .comp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  .canvas-wrap {
    flex: 1; position: relative; overflow: hidden;
    background: var(--canvas-bg);
    background-image:
      linear-gradient(var(--canvas-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--canvas-grid) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .canvas-inner {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .graph-area { position: relative; width: 820px; height: 500px; }

  .canvas-toolbar {
    position: absolute; top: 12px; left: 12px; z-index: 15;
    display: flex; align-items: center; gap: 2px;
    padding: 4px; border-radius: 10px;
    background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }
  .toolbar-btn {
    width: 32px; height: 32px; border-radius: 7px; border: none;
    background: transparent; color: var(--text-secondary);
    display: grid; place-items: center; cursor: pointer;
    transition: all 150ms; position: relative;
  }
  .toolbar-btn:hover { background: var(--card-bg); color: var(--text-primary); }
  .toolbar-btn.active { background: var(--accent-dim); color: var(--accent); }
  .toolbar-btn svg { width: 16px; height: 16px; }
  .toolbar-sep { width: 1px; height: 20px; background: var(--sidebar-border); margin: 0 2px; }
  .toolbar-btn[title]::after {
    content: attr(title); position: absolute; bottom: -28px; left: 50%;
    transform: translateX(-50%); padding: 3px 8px; border-radius: 4px;
    background: var(--card-bg); border: 1px solid var(--card-border);
    font-size: 10px; font-weight: 500; color: var(--text-secondary);
    white-space: nowrap; pointer-events: none; opacity: 0;
    transition: opacity 150ms;
  }
  .toolbar-btn:hover[title]::after { opacity: 1; }

  .edge-svg {
    position: absolute; top: -40px; left: -40px;
    width: calc(100% + 80px); height: calc(100% + 80px);
    pointer-events: none; z-index: 1;
  }

  .graph-node {
    position: absolute; width: 134px; z-index: 2;
    background: var(--card-bg); border: var(--node-border) solid var(--card-border);
    border-radius: var(--node-radius); box-shadow: var(--node-shadow);
    transition: all 200ms ease; cursor: default; user-select: none;
    overflow: hidden;
  }
  .graph-node:hover { box-shadow: var(--node-glow); transform: translateY(-1px); }
  .graph-node.selected { border-color: var(--accent); box-shadow: var(--node-glow); }
  .graph-node.glow-active {
    box-shadow: 0 0 0 2px var(--accent), var(--node-glow);
    animation: glow-pulse 1.5s ease-in-out infinite;
  }
  @keyframes glow-pulse {
    0%,100% { box-shadow: 0 0 0 2px var(--accent), 0 0 16px rgba(0,255,163,0.1); }
    50% { box-shadow: 0 0 0 3px var(--accent), 0 0 28px rgba(0,255,163,0.25); }
  }

  .node-stripe { height: 3px; width: 100%; opacity: var(--card-stripe-opacity); }
  .node-body { padding: 12px 12px 10px; text-align: center; }
  .node-icon-wrap {
    width: 38px; height: 38px; border-radius: 8px; margin: 0 auto 8px;
    display: grid; place-items: center;
  }
  .node-icon-wrap svg { width: 20px; height: 20px; }
  .node-label { font-size: 12px; font-weight: 700; line-height: 1.2; color: var(--text-primary); }
  .node-category {
    font-size: 9px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--text-tertiary); margin-top: 3px;
  }

  .graph-node.slot {
    background: var(--slot-bg); border-style: dashed;
    border-color: var(--slot-border); border-width: var(--node-border);
    border-radius: var(--node-radius); cursor: pointer;
    animation: slot-pulse 2s ease-in-out infinite;
  }
  .graph-node.slot:hover { background: rgba(249,115,22,0.12); }
  .graph-node.slot.filled { border-style: solid; animation: none; border-color: var(--card-border); }
  .graph-node.slot.correct { border-color: var(--correct); }
  .graph-node.slot.incorrect { border-color: var(--incorrect); }

  .slot-plus {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--slot-border); opacity: 0.2; margin: 0 auto 8px;
    display: grid; place-items: center;
  }
  .slot-plus svg { width: 16px; height: 16px; stroke: var(--text-primary); }
  .slot-counter {
    font-size: 9px; font-weight: 700; color: var(--slot-border);
    margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em;
  }

  .node-status-badge {
    position: absolute; top: -6px; right: -6px; width: 18px; height: 18px;
    border-radius: 50%; display: grid; place-items: center; z-index: 3;
    font-size: 10px; font-weight: 800;
  }
  .node-status-badge.correct { background: var(--correct); color: #000; }
  .node-status-badge.incorrect { background: var(--incorrect); color: #fff; }

  .node-ports { display: flex; justify-content: center; gap: 3px; padding: 0 12px 8px; margin-top: 4px; }
  .node-port {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--card-border); transition: background 150ms;
  }
  .node-port.connected { background: var(--accent); }

  .edge-path { fill: none; stroke-width: var(--edge-stroke); transition: stroke 200ms, opacity 200ms; }
  .edge-label-pill {
    font-family: var(--font-body); font-size: 9px; font-weight: 600;
    padding: 2px 8px; border-radius: 99px;
    background: var(--canvas-bg); border: 1px solid var(--card-border);
    color: var(--text-secondary); white-space: nowrap; pointer-events: none;
  }

  @keyframes slot-pulse { 0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 0 6px rgba(249,115,22,0.15)} }
  @keyframes dash-flow { to { stroke-dashoffset: -24; } }
  @keyframes score-reveal { 0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1} }
  @keyframes check-pop { 0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)} }

  .overlay {
    position: absolute; inset: 0; background: var(--overlay-bg);
    display: flex; align-items: center; justify-content: center; z-index: 20;
    backdrop-filter: blur(8px);
  }
  .results-card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: var(--panel-radius); padding: 32px; width: 420px;
    animation: score-reveal 300ms ease-out;
  }
  .results-score {
    font-family: var(--font-display); font-size: 72px; font-weight: 800;
    color: var(--correct); text-align: center; line-height: 1;
  }
  .results-label {
    font-size: 12px; font-weight: 600; color: var(--text-secondary);
    text-align: center; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px;
  }
  .results-breakdown { margin-top: 24px; }
  .results-slot {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; margin-bottom: 6px; background: var(--canvas-bg);
  }
  .results-slot-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: grid; place-items: center; font-size: 12px; font-weight: 800;
  }
  .results-slot-icon.correct { background: var(--correct); color: #000; }
  .results-slot-icon.incorrect { background: var(--incorrect); color: #fff; }
  .results-slot-name { font-size: 13px; font-weight: 600; flex: 1; }
  .results-slot-status { font-size: 11px; font-weight: 600; }

  .detail-panel {
    position: absolute; right: 0; top: 0; bottom: 0; width: 340px;
    background: var(--sidebar-bg); border-left: 1px solid var(--sidebar-border);
    z-index: 15; padding: 24px; overflow-y: auto;
    animation: slide-in 200ms ease-out;
  }
  @keyframes slide-in { from{transform:translateX(100%)}to{transform:translateX(0)} }
  .detail-category {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; padding: 3px 8px; border-radius: 4px;
    display: inline-block; margin-bottom: 12px;
  }
  .detail-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .detail-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
  .detail-section-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-tertiary); margin-bottom: 8px;
  }
  .detail-connection {
    display: flex; align-items: center; gap: 8px; padding: 6px 8px;
    border-radius: 6px; background: var(--card-bg); margin-bottom: 4px; font-size: 12px;
  }
  .detail-conn-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  .tweaks-panel {
    position: absolute; bottom: 16px; right: 16px; z-index: 25;
    background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
    border-radius: var(--panel-radius); padding: 16px; width: 260px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  .tweaks-title {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-tertiary); margin-bottom: 12px;
  }
  .tweak-tone-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 14px; }
  .tweak-tone-card {
    padding: 10px 6px; border-radius: 8px; border: 2px solid var(--card-border);
    cursor: pointer; text-align: center; transition: all 150ms; background: var(--card-bg);
  }
  .tweak-tone-card:hover { border-color: var(--text-tertiary); }
  .tweak-tone-card.active { border-color: var(--accent); }
  .tweak-tone-preview {
    width: 32px; height: 24px; border-radius: 4px; margin: 0 auto 6px;
    border: 1px solid var(--card-border);
  }
  .tweak-tone-label { font-size: 9px; font-weight: 600; color: var(--text-secondary); }
  .tweak-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
  .tweak-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
  .tweak-toggle {
    width: 36px; height: 20px; border-radius: 10px; border: none;
    cursor: pointer; position: relative; transition: background 200ms;
    background: var(--card-border);
  }
  .tweak-toggle.on { background: var(--accent); }
  .tweak-toggle::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px; border-radius: 50%; background: #fff;
    transition: transform 200ms;
  }
  .tweak-toggle.on::after { transform: translateX(16px); }

  .hint-bar {
    position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
    z-index: 10; padding: 6px 16px; border-radius: 99px;
    background: var(--accent-dim); border: 1px solid var(--accent);
    font-size: 12px; font-weight: 600; color: var(--accent);
    transition: opacity 200ms; white-space: nowrap;
  }

  .minimap {
    position: absolute; bottom: 16px; left: 12px; z-index: 15;
    width: 160px; height: 100px; border-radius: 8px;
    background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2); overflow: hidden;
    transition: opacity 200ms, transform 200ms;
  }
  .minimap.hidden { opacity: 0; transform: translateY(8px); pointer-events: none; }
  .minimap svg { width: 100%; height: 100%; }
  .minimap-viewport {
    fill: none; stroke: var(--accent); stroke-width: 1.5;
    rx: 2; opacity: 0.6;
  }
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">

const CATEGORIES = {
  networking: { label: 'Networking', color: '#3b82f6', soft: 'rgba(59,130,246,0.12)' },
  compute:    { label: 'Compute',    color: '#4f46e5', soft: 'rgba(79,70,229,0.12)' },
  storage:    { label: 'Storage',    color: '#10b981', soft: 'rgba(16,185,129,0.12)' },
  async:      { label: 'Async',      color: '#f97316', soft: 'rgba(249,115,22,0.12)' },
  security:   { label: 'Security',   color: '#ef4444', soft: 'rgba(239,68,68,0.12)' },
  actor:      { label: 'Actor',      color: '#00ffa3', soft: 'rgba(0,255,163,0.12)' },
};

const NODE_W = 134;
const NODE_H = 110;
const NODES = [
  { id: 'client',   type: 'actor',      label: 'Client',          cat: 'actor',      x: 35,  y: 155, fixed: true,  desc: 'End user making HTTP requests to the URL shortener service.' },
  { id: 'lb',       type: 'component',  label: 'Load Balancer',   cat: 'networking', x: 225, y: 155, fixed: true,  desc: 'Distributes incoming traffic across multiple app server instances.' },
  { id: 'app',      type: 'component',  label: 'App Server',      cat: 'compute',    x: 415, y: 155, fixed: true,  desc: 'Core application logic: URL generation, redirection, and validation.' },
  { id: 'db',       type: 'slot',       label: 'Database',        cat: 'storage',    x: 620, y: 80,  fixed: false, slotIdx: 1, hint: 'Persistent storage for URL mappings', answer: 'relational-db' },
  { id: 'cache',    type: 'slot',       label: 'Cache',           cat: 'storage',    x: 620, y: 260, fixed: false, slotIdx: 2, hint: 'Fast lookup for hot URLs', answer: 'cache' },
  { id: 'mq',       type: 'slot',       label: 'Message Queue',   cat: 'async',      x: 415, y: 370, fixed: false, slotIdx: 3, hint: 'Async processing for analytics events', answer: 'message-queue' },
  { id: 'analytics', type: 'component', label: 'Analytics Svc',   cat: 'compute',    x: 225, y: 370, fixed: true,  desc: 'Processes click events and generates usage statistics.' },
  { id: 'datalake', type: 'component',  label: 'Data Lake',       cat: 'storage',    x: 35,  y: 370, fixed: true,  desc: 'Long-term storage of raw analytics data and logs.' },
];

const EDGES = [
  { from: 'client', to: 'lb',       kind: 'request',  label: 'HTTP' },
  { from: 'lb',     to: 'app',      kind: 'request',  label: 'Route' },
  { from: 'app',    to: 'db',       kind: 'request',  label: 'Read/Write' },
  { from: 'app',    to: 'cache',    kind: 'cache',    label: 'Lookup' },
  { from: 'app',    to: 'mq',       kind: 'async',    label: 'Events' },
  { from: 'mq',     to: 'analytics',kind: 'async',    label: 'Consume' },
  { from: 'analytics', to: 'datalake', kind: 'request', label: 'Store' },
];

const EDGE_STYLES = {
  request:   { stroke: '#64748b', dash: '',          color: '#64748b' },
  streaming: { stroke: '#3b82f6', dash: '9 7',       color: '#3b82f6' },
  async:     { stroke: '#f97316', dash: '3 6',       color: '#f97316' },
  cache:     { stroke: '#10b981', dash: '7 4',       color: '#10b981' },
};

const PALETTE = [
  { slug: 'relational-db', label: 'SQL Database', cat: 'storage' },
  { slug: 'nosql-db',      label: 'NoSQL Database', cat: 'storage' },
  { slug: 'cache',         label: 'Cache', cat: 'storage' },
  { slug: 'message-queue', label: 'Message Queue', cat: 'async' },
  { slug: 'cdn',           label: 'CDN', cat: 'networking' },
  { slug: 'load-balancer', label: 'Load Balancer', cat: 'networking' },
  { slug: 'app-server',    label: 'App Server', cat: 'compute' },
  { slug: 'api-gateway',   label: 'API Gateway', cat: 'networking' },
];

const REQUIREMENTS = [
  { order: 1, title: 'Core URL Flow', desc: 'Set up the basic request path: client through load balancer to the app server.', done: true },
  { order: 2, title: 'Data Persistence', desc: 'Add storage for URL mappings and a cache layer for hot lookups.', done: false, active: true },
  { order: 3, title: 'Analytics Pipeline', desc: 'Route click events through async processing to the data lake.', done: false },
];

function IconActor() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="6" r="3.5"/><path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7"/></svg>;
}
function IconNetworking() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="7"/><ellipse cx="10" cy="10" rx="3" ry="7"/><path d="M3 10h14"/></svg>;
}
function IconCompute() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="14" height="8" rx="1.5"/><path d="M6 15h8M10 12v3"/></svg>;
}
function IconStorage() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="10" cy="6" rx="7" ry="3"/><path d="M3 6v8c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M3 10c0 1.66 3.13 3 7 3s7-1.34 7-3"/></svg>;
}
function IconAsync() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="14" height="4" rx="1"/><rect x="3" y="9" width="14" height="4" rx="1"/><path d="M15 5h1M15 11h1"/></svg>;
}
function IconSecurity() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2L3 5.5V10c0 4.42 2.95 8.14 7 9.5 4.05-1.36 7-5.08 7-9.5V5.5L10 2z"/><path d="M7.5 10l2 2 3.5-3.5"/></svg>;
}
const ICONS = { actor: IconActor, networking: IconNetworking, compute: IconCompute, storage: IconStorage, async: IconAsync, security: IconSecurity };

function getEdgeSides(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? { fromSide: 'right', toSide: 'left' } : { fromSide: 'left', toSide: 'right' };
  return dy > 0 ? { fromSide: 'bottom', toSide: 'top' } : { fromSide: 'top', toSide: 'bottom' };
}
function getPortPos(node, side) {
  switch (side) {
    case 'right':  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
    case 'left':   return { x: node.x, y: node.y + NODE_H / 2 };
    case 'bottom': return { x: node.x + NODE_W / 2, y: node.y + NODE_H };
    case 'top':    return { x: node.x + NODE_W / 2, y: node.y };
  }
}
function ArrowMarkers() {
  return (
    <defs>
      {Object.entries(EDGE_STYLES).map(([kind, s]) => (
        <marker key={kind} id={`arrow-${kind}`} viewBox="0 0 12 12"
          markerWidth="10" markerHeight="10" refX="10" refY="6"
          orient="auto" markerUnits="userSpaceOnUse">
          <path d="M2,2 L10,6 L2,10" stroke={s.color} strokeWidth="2"
            fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      ))}
    </defs>
  );
}

function Navbar() {
  return (
    <nav className="navbar">
      <a className="nav-brand" href="#">
        <svg viewBox="0 0 28 28" fill="none">
          <path d="M14 2L3 8.5V19.5L14 26L25 19.5V8.5L14 2Z" fill="var(--accent)" opacity="0.15"/>
          <path d="M14 2L3 8.5V19.5L14 26L25 19.5V8.5L14 2Z" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M14 9L10 11.5V16.5L14 19L18 16.5V11.5L14 9Z" fill="var(--accent)" opacity="0.4"/>
        </svg>
        <span className="nav-brand-text">StackDify</span>
      </a>
      <div className="nav-links">
        <button className="nav-link active">Problems</button>
        <button className="nav-link">Leaderboard</button>
        <button className="nav-link">Dashboard</button>
      </div>
      <div className="nav-right">
        <div className="nav-streak">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1C8 1 3 6 3 10a5 5 0 0010 0C13 6 8 1 8 1z"/></svg>
          3
        </div>
        <div className="nav-avatar" title="Profile">D</div>
      </div>
    </nav>
  );
}

function GameHeader({ slots, allFilled, onSubmit, showResults }) {
  const filledCount = Object.values(slots).filter(Boolean).length;
  const [time, setTime] = React.useState(247);
  React.useEffect(() => {
    if (showResults) return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [showResults]);
  const mm = String(Math.floor(time / 60)).padStart(2, '0');
  const ss = String(time % 60).padStart(2, '0');
  return (
    <div className="game-header">
      <div className="breadcrumbs">
        <span className="breadcrumb-link">StackDify</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-link">Problems</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">URL Shortener</span>
      </div>
      <div className="progress-dots">
        {REQUIREMENTS.map((r, i) => (
          <div key={i} className={`progress-dot${r.done ? ' done' : ''}${r.active ? ' active' : ''}`} />
        ))}
      </div>
      <div className="game-header-spacer" />
      <div className="header-stat accent">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 4v4l2.5 1.5"/></svg>
        {mm}:{ss}
      </div>
      <div className="header-stat">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 8h4M5 10h5"/></svg>
        {filledCount}/3 slots
      </div>
      <button className="header-btn">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M1 15c0-3.87 3.13-7 7-7s7 3.13 7 7"/></svg>
        Share
      </button>
      <button className="header-btn header-btn-primary" disabled={!allFilled} onClick={onSubmit}>
        Submit
      </button>
    </div>
  );
}

function CanvasToolbar({ animateEdges, onToggleAnimate, showLabels, onToggleLabels, showMinimap, onToggleMinimap, glowMode, onToggleGlow }) {
  return (
    <div className="canvas-toolbar">
      <button className="toolbar-btn" title="Auto layout">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h12M8 2v12"/><circle cx="8" cy="8" r="2"/></svg>
      </button>
      <button className="toolbar-btn" title="Fit to view">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 2v12M11 2v12M2 5h12M2 11h12"/></svg>
      </button>
      <div className="toolbar-sep" />
      <button className={`toolbar-btn${showMinimap ? ' active' : ''}`} title="Minimap" onClick={onToggleMinimap}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="14" rx="2"/><rect x="4" y="4" width="5" height="3" rx="0.5"/><rect x="4" y="9" width="8" height="3" rx="0.5"/></svg>
      </button>
      <button className="toolbar-btn" title="Snap to grid">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5.5h14M1 10.5h14M5.5 1v14M10.5 1v14"/></svg>
      </button>
      <div className="toolbar-sep" />
      <button className={`toolbar-btn${animateEdges ? ' active' : ''}`} title="Simulation" onClick={onToggleAnimate}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="4,2 14,8 4,14"/></svg>
      </button>
      <button className={`toolbar-btn${glowMode ? ' active' : ''}`} title="Glow mode" onClick={onToggleGlow}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 10l-3.5 2.5 1.5-4.5L2.5 5.5h4.5z"/></svg>
      </button>
      <div className="toolbar-sep" />
      <button className={`toolbar-btn${showLabels ? ' active' : ''}`} title="Edge labels" onClick={onToggleLabels}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8h14"/><rect x="5" y="5" width="6" height="6" rx="1"/></svg>
      </button>
    </div>
  );
}

function Minimap({ visible, nodes, edges }) {
  if (!visible) return null;
  const scaleX = 160 / 820, scaleY = 100 / 500;
  const s = Math.min(scaleX, scaleY) * 0.85;
  const ox = (160 - 820 * s) / 2, oy = (100 - 500 * s) / 2;
  return (
    <div className="minimap">
      <svg viewBox="0 0 160 100">
        {edges.map((e, i) => {
          const from = nodes.find(n => n.id === e.from), to = nodes.find(n => n.id === e.to);
          if (!from || !to) return null;
          const style = EDGE_STYLES[e.kind] || EDGE_STYLES.request;
          return <line key={i} x1={(from.x+NODE_W/2)*s+ox} y1={(from.y+NODE_H/2)*s+oy} x2={(to.x+NODE_W/2)*s+ox} y2={(to.y+NODE_H/2)*s+oy} stroke={style.color} strokeWidth="1" opacity="0.5"/>;
        })}
        {nodes.map(n => {
          const cat = CATEGORIES[n.cat];
          return <rect key={n.id} x={n.x*s+ox} y={n.y*s+oy} width={NODE_W*s} height={NODE_H*s} rx="2" fill={cat.color} opacity={n.type==='slot'?0.25:0.45}/>;
        })}
        <rect className="minimap-viewport" x={ox-2} y={oy-2} width={820*s+4} height={500*s+4} />
      </svg>
    </div>
  );
}

function Sidebar({ slots, selectedSlot, onSelectSlot, onComponentClick, placedSlugs, compSearch, onCompSearch }) {
  const [topTab, setTopTab] = React.useState('description');
  const [subTab, setSubTab] = React.useState('requirements');
  const filteredPalette = PALETTE.filter(c => c.label.toLowerCase().includes((compSearch||'').toLowerCase()));
  return (
    <aside className="sidebar">
      <div className="sidebar-top-tabs">
        <button className={`sidebar-top-tab${topTab==='description'?' active':''}`} onClick={()=>setTopTab('description')}>Description</button>
        <button className={`sidebar-top-tab${topTab==='submissions'?' active':''}`} onClick={()=>setTopTab('submissions')}>Submissions</button>
      </div>
      {topTab === 'description' && (
        <>
          <div className="sidebar-section">
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,background:CATEGORIES.async.soft,color:CATEGORIES.async.color}}>MEDIUM</span>
              <span style={{fontSize:11,color:'var(--text-tertiary)'}}>System Design</span>
            </div>
            <div style={{fontFamily:'var(--font-display)',fontSize:17,fontWeight:700,lineHeight:1.3}}>Design a URL Shortener</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:6,lineHeight:1.5}}>
              Build a scalable URL shortening service that handles redirect traffic, caches hot URLs, and processes analytics.
            </div>
          </div>
          <div className="sidebar-sub-tabs">
            <button className={`sidebar-sub-tab${subTab==='requirements'?' active':''}`} onClick={()=>setSubTab('requirements')}>Requirements</button>
            <button className={`sidebar-sub-tab${subTab==='components'?' active':''}`} onClick={()=>setSubTab('components')}>Components</button>
          </div>
          {subTab === 'requirements' && (
            <div className="sidebar-section" style={{flex:1,overflow:'auto'}}>
              {REQUIREMENTS.map(req => (
                <div key={req.order} className={`req-item${req.active?' active':''}${req.done?' completed':''}`}>
                  <div className="req-badge">{req.done?'\u2713':req.order}</div>
                  <div>
                    <div className="req-title">{req.title}</div>
                    <div className="req-desc">{req.desc}</div>
                  </div>
                </div>
              ))}
              <div className="progress-bar" style={{marginTop:12}}>
                <div className="progress-fill" style={{width:'33%'}}/>
              </div>
              <div style={{fontSize:10,color:'var(--text-tertiary)',marginTop:4,textAlign:'right'}}>1/3 complete</div>
            </div>
          )}
          {subTab === 'components' && (
            <div className="sidebar-section" style={{flex:1,overflow:'auto'}}>
              <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:10}}>
                {selectedSlot ? 'Pick a component for the selected slot:' : 'Click an empty slot on the canvas to begin'}
              </div>
              <div className="comp-grid">
                {PALETTE.map(comp => {
                  const catInfo = CATEGORIES[comp.cat]; const isPlaced = placedSlugs.has(comp.slug);
                  return (
                    <div key={comp.slug} className={`comp-item${isPlaced?' placed':''}`}
                      onClick={selectedSlot&&!isPlaced?()=>onComponentClick(comp.slug):undefined}
                      style={selectedSlot&&!isPlaced?{cursor:'pointer'}:undefined}>
                      <div className="comp-dot" style={{background:catInfo.color}}/>{comp.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {topTab === 'submissions' && (
        <div className="sidebar-section" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{textAlign:'center',color:'var(--text-tertiary)',fontSize:13}}>
            <div style={{fontSize:28,marginBottom:8,opacity:0.3}}>&#128203;</div>
            No submissions yet.<br/>Submit your answer to see results here.
          </div>
        </div>
      )}
      <div className="sidebar-section" style={{borderTop:'1px solid var(--sidebar-border)',borderBottom:'none'}}>
        <div className="sidebar-section-title">Quick Components</div>
        <div className="comp-search-wrap" style={{position:'relative',padding:0,marginBottom:8}}>
          <svg className="comp-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input className="comp-search" placeholder="Search components..." value={compSearch} onChange={e=>onCompSearch(e.target.value)}/>
        </div>
        <div className="comp-grid">
          {filteredPalette.slice(0,6).map(comp => {
            const catInfo = CATEGORIES[comp.cat]; const isPlaced = placedSlugs.has(comp.slug);
            return (
              <div key={comp.slug} className={`comp-item${isPlaced?' placed':''}`}
                onClick={selectedSlot&&!isPlaced?()=>onComponentClick(comp.slug):undefined}
                style={selectedSlot&&!isPlaced?{cursor:'pointer'}:undefined}>
                <div className="comp-dot" style={{background:catInfo.color}}/>{comp.label}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function ResultsOverlay({ slots, onClose }) {
  const correct = {db:'relational-db',cache:'cache',mq:'message-queue'};
  const slotOrder = ['db','cache','mq'];
  const labels = {db:'Database',cache:'Cache',mq:'Message Queue'};
  let score = 0;
  slotOrder.forEach(s=>{if(slots[s]===correct[s])score++});
  const pct = Math.round((score/3)*100);
  const xp = 50+score*10+(score===3?25:0);
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="results-card">
        <div className="results-score">{pct}%</div>
        <div className="results-label">Score — Requirement 2</div>
        <div className="results-breakdown">
          {slotOrder.map((s,i)=>{
            const isCorrect = slots[s]===correct[s];
            return (
              <div key={s} className="results-slot" style={{animationDelay:`${i*100}ms`}}>
                <div className={`results-slot-icon ${isCorrect?'correct':'incorrect'}`}>{isCorrect?'\u2713':'\u2717'}</div>
                <div className="results-slot-name">{labels[s]}</div>
                <div className={`results-slot-status ${isCorrect?'correct':'incorrect'}`}>{isCorrect?'Correct':'Incorrect'}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:24,padding:'12px 0',borderTop:'1px solid var(--card-border)'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:28,fontWeight:800,color:'var(--accent)'}}>+{xp}</div>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.06em'}}>XP earned</div>
          </div>
          <div style={{width:1,height:36,background:'var(--card-border)'}}/>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:28,fontWeight:800}}>3</div>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Day streak</div>
          </div>
        </div>
        <button onClick={onClose} style={{width:'100%',marginTop:16,padding:'10px 0',borderRadius:8,border:'none',background:'var(--accent)',color:'var(--accent-text)',fontFamily:'var(--font-body)',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Next Requirement
        </button>
      </div>
    </div>
  );
}

function DetailPanel({ node, onClose }) {
  if (!node) return null;
  const catInfo = CATEGORIES[node.cat];
  const connections = EDGES.filter(e=>e.from===node.id||e.to===node.id);
  return (
    <div className="detail-panel">
      <button onClick={onClose} style={{position:'absolute',top:16,right:16,background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:18}}>&times;</button>
      <div className="detail-category" style={{background:catInfo.soft,color:catInfo.color}}>{catInfo.label}</div>
      <div className="detail-title">{node.label}</div>
      <div className="detail-desc">{node.desc||'A component in the system architecture.'}</div>
      <div className="detail-section-title">Connections</div>
      {connections.map((e,i)=>{
        const other = e.from===node.id?NODES.find(n=>n.id===e.to):NODES.find(n=>n.id===e.from);
        const eStyle = EDGE_STYLES[e.kind];
        return (
          <div key={i} className="detail-connection">
            <div className="detail-conn-dot" style={{background:eStyle.color}}/>
            <span>{e.from===node.id?'\u2192':'\u2190'}</span>
            <span style={{fontWeight:600}}>{other?.label}</span>
            <span style={{color:'var(--text-tertiary)',fontSize:10,marginLeft:'auto'}}>{e.label}</span>
          </div>
        );
      })}
      {node.type==='slot' && (
        <>
          <div className="detail-section-title" style={{marginTop:20}}>Hint</div>
          <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.6,padding:'10px 12px',background:'var(--card-bg)',borderRadius:8}}>{node.hint}</div>
        </>
      )}
    </div>
  );
}

function GraphNodeComponent({ node, onClick, selected, resultState, glowMode }) {
  const isSlot = node.type==='slot', isFilled = node.filled;
  const catInfo = CATEGORIES[node.cat]||CATEGORIES.compute;
  const Icon = ICONS[node.cat]||ICONS.compute;
  const connCount = EDGES.filter(e=>e.from===node.id||e.to===node.id).length;
  let statusBadge = null;
  if (resultState==='correct') statusBadge = <div className="node-status-badge correct" style={{animation:'check-pop 300ms ease-out'}}>&#10003;</div>;
  if (resultState==='incorrect') statusBadge = <div className="node-status-badge incorrect" style={{animation:'check-pop 300ms ease-out'}}>&#10007;</div>;
  const glowClass = glowMode&&!isSlot ? ' glow-active' : '';
  return (
    <div className={`graph-node${isSlot?' slot':''}${isFilled?' filled':''}${selected?' selected':''}${resultState?' '+resultState:''}${glowClass}`}
      style={{left:node.x,top:node.y}} onClick={isSlot?onClick:undefined} data-od-id={node.id}>
      {statusBadge}
      {!isSlot && <div className="node-stripe" style={{background:catInfo.color}}/>}
      <div className="node-body">
        {(isSlot&&!isFilled) ? (
          <>
            <div className="slot-plus"><svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" strokeWidth="2" strokeLinecap="round"/></svg></div>
            <div className="node-label" style={{color:'var(--slot-border)'}}>Drop here</div>
            {node.slotIdx && <div className="slot-counter">Slot {node.slotIdx} of 3</div>}
          </>
        ) : (
          <>
            <div className="node-icon-wrap" style={{background:catInfo.soft,color:catInfo.color}}><Icon/></div>
            <div className="node-label">{node.label}</div>
            <div className="node-category" style={{color:catInfo.color+'99'}}>{catInfo.label}</div>
          </>
        )}
      </div>
      <div className="node-ports">
        {Array.from({length:Math.min(connCount,6)}).map((_,i)=><div key={i} className={`node-port${i<connCount?' connected':''}`}/>)}
      </div>
    </div>
  );
}

function EdgePath({ edge, nodes, animate }) {
  const from = nodes.find(n=>n.id===edge.from), to = nodes.find(n=>n.id===edge.to);
  if (!from||!to) return null;
  const style = EDGE_STYLES[edge.kind]||EDGE_STYLES.request;
  const sides = getEdgeSides(from,to);
  const fp = getPortPos(from,sides.fromSide), tp = getPortPos(to,sides.toSide);
  const OX = 40;
  const x1=fp.x+OX,y1=fp.y+OX,x2=tp.x+OX,y2=tp.y+OX;
  const dx=to.x-from.x,dy=to.y-from.y;
  let cx1,cy1,cx2,cy2;
  if (Math.abs(dx)>Math.abs(dy)){const h=Math.max(Math.abs(dx)*0.4,50);cx1=x1+(dx>0?h:-h);cy1=y1;cx2=x2+(dx>0?-h:h);cy2=y2;}
  else{const v=Math.max(Math.abs(dy)*0.4,50);cx1=x1;cy1=y1+(dy>0?v:-v);cx2=x2;cy2=y2+(dy>0?-v:v);}
  const pathD=`M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
  const shouldAnimate = animate&&(edge.kind==='async'||edge.kind==='cache'||edge.kind==='streaming');
  return (
    <g>
      <path d={pathD} className="edge-path" stroke={style.stroke} strokeDasharray={style.dash||undefined} markerEnd={`url(#arrow-${edge.kind})`} style={shouldAnimate?{animation:'dash-flow 1s linear infinite'}:undefined}/>
      {shouldAnimate && <circle r="3" fill={style.stroke} opacity="0.7"><animateMotion dur="2s" repeatCount="indefinite" path={pathD}/></circle>}
    </g>
  );
}

function EdgeLabel({ edge, nodes }) {
  const from = nodes.find(n=>n.id===edge.from), to = nodes.find(n=>n.id===edge.to);
  if (!from||!to) return null;
  const sides = getEdgeSides(from,to);
  const fp = getPortPos(from,sides.fromSide), tp = getPortPos(to,sides.toSide);
  const midX = (fp.x+tp.x)/2, midY = (fp.y+tp.y)/2;
  const style = EDGE_STYLES[edge.kind]||EDGE_STYLES.request;
  return <div className="edge-label-pill" style={{position:'absolute',left:midX-30,top:midY-10,borderColor:style.color+'40',color:style.color}}>{edge.label}</div>;
}

function TweaksPanel({ tone, onToneChange }) {
  return (
    <div className="tweaks-panel">
      <div className="tweaks-title">Visual Tone</div>
      <div className="tweak-tone-grid">
        {[
          {id:'default',label:'StackDify',bg:'#1c1c1e',accent:'#00ffa3'},
          {id:'warm',label:'Warm',bg:'#f7f4ef',accent:'#d97706'},
          {id:'blueprint',label:'Blueprint',bg:'#0a1628',accent:'#22d3ee'},
        ].map(t=>(
          <div key={t.id} className={`tweak-tone-card${tone===t.id?' active':''}`} onClick={()=>onToneChange(t.id)}>
            <div className="tweak-tone-preview" style={{background:t.bg}}>
              <div style={{width:12,height:3,borderRadius:2,background:t.accent,margin:'6px auto 0'}}/>
            </div>
            <div className="tweak-tone-label">{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [tone, setTone] = React.useState('default');
  const [slots, setSlots] = React.useState({db:null,cache:null,mq:null});
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [detailNode, setDetailNode] = React.useState(null);
  const [showResults, setShowResults] = React.useState(false);
  const [animateEdges, setAnimateEdges] = React.useState(true);
  const [showLabels, setShowLabels] = React.useState(true);
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [glowMode, setGlowMode] = React.useState(false);
  const [compSearch, setCompSearch] = React.useState('');

  const placedSlugs = new Set(Object.values(slots).filter(Boolean));
  const allFilled = Object.values(slots).every(Boolean);

  const handleSlotClick = (nodeId) => {
    if (slots[nodeId]){setDetailNode(NODES.find(n=>n.id===nodeId));return;}
    setSelectedSlot(selectedSlot===nodeId?null:nodeId); setDetailNode(null);
  };
  const handleComponentClick = (slug) => {
    if (!selectedSlot) return;
    setSlots(prev=>({...prev,[selectedSlot]:slug})); setSelectedSlot(null);
  };
  const handleSubmit = () => setShowResults(true);
  const handleNodeClick = (node) => { if (node.type!=='slot') setDetailNode(node); };

  const enrichedNodes = NODES.map(n=>({...n,filled:n.type==='slot'?!!slots[n.id]:true}));
  const getResultState = (nodeId) => {
    if (!showResults) return null;
    const correct = {db:'relational-db',cache:'cache',mq:'message-queue'};
    const node = NODES.find(n=>n.id===nodeId);
    if (node?.type!=='slot') return null;
    return slots[nodeId]===correct[nodeId]?'correct':'incorrect';
  };

  return (
    <div data-tone={tone} style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      <Navbar/>
      <GameHeader slots={slots} allFilled={allFilled} onSubmit={handleSubmit} showResults={showResults}/>
      <div className="main-layout">
        <Sidebar slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot}
          onComponentClick={handleComponentClick} placedSlugs={placedSlugs}
          compSearch={compSearch} onCompSearch={setCompSearch}/>
        <div className="canvas-wrap">
          <CanvasToolbar animateEdges={animateEdges} onToggleAnimate={()=>setAnimateEdges(v=>!v)}
            showLabels={showLabels} onToggleLabels={()=>setShowLabels(v=>!v)}
            showMinimap={showMinimap} onToggleMinimap={()=>setShowMinimap(v=>!v)}
            glowMode={glowMode} onToggleGlow={()=>setGlowMode(v=>!v)}/>
          <div className="hint-bar" style={{opacity:selectedSlot?1:0.6}}>
            {selectedSlot ? `Slot selected — pick a component from the sidebar` : `Click an empty slot to start filling`}
          </div>
          <div className="canvas-inner">
            <div className="graph-area">
              <svg className="edge-svg" viewBox="0 0 900 580">
                <ArrowMarkers/>
                {EDGES.map((e,i)=><EdgePath key={i} edge={e} nodes={enrichedNodes} animate={animateEdges}/>)}
              </svg>
              {showLabels && EDGES.map((e,i)=><EdgeLabel key={i} edge={e} nodes={enrichedNodes}/>)}
              {enrichedNodes.map(n=>(
                <div key={n.id} onClick={()=>n.type==='slot'?handleSlotClick(n.id):handleNodeClick(n)}>
                  <GraphNodeComponent node={n} selected={selectedSlot===n.id}
                    resultState={showResults?getResultState(n.id):null} glowMode={glowMode}/>
                </div>
              ))}
            </div>
          </div>
          <Minimap visible={showMinimap} nodes={enrichedNodes} edges={EDGES}/>
          {showResults && <ResultsOverlay slots={slots} onClose={()=>setShowResults(false)}/>}
          {detailNode && <DetailPanel node={detailNode} onClose={()=>setDetailNode(null)}/>}
          <TweaksPanel tone={tone} onToneChange={setTone}/>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
</script>
</body>
</html>