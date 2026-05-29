package hub

import (
	"encoding/json"
	"log"
	"sync"

	fiberws "github.com/gofiber/websocket/v2"
)

type Client struct {
	Conn          *fiberws.Conn
	ParticipantID string
	Language      string
	RoomCode      string
	send          chan []byte
	mu            sync.Mutex
}

func (c *Client) Send(msg []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	select {
	case c.send <- msg:
	default:
		log.Printf("client %s send buffer full, dropping message", c.ParticipantID)
	}
}

type Hub struct {
	rooms map[string]map[string]*Client
	mu    sync.RWMutex
}

func New() *Hub {
	return &Hub{
		rooms: make(map[string]map[string]*Client),
	}
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[c.RoomCode] == nil {
		h.rooms[c.RoomCode] = make(map[string]*Client)
	}
	h.rooms[c.RoomCode][c.ParticipantID] = c
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if room, ok := h.rooms[c.RoomCode]; ok {
		delete(room, c.ParticipantID)
		if len(room) == 0 {
			delete(h.rooms, c.RoomCode)
		}
	}
}

func (h *Hub) GetOthers(roomCode, participantID string) []*Client {
	h.mu.RLock()
	defer h.mu.RUnlock()
	var others []*Client
	for id, c := range h.rooms[roomCode] {
		if id != participantID {
			others = append(others, c)
		}
	}
	return others
}

func (h *Hub) GetParticipantLanguages(roomCode, excludeID string) []string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	var langs []string
	for id, c := range h.rooms[roomCode] {
		if id != excludeID {
			langs = append(langs, c.Language)
		}
	}
	return langs
}

func (h *Hub) RoomSize(roomCode string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms[roomCode])
}

func (h *Hub) BroadcastToRoom(roomCode string, msg []byte, excludeID string) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for id, c := range h.rooms[roomCode] {
		if id != excludeID {
			c.Send(msg)
		}
	}
}

func (h *Hub) SendToParticipant(roomCode, participantID string, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if room, ok := h.rooms[roomCode]; ok {
		if c, ok := room[participantID]; ok {
			c.Send(msg)
		}
	}
}

type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data,omitempty"`
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for msg := range c.send {
		if err := c.Conn.WriteMessage(1, msg); err != nil {
			log.Printf("write error for %s: %v", c.ParticipantID, err)
			return
		}
	}
}

func NewClient(conn *fiberws.Conn, participantID, language, roomCode string) *Client {
	return &Client{
		Conn:          conn,
		ParticipantID: participantID,
		Language:      language,
		RoomCode:      roomCode,
		send:          make(chan []byte, 256),
	}
}
