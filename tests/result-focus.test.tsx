// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/app';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<App />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function seeTheSuggestion() {
  const button = container.querySelector<HTMLButtonElement>('button[type="submit"]');
  expect(button).not.toBeNull();
  act(() => button!.click());
}

describe('reaching the result without a mouse', () => {
  it('moves focus to the result heading on submit and on every resubmit', () => {
    expect(container.querySelector('#result-heading')).toBeNull();

    seeTheSuggestion();
    const heading = container.querySelector('#result-heading');
    expect(heading).not.toBeNull();
    expect(document.activeElement).toBe(heading);

    act(() => (document.activeElement as HTMLElement).blur());
    expect(document.activeElement).not.toBe(heading);

    seeTheSuggestion();
    expect(document.activeElement).toBe(container.querySelector('#result-heading'));
  });
});
