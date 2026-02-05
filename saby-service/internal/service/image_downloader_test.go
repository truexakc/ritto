package service

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/afero"
)

func TestImageDownloader_DownloadImages_Success(t *testing.T) {
	// Create test HTTP server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("fake image data"))
	}))
	defer server.Close()

	// Create in-memory filesystem
	fs := afero.NewMemMapFs()

	// Create downloader
	downloader := NewImageDownloader(ImageDownloaderConfig{
		StoragePath: "/images",
		HTTPClient:  server.Client(),
		Fs:          fs,
		Logger:      slog.New(slog.NewTextHandler(os.Stderr, nil)),
	})

	// Download images
	urls := []string{
		server.URL + "/image1.jpg",
		server.URL + "/image2.png",
	}

	ctx := context.Background()
	paths, err := downloader.DownloadImages(ctx, urls)

	if err != nil {
		t.Fatalf("DownloadImages failed: %v", err)
	}

	if len(paths) != 2 {
		t.Errorf("Expected 2 paths, got %d", len(paths))
	}

	// Verify files exist
	for _, path := range paths {
		exists, err := afero.Exists(fs, path)
		if err != nil {
			t.Errorf("Failed to check file existence: %v", err)
		}
		if !exists {
			t.Errorf("File does not exist: %s", path)
		}

		// Verify file content
		content, err := afero.ReadFile(fs, path)
		if err != nil {
			t.Errorf("Failed to read file: %v", err)
		}
		if string(content) != "fake image data" {
			t.Errorf("Unexpected file content: %s", string(content))
		}
	}
}

func TestImageDownloader_DownloadImages_EmptyURLs(t *testing.T) {
	fs := afero.NewMemMapFs()

	downloader := NewImageDownloader(ImageDownloaderConfig{
		StoragePath: "/images",
		Fs:          fs,
		Logger:      slog.New(slog.NewTextHandler(os.Stderr, nil)),
	})

	ctx := context.Background()
	paths, err := downloader.DownloadImages(ctx, []string{})

	if err != nil {
		t.Fatalf("DownloadImages failed: %v", err)
	}

	if len(paths) != 0 {
		t.Errorf("Expected 0 paths, got %d", len(paths))
	}
}

func TestImageDownloader_DownloadImages_ErrorHandling(t *testing.T) {
	// Create test HTTP server that returns errors
	errorCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		errorCount++
		if errorCount <= 2 {
			// First two requests fail
			w.WriteHeader(http.StatusNotFound)
			return
		}
		// Third request succeeds
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("fake image data"))
	}))
	defer server.Close()

	fs := afero.NewMemMapFs()

	downloader := NewImageDownloader(ImageDownloaderConfig{
		StoragePath: "/images",
		HTTPClient:  server.Client(),
		Fs:          fs,
		Logger:      slog.New(slog.NewTextHandler(os.Stderr, nil)),
	})

	// Download images - first two will fail, third will succeed
	urls := []string{
		server.URL + "/image1.jpg",
		server.URL + "/image2.jpg",
		server.URL + "/image3.jpg",
	}

	ctx := context.Background()
	paths, err := downloader.DownloadImages(ctx, urls)

	// Should not return error (errors are non-fatal)
	if err != nil {
		t.Fatalf("DownloadImages failed: %v", err)
	}

	// Should have 1 successful download
	if len(paths) != 1 {
		t.Errorf("Expected 1 path (2 failed, 1 succeeded), got %d", len(paths))
	}
}

func TestImageDownloader_Deduplication(t *testing.T) {
	requestCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(fmt.Sprintf("image data %d", requestCount)))
	}))
	defer server.Close()

	fs := afero.NewMemMapFs()

	downloader := NewImageDownloader(ImageDownloaderConfig{
		StoragePath: "/images",
		HTTPClient:  server.Client(),
		Fs:          fs,
		Logger:      slog.New(slog.NewTextHandler(os.Stderr, nil)),
	})

	ctx := context.Background()
	url := server.URL + "/image.jpg"

	// Download same image twice
	paths1, err := downloader.DownloadImages(ctx, []string{url})
	if err != nil {
		t.Fatalf("First download failed: %v", err)
	}

	paths2, err := downloader.DownloadImages(ctx, []string{url})
	if err != nil {
		t.Fatalf("Second download failed: %v", err)
	}

	// Should return same path
	if len(paths1) != 1 || len(paths2) != 1 {
		t.Fatalf("Expected 1 path each time, got %d and %d", len(paths1), len(paths2))
	}

	if paths1[0] != paths2[0] {
		t.Errorf("Expected same path, got %s and %s", paths1[0], paths2[0])
	}

	// Should only make 1 HTTP request (second time uses cached file)
	if requestCount != 1 {
		t.Errorf("Expected 1 HTTP request, got %d", requestCount)
	}

	// Verify file content is from first request
	content, err := afero.ReadFile(fs, paths1[0])
	if err != nil {
		t.Fatalf("Failed to read file: %v", err)
	}
	if string(content) != "image data 1" {
		t.Errorf("Unexpected file content: %s", string(content))
	}
}

