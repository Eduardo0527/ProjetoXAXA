#include <Arduino.h>
#include <driver/i2s.h>
#include <math.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>

// ============================================================================
// NETWORK AND API CONFIGURATION
// ============================================================================
String ssid     = "";
String password = "";

// HTTP — spike alerts only
const char*   serverName = "investor-lamps-marion-periodically.trycloudflare.com/upload-audio";
const char*   apiKey     = "esp32_SKOWqQdc4mdP4SHjLrTpzyVRIMm7Hg4hKlVJUC8MU1Q";
const String  roomName   = "Sala_1";

// WebSocket — continuous 500ms stream
const char* wsHost = "https://investor-lamps-marion-periodically.trycloudflare.com";
const char* wsPath = "/ws/sensor";

// ============================================================================
// MICROPHONE (I2S)
// ============================================================================
#define I2S_WS    15
#define I2S_SD    32
#define I2S_SCK   14
#define I2S_PORT  I2S_NUM_0

#define SAMPLE_RATE  16000
#define BUFFER_LEN   512

int32_t samples[BUFFER_LEN];

// ============================================================================
// DYNAMIC THRESHOLD (same logic as before)
// ============================================================================
static double background_noise = 0.0;
static bool   is_calibrated    = false;

const double ALPHA_UP        = 0.02;
const double ALPHA_DOWN      = 0.1;
const double SPIKE_THRESHOLD = 15.0;  // dB above background noise

// ============================================================================
// TIMING
// ============================================================================
unsigned long lastSend      = 0;
unsigned long lastAlertSend = 0;

const unsigned long SEND_INTERVAL  = 500;   // WebSocket stream
const unsigned long ALERT_COOLDOWN = 3000;  // HTTP spike alert

// ============================================================================
// WEBSOCKET
// ============================================================================
WebSocketsClient wsClient;
bool wsConnected = false;

void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_CONNECTED:
            Serial.println("WebSocket: Conectado.");
            wsConnected = true;
            break;
        case WStype_DISCONNECTED:
            Serial.println("WebSocket: Desconectado.");
            wsConnected = false;
            break;
        case WStype_ERROR:
            Serial.println("WebSocket: Erro.");
            wsConnected = false;
            break;
        default:
            break;
    }
}

// ============================================================================
// HTTP POST — spike alerts only
// ============================================================================
void sendAlert(float db) {
    if (WiFi.status() != WL_CONNECTED) return;

    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    http.addHeader("x-api-key", apiKey);

    String body = "db=" + String(db, 1) + "&room=" + roomName;
    int code = http.POST(body);

    Serial.print("⚠️ Alerta enviado | HTTP: ");
    Serial.println(code);
    http.end();
}

// ============================================================================
// SETUP
// ============================================================================
void setup() {
    Serial.begin(115200);
    while (!Serial) delay(10);
    delay(3000);
    while (Serial.available()) Serial.read();

    Serial.println("\n=================================");
    Serial.println("   CONFIGURAÇÃO DE REDE WI-FI");
    Serial.println("=================================");

    Serial.println("> Digite o SSID e pressione ENTER:");
    while (!Serial.available()) delay(100);
    ssid = Serial.readStringUntil('\n');
    ssid.trim();

    Serial.println("> Digite a senha e pressione ENTER:");
    while (!Serial.available()) delay(100);
    password = Serial.readStringUntil('\n');
    password.trim();

    Serial.print("Conectando em: ");
    Serial.println(ssid);

    WiFi.begin(ssid.c_str(), password.c_str());
    int tentativas = 0;
    while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
        delay(500);
        Serial.print(".");
        tentativas++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWi-Fi conectado! IP: " + WiFi.localIP().toString());
    } else {
        Serial.println("\nFalha na conexão. Reinicie.");
        return;
    }

    // WebSocket — connects here and stays connected
    wsClient.beginSSL(wsHost, 443, wsPath);
    wsClient.onEvent(onWsEvent);
    wsClient.setReconnectInterval(3000);

    // I2S
    i2s_config_t i2s_config = {
        .mode                 = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate          = SAMPLE_RATE,
        .bits_per_sample      = I2S_BITS_PER_SAMPLE_32BIT,
        .channel_format       = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags     = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count        = 8,
        .dma_buf_len          = 64,
        .use_apll             = false,
        .tx_desc_auto_clear   = false,
        .fixed_mclk           = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num   = I2S_SCK,
        .ws_io_num    = I2S_WS,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num  = I2S_SD
    };

    i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_PORT, &pin_config);
    i2s_zero_dma_buffer(I2S_PORT);

    Serial.println("Sistema pronto. Monitorando...");
}

// ============================================================================
// LOOP
// ============================================================================
void loop() {
    wsClient.loop(); // Must be first — keeps the WebSocket connection alive

    size_t bytes_read;
    i2s_read(I2S_PORT, samples, sizeof(samples), &bytes_read, portMAX_DELAY);

    int samples_read = bytes_read / sizeof(int32_t);
    if (samples_read == 0) return;

    // DC offset removal
    double mean = 0;
    for (int i = 0; i < samples_read; i++) mean += (samples[i] >> 8);
    mean /= samples_read;

    // RMS
    double sum = 0;
    for (int i = 0; i < samples_read; i++) {
        double centered = (double)(samples[i] >> 8) - mean;
        sum += centered * centered;
    }
    double rms = sqrt(sum / samples_read);
    if (rms < 1.0) rms = 1.0;

    // dBFS → dB SPL
    double dbfs = 20.0 * log10(rms / 8388608.0);
    double db   = dbfs + 120.0;

    unsigned long currentMillis = millis();

    // Background noise adaptation (asymmetric filter — unchanged)
    if (!is_calibrated) {
        background_noise = db;
        is_calibrated    = true;
        Serial.print("Ruído de fundo inicial: ");
        Serial.println(background_noise);
    } else if (db < background_noise) {
        background_noise = background_noise * (1.0 - ALPHA_DOWN) + db * ALPHA_DOWN;
    } else if (db < (background_noise + 5.0)) {
        background_noise = background_noise * (1.0 - ALPHA_UP) + db * ALPHA_UP;
    } else {
        background_noise = background_noise * (1.0 - ALPHA_UP / 10.0) + db * (ALPHA_UP / 10.0);
    }

    if (currentMillis - lastSend >= SEND_INTERVAL && wsConnected) {
        String payload = "{\"db\":" + String(db, 1) + 
                        ",\"room\":\"" + roomName + "\"" + 
                        ",\"key\":\"" + String(apiKey) + "\"}";
                        
        wsClient.sendTXT(payload);
        lastSend = currentMillis;
    }

    // ─── Path 2: spike alert via HTTP POST (same threshold logic as before) ──
    if (db >= (background_noise + SPIKE_THRESHOLD)) {
        if (currentMillis - lastAlertSend >= ALERT_COOLDOWN) {
            Serial.print("⚠️ PICO: ");
            Serial.print(db, 1);
            Serial.print(" dB | Fundo: ");
            Serial.print(background_noise, 1);
            Serial.println(" dB");

            sendAlert(db);
            lastAlertSend = currentMillis;
        }
    }

    // WiFi watchdog
    if (WiFi.status() != WL_CONNECTED && currentMillis % 10000 < 50) {
        Serial.println("WiFi caiu. Reconectando...");
        WiFi.reconnect();
    }
}