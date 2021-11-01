//=======================================================================// 
// ===================================================================== //
// ======================= Código para EndNode ========================= //
// ===================================================================== //
//
// Author: Daniel Marques  -- Setembro/2021
// Bolsista TA.DT - PTI - Brasil
// 
//=======================================================================// 

#include <ESP8266WiFi.h>
#include <LoRaAT.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

// ==================================================================== //
// ================= Definitons for get the time ====================== //

// network credentials for connection on NTP Server
const char *ssid = "Moto G Play 4241";  //Set your SSID here
const char *pass = "silva9942";         //Set your password

// Set NTP Client for time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP,"pool.ntp.org");

// ==================================================================== //
// ================== Definitons for LoRaWAN ========================== //

LoRaAT lora(12,13);

  String DevAddr = "06c5c7ef";
  String DevEui = "57e6ddb11b019040";
  String AppEui = "0000000000000000";
  String NwkSkey = "4e9e63cc6a107f5431926d93b1f2bc4b";
  String AppSkey = "04f33cda3eaf333ebe0e0ea659c0f010";
  
// =================================================================== //
void setup(){
  
  Serial.begin(115200);
  //---------------------- LoRa Sets ------------------------- //
  lora.init();
  lora.setIDs(DevAddr, DevEui, AppEui);
  lora.setKeys(NwkSkey, AppSkey);
  lora.setTimeDelay(700);
  lora.testConfig();
  // -------------------------------------------------------- //
  // ------------------- Wifi/NTP Sets ---------------------- //
  //Serial.print("Connecting to ");
  //Serial.println(ssid);
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  timeClient.begin();
  timeClient.setTimeOffset(-3*3600); // Set here your current GMT, my set is for Brazil GMT: -3 Hours of Greenwich 
}
// -------------------------------------------------------- //
// =================================================================== //
void loop()
{ 
// -------------------------------------------------------- //
// -------------- EndNode search time --------------------- //
  // if case want's to see the numbers from NTP uncomment
  
  timeClient.update();

  int hora = timeClient.getHours();
  //Serial.print("Hora: ");
  //Serial.println(hora);
  
  int minu = timeClient.getMinutes();
  //Serial.print("Minutos: ");
  //Serial.println(minu);
  
  int segundo = timeClient.getSeconds();
  //Serial.print("Segundos: ");
  //Serial.println(segundo);

 String msg = String(hora*3600+minu*60+segundo); // struct for send time on seconds
 Serial.println(msg); 

// -------------------------------------------------------- //
// -------------- EndNode send mensage -------------------- //

 Serial.println("\nSending message...");
  for(int i = 0; i < 3; i++){
    lora.sendCMsg(msg);
    if(lora.waitACK()){
      Serial.println("ACK Received in " + String(i+1) + " attempts");
      i = 5;
    }else {
      Serial.println("ACK Not Received, retrying.");
    }
    delay(500);
  }
  //Serial.println("Delaying 2s");
  delay(2000);

}
// =================================================================== //
