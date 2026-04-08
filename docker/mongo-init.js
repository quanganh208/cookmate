// Initialize cookmate database with collections and indexes
db = db.getSiblingDB('cookmate');

// Create collections
db.createCollection('users');
db.createCollection('recipes');
db.createCollection('ingredients');
db.createCollection('collections');
db.createCollection('comments');
db.createCollection('reactions');
db.createCollection('cooksnaps');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });

db.recipes.createIndex({ title: 'text', description: 'text' });
db.recipes.createIndex({ createdAt: -1 });
db.recipes.createIndex({ authorId: 1 });
db.recipes.createIndex({ status: 1 });
db.recipes.createIndex({ category: 1 });
db.recipes.createIndex({ isFeatured: 1 });

db.ingredients.createIndex({ name: 1 }, { unique: true });
db.ingredients.createIndex({ category: 1 });

db.collections.createIndex({ authorId: 1 });

db.comments.createIndex({ recipeId: 1 });
db.comments.createIndex({ authorId: 1 });
db.comments.createIndex({ createdAt: -1 });

db.reactions.createIndex({ recipeId: 1, authorId: 1 }, { unique: true });

db.cooksnaps.createIndex({ recipeId: 1 });
db.cooksnaps.createIndex({ authorId: 1 });

print('MongoDB initialized: cookmate database with all collections and indexes');
