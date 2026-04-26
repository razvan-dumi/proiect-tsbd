-- Run as MOVIES @ FREEPDB1.
-- Idempotent: drops and recreates the ONNX model, table, and vector index.

WHENEVER SQLERROR EXIT FAILURE;

BEGIN EXECUTE IMMEDIATE 'DROP INDEX movies_emb_idx';
EXCEPTION WHEN OTHERS THEN IF SQLCODE NOT IN (-1418, -942) THEN RAISE; END IF;
END;
/

BEGIN EXECUTE IMMEDIATE 'DROP TABLE movies PURGE';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
  DBMS_VECTOR.DROP_ONNX_MODEL(model_name => 'ALL_MINILM_L6_V2', force => TRUE);
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- Load the augmented all-MiniLM-L6-v2 ONNX model into the DB.
-- Expects models/oracle/all_MiniLM_L6_v2_augmented.onnx on the host
-- (mounted to /opt/oracle/models inside the container).
BEGIN
  DBMS_VECTOR.LOAD_ONNX_MODEL(
    directory  => 'ONNX_DIR',
    file_name  => 'all_MiniLM_L6_v2_augmented.onnx',
    model_name => 'ALL_MINILM_L6_V2'
  );
END;
/

CREATE TABLE movies (
  id           NUMBER(10)        PRIMARY KEY,
  title        VARCHAR2(512)     NOT NULL,
  overview     CLOB,
  release_date VARCHAR2(20),
  poster_path  VARCHAR2(255),
  genres       JSON,
  vote_average BINARY_DOUBLE,
  embedding    VECTOR(384, FLOAT32)
);

CREATE VECTOR INDEX movies_emb_idx ON movies (embedding)
  ORGANIZATION INMEMORY NEIGHBOR GRAPH
  DISTANCE COSINE
  WITH TARGET ACCURACY 95;

EXIT;
