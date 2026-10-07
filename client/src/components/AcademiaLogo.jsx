import React from 'react';

/** Displays the original supplied logo artwork without redrawing or recoloring it. */
export const AcademiaLogo = ({ className = 'h-8 w-8' }) => (
  <img
    src="/academia-logo.png"
    alt=""
    aria-hidden="true"
    draggable="false"
    className={`shrink-0 object-contain ${className}`}
  />
);
