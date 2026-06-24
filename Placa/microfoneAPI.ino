#include <Arduino.h>
#include <driver/i2s.h>
#include <math.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ============================================================================
// CONFIGURAÇÕES DE REDE E API
// ============================================================================
String ssid = "";
String password = "";
const char* serverName = "https://plaintiff-don-larger-spokesman.trycloudflare.com/upload-audio"; 
const char* apiKey = "esp32_SKOWqQdc4mdP4SHjLrTpzyVRIMm7Hg4hKlVJUC8MU1Q"; 
const String roomName = "Sala_1";

// ============================================================================
// CONFIGURAÇÕES DO MICROFONE (I2S)
// ============================================================================
#define I2S_WS     15
#define I2S_SD     32
#define I2S_SCK    14
#define I2S_PORT   I2S_NUM_0

#define SAMPLE_RATE      16000
#define BUFFER_LEN       512

int32_t samples[BUFFER_LEN];

// ============================================================================
// PARÂMETROS DE DETECÇÃO E TEMPO (LIMIAR DINÂMICO)
// ============================================================================
// Parâmetros do Filtro Passa-Baixa para o Ruído de Fundo
static double background_noise = 0.0;  // Começa em 0, será ajustado na primeira leitura
static bool is_calibrated = false;     // Controle para a primeira medição
const double ALPHA = 0.02;                   // Taxa de aprendizagem lenta (ajusta-se ao ambiente ao longo do tempo)
const double SPIKE_THRESHOLD = 15.0;         // Dispara o alerta se o som subir 15 dB acima do ruído de fundo

unsigned long lastPeriodicSend = 0;          // Guarda o tempo do último envio de rotina
const unsigned long PERIODIC_INTERVAL = 60000; // Envia telemetria a cada 60 segundos
unsigned long lastAlertSend = 0;             // Evita inundar a API com alertas repetidos
const unsigned long ALERT_COOLDOWN = 3000;    // Janela de 3 segundos entre alertas de pico

// Função auxiliar para encapsular o envio HTTP POST
void sendDataToAPI(float db, float hz) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverName);

        http.addHeader("Content-Type", "application/x-www-form-urlencoded");
        http.addHeader("x-api-key", apiKey);

        // Monta o payload esperado pelo FastAPI
        String httpRequestData = "hz=" + String(hz, 1) + "&db=" + String(db, 1) + "&room=" + roomName;
        
        Serial.print("-> Enviando API: ");
        Serial.println(httpRequestData);

        int httpResponseCode = http.POST(httpRequestData);

        if (httpResponseCode > 0) {
            Serial.print("Sucesso! Resposta do servidor: ");
            Serial.println(httpResponseCode);
        } else {
            Serial.print("Erro no envio POST: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    } else {
        Serial.println("Falha no envio: WiFi desconectado.");
    }
}

void setup() {
    Serial.begin(115200);

    while (!Serial) {
        delay(10);
    }

    delay(3000); // Dá um tempo para o terminal abrir

    // Limpa lixo do buffer da porta Serial
    while (Serial.available()) {
        Serial.read();
    }

    Serial.println("\n=================================");
    Serial.println("   CONFIGURAÇÃO DE REDE WI-FI");
    Serial.println("=================================");
    
    // 1. Pede o SSID
    Serial.println("> Digite o nome da rede (SSID) e pressione ENTER:");
    while (Serial.available() == 0) {
        delay(100);
    }
    ssid = Serial.readStringUntil('\n');
    ssid.trim();

    // 2. Pede a Senha
    Serial.println("> Digite a senha do Wi-Fi e pressione ENTER:");
    while (Serial.available() == 0) {
        delay(100);
    }
    password = Serial.readStringUntil('\n');
    password.trim();

    Serial.println("\n---------------------------------");
    Serial.print("Tentando conectar em: ");
    Serial.println(ssid);

    WiFi.begin(ssid.c_str(), password.c_str());
    
    int tentativas = 0;
    while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
        delay(500);
        Serial.print(".");
        tentativas++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConectado com sucesso!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nFALHA NA CONEXÃO! Reinicie o ESP32 e tente novamente.");
    }

    // 2. Configuração do Driver I2S
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT, // Mono
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64,
        .use_apll = false,
        .tx_desc_auto_clear = false,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK,
        .ws_io_num = I2S_WS,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_SD
    };

    if (i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL) != ESP_OK) {
        Serial.println("ERRO: Falha ao instalar driver I2S");
        return;
    }
    if (i2s_set_pin(I2S_PORT, &pin_config) != ESP_OK) {
        Serial.println("ERRO: Falha ao configurar pinos I2S");
        return;
    }

    i2s_zero_dma_buffer(I2S_PORT);
    Serial.println("Sistema pronto. Monitorando ambiente...");
}

