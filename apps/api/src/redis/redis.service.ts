

import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  private store: Record<string, string> = {};

  constructor() {
    console.log('Redis Mocked (Standalone mode)');
  }

  async set(key: string, value: any) {
    this.store[key] = JSON.stringify(value);
  }

  async get(key: string) {
    const value = this.store[key];
    return value ? JSON.parse(value) : null;
  }
}
