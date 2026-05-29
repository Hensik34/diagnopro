const { sequelize, Test, TestField } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    const testCount = await Test.count();
    const fieldCount = await TestField.count();
    
    console.log(`✅ Database Status:`);
    console.log(`   Tests: ${testCount}`);
    console.log(`   Test Fields: ${fieldCount}`);
    
    if (testCount >= 40 && fieldCount > 0) {
      console.log(`\n✅ All data successfully seeded from SQL migration!`);
    } else {
      console.log(`\n⚠️  Some data missing. Expected 40+ tests and 100+ fields.`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
})();
