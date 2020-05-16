![Logo](admin/rfmapper.png)
# ioBroker.rfmapper

[![NPM version](http://img.shields.io/npm/v/iobroker.rfmapper.svg)](https://www.npmjs.com/package/iobroker.rfmapper)
[![Downloads](https://img.shields.io/npm/dm/iobroker.rfmapper.svg)](https://www.npmjs.com/package/iobroker.rfmapper)
![Number of Installations (latest)](http://iobroker.live/badges/rfmapper-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/rfmapper-stable.svg)
[![Dependency Status](https://img.shields.io/david/Author/iobroker.rfmapper.svg)](https://david-dm.org/Nexder/iobroker.rfmapper)
[![Known Vulnerabilities](https://snyk.io/test/github/Nexder/ioBroker.rfmapper/badge.svg)](https://snyk.io/test/github/Author/ioBroker.rfmapper)

[![NPM](https://nodei.co/npm/iobroker.rfmapper.png?downloads=true)](https://nodei.co/npm/iobroker.rfmapper/)

## rfmapper adapter für ioBroker

Der RfMapper stellt eine unbeschränkte Verknüpfung von 433MHz-Geräten über eine SonOff RF Bridge mit Tasmota Firmware bereit. Die Geräte werden direkt im IOBroker erstellt und verwaltet und müssen daher nicht in der Bridge registriert werden.


## Configuration

Zunächst müssen die Verbindungsdaten zum MQTT-Server eingetragen werden.

Für den Status-Topic wird der Topic der MQTT-Nachricht hinterlegt, unter welcher die empfangenen RF-Codes der Bridge übermittelt werden.

Die Nachricht sollte mindestens folgenden Payload besitzen:

{"RfReceived":{"Data":"XXXXXXX"}}



Für den Delay-Konfigurationspunkt der RF Settings kann das Delay zwischen MQTT-Commands verändert werden.

Dieses ist notwendig, damit sich Schaltbefehlt bei Zeitgleich veränderten Objekten nicht überlagern, oder so schnell an die Bridge gesendet werden, dass diese Befehle verschluckt.



## Devices

Über den Tab Devices können Geräte hinzugefügt werden um diese als Objekte schalten zu können.

Dazu ist ein Name des Gerätes und seine Ein- bzw. Ausschaltcodes zu hinterlegen.

Speziell für Bewegungsmelder, oder Taster, die i.d.R. nur über einen "Einschalt-" Code verfügen, kann in der Spalte "Timer in sec" eine Zeitspanne in Sekunden angegeben werden, ab wann sich das Objekt wieder auf "false" schalten soll.

Sollte das Gerät während der Timer-Zeit erneut Signale senden, beginnt der Timer von vorn.



Über das Objekt "Last incoming code" kann jederzeit das aktuell empfangene Signal ermittelt werden.





## Changelog

### 0.0.1
* (Author) initial release

## License
MIT License

Copyright (c) 2020 Christian Tügel <info@ctcomputertechnik.de>

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