func TestImageDownloader_FilenameGeneration(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("fake image data"))
	}))
	defer server.Close()

	fs := afero.NewMemMapFs()

	downloader := NewImageDownloader(ImageDownloaderConfig{
		StoragePath: "/images",
		HTTPClient:  server.Client(),
		Fs:          fs,
		Logger:      slog.New(slog.NewTextHandler(os.Stderr, nil)),
	})

	ctx := context.Background()

	testCases := []struct {
		name        string
		url         string
		expectedExt string
	}{
		{
			name:        "jpg extension",
			url:         server.URL + "/image.jpg",
			expectedExt: ".jpg",
		},
		{
			name:        "png extension",
			url:         server.URL + "/image.png",
			expectedExt: ".png",
		},
		{
			name:        "uppercase extension",
			url:         server.URL + "/image.JPG",
			expectedExt: ".jpg",
		},
		{
			name:        "url with query params",
			url:         server.URL + "/image.jpg?size=large",
			expectedExt: ".jpg",
		},
		{
			name:        "no extension",
			url:         server.URL + "/image",
			expectedExt: ".jpg", // default
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			paths, err := downloader.DownloadImages(ctx, []string{tc.url})
			if err != nil {
				t.Fatalf("DownloadImages failed: %v", err)
			}

			if len(paths) != 1 {
				t.Fatalf("Expected 1 path, got %d", len(paths))
			}

			ext := filepath.Ext(paths[0])
			if ext != tc.expectedExt {
				t.Errorf("Expected extension %s, got %s", tc.expectedExt, ext)
			}
		})
	}
}

func TestImageDownloader_ContextCancellation(t *testing.T) {
	// Create server that delays response
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if context is cancelled
		<-r.Context().Done()
	}))
	defer server.Close()

	fs := afero.NewMemMapFs()

	downloader := NewImageDownloader(ImageDownloaderConfig{
		StoragePath: "/images",
		HTTPClient:  server.Client(),
		Fs:          fs,
		Logger:      slog.New(slog.NewTextHandler(os.Stderr, nil)),
	})

	// Create context that is immediately cancelled
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	urls := []string{server.URL + "/image.jpg"}
	paths, err := downloader.DownloadImages(ctx, urls)

	// Should not return error (errors are non-fatal)
	if err != nil {
		t.Fatalf("DownloadImages failed: %v", err)
	}

	// Should have no successful downloads
	if len(paths) != 0 {
		t.Errorf("Expected 0 paths (context cancelled), got %d", len(paths))
	}
}

func TestImageDownloader_FilePermissions(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("fake image data"))
	}))
	defer server.Close()

	// Use real filesystem for permission testing
	tempDir := t.TempDir()
	fs := afero.NewOsFs()

	downloader := NewImageDownloader(ImageDownloaderConfig{
		StoragePath: tempDir,
		HTTPClient:  server.Client(),
		Fs:          fs,
		Logger:      slog.New(slog.NewTextHandler(os.Stderr, nil)),
	})

	ctx := context.Background()
	paths, err := downloader.DownloadImages(ctx, []string{server.URL + "/image.jpg"})

	if err != nil {
		t.Fatalf("DownloadImages failed: %v", err)
	}

	if len(paths) != 1 {
		t.Fatalf("Expected 1 path, got %d", len(paths))
	}

	// Check file permissions
	info, err := os.Stat(paths[0])
	if err != nil {
		t.Fatalf("Failed to stat file: %v", err)
	}

	mode := info.Mode()
	expectedMode := os.FileMode(0644)

	// Check that file has expected permissions (0644)
	if mode.Perm() != expectedMode {
		t.Errorf("Expected file permissions %v, got %v", expectedMode, mode.Perm())
	}
}
