import { describe, expect, it } from 'vitest';
import { page } from './site';

/**
 * The homepage. Its composition — bio, numbers band, proof block, offer cards
 * and talk-materials capture — is asserted by its own ticket; the prose here
 * is still a placeholder. What is already true is that the two language
 * versions are separate pages, each written in its own language.
 */
describe('the homepage', () => {
  it('is written in each language rather than translated from one', () => {
    const english = page('/')('main').text();
    const chinese = page('/zh/')('main').text();

    expect(english).not.toBe(chinese);
    expect(chinese).toMatch(/\p{Script=Han}/u);
    expect(english).not.toMatch(/\p{Script=Han}/u);
  });
});
