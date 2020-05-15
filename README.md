![Logo](admin/rf433utils.png)
# ioBroker.rf433utils

[![NPM version](http://img.shields.io/npm/v/iobroker.template.svg)](https://www.npmjs.com/package/iobroker.template)
[![Downloads](https://img.shields.io/npm/dm/iobroker.template.svg)](https://www.npmjs.com/package/iobroker.template)
![Number of Installations (latest)](http://iobroker.live/badges/template-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/template-stable.svg)
[![Dependency Status](https://img.shields.io/david/Author/iobroker.template.svg)](https://david-dm.org/Nexder/iobroker.rf433utils)
[![Known Vulnerabilities](https://snyk.io/test/github/Nexder/ioBroker.rf433utils/badge.svg)](https://snyk.io/test/github/Author/ioBroker.template)

[![NPM](https://nodei.co/npm/iobroker.rf433utils.png?downloads=true)](https://nodei.co/npm/iobroker.rf433utils/)

## rf433utils adapter for ioBroker
The rf433utils adapter is for getting access to local installed rf-receiver and sender, which are able to control by [433Utils](https://github.com/ninjablocks/433Utils) from Ninjablocks.

With the adapter you are able to define devices with theire on- and offswitch code and read/send code to an from them.



## Installation

### Hardware

##### Raspberry Pi

- Receiver DATA -> GPIO17
- Sender DATA -> GPIO2  
  - Raspberry Rev.1 -> GPIO pin 21 
  - Raspberry Rev2 -> GPIO pin 27



### Software

1. Install Wiring Pi

```
cd ~/
git clone https://github.com/WiringPi/WiringPi   
cd wiringPi
./build
```

2. Install 433Utils

```
cd ~/
git clone git://github.com/ninjablocks/433Utils.git --recursive 
cd 433Utils/RPi_utils
make
```



## Configuration

Point the fullpath to RFSniffer and codesend scripts to the 433Utils installation.



## Changelog

### 0.0.1
* (Author) initial release

## License
MIT License

Copyright (c) 2020 Author <author@mail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.