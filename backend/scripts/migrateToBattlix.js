import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function copyDatabase() {
  const baseUri = process.env.MONGO_URI;
  if (!baseUri) {
    throw new Error('MONGO_URI is not set in backend/.env');
  }

  // Ensure connection strings for source (Code_Game) and target (battlix)
  const sourceUri = baseUri.replace(/\/[^/?]+(\?|$)/, '/Code_Game$1');
  const targetUri = baseUri.replace(/\/[^/?]+(\?|$)/, '/battlix$1');

  console.log('🚀 Starting MongoDB copy:');
  console.log('   Source DB: Code_Game');
  console.log('   Target DB: battlix');
  console.log('   Cluster:  ', sourceUri.replace(/:([^:@]+)@/, ':****@'));

  // Connect to source and target
  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  const targetConn = await mongoose.createConnection(targetUri).asPromise();

  console.log('\nConnected to both source and target databases successfully.');

  const sourceDb = sourceConn.db;
  const targetDb = targetConn.db;

  const collections = await sourceDb.listCollections().toArray();
  console.log(`Found ${collections.length} collection(s) in Code_Game:\n`);

  for (const collInfo of collections) {
    const collName = collInfo.name;
    // Skip system collections if any
    if (collName.startsWith('system.')) continue;

    const sourceColl = sourceDb.collection(collName);
    const targetColl = targetDb.collection(collName);

    const docCount = await sourceColl.countDocuments();
    console.log(`📦 Copying collection "${collName}" (${docCount} documents)...`);

    if (docCount > 0) {
      // Fetch all docs
      const docs = await sourceColl.find({}).toArray();

      // Drop target collection if it exists to ensure a clean clone
      try {
        await targetColl.drop();
      } catch (err) {
        // Collection might not exist yet, that's fine
      }

      // Insert docs in batches of 500
      const batchSize = 500;
      for (let i = 0; i < docs.length; i += batchSize) {
        const chunk = docs.slice(i, i + batchSize);
        await targetColl.insertMany(chunk, { ordered: false });
      }
    }

    // Copy Indexes
    try {
      const indexes = await sourceColl.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue; // Mongo creates _id index automatically
        const { key, name, unique, sparse, expireAfterSeconds } = idx;
        const options = { name };
        if (unique) options.unique = true;
        if (sparse) options.sparse = true;
        if (expireAfterSeconds !== undefined) options.expireAfterSeconds = expireAfterSeconds;

        await targetColl.createIndex(key, options);
      }
    } catch (idxErr) {
      console.warn(`   ⚠️ Warning copying indexes for ${collName}:`, idxErr.message);
    }

    const targetDocCount = await targetColl.countDocuments();
    console.log(`   ✅ "${collName}" copied: ${targetDocCount}/${docCount} documents verified.\n`);
  }

  // Verification step
  console.log('====================================');
  console.log('🎉 VERIFICATION: Target DB "battlix"');
  console.log('====================================');
  const targetColls = await targetDb.listCollections().toArray();
  for (const c of targetColls) {
    const count = await targetDb.collection(c.name).countDocuments();
    console.log(` - ${c.name}: ${count} documents`);
  }

  await sourceConn.close();
  await targetConn.close();
  console.log('\n✨ Database migration completed successfully!');
}

copyDatabase().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
