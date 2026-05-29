package models

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Transcript struct {
	ID             string    `json:"id"`
	RoomID         string    `json:"room_id"`
	ParticipantID  string    `json:"participant_id"`
	OriginalText   string    `json:"original_text"`
	TranslatedText string    `json:"translated_text"`
	SourceLanguage string    `json:"source_language"`
	TargetLanguage string    `json:"target_language"`
	CreatedAt      time.Time `json:"created_at"`
}

func SaveTranscript(ctx context.Context, pool *pgxpool.Pool, t *Transcript) error {
	return pool.QueryRow(ctx,
		`INSERT INTO transcripts (room_id, participant_id, original_text, translated_text, source_language, target_language)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
		t.RoomID, t.ParticipantID, t.OriginalText, t.TranslatedText, t.SourceLanguage, t.TargetLanguage,
	).Scan(&t.ID, &t.CreatedAt)
}
