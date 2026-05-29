package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type TranslationService struct {
	apiKey  string
	baseURL string
	model   string
	client  *http.Client
}

var languageNames = map[string]string{
	"ar":    "Arabic",
	"en":    "English",
	"es":    "Spanish",
	"fr":    "French",
	"de":    "German",
	"zh-CN": "Chinese (Simplified)",
	"pt":    "Portuguese",
	"ko":    "Korean",
	"ja":    "Japanese",
	"hi":    "Hindi",
}

func NewTranslationService(openRouterKey, openAIKey, model string) *TranslationService {
	apiKey := openRouterKey
	baseURL := "https://openrouter.ai/api/v1"
	if apiKey == "" {
		apiKey = openAIKey
		baseURL = "https://api.openai.com/v1"
	}
	return &TranslationService{
		apiKey:  apiKey,
		baseURL: baseURL,
		model:   model,
		client:  &http.Client{Timeout: 10 * time.Second},
	}
}

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (s *TranslationService) Translate(ctx context.Context, text, sourceLang, targetLang string) (string, error) {
	if sourceLang == targetLang {
		return text, nil
	}
	targetName := languageNames[targetLang]
	if targetName == "" {
		targetName = targetLang
	}

	req := chatRequest{
		Model: s.model,
		Messages: []chatMessage{
			{
				Role:    "system",
				Content: fmt.Sprintf("You are a translator. Translate the user's text to %s. Return ONLY the translated text, nothing else.", targetName),
			},
			{Role: "user", Content: text},
		},
	}

	body, _ := json.Marshal(req)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("translation API returned %d", resp.StatusCode)
	}

	var result chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no translation returned")
	}
	return strings.TrimSpace(result.Choices[0].Message.Content), nil
}
