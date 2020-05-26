'use strict';

const utils = require('@iobroker/adapter-core');
const { spawn, exec } = require('child_process');

var adapter = utils.adapter('lgthinq'); // - mandatory

var mqttSendStack = [];


adapter.on('ready', function()
{
	// in this template all states changes inside the adapters namespace are subscribed
	adapter.subscribeStates('*');	
});


adapter.on('unload', function()
{
	try 
	{
		adapter.log.info('cleaned everything up...');
		callback();
	} 
	catch (e) 
	{
		callback();
	}
});
