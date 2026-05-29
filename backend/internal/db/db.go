package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(databaseURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(context.Background()); err != nil {
		return nil, err
	}
	return pool, nil
}

func Migrate(pool *pgxpool.Pool) error {
	_, err := pool.Exec(context.Background(), schema)
	return err
}

const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(12) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    translated_text TEXT,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_room_id ON transcripts(room_id);
`
