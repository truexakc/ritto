package model

import (
	"fmt"
	"strings"
	"time"
)

// SBISDateTime represents a datetime in SBIS format: "гггг-мм-дд чч:мм:сс"
type SBISDateTime struct {
	time.Time
}

const sbisDateTimeFormat = "2006-01-02 15:04:05"

// UnmarshalJSON implements json.Unmarshaler interface
func (dt *SBISDateTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), `"`)
	if s == "null" || s == "" {
		return nil
	}

	t, err := time.Parse(sbisDateTimeFormat, s)
	if err != nil {
		return fmt.Errorf("invalid datetime format, expected 'гггг-мм-дд чч:мм:сс': %w", err)
	}

	dt.Time = t
	return nil
}

// MarshalJSON implements json.Marshaler interface
func (dt SBISDateTime) MarshalJSON() ([]byte, error) {
	if dt.Time.IsZero() {
		return []byte("null"), nil
	}
	return []byte(`"` + dt.Time.Format(sbisDateTimeFormat) + `"`), nil
}

// String returns the datetime in SBIS format
func (dt SBISDateTime) String() string {
	return dt.Time.Format(sbisDateTimeFormat)
}
