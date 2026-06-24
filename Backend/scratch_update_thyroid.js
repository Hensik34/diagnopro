require('dotenv').config();
const { sequelize, Test, TestField, UserTestField } = require('./models');

(async () => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Find the test
    const test = await Test.findOne({ where: { test_code: 'THYPRO-01' } });
    if (!test) {
      console.log('❌ Test THYPRO-01 not found.');
      process.exit(1);
    }

    // Update name and description
    await test.update({
      test_name: 'Thyroid Profile (Total T3, Total T4, TSH)',
      description: 'TSH, Total T3, Total T4'
    }, { transaction });

    // 2. Delete existing test fields
    await TestField.destroy({ where: { test_id: test.id }, transaction });
    await UserTestField.destroy({ where: { test_id: test.id }, transaction });

    // 3. Insert new fields
    const fields = [
      {
        test_id: test.id,
        field_name: 'TSH',
        unit: 'uIU/mL',
        min_value: 0.40,
        max_value: 4.50,
        input_type: 'number',
        order_index: 1,
        field_type: 'input',
        section_group: 'Thyroid | Hormones',
        critical_rules: { high: 100, low: 0.01 },
        is_mandatory: true
      },
      {
        test_id: test.id,
        field_name: 'Total T3',
        unit: 'ng/dL',
        min_value: 80.00,
        max_value: 200.00,
        input_type: 'number',
        order_index: 2,
        field_type: 'input',
        section_group: 'Thyroid | Hormones',
        is_mandatory: true
      },
      {
        test_id: test.id,
        field_name: 'Total T4',
        unit: 'ug/dL',
        min_value: 4.60,
        max_value: 12.00,
        input_type: 'number',
        order_index: 3,
        field_type: 'input',
        section_group: 'Thyroid | Hormones',
        is_mandatory: true
      }
    ];

    for (const f of fields) {
      await TestField.create(f, { transaction });
    }

    await transaction.commit();
    console.log('✅ Successfully updated THYPRO-01 fields and test record!');
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Failed to update thyroid profile:', err);
    process.exit(1);
  }
})();
