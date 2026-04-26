-- Run from inside an outer SYSDBA sqlplus session that has already
-- switched container to FREEPDB1. Must NOT contain ALTER SESSION or EXIT.

DECLARE
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM dba_users WHERE username = 'MOVIES';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'CREATE USER movies IDENTIFIED BY demo_password
                       DEFAULT TABLESPACE users QUOTA UNLIMITED ON users';
  END IF;
END;
/

GRANT CREATE SESSION, RESOURCE, CREATE MINING MODEL, DB_DEVELOPER_ROLE TO movies;

CREATE OR REPLACE DIRECTORY ONNX_DIR AS '/opt/oracle/models';
GRANT READ ON DIRECTORY ONNX_DIR TO movies;
