#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <Firebase_ESP_Client.h>

#define DPIN 4
#define DTYPE DHT11

DHT dht(DPIN, DTYPE);

#define ON_Board_LED 2  // On board LED, indicator when connecting to WiFi
#define soil_moisture A0 // Soil Moisture Sensor Pin

#define API_KEY "AIzaSyAyZLWgQSWzcjfMEmTnsaC69Li0J7PX-gM"
#define DATABASE_URL "https://mini-project-vth-sem-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define USER_EMAIL "trishanu.nayak@gmail.com"
#define USER_PASSWORD "trishanu1234ESP"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

const int raindropSensor = D3;

#define WIFI_SSID "Galaxy F1235C5"   // WiFi SSID
#define WIFI_PASSWORD "rnjc6038" // WiFi Password

const char* host = "script.google.com";
const int httpsPort = 443;

// String GAS_ID = "AKfycbwDHi9DAd7i8QbcGd8k4q6sfXZfemNxQYBfGlK0zJgth2Isi1vZAN4zdsmjVXh86M2LoQ";

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(raindropSensor, INPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD); // Connect to WiFi
  Serial.print("Connecting to WiFi");
  pinMode(ON_Board_LED, OUTPUT); // LED output mode
  digitalWrite(ON_Board_LED, HIGH); // Turn off LED while connecting

  // Attempt WiFi connection
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    digitalWrite(ON_Board_LED, LOW);
    delay(200);
    digitalWrite(ON_Board_LED, HIGH);
    delay(200);
  }

  digitalWrite(ON_Board_LED, HIGH); // Turn off LED when connected
  Serial.println("\nConnected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());


  


  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth); // Initialize Firebase
}

void loop() {
  float k = analogRead(soil_moisture);
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  float p = k;
  int raindropState = digitalRead(raindropSensor);

  Serial.println("Temperature: " + String(t) + " °C");
  Serial.println("Humidity: " + String(h) + " %");
  Serial.println("Soil Moisture: " + String(p));
  Serial.println("Rain State: " + String(raindropState));

  sendFirebase(t, h, p, raindropState);

  // sendData(t, h, p, raindropState); 
  
  delay(15000);// Send data to Firebase RTDB
}

void sendFirebase(float temperature, float humidity, float moisture, int rain) {
  WiFiClientSecure client; 
  client.setInsecure(); // Disable SSL certificate verification
  if (Firebase.RTDB.setFloat(&fbdo, "sensor/Temperature", temperature) &&
      Firebase.RTDB.setFloat(&fbdo, "sensor/Humidity", humidity) &&
      Firebase.RTDB.setFloat(&fbdo, "sensor/Moisture", moisture) &&
      Firebase.RTDB.setInt(&fbdo, "sensor/Rain", rain)) {
    Serial.println("Data sent to Firebase successfully.");
  } else {
    Serial.println("Failed to send data to Firebase.");
    Serial.println(fbdo.errorReason());
  }
  client.stop();

  
}


