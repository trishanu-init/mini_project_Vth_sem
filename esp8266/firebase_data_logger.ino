#include <iostream>
#include "creds.cpp"
using namespace std;
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <Firebase_ESP_Client.h>

#define DPIN 4
#define DTYPE DHT11

DHT dht(DPIN, DTYPE);

#define ON_Board_LED 2  // On board LED, indicator when connecting to WiFi
#define soil_moisture A0 // Soil Moisture Sensor Pin

#define API_KEY "API-KEY"
#define DATABASE_URL "DATABASE-URL"
#define USER_EMAIL "E-MAIL"
#define USER_PASSWORD "PASSWORD"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

const int raindropSensor = D3;

#define WIFI_SSID "ssid"   // WiFi SSID
#define WIFI_PASSWORD "pswd" // WiFi Password

const char* host = "script.google.com";
const int httpsPort = 443;


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
  float p = (1024-k)/1024*100;
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


