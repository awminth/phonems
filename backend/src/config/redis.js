const Redis = require('ioredis');

// Redis Configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 1,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

// Create Redis Client
const redis = new Redis(redisConfig);

// Redis Event Handlers
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  //console.error('❌ Redis error:', err.message);
});

redis.on('ready', () => {
  console.log('📦 Redis ready');
});

// Connect to Redis
redis.connect().catch((err) => {
  console.log('⚠️ Redis not available, using fallback (no caching)');
});

// Cache Helper Functions
const cacheHelpers = {
  // Get cached data
  async get(key) {
    try {
      if (redis.status !== 'ready') return null;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  },

  // Set cache data with expiration (default 5 minutes)
  async set(key, data, expireSeconds = 300) {
    try {
      if (redis.status !== 'ready') return false;
      await redis.setex(key, expireSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  },

  // Delete cache by key
  async del(key) {
    try {
      if (redis.status !== 'ready') return false;
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error.message);
      return false;
    }
  },

  // Delete cache by pattern
  async delPattern(pattern) {
    try {
      if (redis.status !== 'ready') return false;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delPattern error:', error.message);
      return false;
    }
  }
};

module.exports = redis;
module.exports.cache = cacheHelpers;