void loop() {
    size_t bytes_read;

    // Leitura contínua do barramento I2S
    i2s_read(I2S_PORT, samples, sizeof(samples), &bytes_read, portMAX_DELAY);

    int samples_read = bytes_read / sizeof(int32_t);
    if (samples_read == 0) return;

    // Tratamento de Offset DC
    double mean = 0;
    for (int i = 0; i < samples_read; i++) {
        int32_t sample = samples[i] >> 8; // Alinha os 24 bits úteis do INMP441
        mean += sample;
    }
    mean /= samples_read;

    // Cálculo de RMS
    double sum = 0;
    for (int i = 0; i < samples_read; i++) {
        int32_t sample = samples[i] >> 8;
        double centered = (double)sample - mean;
        sum += (centered * centered);
    }

    double rms = sqrt(sum / samples_read);
    if (rms < 1.0) rms = 1.0; 

    // ========================================================================
    // CALIBRAÇÃO MATEMÁTICA PARA dB SPL REAL
    // ========================================================================
    // O valor máximo absoluto (Full Scale) para 24 bits é 2^23 = 8388608.0
    double dbfs = 20.0 * log10(rms / 8388608.0);
    
    // Converte de dBFS para dB SPL baseando-se na sensibilidade de -26 dBFS @ 94dB SPL do datasheet
    double db = dbfs + 120.0; 

    float currentHz = 440.0; // Frequência estática padrão (substituível por FFT se necessário)
    unsigned long currentMillis = millis();

    // ========================================================================
    // ADAPTAÇÃO DINÂMICA DO RUÍDO DE FUNDO (FILTRO ASSIMÉTRICO)
    // ========================================================================
    const double ALPHA_UP = 0.02;   // Sobe devagar (para não engolir picos reais)
    const double ALPHA_DOWN = 0.1;  // Desce rápido (recupera a sensibilidade rápido no silêncio)

    if (!is_calibrated) {
        background_noise = db; 
        is_calibrated = true;
        Serial.print("Ruído de fundo inicial calibrado para: ");
        Serial.println(background_noise);
    }

    // Lógica Assimétrica de Adaptação
    if (db < background_noise) {
        // Cenário A: Ficou mais silencioso (Ar condicionado desligou).
        // Desce RÁPIDO para o sensor voltar a ficar sensível.
        background_noise = (background_noise * (1.0 - ALPHA_DOWN)) + (db * ALPHA_DOWN);
        
    } else if (db < (background_noise + 5.0)) {
        // Cenário B: Som ambiente normal variando um pouco para cima.
        // Sobe DEVAGAR para não confundir conversas rápidas com aumento de ruído de fundo.
        background_noise = (background_noise * (1.0 - ALPHA_UP)) + (db * ALPHA_UP);
        
    } else {
        // Cenário C: Válvula de escape (Som muito alto e constante, ar condicionado ligou).
        // Sobe SUPER DEVAGAR para se adaptar ao novo ambiente se o barulho for permanente.
        background_noise = (background_noise * (1.0 - (ALPHA_UP/10))) + (db * (ALPHA_UP/10));
    }

    // ========================================================================
    // ESTRATÉGIA DE ENVIO INTELIGENTE (LIMIAR DINÂMICO)
    // ========================================================================

    // Cenário A: O som atual ultrapassou o ruído de fundo somado ao delta do pico
    if (db >= (background_noise + SPIKE_THRESHOLD)) {
        if (currentMillis - lastAlertSend >= ALERT_COOLDOWN) {
            Serial.print("⚠️ PICO DETECTADO! Nível: ");
            Serial.print(db, 1);
            Serial.print(" dB SPL | Ruído de Fundo: ");
            Serial.print(background_noise, 1);
            Serial.println(" dB SPL. Disparando API...");
            
            sendDataToAPI(db, currentHz);
            
            lastAlertSend = currentMillis;
            lastPeriodicSend = currentMillis; // Reseta o intervalo periódico para evitar concorrência
        }
    } 
    // Cenário B: Atualização periódica normal (Telemetria/Histórico)
    else if (currentMillis - lastPeriodicSend >= PERIODIC_INTERVAL) {
        Serial.print("Atualização de rotina | Ambiente: ");
        Serial.print(db, 1);
        Serial.print(" dB SPL | Média Móvel: ");
        Serial.print(background_noise, 1);
        Serial.println(" dB SPL");
        
        sendDataToAPI(db, currentHz);
        
        lastPeriodicSend = currentMillis;
    }
    
    // Verificação de segurança da conexão Wi-Fi
    if (WiFi.status() != WL_CONNECTED && currentMillis % 5000 == 0) {
        Serial.println("WiFi caiu. Tentando reconectar...");
        WiFi.reconnect();
    }
}