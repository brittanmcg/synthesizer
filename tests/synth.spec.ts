import { test, expect, type Locator, type Page } from '@playwright/test';

async function dragKnobVertically(page: Page, knob: Locator, deltaY: number) {
  const box = await knob.boundingBox();
  if (!box) throw new Error('knob not visible');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy + deltaY, { steps: 10 });
  await page.mouse.up();
}

test.describe('MONO-1 panel', () => {
  test('renders the header, sections, keyboard, and status bar', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.header h1')).toHaveText('MONO—1');
    await expect(page.locator('.header .subtitle')).toHaveText('PHASE 1 · OSC → FILTER → AMP');

    await expect(page.locator('.section.osc .section-title')).toContainText('OSCILLATOR');
    await expect(page.locator('.section.filt .section-title')).toContainText('FILTER');
    await expect(page.locator('.section.env .section-title')).toContainText('ENVELOPE');

    // 13 white keys + 9 black keys for the two-octave C4-C6 layout
    await expect(page.locator('.keyboard .key.white')).toHaveCount(13);
    await expect(page.locator('.keyboard .key.black')).toHaveCount(9);

    await expect(page.locator('.status')).toContainText('NOTE');
    await expect(page.locator('.status')).toContainText('MIDI:');
  });

  test('waveform buttons are mutually exclusive', async ({ page }) => {
    await page.goto('/');

    const saw = page.locator('.wave-btn[title="Saw"]');
    const square = page.locator('.wave-btn[title="Square"]');
    const triangle = page.locator('.wave-btn[title="Triangle"]');
    const sine = page.locator('.wave-btn[title="Sine"]');

    await expect(saw).toHaveClass(/active/);

    await square.click();
    await expect(square).toHaveClass(/active/);
    await expect(saw).not.toHaveClass(/active/);

    await sine.click();
    await expect(sine).toHaveClass(/active/);
    await expect(square).not.toHaveClass(/active/);
    await expect(triangle).not.toHaveClass(/active/);
  });

  test('piano keys highlight on press and clear on release or mouse-leave', async ({ page }) => {
    await page.goto('/');

    const firstKey = page.locator('.keyboard .key.white').first();
    await firstKey.dispatchEvent('mousedown');
    await expect(firstKey).toHaveClass(/active/);

    await firstKey.dispatchEvent('mouseup');
    await expect(firstKey).not.toHaveClass(/active/);

    // pressing again, then moving the mouse away, should also release the note.
    // React derives mouseleave from bubbling mouseout/mouseover events, so a real
    // pointer move is required here rather than a synthetic dispatchEvent.
    const box = await firstKey.boundingBox();
    if (!box) throw new Error('key not visible');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(firstKey).toHaveClass(/active/);
    await page.mouse.move(box.x + box.width / 2, box.y - 200);
    await expect(firstKey).not.toHaveClass(/active/);
    await page.mouse.up();
  });

  test('only one key is highlighted at a time (monophonic)', async ({ page }) => {
    await page.goto('/');

    const keys = page.locator('.keyboard .key.white');
    const first = keys.nth(0);
    const second = keys.nth(1);

    await first.dispatchEvent('mousedown');
    await expect(first).toHaveClass(/active/);

    await second.dispatchEvent('mousedown');
    await expect(second).toHaveClass(/active/);
    await expect(first).not.toHaveClass(/active/);
  });

  test('computer keyboard plays white and black keys', async ({ page }) => {
    await page.goto('/');

    const whiteKey = page.locator('.keyboard .key[data-note="60"]'); // 'a'
    const blackKey = page.locator('.keyboard .key[data-note="61"]'); // 'w'

    // page.keyboard has no target element to auto-wait on, so make sure the app
    // has actually mounted (and its document keydown listener is attached)
    // before sending key events, or the first press can race the initial render.
    await expect(whiteKey).toBeVisible();

    await page.keyboard.down('a');
    await expect(whiteKey).toHaveClass(/active/);
    await page.keyboard.up('a');
    await expect(whiteKey).not.toHaveClass(/active/);

    await page.keyboard.down('w');
    await expect(blackKey).toHaveClass(/active/);
    await page.keyboard.up('w');
    await expect(blackKey).not.toHaveClass(/active/);
  });

  test('cutoff knob drag updates the displayed frequency within its range', async ({ page }) => {
    await page.goto('/');

    const knob = page.locator('#knob-cutoff');
    const valueLabel = page.locator('.section.filt .knob-unit').first().locator('.knob-value');

    await expect(valueLabel).toHaveText('2000 Hz');

    // dragging up increases the (log-scaled) cutoff toward its max of 12000 Hz
    await dragKnobVertically(page, knob, -100);
    await expect(valueLabel).toHaveText('12000 Hz');

    // dragging back down should lower it again
    await dragKnobVertically(page, knob, 200);
    const afterDragDown = await valueLabel.textContent();
    expect(afterDragDown).toMatch(/^\d+ Hz$/);
    expect(parseInt(afterDragDown ?? '0', 10)).toBeLessThan(12000);
  });

  test('octave knob drag updates the signed octave label within -3..+3', async ({ page }) => {
    await page.goto('/');

    const knob = page.locator('#knob-octave');
    const valueLabel = page.locator('.section.osc .knob-value');

    await expect(valueLabel).toHaveText('+0');

    await dragKnobVertically(page, knob, -140);
    await expect(valueLabel).toHaveText('+3');

    await dragKnobVertically(page, knob, 280);
    await expect(valueLabel).toHaveText('-3');
  });

  test('oscilloscope trace changes once a note is played', async ({ page }) => {
    await page.goto('/');

    const scope = page.locator('canvas#scope');
    const idleFrame = await scope.screenshot();

    const key = page.locator('.keyboard .key.white').first();
    await key.dispatchEvent('mousedown');
    // give the envelope a moment to ramp up and the analyser a few frames to draw
    await page.waitForTimeout(300);

    const activeFrame = await scope.screenshot();
    expect(Buffer.compare(idleFrame, activeFrame)).not.toBe(0);

    await key.dispatchEvent('mouseup');
  });

  test('no console errors on load and during interaction', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto('/');
    await page.locator('.wave-btn[title="Square"]').click();
    await page.locator('.keyboard .key.white').first().dispatchEvent('mousedown');
    await page.locator('.keyboard .key.white').first().dispatchEvent('mouseup');

    expect(errors).toEqual([]);
  });
});
