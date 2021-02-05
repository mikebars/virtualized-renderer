# Virtualized Renderer

## Running

0. Required project prerequisites:

- `node`: authored on version `v14.15.4`, should work on LTS and above
- `yarn`: authored on version `1.22.5`, should work on recent versions

1. Install project dependencies:

- `yarn install`
- `yarn reset`, if you prefer a clean slate installation

2. Start the project:

- `yarn react-scripts:development`, to run the development server
- `yarn react-scripts:production`, to build and serve the production build
- `yarn react-scripts:static`, to build and serve the static build

## Overview

A simple implementation of a virtualized renderer in React to render large numbers of elements by only rendering those in view, plus a set amount of buffer elements above and below the fold.

Implemented by the `<VirtualizedRenderer />` React component that accepts the following props:

```
type VirtualizedRendererProps = {
  // `buffer`, the number of rows to render above and below the fold.
  // Increasing this number may provide a smoother-feeling experience
  // for users, but may come at a performance penalty cost if too high.
  buffer: number

  // `columns`, the number of columns visible on the screen.
  columns: number

  // `rows`, the number of rows visible on the screen.
  rows: number

  // `thumbnails`, an array of objects with timestamp and other data.
  thumbnails: Array<{
    // `description`, a short string describing the thumbnail image.
    description: string

    // `index`, the index of the thumbnail in the complete array.
    // Used for positioning the thumbnail when in a subdivided array.
    index: number

    // `timestamp`, the Unix timestamp of the thumbnail (in seconds).
    timestamp: number

    // `url`, the URL string pointing to the thumbnail image itself.
    url: string
  }>
}
```

Visually, the component renders a subset of its total thumbnails in a grid with the dimensions of `props.rows` rows by `props.columns` columns. Additionally, the component will render `props.buffer` extra rows above and below the main grid content, so that when a user scrolls, they do not immediately see beyond the content until further thumnails load.

The thumbnails are styled to have uniform dimensions, which allows for greater predictability in computing positioning when inferencing off of the user's scroll position. This uniform dimension is multiplied by the total number of rows in the content to compute the expected complete span of the content without having to render it.

Internally, the component tracks one piece of state: the index of the first visible thumbnail, defined as the first element of the first row that has a majority of its height in view. Due to the uniformity of the dimensions of the rendered elements, this index of the first visible row can be computed by comparing the current scroll position to the total span of the content. From there, computing the index of the first thumbnail in that row can be done by multiplying the row index by the number of elements per row (i.e. `props.columns`).

The scroll index is tracked internally with a React `ref`, as are other viewport dimensions that are important in calculating thumbnail position. Event handlers for `document` `'scroll'` and `window` `'load'` and `'resize'` are attached on component mount (and updated as needed by the principles of React hook dependencies and staleness), and removed on component unmount. Importantly, event handlers for potentially frequently occuring events like `'resize'` and `'scroll'` are debounced to prevent needlessly rendering brief intermediate states during rapid transitions.

To avoid both page stuttering and presenting potentially-misleading stale thumbnail data, each thumbnail is rendered by a `<Img />` component that wraps the native DOM `<img />` tag with additional functionality that tracks the loading lifecycle of the image, and displays a color-coded placeholder image in the meantime. Here is an overview of the `<Img />` component lifecycle:

1. `'initial'` - the state the component is in when rendered for the first time.

2. `'loading'` - the state the component is in after mounting and before the `<img />` loads (or fails to load).

3. Either:
   3a. `'success'` - the state the component is in when the `<img />` has loaded successfully.
   3b. `'failure'` - the state the component is in when the `<img />` has failed to load.

And here is the color code of the thumbnail placeholder:

- White: `<Img />` is in the `'initial'` state

- Gray: `<Img />` is in the `'loading'` state

- Red: `<Img />` is in the `'failure'` state

If the `<Img />` is in the `'success'` state, you will see the loaded image and not see the placeholder.

## Dependencies

- `lodash.debounce`: used to debounce frequently occuring event handlers.

- `react`, `react-dom`: project is authored in React.

- `typescript`: project is authored in TypeScript.

- `react-scripts`: project is bootstrapped with Create React App.

- `prettier`: project handles code formatting with Prettier.

## Roadmap

Here are some things I think would make sense as next steps if building this project out into a production capacity:

- Testing (unit, integration, end-to-end, property, mutation)
- Tooling (Additional ESLint plugins, TSLint, Stylelint, Storybook, etc)
- Consideration of source `<img />` aspect ratio / dimensions
- Decoupling of `<VirtualizedRenderer />` from rendering specifically `<Img />` components
- Investigate potential for element caching
- Investigate performance consequences of React implementation vs raw DOM manipulation
- Investigate potential for compile-time static rendering and / or image optimization for reducing page render and load times
