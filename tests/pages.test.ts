import { describe, expect, it } from 'vitest';
import { allRoutes, page } from './site';

/**
 * Rules that hold on every page the site builds. Each one is asserted over
 * `allRoutes()` rather than over a list written by hand, so a page added by a
 * later ticket has to satisfy them too.
 */
describe('every built page', () => {
  it.each(allRoutes())('%s has exactly one top-level heading', (route) => {
    expect(page(route)('h1')).toHaveLength(1);
  });

  it.each(allRoutes())('%s names itself in the browser tab and in search results', (route) => {
    const $ = page(route);
    expect($('title').text().trim()).not.toBe('');
    expect($('meta[name="description"]').attr('content')?.trim()).not.toBe('');
  });

  it.each(allRoutes())('%s offers a keyboard visitor a way past the chrome', (route) => {
    const $ = page(route);
    const target = $('a[href^="#"]').first().attr('href');
    expect(target).toBe('#main');
    expect($('main#main')).toHaveLength(1);
  });

  it.each(allRoutes())('%s renders the site chrome around its content', (route) => {
    const $ = page(route);
    expect($('header')).toHaveLength(1);
    expect($('footer')).toHaveLength(1);
  });
});
