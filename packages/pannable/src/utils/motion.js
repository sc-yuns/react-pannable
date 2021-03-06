function getAcc(rate, { x, y }) {
  const r = Math.sqrt(x * x + y * y);

  if (r === 0) {
    return { x: 0, y: 0 };
  }
  return { x: rate * (x / r), y: rate * (y / r) };
}

export function getAdjustedContentVelocity(velocity, size, acc, name) {
  if (name) {
    const [x, width] = name === 'y' ? ['y', 'height'] : ['x', 'width'];

    if (!velocity[x]) {
      return 0;
    }

    const direction = velocity[x] < 0 ? -1 : 1;
    const maxDist = 0.5 * size[width];
    const maxVelocity =
      direction *
      Math.min(
        direction * velocity[x],
        Math.sqrt(2 * maxDist * direction * acc[x])
      );

    return maxVelocity;
  }

  if (typeof acc !== 'object') {
    acc = getAcc(acc, velocity);
  }

  const adjustedVelocity = {
    x: getAdjustedContentVelocity(velocity, size, acc, 'x'),
    y: getAdjustedContentVelocity(velocity, size, acc, 'y'),
  };

  if (adjustedVelocity.x === velocity.x && adjustedVelocity.y === velocity.y) {
    return velocity;
  }

  return adjustedVelocity;
}

export function getAdjustedContentOffset(
  offset,
  size,
  cSize,
  paging,
  edgeOnly,
  name
) {
  if (name) {
    const [x, width] = name === 'y' ? ['y', 'height'] : ['x', 'width'];

    const sizeWidth = size[width];
    let minOffsetX = Math.min(sizeWidth - cSize[width], 0);
    let offsetX = offset[x];

    if (paging && sizeWidth > 0) {
      minOffsetX = sizeWidth * Math.ceil(minOffsetX / sizeWidth);
    }

    if (0 < offsetX) {
      offsetX = 0;
    } else if (offsetX < minOffsetX) {
      offsetX = minOffsetX;
    } else {
      if (!edgeOnly && paging && sizeWidth > 0) {
        offsetX = sizeWidth * Math.round(offsetX / sizeWidth);
      }
    }

    return offsetX;
  }

  const adjustedOffset = {
    x: getAdjustedContentOffset(offset, size, cSize, paging, edgeOnly, 'x'),
    y: getAdjustedContentOffset(offset, size, cSize, paging, edgeOnly, 'y'),
  };

  if (adjustedOffset.x === offset.x && adjustedOffset.y === offset.y) {
    return offset;
  }

  return adjustedOffset;
}

export function getAdjustedBounceOffset(offset, bounce, size, cSize, name) {
  if (name) {
    const [x, width, height] =
      name === 'y' ? ['y', 'height', 'width'] : ['x', 'width', 'height'];

    const offsetX = offset[x];
    const minOffsetX = Math.min(size[width] - cSize[width], 0);
    const maxDist = 0.5 * Math.min(size[width], size[height]);

    if (0 < offsetX) {
      if (bounce[x]) {
        return maxDist * (1 - maxDist / (maxDist + offsetX));
      }
      return 0;
    }
    if (offsetX < minOffsetX) {
      if (bounce[x]) {
        return (
          minOffsetX -
          maxDist * (1 - maxDist / (maxDist - offsetX + minOffsetX))
        );
      }
      return minOffsetX;
    }

    return offsetX;
  }

  const adjustedOffset = {
    x: getAdjustedBounceOffset(offset, bounce, size, cSize, 'x'),
    y: getAdjustedBounceOffset(offset, bounce, size, cSize, 'y'),
  };

  if (adjustedOffset.x === offset.x && adjustedOffset.y === offset.y) {
    return offset;
  }

  return adjustedOffset;
}

