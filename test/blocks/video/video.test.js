import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

setupDom();
const { getVideoSource, getPlayLabel } = await import('../../../blocks/video/video.js');

describe('getVideoSource', () => {
  it('detects YouTube links, long and short', () => {
    assert.equal(getVideoSource('https://www.youtube.com/watch?v=abc123'), 'youtube');
    assert.equal(getVideoSource('https://youtu.be/abc123'), 'youtube');
  });

  it('detects Vimeo links', () => {
    assert.equal(getVideoSource('https://vimeo.com/123456'), 'vimeo');
    assert.equal(getVideoSource('https://player.vimeo.com/video/123456'), 'vimeo');
  });

  it('treats anything else as a video file', () => {
    assert.equal(getVideoSource('https://example.com/media/run.mp4'), 'video');
  });

  it('ignores youtube or vimeo outside the host name', () => {
    assert.equal(getVideoSource('https://cdn.example.com/media/vimeo-vs-youtube.mp4'), 'video');
    assert.equal(getVideoSource('https://example.com/watch?ref=youtube.com'), 'video');
  });
});

describe('getPlayLabel', () => {
  it('uses the placeholder for each source type', () => {
    const placeholders = { playYoutubeVideo: 'YouTube-Video abspielen', playVimeoVideo: 'Vimeo-Video abspielen', playVideo: 'Video abspielen' };
    assert.equal(getPlayLabel('youtube', placeholders), 'YouTube-Video abspielen');
    assert.equal(getPlayLabel('vimeo', placeholders), 'Vimeo-Video abspielen');
    assert.equal(getPlayLabel('video', placeholders), 'Video abspielen');
  });

  it('falls back to English when a placeholder is missing', () => {
    assert.equal(getPlayLabel('youtube', {}), 'Play YouTube video');
    assert.equal(getPlayLabel('vimeo', {}), 'Play Vimeo video');
    assert.equal(getPlayLabel('video', {}), 'Play video');
  });
});
