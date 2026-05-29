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

// azureLangCodes maps our language codes to Azure Translator codes where they differ
var azureLangCodes = map[string]string{
	"zh-CN": "zh-Hans",
}

func toAzureLang(code string) string {
	if mapped, ok := azureLangCodes[code]; ok {
		return mapped
	}
	return code
}

// languageNames is used as fallback for LLM-based translation prompts
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

type TranslationService struct {
	// Azure Translator (fast dedicated API)
	azureKey    string
	azureRegion string

	// LLM fallback (OpenRouter / OpenAI)
	llmKey     string
	llmBaseURL string
	llmModel   string

	client *http.Client
}

func NewTranslationService(openRouterKey, openAIKey, model, azureKey, azureRegion string) *TranslationService {
	llmKey := openRouterKey
	llmBaseURL := "https://openrouter.ai/api/v1"
	if llmKey == "" {
		llmKey = openAIKey
		llmBaseURL = "https://api.openai.com/v1"
	}
	return &TranslationService{
		azureKey:    azureKey,
		azureRegion: azureRegion,
		llmKey:      llmKey,
		llmBaseURL:  llmBaseURL,
		llmModel:    model,
		client:      &http.Client{Timeout: 8 * time.Second},
	}
}

func (s *TranslationService) Translate(ctx context.Context, text, sourceLang, targetLang string) (string, error) {
	if sourceLang == targetLang {
		return text, nil
	}
	if s.azureKey != "" {
		return s.translateAzure(ctx, text, sourceLang, targetLang)
	}
	return s.translateLLM(ctx, text, sourceLang, targetLang)
}

// translateAzure uses Azure Cognitive Services Translator (~50-150ms, purpose-built)
func (s *TranslationService) translateAzure(ctx context.Context, text, sourceLang, targetLang string) (string, error) {
	body, _ := json.Marshal([]map[string]string{{"text": text}})

	url := fmt.Sprintf(
		"https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=%s&to=%s",
		toAzureLang(sourceLang), toAzureLang(targetLang),
	)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Ocp-Apim-Subscription-Key", s.azureKey)
	if s.azureRegion != "" {
		req.Header.Set("Ocp-Apim-Subscription-Region", s.azureRegion)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("azure translate returned %d", resp.StatusCode)
	}

	var result []struct {
		Translations []struct {
			Text string `json:"text"`
		} `json:"translations"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if len(result) == 0 || len(result[0].Translations) == 0 {
		return "", fmt.Errorf("empty translation response")
	}
	return strings.TrimSpace(result[0].Translations[0].Text), nil
}

// translateLLM is the fallback when no Azure key is configured
func (s *TranslationService) translateLLM(ctx context.Context, text, _, targetLang string) (string, error) {
	targetName := languageNames[targetLang]
	if targetName == "" {
		targetName = targetLang
	}

	type chatMsg struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	type chatReq struct {
		Model    string    `json:"model"`
		Messages []chatMsg `json:"messages"`
	}

	body, _ := json.Marshal(chatReq{
		Model: s.llmModel,
		Messages: []chatMsg{
			{Role: "system", Content: fmt.Sprintf("Translate to %s. Return ONLY the translated text.", targetName)},
			{Role: "user", Content: text},
		},
	})

	req, err := http.NewRequestWithContext(ctx, "POST", s.llmBaseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.llmKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("llm translate returned %d", resp.StatusCode)
	}

	var result struct {
		Choices []struct {
			Message struct{ Content string } `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no translation returned")
	}
	return strings.TrimSpace(result.Choices[0].Message.Content), nil
}
