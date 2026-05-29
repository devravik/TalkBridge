package handlers

import (
	"context"
	"encoding/json"
	"log"

	fiberws "github.com/gofiber/websocket/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/talkbridge/backend/internal/hub"
	"github.com/talkbridge/backend/internal/models"
	"github.com/talkbridge/backend/internal/services"
)

type WSHandler struct {
	hub         *hub.Hub
	db          *pgxpool.Pool
	translation *services.TranslationService
	deepgramKey string
}

func NewWSHandler(h *hub.Hub, db *pgxpool.Pool, t *services.TranslationService, deepgramKey string) *WSHandler {
	return &WSHandler{hub: h, db: db, translation: t, deepgramKey: deepgramKey}
}

type signalingMsg struct {
	Type          string          `json:"type"`
	From          string          `json:"from,omitempty"`
	To            string          `json:"to,omitempty"`
	SDP           string          `json:"sdp,omitempty"`
	Candidate     json.RawMessage `json:"candidate,omitempty"`
	ParticipantID string          `json:"participant_id,omitempty"`
	Language      string          `json:"language,omitempty"`
	Text          string          `json:"text,omitempty"`
	IsFinal       bool            `json:"is_final,omitempty"`
}

// HandleSignaling handles WebRTC signaling + caption delivery over WebSocket.
func (h *WSHandler) HandleSignaling(c *fiberws.Conn) {
	participantID := c.Query("participantId")
	language := c.Query("language")
	roomCode := c.Params("roomId")

	if participantID == "" || roomCode == "" {
		c.Close()
		return
	}
	if language == "" {
		language = "en"
	}

	client := hub.NewClient(c, participantID, language, roomCode)
	h.hub.Register(client)
	go client.WritePump()

	// Notify others that this participant joined
	joinMsg, _ := json.Marshal(signalingMsg{
		Type:          "participant-joined",
		ParticipantID: participantID,
		Language:      language,
	})
	h.hub.BroadcastToRoom(roomCode, joinMsg, participantID)

	defer func() {
		h.hub.Unregister(client)
		leaveMsg, _ := json.Marshal(signalingMsg{
			Type:          "participant-left",
			ParticipantID: participantID,
		})
		h.hub.BroadcastToRoom(roomCode, leaveMsg, participantID)
		models.MarkParticipantLeft(context.Background(), h.db, participantID)
	}()

	for {
		_, raw, err := c.ReadMessage()
		if err != nil {
			break
		}
		var msg signalingMsg
		if err := json.Unmarshal(raw, &msg); err != nil {
			continue
		}
		msg.From = participantID

		switch msg.Type {
		case "offer", "answer", "ice-candidate":
			// Forward signaling messages to the target participant
			out, _ := json.Marshal(msg)
			if msg.To != "" {
				h.hub.SendToParticipant(roomCode, msg.To, out)
			} else {
				h.hub.BroadcastToRoom(roomCode, out, participantID)
			}

		case "end-call":
			out, _ := json.Marshal(signalingMsg{Type: "end-call", From: participantID})
			h.hub.BroadcastToRoom(roomCode, out, participantID)
		}
	}
}

// HandleAudio handles audio streaming for Deepgram STT + translation.
func (h *WSHandler) HandleAudio(c *fiberws.Conn) {
	participantID := c.Query("participantId")
	language := c.Query("language")
	roomCode := c.Params("roomId")

	if participantID == "" || roomCode == "" || h.deepgramKey == "" {
		c.Close()
		return
	}

	log.Printf("audio stream started: room=%s participant=%s lang=%s", roomCode, participantID, language)

	session, err := services.NewDeepgramSession(h.deepgramKey, language, func(result services.DeepgramResult) {
		if result.Text == "" {
			return
		}

		// Build caption for sender (original text)
		selfCaption, _ := json.Marshal(fiber_map{
			"type":     "caption",
			"text":     result.Text,
			"from":     participantID,
			"language": language,
			"is_final": result.IsFinal,
			"is_own":   true,
		})
		h.hub.SendToParticipant(roomCode, participantID, selfCaption)

		if !result.IsFinal {
			// Send interim transcripts to others untranslated for low-latency feel
			interim, _ := json.Marshal(fiber_map{
				"type":     "caption",
				"text":     result.Text,
				"from":     participantID,
				"language": language,
				"is_final": false,
				"is_own":   false,
			})
			h.hub.BroadcastToRoom(roomCode, interim, participantID)
			return
		}

		// Final: translate for each other participant
		others := h.hub.GetOthers(roomCode, participantID)
		// Fetch room once for all transcript saves rather than once per goroutine
		room, _ := models.GetRoomByCode(context.Background(), h.db, roomCode)
		for _, other := range others {
			targetLang := other.Language
			go func(targetLang, targetID string) {
				translated, err := h.translation.Translate(context.Background(), result.Text, language, targetLang)
				if err != nil {
					log.Printf("translation error: %v", err)
					translated = result.Text
				}

				// Save transcript to DB
				if room != nil {
					go func() {
						t := &models.Transcript{
							RoomID:         room.ID,
							ParticipantID:  participantID,
							OriginalText:   result.Text,
							TranslatedText: translated,
							SourceLanguage: language,
							TargetLanguage: targetLang,
						}
						models.SaveTranscript(context.Background(), h.db, t)
					}()
				}

				caption, _ := json.Marshal(fiber_map{
					"type":     "caption",
					"text":     translated,
					"from":     participantID,
					"language": targetLang,
					"is_final": true,
					"is_own":   false,
				})
				h.hub.SendToParticipant(roomCode, targetID, caption)
			}(targetLang, other.ParticipantID)
		}
	})

	if err != nil {
		log.Printf("failed to start deepgram session: %v", err)
		c.Close()
		return
	}
	defer session.Close()

	for {
		msgType, data, err := c.ReadMessage()
		if err != nil {
			break
		}
		if msgType == fiberws.BinaryMessage {
			if err := session.SendAudio(data); err != nil {
				log.Printf("deepgram send error: %v", err)
				break
			}
		}
	}
}

// fiber_map is a type alias for fiber.Map equivalent
type fiber_map = map[string]interface{}
