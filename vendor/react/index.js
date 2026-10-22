import React from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';

export const {
  useState, useMemo, useId, useEffect, useRef, Fragment, StrictMode,
} = React;
export { React, createRoot };
export const html = htm.bind(React.createElement);
