package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/talkbridge/backend/internal/models"
)

type RoomHandler struct {
	db          *pgxpool.Pool
	frontendURL string
}

func NewRoomHandler(db *pgxpool.Pool, frontendURL string) *RoomHandler {
	return &RoomHandler{db: db, frontendURL: frontendURL}
}

func (h *RoomHandler) CreateRoom(c *fiber.Ctx) error {
	room, err := models.CreateRoom(c.Context(), h.db)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to create room"})
	}
	return c.JSON(fiber.Map{
		"room_id":  room.RoomCode,
		"join_url": h.frontendURL + "/c/" + room.RoomCode,
	})
}

func (h *RoomHandler) JoinRoom(c *fiber.Ctx) error {
	roomCode := c.Params("roomId")

	var body struct {
		DisplayName string `json:"display_name"`
		Language    string `json:"language"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	if body.Language == "" {
		body.Language = "en"
	}

	room, err := models.GetRoomByCode(c.Context(), h.db, roomCode)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "room not found"})
	}
	if room.EndedAt != nil {
		return c.Status(410).JSON(fiber.Map{"error": "room has ended"})
	}

	p, err := models.CreateParticipant(c.Context(), h.db, room.ID, body.DisplayName, body.Language)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to join room"})
	}

	return c.JSON(fiber.Map{
		"participant_id": p.ID,
		"room_id":        room.RoomCode,
		"language":       p.Language,
	})
}

func (h *RoomHandler) GetRoom(c *fiber.Ctx) error {
	roomCode := c.Params("roomId")
	room, err := models.GetRoomByCode(c.Context(), h.db, roomCode)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "room not found"})
	}
	return c.JSON(room)
}

func (h *RoomHandler) EndRoom(c *fiber.Ctx) error {
	roomCode := c.Params("roomId")
	if err := models.EndRoom(c.Context(), h.db, roomCode); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to end room"})
	}
	return c.JSON(fiber.Map{"status": "ended"})
}
