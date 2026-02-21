const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Log connection attempt for debugging
    console.log('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout to 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    // Provide specific troubleshooting tips
    if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
      console.error('\n🔍 Troubleshooting tips:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify MongoDB Atlas cluster is running (not paused)');
      console.error('   3. Check if your IP is whitelisted in MongoDB Atlas Network Access');
      console.error('   4. Try using the standard connection string (non-SRV) if DNS issues persist');
      console.error('   5. Verify the connection string in MongoDB Atlas dashboard');
    } else if (error.message.includes('authentication')) {
      console.error('\n🔍 Authentication issue:');
      console.error('   - Check your username and password in .env');
      console.error('   - Verify credentials in MongoDB Atlas');
    }
    
    console.error('\n   Connection string format: mongodb+srv://username:password@cluster.mongodb.net/database');
    process.exit(1);
  }
};

module.exports = connectDB;
