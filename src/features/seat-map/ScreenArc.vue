<template>
  <div class="relative mx-auto w-[86%]" aria-hidden="true">
    <svg viewBox="0 0 600 70" class="block w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="screen-stroke" x1="0" x2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.15" />
          <stop offset="0.5" stop-color="#fff" stop-opacity="1" />
          <stop offset="1" stop-color="#fff" stop-opacity="0.15" />
        </linearGradient>
        <linearGradient id="screen-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.16" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <filter id="screen-glow" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <!-- промінь світла від екрана в зал -->
      <path d="M10 22 Q300 -6 590 22 L640 70 L-40 70 Z" fill="url(#screen-beam)" />
      <path
        d="M10 22 Q300 -6 590 22"
        stroke="#fff"
        stroke-opacity="0.55"
        stroke-width="10"
        fill="none"
        filter="url(#screen-glow)"
      />
      <path
        d="M10 22 Q300 -6 590 22"
        stroke="url(#screen-stroke)"
        stroke-width="3.5"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
    <p class="absolute inset-x-0 top-7 text-center text-[11px] font-bold uppercase tracking-[0.6em] text-text/70">
      Екран
    </p>
  </div>
</template>
