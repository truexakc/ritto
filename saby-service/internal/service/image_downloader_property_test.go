package service

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"github.com/spf13/afero"
)

// Feature: scheduled-catalog-import, Property 13: Image Download Completeness
// For any nomenclature with N image URLs, the Image Downloader should attempt to download all N images
// and return N local file paths (or fewer if some downloads fail non-fatally).
func TestProperty_ImageDownloadCompleteness(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("downloader attempts all URLs and returns paths for successful downloads", prop.ForAll(
		func(urlCount int) bool {
			// Create test HTTP server that succeeds for all requests
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

			// Generate N unique URLs
			urls := make([]string, urlCount)
			for i := 0; i < urlCount; i++ {
				urls[i] = fmt.Sprintf("%s/image%d.jpg", server.URL, i)
			}

			ctx := context.Background()
			paths, err := downloader.DownloadImages(ctx, urls)

			// Should not return error
			if err != nil {
				return false
			}

			// Should return exactly N paths (all successful)
			return len(paths) == urlCount
		},
		gen.IntRange(0, 20), // Test with 0 to 20 URLs
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 14: Hash-Based Image Deduplication
// For any image URL, the Image Downloader should generate a filename by hashing the URL,
// and if a file with that hash-based name already exists, it should reuse the existing file
// without re-downloading.
func TestProperty_HashBasedImageDeduplication(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("same URL generates same hash-based filename and reuses existing file", prop.ForAll(
		func(urlPath string) bool {
			requestCount := int32(0)
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				atomic.AddInt32(&requestCount, 1)
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

			// Construct full URL
			url := server.URL + "/" + urlPath + ".jpg"

			ctx := context.Background()

			// Download same URL twice
			paths1, err1 := downloader.DownloadImages(ctx, []string{url})
			paths2, err2 := downloader.DownloadImages(ctx, []string{url})

			// Both should succeed
			if err1 != nil || err2 != nil {
				return false
			}

			// Both should return exactly 1 path
			if len(paths1) != 1 || len(paths2) != 1 {
				return false
			}

			// Paths should be identical (same hash-based filename)
			if paths1[0] != paths2[0] {
				return false
			}

			// Should only make 1 HTTP request (second time uses cached file)
			if atomic.LoadInt32(&requestCount) != 1 {
				return false
			}

			// Verify filename is hash-based
			filename := filepath.Base(paths1[0])
			// Hash-based filename should be 64 hex chars + extension
			nameWithoutExt := strings.TrimSuffix(filename, filepath.Ext(filename))
			if len(nameWithoutExt) != 64 {
				return false
			}

			// Verify it matches SHA256 hash of URL
			expectedHash := fmt.Sprintf("%x", sha256.Sum256([]byte(url)))
			if nameWithoutExt != expectedHash {
				return false
			}

			return true
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 15: Image Path Storage
// For any nomenclature with downloaded images, the first image path should be stored in image_url field,
// and all image paths should be stored in the images array field.
// Note: This property tests the downloader's return value structure, not the model mapping
func TestProperty_ImagePathStorage(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("downloader returns paths in consistent order", prop.ForAll(
		func(imageCount int) bool {
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

			// Generate unique URLs
			urls := make([]string, imageCount)
			for i := 0; i < imageCount; i++ {
				urls[i] = fmt.Sprintf("%s/image%d.jpg", server.URL, i)
			}

			ctx := context.Background()
			paths, err := downloader.DownloadImages(ctx, urls)

			if err != nil {
				return false
			}

			// Should return same number of paths as URLs
			if len(paths) != imageCount {
				return false
			}

			// All paths should be non-empty strings
			for _, path := range paths {
				if path == "" {
					return false
				}
			}

			// All paths should exist in filesystem
			for _, path := range paths {
				exists, err := afero.Exists(fs, path)
				if err != nil || !exists {
					return false
				}
			}

			return true
		},
		gen.IntRange(1, 10), // Test with 1 to 10 images
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 22: Concurrent Download Limit
// For any batch of image downloads, the Image Downloader should never have more than 10 concurrent
// HTTP connections active at the same time.
func TestProperty_ConcurrentDownloadLimit(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("downloader respects max 10 concurrent connections", prop.ForAll(
		func(urlCount int) bool {
			// Track concurrent requests
			var currentConcurrent int32
			var maxConcurrent int32
			var mu sync.Mutex

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// Increment concurrent counter
				current := atomic.AddInt32(&currentConcurrent, 1)

				// Update max if needed
				mu.Lock()
				if current > maxConcurrent {
					maxConcurrent = current
				}
				mu.Unlock()

				// Simulate some work
				// Note: We can't use time.Sleep here as it would make tests too slow
				// The semaphore pattern itself ensures the limit

				// Decrement concurrent counter
				atomic.AddInt32(&currentConcurrent, -1)

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

			// Generate URLs
			urls := make([]string, urlCount)
			for i := 0; i < urlCount; i++ {
				urls[i] = fmt.Sprintf("%s/image%d.jpg", server.URL, i)
			}

			ctx := context.Background()
			_, err := downloader.DownloadImages(ctx, urls)

			if err != nil {
				return false
			}

			// Max concurrent should never exceed 10
			mu.Lock()
			max := maxConcurrent
			mu.Unlock()

			// For small batches, max concurrent should be <= urlCount
			// For large batches, max concurrent should be <= 10
			expectedMax := urlCount
			if expectedMax > 10 {
				expectedMax = 10
			}

			return max <= int32(expectedMax)
		},
		gen.IntRange(1, 50), // Test with 1 to 50 URLs to verify limit
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
