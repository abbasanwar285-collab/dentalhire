-- Transfer scan records from "اسراء محمد" to "اسراء محمد علي"
-- Source Patient: اسراء محمد (a79481b8-994f-475c-89ea-88453a5a4bea)
-- Target Patient: اسراء محمد علي (e14339a2-622d-47fc-b7e6-5ae486e6855a)

UPDATE patient_scans 
SET patient_id = 'e14339a2-622d-47fc-b7e6-5ae486e6855a'
WHERE patient_id = 'a79481b8-994f-475c-89ea-88453a5a4bea'
  AND file_name LIKE '%asraa mohamed%';

-- Verify the transfer
SELECT 
  id,
  patient_id,
  file_name,
  created_at
FROM patient_scans
WHERE patient_id = 'e14339a2-622d-47fc-b7e6-5ae486e6855a'
ORDER BY created_at DESC;
