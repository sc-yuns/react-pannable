import React, {
  isValidElement,
  cloneElement,
  useMemo,
  useCallback,
  useReducer,
} from 'react';
import Pannable from '../Pannable';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';
import { usePrevRef } from '../hooks/usePrevRef';
import StyleSheet from '../utils/StyleSheet';
import {
  requestAnimationFrame,
  cancelAnimationFrame,
} from '../utils/animationFrame';
import { isEqualToSize } from '../utils/geometry';
import { reducer, initialState } from './padReducer';
import PadContext from './PadContext';
import GeneralContent from './GeneralContent';

const defaultPadProps = {
  width: 0,
  height: 0,
  pagingEnabled: false,
  directionalLockEnabled: false,
  alwaysBounceX: true,
  alwaysBounceY: true,
  onScroll: () => {},
  onDragStart: () => {},
  onDragEnd: () => {},
  onDecelerationStart: () => {},
  onDecelerationEnd: () => {},
  onContentResize: () => {},
  renderBackground: () => null,
  renderOverlay: () => null,
  scrollTo: null,
  scrollToRect: null,
  ...Pannable.defaultProps,
};

function Pad(props) {
  const {
    width,
    height,
    pagingEnabled,
    directionalLockEnabled,
    alwaysBounceX,
    alwaysBounceY,
    onScroll,
    onDragStart,
    onDragEnd,
    onDecelerationStart,
    onDecelerationEnd,
    onContentResize,
    renderBackground,
    renderOverlay,
    scrollTo,
    scrollToRect,
    children,
    ...pannableProps
  } = props;
  const { enabled, shouldStart } = pannableProps;
  const [state, dispatch] = useReducer(reducer, initialState);
  const prevStateRef = usePrevRef(state);

  const {
    size,
    contentSize,
    contentOffset,
    contentVelocity,
    drag,
    deceleration,
    pannable,
  } = state;
  const output = {
    size,
    contentSize,
    contentOffset,
    contentVelocity,
    dragging: !!drag,
    decelerating: !!deceleration,
  };
  const prevState = prevStateRef.current;

  const resizeContent = useCallback(
    nextContentSize => {
      if (!isEqualToSize(contentSize, nextContentSize)) {
        dispatch({ type: 'setContentSize', value: nextContentSize });
      }
    },
    [contentSize]
  );

  const shouldPannableStart = useCallback(
    evt => {
      if (
        directionalLockEnabled &&
        !shouldDragStart(evt.velocity, size, contentSize)
      ) {
        return false;
      }

      return shouldStart(evt);
    },
    [shouldStart, directionalLockEnabled, size, contentSize]
  );

  useIsomorphicLayoutEffect(() => {
    if (prevState.pannable.translation !== pannable.translation) {
      if (pannable.translation) {
        if (prevState.pannable.translation) {
          dispatch({ type: 'dragMove' });
        } else {
          dispatch({ type: 'dragStart' });
        }
      } else if (prevState.pannable.translation) {
        if (enabled) {
          dispatch({ type: 'dragEnd' });
        } else {
          dispatch({ type: 'dragCancel' });
        }
      }
    }

    if (prevState.contentSize !== contentSize) {
      onContentResize(contentSize);
    }
    if (prevState.contentOffset !== contentOffset) {
      onScroll(output);
    }
    if (prevState.drag !== drag) {
      if (!prevState.drag) {
        onDragStart(output);
      } else if (!drag) {
        onDragEnd(output);
      }
    }
    if (prevState.deceleration !== deceleration) {
      if (!prevState.deceleration) {
        onDecelerationStart(output);
      } else if (!deceleration) {
        onDecelerationEnd(output);
      }
    }
  });

  useIsomorphicLayoutEffect(() => {
    if (!state.deceleration) {
      return;
    }

    const timer = requestAnimationFrame(() => {
      dispatch({ type: 'decelerate', now: new Date().getTime() });
    });

    return () => {
      cancelAnimationFrame(timer);
    };
  }, [state]);

  useMemo(() => {
    dispatch({ type: 'setSize', value: { width, height } });
  }, [width, height]);

  useMemo(() => {
    dispatch({
      type: 'setOptions',
      value: [
        pagingEnabled,
        directionalLockEnabled,
        alwaysBounceX,
        alwaysBounceY,
      ],
    });
  }, [pagingEnabled, directionalLockEnabled, alwaysBounceX, alwaysBounceY]);

  useMemo(() => {
    if (scrollTo) {
      dispatch({ type: 'scrollTo', ...scrollTo });
    }
  }, [scrollTo]);

  useMemo(() => {
    if (scrollToRect) {
      dispatch({ type: 'scrollToRect', ...scrollToRect });
    }
  }, [scrollToRect]);

  function buildContent() {
    const contentStyle = StyleSheet.create({
      position: 'absolute',
      width: contentSize.width,
      height: contentSize.height,
      transformTranslate: contentOffset,
      willChange: 'transform',
    });

    let element = typeof children === 'function' ? children(state) : children;

    if (isValidElement(element) && element.type.PadContent) {
      if (element.props.style) {
        Object.assign(contentStyle, element.props.style);
      }

      element = cloneElement(element, {
        style: contentStyle,
        ref: element.ref,
      });
    } else {
      element = <GeneralContent style={contentStyle}>{element}</GeneralContent>;
    }

    return element;
  }

  function buildBackground() {
    const element = renderBackground(output);

    if (element === null || element === undefined) {
      return null;
    }

    const elemStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };

    return <div style={elemStyle}>{element}</div>;
  }

  function buildOverlay() {
    return renderOverlay(output);
  }

  pannableProps.shouldStart = shouldPannableStart;

  const elemStyle = {
    overflow: 'hidden',
    position: 'relative',
    width: size.width,
    height: size.height,
  };

  if (pannableProps.style) {
    Object.assign(elemStyle, pannableProps.style);
  }

  pannableProps.style = elemStyle;

  return (
    <Pannable {...pannableProps}>
      {nextPannable => {
        if (pannable !== nextPannable) {
          dispatch({ type: 'setPannable', value: nextPannable });
        }

        const visibleRect = {
          x: -contentOffset.x,
          y: -contentOffset.y,
          width: size.width,
          height: size.height,
        };

        return (
          <PadContext.Provider value={{ visibleRect, resizeContent }}>
            {buildBackground()}
            {buildContent()}
            {buildOverlay()}
          </PadContext.Provider>
        );
      }}
    </Pannable>
  );
}

Pad.defaultProps = defaultPadProps;

export default Pad;

function shouldDragStart(velocity, size, cSize) {
  const height =
    Math.abs(velocity.y) < Math.abs(velocity.x) ? 'width' : 'height';

  return size[height] < cSize[height];
}
