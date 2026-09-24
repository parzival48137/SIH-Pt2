# THERMIS — Thermal High-Altitude Reconnaissance & Military Intelligence Shelter System

**SIH Project ID:** SIH26051
**Domain:** Defence & Security
**Organization:** DRDO / Ministry of Defence

## Overview
Browser-native 7-stage computational platform for passive shelter thermal analysis in High-Altitude Cold Regions.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4 (custom design system)
- Recharts (thermal charts)
- PptxGenJS (presentation generator)
- JSZip (source archive)
- Physics: 1D Euler ODE RC network, McAdams convection, Magnus dew point, Pareto optimization

## Screens
1. Theater Setup — NASA POWER sync, SRTM elevation, coordinate input
2. Geometry & Materials — 3D shelter preview, material selection, U-values
3. Real-Time Simulation — 24h transient ODE, dual-line charts, dew point breach
4. PINN & Pareto — PINN heatmap, 125-config Pareto scatter
5. Logistics Command — Bukhari fuel, ALH airlift, Sapper Gantt, PMV gauge

## Install & Run
```
pnpm install
pnpm dev
```

Generated: 24/9/2026, 7:25:26 am
