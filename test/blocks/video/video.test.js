import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

setupDom();
const { getVideoSource, getVideoTypeLabel } = await import('../../../blocks/video/video.js');

describe('getVideoSource', () => {
  it('detects YouTube links, long and short', () => {
    assert.equal(getVideoSource('https://www.youtube.com/watch?v=abc123'), 'youtube');
    assert.equal(getVideoSource('https://youtu.be/abc123'), 'youtube');
  });

  it('detects Vimeo links', () => {
    assert.equal(getVideoSource('https://vimeo.com/123456'), 'vimeo');
  });

  it('treats anything else as a video file', () => {
    assert.equal(getVideoSource('https://example.com/media/run.mp4'), 'video');
  });
});

describe('getVideoTypeLabel', () => {
  it('labels each source type, with a fallback', () => {
    assert.equal(getVideoTypeLabel('youtube'), 'YouTube video');
    assert.equal(getVideoTypeLabel('vimeo'), 'Vimeo video');
    assert.equal(getVideoTypeLabel('video'), 'MP4 video');
    assert.equal(getVideoTypeLabel('other'), 'video');
  });
});
