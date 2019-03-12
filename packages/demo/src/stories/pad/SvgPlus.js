import React from 'react';

const SvgPlus = props => (
  <svg
    className="prefix__icon"
    viewBox="0 0 1024 1024"
    width={24}
    height={24}
    {...props}
  >
    <circle cx="512" cy="512" r="300" fill="bfbfbf" />
    <path
      d="M512 0C228.267 0 0 228.267 0 512s228.267 512 512 512 512-228.267 512-512S795.733 0 512 0zm256 533.333H533.333V768c0 12.8-8.533 21.333-21.333 21.333S490.667 780.8 490.667 768V533.333H256c-12.8 0-21.333-8.533-21.333-21.333S243.2 490.667 256 490.667h234.667V256c0-12.8 8.533-21.333 21.333-21.333S533.333 243.2 533.333 256v234.667H768c12.8 0 21.333 8.533 21.333 21.333S780.8 533.333 768 533.333z"
      fill="#eeeeee"
    />
  </svg>
);

export default SvgPlus;