export function getDecelerationEndOffset(
  offset,
  velocity,
  size,
  paging,
  acc,
  name
) {
  if (name) {
    const [x, width] = name === 'y' ? ['y', 'height'] : ['x', 'width'];

    let offsetX = offset[x];

    if (paging && size[width] > 0) {
      const minVelocity = 0.5;
      let delta = offsetX / size[width];

      if (minVelocity < velocity[x]) {
        delta = Math.ceil(delta);
      } else if (velocity[x] < -minVelocity) {
        delta = Math.floor(delta);
      } else {
        delta = Math.round(delta);
      }

      offsetX = size[width] * delta;
    } else {
      if (acc[x]) {
        offsetX += 0.5 * velocity[x] * (velocity[x] / acc[x]);
      }
    }

    return offsetX;
  }

  if (typeof acc !== 'object') {
    acc = getAcc(acc, velocity);
  }

  return {
    x: getDecelerationEndOffset(offset, velocity, size, paging, acc, 'x'),
    y: getDecelerationEndOffset(offset, velocity, size, paging, acc, 'y'),
  };
}

export function calculateDeceleration(deceleration, moveTime, name) {
  const { points, duration, startTime, endOffset } = deceleration;
  let t = 1;

  if (duration > 0) {
    t = (moveTime - startTime) / duration;
  }

  if (name) {
    const [x] = name === 'y' ? ['y'] : ['x'];
    const [p0, p1, p2, p3] = points[x];
    const offsetX =
      p0 -
      3 * (p0 - p1) * t +
      3 * (p0 - 2 * p1 + p2) * Math.pow(t, 2) -
      (p0 - 3 * p1 + 3 * p2 - p3) * Math.pow(t, 3);
    const velocityX =
      (-3 * (p0 - p1) +
        6 * (p0 - 2 * p1 + p2) * t -
        3 * (p0 - 3 * p1 + 3 * p2 - p3) * Math.pow(t, 2)) /
      duration;

    return { [x + 'Offset']: offsetX, [x + 'Velocity']: velocityX };
  }

  if (t < 0 || 1 <= t) {
    return {
      offset: endOffset,
      velocity: { x: 0, y: 0 },
      didEnd: true,
    };
  }

  const { xOffset, yOffset, xVelocity, yVelocity } = {
    ...calculateDeceleration(deceleration, moveTime, 'x'),
    ...calculateDeceleration(deceleration, moveTime, 'y'),
  };

  return {
    offset: { x: xOffset, y: yOffset },
    velocity: { x: xVelocity, y: yVelocity },
    didEnd: false,
  };
}

export function createDeceleration(
  endOffset,
  rate,
  startOffset,
  startVelocity
) {
  const startTime = new Date().getTime();
  let duration = 0;

  if (!rate) {
    return { endOffset, rate, duration, startTime };
  }

  const s = {
    x: endOffset.x - startOffset.x,
    y: endOffset.y - startOffset.y,
  };

  const sm = Math.sqrt(Math.pow(s.x, 2) + Math.pow(s.y, 2));
  let vm;

  if (sm) {
    vm = (startVelocity.x * s.x + startVelocity.y * s.y) / sm;

    let vh = Math.sqrt(0.5 * Math.pow(vm, 2) + rate * sm);
    let th = (vh - vm) / rate;

    if (th < 0) {
      vh = vm;
      th = 0;
    }

    duration = th + vh / rate;
  } else {
    vm = Math.sqrt(Math.pow(startVelocity.x, 2) + Math.pow(startVelocity.y, 2));
    duration = ((Math.sqrt(2) + 1) * vm) / rate;
  }

  const points = {
    x: [
      startOffset.x,
      startOffset.x + startVelocity.x * (duration / 3.0),
      endOffset.x,
      endOffset.x,
    ],
    y: [
      startOffset.y,
      startOffset.y + startVelocity.y * (duration / 3.0),
      endOffset.y,
      endOffset.y,
    ],
  };

  return { endOffset, rate, duration, startTime, points };
}
