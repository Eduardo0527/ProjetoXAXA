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
const char* serverName = "http://192.168.1.100:5000/upload-audio"; 
const char* apiKey = "YOUR_RAW_API_KEY_HERE"; 
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

const double ALARM_THRESHOLD = 60.0;     // Dispara o envio imediato se passar deste valor em dB
unsigned long lastPeriodicSend = 0;      // Guarda o tempo do último envio de rotina
const unsigned long PERIODIC_INTERVAL = 10000; // Envia uma leitura padrão a cada 10 segundos
unsigned long lastAlertSend = 0;         // Evita inundar a API com alertas repetidos
const unsigned long ALERT_COOLDOWN = 3000;    // Janela de 3 segundos entre alertas pós-pico

// Função auxiliar para encapsular o envio HTTP POST
void sendDataToAPI(float db, float hz) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverName);

        http.addHeader("Content-Type", "application/x-www-form-urlencoded");
        http.addHeader("x-api-key", apiKey);

        // Monta o payload idêntico ao esperado pelo FastAPI
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
    delay(1000); // Dá um tempo para o terminal abrir

    // Limpa qualquer lixo que tenha ficado no buffer da porta Serial
    while (Serial.available()) {
        Serial.read();
    }

    Serial.println("\n=================================");
    Serial.println("  CONFIGURAÇÃO DE REDE WI-FI");
    Serial.println("=================================");
    
    // 1. Pede o SSID (Nome da Rede)
    Serial.println("> Digite o nome da rede (SSID) e pressione ENTER:");
    while (Serial.available() == 0) {
        delay(100); // Fica preso aqui esperando o usuário digitar algo
    }
    ssid = Serial.readStringUntil('\n'); // Lê até o enter
    ssid.trim(); // Remove espaços em branco ou quebras de linha acidentais

    // 2. Pede a Senha
    Serial.println("> Digite a senha do Wi-Fi e pressione ENTER:");
    while (Serial.available() == 0) {
        delay(100); // Fica preso aqui esperando a senha
    }
    password = Serial.readStringUntil('\n');
    password.trim();

    Serial.println("\n---------------------------------");
    Serial.print("Tentando conectar em: ");
    Serial.println(ssid);

    // 3. Conexão Wi-Fi (usamos .c_str() para converter String de volta para const char*)
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
        // Você pode colocar um while(true); aqui se quiser travar o código em caso de erro
    }

    // 2. Configuração do Driver I2S
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT, // Configuração corrigida para mono
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

    // Leitura contínua do barramento I2S (Bloqueia apenas até o buffer encher: ~32ms)
    i2s_read(I2S_PORT, samples, sizeof(samples), &bytes_read, portMAX_DELAY);

    int samples_read = bytes_read / sizeof(int32_t);
    if (samples_read == 0) return;

    // Tratamento de Offset DC
    double mean = 0;
    for (int i = 0; i < samples_read; i++) {
        int32_t sample = samples[i] >> 8; 
        mean += sample;
    }
    mean /= samples_read;

    // Cálculo de RMS e detecção de pico absoluto no buffer
    double sum = 0;
    double max_amplitude = 0;

    for (int i = 0; i < samples_read; i++) {
        int32_t sample = samples[i] >> 8;
        double centered = (double)sample - mean;
        sum += (centered * centered);

        if (fabs(centered) > max_amplitude) {
            max_amplitude = fabs(centered);
        }
    }

    double rms = sqrt(sum / samples_read);
    if (rms < 1) rms = 1; 

    // Conversão para dB com a calibração ajustada por você
    double calibration_offset = -50.0; 
    double db = 20.0 * log10(rms) + calibration_offset;

    // Frequência fictícia/estimada para preencher o parâmetro hz exigido pelo servidor
    float currentHz = 440.0; 

    unsigned long currentMillis = millis();

    // ========================================================================
    // ESTRATÉGIA DE ENVIO INTELIGENTE
    // ========================================================================

    // Cenário A: O som ultrapassou o limite (Pico detectado!)
    if (db >= ALARM_THRESHOLD) {
        // Verifica se já passou o tempo de cooldown para não sobrecarregar o servidor
        if (currentMillis - lastAlertSend >= ALERT_COOLDOWN) {
            Serial.print("⚠️ PICO DETECTADO! Nível: ");
            Serial.print(db, 1);
            Serial.println(" dB. Disparando API...");
            
            sendDataToAPI(db, currentHz);
            
            lastAlertSend = currentMillis;
            lastPeriodicSend = currentMillis; // Reseta o cronômetro periódico para não duplicar envios
        }
    } 
    // Cenário B: Envio periódico normal de rotina (Apenas para telemetria/gráfico de histórico)
    else if (currentMillis - lastPeriodicSend >= PERIODIC_INTERVAL) {
        Serial.print("Atualização de rotina: ");
        Serial.print(db, 1);
        Serial.println(" dB");
        
        sendDataToAPI(db, currentHz);
        
        lastPeriodicSend = currentMillis;
    }
    
    // Verificação de segurança de conexão Wi-Fi em background
    if (WiFi.status() != WL_CONNECTED && currentMillis % 5000 == 0) {
        Serial.println("WiFi caiu. Tentando reconectar...");
        WiFi.reconnect();
    }
}