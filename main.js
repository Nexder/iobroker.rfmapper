'use strict';

const utils = require('@iobroker/adapter-core');
const { spawn, exec } = require('child_process');
const mqtt = require('mqtt')

var adapter = utils.adapter('rfmapper'); // - mandatory

let timer, mqttSendTimer;
let timerIsActive, mqttTimerIsActive = false;
let mqttClient;

var mqttSendStack = [];


adapter.on('ready', function()
{
	adapter.log.debug('connecting mqtt');
	mqttClient = mqtt.connect({
		host: `${adapter.config.MQTTServer}`,
		port: adapter.config.MQTTPort,
		username: `${adapter.config.MQTTUser}`,
		password: `${adapter.config.MQTTPassword}`
	});

	mqttClient.on('connect', function () 
	{
		adapter.log.debug('MQTT Connected');
		mqttClient.subscribe(adapter.config.MQTTTopic);
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

adapter.on('stateChange', function(id, state)
{
	if (state) 
	{
		if (state.ack == false)
		{
			//adapter.log.debug(`Start SendCodeByID`);
			SendCodeByID(id.split('.').pop(), state.val);
		}
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
		clearInterval(mqttSendTimer);
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
			adapter.setStateAsync(`${device.id}`, { val: state, ack: true });
		}
		else
		{
			if (!device.timerIsActive)
			{		
				device.timerTimeEnd = new Date().getTime() + (device.timer * 1000);
				device.timerIsActive = true;
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
		if (!adapter.config.devices.length) 
		{
			adapter.log.warn('No Device configured');
		}
		else
		{
			for (let k = 0; k < adapter.config.devices.length; k++) 
			{
				const device = adapter.config.devices[k];
				if (device.codeOn == code)
				{
					adapter.log.debug(`Incoming Turn On ${device.id}`);
					// Prüfen, ob das Gerät zum Einschalten eine Bedingung hat
					if (device.condition)
					{
						adapter.log.debug(`Checking existing condition to ${device.condition}`);
						// Bedingung auswerten
						adapter.getForeignState(device.condition, function (err, obj) 
						{
							if (err) 
							{
								adapter.log.error(err);
							} 
							else 
							{
								if (obj.val)
								{
									AddOrUpdateObject(device, true);
								}
								else
								{
									adapter.log.debug(`Condition == false`);
								}
							}
						});
					}
					else
					{
						adapter.log.debug(`Incoming Turn On ${device.id}`);
						AddOrUpdateObject(device, true);
					}
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

function SendCodeByID(name, state)
{
	try
	{
		if (!adapter.config.devices.length) 
		{
			adapter.log.warn('No Device configured');
		}
		else
		{
			for (let k = 0; k < adapter.config.devices.length; k++) 
			{
				const device = adapter.config.devices[k];
				if (device.id == name)
				{
					if (state)
					{
						adapter.log.debug(`Queue Turn On ${device.id} - ${device.codeOn}`);
						mqttSendStack.push(`RfCode ${device.codeOn}`);
					}
					else if (!state)
					{
						adapter.log.debug(`Queue Turn OFF ${device.id} - ${device.codeOff}`);
						mqttSendStack.push(`RfCode ${device.codeOff}`);						
					}
					
					// Using Quenue to send multiple incoming State-Changes to the RF-MQTT Client.
					// Too fast misses Codes to send
					if(!mqttTimerIsActive)
					{
						mqttTimerIsActive = true;
						mqttSendTimer = setInterval(SendMQTTCommands.bind(this), adapter.config.RFSendDelay);
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

function SendMQTTCommands()
{
	var msg = mqttSendStack.pop();
	if (msg)
	{
		adapter.log.debug(`Sending - ${msg}`);	
		mqttClient.publish(adapter.config.MQTTCmdTopic, msg);
	}
	else
	{
		// Timer stoppen, wenn kein Befehl mehr in der Quenue stehen
		adapter.log.debug('No MQTTCommand left - Disable MQTTSend-Timer');
		clearInterval(mqttSendTimer);
		mqttTimerIsActive = false;
	}
}
