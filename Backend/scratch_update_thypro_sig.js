require('dotenv').config();
const { sequelize, Test } = require('./models');

(async () => {
  try {
    const test = await Test.findOne({ where: { test_code: 'THYPRO-01' } });
    if (!test) {
      console.error('❌ Test THYPRO-01 not found.');
      process.exit(1);
    }

    const newClinicalSignificance = `• TSH levels are subject to circadian variation, reaching peak levels between 2-4 am and at a minimum between 6-10 pm. The variation is of the order of 50%, hence time of the day has influence on the measured serum TSH concentrations.
• Rheumatoid factor, human antimouse antibodies, heterophile antibodies may produce spurious results, especially in patients with autoimmune disorders (=10%). - Amiodarone may interfere with TSH.
• Non thyroidal illness like severe infections, liver disease, renal and heart failure, severe burns, trauma and surgery, pregnancy, Acute psychiatric illness, Severe dehydration may show transient variation in TSH value.

Thyroid Condition                                             T3          T4          TSH
1. Normal Thyroid Function (Eurothyroid)                      N           N           N
2. Primary Hyperthyroidism                                    H           H           L
3. Secondary Hyperthyroidism Grave's Thyroiditis              H           H           H
4. T3 Thyrotoxicosis                                          H           N           N/L
5. Primary Hypothyroidism                                     L           L           H/N
6. Secondary Hypothyroidism                                   L           L           L
7. Subclinical Hypothyroidism                                 N           N           H
8. Patient on Treatment                                       N           N/H         L
9. Non thyroidal illness (NTI) / Subclinical Hyperthyroid     N           N           L`;

    await test.update({ clinical_significance: newClinicalSignificance });
    console.log('✅ Successfully updated THYPRO-01 clinical_significance in the database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to update thyroid profile clinical significance:', err);
    process.exit(1);
  }
})();
