import mongoose from 'mongoose';

const MONGO_URI = "mongodb://localhost:27017/payroll";

async function verifyMongoDB() {
  console.log("🔍 Verifying MongoDB Connection...");
  console.log(`📍 URI: ${MONGO_URI}\n`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });

    console.log("✅ Connected to MongoDB successfully!\n");

    // Get database info
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log("📦 Collections in 'payroll' database:");
    if (collections.length === 0) {
      console.log("   (No collections yet)");
    } else {
      collections.forEach(col => {
        console.log(`   • ${col.name}`);
      });
    }

    // Check users collection
    if (collections.some(c => c.name === 'users')) {
      const userCount = await db.collection('users').countDocuments();
      console.log(`\n👥 Users collection has: ${userCount} document(s)`);
      
      if (userCount > 0) {
        const users = await db.collection('users').find({}).limit(5).toArray();
        console.log("\n📋 Stored users:");
        users.forEach((user, idx) => {
          console.log(`   ${idx + 1}. Email: ${user.email}`);
          console.log(`      Name: ${user.full_name}`);
          console.log(`      Role: ${user.role}`);
          console.log(`      Created: ${user.created_date}`);
        });
      } else {
        console.log("   ⚠️  No users stored yet");
      }
    } else {
      console.log("\n⚠️  'users' collection doesn't exist yet (will be created on first registration)");
    }

    console.log("\n✅ MongoDB is working correctly!");
    console.log("\n📝 Summary:");
    console.log("   • MongoDB Connection: ✅ OK");
    console.log("   • Database: ✅ payroll");
    console.log(`   • Users stored: ${collections.some(c => c.name === 'users') ? (await db.collection('users').countDocuments()) : 0}`);

  } catch (error) {
    console.error("\n❌ Error:");
    console.error(`   ${error.message}`);
    console.error("\nPossible causes:");
    console.error("   1. MongoDB service is not running");
    console.error("   2. MongoDB is not installed");
    console.error("   3. MongoDB is listening on a different port");
    console.error("\nSolution:");
    console.error("   1. Start MongoDB: net start MongoDB");
    console.error("   2. Or install from: https://www.mongodb.com/try/download/community");
  } finally {
    await mongoose.connection.close();
  }
}

verifyMongoDB();
