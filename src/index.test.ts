import { describe, it, expect } from 'vitest';
import { RedisAPIClient } from './index';

describe('RedisAPIClient', () => {
  it('should be defined', () => {
    expect(RedisAPIClient).toBeDefined();
  });
});
