package model

// SBISNomenclature represents an item from the SBIS API nomenclature list
// This model is used for unmarshaling the API response during catalog import
type SBISNomenclature struct {
	UUID               string                 `json:"uuid"`
	ID                 interface{}            `json:"id"`
	Name               string                 `json:"name"`
	Description        string                 `json:"description"`
	Cost               float64                `json:"cost"`
	HierarchicalID     int                    `json:"hierarchicalId"`
	HierarchicalParent *int                   `json:"hierarchicalParent"`
	IsParent           bool                   `json:"isParent"`
	Article            string                 `json:"article"`
	NomNumber          string                 `json:"nomNumber"`
	IndexNumber        interface{}            `json:"indexNumber"`
	Attributes         map[string]interface{} `json:"attributes"`
	Modifiers          []interface{}          `json:"modifiers"`
	IsKit              bool                   `json:"isKit"`
	IsPublished        bool                   `json:"isPublished"`
	ShortCode          string                 `json:"shortCode"`
	Stock              int                    `json:"stock"`
	Images             []string               `json:"images"`
}
