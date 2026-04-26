#!/bin/bash
# Runs once, on first DB creation. The Oracle entrypoint invokes every
# *.sh / *.sql file in /opt/oracle/scripts/setup/ in lexical order.
#
# Pass 1 (SYSDBA): set vector_memory_size, bounce the instance so it takes
#                  effect, then create the MOVIES app user and ONNX_DIR.
# Pass 2 (MOVIES): load the all-MiniLM ONNX model and create the schema.
set -euo pipefail

SQL_DIR=/opt/oracle/scripts/setup/sql

sqlplus -S / as sysdba <<EOF
ALTER SYSTEM SET vector_memory_size = 512M SCOPE=SPFILE;
SHUTDOWN IMMEDIATE
STARTUP
WHENEVER SQLERROR EXIT FAILURE
BEGIN EXECUTE IMMEDIATE 'ALTER PLUGGABLE DATABASE FREEPDB1 OPEN';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -65019 THEN RAISE; END IF;
END;
/
ALTER SESSION SET CONTAINER = FREEPDB1;
@${SQL_DIR}/admin.sql
EXIT
EOF

sqlplus -S movies/demo_password@//localhost:1521/FREEPDB1 @${SQL_DIR}/app.sql
