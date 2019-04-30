# \<Carousel />

`Carousel` is a higher level abstraction of [`<Player />`](player.md). It implements the feature of carousel and provides useful API.

## Usage

```js
import React from 'react';
import { Carousel } from 'react-pannable';

class Page extends React.Component {
  render() {
    return (
      <Carousel
        width={500}
        height={350}
        direction="x"
        autoplayEnabled={true}
        loop={true}
        itemCount={5}
        renderItem={({ itemIndex }) => {
          const style = {
            height: '100%',
            backgroundColor: itemIndex % 2 ? '#defdff' : '#cbf1ff',
          };

          return <div style={style} />;
        }}
        onSlideChange={({ itemCount, activeIndex }) => {
          console.log(itemCount, activeIndex);
        }}
      />
    );
  }
}
```

[![Try it on CodePen](https://img.shields.io/badge/CodePen-Run-blue.svg?logo=CodePen)](https://codepen.io/cztflove/pen/JVVoma)

## Props

... [Player](player.md) props

#### `itemCount`: number

The number of items.

#### `renderItem`: (attrs: [`LayoutAttrs`](player.md#LayoutAttrs)) => ReactNode

Returns a element by the layout attributes.

#### `onSlideChange`?: (attrs: SlideAttrs) => void

Calls when the active view of the carousel changes.

## APIs

#### getActiveIndex()

Returns index of the active view of the carousel.

#### slideTo({index: number, animated: boolean})

Slides to the specified view.

#### slidePrev()

Slides to the previous view.

#### slideNext()

Slides to the next view.

## Types

#### SlideAttrs { itemCount: number, activeIndex: number };