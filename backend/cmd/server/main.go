package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	fiberws "github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"

	"github.com/talkbridge/backend/internal/config"
	"github.com/talkbridge/backend/internal/db"
	"github.com/talkbridge/backend/internal/handlers"
	"github.com/talkbridge/backend/internal/hub"
	"github.com/talkbridge/backend/internal/services"
)

func main() {
	godotenv.Load()

	cfg := config.Load()

	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(pool); err != nil {
		log.Fatalf("db migrate: %v", err)
	}
	log.Println("database ready")

	wsHub := hub.New()

	translationSvc := services.NewTranslationService(
		cfg.OpenRouterAPIKey,
		cfg.OpenAIAPIKey,
		cfg.TranslationModel,
		cfg.AzureTranslatorKey,
		cfg.AzureTranslatorRegion,
	)

	roomHandler := handlers.NewRoomHandler(pool, cfg.FrontendURL)
	wsHandler := handlers.NewWSHandler(wsHub, pool, translationSvc, cfg.DeepgramAPIKey)

	app := fiber.New(fiber.Config{
		AppName: "TalkBridge",
	})

	allowOrigins := cfg.FrontendURL
	if allowOrigins == "" {
		allowOrigins = "*"
	}
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept",
		AllowMethods: "GET, POST, OPTIONS",
	}))

	// WebSocket upgrade middleware
	app.Use("/ws", func(c *fiber.Ctx) error {
		if fiberws.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// HTTP API routes
	api := app.Group("/api/v1")
	api.Post("/rooms", roomHandler.CreateRoom)
	api.Get("/rooms/:roomId", roomHandler.GetRoom)
	api.Post("/rooms/:roomId/join", roomHandler.JoinRoom)
	api.Post("/rooms/:roomId/end", roomHandler.EndRoom)

	// WebSocket routes
	app.Get("/ws/room/:roomId", fiberws.New(wsHandler.HandleSignaling))
	app.Get("/ws/audio/:roomId", fiberws.New(wsHandler.HandleAudio))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	port := ":" + cfg.Port
	log.Printf("TalkBridge backend listening on %s", port)
	if cfg.TLSCert != "" && cfg.TLSKey != "" {
		log.Printf("TLS enabled")
		if err := app.ListenTLS(port, cfg.TLSCert, cfg.TLSKey); err != nil {
			log.Fatalf("server error: %v", err)
		}
	} else {
		if err := app.Listen(port); err != nil {
			log.Fatalf("server error: %v", err)
		}
	}

}
