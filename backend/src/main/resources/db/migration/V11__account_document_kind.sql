-- V11 — what each uploaded account document is.
--
-- REQ-4 validate registration details. A volunteer diver attaches certificates and licences in
-- separate boxes, and an administrator or government officer attaches proof of appointment, so a
-- reviewer needs to know which is which. Rows written before this are diving certificates.

ALTER TABLE account_documents ADD COLUMN kind VARCHAR(20);

UPDATE account_documents SET kind = 'CERTIFICATE' WHERE kind IS NULL;
