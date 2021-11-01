#==============================================================================
# ========================== Filtragem de dados ===============================
#################################
# Faz a filtragem e calculo da posição estimada do EndNode LoRa
# Autor : Daniel Marques
# Bolsista TA.DT/PTI - 2021
#################################
#==============================================================================

import numpy as np
import pandas as pd
import statistics as st
from scipy import linalg as lin
# ============================== Space for Functions ==========================
def position(t1,t2,t3,x_1,x_2,x_3,y_1,y_2,y_3,E_1,E_2,E_3,x_m,y_m):
    t1 = t3+3; E_1 = E_3;
    c = 2.998e8; d1 = t1*c; d2 = t2*c; d3 = t3*c;  #
    
    h = np.zeros([2,1],dtype = np.longdouble);           r_m = np.zeros([2,1],dtype = h.dtype);
    G = np.zeros([2,2],dtype = h.dtype);           

    R1=(np.sqrt((x_1-x_m)**2+(y_1-y_m)**2)); 
    R2=(np.sqrt((x_2-x_m)**2+(y_2-y_m)**2)); 
    R3=(np.sqrt((x_3-x_m)**2+(y_3-y_m)**2));
    h[0] = (d2 - d1) - (R2 - R1); h[1] = (d3 - d1) - (R3 - R1);
   

    G[0,0] = (((x_1-x_m)/R1)-((x_2-x_m)/R2))*1e9;         G[0,1] = (((y_1-y_m)/R1)-((y_2-y_m)/R2))*1e9;
    G[1,0] = (((x_1-x_m)/R1)-((x_3-x_m)/R3))*1e9;         G[1,1] = (((y_1-y_m)/R1)-((y_3-y_m)/R3))*1e9;

    G_t = np.transpose(G); 
    delta = lin.inv(np.matmul(G_t,G)); deca = np.matmul(G_t,h);
    r_m = np.matmul(delta,deca)
  
    return r_m

# ============================== Space for Input ==============================
d_1 = pd.read_csv(r'C:\Users\Usuario\Documents\dadosposition.csv',encoding = 'UTF-8' ,delimiter = ';',decimal = ',')
# ============================== Start Definition =============================
lenof = len(d_1)-1

T_1 = np.zeros(lenof,dtype = np.double);    x_1 = 0;    y_1 = 0;
T_2 = np.zeros(lenof,dtype = np.double);    x_2 = 0;    y_2 = 0;
T_3 = np.zeros(lenof,dtype = np.double);    x_3 = 0;    y_3 = 0;
RSSI = np.zeros(lenof);
SNR = np.zeros(lenof)
R_f = np.zeros([2,1])
n_f = np.zeros([lenof,2])
# Estimativa Inicial da Localização, sendo um ponto central aos Gateways
# Lembrar que as coordenadas no hemisferio sul, oeste são negativas
# As correções serão realizadas ao fim

x_f = -25.436078; y_f = -54.595719; 
x = 0; y = 0;
E_1 = np.zeros(lenof,dtype = np.double);
E_2 = np.zeros(lenof,dtype = np.double);
E_3 = np.zeros(lenof,dtype = np.double); 

# =============================================================================
error = 10**-9
e = 1
j = 0
# ============================== Main Loop/Output =============================
for i in range(lenof):
    if str(d_1['FromGate'][i]) == 'GatewayPTI-EdAguas':
        T_1[j] = np.double(d_1['Gateway'][i]);    x_1 = np.double(d_1['Latitude'][i]);    
        y_1 = np.double(d_1['Longitude'][i]);   E_1[j] = np.double(d_1['EndNode'][i]);      
        T_3[j] = np.double(d_1['Gateway'][i]);   '''x_3 = float(d_1['Latitude'][i]);    
        y_3 = float(d_1['Longitude'][i])''';   E_3[j] = np.double(d_1['EndNode'][i]);
        j+=1 
    if float(d_1['RSSI'][i]) < 0:
        RSSI[i] = float(d_1['RSSI'][i]);
    if type(d_1['SNR'][i]) == float and float(d_1['SNR'][i]) < 0:
        SNR[i] = float(d_1['SNR'][i])
        
   
    
    # Coordenada Fantasia Gateway 3
    #----------------------------------------------------------
    x_3 = -25.437238;  y_3 = -54.595551 
#==========================================================
    
j = 0    
for i in range(lenof):
    if str(d_1['FromGate'][i]) == 'GatewayRPi2':
        T_2[j] = np.double(d_1['Gateway'][i]);   x_2 = np.double(d_1['Latitude'][i]);    
        y_2 = np.double(d_1['Longitude'][i]);   E_2[j] = np.double(d_1['EndNode'][i]);
       
        j+=1
for t in range(len(d_1)-1):
    
        R_f = position(T_1[t],T_2[t],T_3[t],x_1,x_2,x_3,y_1,y_2,y_3,E_1,E_2,E_3,x_f,y_f)

        x = x_f - R_f[0]/1e9; y = y_f - R_f[1]/1e9;
       
        if (abs(x - x_f)/x) < e:
            e =  abs((x - x_f)/x)
        x_f = x; y_f = y; 
        n_f[t][0] = x_f; n_f[t][1] = y_f;
if x_f <  0:
    Lat  = 'South';
else:
    Lat = 'North';
if y_f < 0 :
    Lon = 'West';
else:
    Lon = 'East';

# ============================== Space for Plots ==============================
print('\\ ================================================================== //')    
print('\n Estimativa da Posição:\n\n','Latitude: ',round(float(x_f),6),Lat,'\n','Longitude:',round(float(y_f),7),Lon,'\n')                  
print('\\ ================================================================== /') 
print(n_f)