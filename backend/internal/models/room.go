package models

import (
	"context"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Room struct {
	ID        string     `json:"id"`
	RoomCode  string     `json:"room_code"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt time.Time  `json:"expires_at"`
	EndedAt   *time.Time `json:"ended_at,omitempty"`
}

const codeChars = "abcdefghijklmnopqrstuvwxyz0123456789"

func generateRoomCode() string {
	b := make([]byte, 8)
	for i := range b {
		b[i] = codeChars[rand.Intn(len(codeChars))]
	}
	return string(b)
}

func CreateRoom(ctx context.Context, pool *pgxpool.Pool) (*Room, error) {
	code := generateRoomCode()
	var room Room
	err := pool.QueryRow(ctx,
		`INSERT INTO rooms (room_code) VALUES ($1)
         RETURNING id, room_code, created_at, expires_at`,
		code,
	).Scan(&room.ID, &room.RoomCode, &room.CreatedAt, &room.ExpiresAt)
	return &room, err
}

func GetRoomByCode(ctx context.Context, pool *pgxpool.Pool, code string) (*Room, error) {
	var room Room
	err := pool.QueryRow(ctx,
		`SELECT id, room_code, created_at, expires_at, ended_at FROM rooms WHERE room_code = $1`,
		code,
	).Scan(&room.ID, &room.RoomCode, &room.CreatedAt, &room.ExpiresAt, &room.EndedAt)
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func EndRoom(ctx context.Context, pool *pgxpool.Pool, roomCode string) error {
	_, err := pool.Exec(ctx,
		`UPDATE rooms SET ended_at = NOW() WHERE room_code = $1`,
		roomCode,
	)
	return err
}
