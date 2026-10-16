package calculation

import (
	"math"
	"testing"

	"smartflood/backend/internal/models"
)

// defaultConfig returns a TankConfig matching the system defaults used in test cases.
func defaultConfig() *models.TankConfig {
	return &models.TankConfig{
		LengthCm:           100.0,
		WidthCm:            50.0,
		DepthCm:            100.0,
		SensorHeightCm:     100.0,
		WarnThresholdPct:   60.0,
		DangerThresholdPct: 80.0,
	}
}

// Case A: Empty tank — sensor reads the full tank height, waterLevel must be 0.
func TestCaseA_EmptyTank(t *testing.T) {
	cfg := defaultConfig()
	wl, fillPct, vol, _ := CalculateAll(100.0, cfg)

	if wl != 0 {
		t.Errorf("CaseA waterLevel: want 0, got %v", wl)
	}
	if fillPct != 0 {
		t.Errorf("CaseA fillPct: want 0, got %v", fillPct)
	}
	if vol != 0 {
		t.Errorf("CaseA volume: want 0, got %v", vol)
	}
}

// Case B: Half full — distance 50 cm, 100×50 tank 100 cm deep.
func TestCaseB_HalfFull(t *testing.T) {
	cfg := defaultConfig()
	wl, fillPct, vol, cap := CalculateAll(50.0, cfg)

	if wl != 50 {
		t.Errorf("CaseB waterLevel: want 50, got %v", wl)
	}
	if fillPct != 50 {
		t.Errorf("CaseB fillPct: want 50, got %v", fillPct)
	}
	if vol != 250 {
		t.Errorf("CaseB volume: want 250L, got %v", vol)
	}
	if cap != 500 {
		t.Errorf("CaseB capacity: want 500L, got %v", cap)
	}
}

// Case C: 60% full — distance 40 cm, volume = 100×50×60/1000 = 300 L.
func TestCaseC_SixtyPercent(t *testing.T) {
	cfg := defaultConfig()
	wl, fillPct, vol, _ := CalculateAll(40.0, cfg)

	if wl != 60 {
		t.Errorf("CaseC waterLevel: want 60, got %v", wl)
	}
	if fillPct != 60 {
		t.Errorf("CaseC fillPct: want 60, got %v", fillPct)
	}
	if vol != 300 {
		t.Errorf("CaseC volume: want 300L, got %v", vol)
	}
}

// Case D: Distance greater than sensorHeight — result must clamp to 0, never negative.
func TestCaseD_DistanceExceedsSensorHeight(t *testing.T) {
	wl := CalculateWaterLevel(150.0, 100.0, 100.0)
	if wl != 0 {
		t.Errorf("CaseD waterLevel: want 0 (clamped), got %v", wl)
	}
}

// Case E: Distance exactly 0 — should be rejected as invalid.
func TestCaseE_ZeroDistance(t *testing.T) {
	if IsValidDistance(0) {
		t.Error("CaseE: distance=0 must be invalid")
	}
}

// Case F: Negative distance — physically impossible, must be rejected.
func TestCaseF_NegativeDistance(t *testing.T) {
	if IsValidDistance(-10) {
		t.Error("CaseF: negative distance must be invalid")
	}
}

// Case G: NaN and ±Infinity — sensor communication errors, must be rejected.
func TestCaseG_NaNAndInf(t *testing.T) {
	if IsValidDistance(math.NaN()) {
		t.Error("CaseG: NaN must be invalid")
	}
	if IsValidDistance(math.Inf(1)) {
		t.Error("CaseG: +Inf must be invalid")
	}
	if IsValidDistance(math.Inf(-1)) {
		t.Error("CaseG: -Inf must be invalid")
	}
}

// Case H: Zero tank depth — must return 0, not panic with divide-by-zero.
func TestCaseH_ZeroTankDepth(t *testing.T) {
	fillPct := CalculateFillPercentage(50.0, 0)
	if fillPct != 0 {
		t.Errorf("CaseH fillPct: want 0 when depth=0, got %v", fillPct)
	}
}

// Additional: ClampFloat edge cases.
func TestClampFloat(t *testing.T) {
	tests := []struct {
		value, min, max, want float64
	}{
		{-5, 0, 100, 0},
		{105, 0, 100, 100},
		{50, 0, 100, 50},
		{0, 0, 100, 0},
		{100, 0, 100, 100},
	}
	for _, tt := range tests {
		got := ClampFloat(tt.value, tt.min, tt.max)
		if got != tt.want {
			t.Errorf("ClampFloat(%v,%v,%v): want %v, got %v", tt.value, tt.min, tt.max, tt.want, got)
		}
	}
}

// Additional: DetermineCalculatedStatus thresholds.
func TestDetermineCalculatedStatus(t *testing.T) {
	cfg := defaultConfig()
	tests := []struct {
		fillPct float64
		want    string
	}{
		{0, "SAFE"},
		{59.9, "SAFE"},
		{60, "WARNING"},
		{79.9, "WARNING"},
		{80, "DANGER"},
		{100, "DANGER"},
	}
	for _, tt := range tests {
		got := DetermineCalculatedStatus(tt.fillPct, cfg)
		if got != tt.want {
			t.Errorf("Status(%v%%): want %q, got %q", tt.fillPct, tt.want, got)
		}
	}
}
