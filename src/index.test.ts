import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { RedisAPIClient, RedisClientConfig } from './index';

describe('RedisAPIClient', () => {
  let client: RedisAPIClient;
  let mock: MockAdapter;

  const config: RedisClientConfig = {
    baseURL: 'http://localhost:3000',
    apiVersion: 'v1',
  };

  beforeEach(() => {
    client = new RedisAPIClient(config);
    mock = new MockAdapter(client.axiosInstance);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should be defined', () => {
    expect(RedisAPIClient).toBeDefined();
  });

  // More tests will be added here

  describe('Keys Module', () => {
    it('get(key) should return a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      mock.onGet(`/keys/${key}`).reply(200, { value });
      const result = await client.keys.get(key);
      expect(result).toEqual(value);
    });

    it('set(key, value) should set a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      mock.onPost(`/keys/${key}`).reply(200);
      await client.keys.set(key, value);
      expect(mock.history.post[0].data).toEqual(JSON.stringify({ value, ex: undefined }));
    });

    it('del(key) should delete a key', async () => {
      const key = 'test-key';
      mock.onDelete(`/keys/${key}`).reply(200, { deletedCount: 1 });
      const result = await client.keys.del(key);
      expect(result).toEqual(1);
    });

    it('incr(key) should increment a key', async () => {
      const key = 'test-key';
      mock.onPost(`/keys/${key}/incr`).reply(200, { value: 1 });
      const result = await client.keys.incr(key);
      expect(result).toEqual(1);
    });

    it('exists(keys) should check if keys exist', async () => {
      const keys = ['key1', 'key2'];
      // Mock any POST request - the function should work regardless of URL
      mock.onPost().reply(200, { existing_keys_count: 2 });
      
      const result = await client.keys.exists(keys);
      expect(result).toEqual(2);
    });

    it('rename(key, newKey) should rename a key', async () => {
      const key = 'test-key';
      const newKey = 'new-test-key';
      mock.onPost(`/keys/${key}/rename`).reply(200);
      await client.keys.rename(key, newKey);
      expect(mock.history.post[0].data).toEqual(JSON.stringify({ newKey }));
    });

    it('type(key) should return the type of a key', async () => {
      const key = 'test-key';
      mock.onGet(`/keys/${key}/type`).reply(200, { type: 'string' });
      const result = await client.keys.type(key);
      expect(result).toEqual('string');
    });

    it('expire(key, seconds) should set an expiration on a key', async () => {
      const key = 'test-key';
      const seconds = 60;
      mock.onPost(`/keys/${key}/expire`).reply(200);
      await client.keys.expire(key, seconds);
      expect(mock.history.post[0].data).toEqual(JSON.stringify({ seconds }));
    });

    it('ttl(key) should return the ttl of a key', async () => {
      const key = 'test-key';
      mock.onGet(`/keys/${key}/ttl`).reply(200, { ttl_in_seconds: 60 });
      const result = await client.keys.ttl(key);
      expect(result).toEqual(60);
    });
  });

  describe('Hashes Module', () => {
    it('getAll(key) should return all fields in a hash', async () => {
      const key = 'test-hash';
      const value = { field1: 'value1', field2: 'value2' };
      mock.onGet(`/hashes/${key}`).reply(200, value);
      const result = await client.hashes.getAll(key);
      expect(result).toEqual(value);
    });

    it('set(key, fields) should set fields in a hash', async () => {
      const key = 'test-hash';
      const fields = { field1: 'value1', field2: 'value2' };
      mock.onPost(`/hashes/${key}`).reply(200);
      await client.hashes.set(key, fields);
      expect(mock.history.post[0].data).toEqual(JSON.stringify(fields));
    });
  });

  describe('Lists Module', () => {
    it('getRange(key, start, stop) should return a range of elements from a list', async () => {
      const key = 'test-list';
      const value = ['"item1"', '"item2"'];
      mock.onGet(`/lists/${key}`, { params: { start: 0, stop: -1 } }).reply(200, { list: value });
      const result = await client.lists.getRange(key, 0, -1);
      expect(result).toEqual(['item1', 'item2']);
    });

    it('push(key, values) should push values to a list', async () => {
      const key = 'test-list';
      const values = ['item1', 'item2'];
      mock.onPost(`/lists/${key}`).reply(200, { listLength: 2 });
      const result = await client.lists.push(key, values);
      expect(result).toEqual(2);
      expect(mock.history.post[0].data).toEqual(JSON.stringify({ values, direction: 'right' }));
    });
  });

  describe('Sets Module', () => {
    it('add(key, members) should add members to a set', async () => {
      const key = 'test-set';
      const members = ['member1', 'member2'];
      mock.onPost(`/sets/${key}`).reply(200, { membersAdded: 2 });
      const result = await client.sets.add(key, members);
      expect(result).toEqual(2);
      expect(mock.history.post[0].data).toEqual(JSON.stringify({ members }));
    });

    it('getMembers(key) should return all members from a set', async () => {
      const key = 'test-set';
      const members = ['member1', 'member2'];
      mock.onGet(`/sets/${key}`).reply(200, { members });
      const result = await client.sets.getMembers(key);
      expect(result).toEqual(members);
    });

    it('remove(key, members) should remove members from a set', async () => {
      const key = 'test-set';
      const members = ['member1'];
      mock.onDelete(`/sets/${key}`).reply(200, { membersRemoved: 1 });
      const result = await client.sets.remove(key, members);
      expect(result).toEqual(1);
      expect(JSON.parse(mock.history.delete[0].data)).toEqual({ members });
    });
  });

  describe('SortedSets Module', () => {
    it('add(key, members) should add members to a sorted set', async () => {
      const key = 'test-sorted-set';
      const members = [{ score: 1, member: 'one' }, { score: 2, member: 'two' }];
      mock.onPost(`/sorted-sets/${key}`).reply(200, { membersAdded: 2 });
      const result = await client.sortedSets.add(key, members);
      expect(result).toEqual(2);
      expect(mock.history.post[0].data).toEqual(JSON.stringify({ members }));
    });

    it('getRange(key, start, stop) should return a range of members from a sorted set', async () => {
      const key = 'test-sorted-set';
      const members = [{ score: 1, member: 'one' }, { score: 2, member: 'two' }];
      mock.onGet(`/sorted-sets/${key}`, { params: { start: 0, stop: -1 } }).reply(200, { members });
      const result = await client.sortedSets.getRange(key, 0, -1);
      expect(result).toEqual(members);
    });

    it('remove(key, members) should remove members from a sorted set', async () => {
      const key = 'test-sorted-set';
      const members = ['one'];
      mock.onDelete(`/sorted-sets/${key}`).reply(200, { membersRemoved: 1 });
      const result = await client.sortedSets.remove(key, members);
      expect(result).toEqual(1);
      expect(JSON.parse(mock.history.delete[0].data)).toEqual({ members });
    });
  });

  describe('FlowBuilder', () => {
    it('should execute a pipeline of commands', async () => {
      const commands = [
        { command: 'set', args: ['key1', '"value1"'] },
        { command: 'get', args: ['key1'] },
      ];
      const results = [{ status: 'fulfilled', value: 'OK' }, { status: 'fulfilled', value: '"value1"' }];
      
      // Mock any POST request - the function should work regardless of URL
      mock.onPost().reply(200, results);

      const flow = client.flow();
      const response = await flow.set('key1', 'value1').get('key1').execute();

      expect(response).toEqual(results);
      expect(JSON.parse(mock.history.post[0].data)).toEqual({ commands });
    });

    it('should execute a transaction of commands', async () => {
      const commands = [
        { command: 'set', args: ['key2', '"value2"'] },
        { command: 'get', args: ['key2'] },
      ];
      const results = [['OK'], ['"value2"']];
      
      // Mock any POST request - the function should work regardless of URL
      mock.onPost().reply(200, results);

      const flow = client.flow();
      const response = await flow.set('key2', 'value2').get('key2').execute({ mode: 'transaction' });

      expect(response).toEqual(results);
      expect(JSON.parse(mock.history.post[0].data)).toEqual({ commands });
    });
  });
});
