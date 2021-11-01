require('events').EventEmitter.prototype._maxListeners = 10000;

var mqtt = require('mqtt');
var http = require('http');
var fs = require('fs');
var data = new Date();

var horaAtual = data.getHours();
var minutoAtual = data.getMinutes();
var horaEnvio = 8.00;
// ------------------------------------
// ------------------------------------
var t = 0;

var clear = true;

var client = mqtt.connect('mqtt://loraserver.pti.org.br', {
  username: 'loraroot',
  password: 'lULd8dcryH3Ce6jUjx7g' 
});

var mqttSmart = mqtt.connect('mqtt://smartfarm.unioeste-foz.br:1883');

var nome_arq = './dados_metereologico.csv';

client.on('connect', function (connack) {

	console.log('--------------------------');
	console.log('Conectando ao servidor');
	if(client.connected){
		console.log('Conectado');
		client.subscribe({'application/2/device/0004a30b002116dd/rx' : 0}, function (err, granted) {
			if(err !== null)
				console.log(err);
			console.log(granted);
		});
		console.log('Esperando mensagem');
		console.log('--------------------------');
	}
});

client.on('close', function (){
	console.log('--------------------------');
	console.log('Desconectado do servidor');
	console.log('--------------------------');
});


client.on('error', function (error){
	console.log('--------------------------');
	console.log('Erro ao conectar no servidor');
	console.log(error);
	console.log('--------------------------');
});

client.on('offline', function(){
	console.log('--------------------------');
	console.log('Cliente offline')
	console.log('--------------------------');;
});

client.on('reconnect', function (){
	console.log('--------------------------');
	console.log('Reconectando...');
});


client.on('message', function (topic, payload, packet) {
	meuJson = JSON.parse(payload)
	
	meuJson['rxInfo'].forEach(element => {
		sp = element['time'].split('T')[1]
		element['time'] = sp
		
		return
	});
	console.log(meuJson)
	payload = JSON.stringify(meuJson)
	
	console.log(payload.toString());
	console.log(topic.toString());
	console.log(packet);
	console.log('--------------------------');

	//-----------------------------------------------------------------------//
	var r1 = payload.toString().split('"rssi":'); var rssi = r1[1].split(',"loRaSNR"');
	var s1 = payload.toString().split('"loRaSNR":'); var snr = s1[1].split(',"lo');

	//-----------------------------------------------------------------------//
	var lat = payload.toString().split('"latitude":'); var la = lat[1].split(',"long');
	var lon = payload.toString().split('"longitude":'); var lo = lon[1].split(',"alt');
	var timegate = payload.toString().split('"time":"'); var t_g1 = timegate[1].split('.');
	//-----------------------------------------------------------------------//

	var payload_data = payload.toString().split('"data":');
	var payload_clear = payload_data[1].split("}");

	var data = new Buffer(payload_clear[0], 'base64');
	console.log(data.toString());


	AnalisaDadosPkt1(data.toString(), rssi[0], snr[0],la[0],lo[0],t_g1[0]);

    console.log('--------------------------');
	
	try {

	} catch (err) {
		console.log('--------------------------');
		console.log('ERRO NO EVENTO');
		console.log(err);
		console.log('--------------------------');
	}
});
//gera um arquivo
async function escrevecsv(filename, data){
	var buff;
	if(data !== '\n')
		data = String(data).replace(/(\r\n|\n|\r)/gm,'');
    fs.readFile(filename, buff, (err) => {
        if (err){
			fs.createWriteStream(filename);
        }
	});
	if(data !== '\n')
		fs.appendFile(filename, data + ';', (err)=> {
			if(err) throw err;
			return true;
		});
	else
	fs.appendFile(filename, data, (err)=> {
		if(err) throw err;

		return false;
	});
	return true;
}

function AnalisaDadosPkt1(dados, rssi, snr,lat,lon,t_g1,timeset){
//-----------------------------------------------------------------------//
	dados = dados.split("|");
//-----------------------------------------------------------------------//	

	var c = dados[0];
	c = parseInt(c,10);
	chuva = Math.round(c)/100;

	console.log('Quantidade de Chuva: ');
	console.log(chuva + " mm/hr");
	console.log('--------------------------'); 

	var ca = dados[1];
	ca = parseInt(ca,10);
	chuvaAtual = Math.round(ca)/100;

	console.log('Chuva Atual: ');
	console.log(chuvaAtual + " mm/hr");
	console.log('--------------------------'); 

	var la = dados[2];
	la = parseFloat(lat);
	console.log('Latitude: ');
	console.log(la);
	console.log('--------------------------');

	var lo = dados[3];
	lo = parseFloat(lon);
	console.log('Longitude: ');
	console.log(lo);
	console.log('---------------------------');

	
	
//-----------------------------------------------------------------------//
	var timeset = dados[4];
	console.log('Time Gateway Edifício: ');
	console.log(t_g1);									// Horário no Gateway
	var alltime = t_g1.split(':');                      // Divisão do vetor Tempo
	timeset = (parseInt(alltime[0])-5)*3600+parseInt(alltime[1])*60+parseInt(alltime[2]); // Transformação do tempo(hora, minutos) em segundos
	console.log('---------------------------');
//-----------------------------------------------------------------------//

//-----------------------------------------------------------------------//

	console.log('RSSI: ');
	console.log(rssi);
	console.log('--------------------------'); 

	console.log('SNR: ');
	console.log(snr);
	console.log('--------------------------'); 

//-----------------------------------------------------------------------//
	envia_dados = 1

	if (envia_dados == 1){

		console.log('Publishing');
		var dados = [lat,lon,t_g1,timeset,rssi,snr,'\n'];
		for(var i = 0;i < dados.length;){
			var write = escrevecsv(nome_arq, dados[i]).then( (b) => {
				return b != false;
			  });
			if(write)
				i++;
			else
				throw "Nao foi possivel escrever no arquivo";
		}
	}
}
