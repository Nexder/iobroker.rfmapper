'use strict';

/*
 * Created with @iobroker/create-adapter v1.21.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const { spawn, exec } = require('child_process');
const mqtt = require('mqtt')

var adapter = utils.adapter('rfmapper'); // - mandatory

let timer;
let timerIsActive = false;
let mqttClient;



adapter.on('ready', function()
{
	adapter.log.debug('connecting mqtt');
	mqttClient = mqtt.connect({
		host: '192.168.69.170',
		port: 1883,
		username: 'mqttuser',
		password: 'hH3ASVueUyyXUYgQilDn'
	});

	mqttClient.on('connect', function () 
	{
		adapter.log.debug('MQTT Connected');
		mqttClient.subscribe('tele/RFCodes/RESULT');
	});

	mqttClient.on('message', function (topic, message) 
	{
		try
		{
			adapter.log.debug(`Incoming Message ${message}`);
			var payload = JSON.parse(message);
			var code = payload.RfReceived.Data;
			adapter.log.debug(`Incoming Code ${code}`);
			// Eingehendes Signal protokollieren
			adapter.setObjectNotExists(`Last incoming code`,
			{
				type: 'state',
				common:
				{
					name: `Last incoming code`,
					type: 'string',
					role: '',
					read: true,
					write: true,
				},
				native: {},
			});
			adapter.setStateAsync(`Last incoming code`, { val: `${code}`.trim(), ack: true });
			// Eingehende Signale auswerten
			UpdateDeviceByCode(`${code}`.trim());
			//adapter.log.debug(`stdout: ${data}`);
		}
		catch (ex)
		{
			adapter.log.error(ex);
		}
	});


	for (let k = 0; k < adapter.config.devices.length; k++) 
	{
		const device = adapter.config.devices[k];
		adapter.setObjectNotExists(`${device.id}`,
		{
			type: 'state',
			common:
			{
				name: `${device.name}`,
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true,
			},
			native: {},
		});
	}

	// in this template all states changes inside the adapters namespace are subscribed
	adapter.subscribeStates('*');	
});

adapter.on('objectChange', function(id, obj)
{
	if (obj) 
	{	
		// The object was changed
		//adapter.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	} 
	else 
	{
		// The object was deleted
		//adapter.log.info(`object ${id} deleted`);
	}	
});

adapter.on('stateChange', function(id, state)
{
	if (state) 
	{
		if (state.ack == false)
		{
			//adapter.log.debug(`Start SendCodeByID`);
			SendCodeByID(id.split('.').pop(), state.val);
		}
		// The state was changed
		//adapter.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
	} 
	else 
	{
		// The state was deleted
		adapter.log.debug(`state ${id} deleted`);
	}
});

adapter.on('unload', function()
{
	try 
	{
		clearInterval(timer);
		adapter.log.info('cleaned everything up...');
		callback();
	} 
	catch (e) 
	{
		callback();
	}
});



function CheckTimer() 
{
	try
	{
		//adapter.log.debug('check all Timer');
		let foundtimer = false;
		// Regelmäßig alle Devices durchgehen und prüfen, ob ein Timer aktiv ist
		for (let k = 0; k < adapter.config.devices.length; k++) 
		{
			const device = adapter.config.devices[k];
			if (device.timerIsActive)
			{
				
				// Prüfen, ob Akteur abgeschaltet werden muss
				if (new Date().getTime() > device.timerTimeEnd)
				{
					adapter.log.debug(`disable Device Timer`);
				
					adapter.setStateAsync(`${device.id}`, { val: false, ack: true });
					device.timerIsActive = false;
				}
				foundtimer = true;
			}
		}
		if (!foundtimer)
		{
			// Timer stoppen, wenn kein Akteur einen aktiven Timer besitzt
			adapter.log.debug('No Timer is Active - Disable Main-Timer');
			clearInterval(timer);
			timerIsActive = false;
		}
	}
	catch (ex)
	{
		adapter.log.error(ex);
	}
};

function AddOrUpdateObject(device, state)
{
	try
	{
		adapter.log.debug('AddOrUpdate');
		adapter.setObjectNotExists(`${device.id}`,
		{
			type: 'state',
			common:
			{
				name: `${device.name}`,
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true,
			},
			native: {},
		});
		if (state == false || !device.timer)
		{
			//adapter.log.debug(`Set normal`);
			adapter.setStateAsync(`${device.id}`, { val: state, ack: true });
		}
		else
		{
			if (!device.timerIsActive)
			{
				//adapter.log.debug(`start device timer`);					
				device.timerTimeEnd = new Date().getTime() + (device.timer * 1000);
				device.timerIsActive = true;
				//adapter.log.debug(`Set with timer ${device.timer}s`);
				adapter.setStateAsync(`${device.id}`, { val: state, ack: true });
				if(!timerIsActive)
				{
					timerIsActive = true;
					timer = setInterval(CheckTimer.bind(this) ,1000);
				}
			}
			else
			{
				// Extend Timeout
				device.timerTimeEnd = new Date().getTime() + (device.timer * 1000);
				adapter.log.debug(`Extend Timer`);
			}
		}
	}
	catch (ex) 
	{
		adapter.log.error(ex);
	}
}

function UpdateDeviceByCode(code)
{
	try
	{
		//adapter.log.debug('Search Device');
		if (!adapter.config.devices.length) 
		{
			adapter.log.warn('No Device configured');
		}
		else
		{
			for (let k = 0; k < adapter.config.devices.length; k++) 
			{
				const device = adapter.config.devices[k];
				//adapter.log.debug(`Device ${device.id}`);
				//adapter.log.debug(`CodeOn ${device.codeOn}`);
				//adapter.log.debug(`Code ${code}`);
				
				if (device.codeOn == code)
				{
					adapter.log.debug(`Incoming Turn On ${device.id}`);
					AddOrUpdateObject(device, true);
				}
				else if (device.codeOff == code)
				{
					adapter.log.debug(`Incoming Turn Off ${device.id}`);
					AddOrUpdateObject(device, false);
				}
			}
		}				
	}
	catch (ex)
	{			
		adapter.log.error(ex);
	}
}

function sleepAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function SendCodeByID(name, state)
{
	try
	{
		//adapter.log.debug('Search Send-Device');
		if (!adapter.config.devices.length) 
		{
			adapter.log.warn('No Device configured');
		}
		else
		{
			for (let k = 0; k < adapter.config.devices.length; k++) 
			{
				const device = adapter.config.devices[k];
				//adapter.log.debug(`Device ${device.id}`);
				//adapter.log.debug(`Code ${state}`);
				//adapter.log.debug(`Name ${name}`);
				
				if (device.id == name)
				{
					if (state)
					{
						adapter.log.debug(`Outgoing Turn On ${device.id} - ${device.codeOn}`);
						mqttClient.publish('cmnd/RFCodes/Backlog', `RfCode #${device.codeOn}`);
						sleep(100);
						adapter.log.debug(`Completed Turn On ${device.id} - ${device.codeOn}`);
					}
					else if (!state)
					{
						adapter.log.debug(`Outgoing Turn OFF ${device.id} - ${device.codeOff}`);
						mqttClient.publish('cmnd/RFCodes/Backlog', `RfCode #${device.codeOff}`);
						sleep(100);
						adapter.log.debug(`Completed Turn OFF ${device.id} - ${device.codeOn}`);
					}
				}
			}
		}
	}
	catch (ex)
	{			
		adapter.log.error(ex);
	}
}
