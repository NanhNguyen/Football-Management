-- Database Schema for Tournament Templates

CREATE TABLE IF NOT EXISTS tournament_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookup by code
CREATE INDEX IF NOT EXISTS idx_tournament_templates_code ON tournament_templates(code);

-- Insert initial data
INSERT INTO tournament_templates (code, name, description, default_config) VALUES
('TOURNAMENT', 'Tournament (Đấu cúp/Loại trực tiếp)', 'Chia cặp đấu loại trực tiếp từng vòng cho đến chung kết.', '{"theThuc": "tournament", "luotVongBang": 1, "maxTeams": 16, "maxPlayers": 20, "starterCount": 7, "benchCount": 7, "matchDurationMinutes": 90, "breakTimeMinutes": 15, "minRestHours": 48, "matchesPerWeek": 4, "pitchesAvailable": 2, "standingsConfig": {"phongDo": false, "thePhat": false}}'::jsonb),
('LEAGUE', 'League (Đấu vòng tròn)', 'Các đội thi đấu vòng tròn tính điểm.', '{"theThuc": "league", "soVongLeague": 1, "maxTeams": 16, "maxPlayers": 20, "starterCount": 7, "benchCount": 7, "matchDurationMinutes": 90, "breakTimeMinutes": 15, "minRestHours": 48, "matchesPerWeek": 8, "pitchesAvailable": 2, "standingsConfig": {"phongDo": true, "thePhat": true}}'::jsonb),
('MIXED', 'Tournament (Vòng bảng + Loại trực tiếp)', 'Thi đấu vòng bảng tính điểm, sau đó các đội nhất nhì vào đá loại trực tiếp.', '{"theThuc": "tournament", "luotVongBang": 1, "maxTeams": 16, "maxPlayers": 20, "starterCount": 7, "benchCount": 7, "matchDurationMinutes": 90, "breakTimeMinutes": 15, "minRestHours": 48, "matchesPerWeek": 8, "pitchesAvailable": 2, "standingsConfig": {"phongDo": true, "thePhat": false}}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  default_config = EXCLUDED.default_config,
  updated_at = CURRENT_TIMESTAMP;
