CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id VARCHAR(36),
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  completed_at BIGINT,
  scheduled_days JSON,
  one_time_task BIGINT,
  expanded BOOLEAN DEFAULT FALSE,
  reminder BIGINT,
  created_at_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent_id (parent_id),
  INDEX idx_is_completed (is_completed),
  INDEX idx_created_at (created_at),
  INDEX idx_completed_at (completed_at),
  INDEX idx_scheduled_days ((CAST(scheduled_days AS CHAR(255)))),
  CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS progress_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  progress DECIMAL(5,2) NOT NULL CHECK (progress >= 0 AND progress <= 100),
  total_goals INT NOT NULL CHECK (total_goals >= 0),
  completed_goals INT NOT NULL CHECK (completed_goals >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
