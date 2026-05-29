package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/gorilla/websocket"
)

type DeepgramResult struct {
	Text    string
	IsFinal bool
}

type DeepgramSession struct {
	conn     *websocket.Conn
	OnResult func(DeepgramResult)
	done     chan struct{}
}

type deepgramResponse struct {
	Type    string `json:"type"`
	Channel struct {
		Alternatives []struct {
			Transcript string `json:"transcript"`
		} `json:"alternatives"`
	} `json:"channel"`
	IsFinal bool `json:"is_final"`
	Speech  bool `json:"speech_final"`
}

func NewDeepgramSession(apiKey, language string, onResult func(DeepgramResult)) (*DeepgramSession, error) {
	params := url.Values{}
	params.Set("model", "nova-2")
	params.Set("language", language)
	params.Set("punctuate", "true")
	params.Set("interim_results", "true")
	params.Set("endpointing", "300")
	params.Set("encoding", "linear16")
	params.Set("sample_rate", "16000")

	u := fmt.Sprintf("wss://api.deepgram.com/v1/listen?%s", params.Encode())

	header := http.Header{}
	header.Set("Authorization", "Token "+apiKey)

	conn, _, err := websocket.DefaultDialer.Dial(u, header)
	if err != nil {
		return nil, fmt.Errorf("deepgram connect: %w", err)
	}

	s := &DeepgramSession{
		conn:     conn,
		OnResult: onResult,
		done:     make(chan struct{}),
	}
	go s.readPump()
	return s, nil
}

func (s *DeepgramSession) readPump() {
	defer close(s.done)
	for {
		_, msg, err := s.conn.ReadMessage()
		if err != nil {
			if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("deepgram read error: %v", err)
			}
			return
		}
		var resp deepgramResponse
		if err := json.Unmarshal(msg, &resp); err != nil {
			continue
		}
		if resp.Type != "Results" {
			continue
		}
		if len(resp.Channel.Alternatives) == 0 {
			continue
		}
		text := resp.Channel.Alternatives[0].Transcript
		if text == "" {
			continue
		}
		s.OnResult(DeepgramResult{
			Text:    text,
			IsFinal: resp.IsFinal,
		})
	}
}

func (s *DeepgramSession) SendAudio(data []byte) error {
	return s.conn.WriteMessage(websocket.BinaryMessage, data)
}

func (s *DeepgramSession) Close() {
	s.conn.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	s.conn.Close()
	<-s.done
}
