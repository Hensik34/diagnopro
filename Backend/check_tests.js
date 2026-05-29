const {Test, TestReferenceRange, TestPackage} = require('./models');

(async () => {
  try {
    const testCount = await Test.count();
    const refRangeCount = await TestReferenceRange.count();
    const packageCount = await TestPackage.count();
    
    const tests = await Test.findAll({
      attributes: ['test_code', 'test_name', 'category'],
      raw: true,
      order: [['category', 'ASC'], ['test_code', 'ASC']],
      limit: 50
    });
    
    console.log('\n========== DATABASE STATUS ==========');
    console.log('✅ Total Tests: ' + testCount);
    console.log('✅ Reference Ranges: ' + refRangeCount);
    console.log('✅ Test Packages: ' + packageCount);
    console.log('\n========== TEST CATEGORIES ==========');
    
    const categories = {};
    tests.forEach(t => {
      if (!categories[t.category]) categories[t.category] = [];
      categories[t.category].push(t.test_code);
    });
    
    Object.keys(categories).sort().forEach(cat => {
      console.log('\n' + cat + ':');
      categories[cat].forEach(code => console.log('  - ' + code));
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
