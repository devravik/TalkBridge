package models

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Participant struct {
	ID          string     `json:"id"`
	RoomID      string     `json:"room_id"`
	DisplayName string     `json:"display_name"`
	Language    string     `json:"language"`
	JoinedAt    time.Time  `json:"joined_at"`
	LeftAt      *time.Time `json:"left_at,omitempty"`
}

func CreateParticipant(ctx context.Context, pool *pgxpool.Pool, roomID, displayName, language string) (*Participant, error) {
	var p Participant
	err := pool.QueryRow(ctx,
		`INSERT INTO participants (room_id, display_name, language) VALUES ($1, $2, $3)
         RETURNING id, room_id, display_name, language, joined_at`,
		roomID, displayName, language,
	).Scan(&p.ID, &p.RoomID, &p.DisplayName, &p.Language, &p.JoinedAt)
	return &p, err
}

func MarkParticipantLeft(ctx context.Context, pool *pgxpool.Pool, participantID string) error {
	_, err := pool.Exec(ctx,
		`UPDATE participants SET left_at = NOW() WHERE id = $1`,
		participantID,
	)
	return err
}
