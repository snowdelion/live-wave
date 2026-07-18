import '@testing-library/jest-dom'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import React from 'react'

globalThis.React = React

declare global {
  var __mockViewportWidth: number
  var setMockViewportWidth: (width: number) => void
}
globalThis.__mockViewportWidth = 1024

function parseFeatureQuery(query: string) {
  const minMatch = query.match(/min-width:\s*(\d+)px/)
  const maxMatch = query.match(/max-width:\s*(\d+)px/)
  return {
    min: minMatch ? Number(minMatch[1]) : undefined,
    max: maxMatch ? Number(maxMatch[1]) : undefined,
  }
}

function evaluateQuery(query: string) {
  const { min, max } = parseFeatureQuery(query)
  const width = globalThis.__mockViewportWidth
  if (min !== undefined && width < min) return false
  if (max !== undefined && width > max) return false
  return true
}

class MockMediaQueryList {
  private _listeners: Array<(ev: { matches: boolean; media: string }) => void> = []
  media: string
  constructor(query: string) {
    this.media = query
  }
  get matches() {
    return evaluateQuery(this.media)
  }
  addListener(fn: (ev: { matches: boolean; media: string }) => void) {
    this._listeners.push(fn)
  }
  removeListener(fn: (ev: { matches: boolean; media: string }) => void) {
    this._listeners = this._listeners.filter(l => l !== fn)
  }
  addEventListener(_: string, fn: (ev: { matches: boolean; media: string }) => void) {
    this._listeners.push(fn)
  }
  removeEventListener(_: string, fn: (ev: { matches: boolean; media: string }) => void) {
    this._listeners = this._listeners.filter(l => l !== fn)
  }
  dispatchEvent() {
    return true
  }
  notify() {
    const matches = this.matches
    this._listeners.forEach(fn => fn({ matches, media: this.media }))
  }
}

const allMqls: MockMediaQueryList[] = []

window.matchMedia = ((query: string) => {
  const mql = new MockMediaQueryList(query)
  allMqls.push(mql)
  return mql as unknown as MediaQueryList
}) as typeof window.matchMedia

globalThis.setMockViewportWidth = (width: number) => {
  globalThis.__mockViewportWidth = width
  allMqls.forEach(m => m.notify())
}

class MockResizeObserver {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver

function createMockCtx() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    setTransform: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  }
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => createMockCtx() as any)

HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 300,
  height: 150,
  top: 0,
  left: 0,
  right: 300,
  bottom: 150,
  x: 0,
  y: 0,
  toJSON() {},
}))

mockAnimationsApi()
