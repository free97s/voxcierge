CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE intent_extractions ADD COLUMN embedding vector(1536);
ALTER TABLE tasks ADD COLUMN embedding vector(1536);

CREATE INDEX idx_intent_extractions_embedding ON intent_extractions
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_tasks_embedding ON tasks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
