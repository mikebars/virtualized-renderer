import debounce from 'lodash.debounce'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './index.css'

const Img = (
  props: React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >,
) => {
  const [loadState, setLoadState] = React.useState<
    'initial' | 'loading' | 'success' | 'failure'
  >('initial')

  React.useLayoutEffect(() => {
    setLoadState('loading')
  }, [props.src])

  return (
    <React.Fragment>
      <img
        alt={props.alt}
        onError={() => setLoadState('failure')}
        onLoad={() => setLoadState('success')}
        src={props.src}
        style={
          loadState === 'success'
            ? props.style
            : {
                display: 'none',
              }
        }
        title={props.title}
      />
      <img
        alt={''}
        style={
          loadState === 'success'
            ? {
                display: 'none',
              }
            : {
                ...props.style,
                backgroundColor:
                  loadState === 'failure'
                    ? 'red'
                    : loadState === 'loading'
                    ? 'gray'
                    : 'white',
              }
        }
        title={props.title}
      />
    </React.Fragment>
  )
}

const VirtualizedRenderer = (props: {
  buffer: number
  columns: number
  rows: number
  thumbnails: Array<{
    description: string
    index: number
    timestamp: number
    url: string
  }>
}) => {
  const {
    buffer: numberOfBufferRows,
    columns: numberOfThumbnailsPerRow,
    rows: numberOfThumbnailsPerColumn,
    thumbnails: { length: numberOfThumbnails },
  } = props

  const numberOfVisibleThumbnails =
    numberOfThumbnailsPerColumn * numberOfThumbnailsPerRow

  const totalNumberOfRows = Math.ceil(
    numberOfThumbnails / numberOfThumbnailsPerRow,
  )

  const columnWidthPercentage =
    (numberOfThumbnailsPerColumn / numberOfVisibleThumbnails) * 100

  const rowHeightPercentage =
    (numberOfThumbnailsPerRow / numberOfVisibleThumbnails) * 100

  const totalRowHeightPercentage = totalNumberOfRows * rowHeightPercentage

  const bodyHeightRef = React.useRef(document.body.clientHeight)
  const bodyWidthRef = React.useRef(document.body.clientWidth)

  const htmlHeightRef = React.useRef(document.documentElement.clientHeight)
  const htmlWidthRef = React.useRef(document.documentElement.clientWidth)

  const scrollXRef = React.useRef(window.scrollX)
  const scrollYRef = React.useRef(window.scrollY)

  const getNextFirstVisibleRowIndex = React.useCallback(() => {
    const scrollProportionY = scrollYRef.current / bodyHeightRef.current

    const nextFirstVisibleRowIndex = Math.round(
      scrollProportionY * totalNumberOfRows,
    )

    const nextFirstVisibleThumbnailIndex =
      nextFirstVisibleRowIndex * numberOfThumbnailsPerRow

    return nextFirstVisibleThumbnailIndex
  }, [numberOfThumbnailsPerRow, totalNumberOfRows])

  const [
    firstVisibleThumbnailIndex,
    setFirstVisibleThumbnailIndex,
  ] = React.useState(0)

  const visibleThumbnails = React.useMemo(
    () =>
      props.thumbnails.slice(
        Math.max(
          0,
          firstVisibleThumbnailIndex -
            numberOfBufferRows * numberOfThumbnailsPerRow,
        ),
        Math.min(
          props.thumbnails.length,
          firstVisibleThumbnailIndex +
            numberOfVisibleThumbnails +
            numberOfBufferRows * numberOfThumbnailsPerRow,
        ),
      ),
    [
      props.thumbnails,
      firstVisibleThumbnailIndex,
      numberOfBufferRows,
      numberOfThumbnailsPerRow,
      numberOfVisibleThumbnails,
    ],
  )

  React.useLayoutEffect(() => {
    const documentScrollEventHandler = (_event: Event) => {
      scrollXRef.current = window.scrollX
      scrollYRef.current = window.scrollY

      setFirstVisibleThumbnailIndex(getNextFirstVisibleRowIndex)
    }

    const debouncedDocumentScrollEventHandler = debounce(
      documentScrollEventHandler,
      50,
      { maxWait: 500 },
    )

    document.addEventListener('scroll', debouncedDocumentScrollEventHandler)

    return () => {
      debouncedDocumentScrollEventHandler.cancel()

      document.removeEventListener(
        'scroll',
        debouncedDocumentScrollEventHandler,
      )
    }
  }, [getNextFirstVisibleRowIndex, numberOfThumbnailsPerRow, totalNumberOfRows])

  React.useLayoutEffect(() => {
    const windowLoadEventHandler = (_event: Event) => {
      bodyHeightRef.current = document.body.clientHeight
      bodyWidthRef.current = document.body.clientWidth

      htmlHeightRef.current = document.documentElement.clientHeight
      htmlWidthRef.current = document.documentElement.clientWidth

      scrollXRef.current = window.scrollX
      scrollYRef.current = window.scrollY

      setFirstVisibleThumbnailIndex(getNextFirstVisibleRowIndex)
    }

    window.addEventListener('load', windowLoadEventHandler)

    return () => {
      window.removeEventListener('load', windowLoadEventHandler)
    }
  }, [getNextFirstVisibleRowIndex])

  React.useLayoutEffect(() => {
    const windowResizeEventHandler = (_event: Event) => {
      const scaleChangeX =
        document.documentElement.clientWidth / htmlWidthRef.current
      const scaleChangeY =
        document.documentElement.clientHeight / htmlHeightRef.current

      bodyHeightRef.current = document.body.clientHeight
      bodyWidthRef.current = document.body.clientWidth

      htmlHeightRef.current = document.documentElement.clientHeight
      htmlWidthRef.current = document.documentElement.clientWidth

      scrollXRef.current = Math.round(scrollXRef.current * scaleChangeX)
      scrollYRef.current = Math.round(scrollYRef.current * scaleChangeY)

      window.scroll(scrollXRef.current, scrollYRef.current)
    }

    const debouncedWindowResizeEventHandler = debounce(
      windowResizeEventHandler,
      50,
      { maxWait: 500 },
    )

    window.addEventListener('resize', debouncedWindowResizeEventHandler)

    return () => {
      debouncedWindowResizeEventHandler.cancel()

      window.removeEventListener('resize', debouncedWindowResizeEventHandler)
    }
  }, [])

  return (
    <div
      style={{
        height: `${totalRowHeightPercentage}vh`,
        lineHeight: 0,
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          position: 'fixed',
          textAlign: 'center',
          top: '50%',
          width: '100%',
        }}
      >
        Loading...
      </div>
      {visibleThumbnails.map((visibleThumbnail, index) => {
        const column = index % numberOfThumbnailsPerRow

        const row = Math.floor(
          visibleThumbnail.index / numberOfThumbnailsPerColumn,
        )

        return (
          <Img
            alt={visibleThumbnail.description}
            key={`Row: ${row}, Column: ${column}`}
            src={visibleThumbnail.url}
            style={{
              height: `${rowHeightPercentage}vh`,
              lineHeight: `${rowHeightPercentage}vh`,
              width: `${columnWidthPercentage}%`,
              position: 'absolute',
              left: `calc(100% * ${column} / ${numberOfThumbnailsPerRow})`,
              top: `calc(100vh * ${row} / ${numberOfThumbnailsPerColumn})`,
            }}
            title={visibleThumbnail.description}
          />
        )
      })}
    </div>
  )
}

