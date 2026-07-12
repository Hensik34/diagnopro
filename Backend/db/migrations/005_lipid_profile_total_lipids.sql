-- Migration to configure Total Lipids in Lipid Profile as a calculated field.

-- Update test_fields (global master data)
UPDATE test_fields 
SET field_type = 'calculated', 
    formula = '2.27 * Serum Cholesterol + Serum Triglyceride + 62.3', 
    depends_on = 'Serum Cholesterol,Serum Triglyceride' 
WHERE field_name = 'Total Lipids' 
  AND test_id = (SELECT id FROM tests WHERE test_code = 'LIPID-01');

-- Update branch_test_fields (individual branch-specific configurations)
UPDATE branch_test_fields 
SET field_type = 'calculated', 
    formula = '2.27 * Serum Cholesterol + Serum Triglyceride + 62.3', 
    depends_on = 'Serum Cholesterol,Serum Triglyceride' 
WHERE field_name = 'Total Lipids' 
  AND test_id = (SELECT id FROM tests WHERE test_code = 'LIPID-01');
