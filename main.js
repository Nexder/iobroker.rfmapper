'use strict';

/*
 * Created with @iobroker/create-adapter v1.21.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const { spawn, exec } = require('child_process');
const mqtt = require('mqtt')
let timer;
let timerIsActive = false;
let mqttClient;

class Template extends utils.Adapter 
{

    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'rf433utils',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() 
	{	
		mqttClient = mqtt.connect('mqtt://192.168.69.170');

		mqttClient.on('connect', function () 
		{
		  mqttClient.subscribe('tele/RFCodes/RESULT');
		});
		
		mqttClient.on('message', function (topic, message) 
		{
		  this.log.debug(`stdout: ${message}`);
		});

		rfsniffer.stdout.on('data', (data) =>
		{
			try
			{
				// Eingehende Signale auswerten
				this.UpdateDeviceByCode(`${data}`.replace('Received', '').trim());
				this.log.debug(`stdout: ${data}`);
			}
			catch (ex)
			{
				this.log.error(ex);
			}
		});

		
		for (let k = 0; k < this.config.devices.length; k++) 
		{
			const device = this.config.devices[k];
			this.setObjectNotExists(`${device.id}`,
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
        this.subscribeStates('*');
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) 
	{
        try 
		{
			clearInterval(timer);
            this.log.info('cleaned everything up...');
            callback();
        } 
		catch (e) 
		{
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) 
	{
        if (obj) 
		{	
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } 
		else 
		{
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    async onStateChange(id, state) 
	{
        if (state) 
		{
			if (state.ack == false)
			{
				this.log.debug(`Start SendCodeByID`);
				await this.SendCodeByID(id.split('.').pop(), state.val);
			}
            // The state was changed
            this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } 
		else 
		{
            // The state was deleted
            this.log.debug(`state ${id} deleted`);
        }
    }
	
	CheckTimer() 
	{
		try
		{
			this.log.debug('check all Timer');
			let foundtimer = false;
			// Regelmäßig alle Devices durchgehen und prüfen, ob ein Timer aktiv ist
			for (let k = 0; k < this.config.devices.length; k++) 
			{
				const device = this.config.devices[k];
				if (device.timerIsActive)
				{
					
					// Prüfen, ob Akteur abgeschaltet werden muss
					if (new Date().getTime() > device.timerTimeEnd)
					{
						this.log.debug(`disable Device Timer`);
					
						this.setStateAsync(`${device.id}`, { val: false, ack: true });
						device.timerIsActive = false;
					}
					foundtimer = true;
				}
			}
			if (!foundtimer)
			{
				// Timer stoppen, wenn kein Akteur einen aktiven Timer besitzt
				this.log.debug('deactivate Timer');
				clearInterval(timer);
				timerIsActive = false;
			}
		}
		catch (ex)
		{
			this.log.error(ex);
		}
	};

	async AddOrUpdateObject(device, state)
	{
		try
		{
			this.log.debug('AddOrUpdate');
			this.setObjectNotExists(`${device.id}`,
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
				this.log.debug(`Set normal`);
				await this.setStateAsync(`${device.id}`, { val: state, ack: true });
			}
			else
			{
				if (!device.timerIsActive)
				{
					this.log.debug(`start device timer`);					
					device.timerTimeEnd = new Date().getTime() + (device.timer * 1000);
					device.timerIsActive = true;
					this.log.debug(`Set with timer ${device.timer}s`);
					//await this.setStateAsync(`${device.name}`, { val: state, ack: true, expire: device.timer });
					await this.setStateAsync(`${device.id}`, { val: state, ack: true });
					if(!timerIsActive)
					{
						timerIsActive = true;
						timer = setInterval(this.CheckTimer.bind(this) ,1000);
					}
				}
				else
				{
					// Extend Timeout
					device.timerTimeEnd = new Date().getTime() + (device.timer * 1000);
					this.log.debug(`Extend Timer`);
				}
			}
		}
		catch (ex) 
		{
			this.log.error(ex);
		}
	}
	
	async UpdateDeviceByCode(code)
	{
		try
		{
			this.log.debug('Search Device');
		    if (!this.config.devices.length) 
			{
				this.log.warn('No Device configured');
			}
			else
			{
				for (let k = 0; k < this.config.devices.length; k++) 
				{
					const device = this.config.devices[k];
					this.log.debug(`Device ${device.id}`);
					this.log.debug(`CodeOn ${device.codeOn}`);
					this.log.debug(`Code ${code}`);
					
					if (device.codeOn == code)
					{
						this.log.debug(`Incoming Turn On ${device.id}`);
						this.AddOrUpdateObject(device, true);
					}
					else if (device.codeOff == code)
					{
						this.log.debug(`Incoming Turn Off ${device.id}`);
						this.AddOrUpdateObject(device, false);
					}
				}
			}				
		}
		catch (ex)
		{			
			this.log.error(ex);
		}
	}
	
	async SendCodeByID(name, state)
	{
		try
		{
			this.log.debug('Search Send-Device');
		    if (!this.config.devices.length) 
			{
				this.log.warn('No Device configured');
			}
			else
			{
				for (let k = 0; k < this.config.devices.length; k++) 
				{
					const device = this.config.devices[k];
					this.log.debug(`Device ${device.id}`);
					this.log.debug(`Code ${state}`);
					this.log.debug(`Name ${name}`);
					
					if (device.id == name)
					{
						if (state)
						{
							this.log.debug(`Outgoing Turn On ${device.id} - ${device.codeOn}`);
							await exec(`${this.config.CodeSendPath} ${device.codeOn}`);
							// /home/pi/433Utils/RPi_utils/codesend 
						}
						else if (!state)
						{	
							this.log.debug(`Outgoing Turn OFF ${device.id} - ${device.codeOff}`);
							await exec(`${this.config.CodeSendPath} ${device.codeOff}`);
						}
					}
				}
			}
		}
		catch (ex)
		{			
			this.log.error(ex);
		}
	}
}

// @ts-ignore parent is a valid property on module
if (module.parent) 
{
    // Export the constructor in compact mode
    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Template(options);
} 
else 
{
    // otherwise start the instance directly
    new Template();
}
