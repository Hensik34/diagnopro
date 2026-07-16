require("dotenv").config();
const pool = require("./config/db");

const newClinicalSig = `
\u2022 TSH levels are subject to circadian variation, reaching peak levels between 2-4 am and at a minimum between 6-10 pm. The variation is of the order of 50%, hence time of the day has influence on the measured serum TSH concentrations.
\u2022 Rheumatoid factor, human antimouse antibodies, heterophile antibodies may produce spurious results, especially in patients with autoimmune disorders (=10%). - Amiodarone may interfere with TSH.
\u2022 Non thyroidal illness like severe infections, liver disease, renal and heart failure, severe burns, trauma and surgery, pregnancy, Acute psychiatric illness, Severe dehydration may show transient variation in TSH value.

| Thyroid Condition | T3 | T4 | TSH |
| --- | --- | --- | --- |
| 1. Normal Thyroid Function (Eurothyroid) | N | N | N |
| 2. Primary Hyperthyroidism | H | H | L |
| 3. Secondary Hyperthyroidism Grave's Thyroiditis | H | H | H |
| 4. T3 Thyrotoxicosis | H | N | N/L |
| 5. Primary Hypothyroidism | L | L | H/N |
| 6. Secondary Hypothyroidism | L | L | L |
| 7. Subclinical Hypothyroidism | N | N | H |
| 8. Patient on Treatment | N | N/H | L |
| 9. Non thyroidal illness (NTI) / Subclinical Hyperthyroid | N | N | L |`;

(async () => {
  try {
    const r = await pool.query(
      "UPDATE tests SET clinical_significance = $1 WHERE test_code = $2",
      [newClinicalSig, "THYPRO-01"]
    );
    console.log("Updated THYPRO-01 rows:", r.rowCount);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
})();