const range = <T extends unknown = number>(
  from: number,
  to: number,
  by: number = 1,
  transform: (n: number, index: number) => T = (n) => n as T,
) => {
  const result: Array<T> = []

  for (let n = from; n <= to; n = n + by) {
    const index = result.length
    result.push(transform(n, index))
  }

  return result
}

const createTimestampDescription = (timestamp: number, index: number) =>
  `Thumbnail for camera image #${index + 1} taken ${new Date(
    timestamp * 1000,
  ).toLocaleString()}.`

const createTimestampUrl = (timestamp: number) =>
  `https://hiring.verkada.com/thumbs/${timestamp}.jpg`

const createTimestampThumbnail = (timestamp: number, index: number) => ({
  description: createTimestampDescription(timestamp, index),
  index,
  timestamp,
  url: createTimestampUrl(timestamp),
})

const buffer = 3

const columns = 3

const rows = 3

const firstTimestamp = 1500348260

const lastTimestamp = 1503031520

const timestampInterval = 20

const thumbnails = range(
  firstTimestamp,
  lastTimestamp,
  timestampInterval,
  createTimestampThumbnail,
)

const element = (
  <React.StrictMode>
    <VirtualizedRenderer
      buffer={buffer}
      columns={columns}
      rows={rows}
      thumbnails={thumbnails}
    />
  </React.StrictMode>
)

const container = document.querySelector('#react-container')

ReactDOM.render(element, container)
