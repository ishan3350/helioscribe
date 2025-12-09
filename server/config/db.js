const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'helioscribe';
    
    // Simple approach: Check if database name is already in URI
    // Format: mongodb://user:pass@host:port/database
    // We'll check if there's a / after the host:port that's not part of the password
    
    // Find the @ symbol (separates credentials from host)
    const atIndex = mongoURI.indexOf('@');
    
    if (atIndex !== -1) {
      // Extract everything after @ (host:port/database?options)
      const afterAt = mongoURI.substring(atIndex + 1);
      
      // Check if there's a slash after host:port (indicating database name)
      // Host:port format is typically host:port or just host
      const slashIndex = afterAt.indexOf('/');
      const queryIndex = afterAt.indexOf('?');
      
      if (slashIndex === -1) {
        // No slash found, add database name
        if (queryIndex !== -1) {
          // There's a query string, insert database before it
          mongoURI = mongoURI.substring(0, atIndex + 1) + afterAt.substring(0, queryIndex) + '/' + dbName + afterAt.substring(queryIndex);
        } else {
          // No query string, append database
          mongoURI = mongoURI + '/' + dbName;
        }
      } else {
        // Slash exists, check if it's followed by a database name or just a query string
        const afterSlash = afterAt.substring(slashIndex + 1);
        if (afterSlash.startsWith('?') || afterSlash === '') {
          // No database name, add it
          mongoURI = mongoURI.substring(0, atIndex + 1) + afterAt.substring(0, slashIndex + 1) + dbName + (afterSlash.startsWith('?') ? afterSlash : '');
        }
        // If database already exists, keep it as is
      }
    } else {
      // No @ symbol, might be connection string without auth
      // Just append database if not present
      if (!mongoURI.includes('/' + dbName)) {
        const queryIndex = mongoURI.indexOf('?');
        if (queryIndex !== -1) {
          mongoURI = mongoURI.substring(0, queryIndex) + '/' + dbName + mongoURI.substring(queryIndex);
        } else {
          mongoURI = mongoURI + '/' + dbName;
        }
      }
    }

    console.log('Connecting to MongoDB...');
    
    // Try connecting with authSource if authentication is needed
    // If the URI doesn't have authSource, try adding it
    let finalURI = mongoURI;
    if (mongoURI.includes('@') && !mongoURI.includes('authSource')) {
      // Add authSource=admin to the connection string
      const separator = mongoURI.includes('?') ? '&' : '?';
      finalURI = mongoURI + separator + 'authSource=admin';
    }
    
    // Connect without deprecated options
    const conn = await mongoose.connect(finalURI);

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`\n✗ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('Authentication failed') || error.message.includes('authentication failed')) {
      console.error('\n⚠️  Authentication failed. Please verify:');
      console.error('   1. MongoDB username and password are correct');
      console.error('   2. The user "admin" has proper permissions');
      console.error('   3. The connection string format is correct');
      console.error('\n   Note: The password in the connection string should be URL-encoded');
      console.error('   Special characters: % = %25, @ = %40, $ = %24, & = %26');
    }
    process.exit(1);
  }
};

module.exports = connectDB;

