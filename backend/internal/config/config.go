package config

import (
	"os"
)

type Config struct {
	Port                  string
	DatabaseURL           string
	FrontendURL           string
	DeepgramAPIKey        string
	OpenRouterAPIKey      string
	OpenAIAPIKey          string
	TranslationModel      string
	AzureTranslatorKey    string
	AzureTranslatorRegion string
	TLSCert               string
	TLSKey                string
}

func Load() *Config {
	model := os.Getenv("TRANSLATION_MODEL")
	if model == "" {
		model = "openai/gpt-4o-mini"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return &Config{
		Port:             port,
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		FrontendURL:      os.Getenv("FRONTEND_URL"),
		DeepgramAPIKey:   os.Getenv("DEEPGRAM_API_KEY"),
		OpenRouterAPIKey: os.Getenv("OPENROUTER_API_KEY"),
		OpenAIAPIKey:     os.Getenv("OPENAI_API_KEY"),
		TranslationModel:      model,
		AzureTranslatorKey:    os.Getenv("AZURE_TRANSLATOR_KEY"),
		AzureTranslatorRegion: os.Getenv("AZURE_TRANSLATOR_REGION"),
		TLSCert:               os.Getenv("TLS_CERT"),
		TLSKey:                os.Getenv("TLS_KEY"),
	}
}
