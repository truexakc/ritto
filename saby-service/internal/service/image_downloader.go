package service

import (
	"context"
	"crypto/md5"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/spf13/afero"
)

// ImageParams represents the decoded parameters from SBIS image URL
type ImageParams struct {
	ObjectType       string      `json:"ObjectType"`
	ObjectID         int         `json:"ObjectId"`
	PhotoURL         string      `json:"PhotoURL"`
	PhotoID          interface{} `json:"PhotoId"`
	Size             interface{} `json:"Size"`
	AdditionalParams interface{} `json:"AdditionalParams"`
}

// ImageDownloader downloads images from URLs and stores them locally with deduplication
type ImageDownloader interface {
	DownloadImages(ctx context.Context, urls []string) ([]string, error)
}

// imageDownloaderImpl implements the ImageDownloader interface
type imageDownloaderImpl struct {
	httpClient  *http.Client
	storagePath string
	fs          afero.Fs
	logger      *slog.Logger
}

// ImageDownloaderConfig holds configuration for the image downloader
type ImageDownloaderConfig struct {
	StoragePath string
	HTTPClient  *http.Client
	Fs          afero.Fs // Optional: for testing with in-memory filesystem
	Logger      *slog.Logger
}

// NewImageDownloader creates a new image downloader
func NewImageDownloader(config ImageDownloaderConfig) ImageDownloader {
	// Use OS filesystem if not provided (for testing)
	fs := config.Fs
	if fs == nil {
		fs = afero.NewOsFs()
	}

	// Use default HTTP client if not provided
	httpClient := config.HTTPClient
	if httpClient == nil {
		httpClient = &http.Client{}
	}

	// Use default logger if not provided
	logger := config.Logger
	if logger == nil {
		logger = slog.Default()
	}

	return &imageDownloaderImpl{
		httpClient:  httpClient,
		storagePath: config.StoragePath,
		fs:          fs,
		logger:      logger,
	}
}

// DownloadImages downloads all images from the provided URLs
// Returns local file paths for successfully downloaded images
// Errors are logged but do not stop processing (non-fatal)
func (d *imageDownloaderImpl) DownloadImages(ctx context.Context, urls []string) ([]string, error) {
	if len(urls) == 0 {
		return []string{}, nil
	}

	// Ensure storage directory exists
	if err := d.fs.MkdirAll(d.storagePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}

	// Use semaphore to limit concurrent downloads to 10
	semaphore := make(chan struct{}, 10)
	var wg sync.WaitGroup
	var mu sync.Mutex
	localPaths := make([]string, 0, len(urls))

	for _, url := range urls {
		wg.Add(1)
		go func(imageURL string) {
			defer wg.Done()

			// Acquire semaphore
			select {
			case semaphore <- struct{}{}:
				defer func() { <-semaphore }()
			case <-ctx.Done():
				return
			}

			// Download image
			localPath, err := d.downloadSingleImage(ctx, imageURL)
			if err != nil {
				// Log error but continue processing (non-fatal)
				d.logger.Warn("failed to download image",
					"url", imageURL,
					"error", err)
				return
			}

			// Add to results
			mu.Lock()
			localPaths = append(localPaths, localPath)
			mu.Unlock()
		}(url)
	}

	wg.Wait()

	return localPaths, nil
}

// downloadSingleImage downloads a single image and returns its web path
func (d *imageDownloaderImpl) downloadSingleImage(ctx context.Context, url string) (string, error) {
	// Decode SBIS image URL if it's a parametrized URL
	finalURL, err := d.decodeImageURL(url)
	if err != nil {
		return "", fmt.Errorf("failed to decode image URL: %w", err)
	}

	// Generate filename from MD5 hash of URL + extension
	filename := d.generateFilename(finalURL)
	localPath := filepath.Join(d.storagePath, filename)

	// Check if file already exists (deduplication)
	exists, err := afero.Exists(d.fs, localPath)
	if err != nil {
		return "", fmt.Errorf("failed to check file existence: %w", err)
	}
	if exists {
		// File already exists, return web path
		return d.getWebPath(filename), nil
	}

	// Create HTTP request with context
	req, err := http.NewRequestWithContext(ctx, "GET", finalURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Execute request
	resp, err := d.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Create file with 0644 permissions
	file, err := d.fs.OpenFile(localPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// Copy response body to file
	_, err = io.Copy(file, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Return web path for database storage
	return d.getWebPath(filename), nil
}

// decodeImageURL decodes SBIS parametrized image URLs
// Converts /img?params=base64 to actual PhotoURL
func (d *imageDownloaderImpl) decodeImageURL(url string) (string, error) {
	// If URL contains /img?params=, decode it
	if strings.Contains(url, "/img?params=") {
		parts := strings.Split(url, "params=")
		if len(parts) < 2 {
			return url, nil
		}

		// Decode base64 parameters
		paramsBase64 := parts[1]
		paramsJSON, err := base64.StdEncoding.DecodeString(paramsBase64)
		if err != nil {
			d.logger.Warn("failed to decode base64 params", "url", url, "error", err)
			return url, nil
		}

		// Parse JSON parameters
		var params ImageParams
		if err := json.Unmarshal(paramsJSON, &params); err != nil {
			d.logger.Warn("failed to parse image params JSON", "url", url, "error", err)
			return url, nil
		}

		// Return PhotoURL if available
		if params.PhotoURL != "" {
			return params.PhotoURL, nil
		}
	}

	return url, nil
}

// getWebPath converts local file path to web-accessible path
// Returns path like /uploads/products/filename.jpg
func (d *imageDownloaderImpl) getWebPath(filename string) string {
	return "/uploads/products/" + filename
}

// generateFilename generates a filename from MD5 hash of URL + extension
func (d *imageDownloaderImpl) generateFilename(url string) string {
	// Calculate MD5 hash of URL (matching Node.js implementation)
	hash := md5.Sum([]byte(url))
	hashStr := fmt.Sprintf("%x", hash)

	// Extract extension from URL
	ext := d.extractExtension(url)

	return hashStr + ext
}

// extractExtension extracts the file extension from a URL
func (d *imageDownloaderImpl) extractExtension(url string) string {
	// Remove query parameters
	if idx := strings.Index(url, "?"); idx != -1 {
		url = url[:idx]
	}

	// Get extension from path
	ext := filepath.Ext(url)

	// Default to .jpg if no extension found
	if ext == "" {
		ext = ".jpg"
	}

	// Ensure extension is lowercase
	return strings.ToLower(ext)
}
