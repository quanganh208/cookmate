// Initialize cookmate database with collections and indexes
db = db.getSiblingDB('cookmate');

// Create collections
db.createCollection('users');
db.createCollection('recipes');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.recipes.createIndex({ title: 'text', description: 'text' });
db.recipes.createIndex({ createdAt: -1 });
db.recipes.createIndex({ authorId: 1 });

print('MongoDB initialized: cookmate database with users and recipes collections');
